
from fastapi import (
    FastAPI,
    File,
    Form,
    UploadFile,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import cv2
import numpy as np
import json
import re

from face_recognition import face_recognition, compare_faces

from database import SessionLocal
from models import (
    Employee,
    UserAccount,
    FaceProfile,
    Attendance
)

from security import hash_password, verify_password

from sqlalchemy.exc import IntegrityError

class LoginRequest(BaseModel):
    username: str
    password: str

class AttendanceLocationRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: float | None = None

def get_wib_now():
    return datetime.now(ZoneInfo("Asia/Jakarta"))



# ==========================================
# 1. FASTAPI CONFIGURATION
# ==========================================

app = FastAPI(
    title="AttendSafe Face Recognition API",
    description="Face Detection and Multi-Face Recognition System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# LOGIN - AUTENTIKASI PENGGUNA
# ==========================================

@app.post("/login")
def login(request: LoginRequest):
    db = SessionLocal()

    try:
        account = (
            db.query(UserAccount)
            .filter(UserAccount.username == request.username.strip())
            .first()
        )

        if not account:
            raise HTTPException(
                status_code=401,
                detail="Username atau password salah."
            )

        if not verify_password(
            request.password,
            account.password_hash
        ):
            raise HTTPException(
                status_code=401,
                detail="Username atau password salah."
            )

        return {
            "success": True,
            "message": "Login berhasil.",
            "user": {
                "username": account.username,
                "employee_id": account.employee_id,
                "role": account.role
            }
        }

    finally:
        db.close()

# ==========================================
# DATA KARYAWAN - POSTGRESQL
# ==========================================

@app.get("/employees")
def get_employees():
    db = SessionLocal()

    try:
        employees = (
            db.query(Employee)
            .order_by(Employee.employee_id)
            .all()
        )

        return [
            {
                "employee_id": employee.employee_id,
                "full_name": employee.full_name,
                "email": employee.email,
                "phone_number": employee.phone_number,
                "position": employee.position,
                "department": employee.department
            }
            for employee in employees
        ]

    finally:
        db.close()

# ==========================================
# 2. DIRECTORY AND CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

REGISTERED_DIR = BASE_DIR / "registered_faces"

# Threshold sementara untuk pengujian.
# Belum menjadi threshold final untuk absensi produksi.
SIMILARITY_THRESHOLD = 0.60


# ==========================================
# 3. OPENCV FACE DETECTION
# ==========================================

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades
    + "haarcascade_frontalface_default.xml"
)


# ==========================================
# 4. IMAGE PROCESSING
# ==========================================

def read_image(image_bytes):
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    return image


# ==========================================
# 5. LOAD REGISTERED EMPLOYEES
# ==========================================

def load_registered_employees():
    employees = []

    if not REGISTERED_DIR.exists():
        return employees

    for file_path in REGISTERED_DIR.glob("*.json"):

        try:
            with open(
                file_path,
                "r",
                encoding="utf-8"
            ) as file:

                employee = json.load(file)

            if (
                "employee_id" in employee
                and "employee_name" in employee
                and "embedding" in employee
            ):
                employees.append(employee)

        except (json.JSONDecodeError, OSError) as error:
            print(
                f"Gagal membaca profil {file_path.name}: {error}"
            )

    return employees


def identify_attendance_employee(image, db):
    detected_faces = face_recognition.get_faces(image)

    # Pastikan hanya ada satu wajah
    if len(detected_faces) == 0:
        return {
            "success": False,
            "status": "no_face",
            "message": "Tidak ada wajah yang terdeteksi."
        }

    if len(detected_faces) > 1:
        return {
            "success": False,
            "status": "multiple_faces",
            "message": "Pastikan hanya satu wajah yang terlihat."
        }

    # Ambil profil wajah dari PostgreSQL
    registered_profiles = (
        db.query(Employee, FaceProfile)
        .join(
            FaceProfile,
            Employee.employee_id == FaceProfile.employee_id
        )
        .all()
    )

    if not registered_profiles:
        return {
            "success": False,
            "status": "no_registered_employee",
            "message": "Belum ada wajah karyawan yang terdaftar."
        }

    camera_embedding = detected_faces[0]["embedding"]

    best_match = None
    best_similarity = -1.0

    for employee, face_profile in registered_profiles:
        similarity = compare_faces(
            camera_embedding,
            face_profile.embedding
        )

        if similarity > best_similarity:
            best_similarity = similarity
            best_match = employee

    # Validasi hasil pencocokan
    if best_match is None or best_similarity < SIMILARITY_THRESHOLD:
        return {
            "success": False,
            "status": "not_recognized",
            "message": "Wajah tidak dikenali."
        }

    return {
        "success": True,
        "status": "recognized",
        "employee_id": best_match.employee_id,
        "employee_name": best_match.full_name,
        "similarity": round(best_similarity, 6)
    }


# ==========================================
# 6. HOME ENDPOINT
# ==========================================

@app.get("/")
def home():
    return {
        "success": True,
        "message": "AttendSafe Face Recognition API is running",
        "engine": "InsightFace"
    }

# ==========================================
# FACE ENROLLMENT ENDPOINT
# ==========================================


@app.post("/register-face")
async def register_face(
    employee_id: str = Form(...),
    employee_name: str = Form(...),
    email: str = Form(...),
    phone_number: str = Form(...),
    address: str = Form(...),
    position: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    images: list[UploadFile] = File(...)
):
    # 1. Validate employee and account data
    employee_id = employee_id.strip()
    employee_name = employee_name.strip()
    email = email.strip()
    phone_number = phone_number.strip()
    address = address.strip()
    position = position.strip()
    username = username.strip()

    if not re.fullmatch(r"[A-Za-z0-9_-]{1,50}", employee_id):
        raise HTTPException(
            status_code=400,
            detail="Employee ID hanya boleh berisi huruf, angka, _ atau -."
        )

    if not employee_name or not position or not username:
        raise HTTPException(
            status_code=400,
            detail="Nama karyawan, posisi, dan username wajib diisi."
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password minimal 8 karakter."
        )

    # 2. Validate number of face samples
    if len(images) < 3 or len(images) > 5:
        raise HTTPException(
            status_code=400,
            detail="Registrasi membutuhkan 3 sampai 5 sampel wajah."
        )

    # 3. Process every uploaded face image
    embeddings = []

    for index, uploaded_image in enumerate(images):
        image_bytes = await uploaded_image.read()
        image = read_image(image_bytes)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail=f"Sampel foto ke-{index + 1} tidak valid."
            )

        detected_faces = face_recognition.get_faces(image)

        if len(detected_faces) == 0:
            raise HTTPException(
                status_code=400,
                detail=f"Tidak ada wajah pada sampel foto ke-{index + 1}."
            )

        if len(detected_faces) > 1:
            raise HTTPException(
                status_code=400,
                detail=f"Sampel foto ke-{index + 1} memiliki lebih dari satu wajah."
            )

        embedding = np.array(
            detected_faces[0]["embedding"],
            dtype=np.float32
        )

        if not np.all(np.isfinite(embedding)):
            raise HTTPException(
                status_code=400,
                detail=f"Embedding sampel ke-{index + 1} tidak valid."
            )

        embeddings.append(embedding)

    # 4. Create average face embedding
    average_embedding = np.mean(embeddings, axis=0)
    embedding_norm = np.linalg.norm(average_embedding)

    if embedding_norm == 0:
        raise HTTPException(
            status_code=400,
            detail="Gagal menghasilkan profil wajah."
        )

    average_embedding = average_embedding / embedding_norm

    # 5. Save employee, account, and face profile
    db = SessionLocal()

    try:
        # Check duplicate employee ID
        existing_employee = db.query(Employee).filter(
            Employee.employee_id == employee_id
        ).first()

        if existing_employee:
            raise HTTPException(
                status_code=409,
                detail="Employee ID sudah terdaftar."
            )

        # Check duplicate username
        existing_username = db.query(UserAccount).filter(
            UserAccount.username == username
        ).first()

        if existing_username:
            raise HTTPException(
                status_code=409,
                detail="Username sudah digunakan."
            )

        # Create employee
        new_employee = Employee(
            employee_id=employee_id,
            full_name=employee_name,
            email=email or None,
            phone_number=phone_number or None,
            address=address or None,
            position=position
        )

        db.add(new_employee)
        db.flush()

        # Create user account with hashed password
        new_account = UserAccount(
            employee_id=employee_id,
            username=username,
            password_hash=hash_password(password),
            role="employee"
        )

        db.add(new_account)

        # Create face profile
        new_face_profile = FaceProfile(
            employee_id=employee_id,
            embedding=average_embedding.tolist()
        )

        db.add(new_face_profile)

        # Commit all data together
        db.commit()

        return {
            "success": True,
            "message": "Registrasi karyawan dan wajah berhasil.",
            "employee": {
                "employee_id": employee_id,
                "employee_name": employee_name,
                "email": email,
                "phone_number": phone_number,
                "address": address,
                "position": position,
                "username": username
            },
            "face_profile": {
                "sample_count": len(embeddings),
                "embedding_dimension": len(average_embedding),
                "engine": "InsightFace"
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError as e:
            db.rollback()
            print("REGISTRATION INTEGRITY ERROR:", str(e.orig))
            raise HTTPException(
                 status_code=409,
                detail="Terjadi kesalahan constraint database."
    )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat menyimpan data registrasi."
        )

    finally:
        db.close()

# ==========================================
# 8. INSIGHTFACE RECOGNITION ENDPOINT
# ==========================================

@app.post("/recognize")
async def recognize_face(file: UploadFile = File(...)):

    image_bytes = await file.read()

    image = read_image(image_bytes)

    if image is None:
        return {
            "success": False,
            "message": "Invalid image"
        }

    detected_faces = face_recognition.get_faces(image)

    results = []

    for face in detected_faces:

        results.append({
            "bbox": face["bbox"],
            "embedding_dimension": len(
                face["embedding"]
            )
        })

    return {
        "success": True,
        "face_count": len(results),
        "faces": results,
        "engine": "InsightFace"
    }


# ==========================================
# 9. MULTI-FACE VERIFICATION ENDPOINT
# ==========================================

@app.post("/verify")
async def verify_face(file: UploadFile = File(...)):

    # 1. Read uploaded image
    image_bytes = await file.read()
    image = read_image(image_bytes)

    if image is None:
        return {
            "success": False,
            "status": "invalid_image",
            "message": "Gambar tidak valid.",
            "face_count": 0,
            "faces": []
        }

    # 2. Detect all faces using InsightFace
    detected_faces = face_recognition.get_faces(image)

    if len(detected_faces) == 0:
        return {
            "success": True,
            "status": "no_face",
            "message": "Tidak ada wajah yang terdeteksi.",
            "face_count": 0,
            "faces": [],
            "engine": "InsightFace"
        }

    # 3. Load employee profiles from PostgreSQL
    db = SessionLocal()

    try:
        registered_profiles = (
            db.query(Employee, FaceProfile)
            .join(
                FaceProfile,
                Employee.employee_id == FaceProfile.employee_id
            )
            .all()
        )

        employees = [
            {
                "employee_id": employee.employee_id,
                "employee_name": employee.full_name,
                "embedding": face_profile.embedding
            }
            for employee, face_profile in registered_profiles
        ]

    finally:
        db.close()

    # 4. Load legacy JSON profiles as fallback
    database_employee_ids = {
        employee["employee_id"].lower()
        for employee in employees
    }

    legacy_employees = load_registered_employees()

    for employee in legacy_employees:
        if employee["employee_id"].lower() not in database_employee_ids:
            employees.append(employee)

    # 5. Check registered employees
    if not employees:
        return {
            "success": False,
            "status": "no_registered_employee",
            "message": "Belum ada karyawan terdaftar.",
            "face_count": len(detected_faces),
            "faces": [],
            "engine": "InsightFace"
        }

    # 6. Verify each detected face independently
    results = []

    for index, face in enumerate(detected_faces):

        camera_embedding = face["embedding"]

        best_match = None
        best_similarity = -1.0

        for employee in employees:

            similarity = compare_faces(
                camera_embedding,
                employee["embedding"]
            )

            if similarity > best_similarity:
                best_similarity = similarity
                best_match = employee

        # 7. Determine recognition result
        if (
            best_match is not None
            and best_similarity >= SIMILARITY_THRESHOLD
        ):

            results.append({
                "face_id": index + 1,
                "status": "recognized",
                "employee": {
                    "employee_id": best_match["employee_id"],
                    "employee_name": best_match["employee_name"]
                },
                "similarity": round(best_similarity, 6),
                "bbox": face["bbox"]
            })

        else:

            results.append({
                "face_id": index + 1,
                "status": "not_recognized",
                "employee": None,
                "similarity": round(best_similarity, 6),
                "bbox": face["bbox"]
            })

    # 8. Count recognition results
    recognized_count = sum(
        1
        for result in results
        if result["status"] == "recognized"
    )

    unknown_count = len(results) - recognized_count

    # 9. Return verification results
    return {
        "success": True,
        "status": "completed",
        "face_count": len(detected_faces),
        "recognized_count": recognized_count,
        "unknown_count": unknown_count,
        "faces": results,
        "engine": "InsightFace"
    }


# ==========================================
# 10. ATTENDANCE CHECK-IN
# ==========================================

@app.post("/attendance/check-in")
async def attendance_check_in(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float | None = Form(None)
):
    # 1. Validate GPS coordinates
    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=400,
            detail="Latitude tidak valid."
        )

    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=400,
            detail="Longitude tidak valid."
        )

    if accuracy is not None and accuracy < 0:
        raise HTTPException(
            status_code=400,
            detail="Akurasi GPS tidak valid."
        )

    # 2. Read image
    image_bytes = await file.read()
    image = read_image(image_bytes)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Gambar tidak valid."
        )

    db = SessionLocal()

    try:
        # 3. Identify employee using PostgreSQL
        recognition = identify_attendance_employee(
            image,
            db
        )

        if not recognition["success"]:
            raise HTTPException(
                status_code=401,
                detail=recognition["message"]
            )

        employee_id = recognition["employee_id"]

        # 4. Get current WIB time
        now = get_wib_now()
        today = now.date()

        # 5. Check existing attendance
        existing_attendance = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.attendance_date == today
            )
            .first()
        )

        if existing_attendance:
            raise HTTPException(
                status_code=409,
                detail="Karyawan sudah melakukan check-in hari ini."
            )

        # 6. Create attendance record
        new_attendance = Attendance(
            employee_id=employee_id,
            attendance_date=today,
            check_in=now,
            check_in_latitude=latitude,
            check_in_longitude=longitude,
            check_in_accuracy=accuracy,
            attendance_status="hadir"
        )

        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)

        return {
            "success": True,
            "message": "Check-in berhasil.",
            "attendance": {
                "attendance_id": new_attendance.attendance_id,
                "employee_id": employee_id,
                "employee_name": recognition["employee_name"],
                "check_in": new_attendance.check_in.isoformat(),
                "latitude": float(latitude),
                "longitude": float(longitude),
                "accuracy": accuracy,
                "status": new_attendance.attendance_status
            },
            "face_recognition": {
                "status": "recognized",
                "similarity": recognition["similarity"]
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Absensi hari ini sudah tercatat."
        )

    except Exception as error:
        db.rollback()
        print("CHECK-IN ERROR:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat menyimpan check-in."
        )

    finally:
        db.close()


# ==========================================
# 11. ATTENDANCE CHECK-OUT
# ==========================================

@app.post("/attendance/check-out")
async def attendance_check_out(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float | None = Form(None)
):
    # 1. Validate GPS coordinates
    if not -90 <= latitude <= 90:
        raise HTTPException(
            status_code=400,
            detail="Latitude tidak valid."
        )

    if not -180 <= longitude <= 180:
        raise HTTPException(
            status_code=400,
            detail="Longitude tidak valid."
        )

    if accuracy is not None and accuracy < 0:
        raise HTTPException(
            status_code=400,
            detail="Akurasi GPS tidak valid."
        )

    # 2. Read image
    image_bytes = await file.read()
    image = read_image(image_bytes)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Gambar tidak valid."
        )

    db = SessionLocal()

    try:
        # 3. Identify employee using PostgreSQL
        recognition = identify_attendance_employee(
            image,
            db
        )

        if not recognition["success"]:
            raise HTTPException(
                status_code=401,
                detail=recognition["message"]
            )

        employee_id = recognition["employee_id"]

        # 4. Get current WIB time
        now = get_wib_now()
        today = now.date()

        # 5. Find today's attendance
        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.attendance_date == today
            )
            .with_for_update()
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=404,
                detail="Karyawan belum melakukan check-in hari ini."
            )

        # 6. Prevent duplicate check-out
        if attendance.check_out is not None:
            raise HTTPException(
                status_code=409,
                detail="Karyawan sudah melakukan check-out hari ini."
            )

        # 7. Save check-out data
        attendance.check_out = now
        attendance.check_out_latitude = latitude
        attendance.check_out_longitude = longitude
        attendance.check_out_accuracy = accuracy

        db.commit()
        db.refresh(attendance)

        return {
            "success": True,
            "message": "Check-out berhasil.",
            "attendance": {
                "attendance_id": attendance.attendance_id,
                "employee_id": employee_id,
                "employee_name": recognition["employee_name"],
                "check_in": attendance.check_in.isoformat(),
                "check_out": attendance.check_out.isoformat(),
                "latitude": float(latitude),
                "longitude": float(longitude),
                "accuracy": accuracy,
                "status": attendance.attendance_status
            },
            "face_recognition": {
                "status": "recognized",
                "similarity": recognition["similarity"]
            }
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()
        print("CHECK-OUT ERROR:", str(error))
        raise HTTPException(
            status_code=500,
            detail="Terjadi kesalahan saat menyimpan check-out."
        )

    finally:
        db.close()


# ==========================================
# GET STATUS ABSENSI HARI INI
# ==========================================

@app.get("/attendance/today/{employee_id}")
def get_today_attendance(employee_id: str):
    db = SessionLocal()

    try:
        today = get_wib_now().date()

        attendance = (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.attendance_date == today
            )
            .first()
        )

        # Belum melakukan check-in
        if not attendance:
            return {
                "success": True,
                "status": "not_checked_in",
                "message": "Belum melakukan check-in hari ini.",
                "attendance": None
            }

        # Sudah check-in dan check-out
        if attendance.check_out is not None:
            status = "checked_out"
            message = "Absensi hari ini sudah selesai."

        # Sudah check-in, belum check-out
        else:
            status = "checked_in"
            message = "Karyawan sudah melakukan check-in hari ini."

        return {
            "success": True,
            "status": status,
            "message": message,
            "attendance": {
                "attendance_id": attendance.attendance_id,
                "employee_id": attendance.employee_id,
                "attendance_date": attendance.attendance_date.isoformat(),
                "check_in": attendance.check_in.isoformat(),
                "check_out": (
                    attendance.check_out.isoformat()
                    if attendance.check_out else None
                ),
                "attendance_status": attendance.attendance_status
            }
        }

    finally:
        db.close()
