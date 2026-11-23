
import cv2
from face_recognition import face_recognition, compare_faces

# Menggunakan foto hasil resize + padding
image_paths = [
    "padded_faces/face1.jpg",
    "padded_faces/Face2.JPEG",
    "padded_faces/face3.jpeg",
    "padded_faces/face4.jpeg"
]

all_faces = []

# Membaca foto dan mengambil embedding
for i, path in enumerate(image_paths, start=1):

    image = cv2.imread(path)

    if image is None:
        print("Gagal membaca:", path)
        exit()

    faces = face_recognition.get_faces(image)

    print(f"Jumlah wajah foto {i}: {len(faces)}")

    if len(faces) != 1:
        print(f"Foto {i} harus memiliki tepat satu wajah.")
        exit()

    all_faces.append(faces[0]["embedding"])

# Membandingkan semua foto dengan Face 1
print("\n=== HASIL FACE MATCHING PADDING ===")

for i in range(1, len(all_faces)):

    similarity = compare_faces(
        all_faces[0],
        all_faces[i]
    )

    print(
        f"Face 1 vs Face {i + 1}: "
        f"{similarity:.6f}"
    )
