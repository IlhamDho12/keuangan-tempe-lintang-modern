import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { User, LogIn } from 'lucide-react';

async function readJsonResponse(response) {
  const body = await response.text();
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`Server mengembalikan respons tidak valid (HTTP ${response.status}).`);
  }
}

function Login() {
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    let active = true;

    fetch('/api/auth/users')
      .then(async (res) => {
        const data = await readJsonResponse(res);
        if (!res.ok) {
          throw new Error(data.message || 'Gagal memuat daftar pengguna.');
        }
        if (!Array.isArray(data)) {
          throw new Error('Server mengirim format daftar pengguna yang tidak valid.');
        }
        if (active) setUsers(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoadingUsers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedUser = selectedRole === 'pegawai'
      ? users.find((user) => String(user.id) === selectedEmployeeId)
      : users.find((user) => user.role === selectedRole);

    if (!selectedUser) {
      setError(selectedRole === 'pegawai'
        ? 'Pilih nama pegawai untuk melanjutkan.'
        : 'Pilih peran pengguna untuk melanjutkan.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      });

      const data = await readJsonResponse(res);
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal.');
      }

      login(data.user, data.token);
      localStorage.removeItem('writeAccess');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            overflow: 'hidden'
          }}>
            <img src="/tempe-lintang.png" alt="Logo Tempe Lintang" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>Tempe Lintang</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            Sistem Informasi Akuntansi &bull; Log Masuk
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px', padding: '12px 16px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="role">Jenis Pengguna</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedEmployeeId('');
                }}
                style={{ paddingLeft: '44px', width: '100%' }}
                disabled={loading || loadingUsers || users.length === 0}
              >
                <option value="">{loadingUsers ? 'Memuat pengguna...' : 'Pilih peran pengguna'}</option>
                {['admin', 'owner', 'pegawai'].map((role) => (
                  users.some((user) => user.role === role) && (
                    <option key={role} value={role}>
                      {role === 'pegawai' ? 'Pegawai' : role === 'admin' ? 'Admin' : 'Owner'}
                    </option>
                  )
                ))}
              </select>
            </div>
          </div>

          {selectedRole === 'pegawai' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="employee">Nama Pegawai</label>
              <select
                id="employee"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                style={{ width: '100%' }}
                disabled={loading || loadingUsers}
              >
                <option value="">Pilih nama pegawai</option>
                {users.filter((user) => user.role === 'pegawai').map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}
            disabled={
              loading ||
              loadingUsers ||
              !selectedRole ||
              (selectedRole === 'pegawai' && !selectedEmployeeId)
            }
          >
            {loading ? 'Memproses...' : (
              <>
                <span>Masuk (Akses Baca)</span>
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
