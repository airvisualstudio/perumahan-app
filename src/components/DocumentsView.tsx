import React, { useState } from 'react';
import { useApp, Document, ApprovalHistory, VisualTemplate } from '../context/AppContext';
import { formatRupiah, terbilang } from '../utils/speller';
import { TemplateCanvas } from './TemplateCanvas';
import { motion, AnimatePresence } from 'framer-motion';
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
    users,
    visualTemplates
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'customize'>('list');
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'receipt' | 'letter'>('invoice');
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  
  // Custom template state bindings
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('vt-invoice-default');
  const [customTitle, setCustomTitle] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  
  // Revoke modal states
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Dynamic scale factor for document details preview on mobile
  const [scaleFactor, setScaleFactor] = useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && viewingDoc) {
        const activeTemplate = visualTemplates.find(t => t.doc_type === viewingDoc.doc_type) || visualTemplates[0];
        const parentWidth = containerRef.current.clientWidth;
        const targetWidth = activeTemplate.paper_orientation === 'landscape' ? 820 : 620;
        if (parentWidth < targetWidth) {
          setScaleFactor(parentWidth / targetWidth);
        } else {
          setScaleFactor(1);
        }
      }
    };

    updateScale();
    
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [viewingDoc]);

  // Pre-fill custom fields and title when template changes
  React.useEffect(() => {
    const template = visualTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      if (selectedTemplateId === 'vt-invoice-default' || template.doc_type === 'invoice') setSelectedDocType('invoice');
      else if (selectedTemplateId === 'vt-receipt-default' || template.doc_type === 'receipt') setSelectedDocType('receipt');
      else if (selectedTemplateId === 'vt-letter-default' || template.doc_type === 'letter') setSelectedDocType('letter');
      else {
        // Map custom layout structures based on base elements
        const elTypes = Array.isArray(template.elements) ? template.elements : [];
        if (elTypes.some(el => el.type === 'totals_area')) setSelectedDocType('invoice');
        else if (elTypes.some(el => el.type === 'client_info') && elTypes.some(el => el.type === 'document_body') && template.doc_type.includes('receipt')) setSelectedDocType('receipt');
        else setSelectedDocType('letter');
      }

      const isCustomTemplate = !['vt-invoice-default', 'vt-receipt-default', 'vt-letter-default'].includes(template.id);
      if (isCustomTemplate) {
        setCustomTitle(template.name);
      } else {
        setCustomTitle('');
      }
      
      const fieldsInit: Record<string, string> = {};
      if (Array.isArray(template.elements)) {
        template.elements.forEach(el => {
          if (['text', 'paragraph', 'signature'].includes(el.type)) {
            fieldsInit[el.id] = el.content;
          }
        });
      }
      setCustomFields(fieldsInit);
    }
  }, [selectedTemplateId, visualTemplates]);

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
    
    const activeTemplate = visualTemplates.find(t => t.id === selectedTemplateId) || visualTemplates[0];
    const isCustom = !['vt-invoice-default', 'vt-receipt-default', 'vt-letter-default'].includes(activeTemplate.id);
    
    let title = '';
    let data: any = { elementsData: customFields };

    if (selectedDocType === 'invoice') {
      const selectedCompany = companies.find(c => c.id === invoiceForm.company_id);
      const { subtotal, total } = calculateInvoiceTotal(invoiceForm.items, invoiceForm.discount_pct, invoiceForm.tax_enabled);
      
      title = isCustom ? (customTitle || activeTemplate.name) : `Invoice Penagihan - ${selectedCompany?.name || 'Klien'}`;
      data = {
        ...data,
        client_id: invoiceForm.company_id,
        client_name: selectedCompany?.name || 'Klien',
        due_date: invoiceForm.due_date,
        items: invoiceForm.items,
        tax_enabled: invoiceForm.tax_enabled,
        discount_pct: invoiceForm.discount_pct,
        subtotal,
        total
      };
    } else if (selectedDocType === 'receipt') {
      title = isCustom ? (customTitle || activeTemplate.name) : `Kwitansi Pembayaran - ${receiptForm.payer_name}`;
      data = {
        ...data,
        payer_name: receiptForm.payer_name,
        amount: Number(receiptForm.amount) || 0,
        notes: receiptForm.notes,
        terbilang_text: terbilang(Number(receiptForm.amount) || 0)
      };
    } else {
      title = isCustom ? (customTitle || activeTemplate.name) : `${letterForm.template_type} - ${letterForm.receiver_name}`;
      data = {
        ...data,
        template_type: letterForm.template_type,
        receiver_name: letterForm.receiver_name,
        receiver_role: letterForm.receiver_role,
        subject_details: letterForm.subject_details,
        date_duration: letterForm.date_duration
      };
    }

    createDocument({
      doc_type: activeTemplate.doc_type,
      title,
      template_id: activeTemplate.id,
      data
    });

    // Reset forms
    setInvoiceForm({ company_id: '', due_date: '', tax_enabled: true, discount_pct: 0, items: [{ name: '', qty: 1, price: 0 }] });
    setReceiptForm({ payer_name: '', amount: 0, notes: '', invoice_id: '' });
    setLetterForm({ template_type: 'Surat Tugas', receiver_name: '', receiver_role: '', subject_details: '', date_duration: '' });
    setCustomTitle('');
    setCustomFields({});
    setSelectedTemplateId('vt-invoice-default');
    setSelectedDocType('invoice');
    
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
          {currentUser.role === 'admin' && (
            <button
              className={`btn ${activeTab === 'customize' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setActiveTab('customize');
                setViewingDoc(null);
              }}
            >
              Kustomisasi Layout
            </button>
          )}
        </div>
      </div>

      {activeTab === 'list' && !viewingDoc && (
        <motion.div 
          className="card no-print"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
        </motion.div>
      )}

      {/* DETAIL DOCUMENT / PREVIEW WINDOW */}
      {activeTab === 'list' && viewingDoc && (
        <motion.div 
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
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
                      <motion.div 
                        key={lvl.level} 
                        className="timeline-item" 
                        style={{ paddingBottom: 16 }}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: lvl.level * 0.1, duration: 0.25 }}
                      >
                        <div className={statusClass}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>Level {lvl.level}: {lvl.role}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nama: {user?.name || 'Unassigned'}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: matchedHistory ? 'var(--success)' : 'var(--text-muted)' }}>
                            Status: {statusLabel}
                          </span>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* A4 STANDALONE DOCUMENT COMPILER CARD */}
            {(() => {
              const activeTemplate = (visualTemplates.find(t => t.doc_type === viewingDoc.doc_type) || {
                id: 'vt-invoice-default',
                name: 'Layout Invoice Default',
                doc_type: 'invoice',
                paper_size: 'A4',
                paper_orientation: 'portrait',
                logo_text: 'PT Domus Somnia Indonesia',
                header_address: 'Jl. Jenderal Sudirman Kav. 21, Mega Kuningan, Jakarta Selatan',
                header_phone_email: 'Telp: (021) 555-0192 | Email: finance@domus-somnia.com',
                font_family: 'Inter',
                elements: [
                  { id: 'el-header', type: 'header', label: 'Kop Surat / Header', content: '', x: 5, y: 5, visible: true },
                  { id: 'el-title-number', type: 'title_number', label: 'Judul & No Dokumen', content: '', x: 60, y: 5, visible: true },
                  { id: 'el-client-info', type: 'client_info', label: 'Data Penerima / Klien', content: '', x: 5, y: 22, visible: true },
                  { id: 'el-document-body', type: 'document_body', label: 'Isi Dokumen / Tabel', content: '', x: 5, y: 35, visible: true },
                  { id: 'el-totals-area', type: 'totals_area', label: 'Total Biaya (Invoice)', content: '', x: 55, y: 65, visible: true },
                  { id: 'el-status-stamp', type: 'status_stamp', label: 'Stempel Keabsahan', content: '', x: 5, y: 82, visible: true },
                  { id: 'el-qr-code', type: 'qr_code', label: 'Kode QR Pengabsah', content: '', x: 75, y: 80, visible: true }
                ]
              }) as VisualTemplate;
              const { paper_size, paper_orientation, elements } = activeTemplate;
              const isLandscape = paper_orientation === 'landscape';
              
              const getAspectRatio = (size: string, isLand: boolean) => {
                let ratio = 1.414; // A4/A5
                if (size === 'F4') ratio = 1.535; // F4 Folio
                return isLand ? 1 / ratio : ratio;
              };
              const aspect = getAspectRatio(paper_size, isLandscape);

              return (
                <div
                  ref={containerRef}
                  className="document-preview-wrapper"
                  style={{
                    gridColumn: 'span 2',
                    width: '100%',
                    overflow: 'hidden',
                    height: `${(isLandscape ? 820 : 620) * aspect * scaleFactor}px`,
                    position: 'relative'
                  }}
                >
                  <div
                    className={`card print-only document-print-sheet sheet-${paper_size.toLowerCase()} sheet-${paper_orientation}`}
                    style={{
                      transform: `scale(${scaleFactor})`,
                      transformOrigin: 'top left',
                      width: isLandscape ? '820px' : '620px',
                      height: `${(isLandscape ? 820 : 620) * aspect}px`,
                      backgroundColor: 'white',
                      color: 'black',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #d1d5db',
                      position: 'relative',
                      fontFamily: activeTemplate.font_family === 'Outfit' ? "'Outfit', sans-serif" : "'Inter', sans-serif",
                      overflow: 'hidden'
                    }}
                  >
                  {Array.isArray(elements) && elements.map((el) => {
                    if (!el.visible) return null;

                    // Resolve custom filled content per document, else default
                    let resolvedContent = viewingDoc.data.elementsData?.[el.id] || el.content;

                    let elementNode = null;
                    const fontSize = el.fontSize || 9;
                    const isBold = el.fontWeight === 'bold';
                    const align = el.alignment || 'left';
                    const widthStyle = el.width ? `${el.width}%` : 'auto';

                    const textStyle: React.CSSProperties = {
                      fontSize: `${fontSize}px`,
                      fontWeight: isBold ? 'bold' : 'normal',
                      textAlign: align,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    };

                    if (el.type === 'header') {
                      elementNode = (
                        <div style={{ borderBottom: '2.5px double black', paddingBottom: '6px', width: '300px', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                          <h2 style={{ fontSize: '15px', fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', margin: 0 }}>
                            {activeTemplate.logo_text}
                          </h2>
                          <p style={{ fontSize: '8px', color: '#4b5563', margin: 0 }}>{activeTemplate.header_address}</p>
                          <p style={{ fontSize: '8px', color: '#4b5563', margin: 0 }}>{activeTemplate.header_phone_email}</p>
                        </div>
                      );
                    } else if (el.type === 'title_number') {
                      elementNode = (
                        <div style={{ textAlign: align === 'left' ? 'left' : 'right', minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <h3 style={{ fontSize: `${fontSize}px`, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {viewingDoc.title.split(' - ')[0]}
                          </h3>
                          <p style={{ fontSize: '9px', fontWeight: 600, margin: 0, color: '#2563eb' }}>No: {viewingDoc.doc_number}</p>
                          <p style={{ fontSize: '8px', color: '#4b5563', margin: 0 }}>
                            Tgl Dibuat: {new Date(viewingDoc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      );
                    } else if (el.type === 'client_info') {
                      elementNode = (
                        <div style={{ minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {viewingDoc.data.client_name ? (
                            <>
                              <p style={{ fontWeight: 700, textTransform: 'uppercase', color: '#4b5563', fontSize: '8px', margin: 0 }}>Ditagihkan Kepada:</p>
                              <p style={{ fontWeight: 700, fontSize: `${fontSize}px`, margin: 0 }}>{viewingDoc.data.client_name}</p>
                              <p style={{ color: '#4b5563', fontSize: '9px', margin: 0 }}>Perusahaan CRM Partner</p>
                              <p style={{ fontSize: '9px', margin: '4px 0 0 0' }}>
                                Tenggat: <strong>{new Date(viewingDoc.data.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                              </p>
                            </>
                          ) : viewingDoc.data.payer_name ? (
                            <>
                              <p style={{ fontWeight: 700, textTransform: 'uppercase', color: '#4b5563', fontSize: '8px', margin: 0 }}>Sudah Diterima Dari:</p>
                              <p style={{ fontWeight: 700, fontSize: `${fontSize}px`, margin: 0 }}>{viewingDoc.data.payer_name}</p>
                              <p style={{ color: '#4b5563', fontSize: '9px', margin: 0 }}>Mitra Penyetor</p>
                            </>
                          ) : (
                            <>
                              <p style={{ fontWeight: 700, textTransform: 'uppercase', color: '#4b5563', fontSize: '8px', margin: 0 }}>Kepada Yth:</p>
                              <p style={{ fontWeight: 700, fontSize: `${fontSize}px`, margin: 0 }}>{viewingDoc.data.receiver_name || resolvedContent || 'Mitra Penerima'}</p>
                              <p style={{ color: '#4b5563', fontSize: '9px', margin: 0 }}>{viewingDoc.data.receiver_role || 'Pihak Terkait'}</p>
                            </>
                          )}
                        </div>
                      );
                    } else if (el.type === 'document_body') {
                      elementNode = (
                        <div style={{ width: isLandscape ? '85%' : '90%' }}>
                          {viewingDoc.data.items ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${fontSize}px` }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #9ca3af', textAlign: 'left' }}>
                                  <th style={{ padding: '4px 8px', fontSize: '8px' }}>Deskripsi Tagihan</th>
                                  <th style={{ padding: '4px 8px', fontSize: '8px', textAlign: 'center' }}>Qty</th>
                                  <th style={{ padding: '4px 8px', fontSize: '8px', textAlign: 'right' }}>Harga Satuan</th>
                                  <th style={{ padding: '4px 8px', fontSize: '8px', textAlign: 'right' }}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {viewingDoc.data.items.map((item: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '5px 8px' }}>{item.name}</td>
                                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>{item.qty}</td>
                                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{formatRupiah(item.price)}</td>
                                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 600 }}>{formatRupiah(item.qty * item.price)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : viewingDoc.data.amount ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: `${fontSize}px` }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '4px 12px' }}>
                                <span style={{ color: '#4b5563', fontSize: '8px', fontWeight: 600 }}>Nominal:</span>
                                <span style={{ fontWeight: 800, color: '#1d4ed8' }}>{formatRupiah(viewingDoc.data.amount)}</span>
                                <span style={{ color: '#4b5563', fontSize: '8px', fontWeight: 600 }}>Terbilang:</span>
                                <span style={{ fontStyle: 'italic', fontSize: '8px', backgroundColor: '#f3f4f6', padding: '3px 6px', borderLeft: '2.5px solid #1d4ed8' }}>
                                  "{viewingDoc.data.terbilang_text}"
                                </span>
                                <span style={{ color: '#4b5563', fontSize: '8px', fontWeight: 600 }}>Keterangan:</span>
                                <span>{viewingDoc.data.notes}</span>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: `${fontSize}px`, lineHeight: 1.5 }}>
                              {viewingDoc.data.template_type && (
                                <p style={{ fontWeight: 700, textDecoration: 'underline', textTransform: 'uppercase', fontSize: '10px', margin: '0 0 6px 0', textAlign: 'center' }}>
                                  {viewingDoc.data.template_type}
                                </p>
                              )}
                              <p style={textStyle}>
                                {viewingDoc.data.subject_details || resolvedContent || 'Isi deskripsi dokumen penugasan atau operasional resmi.'}
                              </p>
                              {viewingDoc.data.date_duration && (
                                <p style={{ fontSize: '8px', margin: 0 }}>
                                  Berlaku mulai: {viewingDoc.data.date_duration}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    } else if (el.type === 'totals_area' && viewingDoc.data.subtotal) {
                      elementNode = (
                        <div style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: '240px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '8px',
                          borderTop: '1px solid #9ca3af',
                          paddingTop: '4px'
                        }}>
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid black', paddingTop: '3px', fontSize: '9px', fontWeight: 800 }}>
                            <span>Total Akhir:</span>
                            <span style={{ color: '#1d4ed8' }}>{formatRupiah(viewingDoc.data.total)}</span>
                          </div>
                        </div>
                      );
                    } else if (el.type === 'status_stamp') {
                      elementNode = (
                        <div>
                          {viewingDoc.status === 'REVOKED' ? (
                            <div style={{ border: '2px solid #dc2626', color: '#dc2626', padding: '4px 8px', textTransform: 'uppercase', fontWeight: 800, fontSize: '10px', borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                              ❌ TIDAK BERLAKU / REVOKED
                            </div>
                          ) : viewingDoc.status === 'APPROVED' ? (
                            <div style={{ border: '2px solid #16a34a', color: '#16a34a', padding: '4px 8px', textTransform: 'uppercase', fontWeight: 800, fontSize: '10px', borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                              ✅ TERVERIFIKASI ASLI
                            </div>
                          ) : (
                            <div style={{ border: '2px dashed #d97706', color: '#d97706', padding: '4px 8px', textTransform: 'uppercase', fontWeight: 800, fontSize: '10px', borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content' }}>
                              ⏳ DRAFT - BELUM APPROVED
                            </div>
                          )}
                        </div>
                      );
                    } else if (el.type === 'qr_code') {
                      elementNode = (
                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          {viewingDoc.status === 'APPROVED' && viewingDoc.doc_token ? (
                            <>
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`https://verify.company.com/${viewingDoc.doc_token}`)}`}
                                alt="QR Verification"
                                style={{ width: 65, height: 65, border: '1px solid #d1d5db', padding: '2px', backgroundColor: 'white' }}
                              />
                              <span style={{ fontSize: '6px', color: '#6b7280', fontWeight: 'bold' }}>SCAN VERIFIKASI</span>
                            </>
                          ) : (
                            <div style={{ height: 65, width: 65, border: '1.5px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#6b7280', padding: '4px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                              Tanda Tangan Setelah Approved
                            </div>
                          )}
                        </div>
                      );
                    } else if (el.type === 'text' || el.type === 'paragraph') {
                      elementNode = (
                        <div style={{ width: widthStyle }}>
                          <p style={textStyle}>{resolvedContent}</p>
                        </div>
                      );
                    } else if (el.type === 'signature') {
                      elementNode = (
                        <div style={{ width: widthStyle, display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          <span style={{ fontSize: '7.5px', color: '#4b5563', margin: 0 }}>Hormat Kami,</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', textDecoration: 'underline' }}>{resolvedContent.split('\n')[0]}</span>
                            {resolvedContent.split('\n').slice(1).map((line, idx) => (
                              <span key={idx} style={{ fontSize: '7.5px', color: '#6b7280' }}>{line}</span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (!elementNode) return null;

                    // Header and other elements use absolute coordinates
                    if (el.type === 'totals_area') return elementNode; // absolute self-contained above

                    return (
                      <div
                        key={el.id}
                        style={{
                          position: 'absolute',
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          zIndex: 10
                        }}
                      >
                        {elementNode}
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* CREATE DOCUMENT FORMS COMPILER */}
      {activeTab === 'create' && (() => {
        const activeTemplateForCreate = visualTemplates.find(t => t.id === selectedTemplateId) || visualTemplates[0];
        const isCustomTemplate = !['vt-invoice-default', 'vt-receipt-default', 'vt-letter-default'].includes(activeTemplateForCreate.id);
        
        return (
          <motion.div 
            className="card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card-header">
              <span className="card-title">Buat Dokumen Baru</span>
            </div>

            {/* Template Selector Select Option */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Pilih Jenis Template Dokumen *</label>
              <select
                className="select"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {visualTemplates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <form onSubmit={handleDocSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Custom Title Input for Custom Templates */}
              {isCustomTemplate && (
                <div className="form-group">
                  <label className="form-label">Judul / Nama Dokumen Resmi *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Contoh: Surat Perjanjian Sewa Kantor"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>
              )}

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

                  {/* Line items builder */}
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
              {selectedDocType === 'letter' && !isCustomTemplate && (
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

              {Array.isArray(activeTemplateForCreate.elements) && activeTemplateForCreate.elements.filter(el => ['text', 'paragraph', 'signature'].includes(el.type)).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Isi Field Kustom Dokumen:</span>
                  {activeTemplateForCreate.elements.filter(el => ['text', 'paragraph', 'signature'].includes(el.type)).map(el => (
                    <div className="form-group" key={el.id}>
                      <label className="form-label">{el.label} *</label>
                      {el.type === 'paragraph' ? (
                        <textarea
                          required
                          className="textarea"
                          rows={3}
                          value={customFields[el.id] || ''}
                          placeholder={el.content || `Tulis isi ${el.label}...`}
                          onChange={(e) => setCustomFields({ ...customFields, [el.id]: e.target.value })}
                        />
                      ) : el.type === 'signature' ? (
                        <textarea
                          required
                          className="textarea"
                          rows={2}
                          value={customFields[el.id] || ''}
                          placeholder="Contoh: CEO Joko Widodo&#10;Direktur Utama"
                          onChange={(e) => setCustomFields({ ...customFields, [el.id]: e.target.value })}
                        />
                      ) : (
                        <input
                          type="text"
                          required
                          className="input"
                          value={customFields[el.id] || ''}
                          placeholder={el.content || `Tulis ${el.label}...`}
                          onChange={(e) => setCustomFields({ ...customFields, [el.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 12 }}>
                Simpan Sebagai Draft Dokumen
              </button>
            </form>
          </motion.div>
        );
      })()}

      {activeTab === 'customize' && currentUser.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TemplateCanvas />
        </motion.div>
      )}

      <AnimatePresence>
        {showRevokeModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  function setReviewReason(text: string) {
    setRevokeReason(text);
  }
};
