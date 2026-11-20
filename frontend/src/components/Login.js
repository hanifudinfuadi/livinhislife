import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      setCapsLockOn(event.getModifierState('CapsLock'));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const base = API_URL;
    if (!base) {
      setError('Konfigurasi backend tidak ditemukan. Cek variabel lingkungan REACT_APP_BACKEND_URL.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = result?.detail;
        const detailText = Array.isArray(detail)
          ? detail.map((d) => d?.msg).filter(Boolean).join('; ')
          : detail;
        const fallback = response.status >= 500
          ? 'Server belum terhubung ke database. Coba lagi beberapa saat.'
          : 'Email atau kata sandi tidak valid.';
        throw new Error(detailText || fallback);
      }
      navigate('/admin', { replace: true, state: { user: result } });
    } catch (loginError) {
      if (loginError instanceof TypeError) {
        setError('Tidak dapat terhubung ke server. Periksa koneksi jaringan atau alamat backend.');
      } else {
        setError(loginError.message || 'Tidak dapat masuk. Coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-container">
      <form className="login-card" onSubmit={handleSubmit}>
        <span className="login-eyebrow">RUANG KERJA PRIBADI</span>
        <h1 className="login-title">Selamat datang kembali.</h1>
        <p className="login-subtitle">Masuk untuk mengelola portfolio dan tulisan Anda.</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <label className="login-field">
          Email admin
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            spellCheck={false}
          />
        </label>
        <label className="login-field">
          Kata sandi
          <span className="login-password-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              minLength={6}
              maxLength={128}
              pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,128}"
              title="Gunakan minimal 6 karakter, dengan huruf dan angka saja."
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
              title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </span>
          {capsLockOn && <span className="login-caps-warning" role="status">⚠ Caps Lock aktif</span>}
        </label>
        <button type="submit" disabled={isLoading} className="login-submit-btn">
          {isLoading ? 'Memeriksa…' : 'Masuk ke admin'}
        </button>
        <p className="login-security-note">Akses pribadi · koneksi aman · sesi berakhir setelah 7 hari</p>
      </form>
    </main>
  );
};

export default Login;
