import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateUUID, generateSignedToken } from '../utils/crypto';

// --- DATA SCHEMAS ---
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  department: string;
  employee_id: string;
  annual_leave_balance: number;
  is_active: boolean;
}

export interface Office {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_id: string;
  tags: string[];
  notes: string;
  assigned_to: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  address: string;
}

export interface DealStage {
  id: string;
  name: string;
  order_index: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage_id: string;
  contact_id: string;
  assigned_to: string;
  expected_close: string;
  notes: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  created_by: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  due_date: string;
  comments: TaskComment[];
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  clock_in_at?: string;
  clock_out_at?: string;
  clock_in_lat?: number;
  clock_in_lng?: number;
  clock_out_lat?: number;
  clock_out_lng?: number;
  office_id?: string;
  status: 'present' | 'late' | 'absent' | 'leave' | 'permission' | 'sick';
  work_mode: 'onsite' | 'wfh';
  is_offline_sync: boolean;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  user_name: string;
  leave_type: 'Cuti Tahunan' | 'Izin' | 'Sakit' | 'Cuti Khusus';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface ApprovalLevel {
  level: number;
  role?: string;       // e.g., 'Finance Manager'
  user_id?: string;    // specific user
  required: boolean;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  doc_type: 'invoice' | 'receipt' | 'letter';
  levels: ApprovalLevel[];
  condition_threshold_value?: number; // e.g. CEO approval only if value > 50jt
}

export interface ApprovalHistory {
  level: number;
  user_id: string;
  user_name: string;
  action: 'approve' | 'reject' | 'delegate';
  timestamp: string;
  notes?: string;
}

export interface Document {
  id: string;
  doc_type: 'invoice' | 'receipt' | 'letter';
  doc_number: string;
  title: string;
  created_by: string;
  created_by_name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REVOKED';
  doc_token?: string; // signed QR verify token
  created_at: string;
  approved_at?: string;
  revoked_at?: string;
  revoked_reason?: string;
  approval_history: ApprovalHistory[];
  current_approval_level: number; // starts at 1, goes to templates.levels.length + 1
  template_id?: string;
  data: any; // invoice items, receipt values, or letter variables
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

// --- MOCK SEED DATA ---
const MOCK_USERS: User[] = [
  { id: 'usr-1', name: 'Budi Santoso', email: 'budi.hr@company.com', role: 'admin', department: 'HR & Operations', employee_id: 'DS-2025-001', annual_leave_balance: 10, is_active: true },
  { id: 'usr-2', name: 'Susi Susanti', email: 'susi.mgr@company.com', role: 'manager', department: 'Sales & Business', employee_id: 'DS-2025-002', annual_leave_balance: 12, is_active: true },
  { id: 'usr-3', name: 'Rian Hidayat', email: 'rian.staff@company.com', role: 'staff', department: 'Sales & Business', employee_id: 'DS-2025-003', annual_leave_balance: 14, is_active: true },
  { id: 'usr-4', name: 'Bambang Tri', email: 'bambang.fin@company.com', role: 'manager', department: 'Finance & Legal', employee_id: 'DS-2025-004', annual_leave_balance: 12, is_active: true },
  { id: 'usr-5', name: 'CEO Joko Widodo', email: 'joko.ceo@company.com', role: 'manager', department: 'Executive', employee_id: 'DS-2025-005', annual_leave_balance: 12, is_active: true }
];

const MOCK_OFFICES: Office[] = [
  { id: 'off-1', name: 'Kantor Pusat Jakarta', latitude: -6.2088, longitude: 106.8456, radius_meters: 100, is_active: true },
  { id: 'off-2', name: 'Cabang Bandung Tech', latitude: -6.9175, longitude: 107.6191, radius_meters: 150, is_active: true }
];

const MOCK_STAGES: DealStage[] = [
  { id: 'stg-1', name: 'Leads / New', order_index: 0, color: '#3b82f6', is_won: false, is_lost: false },
  { id: 'stg-2', name: 'Qualified', order_index: 1, color: '#a855f7', is_won: false, is_lost: false },
  { id: 'stg-3', name: 'Proposal Sent', order_index: 2, color: '#eab308', is_won: false, is_lost: false },
  { id: 'stg-4', name: 'Negotiation', order_index: 3, color: '#f97316', is_won: false, is_lost: false },
  { id: 'stg-5', name: 'Won (Deal Closes)', order_index: 4, color: '#22c55e', is_won: true, is_lost: false },
  { id: 'stg-6', name: 'Lost', order_index: 5, color: '#ef4444', is_won: false, is_lost: true }
];

const MOCK_COMPANIES: Company[] = [
  { id: 'com-1', name: 'PT Telkom Indonesia', industry: 'Telekomunikasi', size: '500+', website: 'telkom.co.id', address: 'Jl. Jend. Gatot Subroto Kav. 52, Jakarta' },
  { id: 'com-2', name: 'Gojek Tokopedia (GoTo)', industry: 'Teknologi', size: '500+', website: 'goto-group.com', address: 'Jl. Pasar Raya Blok M, Jakarta' }
];

const MOCK_CONTACTS: Contact[] = [
  { id: 'con-1', name: 'Andi Hermawan', email: 'andi@telkom.co.id', phone: '081234567890', company_id: 'com-1', tags: ['Enterprise', 'VP'], notes: 'Kontak utama untuk tender cloud.', assigned_to: 'usr-3', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: 'con-2', name: 'Dewi Lestari', email: 'dewi.l@tokopedia.com', phone: '089876543210', company_id: 'com-2', tags: ['High-Value', 'PM'], notes: 'Tertarik dengan sub-kontrak perumahan developer.', assigned_to: 'usr-3', created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() }
];

const MOCK_DEALS: Deal[] = [
  { id: 'deal-1', title: 'Tender Cloud Telkom', value: 75000000, stage_id: 'stg-3', contact_id: 'con-1', assigned_to: 'usr-3', expected_close: '2026-07-15', notes: 'Menunggu review pricing proposal.', created_at: new Date().toISOString() }
];

const MOCK_TASKS: Task[] = [
  { id: 'tsk-1', title: 'Follow-up Proposal Telkom', description: 'Hubungi Pak Andi untuk menjadwalkan demo teknis proposal.', assignee_id: 'usr-3', created_by: 'usr-2', priority: 'high', status: 'in_progress', due_date: '2026-06-10', comments: [{ id: 'tc-1', user_id: 'usr-2', user_name: 'Susi Susanti', content: 'Pastikan slide deck sudah terupdate dengan logo baru.', created_at: new Date().toISOString() }], created_at: new Date().toISOString() },
  { id: 'tsk-2', title: 'Penyusunan Kwitansi GoTo', description: 'Buat receipt DP pembelian tanah kluster melati.', assignee_id: 'usr-3', created_by: 'usr-4', priority: 'medium', status: 'open', due_date: '2026-06-05', comments: [], created_at: new Date().toISOString() }
];

const MOCK_APPROVAL_TEMPLATES: ApprovalTemplate[] = [
  {
    id: 'apt-inv',
    name: 'Alur Approval Invoice Standar',
    doc_type: 'invoice',
    levels: [
      { level: 1, role: 'Finance Manager', user_id: 'usr-4', required: true },
      { level: 2, role: 'Direktur / CEO', user_id: 'usr-5', required: true } // CEO approval required for all invoices in template
    ]
  },
  {
    id: 'apt-kwt',
    name: 'Alur Approval Kwitansi Keuangan',
    doc_type: 'receipt',
    levels: [
      { level: 1, role: 'Finance Manager', user_id: 'usr-4', required: true }
    ]
  },
  {
    id: 'apt-srt',
    name: 'Alur Approval Surat Resmi HR',
    doc_type: 'letter',
    levels: [
      { level: 1, role: 'Admin / HR Lead', user_id: 'usr-1', required: true }
    ]
  }
];

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    doc_type: 'invoice',
    doc_number: 'INV/2026/06/0001',
    title: 'Invoice Tender Cloud Telkom',
    created_by: 'usr-3',
    created_by_name: 'Rian Hidayat',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    current_approval_level: 1,
    template_id: 'apt-inv',
    approval_history: [],
    data: {
      client_id: 'com-1',
      client_name: 'PT Telkom Indonesia',
      due_date: '2026-06-30',
      items: [
        { name: 'Instalasi Server Core', qty: 1, price: 50000000 },
        { name: 'Lisensi Perangkat Lunak', qty: 5, price: 5000000 }
      ],
      tax_enabled: true, // PPN 11%
      discount_pct: 5,
      subtotal: 75000000,
      total: 79087500 // (75M - 5% discount) * 1.11
    }
  }
];

