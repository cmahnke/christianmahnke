import os
import sys
from pathlib import Path
import logging

import yaml
import cv2
import numpy as np

from lib.line import Line
from lib.util import rgb2rgba
from lib.image_processing import clahe_contrast, histogram_median, adjust_histogram, safe_rgb

debug = True
image_list = "./images/images.yaml"

model_version = 2
model_settings = {1: {"path": "./models/sam_vit_h_4b8939.pth", "config": "vit_h"}, 2: {"path": "./models/sam2.1_hiera_large.pt", "config":"configs/sam2.1/sam2.1_hiera_l.yaml"} }
#model_settings[2] = {"path": "./models/sam2.1_hiera_small.pt", "config": "configs/sam2.1/sam2.1_hiera_s.yaml"}
debug_path = "./debug"
debug_prefix = ""
os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
os.environ["PYTORCH_MPS_HIGH_WATERMARK_RATIO"] = "0.0"

# Defaults
option_segment_colors = "random"
option_align_method = "sift"
option_enhance_contrast = True
option_adjust_histogram = False
option_use_shape_detection = True

logger = logging.getLogger(__name__)
script_dir = os.path.dirname(os.path.realpath(__file__))
#model_location = os.path.join(script_dir, model_path)
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

class MaskGenerator:
    def __init__(self, path, cfg_str="vit_h", version=1, ):
        self.version = version
        model_location = os.path.join(script_dir, path)
        if self.version == 1:
            from segment_anything import SamAutomaticMaskGenerator, sam_model_registry
            self.sam = sam_model_registry[cfg_str](checkpoint=model_location)
            self.mask_generator = SamAutomaticMaskGenerator(self.sam)
        elif self.version == 2:
            import torch
            self.device = torch.device("cpu")
            if torch.cuda.is_available():
                self.device = torch.device("cuda")
            elif torch.backends.mps.is_available():
                import cpuinfo
                cpu_name = cpuinfo.get_cpu_info()['brand_raw']
                if not "M1" in cpu_name:
                    self.device = torch.device("mps")
                else:
                    logger.info("Detected M1, fallig back to CPU as torch device")
            logger.debug(f"Using {self.device} for PyTorch")

            #self.predictor = SAM2ImagePredictor.from_pretrained("facebook/sam2-hiera-large")
            from sam2.build_sam import build_sam2
            from sam2.automatic_mask_generator import SAM2AutomaticMaskGenerator

            self.sam = build_sam2(cfg_str, model_location, device=self.device, apply_postprocessing=False)

            self.mask_generator = SAM2AutomaticMaskGenerator(self.sam)

        else:
            raise ValueError(f"Unknown version: {self.version}")

    def generate(self, image):
        if not isinstance(image, (np.ndarray, np.generic)):
            raise ValueError("Works only with NumPy array")
        if self.version == 1 or self.version == 2:
            return self.mask_generator.generate(image)
        else:
            raise ValueError(f"Unknown version: {self.version}")

def debug_image(cv_img, desc, name):
    if debug:
        debug_out = f"{name}.png"
        if debug_prefix != "":
            debug_out = f"{debug_prefix}-{name.strip()}.png"
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

def draw_segments(masks, image=None, reference=None, alpha=0.45, background=(255,255,255), colors=None, alpha_area_weight=.7, debug_prefix="segment-"):
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
        debug_image(rgba_overlay, f"segment {i} with opacity of {opacity} (weighted by {alpha_area_weight}), color {color}", f"{debug_prefix}{i}")
        
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

def segment_frame(image, promt="border", model="FastSAM-x.pt"):
    if "/" in str(model):
        from ultralytics.engine.model import Model

        class FastSAM(Model):
            def __init__(self, model="FastSAM-x.pt"):
                super().__init__(model=model, task="segment")

        model_file = "./model/sam_l.pt"
        model_path = os.path.join(script_dir, model_file)
        predictor = FastSAM(model_path)
    else:
        from ultralytics import FastSAM
        predictor = FastSAM(model)  # or FastSAM-x.pt

    
    results = predictor(safe_rgb(image), texts=promt)
    logger.debug(f"Found {len(results)} results for prompt '{promt}'")
    for result in results:
        #names = result.names
        #boxes = result.boxes
        #masks = result.masks 
        for m in result.masks.data.numpy():
        #    print(m.data)
        #    color_mask, alpha_channel = create_mask(m.data)
        #    alpha_channel = .5 * alpha_channel
        #    rgba_overlay = np.concatenate((color_mask, alpha_channel), axis=-1)
        #    debug_image(rgba_overlay, f"frame", f"frame-segment")
            print(type(m))
            debug_image(m * 255, f"frame", f"frame-segment")

            #print(m)
    #image = draw_segments(masks, image=image, colors=None, alpha=None, debug_prefix="frame-recognition")

