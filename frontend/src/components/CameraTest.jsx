
import { useEffect, useRef, useState } from "react";
import "./CameraTest.css";

const API_URL = "http://127.0.0.1:8000/verify";

// Area scan: 50% lebar dan 70% tinggi frame
const FOCUS_WIDTH = 0.50;
const FOCUS_HEIGHT = 0.70;

function CameraTest() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraStatus, setCameraStatus] = useState("idle");
  const [faceCount, setFaceCount] = useState(0);
  const [faces, setFaces] = useState([]);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState("");
  const [detecting, setDetecting] = useState(false);

  const startCamera = async () => {
    setError("");
    setVerification(null);
    setFaces([]);
    setFaceCount(0);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung akses kamera.");
      }

      setCameraStatus("loading");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraStatus("active");
    } catch (err) {
      setCameraStatus("error");
      setError(
        err.name === "NotAllowedError"
          ? "Akses kamera ditolak. Izinkan kamera melalui browser."
          : err.message || "Kamera gagal diakses."
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStatus("idle");
    setFaceCount(0);
    setFaces([]);
    setVerification(null);
    setDetecting(false);
    setError("");
  };

  // Mengirim hanya bagian dalam Focus Area ke backend
  useEffect(() => {
    if (cameraStatus !== "active") return;

    let cancelled = false;
    let timeoutId;

    const verifyLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        cancelled ||
        !video ||
        !canvas ||
        video.readyState < 2 ||
        !video.videoWidth
      ) {
        if (!cancelled) {
          timeoutId = setTimeout(verifyLoop, 500);
        }
        return;
      }

      try {
        setDetecting(true);

        const frameWidth = video.videoWidth;
        const frameHeight = video.videoHeight;

        const cropWidth = Math.round(frameWidth * FOCUS_WIDTH);
        const cropHeight = Math.round(frameHeight * FOCUS_HEIGHT);

        const cropX = Math.round((frameWidth - cropWidth) / 2);
        const cropY = Math.round((frameHeight - cropHeight) / 2);

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const context = canvas.getContext("2d");

        // Crop bagian tengah frame kamera
        context.drawImage(
          video,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.85)
        );

        if (!blob) {
          throw new Error("Gagal mengambil gambar Focus Area.");
        }

        const formData = new FormData();
        formData.append("file", blob, "focus-area.jpg");

  const startTime = performance.now();

        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Backend merespons dengan status ${response.status}`
          );
        }

        const result = await response.json();
        const endTime = performance.now();

console.log(
  `Waktu respons backend: ${((endTime - startTime) / 1000).toFixed(2)} detik`
);

        if (cancelled) return;

        const detectedFaces = result.faces ?? [];

        setFaceCount(result.face_count ?? 0);

        // Terjemahkan koordinat bounding box dari crop
        // kembali ke posisi video secara keseluruhan.
        const mappedFaces = detectedFaces.map((face, index) => {
          const [x1, y1, x2, y2] = face.bbox;

          return {
            id: face.face_id ?? index + 1,
            status: face.status,
            employee: face.employee,
            similarity: face.similarity,
            left:
              ((frameWidth - (cropX + x2)) / frameWidth) * 100,
            top: ((cropY + y1) / frameHeight) * 100,
            boxWidth: ((x2 - x1) / frameWidth) * 100,
            boxHeight: ((y2 - y1) / frameHeight) * 100,
          };
        });

        setFaces(mappedFaces);
        setVerification(result);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Gagal menghubungi Face Verification API."
          );
          setFaces([]);
          setFaceCount(0);
          setVerification(null);
        }
      } finally {
        if (!cancelled) {
          setDetecting(false);
          timeoutId = setTimeout(verifyLoop, 1000);
        }
      }
    };

    verifyLoop();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [cameraStatus]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const recognizedFaces = faces.filter(
    (face) => face.status === "recognized"
  );

  const isSingleVerified = faceCount === 1 && recognizedFaces.length === 1;
  const isMultipleFaces = faceCount > 1;

  let scanMessage = "Posisikan wajah di dalam kotak";

  if (detecting) {
    scanMessage = "Scanning Focus Area...";
  } else if (isMultipleFaces) {
    scanMessage = "Terlalu banyak wajah di area scan";
  } else if (isSingleVerified) {
    scanMessage = "Identity Verified";
  } else if (faceCount === 1) {
    scanMessage = "Wajah belum dikenali";
  }

  return (
    <main className="camera-test-page">
      <header className="camera-header">
        <div>
          <span className="camera-eyebrow">ATTENDSAFE SYSTEM</span>
          <h1>Face Recognition Attendance</h1>
          <p>Targeted face scanning powered by InsightFace.</p>
        </div>

        <div className={`camera-status ${cameraStatus}`}>
          <span className="status-dot" />
          {cameraStatus === "active"
            ? "Camera Active"
            : cameraStatus === "loading"
            ? "Connecting..."
            : cameraStatus === "error"
            ? "Camera Error"
            : "Camera Offline"}
        </div>
      </header>

      <section className="camera-card">
        <div className="camera-card-header">
          <div>
            <h2>Live Face Scanning</h2>
            <p>Place your face inside the green scanning area.</p>
          </div>

          <span className="camera-live-label">
            {cameraStatus === "active" ? "● LIVE SCANNING" : "● OFFLINE"}
          </span>
        </div>

        <div className="camera-screen">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} className="hidden-canvas" />

          {cameraStatus === "active" && (
            <>
              <div className="focus-area">
                <span className="focus-label">FOCUS AREA</span>
                <span className="focus-instruction">
                  Position one face here
                </span>
              </div>

              <div className="detection-overlay">
                {faces.map((face) => (
                  <div
                    className={`detection-box ${
                      face.status === "recognized" ? "verified" : "unknown"
                    }`}
                    key={face.id}
                    style={{
                      left: `${face.left}%`,
                      top: `${face.top}%`,
                      width: `${face.boxWidth}%`,
                      height: `${face.boxHeight}%`,
                    }}
                  >
                    <span>
                      {face.status === "recognized"
                        ? face.employee?.employee_name
                        : "Not Recognized"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {cameraStatus !== "active" && (
            <div className="camera-placeholder">
              <div className="camera-placeholder-icon">📷</div>
              <h3>Camera is not active</h3>
              <p>Click Start Scanning to begin face verification.</p>
            </div>
          )}
        </div>

        <div className="focus-hint">
          <span className="focus-hint-dot" />
          Only faces inside the Focus Area are sent for verification.
        </div>

        <div className="detection-info">
          <div className="detection-stat">
            <span>Faces in Focus Area</span>
            <strong>{faceCount}</strong>
          </div>

          <div className="detection-stat">
            <span>AI Engine</span>
            <strong>InsightFace</strong>
          </div>

          <div className="detection-stat">
            <span>Scanning Status</span>
            <strong className={detecting ? "processing" : ""}>
              {cameraStatus !== "active"
                ? "Waiting"
                : detecting
                ? "Processing"
                : "Ready"}
            </strong>
          </div>
        </div>

        <div className="verification-panel">
          <span className="verification-label">IDENTITY VERIFICATION</span>

          <h3
            className={
              isSingleVerified
                ? "verification-success"
                : isMultipleFaces
                ? "verification-warning"
                : "verification-pending"
            }
          >
            {scanMessage}
          </h3>

          {isSingleVerified && (
            <div className="employee-result">
              <div>
                <span>Employee Name</span>
                <strong>{recognizedFaces[0].employee.employee_name}</strong>
              </div>

              <div>
                <span>Employee ID</span>
                <strong>{recognizedFaces[0].employee.employee_id}</strong>
              </div>

              <div>
                <span>Similarity Score</span>
                <strong>
                  {recognizedFaces[0].similarity.toFixed(4)}
                </strong>
              </div>
            </div>
          )}

          {isMultipleFaces && (
            <p>
              Please make sure only one face is inside the Focus Area.
            </p>
          )}

          {faceCount === 1 && recognizedFaces.length === 0 && (
            <p>
              Wajah terdeteksi, tetapi belum cocok dengan profil karyawan.
            </p>
          )}

          {faceCount === 0 && cameraStatus === "active" && (
            <p>
              Arahkan wajah ke kotak hijau untuk memulai pemindaian.
            </p>
          )}
        </div>

        {error && <div className="camera-error">{error}</div>}

        <div className="camera-controls">
          <button
            className="start-camera"
            onClick={startCamera}
            disabled={
              cameraStatus === "active" || cameraStatus === "loading"
            }
          >
            Start Scanning
          </button>

          <button
            className="stop-camera"
            onClick={stopCamera}
            disabled={cameraStatus !== "active"}
          >
            Stop Camera
          </button>
        </div>
      </section>

      <div className="camera-note">
        AttendSafe processes only the cropped Focus Area. Faces outside this
        area are excluded from verification. Attendance recording is not yet
        enabled.
      </div>
    </main>
  );
}

export default CameraTest;
