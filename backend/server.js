const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeuangantempelintang';

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const dbDir = isProduction ? '/tmp' : __dirname;
const DB_PATH = path.join(dbDir, 'database.db');

if (isProduction && !fs.existsSync(DB_PATH)) {
  const sourceDb = path.join(__dirname, 'database.db');
  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, DB_PATH);
  }
}

app.use(cors());
app.use(express.json());

let db;
let dbReady;

// Middleware: wait for DB initialization on cold start
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database belum siap: ' + err.message });
  }
});

// Connect to SQLite
async function initDb() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  console.log(`Database connected at ${DB_PATH}`);

  // Auto-run migrations if tables don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS accounts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT,
      normal TEXT,
      type TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      description TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS journal_lines(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER,
      account_id INTEGER,
      debit REAL,
      credit REAL
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS salaries(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT,
      amount REAL,
      note TEXT,
      journal_entry_id INTEGER
    )
  `);

  // Ensure default admin account exists with username 'admin' and password 'admin123'
  try {
    const defaultAdminHash = await bcrypt.hash('admin123', 10);
    const existingAdmin = await db.get('SELECT * FROM users WHERE username = ?', ['admin']);
    if (!existingAdmin) {
      await db.run(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin', defaultAdminHash, 'Administrator Utama', 'admin']
      );
      console.log('Default admin created: admin / admin123');
    } else {
      await db.run('UPDATE users SET password = ? WHERE username = ?', [defaultAdminHash, 'admin']);
      console.log('Admin password updated: admin / admin123');
    }
  } catch (seedErr) {
    console.error('Error seeding admin account:', seedErr.message);
  }
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa.' });
    req.user = user;
    next();
  });
}

// Role Authorization Middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak. Peran Anda tidak memiliki izin.' });
    }
    next();
  };
}

// Auth Endpoints
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan Password wajib diisi.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ message: 'Username atau Password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau Password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const uid = req.user.id;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Semua bidang wajib diisi.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Konfirmasi password baru tidak cocok.' });
  }

  try {
    const user = await db.get('SELECT password FROM users WHERE id = ?', [uid]);
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password saat ini salah.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [newHash, uid]);

    res.json({ message: 'Password berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Dashboard Endpoints
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  const role = req.user.role;
  const uid = req.user.id;

  try {
    if (role === 'pegawai') {
      // Personal salary details for employees
      const lastSalary = await db.get(
        'SELECT id, date, amount, note FROM salaries WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 1',
        [uid]
      );
      
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;
      const ytdRow = await db.get(
        'SELECT SUM(amount) as ytd FROM salaries WHERE user_id = ? AND date BETWEEN ? AND ?',
        [uid, startOfYear, endOfYear]
      );
      
      const recentSalaries = await db.all(
        'SELECT date, amount, note FROM salaries WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 6',
        [uid]
      );

      return res.json({
        role: 'pegawai',
        lastSalary: lastSalary || null,
        ytdSalary: ytdRow ? (ytdRow.ytd || 0) : 0,
        recentSalaries
      });
    }

    // Admin/Owner Dashboard
    // 1. Cash Balance (Account 101)
    const cashRow = await db.get(
      `SELECT SUM(jl.debit) as d, SUM(jl.credit) as c 
       FROM journal_lines jl 
       JOIN accounts a ON a.id = jl.account_id 
       WHERE a.code = '101'`
    );
    const cashBalance = (cashRow.d || 0) - (cashRow.c || 0);

    // 2. Total Revenue (Revenue accounts)
    const revRow = await db.get(
      `SELECT SUM(jl.credit - jl.debit) as total 
       FROM journal_lines jl 
       JOIN accounts a ON a.id = jl.account_id 
       WHERE a.type = 'Revenue'`
    );
    const totalRevenue = revRow.total || 0;

    // 3. Total Expense (Expense accounts)
    const expRow = await db.get(
      `SELECT SUM(jl.debit - jl.credit) as total 
       FROM journal_lines jl 
       JOIN accounts a ON a.id = jl.account_id 
       WHERE a.type = 'Expense'`
    );
    const totalExpense = expRow.total || 0;

    const netIncome = totalRevenue - totalExpense;

    // 4. Monthly Growth data (last 12 months)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      months.push({ key, label, revenue: 0, expense: 0 });
    }

    const startPeriod = months[0].key + '-01';
    const endPeriod = `${months[11].key}-31`; // Approx end of month

    const monthlyData = await db.all(`
      WITH per AS (
        SELECT strftime('%Y-%m', date) AS ym, a.type AS type,
               SUM(jl.debit) AS d, SUM(jl.credit) AS c
        FROM journal_entries je
        JOIN journal_lines jl ON jl.entry_id = je.id
        JOIN accounts a       ON a.id = jl.account_id
        WHERE date(je.date) BETWEEN date(?) AND date(?)
        GROUP BY ym, type
      )
      SELECT ym,
             SUM(CASE WHEN type='Revenue' THEN c - d ELSE 0 END) AS revenue,
             SUM(CASE WHEN type='Expense' THEN d - c ELSE 0 END) AS expense
      FROM per
      GROUP BY ym
      ORDER BY ym;
    `, [startPeriod, endPeriod]);

    // Map monthly aggregate back
    monthlyData.forEach(row => {
      const match = months.find(m => m.key === row.ym);
      if (match) {
        match.revenue = parseFloat(row.revenue) || 0;
        match.expense = parseFloat(row.expense) || 0;
      }
    });

    res.json({
      role,
      cashBalance,
      totalRevenue,
      totalExpense,
      netIncome,
      chartData: months
    });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Accounts Master CRUD
app.get('/api/accounts', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM accounts ORDER BY code');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.post('/api/accounts', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  const { code, name, normal, type } = req.body;
  if (!code || !name || !normal || !type) {
    return res.status(400).json({ message: 'Semua bidang wajib diisi.' });
  }
  if (!['debit', 'credit'].includes(normal)) {
    return res.status(400).json({ message: 'Kolom Normal harus debit atau credit.' });
  }
  if (!['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(type)) {
    return res.status(400).json({ message: 'Tipe akun tidak valid.' });
  }

  try {
    const existing = await db.get('SELECT id FROM accounts WHERE code = ?', [code]);
    if (existing) {
      return res.status(400).json({ message: 'Kode akun sudah digunakan.' });
    }
    await db.run('INSERT INTO accounts(code, name, normal, type) VALUES(?, ?, ?, ?)', [
      code, name, normal, type
    ]);
    res.status(201).json({ message: 'Akun berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Journal Endpoints
app.get('/api/journals', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  const { q, account_id, date_from, date_to } = req.query;
  const where = [];
  const params = [];

  if (q) {
    where.push('je.description LIKE ?');
    params.push(`%${q}%`);
  }
  if (date_from) {
    where.push('je.date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    where.push('je.date <= ?');
    params.push(date_to);
  }
  if (account_id) {
    where.push('EXISTS (SELECT 1 FROM journal_lines x WHERE x.entry_id = je.id AND x.account_id = ?)');
    params.push(parseInt(account_id));
  }

  let sql = `
    SELECT je.id, je.date, je.description,
           SUM(jl.debit) AS total_debit,
           SUM(jl.credit) AS total_credit
    FROM journal_entries je
    JOIN journal_lines jl ON jl.entry_id = je.id
  `;

  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  sql += ' GROUP BY je.id ORDER BY je.date DESC, je.id DESC';

  try {
    const entries = await db.all(sql, params);
    
    // Fetch details for each entry
    if (entries.length > 0) {
      const entryIds = entries.map(e => e.id);
      const placeHolders = entryIds.map(() => '?').join(',');
      const lines = await db.all(`
        SELECT jl.*, a.code, a.name 
        FROM journal_lines jl
        JOIN accounts a ON a.id = jl.account_id
        WHERE jl.entry_id IN (${placeHolders})
        ORDER BY jl.id ASC
      `, entryIds);

      entries.forEach(entry => {
        entry.lines = lines.filter(line => line.entry_id === entry.id);
      });
    }

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.post('/api/journals', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { date, description, lines } = req.body;
  if (!date || !description || !lines || lines.length < 2) {
    return res.status(400).json({ message: 'Tanggal, Keterangan, dan minimal 2 baris jurnal wajib diisi.' });
  }

  // Validate balance
  let totalDebit = 0;
  let totalCredit = 0;
  const parsedLines = [];

  for (const line of lines) {
    const account_id = parseInt(line.account_id);
    const debit = parseFloat(line.debit) || 0;
    const credit = parseFloat(line.credit) || 0;

    if (!account_id) {
      return res.status(400).json({ message: 'Semua baris harus memilih akun.' });
    }
    if (debit > 0 && credit > 0) {
      return res.status(400).json({ message: 'Satu baris tidak boleh diisi debit dan kredit sekaligus.' });
    }
    if (debit === 0 && credit === 0) {
      return res.status(400).json({ message: 'Setiap baris harus memiliki nominal debit atau kredit.' });
    }

    totalDebit += debit;
    totalCredit += credit;
    parsedLines.push({ account_id, debit, credit });
  }

  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    return res.status(400).json({ message: 'Total debit dan kredit harus seimbang (balance).' });
  }

  try {
    // Transaction block manually since we need async
    await db.run('BEGIN TRANSACTION');
    
    const entryResult = await db.run(
      'INSERT INTO journal_entries(date, description) VALUES(?, ?)',
      [date, description]
    );
    const entryId = entryResult.lastID;

    for (const pLine of parsedLines) {
      await db.run(
        'INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)',
        [entryId, pLine.account_id, pLine.debit, pLine.credit]
      );
    }

    await db.run('COMMIT');
    res.status(201).json({ message: 'Jurnal berhasil disimpan.', entryId });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.put('/api/journals/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const entryId = parseInt(req.params.id);
  const { date, description, lines } = req.body;

  if (!date || !description || !lines || lines.length < 2) {
    return res.status(400).json({ message: 'Tanggal, Keterangan, dan minimal 2 baris jurnal wajib diisi.' });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  const parsedLines = [];

  for (const line of lines) {
    const account_id = parseInt(line.account_id);
    const debit = parseFloat(line.debit) || 0;
    const credit = parseFloat(line.credit) || 0;

    if (!account_id) {
      return res.status(400).json({ message: 'Semua baris harus memilih akun.' });
    }
    if (debit > 0 && credit > 0) {
      return res.status(400).json({ message: 'Satu baris tidak boleh debit dan kredit sekaligus.' });
    }
    if (debit === 0 && credit === 0) {
      return res.status(400).json({ message: 'Setiap baris harus memiliki nominal debit atau kredit.' });
    }

    totalDebit += debit;
    totalCredit += credit;
    parsedLines.push({ account_id, debit, credit });
  }

  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    return res.status(400).json({ message: 'Total debit dan kredit harus seimbang.' });
  }

  try {
    const entry = await db.get('SELECT id FROM journal_entries WHERE id = ?', [entryId]);
    if (!entry) return res.status(404).json({ message: 'Entri jurnal tidak ditemukan.' });

    await db.run('BEGIN TRANSACTION');

    await db.run('UPDATE journal_entries SET date = ?, description = ? WHERE id = ?', [
      date, description, entryId
    ]);

    await db.run('DELETE FROM journal_lines WHERE entry_id = ?', [entryId]);

    for (const pLine of parsedLines) {
      await db.run(
        'INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)',
        [entryId, pLine.account_id, pLine.debit, pLine.credit]
      );
    }

    await db.run('COMMIT');
    res.json({ message: 'Jurnal berhasil diperbarui.' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.delete('/api/journals/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const entryId = parseInt(req.params.id);

  try {
    const entry = await db.get('SELECT id FROM journal_entries WHERE id = ?', [entryId]);
    if (!entry) return res.status(404).json({ message: 'Entri jurnal tidak ditemukan.' });

    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM journal_lines WHERE entry_id = ?', [entryId]);
    await db.run('DELETE FROM journal_entries WHERE id = ?', [entryId]);
    
    // Also remove reference from salaries if any
    await db.run('UPDATE salaries SET journal_entry_id = NULL WHERE journal_entry_id = ?', [entryId]);

    await db.run('COMMIT');
    res.json({ message: 'Entri jurnal berhasil dihapus.' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Ledger Endpoint
app.get('/api/reports/ledger', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  const { account_id, date_from, date_to, q } = req.query;
  
  let selectedAccountId = parseInt(account_id);
  try {
    if (!selectedAccountId) {
      const firstAcc = await db.get("SELECT id FROM accounts WHERE code = '101'");
      selectedAccountId = firstAcc ? firstAcc.id : 0;
    }

    const where = ['jl.account_id = ?'];
    const params = [selectedAccountId];

    if (date_from) {
      where.push('je.date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      where.push('je.date <= ?');
      params.push(date_to);
    }
    if (q) {
      where.push('je.description LIKE ?');
      params.push(`%${q}%`);
    }

    const sql = `
      SELECT je.date, je.description, jl.debit, jl.credit
      FROM journal_lines jl
      JOIN journal_entries je ON je.id = jl.entry_id
      WHERE ${where.join(' AND ')}
      ORDER BY je.date ASC, jl.id ASC
    `;

    const rows = await db.all(sql, params);
    
    // Fetch accounts COA for sidebar/dropdown select
    const accounts = await db.all('SELECT id, code, name, normal FROM accounts ORDER BY code');
    const activeAccount = accounts.find(a => a.id === selectedAccountId) || null;

    res.json({
      activeAccount,
      rows,
      accounts
    });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Trial Balance (Neraca Saldo)
app.get('/api/reports/trial-balance', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  const { date_from, date_to } = req.query;
  const where = [];
  const params = [];

  if (date_from) {
    where.push('je.date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    where.push('je.date <= ?');
    params.push(date_to);
  }

  const wStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const sql = `
      SELECT a.id, a.code, a.name, a.normal,
             COALESCE(SUM(jl.debit), 0) AS total_debit,
             COALESCE(SUM(jl.credit), 0) AS total_credit
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jl.entry_id
      ${wStr}
      GROUP BY a.id, a.code, a.name, a.normal
      ORDER BY a.code
    `;

    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Income Statement (Laporan Laba Rugi)
app.get('/api/reports/income-statement', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  const { date_from, date_to } = req.query;
  const where = [];
  const params = [];

  if (date_from) {
    where.push('je.date >= ?');
    params.push(date_from);
  }
  if (date_to) {
    where.push('je.date <= ?');
    params.push(date_to);
  }

  const wStr = where.length > 0 ? 'AND ' + where.join(' AND ') : '';

  try {
    // Revenues (Credit - Debit for Revenue accounts)
    const revenues = await db.all(`
      SELECT a.id, a.code, a.name, COALESCE(SUM(jl.credit - jl.debit), 0) AS total
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.date IS NOT NULL ${wStr}
      WHERE a.type = 'Revenue'
      GROUP BY a.id
      ORDER BY a.code
    `, params);

    // Expenses (Debit - Credit for Expense accounts)
    const expenses = await db.all(`
      SELECT a.id, a.code, a.name, COALESCE(SUM(jl.debit - jl.credit), 0) AS total
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jl.entry_id AND je.date IS NOT NULL ${wStr}
      WHERE a.type = 'Expense'
      GROUP BY a.id
      ORDER BY a.code
    `, params);

    const totalRevenue = revenues.reduce((sum, r) => sum + r.total, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.total, 0);
    const netIncome = totalRevenue - totalExpense;

    res.json({
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netIncome
    });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Salary Management Endpoints
app.get('/api/salaries', authenticateToken, async (req, res) => {
  const role = req.user.role;
  const uid = req.user.id;
  const { user_id, month, year } = req.query;

  const where = [];
  const params = [];

  if (role === 'admin' || role === 'owner') {
    if (user_id && parseInt(user_id) > 0) {
      where.push('s.user_id = ?');
      params.push(parseInt(user_id));
    }
  } else {
    where.push('s.user_id = ?');
    params.push(uid);
  }

  if (month) {
    const start = `${month}-01`;
    // Approximate monthly range
    const end = `${month}-31`; 
    where.push('s.date BETWEEN ? AND ?');
    params.push(start, end);
  } else if (year) {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    where.push('s.date BETWEEN ? AND ?');
    params.push(start, end);
  }

  let sql = `
    SELECT s.*, u.name AS uname 
    FROM salaries s
    JOIN users u ON u.id = s.user_id
  `;
  if (where.length > 0) {
    sql += ' WHERE ' + where.join(' AND ');
  }
  sql += ' ORDER BY s.date DESC, s.id DESC';

  try {
    const rows = await db.all(sql, params);
    
    // Dropdown list of employees for admin/owner
    let employees = [];
    if (role === 'admin' || role === 'owner') {
      employees = await db.all("SELECT id, name FROM users WHERE role = 'pegawai' ORDER BY name");
    }

    res.json({
      salaries: rows,
      employees
    });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.post('/api/salaries', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { user_id, date, amount, note } = req.body;
  if (!user_id || !date || !amount) {
    return res.status(400).json({ message: 'Pegawai, Tanggal, dan Jumlah Gaji wajib diisi.' });
  }

  try {
    const emp = await db.get('SELECT name FROM users WHERE id = ?', [user_id]);
    if (!emp) return res.status(400).json({ message: 'Pegawai tidak ditemukan.' });

    // Find accounts for auto double entry
    const accGaji = await db.get("SELECT id FROM accounts WHERE code = '501'");
    const accKas = await db.get("SELECT id FROM accounts WHERE code = '101'");

    if (!accGaji || !accKas) {
      return res.status(400).json({ message: 'Akun Beban Gaji (501) atau Kas (101) tidak ditemukan di COA.' });
    }

    const desc = `Gaji pegawai - ${emp.name}${note ? ' - ' + note : ''}`;

    await db.run('BEGIN TRANSACTION');

    // Create journal entry first
    const jeResult = await db.run('INSERT INTO journal_entries(date, description) VALUES(?, ?)', [
      date, desc
    ]);
    const jeId = jeResult.lastID;

    // Debit Beban Gaji
    await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
      jeId, accGaji.id, amount, 0
    ]);
    // Credit Kas
    await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
      jeId, accKas.id, 0, amount
    ]);

    // Create salary entry
    await db.run(
      'INSERT INTO salaries(user_id, date, amount, note, journal_entry_id) VALUES(?, ?, ?, ?, ?)',
      [user_id, date, amount, note || '', jeId]
    );

    await db.run('COMMIT');
    res.status(201).json({ message: 'Data gaji disimpan & jurnal akuntansi otomatis dibuat.' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.put('/api/salaries/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const salaryId = parseInt(req.params.id);
  const { user_id, date, amount, note } = req.body;

  if (!user_id || !date || !amount) {
    return res.status(400).json({ message: 'Pegawai, Tanggal, dan Jumlah Gaji wajib diisi.' });
  }

  try {
    const currentSal = await db.get('SELECT * FROM salaries WHERE id = ?', [salaryId]);
    if (!currentSal) return res.status(404).json({ message: 'Data gaji tidak ditemukan.' });

    const emp = await db.get('SELECT name FROM users WHERE id = ?', [user_id]);
    if (!emp) return res.status(400).json({ message: 'Pegawai tidak ditemukan.' });

    const accGaji = await db.get("SELECT id FROM accounts WHERE code = '501'");
    const accKas = await db.get("SELECT id FROM accounts WHERE code = '101'");

    if (!accGaji || !accKas) {
      return res.status(400).json({ message: 'Akun Beban Gaji (501) atau Kas (101) tidak ditemukan.' });
    }

    const desc = `Gaji pegawai - ${emp.name}${note ? ' - ' + note : ''}`;
    const jeId = currentSal.journal_entry_id;

    await db.run('BEGIN TRANSACTION');

    // Update salary row
    await db.run('UPDATE salaries SET user_id = ?, date = ?, amount = ?, note = ? WHERE id = ?', [
      user_id, date, amount, note || '', salaryId
    ]);

    // Update journal entry
    if (jeId) {
      await db.run('UPDATE journal_entries SET date = ?, description = ? WHERE id = ?', [
        date, desc, jeId
      ]);
      await db.run('DELETE FROM journal_lines WHERE entry_id = ?', [jeId]);
      await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
        jeId, accGaji.id, amount, 0
      ]);
      await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
        jeId, accKas.id, 0, amount
      ]);
    } else {
      // Create new journal entry if not linked previously
      const jeResult = await db.run('INSERT INTO journal_entries(date, description) VALUES(?, ?)', [
        date, desc
      ]);
      const newJeId = jeResult.lastID;
      await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
        newJeId, accGaji.id, amount, 0
      ]);
      await db.run('INSERT INTO journal_lines(entry_id, account_id, debit, credit) VALUES(?, ?, ?, ?)', [
        newJeId, accKas.id, 0, amount
      ]);
      await db.run('UPDATE salaries SET journal_entry_id = ? WHERE id = ?', [newJeId, salaryId]);
    }

    await db.run('COMMIT');
    res.json({ message: 'Data gaji dan jurnal berhasil diperbarui.' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.delete('/api/salaries/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const salaryId = parseInt(req.params.id);

  try {
    const salary = await db.get('SELECT * FROM salaries WHERE id = ?', [salaryId]);
    if (!salary) return res.status(404).json({ message: 'Data gaji tidak ditemukan.' });

    const jeId = salary.journal_entry_id;

    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM salaries WHERE id = ?', [salaryId]);
    
    if (jeId) {
      await db.run('DELETE FROM journal_lines WHERE entry_id = ?', [jeId]);
      await db.run('DELETE FROM journal_entries WHERE id = ?', [jeId]);
    }

    await db.run('COMMIT');
    res.json({ message: 'Data gaji dan jurnal akuntansi terkait berhasil dihapus.' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// User Management CRUD (Admin Only)
app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, name, role FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { username, name, role, password } = req.body;
  if (!username || !name || !role || !password) {
    return res.status(400).json({ message: 'Semua bidang wajib diisi.' });
  }
  if (!['admin', 'owner', 'pegawai'].includes(role)) {
    return res.status(400).json({ message: 'Peran tidak valid.' });
  }

  try {
    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ message: 'Username sudah digunakan oleh akun lain.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users(username, password, name, role) VALUES(?, ?, ?, ?)', [
      username, hash, name, role
    ]);

    res.status(201).json({ message: 'Pengguna berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const userId = parseInt(req.params.id);
  const { username, name, role, password } = req.body;

  if (!username || !name || !role) {
    return res.status(400).json({ message: 'Username, Nama, dan Peran wajib diisi.' });
  }

  try {
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!existingUser) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });

    const duplicateUser = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
    if (duplicateUser) {
      return res.status(400).json({ message: 'Username sudah digunakan oleh akun lain.' });
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.run('UPDATE users SET username = ?, name = ?, role = ?, password = ? WHERE id = ?', [
        username, name, role, hash, userId
      ]);
    } else {
      await db.run('UPDATE users SET username = ?, name = ?, role = ? WHERE id = ?', [
        username, name, role, userId
      ]);
    }

    res.json({ message: 'Data pengguna berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === req.user.id) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun sendiri.' });
  }

  try {
    const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Akun admin lain tidak boleh dihapus demi keamanan.' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ message: 'Kesalahan server: ' + err.message });
  }
});

// Start Express server after DB init
dbReady = initDb().then(() => {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }
}).catch(err => {
  console.error('Failed to initialize database connection:', err);
});

module.exports = app;


