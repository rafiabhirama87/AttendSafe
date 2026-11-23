
import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognition:
    def __init__(self):
        self.model = FaceAnalysis(name="buffalo_l")
        self.model.prepare(
            ctx_id=-1,
            det_size=(640, 640)
        )

    def get_faces(self, image):
        faces = self.model.get(image)

        results = []

        for face in faces:
            results.append({
                "bbox": face.bbox.astype(int).tolist(),
                "embedding": face.embedding.tolist()
            })

        return results

    def create_face_profile(self, image_paths):
        embeddings = []

        for path in image_paths:
            image = cv2.imread(path)

            if image is None:
                raise ValueError(f"Gagal membaca foto: {path}")

            faces = self.get_faces(image)

            if len(faces) != 1:
                raise ValueError(
                    f"Foto {path} harus memiliki tepat satu wajah."
                )

            embeddings.append(
                np.array(faces[0]["embedding"])
            )

        # Rata-rata embedding dari seluruh foto
        average_embedding = np.mean(embeddings, axis=0)

        # Normalisasi embedding
        average_embedding = average_embedding / np.linalg.norm(
            average_embedding
        )

        return average_embedding.tolist()


face_recognition = FaceRecognition()


def compare_faces(embedding1, embedding2):
    embedding1 = np.array(embedding1)
    embedding2 = np.array(embedding2)

    denominator = (
        np.linalg.norm(embedding1) *
        np.linalg.norm(embedding2)
    )

    if denominator == 0:
        return 0.0

    similarity = np.dot(
        embedding1,
        embedding2
    ) / denominator

    return float(similarity)
