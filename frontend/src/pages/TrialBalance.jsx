import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah } from '../App';
import { BarChart3, Search, Calendar, ChevronRight } from 'lucide-react';

function TrialBalance() {
  const [rows, setRows] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Account detail drill-down
  const [detailAccountId, setDetailAccountId] = useState(0);
  const [detailAccount, setDetailAccount] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrialBalance();
  }, []);

  const fetchTrialBalance = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const qParams = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo
      });
      const res = await apiFetch(`/api/reports/trial-balance?${qParams.toString()}`);
      setRows(res);
      
      // If a drill-down account was open, refresh it too
      if (detailAccountId > 0) {
        fetchAccountDetail(detailAccountId);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetail = async (accId) => {
    setDetailLoading(true);
    try {
      const qParams = new URLSearchParams({
        account_id: accId,
        date_from: dateFrom,
        date_to: dateTo
      });
      const res = await apiFetch(`/api/reports/ledger?${qParams.toString()}`);
      setDetailAccount(res.activeAccount);
      setDetailRows(res.rows);
      setDetailAccountId(accId);
    } catch (err) {
      setError('Gagal memuat detail akun: ' + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setDetailAccountId(0);
    setDetailAccount(null);
    setDetailRows([]);
    setTimeout(() => {
      fetchTrialBalance();
    }, 0);
  };

  // Calculate totals
  const totals = rows.reduce((acc, row) => {
    acc.debit += row.total_debit;
    acc.credit += row.total_credit;
    return acc;
  }, { debit: 0, credit: 0 });

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Neraca Saldo (Trial Balance)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Saldo debit dan kredit akumulatif dari semua bagan akun (COA)</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Date Filter */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <form onSubmit={fetchTrialBalance} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label>Tanggal Mulai</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)} 
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label>Tanggal Selesai</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)} 
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary">
              <Search size={16} />
              <span>Filter Periode</span>
            </button>
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat data neraca saldo...</h3></div>
      ) : (
        <div>
          
          {/* Main Table */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Ringkasan Saldo Akun</h2>
            <div className="table-container" style={{ margin: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th style={{ textAlign: 'right' }}>Total Debit</th>
                    <th style={{ textAlign: 'right' }}>Total Kredit</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr 
                      key={row.id} 
                      onClick={() => fetchAccountDetail(row.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: detailAccountId === row.id ? 'var(--accent-light)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 'bold' }}>{row.code}</td>
                      <td>{row.name}</td>
                      <td style={{ textAlign: 'right', color: row.total_debit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.total_debit > 0 ? formatRupiah(row.total_debit) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: row.total_credit > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {row.total_credit > 0 ? formatRupiah(row.total_credit) : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '16px' }}>TOTAL BALANCE</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-primary)', padding: '16px' }}>{formatRupiah(totals.debit)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-primary)', padding: '16px' }}>{formatRupiah(totals.credit)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {Math.round(totals.debit * 100) !== Math.round(totals.credit * 100) && (
              <div className="alert alert-danger" style={{ marginTop: '20px', margin: 0 }}>
                Peringatan: Jumlah total debit dan kredit tidak seimbang. Harap periksa entri jurnal Anda!
              </div>
            )}
          </div>

          {/* Drill-down Detail Modal */}
          {detailAccountId > 0 && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => { setDetailAccountId(0); setDetailAccount(null); }}>
              <div className="glass-panel" style={{ 
                padding: '30px', 
                width: '100%', 
                maxWidth: '700px', 
                maxHeight: '80vh', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: 'var(--glass-shadow)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
              }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Detail Transaksi</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {detailAccount?.code} - {detailAccount?.name}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setDetailAccountId(0); setDetailAccount(null); }} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    Tutup
                  </button>
                </div>

                {detailLoading ? (
                  <p>Memuat detail transaksi...</p>
                ) : detailRows.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Tidak ada histori transaksi pada periode ini.</p>
                ) : (
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <div className="table-container" style={{ margin: 0, border: 'none' }}>
                      <table style={{ fontSize: '0.9rem' }}>
                        <thead>
                          <tr>
                            <th>Tanggal</th>
                            <th>Keterangan</th>
                            <th style={{ textAlign: 'right' }}>D/K</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailRows.map((line, idx) => (
                            <tr key={idx}>
                              <td>{line.date}</td>
                              <td style={{ fontWeight: 500 }}>{line.description}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {line.debit > 0 ? (
                                  <span style={{ color: 'var(--success)' }}>{formatRupiah(line.debit)} (D)</span>
                                ) : (
                                  <span style={{ color: 'var(--accent-primary)' }}>{formatRupiah(line.credit)} (K)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export default TrialBalance;
