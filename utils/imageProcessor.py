import sys
import cv2
import numpy as np
from PIL import Image
import os

def process_image(image_path, operation):
    try:
        # Baca gambar (dalam warna)
        image = Image.open(image_path)
        
        # Konversi gambar ke numpy array (matrix)
        image_matrix = np.array(image)
        
        # Pisahkan channel R, G, B
        r_channel = image_matrix[:, :, 0]
        g_channel = image_matrix[:, :, 1]
        b_channel = image_matrix[:, :, 2]
        
        def apply_operation(channel, operation):
            # Konversi ke binary (True untuk pixel > threshold)
            threshold = 128
            binary_image = (channel > threshold).astype(np.uint8)
            
            # Kernel untuk operasi morfologi
            kernel = np.ones((5,5), np.uint8)
            hitormiss_kernel = np.array([[1, 0, 0],
                                         [0, 1, 0],
                                         [0, 0, -1]], dtype=np.int8)
            
            # Pilih operasi
            if operation == "dilate":
                processed = cv2.dilate(binary_image, kernel, iterations=1)
            elif operation == "erode":
                processed = cv2.erode(binary_image, kernel, iterations=1)
            elif operation == "open":
                processed = cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, kernel)
            elif operation == "close":
                processed = cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, kernel)
            elif operation == "hitormiss":
                processed = cv2.morphologyEx(binary_image, cv2.MORPH_HITMISS, hitormiss_kernel)
            else:
                raise ValueError(f"Operasi tidak dikenal: {operation}")
            
            # Konversi kembali ke format uint8
            return processed * 255
        
        # Terapkan operasi ke setiap channel
        processed_r = apply_operation(r_channel, operation)
        processed_g = apply_operation(g_channel, operation)
        processed_b = apply_operation(b_channel, operation)
        
        # Gabungkan kembali channel
        processed_image = np.stack([processed_r, processed_g, processed_b], axis=2)
        
        # Simpan hasil
        output_filename = os.path.splitext(image_path)[0] + f"_{operation}.jpg"
        cv2.imwrite(output_filename, processed_image)
        
        # Print path output untuk dibaca Node.js
        print(output_filename)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <image_path> <operation>", file=sys.stderr)
        sys.exit(1) 
    
    image_path = sys.argv[1]
    operation = sys.argv[2].lower()
    
    process_image(image_path, operation)
