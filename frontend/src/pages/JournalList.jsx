import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatRupiah, useAuth } from '../App';
import { PlusCircle, Search, Edit2, Trash2, Calendar, Filter, X } from 'lucide-react';

function JournalList() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Filters
  const [q, setQ] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [journalRes, accountsRes] = await Promise.all([
        apiFetch(`/api/journals?q=${q}&account_id=${accountId}&date_from=${dateFrom}&date_to=${dateTo}`),
        apiFetch('/api/accounts')
      ]);
      setJournals(journalRes);
      setAccounts(accountsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetFilters = () => {
    setQ('');
    setAccountId('');
    setDateFrom('');
    setDateTo('');
    // Wait for state updates then fetch
    setTimeout(() => {
      fetchData();
    }, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus entri jurnal ini? Transaksi buku besar terkait juga akan dihapus.')) return;
    
    try {
      const res = await apiFetch(`/api/journals/${id}`, { method: 'DELETE' });
      setSuccess(res.message);
      setJournals(prev => prev.filter(j => j.id !== id));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Jurnal Umum</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pencatatan transaksi berpasangan (Double Entry Ledger)</p>
        </div>
        {isAdmin && (
          <Link to="/journals/new" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Buat Jurnal Baru</span>
          </Link>
        )}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Panel */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Pencarian Deskripsi</label>
            <input 
              type="text" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Cari keterangan..." 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Filter Akun</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="">-- Semua Akun --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Tanggal Dari</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Tanggal Sampai</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Search size={16} />
              <span>Cari</span>
            </button>
            <button 
              type="button" 
              onClick={handleResetFilters} 
              className="btn btn-secondary"
              title="Reset Filter"
            >
              <X size={16} />
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat data jurnal...</h3></div>
      ) : journals.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Belum ada entri jurnal yang cocok dengan filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {journals.map((entry) => (
            <div key={entry.id} className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span>{entry.date}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {entry.description}
                  </div>
                </div>
                
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/journals/edit/${entry.id}`} className="btn btn-secondary" style={{ padding: '8px' }} title="Edit Jurnal">
                      <Edit2 size={14} />
                    </Link>
                    <button onClick={() => handleDelete(entry.id)} className="btn btn-danger" style={{ padding: '8px', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} title="Hapus Jurnal">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Journal Lines Table */}
              <div className="table-container" style={{ margin: 0, border: 'none' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ background: 'transparent', padding: '8px 12px', width: '15%' }}>Kode Akun</th>
                      <th style={{ background: 'transparent', padding: '8px 12px', width: '45%' }}>Nama Akun</th>
                      <th style={{ background: 'transparent', padding: '8px 12px', width: '20%', textAlign: 'right' }}>Debit</th>
                      <th style={{ background: 'transparent', padding: '8px 12px', width: '20%', textAlign: 'right' }}>Kredit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines?.map((line, lIdx) => (
                      <tr key={lIdx}>
                        <td style={{ padding: '8px 12px', borderBottom: 'none', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {line.code}
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: 'none', 
                          paddingLeft: line.credit > 0 ? '30px' : '12px',
                          color: 'var(--text-primary)',
                          fontWeight: line.debit > 0 ? '600' : 'normal'
                        }}>
                          {line.name}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: 'none', textAlign: 'right', color: line.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: line.debit > 0 ? '600' : 'normal' }}>
                          {line.debit > 0 ? formatRupiah(line.debit) : '-'}
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: 'none', textAlign: 'right', color: line.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: line.credit > 0 ? '600' : 'normal' }}>
                          {line.credit > 0 ? formatRupiah(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '1px dashed var(--border-color)' }}>
                      <td colSpan={2} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total:</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{formatRupiah(entry.total_debit)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{formatRupiah(entry.total_credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalList;