def check_mask_for_frame(image, mask, min_size=.7, average_frame_tres_color=(10, 10, 10)):
    area = np.sum(mask)
    image_area = image.shape[0] * image.shape[1]
    #check if mask is larger then half of image
    if area > image_area * min_size:
        inverted_m = np.invert(mask)
        frame_color = get_region_color(image, inverted_m)
        if np.sum(frame_color) < np.sum(average_frame_tres_color):
            return True

    return False

def remove_frame(cv_image, thres=40):
    def remove_contour(contour, image):
        mask = np.zeros_like(image)
        cv2.drawContours(mask, [contour], -1, (255, 255, 255), thickness=-1)
        masked_img = cv2.bitwise_and(image, mask)
        if(len(mask.shape) > 2):
            mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
        if(len(masked_img.shape) < 3):
            masked_img = cv2.cvtColor(masked_img, cv2.COLOR_GRAY2BGR)
        masked_img = np.dstack((masked_img, mask))
        return masked_img

    if(len(cv_image.shape) < 3):
        gray = cv_image
    else:
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, thres, 255, cv2.THRESH_BINARY) #+ cv2.THRESH_OTSU
    debug_image(thresh, "theresholded image for contours", "countour-tresh")
    #contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)

    class HierachicalContours:
        def __init__(self, contours, hierarchy, contour_mode=cv2.RETR_TREE):
            self._contours = {}
            hierarchy = hierarchy[0]
            for c, h in zip(contours, hierarchy):
                if contour_mode == cv2.RETR_TREE:
                
                    self._contours[c] = h
                elif contour_mode == cv2.RETR_LIST:
                    if c[0] < 0:
                        i = (max(self._contours.keys())) + 1
                        self._contours[i] = h
                    else:
                        self._contours[c[0]] = h
                elif contour_mode == cv2.RETR_CCOMP:

                else:
                    raise ValueError(f"Unknown Contour Retrieval Mode: {contour_mode}")

        def sort(self):
            self._contours = sorted(self._contours, reverse=True, key=lambda x: cv2.contourArea(x[0]))

        def filter(self, max, filter_factor):
            print(list(self._contours))

            self._contours = list(filter(lambda x: cv2.contourArea(x[0]) > (max * filter_factor), self._contours))
            print(self._contours)

        def contours(self):
            #contours, _ = map(list, zip(*self._contours))
            #print(zip(*self._contours))
            #contours = [list(t) for t in zip(*self._contours)]
            #print(contours)
            #return list(zip(*self._contours))[0]
            #contours, _ = zip(*self._contours)
            #contours = list(contours)
            #print(contours)
            contours = self._contours.keys()
            return contours

        def hierarchy(self):
            #_, hierarchy = map(list, zip(*self._contours))
            hierarchy = self._contours.values()
            return hierarchy

        def len(self):
            return len(list(self._contours))

    hc = HierachicalContours(contours, hierarchy)
    logger.debug(f"Found {hc.len()} contours")

    if len(contours) > 0:
        contours = list(contours)
        print(hc.contours())
        filter_factor = .5
        contours = list(filter(lambda x: cv2.contourArea(x) > (cv_image.shape[0] * cv_image.shape[1]) * filter_factor, contours))
        hc.sort()
        hc.filter(cv_image.shape[0] * cv_image.shape[1], filter_factor)
        contours = hc.contours()
        logger.debug(f"Filtered contours by factor {filter_factor}, remaining {len(contours)}")

        contours.sort(reverse=True, key=cv2.contourArea) 
        if debug:
            for i, c in enumerate(contours):
                print(f"{cv2.contourArea(c)} -> {cv2.boundingRect(c)}")
                masked_img = remove_contour(c, cv_image)
                debug_image(masked_img, f"countour {i}", f"contour-{i}")

        largest_contour = max(contours, key=cv2.contourArea)
        masked_img = remove_contour(largest_contour, cv_image)
        debug_image(masked_img, "masked-xray", "masked-xray")
        return masked_img
    
    return cv_image

