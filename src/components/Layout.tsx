import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  Settings,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Menu
} from 'lucide-react';

interface LayoutProps {
  currentView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onViewChange, children }) => {
  const { currentUser, users, switchUser, offlineSyncQueue, syncOfflineData } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const root = document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    }
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { id: 'crm', name: 'CRM & Pipeline', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { id: 'operations', name: 'Task & Tickets', icon: CheckSquare, roles: ['admin', 'manager', 'staff'] },
    { id: 'attendance', name: 'Absensi & Cuti', icon: Clock, roles: ['admin', 'manager', 'staff'] },
    { id: 'documents', name: 'Dokumen Resmi', icon: FileText, roles: ['admin', 'manager', 'staff'] },
    { id: 'backoffice', name: 'Backoffice Settings', icon: Settings, roles: ['admin'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="app-container">
      {/* MOBILE TOPBAR */}
      <div className="mobile-topbar">
        <span className="sidebar-logo">Domus Somnia</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-ghost" style={{ padding: 4, minHeight: 'unset' }} onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', minHeight: 'unset' }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <UserIcon size={18} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{currentUser.name.split(' ')[0]}</span>
            </button>
            
            {showUserMenu && (
              <div className="card shadow-lg" style={{ position: 'absolute', right: 0, top: '40px', width: '220px', zIndex: 110, padding: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700 }}>Simulasi Akun</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`btn btn-ghost`}
                      style={{
                        justifyContent: 'flex-start',
                        fontSize: 12,
                        padding: '6px 8px',
                        minHeight: 'unset',
                        backgroundColor: currentUser.id === u.id ? 'var(--primary-light)' : 'transparent',
                        color: currentUser.id === u.id ? 'var(--primary)' : 'inherit'
                      }}
                    >
                      {u.name} ({u.role.toUpperCase()})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <ShieldCheck size={28} color="var(--primary)" />
          {!sidebarCollapsed && <span className="sidebar-logo">Domus Somnia</span>}
        </div>
        
        <nav className="sidebar-menu">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`sidebar-item ${active ? 'active' : ''}`}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
          
          <button
            onClick={() => onViewChange('verification')}
            className={`sidebar-item ${currentView === 'verification' ? 'active' : ''}`}
            style={{ marginTop: 'auto' }}
          >
            <ShieldCheck size={20} color="var(--success)" />
            {!sidebarCollapsed && <span>Portal Verifikasi</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {offlineSyncQueue.length > 0 && !sidebarCollapsed && (
            <div className="offline-banner" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
              <span style={{ fontSize: '11px' }}>Ada {offlineSyncQueue.length} data offline pending.</span>
              <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11, minHeight: 30 }} onClick={syncOfflineData}>
                Sinkronkan
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {currentUser.role.toUpperCase()} - {currentUser.department}
                </span>
              </div>
            )}
            
            <button className="btn btn-ghost" style={{ padding: 6, minHeight: 'unset' }} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="form-group" style={{ margin: 0, marginTop: 8 }}>
              <label className="form-label" style={{ fontSize: 10 }}>Simulasi Akun:</label>
              <select
                className="select"
                style={{ padding: '4px 8px', fontSize: 12 }}
                value={currentUser.id}
                onChange={(e) => switchUser(e.target.value)}
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                ))}
              </select>
            </div>
          )}

          <button
            className="btn btn-ghost"
            style={{ padding: 6, minHeight: 'unset', width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><ChevronLeft size={18} /> <span>Collapse</span></div>}
          </button>
        </div>
      </aside>

      {/* VIEW PANEL CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-bottomnav">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`mobile-navitem ${currentView === 'dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onViewChange('crm')}
          className={`mobile-navitem ${currentView === 'crm' ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>CRM</span>
        </button>
        <button
          onClick={() => onViewChange('operations')}
          className={`mobile-navitem ${currentView === 'operations' ? 'active' : ''}`}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => onViewChange('attendance')}
          className={`mobile-navitem ${currentView === 'attendance' ? 'active' : ''}`}
        >
          <Clock size={20} />
          <span>Absen</span>
        </button>
        <button
          onClick={() => onViewChange('documents')}
          className={`mobile-navitem ${currentView === 'documents' ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Docs</span>
        </button>
      </div>
    </div>
  );
};
