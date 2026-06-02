import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { verifyToken } from '../utils/crypto';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck2,
  Calendar,
  Lock
} from 'lucide-react';

export const VerificationPortalView: React.FC = () => {
  const { documents, users, auditLogs } = useApp();
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any | null>(null);

  // Check URL parameter for automated loading (e.g. mock scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || params.get('verify');
    if (tokenParam) {
      setTokenInput(tokenParam);
      runVerification(tokenParam);
    }
  }, []);

  const runVerification = (tokenStr: string) => {
    if (!tokenStr) return;
    
    // 1. Verify token signature integrity
    const { isValid, docId } = verifyToken(tokenStr);
    
    if (!isValid || !docId) {
      setResult({
        status: 'NOT_FOUND',
        title: 'Dokumen Tidak Ditemukan',
        message: 'Tanda tangan digital tidak valid atau tidak cocok dengan dokumen terdaftar di server.'
      });
      return;
    }

    // 2. Lookup document in database
    const doc = documents.find(d => d.id === docId);
    if (!doc) {
      setResult({
        status: 'NOT_FOUND',
        title: 'Dokumen Tidak Terdaftar',
        message: 'Tanda tangan digital benar, namun referensi data dokumen tidak ditemukan di server.'
      });
      return;
    }

    // 3. Formulate status info
    const creatorUser = users.find(u => u.id === doc.created_by);
    const finalApproval = doc.approval_history.filter(h => h.action === 'approve').pop();

    setResult({
      status: doc.status,
      doc_type: doc.doc_type.toUpperCase(),
      doc_number: doc.doc_number,
      title: doc.title,
      created_by: creatorUser?.name || doc.created_by_name,
      created_at: new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      approved_at: doc.approved_at ? new Date(doc.approved_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
      approver_name: finalApproval?.user_name || 'Direktur Keuangan',
      revoked_at: doc.revoked_at ? new Date(doc.revoked_at).toLocaleDateString('id-ID') : '-',
      revoked_reason: doc.revoked_reason || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerification(tokenInput.trim());
  };

  return (
    <div className="main-content" style={{ maxWidth: '750px', margin: '0 auto' }}>
      {/* BRAND HEADER */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24 }}>
        <div style={{ padding: 12, backgroundColor: 'var(--primary-light)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
          <ShieldCheck size={32} color="var(--primary)" />
        </div>
        <h1 style={{ fontSize: '26px', color: 'var(--text-main)' }}>Portal Verifikasi Keaslian Dokumen</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '500px' }}>
          Pihak eksternal dapat melakukan pemindaian QR Code dokumen atau memasukkan kode signature token 32 karakter di bawah untuk membuktikan keaslian dokumen resmi Domus Somnia.
        </p>
      </div>

      {/* SEARCH FIELD */}
      <div className="card" style={{ marginTop: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Masukkan Signature Token Dokumen (e.g. uuid_signature)..."
              className="input"
              style={{ paddingLeft: '36px' }}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
            Verifikasi
          </button>
        </form>
      </div>

      {/* VERIFICATION REPORT PANEL */}
      {result && (
        <div className="card" style={{ marginTop: 24, border: '2px solid var(--border)' }}>
          {/* Status VALID */}
          {result.status === 'APPROVED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--success)', padding: 14, backgroundColor: 'var(--success-light)', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircle size={28} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>✅ DOKUMEN VALID & ASLI</h3>
                  <p style={{ fontSize: 12, opacity: 0.9 }}>Terdaftar secara sah di server PT Domus Somnia Indonesia.</p>
                </div>
              </div>

              {/* Data parameters list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>TIPE DOKUMEN:</span>
                  <span style={{ fontWeight: 700 }}>{result.doc_type}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>NOMOR DOKUMEN:</span>
                  <span style={{ fontWeight: 700 }}>{result.doc_number}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>NAMA DOKUMEN:</span>
                  <span>{result.title}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>DITERBITKAN OLEH:</span>
                  <span>{result.created_by}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>TANGGAL PENERBITAN:</span>
                  <span>{result.created_at}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>DISETUJUI PADA:</span>
                  <span>{result.approved_at} WIB</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>APPROVER FINAL:</span>
                  <span>{result.approver_name}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <Lock size={14} />
                <span>Verifikasi dilindungi oleh Kriptografi Digital Tanda Tangan Server (Signature Verified).</span>
              </div>
            </div>
          )}

          {/* Status REVOKED */}
          {result.status === 'REVOKED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--danger)', padding: 14, backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-sm)' }}>
                <XCircle size={28} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>❌ DOKUMEN TIDAK BERLAKU (REVOKED)</h3>
                  <p style={{ fontSize: 12, opacity: 0.9 }}>Keabsahan dokumen ini telah dicabut oleh manajemen perusahaan.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>TIPE DOKUMEN:</span>
                  <span style={{ fontWeight: 700 }}>{result.doc_type}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>NOMOR DOKUMEN:</span>
                  <span style={{ fontWeight: 700 }}>{result.doc_number}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>TANGGAL PENCABUTAN:</span>
                  <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{result.revoked_at}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: 11 }}>ALASAN PENCABUTAN:</span>
                  <span style={{ fontStyle: 'italic', fontWeight: 600 }}>"{result.revoked_reason}"</span>
                </div>
              </div>
            </div>
          )}

          {/* Status NOT_FOUND or DRAFT */}
          {(result.status === 'NOT_FOUND' || result.status === 'DRAFT' || result.status === 'PENDING') && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0' }}>
              <div style={{ padding: 10, backgroundColor: 'var(--warning-light)', borderRadius: '50%', color: 'var(--warning)' }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>{result.title || 'Status Tidak Valid'}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {result.message || 'Dokumen belum diproses atau token tidak valid. Silakan hubungi admin perusahaan jika terjadi kesalahan.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
