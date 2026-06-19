import React, { useState, useEffect } from 'react';
import { apiFetch, formatRupiah, useAuth } from '../App';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, AlertCircle, FileSpreadsheet, ArrowUpRight, Award
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/dashboard');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><h3>Memuat data dashboard...</h3></div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={20} />
        <span>Gagal memuat dashboard: {error}</span>
      </div>
    );
  }

  // PEGAWAI DASHBOARD VIEW
  if (data?.role === 'pegawai') {
    return (
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>Halo, {user?.name}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ini adalah ringkasan penerimaan gaji pribadi Anda.</p>
        </div>

        <div className="card-grid">
          <div className="glass-panel kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gaji Terakhir Diterima</span>
              <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0' }}>
                {data.lastSalary ? formatRupiah(data.lastSalary.amount) : 'Belum ada data'}
              </h2>
              {data.lastSalary && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Tanggal: {data.lastSalary.date}
                </span>
              )}
            </div>
          </div>

          <div className="glass-panel kpi-card">
            <div className="kpi-icon" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              <Award size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pendapatan Tahun Ini (YTD)</span>
              <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0' }}>
                {formatRupiah(data.ytdSalary)}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Periode: Januari - Desember {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Histori Slip Gaji Terbaru</span>
          </h2>
          {data.recentSalaries?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Belum ada histori penggajian.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Jumlah Gaji</th>
                    <th>Keterangan / Bulan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSalaries.map((sal, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{sal.date}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatRupiah(sal.amount)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{sal.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN / OWNER DASHBOARD VIEW
  const chartLabels = data?.chartData?.map(d => d.label) || [];
  const chartRevenue = data?.chartData?.map(d => d.revenue) || [];
  const chartExpense = data?.chartData?.map(d => d.expense) || [];
  const chartLaba = data?.chartData?.map(d => d.revenue - d.expense) || [];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-secondary)',
          font: { family: 'Outfit', size: 12, weight: 600 }
        }
      },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', weight: 'bold' },
        bodyFont: { family: 'Outfit' },
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: ${formatRupiah(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'transparent' },
        ticks: { color: 'var(--text-muted)', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'var(--border-color)' },
        ticks: { 
          color: 'var(--text-muted)', 
          font: { family: 'Outfit' },
          callback: function(val) {
            if (val >= 1000000) return (val / 1000000) + ' Jt';
            if (val >= 1000) return (val / 1000) + ' Rb';
            return val;
          }
        }
      }
    }
  };

  const chartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Pendapatan',
        data: chartRevenue,
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Beban',
        data: chartExpense,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderRadius: 6,
      },
      {
        label: 'Laba / Rugi Bersih',
        data: chartLaba,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6,
      }
    ]
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ marginBottom: '8px' }}>Dashboard Ringkasan</h1>
        <p style={{ color: 'var(--text-muted)' }}>Sistem Informasi Keuangan Tempe Lintang &bull; Periode Berjalan</p>
      </div>

      {/* KPI Cards */}
      <div className="card-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Saldo Kas Aktual</span>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0' }}>{formatRupiah(data?.cashBalance)}</h2>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Pendapatan</span>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: 'var(--success)' }}>{formatRupiah(data?.totalRevenue)}</h2>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Beban</span>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: 'var(--danger)' }}>{formatRupiah(data?.totalExpense)}</h2>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon" style={{ 
            backgroundColor: (data?.netIncome >= 0) ? 'var(--success-light)' : 'var(--danger-light)', 
            color: (data?.netIncome >= 0) ? 'var(--success)' : 'var(--danger)' 
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Laba / Rugi Bersih</span>
            <h2 style={{ 
              fontSize: '1.6rem', 
              margin: '4px 0 0 0', 
              color: (data?.netIncome >= 0) ? 'var(--success)' : 'var(--danger)' 
            }}>
              {formatRupiah(data?.netIncome)}
            </h2>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Grafik Pertumbuhan Keuangan (12 Bulan Terakhir)</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
              Perkembangan agregat nilai pendapatan, pengeluaran beban, dan laba bersih per bulan.
            </p>
          </div>
        </div>
        <div style={{ height: '350px', position: 'relative' }}>
          <Bar data={chartConfig} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
