import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../App';
import { Trash2, Plus, Save, ArrowLeft } from 'lucide-react';

function JournalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [accounts, setAccounts] = useState([]);
  
  // Lines structure: { account_id, debit, credit }
  const [lines, setLines] = useState([
    { account_id: '', debit: '', credit: '' },
    { account_id: '', debit: '', credit: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
    if (isEdit) {
      fetchJournalEntry();
    }
  }, [id]);

  const fetchAccounts = async () => {
    try {
      const res = await apiFetch('/api/accounts');
      setAccounts(res);
    } catch (err) {
      setError('Gagal memuat COA: ' + err.message);
    }
  };

  const fetchJournalEntry = async () => {
    try {
      const res = await apiFetch(`/api/journals`);
      // Find current journal entry in list since backend returns them all
      const entry = res.find(j => j.id === parseInt(id));
      if (!entry) {
        setError('Entri jurnal tidak ditemukan.');
        return;
      }
      setDate(entry.date);
      setDescription(entry.description);
      // Map to form lines structure
      const entryLines = entry.lines.map(line => ({
        account_id: line.account_id,
        debit: line.debit > 0 ? String(line.debit) : '',
        credit: line.credit > 0 ? String(line.credit) : ''
      }));
      setLines(entryLines);
    } catch (err) {
      setError('Gagal memuat entri jurnal: ' + err.message);
    }
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    
    // Clear opposite field to enforce single entry rule per line
    if (field === 'debit' && parseFloat(value) > 0) {
      updated[index]['credit'] = '';
    } else if (field === 'credit' && parseFloat(value) > 0) {
      updated[index]['debit'] = '';
    }
    
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', debit: '', credit: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) {
      alert('Minimal harus ada 2 baris jurnal.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let debitTotal = 0;
    let creditTotal = 0;
    lines.forEach(l => {
      debitTotal += parseFloat(l.debit) || 0;
      creditTotal += parseFloat(l.credit) || 0;
    });
    return { debitTotal, creditTotal };
  };

  const { debitTotal, creditTotal } = calculateTotals();
  const isBalanced = Math.round(debitTotal * 100) === Math.round(creditTotal * 100) && debitTotal > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Keterangan wajib diisi.');
      return;
    }
    if (lines.length < 2) {
      setError('Jurnal wajib memiliki minimal 2 baris pencatatan.');
      return;
    }

    // Validate balance
    if (!isBalanced) {
      setError(`Jurnal tidak seimbang. Total Debit: ${debitTotal}, Total Kredit: ${creditTotal}`);
      return;
    }

    // Validate account selections
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].account_id) {
        setError(`Silakan pilih akun pada baris ke-${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        date,
        description: description.trim(),
        lines: lines.map(line => ({
          account_id: parseInt(line.account_id),
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0
        }))
      };

      const url = isEdit ? `/api/journals/${id}` : '/api/journals';
      const method = isEdit ? 'PUT' : 'POST';

      await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
      });

      navigate('/journals');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={() => navigate('/journals')} className="btn btn-secondary" style={{ padding: '10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ margin: 0 }}>{isEdit ? 'Ubah Entri Jurnal' : 'Entri Jurnal Baru'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isEdit ? 'Perbarui detail transaksi keuangan' : 'Input pencatatan transaksi debit/kredit seimbang'}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Tanggal Transaksi</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required
              disabled={loading}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Keterangan / Deskripsi Transaksi</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Contoh: Pembelian bahan baku tempe"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Lines Section */}
        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
          Baris Detail Jurnal
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lines.map((line, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
              <select
                value={line.account_id}
                onChange={e => handleLineChange(idx, 'account_id', e.target.value)}
                disabled={loading}
                required
                style={{ width: '100%' }}
              >
                <option value="">-- Pilih Akun --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="any"
                value={line.debit}
                onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                placeholder="Debit"
                disabled={loading}
                style={{ width: '100%', textAlign: 'right' }}
              />

              <input
                type="number"
                min="0"
                step="any"
                value={line.credit}
                onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                placeholder="Kredit"
                disabled={loading}
                style={{ width: '100%', textAlign: 'right' }}
              />

              <button
                type="button"
                onClick={() => removeLine(idx)}
                className="btn btn-secondary"
                disabled={loading || lines.length <= 2}
                style={{ padding: '12px', border: '1px solid var(--danger)', color: 'var(--danger)', backgroundColor: 'transparent' }}
                title="Hapus baris"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="btn btn-secondary"
          disabled={loading}
          style={{ marginTop: '16px', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Tambah Baris</span>
        </button>

        {/* Footer Summary / Totals */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: 'var(--bg-tertiary)', 
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Debit:</span>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(debitTotal)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Kredit:</span>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(creditTotal)}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isBalanced ? 'var(--success)' : 'var(--danger)' }}>
              {isBalanced ? 'Status: Balance (Seimbang)' : 'Status: Tidak Seimbang'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button 
            type="button" 
            onClick={() => navigate('/journals')} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Batal
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !isBalanced}
            style={{ opacity: (!isBalanced) ? 0.6 : 1 }}
          >
            <Save size={16} />
            <span>{loading ? 'Menyimpan...' : 'Simpan Jurnal'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default JournalForm;
