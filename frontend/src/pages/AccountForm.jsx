import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../App';
import { Save, ArrowLeft } from 'lucide-react';

function AccountForm() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [normal, setNormal] = useState('debit');
  const [type, setType] = useState('Asset');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError('Kode dan Nama Akun wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          normal,
          type
        })
      });
      navigate('/accounts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => navigate('/accounts')} className="btn btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>Tambah Akun Baru</h1>
          <p style={{ color: 'var(--text-muted)' }}>Definisikan bagan akun COA baru dalam sistem</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
        <div className="form-group">
          <label>Kode Akun</label>
          <input 
            type="text" 
            value={code} 
            onChange={e => setCode(e.target.value)} 
            placeholder="Contoh: 102"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Nama Akun</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Contoh: Piutang Usaha"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Saldo Normal</label>
          <select 
            value={normal} 
            onChange={e => setNormal(e.target.value)}
            disabled={loading}
            required
          >
            <option value="debit">DEBIT</option>
            <option value="credit">KREDIT</option>
          </select>
        </div>

        <div className="form-group">
          <label>Tipe Rekening</label>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            disabled={loading}
            required
          >
            <option value="Asset">Asset (Aset / Harta)</option>
            <option value="Liability">Liability (Hutang / Kewajiban)</option>
            <option value="Equity">Equity (Modal / Ekuitas)</option>
            <option value="Revenue">Revenue (Pendapatan)</option>
            <option value="Expense">Expense (Beban Pengeluaran)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <Link to="/accounts" className="btn btn-secondary">
            Batal
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} />
            <span>{loading ? 'Menyimpan...' : 'Simpan Akun'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default AccountForm;
