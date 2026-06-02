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
  Info,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal, useConfirmModal } from './ConfirmModal';

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
    currentUser,
    housingProjects,
    addHousingProject,
    deleteHousingProject
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'offices' | 'audit' | 'housing'>('users');
  const [usersView, setUsersView] = useState<'table' | 'cards'>('table');
  const [officesView, setOfficesView] = useState<'table' | 'cards'>('table');
  const [auditView, setAuditView] = useState<'table' | 'cards'>('table');
  const [housingView, setHousingView] = useState<'table' | 'cards'>('table');
  
  // Modals visibility
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showHousingModal, setShowHousingModal] = useState(false);

  // Confirm modal
  const { openConfirm, modalProps: confirmModalProps } = useConfirmModal();

  // Form states
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'staff' as any, department: '' });
  const [officeForm, setOfficeForm] = useState({ name: '', latitude: 0, longitude: 0, radius_meters: 100, is_active: true });
  const [housingForm, setHousingForm] = useState({ name: '', location: '', price_range: '' });

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

  const handleHousingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!housingForm.name || !housingForm.location) return;

    addHousingProject(housingForm);
    setHousingForm({ name: '', location: '', price_range: '' });
    setShowHousingModal(false);
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
          {activeSubTab === 'housing' && (
            <button className="btn btn-primary" onClick={() => setShowHousingModal(true)}>
              <Plus size={16} /> Tambah Perumahan Baru
            </button>
          )}
        </div>
      </div>

      {/* VIEW SUB-TABS */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)', width: 'fit-content', flexWrap: 'wrap' }}>
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
            onClick={() => setActiveSubTab('housing')}
            className={`btn ${activeSubTab === 'housing' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Proyek Perumahan
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
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="card-title">Daftar Akun Karyawan</span>
            <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn ${usersView === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setUsersView('cards')}
                type="button"
              >
                <LayoutGrid size={14} /> Kartu
              </button>
              <button
                className={`btn ${usersView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setUsersView('table')}
                type="button"
              >
                <List size={14} /> Tabel
              </button>
            </div>
          </div>

          {usersView === 'table' ? (
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', padding: '20px' }}>
              {users.map(user => (
                <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{user.employee_id}</span>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 0 0' }}>{user.name}</h4>
                    </div>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {user.is_active ? 'AKTIF' : 'SUSPENDED'}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>Divisi:</strong> {user.department}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <strong>Role:</strong>
                      <select
                        className="select"
                        style={{ padding: '2px 6px', fontSize: 12, width: '110px', minHeight: 'unset' }}
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                        disabled={user.id === currentUser.id}
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {user.id !== currentUser.id && (
                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <button
                        className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
                        style={{ width: '100%', minHeight: 28, padding: '4px 10px', fontSize: 12 }}
                        onClick={() => updateUserStatus(user.id, !user.is_active)}
                        type="button"
                      >
                        {user.is_active ? 'Suspend Akun' : 'Aktifkan Akun'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: OFFICE CONFIGURATIONS */}
      {activeSubTab === 'offices' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="card-title">Konfigurasi Lokasi Kantor & Radius GPS</span>
            <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn ${officesView === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setOfficesView('cards')}
                type="button"
              >
                <LayoutGrid size={14} /> Kartu
              </button>
              <button
                className={`btn ${officesView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setOfficesView('table')}
                type="button"
              >
                <List size={14} /> Tabel
              </button>
            </div>
          </div>

          {officesView === 'table' ? (
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', padding: '20px' }}>
              {offices.map(office => (
                <div key={office.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{office.name}</span>
                    <span className={`badge ${office.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {office.is_active ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div><strong>Latitude:</strong> {office.latitude.toFixed(6)}</div>
                    <div><strong>Longitude:</strong> {office.longitude.toFixed(6)}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <strong>Radius Toleransi:</strong>
                      <span className="badge badge-neutral">{office.radius_meters} meter</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', minHeight: 28, padding: '4px 10px', fontSize: 12 }}
                      onClick={() => updateOffice({ ...office, is_active: !office.is_active })}
                      type="button"
                    >
                      Toggle Status Kantor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="card-title">Tinjau Audit Logs Aktivitas</span>
            <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn ${auditView === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setAuditView('cards')}
                type="button"
              >
                <LayoutGrid size={14} /> Kartu
              </button>
              <button
                className={`btn ${auditView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setAuditView('table')}
                type="button"
              >
                <List size={14} /> Tabel
              </button>
            </div>
          </div>

          <div style={{ padding: 12, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <Info size={16} />
            <span>Audit log ini bersifat read-only dan merekam setiap aktivitas sensitif demi akuntabilitas data operasional.</span>
          </div>

          {auditView === 'table' ? (
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
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '4px 0' }}>
              {auditLogs.map(log => (
                <div key={log.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                    <span className="badge badge-neutral">{log.entity_type.toUpperCase()}</span>
                  </div>

                  <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <div><strong>Aktor:</strong> {log.user_name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <strong>Operasi:</strong>
                      <span className="badge badge-primary" style={{ textTransform: 'none' }}>{log.action}</span>
                    </div>
                    <div><strong>Detail:</strong> {log.details}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>
                      <strong>IP:</strong> {log.ip_address}
                    </div>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 14 }}>
                  Belum ada audit log terekam.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: HOUSING PROJECTS */}
      {activeSubTab === 'housing' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span className="card-title">Daftar Proyek Perumahan Developer</span>
            <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn ${housingView === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setHousingView('cards')}
                type="button"
              >
                <LayoutGrid size={14} /> Kartu
              </button>
              <button
                className={`btn ${housingView === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 8px', minHeight: 'unset', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                onClick={() => setHousingView('table')}
                type="button"
              >
                <List size={14} /> Tabel
              </button>
            </div>
          </div>

          {housingView === 'table' ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Perumahan / Klaster</th>
                    <th>Lokasi Wilayah</th>
                    <th>Kisaran Harga Jual</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {housingProjects.map((project) => (
                    <tr key={project.id}>
                      <td style={{ fontWeight: 600 }}>{project.name}</td>
                      <td>{project.location}</td>
                      <td><span className="badge badge-primary">{project.price_range || '-'}</span></td>
                      <td>
                        <button
                          className="btn btn-danger"
                          style={{ minHeight: 28, padding: '4px 10px', fontSize: 11 }}
                          onClick={() => openConfirm({
                            title: 'Hapus Proyek Perumahan',
                            message: `Apakah Anda yakin ingin menghapus proyek "${project.name}"? Tindakan ini tidak dapat dibatalkan.`,
                            confirmLabel: 'Ya, Hapus',
                            variant: 'danger',
                            onConfirm: () => deleteHousingProject(project.id),
                          })}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {housingProjects.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada proyek perumahan yang terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', padding: '20px' }}>
              {housingProjects.map(project => (
                <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{project.name}</h4>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                      Lokasi: {project.location}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                    <span className="badge badge-primary">{project.price_range || '-'}</span>
                    <button
                      className="btn btn-danger"
                      style={{ minHeight: 28, padding: '4px 10px', fontSize: 11 }}
                      onClick={() => openConfirm({
                        title: 'Hapus Proyek Perumahan',
                        message: `Apakah Anda yakin ingin menghapus proyek "${project.name}"? Tindakan ini tidak dapat dibatalkan.`,
                        confirmLabel: 'Ya, Hapus',
                        variant: 'danger',
                        onConfirm: () => deleteHousingProject(project.id),
                      })}
                      type="button"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {housingProjects.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 14 }}>
                  Belum ada proyek perumahan yang terdaftar.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* INVITE KARYAWAN MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleInviteSubmit}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
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
          </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OFFICE CREATOR MODAL */}
      <AnimatePresence>
        {showOfficeModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowOfficeModal(false)}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleOfficeSubmit}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
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
          </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOUSING CREATOR MODAL */}
      <AnimatePresence>
        {showHousingModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setShowHousingModal(false)}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleHousingSubmit}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Tambah Proyek Perumahan Baru</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowHousingModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Perumahan / Klaster *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bukit Sentosa Cluster"
                  className="input"
                  value={housingForm.name}
                  onChange={(e) => setHousingForm({ ...housingForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi Wilayah *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bogor Selatan"
                  className="input"
                  value={housingForm.location}
                  onChange={(e) => setHousingForm({ ...housingForm, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kisaran Harga Jual (e.g. Rp 500jt - 900jt)</label>
                <input
                  type="text"
                  placeholder="e.g. Rp 600jt - 1.2M"
                  className="input"
                  value={housingForm.price_range}
                  onChange={(e) => setHousingForm({ ...housingForm, price_range: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowHousingModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan Proyek</button>
            </div>
          </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Confirm Dialog */}
      <ConfirmModal {...confirmModalProps} />
    </div>
  );
};

