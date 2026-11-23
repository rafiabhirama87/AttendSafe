import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

const [cameraActive, setCameraActive] = useState(false);
const [attendanceLoading, setAttendanceLoading] = useState(false);
const [attendanceMessage, setAttendanceMessage] = useState("");
const [attendanceStatus, setAttendanceStatus] = useState("not_checked_in");
const [attendanceInfo, setAttendanceInfo] = useState(null);
const [attendanceStatusLoading, setAttendanceStatusLoading] = useState(false);


  // Jam dan tanggal real-time WIB
  const [currentTime, setCurrentTime] = useState(new Date());
    // Mengaktifkan kamera
  const startCamera = async () => {
    try {
      setAttendanceMessage("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraActive(true);
    } catch (error) {
      console.error("Camera error:", error);
      setAttendanceMessage(
        "Kamera tidak dapat diakses. Periksa izin kamera browser."
      );
    }
  };

  // Menghentikan kamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

   // Memasang stream kamera setelah elemen video tersedia
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;

      videoRef.current.play().catch((error) => {
        console.error("Video playback error:", error);
      });
    }
  }, [cameraActive]);


  // Mengambil foto dari kamera
  const captureFaceImage = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      throw new Error("Kamera belum siap. Coba lagi.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Gagal mengambil foto."));
        }
      }, "image/jpeg", 0.9);
    });
  };


  // Mengambil lokasi GPS perangkat
  const getGPSLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser tidak mendukung GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message = "Gagal mendapatkan lokasi GPS.";

          if (error.code === 1) {
            message = "Izin lokasi ditolak. Aktifkan izin lokasi browser.";
          } else if (error.code === 2) {
            message = "Lokasi perangkat tidak tersedia.";
          } else if (error.code === 3) {
            message = "Waktu pengambilan lokasi habis. Coba lagi.";
          }

          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  };


  // Mengirim data absensi ke backend
  const submitAttendance = async (action) => {
    try {
      setAttendanceLoading(true);
      setAttendanceMessage("");

      if (!cameraActive) {
        throw new Error("Aktifkan kamera terlebih dahulu.");
      }

      // Mengambil foto wajah
      const imageBlob = await captureFaceImage();

      // Mengambil lokasi GPS
      const location = await getGPSLocation();

      // Menyiapkan data untuk backend
      const formData = new FormData();
      formData.append("file", imageBlob, "attendance.jpg");
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      formData.append("accuracy", location.accuracy);

      // Mengirim permintaan absensi
      const response = await fetch(
        `${API_URL}/attendance/${action}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Proses absensi gagal.");
      }

      setAttendanceStatus(
  action === "check-in" ? "checked_in" : "checked_out"
);

setAttendanceInfo(data.attendance || null);

      setAttendanceMessage(data.message);
      stopCamera();

    } catch (error) {
      setAttendanceMessage(error.message);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Membersihkan kamera ketika halaman ditinggalkan
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Data Karyawan", icon: "♙" },
    { name: "Absensi", icon: "▣" },
    { name: "Deteksi APD", icon: "⬡" },
    { name: "Penggajian", icon: "＄" },
    { name: "Laporan", icon: "▤" },
  ];

  // Memperbarui jam setiap detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mengambil data karyawan dari backend PostgreSQL
  useEffect(() => {
    if (
      activeMenu !== "Dashboard" &&
      activeMenu !== "Data Karyawan"
    ) {
      return;
    }

    const fetchEmployees = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/employees`);

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data karyawan (${response.status})`
          );
        }

        const result = await response.json();

        const employeeData = Array.isArray(result)
          ? result
          : result.employees || [];

        setEmployees(employeeData);
      } catch (err) {
        setError(err.message);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [activeMenu]);


  // Mengambil status absensi hari ini dari PostgreSQL
  useEffect(() => {
    if (activeMenu !== "Absensi" || !user?.employee_id) {
      return;
    }

    const fetchAttendanceStatus = async () => {
      setAttendanceStatusLoading(true);
      setAttendanceMessage("");

      try {
        const response = await fetch(
          `${API_URL}/attendance/today/${encodeURIComponent(user.employee_id)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Gagal mengambil status absensi."
          );
        }

        setAttendanceStatus(data.status);
        setAttendanceInfo(data.attendance);
      } catch (error) {
        setAttendanceMessage(error.message);
      } finally {
        setAttendanceStatusLoading(false);
      }
    };

    fetchAttendanceStatus();
  }, [activeMenu, user?.employee_id]);

  // Format tanggal WIB
  const formattedDate = currentTime.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format jam WIB
  const formattedTime = currentTime.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Tampilan Dashboard
  const renderDashboard = () => (
    <>
      <section className="welcome">
        <div>
          <h2>Selamat Datang, Administrator!</h2>
          <p>
            Berikut ringkasan data karyawan AttendSafe.
          </p>
        </div>
        <div className="welcome-icon">◷</div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Karyawan</span>
          <h2>{loading ? "..." : employees.length}</h2>
          <small>Data dari database PostgreSQL</small>
        </div>

        <div className="stat-card">
          <span>Hadir Hari Ini</span>
          <h2>—</h2>
          <small>Menunggu integrasi data absensi</small>
        </div>

        <div className="stat-card">
          <span>Tidak Hadir</span>
          <h2>—</h2>
          <small>Menunggu integrasi data absensi</small>
        </div>

        <div className="stat-card">
          <span>Kepatuhan APD</span>
          <h2>—</h2>
          <small>Menunggu integrasi deteksi APD</small>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Data Karyawan Terdaftar</h3>
            <p>
              Ringkasan karyawan dari database AttendSafe
            </p>
          </div>

          <button
            className="outline-button"
            onClick={() => setActiveMenu("Data Karyawan")}
            type="button"
          >
            Lihat Semua
          </button>
        </div>

        {loading ? (
          <p>Memuat data karyawan...</p>
        ) : error ? (
          <p>{error}</p>
        ) : employees.length === 0 ? (
          <p>Belum ada data karyawan.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Karyawan</th>
                  <th>Nama Karyawan</th>
                  <th>Jabatan</th>
                  <th>Departemen</th>
                </tr>
              </thead>

              <tbody>
                {employees.slice(0, 5).map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>{employee.employee_id}</td>
                    <td>{employee.full_name}</td>
                    <td>{employee.position || "-"}</td>
                    <td>{employee.department || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  // Tampilan Data Karyawan
  const renderEmployees = () => (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <h3>Daftar Karyawan</h3>
          <p>
            Data karyawan yang tersimpan di PostgreSQL
          </p>
        </div>

        <span>Total: {employees.length} karyawan</span>
      </div>

      {loading ? (
        <p>Memuat data karyawan...</p>
      ) : error ? (
        <p>{error}</p>
      ) : employees.length === 0 ? (
        <p>Belum ada data karyawan di database.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID Karyawan</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Nomor Telepon</th>
                <th>Jabatan</th>
                <th>Departemen</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.full_name}</td>
                  <td>{employee.email || "-"}</td>
                  <td>{employee.phone_number || "-"}</td>
                  <td>{employee.position || "-"}</td>
                  <td>{employee.department || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );


  // Tampilan halaman Absensi
  const renderAttendance = () => (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <h3>Absensi Karyawan</h3>
          <p>
            Lakukan verifikasi wajah untuk Check-in dan Check-out.
          </p>
        </div>
      </div>


      {attendanceStatusLoading ? (
        <p>Memuat status absensi...</p>
      ) : (
        <div style={{ marginTop: "16px" }}>
          <h4>
            Status: {
              attendanceStatus === "not_checked_in"
                ? "Belum Check-in"
                : attendanceStatus === "checked_in"
                ? "Sudah Check-in"
                : "Absensi Selesai"
            }
          </h4>

          {attendanceInfo && (
            <div>
              <p>
                Check-in: {attendanceInfo.check_in
                  ? new Date(attendanceInfo.check_in).toLocaleTimeString(
                      "id-ID",
                      { timeZone: "Asia/Jakarta" }
                    )
                  : "-"}
              </p>

              <p>
                Check-out: {attendanceInfo.check_out
                  ? new Date(attendanceInfo.check_out).toLocaleTimeString(
                      "id-ID",
                      { timeZone: "Asia/Jakarta" }
                    )
                  : "-"}
              </p>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: "600px", margin: "24px auto" }}>
        <div
          style={{
            background: "#111827",
            borderRadius: "12px",
            overflow: "hidden",
            minHeight: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                display: "block",
              }}
            />
          ) : (
            <p style={{ color: "white" }}>
              Kamera belum diaktifkan
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          {!cameraActive ? (
            <button
              className="outline-button"
              type="button"
              onClick={startCamera}
            >
              Aktifkan Kamera
            </button>
          ) : (
            <button
              className="outline-button"
              type="button"
              onClick={stopCamera}
            >
              Matikan Kamera
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          {attendanceStatus === "not_checked_in" && (
            <button
              className="primary-button"
              type="button"
              disabled={!cameraActive || attendanceLoading}
              onClick={() => submitAttendance("check-in")}
            >
              {attendanceLoading ? "Memproses..." : "Check-in"}
            </button>
          )}

          {attendanceStatus === "checked_in" && (
            <button
              className="primary-button"
              type="button"
              disabled={!cameraActive || attendanceLoading}
              onClick={() => submitAttendance("check-out")}
            >
              {attendanceLoading ? "Memproses..." : "Check-out"}
            </button>
          )}

          {attendanceStatus === "checked_out" && (
            <p>Absensi hari ini sudah selesai.</p>
          )}
        </div>

        {attendanceMessage && (
          <p style={{ marginTop: "16px" }}>
            {attendanceMessage}
          </p>
        )}
      </div>
    </section>
  );

  // Tampilan modul lainnya
  const renderOtherPages = () => (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <h3>{activeMenu}</h3>
          <p>Modul {activeMenu} AttendSafe</p>
        </div>
      </div>

      <p>
        Modul ini belum terintegrasi dengan database.
        Informasi akan ditampilkan setelah proses integrasi selesai.
      </p>
    </section>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <h2>AttendSafe</h2>
            <span>Employee Management</span>
          </div>
        </div>

        <p className="menu-label">MENU UTAMA</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`menu-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
              type="button"
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-avatar">HR</div>
          <div>
            <strong>Administrator</strong>
            <span>Human Resources</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Pages / {activeMenu}
            </p>
            <h1>{activeMenu}</h1>
          </div>

          <div className="topbar-right">
            <div className="date">
              <div>{formattedDate}</div>
              <div>
                {formattedTime} WIB
              </div>
            </div>

            <div className="profile-avatar">HR</div>

            <button
              className="logout-button"
              onClick={onLogout}
              type="button"
            >
              ↪ Logout
            </button>
          </div>
        </header>

        {activeMenu === "Dashboard" && renderDashboard()}
        {activeMenu === "Data Karyawan" && renderEmployees()}
        {activeMenu === "Absensi" && renderAttendance()}
        {!["Dashboard", "Data Karyawan", "Absensi"].includes(activeMenu) &&
            renderOtherPages()}

        <footer>
          AttendSafe © {currentTime.getFullYear()} —
          Employee Attendance & Payroll Management System
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
