import sys, argparse, pathlib, glob, time
from datetime import timedelta
import matplotlib.pyplot as plt
import numpy as np
import cv2
import imageio

# See https://matplotlib.org/stable/users/explain/colors/colormaps.html
# Also try 'rainbow' and 'jet', 'cool'
map = 'cool'
linear = True
video_debug_file = 'video_out.tif'
debug_file = 'debug.png'
debug = False
blur = True
# 1.3 is working, hight leads to overflows
gamma = 1.3

# See https://stackoverflow.com/a/71741069
def adjust_gamma(image, gamma=1.0):
    inv_gamma = 1.0 / gamma
    table = ((np.arange(0, np.iinfo(image.dtype).max) / np.iinfo(image.dtype).max) ** inv_gamma) * np.iinfo(image.dtype).max
    table = table.astype(image.dtype)
    return table[image]

def create_mask(image):
    # Mask contains the static parts
    mask = ((image == np.amax(image, keepdims=True, axis=0)) + 0).astype(np.uint8)
    if debug:
        debug(mask, title="mask", full_dump=False)
    return mask

#def log(image):
#    #Log transform
#    c = np.iinfo(image.dtype).max / (np.log(1 + np.max(image)))
#    image_log = c * np.log(1 + image)
#    return image_log

# TODO: Add border
def smoothen(image):
    border = 50
    work_image = np.copy(image)
    #work_image = cv2.copyMakeBorder(work_image, border, border, border, border, cv2.BORDER_REFLECT)
    if work_image.dtype != np.dtype('float32'):
        work_image = work_image.astype(np.float32)
    (diameter, sigmaColor, sigmaSpace) = (11, 21, 7)
    blurred = cv2.bilateralFilter(work_image, diameter, sigmaColor, sigmaSpace)
    #return blurred[border:border, blurred.shape[0]-50:blurred.shape[1]-50]
    return blurred

def heatmap(image):
    mask = create_mask(image)
    dynamic_regions = image.copy()
    #np.putmask(dynamic_regions, mask, 0)
    np.putmask(dynamic_regions, mask, np.iinfo(dynamic_regions.dtype).max // 2)

    # Gamma correction: https://pyimagesearch.com/2015/10/05/opencv-gamma-correction/
    #TODO: This can lead to cliping when converting to uint8
    gamma_corrected = adjust_gamma(dynamic_regions, gamma=gamma)

    if blur:
        blurred = smoothen(gamma_corrected)
    else:
        blurred = gamma_corrected

    if debug:
        print(f"Image format {image.dtype} dynamic format {dynamic_regions.dtype}")
        debug(dynamic_regions, title="dynamic regions", full_dump=False)
        debug(gamma_corrected, title=f"gamma {gamma}")
        debug(blurred, title=f"blurred")
        #debug(cv2.convertScaleAbs(gamma_corrected), title=f"abs gamma {gamma}")
        #debug(cv2.normalize(gamma_corrected, None, 255, 0, cv2.NORM_L2, cv2.CV_8U), title=f"norm gamma {gamma}")


    #plt.hist(gamma_corrected)
    #plt.show()

    #debug(equalize(dynamic_regions)[0], title="test")


    #image = normalize(gamma_corrected)
    #image = normalize(gamma_corrected).astype(np.uint8)
    image = blurred.astype(np.uint8)
    #image = cv2.normalize(gamma_corrected, None, 0, np.iinfo(np.uint8).max, cv2.NORM_MINMAX)
    #image = image.astype(np.uint8)
    #image = dynamic_regions

    colormap = plt.get_cmap(map)
    #heatmap = (colormap(image) * 2**16).astype(np.uint16)
    heatmap = (colormap(image) * np.iinfo(image.dtype).max).astype(image.dtype)

    #print(f"types {heatmap.shape} {mask.shape}")
    mask = np.dstack((mask, mask, mask, mask))
    np.putmask(heatmap, mask, np.iinfo(heatmap.dtype).max)

    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR)
    return heatmap

def debug(img, title="Normalized", full_dump=False):
    if img.dtype == np.dtype('bool'):
        print(f"converting bool -> uint8 ({img.max()})")
        img = img.astype(np.uint8)
    elif img.dtype == np.dtype('uint32') or img.dtype == np.dtype('uint64'):
        print(f"converting uint32 or uint64 -> uint8")
        img = img.astype(np.uint8)
    elif img.dtype == np.dtype('int32'):
        print(f"converting int32 -> uint8 ({img.max()})")
        img = img.astype(np.uint8)
    elif img.dtype == np.dtype('uint16'):
        print(f"converting uint16 -> uint8 ({img.max()})")
        img = img.astype(np.uint8)
    elif img.dtype != np.dtype('uint8'):
        print(f"Unhandled type {img.dtype}")
    img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
    if full_dump:
        np.set_printoptions(threshold=sys.maxsize)
    print(f"{title} (type: {img.dtype}) array:")
    print(img)
    cv2.imshow(title, img)
    cv2.imwrite(debug_file, img)
    cv2.waitKey()

