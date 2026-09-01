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
  ChevronRight,
  Paperclip,
  X
} from 'lucide-react';
import { assignmentAPI, studentAPI, parentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({
    content: '',
    file: null
  });
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [linkedChildren, setLinkedChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [students, setStudents] = useState([]);
  const [gradingData, setGradingData] = useState({});

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  useEffect(() => {
    if (user?.role === 'parent') {
      parentAPI.getMyChildren().then(res => {
        if (res.data?.success && res.data.data?.length > 0) {
          setLinkedChildren(res.data.data);
          const params = new URLSearchParams(window.location.search);
          const urlChildId = params.get('studentId');
          if (urlChildId && res.data.data.some(c => c.id === urlChildId)) {
            setSelectedChildId(urlChildId);
          } else {
            const match = res.data.data.find(c => c.grade === assignment?.grade);
            setSelectedChildId(match ? match.id : res.data.data[0].id);
          }
        }
      }).catch(err => console.error('Error fetching children:', err));
    }
  }, [user, assignment]);

  useEffect(() => {
    if (assignment && user.role === 'teacher') {
      fetchStudents();
    }
  }, [assignment, user]);

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

  const fetchStudents = async () => {
    try {
      // Find all students in this grade/section
      const response = await studentAPI.getAll({ 
        grade: assignment.grade || assignment.class,
        section: assignment.section
      });
      if (response.data.success) {
        setStudents(response.data.data);
        // Initialize grading data from existing submissions
        const initialGrading = {};
        (assignment.submissions || []).forEach(s => {
          initialGrading[s.student] = {
            score: s.score || '',
            feedback: s.feedback || ''
          };
        });
        setGradingData(initialGrading);
      }
    } catch (error) {
      console.error('Error fetching students for grading:', error);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await assignmentAPI.upload(formData);
      if (res.data?.success) {
        setSubmissionFiles(prev => [...prev, {
          url: res.data.data.url,
          filename: res.data.data.filename || file.name,
          mimetype: res.data.data.mimetype || file.type,
          size: res.data.data.size || file.size
        }]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showAlert({
        title: 'Upload Failed',
        message: 'File upload failed. Supported formats: PDF, Word, Images',
        type: 'error'
      });
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submission.content.trim() && submissionFiles.length === 0) {
      showAlert({
        title: 'Submission Incomplete',
        message: 'Please provide your resolution comments or attach evidence/completed work.',
        type: 'warning'
      });
      return;
    }
    setSubmitting(true);
    try {
      await assignmentAPI.submit(id, {
        content: submission.content,
        attachments: submissionFiles,
        studentId: activeStudentId
      });
      setSubmission({ content: '', file: null });
      setSubmissionFiles([]);
      fetchAssignment();
      showAlert({
        title: 'Work Submitted',
        message: 'Your deliverable has been recorded and submitted successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Submission failed:', error);
      showAlert({
        title: 'Submission Error',
        message: error.response?.data?.message || 'Submission failed',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (studentId) => {
    const data = gradingData[studentId];
    if (!data || data.score === '') return;
    
    try {
      const response = await assignmentAPI.grade(id, {
        studentId,
        score: data.score,
        feedback: data.feedback
      });
      if (response.data.success) {
        setAssignment(response.data.data);
        showAlert({
          title: 'Grade Recorded',
          message: 'Grade submitted successfully.',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Grading failed:', error);
      showAlert({
        title: 'Grading Error',
        message: error.response?.data?.message || 'Failed to submit grade.',
        type: 'error'
      });
    }
  };

  const handleGradingChange = (studentId, field, value) => {
    setGradingData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
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
  
  const activeStudentId = user?.role === 'student' 
    ? (user?.studentId || user?.id) 
    : (selectedChildId || linkedChildren[0]?.id);

  // Find current student's submission
  const mySubmission = (user?.role === 'student' || user?.role === 'parent') 
    ? (assignment?.submissions || []).find(s => s.student === activeStudentId || s.student_id === activeStudentId) 
    : null;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
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
                      <div style={{ display: 'inline-block', minWidth: '220px' }}>
                        <PremiumDatePicker 
                          value={editForm.due_date ? new Date(editForm.due_date).toISOString().split('T')[0] : ''}
                          onChange={val => setEditForm({...editForm, due_date: val})}
                          placeholder="Select Deadline"
                        />
                      </div>
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

                {((assignment.attachments && assignment.attachments.length > 0) || assignment.fileUrl) && (
                  <div style={{ marginTop: '40px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Attached Assignment Materials</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[...(assignment.attachments || []), ...(assignment.fileUrl ? [{ url: assignment.fileUrl, filename: 'Supporting Document' }] : [])].map((att, idx) => (
                        <div key={idx} style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--brand-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-green)' }}>
                              <FileText size={24} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{att.filename || att.name || 'Assignment Material'}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{att.mimetype || 'Resource Document'}</p>
                            </div>
                          </div>
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            download={att.filename || 'assignment-material'}
                            className="premium-btn-secondary" 
                            style={{ padding: '10px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                          >
                            <Download size={16} /> Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(user.role === 'student' || user.role === 'parent') && (
                <div className="glass-card" style={{ padding: '48px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Resolution Submission</h3>
                    {user.role === 'parent' && linkedChildren.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Submitting For:</span>
                        <select 
                          value={activeStudentId} 
                          onChange={e => setSelectedChildId(e.target.value)}
                          style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', fontWeight: '800' }}
                        >
                          {linkedChildren.map(c => (
                            <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.grade})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {mySubmission ? (
                    <div style={{ padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '20px', border: '1px solid #bbf7d0', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#166534', marginBottom: '16px' }}>
                        <CheckCircle2 size={24} />
                        <span style={{ fontWeight: '800' }}>Submission Successfully Received</span>
                      </div>
                      <div style={{ fontSize: '15px', color: '#166534', fontWeight: '500', marginBottom: '16px' }}>
                        Submitted on {new Date(mySubmission.submittedAt).toLocaleString()}
                      </div>
                      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #dcfce7', color: '#1e293b', fontSize: '14px', marginBottom: '16px' }}>
                        {mySubmission.content || 'No text content provided.'}
                      </div>
                      {mySubmission.attachments && mySubmission.attachments.length > 0 && (
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>Attached Deliverables:</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {mySubmission.attachments.map((att, aIdx) => (
                              <a 
                                key={aIdx} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                download={att.filename || 'submitted-work'}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}
                              >
                                <Paperclip size={14} /> {att.filename || 'Evidence File'} <Download size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <textarea 
                        placeholder="Enter your resolution details, answers, or comments here..."
                        style={{ width: '100%', minHeight: '180px', padding: '24px', borderRadius: '20px', border: '2px solid #f1f5f9', backgroundColor: '#ffffff', fontSize: '16px', fontWeight: '500', outline: 'none', transition: 'all 0.3s', marginBottom: '20px' }}
                        value={submission.content}
                        onChange={e => setSubmission({...submission, content: e.target.value})}
                      />

                      {submissionFiles.length > 0 && (
                        <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {submissionFiles.map((file, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: '#f1f5f9', borderRadius: '10px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                              <Paperclip size={14} color="var(--brand-green)" />
                              <span>{file.filename}</span>
                              <button 
                                type="button" 
                                onClick={() => setSubmissionFiles(prev => prev.filter((_, i) => i !== fIdx))}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <input 
                        type="file" 
                        id="submission-file-input" 
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileUpload}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('submission-file-input').click()}
                          disabled={uploadingFile}
                          className="premium-btn-secondary" 
                          style={{ padding: '14px 28px' }}
                        >
                          <Upload size={18} /> {uploadingFile ? 'Uploading...' : '+ Attach Completed Work'}
                        </button>
                        <button type="submit" disabled={submitting || uploadingFile} className="premium-btn-primary" style={{ padding: '16px 40px' }}>
                          {submitting ? 'Transmitting...' : 'Commit Submission'}
                        </button>
                      </div>
                    </form>
                  )}

                  {mySubmission && mySubmission.status === 'graded' && (
                    <div style={{ marginTop: '32px', padding: '32px', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', borderRadius: '24px', border: '1px solid #99f6e4' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#134e4a', marginBottom: '20px' }}>Institutional Feedback</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#5eead4', textTransform: 'uppercase' }}>Score</p>
                          <p style={{ margin: 0, fontSize: '32px', fontWeight: '950', color: '#0f766e' }}>{mySubmission.score}<span style={{ fontSize: '16px', opacity: 0.7 }}>/{assignment.max_score || 100}</span></p>
                        </div>
                        <div style={{ flex: 1, paddingLeft: '32px', borderLeft: '2px solid rgba(19, 78, 74, 0.1)' }}>
                          <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#5eead4', textTransform: 'uppercase' }}>Teacher's Remarks</p>
                          <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#134e4a', fontWeight: '600', fontStyle: 'italic' }}>"{mySubmission.feedback || 'No comments provided.'}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user.role === 'teacher' && (
                <div className="glass-card" style={{ padding: '48px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', marginBottom: '32px' }}>Resolution Auditing</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {students.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No students discovered in this cohort node.</p>
                    ) : students.map(student => {
                      const submission = (assignment.submissions || []).find(s => s.student === student.id);
                      const currentGrading = gradingData[student.id] || { score: '', feedback: '' };
                      
                      return (
                        <div key={student.id} style={{ padding: '24px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'var(--brand-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                {student.firstName?.[0] || 'S'}
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>{student.firstName} {student.lastName}</h4>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: submission ? '#059669' : '#94a3b8' }}>
                                  {submission ? `Submitted at ${new Date(submission.submittedAt).toLocaleDateString()}` : 'Pending Submission'}
                                </span>
                              </div>
                            </div>
                            {submission && (
                              <span style={{ padding: '4px 12px', backgroundColor: submission.status === 'graded' ? '#ecfdf5' : '#fff7ed', color: submission.status === 'graded' ? '#10b981' : '#f97316', borderRadius: '12px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                                {submission.status}
                              </span>
                            )}
                          </div>

                          {submission && (
                            <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Submission Content</p>
                              <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', marginBottom: submission.attachments?.length > 0 ? '16px' : '0' }}>{submission.content || 'No text submitted.'}</div>
                              {submission.attachments && submission.attachments.length > 0 && (
                                <div>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '800', color: 'var(--brand-green)', textTransform: 'uppercase' }}>Attached Student Work:</p>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {submission.attachments.map((att, attIdx) => (
                                      <a
                                        key={attIdx}
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.filename || 'student-deliverable'}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}
                                      >
                                        <Paperclip size={14} /> {att.filename || 'Submitted File'} <Download size={12} />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px', gap: '16px', alignItems: 'flex-end' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Award Score</p>
                              <input 
                                type="number" 
                                placeholder={`0-${assignment.max_score || 100}`}
                                value={currentGrading.score}
                                onChange={e => handleGradingChange(student.id, 'score', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px', fontWeight: '700' }}
                              />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Feedback Narrative</p>
                              <input 
                                type="text" 
                                placeholder="Enter qualitative feedback..."
                                value={currentGrading.feedback}
                                onChange={e => handleGradingChange(student.id, 'feedback', e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px', fontWeight: '600' }}
                              />
                            </div>
                            <button 
                              onClick={() => handleGrade(student.id)}
                              disabled={!submission || currentGrading.score === ''}
                              className="premium-btn-primary" 
                              style={{ padding: '12px', borderRadius: '12px', fontSize: '13px' }}
                            >
                              Commit Grade
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
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
