# Product Requirements Document (PRD)
## Internal CRM, Operational, HR & Document Platform (PWA)

| | |
|---|---|
| **Status** | Draft v3.0 |
| **Versi** | 3.0 |
| **Tanggal** | Juni 2025 |
| **Target Launch** | < 1 bulan (MVP) |
| **Tipe Produk** | Web App (PWA) — Internal |
| **Author** | [Nama PM] |
| **Reviewer** | [Dev Lead, Designer, Stakeholder] |

---

## 1. Overview & Problem Statement

### 1.1 Latar Belakang

Tim internal saat ini belum memiliki satu platform terpusat untuk mengelola data pelanggan, pipeline operasional, absensi karyawan, dan aktivitas harian. Informasi tersebar di berbagai tools (spreadsheet, chat, email, mesin absensi fisik), menyebabkan inefisiensi, data tidak sinkron, dan visibility yang rendah bagi manajemen.

### 1.2 Problem Statement

> **"Bagaimana tim internal dapat mengelola CRM, operasional, absensi, dan dokumen resmi perusahaan secara terpusat — dengan alur approval berjenjang, penerbitan dokumen otomatis, dan verifikasi keaslian via QR code?"**

### 1.3 Tujuan Produk

- Menyediakan **single source of truth** untuk data pelanggan, operasional, kehadiran, dan dokumen
- Dapat diakses seperti **native app** di smartphone via PWA (tanpa App Store)
- Meningkatkan **visibilitas** aktivitas tim melalui dashboard terpusat
- Mendukung **absensi digital** berbasis GPS langsung dari HP karyawan
- Mengotomasi **pembuatan Invoice, Kwitansi, dan Surat** berdasar data yang diinput
- Menegakkan **approval berjenjang** yang dapat dikonfigurasi per tipe dokumen dan departemen
- Menerbitkan **QR Code** pada setiap dokumen yang approved sebagai bukti keaslian
- Menyediakan **portal verifikasi publik** agar pihak eksternal bisa cek keabsahan dokumen

---

## 2. Target Pengguna

| Role | Deskripsi | Kebutuhan Utama |
|------|-----------|-----------------|
| **Sales / Account Manager** | Mengelola leads dan pipeline | Tambah/update kontak, tracking deal, buat invoice |
| **Operational Staff** | Menjalankan proses harian | Task management, buat dokumen, request approval |
| **Karyawan Umum** | Seluruh staf perusahaan | Absensi clock-in/out, rekap kehadiran, pengajuan cuti |
| **Manager / Supervisor** | Memantau performa & approve dokumen | Dashboard, approval cuti & dokumen (level 1) |
| **Direktur / C-Level** | Final approver untuk dokumen penting | Approval level akhir, tanda tangan digital |
| **Finance** | Kelola Invoice & Kwitansi | Buat, review, approve dokumen keuangan |
| **Admin / HR** | Mengelola akun, akses, karyawan | User management, rekap absensi, konfigurasi approval |

---

## 3. Goals & Non-Goals

### ✅ Goals (MVP)
- PWA: installable, offline-ready (khususnya absensi), push notification
- Autentikasi & manajemen user dengan role-based access
- Modul CRM: kelola kontak, perusahaan, dan pipeline deal
- Modul Operasional: task/ticket management berbasis status
- Modul Absensi: clock-in/out berbasis GPS, rekap, pengajuan cuti
- **Modul Approval Hierarchy: alur persetujuan berjenjang yang dapat dikonfigurasi**
- **Modul Dokumen: buat Invoice, Kwitansi, Surat dari template + data input, export PDF**
- **QR Code otomatis pada dokumen yang approved + Portal Verifikasi publik**
- Dashboard & reporting real-time
- Notifikasi via email dan push notification
- Integrasi Slack dan Google Workspace
- Backoffice Panel untuk Admin/HR

### ❌ Non-Goals (MVP — defer ke iterasi berikutnya)
- Native app (iOS/Android via App Store)
- Face recognition / biometric authentication
- Payroll & penggajian otomatis
- Multi-tenant / multi-company support
- AI/ML features (prediksi churn, lead scoring)
- Custom workflow builder dengan drag-drop logic
- Shift management & jadwal kerja kompleks
- Integrasi HRIS pihak ketiga (Talenta, Gadjian, dll)
- E-signature dengan kekuatan hukum (e.g. Privy, PERURI)
- Integrasi e-meterai
- Template builder visual (drag-drop) — MVP pakai template code-based

---

## 4. PWA Requirements

Platform ini harus memenuhi standar **Progressive Web App** penuh agar dapat diinstal di HP karyawan tanpa App Store.

### 4.1 Kriteria PWA

| Kriteria | Requirement | Detail |
|----------|-------------|--------|
| **Installable** | Web App Manifest lengkap | Nama, ikon (192px & 512px), theme color, `display: standalone` |
| **Offline Support** | Service Worker (Workbox) | Cache shell + critical assets; absensi dapat dilakukan offline |
| **Offline Sync** | Background Sync API | Clock-in/out yang dilakukan offline disinkron saat online kembali |
| **Push Notification** | Web Push API | Notifikasi reminder absensi, task assignment tanpa buka browser |
| **Responsive** | Mobile-first design | Breakpoint: 375px, 768px, 1024px, 1280px |
| **HTTPS** | Wajib | PWA hanya berjalan di HTTPS |
| **Lighthouse Score** | ≥ 90 (PWA & Performance) | Diukur sebelum launch |
| **Fast Load** | FCP < 2 detik, TTI < 3.5 detik | Di jaringan 4G simulasi |

### 4.2 Strategi Caching (Service Worker)

| Asset | Strategi | Keterangan |
|-------|----------|------------|
| App Shell (HTML/CSS/JS) | Cache First | Update saat deploy baru |
| API: GET kontak/task | Network First, fallback cache | Data terbaru diutamakan |
| API: POST absensi | Background Sync | Simpan di IndexedDB, kirim saat online |
| Gambar & font | Cache First | Long cache TTL |
| Halaman auth | Network Only | Tidak di-cache, keamanan |

### 4.3 Web App Manifest

```json
{
  "name": "Internal Platform",
  "short_name": "InternalApp",
  "description": "CRM, Operasional & Absensi Internal",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Absensi", "url": "/absensi", "icons": [{ "src": "/icons/clock.png", "sizes": "96x96" }] },
    { "name": "Task Saya", "url": "/tasks/me", "icons": [{ "src": "/icons/task.png", "sizes": "96x96" }] }
  ]
}
```

---

## 5. Fitur & Scope

### 5.1 Prioritas Fitur (MoSCoW)