// --- APP STATE INTERFACE ---
interface AppContextType {
  currentUser: User;
  users: User[];
  offices: Office[];
  contacts: Contact[];
  companies: Company[];
  dealStages: DealStage[];
  deals: Deal[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  approvalTemplates: ApprovalTemplate[];
  documents: Document[];
  auditLogs: AuditLog[];
  offlineSyncQueue: any[];
  
  // Handlers
  switchUser: (userId: string) => void;
  inviteUser: (name: string, email: string, role: 'admin' | 'manager' | 'staff', dept: string) => void;
  updateUserStatus: (userId: string, is_active: boolean) => void;
  updateUserRole: (userId: string, role: 'admin' | 'manager' | 'staff') => void;
  
  // Geolocation & Settings
  addOffice: (office: Omit<Office, 'id'>) => void;
  updateOffice: (office: Office) => void;
  
  // CRM
  addContact: (contact: Omit<Contact, 'id' | 'created_at'>) => void;
  addCompany: (company: Omit<Company, 'id'>) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'created_at'>) => void;
  updateDealStage: (dealId: string, stageId: string) => void;
  
  // Tasks
  addTask: (task: Omit<Task, 'id' | 'comments' | 'created_at'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addTaskComment: (taskId: string, content: string) => void;
  
  // Attendance
  clockIn: (officeId: string | null, lat: number, lng: number, notes?: string, isOffline?: boolean) => void;
  clockOut: (lat: number, lng: number, notes?: string, isOffline?: boolean) => void;
  submitLeave: (request: Omit<LeaveRequest, 'id' | 'user_id' | 'user_name' | 'status' | 'created_at'>) => void;
  reviewLeave: (requestId: string, status: 'approved' | 'rejected', notes?: string) => void;
  syncOfflineData: () => void;
  
  // Documents & Approvals
  createDocument: (doc: Omit<Document, 'id' | 'doc_number' | 'status' | 'created_at' | 'approval_history' | 'current_approval_level' | 'created_by' | 'created_by_name'>) => void;
  submitDocForApproval: (docId: string) => void;
  approveDocument: (docId: string, notes?: string) => void;
  rejectDocument: (docId: string, notes?: string) => void;
  revokeDocument: (docId: string, reason: string) => void;
  updateApprovalTemplate: (template: ApprovalTemplate) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State or Init from Mock Seed
  const loadState = <T,>(key: string, seed: T): T => {
    const data = localStorage.getItem(`crm_db_${key}`);
    return data ? JSON.parse(data) : seed;
  };

  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[2]); // Default Rian (Staff)
  const [users, setUsers] = useState<User[]>(() => loadState('users', MOCK_USERS));
  const [offices, setOffices] = useState<Office[]>(() => loadState('offices', MOCK_OFFICES));
  const [contacts, setContacts] = useState<Contact[]>(() => loadState('contacts', MOCK_CONTACTS));
  const [companies, setCompanies] = useState<Company[]>(() => loadState('companies', MOCK_COMPANIES));
  const [dealStages] = useState<DealStage[]>(MOCK_STAGES);
  const [deals, setDeals] = useState<Deal[]>(() => loadState('deals', MOCK_DEALS));
  const [tasks, setTasks] = useState<Task[]>(() => loadState('tasks', MOCK_TASKS));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadState('attendance', []));
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => loadState('leaves', []));
  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>(() => loadState('approval_templates', MOCK_APPROVAL_TEMPLATES));
  const [documents, setDocuments] = useState<Document[]>(() => loadState('documents', MOCK_DOCUMENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadState('audit_logs', []));
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<any[]>(() => loadState('sync_queue', []));

  // Sync to LocalStorage on modifications
  useEffect(() => {
    localStorage.setItem('crm_db_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('crm_db_offices', JSON.stringify(offices));
  }, [offices]);
  useEffect(() => {
    localStorage.setItem('crm_db_contacts', JSON.stringify(contacts));
  }, [contacts]);
  useEffect(() => {
    localStorage.setItem('crm_db_companies', JSON.stringify(companies));
  }, [companies]);
  useEffect(() => {
    localStorage.setItem('crm_db_deals', JSON.stringify(deals));
  }, [deals]);
  useEffect(() => {
    localStorage.setItem('crm_db_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('crm_db_attendance', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('crm_db_leaves', JSON.stringify(leaves));
  }, [leaves]);
  useEffect(() => {
    localStorage.setItem('crm_db_approval_templates', JSON.stringify(approvalTemplates));
  }, [approvalTemplates]);
  useEffect(() => {
    localStorage.setItem('crm_db_documents', JSON.stringify(documents));
  }, [documents]);
  useEffect(() => {
    localStorage.setItem('crm_db_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem('crm_db_sync_queue', JSON.stringify(offlineSyncQueue));
  }, [offlineSyncQueue]);

  // Unified Audit Trail
  const logAudit = (action: string, entity_type: string, entity_id: string, details: string) => {
    const newLog: AuditLog = {
      id: generateUUID(),
      user_id: currentUser.id,
      user_name: currentUser.name,
      action,
      entity_type,
      entity_id,
      details,
      ip_address: '127.0.0.1',
      created_at: new Date().toISOString()
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch Active user
  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      logAudit('user.switch', 'user', found.id, `Beralih ke pengguna ${found.name}`);
    }
  };

  // HR user actions
  const inviteUser = (name: string, email: string, role: 'admin' | 'manager' | 'staff', dept: string) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      department: dept,
      employee_id: `DS-2025-${Math.floor(100 + Math.random() * 900)}`,
      annual_leave_balance: 12,
      is_active: true
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('user.invite', 'user', newUser.id, `Mengundang pengguna baru ${name} (${role})`);
  };

  const updateUserStatus = (userId: string, is_active: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active } : u));
    logAudit('user.status', 'user', userId, `${is_active ? 'Mengaktifkan' : 'Menonaktifkan'} user status`);
  };

  const updateUserRole = (userId: string, role: 'admin' | 'manager' | 'staff') => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
    logAudit('user.role', 'user', userId, `Mengubah role user ke ${role}`);
  };

  const addOffice = (office: Omit<Office, 'id'>) => {
    const newOffice = { ...office, id: `off-${Date.now()}` };
    setOffices((prev) => [...prev, newOffice]);
    logAudit('office.add', 'office', newOffice.id, `Menambahkan lokasi kantor baru: ${office.name}`);
  };

  const updateOffice = (office: Office) => {
    setOffices((prev) => prev.map((o) => o.id === office.id ? office : o));
    logAudit('office.update', 'office', office.id, `Memperbarui lokasi kantor: ${office.name}`);
  };

  // --- CRM ---
  const addContact = (contact: Omit<Contact, 'id' | 'created_at'>) => {
    const newContact = {
      ...contact,
      id: `con-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setContacts((prev) => [newContact, ...prev]);
    logAudit('crm.contact_add', 'contact', newContact.id, `Menambahkan kontak baru: ${contact.name}`);
  };

  const addCompany = (company: Omit<Company, 'id'>) => {
    const newCompany = { ...company, id: `com-${Date.now()}` };
    setCompanies((prev) => [...prev, newCompany]);
    logAudit('crm.company_add', 'company', newCompany.id, `Menambahkan perusahaan baru: ${company.name}`);
  };

  const addDeal = (deal: Omit<Deal, 'id' | 'created_at'>) => {
    const newDeal = {
      ...deal,
      id: `deal-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    setDeals((prev) => [newDeal, ...prev]);
    logAudit('crm.deal_add', 'deal', newDeal.id, `Membuat pipeline deal baru: ${deal.title}`);
  };

  const updateDealStage = (dealId: string, stageId: string) => {
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage_id: stageId } : d));
    const deal = deals.find(d => d.id === dealId);
    const stage = dealStages.find(s => s.id === stageId);
    logAudit('crm.deal_stage', 'deal', dealId, `Memindahkan deal "${deal?.title}" ke stage "${stage?.name}"`);
  };

  // --- TASKS ---
  const addTask = (task: Omit<Task, 'id' | 'comments' | 'created_at'>) => {
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      comments: [],
      created_at: new Date().toISOString()
    };
    setTasks((prev) => [newTask, ...prev]);
    logAudit('task.add', 'task', newTask.id, `Membuat tugas baru: ${task.title}`);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, updated_at: new Date().toISOString(), status } : t));
    logAudit('task.status', 'task', taskId, `Mengubah status tugas ke ${status}`);
  };

  const addTaskComment = (taskId: string, content: string) => {
    const newComment = {
      id: `tc-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      content,
      created_at: new Date().toISOString()
    };
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t));
    logAudit('task.comment', 'task', taskId, `Menambahkan komentar pada tugas`);
  };

  // --- ATTENDANCE ---
  const clockIn = (officeId: string | null, lat: number, lng: number, notes?: string, isOffline = false) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date();
    
    // Check late (> 09:15)
    let status: AttendanceRecord['status'] = 'present';
    if (nowTime.getHours() > 9 || (nowTime.getHours() === 9 && nowTime.getMinutes() > 15)) {
      status = 'late';
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      user_id: currentUser.id,
      date: today,
      clock_in_at: nowTime.toISOString(),
      clock_in_lat: lat,
      clock_in_lng: lng,
      office_id: officeId || undefined,
      status,
      work_mode: officeId ? 'onsite' : 'wfh',
      is_offline_sync: isOffline,
      notes
    };

    if (isOffline) {
      setOfflineSyncQueue((prev) => [...prev, { type: 'CLOCK_IN', data: newRecord }]);
      // Store temporarily in state
      setAttendance((prev) => [newRecord, ...prev]);
      logAudit('attendance.offline_clockin', 'attendance', newRecord.id, 'Melakukan Clock-In secara Offline (Tersimpan di IndexedDB)');
    } else {
      // Check if already clocked in today
      const alreadyChecked = attendance.find(a => a.user_id === currentUser.id && a.date === today);
      if (alreadyChecked) return;

      setAttendance((prev) => [newRecord, ...prev]);
      logAudit('attendance.clockin', 'attendance', newRecord.id, `Clock-in Berhasil (${status === 'late' ? 'TERLAMBAT' : 'TEPAT WAKTU'})`);
    }
  };

  const clockOut = (lat: number, lng: number, notes?: string, isOffline = false) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (isOffline) {
      const syncData = {
        user_id: currentUser.id,
        date: today,
        clock_out_at: new Date().toISOString(),
        clock_out_lat: lat,
        clock_out_lng: lng,
        notes
      };
      setOfflineSyncQueue((prev) => [...prev, { type: 'CLOCK_OUT', data: syncData }]);
      // Update attendance list locally
      setAttendance((prev) => prev.map((a) => a.user_id === currentUser.id && a.date === today ? { ...a, clock_out_at: syncData.clock_out_at, clock_out_lat: lat, clock_out_lng: lng, notes } : a));
      logAudit('attendance.offline_clockout', 'attendance', today, 'Melakukan Clock-Out secara Offline (Tersimpan di IndexedDB)');
    } else {
      setAttendance((prev) =>
        prev.map((a) =>
          a.user_id === currentUser.id && a.date === today
            ? {
                ...a,
                clock_out_at: new Date().toISOString(),
                clock_out_lat: lat,
                clock_out_lng: lng,
                notes: notes ? `${a.notes || ''} | ${notes}` : a.notes
              }
            : a
        )
      );
      logAudit('attendance.clockout', 'attendance', today, 'Clock-out Berhasil');
    }
  };

  const submitLeave = (request: Omit<LeaveRequest, 'id' | 'user_id' | 'user_name' | 'status' | 'created_at'>) => {
    const newRequest: LeaveRequest = {
      ...request,
      id: `lve-${Date.now()}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setLeaves((prev) => [newRequest, ...prev]);
    logAudit('leave.submit', 'leave', newRequest.id, `Mengajukan ${request.leave_type} selama ${request.total_days} hari`);
  };

  const reviewLeave = (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id === requestId) {
          // Adjust leave balance if approved cuti tahunan
          if (status === 'approved' && l.leave_type === 'Cuti Tahunan') {
            setUsers((prevUsers) =>
              prevUsers.map((u) =>
                u.id === l.user_id ? { ...u, annual_leave_balance: Math.max(0, u.annual_leave_balance - l.total_days) } : u
              )
            );
          }
          
          // Add to attendance log if approved
          if (status === 'approved') {
            const start = new Date(l.start_date);
            const end = new Date(l.end_date);
            const recordsToAdd: AttendanceRecord[] = [];
            
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              const dateStr = d.toISOString().split('T')[0];
              recordsToAdd.push({
                id: `att-leave-${Date.now()}-${d.getTime()}`,
                user_id: l.user_id,
                date: dateStr,
                status: l.leave_type === 'Cuti Tahunan' ? 'leave' : l.leave_type === 'Sakit' ? 'sick' : 'permission',
                work_mode: 'wfh',
                is_offline_sync: false,
                notes: `Cuti/Izin Disetujui: ${l.reason}`
              });
            }
            
            setAttendance((prevAtt) => {
              // filter out any existing checkins on those days to prevent duplicates
              const datesToReplace = recordsToAdd.map(r => r.date);
              const filtered = prevAtt.filter(a => !(a.user_id === l.user_id && datesToReplace.includes(a.date)));
              return [...recordsToAdd, ...filtered];
            });
          }

          return {
            ...l,
            status,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            review_notes: notes
          };
        }
        return l;
      })
    );
    
    const request = leaves.find(l => l.id === requestId);
    logAudit('leave.review', 'leave', requestId, `Meninjau pengajuan cuti: ${status.toUpperCase()}`);
  };

  const syncOfflineData = () => {
    if (offlineSyncQueue.length === 0) return;
    
    // Simulate API batch upload
    setAttendance((prev) => {
      let updated = [...prev];
      offlineSyncQueue.forEach((item) => {
        if (item.type === 'CLOCK_IN') {
          // Add clock-in record, ensure no double
          const exists = updated.find(a => a.user_id === item.data.user_id && a.date === item.data.date);
          if (!exists) {
            updated = [{ ...item.data, is_offline_sync: false }, ...updated];
          }
        } else if (item.type === 'CLOCK_OUT') {
          // Update existing
          updated = updated.map((a) =>
            a.user_id === item.data.user_id && a.date === item.data.date
              ? {
                  ...a,
                  clock_out_at: item.data.clock_out_at,
                  clock_out_lat: item.data.clock_out_lat,
                  clock_out_lng: item.data.clock_out_lng,
                  notes: a.notes ? `${a.notes} | Sync: ${item.data.notes}` : `Sync: ${item.data.notes}`
                }
              : a
          );
        }
      });
      return updated;
    });

    // Clear queue
    setOfflineSyncQueue([]);
    logAudit('attendance.sync', 'attendance', 'batch', `Berhasil menyinkronkan ${offlineSyncQueue.length} data absensi offline`);

    // Post message to Service Worker to trigger native push notification
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_OFFLINE_ATTENDANCE'
      });
    }
  };

  // --- DOCUMENTS & APPROVALS ---
  const createDocument = (doc: Omit<Document, 'id' | 'doc_number' | 'status' | 'created_at' | 'approval_history' | 'current_approval_level' | 'created_by' | 'created_by_name'>) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const seq = String(documents.filter(d => d.doc_type === doc.doc_type).length + 1).padStart(4, '0');
    
    let doc_number = '';
    if (doc.doc_type === 'invoice') {
      doc_number = `INV/${year}/${month}/${seq}`;
    } else if (doc.doc_type === 'receipt') {
      doc_number = `KWT/${year}/${month}/${seq}`;
    } else {
      doc_number = `HR-SRT/${year}/${month}/${seq}`;
    }

    const newDoc: Document = {
      ...doc,
      id: generateUUID(),
      doc_number,
      status: 'DRAFT',
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      current_approval_level: 1,
      approval_history: [],
      created_at: new Date().toISOString()
    };

    setDocuments((prev) => [newDoc, ...prev]);
    logAudit('document.create', 'document', newDoc.id, `Membuat draft dokumen baru: ${newDoc.doc_number}`);
  };

  const submitDocForApproval = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: 'PENDING' } : d))
    );
    const doc = documents.find(d => d.id === docId);
    logAudit('document.submit', 'document', docId, `Mengirimkan dokumen untuk approval: ${doc?.doc_number}`);
  };

  const approveDocument = (docId: string, notes?: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || doc.status !== 'PENDING') return;

    const template = approvalTemplates.find((t) => t.doc_type === doc.doc_type);
    if (!template) return;

    const nextHistory: ApprovalHistory = {
      level: doc.current_approval_level,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'approve',
      timestamp: new Date().toISOString(),
      notes
    };

    const nextLevel = doc.current_approval_level + 1;
    const isFinalLevel = nextLevel > template.levels.length;

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const updatedHistory = [...d.approval_history, nextHistory];
          if (isFinalLevel) {
            // Generate signed verifying QR token
            const secureToken = generateSignedToken(d.id);
            return {
              ...d,
              status: 'APPROVED',
              current_approval_level: nextLevel,
              approval_history: updatedHistory,
              approved_at: new Date().toISOString(),
              doc_token: secureToken
            };
          } else {
            return {
              ...d,
              current_approval_level: nextLevel,
              approval_history: updatedHistory
            };
          }
        }
        return d;
      })
    );

    logAudit(
      isFinalLevel ? 'document.approved' : 'document.reviewed',
      'document',
      docId,
      isFinalLevel
        ? `Dokumen ${doc.doc_number} disetujui sepenuhnya (APPROVED)`
        : `Dokumen ${doc.doc_number} disetujui di Level ${doc.current_approval_level}`
    );
  };

  const rejectDocument = (docId: string, notes?: string) => {
    const nextHistory: ApprovalHistory = {
      level: 1,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'reject',
      timestamp: new Date().toISOString(),
      notes
    };

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'DRAFT', // returns to draft for revision
              current_approval_level: 1,
              approval_history: [...d.approval_history, nextHistory]
            }
          : d
      )
    );
    const doc = documents.find(d => d.id === docId);
    logAudit('document.reject', 'document', docId, `Menolak dokumen ${doc?.doc_number}. Status kembali ke DRAFT.`);
  };

  const revokeDocument = (docId: string, reason: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'REVOKED',
              revoked_at: new Date().toISOString(),
              revoked_reason: reason
            }
          : d
      )
    );
    const doc = documents.find(d => d.id === docId);
    logAudit('document.revoke', 'document', docId, `Mencabut keabsahan dokumen ${doc?.doc_number}: ${reason}`);
  };

  const updateApprovalTemplate = (template: ApprovalTemplate) => {
    setApprovalTemplates((prev) => prev.map((t) => t.id === template.id ? template : t));
    logAudit('template.update', 'approval_template', template.id, `Memperbarui template persetujuan: ${template.name}`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        offices,
        contacts,
        companies,
        dealStages,
        deals,
        tasks,
        attendance,
        leaves,
        approvalTemplates,
        documents,
        auditLogs,
        offlineSyncQueue,
        
        switchUser,
        inviteUser,
        updateUserStatus,
        updateUserRole,
        addOffice,
        updateOffice,
        
        addContact,
        addCompany,
        addDeal,
        updateDealStage,
        
        addTask,
        updateTaskStatus,
        addTaskComment,
        
        clockIn,
        clockOut,
        submitLeave,
        reviewLeave,
        syncOfflineData,
        
        createDocument,
        submitDocForApproval,
        approveDocument,
        rejectDocument,
        revokeDocument,
        updateApprovalTemplate
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
