import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, BarChart3, Receipt, Wallet, Users, Settings, 
  LogOut, LogIn, KeyRound, Sun, Moon, Menu, X, PlusCircle, Trash2, Edit, ChevronRight
} from 'lucide-react';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Provider
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

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
  };

  const updateUserInfo = (name) => {
    if (user) {
      const updated = { ...user, name };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
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
  const { user, logout } = useAuth();
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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'owner', 'pegawai'] },
    { path: '/journals', label: 'Jurnal Umum', icon: BookOpen, roles: ['admin', 'owner'] },
    { path: '/ledger', label: 'Buku Besar', icon: Wallet, roles: ['admin', 'owner'] },
    { path: '/trial-balance', label: 'Neraca Saldo', icon: BarChart3, roles: ['admin', 'owner'] },
    { path: '/income-statement', label: 'Laba Rugi', icon: Receipt, roles: ['admin', 'owner'] },
    { path: '/salaries', label: 'Gaji Pegawai', icon: Wallet, roles: ['admin', 'owner', 'pegawai'] },
    { path: '/accounts', label: 'Daftar Akun', icon: Settings, roles: ['admin', 'owner'] },
    { path: '/users', label: 'Manajemen User', icon: Users, roles: ['admin'] },
  ];

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-header glass-panel" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', width: '100%', position: 'sticky', top: 0, zIndex: 20 }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Tempe Lintang</h2>
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
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', justifyContent: 'center' }}>TL</div>
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
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    padding: '12px 16px'
                  }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
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
            <Link 
              to="/change-password" 
              className="btn btn-secondary" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px' }}
              title="Ganti Password"
            >
              <KeyRound size={18} />
            </Link>
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