| Prioritas | Fitur | Keterangan |
|-----------|-------|------------|
| 🔴 Must Have | PWA (manifest, service worker, installable) | Aksesibilitas mobile |
| 🔴 Must Have | Autentikasi (login, logout, SSO Google) | Fondasi utama |
| 🔴 Must Have | Role & Permission (Admin/HR, Manager, Finance, Staff) | Keamanan akses |
| 🔴 Must Have | Manajemen Kontak & Perusahaan | Inti CRM |
| 🔴 Must Have | Pipeline Deal (Kanban/List) | Tracking sales |
| 🔴 Must Have | Task & Ticket Operasional | Tracking kerja harian |
| 🔴 Must Have | Absensi: Clock-in/out + GPS verify | Kehadiran karyawan |
| 🔴 Must Have | Absensi: Rekap & Riwayat Kehadiran | Laporan HR |
| 🔴 Must Have | **Approval Hierarchy: konfigurasi level & chain per tipe dokumen** | Alur persetujuan |
| 🔴 Must Have | **Approval: notifikasi per level, history trail lengkap** | Transparansi proses |
| 🔴 Must Have | **Dokumen: buat Invoice dari data CRM** | Otomasi billing |
| 🔴 Must Have | **Dokumen: buat Kwitansi (receipt)** | Bukti pembayaran |
| 🔴 Must Have | **Dokumen: buat Surat (letter) dari template** | Korespondensi resmi |
| 🔴 Must Have | **Dokumen: export PDF siap cetak/kirim** | Output formal |
| 🔴 Must Have | **QR Code otomatis saat dokumen approved** | Anti-pemalsuan |
| 🔴 Must Have | **Portal Verifikasi publik (tanpa login)** | Cek keaslian dokumen |
| 🔴 Must Have | Dashboard Overview | Visibility manajemen |
| 🔴 Must Have | Backoffice Panel (user mgmt, audit log, config approval) | Kontrol sistem |
| 🟠 Should Have | Absensi: Pengajuan & Approval Cuti (via approval chain) | Self-service HR |
| 🟠 Should Have | Offline clock-in (Background Sync) | Absensi tanpa sinyal |
| 🟠 Should Have | Notifikasi Email & Web Push | Produktivitas |
| 🟠 Should Have | Integrasi Slack | Workflow tim |
| 🟠 Should Have | Integrasi Google Calendar | Scheduling |
| 🟠 Should Have | **Dokumen: nomor surat/invoice otomatis & sequential** | Penomoran resmi |
| 🟠 Should Have | **Approval: delegasi saat approver tidak tersedia** | Business continuity |
| 🟡 Could Have | Absensi: WFH mode | Fleksibilitas kerja |
| 🟡 Could Have | Laporan export (CSV/PDF) | Pelaporan |
| 🟡 Could Have | Integrasi Gmail | CRM enrichment |
| 🟡 Could Have | **Dokumen: template builder visual (drag-drop)** | Kustomisasi mandiri |
| 🟡 Could Have | **Dokumen: watermark "LUNAS" / "DIBATALKAN" otomatis** | Status visual |
| 🟡 Could Have | **Verifikasi portal: log siapa saja yang scan QR** | Audit trail eksternal |
| ⚪ Won't Have | Native app, payroll, e-meterai, e-signature legal, multi-tenant | Post-MVP |

---

### 5.2 Detail Fitur per Modul

#### 🔐 Modul 1: Autentikasi & User Management

**User Stories:**
- Sebagai **Admin**, saya bisa mengundang anggota tim via email.
- Sebagai **User**, saya bisa login via Google SSO.
- Sebagai **User** di HP, saya bisa install platform sebagai app dan login sekali tanpa perlu login ulang.
- Sebagai **Admin**, saya bisa mengatur role setiap user.

**Acceptance Criteria:**
- Login: email+password dan Google OAuth 2.0
- Role: Admin/HR, Manager, Staff — permission berbeda per modul
- Session: expired 8 jam idle; remember me 30 hari via refresh token
- Saat dibuka di mobile: muncul prompt "Add to Home Screen" setelah 2x kunjungan
- Audit log setiap perubahan akun

---

#### 👥 Modul 2: CRM — Kontak & Pipeline

**User Stories:**
- Sebagai **Sales**, saya bisa menambahkan kontak dan perusahaan baru.
- Sebagai **Sales**, saya bisa memindahkan deal antar stage di pipeline.
- Sebagai **Manager**, saya bisa melihat seluruh pipeline tim.

**Acceptance Criteria:**
- Kontak: nama, email, telepon, perusahaan, tags, notes, activity log
- Perusahaan: nama, industri, ukuran, website, kontak terkait
- Pipeline: stage default (New → Qualified → Proposal → Negotiation → Won/Lost), bisa dikustomisasi
- Filter & search; Activity log per kontak

---

#### ⚙️ Modul 3: Operasional — Task & Ticket

**User Stories:**
- Sebagai **Staff**, saya bisa membuat dan assign task ke anggota lain.
- Sebagai **Manager**, saya bisa memantau semua task tim beserta status dan deadline.

**Acceptance Criteria:**
- Task: judul, deskripsi, assignee, deadline, prioritas, status (Open/In Progress/Done)
- View: List dan Kanban board
- Komentar per task; notifikasi saat di-assign atau deadline H-1

---

#### 🕐 Modul 4: Absensi Karyawan

Panel absensi dirancang **mobile-first** dan berfungsi penuh sebagai PWA di HP karyawan.

**User Stories:**
- Sebagai **Karyawan**, saya bisa clock-in dari HP saya dengan verifikasi lokasi GPS.
- Sebagai **Karyawan**, saya bisa clock-out dan melihat total jam kerja hari ini.
- Sebagai **Karyawan**, saya bisa melihat riwayat kehadiran dan rekap bulanan saya.
- Sebagai **Karyawan**, saya bisa mengajukan cuti/izin dan melihat statusnya.
- Sebagai **Manager**, saya bisa menyetujui atau menolak pengajuan cuti tim saya.
- Sebagai **Admin/HR**, saya bisa melihat rekap kehadiran semua karyawan dan export.
- Sebagai **Karyawan** di area tanpa sinyal, saya tetap bisa clock-in (disinkron saat online).

**Acceptance Criteria:**

*Clock-in / Clock-out:*
- Tombol besar Clock-In dan Clock-Out di halaman utama absensi (mobile-friendly)
- Verifikasi GPS: koordinat karyawan dibandingkan radius lokasi kantor yang dikonfigurasi Admin
- Toleransi radius default: 100 meter (dapat diubah di Backoffice)
- Tampilkan status: di dalam / di luar radius, dengan jarak ke kantor
- Catat: timestamp, koordinat, IP, device info
- Cegah double clock-in di hari yang sama
- Offline mode: jika tidak ada koneksi, data clock-in disimpan di IndexedDB dan disinkron otomatis via Background Sync API saat online. User melihat indikator "Tersimpan, akan disinkron"

*Status Kehadiran:*
- Hadir, Terlambat (>15 menit dari jam kerja), Tidak Hadir, Cuti, Izin, Sakit
- Jam kerja default: 09.00–18.00 (dapat dikustomisasi per tim di Backoffice)

