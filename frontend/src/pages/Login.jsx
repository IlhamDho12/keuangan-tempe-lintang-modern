import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { KeyRound, User, Lock, LogIn } from 'lucide-react';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Helper to determine gender profile
  const getGender = (name = '') => {
    const n = name.toLowerCase().trim();
    if (!n) return 'neutral';
    
    const femaleNames = ['lisa', 'neti', 'linda', 'yanti', 'meta', 'eli', 'via', 'masdalena', 'ning', 'sri', 'putri', 'dewi', 'liana', 'lusi', 'ani', 'ana', 'ria'];
    if (femaleNames.some(fn => n.includes(fn))) return 'female';
    
    const maleNames = ['billy', 'yuda', 'rahmat', 'satria', 'harun', 'bambang', 'owner', 'admin'];
    if (maleNames.some(mn => n.includes(mn))) return 'male';
    
    return 'neutral';
  };

  const gender = getGender(username);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal.');
      }

      login(data.user, data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLoginAvatar = () => {
    if (gender === 'female') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0' }}>
          <svg width="64" height="64" viewBox="0 0 100 100" style={{ borderRadius: '50%', backgroundColor: 'var(--success-light)', border: '2.5px solid var(--success)', boxShadow: '0 6px 16px rgba(92,128,1,0.25)', animation: 'pulse 2s infinite' }}>
            <path d="M15,55 C15,10 85,10 85,55 C85,60 80,75 80,75 C70,65 60,65 50,75 C40,65 30,65 20,75 C20,75 15,60 15,55 Z" fill="#6e4e37" />
            <circle cx="50" cy="52" r="28" fill="#ffd1b3" />
            <path d="M22,50 C30,30 70,30 78,50 C70,35 30,35 22,50 Z" fill="#543825" />
            <circle cx="40" cy="50" r="3" fill="#331a00" />
            <circle cx="60" cy="50" r="3" fill="#331a00" />
            <path d="M44,60 Q50,65 56,60" stroke="#cc0044" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="34" cy="55" r="4" fill="#ff9999" opacity="0.6" />
            <circle cx="66" cy="55" r="4" fill="#ff9999" opacity="0.6" />
          </svg>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '8px', letterSpacing: '0.5px' }}>
            Pegawai (Perempuan)
          </div>
        </div>
      );
    } else if (gender === 'male') {
      const uLower = username.toLowerCase().trim();
      let label = 'Pegawai (Laki-Laki)';
      let colorClass = 'var(--accent-primary)';
      if (uLower === 'admin') { label = 'Administrator'; colorClass = 'var(--danger)'; }
      else if (uLower === 'owner') { label = 'Owner / Pemilik'; colorClass = 'var(--warning)'; }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0' }}>
          <svg width="64" height="64" viewBox="0 0 100 100" style={{ borderRadius: '50%', backgroundColor: 'var(--accent-light)', border: `2.5px solid ${colorClass}`, boxShadow: '0 6px 16px rgba(212,163,115,0.25)' }}>
            <path d="M20,45 C20,20 80,20 80,45 C80,45 85,35 75,30 C65,25 35,25 25,30 C15,35 20,45 20,45 Z" fill="#3d2712" />
            <circle cx="50" cy="54" r="28" fill="#ffe0cc" />
            <circle cx="40" cy="52" r="3" fill="#1f1209" />
            <circle cx="60" cy="52" r="3" fill="#1f1209" />
            <path d="M44,63 Q50,68 56,63" stroke="#8c3a00" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M25,44 C35,38 40,42 45,46" stroke="#3d2712" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: colorClass, marginTop: '8px', letterSpacing: '0.5px' }}>
            {label}
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0' }}>
        <svg width="64" height="64" viewBox="0 0 100 100" style={{ borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '2.5px solid var(--text-muted)', opacity: 0.7 }}>
          <circle cx="50" cy="40" r="18" fill="var(--text-muted)" />
          <path d="M25,80 C25,60 40,55 50,55 C60,55 75,60 75,80" fill="var(--text-muted)" />
        </svg>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.5px' }}>
          Masukkan Username...
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 50%, var(--bg-tertiary) 0%, var(--bg-primary) 100%)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '90px',
            height: '90px',
            borderRadius: '24px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(139, 90, 43, 0.15)',
            border: '2px solid var(--border-color)',
            overflow: 'hidden',
            padding: '6px'
          }}>
            <img src="/tempe-lintang.png" alt="Logo Tempe Lintang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>Tempe Lintang</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Sistem Informasi Akuntansi &bull; Log Masuk
          </p>
        </div>

        {/* Dynamic Avatar Preview */}
        {renderLoginAvatar()}

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px', padding: '12px 16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                style={{ paddingLeft: '44px', width: '100%' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                style={{ paddingLeft: '44px', width: '100%' }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : (
              <>
                <span>Masuk Ke Sistem</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Sistem Informasi Akuntansi &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

export default Login;
