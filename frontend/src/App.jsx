import { useState, useEffect, useLayoutEffect, useRef, useCallback, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, BarChart3, Receipt, Wallet, Users, Settings, 
  LogOut, KeyRound, Sun, Moon, Menu, X
} from 'lucide-react';

// Auth Context
const AuthContext = createContext(null);
let writeAccessRequestHandler;

export const useAuth = () => useContext(AuthContext);

// Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [writeAccessDialogOpen, setWriteAccessDialogOpen] = useState(false);
  const [writeAccessError, setWriteAccessError] = useState('');
  const [writeAccessLoading, setWriteAccessLoading] = useState(false);
  const pendingWriteAccess = useRef(null);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('writeAccess');
  };

  const requestWriteAccess = useCallback(() => {
    if (localStorage.getItem('writeAccess')) return Promise.resolve();
    if (pendingWriteAccess.current) {
      setWriteAccessDialogOpen(true);
      return pendingWriteAccess.current.promise;
    }

    setWriteAccessError('');
    setWriteAccessDialogOpen(true);
    let resolveRequest;
    let rejectRequest;
    const promise = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    pendingWriteAccess.current = {
      promise,
      resolve: resolveRequest,
      reject: rejectRequest
    };
    return promise;
  }, []);

  useLayoutEffect(() => {
    writeAccessRequestHandler = requestWriteAccess;
    return () => {
      if (writeAccessRequestHandler === requestWriteAccess) {
        writeAccessRequestHandler = null;
      }
    };
  }, [requestWriteAccess]);

  const cancelWriteAccess = () => {
    setWriteAccessDialogOpen(false);
    setWriteAccessError('');
    if (pendingWriteAccess.current) {
      pendingWriteAccess.current.reject(new Error('Akses tulis dibatalkan.'));
      pendingWriteAccess.current = null;
    }
  };

  const enableWriteAccess = async (accessCode) => {
    setWriteAccessLoading(true);
    setWriteAccessError('');
    try {
      const response = await fetch('/api/auth/enable-writes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ accessCode })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setWriteAccessError(data.message || 'Kode akses tidak dapat diverifikasi.');
        return;
      }

      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('writeAccess', 'true');
      pendingWriteAccess.current?.resolve();
      pendingWriteAccess.current = null;
      setWriteAccessDialogOpen(false);
    } catch (err) {
      setWriteAccessError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setWriteAccessLoading(false);
    }
  };

  const updateUserInfo = (name) => {
    if (user) {
      const updated = { ...user, name };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserInfo, requestWriteAccess }}>
      {children}
      {writeAccessDialogOpen && (
        <WriteAccessModal
          error={writeAccessError}
          loading={writeAccessLoading}
          onClose={cancelWriteAccess}
          onSubmit={enableWriteAccess}
        />
      )}
    </AuthContext.Provider>
  );
}

function WriteAccessModal({ error, loading, onClose, onSubmit }) {
  const [accessCode, setAccessCode] = useState('');

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(24, 15, 9, 0.62)',
        backdropFilter: 'blur(6px)'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-access-title"
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '430px',
          padding: '30px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.28)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '15px',
            color: 'var(--text-primary)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
          }}>
            <KeyRound size={22} />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-secondary"
            aria-label="Tutup dialog kode akses"
            style={{ padding: '8px', borderRadius: '10px' }}
          >
            <X size={18} />
          </button>
        </div>

        <h2 id="write-access-title" style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
          Buka Akses Tulis
        </h2>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Masukkan kode akses untuk menambah, mengubah, atau menghapus data.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(accessCode);
          }}
        >
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="write-access-code">Kode Akses</label>
            <input
              id="write-access-code"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Masukkan kode akses"
              disabled={loading}
              required
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !accessCode}>
              <KeyRound size={16} />
              <span>{loading ? 'Memeriksa...' : 'Buka Akses'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Fetch helper with auth header
export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const requiresWriteAccess = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    && url !== '/api/auth/login'
    && url !== '/api/auth/enable-writes';

  if (requiresWriteAccess) {
    if (!writeAccessRequestHandler) {
      throw new Error('Dialog kode akses belum siap. Silakan coba lagi.');
    }
    await writeAccessRequestHandler();
  }

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('writeAccess');
    window.location.href = '/login';
    throw new Error('Sesi Anda telah habis. Silakan login kembali.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Terjadi kesalahan sistem.');
  }

  return res.json();
}

// Format Rupiah Helper
export function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

// Pages Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JournalList from './pages/JournalList';
import JournalForm from './pages/JournalForm';
import Ledger from './pages/Ledger';
import TrialBalance from './pages/TrialBalance';
import IncomeStatement from './pages/IncomeStatement';
import SalaryList from './pages/SalaryList';
import SalaryForm from './pages/SalaryForm';
import AccountList from './pages/AccountList';
import AccountForm from './pages/AccountForm';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import ChangePassword from './pages/ChangePassword';