*Riwayat & Rekap:*
- Karyawan lihat kalender kehadiran bulan ini
- Detail per hari: jam masuk, jam keluar, durasi, status, catatan
- Rekap bulanan: total hadir, terlambat, absen, cuti, total jam kerja
- Manager/HR: lihat rekap seluruh tim; export CSV per bulan

*Pengajuan Cuti/Izin:*
- Tipe: Cuti Tahunan, Izin, Sakit, Cuti Khusus
- Form: tipe, tanggal mulai-selesai, alasan, lampiran (opsional)
- Workflow: Pending → Approved/Rejected oleh Manager
- Notifikasi push/email ke Manager saat ada pengajuan baru
- Notifikasi ke Karyawan saat cuti disetujui/ditolak
- Saldo cuti tahunan ditampilkan (default 12 hari/tahun, dapat diubah)

*WFH Mode (Could Have):*
- Karyawan pilih "WFH" saat clock-in
- Tidak ada verifikasi GPS; hanya selfie sebagai konfirmasi

---

#### 📊 Modul 5: Dashboard & Reporting

**Acceptance Criteria:**
- Dashboard utama: total kontak, deal by stage, task by status, aktivitas terkini
- **Widget Absensi HR**: kehadiran hari ini, yang terlambat, yang belum absen, pengajuan cuti pending
- Filter berdasarkan periode (7 hari, 30 hari, custom range)
- Laporan deal pipeline: nilai total per stage, win rate
- Laporan task: completion rate per user, overdue
- Laporan absensi: rekap per karyawan, per departemen, per bulan
- Export CSV; PDF (Could Have)

---

#### 🔔 Modul 6: Notifikasi

**Acceptance Criteria:**
- **Web Push Notification** (via VAPID / Web Push API): berfungsi bahkan saat browser ditutup di HP
- Push reminder: "Kamu belum clock-in hari ini" — dikirim pukul 09.30 jika belum absen
- Push reminder clock-out: jam 18.15 jika belum clock-out
- Email + Push: task assignment, deadline H-1, approval cuti, deal stage change
- User atur preferensi notifikasi sendiri

---

#### 🔗 Modul 7: Integrasi

**Acceptance Criteria:**
- **Slack:** notifikasi ke channel saat deal Won, task overdue, dan pengajuan cuti baru
- **Google Calendar:** sync meeting ke timeline kontak
- **Gmail (Could Have):** log email ke activity kontak
- Konfigurasi integrasi via Backoffice

---

#### 🛠️ Modul 8: Backoffice Panel

Akses khusus Admin/HR via `/backoffice`. Guard NestJS `AdminOnly` di semua route.

**Acceptance Criteria:**

*User Management:* invite, suspend, hapus, ubah role, reset password

*Konfigurasi Absensi:*
- Setting lokasi kantor (nama, koordinat GPS, radius toleransi)
- Multi-lokasi: bisa tambah beberapa kantor/cabang
- Jam kerja default per tim/departemen
- Jenis cuti dan saldo default

*Audit Log:* setiap aksi penting dicatat dengan timestamp, user, action, IP; export CSV; retensi 90 hari

*System Config:* nama org, logo, timezone, integrasi tokens

*System Health (Could Have):* status integrasi, queue monitor, error log ringkasan

---

#### 🏛️ Modul 9: Approval Hierarchy

Sistem persetujuan berjenjang yang dapat dikonfigurasi per **tipe dokumen** dan/atau **departemen**. Setiap request approval mengikuti chain yang telah ditetapkan dari level terendah hingga final approver.

**User Stories:**
- Sebagai **Admin**, saya bisa mengkonfigurasi chain approval: misal Invoice harus disetujui Manager Finance → Direktur.
- Sebagai **Staff**, saya bisa submit dokumen untuk approval dan melihat status di setiap level.
- Sebagai **Manager**, saya menerima notifikasi saat ada dokumen menunggu approval saya, lalu approve atau reject dengan catatan.
- Sebagai **Pemohon**, saya bisa lihat history approval: siapa yang approve/reject di setiap step, kapan, dan catatan apa yang ditulis.
- Sebagai **Manager**, saya bisa mendelegasikan approval saya ke orang lain saat saya tidak tersedia (cuti/sakit).

**Acceptance Criteria:**

*Konfigurasi Chain (di Backoffice):*
- Admin bisa buat **Approval Template** dengan nama, tipe dokumen, dan urutan approver
- Setiap level dalam chain: pilih approver berdasarkan **role** atau **user spesifik**
- Level bisa: wajib (semua harus approve), atau **any-of** (salah satu dari grup cukup)
- Contoh chain Invoice:
  ```
  Level 1 → Role: Finance Manager   (wajib)
  Level 2 → Role: Direktur Keuangan (wajib)
  Level 3 → User: CEO               (wajib, jika nilai > Rp 50jt)
  ```
- Bisa set **kondisi bersyarat**: level tertentu hanya aktif jika nilai dokumen melampaui threshold
- Approval Template bisa diassign ke: semua dokumen tipe X, atau departemen tertentu

*Alur Approval:*
- Dokumen dibuat → status `DRAFT`
- Pemohon submit → status berubah `PENDING_APPROVAL`, approval request dibuat mengikuti chain
- Notifikasi push + email ke approver Level 1
- Approver Level 1 **Approve** → notifikasi ke Level 2 (dst), status `IN_REVIEW`
- Approver **Reject** di level manapun → dokumen kembali ke `REJECTED`, pemohon dinotifikasi beserta catatan penolakan
- Semua level approve → dokumen `APPROVED`, QR Code diterbitkan otomatis
- Pemohon bisa **revisi dan resubmit** dokumen yang rejected

*History & Transparansi:*
- Setiap aksi approval dicatat: approver, timestamp, action (approve/reject/delegate), catatan
- Timeline visual di halaman dokumen: chip per level (⏳ pending, ✅ approved, ❌ rejected)
- Semua history tersimpan dan tidak dapat dihapus (immutable log)

*Delegasi:*
- Approver bisa set delegasi dengan tanggal mulai-selesai dan pengganti spesifik
- Sistem otomatis routing ke delegatee selama periode delegasi aktif
- Admin bisa set delegasi dari Backoffice jika approver tidak bisa akses sistem

---

#### 📄 Modul 10: Document Generation (Invoice, Kwitansi, Surat)

Platform menghasilkan dokumen resmi berformat PDF dari data yang diinput user, dengan nomor surat otomatis, header organisasi, dan tanda tangan digital berupa QR code (setelah approved).

**User Stories:**
- Sebagai **Finance/Sales**, saya bisa buat Invoice baru dengan memilih klien dari CRM dan mengisi item-item tagihan.
- Sebagai **Finance**, saya bisa buat Kwitansi dari Invoice yang sudah lunas dengan satu klik.
- Sebagai **Staff**, saya bisa buat Surat Resmi dari template yang tersedia, isi variabelnya, preview, lalu submit untuk approval.
- Sebagai **Manager**, saya bisa preview dokumen sebelum approve.
- Sistem otomatis menerbitkan PDF final + QR Code saat dokumen approved.

**Acceptance Criteria:**

