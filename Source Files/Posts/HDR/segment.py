import os
import numpy as np
from PIL import Image
#import jxlpy
from jxlpy import JXLImagePlugin
import cv2

from ultralytics import YOLO

mode = "mask"
image_path = "images/page015.jxl"
out_file_name = 'out.jpg'
# Shape to be highlighted, this is dependend on the image
highlight_shape = 4

mask_background = 128

def bbox_size(x1, y1, x2, y2):
    if x1 > x2 or y1 > y2:
      raise ValueError
    width = x2 - x1
    height = y2 - y1
    area = width * height
    return area

def apply_mask(image, mask, color=(0,255,0), alpha=.3, resize=None):

    color = color[::-1]
    colored_mask = np.expand_dims(mask, 0).repeat(3, axis=0)
    colored_mask = np.moveaxis(colored_mask, 0, -1)
    masked = np.ma.MaskedArray(image, mask=colored_mask, fill_value=color)
    image_overlay = masked.filled()

    if resize is not None:
        image = cv2.resize(image.transpose(1, 2, 0), resize)
        image_overlay = cv2.resize(image_overlay.transpose(1, 2, 0), resize)

    image_combined = cv2.addWeighted(image, 1 - alpha, image_overlay, alpha, 0)

    return image_combined


script_dir = os.path.dirname(os.path.realpath(__file__))
# download from https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11x-seg.pt
model_path = "./models/yolo11x-seg.pt"
model_path = os.path.join(script_dir, model_path)
model = YOLO(model_path)


blocks = []
image = Image.open(image_path)
results = model(image, verbose=False)
np_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
w, h = image.size

# See https://github.com/ultralytics/ultralytics/issues/561
for result in results:
    names = result.names
    boxes = result.boxes
    masks = result.masks 
    #for i, box in enumerate(result.boxes):
    if masks is None:
        continue
    for seg, box in zip(masks.data.cpu().numpy(), boxes):
        t = names[int(box.cls)]
        seg = cv2.resize(seg, (w, h))
        coords = box.xyxy.numpy().flatten().astype(int)
        area = bbox_size(coords[0], coords[1], coords[2], coords[3])
        block = {"name":t, "bbox": [coords[0], coords[1], coords[2], coords[3]], "area":area, "mask":seg}
        blocks.append(block)


blocks = sorted(blocks, key=lambda b: b['area'])

if mode == "gainmap":
    annotated_image = apply_mask(np_image, blocks[highlight_shape]["mask"], color=(255,255,255), alpha=.5)
    cv2.imwrite(out_file_name, annotated_image)
elif mode == "mask":
    np_image = np.zeros([h,w,3],dtype=np.uint8)
    np_image.fill(mask_background)
    mask = apply_mask(np_image, blocks[highlight_shape]["mask"], color=(255,255,255), alpha=.8)
    cv2.imwrite(out_file_name, mask)
else:
    annotated_image = apply_mask(np_image, blocks[highlight_shape]["mask"])
    cv2.imwrite(out_file_name, annotated_image)