import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiFetch } from '../App';
import { Save, ArrowLeft } from 'lucide-react';

function SalaryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [employees, setEmployees] = useState([]);
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch employees list
      const salaryData = await apiFetch('/api/salaries');
      setEmployees(salaryData.employees || []);

      if (isEdit) {
        // Find salary info in list
        const match = salaryData.salaries.find(s => s.id === parseInt(id));
        if (match) {
          setUserId(match.user_id);
          setDate(match.date);
          setAmount(String(match.amount));
          setNote(match.note);
        } else {
          setError('Data gaji tidak ditemukan.');
        }
      }
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError('Silakan pilih pegawai.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Jumlah gaji harus lebih dari 0.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        user_id: parseInt(userId),
        date,
        amount: parseFloat(amount),
        note: note.trim()
      };

      const url = isEdit ? `/api/salaries/${id}` : '/api/salaries';
      const method = isEdit ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      navigate('/salaries');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => navigate('/salaries')} className="btn btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{isEdit ? 'Ubah Pembayaran Gaji' : 'Bayar Gaji Pegawai'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Input gaji pegawai yang akan dicatat langsung sebagai beban gaji kas
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Pilih Pegawai</label>
          <select 
            value={userId} 
            onChange={e => setUserId(e.target.value)}
            disabled={loading}
            required
          >
            <option value="">-- Pilih Pegawai --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tanggal Pembayaran</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Jumlah Gaji (Rp)</label>
          <input 
            type="number" 
            min="0"
            step="any"
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="Contoh: 2000000"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Keterangan / Catatan (Opsional)</label>
          <textarea 
            value={note} 
            onChange={e => setNote(e.target.value)} 
            placeholder="Contoh: Gaji bulan Agustus 2026"
            rows="3"
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Link to="/salaries" className="btn btn-secondary">
            Batal
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} />
            <span>{loading ? 'Menyimpan...' : 'Simpan Gaji'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default SalaryForm;