*Tipe Dokumen & Fields:*

**Invoice:**
- Nomor invoice otomatis & sequential: `INV/[YYYY]/[MM]/[XXXX]`
- Data klien: tarik dari CRM (kontak/perusahaan) atau input manual
- Line items: nama item, qty, satuan, harga satuan → subtotal otomatis
- Pajak: PPN 11% (toggle), diskon (nominal atau %)
- Total: subtotal, diskon, pajak, **total akhir** — semua dihitung otomatis
- Payment terms: tanggal jatuh tempo, metode pembayaran, nomor rekening
- Catatan/notes tambahan
- Status: Draft → Pending Approval → Approved → Sent → **Paid** / Overdue

**Kwitansi (Receipt):**
- Nomor kwitansi: `KWT/[YYYY]/[MM]/[XXXX]`
- Bisa dibuat dari Invoice (otomatis tarik data) atau standalone
- Data: penerima, jumlah uang (dalam angka + terbilang otomatis), keterangan pembayaran, tanggal
- "Terbilang" dalam Bahasa Indonesia digenerate otomatis dari nominal
- Status: Draft → Pending Approval → Approved

**Surat Resmi:**
- Nomor surat: `[KODE-DEPT]/[YYYY]/[BULAN-ROMAWI]/[XXXX]` — format konfigurabel
- Template tersedia (dikonfigurasi Admin): Surat Tugas, Surat Keterangan Kerja, Surat Pengantar, Surat Perjanjian, Surat Undangan, dan lainnya
- Setiap template punya **variabel** yang diisi user: `{{nama_penerima}}`, `{{jabatan}}`, `{{tanggal_berlaku}}`, dll
- Editor form sederhana (bukan rich text) — setiap variabel diisi via input field
- Preview real-time sebelum submit
- Status: Draft → Pending Approval → Approved

*Output PDF:*
- Template PDF mencakup: header organisasi (logo, nama, alamat), konten dokumen, footer, dan area QR Code
- PDF digenerate via **Puppeteer** (server-side rendering HTML → PDF)
- Kualitas cetak: A4, 96dpi, margin standar
- Font: menggunakan font yang didefinisikan di Design System
- Setelah approved: QR Code disisipkan otomatis di sudut kanan bawah dokumen
- PDF final tersimpan di storage (tidak bisa dimodifikasi setelah approved)

*Penomoran Otomatis:*
- Nomor dokumen di-generate server-side saat pertama kali dokumen di-submit (bukan saat draft)
- Sequential per tipe per tahun per bulan — tidak bisa ada nomor yang sama
- Format nomor dapat dikonfigurasi per tipe di Backoffice

*Template Management (Backoffice):*
- Admin bisa tambah/edit template Surat beserta daftar variabelnya
- Template disimpan sebagai HTML dengan placeholder `{{variable}}`
- Preview template sebelum disimpan

---

#### 🔐 Modul 11: QR Code & Portal Verifikasi

Setiap dokumen yang sudah **APPROVED** otomatis mendapat QR Code unik yang tertanam di PDF. QR Code mengarah ke portal verifikasi publik yang bisa diakses siapapun tanpa login.

**User Stories:**
- Sebagai **Pihak Eksternal** (klien, mitra, instansi), saya bisa scan QR Code di dokumen dan langsung tahu apakah dokumen tersebut asli dan valid.
- Sebagai **Pihak Eksternal**, saya bisa lihat informasi dasar dokumen di portal (bukan isi lengkap).
- Sebagai **Admin**, saya bisa membatalkan (revoke) dokumen yang sudah approved, sehingga verifikasi akan menunjukkan status "TIDAK BERLAKU".
- Sebagai **Admin**, saya bisa lihat log siapa saja yang pernah scan/verifikasi suatu dokumen.

**Acceptance Criteria:**

*QR Code Generation:*
- QR Code digenerate saat dokumen berpindah status ke `APPROVED`
- Konten QR Code: URL ke portal verifikasi `https://verify.internal.company.com/[doc_token]`
- `doc_token`: string unik 32 karakter (UUID v4 + HMAC signature) — tidak bisa ditebak/dipalsukan
- QR Code dirender sebagai gambar PNG, disematkan di pojok kanan bawah PDF
- Ukuran QR Code: 80×80px di PDF, cukup jelas saat dicetak ukuran A4
- QR Code juga bisa ditampilkan di halaman detail dokumen untuk di-scan langsung dari layar

*Portal Verifikasi (Publik):*
- URL: `https://verify.[domain-perusahaan].com/:token`
- **Tidak memerlukan login** — bisa diakses siapapun
- Tampilkan informasi:
  - ✅ / ❌ Status dokumen (VALID / TIDAK BERLAKU / TIDAK DITEMUKAN)
  - Tipe dokumen (Invoice / Kwitansi / Surat Tugas / dll)
  - Nomor dokumen
  - Nama penerbit (nama perusahaan)
  - Tanggal diterbitkan & tanggal approved
  - Nama approver final (level terakhir)
  - **Tidak menampilkan** isi detail dokumen, nilai uang, atau data sensitif lainnya
- Halaman portal: **desain minimal, mobile-friendly**, bisa diakses dari browser HP setelah scan QR
- Response time portal: < 1 detik

*Status Dokumen di Portal:*

| Status Internal | Tampilan di Portal |
|----------------|--------------------|
| `APPROVED` | ✅ **DOKUMEN VALID** — Diterbitkan pada [tanggal] |
| `REVOKED` | ❌ **DOKUMEN TIDAK BERLAKU** — Dicabut pada [tanggal] |
| Token tidak ditemukan | ⚠️ **DOKUMEN TIDAK DITEMUKAN** — QR Code mungkin dipalsukan |
| `DRAFT` / `PENDING` | ⚠️ **DOKUMEN BELUM AKTIF** — Belum melalui proses approval |

*Keamanan:*
- `doc_token` di-sign dengan HMAC-SHA256 menggunakan secret key server — tidak bisa di-forge
- Rate limiting di portal: max 60 request/menit per IP
- Log setiap verifikasi: timestamp, token, IP, user-agent (untuk audit)
- Revoke dokumen: Admin bisa revoke dari Backoffice, status langsung berubah di portal
- Token tidak pernah expire kecuali di-revoke manual

*Revoke Dokumen (Backoffice):*
- Admin pilih dokumen → klik "Cabut Dokumen"
- Wajib isi alasan pencabutan
- Status dokumen berubah ke `REVOKED`, tercatat di audit log
- Portal langsung menampilkan "TIDAK BERLAKU" dengan tanggal pencabutan