def normalize(image):
    if linear:
        image = cv2.normalize(image, None, 0, np.iinfo(image.dtype).max - 1, cv2.NORM_MINMAX)
    else:
        image = adjust_gamma(image, gamma=gamma)
    return image.astype(np.uint16)

def toUInt16(image):
    if image.dtype == np.dtype('uint16'):
        return image
    if np.iinfo(np.uint16).max < image.max():
        #raise OverflowError("Possible overflow")
        normalized = cv2.normalize(image, None, 0, 2**16-1, cv2.NORM_MINMAX)
        return normalized.astype(np.uint16)
    return image.astype(np.uint16)

def safeUint16(image, file):
    if image.dtype != np.dtype('uint16'):
        raise ValueError("Image has wrong data type")
    if not file.endswith('.png'):
        raise ValueError("Only PNG is supported")
    imageio.imwrite(file, image)

def process_video(video):
    cap = cv2.VideoCapture(video)
    num_frames = 0
    out_frame = None
    previuos_frame = None
    drop_counter = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if frame is None:
            break
        if ret:
            # Set dimensions from first frame
            if out_frame is None:
                out_frame = np.zeros(frame.shape, dtype=np.uint64)[:,:,0]

            # Create bool array
            frame_sw = cv2.threshold(frame, 127, 255, cv2.THRESH_BINARY)[1].astype(bool)[:,:,0]

            # Remove duplicatzed frames
            if previuos_frame is not None and np.array_equal(previuos_frame, frame_sw):
                if debug:
                    print(".", end="")
                drop_counter += 1
                continue
            else:
                previuos_frame = frame_sw

            #Do processing
            out_frame = np.add(frame_sw, out_frame)
            # Only count processed frames
            num_frames += 1
            if num_frames == 1 or num_frames % 1000 == 0:
                print(f"Processed frame {num_frames}")
        else:
            break
    cap.release()
    if num_frames != out_frame.max():
        raise OverflowError("Possible overflow")
    # Return result here, number of frames should be out_frame.max()
    print('', flush=True)
    print(f"Averaged {num_frames} frames, droped {drop_counter} frames")
    return out_frame

def process_videos(videos):
    out_frame = None
    for video in videos:
        print('', flush=True)
        print(f"Processing {video}")
        frame = process_video(video)
        if out_frame is None:
            out_frame = np.zeros(frame.shape, dtype=np.uint64)
        out_frame = np.add(frame, out_frame)
    print(f"Processed approx {out_frame.max()} frames")
    return out_frame

def main(args):
    parser = argparse.ArgumentParser(description='Create heatmap')
    group = parser.add_argument_group('Input', 'Input files')
    input_group = group.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--image', '-i', type=pathlib.Path, help='Image to process', required=False)
    input_group.add_argument('--video', '-v', type=pathlib.Path, help='Video to process', required=False)
    input_group.add_argument('--video-list', '-l', help='Videos to process', required=False)
    parser.add_argument('--output', '-o', type=pathlib.Path, help='Result file, otherwise result will be displayed', required=False)
    parser.add_argument('--debug', '-d', action='store_true', help='Save processed video image', default=True, required=False)

    args = parser.parse_args()

    if args.debug:
        debug = True

    if args.image:
        if args.image.exists():
            input = str(args.image)
        else:
            print(f"File {str(args.image)} doesn't exist!")
            sys.exit(1)

    if args.video:
        if args.video.exists():
            video = str(args.video)
        else:
            print(f"File {str(args.video)} doesn't exist!")
            sys.exit(2)
        image = process_video(video)

    if args.video_list:
        files = glob.glob(args.video_list)
        files.sort()
        if files is None or len(files) < 1:
            print(f"File {args.video_list} dons't match any files!")
            sys.exit(3)
        print(f"Processing {len(files)} videos")
        image = process_videos(files)

    print("Input initialized")
    start = time.time()

    if 'image' in vars() or 'image' in globals():
        if debug:
            cv2.imwrite(video_debug_file, image)
            print(f"Saved {video_debug_file}")
    else:
        if input.endswith('.tif') or input.endswith('.tiff'):
            image = cv2.imread(input, cv2.IMREAD_UNCHANGED)
        else:
            image = cv2.imread(input, cv2.IMREAD_GRAYSCALE)

    print(f"Loaded image as {image.dtype}, approx {image.max()} frames")
    image = toUInt16(image)
    out = heatmap(image)
    end = time.time()
    if not args.output:
        #cv2.imshow('image', image)
        cv2.imshow('heatmap', out)
        cv2.waitKey()
        #plt.imshow(out)
    else:
        cv2.imwrite(str(args.output), out)
    print(f"Processing took {timedelta(seconds=end-start)}")

if __name__ == "__main__":
    main(sys.argv[1:])
