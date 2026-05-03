import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import TopNav from '../../components/layout/TopNav';
import PremiumSelect from '../../components/common/PremiumSelect';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import { 
  Users, 
  FileText, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Layers,
  GraduationCap,
  Award,
  Clock,
  Printer,
  ChevronRight,
  Globe,
  BarChart3,
  Zap
} from "lucide-react";
import { 
  studentAPI, 
  reportAPI, 
  settingsAPI, 
  academicSectionsAPI,
  academicClassesAPI 
} from '../../services/api';
import RLogo from '../../assets/R.png';
import UbsLogo from '../../assets/UBS.png';
import './Reports.css';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Reports');
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [reportType, setReportType] = useState('Academic Report'); // Academic Report or Mid-Term
  const [operationalScope, setOperationalScope] = useState('Individual');
  const [reportMonth, setReportMonth] = useState('FEBRUARY');
  const [vacationDate, setVacationDate] = useState('');
  const [resumptionDate, setResumptionDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState(null);
  const reportRef = useRef();

  const [selectedTerm, setSelectedTerm] = useState('First Term');
  const [selectedYear, setSelectedYear] = useState('2024/2025');
  const [searchTerm, setSearchTerm] = useState('');

  const isGradeMatch = (g1, g2) => {
    if (!g1 || !g2) return false;
    const clean = (s) => String(s).toLowerCase().replace(/basic|primary|kindergarten|kg/g, '').trim();
    return clean(g1) === clean(g2);
  };

  const filteredSections = sections.filter(s => isGradeMatch(s.grade, selectedGrade));
  
  const filteredStudents = students.filter(s => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const adm = (s.admissionNumber || '').toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || adm.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchInfrastructure();
  }, []);

  useEffect(() => {
    if (selectedSection) {
      fetchStudents(selectedSection);
    } else {
      setStudents([]);
    }
  }, [selectedSection]);

  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const fetchInfrastructure = async () => {
    try {
      const [secRes, classRes] = await Promise.all([
        academicSectionsAPI.getAll(),
        academicClassesAPI.getAll()
      ]);
      
      const secData = secRes.data?.data || secRes.data || [];
      const classData = classRes.data?.data || classRes.data || [];
      
      setSections(Array.isArray(secData) ? secData : []);
      setGrades(Array.isArray(classData) ? classData : []);
      
      if (classData.length > 0 && !selectedGrade) {
        setSelectedGrade(classData[0].name);
      }
    } catch (error) {
      console.error('Reports: Infrastructure fetch failure:', error);
    }
  };

  const fetchStudents = async (sectionId) => {
    if (!sectionId || !selectedGrade) return;
    
    setIsLoadingStudents(true);
    try {
      const sectionObj = sections.find(s => s.id === sectionId);
      const sectionName = sectionObj ? sectionObj.name : '';
      
      const response = await studentAPI.getAll({ 
        grade: selectedGrade, 
        section: sectionName,
        limit: 'none'
      });
      
      const data = response.data?.data || response.data || [];
      setStudents(Array.isArray(data) ? data : []);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Reports: Student fetch failure:', error);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const generateSynthesis = async () => {
    if (operationalScope === 'Individual' && selectedStudents.length === 0) {
      alert('Please select at least one scholar node for synthesis.');
      return;
    }

    setGenerating(true);
    setGeneratedReports(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      let reports = [];
      const commonParams = {
        reportType: reportType === 'Mid-Term' ? 'mid-term' : 'terminal',
        term: selectedTerm,
        academicYear: selectedYear,
        month: reportMonth,
        vacationDate,
        resumptionDate
      };

      if (operationalScope === 'Individual') {
        for (const studentId of selectedStudents) {
          try {
            const res = await reportAPI.getStudentReport(studentId, commonParams);
            if (res.data?.success) {
              reports.push({
                ...res.data.data,
                ...commonParams,
                type: reportType
              });
            }
          } catch (e) {
            console.error(`Error fetching report for student ${studentId}:`, e);
          }
        }
      } else {
        const sectionObj = sections.find(s => s.id === selectedSection);
        const sectionName = sectionObj ? sectionObj.name : '';
        
        const res = await reportAPI.getClassReport(selectedGrade, {
          ...commonParams,
          section: sectionName
        });
        if (res.data?.success) {
          const rawReports = res.data.data.reports || res.data.data || [];
          reports = rawReports.map(r => ({
            ...r,
            ...commonParams,
            type: reportType
          }));
        }
      }
      
      if (reports.length === 0) {
        alert('No data found for the selected parameters.');
      } else {
        setGeneratedReports(reports);
      }
    } catch (error) {
      console.error('Synthesis Failure:', error);
      alert('Academic synthesis failed. Please check node connectivity.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    
    // Using simple approach first - jspdf + html2canvas
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Academic_Report_${new Date().getTime()}.pdf`);
  };

  const handleGradeChange = (val) => {
    setSelectedGrade(val);
    setSelectedSection('');
    setStudents([]);
  };

  const gradeOptions = grades.map(g => ({ 
    value: g.name, 
    label: g.name.replace(/Primary|Basic/i, 'Basic') 
  }));
  const sectionOptions = filteredSections.map(s => ({ value: s.id, label: s.name }));
  const monthOptions = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ].map(m => ({ value: m, label: m }));

  const termOptions = [
    { value: 'First Term', label: 'First Term' },
    { value: 'Second Term', label: 'Second Term' },
    { value: 'Third Term', label: 'Third Term' }
  ];

  const yearOptions = [
    { value: '2023/2024', label: '2023/2024' },
    { value: '2024/2025', label: '2024/2025' },
    { value: '2025/2026', label: '2025/2026' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--slate-50)' }}>
      <RoleBasedSidebar user={user} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ marginLeft: '260px', flex: 1, position: 'relative' }}>
        <TopNav user={user} />
        <div className="reports-container" style={{ paddingTop: '100px' }}>
          <div className="reports-main">
            <header className="reports-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ padding: '6px 14px', backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)', borderRadius: '30px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.2px', border: '1px solid rgba(0,132,62,0.1)' }}>
                  <Zap size={12} style={{ display: 'inline', marginRight: '6px', marginBottom: '2px' }} />
                  Intelligence Workspace
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <h1 style={{ fontSize: '42px', fontWeight: '950', color: 'var(--slate-900)', margin: 0, letterSpacing: '-2px' }}>
                    Academic <span style={{ color: 'var(--brand-green)' }}>Synthesis</span>
                  </h1>
                  <p style={{ fontSize: '17px', color: 'var(--slate-500)', marginTop: '8px', fontWeight: '500' }}>
                    Compile performance vectors and generate high-fidelity reports.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <button className="premium-btn-secondary" onClick={() => fetchInfrastructure()}>
                    <RefreshCw size={18} /> Sync Engine
                  </button>
                  <button className="premium-btn-secondary" onClick={downloadPDF} disabled={!generatedReports}>
                    <Download size={18} /> Download PDF
                  </button>
                  <button className="premium-btn-primary" onClick={handlePrint} disabled={!generatedReports}>
                    <Printer size={18} /> Print Records
                  </button>
                </div>
              </div>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)' }}>
                  <Users size={22} />
                </div>
                <div>
                  <span className="premium-label" style={{ marginBottom: '4px' }}>Scholars In View</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--slate-900)' }}>{students.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--brand-blue-soft)', color: 'var(--brand-blue)' }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span className="premium-label" style={{ marginBottom: '4px' }}>Selected Nodes</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--slate-900)' }}>{selectedStudents.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'var(--brand-yellow-soft)', color: 'var(--brand-yellow)' }}>
                  <BarChart3 size={22} />
                </div>
                <div>
                  <span className="premium-label" style={{ marginBottom: '4px' }}>Batch Status</span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--slate-900)' }}>Ready</span>
                </div>
              </div>
            </div>

            <div className="reports-grid">
              <aside className="intelligence-matrix">
                <div className="glass-card">
                  <header style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: 'var(--slate-900)' }}>
                      <Layers size={20} color="var(--brand-green)" /> Configuration
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)', margin: '4px 0 0 0', fontWeight: '600' }}>Define synthesis parameters.</p>
                  </header>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="premium-label">Academic Year</label>
                        <PremiumSelect 
                          value={selectedYear} 
                          options={yearOptions} 
                          placeholder="Year"
                          onChange={(e) => setSelectedYear(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="premium-label">Term</label>
                        <PremiumSelect 
                          value={selectedTerm} 
                          options={termOptions} 
                          placeholder="Term"
                          onChange={(e) => setSelectedTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="premium-label">Scope</label>
                        <div className="type-btn-grid" style={{ gridTemplateColumns: '1fr' }}>
                          <button 
                            className={`type-btn-nexus ${operationalScope === 'Individual' ? 'active' : ''}`}
                            onClick={() => setOperationalScope('Individual')}
                          >Individual</button>
                          <button 
                            className={`type-btn-nexus ${operationalScope === 'Cohort-Wide' ? 'active' : ''}`}
                            onClick={() => setOperationalScope('Cohort-Wide')}
                          >Cohort</button>
                        </div>
                      </div>
                      <div>
                        <label className="premium-label">Module</label>
                        <div className="type-btn-grid" style={{ gridTemplateColumns: '1fr' }}>
                          <button 
                            className={`type-btn-nexus ${reportType === 'Academic Report' ? 'active' : ''}`}
                            onClick={() => setReportType('Academic Report')}
                          >Terminal</button>
                          <button 
                            className={`type-btn-nexus ${reportType === 'Mid-Term' ? 'active' : ''}`}
                            onClick={() => setReportType('Mid-Term')}
                          >Mid-Term</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                      <div>
                        <label className="premium-label">Target Grade</label>
                        <PremiumSelect 
                          value={selectedGrade} 
                          options={gradeOptions} 
                          placeholder="Grade"
                          onChange={(e) => handleGradeChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="premium-label">Section</label>
                        <PremiumSelect 
                          value={selectedSection} 
                          options={sectionOptions} 
                          placeholder="Section"
                          disabled={!selectedGrade}
                          onChange={(e) => setSelectedSection(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1.5px solid var(--slate-100)' }}>
                      <label className="premium-label" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} color="var(--brand-green)" /> Temporal Vector
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {reportType === 'Mid-Term' ? (
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--slate-500)', display: 'block', marginBottom: '8px' }}>REPORT MONTH</span>
                            <PremiumSelect 
                              value={reportMonth} 
                              options={monthOptions} 
                              placeholder="Month"
                              onChange={(e) => setReportMonth(e.target.value)}
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--slate-500)', display: 'block', marginBottom: '8px' }}>VACATION DATE</span>
                              <PremiumDatePicker 
                                value={vacationDate} 
                                onChange={(val) => setVacationDate(val)} 
                                placeholder="Select Date"
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--slate-500)', display: 'block', marginBottom: '8px' }}>NEXT TERM BEGINS</span>
                              <PremiumDatePicker 
                                value={resumptionDate} 
                                onChange={(val) => setResumptionDate(val)} 
                                placeholder="Select Date"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button 
                      className="premium-btn-primary" 
                      style={{ width: '100%', padding: '18px' }}
                      onClick={generateSynthesis}
                      disabled={generating}
                    >
                      {generating ? 'Compiling Nodes...' : 'Execute Synthesis'}
                    </button>
                  </div>
                </div>

                {operationalScope === 'Individual' && students.length > 0 && (
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span className="premium-label" style={{ margin: 0 }}>Scholar Hub</span>
                      <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontWeight: '800', fontSize: '10px', cursor: 'pointer', letterSpacing: '0.5px' }}>
                        {selectedStudents.length === filteredStudents.length ? 'DESELECT ALL' : 'SELECT ALL'}
                      </button>
                    </div>

                    <div className="scholar-search-box">
                      <Search className="search-icon-overlay" size={16} />
                      <input 
                        type="text" 
                        className="scholar-search-input" 
                        placeholder="Search scholars..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="scholar-grid-container scrollbar-hide" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div 
                          key={student.id} 
                          className={`scholar-node-item ${selectedStudents.includes(student.id) ? 'active' : ''}`}
                          onClick={() => handleStudentSelect(student.id)}
                        >
                          <div className="selection-indicator">
                            {selectedStudents.includes(student.id) && <CheckCircle2 size={12} color="white" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--slate-900)' }}>{student.firstName} {student.lastName}</div>
                            <div style={{ fontSize: '10px', color: 'var(--slate-500)', fontWeight: '600' }}>{student.admissionNumber || 'SCH-NODE'}</div>
                          </div>
                        </div>
                      )) : (
                        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '12px', fontWeight: '600' }}>
                          No scholars matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>

              <section className="preview-area">
                {!generating && !generatedReports && (
                  <div className="empty-workspace">
                    <div style={{ background: 'var(--brand-green-soft)', color: 'var(--brand-green)', padding: '40px', borderRadius: '40px', marginBottom: '32px' }}>
                      <GraduationCap size={72} />
                    </div>
                    <h2 style={{ fontSize: '36px', fontWeight: '950', letterSpacing: '-2px', color: 'var(--slate-900)', margin: '0 0 16px 0' }}>Workspace <span style={{ color: 'var(--brand-green)' }}>Active</span></h2>
                    <p style={{ maxWidth: '450px', color: 'var(--slate-500)', fontWeight: '600', lineHeight: '1.7', textAlign: 'center', fontSize: '16px' }}>
                      Configure the Synthesis Matrix and select scholar nodes to generate high-impact academic records.
                    </p>
                  </div>
                )}

                {generating && (
                  <div className="synthesis-loader">
                    <div className="pulse-ring"></div>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ color: 'var(--brand-green)', fontWeight: '950', fontSize: '32px', marginBottom: '12px', letterSpacing: '-1px' }}>Synthesizing Intelligence</h2>
                      <p style={{ color: 'var(--slate-500)', fontWeight: '600', fontSize: '16px' }}>Consolidating performance metrics and terminal vectors...</p>
                    </div>
                  </div>
                )}

                {generatedReports && !generating && (
                  <div className="report-card-container" ref={reportRef}>
                    {operationalScope === 'Cohort-Wide' ? (
                      <CohortSummaryTemplate reports={generatedReports} filters={{
                        grade: selectedGrade,
                        section: sections.find(s => s.id === selectedSection)?.name,
                        year: selectedYear,
                        term: selectedTerm,
                        type: reportType
                      }} />
                    ) : (
                      generatedReports.map((report, idx) => (
                        <ReportTemplate key={idx} data={report} />
                      ))
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const ReportTemplate = ({ data }) => {
  const isMidTerm = data.type === 'Mid-Term';
  
  const allSubjects = [...(data.subjects || []), ...(data.electives || [])];
  const core = allSubjects.filter(s => s.category === 'CORE');
  const electives = allSubjects.filter(s => s.category === 'ELECTIVE');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  return (
    <div className="report-card report-card-premium" style={{ border: '2px solid #00843e' }}>
      <div className="report-frame-inner" style={{ border: '1px solid #facc15', backgroundColor: '#ffffff' }}>
        {/* Decorative accents */}
        <div className="report-corner corner-tl" style={{ width: '20px', height: '20px', borderLeft: '3px solid #00843e', borderTop: '3px solid #00843e' }}></div>
        <div className="report-corner corner-tr" style={{ width: '20px', height: '20px', borderRight: '3px solid #00843e', borderTop: '3px solid #00843e', right: 0 }}></div>
        <div className="report-corner corner-bl" style={{ width: '20px', height: '20px', borderLeft: '3px solid #00843e', borderBottom: '3px solid #00843e', bottom: 0 }}></div>
        <div className="report-corner corner-br" style={{ width: '20px', height: '20px', borderRight: '3px solid #00843e', borderBottom: '3px solid #00843e', bottom: 0, right: 0 }}></div>

        <img src={UbsLogo} alt="Watermark" className="report-watermark" style={{ opacity: 0.03 }} />
        
        <div className="report-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {/* Advanced Institutional Header - Compacted */}
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '8px' }}>
              <img src={RLogo} alt="Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '1000', color: '#005a2b', margin: 0, letterSpacing: '1px', whiteSpace: 'nowrap' }}>UHAS BASIC SCHOOL</h1>
                <div style={{ fontSize: '15px', fontWeight: '900', color: '#005a2b', marginTop: '1px' }}>
                  {isMidTerm ? 'SPECIAL MID-TERM REPORT' : 'ACADEMIC REPORT'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#005a2b', textTransform: 'uppercase' }}>
                  {isMidTerm ? `${data.month || 'FEBRUARY'}, ${data.year}` : `${data.term}, ${data.year}`}
                </div>
              </div>
              <img src={UbsLogo} alt="UBS Logo" style={{ width: '75px', height: '75px', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Premium Metadata Grid - Compacted */}
          <div style={{ padding: '0 5mm', marginBottom: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #00843e', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>NAME</div>
                <div style={{ fontSize: '11px', fontWeight: '950', color: 'black' }}>{data.studentName?.toUpperCase()}</div>
              </div>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #facc15', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>BASIC / SECTION</div>
                <div style={{ fontSize: '11px', fontWeight: '950', color: 'black' }}>{data.class?.toUpperCase().replace('BASIC', '').replace('PRIMARY', '').trim()} - {data.section}</div>
              </div>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #00843e', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>ROLL NO.</div>
                <div style={{ fontSize: '11px', fontWeight: '950', color: 'black' }}>{data.admissionNumber}</div>
              </div>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #facc15', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>TERM / YEAR</div>
                <div style={{ fontSize: '11px', fontWeight: '950', color: 'black' }}>{data.term} | {data.year}</div>
              </div>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #00843e', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>AGGREGATE</div>
                <div style={{ fontSize: '12px', fontWeight: '1000', color: '#00843e' }}>{data.aggregate}</div>
              </div>
              <div style={{ padding: '6px 10px', borderLeft: '3px solid #facc15', background: '#f8fafc', borderRadius: '4px' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '800', marginBottom: '1px' }}>POSITION</div>
                <div style={{ fontSize: '12px', fontWeight: '1000', color: '#00843e' }}>{data.classPosition}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: '800' }}>ROLL: <span style={{ color: '#00843e' }}>{data.numberOnRoll || '--'}</span></div>
              <div style={{ fontSize: '9px', fontWeight: '800' }}>DATE: <span style={{ color: '#00843e' }}>{new Date().toLocaleDateString('en-GB')}</span></div>
              {!isMidTerm && (
                <div style={{ fontSize: '9px', fontWeight: '800' }}>VACATION: <span style={{ color: '#00843e' }}>{formatDate(data.vacationDate)}</span></div>
              )}
            </div>
          </div>

          {/* Advanced Subjects Table - Compacted */}
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#005a2b', letterSpacing: '2px', marginBottom: '25px', textAlign: 'center' }}>ACADEMIC PERFORMANCE EVALUATION</div>
          <table className="report-table" style={{ 
            border: '3px solid #005a2b', 
            borderCollapse: 'separate', 
            borderSpacing: 0, 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 90, 43, 0.12)'
          }}>
            <thead>
              <tr className="table-header-advanced" style={{ background: 'linear-gradient(to bottom, #facc15, #f59e0b)' }}>
                <th style={{ width: '25%', textAlign: 'left', padding: '8px 12px', fontSize: '11px', borderBottom: '2px solid #005a2b' }}>SUBJECTS</th>
                {!isMidTerm && <th style={{ width: '10%', textAlign: 'center', padding: '8px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>CLASS SCORE [50]</th>}
                <th style={{ width: '10%', textAlign: 'center', padding: '8px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>EXAM SCORE [{isMidTerm ? '100' : '50'}]</th>
                {!isMidTerm && <th style={{ width: '10%', textAlign: 'center', padding: '8px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>TOTAL SCORE [100]</th>}
                <th style={{ width: '10%', textAlign: 'center', padding: '8px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>SUBJ. POS.</th>
                <th style={{ width: '8%', textAlign: 'center', padding: '8px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>GRADE</th>
                <th style={{ width: '22%', textAlign: 'left', padding: '8px 12px', fontSize: '10px', borderBottom: '2px solid #005a2b' }}>INTERPRETATION</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'rgba(0, 90, 43, 0.05)', color: '#005a2b' }}>
                <td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontWeight: '1000', fontSize: '13px', padding: '10px', borderBottom: '2px solid #005a2b', letterSpacing: '2px' }}>CORE CURRICULUM</td>
              </tr>
              {core.length > 0 ? core.map((sub, i) => (
                <tr key={`core-${i}`} className={i % 2 === 0 ? 'row-even' : 'row-odd'} style={{ borderBottom: '1px solid rgba(0, 90, 43, 0.1)' }}>
                  <td style={{ fontWeight: '900', color: '#005a2b', padding: '6px 12px', fontSize: '11px' }}>{sub.name.toUpperCase()}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.classScore || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.examScore || '0'}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '950', color: '#005a2b', fontSize: '12px', padding: '6px' }}>{sub.total || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.position || '--'}</td>
                  <td style={{ textAlign: 'center', fontWeight: '950', color: '#005a2b', padding: '6px', fontSize: '12px' }}>{sub.grade || '--'}</td>
                  <td style={{ fontSize: '10px', fontWeight: '700', fontStyle: 'italic', color: '#00843e', padding: '6px 12px' }}>{sub.interpretation?.toUpperCase() || '--'}</td>
                </tr>
              )) : (
                <tr><td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px', color: '#00843e' }}>No core subjects recorded</td></tr>
              )}

              <tr style={{ backgroundColor: 'rgba(0, 90, 43, 0.05)', color: '#005a2b' }}>
                <td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontWeight: '1000', fontSize: '13px', padding: '10px', borderBottom: '2px solid #005a2b', borderTop: '2px solid #005a2b', letterSpacing: '2px' }}>ELECTIVE CURRICULUM</td>
              </tr>
              {electives.length > 0 ? electives.map((sub, i) => (
                <tr key={`elective-${i}`} className={i % 2 === 0 ? 'row-even' : 'row-odd'} style={{ borderBottom: '1px solid rgba(0, 90, 43, 0.1)' }}>
                  <td style={{ fontWeight: '900', color: '#005a2b', padding: '6px 12px', fontSize: '11px' }}>{sub.name.toUpperCase()}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.classScore || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.examScore || '0'}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '950', color: '#005a2b', fontSize: '12px', padding: '6px' }}>{sub.total || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#00843e', padding: '6px', fontSize: '11px' }}>{sub.position || '--'}</td>
                  <td style={{ textAlign: 'center', fontWeight: '950', color: '#005a2b', padding: '6px', fontSize: '12px' }}>{sub.grade || '--'}</td>
                  <td style={{ fontSize: '10px', fontWeight: '700', fontStyle: 'italic', color: '#00843e', padding: '6px 12px' }}>{sub.interpretation?.toUpperCase() || '--'}</td>
                </tr>
              )) : (
                <tr><td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px', color: '#00843e' }}>No elective subjects recorded</td></tr>
              )}

              <tr style={{ fontWeight: '950', backgroundColor: '#eee', color: '#005a2b' }}>
                <td style={{ color: '#005a2b', padding: '8px 12px', fontSize: '12px' }}>TOTAL SCORE</td>
                <td colSpan={isMidTerm ? 4 : 6} style={{ textAlign: 'right', paddingRight: '30px', fontSize: '14px', fontWeight: '1000' }}>
                  {data.aggregate || data.totalScore || '--'}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '15px' }}>
            <table className="conduct-table" style={{ border: '2px solid #005a2b', borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr style={{ fontSize: '10px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800', width: '40%' }}>ATTENDANCE</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', textAlign: 'center' }}>{data.attendance || '--'}</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800', textAlign: 'center' }}>OUT OF</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', textAlign: 'center' }}>{data.totalDays || '--'}</td>
                </tr>
                {!isMidTerm && (
                  <tr style={{ fontSize: '10px' }}>
                    <td colSpan={2} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>PROMOTED TO</td>
                    <td colSpan={2} style={{ border: '1px solid #005a2b', padding: '4px 8px' }}>{data.promotedTo || '--'}</td>
                  </tr>
                )}
                <tr style={{ fontSize: '10px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>CONDUCT</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px' }}>{data.conduct || 'VERY GOOD'}</td>
                </tr>
                <tr style={{ fontSize: '10px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>ATTITUDE</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px' }}>{data.attitude || 'STUDIOUS AND HARDWORKING'}</td>
                </tr>
                <tr style={{ fontSize: '10px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>INTEREST</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px' }}>{data.interest || 'READING'}</td>
                </tr>
                <tr style={{ fontSize: '10px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>CLASS TEACHER'S REMARKS</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px', height: '30px' }}>{data.teacherRemarks}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '5px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800' }}>
                Class Teacher's Name: <span style={{ borderBottom: '1.2px dotted #000', flex: 1, display: 'inline-block', minWidth: '130px' }}>{data.teacherName || '........................................'}</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '800' }}>
                Class Teacher's signature: <span style={{ borderBottom: '1.2px dotted #000', flex: 1, display: 'inline-block', minWidth: '130px' }}>........................................</span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '800' }}>
                Head of School's Signature: <span style={{ borderBottom: '1.2px dotted #000', flex: 1, display: 'inline-block', minWidth: '130px' }}>........................................</span>
              </div>
              <div className="official-seal" style={{ alignSelf: 'center', width: '60px', height: '60px', fontSize: '6px' }}>
                OFFICIAL SEAL
              </div>
            </div>
          </div>


          {/* Physical Grading Matrix Footer */}
          <div style={{ marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '900', fontSize: '9px', color: '#005a2b', marginBottom: '4px', letterSpacing: '1px' }}>INTERPRETATION OF THE GRADING SYSTEM</div>
              <table className="grading-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1.2px solid #005a2b' }}>
                <tbody>
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: '800', fontSize: '7px', color: '#64748b' }}>
                    <td style={{ border: '1px solid #005a2b' }}>100-90</td>
                    <td style={{ border: '1px solid #005a2b' }}>89-80</td>
                    <td style={{ border: '1px solid #005a2b' }}>79-70</td>
                    <td style={{ border: '1px solid #005a2b' }}>69-60</td>
                    <td style={{ border: '1px solid #005a2b' }}>59-55</td>
                    <td style={{ border: '1px solid #005a2b' }}>54-50</td>
                    <td style={{ border: '1px solid #005a2b' }}>49-40</td>
                    <td style={{ border: '1px solid #005a2b' }}>39-35</td>
                    <td style={{ border: '1px solid #005a2b' }}>34-0</td>
                  </tr>
                  <tr style={{ fontSize: '7px', fontWeight: '800', color: '#005a2b' }}>
                    <td style={{ border: '1px solid #005a2b' }}>Highest</td>
                    <td style={{ border: '1px solid #005a2b' }}>Higher</td>
                    <td style={{ border: '1px solid #005a2b' }}>High</td>
                    <td style={{ border: '1px solid #005a2b' }}>High Average</td>
                    <td style={{ border: '1px solid #005a2b' }}>Average</td>
                    <td style={{ border: '1px solid #005a2b' }}>Lower Average</td>
                    <td style={{ border: '1px solid #005a2b' }}>Low</td>
                    <td style={{ border: '1px solid #005a2b' }}>Lower</td>
                    <td style={{ border: '1px solid #005a2b' }}>Lowest</td>
                  </tr>
                  <tr style={{ fontSize: '8px', fontWeight: '900', color: '#005a2b', backgroundColor: '#f1f5f9' }}>
                    <td style={{ border: '1px solid #005a2b' }}>1</td>
                    <td style={{ border: '1px solid #005a2b' }}>2</td>
                    <td style={{ border: '1px solid #005a2b' }}>3</td>
                    <td style={{ border: '1px solid #005a2b' }}>4</td>
                    <td style={{ border: '1px solid #005a2b' }}>5</td>
                    <td style={{ border: '1px solid #005a2b' }}>6</td>
                    <td style={{ border: '1px solid #005a2b' }}>7</td>
                    <td style={{ border: '1px solid #005a2b' }}>8</td>
                    <td style={{ border: '1px solid #005a2b' }}>9</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px', fontWeight: '950', fontStyle: 'italic', color: '#00843e' }}>
              Learning Today, Leading Tomorrow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const CohortSummaryTemplate = ({ reports, filters }) => {
  if (!reports || reports.length === 0) return null;

  const classAvg = reports.reduce((sum, r) => sum + Number(r.aggregate || 0), 0) / reports.length;
  const topScore = Math.max(...reports.map(r => Number(r.aggregate || 0)));

  return (
    <div className="report-card report-card-premium" style={{ border: '2px solid #00843e', padding: '10mm', height: '297mm', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginBottom: '10px' }}>
            <img src={RLogo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '1000', color: '#00843e', margin: 0, letterSpacing: '1px' }}>UHAS BASIC SCHOOL</h1>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#00843e', marginTop: '2px' }}>
                CLASS PERFORMANCE SUMMARY (BROADSHEET)
              </div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#00843e', textTransform: 'uppercase' }}>
                {filters.grade} - {filters.section ? `SECTION ${filters.section}` : 'ALL SECTIONS'} | {filters.term}, {filters.year}
              </div>
            </div>
            <img src={UbsLogo} alt="UBS Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #00843e' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Students</div>
            <div style={{ fontSize: '20px', fontWeight: '950', color: '#00843e' }}>{reports.length}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Average</div>
            <div style={{ fontSize: '20px', fontWeight: '950', color: '#00843e' }}>{classAvg.toFixed(1)}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Top Score</div>
            <div style={{ fontSize: '20px', fontWeight: '950', color: '#00843e' }}>{topScore}</div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '2px solid #005a2b', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 90, 43, 0.05)' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(to right, #00843e, #005a2b)', color: 'white' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>RANK</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>STUDENT NAME</th>
              {!filters.section && <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>SECTION</th>}
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>AGGREGATE</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>ATTENDANCE</th>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '900', borderBottom: '2px solid #00843e' }}>TEACHER REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {reports.sort((a, b) => (b.aggregate || 0) - (a.aggregate || 0)).map((report, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '800', color: '#00843e' }}>{i + 1}</td>
                <td style={{ padding: '6px 10px', fontSize: '11px', fontWeight: '700' }}>{report.studentName?.toUpperCase()}</td>
                {!filters.section && <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '10px', fontWeight: '800' }}>{report.section || 'A'}</td>}
                <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: '#00843e' }}>{report.aggregate || '--'}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center', fontSize: '10px' }}>{report.attendance} / {report.totalDays}</td>
                <td style={{ padding: '6px 10px', fontSize: '9px', fontStyle: 'italic', color: '#64748b' }}>{report.teacherRemarks?.substring(0, 60)}...</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #000', width: '180px', marginBottom: '5px' }}></div>
            <div style={{ fontSize: '9px', fontWeight: '800' }}>CLASS MASTER / MISTRESS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #000', width: '180px', marginBottom: '5px' }}></div>
            <div style={{ fontSize: '9px', fontWeight: '800' }}>HEAD OF SCHOOL</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
