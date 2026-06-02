import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  User,
  Clock,
  Send,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OperationsView: React.FC = () => {
  const {
    tasks,
    users,
    addTask,
    updateTaskStatus,
    addTaskComment,
    currentUser
  } = useApp();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  
  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  });

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignee_id) return;

    addTask({
      title: taskForm.title,
      description: taskForm.description,
      assignee_id: taskForm.assignee_id,
      priority: taskForm.priority,
      status: 'open',
      due_date: taskForm.due_date,
      created_by: currentUser.id
    });

    setTaskForm({ title: '', description: '', assignee_id: '', priority: 'medium', due_date: '' });
    setShowTaskModal(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    addTaskComment(selectedTask.id, newComment);
    
    // Refresh selectedTask comments in UI
    const updatedTask = tasks.find(t => t.id === selectedTask.id);
    if (updatedTask) {
      // Temporary manual append for instant display before state syncs
      setSelectedTask({
        ...selectedTask,
        comments: [
          ...selectedTask.comments,
          {
            id: `tc-temp-${Date.now()}`,
            user_id: currentUser.id,
            user_name: currentUser.name,
            content: newComment,
            created_at: new Date().toISOString()
          }
        ]
      });
    }

    setNewComment('');
  };

  // Group tasks by status
  const openTasks = tasks.filter(t => t.status === 'open');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="badge badge-danger">Tinggi</span>;
      case 'medium': return <span className="badge badge-warning">Sedang</span>;
      default: return <span className="badge badge-primary">Rendah</span>;
    }
  };

  return (
    <div className="main-content">
      {/* HEADER TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>Task & Tickets Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Pantau dan kelola tiket operasional harian tim serta penugasan proyek.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          <Plus size={16} /> Buat Tugas Baru
        </button>
      </div>

      {/* THREE-COLUMN STATUS BOARD */}
      <div className="grid-cols-3">
        {/* OPEN COLUMN */}
        <div className="card" style={{ backgroundColor: 'var(--bg)', padding: '16px 20px', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>BELUM DIMULAI (OPEN)</span>
            <span className="badge badge-neutral">{openTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {openTasks.map(task => {
              const assignee = users.find(u => u.id === task.assignee_id);
              return (
                <div key={task.id} className="card interactive" style={{ padding: 14 }} onClick={() => setSelectedTask(task)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {getPriorityBadge(task.priority)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {task.due_date}</span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{task.title}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineBreak: 'anywhere', marginBottom: 12 }}>
                    {task.description.length > 80 ? `${task.description.substring(0, 80)}...` : task.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <User size={12} /> {assignee ? assignee.name.split(' ')[0] : 'Unassigned'}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                      <MessageSquare size={12} /> {task.comments.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* IN PROGRESS COLUMN */}
        <div className="card" style={{ backgroundColor: 'var(--bg)', padding: '16px 20px', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>SEDANG DIKERJAKAN</span>
            <span className="badge badge-warning">{inProgressTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {inProgressTasks.map(task => {
              const assignee = users.find(u => u.id === task.assignee_id);
              return (
                <div key={task.id} className="card interactive" style={{ padding: 14 }} onClick={() => setSelectedTask(task)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {getPriorityBadge(task.priority)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {task.due_date}</span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{task.title}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineBreak: 'anywhere', marginBottom: 12 }}>
                    {task.description.length > 80 ? `${task.description.substring(0, 80)}...` : task.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <User size={12} /> {assignee ? assignee.name.split(' ')[0] : 'Unassigned'}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                      <MessageSquare size={12} /> {task.comments.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DONE COLUMN */}
        <div className="card" style={{ backgroundColor: 'var(--bg)', padding: '16px 20px', minHeight: '500px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '2px solid var(--border)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>SELESAI (DONE)</span>
            <span className="badge badge-success">{doneTasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            {doneTasks.map(task => {
              const assignee = users.find(u => u.id === task.assignee_id);
              return (
                <div key={task.id} className="card interactive" style={{ padding: 14 }} onClick={() => setSelectedTask(task)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    {getPriorityBadge(task.priority)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due: {task.due_date}</span>
                  </div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{task.title}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineBreak: 'anywhere', marginBottom: 12 }}>
                    {task.description.length > 80 ? `${task.description.substring(0, 80)}...` : task.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                      <User size={12} /> {assignee ? assignee.name.split(' ')[0] : 'Unassigned'}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                      <MessageSquare size={12} /> {task.comments.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TASK CREATOR MODAL */}
      {showTaskModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleTaskSubmit}>
            <div className="modal-header">
              <h3 style={{ fontSize: 16 }}>Buat Tugas / Tiket Baru</h3>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Pekerjaan</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Penerima Tugas (Assignee) *</label>
                <select
                  required
                  className="select"
                  value={taskForm.assignee_id}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                >
                  <option value="">-- Pilih Anggota Tim --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Prioritas</label>
                <select
                  className="select"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tenggat Waktu (Due Date)</label>
                <input
                  type="date"
                  className="input"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* TASK DETAIL & COMMENT DRAWER/MODAL */}
      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {getPriorityBadge(selectedTask.priority)}
                <h3 style={{ fontSize: 16 }}>Detail Tugas</h3>
              </div>
              <button type="button" className="btn btn-ghost" style={{ minHeight: 'unset', padding: 4 }} onClick={() => setSelectedTask(null)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Task info details */}
              <div>
                <h2 style={{ fontSize: 20, color: 'var(--text-main)', marginBottom: 8 }}>{selectedTask.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineBreak: 'anywhere' }}>{selectedTask.description || 'Tidak ada deskripsi.'}</p>
              </div>

              {/* Status and assignee metadata */}
              <div className="grid-cols-2" style={{ backgroundColor: 'var(--bg)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status Tugas</label>
                  <select
                    className="select"
                    value={selectedTask.status}
                    onChange={(e) => {
                      updateTaskStatus(selectedTask.id, e.target.value as any);
                      setSelectedTask({ ...selectedTask, status: e.target.value });
                    }}
                  >
                    <option value="open">Belum Dimulai</option>
                    <option value="in_progress">Sedang Dikerjakan</option>
                    <option value="done">Selesai</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due Date</span>
                  <span style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} /> {selectedTask.due_date || '-'}
                  </span>
                </div>
              </div>

              {/* Comments list */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MessageSquare size={16} /> Diskusi ({selectedTask.comments.length})
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '200px', overflowY: 'auto', marginBottom: 14, paddingRight: 4 }}>
                  {selectedTask.comments.map((comment: any) => (
                    <div key={comment.id} style={{ padding: 10, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{comment.user_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {new Date(comment.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, margin: 0 }}>{comment.content}</p>
                    </div>
                  ))}
                  {selectedTask.comments.length === 0 && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                      Belum ada diskusi pada tugas ini. Mulai obrolan di bawah.
                    </p>
                  )}
                </div>

                {/* Add comment form */}
                <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Tulis balasan..."
                    className="input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ width: 44, padding: 0 }}>
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
