# 📋 Panduan Setup & Migrasi Aplikasi Setelah Install Ulang Laptop

Panduan ini berisi langkah-langkah lengkap agar aplikasi **Perumahan CRM App** (`temp-app / perumahan-app`) bisa langsung dibuka dan dijalankan kembali secara normal setelah laptop selesai di-install ulang (baik Linux, Windows, maupun macOS).

---

## 🏗️ 1. Sekilas Spesifikasi & Arsitektur Aplikasi
Aplikasi ini dibangun menggunakan:
- **Framework/Bundler**: React 19 + TypeScript + Vite
- **Penyimpanan Data**: `Browser LocalStorage` (data tersimpan di memori browser lokal dengan prefix `crm_db_*`)
- **Git Remote**: `https://github.com/airvisualstudio/perumahan-app.git`

---

## ⚠️ FASE 1: SEBELUM INSTALL ULANG (WAJIB DILAKUKAN SEKARANG!)

Karena aplikasi ini menyimpan data (proyek, deals, kontak, absensi, dokumen, dsb.) di dalam `localStorage` browser, **jika laptop langsung di-install ulang tanpa backup, data lokal akan hilang!**

### Langkah 1.1: Backup Data LocalStorage ke File JSON
1. Buka aplikasi yang sedang berjalan di browser (misal: `http://localhost:5173`).
2. Tekan **F12** atau klik kanan -> **Inspect** -> pilih tab **Console**.
3. Salin (*copy*) kode JavaScript berikut, tempel (*paste*) di Console, lalu tekan **Enter**:

```javascript
// --- SCRIPT BACKUP DATA CRM ---
(() => {
  const backupData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('crm_db_')) {
      backupData[key] = localStorage.getItem(key);
    }
  }
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `backup_crm_data_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  console.log('✅ Backup data CRM berhasil didownload!');
})();
```
4. File `backup_crm_data_YYYY-MM-DD.json` akan ter-download otomatis. **Simpan file ini di Flashdisk / Google Drive / Cloud Storage Anda.**

---

### Langkah 1.2: Pastikan Semua Kode Terbaru Sudah Masuk ke Git / GitHub
Jalankan perintah ini di terminal project saat ini:

```bash
git status
```
Jika ada perubahan yang belum di-commit:
```bash
git add .
git commit -m "feat: backup update sebelum install ulang"
git push origin main
```

> 💡 **Rekomendasi Tambahan**: Sebagai cadangan (*safety net*), salin seluruh folder `perumahan-app` (tanpa folder `node_modules` jika terlalu besar) ke flashdisk/external harddisk.

---

## 🛠️ FASE 2: SOFTWARE YANG PERLU DI-INSTALL (SETELAH OS BARU)

Setelah laptop selesai di-install ulang, install software dasar berikut:

1. **Git**
   - **Linux (Debian/Ubuntu)**: `sudo apt update && sudo apt install git -y`
   - **Windows**: Download dari [git-scm.com](https://git-scm.com/)
   - **macOS**: `xcode-select --install` atau `brew install git`
2. **Node.js & npm** (Rekomendasi versi LTS: Node.js v20 atau v22+)
   - **Download Installer**: [nodejs.org](https://nodejs.org/) (pilih versi LTS)
   - **Via NVM (Linux/Mac/WSL - Sangat Disarankan)**:
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
     source ~/.bashrc
     nvm install --lts
     nvm use --lts
     ```
   - Cek apakah sudah terpasang dengan benar:
     ```bash
     node -v
     npm -v
     ```
3. **Code Editor / IDE**
   - [Visual Studio Code](https://code.visualstudio.com/) atau Editor pilihan Anda.
4. **Web Browser**
   - Google Chrome / Brave / Edge / Firefox.

---

## 🚀 FASE 3: MENJALANKAN APLIKASI DI LAPTOP BARU

Setelah semua software di atas terpasang:

### 1. Clone Repository dari GitHub
Buka Terminal / Command Prompt / Git Bash, pilih folder kerja Anda (misal `~/Projects` atau `D:/Work`), lalu jalankan:

```bash
git clone https://github.com/airvisualstudio/perumahan-app.git
```

### 2. Masuk ke Folder Project
```bash
cd perumahan-app
```

### 3. Install Seluruh Dependensi (Libraries)
```bash
npm install
```
*(Proses ini akan otomatis mendownload React, Vite, Framer Motion, jsPDF, Lucide React, Confetti, dll. sesuai `package.json`).*

### 4. Jalankan Server Development
```bash
npm run dev
```
Setelah muncul tampilan:
```text
  VITE v6.x.x  ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Buka di Browser
Buka browser dan akses alamat:
👉 **`http://localhost:5173`**

---

## 📥 FASE 4: RESTORE DATA CRM KE BROWSER BARU

Jika Anda membuka aplikasi untuk pertama kali, aplikasi akan menggunakan template data bawaan. Untuk mengembalikan data transaksi/leads/deals/proyek yang sudah Anda backup di **Fase 1**:

1. Buka browser di **`http://localhost:5173`**.
2. Buka DevTools (**F12** atau klik kanan -> **Inspect** -> tab **Console**).
3. Salin (*copy*) kode JavaScript berikut dan paste di Console:

```javascript
// --- SCRIPT RESTORE DATA CRM ---
(() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach((key) => {
          localStorage.setItem(key, data[key]);
        });
        alert('🎉 Data CRM berhasil dipulihkan! Halaman akan direfresh.');
        window.location.reload();
      } catch (err) {
        alert('❌ Gagal membaca file backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
})();
```
4. Jendela pemilihan file akan muncul -> Pilih file `backup_crm_data_YYYY-MM-DD.json` yang Anda simpan di Flashdisk.
5. Halaman akan otomatis refresh dan semua data CRM Anda kembali seperti semula! 🎉

---

## 🔧 TROUBLESHOOTING / MASALAH UMUM

| Kendala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `npm: command not found` | Node.js belum terinstall atau path belum diset | Install Node.js dari nodejs.org atau jalankan terminal baru setelah install. |
| `EADDRINUSE: 5173` | Port 5173 sedang dipakai oleh aplikasi lain | Vite akan otomatis menawarkan port berikutnya seperti `http://localhost:5174`. |
| Script PowerShell Restricted (Windows) | Kebijakan eksekusi script Windows terkunci | Buka PowerShell As Administrator, lalu jalankan: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Halaman blank putih | Dependensi belum terinstall sempurna | Hapus folder `node_modules` dan `package-lock.json`, lalu jalankan `npm install` kembali. |

---

## 📌 Checklist Ringkas Sebelum Format Laptop:
- [ ] Script Backup JSON LocalStorage sudah dijalankan & file disimpan di Cloud/Flashdisk.
- [ ] Git commit & git push sudah dilakukan (`git status` bersih).
- [ ] Catatan kredensial akun GitHub/Git sudah aman.
