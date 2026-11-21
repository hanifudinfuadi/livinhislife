import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleForgot = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result?.detail || 'Gagal mengirim reset password.');
        return;
      }
      if (result.reset_token) {
        setToken(result.reset_token);
      }
      setIsSent(true);
      setMessage(result.message || 'Token reset password telah dibuat.');
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Periksa koneksi jaringan.');
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setError('');
    setMessage('');
    setIsResetting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result?.detail || 'Gagal mereset kata sandi.');
        return;
      }
      setMessage(result.message || 'Kata sandi telah direset.');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError('Tidak dapat terhubung ke server. Periksa koneksi jaringan.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="reset-password-container">
      <form className="reset-password-card" onSubmit={isSent ? handleReset : handleForgot}>
        <span className="reset-password-eyebrow">Akses pribadi</span>
        <h1 className="reset-password-title">{isSent ? 'Reset kata sandi' : 'Lupa kata sandi?'}</h1>
        <p className="reset-password-subtitle">
          {isSent
            ? 'Token reset password telah dibuat. Masukkan kata sandi baru Anda.'
            : 'Masukkan email admin untuk membuat token reset password.'}
        </p>

        {error && <div className="reset-password-error" role="alert">{error}</div>}
        {message && <div className="reset-password-success" role="status">{message}</div>}

        {!isSent ? (
          <>
            <label className="reset-password-field">
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
            <button type="submit" className="reset-password-submit-btn">
              Buat token reset
            </button>
          </>
        ) : (
          <>
            <label className="reset-password-field">
              Token reset password
              <input
                type="text"
                name="token"
                value={token}
                readOnly
                spellCheck={false}
              />
            </label>
            <label className="reset-password-field">
              Kata sandi baru
              <span className="reset-password-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={128}
                  pattern="(?=.*[A-Za-z])(?=.*[0-9])[A-Za-z0-9]{6,128}"
                  title="Gunakan minimal 6 karakter, dengan huruf dan angka saja."
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="reset-password-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </span>
            </label>
            <label className="reset-password-field">
              Konfirmasi kata sandi baru
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={isResetting} className="reset-password-submit-btn">
              {isResetting ? 'Mereset…' : 'Reset kata sandi'}
            </button>
          </>
        )}

        <p className="reset-password-footer">
          <Link to="/login">Kembali ke masuk</Link>
        </p>
      </form>
    </main>
  );
};

export default ResetPassword;