
import { useState } from "react";
import "./Login.css";

function WorkerIllustration() {
  return (
    <svg
      className="worker-svg"
      viewBox="0 0 620 560"
      role="img"
      aria-label="Ilustrasi pekerja konstruksi dan alat berat"
    >
      {/* Background scenery */}
      <circle cx="310" cy="235" r="190" fill="#DCEBFF" />
      <path d="M0 390 L120 280 L235 390 Z" fill="#9DB9D9" />
      <path d="M145 390 L310 235 L480 390 Z" fill="#789CC6" />
      <path d="M390 390 L520 285 L620 390 Z" fill="#A9C4E0" />

      {/* Ground */}
      <path d="M0 390 Q300 350 620 390 L620 560 L0 560 Z" fill="#D9B77A" />
      <path d="M0 445 Q300 410 620 445 L620 560 L0 560 Z" fill="#C99B59" />

      {/* Excavator tracks */}
      <rect x="330" y="375" width="215" height="55" rx="25" fill="#263B59" />
      <rect x="345" y="384" width="185" height="35" rx="17" fill="#64758B" />
      <circle cx="370" cy="401" r="12" fill="#263B59" />
      <circle cx="405" cy="401" r="12" fill="#263B59" />
      <circle cx="440" cy="401" r="12" fill="#263B59" />
      <circle cx="475" cy="401" r="12" fill="#263B59" />

      {/* Excavator body */}
      <path d="M355 370 L370 300 L500 300 L530 375 Z" fill="#F4B323" />
      <rect x="390" y="270" width="100" height="95" rx="12" fill="#E5A21A" />
      <path d="M405 285 L470 285 L480 335 L400 335 Z" fill="#A9D5E8" />
      <path d="M435 285 L435 335" stroke="#526C82" strokeWidth="5" />

      {/* Excavator arm */}
      <path d="M390 285 L335 205 L270 220" stroke="#E6A21B" strokeWidth="24" fill="none" strokeLinecap="round" />
      <path d="M335 205 L270 220" stroke="#F8C34D" strokeWidth="17" fill="none" strokeLinecap="round" />
      <path d="M270 220 L245 265 L215 255" stroke="#E6A21B" strokeWidth="15" fill="none" strokeLinecap="round" />
      <path d="M215 255 L190 280 L230 290 L250 265 Z" fill="#34445A" />

      {/* Worker legs */}
      <path d="M155 380 L145 470 L185 470 L205 390 Z" fill="#253D60" />
      <path d="M205 390 L220 470 L260 470 L245 380 Z" fill="#253D60" />
      <path d="M145 455 L135 485 L195 485 L185 465 Z" fill="#263B59" />
      <path d="M220 455 L220 485 L275 485 L260 465 Z" fill="#263B59" />

      {/* Worker body and vest */}
      <path d="M145 245 Q190 220 240 245 L260 390 L135 390 Z" fill="#F28C28" />
      <path d="M145 245 L185 270 L170 390 L135 390 Z" fill="#F5A13B" />
      <path d="M240 245 L200 270 L225 390 L260 390 Z" fill="#F5A13B" />
      <path d="M175 260 L185 390" stroke="#FFF1B8" strokeWidth="13" />
      <path d="M210 260 L225 390" stroke="#FFF1B8" strokeWidth="13" />
      <path d="M140 335 L255 335" stroke="#FFF1B8" strokeWidth="10" />

      {/* Arms */}
      <path d="M145 260 L105 330 L125 350" stroke="#D99768" strokeWidth="23" fill="none" strokeLinecap="round" />
      <path d="M245 260 L280 315 L300 300" stroke="#D99768" strokeWidth="23" fill="none" strokeLinecap="round" />

      {/* Head */}
      <ellipse cx="195" cy="205" rx="43" ry="50" fill="#C98558" />
      <path d="M155 200 Q150 145 195 145 Q240 145 238 200 Z" fill="#263B59" />

      {/* Helmet */}
      <path d="M145 180 Q145 115 195 115 Q245 115 245 180 Z" fill="#F5BE35" />
      <path d="M137 180 Q195 165 253 180 L248 194 L142 194 Z" fill="#E5A21A" />
      <path d="M195 117 L195 177" stroke="#FFF0B4" strokeWidth="7" />

      {/* Face details */}
      <circle cx="180" cy="207" r="4" fill="#263B59" />
      <circle cx="210" cy="207" r="4" fill="#263B59" />
      <path d="M185 229 Q195 238 207 229" stroke="#7E4938" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Decorative safety symbol */}
      <circle cx="85" cy="115" r="34" fill="#FFFFFF" />
      <path d="M85 92 L103 99 L101 119 Q96 135 85 141 Q74 135 69 119 L67 99 Z" fill="#2868D8" />
      <path d="M76 115 L83 122 L96 106" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Clouds */}
      <g fill="#FFFFFF" opacity="0.85">
        <circle cx="410" cy="105" r="25" />
        <circle cx="440" cy="95" r="32" />
        <circle cx="470" cy="108" r="23" />
        <rect x="405" y="105" width="90" height="25" rx="12" />
      </g>
    </svg>
  );
}

function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
  event.preventDefault();

  if (!username.trim() || !password.trim()) {
    setError("Username dan password wajib diisi.");
    return;
  }

  setError("");

  const result = await onLogin(username, password);

  if (!result.success) {
    setError(result.message);
  }
};

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="visual-brand">
          <div className="visual-logo">A</div>
          <span>AttendSafe</span>
        </div>

        <div className="visual-heading">
          <span className="visual-tag">SMART WORKPLACE SYSTEM</span>
          <h1>
            Work Safe.
            <br />
            Stay <span>Protected.</span>
          </h1>
          <p>
            Integrated attendance and safety monitoring
            for a smarter and safer workplace.
          </p>
        </div>

        <div className="illustration-container">
          <WorkerIllustration />
        </div>

        <div className="visual-footer">
          <span>SAFETY FIRST, PRODUCTIVITY ALWAYS.</span>
          <span>ATTENDSAFE © 2026</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-brand">
            <div className="login-logo">A</div>
            <span>AttendSafe</span>
          </div>

          <div className="login-heading">
            <span className="welcome-label">WELCOME BACK</span>
            <h2>Login to continue</h2>
            <p>Enter your account details to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="username">
              Username / Email
            </label>
            <div className="login-input">
              <span className="input-icon">♙</span>
              <input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="login-input">
              <span className="input-icon">▣</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="login-options">
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  setError("Silakan hubungi Admin untuk reset password.")
                }
              >
                Forgot password?
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-button">
              Sign In
              <span>→</span>
            </button>
          </form>

          <div className="register-link">
  Belum punya akun?{" "}
  <button
    type="button"
    onClick={onRegister}
  >
    Registrasi
  </button>
</div>

          <div className="login-divider">
            <span />
            <p>SECURE ACCESS</p>
            <span />
          </div>

          <div className="login-security">
            <span>♢</span>
            Authorized personnel only
          </div>

          <p className="login-bottom">
            Employee Attendance & Payroll Management System
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
