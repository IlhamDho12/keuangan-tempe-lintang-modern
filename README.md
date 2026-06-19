# Keuangan Tempe Lintang — Sistem Informasi Akuntansi Modern

Aplikasi Akuntansi Keuangan berbasis Web modern yang dikonversi dari PHP Native menjadi arsitektur Single Page Application (SPA) dengan antarmuka premium dan responsif. Dirancang khusus untuk pencatatan transaksi berpasangan (*double-entry bookkeeping*) pada usaha Tempe Lintang.

## 🚀 Fitur Utama

- **Dashboard Real-time**: Grafik interaktif (Chart.js) untuk memantau pendapatan, beban pengeluaran, laba rugi bersih, serta saldo kas aktual berjalan.
- **Jurnal Umum**: Pencatatan entri jurnal ganda dinamis dengan validasi keseimbangan (*balance checker*) otomatis.
- **Buku Besar (Ledger)**: Histori mutasi debit/kredit per bagan akun (COA) dengan perhitungan saldo berjalan otomatis.
- **Laporan Keuangan**: 
  - **Neraca Saldo (Trial Balance)**: Memantau keseimbangan total debit dan kredit semua akun.
  - **Laporan Laba Rugi (Income Statement)**: Akumulasi hasil pendapatan dikurangi beban operasional.
  - **Drill-down Pop-up Modal**: Membuka histori transaksi per akun secara instan melalui modal pop-up yang modern.
- **Gaji Pegawai**: Input penggajian bulanan pegawai yang terintegrasi secara otomatis dengan penjurnalan akuntansi (double entry debit Beban Gaji, kredit Kas).
- **Manajemen User (Admin)**: CRUD data pegawai beserta tingkat peran hak akses (`admin`, `owner`, dan `pegawai`).
- **Keamanan Akun**: Pengamanan login menggunakan enkripsi password Bcrypt dan otorisasi API berbasis JSON Web Token (JWT).
- **Desain Premium**: Glassmorphism UI, responsif (desktop & mobile), serta mode gelap/terang (*dark & light theme*).

## 🛠️ Stack Teknologi

- **Frontend**: React (Vite), React Router DOM, Chart.js, Lucide Icons, Vanilla CSS dengan CSS Variables.
- **Backend**: Node.js, Express.js, JWT, Bcrypt.js.
- **Database**: SQLite (`sqlite3` / `sqlite`).

## 📁 Struktur Folder

```text
keuangan_tempe_lintang_modern/
├── backend/
│   ├── database.db     # Database SQLite aktual
│   ├── server.js       # Express server & API endpoints
│   └── package.json    # Dependensi backend
├── frontend/
│   ├── src/
│   │   ├── pages/      # Halaman aplikasi React
│   │   ├── App.jsx     # Routing & Context autentikasi
│   │   ├── index.css   # Sistem desain CSS Vanilla
│   │   └── main.jsx    # Entry point React
│   ├── index.html      # SEO metadata
│   ├── vite.config.js  # Konfigurasi bundler & Proxy backend
│   └── package.json    # Dependensi frontend
└── .gitignore          # File pengecualian git
```

## 💻 Cara Menjalankan Secara Lokal

Pastikan Anda telah menginstal runtime **Node.js** di komputer Anda.

### 1. Jalankan Backend Server
```bash
cd backend
npm install
npm run dev # atau: node server.js
```
Server API backend akan aktif di `http://localhost:5000`.

### 2. Jalankan Frontend (Vite)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Buka `http://localhost:5173/` di browser Anda.

---

Sistem Informasi Akuntansi &copy; 2026.
