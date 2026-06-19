import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah } from '../App';
import { Search, Calendar, ChevronRight, TrendingUp } from 'lucide-react';

function IncomeStatement() {
  const [data, setData] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Drill-down
  const [detailAccountId, setDetailAccountId] = useState(0);
  const [detailAccount, setDetailAccount] = useState(null);
  const [detailRows, setDetailRows] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIncomeStatement();
  }, []);

  const fetchIncomeStatement = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const qParams = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo
      });
      const res = await apiFetch(`/api/reports/income-statement?${qParams.toString()}`);
      setData(res);

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
      fetchIncomeStatement();
    }, 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Laporan Laba Rugi (Income Statement)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Akumulasi nominal Pendapatan dikurangi total Beban pengeluaran</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Date Filter */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        <form onSubmit={fetchIncomeStatement} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'end' }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat laporan laba rugi...</h3></div>
      ) : (
        <div>
          
          {/* Main Statement Sheet */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            {/* 1. Revenues Section */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--success)' }}>1. Pendapatan (Revenues)</h2>
            <div className="table-container" style={{ margin: 0, marginBottom: '24px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.revenues?.map((r) => (
                    <tr 
                      key={r.id} 
                      onClick={() => fetchAccountDetail(r.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: detailAccountId === r.id ? 'var(--accent-light)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 'bold' }}>{r.code}</td>
                      <td>{r.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(r.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  ))}
                  {data?.revenues?.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada pendapatan terdeteksi.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                    <td colSpan={2}>TOTAL PENDAPATAN</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatRupiah(data?.totalRevenue)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 2. Expenses Section */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--danger)' }}>2. Beban Pengeluaran (Expenses)</h2>
            <div className="table-container" style={{ margin: 0, marginBottom: '30px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Akun</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.expenses?.map((e) => (
                    <tr 
                      key={e.id} 
                      onClick={() => fetchAccountDetail(e.id)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: detailAccountId === e.id ? 'var(--accent-light)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 'bold' }}>{e.code}</td>
                      <td>{e.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatRupiah(e.total)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                      </td>
                    </tr>
                  ))}
                  {data?.expenses?.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada beban terdeteksi.</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }}>
                    <td colSpan={2}>TOTAL BEBAN</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{formatRupiah(data?.totalExpense)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 3. Net Summary */}
            <div className="glass-panel" style={{ 
              padding: '24px', 
              background: data?.netIncome >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
              border: `1px solid ${data?.netIncome >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STATUS KEUANGAN</span>
                <h2 style={{ fontSize: '1.5rem', margin: '4px 0 0 0', color: data?.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {data?.netIncome >= 0 ? 'LABA BERSIH' : 'RUGI BERSIH'}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL AKHIR</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: data?.netIncome >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatRupiah(Math.abs(data?.netIncome))}
                </div>
              </div>
            </div>
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

export default IncomeStatement;