### 6.1 Tech Stack

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR/SSG, PWA-friendly, performa tinggi |
| **PWA** | next-pwa (Workbox) | Service Worker, caching strategy, manifest |
| **UI Library** | shadcn/ui + Tailwind CSS | Komponen siap pakai, mobile-first |
| **Backend** | **NestJS** + TypeScript | Modular, DI built-in, Guards/Pipes/Interceptors |
| **Database** | PostgreSQL | Relasional, solid untuk CRM + HR data |
| **ORM** | Prisma | Type-safe, migration mudah |
| **Auth** | NestJS + Passport.js (JWT + Google OAuth) | Fleksibel, guard-based |
| **Real-time / Push** | Web Push API (VAPID) + Socket.io | Push notif PWA + real-time updates |
| **Background Jobs** | BullMQ + Redis | Queue email, push notif, sync absensi |
| **Offline Sync** | IndexedDB (Dexie.js) + Background Sync API | Simpan absensi offline, sync otomatis |
| **Email** | Resend | Transactional email, developer-friendly |
| **Maps / GPS** | Browser Geolocation API + Leaflet.js | Verifikasi lokasi absensi |
| **Deployment** | Vercel (FE) + Railway (BE) | Fast deploy, cost-effective |
| **CI/CD** | GitHub Actions | Test + deploy otomatis |
| **Monitoring** | Sentry (error) + Better Uptime | Error tracking & uptime |

### 6.2 Arsitektur High-Level

```
┌──────────────────────────────────────────────────────────┐
│              Browser / PWA (Mobile & Desktop)             │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│   │  App Shell  │  │ Service Work │  │  IndexedDB    │   │
│   │  (cached)   │  │ er (Workbox) │  │ (offline sync)│   │
│   └─────────────┘  └──────────────┘  └───────────────┘   │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / WebSocket
┌────────────────────────▼─────────────────────────────────┐
│              Next.js Frontend (Vercel)                    │
│     User App  │  Backoffice Panel  │  PWA Manifest        │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API
┌────────────────────────▼─────────────────────────────────┐
│                  NestJS Backend (Railway)                  │
│  ┌──────┬──────┬──────┬──────────┬──────┬─────────────┐  │
│  │ Auth │ CRM  │ Task │ Absensi  │Notif │ Backoffice  │  │
│  │      │      │      │ + GPS    │      │             │  │
│  └──────┴──────┴──────┴──────────┴──────┴─────────────┘  │
│         Guards │ Interceptors │ Pipes │ BullMQ            │
└──────┬──────────────┬─────────────────┬───────────────────┘
       │              │                 │
  ┌────▼───┐    ┌─────▼──┐    ┌────────▼────────────┐
  │Postgres│    │ Redis  │    │   External APIs      │
  │(Prisma)│    │(Queue/ │    │ Slack, Google,       │
  │        │    │ cache) │    │ Resend, Web Push     │
  └────────┘    └────────┘    └─────────────────────┘
```

### 6.3 Struktur NestJS Modules

```
src/
├── auth/               # JWT, Google OAuth, Passport strategies
├── users/              # User CRUD, role management
├── crm/
│   ├── contacts/       # Kontak & perusahaan
│   └── pipeline/       # Deal & stage
├── operations/
│   └── tasks/          # Task & ticket + komentar
├── attendance/         # Clock-in/out, GPS verify, rekap
│   ├── records/        # Attendance records
│   ├── leaves/         # Pengajuan & approval cuti
│   └── locations/      # Konfigurasi lokasi kantor
├── notifications/      # Email, Web Push, BullMQ jobs
├── integrations/
│   ├── slack/
│   └── google/
├── backoffice/         # Admin-only: user mgmt, audit, settings
│   ├── guards/         # AdminOnly guard
│   ├── audit-log/
│   └── settings/
└── common/             # Shared DTOs, decorators, interceptors, pipes
```

### 6.4 Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|-----------|---------|--------|
| **Monorepo** | Turborepo | Shared types FE-BE, atomic deploy |
| **REST vs GraphQL** | REST via NestJS Controllers | Lebih simpel, cukup untuk MVP |
| **Auth** | JWT + Refresh Token | Stateless, scalable |
| **Push Notif** | Web Push API (VAPID) | Native-like push tanpa App Store |
| **Offline Sync** | Background Sync API + IndexedDB | Absensi offline → sync otomatis |
| **GPS Verify** | Browser Geolocation API | No hardware cost, cukup akurat |
| **State FE** | Zustand + React Query (TanStack) | Ringan, cache-first data fetching |

---

## 7. Database Schema

### 7.1 Entity Relationship Overview

```
users ──< attendance_records
users ──< leave_requests
users ──< tasks (assignee)
users ──< deal_activities
contacts >── companies
contacts ──< deal_activities
deals >── deal_stages
deals >── contacts
tasks >── users
leave_requests >── leave_types
attendance_records >── office_locations
audit_logs >── users
```

### 7.2 Schema Detail

#### `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
email           VARCHAR(255) UNIQUE NOT NULL
name            VARCHAR(255) NOT NULL
avatar_url      TEXT
role            ENUM('admin', 'manager', 'staff') DEFAULT 'staff'
department      VARCHAR(100)
employee_id     VARCHAR(50) UNIQUE          -- ID karyawan
join_date       DATE
annual_leave_balance  INT DEFAULT 12       -- saldo cuti tahunan
is_active       BOOLEAN DEFAULT true
google_id       VARCHAR(255)               -- untuk Google SSO
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `sessions`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
refresh_token   TEXT NOT NULL
device_info     TEXT
ip_address      INET
expires_at      TIMESTAMP NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `contacts`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
email           VARCHAR(255)
phone           VARCHAR(50)
company_id      UUID REFERENCES companies(id)
tags            TEXT[]
notes           TEXT
assigned_to     UUID REFERENCES users(id)
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `companies`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL
industry        VARCHAR(100)
size            ENUM('1-10','11-50','51-200','201-500','500+')
website         TEXT
address         TEXT
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `deal_stages`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL
order_index     INT NOT NULL
color           VARCHAR(7)              -- hex color
is_won          BOOLEAN DEFAULT false
is_lost         BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT NOW()
```

#### `deals`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           VARCHAR(255) NOT NULL
value           DECIMAL(15,2)
currency        VARCHAR(3) DEFAULT 'IDR'
stage_id        UUID REFERENCES deal_stages(id)
contact_id      UUID REFERENCES contacts(id)
assigned_to     UUID REFERENCES users(id)
expected_close  DATE
notes           TEXT
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `deal_activities`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
deal_id         UUID REFERENCES deals(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id)
type            ENUM('note','stage_change','email','call','meeting')
content         TEXT
metadata        JSONB                   -- stage before/after, dll
created_at      TIMESTAMP DEFAULT NOW()
```

#### `tasks`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
title           VARCHAR(255) NOT NULL
description     TEXT
assignee_id     UUID REFERENCES users(id)
created_by      UUID REFERENCES users(id)
priority        ENUM('low','medium','high') DEFAULT 'medium'
status          ENUM('open','in_progress','done') DEFAULT 'open'
due_date        DATE
related_deal_id UUID REFERENCES deals(id)     -- opsional
related_contact UUID REFERENCES contacts(id)  -- opsional
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `task_comments`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
task_id         UUID REFERENCES tasks(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id)
content         TEXT NOT NULL
created_at      TIMESTAMP DEFAULT NOW()
```

#### `office_locations`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(255) NOT NULL        -- "Kantor Pusat", "Cabang Bandung"
latitude        DECIMAL(10,8) NOT NULL
longitude       DECIMAL(11,8) NOT NULL
radius_meters   INT DEFAULT 100
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
```

