import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Users,
  MapPin,
  FileCheck,
  Plus,
  UserPlus,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Info
} from 'lucide-react';

export const BackofficeView: React.FC = () => {
  const {
    users,
    offices,
    auditLogs,
    inviteUser,
    updateUserStatus,
    updateUserRole,
    addOffice,
    updateOffice,
    currentUser
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'offices' | 'audit'>('users');
  
  // Modals visibility
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);

  // Form states
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'staff' as any, department: '' });
  const [officeForm, setOfficeForm] = useState({ name: '', latitude: 0, longitude: 0, radius_meters: 100, is_active: true });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    inviteUser(inviteForm.name, inviteForm.email, inviteForm.role, inviteForm.department);
    setInviteForm({ name: '', email: '', role: 'staff', department: '' });
    setShowInviteModal(false);
  };

  const handleOfficeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeForm.name || !officeForm.latitude || !officeForm.longitude) return;

    addOffice(officeForm);
    setOfficeForm({ name: '', latitude: 0, longitude: 0, radius_meters: 100, is_active: true });
    setShowOfficeModal(false);
  };

  // Auth Guard check in view
  if (currentUser.role !== 'admin') {
    return (
      <div className="main-content">
        <div className="card text-center" style={{ padding: 48 }}>
          <ShieldCheck size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, color: 'var(--text-main)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            Halaman Backoffice Panel hanya dapat diakses oleh Admin / HR Lead. Silakan ganti akun simulasi Anda ke Admin di footer/header.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* TITLE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Backoffice Control Panel</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Kelola user, buat kantor cabang baru, dan tinjau audit log historis seluruh karyawan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {activeSubTab === 'users' && (
            <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
              <UserPlus size={16} /> Undang Karyawan
            </button>
          )}
          {activeSubTab === 'offices' && (
            <button className="btn btn-primary" onClick={() => setShowOfficeModal(true)}>
              <MapPin size={16} /> Tambah Kantor Baru
            </button>
          )}
        </div>
      </div>

      {/* VIEW SUB-TABS */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Manajemen Karyawan
          </button>
          <button
            onClick={() => setActiveSubTab('offices')}
            className={`btn ${activeSubTab === 'offices' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Lokasi Kantor
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`btn ${activeSubTab === 'audit' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Audit Logs Sistem
          </button>
        </div>
      </div>

      {/* TAB CONTENT: USER MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Daftar Akun Karyawan</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>NIP (ID)</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>Divisi / Departemen</th>
                  <th>Role Hak Akses</th>
                  <th>Status Akun</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.employee_id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.department}</td>
                    <td>
                      <select
                        className="select"
                        style={{ padding: '4px 8px', fontSize: 12, width: '130px' }}
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                        disabled={user.id === currentUser.id} // Don't let users edit their own role in simulation
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'AKTIF' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td>
                      {user.id !== currentUser.id && (
                        <button
                          className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
                          style={{ minHeight: 28, padding: '4px 10px', fontSize: 11 }}
                          onClick={() => updateUserStatus(user.id, !user.is_active)}
                        >
                          {user.is_active ? 'Suspend' : 'Aktifkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OFFICE CONFIGURATIONS */}
      {activeSubTab === 'offices' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Konfigurasi Lokasi Kantor & Radius GPS</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Kantor / Cabang</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Radius Toleransi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {offices.map((office) => (
                  <tr key={office.id}>
                    <td style={{ fontWeight: 600 }}>{office.name}</td>
                    <td>{office.latitude.toFixed(6)}</td>
                    <td>{office.longitude.toFixed(6)}</td>
                    <td><span className="badge badge-neutral">{office.radius_meters} meter</span></td>
                    <td>
                      <span className={`badge ${office.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {office.is_active ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ minHeight: 28, padding: '4px 10px', fontSize: 11 }}
                        onClick={() => updateOffice({ ...office, is_active: !office.is_active })}
                      >
                        Toggle Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tinjau Audit Logs Aktivitas</span>
          </div>

          <div style={{ padding: 12, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <Info size={16} />
            <span>Audit log ini bersifat read-only dan merekam setiap aktivitas sensitif demi akuntabilitas data operasional.</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu Kejadian</th>
                  <th>Pelaku Aksi</th>
                  <th>Tipe Modul</th>
                  <th>Aksi Operasi</th>
                  <th>Rincian Keterangan</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td style={{ fontWeight: 600 }}>{log.user_name}</td>
                    <td><span className="badge badge-neutral">{log.entity_type.toUpperCase()}</span></td>
                    <td><span className="badge badge-primary">{log.action}</span></td>
                    <td style={{ fontSize: 12 }}>{log.details}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ip_address}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Belum ada audit log terekam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITE KARYAWAN MODAL */}
      {showInviteModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleInviteSubmit}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Undang Karyawan Baru</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Email *</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                />
              </div>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Divisi / Departemen *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales & Business"
                    className="input"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hak Akses (Role) *</label>
                  <select
                    required
                    className="select"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Kirim Undangan</button>
            </div>
          </form>
        </div>
      )}

      {/* OFFICE CREATOR MODAL */}
      {showOfficeModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleOfficeSubmit}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Tambah Lokasi Kantor Cabang</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowOfficeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Cabang Kantor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cabang Yogyakarta"
                  className="input"
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    className="input"
                    value={officeForm.latitude || ''}
                    onChange={(e) => setOfficeForm({ ...officeForm, latitude: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    className="input"
                    value={officeForm.longitude || ''}
                    onChange={(e) => setOfficeForm({ ...officeForm, longitude: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Radius Toleransi GPS (meter) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  className="input"
                  value={officeForm.radius_meters}
                  onChange={(e) => setOfficeForm({ ...officeForm, radius_meters: Number(e.target.value) || 100 })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowOfficeModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Kantor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
