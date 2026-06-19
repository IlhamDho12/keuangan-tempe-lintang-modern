import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, useAuth } from '../App';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

function UserList() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/users');
      setUsers(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      alert('Anda tidak bisa menghapus akun sendiri.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;

    try {
      const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      setSuccess(res.message);
      setUsers(prev => prev.filter(u => u.id !== id));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Manajemen User</h1>
          <p style={{ color: 'var(--text-muted)' }}>Kelola kredensial login dan tingkat hak akses pengguna aplikasi</p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Tambah Pengguna</span>
        </Link>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat data pengguna...</h3></div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Username</th>
                  <th style={{ width: '35%' }}>Nama Lengkap</th>
                  <th style={{ width: '20%' }}>Peran Hak Akses</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        backgroundColor: u.role === 'admin' ? 'var(--danger-light)' : u.role === 'owner' ? 'var(--warning-light)' : 'var(--success-light)',
                        color: u.role === 'admin' ? 'var(--danger)' : u.role === 'owner' ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Link to={`/users/edit/${u.id}`} className="btn btn-secondary" style={{ padding: '8px' }} title="Edit">
                          <Edit size={14} />
                        </Link>
                        {u.id !== currentUser.id && u.role !== 'admin' && (
                          <button onClick={() => handleDelete(u.id)} className="btn btn-danger" style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;