// Sidebar Layout Wrapper
function Layout() {
  const { user, logout, requestWriteAccess } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'owner', 'pegawai'], color: '#f4a261' },
    { path: '/journals', label: 'Jurnal Umum', icon: BookOpen, roles: ['admin', 'owner'], color: '#70e000' },
    { path: '/ledger', label: 'Buku Besar', icon: Wallet, roles: ['admin', 'owner'], color: '#e9c46a' },
    { path: '/trial-balance', label: 'Neraca Saldo', icon: BarChart3, roles: ['admin', 'owner'], color: '#4a90e2' },
    { path: '/income-statement', label: 'Laba Rugi', icon: Receipt, roles: ['admin', 'owner'], color: '#ff6b35' },
    { path: '/salaries', label: 'Gaji Pegawai', icon: Wallet, roles: ['admin', 'owner', 'pegawai'], color: '#ffb703' },
    { path: '/accounts', label: 'Daftar Akun', icon: Settings, roles: ['admin', 'owner'], color: '#818cf8' },
    { path: '/users', label: 'Manajemen User', icon: Users, roles: ['admin'], color: '#0ea5e9' },
  ];

  // Tempe Lintang Logo Image
  const TempeLogo = () => (
    <img 
      src="/tempe-lintang.png" 
      alt="Tempe Lintang" 
      style={{ 
        width: '42px', 
        height: '42px', 
        objectFit: 'contain',
        filter: 'drop-shadow(0 2px 5px rgba(139, 90, 43, 0.15))'
      }} 
    />
  );

  // Helper to determine gender profile
  const getGender = (name = '') => {
    const n = name.toLowerCase();
    const femaleNames = ['lisa', 'neti', 'linda', 'yanti', 'meta', 'eli', 'via', 'masdalena', 'ning', 'sri', 'putri', 'dewi', 'liana', 'lusi', 'ani', 'ana', 'ria'];
    if (femaleNames.some(fn => n.includes(fn))) return 'female';
    return 'male';
  };

  const UserAvatar = ({ name }) => {
    const gender = getGender(name);
    const src = gender === 'female' ? '/avatar_female.png' : '/avatar_male.png';
    return (
      <img 
        src={src} 
        alt={name} 
        style={{ 
          width: '38px', 
          height: '38px', 
          borderRadius: '50%', 
          border: gender === 'female' ? '2px solid var(--success)' : '2px solid var(--accent-primary)', 
          flexShrink: 0,
          objectFit: 'cover'
        }} 
      />
    );
  };

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-header glass-panel" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', width: '100%', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TempeLogo />
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Tempe Lintang</h2>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn btn-secondary" style={{ padding: '8px' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-show' : ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        transition: 'transform var(--transition-normal)'
      }}>
        <div>
          <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0 30px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <TempeLogo />
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>Tempe Lintang</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Accounting System</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.filter(item => item.roles.includes(user?.role)).map(item => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path || (item.path !== '/' && window.location.pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setMobileOpen(false)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    justifyContent: 'flex-start',
                    border: 'none',
                    backgroundColor: isActive ? undefined : 'transparent',
                    color: isActive ? '#1e1309' : 'var(--text-secondary)',
                    padding: '12px 16px',
                    fontWeight: isActive ? '700' : '600'
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? '#1e1309' : item.color, filter: isActive ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px' }}>
            <UserAvatar name={user?.name || ''} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
              title="Ganti Tema"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={async () => {
                requestWriteAccess().catch(() => {});
              }}
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
              title="Buka akses tulis"
              aria-label="Buka akses tulis"
            >
              <KeyRound size={18} />
            </button>
            <button 
              onClick={handleLogout} 
              className="btn btn-danger" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
              title="Keluar"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute roles={['admin', 'owner', 'pegawai']}><Dashboard /></ProtectedRoute>} />
          <Route path="/journals" element={<ProtectedRoute roles={['admin', 'owner']}><JournalList /></ProtectedRoute>} />
          <Route path="/journals/new" element={<ProtectedRoute roles={['admin']}><JournalForm /></ProtectedRoute>} />
          <Route path="/journals/edit/:id" element={<ProtectedRoute roles={['admin']}><JournalForm /></ProtectedRoute>} />
          <Route path="/ledger" element={<ProtectedRoute roles={['admin', 'owner']}><Ledger /></ProtectedRoute>} />
          <Route path="/trial-balance" element={<ProtectedRoute roles={['admin', 'owner']}><TrialBalance /></ProtectedRoute>} />
          <Route path="/income-statement" element={<ProtectedRoute roles={['admin', 'owner']}><IncomeStatement /></ProtectedRoute>} />
          <Route path="/salaries" element={<ProtectedRoute roles={['admin', 'owner', 'pegawai']}><SalaryList /></ProtectedRoute>} />
          <Route path="/salaries/new" element={<ProtectedRoute roles={['admin']}><SalaryForm /></ProtectedRoute>} />
          <Route path="/salaries/edit/:id" element={<ProtectedRoute roles={['admin']}><SalaryForm /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute roles={['admin', 'owner']}><AccountList /></ProtectedRoute>} />
          <Route path="/accounts/new" element={<ProtectedRoute roles={['admin', 'owner']}><AccountForm /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><UserList /></ProtectedRoute>} />
          <Route path="/users/new" element={<ProtectedRoute roles={['admin']}><UserForm /></ProtectedRoute>} />
          <Route path="/users/edit/:id" element={<ProtectedRoute roles={['admin']}><UserForm /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute roles={['admin', 'owner', 'pegawai']}><ChangePassword /></ProtectedRoute>} />
        </Routes>
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .app-container {
            flex-direction: column;
          }
          .mobile-header {
            display: flex !important;
          }
          .sidebar {
            position: fixed !important;
            top: 70px !important;
            left: 0 !important;
            width: 100% !important;
            height: calc(100vh - 70px) !important;
            transform: translateX(-100%);
            z-index: 15;
          }
          .sidebar.mobile-show {
            transform: translateX(0);
          }
          .main-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<Layout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
