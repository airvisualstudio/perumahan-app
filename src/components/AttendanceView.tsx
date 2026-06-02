import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useGeolocation, getDistanceInMeters } from '../hooks/useGeolocation';
import {
  Clock,
  MapPin,
  CalendarDays,
  FileCheck,
  Send,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  UserCheck
} from 'lucide-react';

export const AttendanceView: React.FC = () => {
  const {
    currentUser,
    offices,
    attendance,
    leaves,
    submitLeave,
    reviewLeave,
    clockIn,
    clockOut,
    offlineSyncQueue,
    syncOfflineData
  } = useApp();

  const { coords, error: gpsError, loading: gpsLoading } = useGeolocation();
  const [activeTab, setActiveTab] = useState<'clock' | 'history' | 'leave'>('clock');
  
  // Geolocation states
  const [gpsSimulated, setGpsSimulated] = useState<boolean>(true);
  const [simLocation, setSimLocation] = useState<'inside' | 'outside'>('inside');
  const [simOffline, setSimOffline] = useState<boolean>(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(offices[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Cuti Tahunan' as any,
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Selected office object
  const activeOffice = offices.find(o => o.id === selectedOfficeId) || offices[0];

  // Coordinates formulation
  const currentLat = gpsSimulated
    ? (activeOffice ? (simLocation === 'inside' ? activeOffice.latitude + 0.0001 : activeOffice.latitude + 0.003) : -6.2088)
    : (coords?.latitude || -6.2088);
  const currentLng = gpsSimulated
    ? (activeOffice ? (simLocation === 'inside' ? activeOffice.longitude + 0.0001 : activeOffice.longitude + 0.003) : 106.8456)
    : (coords?.longitude || 106.8456);

  const distance = activeOffice
    ? getDistanceInMeters(currentLat, currentLng, activeOffice.latitude, activeOffice.longitude)
    : 0;
  const isWithinRadius = activeOffice ? distance <= activeOffice.radius_meters : false;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.user_id === currentUser.id && a.date === todayStr);

  const handleClockInAction = () => {
    if (!activeOffice) return;
    clockIn(
      activeOffice.id,
      currentLat,
      currentLng,
      notes || (simOffline ? 'Offline Clock-in' : 'GPS Clock-in'),
      simOffline
    );
    setNotes('');
  };

  const handleClockOutAction = () => {
    clockOut(
      currentLat,
      currentLng,
      notes || (simOffline ? 'Offline Clock-out' : 'GPS Clock-out'),
      simOffline
    );
    setNotes('');
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) return;

    // Calc total days (simple difference)
    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    submitLeave({
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      total_days: totalDays,
      reason: leaveForm.reason
    });

    setLeaveForm({ leave_type: 'Cuti Tahunan', start_date: '', end_date: '', reason: '' });
    setShowLeaveForm(false);
  };

  // Filter lists
  const myAttendance = attendance.filter(a => a.user_id === currentUser.id);
  const myLeaves = leaves.filter(l => l.user_id === currentUser.id);
  const pendingTeamLeaves = leaves.filter(l => l.status === 'pending'); // Visible to managers/admins

  return (
    <div className="main-content">
      {/* HEADER TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Absensi & Cuti Karyawan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Lakukan absensi mandiri, ajukan izin/cuti, dan pantau rekapitulasi kehadiran bulanan.
          </p>
        </div>

        {/* Network State Simulator */}
        <button
          onClick={() => setSimOffline(!simOffline)}
          className={`btn ${simOffline ? 'btn-danger' : 'btn-secondary'}`}
          style={{ minHeight: 34, padding: '4px 12px', fontSize: 12 }}
        >
          {simOffline ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><WifiOff size={14} /> <span>Mode: OFFLINE (Simulasi)</span></div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wifi size={14} /> <span>Mode: ONLINE</span></div>
          )}
        </button>
      </div>

      {/* SUB MENU TABS */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
          <button
            onClick={() => setActiveTab('clock')}
            className={`btn ${activeTab === 'clock' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Clock-in / Out
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Riwayat Kehadiran
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`btn ${activeTab === 'leave' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
          >
            Pengajuan Cuti / Izin
          </button>
        </div>
      </div>

      {/* CLOCK PAGE */}
      {activeTab === 'clock' && (
        <div className="grid-cols-2">
          {/* Main big button card */}
          <div className="clock-btn-container">
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>

            {/* Offline Sync Banner warnings */}
            {simOffline && (
              <div className="offline-banner" style={{ width: '100%' }}>
                <span>Mode Offline Aktif. Absensi Anda akan disimpan lokal dan disinkron saat online.</span>
              </div>
            )}
            
            {offlineSyncQueue.length > 0 && !simOffline && (
              <div className="offline-banner" style={{ width: '100%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'rgba(37, 99, 235, 0.3)' }}>
                <span>Ada {offlineSyncQueue.length} data absensi offline.</span>
                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11, minHeight: 'unset' }} onClick={syncOfflineData}>
                  Sync Sekarang
                </button>
              </div>
            )}

            {/* Big Action Clock button */}
            {!todayRecord ? (
              <button
                className="clock-btn in"
                disabled={!isWithinRadius && !simOffline}
                onClick={handleClockInAction}
              >
                <Clock size={36} />
                <span>CLOCK IN</span>
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>09:00 WIB</span>
              </button>
            ) : !todayRecord.clock_out_at ? (
              <button
                className="clock-btn out"
                onClick={handleClockOutAction}
              >
                <Clock size={36} />
                <span>CLOCK OUT</span>
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>18:00 WIB</span>
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, backgroundColor: 'var(--bg)', borderRadius: '50%', width: 160, height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--success)' }}>
                <CheckCircle size={32} color="var(--success)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', marginTop: 8 }}>ABSEN SELESAI</span>
              </div>
            )}

            {/* Today status values details */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
              {todayRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Masuk:</span>
                    <span style={{ fontWeight: 600, color: todayRecord.status === 'present' ? 'var(--success)' : 'var(--warning)' }}>
                      {todayRecord.status === 'present' ? 'HADIR' : 'TERLAMBAT'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Waktu Clock-in:</span>
                    <span style={{ fontWeight: 600 }}>{new Date(todayRecord.clock_in_at!).toLocaleTimeString('id-ID')}</span>
                  </div>
                  {todayRecord.clock_out_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Waktu Clock-out:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(todayRecord.clock_out_at).toLocaleTimeString('id-ID')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: 'var(--danger)', textAlign: 'center' }}>
                  Anda belum melakukan check-in hari ini.
                </p>
              )}
            </div>
          </div>

          {/* Location & GPS Info check card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card-header">
              <span className="card-title">Lokasi & GPS Radius</span>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Pilih Lokasi Kantor</label>
              <select
                className="select"
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
              >
                {offices.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            {/* Simulated settings */}
            <div style={{ backgroundColor: 'var(--bg)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Simulasikan Posisi Karyawan:</span>
                <input
                  type="checkbox"
                  checked={gpsSimulated}
                  onChange={(e) => setGpsSimulated(e.target.checked)}
                />
              </div>

              {gpsSimulated && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSimLocation('inside')}
                    className={`btn ${simLocation === 'inside' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                  >
                    Dalam Kantor (Radius 45m)
                  </button>
                  <button
                    onClick={() => setSimLocation('outside')}
                    className={`btn ${simLocation === 'outside' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                  >
                    Di Luar Kantor (1.2km)
                  </button>
                </div>
              )}
            </div>

            {/* GPS verification box */}
            {activeOffice && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nama Kantor:</span>
                  <span style={{ fontWeight: 600 }}>{activeOffice.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Radius Toleransi:</span>
                  <span style={{ fontWeight: 600 }}>{activeOffice.radius_meters} meter</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jarak Koordinat Anda:</span>
                  <span style={{ fontWeight: 600, color: isWithinRadius ? 'var(--success)' : 'var(--danger)' }}>
                    {Math.round(distance)} meter
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isWithinRadius ? 'var(--success-light)' : 'var(--danger-light)',
                    color: isWithinRadius ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${isWithinRadius ? 'hsl(142, 76%, 80%)' : 'hsl(0, 84%, 80%)'}`,
                    fontWeight: 600
                  }}
                >
                  {isWithinRadius ? (
                    <>
                      <CheckCircle size={16} /> <span>Lokasi Absen Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} /> <span>Di Luar Radius (Clock-in Dinonaktifkan)</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Catatan Tambahan (misal: "Macet", "Ada kunjungan client")</label>
              <input
                type="text"
                placeholder="Tulis alasan jika datang terlambat..."
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* HISTORY PAGE */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Riwayat Absensi Saya</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Jam Masuk</th>
                  <th>Jam Keluar</th>
                  <th>Status</th>
                  <th>Metode Kerja</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map(record => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600 }}>{record.date}</td>
                    <td>{record.clock_in_at ? new Date(record.clock_in_at).toLocaleTimeString('id-ID') : '-'}</td>
                    <td>{record.clock_out_at ? new Date(record.clock_out_at).toLocaleTimeString('id-ID') : '-'}</td>
                    <td>
                      <span className={`badge ${
                        record.status === 'present' ? 'badge-success' :
                        record.status === 'late' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {record.status === 'present' ? 'Hadir' : record.status === 'late' ? 'Terlambat' : 'Absen'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{record.work_mode.toUpperCase()}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.notes || '-'}</td>
                  </tr>
                ))}
                {myAttendance.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Belum ada riwayat kehadiran tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVE SUBMISSION / APPROVAL PAGE */}
      {activeTab === 'leave' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Managers Review Pending Leaves */}
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="card">
              <div className="card-header">
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} color="var(--primary)" /> Menunggu Persetujuan Cuti Tim ({pendingTeamLeaves.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingTeamLeaves.map(leave => (
                  <div key={leave.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{leave.user_name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Mengajukan <strong>{leave.leave_type}</strong> ({leave.total_days} Hari)
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Periode: {leave.start_date} s/d {leave.end_date}
                      </span>
                      <p style={{ fontSize: 13, margin: 0, marginTop: 4, fontStyle: 'italic' }}>
                        Alasan: "{leave.reason}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary"
                        style={{ minHeight: 32, fontSize: 12, padding: '4px 12px' }}
                        onClick={() => reviewLeave(leave.id, 'rejected', 'Ditolak oleh atasan')}
                      >
                        Tolak
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ minHeight: 32, fontSize: 12, padding: '4px 12px' }}
                        onClick={() => reviewLeave(leave.id, 'approved', 'Disetujui oleh atasan')}
                      >
                        Setujui
                      </button>
                    </div>
                  </div>
                ))}
                
                {pendingTeamLeaves.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    Tidak ada pengajuan cuti tertunda dari anggota tim Anda.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Leave actions for user */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pengajuan Cuti Saya</span>
              <button className="btn btn-primary" onClick={() => setShowLeaveForm(true)}>
                <CalendarDays size={16} /> Buat Pengajuan Cuti
              </button>
            </div>

            {/* Leave Balance view */}
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.2)', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                Saldo Cuti Tahunan Anda Saat Ini: {currentUser.annual_leave_balance} Hari Kerja / Tahun
              </span>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipe Pengajuan</th>
                    <th>Tanggal Mulai</th>
                    <th>Tanggal Selesai</th>
                    <th>Jumlah Hari</th>
                    <th>Alasan</th>
                    <th>Status</th>
                    <th>Reviewer</th>
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.leave_type}</td>
                      <td>{l.start_date}</td>
                      <td>{l.end_date}</td>
                      <td>{l.total_days} Hari</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.reason}</td>
                      <td>
                        <span className={`badge ${
                          l.status === 'approved' ? 'badge-success' :
                          l.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {l.review_notes ? `${l.review_notes}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {myLeaves.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Belum ada riwayat pengajuan cuti.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE SUBMISSION FORM MODAL */}
      {showLeaveForm && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleLeaveSubmit}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Form Pengajuan Cuti / Izin</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowLeaveForm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tipe Cuti / Izin *</label>
                <select
                  required
                  className="select"
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value as any })}
                >
                  <option value="Cuti Tahunan">Cuti Tahunan (Mengurangi Saldo Cuti)</option>
                  <option value="Izin">Izin (Keperluan Mendesak)</option>
                  <option value="Sakit">Sakit (Kondisi Kesehatan)</option>
                  <option value="Cuti Khusus">Cuti Khusus (Menikah, Melahirkan, Berduka)</option>
                </select>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Alasan Cuti *</label>
                <textarea
                  required
                  className="textarea"
                  rows={3}
                  placeholder="Berikan alasan detil untuk proses review supervisor..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Kirim Pengajuan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