#### `attendance_records`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
date            DATE NOT NULL
clock_in_at     TIMESTAMP
clock_out_at    TIMESTAMP
clock_in_lat    DECIMAL(10,8)
clock_in_lng    DECIMAL(11,8)
clock_out_lat   DECIMAL(10,8)
clock_out_lng   DECIMAL(11,8)
office_id       UUID REFERENCES office_locations(id)
status          ENUM('present','late','absent','leave','permission','sick')
work_mode       ENUM('onsite','wfh') DEFAULT 'onsite'
is_offline_sync BOOLEAN DEFAULT false        -- clock-in via offline
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, date)
```

#### `leave_types`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL        -- "Cuti Tahunan", "Sakit", dll
requires_approval BOOLEAN DEFAULT true
max_days        INT                          -- NULL = unlimited
created_at      TIMESTAMP DEFAULT NOW()
```

#### `leave_requests`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
leave_type_id   UUID REFERENCES leave_types(id)
start_date      DATE NOT NULL
end_date        DATE NOT NULL
total_days      INT NOT NULL
reason          TEXT
attachment_url  TEXT
status          ENUM('pending','approved','rejected') DEFAULT 'pending'
reviewed_by     UUID REFERENCES users(id)
reviewed_at     TIMESTAMP
review_notes    TEXT
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `push_subscriptions`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
endpoint        TEXT NOT NULL
p256dh          TEXT NOT NULL
auth            TEXT NOT NULL
device_name     TEXT
created_at      TIMESTAMP DEFAULT NOW()
UNIQUE(user_id, endpoint)
```

#### `notification_preferences`
```sql
user_id         UUID REFERENCES users(id) PRIMARY KEY
task_assigned   BOOLEAN DEFAULT true
task_due        BOOLEAN DEFAULT true
leave_status    BOOLEAN DEFAULT true
attendance_reminder BOOLEAN DEFAULT true
deal_update     BOOLEAN DEFAULT true
via_email       BOOLEAN DEFAULT true
via_push        BOOLEAN DEFAULT true
via_slack       BOOLEAN DEFAULT false
```

#### `audit_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
action          VARCHAR(100) NOT NULL        -- 'user.invite', 'deal.delete', dll
entity_type     VARCHAR(50)                 -- 'user', 'deal', 'contact', dll
entity_id       UUID
old_value       JSONB
new_value       JSONB
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### `system_settings`
```sql
key             VARCHAR(100) PRIMARY KEY
value           JSONB NOT NULL
updated_by      UUID REFERENCES users(id)
updated_at      TIMESTAMP DEFAULT NOW()
-- Contoh keys: 'org.name', 'org.logo', 'work_hours.start', 'work_hours.end',
--              'slack.webhook_url', 'google.client_id', 'attendance.late_threshold'
```

---

## 8. API Endpoint List

Base URL: `https://api.internal.company.com/v1`

Auth: `Authorization: Bearer <JWT>` di semua endpoint kecuali `/auth/*`

### 8.1 Auth

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/auth/login` | Login email + password | Public |
| POST | `/auth/google` | Login via Google OAuth | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/logout` | Logout & revoke refresh token | All |
| POST | `/auth/forgot-password` | Kirim email reset password | Public |
| POST | `/auth/reset-password` | Reset password via token | Public |

### 8.2 Users

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/users/me` | Profil user saat ini | All |
| PATCH | `/users/me` | Update profil sendiri | All |
| GET | `/users` | List semua user | Admin, Manager |
| POST | `/users/invite` | Undang user baru via email | Admin |
| PATCH | `/users/:id/role` | Ubah role user | Admin |
| PATCH | `/users/:id/status` | Suspend / aktifkan user | Admin |
| DELETE | `/users/:id` | Hapus user | Admin |

### 8.3 CRM — Contacts & Companies

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/contacts` | List kontak (filter, search, paginate) | All |
| POST | `/contacts` | Tambah kontak baru | All |
| GET | `/contacts/:id` | Detail kontak + activity log | All |
| PATCH | `/contacts/:id` | Update kontak | All |
| DELETE | `/contacts/:id` | Hapus kontak | Admin, Manager |
| GET | `/companies` | List perusahaan | All |
| POST | `/companies` | Tambah perusahaan | All |
| GET | `/companies/:id` | Detail perusahaan + kontak terkait | All |
| PATCH | `/companies/:id` | Update perusahaan | All |
| DELETE | `/companies/:id` | Hapus perusahaan | Admin, Manager |

### 8.4 CRM — Pipeline & Deals

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/pipeline/stages` | List semua stage | All |
| POST | `/pipeline/stages` | Tambah stage baru | Admin |
| PATCH | `/pipeline/stages/:id` | Update stage | Admin |
| DELETE | `/pipeline/stages/:id` | Hapus stage | Admin |
| GET | `/deals` | List deals (filter by stage, assignee) | All |
| POST | `/deals` | Buat deal baru | All |
| GET | `/deals/:id` | Detail deal + activities | All |
| PATCH | `/deals/:id` | Update deal (incl. pindah stage) | All |
| DELETE | `/deals/:id` | Hapus deal | Admin, Manager |
| POST | `/deals/:id/activities` | Tambah catatan/activity ke deal | All |

### 8.5 Tasks

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/tasks` | List tasks (filter status, assignee, priority) | All |
| POST | `/tasks` | Buat task baru | All |
| GET | `/tasks/:id` | Detail task + komentar | All |
| PATCH | `/tasks/:id` | Update task (status, assignee, dll) | All |
| DELETE | `/tasks/:id` | Hapus task | Admin, Manager |
| POST | `/tasks/:id/comments` | Tambah komentar | All |
| DELETE | `/tasks/:id/comments/:cid` | Hapus komentar | Admin, pemilik |

### 8.6 Absensi

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| POST | `/attendance/clock-in` | Clock-in dengan koordinat GPS | All |
| POST | `/attendance/clock-out` | Clock-out dengan koordinat GPS | All |
| POST | `/attendance/sync` | Sync clock-in offline (batch) | All |
| GET | `/attendance/today` | Status absensi hari ini (user sendiri) | All |
| GET | `/attendance/me` | Riwayat absensi user sendiri (paginate) | All |
| GET | `/attendance/me/summary` | Rekap bulanan user sendiri | All |
| GET | `/attendance` | Semua rekap absensi tim | Admin, Manager, HR |
| GET | `/attendance/export` | Export CSV rekap absensi | Admin, HR |
| GET | `/attendance/locations` | List lokasi kantor | All |
| POST | `/attendance/locations` | Tambah lokasi kantor | Admin |
| PATCH | `/attendance/locations/:id` | Update lokasi kantor | Admin |
| DELETE | `/attendance/locations/:id` | Hapus lokasi | Admin |
| GET | `/attendance/leaves` | List pengajuan cuti (user sendiri / tim) | All |
| POST | `/attendance/leaves` | Ajukan cuti/izin | All |
| GET | `/attendance/leaves/:id` | Detail pengajuan | All |
| PATCH | `/attendance/leaves/:id/approve` | Setujui cuti | Manager, Admin |
| PATCH | `/attendance/leaves/:id/reject` | Tolak cuti | Manager, Admin |
| GET | `/attendance/leave-types` | List jenis cuti | All |
| POST | `/attendance/leave-types` | Tambah jenis cuti | Admin |

