import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/speller';
import {
  Plus,
  Search,
  Filter,
  UserPlus,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Building,
  Tag,
  Pencil,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanColumnProps {
  stage: {
    id: string;
    name: string;
    color: string;
  };
  stageDeals: any[];
  contacts: any[];
  draggingDealId: string | null;
  setDraggingDealId: (id: string | null) => void;
  updateDealStage: (dealId: string, stageId: string) => void;
  moveDealStage: (dealId: string, direction: 'forward' | 'backward') => void;
  dealStages: any[];
  onEditDeal: (deal: any) => void;
  onDeleteDeal: (id: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  stageDeals,
  contacts,
  draggingDealId,
  setDraggingDealId,
  updateDealStage,
  moveDealStage,
  dealStages,
  onEditDeal,
  onDeleteDeal
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) {
      updateDealStage(dealId, stage.id);
    }
    setDraggingDealId(null);
  };

  return (
    <div
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="kanban-column-title" style={{ borderBottomColor: stage.color }}>
        <span>{stage.name}</span>
        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{stageDeals.length}</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '550px' }}>
        {stageDeals.map((deal) => {
          const contact = contacts.find(c => c.id === deal.contact_id);
          return (
            <div
              key={deal.id}
              className={`kanban-card ${draggingDealId === deal.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', deal.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingDealId(deal.id);
              }}
              onDragEnd={() => {
                setDraggingDealId(null);
                setIsDragOver(false);
                dragCounter.current = 0;
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, width: '100%' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={deal.title}>
                  {deal.title}
                </span>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: 2, minHeight: 'unset', width: 22, height: 22 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDeal(deal);
                    }}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    className="btn btn-ghost text-danger"
                    style={{ padding: 2, minHeight: 'unset', width: 22, height: 22, color: 'var(--danger)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDeal(deal.id);
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                {formatRupiah(deal.value)}
              </span>
              {contact && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building size={12} /> {contact.name}
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 6, margin: 0 }}>
                Est: {deal.expected_close}
              </p>
              
              {/* Quick controls for pipeline shifts */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 4 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: 24, padding: '2px 4px', fontSize: 11 }}
                  onClick={() => moveDealStage(deal.id, 'backward')}
                  disabled={dealStages.findIndex(s => s.id === stage.id) === 0}
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, minHeight: 24, padding: '2px 4px', fontSize: 11 }}
                  onClick={() => moveDealStage(deal.id, 'forward')}
                  disabled={dealStages.findIndex(s => s.id === stage.id) === dealStages.length - 1}
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
        
        {stageDeals.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 12, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
            Kosong
          </div>
        )}
      </div>
    </div>
  );
};

export const CRMView: React.FC = () => {
  const {
    contacts,
    companies,
    dealStages,
    deals,
    addContact,
    updateContact,
    deleteContact,
    addCompany,
    updateCompany,
    deleteCompany,
    addDeal,
    updateDeal,
    deleteDeal,
    updateDealStage,
    currentUser,
    housingProjects
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts' | 'companies'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);
  
  // Modals visibility
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);

  // Editing states
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  // Form states
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company_id: '', tags: '', notes: '', housing_interest: '', lead_source: '' });
  const [companyForm, setCompanyForm] = useState({ name: '', industry: '', size: '1-10', website: '', address: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: '', stage_id: '', contact_id: '', notes: '', expected_close: '' });

  // Handle stage moves (Kanban board)
  const moveDealStage = (dealId: string, direction: 'forward' | 'backward') => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const currentIdx = dealStages.findIndex(s => s.id === deal.stage_id);
    let targetIdx = currentIdx;
    
    if (direction === 'forward' && currentIdx < dealStages.length - 1) {
      targetIdx = currentIdx + 1;
    } else if (direction === 'backward' && currentIdx > 0) {
      targetIdx = currentIdx - 1;
    }
    
    if (targetIdx !== currentIdx) {
      updateDealStage(dealId, dealStages[targetIdx].id);
    }
  };

  // Submits
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name) return;
    
    const parsedTags = contactForm.tags ? contactForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    if (editingContactId) {
      updateContact(editingContactId, {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        company_id: contactForm.company_id,
        tags: parsedTags,
        notes: contactForm.notes,
        housing_interest: contactForm.housing_interest,
        lead_source: contactForm.lead_source
      });
    } else {
      addContact({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        company_id: contactForm.company_id,
        tags: parsedTags,
        notes: contactForm.notes,
        assigned_to: currentUser.id,
        housing_interest: contactForm.housing_interest,
        lead_source: contactForm.lead_source
      });
    }
    
    setContactForm({ name: '', email: '', phone: '', company_id: '', tags: '', notes: '', housing_interest: '', lead_source: '' });
    setEditingContactId(null);
    setShowContactModal(false);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    
    if (editingCompanyId) {
      updateCompany(editingCompanyId, companyForm);
    } else {
      addCompany(companyForm);
    }
    
    setCompanyForm({ name: '', industry: '', size: '1-10', website: '', address: '' });
    setEditingCompanyId(null);
    setShowCompanyModal(false);
  };

  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title || !dealForm.stage_id) return;
    
    const val = Number(dealForm.value) || 0;
    
    if (editingDealId) {
      updateDeal(editingDealId, {
        title: dealForm.title,
        value: val,
        stage_id: dealForm.stage_id,
        contact_id: dealForm.contact_id,
        notes: dealForm.notes,
        expected_close: dealForm.expected_close
      });
    } else {
      addDeal({
        title: dealForm.title,
        value: val,
        stage_id: dealForm.stage_id,
        contact_id: dealForm.contact_id,
        assigned_to: currentUser.id,
        expected_close: dealForm.expected_close,
        notes: dealForm.notes
      });
    }
    
    setDealForm({ title: '', value: '', stage_id: '', contact_id: '', notes: '', expected_close: '' });
    setEditingDealId(null);
    setShowDealModal(false);
  };

  // Filters
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCompanies = companies.filter(co => 
    co.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="main-content">
      {/* TITLE BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>CRM & Pipeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Kelola leads pelanggan, pipeline penjualan, dan portofolio perusahaan partner.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'contacts' && (
            <button className="btn btn-primary" onClick={() => setShowContactModal(true)}>
              <UserPlus size={16} /> Tambah Kontak
            </button>
          )}
          {activeTab === 'companies' && (
            <button className="btn btn-primary" onClick={() => setShowCompanyModal(true)}>
              <Building size={16} /> Tambah Perusahaan
            </button>
          )}
          {activeTab === 'pipeline' && (
            <button className="btn btn-primary" onClick={() => setShowDealModal(true)}>
              <Briefcase size={16} /> Buat Deal Baru
            </button>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH TABS */}
      <div className="card" style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Tabs switch */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: 'var(--bg)', padding: 4, borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`btn ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
            >
              Pipeline Deals
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`btn ${activeTab === 'contacts' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
            >
              Daftar Kontak
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`btn ${activeTab === 'companies' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ minHeight: 32, padding: '4px 16px', fontSize: 13 }}
            >
              Perusahaan Partner
            </button>
          </div>

          {/* Search query input */}
          {activeTab !== 'pipeline' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: '300px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Cari ${activeTab === 'contacts' ? 'kontak' : 'perusahaan'}...`}
                className="input"
                style={{ paddingLeft: '36px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {/* Tab Contents: PIPELINE DEALS (Kanban) */}
          {activeTab === 'pipeline' && (
            <div className={`kanban-board ${draggingDealId ? 'dragging-active' : ''}`}>
              {dealStages.map((stage) => {
                const stageDeals = deals.filter(d => d.stage_id === stage.id);
                return (
                  <KanbanColumn
                    key={stage.id}
                    stage={stage}
                    stageDeals={stageDeals}
                    contacts={contacts}
                    draggingDealId={draggingDealId}
                    setDraggingDealId={setDraggingDealId}
                    updateDealStage={updateDealStage}
                    moveDealStage={moveDealStage}
                    dealStages={dealStages}
                    onEditDeal={(deal) => {
                      setEditingDealId(deal.id);
                      setDealForm({
                        title: deal.title,
                        value: String(deal.value),
                        stage_id: deal.stage_id,
                        contact_id: deal.contact_id || '',
                        notes: deal.notes || '',
                        expected_close: deal.expected_close || ''
                      });
                      setShowDealModal(true);
                    }}
                    onDeleteDeal={(id) => {
                      if (confirm('Apakah Anda yakin ingin menghapus deal ini?')) {
                        deleteDeal(id);
                      }
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Tab Contents: CONTACTS */}
          {activeTab === 'contacts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {filteredContacts.map(c => {
                const comp = companies.find(co => co.id === c.company_id);
                const project = housingProjects.find(p => p.id === c.housing_interest);
                const initials = c.name ? c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                return (
                  <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 10
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 10, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.name}>
                          {c.name}
                        </h4>
                        {comp && (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                            <Building size={9} /> {comp.name}
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: 2, minHeight: 'unset', width: 22, height: 22 }}
                          onClick={() => {
                            setEditingContactId(c.id);
                            setContactForm({
                              name: c.name,
                              email: c.email || '',
                              phone: c.phone || '',
                              company_id: c.company_id || '',
                              tags: c.tags.join(', '),
                              notes: c.notes || '',
                              housing_interest: c.housing_interest || '',
                              lead_source: c.lead_source || ''
                            });
                            setShowContactModal(true);
                          }}
                        >
                          <Pencil size={9} />
                        </button>
                        <button
                          className="btn btn-ghost text-danger"
                          style={{ padding: 2, minHeight: 'unset', width: 22, height: 22, color: 'var(--danger)' }}
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus kontak "${c.name}"?`)) {
                              deleteContact(c.id);
                            }
                          }}
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 9 }}>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <Mail size={10} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                          <Phone size={10} /> <span>{c.phone}</span>
                        </div>
                      )}
                      
                      {/* Housing Developer Custom Badges */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 2, borderTop: '1px dashed var(--border)', paddingTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Minat:</span>
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {project ? project.name : '-'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Sumber Lead:</span>
                          {c.lead_source ? <span className="badge badge-neutral" style={{ fontSize: 8, padding: '2px 4px' }}>{c.lead_source}</span> : <span>-</span>}
                        </div>
                      </div>
                    </div>

                    {c.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
                        {c.tags.map(t => (
                          <span key={t} className="badge badge-primary" style={{ fontSize: 8, padding: '1px 3px' }}>{t}</span>
                        ))}
                      </div>
                    )}

                    {c.notes && (
                      <div style={{
                        fontSize: 8,
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg)',
                        padding: 6,
                        borderRadius: 'var(--radius-sm)',
                        fontStyle: 'italic',
                        marginTop: 'auto',
                        borderLeft: '2px solid var(--primary)'
                      }}>
                        {c.notes}
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredContacts.length === 0 && (
                <div className="card" style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10 }}>
                  Kontak tidak ditemukan.
                </div>
              )}
            </div>
          )}

          {/* Tab Contents: COMPANIES */}
          {activeTab === 'companies' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
              {filteredCompanies.map(co => {
                return (
                  <div key={co.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--success-light)',
                        color: 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 10
                      }}>
                        <Building size={12} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: 10, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={co.name}>
                          {co.name}
                        </h4>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                          {co.industry || 'Industri Lainnya'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: 2, minHeight: 'unset', width: 22, height: 22 }}
                          onClick={() => {
                            setEditingCompanyId(co.id);
                            setCompanyForm({
                              name: co.name,
                              industry: co.industry || '',
                              size: co.size || '1-10',
                              website: co.website || '',
                              address: co.address || ''
                            });
                            setShowCompanyModal(true);
                          }}
                        >
                          <Pencil size={9} />
                        </button>
                        <button
                          className="btn btn-ghost text-danger"
                          style={{ padding: 2, minHeight: 'unset', width: 22, height: 22, color: 'var(--danger)' }}
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin menghapus perusahaan "${co.name}"?`)) {
                              deleteCompany(co.id);
                            }
                          }}
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Karyawan:</span>
                        <span className="badge badge-neutral" style={{ fontSize: 8, padding: '2px 4px' }}>{co.size} Karyawan</span>
                      </div>

                      {co.website && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Website:</span>
                          <a href={`https://${co.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                            {co.website}
                          </a>
                        </div>
                      )}

                      {co.address && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, borderTop: '1px dashed var(--border)', paddingTop: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Alamat Kantor:</span>
                          <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.3', fontSize: 8 }}>
                            {co.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredCompanies.length === 0 && (
                <div className="card" style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10 }}>
                  Perusahaan tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ADD CONTACT MODAL */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleContactSubmit}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Tambah Kontak Baru</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowContactModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Telepon</label>
                <input
                  type="text"
                  className="input"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Perusahaan Terkait</label>
                <select
                  className="select"
                  value={contactForm.company_id}
                  onChange={(e) => setContactForm({ ...contactForm, company_id: e.target.value })}
                >
                  <option value="">-- Pilih Perusahaan --</option>
                  {companies.map(co => (
                    <option key={co.id} value={co.id}>{co.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Minat Perumahan</label>
                <select
                  className="select"
                  value={contactForm.housing_interest}
                  onChange={(e) => setContactForm({ ...contactForm, housing_interest: e.target.value })}
                >
                  <option value="">-- Pilih Proyek Perumahan --</option>
                  {housingProjects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location} - {proj.price_range})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sumber Lead / Kontak</label>
                <select
                  className="select"
                  value={contactForm.lead_source}
                  onChange={(e) => setContactForm({ ...contactForm, lead_source: e.target.value })}
                >
                  <option value="">-- Pilih Sumber Lead --</option>
                  <option value="Instagram Ad">Instagram Ad</option>
                  <option value="Facebook Ad">Facebook Ad</option>
                  <option value="Walk-in / Kantor Pemasaran">Walk-in / Kantor Pemasaran</option>
                  <option value="Agent / Broker">Agent / Broker</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Website">Website</option>
                  <option value="Rekomendasi / Lainnya">Rekomendasi / Lainnya</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="e.g. VIP, Developer, Lead"
                  className="input"
                  value={contactForm.tags}
                  onChange={(e) => setContactForm({ ...contactForm, tags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan Tambahan</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowContactModal(false); setEditingContactId(null); }}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ADD COMPANY MODAL */}
      <AnimatePresence>
        {showCompanyModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleCompanySubmit}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Tambah Perusahaan Baru</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowCompanyModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Industri / Sektor</label>
                <input
                  type="text"
                  className="input"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ukuran Karyawan</label>
                <select
                  className="select"
                  value={companyForm.size}
                  onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                >
                  <option value="1-10">1-10 Karyawan</option>
                  <option value="11-50">11-50 Karyawan</option>
                  <option value="51-200">51-200 Karyawan</option>
                  <option value="201-500">201-500 Karyawan</option>
                  <option value="500+">500+ Karyawan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input
                  type="text"
                  placeholder="e.g. company.com"
                  className="input"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Alamat Kantor</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowCompanyModal(false); setEditingCompanyId(null); }}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>

      {/* ADD DEAL MODAL */}
      <AnimatePresence>
        {showDealModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.form
              className="modal-content"
              onSubmit={handleDealSubmit}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Buat Deal Baru di Pipeline</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowDealModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Deal / Project *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={dealForm.title}
                  onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nilai Nominal (Rupiah) *</label>
                <input
                  type="number"
                  required
                  className="input"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Pipeline Stage *</label>
                <select
                  required
                  className="select"
                  value={dealForm.stage_id}
                  onChange={(e) => setDealForm({ ...dealForm, stage_id: e.target.value })}
                >
                  <option value="">-- Pilih Stage --</option>
                  {dealStages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Hubungkan dengan Kontak Utama</label>
                <select
                  className="select"
                  value={dealForm.contact_id}
                  onChange={(e) => setDealForm({ ...dealForm, contact_id: e.target.value })}
                >
                  <option value="">-- Pilih Kontak --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Perkiraan Close Date</label>
                <input
                  type="date"
                  className="input"
                  value={dealForm.expected_close}
                  onChange={(e) => setDealForm({ ...dealForm, expected_close: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Catatan Deal</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setShowDealModal(false); setEditingDealId(null); }}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
};
