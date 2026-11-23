
import { useState } from "react";

import Login from "./components/Login";
import EmployeeRegister from "./components/EmployeeRegister";
import FaceEnrollment from "./components/FaceEnrollment";
import Dashboard from "./Dashboard";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationStep, setRegistrationStep] = useState("form");
  const [employeeData, setEmployeeData] = useState(null);

  // Autentikasi melalui backend PostgreSQL
  const handleLogin = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Username atau password salah."
        );
      }

      if (!result.success || !result.user) {
        throw new Error("Respons login tidak valid.");
      }

      setUser(result.user);
      setIsLoggedIn(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.message === "Failed to fetch"
            ? "Tidak dapat terhubung ke server. Periksa backend."
            : error.message,
      };
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  // Memulai proses registrasi
  const handleRegistration = (data) => {
    setEmployeeData(data);
    setRegistrationStep("face");
  };

  // Kembali ke formulir registrasi
  const handleBackToForm = () => {
    setRegistrationStep("form");
  };

  // Registrasi wajah berhasil
  const handleEnrollmentComplete = () => {
    setRegistrationStep("form");
    setEmployeeData(null);
    setShowRegistration(false);
  };

  // Jika sudah login
  if (isLoggedIn) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Halaman login
  if (!showRegistration) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => {
          setRegistrationStep("form");
          setShowRegistration(true);
        }}
      />
    );
  }

  // Tahap 1: Registrasi data karyawan
  if (registrationStep === "form") {
    return (
      <EmployeeRegister
        onContinue={handleRegistration}
        onBack={() => {
          setShowRegistration(false);
          setRegistrationStep("form");
          setEmployeeData(null);
        }}
      />
    );
  }

  // Tahap 2: Registrasi wajah
  if (registrationStep === "face") {
    return (
      <FaceEnrollment
        employeeData={employeeData}
        onComplete={handleEnrollmentComplete}
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <Login
      onLogin={handleLogin}
      onRegister={() => setShowRegistration(true)}
    />
  );
}

export default App;
