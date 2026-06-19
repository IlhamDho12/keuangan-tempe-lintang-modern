import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, useAuth } from '../App';
import { PlusCircle, Settings, Award } from 'lucide-react';

function AccountList() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/accounts');
      setAccounts(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Daftar Akun (COA)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Bagan akun standar akuntansi keuangan usaha</p>
        </div>
        {isAdmin && (
          <Link to="/accounts/new" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Tambah Akun</span>
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><h3>Memuat bagan akun...</h3></div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div className="table-container" style={{ margin: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '20%' }}>Kode Akun</th>
                  <th style={{ width: '40%' }}>Nama Rekening Akun</th>
                  <th style={{ width: '20%' }}>Tipe Laporan</th>
                  <th style={{ width: '20%' }}>Saldo Normal</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{acc.code}</td>
                    <td style={{ fontWeight: 600 }}>{acc.name}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        backgroundColor: acc.type === 'Asset' || acc.type === 'Liability' || acc.type === 'Equity' ? 'var(--info-light)' : 'var(--warning-light)',
                        color: acc.type === 'Asset' || acc.type === 'Liability' || acc.type === 'Equity' ? 'var(--info)' : 'var(--warning)'
                      }}>
                        {acc.type}
                      </span>
                    </td>
                    <td style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.8rem', color: acc.normal === 'debit' ? 'var(--success)' : 'var(--accent-primary)' }}>
                      {acc.normal}
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

export default AccountList;
