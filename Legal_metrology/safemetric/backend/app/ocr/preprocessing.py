import cv2
import numpy as np

def preprocess_for_ocr(image_path: str, output_path: str = None) -> np.ndarray:
    """
    Applies comprehensive OpenCV computer vision pipeline to optimize package labels for OCR:
    1. Grayscale conversion
    2. Resizing with aspect ratio preservation (target standard width 1200px)
    3. Bilateral filter for edge-preserving denoising
    4. CLAHE contrast enhancement
    5. Unsharp masking for crisp text edges
    6. Adaptive thresholding
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Unable to read image at {image_path}")

    h, w = img.shape[:2]

    # Target width 1200px for optimal OCR recognition
    target_width = 1200
    if w < target_width or w > 2400:
        scaling_factor = target_width / float(w)
        target_height = int(h * scaling_factor)
        resized = cv2.resize(img, (target_width, target_height), interpolation=cv2.INTER_CUBIC)
    else:
        resized = img.copy()

    # 1. Grayscale
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)

    # 2. Bilateral filtering (smoothes flat areas while preserving sharp edges)
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # 4. Sharpening filter to accentuate small alphanumeric characters (MRP, Mfg dates)
    sharpen_kernel = np.array([[-1, -1, -1],
                               [-1,  9, -1],
                               [-1, -1, -1]])
    sharpened = cv2.filter2D(enhanced, -1, sharpen_kernel)

    # 5. Blend slightly with enhanced for natural appearance
    result = cv2.addWeighted(sharpened, 0.4, enhanced, 0.6, 0)

    if output_path:
        cv2.imwrite(output_path, result)

    return result

def get_adaptive_threshold(gray_img: np.ndarray) -> np.ndarray:
    """Computes binarized Otsu or adaptive threshold image for fine print segments."""
    return cv2.adaptiveThreshold(
        gray_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
