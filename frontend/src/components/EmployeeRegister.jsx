
import { useState } from "react";
import "./EmployeeRegister.css";

function EmployeeRegister({ onContinue, onBack }) {
  const [formData, setFormData] = useState({
    employee_id: "",
    employee_name: "",
    email: "",
    phone_number: "",
    address: "",
    position: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onContinue) {
      onContinue(formData);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
<button
  type="button"
  className="register-back-button"
  onClick={onBack}
>
  ← Kembali
</button>

        {/* HEADER */}
        <div className="register-header">
          <div className="register-logo">A</div>
          <h1>AttendSafe</h1>
          <p>Employee Face Registration</p>
        </div>

        {/* REGISTRATION CARD */}
        <div className="register-card">

          <div className="register-title">
            <h2>Registrasi Karyawan</h2>
            <p>
              Lengkapi data diri dan informasi akun
              sebelum melakukan registrasi wajah.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* DATA KARYAWAN */}
            <h3 className="register-section-title">
              Data Karyawan
            </h3>

            <div className="register-field">
              <label>ID Karyawan</label>
              <input
                type="text"
                name="employee_id"
                placeholder="Masukkan ID karyawan"
                value={formData.employee_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label>Nama Lengkap</label>
              <input
                type="text"
                name="employee_name"
                placeholder="Masukkan nama lengkap"
                value={formData.employee_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Masukkan email aktif"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label>Nomor Handphone</label>
              <input
                type="tel"
                name="phone_number"
                placeholder="Contoh: 081234567890"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label>Alamat</label>
              <textarea
                name="address"
                placeholder="Masukkan alamat lengkap"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>

            <div className="register-field">
              <label>Posisi</label>
              <input
                type="text"
                name="position"
                placeholder="Contoh: Field Technician"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            {/* INFORMASI AKUN */}
            <h3 className="register-section-title">
              Informasi Akun
            </h3>

            <div className="register-field">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Buat username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="register-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Buat password (minimal 8 karakter)"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>

            {/* INFORMATION */}
            <div className="register-info">
              <span>ⓘ</span>
              Data karyawan digunakan untuk
              menghubungkan identitas karyawan
              dengan profil wajah pada AttendSafe.
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="register-button"
            >
              Continue to Face Registration →
            </button>

          </form>
        </div>

        {/* FOOTER */}
        <p className="register-footer">
          AttendSafe © 2026 | Smart Workforce Management
        </p>

      </div>
    </div>
  );
}

export default EmployeeRegister;
