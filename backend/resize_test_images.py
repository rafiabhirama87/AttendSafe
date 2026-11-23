
import cv2
import os

# Folder foto asli
input_folder = "test_images"

# Folder penyimpanan hasil resize
output_folder = "resized_faces"

# Buat folder output jika belum tersedia
os.makedirs(output_folder, exist_ok=True)

# Daftar foto yang akan diproses
files = [
    "face1.jpg",
    "Face2.JPEG",
    "face3.jpeg",
    "face4.jpeg"
]

# Ukuran gambar eksperimen
target_size = (640, 640)

for filename in files:

    image_path = os.path.join(
        input_folder,
        filename
    )

    image = cv2.imread(image_path)

    if image is None:
        print("Gagal membaca:", filename)
        continue

    # Resize gambar
    resized = cv2.resize(
        image,
        target_size,
        interpolation=cv2.INTER_AREA
    )

    # Lokasi penyimpanan
    output_path = os.path.join(
        output_folder,
        filename
    )

    cv2.imwrite(output_path, resized)

    print(
        f"Berhasil: {filename} "
        f"| Ukuran: {resized.shape}"
    )

print("\nSemua proses resize selesai!")
