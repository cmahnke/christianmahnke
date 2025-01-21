import os
import sys
from pathlib import Path
import logging

import yaml
import cv2
import numpy as np
from segment_anything import SamAutomaticMaskGenerator, sam_model_registry

from lib.util import rgb2rgba
from lib.image_processing import clahe_contrast, histogram_median, adjust_histogram

debug = True
image_list = "./images/images.yaml"
model_path = "./models/sam_vit_h_4b8939.pth"
debug_path = "./debug"
debug_prefix = ""

# Defaults
option_segment_colors = "random"
option_align_method = "sift"
option_enhance_contrast = True
option_adjust_histogram = False
option_use_shape_detection = True

logger = logging.getLogger(__name__)
script_dir = os.path.dirname(os.path.realpath(__file__))
model_location = os.path.join(script_dir, model_path)
image_list_location = os.path.join(script_dir, image_list)
model = None

counter = 0

class FeatureExtraction:
    def __init__(self, image, method="sift", max_features=500):
        if method == "sift":
            detector = cv2.SIFT_create(nfeatures=max_features)
        elif method == "akaze":
            detector = cv2.AKAZE_create()
        else:
            detector = cv2.ORB_create()
        self.img = image
        img_gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        if(len(self.img.shape) < 3):
            self.gray_img = image
        else:
            logger.debug(f"FeatureExtraction: Converting image to gray scale")
            self.gray_img = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        self.kps, self.des = detector.detectAndCompute(self.gray_img, None)
        self.img_kps = cv2.drawKeypoints(self.img, self.kps, 0, flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        self.matched_pts = []

class FeatureMatcher:
    def __init__(self, features1, features2, method="sift"):
        if method == "sift":
            FLANN_INDEX_KDTREE = 1
            index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
            search_params = dict(checks=50)
            flann = cv2.FlannBasedMatcher(index_params, search_params)
            matches = flann.knnMatch(features1.des, features2.des, k=2)
            matches = sorted(matches, key=lambda x: x[0].distance) 
        else:  # For AKAZE, use brute-force matcher
            matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = matcher.match(features1.des, features2.des)
            matches = sorted(matches, key=lambda x: x.distance)
        self.matches = matches
        self.method = method
        self.features1 = features1
        self.features2 = features2


    def scale_matches(self, threshold_scale_ratio=0.5):
        good_matches = []
        for m in self.matches:
            pt1 = self.features1.kps[m.queryIdx].pt
            pt2 = self.features2.kps[m.trainIdx].pt

            s1 = self.features1.kps[m.queryIdx].size
            s2 = self.features2.kps[m.trainIdx].size
            if s1 == 0: s1 = 1
            if s2 == 0: s2 = 1
            scale_ratio = max(s1, s2) / min(s1, s2)

            if scale_ratio > threshold_scale_ratio:
                good_matches.append(m)

        if len(good_matches) > 4:
            src_pts = np.float32([self.features1.kps[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([self.features2.kps[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

            M, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
            matches_mask = mask.ravel().tolist()
            good_matches = [m for i, m in enumerate(good_matches) if matches_mask[i]]

            if M is not None:
                scale_x = np.sqrt(M[0, 0]**2 + M[1, 0]**2)
                scale_y = np.sqrt(M[0, 1]**2 + M[1, 1]**2)
                scale_diff_ratio = abs(scale_x - scale_y) / max(scale_x, scale_y)

                rotation = np.arctan2(M[1, 0], M[0, 0]) * 180 / np.pi
                if scale_diff_ratio > 0.3 or abs(rotation) > 10:
                    good_matches = []
        return good_matches
    
    def filter_matches(self, good_match_percent=2):
        if self.method == "sift":
            good_matches = []
            for m, n in self.matches:
                if m.distance < 0.7 * n.distance:
                    good_matches.append(m)
        else:
            good_matches = self.matches

        # Keep only the top matches
        num_good_matches = int(len(good_matches) * good_match_percent)
        good_matches = good_matches[:num_good_matches]

        return good_matches



def debug_image(cv_img, desc, name):
    if debug:
        debug_out = f"{name}.png"
        if debug_prefix != "":
            debug_out = f"{debug_prefix}-{name}.png"
        debug_out = os.path.join(debug_path, debug_out)
        logger.debug(f"Writing {desc} to {debug_out}")
        cv2.imwrite(debug_out, cv_img)


def align_images(image, reference, method="sift", max_features=500):
    """
    image - image to be alingned
    reference - master image, the one to image will be aligned onto
    """

    image_features = FeatureExtraction(image, method=method)
    reference_features = FeatureExtraction(reference, method=method)

    if debug:
        for img_type in ['image', 'reference']:
            debug_image(locals()[f"{img_type}_features"].img_kps, f"keypoints for {img_type} with method {method}", f"keypoints-{img_type}-{method}")

    matcher = FeatureMatcher(image_features, reference_features, method=method)
    matches = matcher.matches

    good_matches = matcher.filter_matches()
    # TODO: This won't work yet
    if method != "sift":
        good_matches = matcher.scale_matches()

    if debug:
        logger.info(f"Keeping {len(good_matches)} matches")
        vis = draw_matches(image_features, reference_features, good_matches)
        debug_image(vis, f"matches with method {method}", "match-vis.jpg")

    # Calculate matrix
    ptsA = np.zeros((len(good_matches), 2), dtype=np.float32)
    ptsB = np.zeros((len(good_matches), 2), dtype=np.float32)

    for (i, m) in enumerate(good_matches):
        ptsA[i] = image_features.kps[m.queryIdx].pt
        ptsB[i] = reference_features.kps[m.trainIdx].pt

    if len(good_matches) < 4:
        raise ValueError(f"Not enough matches {len(good_matches)}")

    (H, status) = cv2.findHomography(ptsA, ptsB, cv2.RANSAC)
    return H

def warp_image(image, homography, w , h):
    return cv2.warpPerspective(image, homography, (w, h))

def draw_matches(features1, features2, matches):
    draw_params = dict(matchColor = (0,255,0),
                   singlePointColor = (255,0,0),
                   flags = cv2.DrawMatchesFlags_DEFAULT)
    return cv2.drawMatches(features1.img, features1.kps, features2.img, features2.kps, matches, None, flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

def init_model(path, type="vit_h", version=1):
    if version == 1:
        sam = sam_model_registry[type](checkpoint=path)
        mask_generator = SamAutomaticMaskGenerator(sam)
        return mask_generator
    elif version == 2:
        import torch
        from sam2.sam2_image_predictor import SAM2ImagePredictor
        raise ValueError("Currently not implemented")

        predictor = SAM2ImagePredictor.from_pretrained("facebook/sam2-hiera-large")

        #with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        #    predictor.set_image(<your_image>)
        #    masks, _, _ = predictor.predict(<input_prompts>)

def posterize(cv_image, num_colors):  
    Z = cv_image.reshape((-1,3))
    Z = np.float32(Z)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    ret, label, center = cv2.kmeans(Z, num_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    center = np.uint8(center)
    res = center[label.flatten()]
    posterized_image = res.reshape((cv_image.shape))

    unique, counts = np.unique(posterized_image.reshape(-1, 3), axis=0, return_counts=True)

    color_counts = [(color, count) for color, count in zip(unique, counts)]
    color_counts.sort(key=lambda x: x[1], reverse=True) 
    sorted_colors = [color for color, _ in color_counts]

    return posterized_image, sorted_colors

# Strange that this isn't buildin into opencv
# See https://stackoverflow.com/a/73098617
def blend(img1, img2):
    img1 = rgb2rgba(img1)
    img2 = rgb2rgba(img2)
    m1 = img1[:,:,3]
    m2 = img2[:,:,3]

    # invert the alpha channel and obtain 3-channel mask of float data type
    m1i = cv2.bitwise_not(m1)
    alpha1i = cv2.cvtColor(m1i, cv2.COLOR_GRAY2BGRA)/255.0

    m2i = cv2.bitwise_not(m2)
    alpha2i = cv2.cvtColor(m2i, cv2.COLOR_GRAY2BGRA)/255.0

    # Perform blending and limit pixel values to 0-255 (convert to 8-bit)
    b1i = cv2.convertScaleAbs(img2*(1-alpha2i) + img1*alpha2i)
    # Finding common ground between both the inverted alpha channels
    mul = cv2.multiply(alpha1i,alpha2i)

    # converting to 8-bit
    mulint = cv2.normalize(mul, dst=None, alpha=0, beta=255,norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)

    # again create 3-channel mask of float data type
    alpha = cv2.cvtColor(mulint[:,:,2], cv2.COLOR_GRAY2BGRA)/255.0

    # perform blending using previous output and multiplied result
    final = cv2.convertScaleAbs(b1i*(1-alpha) + mulint*alpha)
    return final

def blend2(img1, img2, x_offset=0, y_offset=0):
    img1 = rgb2rgba(img1)
    img2 = rgb2rgba(img2)

    foreground_alpha = img2[:, :, 3] / 255.0 
    background_alpha = img1[:, :, 3] / 255.0

    h, w = img2.shape[:2]
    x1, x2 = x_offset, x_offset + w
    y1, y2 = y_offset, y_offset + h
    blended_rgb = (img2[:, :, :3] * foreground_alpha[:, :, np.newaxis] 
                + img1[y1:y2, x1:x2, :3] * (1 - foreground_alpha[:, :, np.newaxis]))

    blended_alpha = np.maximum(foreground_alpha, img1[y1:y2, x1:x2, 3] / 255.0)

    result_img = np.zeros_like(img1)
    result_img[y1:y2, x1:x2, :3] = blended_rgb
    result_img[y1:y2, x1:x2, 3] = blended_alpha * 255

    return result_img

def draw_segment_edges(masks):
    if len(masks) == 0:
        return
    sorted_masks = sorted(masks, key=(lambda x: x['area']), reverse=True)
    w, h = sorted_masks[0]["segmentation"].shape
    image = np.zeros((w, h), dtype=np.uint8)
    for mask in sorted_masks:
        m = mask['segmentation']
        grey_mask = np.zeros((w, h), dtype=np.uint8)
        grey_mask[m] = 255
        edges = cv2.Canny(grey_mask, 0, 255)
        image = image | edges
    
    return image

def create_mask(mask, color=(0,255,0)):
    colored_mask = np.zeros(mask.shape + (3,), dtype=np.uint8)
    colored_mask[mask] = color
    alpha = np.zeros(mask.shape + (1,), dtype=np.uint8)
    alpha[mask] = 255
    return colored_mask, alpha

def draw_segments(masks, image=None, reference=None, alpha=0.45, background=(255,255,255), colors=None, alpha_area_weight=.7):
    if len(masks) == 0:
        return
    sorted_masks = sorted(masks, key=(lambda x: x['area']), reverse=True)
    w, h = sorted_masks[0]["segmentation"].shape
    if image is None:
        image = np.zeros((w, h, 3), np.uint8) + list(background)

    if colors is None:
        segment_colors = []
        for i in range(len(masks)):
            segment_colors.append(np.random.randint(0, 256, size=(3), dtype=np.uint8))
    else:
        segment_colors = colors

    for i, mask in enumerate(sorted_masks):
        if alpha is None:
            opacity = (1 - mask["area"] / (w * h)) * alpha_area_weight
        else:
            opacity = alpha
        
        if reference is not None and colors is None:
            color = get_region_color(reference, mask)
            logger.debug(f"Extracted color {color}")
        else:
            color = segment_colors[i]

        m = mask['segmentation']
        color_mask, alpha_channel = create_mask(m, color)
        alpha_channel = opacity * alpha_channel
        rgba_overlay = np.concatenate((color_mask, alpha_channel), axis=-1)
        debug_image(rgba_overlay, f"segment {i} with opacity of {opacity} (weighted by {alpha_area_weight}), color {color}", f"segment-{i}")
        
        image = blend2(image, rgba_overlay)

    return image

def prepare_reference(cv_visible, shapes, out_file="posterized_image.jpg"):
    cv_poster, colors = posterize(cv_visible, shapes)
    debug_image(cv_poster, f"posterized image", "posterized_image")

    return colors

def get_region_color(reference, mask):
    global counter
    m = mask['segmentation']
    scaled_reference = cv2.resize(reference, m.shape[::-1], interpolation=cv2.INTER_LANCZOS4)
    if debug:
        alpha = np.zeros(m.shape + (1,), dtype=np.uint8)
        alpha[m] = 255
        write_reference = np.copy(scaled_reference)
        write_reference[np.invert(m)] = [0, 0, 0]
        debug_region = np.dstack((write_reference, alpha))
        debug_image(debug_region, f"extracted region from reference", f"reference-region-{counter}")

    m = m.astype(np.uint8)
    m *= 255
    average_color = cv2.mean(scaled_reference, m)[:3]
    average_color = np.array(average_color, dtype=np.uint8)

    counter += 1

    return average_color

def prepare_xray(xray, reference, options):
    image = xray
    if options["enhance_contrast"]:
        image = clahe_contrast(rgb_img=image)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        debug_image(image, "enhanced contrast", "xray-enhaced-contrast")
    else:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    if options["adjust_histogram"]:
        # Removes lower and upper extremes from histogram 
        window=(256/100*20, 256-(256/100*10))
        median_color = histogram_median(image, window)
        image = adjust_histogram(image, window, base=median_color)
        debug_image(image, "cut histogram", "xray-histogram-cut")

    if options["use_shape_detection"]:
        logger.info("Generating shapes")
        masks = model.generate(image)
        num_shapes = len(masks)
               
        if options["segment_colors"] == "image":
            colors = prepare_reference(visible, num_shapes)
            logger.debug(f"Using extracted colors from visible image: {colors}")

            image = draw_segments(masks, image=image, colors=colors, alpha=None)
        elif options["segment_colors"] == "random":
            logger.debug(f"Using extractig colors from visible segments image")
            image = draw_segments(masks, image=image, reference=reference, colors=None, alpha=None)
        else:
            logger.debug(f"Generating random colors")
            image = draw_segments(masks, image=image, colors=None, alpha=None)

        if debug:
            edges = draw_segment_edges(masks)
            debug_image(edges, "detected edges", "xray-edges")

    return image

def create_psd(image, reference, out_file):
    from psd_tools import PSDImage
    from psd_tools.api.layers import PixelLayer
    from psd_tools.constants import Compression, BlendMode
    from PIL import Image

    w, h, _ = reference.shape    
    psd = PSDImage.new(mode="RGB", size=(h, w))

    reference_pil = Image.fromarray(cv2.cvtColor(reference, cv2.COLOR_BGR2RGB))
    image_pil = Image.fromarray(image)
    reference_layer = PixelLayer.frompil(reference_pil, psd, f"Reference image layer", 0, 0, Compression.RLE)
    image_layer = PixelLayer.frompil(image_pil, psd, f"Aligned image layer", 0, 0, Compression.RLE)
    reference_layer.opacity = 255
    image_layer.opacity = 255/2
    # TODO maybe already use subtract blend here?
    #image_layer.blend_mode = BlendMode.NORMAL
    psd.append(reference_layer)
    psd.append(image_layer)
    psd.save(out_file)
    logger.info(f"Written PSD file to {out_file}")

def get_options(options=None):
    if options is None:
        options = {}
    for var in globals().keys():
        if var.startswith("option_"):
            key = var[len("option_"):]
            if not key in options:
                options[key] = globals()[var]
    return options

def main():
    global model, debug_prefix
    if debug:
        np.set_printoptions(threshold=sys.maxsize)
        log_level = logging.DEBUG
        Path(debug_path).mkdir(parents=True, exist_ok=True)
    else:
        log_level = logging.INFO
    logging.basicConfig(level=log_level)

    options = get_options()
    logger.info(f"Default options {options}")

    if options["use_shape_detection"]:
        model = init_model(model_path)
    with open(image_list_location) as f:
        input_images = yaml.safe_load(f)

    image_base_path = Path(os.path.join(script_dir, image_list)).parent
    for image_set in input_images:
        counter = 0
        if "name" in image_set:
            debug_prefix = image_set["name"]
        reference_file = image_base_path.joinpath(image_set["visible"]).resolve()
        image_file = image_base_path.joinpath(image_set["xray"]).resolve()
        if "options" in image_set:
            options = image_set["options"]
        else:
            options = {
                "segment_colors": segment_colors,
                "align_method": align_method,
                "enhance_contrast": enhance_contrast,
                "adjust_histogram": adjust_histogram,
                "use_shape_detection": use_shape_detection
            }
        logger.info(f"Input files: {str(reference_file)}, {str(image_file)}, {options}")
        reference = cv2.imread(reference_file, cv2.COLOR_RGB2BGR)
        image = cv2.imread(image_file, cv2.COLOR_RGB2BGR)
        preprocessed_image = prepare_xray(image, reference, options)
        debug_image(preprocessed_image, " preprocessed X-Ray image (with segments)", "xray-with_segments")
        try:
            result = align_images(preprocessed_image, reference, method=options["align_method"])
            aligned = warp_image(image, result, reference.shape[1], reference.shape[0])
            debug_image(aligned, "aligned image", "result")
            create_psd(aligned, reference, f"{image_set["name"]}-result.psd")
        except ValueError as v:
            logger.error(f"Aligning {str(image_file)} to {str(reference_file)} failed, not enough matches, {repr(v)}")

        except Exception as e:
            logger.error(f"Aligning {str(image_file)} to {str(reference_file)} failed, {type(e)}: {repr(e)}")
        debug_prefix = ""

if __name__ == "__main__":
    main()