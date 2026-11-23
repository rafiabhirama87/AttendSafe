
import cv2
import json
from face_recognition import face_recognition, compare_faces

# Membaca profil karyawan
with open("registered_faces/EMP001.json", "r") as file:
    employee = json.load(file)

# Membaca foto untuk pengujian
image = cv2.imread("test_images/face1.jpg")

if image is None:
    raise ValueError("Foto pengujian tidak ditemukan.")

# Mengambil wajah dari foto
faces = face_recognition.get_faces(image)

if len(faces) != 1:
    raise ValueError("Harus terdeteksi tepat satu wajah.")

# Membandingkan embedding
similarity = compare_faces(
    faces[0]["embedding"],
    employee["embedding"]
)

print("\n=== HASIL FACE RECOGNITION ===")
print("Employee ID:", employee["employee_id"])
print("Employee Name:", employee["employee_name"])
print(f"Similarity Score: {similarity:.6f}")
