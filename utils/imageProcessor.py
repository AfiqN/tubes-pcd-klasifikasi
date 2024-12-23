import sys
import cv2
import numpy as np
from PIL import Image
import os
from rembg import remove
import time

def process_image(image_path, operation):
    try:
        start_time = time.time()
        timeout = 30  # timeout dalam detik

        # Baca gambar (dalam warna)
        image = Image.open(image_path)
        image_matrix = np.array(image)

        if operation in ["dilate", "erode", "open", "close", "hitormiss"]:
            # Operasi morfologi
            r_channel = image_matrix[:, :, 0]
            g_channel = image_matrix[:, :, 1]
            b_channel = image_matrix[:, :, 2]
            
            def apply_morphology(channel, operation):
                threshold = 128
                binary_image = (channel > threshold).astype(np.uint8)
                kernel = np.ones((5,5), np.uint8)
                hitormiss_kernel = np.array([[1, 0, 0],
                                           [0, 1, 0],
                                           [0, 0, -1]], dtype=np.int8)
                
                if operation == "dilate":
                    return cv2.dilate(binary_image, kernel, iterations=1) * 255
                elif operation == "erode":
                    return cv2.erode(binary_image, kernel, iterations=1) * 255
                elif operation == "open":
                    return cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, kernel) * 255
                elif operation == "close":
                    return cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, kernel) * 255
                elif operation == "hitormiss":
                    return cv2.morphologyEx(binary_image, cv2.MORPH_HITMISS, hitormiss_kernel) * 255
            
            processed_r = apply_morphology(r_channel, operation)
            processed_g = apply_morphology(g_channel, operation)
            processed_b = apply_morphology(b_channel, operation)
            processed_image = np.stack([processed_r, processed_g, processed_b], axis=2)

        elif operation == "hsv":
            # Konversi BGR ke RGB karena OpenCV menggunakan BGR
            rgb_image = cv2.cvtColor(image_matrix, cv2.COLOR_RGB2BGR)
            # Konversi ke HSV
            processed_image = cv2.cvtColor(rgb_image, cv2.COLOR_BGR2HSV)

        elif operation == "hsi":
            # Konversi ke HSI
            image_float = image_matrix.astype(float) / 255.0
            r, g, b = image_float[:, :, 0], image_float[:, :, 1], image_float[:, :, 2]

            # Intensity
            intensity = (r + g + b) / 3.0

            # Saturation
            min_rgb = np.minimum(np.minimum(r, g), b)
            saturation = 1 - (3.0 * min_rgb) / (r + g + b + 1e-6)

            # Hue
            numerator = 0.5 * ((r - g) + (r - b))
            denominator = np.sqrt((r - g)**2 + (r - b)*(g - b) + 1e-6)
            theta = np.arccos(np.clip(numerator / denominator, -1.0, 1.0))
            hue = np.where(b <= g, theta, 2*np.pi - theta)
            hue = hue / (2*np.pi)

            processed_image = np.stack([hue, saturation, intensity], axis=2)
            processed_image = (processed_image * 255).astype(np.uint8)

        elif operation == "removebg":
            try:
                # Menghapus latar belakang dengan timeout
                output = remove(image)
                # Konversi output ke format yang bisa disimpan
                processed_image = np.array(output)
                
                # Ubah ekstensi file untuk removebg menjadi PNG
                output_filename = os.path.splitext(image_path)[0] + f"_{operation}.png"
                
                # Simpan sebagai PNG untuk mendukung alpha channel
                Image.fromarray(processed_image).save(output_filename, 'PNG')
                
                print(output_filename)
                return  # Keluar dari fungsi setelah menyimpan
            except Exception as e:
                print(f"Error in remove background: {str(e)}", file=sys.stderr)
                sys.exit(1)

        else:
            raise ValueError(f"Operasi tidak dikenal: {operation}")

        # Cek timeout
        if time.time() - start_time > timeout:
            raise TimeoutError("Operasi terlalu lama")

        # Simpan hasil
        output_filename = os.path.splitext(image_path)[0] + f"_{operation}.jpg"
        
        # Pastikan processed_image dalam format yang benar
        if operation == "removebg":
            Image.fromarray(processed_image).save(output_filename)
        else:
            cv2.imwrite(output_filename, processed_image)
            
        print(output_filename)
        
    except TimeoutError as e:
        print(f"Error: Timeout - {str(e)}", file=sys.stderr)
        sys.exit(1)
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
