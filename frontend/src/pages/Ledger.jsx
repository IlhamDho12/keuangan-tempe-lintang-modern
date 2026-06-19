import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah } from '../App';
import { Wallet, Search, Calendar, X } from 'lucide-react';

function Ledger() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [activeAccount, setActiveAccount] = useState(null);
  const [rows, setRows] = useState([]);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [q, setQ] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // First fetch ledger with default account (usually Kas 101)
      const res = await apiFetch('/api/reports/ledger');
      setAccounts(res.accounts);
      setRows(res.rows);
      setActiveAccount(res.activeAccount);
      setSelectedAccountId(res.activeAccount?.id || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLedger = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        account_id: selectedAccountId,
        date_from: dateFrom,
        date_to: dateTo,
        q: q
      });
      const res = await apiFetch(`/api/reports/ledger?${queryParams.toString()}`);
      setRows(res.rows);
      setActiveAccount(res.activeAccount);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setQ('');
    setTimeout(() => {
      handleFetchLedger();
    }, 0);
  };

  // Calculate Running Balance
  const calculateRunningBalance = () => {
    if (!activeAccount) return [];
    
    const normal = activeAccount.normal; // 'debit' or 'credit'
    let currentBalance = 0;
    
    return rows.map(row => {
      const debit = parseFloat(row.debit) || 0;
      const credit = parseFloat(row.credit) || 0;
      
      if (normal === 'debit') {
        currentBalance = currentBalance + debit - credit;
      } else {
        currentBalance = currentBalance + credit - debit;
      }
      
      return {
        ...row,
        balance: currentBalance
      };
    });
  };

  const ledgerRows = calculateRunningBalance();

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Buku Besar (Ledger)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Histori pencatatan saldo berjalan per rekening akun</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter and selector */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <form onSubmit={handleFetchLedger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Pilih Rekening Akun</label>
            <select 
              value={selectedAccountId} 
              onChange={e => setSelectedAccountId(e.target.value)}
              required
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name} ({acc.normal})
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

          <div className="form-group" style={{ margin: 0 }}>
            <label>Pencarian Keterangan</label>
            <input 
              type="text" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              placeholder="Cari deskripsi..."
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Search size={16} />
              <span>Tampilkan</span>
            </button>
            <button type="button" onClick={handleReset} className="btn btn-secondary" title="Reset filter">
              <X size={16} />
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat data buku besar...</h3></div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          {activeAccount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{activeAccount.code} - {activeAccount.name}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Tipe: {activeAccount.type} &bull; Saldo Normal: {activeAccount.normal.toUpperCase()}
                </span>
              </div>
              <div className="glass-panel" style={{ padding: '12px 20px', background: 'var(--bg-tertiary)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', textTransform: 'uppercase' }}>Saldo Akhir</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>
                  {ledgerRows.length > 0 ? formatRupiah(ledgerRows[ledgerRows.length - 1].balance) : formatRupiah(0)}
                </span>
              </div>
            </div>
          )}

          {ledgerRows.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Belum ada histori transaksi untuk akun ini pada periode yang dipilih.</p>
          ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Tanggal</th>
                    <th style={{ width: '40%' }}>Keterangan Transaksi</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Debit</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Kredit</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.date}</td>
                      <td style={{ fontWeight: 500 }}>{row.description}</td>
                      <td style={{ textAlign: 'right', color: row.debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.debit > 0 ? formatRupiah(row.debit) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: row.credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.credit > 0 ? formatRupiah(row.credit) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                        {formatRupiah(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Ledger;
