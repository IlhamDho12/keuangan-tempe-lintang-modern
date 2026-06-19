import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatRupiah, useAuth } from '../App';
import { PlusCircle, Search, Edit2, Trash2, Calendar, FileSpreadsheet, X } from 'lucide-react';

function SalaryList() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Filters
  const [selectedUserId, setSelectedUserId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'admin';
  const isOwner = user?.role === 'owner';
  const isPegawai = user?.role === 'pegawai';

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const qParams = new URLSearchParams();
      if (selectedUserId) qParams.append('user_id', selectedUserId);
      if (month) qParams.append('month', month);
      else if (year) qParams.append('year', year);

      const res = await apiFetch(`/api/salaries?${qParams.toString()}`);
      setSalaries(res.salaries);
      if (res.employees) {
        setEmployees(res.employees);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedUserId('');
    setMonth('');
    setYear('');
    setTimeout(() => {
      fetchSalaries();
    }, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data penggajian ini? Jurnal beban gaji otomatis terkait juga akan dihapus.')) return;

    try {
      const res = await apiFetch(`/api/salaries/${id}`, { method: 'DELETE' });
      setSuccess(res.message);
      setSalaries(prev => prev.filter(s => s.id !== id));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Gaji Pegawai</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isPegawai ? 'Histori slip gaji Anda' : 'Kelola penggajian pegawai dan integrasi pencatatan jurnal umum'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/salaries/new" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Bayar Gaji Baru</span>
          </Link>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters (hanya admin/owner yang bisa filter pegawai) */}
      {!isPegawai && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
          <form onSubmit={fetchSalaries} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Filter Pegawai</label>
              <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                <option value="">-- Semua Pegawai --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Filter Bulan (Berdasarkan Bulan)</label>
              <input 
                type="month" 
                value={month} 
                onChange={e => { setMonth(e.target.value); setYear(''); }} 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Filter Tahun (Berdasarkan Tahun)</label>
              <input 
                type="number" 
                min="2020" 
                max="2035" 
                value={year} 
                onChange={e => { setYear(e.target.value); setMonth(''); }} 
                placeholder="Contoh: 2026"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Search size={16} />
                <span>Filter</span>
              </button>
              <button type="button" onClick={handleReset} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat histori gaji...</h3></div>
      ) : salaries.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Belum ada data slip gaji.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  {!isPegawai && <th>Nama Pegawai</th>}
                  <th>Keterangan / Periode</th>
                  <th style={{ textAlign: 'right' }}>Jumlah Gaji</th>
                  {isAdmin && <th style={{ textAlign: 'center', width: '120px' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal) => (
                  <tr key={sal.id}>
                    <td>{sal.date}</td>
                    {!isPegawai && <td style={{ fontWeight: 'bold' }}>{sal.uname}</td>}
                    <td>{sal.note || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                      {formatRupiah(sal.amount)}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link to={`/salaries/edit/${sal.id}`} className="btn btn-secondary" style={{ padding: '8px' }} title="Edit">
                            <Edit2 size={14} />
                          </Link>
                          <button onClick={() => handleDelete(sal.id)} className="btn btn-danger" style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
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

export default SalaryList;