### 8.7 Notifikasi

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/notifications` | List notifikasi user | All |
| PATCH | `/notifications/:id/read` | Tandai sudah dibaca | All |
| PATCH | `/notifications/read-all` | Tandai semua dibaca | All |
| GET | `/notifications/preferences` | Preferensi notifikasi | All |
| PATCH | `/notifications/preferences` | Update preferensi | All |
| POST | `/notifications/push/subscribe` | Daftar push subscription | All |
| DELETE | `/notifications/push/unsubscribe` | Hapus push subscription | All |

### 8.8 Backoffice

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/backoffice/audit-logs` | List audit log (filter, paginate) | Admin |
| GET | `/backoffice/audit-logs/export` | Export CSV audit log | Admin |
| GET | `/backoffice/settings` | Semua system settings | Admin |
| PATCH | `/backoffice/settings` | Update system settings | Admin |
| GET | `/backoffice/health` | Status integrasi & queue | Admin |

### 8.9 Dashboard & Reporting

| Method | Endpoint | Deskripsi | Role |
|--------|----------|-----------|------|
| GET | `/dashboard/overview` | Widget utama (CRM, task, absensi) | All |
| GET | `/reports/pipeline` | Laporan pipeline deals | Manager, Admin |
| GET | `/reports/tasks` | Laporan task completion per user | Manager, Admin |
| GET | `/reports/attendance` | Laporan absensi per periode | Admin, HR |
| GET | `/reports/attendance/export` | Export CSV laporan absensi | Admin, HR |

---

## 9. Design System Guidelines

### 9.1 Filosofi

> **"Mobile-first, clarity-first."** Karena platform ini digunakan karyawan di HP untuk absensi dan di desktop untuk CRM, setiap komponen harus nyaman di kedua konteks. Tidak ada informasi yang tersembunyi, tidak ada aksi yang ambigu.

### 9.2 Color Palette

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `primary-500` | `#2563EB` | CTA utama, link, fokus aktif |
| `primary-600` | `#1D4ED8` | Hover state CTA |
| `primary-50` | `#EFF6FF` | Background highlight ringan |
| `success-500` | `#16A34A` | Status hadir, deal Won, approved |
| `success-50` | `#F0FDF4` | Background success alert |
| `warning-500` | `#D97706` | Terlambat, deadline dekat |
| `warning-50` | `#FFFBEB` | Background warning |
| `danger-500` | `#DC2626` | Error, tidak hadir, rejected |
| `danger-50` | `#FEF2F2` | Background error/danger |
| `neutral-900` | `#111827` | Teks utama |
| `neutral-500` | `#6B7280` | Teks sekunder, placeholder |
| `neutral-200` | `#E5E7EB` | Border, divider |
| `neutral-50` | `#F9FAFB` | Background halaman |
| `white` | `#FFFFFF` | Background card |

**Dark Mode:** Semua token punya pasangan dark mode via Tailwind `dark:` prefix. Diaktifkan berdasarkan system preference.

### 9.3 Typography

Font: **Inter** (Google Fonts) — clean, readable di semua ukuran.

| Nama | Size | Weight | Line Height | Penggunaan |
|------|------|--------|-------------|------------|
| `display-lg` | 30px | 700 | 1.2 | Judul halaman utama |
| `display-sm` | 24px | 700 | 1.3 | Judul section |
| `heading-lg` | 20px | 600 | 1.4 | Card title, modal heading |
| `heading-sm` | 16px | 600 | 1.4 | Sub-heading, label grup |
| `body-lg` | 16px | 400 | 1.6 | Paragraf, form label |
| `body-sm` | 14px | 400 | 1.5 | Konten tabel, deskripsi |
| `caption` | 12px | 400 | 1.4 | Timestamp, meta info |
| `label` | 12px | 500 | 1 | Badge, chip, tag |

### 9.4 Spacing System

Berbasis 4px grid. Gunakan kelipatan 4:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

| Token | Value | Contoh Penggunaan |
|-------|-------|-------------------|
| `space-1` | 4px | Gap antara icon dan label |
| `space-2` | 8px | Padding chip/badge |
| `space-3` | 12px | Gap dalam form field |
| `space-4` | 16px | Padding card, gap antar item list |
| `space-6` | 24px | Padding halaman mobile |
| `space-8` | 32px | Gap antar section |
| `space-12` | 48px | Margin antar halaman section |

### 9.5 Breakpoints (Mobile-First)

| Nama | Min-width | Target Device |
|------|-----------|---------------|
| `xs` (default) | 0px | HP kecil (320–374px) |
| `sm` | 375px | HP standar |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

### 9.6 Component Library (shadcn/ui based)

Semua komponen dibangun di atas **shadcn/ui** + **Radix UI** + **Tailwind**. Tidak membuat komponen dari nol kecuali sangat spesifik.

