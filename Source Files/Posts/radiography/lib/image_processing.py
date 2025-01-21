#import numpy as np
import cv2
import numpy as np


def edge_detection(cv_image_grey, threshold1=50, threshold2=150, blur = True):
    if(len(cv_image_grey.shape) < 3):
        gray = cv_image_grey
    else:
        gray = cv2.cvtColor(cv_image_grey, cv2.COLOR_BGR2GRAY)

    if blur:
        blurred = cv2.GaussianBlur(src=gray, ksize=(3, 5), sigmaX=0.5)
    else:
        blurred = gray
    edges = cv2.Canny(blurred, threshold1, threshold2)
    return edges

def clahe_contrast(bgr_img=None, rgb_img=None):
    """
    Make sure that the input is BGR!
    """
    if bgr_img is not None:
        lab = cv2.cvtColor(safe_bgr(bgr_img), cv2.COLOR_BGR2LAB)
    elif rgb_img is not None:
        lab = cv2.cvtColor(safe_rgb(rgb_img), cv2.COLOR_RGB2LAB)
    else:
        raise ValueError("No valid input image")
    
    l_channel, a, b = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l_channel)

    limg = cv2.merge((cl,a,b))

    enhanced_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

    return enhanced_img

def histogram_median(cv_img_gray, window=(0, 255), num_bins=256):
    hist, _ = np.histogram(cv_img_gray.flatten(), bins=num_bins, range=[window[0],window[1]])
    cdf = hist.cumsum()
    cdf = cdf / cdf[-1]
    return np.searchsorted(cdf, 0.5)

def adjust_histogram(img, window=(0, 256), base=(256/2)):
    hist, _ = np.histogram(img.flatten(), bins=256, density=True, range=[0, 255])
    lookUpTable = np.full((256), base, dtype=np.uint8)
    multi = (window[1]- window[0]) / hist.max()

    for i in range(round(window[0]), round(window[1])):
        lookUpTable[i] =  256 - hist[i] * multi
    img = cv2.LUT(img, lookUpTable)
    img = cv2.normalize(img, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX)
    return img

def safe_gray(cv_image):
    if(len(cv_image.shape) < 3):
        return cv_image
    else:
        return cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)

def safe_rgb(cv_image):
    if(len(cv_image.shape) < 3):
        return cv2.cvtColor(cv_image, cv2.COLOR_GRAY2RGB)
    else:
        return cv_image
    
def safe_bgr(cv_image):
    if(len(cv_image.shape) < 3):
        return cv2.cvtColor(cv_image, cv2.COLOR_GRAY2BGR)
    else:
        return cv_image