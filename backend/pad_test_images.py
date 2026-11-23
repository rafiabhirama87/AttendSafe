
import cv2
import os
import numpy as np

# Folder foto asli
input_folder = "test_images"

# Folder hasil resize + padding
output_folder = "padded_faces"

os.makedirs(output_folder, exist_ok=True)

# Daftar foto
files = [
    "face1.jpg",
    "Face2.JPEG",
    "face3.jpeg",
    "face4.jpeg"
]

# Ukuran target
target_size = 640

for filename in files:

    image_path = os.path.join(input_folder, filename)
    image = cv2.imread(image_path)

    if image is None:
        print("Gagal membaca:", filename)
        continue

    height, width = image.shape[:2]

    # Menghitung skala dengan mempertahankan proporsi
    scale = min(
        target_size / width,
        target_size / height
    )

    new_width = int(width * scale)
    new_height = int(height * scale)

    # Resize secara proporsional
    resized = cv2.resize(
        image,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA
    )

    # Membuat kanvas 640 x 640
    canvas = np.zeros(
        (target_size, target_size, 3),
        dtype=np.uint8
    )

    # Menghitung posisi tengah
    x_offset = (target_size - new_width) // 2
    y_offset = (target_size - new_height) // 2

    # Menempatkan gambar di tengah kanvas
    canvas[
        y_offset:y_offset + new_height,
        x_offset:x_offset + new_width
    ] = resized

    # Menyimpan hasil
    output_path = os.path.join(
        output_folder,
        filename
    )

    cv2.imwrite(output_path, canvas)

    print(
        f"Berhasil: {filename} "
        f"| Ukuran: {canvas.shape} "
        f"| Ukuran asli: {width}x{height}"
    )

print("\nSemua proses Resize + Padding selesai!")
