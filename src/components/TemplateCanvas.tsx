import React, { useState, useEffect, useRef } from 'react';
import { useApp, VisualTemplate, TemplateElement } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  RefreshCw, 
  Save, 
  Eye, 
  EyeOff, 
  Move, 
  Plus, 
  Trash2,
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  FileCheck,
  Type,
  FileText
} from 'lucide-react';

export const TemplateCanvas: React.FC = () => {
  const { visualTemplates, updateVisualTemplate, createVisualTemplate, currentUser } = useApp();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('vt-invoice-default');
  const [activeTemplate, setActiveTemplate] = useState<VisualTemplate | null>(null);

  // Element selection state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // New template creation state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBase, setNewTemplateBase] = useState<'invoice' | 'receipt' | 'letter'>('letter');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Active dragging and resizing state
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const elementStartWidth = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Sync state from context when selected template changes
  useEffect(() => {
    const template = visualTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      setActiveTemplate(JSON.parse(JSON.stringify(template))); // deep copy
      setSelectedElementId(null);
    }
  }, [selectedTemplateId, visualTemplates]);

  // Dynamic scale calculation to fit screen size on mobile/tablets
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && activeTemplate) {
        const parentWidth = containerRef.current.clientWidth;
        const targetWidth = activeTemplate.paper_orientation === 'landscape' ? 820 : 580;
        if (parentWidth < targetWidth) {
          setScaleFactor(parentWidth / targetWidth);
        } else {
          setScaleFactor(1);
        }
      }
    };

    updateScale();
    
    // Resize observer is more reliable for grid changes
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
  }, [activeTemplate?.paper_orientation, activeTemplate?.id]);

  if (!activeTemplate) return <div style={{ padding: 20 }}>Memuat template...</div>;

  // Aspect ratio calculations: A4/A5 (1 : 1.414), F4 (1 : 1.535)
  const getAspectRatio = () => {
    const size = activeTemplate.paper_size;
    const isLandscape = activeTemplate.paper_orientation === 'landscape';
    
    let ratio = 1.414; // Default A4/A5
    if (size === 'F4') ratio = 1.535; // F4 Folio
    
    return isLandscape ? 1 / ratio : ratio;
  };

  const handlePaperSizeChange = (size: 'A4' | 'A5' | 'F4') => {
    setActiveTemplate(prev => prev ? { ...prev, paper_size: size } : null);
  };

  const handleOrientationChange = (orientation: 'portrait' | 'landscape') => {
    setActiveTemplate(prev => prev ? { ...prev, paper_orientation: orientation } : null);
  };

  const handleHeaderFieldChange = (field: string, value: string) => {
    setActiveTemplate(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Add custom elements
  const addCustomElement = (type: 'text' | 'paragraph' | 'signature') => {
    if (!activeTemplate) return;
    
    const newId = `el-custom-${Date.now()}`;
    const newElement: TemplateElement = {
      id: newId,
      type,
      label: type === 'text' ? 'Teks Kustom' : type === 'paragraph' ? 'Paragraf Kustom' : 'Kolom Tanda Tangan',
      content: type === 'text' ? 'Label: Nilai' : type === 'paragraph' ? 'Tulis isi paragraf panjang kustom Anda di sini...' : 'CEO Joko Widodo\nDirektur Utama',
      x: 10,
      y: 40 + (activeTemplate.elements.length * 4) % 40, // offset coordinates so they don't overlay
      visible: true,
      fontSize: type === 'paragraph' ? 9 : 10,
      fontWeight: 'normal',
      alignment: 'left',
      width: type === 'paragraph' ? 80 : 40
    };

    setActiveTemplate({
      ...activeTemplate,
      elements: [...activeTemplate.elements, newElement]
    });
    setSelectedElementId(newId);
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    if (!activeTemplate) return;
    
    // Prevent deleting core elements unless they are custom
    const el = activeTemplate.elements.find(e => e.id === elementId);
    if (!el) return;

    if (!elementId.startsWith('el-custom-')) {
      alert('Elemen bawaan template tidak dapat dihapus, sembunyikan saja dengan tombol mata.');
      return;
    }

    setActiveTemplate({
      ...activeTemplate,
      elements: activeTemplate.elements.filter(e => e.id !== elementId)
    });
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  // Edit element properties
  const updateElementProperty = (elementId: string, property: keyof TemplateElement, value: any) => {
    if (!activeTemplate) return;
    
    const updatedElements = activeTemplate.elements.map(el => {
      if (el.id === elementId) {
        return { ...el, [property]: value };
      }
      return el;
    });

    setActiveTemplate({
      ...activeTemplate,
      elements: updatedElements
    });
  };

  const toggleElementVisibility = (elementId: string) => {
    if (!activeTemplate) return;
    const el = activeTemplate.elements.find(e => e.id === elementId);
    if (el) {
      updateElementProperty(elementId, 'visible', !el.visible);
    }
  };

  // Pointer dragging handler
  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    if (!canvasRef.current || !activeTemplate) return;

    setSelectedElementId(elementId);
    setDraggingElementId(elementId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    const el = activeTemplate.elements.find(item => item.id === elementId);
    if (!el) return;
    
    elementStartPos.current = { x: el.x, y: el.y };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  // Resize pointer handlers
  const handleResizeStart = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    if (!canvasRef.current || !activeTemplate) return;

    setSelectedElementId(elementId);
    setResizingElementId(elementId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const el = activeTemplate.elements.find(item => item.id === elementId);
    if (!el) return;

    elementStartWidth.current = el.width || 40;

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const handleResizeEnd = (e: React.PointerEvent, elementId: string) => {
    if (resizingElementId !== null) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore capture releases
      }
      setResizingElementId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || !activeTemplate) return;

    // Resizing logic
    if (resizingElementId !== null) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.current.x;
      const dxPct = (deltaX / canvasRect.width) * 100;
      let newWidth = Math.round(elementStartWidth.current + dxPct);
      newWidth = Math.max(15, Math.min(100, newWidth));

      const updatedElements = activeTemplate.elements.map(el => {
        if (el.id === resizingElementId) {
          return { ...el, width: newWidth };
        }
        return el;
      });

      setActiveTemplate({
        ...activeTemplate,
        elements: updatedElements
      });
      return;
    }

    // Dragging logic
    if (draggingElementId === null) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;

    // Calculate delta moves in % relative to canvas container bounding rect
    const dxPct = (deltaX / canvasRect.width) * 100;
    const dyPct = (deltaY / canvasRect.height) * 100;

    let newX = Math.round(elementStartPos.current.x + dxPct);
    let newY = Math.round(elementStartPos.current.y + dyPct);

    // Keep elements inside canvas boundaries
    newX = Math.max(0, Math.min(90, newX));
    newY = Math.max(0, Math.min(95, newY));

    const updatedElements = activeTemplate.elements.map(el => {
      if (el.id === draggingElementId) {
        return { ...el, x: newX, y: newY };
      }
      return el;
    });

    setActiveTemplate({
      ...activeTemplate,
      elements: updatedElements
    });
  };

  const handlePointerUp = (e: React.PointerEvent, elementId: string) => {
    if (draggingElementId !== null) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore capture releases on non-bound pointers
      }
      setDraggingElementId(null);
    }
    if (resizingElementId !== null) {
      const target = e.currentTarget as HTMLElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore capture releases on non-bound pointers
      }
      setResizingElementId(null);
    }
  };

  const handleSave = () => {
    if (activeTemplate) {
      updateVisualTemplate(activeTemplate);
      alert(`Layout template "${activeTemplate.name}" berhasil disimpan!`);
    }
  };

  const handleReset = () => {
    const template = visualTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      setActiveTemplate(JSON.parse(JSON.stringify(template))); // deep copy
      setSelectedElementId(null);
    }
  };

  const handleCreateTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    createVisualTemplate(newTemplateName, newTemplateBase);
    alert(`Template "${newTemplateName}" berhasil dibuat!`);
    
    // Auto switch to the newly created template
    // We guess the template ID is matching vt-custom-[timestamp] which is created inside Context
    setNewTemplateName('');
    setShowCreateForm(false);
  };

  // Rendering individual blocks
  const renderElementContent = (el: TemplateElement, t: VisualTemplate) => {
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
      lineHeight: 1.4,
      fontFamily: t.font_family === 'Outfit' ? "'Outfit', sans-serif" : "'Inter', sans-serif"
    };

    switch (el.type) {
      case 'header':
        return (
          <div style={{ padding: '8px', borderBottom: '2.5px double #1f2937', width: '310px', display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', margin: 0, textTransform: 'uppercase' }}>
              {t.logo_text || 'LOGO PERUSAHAAN'}
            </h4>
            <p style={{ fontSize: '7.5px', color: '#4b5563', margin: 0 }}>{t.header_address || 'Alamat Perusahaan...'}</p>
            <p style={{ fontSize: '7.5px', color: '#4b5563', margin: 0 }}>{t.header_phone_email || 'Telp / Email...'}</p>
          </div>
        );
      
      case 'title_number':
        return (
          <div style={{ padding: '6px', textAlign: align === 'left' ? 'left' : 'right', display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none', minWidth: '150px' }}>
            <h3 style={{ fontSize: `${fontSize}px`, fontWeight: 800, margin: 0, letterSpacing: '0.05em' }}>
              {t.doc_type === 'invoice' ? 'INVOICE' : t.doc_type === 'receipt' ? 'KWITANSI' : 'SURAT RESMI'}
            </h3>
            <p style={{ fontSize: '8.5px', fontWeight: 600, margin: 0, color: '#2563eb' }}>No: REG/2026/06/0001</p>
            <p style={{ fontSize: '7.5px', color: '#6b7280', margin: 0 }}>Tgl: {new Date().toLocaleDateString('id-ID')}</p>
          </div>
        );

      case 'client_info':
        return (
          <div style={{ padding: '6px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '2px', pointerEvents: 'none' }}>
            <span style={{ fontSize: '7px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>
              {t.doc_type === 'invoice' ? 'DITAGIHKAN KEPADA:' : t.doc_type === 'receipt' ? 'SUDAH DITERIMA DARI:' : 'KEPADA YTH:'}
            </span>
            <span style={{ fontSize: `${fontSize}px`, fontWeight: 700 }}>PT Perumahan CRM Jaya</span>
            <span style={{ fontSize: '7.5px', color: '#6b7280' }}>Mitra Eksternal Perusahaan</span>
          </div>
        );

      case 'document_body':
        if (t.doc_type === 'invoice') {
          return (
            <div style={{ width: '380px', pointerEvents: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${fontSize}px` }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #9ca3af', textAlign: 'left' }}>
                    <th style={{ padding: '3px 6px', fontSize: '7.5px' }}>Item Deskripsi Tagihan</th>
                    <th style={{ padding: '3px 6px', fontSize: '7.5px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '3px 6px', fontSize: '7.5px', textAlign: 'right' }}>Harga</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '4px 6px' }}>Pekerjaan Pondasi Infrastruktur</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>1</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>Rp 50.000.000</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px' }}>Biaya Operasional Karyawan Lapangan</td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>2</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>Rp 10.000.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        } else if (t.doc_type === 'receipt') {
          return (
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '3px', pointerEvents: 'none', fontSize: `${fontSize}px` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '2px' }}>
                <span style={{ color: '#4b5563', fontSize: '7.5px', fontWeight: 600 }}>Nominal Uang:</span>
                <span style={{ fontWeight: 800, color: '#2563eb' }}>Rp 70.000.000</span>
                <span style={{ color: '#4b5563', fontSize: '7.5px', fontWeight: 600 }}>Terbilang:</span>
                <span style={{ fontSize: '7.5px', fontStyle: 'italic', backgroundColor: '#f3f4f6', padding: '1px 3px' }}>"Tujuh Puluh Juta Rupiah"</span>
              </div>
            </div>
          );
        } else {
          return (
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none', fontSize: `${fontSize}px` }}>
              <p style={{ margin: 0, textIndent: '12px' }}>
                Dengan ini menerangkan bahwa perwakilan operasional perusahaan ditunjuk untuk melaksanakan tugas kerja di area klaster pembangunan baru terhitung mulai tanggal terbit surat tugas resmi ini.
              </p>
            </div>
          );
        }

      case 'totals_area':
        return (
          <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '8px', borderTop: '1px solid #9ca3af', paddingTop: '4px', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>Rp 70.000.000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px double black', paddingTop: '2px', fontWeight: 800, color: '#2563eb' }}>
              <span>Total Akhir:</span>
              <span>Rp 70.000.000</span>
            </div>
          </div>
        );

      case 'status_stamp':
        return (
          <div style={{ border: '2px solid #16a34a', color: '#16a34a', padding: '3px 6px', textTransform: 'uppercase', fontWeight: 800, fontSize: '9px', borderRadius: '4px', transform: 'rotate(-5deg)', width: 'fit-content', opacity: 0.8, pointerEvents: 'none' }}>
            ✅ TERVERIFIKASI ASLI
          </div>
        );

      case 'qr_code':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', pointerEvents: 'none' }}>
            <div style={{ width: '45px', height: '45px', border: '1px solid #d1d5db', padding: '2px', backgroundColor: 'white' }}>
              <div style={{ width: '100%', height: '100%', backgroundColor: '#111827', opacity: 0.8 }}></div>
            </div>
            <span style={{ fontSize: '5px', color: '#6b7280', fontWeight: 'bold' }}>SCAN VERIFIKASI</span>
          </div>
        );

      case 'text':
        return (
          <div style={{ width: widthStyle, pointerEvents: 'none' }}>
            <p style={textStyle}>
              {el.content}
            </p>
          </div>
        );

      case 'paragraph':
        return (
          <div style={{ width: widthStyle, pointerEvents: 'none' }}>
            <p style={textStyle}>
              {el.content}
            </p>
          </div>
        );

      case 'signature':
        return (
          <div style={{ width: widthStyle, display: 'flex', flexDirection: 'column', gap: '35px', pointerEvents: 'none' }}>
            <span style={{ fontSize: '7.5px', color: '#4b5563', margin: 0 }}>Hormat Kami,</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 'bold', textDecoration: 'underline' }}>{el.content.split('\n')[0]}</span>
              {el.content.split('\n').slice(1).map((line, idx) => (
                <span key={idx} style={{ fontSize: '7.5px', color: '#6b7280' }}>{line}</span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid-cols-3" style={{ gap: 24, margin: '20px 0' }}>
      
      {/* SIDEBAR PROPERTIES EDITOR */}
      <div className="card" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 16, height: 'fit-content' }}>
        <div className="card-header" style={{ marginBottom: 4, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="var(--primary)" /> Kustomisasi Kanvas
          </span>
        </div>

        {/* SELECT OR CREATE TEMPLATE */}
        <div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Pilih Template Dokumen</label>
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
          
          {currentUser.role === 'admin' && (
            <div style={{ marginTop: 8 }}>
              {!showCreateForm ? (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', minHeight: 32, fontSize: 12, padding: '4px 10px', gap: 4 }}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={14} /> Buat Jenis Dokumen Baru (Kustom)
                </button>
              ) : (
                <form onSubmit={handleCreateTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Bikin Dokumen Resmi Baru</span>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Nama Dokumen Resmi *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Surat Perjanjian" 
                      className="input" 
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Basis Struktur Layout</label>
                    <select 
                      className="select" 
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      value={newTemplateBase}
                      onChange={(e) => setNewTemplateBase(e.target.value as any)}
                    >
                      <option value="letter">Surat / Dokumen Umum</option>
                      <option value="invoice">Invoice Penagihan</option>
                      <option value="receipt">Kwitansi Keuangan</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                      onClick={() => setShowCreateForm(false)}
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ flex: 1, minHeight: 30, fontSize: 11, padding: 4 }}
                    >
                      Buat
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* PAPER SETTINGS AND COP */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Ukuran & Orientasi Kertas</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {['A4', 'A5', 'F4'].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`btn ${activeTemplate.paper_size === size ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, minHeight: 32, padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handlePaperSizeChange(size as any)}
                >
                  {size}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'portrait', name: 'Tegak' },
                { id: 'landscape', name: 'Mendatar' }
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={`btn ${activeTemplate.paper_orientation === o.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, minHeight: 32, padding: '4px 8px', fontSize: 12 }}
                  onClick={() => handleOrientationChange(o.id as any)}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Kop Surat Perusahaan</span>
            <input 
              type="text" 
              placeholder="Nama PT / Logo Text"
              className="input" 
              style={{ padding: '6px 10px', fontSize: 12 }}
              value={activeTemplate.logo_text}
              onChange={(e) => handleHeaderFieldChange('logo_text', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Alamat Organisasi"
              className="input" 
              style={{ padding: '6px 10px', fontSize: 12 }}
              value={activeTemplate.header_address}
              onChange={(e) => handleHeaderFieldChange('header_address', e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Telepon / Email"
              className="input" 
              style={{ padding: '6px 10px', fontSize: 12 }}
              value={activeTemplate.header_phone_email}
              onChange={(e) => handleHeaderFieldChange('header_phone_email', e.target.value)}
            />
          </div>
        </div>

        {/* ADD CUSTOM ELEMENTS PANEL */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Tambah Komponen Baru</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 32, padding: '4px 8px', fontSize: 11, gap: 4 }}
              onClick={() => addCustomElement('text')}
            >
              <Plus size={12} /> Teks Pendek
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 32, padding: '4px 8px', fontSize: 11, gap: 4 }}
              onClick={() => addCustomElement('paragraph')}
            >
              <Plus size={12} /> Paragraf
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: 32, padding: '4px 8px', fontSize: 11, gap: 4, gridColumn: 'span 2' }}
              onClick={() => addCustomElement('signature')}
            >
              <Plus size={12} /> Kolom Tanda Tangan
            </button>
          </div>
        </div>

        {/* EDIT SELECTED ELEMENT PANEL */}
        <AnimatePresence mode="wait">
          {selectedElementId && (() => {
            const el = activeTemplate.elements.find(e => e.id === selectedElementId);
            if (!el) return null;
            
            const isCustom = el.id.startsWith('el-custom-');

            return (
              <motion.div 
                key={el.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10, backgroundColor: 'var(--primary-light)', padding: 12, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}
              >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>Edit Elemen: {el.label}</span>
                {isCustom && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: 4, minHeight: 'unset', color: 'var(--danger)' }}
                    onClick={() => deleteElement(el.id)}
                    title="Hapus Elemen Kustom"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Editable Label (Custom elements only) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Nama Field Input (di Formulir)</label>
                <input
                  type="text"
                  className="input"
                  style={{ padding: '4px 8px', fontSize: 12 }}
                  value={el.label}
                  onChange={(e) => updateElementProperty(el.id, 'label', e.target.value)}
                />
              </div>

              {/* Editable Content Copy */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 10 }}>Default Teks Isi / Copy</label>
                {el.type === 'paragraph' ? (
                  <textarea
                    rows={3}
                    className="textarea"
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    value={el.content}
                    onChange={(e) => updateElementProperty(el.id, 'content', e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="input"
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    value={el.content}
                    onChange={(e) => updateElementProperty(el.id, 'content', e.target.value)}
                  />
                )}
              </div>

              {/* Alignments and Weight properties */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      type="button"
                      className={`btn ${el.alignment === align ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 8px', minHeight: 28 }}
                      onClick={() => updateElementProperty(el.id, 'alignment', align)}
                    >
                      {align === 'left' ? <AlignLeft size={13} /> : align === 'center' ? <AlignCenter size={13} /> : <AlignRight size={13} />}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`btn ${el.fontWeight === 'bold' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 8px', minHeight: 28 }}
                  onClick={() => updateElementProperty(el.id, 'fontWeight', el.fontWeight === 'bold' ? 'normal' : 'bold')}
                  title="Tebalkan Teks"
                >
                  <Bold size={13} />
                </button>
              </div>

              {/* Font Size controls */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 500 }}>Ukuran Font</span>
                <select
                  style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--bg-card)' }}
                  value={el.fontSize || 9}
                  onChange={(e) => updateElementProperty(el.id, 'fontSize', Number(e.target.value))}
                >
                  <option value={7}>Kecil (7px)</option>
                  <option value={9}>Normal (9px)</option>
                  <option value={11}>Sedang (11px)</option>
                  <option value={14}>Besar (14px)</option>
                  <option value={18}>Ekstra (18px)</option>
                </select>
              </div>

              {/* Width control */}
              {(el.type === 'paragraph' || el.type === 'signature' || el.type === 'text') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span>Lebar Kolom Elemen</span>
                    <strong>{el.width || 50}%</strong>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={el.width || 50}
                    onChange={(e) => updateElementProperty(el.id, 'width', Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {/* Hide / Show element */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10 }}>Tampilkan Elemen di Kertas</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: 4, minHeight: 'unset' }}
                  onClick={() => toggleElementVisibility(el.id)}
                >
                  {el.visible ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--success)' }}><Eye size={14} /> Terlihat</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}><EyeOff size={14} /> Tersembunyi</span>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

        {/* BOTTOM SAVE/RESET TOOLS */}
        <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ flex: 1, gap: 4 }}
            onClick={handleReset}
          >
            <RefreshCw size={14} /> Reset
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ flex: 1, gap: 4 }}
            onClick={handleSave}
          >
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>

      {/* PAPER CANVAS VISUAL WORKSPACE */}
      <div 
        ref={containerRef}
        style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: '100%', overflow: 'hidden' }}
      >
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, width: '100%', fontWeight: 500 }}>
          <Type size={16} />
          <span>Klik salah satu elemen kustom untuk mengedit teks atau ukurannya di panel kiri. Tarik elemen untuk memindahkan posisinya.</span>
        </div>

        {/* PROPORTIONAL SCALING CONTAINER WRAPPER */}
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            height: `${(activeTemplate.paper_orientation === 'landscape' ? 820 : 580) * getAspectRatio() * scaleFactor}px`,
            position: 'relative'
          }}
        >
          {/* WORKSPACE CANVAS */}
          <div
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top left',
              width: activeTemplate.paper_orientation === 'landscape' ? '820px' : '580px',
              height: `${(activeTemplate.paper_orientation === 'landscape' ? 820 : 580) * getAspectRatio()}px`,
              backgroundColor: 'white',
              color: '#1f2937',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              overflow: 'hidden',
              backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
              backgroundSize: '16px 16px',
              userSelect: 'none',
              touchAction: 'none'
            }}
          >
            {activeTemplate.elements.map((el) => {
              if (!el.visible) return null;

              const isSelected = selectedElementId === el.id;
              const isDragging = draggingElementId === el.id;

              return (
                <motion.div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDown(e, el.id)}
                  onPointerUp={(e) => handlePointerUp(e, el.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const newContent = prompt(`Edit konten untuk "${el.label}":`, el.content);
                    if (newContent !== null) {
                      updateElementProperty(el.id, 'content', newContent);
                    }
                  }}
                  initial={el.id.startsWith('el-custom-') ? { scale: 0, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    border: isSelected ? '1.5px dashed var(--primary)' : '1px dashed transparent',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                    padding: '4px',
                    borderRadius: '3px',
                    zIndex: isSelected ? 100 : 10,
                    transition: isDragging ? 'none' : 'border-color 0.15s ease',
                    boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.06)' : 'none',
                    touchAction: 'none'
                  }}
                  title={`Geser/Edit ${el.label} (Double-click untuk ganti isi teks)`}
                >
                  {/* Floating Action Toolbar */}
                  {isSelected && (
                    <div
                      className="no-print"
                      style={{
                        position: 'absolute',
                        top: '-32px',
                        left: '0',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                        zIndex: 201,
                        whiteSpace: 'nowrap'
                      }}
                      onPointerDown={(e) => e.stopPropagation()} // Prevent dragging element when clicking toolbar
                      onDoubleClick={(e) => e.stopPropagation()} // Prevent prompting when double clicking toolbar
                    >
                      <span style={{ fontSize: '8px', fontWeight: 'bold', borderRight: '1px solid #4b5563', paddingRight: '6px', color: '#9ca3af', textTransform: 'uppercase' }}>
                        {el.label}
                      </span>

                      {/* Bold toggle */}
                      <button
                        type="button"
                        onClick={() => updateElementProperty(el.id, 'fontWeight', el.fontWeight === 'bold' ? 'normal' : 'bold')}
                        style={{ background: el.fontWeight === 'bold' ? 'var(--primary)' : 'transparent', border: 'none', color: 'white', padding: '2px 4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                        title="Tebalkan Teks"
                      >
                        <Bold size={11} />
                      </button>

                      {/* Alignments */}
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => updateElementProperty(el.id, 'alignment', align)}
                          style={{ background: el.alignment === align ? 'var(--primary)' : 'transparent', border: 'none', color: 'white', padding: '2px 4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                          title={`Rata ${align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}`}
                        >
                          {align === 'left' ? <AlignLeft size={11} /> : align === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                        </button>
                      ))}

                      {/* Font size + */}
                      <button
                        type="button"
                        onClick={() => updateElementProperty(el.id, 'fontSize', Math.min(24, (el.fontSize || 9) + 1))}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '2px 4px', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}
                        title="Perbesar Huruf"
                      >
                        A+
                      </button>
                      
                      {/* Font size - */}
                      <button
                        type="button"
                        onClick={() => updateElementProperty(el.id, 'fontSize', Math.max(7, (el.fontSize || 9) - 1))}
                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '2px 4px', cursor: 'pointer', fontSize: '9px', fontWeight: 'bold' }}
                        title="Perkecil Huruf"
                      >
                        A-
                      </button>

                      {/* Delete button (only if custom) */}
                      {el.id.startsWith('el-custom-') && (
                        <button
                          type="button"
                          onClick={() => deleteElement(el.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '2px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Hapus Elemen"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )}

                  {renderElementContent(el, activeTemplate)}

                  {/* Resize handle (right edge) */}
                  {isSelected && (el.type === 'paragraph' || el.type === 'signature' || el.type === 'text') && (
                    <div
                      onPointerDown={(e) => handleResizeStart(e, el.id)}
                      onPointerUp={(e) => handleResizeEnd(e, el.id)}
                      style={{
                        position: 'absolute',
                        right: '-5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '10px',
                        height: '10px',
                        backgroundColor: 'var(--primary)',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'ew-resize',
                        zIndex: 200,
                        touchAction: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Tarik untuk mengubah lebar kolom"
                    />
                  )}
                </motion.div>
              );
            })}

            {/* Watermark paper details bottom right corner */}
            <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '8px', fontWeight: 'bold', color: '#9ca3af', opacity: 0.5 }}>
              {activeTemplate.paper_size} - {activeTemplate.paper_orientation.toUpperCase()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
