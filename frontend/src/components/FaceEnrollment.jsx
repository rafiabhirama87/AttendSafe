
import { useEffect, useRef, useState } from "react";
import "./FaceEnrollment.css";

const API_URL = "http://127.0.0.1:8000";

function FaceEnrollment({ employeeData, onComplete, onBack }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraActive(true);
      setMessage("Posisikan wajah di tengah kamera.");
    } catch (err) {
      setError("Kamera tidak dapat diakses. Periksa izin kamera browser.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const captureFace = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      setError("Kamera belum siap.");
      return;
    }

    if (capturedImages.length >= 5) {
      setError("Maksimal 5 sampel wajah.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Gagal mengambil gambar.");
          return;
        }

        setCapturedImages((prev) => [...prev, blob]);
        setError("");
        setMessage("Sampel wajah berhasil diambil.");
      },
      "image/jpeg",
      0.9
    );
  };

  const removeSample = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submitEnrollment = async () => {
    if (capturedImages.length < 3) {
      setError("Ambil minimal 3 sampel wajah terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

formData.append("employee_id", employeeData.employee_id);
formData.append("employee_name", employeeData.employee_name);
formData.append("email", employeeData.email);
formData.append("phone_number", employeeData.phone_number);
formData.append("address", employeeData.address);
formData.append("position", employeeData.position);
formData.append("username", employeeData.username);
formData.append("password", employeeData.password);

      capturedImages.forEach((image, index) => {
        formData.append("images", image, `face_${index + 1}.jpg`);
      });

      const response = await fetch(`${API_URL}/register-face`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.detail || result.message || "Registrasi wajah gagal.");
      }

      stopCamera();
      setMessage("Registrasi wajah berhasil!");

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setError(err.message || "Tidak dapat menghubungi backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enrollment-page">
      <div className="enrollment-container">
        <header className="enrollment-header">
          <div className="enrollment-logo">A</div>
          <h1>AttendSafe</h1>
          <p>Face Recognition Enrollment</p>
        </header>

        <section className="enrollment-card">
          <div className="enrollment-title">
            <span>STEP 02 — FACE REGISTRATION</span>
            <h2>Register Your Face</h2>
            <p>
              Lakukan pemindaian wajah untuk membuat profil
              Face Recognition karyawan.
            </p>
          </div>

          <div className="employee-summary">
            <strong>{employeeData?.employee_name}</strong>
            <span>{employeeData?.employee_id}</span>
          </div>

          <div className="enrollment-camera">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={cameraActive ? "active-video" : ""}
            />

            {!cameraActive && (
              <div className="camera-placeholder">
                <span>◎</span>
                <p>Kamera belum diaktifkan</p>
              </div>
            )}

            {cameraActive && <div className="face-guide" />}
          </div>

          <p className="enrollment-instruction">
            Posisikan wajah di tengah kamera. Ambil beberapa
            sampel dengan posisi wajah yang wajar dan berbeda.
          </p>

          <div className="sample-progress">
            <strong>Face Samples</strong>
            <span>{capturedImages.length}/5</span>
          </div>

          <div className="sample-list">
            {capturedImages.map((image, index) => (
              <div className="sample-item" key={index}>
                <span>Sample {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSample(index)}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {message && <p className="enrollment-message">{message}</p>}
          {error && <p className="enrollment-error">{error}</p>}

          <div className="enrollment-actions">
            {!cameraActive ? (
              <button
                type="button"
                className="primary-enrollment-button"
                onClick={startCamera}
              >
                Start Face Scan
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="primary-enrollment-button"
                  onClick={captureFace}
                  disabled={capturedImages.length >= 5 || loading}
                >
                  Capture Face
                </button>

                <button
                  type="button"
                  className="secondary-enrollment-button"
                  onClick={stopCamera}
                  disabled={loading}
                >
                  Stop Camera
                </button>
              </>
            )}

            <button
              type="button"
              className="save-enrollment-button"
              onClick={submitEnrollment}
              disabled={capturedImages.length < 3 || loading}
            >
              {loading ? "Processing..." : "Complete Registration"}
            </button>

            <button
              type="button"
              className="back-enrollment-button"
              onClick={onBack}
              disabled={loading}
            >
              Back to Registration
            </button>
          </div>
        </section>

        <footer className="enrollment-footer">
          AttendSafe © 2026 | Employee Face Enrollment
        </footer>
      </div>
    </div>
  );
}

export default FaceEnrollment;