def blend_color(cv_image, color=(0,0,0)):
    w, h = cv_image.shape
    image = np.zeros((w, h, 3), np.uint8) + list(color)
    return blend2(image, cv_image)

def crop_reference(reference, image):
    def difference(x, y):
        return ((y - x) / x) * 100
    
    image_aspect_ratio = image.shape[1] / image.shape[0]
    reference_aspect_ratio = reference.shape[1] / reference.shape[0]
    change_percent = difference(image_aspect_ratio, reference_aspect_ratio)
    logger.debug(f"Reference image aspect ratio is {reference_aspect_ratio}, image aspect ratio is {image_aspect_ratio}, change in percent {change_percent}")

    tolerance = .3
    if change_percent > 5:
        minLineLength = reference.shape[1] * 0.9
        maxLineGap = reference.shape[1] * 0.05
        angle_filter = lambda x: (x > 90 - tolerance and x < 90 + tolerance) or (x > -90 - tolerance and x < -90 + tolerance)
        logger.debug(f"Reference image is {change_percent}% wider, setting min length to {minLineLength} mx gap {maxLineGap}")
    elif change_percent < -5:
        minLineLength = reference.shape[0] * 0.9
        maxLineGap = reference.shape[0] * 0.05
        angle_filter = lambda x: (x > 180 - tolerance and x < 180 + tolerance) or (x > -180 - tolerance and x < -180 + tolerance)
        logger.debug(f"Reference image is {change_percent}% higher, setting min length to {minLineLength} mx gap {maxLineGap}")
    else:
        return (reference, 0, 0)

    blur = cv2.bilateralFilter(reference,9,75,75)
    binary = cv2.Canny(blur, 50, 200, None, 3)
    debug_image(binary, "binarized image", "binary-visible")
    if debug:
        line_vis = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
   
    lines = cv2.HoughLinesP(binary, 1, np.pi / 180, 150, None, minLineLength, maxLineGap)
    
    if lines is not None:
        candidates = []
        for line in lines:
            candidates.append(Line(line[0]))
        candidates = list(filter(lambda x: angle_filter(x.angle_deg()), candidates)) 
        candidates.sort(reverse=True, key=lambda x: x.distance())

        points = []
        for l in candidates[:len(candidates)//4]:
            points.extend(list(l.tuple()))
            if debug:
                l.vis(line_vis)
        points = np.array(points)
        tl = [min(points[:,0]), min(points[:,1])]
        br = [max(points[:,0]), max(points[:,1])]
        logger.debug(f"Bounding box for extraction is {tl}, {br}")

        debug_image(line_vis, "line visualisation", "lines")    
        cropped = reference[tl[1]:br[1], tl[0]:br[0]]
        return (cropped, tl[0], tl[1])
    

def prepare_xray(xray, reference, options):
    image = xray

    withoutframe = remove_frame(image)
    #segment_frame(image)
    debug_image(withoutframe, "removed frame", "removed-frame")

    if options["adjust_histogram"]:
        # Removes lower and upper extremes from histogram 
        window=(256/100*20, 256-(256/100*10))
        median_color = histogram_median(image, window)
        image = adjust_histogram(image, window, base=median_color)
        debug_image(image, "cut histogram", "xray-histogram-cut")

    if options["enhance_contrast"]:
        image = clahe_contrast(rgb_img=image)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        debug_image(image, "enhanced contrast", "xray-enhaced-contrast")
    else:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

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
        #model = init_model(model_path)
        model_path = model_settings[model_version]["path"]
        model_cfg = model_settings[model_version]["config"]
        model = MaskGenerator(model_path, model_cfg, version=model_version)
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
            options = get_options()
            #options = {
            #    "segment_colors": segment_colors,
            #    "align_method": align_method,
            #    "enhance_contrast": enhance_contrast,
            #    "adjust_histogram": adjust_histogram,
            #    "use_shape_detection": use_shape_detection
            #}
        logger.info(f"Input files: {str(reference_file)}, {str(image_file)}, {options}")
        reference = cv2.imread(reference_file, cv2.COLOR_RGB2BGR)
        image = cv2.imread(image_file, cv2.COLOR_RGB2BGR)
        cropped = crop_reference(reference, image)[0]
        debug_image(cropped, "cropped reference image", "cropped")
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