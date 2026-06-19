import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, useAuth } from '../App';
import { Save, ArrowLeft } from 'lucide-react';

function ChangePassword() {
  const navigate = useNavigate();
  const { updateUserInfo } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua bidang wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      
      setSuccess(res.message || 'Password berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setSuccess('');
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>Ganti Password</h1>
          <p style={{ color: 'var(--text-muted)' }}>Perbarui kata sandi login untuk keamanan akun Anda</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '500px' }}>
        <div className="form-group">
          <label>Password Saat Ini</label>
          <input 
            type="password" 
            value={currentPassword} 
            onChange={e => setCurrentPassword(e.target.value)} 
            placeholder="Masukkan password saat ini"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Password Baru (Minimal 6 Karakter)</label>
          <input 
            type="password" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            placeholder="Masukkan password baru"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Konfirmasi Password Baru</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            placeholder="Masukkan kembali password baru"
            disabled={loading}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Link to="/" className="btn btn-secondary">
            Batal
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} />
            <span>{loading ? 'Memproses...' : 'Ubah Password'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
