import React, { useState } from 'react';
import { useApp, ApprovalTemplate, ApprovalLevel } from '../context/AppContext';
import { formatRupiah } from '../utils/speller';
import {
  GitCommit,
  Plus,
  Trash2,
  Save,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Settings
} from 'lucide-react';

export const ApprovalHierarchyView: React.FC = () => {
  const {
    approvalTemplates,
    updateApprovalTemplate,
    users,
    currentUser
  } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(approvalTemplates[0]?.id || '');
  const [editingTemplate, setEditingTemplate] = useState<ApprovalTemplate | null>(() => {
    const found = approvalTemplates.find(t => t.id === selectedTemplateId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  });

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = approvalTemplates.find(t => t.id === id);
    setEditingTemplate(found ? JSON.parse(JSON.stringify(found)) : null);
  };

  const handleAddLevel = () => {
    if (!editingTemplate) return;
    const currentLevels = editingTemplate.levels;
    const newLevelNum = currentLevels.length + 1;
    
    const newLevel: ApprovalLevel = {
      level: newLevelNum,
      role: 'Staff',
      user_id: users[0]?.id || '',
      required: true
    };

    setEditingTemplate({
      ...editingTemplate,
      levels: [...currentLevels, newLevel]
    });
  };

  const handleRemoveLevel = (index: number) => {
    if (!editingTemplate) return;
    const updated = editingTemplate.levels.filter((_, i) => i !== index).map((level, i) => ({
      ...level,
      level: i + 1
    }));

    setEditingTemplate({
      ...editingTemplate,
      levels: updated
    });
  };

  const handleLevelChange = (index: number, fields: Partial<ApprovalLevel>) => {
    if (!editingTemplate) return;
    const updated = editingTemplate.levels.map((level, i) => {
      if (i === index) {
        return { ...level, ...fields };
      }
      return level;
    });

    setEditingTemplate({
      ...editingTemplate,
      levels: updated
    });
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateApprovalTemplate(editingTemplate);
    alert('Workflow approval hierarchy berhasil disimpan!');
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="main-content">
        <div className="card text-center" style={{ padding: 48 }}>
          <ShieldCheck size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, color: 'var(--text-main)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            Halaman konfigurasi alur persetujuan hanya dapat diakses oleh Admin. Silakan ganti akun simulasi Anda ke Admin di footer/header.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* HEADER TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Workflow Approval Config</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Konfigurasi rantai otorisasi persetujuan berjenjang dan threshold nominal untuk Invoice, Kwitansi, dan Surat HR.
          </p>
        </div>
      </div>

      {/* TEMPLATE PICKER & RULES WRAPPER */}
      <div className="grid-cols-3">
        {/* Templates list select */}
        <div className="card" style={{ gridColumn: 'span 1', height: 'fit-content' }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--primary)" /> Tipe Dokumen
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvalTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`btn ${selectedTemplateId === template.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: '10px 14px',
                  minHeight: 'unset'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{template.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>Rantai: {template.levels.length} Approver</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* WORKFLOW PATH BUILDER */}
        {editingTemplate && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, color: 'var(--text-main)' }}>Workflow Editor: {editingTemplate.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Edit level pendelegasian, hak persetujuan, dan urutan birokrasi.</p>
              </div>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={16} /> Simpan Alur
              </button>
            </div>

            {/* Threshold Configurations */}
            <div style={{ margin: '20px 0', padding: 14, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <DollarSign size={16} color="var(--warning)" /> Aturan Kondisional (Threshold Threshold)
              </span>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: 12 }}>
                  Nilai Nominal Minimum untuk Mengaktifkan Level Akhir (Rupiah)
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input
                    type="number"
                    className="input"
                    style={{ maxWidth: '240px' }}
                    value={editingTemplate.condition_threshold_value || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, condition_threshold_value: Number(e.target.value) || undefined })}
                    placeholder="e.g. 50000000 (Tanpa batasan jika kosong)"
                  />
                  {editingTemplate.condition_threshold_value && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      (= {formatRupiah(editingTemplate.condition_threshold_value)})
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  * Jika diisi, level approval terakhir (CEO) hanya akan dipicu apabila nilai dokumen melampaui angka ini.
                </p>
              </div>
            </div>

            {/* Path visual representation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Alur Rantai Persetujuan (Berurutan):</span>

              {editingTemplate.levels.map((level, index) => {
                return (
                  <div
                    key={level.level}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: 16,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)'
                    }}
                  >
                    {/* Level marker */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14
                      }}
                    >
                      {level.level}
                    </div>

                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      {/* Name / Role Config */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Label Jabatan / Peran</label>
                        <input
                          type="text"
                          className="input"
                          style={{ padding: '6px 10px', fontSize: 13 }}
                          value={level.role || ''}
                          onChange={(e) => handleLevelChange(index, { role: e.target.value })}
                          placeholder="e.g. Finance Manager"
                        />
                      </div>
                      
                      {/* User Specific Config */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>User Penerima Otorisasi</label>
                        <select
                          className="select"
                          style={{ padding: '6px 10px', fontSize: 13 }}
                          value={level.user_id || ''}
                          onChange={(e) => handleLevelChange(index, { user_id: e.target.value })}
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Trash Delete button */}
                    {editingTemplate.levels.length > 1 && (
                      <button
                        className="btn btn-secondary"
                        style={{ minHeight: 36, padding: '4px 10px', alignSelf: 'flex-end', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'transparent' }}
                        onClick={() => handleRemoveLevel(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                className="btn btn-secondary"
                style={{ width: '100%', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--border)' }}
                onClick={handleAddLevel}
              >
                <Plus size={16} /> Tambah Level Approval
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
