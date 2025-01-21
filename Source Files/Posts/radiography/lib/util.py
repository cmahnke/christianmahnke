import numpy as np
import cv2

def gamma(img, gamma=1):
    lookUpTable = np.empty((1,256), np.uint8)
    for i in range(256):
        lookUpTable[0,i] = np.clip(pow(i / 255.0, gamma) * 255.0, 0, 255)
    res = cv2.LUT(img, lookUpTable)
    return res

def posterize(im, n = 5):
    for i in range(n):
        im[(im >= i*255/n) & (im < (i+1)*255/n)] = i*255/(n-1)
    return im

def invert_gray(img):
    return cv.bitwise_not(img)

def calculate_histogram_median(cv_img_gray, window=(0, 255), num_bins=256):
    hist, _ = np.histogram(cv_img_gray.flatten(), bins=num_bins, range=[window[0],window[1]])
    cdf = hist.cumsum()
    cdf = cdf / cdf[-1]
    return np.searchsorted(cdf, 0.5)

def to_bgra(img):
    if(len(img.shape) < 3):
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
    elif(len(cv_image_grey.shape) > 3):
        return img
    else:
        return cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)

def rgb2rgba(img):
    if img.shape[-1] == 3:
        img = np.dstack((img, np.full(img.shape[:2], 255, dtype=np.uint8)))
    return img