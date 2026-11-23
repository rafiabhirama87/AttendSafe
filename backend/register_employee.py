
from face_recognition import face_recognition
import json
import os

# Lokasi empat foto referensi
image_paths = [
    "test_images/face1.jpg",
    "test_images/Face2.JPEG",
    "test_images/face3.jpeg",
    "test_images/face4.jpeg"
]

# Membuat profil wajah
print("Memproses registrasi wajah...")

embedding = face_recognition.create_face_profile(image_paths)

# Data karyawan sementara untuk pengujian
employee = {
    "employee_id": "TK4702",
    "employee_name": "Rafi Abhirama H",
    "embedding": embedding
}

# Membuat folder penyimpanan
os.makedirs("registered_faces", exist_ok=True)

# Menyimpan profil wajah
with open(
    "registered_faces/EMP001.json",
    "w"
) as file:
    json.dump(employee, file, indent=4)

print("\nRegistrasi wajah berhasil!")
print("Employee ID:", employee["employee_id"])
print("Employee Name:", employee["employee_name"])
print("Embedding Dimension:", len(embedding))
