
import numpy as np
from face_recognition import compare_faces

# Simulasi embedding wajah pertama
embedding1 = np.random.rand(512)

# Simulasi embedding wajah kedua yang sama
embedding2 = embedding1.copy()

# Simulasi embedding wajah ketiga yang berbeda
embedding3 = np.random.rand(512)

# Membandingkan wajah
same_person = compare_faces(embedding1, embedding2)
different_person = compare_faces(embedding1, embedding3)

print("Similarity wajah yang sama:", same_person)
print("Similarity wajah berbeda:", different_person)
