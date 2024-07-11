import sys, argparse, pathlib
import matplotlib.pyplot as plt
import numpy as np
import cv2

# See https://matplotlib.org/stable/users/explain/colors/colormaps.html
# Also try 'rainbow' and 'jet', 'cool'
map = 'rainbow'
linear = True
video_debug_file = 'video_out.tif'

def heatmap(image):

    #fig, ax = plt.subplots()
    #im = ax.imshow(image, cmap=map)
    #print(image.max())
    #plt.show()
    #return
    # See https://stackoverflow.com/questions/66699743/apply-a-colormap-only-to-unmasked-region-excluding-the-black-mask
    #mask = cv2.inRange(image, np.array([image.max() - 1]), np.array([image.max()]))
    #print(image.dtype)
    masked = (image < image.max()) * image
    mask = cv2.bitwise_not(masked.astype(np.uint8))
    img_masked = cv2.bitwise_and(image, image, mask=mask)
    colormap = plt.get_cmap(map)
    #heatmap = (colormap(image) * 2**16).astype(np.uint16)[:,:,:3]
    heatmap = (colormap(image) * 2**16).astype(np.uint16)
    #colormap = cv2.applyColorMap(image, cv2.COLORMAP_COOL)
    #heatmap_masked = cv2.bitwise_and(colormap, colormap, mask=(255-mask))
    mask = (image < image.max()) * image
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_RGB2BGR)
    return heatmap

def debug(img):
    if img.dtype == np.dtype('bool'):
        img = img.astype(np.uint8)
    elif img.dtype == np.dtype('uint32') or img.dtype == np.dtype('uint64'):
        img = img.astype(np.uint8)
    img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)
    print(img)
    cv2.imshow('Normalized', img)
    cv2.waitKey()

def normalize(image):
    # TODO: Create a mask max value
    #masked = (image < image.max()) * image
    if linear:
        image = cv2.normalize(image, None, 0, 2**16-1, cv2.NORM_MINMAX)
    else:
        c = 2**16-1 / np.log(1 + np.max(image))
        image = (c * (np.log(image + 1))).astype(np.uint16)
    return image.astype(np.uint16)

def process_video(video):
    cap = cv2.VideoCapture(video)
    num_frames = 0
    out_frame = None
    previuos_frame = None
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
                print(".", end="")
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
    return out_frame

def main(args):
    parser = argparse.ArgumentParser(description='Create heatmap')
    group = parser.add_argument_group('Input', 'Input files')
    input_group = group.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--image', '-i', type=pathlib.Path, help='Image to process', required=False)
    input_group.add_argument('--video', '-v', type=pathlib.Path, help='Video to process', required=False)
    parser.add_argument('--output', '-o', type=pathlib.Path, help='Result file, otherwise result will be displayed', required=False)
    parser.add_argument('--debug', '-d', action='store_true', help='Save processed video image', default=True, required=False)

    args = parser.parse_args()

    if args.image:
        if args.image.exists():
            input = str(args.image)
            preprocess = False
        else:
            print(f"File {str(args.image)} doesn't exist!")
            sys.exit(1)

    if args.video:
        if args.video.exists():
            video = str(args.video)
            preprocess = True
        else:
            print(f"File {str(args.video)} doesn't exist!")
            sys.exit(2)

    print("Input initialized")

    if preprocess:
        image = process_video(video)
        np.set_printoptions(threshold=sys.maxsize)
        if args.debug:
            cv2.imwrite(video_debug_file, image)
            print(f"Saved {video_debug_file}")
    else:
        if input.endswith('.tif') or input.endswith('.tiff'):
            image = cv2.imread(input, cv2.IMREAD_UNCHANGED)
        else:
            image = cv2.imread(input, cv2.IMREAD_GRAYSCALE)

    image = normalize(image)
    out = heatmap(image)
    if not args.output:
        #cv2.imshow('image', image)
        cv2.imshow('heatmap', out)
        cv2.waitKey()
        #plt.imshow(out)
    else:
        cv2.imwrite(str(args.output), out)

if __name__ == "__main__":
    main(sys.argv[1:])
