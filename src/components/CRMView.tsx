import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';

export const CRMView: React.FC = () => {
  const {
    contacts,
    companies,
    dealStages,
    deals,
    addContact,
    addCompany,
    addDeal,
    updateDealStage,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'contacts' | 'companies'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals visibility
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company_id: '', tags: '', notes: '' });
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
    
    addContact({
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      company_id: contactForm.company_id,
      tags: contactForm.tags ? contactForm.tags.split(',').map(t => t.trim()) : [],
      notes: contactForm.notes,
      assigned_to: currentUser.id
    });
    
    setContactForm({ name: '', email: '', phone: '', company_id: '', tags: '', notes: '' });
    setShowContactModal(false);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name) return;
    
    addCompany(companyForm);
    setCompanyForm({ name: '', industry: '', size: '1-10', website: '', address: '' });
    setShowCompanyModal(false);
  };

  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.title || !dealForm.stage_id) return;
    
    addDeal({
      title: dealForm.title,
      value: Number(dealForm.value) || 0,
      stage_id: dealForm.stage_id,
      contact_id: dealForm.contact_id,
      assigned_to: currentUser.id,
      expected_close: dealForm.expected_close,
      notes: dealForm.notes
    });
    
    setDealForm({ title: '', value: '', stage_id: '', contact_id: '', notes: '', expected_close: '' });
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

      {/* Tab Contents: PIPELINE DEALS (Kanban) */}
      {activeTab === 'pipeline' && (
        <div className="kanban-board">
          {dealStages.map((stage) => {
            const stageDeals = deals.filter(d => d.stage_id === stage.id);
            return (
              <div key={stage.id} className="kanban-column">
                <div className="kanban-column-title" style={{ borderBottomColor: stage.color }}>
                  <span>{stage.name}</span>
                  <span className="badge badge-neutral" style={{ fontSize: 10 }}>{stageDeals.length}</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: '550px' }}>
                  {stageDeals.map((deal) => {
                    const contact = contacts.find(c => c.id === deal.contact_id);
                    return (
                      <div key={deal.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{deal.title}</span>
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
          })}
        </div>
      )}

      {/* Tab Contents: CONTACTS */}
      {activeTab === 'contacts' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Perusahaan</th>
                <th>Tags</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(c => {
                const comp = companies.find(co => co.id === c.company_id);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.email || '-'}</td>
                    <td>{c.phone || '-'}</td>
                    <td>{comp ? comp.name : '-'}</td>
                    <td>
                      {c.tags.map(t => (
                        <span key={t} className="badge badge-primary" style={{ marginRight: 4, fontSize: 9 }}>{t}</span>
                      ))}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.notes || '-'}</td>
                  </tr>
                );
              })}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Kontak tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Contents: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Perusahaan</th>
                <th>Industri</th>
                <th>Ukuran</th>
                <th>Website</th>
                <th>Alamat</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map(co => (
                <tr key={co.id}>
                  <td style={{ fontWeight: 600 }}>{co.name}</td>
                  <td>{co.industry}</td>
                  <td><span className="badge badge-neutral">{co.size} Karyawan</span></td>
                  <td>
                    {co.website ? (
                      <a href={`https://${co.website}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {co.website}
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{co.address}</td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Perusahaan tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD CONTACT MODAL */}
      {showContactModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleContactSubmit}>
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowContactModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD COMPANY MODAL */}
      {showCompanyModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleCompanySubmit}>
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowCompanyModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD DEAL MODAL */}
      {showDealModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleDealSubmit}>
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
              <button type="button" className="btn btn-secondary" onClick={() => setShowDealModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
