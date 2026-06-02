import React, { useState } from 'react';
import { useApp, Document, ApprovalHistory } from '../context/AppContext';
import { formatRupiah, terbilang } from '../utils/speller';
import {
  FileText,
  Plus,
  Printer,
  ShieldCheck,
  Check,
  X,
  FileX2,
  Calendar,
  DollarSign,
  Building,
  User,
  Trash2,
  ArrowRight
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    companies,
    approvalTemplates,
    createDocument,
    submitDocForApproval,
    approveDocument,
    rejectDocument,
    revokeDocument,
    currentUser,
    users
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'receipt' | 'letter'>('invoice');
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  
  // Revoke modal states
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Invoice form states
  const [invoiceForm, setInvoiceForm] = useState({
    company_id: '',
    due_date: '',
    tax_enabled: true,
    discount_pct: 0,
    items: [{ name: '', qty: 1, price: 0 }]
  });

  // Receipt (Kwitansi) form states
  const [receiptForm, setReceiptForm] = useState({
    payer_name: '',
    amount: 0,
    notes: '',
    invoice_id: '' // optional linked invoice
  });

  // Letter (Surat) form states
  const [letterForm, setLetterForm] = useState({
    template_type: 'Surat Tugas', // Surat Tugas | Surat Keterangan Kerja | Surat Pengantar
    receiver_name: '',
    receiver_role: '',
    subject_details: '',
    date_duration: ''
  });

  // Invoice calculations
  const calculateInvoiceTotal = (items: { qty: number; price: number }[], discountPct: number, taxEnabled: boolean) => {
    const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const discount = subtotal * (discountPct / 100);
    const taxedAmount = subtotal - discount;
    const tax = taxEnabled ? taxedAmount * 0.11 : 0;
    const total = taxedAmount + tax;
    return { subtotal, total };
  };

  const handleInvoiceItemChange = (index: number, field: string, value: any) => {
    const updatedItems = invoiceForm.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { name: '', qty: 1, price: 0 }]
    });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceForm.items.length > 1) {
      setInvoiceForm({
        ...invoiceForm,
        items: invoiceForm.items.filter((_, i) => i !== index)
      });
    }
  };

  // Form Submissions
  const handleDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDocType === 'invoice') {
      const selectedCompany = companies.find(c => c.id === invoiceForm.company_id);
      const { subtotal, total } = calculateInvoiceTotal(invoiceForm.items, invoiceForm.discount_pct, invoiceForm.tax_enabled);
      
      createDocument({
        doc_type: 'invoice',
        title: `Invoice Penagihan - ${selectedCompany?.name || 'Klien'}`,
        template_id: 'apt-inv',
        data: {
          client_id: invoiceForm.company_id,
          client_name: selectedCompany?.name || 'Klien',
          due_date: invoiceForm.due_date,
          items: invoiceForm.items,
          tax_enabled: invoiceForm.tax_enabled,
          discount_pct: invoiceForm.discount_pct,
          subtotal,
          total
        }
      });
    } else if (selectedDocType === 'receipt') {
      createDocument({
        doc_type: 'receipt',
        title: `Kwitansi Pembayaran - ${receiptForm.payer_name}`,
        template_id: 'apt-kwt',
        data: {
          payer_name: receiptForm.payer_name,
          amount: Number(receiptForm.amount) || 0,
          notes: receiptForm.notes,
          terbilang_text: terbilang(Number(receiptForm.amount) || 0)
        }
      });
    } else {
      createDocument({
        doc_type: 'letter',
        title: `${letterForm.template_type} - ${letterForm.receiver_name}`,
        template_id: 'apt-srt',
        data: {
          template_type: letterForm.template_type,
          receiver_name: letterForm.receiver_name,
          receiver_role: letterForm.receiver_role,
          subject_details: letterForm.subject_details,
          date_duration: letterForm.date_duration
        }
      });
    }

    // Reset forms
    setInvoiceForm({ company_id: '', due_date: '', tax_enabled: true, discount_pct: 0, items: [{ name: '', qty: 1, price: 0 }] });
    setReceiptForm({ payer_name: '', amount: 0, notes: '', invoice_id: '' });
    setLetterForm({ template_type: 'Surat Tugas', receiver_name: '', receiver_role: '', subject_details: '', date_duration: '' });
    
    setActiveTab('list');
  };

  const handleRevokeDoc = () => {
    if (!viewingDoc || !revokeReason) return;
    revokeDocument(viewingDoc.id, revokeReason);
    setViewingDoc({ ...viewingDoc, status: 'REVOKED', revoked_reason: revokeReason });
    setRevokeReason('');
    setShowRevokeModal(false);
  };

  const isUserApproverForDoc = (doc: Document) => {
    if (doc.status !== 'PENDING') return false;
    const template = approvalTemplates.find(t => t.doc_type === doc.doc_type);
    if (!template) return false;
    
    const activeLevel = template.levels.find(l => l.level === doc.current_approval_level);
    if (!activeLevel) return false;
    
    // Check if the current user matches by ID or if we support role assignment
    return activeLevel.user_id === currentUser.id;
  };

  // Triggers browser print layout
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-content">
      {/* HEADER TITLE */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Dokumen Resmi Perusahaan</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Buat, kelola approval berjenjang, dan cetak Invoice, Kwitansi, serta Surat Resmi terverifikasi QR Code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('list');
              setViewingDoc(null);
            }}
          >
            Daftar Dokumen
          </button>
          <button
            className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={16} /> Buat Dokumen Baru
          </button>
        </div>
      </div>

      {/* VIEW PANEL TABS SWITCHER */}
      {activeTab === 'list' && !viewingDoc && (
        <div className="card no-print">
          <div className="card-header">
            <span className="card-title">Daftar Dokumen Masuk</span>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor Dokumen</th>
                  <th>Judul Dokumen</th>
                  <th>Pembuat</th>
                  <th>Tanggal Dibuat</th>
                  <th>Status Approval</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const isApprover = isUserApproverForDoc(doc);
                  return (
                    <tr key={doc.id}>
                      <td style={{ fontWeight: 600 }}>{doc.doc_number}</td>
                      <td>{doc.title}</td>
                      <td>{doc.created_by_name}</td>
                      <td>{new Date(doc.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span className={`badge ${
                          doc.status === 'APPROVED' ? 'badge-success' :
                          doc.status === 'REVOKED' ? 'badge-danger' :
                          doc.status === 'PENDING' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {doc.status === 'PENDING' ? `PENDING LVL ${doc.current_approval_level}` : doc.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ minHeight: 28, padding: '4px 10px', fontSize: 12 }}
                            onClick={() => setViewingDoc(doc)}
                          >
                            Buka Detail
                          </button>
                          {doc.status === 'DRAFT' && doc.created_by === currentUser.id && (
                            <button
                              className="btn btn-primary"
                              style={{ minHeight: 28, padding: '4px 10px', fontSize: 12 }}
                              onClick={() => submitDocForApproval(doc.id)}
                            >
                              Ajukan Approval
                            </button>
                          )}
                          {isApprover && (
                            <button
                              className="btn btn-primary"
                              style={{ minHeight: 28, padding: '4px 10px', fontSize: 12, backgroundColor: 'var(--success)', borderColor: 'transparent' }}
                              onClick={() => setViewingDoc(doc)}
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      Belum ada dokumen yang dibuat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DOCUMENT / PREVIEW WINDOW */}
      {activeTab === 'list' && viewingDoc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Backoffice review actions bar */}
          <div className="card no-print" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setViewingDoc(null)}>
                  ← Kembali ke Daftar
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                  <Printer size={16} /> Cetak / Unduh PDF
                </button>
              </div>

              {/* Action Buttons for Pending Approver */}
              {isUserApproverForDoc(viewingDoc) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      rejectDocument(viewingDoc.id, 'Ditolak saat peninjauan');
                      setViewingDoc({ ...viewingDoc, status: 'DRAFT', current_approval_level: 1 });
                    }}
                  >
                    <X size={16} /> Tolak Dokumen
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--success)' }}
                    onClick={() => {
                      approveDocument(viewingDoc.id, 'Approved dari peninjauan');
                      // Quick UI updates for visual trial
                      const template = approvalTemplates.find(t => t.doc_type === viewingDoc.doc_type);
                      const nextLvl = viewingDoc.current_approval_level + 1;
                      const isFinal = nextLvl > (template?.levels.length || 1);
                      setViewingDoc({
                        ...viewingDoc,
                        status: isFinal ? 'APPROVED' : 'PENDING',
                        current_approval_level: nextLvl
                      });
                    }}
                  >
                    <Check size={16} /> Approve Dokumen
                  </button>
                </div>
              )}

              {/* Revoke Button for Admins */}
              {currentUser.role === 'admin' && viewingDoc.status === 'APPROVED' && (
                <button className="btn btn-danger" onClick={() => setShowRevokeModal(true)}>
                  <FileX2 size={16} /> Cabut Keabsahan (Revoke)
                </button>
              )}
            </div>
          </div>

          <div className="grid-cols-3">
            {/* Visual approval timeline trail card */}
            <div className="card no-print" style={{ gridColumn: 'span 1', height: 'fit-content' }}>
              <div className="card-header">
                <span className="card-title">Timeline Persetujuan</span>
              </div>
              
              <div className="timeline">
                {/* Level indicators based on template */}
                {(() => {
                  const template = approvalTemplates.find(t => t.doc_type === viewingDoc.doc_type);
                  return template?.levels.map((lvl) => {
                    const matchedHistory = viewingDoc.approval_history.find(h => h.level === lvl.level);
                    const user = users.find(u => u.id === lvl.user_id);
                    
                    let statusClass = 'timeline-dot';
                    let statusLabel = 'Menunggu';
                    
                    if (matchedHistory) {
                      statusClass = 'timeline-dot success';
                      statusLabel = 'Approved';
                    } else if (viewingDoc.status === 'PENDING' && viewingDoc.current_approval_level === lvl.level) {
                      statusClass = 'timeline-dot active';
                      statusLabel = 'Pending Review';
                    } else if (viewingDoc.status === 'DRAFT') {
                      statusLabel = 'Draft';
                    }

                    return (
                      <div key={lvl.level} className="timeline-item" style={{ paddingBottom: 16 }}>
                        <div className={statusClass}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>Level {lvl.level}: {lvl.role}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama: {user?.name || 'Unassigned'}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: matchedHistory ? 'var(--success)' : 'var(--text-muted)' }}>
                            Status: {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* A4 STANDALONE DOCUMENT COMPILER CARD */}
            <div
              className="card print-only"
              style={{
                gridColumn: 'span 2',
                backgroundColor: 'white',
                color: 'black',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                padding: '40px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #d1d5db',
                minHeight: '800px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              {/* DOCUMENT CONTENT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header (PT Domus Somnia) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double black', paddingBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>PT Domus Somnia Indonesia</h2>
                    <p style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>Jl. Jenderal Sudirman Kav. 21, Mega Kuningan, Jakarta Selatan</p>
                    <p style={{ fontSize: 11, color: '#4b5563' }}>Telp: (021) 555-0192 | Email: finance@domus-somnia.com</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {viewingDoc.doc_type === 'invoice' ? 'INVOICE' : viewingDoc.doc_type === 'receipt' ? 'KWITANSI' : 'SURAT RESMI'}
                    </h3>
                    <p style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>No: {viewingDoc.doc_number}</p>
                    <p style={{ fontSize: 11, color: '#4b5563' }}>Tgl Dibuat: {new Date(viewingDoc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Sub-body (Invoice / Receipt / Letter data layout) */}
                {viewingDoc.doc_type === 'invoice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 13 }}>
                      <div>
                        <p style={{ fontWeight: 700, textTransform: 'uppercase', color: '#4b5563', fontSize: 11, marginBottom: 4 }}>Ditagihkan Kepada:</p>
                        <p style={{ fontWeight: 700 }}>{viewingDoc.data.client_name}</p>
                        <p style={{ color: '#4b5563' }}>Perusahaan CRM Partner</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, textTransform: 'uppercase', color: '#4b5563', fontSize: 11, marginBottom: 4 }}>Tenggat Pembayaran:</p>
                        <p style={{ fontWeight: 700 }}>{new Date(viewingDoc.data.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>

                    {/* Table items list */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #9ca3af', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px' }}>Nama Deskripsi Pekerjaan</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Harga Satuan</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingDoc.data.items.map((item: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '10px 12px' }}>{item.name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.qty}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatRupiah(item.price)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(item.qty * item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#4b5563' }}>Subtotal:</span>
                          <span style={{ fontWeight: 600 }}>{formatRupiah(viewingDoc.data.subtotal)}</span>
                        </div>
                        {viewingDoc.data.discount_pct > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                            <span>Diskon ({viewingDoc.data.discount_pct}%):</span>
                            <span>-{formatRupiah(viewingDoc.data.subtotal * (viewingDoc.data.discount_pct / 100))}</span>
                          </div>
                        )}
                        {viewingDoc.data.tax_enabled && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#4b5563' }}>PPN (11%):</span>
                            <span>{formatRupiah((viewingDoc.data.subtotal - (viewingDoc.data.subtotal * (viewingDoc.data.discount_pct / 100))) * 0.11)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid black', paddingTop: 8, fontSize: 15, fontWeight: 700 }}>
                          <span>Total Akhir:</span>
                          <span style={{ color: '#1d4ed8' }}>{formatRupiah(viewingDoc.data.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewingDoc.doc_type === 'receipt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px 24px' }}>
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Sudah Diterima Dari:</span>
                      <span style={{ fontWeight: 700 }}>{viewingDoc.data.payer_name}</span>

                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Jumlah Nominal:</span>
                      <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: 16 }}>{formatRupiah(viewingDoc.data.amount)}</span>

                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Terbilang:</span>
                      <span style={{ fontStyle: 'italic', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '4px', borderLeft: '3px solid #1d4ed8' }}>
                        "{viewingDoc.data.terbilang_text}"
                      </span>

                      <span style={{ color: '#4b5563', fontWeight: 600 }}>Untuk Pembayaran:</span>
                      <span>{viewingDoc.data.notes || 'Pembayaran Invoice'}</span>
                    </div>
                  </div>
                )}

                {viewingDoc.doc_type === 'letter' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, lineHeight: 1.6 }}>
                    <p style={{ fontWeight: 700, textDecoration: 'underline', textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
                      {viewingDoc.data.template_type}
                    </p>
                    
                    <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '8px 24px', paddingLeft: 24, margin: '12px 0' }}>
                      <span style={{ color: '#4b5563' }}>Nama Karyawan:</span>
                      <span style={{ fontWeight: 700 }}>{viewingDoc.data.receiver_name}</span>
                      
                      <span style={{ color: '#4b5563' }}>Jabatan / Divisi:</span>
                      <span>{viewingDoc.data.receiver_role}</span>
                    </div>

                    <p>{viewingDoc.data.subject_details || 'Diberikan wewenang penuh untuk melaksanakan tugas kedinasan operasional perusahaan sesuai instruksi.'}</p>
                    
                    <p>Surat keterangan ini berlaku terhitung mulai tanggal / periode {viewingDoc.data.date_duration || '-'}. Demikian agar dipergunakan sebagaimana mestinya.</p>
                  </div>
                )}
              </div>

              {/* FOOTER & SECURITY QR CODE STAMP */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 40 }}>
                {/* Status warning watermark in printed sheet */}
                <div>
                  {viewingDoc.status === 'REVOKED' ? (
                    <div style={{ border: '3px solid #dc2626', color: '#dc2626', padding: '6px 12px', textTransform: 'uppercase', fontWeight: 800, fontSize: 14, borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                      ❌ DOKUMEN TIDAK BERLAKU / DICABUT
                    </div>
                  ) : viewingDoc.status === 'APPROVED' ? (
                    <div style={{ border: '3px solid #16a34a', color: '#16a34a', padding: '6px 12px', textTransform: 'uppercase', fontWeight: 800, fontSize: 14, borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                      ✅ TERVERIFIKASI ASLI
                    </div>
                  ) : (
                    <div style={{ border: '3px dashed #d97706', color: '#d97706', padding: '6px 12px', textTransform: 'uppercase', fontWeight: 800, fontSize: 14, borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                      ⏳ DRAFT - BELUM DISOPORT
                    </div>
                  )}
                  {viewingDoc.status === 'REVOKED' && (
                    <p style={{ fontSize: 10, color: '#dc2626', marginTop: 4, width: '220px' }}>
                      Alasan: "{viewingDoc.revoked_reason}"
                    </p>
                  )}
                </div>

                {/* QR Code image element */}
                {viewingDoc.status === 'APPROVED' && viewingDoc.doc_token ? (
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {/* Generates image from secure verified code api */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://verify.company.com/${viewingDoc.doc_token}`)}`}
                      alt="QR Verification"
                      style={{ width: 85, height: 85, border: '1px solid #d1d5db', padding: 4, backgroundColor: 'white' }}
                    />
                    <span style={{ fontSize: 9, color: '#6b7280', fontFamily: 'monospace' }}>SCAN UNTUK VERIFIKASI</span>
                  </div>
                ) : (
                  <div style={{ height: 85, width: 85, border: '2px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#6b7280', padding: 8, textAlign: 'center' }}>
                    Tanda Tangan Setelah Approved
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DOCUMENT FORMS COMPILER */}
      {activeTab === 'create' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Buat Dokumen Baru</span>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <button
              className={`btn ${selectedDocType === 'invoice' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedDocType('invoice')}
            >
              Invoice
            </button>
            <button
              className={`btn ${selectedDocType === 'receipt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedDocType('receipt')}
            >
              Kwitansi (Receipt)
            </button>
            <button
              className={`btn ${selectedDocType === 'letter' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedDocType('letter')}
            >
              Surat Resmi
            </button>
          </div>

          <form onSubmit={handleDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* INVOICE COMPILER */}
            {selectedDocType === 'invoice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Klien Perusahaan *</label>
                    <select
                      required
                      className="select"
                      value={invoiceForm.company_id}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, company_id: e.target.value })}
                    >
                      <option value="">-- Pilih Perusahaan CRM --</option>
                      {companies.map(co => (
                        <option key={co.id} value={co.id}>{co.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Jatuh Tempo Pembayaran *</label>
                    <input
                      type="date"
                      required
                      className="input"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Line items tables compiler */}
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 10 }}>Daftar Item Tagihan:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invoiceForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Nama item / jenis layanan..."
                          className="input"
                          style={{ flex: 3 }}
                          required
                          value={item.name}
                          onChange={(e) => handleInvoiceItemChange(idx, 'name', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          className="input"
                          style={{ flex: 1 }}
                          required
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleInvoiceItemChange(idx, 'qty', Number(e.target.value) || 1)}
                        />
                        <input
                          type="number"
                          placeholder="Harga Satuan"
                          className="input"
                          style={{ flex: 2 }}
                          required
                          min={0}
                          value={item.price}
                          onChange={(e) => handleInvoiceItemChange(idx, 'price', Number(e.target.value) || 0)}
                        />
                        {invoiceForm.items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ minHeight: 40, backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
                            onClick={() => handleRemoveInvoiceItem(idx)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ marginTop: 10, fontSize: 12, minHeight: 32 }}
                    onClick={handleAddInvoiceItem}
                  >
                    + Tambah Baris Baru
                  </button>
                </div>

                {/* Tax / Discount togglers */}
                <div className="grid-cols-2" style={{ backgroundColor: 'var(--bg)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      id="tax_chk"
                      checked={invoiceForm.tax_enabled}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_enabled: e.target.checked })}
                    />
                    <label htmlFor="tax_chk" style={{ fontSize: 13, fontWeight: 500 }}>Aktifkan PPN 11%</label>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Persentase Diskon (%)</label>
                    <input
                      type="number"
                      className="input"
                      style={{ padding: '6px 10px' }}
                      min={0}
                      max={100}
                      value={invoiceForm.discount_pct}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* RECEIPT COMPILER */}
            {selectedDocType === 'receipt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Diterima Dari (Payer Name) *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={receiptForm.payer_name}
                    onChange={(e) => setReceiptForm({ ...receiptForm, payer_name: e.target.value })}
                  />
                </div>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Nominal Uang (Rupiah) *</label>
                    <input
                      type="number"
                      required
                      className="input"
                      value={receiptForm.amount || ''}
                      onChange={(e) => setReceiptForm({ ...receiptForm, amount: Number(e.target.value) || 0 })}
                    />
                  </div>
                  {receiptForm.amount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Terbilang (Otomatis):</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontStyle: 'italic' }}>
                        "{terbilang(receiptForm.amount)}"
                      </span>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan Pembayaran *</label>
                  <textarea
                    required
                    className="textarea"
                    rows={2}
                    placeholder="Contoh: Pembayaran DP Kavling Melati blok B-12"
                    value={receiptForm.notes}
                    onChange={(e) => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* LETTER COMPILER */}
            {selectedDocType === 'letter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Pilih Template Surat *</label>
                    <select
                      className="select"
                      value={letterForm.template_type}
                      onChange={(e) => setLetterForm({ ...letterForm, template_type: e.target.value })}
                    >
                      <option value="Surat Tugas">Surat Tugas Dinas</option>
                      <option value="Surat Keterangan Kerja">Surat Keterangan Kerja (SKK)</option>
                      <option value="Surat Pengantar">Surat Pengantar Bisnis</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nama Karyawan Penerima *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      value={letterForm.receiver_name}
                      onChange={(e) => setLetterForm({ ...letterForm, receiver_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Jabatan Penerima *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g. Account Executive"
                      value={letterForm.receiver_role}
                      onChange={(e) => setLetterForm({ ...letterForm, receiver_role: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Masa Berlaku / Tanggal Durasi *</label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="e.g. 10 s/d 12 Juni 2026"
                      value={letterForm.date_duration}
                      onChange={(e) => setLetterForm({ ...letterForm, date_duration: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Rincian Perihal Tugas / Detail Keterangan *</label>
                  <textarea
                    required
                    className="textarea"
                    rows={4}
                    placeholder="Tuliskan detail perihal tugas kedinasan atau status keterangan secara lengkap..."
                    value={letterForm.subject_details}
                    onChange={(e) => setLetterForm({ ...letterForm, subject_details: e.target.value })}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ height: 44 }}>
              Simpan Sebagai Draft Dokumen
            </button>
          </form>
        </div>
      )}

      {/* REVOKE DOKUMEN REASON MODAL */}
      {showRevokeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Cabut Keabsahan Dokumen (Revoke)</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowRevokeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Tindakan ini bersifat ireversibel. Dokumen akan dideklarasikan <strong>TIDAK BERLAKU</strong> di portal verifikasi publik.
              </p>
              
              <div className="form-group">
                <label className="form-label">Alasan Pencabutan Resmi *</label>
                <textarea
                  required
                  className="textarea"
                  rows={3}
                  placeholder="Tulis alasan pencabutan (e.g. Klien membatalkan pesanan, Perubahan rincian kerja)..."
                  value={revokeReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowRevokeModal(false)}>Batal</button>
              <button type="button" className="btn btn-danger" onClick={handleDocSubmit} disabled={!revokeReason}>
                Konfirmasi Cabut Keabsahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setReviewReason(text: string) {
    setRevokeReason(text);
  }
};
