import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/speller';
import { useGeolocation, getDistanceInMeters } from '../hooks/useGeolocation';
import {
  Users,
  TrendingUp,
  ListTodo,
  Clock,
  MapPin,
  AlertTriangle,
  Play,
  CheckCircle,
  FileCheck2,
  Activity
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    contacts,
    deals,
    tasks,
    attendance,
    auditLogs,
    offices,
    clockIn,
    clockOut
  } = useApp();

  const { coords, error: gpsError, loading: gpsLoading } = useGeolocation();
  const [gpsSimulated, setGpsSimulated] = useState<boolean>(true);
  const [simLocation, setSimLocation] = useState<'inside' | 'outside'>('inside');
  const [notes, setNotes] = useState<string>('');

  // 1. Calculate Metrics
  const totalContacts = contacts.length;
  const totalDealsVal = deals.reduce((acc, d) => acc + Number(d.value), 0);
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.user_id === currentUser.id && a.date === todayStr);

  // 2. Geolocation Radius checks
  // Default to Office 1
  const office = offices[0] || { id: 'off-1', latitude: -6.2088, longitude: 106.8456, radius_meters: 100, name: 'Kantor Pusat' };

  
  // Simulated or Actual coordinates
  const currentLat = gpsSimulated
    ? (simLocation === 'inside' ? office.latitude + 0.0001 : office.latitude + 0.003)
    : (coords?.latitude || office.latitude);
  const currentLng = gpsSimulated
    ? (simLocation === 'inside' ? office.longitude + 0.0001 : office.longitude + 0.003)
    : (coords?.longitude || office.longitude);

  const distance = getDistanceInMeters(
    currentLat,
    currentLng,
    office.latitude,
    office.longitude
  );

  const isWithinRadius = distance <= office.radius_meters;

  const handleClockIn = () => {
    clockIn(office.id, currentLat, currentLng, notes || 'Clock-in dari Dashboard');
    setNotes('');
  };

  const handleClockOut = () => {
    clockOut(currentLat, currentLng, notes || 'Clock-out dari Dashboard');
    setNotes('');
  };

  return (
    <div className="main-content">
      {/* TITLE & HEADER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Selamat datang kembali, <strong>{currentUser.name}</strong>! Berikut rangkuman data hari ini.
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid-cols-4">
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Kontak CRM</span>
            <Users color="var(--primary)" size={20} />
          </div>
          <h2 style={{ fontSize: 26, fontFamily: 'var(--font-heading)' }}>{totalContacts}</h2>
          <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500, marginTop: 4 }}>
            +2 kontak baru minggu ini
          </p>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nilai Deals Pipeline</span>
            <TrendingUp color="var(--success)" size={20} />
          </div>
          <h2 style={{ fontSize: 22, fontFamily: 'var(--font-heading)' }}>{formatRupiah(totalDealsVal)}</h2>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Dari {deals.length} deals berjalan
          </p>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tugas Pending</span>
            <ListTodo color="var(--warning)" size={20} />
          </div>
          <h2 style={{ fontSize: 26, fontFamily: 'var(--font-heading)' }}>{pendingTasks}</h2>
          <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500, marginTop: 4 }}>
            {tasks.filter(t => new Date(t.due_date) < new Date()).length} tugas overdue
          </p>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status Absen Hari Ini</span>
            <Clock color="var(--primary)" size={20} />
          </div>
          {todayRecord ? (
            <div>
              <span className={`badge ${todayRecord.status === 'present' ? 'badge-success' : 'badge-warning'}`}>
                {todayRecord.status === 'present' ? 'HADIR' : 'TERLAMBAT'}
              </span>
              <p style={{ fontSize: 12, marginTop: 6, color: 'var(--text-main)' }}>
                Masuk: {new Date(todayRecord.clock_in_at!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {todayRecord.clock_out_at && ` | Keluar: ${new Date(todayRecord.clock_out_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          ) : (
            <div>
              <span className="badge badge-danger">BELUM ABSEN</span>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Batas jam masuk 09:15 WIB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DUAL WORKSPACE: ATTENDANCE QUICK LOG & AUDIT LOGS */}
      <div className="grid-cols-3">
        {/* QUICK CLOCK IN/OUT CARD */}
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--primary)" /> Absensi Cepat
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* GPS Simulator Controls */}
            <div style={{ backgroundColor: 'var(--bg)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Simulasi Lokasi GPS:</span>
                <input
                  type="checkbox"
                  checked={gpsSimulated}
                  onChange={(e) => setGpsSimulated(e.target.checked)}
                />
              </div>
              
              {gpsSimulated && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setGpsLocation('inside')}
                    className={`btn ${simLocation === 'inside' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                  >
                    Dalam Radius (45m)
                  </button>
                  <button
                    onClick={() => setGpsLocation('outside')}
                    className={`btn ${simLocation === 'outside' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                  >
                    Luar Radius (1.2km)
                  </button>
                </div>
              )}
            </div>

            {/* GPS Radius Status Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isWithinRadius ? 'var(--success-light)' : 'var(--danger-light)',
                color: isWithinRadius ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${isWithinRadius ? 'hsl(142, 76%, 80%)' : 'hsl(0, 84%, 80%)'}`,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {isWithinRadius ? (
                <>
                  <CheckCircle size={18} />
                  <span>Dalam Radius Kantor ({office.name} - {Math.round(distance)}m)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} />
                  <span>Di Luar Radius Kantor ({Math.round(distance)}m)</span>
                </>
              )}
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <input
                type="text"
                placeholder="Catatan absensi harian..."
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* CLOCK IN/OUT TRIGGERS */}
            {!todayRecord ? (
              <button
                className="btn btn-primary"
                onClick={handleClockIn}
                style={{ width: '100%', height: 48, fontWeight: 700 }}
                disabled={!isWithinRadius}
              >
                <Play size={16} /> CLOCK-IN MASUK
              </button>
            ) : !todayRecord.clock_out_at ? (
              <button
                className="btn btn-danger"
                onClick={handleClockOut}
                style={{ width: '100%', height: 48, fontWeight: 700 }}
              >
                <CheckCircle size={16} /> CLOCK-OUT KELUAR
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: 12, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                  ✅ Absensi Hari Ini Selesai
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Sampai jumpa besok pagi!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RECENT SYSTEM AUDIT TRAIL */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="var(--primary)" /> Aktivitas Sistem Terkini
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '280px', overflowY: 'auto' }}>
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                    {log.details}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Oleh: {log.user_name} ({log.action})
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {auditLogs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>
                Belum ada log aktivitas yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function setGpsLocation(type: 'inside' | 'outside') {
    setSimLocation(type);
  }
};
