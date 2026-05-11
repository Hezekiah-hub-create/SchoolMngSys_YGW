import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen, 
  Upload, 
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { assignmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({
    content: '',
    file: null
  });

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '' });

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await assignmentAPI.getById(id);
      if (response.data.success) {
        setAssignment(response.data.data);
        setEditForm({
          title: response.data.data.title,
          description: response.data.data.description,
          due_date: response.data.data.due_date || response.data.data.dueDate
        });
      }
    } catch (error) {
      console.error('Error fetching assignment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const response = await assignmentAPI.update(id, editForm);
      if (response.data.success) {
        setAssignment(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update assignment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await assignmentAPI.submit(id, submission);
      fetchAssignment();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="premium-loader"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="glass-card" style={{ padding: '80px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <AlertCircle size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '16px' }}>Task Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '32px' }}>The requested academic deliverable does not exist or has been decommissioned.</p>
        <button onClick={() => navigate('/assignments')} className="premium-btn-primary" style={{ padding: '14px 32px' }}>
          Return to Registry
        </button>
      </div>
    );
  }

  const dueDate = assignment.due_date || assignment.dueDate;
  const createdAt = assignment.created_at || assignment.createdAt;
  const subject = assignment.course_name || assignment.subject || 'Academic Course';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Animated Background Blobs */}
        <div style={{ position: 'fixed', top: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(0, 132, 62, 0.03) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>

        <main style={{ position: 'relative', zIndex: 1 }}>
          <header style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ padding: '4px 12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Task Registry</span>
              <span style={{ color: '#94a3b8' }}><ChevronRight size={12} strokeWidth={3} /></span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Deliverable Overview</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: '32px' }}>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.title} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px', width: '100%', padding: '8px', borderRadius: '12px', border: '2px solid var(--brand-green-light)', outline: 'none' }}
                  />
                ) : (
                  <h1 style={{ fontSize: '42px', fontWeight: '950', color: '#0f172a', margin: 0, letterSpacing: '-2px' }}>
                    {assignment.title}
                  </h1>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>{subject}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                    <Clock size={16} /> 
                    Deadline: {isEditing ? (
                      <input 
                        type="date" 
                        value={editForm.due_date ? new Date(editForm.due_date).toISOString().split('T')[0] : ''}
                        onChange={e => setEditForm({...editForm, due_date: e.target.value})}
                        style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                      />
                    ) : (
                      dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {user.role === 'teacher' && (
                  isEditing ? (
                    <button 
                      onClick={handleUpdate}
                      disabled={submitting}
                      className="premium-btn-primary"
                      style={{ padding: '12px 24px' }}
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="premium-btn-secondary"
                      style={{ padding: '12px 24px' }}
                    >
                      Edit Task
                    </button>
                  )
                )}
                <button 
                  onClick={() => navigate('/assignments')}
                  className="premium-btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  <ArrowLeft size={18} /> Back to Registry
                </button>
              </div>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
            <section>
              <div className="glass-card" style={{ padding: '48px', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '24px' }}>Task Description</h3>
                {isEditing ? (
                  <textarea 
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    style={{ width: '100%', minHeight: '200px', padding: '16px', borderRadius: '12px', border: '2px solid var(--brand-green-light)', fontSize: '16px', outline: 'none' }}
                  />
                ) : (
                  <div style={{ fontSize: '17px', color: '#334155', lineHeight: '1.8', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                    {assignment.description}
                  </div>
                )}

                {assignment.fileUrl && (
                  <div style={{ marginTop: '40px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <FileText size={28} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Supporting Document</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Institutional resource node</p>
                      </div>
                    </div>
                    <button className="premium-btn-secondary" style={{ padding: '12px 24px' }}>
                      <Download size={18} /> Download
                    </button>
                  </div>
                )}
              </div>

              {user.role === 'student' && (
                <div className="glass-card" style={{ padding: '48px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '24px' }}>Resolution Submission</h3>
                  <form onSubmit={handleSubmit}>
                    <textarea 
                      placeholder="Enter your resolution details or comments here..."
                      style={{ width: '100%', minHeight: '200px', padding: '24px', borderRadius: '20px', border: '2px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '16px', fontWeight: '500', outline: 'none', transition: 'all 0.3s', marginBottom: '24px' }}
                      value={submission.content}
                      onChange={e => setSubmission({...submission, content: e.target.value})}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button type="button" className="premium-btn-secondary" style={{ padding: '14px 28px' }}>
                        <Upload size={18} /> Attach Evidence
                      </button>
                      <button type="submit" disabled={submitting} className="premium-btn-primary" style={{ padding: '16px 40px' }}>
                        {submitting ? 'Transmitting...' : 'Commit Submission'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </section>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '32px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px' }}>Task Metadata</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={20} /></div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Course Node</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{subject}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} /></div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Dispatched On</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20} /></div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Priority Tier</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{assignment.priority || 'Normal'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '32px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px' }}>Fidelity Status</h4>
                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Open for Submission</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>Maintain institutional standards.</p>
                </div>
              </div>
            </aside>
          </div>
        </main>
    </div>
  );
};

export default AssignmentDetail;
