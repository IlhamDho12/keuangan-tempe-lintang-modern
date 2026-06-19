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
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'owner', 'pegawai'], color: '#f4a261' },
    { path: '/journals', label: 'Jurnal Umum', icon: BookOpen, roles: ['admin', 'owner'], color: '#70e000' },
    { path: '/ledger', label: 'Buku Besar', icon: Wallet, roles: ['admin', 'owner'], color: '#e9c46a' },
    { path: '/trial-balance', label: 'Neraca Saldo', icon: BarChart3, roles: ['admin', 'owner'], color: '#4a90e2' },
    { path: '/income-statement', label: 'Laba Rugi', icon: Receipt, roles: ['admin', 'owner'], color: '#ff6b35' },
    { path: '/salaries', label: 'Gaji Pegawai', icon: Wallet, roles: ['admin', 'owner', 'pegawai'], color: '#ffb703' },
    { path: '/accounts', label: 'Daftar Akun', icon: Settings, roles: ['admin', 'owner'], color: '#818cf8' },
    { path: '/users', label: 'Manajemen User', icon: Users, roles: ['admin'], color: '#0ea5e9' },
  ];

  // SVG Tempe Logo block
  const TempeLogo = () => (
    <svg width="42" height="42" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 10px rgba(139, 90, 43, 0.2))' }}>
      <path d="M40 140 C20 90, 80 30, 150 40 C170 80, 150 150, 80 160 Z" fill="#5c8001" />
      <path d="M40 140 C55 105, 95 65, 150 40" stroke="#7cb603" strokeWidth="6" strokeLinecap="round" />
      <rect x="60" y="60" width="100" height="90" rx="16" fill="#fcfaf2" stroke="#ebdcc9" strokeWidth="4" transform="rotate(-5 110 105)" />
      <ellipse cx="95" cy="90" rx="14" ry="8" fill="#d4a373" transform="rotate(30 95 90)" />
      <ellipse cx="93" cy="87" rx="6" ry="3" fill="#ebdcc9" transform="rotate(30 95 90)" />
      <ellipse cx="130" cy="100" rx="12" ry="7" fill="#bc8a5f" transform="rotate(-15 130 100)" />
      <ellipse cx="105" cy="125" rx="15" ry="9" fill="#d4a373" transform="rotate(45 105 125)" />
      <ellipse cx="135" cy="130" rx="11" ry="6" fill="#bc8a5f" transform="rotate(10 135 130)" />
      <path d="M75 75 C85 85, 90 75, 100 80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M120 75 C115 90, 130 85, 145 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M75 115 C85 110, 80 130, 90 135" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
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
    if (gender === 'female') {
      return (
        <svg width="40" height="40" viewBox="0 0 100 100" style={{ borderRadius: '50%', backgroundColor: 'var(--success-light)', border: '2px solid var(--success)', flexShrink: 0 }}>
          <path d="M15,55 C15,10 85,10 85,55 C85,60 80,75 80,75 C70,65 60,65 50,75 C40,65 30,65 20,75 C20,75 15,60 15,55 Z" fill="#6e4e37" />
          <circle cx="50" cy="52" r="28" fill="#ffd1b3" />
          <path d="M22,50 C30,30 70,30 78,50 C70,35 30,35 22,50 Z" fill="#543825" />
          <circle cx="40" cy="50" r="3" fill="#331a00" />
          <circle cx="60" cy="50" r="3" fill="#331a00" />
          <path d="M44,60 Q50,65 56,60" stroke="#cc0044" strokeWidth="3" strokeLinecap="round" fill="none" />
          <circle cx="34" cy="55" r="4" fill="#ff9999" opacity="0.6" />
          <circle cx="66" cy="55" r="4" fill="#ff9999" opacity="0.6" />
        </svg>
      );
    }
    return (
      <svg width="40" height="40" viewBox="0 0 100 100" style={{ borderRadius: '50%', backgroundColor: 'var(--accent-light)', border: '2px solid var(--accent-primary)', flexShrink: 0 }}>
        <path d="M20,45 C20,20 80,20 80,45 C80,45 85,35 75,30 C65,25 35,25 25,30 C15,35 20,45 20,45 Z" fill="#3d2712" />
        <circle cx="50" cy="54" r="28" fill="#ffe0cc" />
        <circle cx="40" cy="52" r="3" fill="#1f1209" />
        <circle cx="60" cy="52" r="3" fill="#1f1209" />
        <path d="M44,63 Q50,68 56,63" stroke="#8c3a00" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M25,44 C35,38 40,42 45,46" stroke="#3d2712" strokeWidth="4" strokeLinecap="round" />
      </svg>
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