| Komponen | Variant | Catatan |
|----------|---------|---------|
| `Button` | primary, secondary, ghost, danger, icon-only | Min touch target 44×44px di mobile |
| `Input` | default, error, disabled | Label selalu di atas (bukan floating) |
| `Select` | single, searchable | Gunakan `cmdk` untuk searchable |
| `Badge` | success, warning, danger, neutral | Dipakai untuk status absensi, deal stage |
| `Card` | default, interactive (clickable) | Shadow subtle: `shadow-sm` |
| `Modal / Dialog` | sm, md, lg | Full-screen di mobile |
| `Sheet / Drawer` | bottom (mobile), right (desktop) | Untuk form edit di mobile |
| `Table` | default, compact | Horizontal scroll di mobile |
| `Kanban Board` | draggable via dnd-kit | Pipeline deals |
| `Calendar` | bulan view | Riwayat absensi |
| `Toast` | success, error, warning | Konfirmasi aksi |
| `Skeleton` | default | Loading state semua komponen |
| `Avatar` | image + fallback initials | User profile |
| `GPS Map** | Leaflet.js embed | Tampilkan pin lokasi absensi |

### 9.7 Komponen Absensi (Khusus)

Dirancang mobile-first, aksi utama harus bisa dilakukan dengan satu tangan:

```
┌──────────────────────────┐
│   Selasa, 3 Juni 2025    │  ← Tanggal hari ini
│                          │
│  📍 Dalam radius kantor  │  ← Status GPS (hijau/merah)
│     Jarak: 45m           │
│                          │
│  ┌────────────────────┐  │
│  │   CLOCK IN         │  │  ← Tombol besar, min 80px height
│  │   09:00            │  │
│  └────────────────────┘  │
│                          │
│  Kemarin: Hadir 08:58    │  ← Info hari sebelumnya
└──────────────────────────┘
```

- Tombol Clock-In/Out: `h-20`, full-width, warna berbeda (biru/merah)
- Status GPS: indikator warna real-time sebelum tombol aktif
- Feedback: loading spinner saat proses, lalu toast konfirmasi
- Offline indicator: banner kuning "Mode Offline — akan disinkron saat ada koneksi"

### 9.8 Ikonografi

Library: **Lucide React** (konsisten dengan shadcn/ui)

| Ikon | Konteks |
|------|---------|
| `Clock` | Absensi, jam |
| `MapPin` | Lokasi GPS |
| `Users` | Tim, karyawan |
| `BarChart2` | Dashboard, laporan |
| `CheckSquare` | Task selesai |
| `Bell` | Notifikasi |
| `Settings` | Backoffice, konfigurasi |
| `Building2` | Perusahaan |
| `CalendarDays` | Cuti, kalender |
| `Wifi` / `WifiOff` | Status koneksi |

### 9.9 Animasi & Motion

- Prinsip: **Subtle, functional** — animasi ada tujuan, bukan dekorasi
- Duration: `150ms` (micro-interaction), `250ms` (transisi halaman), `300ms` (modal)
- Easing: `ease-out` untuk masuk, `ease-in` untuk keluar
- Gunakan `framer-motion` untuk: page transition, modal, drag kanban
- Respek `prefers-reduced-motion`: semua animasi dimatikan jika user set reduced motion

---

## 10. Timeline & Milestones

Target MVP selesai dalam **4 minggu**.

| Minggu | Sprint | Output |
|--------|--------|--------|
| **Minggu 1** | Setup & Foundation | Monorepo + Turborepo, NestJS scaffold, Prisma schema + migrasi, Auth (JWT + Google SSO), PWA manifest + service worker dasar, Layout Next.js + Design tokens |
| **Minggu 2** | CRM + Absensi Core | Modul Kontak, Perusahaan, Pipeline Deal; **Modul Absensi: clock-in/out + GPS verify + rekap**; Backoffice: User Management + Audit Log |
| **Minggu 3** | Task + Notifikasi + Integrasi | Task management, **Cuti & approval workflow**, Web Push notifikasi, Offline sync (Background Sync), Slack integration, Backoffice: System Config |
| **Minggu 4** | Dashboard + PWA Polish + QA | Dashboard & reporting (CRM + Absensi), **PWA install prompt + Lighthouse audit**, Bug fixing, UAT internal (3 role berbeda), Deploy production |

### Definisi "Done" untuk MVP

- Semua fitur Must Have berjalan tanpa critical bug
- PWA: Lighthouse PWA score ≥ 90, installable di Android & iOS (via "Add to Home Screen")
- Offline clock-in berfungsi dan sync otomatis
- Diuji oleh minimal 5 internal user dari role berbeda
- Deployed ke environment production dengan HTTPS
- Monitoring aktif: Sentry + Better Uptime

---

## 11. Risiko & Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Scope creep (fitur absensi meluas) | Tinggi | Timeline meleset | Freeze scope; cuti & rekap masuk Minggu 3 bukan lebih awal |
| GPS tidak akurat di dalam gedung | Sedang | Karyawan tidak bisa absen | Tambah toleransi radius; fallback manual approval oleh manager |
| Background Sync tidak didukung browser lama | Sedang | Offline sync tidak jalan | Polyfill + fallback: simpan di localStorage, user klik "Sync Manual" |
| iOS PWA: Web Push tidak didukung (< iOS 16.4) | Sedang | Push notif absen di iPhone lama | Informasikan user; fallback ke email notif |
| Integrasi Google/Slack lebih lama dari estimasi | Sedang | Delay notif | OAuth flow mulai Minggu 1 paralel dengan CRM |
| Tim kekurangan kapasitas | Rendah | Fitur terpotong | Prioritaskan Must Have; Should Have bisa digeser ke sprint berikutnya |

---

## 12. Metrics Keberhasilan

| Metrik | Target (30 hari post-launch) |
|--------|------------------------------|
| Adopsi absensi | ≥ 90% karyawan clock-in via platform (bukan manual) |
| PWA install rate | ≥ 60% karyawan install di HP |
| Adopsi CRM | ≥ 80% sales aktif input kontak/deal per minggu |
| Offline sync success rate | ≥ 99% clock-in offline berhasil disinkron |
| Bug critical | 0 dalam 2 minggu post-launch |
| Lighthouse PWA score | ≥ 90 |
| NPS internal | ≥ 7/10 dari survey user |

---

## 13. Open Questions

- [ ] Apakah ada multi-lokasi kantor? (cabang, site berbeda) → perlu konfigurasi multi office_location
- [ ] Jam kerja berbeda per departemen atau sama semua?
- [ ] Bagaimana handle karyawan yang sering di luar kantor (sales lapangan)? — WFH mode cukup?
- [ ] iOS push notification: apakah karyawan mayoritas Android atau ada banyak iPhone?
- [ ] Apakah cuti memerlukan approval 2 level (Manager + HR) atau cukup 1 level?
- [ ] Apakah perlu SSO selain Google? (Microsoft/Azure AD)
- [ ] Siapa yang bisa delete kontak — hanya Admin atau semua role?
- [ ] Apakah notifikasi Slack dikirim ke channel global atau per departemen?

---

## 14. Appendix

### Glossary

| Term | Definisi |
|------|----------|
| **PWA** | Progressive Web App — web app yang bisa diinstall dan bekerja offline seperti native app |
| **Service Worker** | Script background yang mengelola cache, offline, dan push notification di browser |
| **Background Sync** | API browser untuk mengirim data yang gagal saat offline, otomatis saat kembali online |
| **VAPID** | Voluntary Application Server Identification — standar keamanan untuk Web Push API |
| **Deal** | Opportunity penjualan yang sedang ditrack di pipeline |
| **Stage** | Tahapan dalam pipeline (New, Qualified, dst) |
| **Clock-in / Clock-out** | Rekam jam masuk dan jam keluar kerja |
| **WFH** | Work From Home — bekerja dari luar kantor |
| **GPS Radius** | Area berbentuk lingkaran di sekitar koordinat kantor, sebagai zona valid absensi |
| **SSO** | Single Sign-On — login menggunakan akun yang sudah ada (Google, dll) |

### Referensi
- [Figma Design File](#) — *(link akan diisi designer)*
- [DB Schema Diagram (dbdiagram.io)](#) — *(link akan diisi dev)*
- [API Documentation (Swagger)](#) — *(link akan diisi dev)*
- [PWA Checklist — web.dev](https://web.dev/pwa-checklist/)
- [NestJS Docs](https://docs.nestjs.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Workbox (next-pwa)](https://github.com/shadowwalker/next-pwa)
