import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../App';
import { Save, ArrowLeft } from 'lucide-react';

function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('pegawai');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchUserDetail();
    }
  }, [id]);

  const fetchUserDetail = async () => {
    setLoading(true);
    try {
      const users = await apiFetch('/api/users');
      const match = users.find(u => u.id === parseInt(id));
      if (match) {
        setUsername(match.username);
        setName(match.name);
        setRole(match.role);
      } else {
        setError('Pengguna tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal memuat pengguna: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !role) {
      setError('Username, Nama, dan Peran wajib diisi.');
      return;
    }
    if (!isEdit && !password) {
      setError('Password wajib diisi untuk pengguna baru.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        username: username.trim(),
        name: name.trim(),
        role
      };
      if (password) {
        payload.password = password;
      }

      const url = isEdit ? `/api/users/${id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      navigate('/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => navigate('/users')} className="btn btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{isEdit ? 'Ubah Pengguna' : 'Tambah Pengguna Baru'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Definisikan kredensial login dan tingkatan peran akun baru</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Contoh: pegawai4"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Nama Lengkap</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Contoh: Adi Wijaya"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Peran Hak Akses</label>
          <select 
            value={role} 
            onChange={e => setRole(e.target.value)}
            disabled={loading}
            required
          >
            <option value="pegawai">PEGAWAI</option>
            <option value="owner">OWNER</option>
            <option value="admin">ADMIN</option>
          </select>
        </div>

        <div className="form-group">
          <label>{isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Kunci'}</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder={isEdit ? 'Masukkan password baru' : 'Masukkan password login'}
            disabled={loading}
            required={!isEdit}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Link to="/users" className="btn btn-secondary">
            Batal
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} />
            <span>{loading ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
