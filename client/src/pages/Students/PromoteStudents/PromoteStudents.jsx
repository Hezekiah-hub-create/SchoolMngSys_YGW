import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import RoleBasedSidebar from '../../../components/layout/RoleBasedSidebar';
import TopNav from '../../../components/layout/TopNav';

const PromoteStudents = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeMenu, setActiveMenu] = useState('Students');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const gradeOptions = ['KG 1', 'KG 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'JHS 1', 'JHS 2', 'JHS 3'];


  const getNextGrade = (currentGrade) => {
    const currentIndex = gradeOptions.indexOf(currentGrade);
    if (currentIndex === -1 || currentIndex === gradeOptions.length - 1) return currentGrade;
    return gradeOptions[currentIndex + 1];
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll({ page, limit });
      const allStudents = response?.data?.data || response?.data || [];
      const pagination = response?.data?.pagination || {};
      
      setStudents(allStudents);
      setTotalPages(pagination.pages || 1);
      setTotalStudents(pagination.total || allStudents.length);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleLogout = async () => { try { await logout(); } finally { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); sessionStorage.removeItem('authToken'); navigate('/login'); } };

  const handlePromote = async (studentId, newGrade) => {
    setPromoting(studentId);
    setError('');
    setSuccess('');
    try {
      await studentAPI.update(studentId, { grade: newGrade });
      setSuccess(`Student promoted to ${newGrade} successfully!`);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote student');
    } finally {
      setPromoting(null);
    }
  };

  const handlePromoteAll = async () => {
    if (!window.confirm(`Promote all ${totalStudents} students in the system to next class?`)) return;
    setLoading(true);
    setError('');
    setSuccess('');
    let promoted = 0;
    try {
      // Fetch ALL students for promotion (ignoring pagination)
      const response = await studentAPI.getAll({ limit: 10000 });
      const allStudents = response?.data?.data || response?.data || [];
      
      for (const student of allStudents) {
        const newGrade = getNextGrade(student.grade);
        if (newGrade !== student.grade) {
          try {
            await studentAPI.update(student.id || student._id, { grade: newGrade });
            promoted++;
          } catch (err) {
            console.error(`Error promoting ${student.firstName}:`, err);
          }
        }
      }
      setSuccess(`Successfully promoted ${promoted} students!`);
      fetchStudents();
    } catch (err) {
      setError('Failed to fetch full student list for promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <RoleBasedSidebar user={user} onLogout={handleLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1 }}>
        <TopNav user={user} onLogout={handleLogout} />
        <div style={{ padding: '100px 40px 40px 40px' }}>
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Promote Students</h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginTop: '0', fontWeight: '500' }}>Promote students to next class/academic year</p>
            </div>
            <button 
              onClick={handlePromoteAll} 
              disabled={loading || totalStudents === 0} 
              style={{ padding: '12px 24px', backgroundColor: loading ? '#ccc' : '#00843e', border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', color: 'white', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 15px rgba(0, 132, 62, 0.3)' }}
            >
              Promote All Students
            </button>
          </div>

          {success && <div style={{ padding: '16px 20px', backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '14px', marginBottom: '24px', color: '#166534', fontSize: '14px', fontWeight: '500' }}>{success}</div>}
          {error && <div style={{ padding: '16px 20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '14px', marginBottom: '24px', color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>{error}</div>}

          <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,1)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>All Students ({totalStudents})</h2>
            </div>
            <div style={{ padding: '24px' }}>
              {loading && students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading students...</div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No students found</div>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Student Name</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Admission No.</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Current Class</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Promote To</th>
                        <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const studentId = student.id || student._id;
                        const nextGrade = getNextGrade(student.grade);
                        return (
                          <tr key={studentId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>{student.firstName} {student.lastName}</td>
                            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{student.admissionNumber || 'N/A'}</td>
                            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#64748b' }}>{student.grade || 'Not assigned'}</td>
                            <td style={{ padding: '14px 8px', fontSize: '13px', color: '#00843e', fontWeight: '500' }}>{nextGrade}</td>
                            <td style={{ padding: '14px 8px' }}>
                              <button 
                                onClick={() => handlePromote(studentId, nextGrade)} 
                                disabled={promoting === studentId} 
                                style={{ padding: '6px 12px', backgroundColor: promoting === studentId ? '#ccc' : '#00843e', border: 'none', borderRadius: '6px', cursor: promoting === studentId ? 'not-allowed' : 'pointer', fontSize: '12px', color: 'white' }}
                              >
                                {promoting === studentId ? 'Promoting...' : 'Promote'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  {!loading && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '0 8px' }}>
                      <p style={{ fontSize: '14px', color: '#64748b' }}>
                        Showing <span style={{ fontWeight: '600', color: '#1e293b' }}>{(page - 1) * limit + 1}</span> to <span style={{ fontWeight: '600', color: '#1e293b' }}>{Math.min(page * limit, totalStudents)}</span> of <span style={{ fontWeight: '600', color: '#1e293b' }}>{totalStudents}</span> students
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: page === 1 ? '#cbd5e1' : '#64748b',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => {
                          const p = i + 1;
                          if (totalPages > 5 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                            if (Math.abs(p - page) === 3) return <span key={p} style={{ padding: '10px' }}>...</span>;
                            return null;
                          }
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: page === p ? '#00843e' : 'white',
                                border: '1px solid',
                                borderColor: page === p ? '#00843e' : '#e2e8f0',
                                borderRadius: '12px',
                                color: page === p ? 'white' : '#64748b',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {p}
                            </button>
                          );
                        })}
                        <button
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            color: page === totalPages ? '#cbd5e1' : '#64748b',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoteStudents;
