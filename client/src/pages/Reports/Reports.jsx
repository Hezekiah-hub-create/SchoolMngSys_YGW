import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PremiumSelect from '../../components/common/PremiumSelect';
import PremiumDatePicker from '../../components/common/PremiumDatePicker';
import { useAlert } from '../../context/AlertContext';
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
  const { showAlert } = useAlert();
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

  const isTeacher = user?.role === 'teacher';


  const isGradeMatch = (g1, g2) => {
    if (!g1 || !g2) return false;
    const normalize = (s) => String(s).toLowerCase()
      .replace(/primary|basic/g, 'basic')
      .replace(/kindergarten|kg/g, 'kg')
      .trim();
    return normalize(g1) === normalize(g2);
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
        let defaultGrade = classData[0].name;
        if (user?.role === 'teacher') {
          const teacherId = user?.id;
          const masteredSectionsList = secData.filter(s => s.class_master_id === teacherId);
          const mastered = masteredSectionsList.length > 0 ? masteredSectionsList : (user?.masteredSections || []);
          const masteredClassIds = mastered.map(m => String(m.class_id));
          const allowed = classData.filter(g => masteredClassIds.includes(String(g.id)));
          if (allowed.length > 0) defaultGrade = allowed[0].name;
        }
        setSelectedGrade(defaultGrade);
      }
    } catch (error) {
      console.error('Reports: Infra fetch failure:', error);
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
      showAlert({
        title: 'Selection Required',
        message: 'Please select at least one scholar node for synthesis.',
        type: 'warning'
      });
      return;
    }

    if (operationalScope === 'Cohort-Wide' && !selectedSection) {
      showAlert({
        title: 'Node Unspecified',
        message: 'Please select a specific section node for cohort-wide synthesis.',
        type: 'warning'
      });
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
          section: sectionName || undefined
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
        showAlert({
          title: 'Empty Dataset',
          message: 'No data found for the selected parameters. Ensure grades and attendance are recorded.',
          type: 'info'
        });
      } else {
        setGeneratedReports(reports);
      }
    } catch (error) {
      console.error('Synthesis Failure:', error);
      showAlert({
        title: 'Synthesis Failed',
        message: 'Academic synthesis failed. Please check node connectivity and database state.',
        type: 'error'
      });
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

  let allowedGrades = grades;
  let allowedSections = filteredSections;

  if (isTeacher) {
    const teacherId = user?.id; // Profile ID
    // Derive mastered sections directly from freshly fetched infrastructure data
    const masteredSectionsList = sections.filter(s => s.class_master_id === teacherId);
    
    // Fallback to AuthContext if needed, though API data is preferred
    const mastered = masteredSectionsList.length > 0 ? masteredSectionsList : (user?.masteredSections || []);
    
    const masteredClassIds = mastered.map(m => String(m.class_id));
    const masteredSectionIds = mastered.map(m => String(m.id));
    
    allowedGrades = grades.filter(g => masteredClassIds.includes(String(g.id)));
    allowedSections = filteredSections.filter(s => masteredSectionIds.includes(String(s.id)));
  }

  const gradeOptions = allowedGrades.map(g => ({ 
    value: g.name, 
    label: g.name.replace(/Primary|Basic/i, 'Basic') 
  }));

  const sectionOptions = allowedSections.map(s => ({ value: s.id, label: s.name }));
  const monthOptions = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ].map(m => ({ value: m, label: m }));

  return (
    <div>
      <div className="reports-container">
          <div className="reports-main">
            <header className="reports-header" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <h1 style={{ 
                      fontSize: '48px', 
                      fontWeight: '1000', 
                      color: 'var(--slate-900)', 
                      letterSpacing: '-2px', 
                      margin: 0,
                      fontFamily: 'Outfit, sans-serif'
                    }}>
                      Academic <span style={{ color: 'var(--brand-green)' }}>Synthesis</span>
                    </h1>
                    <p style={{ color: 'var(--slate-500)', fontWeight: '600', marginTop: '4px' }}>
                      Configure academic vectors and consolidate terminal performance data.
                    </p>
                  </div>
                  
                  {generatedReports && (
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button onClick={handlePrint} className="premium-btn-secondary">
                        <Printer size={20} />
                        Execute Print
                      </button>
                      <button onClick={downloadPDF} className="premium-btn-primary">
                        <Download size={20} />
                        Export PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="stats-grid">
              <div className="stat-item-nexus">
                <div className="stat-icon" style={{ backgroundColor: 'var(--brand-green-soft)', color: 'var(--brand-green)' }}>
                  <Users size={26} />
                </div>
                <div>
                  <span className="stat-label">Active Scholars</span>
                  <div className="stat-value">{students.length}</div>
                </div>
              </div>
              <div className="stat-item-nexus">
                <div className="stat-icon" style={{ backgroundColor: 'var(--brand-yellow-soft)', color: 'var(--brand-yellow)' }}>
                  <Award size={26} />
                </div>
                <div>
                  <span className="stat-label">Selected Nodes</span>
                  <div className="stat-value">{selectedStudents.length}</div>
                </div>
              </div>
              <div className="stat-item-nexus">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <Layers size={26} />
                </div>
                <div>
                  <span className="stat-label">Curriculum Tier</span>
                  <div className="stat-value">{selectedGrade?.split(' ')[1] || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div className="reports-grid">
              <aside className="intelligence-matrix">
                <div className="glass-card" style={{ padding: '28px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h3 className="premium-label">Synthesis Scope</h3>
                    <div className="scope-toggle-nexus">
                      <button 
                        className={`type-btn-nexus ${operationalScope === 'Individual' ? 'active' : ''}`}
                        onClick={() => setOperationalScope('Individual')}
                      >
                        Individual
                      </button>
                      <button 
                        className={`type-btn-nexus ${operationalScope === 'Cohort-Wide' ? 'active' : ''}`}
                        onClick={() => setOperationalScope('Cohort-Wide')}
                      >
                        Cohort-Wide
                      </button>
                    </div>
                  </div>

                  <div className="synthesis-parameters" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <span className="parameter-label">CURRICULUM TIER</span>
                        <PremiumSelect 
                          value={selectedGrade} 
                          onChange={(e) => handleGradeChange(e.target.value)}
                          options={gradeOptions}
                          placeholder="Grade"
                        />
                      </div>
                      <div>
                        <span className="parameter-label">SECTION NODE</span>
                        <PremiumSelect 
                          value={selectedSection} 
                          onChange={(e) => setSelectedSection(e.target.value)}
                          options={sectionOptions}
                          placeholder={operationalScope === 'Cohort-Wide' ? "Select Section (Required)" : "All Sections"}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <span className="parameter-label">ACADEMIC TERM</span>
                        <PremiumSelect 
                          value={selectedTerm} 
                          onChange={(e) => setSelectedTerm(e.target.value)}
                          options={[
                            { value: 'First Term', label: 'First Term' },
                            { value: 'Second Term', label: 'Second Term' },
                            { value: 'Third Term', label: 'Third Term' }
                          ]}
                        />
                      </div>
                      <div>
                        <span className="parameter-label">REPORT TYPE</span>
                        <PremiumSelect 
                          value={reportType} 
                          onChange={(e) => setReportType(e.target.value)}
                          options={[
                            { value: 'Academic Report', label: 'Terminal Report' },
                            { value: 'Mid-Term', label: 'Mid-Term Report' }
                          ]}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'var(--slate-50)', padding: '20px', borderRadius: '20px', border: '1.5px dashed var(--slate-200)' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '900', color: 'var(--slate-900)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={16} style={{ color: 'var(--brand-green)' }} />
                        Temporal Constraints
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {reportType === 'Mid-Term' ? (
                          <div style={{ gridColumn: 'span 2' }}>
                            <span className="parameter-label">TARGET MONTH</span>
                            <PremiumSelect 
                              value={reportMonth} 
                              onChange={(e) => setReportMonth(e.target.value)}
                              options={monthOptions}
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="parameter-label">VACATION DATE</span>
                              <PremiumDatePicker 
                                value={vacationDate} 
                                onChange={(val) => setVacationDate(val)} 
                                placeholder="Select Date"
                              />
                            </div>
                            <div>
                              <span className="parameter-label">NEXT TERM BEGINS</span>
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
                      style={{ width: '100%', padding: '20px', marginTop: '8px' }}
                      onClick={generateSynthesis}
                      disabled={generating}
                    >
                      {generating ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Compiling Data...
                        </>
                      ) : (
                        <>
                          <Zap size={20} />
                          Execute Synthesis
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {operationalScope === 'Individual' && (
                  <div className="glass-card" style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <span className="premium-label" style={{ margin: 0 }}>Scholar Hub</span>
                      {students.length > 0 && (
                        <button onClick={handleSelectAll} style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontWeight: '900', fontSize: '11px', cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    <div className="scholar-search-box">
                      <Search className="search-icon-overlay" size={18} />
                      <input 
                        type="text" 
                        className="scholar-search-input" 
                        placeholder="Search scholars..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="scholar-grid-container scrollbar-hide" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {isLoadingStudents ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--brand-green)', margin: '0 auto' }} />
                        </div>
                      ) : filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div 
                          key={student.id} 
                          className={`scholar-node-item ${selectedStudents.includes(student.id) ? 'active' : ''}`}
                          onClick={() => handleStudentSelect(student.id)}
                        >
                          <div className="selection-indicator">
                            {selectedStudents.includes(student.id) && <CheckCircle2 size={14} color="white" strokeWidth={3} />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--slate-900)' }}>{student.firstName} {student.lastName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{student.admissionNumber || 'SCH-NODE'}</div>
                          </div>
                          <ChevronRight size={14} style={{ opacity: 0.3 }} />
                        </div>
                      )) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                          <div style={{ color: 'var(--slate-300)', marginBottom: '12px' }}>
                            <Users size={32} style={{ margin: '0 auto' }} />
                          </div>
                          <p style={{ color: 'var(--slate-400)', fontSize: '13px', fontWeight: '600' }}>
                            {searchTerm ? `No matches for "${searchTerm}"` : 'No scholars found in this node'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>

              <section className="preview-area">
                {!generatedReports && !generating && (
                  <div className="empty-state-nexus">
                    <div className="empty-state-icon">
                      <Globe size={48} />
                    </div>
                    <h2 style={{ fontSize: '28px', fontWeight: '1000', color: 'var(--slate-900)', marginBottom: '16px', letterSpacing: '-1px' }}>Ready for Synthesis</h2>
                    <p style={{ color: 'var(--slate-500)', maxWidth: '380px', lineHeight: '1.7', fontSize: '15px', fontWeight: '600' }}>
                      Select academic parameters and scholar nodes to compile the terminal intelligence records.
                    </p>
                  </div>
                )}

                {generating && (
                  <div className="synthesis-loader">
                    <div className="pulse-ring"></div>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ 
                        color: 'var(--brand-green)', 
                        fontWeight: '1000', 
                        fontSize: '36px', 
                        marginBottom: '16px', 
                        letterSpacing: '-2px',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        Synthesizing Records
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div className="animate-bounce" style={{ width: '8px', height: '8px', backgroundColor: 'var(--brand-green)', borderRadius: '50%' }}></div>
                        <div className="animate-bounce" style={{ width: '8px', height: '8px', backgroundColor: 'var(--brand-green)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                        <div className="animate-bounce" style={{ width: '8px', height: '8px', backgroundColor: 'var(--brand-green)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
                        <span style={{ color: 'var(--slate-500)', fontWeight: '700', fontSize: '16px', marginLeft: '8px' }}>
                          Processing Terminal Vectors...
                        </span>
                      </div>
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
  );
};


const ReportTemplate = ({ data }) => {
  const isMidTerm = data.type === 'Mid-Term';
  
  const allSubjects = [...(data.subjects || []), ...(data.electives || [])];
  const core = allSubjects.filter(s => s.category === 'CORE');
  const electives = allSubjects.filter(s => s.category === 'ELECTIVE');

  // Dynamic scaling logic based on subject count
  const subjectCount = allSubjects.length;
  const useCompactMode = subjectCount > 10;
  const useUltraCompactMode = subjectCount > 15;
  
  const getDensityStyle = (property) => {
    if (useUltraCompactMode) {
      switch(property) {
        case 'rowPadding': return '3px 8px';
        case 'headerPadding': return '5px 8px';
        case 'fontSize': return '9px';
        case 'interpretationSize': return '8px';
        case 'headerSize': return '8px';
        case 'sectionGap': return '6px';
        case 'metaPadding': return '4px 8px';
        default: return '';
      }
    }
    if (useCompactMode) {
      switch(property) {
        case 'rowPadding': return '5px 10px';
        case 'headerPadding': return '6px 10px';
        case 'fontSize': return '10px';
        case 'interpretationSize': return '9px';
        case 'headerSize': return '9px';
        case 'sectionGap': return '10px';
        case 'metaPadding': return '6px 10px';
        default: return '';
      }
    }
    // Standard mode
    switch(property) {
      case 'rowPadding': return '8px 15px';
      case 'headerPadding': return '8px 15px';
      case 'fontSize': return '11px';
      case 'interpretationSize': return '10px';
      case 'headerSize': return '10px';
      case 'sectionGap': return '15px';
      case 'metaPadding': return '8px 12px';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return dateStr; }
  };

  return (
    <div className="report-card report-card-premium" style={{ border: '2px solid var(--brand-green)' }}>
      <div className="report-frame-inner" style={{ padding: useUltraCompactMode ? '5mm' : '8mm' }}>

        <img src={UbsLogo} alt="Watermark" className="report-watermark" />
        
        <div className="report-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* Advanced Institutional Header */}
          <div style={{ textAlign: 'center', marginBottom: getDensityStyle('sectionGap') }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px', marginBottom: '8px' }}>
              <img src={RLogo} alt="Logo" style={{ width: useUltraCompactMode ? '60px' : '75px', height: useUltraCompactMode ? '60px' : '75px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: useUltraCompactMode ? '20px' : '24px', fontWeight: '1000', color: '#005a2b', margin: 0, letterSpacing: '2px', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>UHAS BASIC SCHOOL</h1>
                <div style={{ fontSize: useUltraCompactMode ? '12px' : '14px', fontWeight: '900', color: '#005a2b', marginTop: '1px', letterSpacing: '1px' }}>
                  {isMidTerm ? 'SPECIAL MID-TERM EVALUATION' : 'OFFICIAL ACADEMIC REPORT'}
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#005a2b', textTransform: 'uppercase', marginTop: '2px', opacity: 0.8 }}>
                  {isMidTerm ? `${data.month || 'FEBRUARY'} SYNTHESIS, ${data.year}` : `${data.term}, ${data.year} ACADEMIC CYCLE`}
                </div>
              </div>
              <img src={UbsLogo} alt="UBS Logo" style={{ width: useUltraCompactMode ? '60px' : '75px', height: useUltraCompactMode ? '60px' : '75px', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Premium Metadata Grid */}
          <div style={{ marginBottom: getDensityStyle('sectionGap') }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: useUltraCompactMode ? '6px' : '10px' }}>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-green)', background: 'var(--slate-50)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--slate-500)', fontWeight: '900', marginBottom: '1px' }}>SCHOLAR NAME</div>
                <div style={{ fontSize: getDensityStyle('fontSize'), fontWeight: '1000', color: 'black' }}>{data.studentName?.toUpperCase()}</div>
              </div>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-yellow)', background: 'var(--slate-50)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--slate-500)', fontWeight: '900', marginBottom: '1px' }}>BASIC / SECTION</div>
                <div style={{ fontSize: getDensityStyle('fontSize'), fontWeight: '1000', color: 'black' }}>{data.class?.toUpperCase().replace('BASIC', '').replace('PRIMARY', '').trim()} - {data.section}</div>
              </div>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-green)', background: 'var(--slate-50)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--slate-500)', fontWeight: '900', marginBottom: '1px' }}>ADMISSION NO.</div>
                <div style={{ fontSize: getDensityStyle('fontSize'), fontWeight: '1000', color: 'black' }}>{data.admissionNumber}</div>
              </div>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-yellow)', background: 'var(--slate-50)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--slate-500)', fontWeight: '900', marginBottom: '1px' }}>ACADEMIC CYCLE</div>
                <div style={{ fontSize: getDensityStyle('fontSize'), fontWeight: '1000', color: 'black' }}>{data.term} | {data.year}</div>
              </div>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-green)', background: 'var(--brand-green-soft)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--brand-green)', fontWeight: '900', marginBottom: '1px' }}>TERM AGGREGATE</div>
                <div style={{ fontSize: useUltraCompactMode ? '11px' : '13px', fontWeight: '1000', color: 'var(--brand-green)' }}>{data.aggregate}</div>
              </div>
              <div style={{ padding: getDensityStyle('metaPadding'), borderLeft: '3px solid var(--brand-yellow)', background: 'var(--brand-yellow-soft)', borderRadius: '6px' }}>
                <div style={{ fontSize: '8px', color: 'var(--brand-yellow)', fontWeight: '900', marginBottom: '1px' }}>CLASS POSITION</div>
                <div style={{ fontSize: useUltraCompactMode ? '11px' : '13px', fontWeight: '1000', color: '#854d0e' }}>{data.classPosition}</div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px', padding: '0 5px' }}>
              <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-600)' }}>ROLL STRENGTH: <span style={{ color: 'var(--brand-green)' }}>{data.numberOnRoll || '--'}</span></div>
              <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-600)' }}>GENERATION DATE: <span style={{ color: 'var(--brand-green)' }}>{new Date().toLocaleDateString('en-GB')}</span></div>
              {!isMidTerm && (
                <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-600)' }}>VACATION DATE: <span style={{ color: 'var(--brand-green)' }}>{formatDate(data.vacationDate)}</span></div>
              )}
            </div>
          </div>

          {/* Advanced Subjects Table */}
          <div style={{ fontSize: useUltraCompactMode ? '9px' : '11px', fontWeight: '1000', color: '#005a2b', letterSpacing: '2px', marginBottom: '6px', textAlign: 'center', textTransform: 'uppercase' }}>Performance Synthesis Matrix</div>
          <table className="report-table" style={{ 
            border: '2px solid #005a2b', 
            borderCollapse: 'separate', 
            borderSpacing: 0, 
            borderRadius: '12px', 
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to right, #00843e, #005a2b)', color: 'white' }}>
                <th style={{ width: '25%', textAlign: 'left', padding: getDensityStyle('headerPadding'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>CURRICULUM NODES</th>
                {!isMidTerm && <th style={{ width: '10%', textAlign: 'center', padding: getDensityStyle('headerSize'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>CLASS [50]</th>}
                <th style={{ width: '10%', textAlign: 'center', padding: getDensityStyle('headerSize'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>EXAM [{isMidTerm ? '100' : '50'}]</th>
                {!isMidTerm && <th style={{ width: '10%', textAlign: 'center', padding: getDensityStyle('headerSize'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>TOTAL [100]</th>}
                <th style={{ width: '10%', textAlign: 'center', padding: getDensityStyle('headerSize'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>POS.</th>
                <th style={{ width: '8%', textAlign: 'center', padding: getDensityStyle('headerSize'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>GRADE</th>
                <th style={{ width: '22%', textAlign: 'left', padding: getDensityStyle('headerPadding'), fontSize: getDensityStyle('headerSize'), fontWeight: '900' }}>INTERPRETATION</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: 'rgba(0, 132, 62, 0.08)', color: '#005a2b' }}>
                <td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontWeight: '1000', fontSize: getDensityStyle('fontSize'), padding: '5px', letterSpacing: '2px', borderBottom: '1.5px solid #005a2b' }}>CORE SUBJECTS</td>
              </tr>
              {core.length > 0 ? core.map((sub, i) => (
                <tr key={`core-${i}`} style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(0,0,0,0.01)', borderBottom: '1px solid rgba(0, 90, 43, 0.1)' }}>
                  <td style={{ fontWeight: '900', color: '#005a2b', padding: getDensityStyle('rowPadding'), fontSize: getDensityStyle('fontSize') }}>{sub.name.toUpperCase()}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.classScore || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.examScore || '0'}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '1000', color: '#005a2b', fontSize: getDensityStyle('fontSize'), padding: '5px' }}>{sub.total || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.position || '--'}</td>
                  <td style={{ textAlign: 'center', fontWeight: '1000', color: '#005a2b', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.grade || '--'}</td>
                  <td style={{ fontSize: getDensityStyle('interpretationSize'), fontWeight: '800', fontStyle: 'italic', color: '#00843e', padding: getDensityStyle('rowPadding') }}>{sub.interpretation?.toUpperCase() || '--'}</td>
                </tr>
              )) : (
                <tr><td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontStyle: 'italic', padding: '10px', color: '#00843e' }}>No core subjects recorded</td></tr>
              )}

              <tr style={{ backgroundColor: 'rgba(0, 132, 62, 0.08)', color: '#005a2b' }}>
                <td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontWeight: '1000', fontSize: getDensityStyle('fontSize'), padding: '5px', letterSpacing: '2px', borderBottom: '1.5px solid #005a2b', borderTop: '1.5px solid #005a2b' }}>ELECTIVE SUBJECTS</td>
              </tr>
              {electives.length > 0 ? electives.map((sub, i) => (
                <tr key={`elective-${i}`} style={{ backgroundColor: i % 2 === 0 ? '#fff' : 'rgba(0,0,0,0.01)', borderBottom: '1px solid rgba(0, 90, 43, 0.1)' }}>
                  <td style={{ fontWeight: '900', color: '#005a2b', padding: getDensityStyle('rowPadding'), fontSize: getDensityStyle('fontSize') }}>{sub.name.toUpperCase()}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.classScore || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.examScore || '0'}</td>
                  {!isMidTerm && <td style={{ textAlign: 'center', fontWeight: '1000', color: '#005a2b', fontSize: getDensityStyle('fontSize'), padding: '5px' }}>{sub.total || '0'}</td>}
                  <td style={{ textAlign: 'center', fontWeight: '800', color: '#00843e', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.position || '--'}</td>
                  <td style={{ textAlign: 'center', fontWeight: '1000', color: '#005a2b', padding: '5px', fontSize: getDensityStyle('fontSize') }}>{sub.grade || '--'}</td>
                  <td style={{ fontSize: getDensityStyle('interpretationSize'), fontWeight: '800', fontStyle: 'italic', color: '#00843e', padding: getDensityStyle('rowPadding') }}>{sub.interpretation?.toUpperCase() || '--'}</td>
                </tr>
              )) : (
                <tr><td colSpan={isMidTerm ? 5 : 7} style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px', color: '#00843e' }}>No elective subjects recorded</td></tr>
              )}

              <tr style={{ fontWeight: '1000', backgroundColor: 'var(--slate-100)', color: '#005a2b' }}>
                <td style={{ padding: '8px 15px', fontSize: getDensityStyle('fontSize'), borderTop: '2px solid #005a2b' }}>CONSOLIDATED SCORE</td>
                <td colSpan={isMidTerm ? 4 : 6} style={{ textAlign: 'right', paddingRight: '40px', fontSize: useUltraCompactMode ? '12px' : '14px', fontWeight: '1000', borderTop: '2px solid #005a2b' }}>
                  {data.aggregate || data.totalScore || '--'}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginTop: '8px' }}>
            <table style={{ border: '2px solid #005a2b', borderCollapse: 'collapse', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
              <tbody>
                <tr style={{ fontSize: '9px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', width: '40%', backgroundColor: 'var(--slate-50)' }}>ATTENDANCE</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', textAlign: 'center', fontWeight: '800' }}>{data.attendance || '--'}</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', textAlign: 'center', backgroundColor: 'var(--slate-50)' }}>OUT OF</td>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', textAlign: 'center', fontWeight: '800' }}>{data.totalDays || '--'}</td>
                </tr>
                {!isMidTerm && (
                  <tr style={{ fontSize: '9px' }}>
                    <td colSpan={2} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', backgroundColor: 'var(--slate-50)' }}>PROMOTED TO</td>
                    <td colSpan={2} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>{data.promotedTo || '--'}</td>
                  </tr>
                )}
                <tr style={{ fontSize: '9px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', backgroundColor: 'var(--slate-50)' }}>CONDUCT</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>{data.conduct || 'VERY GOOD'}</td>
                </tr>
                <tr style={{ fontSize: '9px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', backgroundColor: 'var(--slate-50)' }}>ATTITUDE</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>{data.attitude || 'STUDIOUS AND HARDWORKING'}</td>
                </tr>
                <tr style={{ fontSize: '9px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', backgroundColor: 'var(--slate-50)' }}>INTEREST</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '800' }}>{data.interest || 'READING'}</td>
                </tr>
                <tr style={{ fontSize: '9px' }}>
                  <td style={{ border: '1px solid #005a2b', padding: '4px 8px', fontWeight: '900', backgroundColor: 'var(--slate-50)' }}>TEACHER'S REMARKS</td>
                  <td colSpan={3} style={{ border: '1px solid #005a2b', padding: '4px 8px', height: useUltraCompactMode ? '25px' : '35px', fontWeight: '800', verticalAlign: 'top', fontSize: '9px' }}>{data.teacherRemarks}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '5px' }}>
              <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-800)' }}>
                Teacher's Name: <span style={{ borderBottom: '1.5px solid #000', flex: 1, display: 'inline-block', minWidth: '100px', paddingLeft: '8px' }}>{data.teacherName || '........................................'}</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-800)' }}>
                Teacher's Signature: <span style={{ borderBottom: '1.5px dotted #000', flex: 1, display: 'inline-block', minWidth: '100px' }}>........................................</span>
              </div>
              <div style={{ fontSize: '9px', fontWeight: '900', color: 'var(--slate-800)' }}>
                Head's Signature: <span style={{ borderBottom: '1.5px dotted #000', flex: 1, display: 'inline-block', minWidth: '100px' }}>........................................</span>
              </div>
              <div className="official-seal" style={{ alignSelf: 'center', opacity: 0.6, fontSize: '9px' }}>
                OFFICIAL SEAL
              </div>
            </div>
          </div>


          {/* Grading Interpretation Matrix */}
          <div style={{ marginTop: '10px', borderTop: '2.5px double #005a2b', paddingTop: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: '1000', fontSize: '9px', color: '#005a2b', marginBottom: '4px', letterSpacing: '1.5px' }}>SYSTEMATIC GRADING INTERPRETATION</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #005a2b' }}>
                <tbody>
                  <tr style={{ backgroundColor: 'var(--slate-100)', fontWeight: '900', fontSize: '8px', color: 'var(--slate-700)' }}>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>100-90</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>89-80</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>79-70</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>69-60</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>59-55</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>54-50</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>49-40</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>39-35</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>34-0</td>
                  </tr>
                  <tr style={{ fontSize: '8px', fontWeight: '900', color: '#005a2b' }}>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Highest</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Higher</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>High</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>High Avg</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Average</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Low Avg</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Low</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Lower</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>Lowest</td>
                  </tr>
                  <tr style={{ fontSize: '8px', fontWeight: '1000', color: '#005a2b', backgroundColor: 'var(--brand-yellow-soft)' }}>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>1</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>2</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>3</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>4</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>5</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>6</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>7</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>8</td>
                    <td style={{ border: '1px solid #005a2b', padding: '4px' }}>9</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', fontWeight: '1000', fontStyle: 'italic', color: 'var(--brand-green)', letterSpacing: '1px' }}>
              LEARNING TODAY, LEADING TOMORROW
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

  // Dynamic scaling for broadsheet
  const reportCount = reports.length;
  const useCompact = reportCount > 15;
  const useUltraCompact = reportCount > 25;

  const getDensity = (prop) => {
    if (useUltraCompact) {
      switch(prop) {
        case 'padding': return '6px 10px';
        case 'fontSize': return '8.5px';
        case 'headerPadding': return '8px';
        default: return '';
      }
    }
    if (useCompact) {
      switch(prop) {
        case 'padding': return '8px 12px';
        case 'fontSize': return '9.5px';
        case 'headerPadding': return '10px';
        default: return '';
      }
    }
    return {
      padding: '10px 12px',
      fontSize: '10px',
      headerPadding: '12px'
    }[prop];
  };

  return (
    <div className="report-card report-card-premium" style={{ border: '2.5px solid var(--brand-green)', padding: '10mm', height: '297mm', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        <img src={UbsLogo} alt="Watermark" className="report-watermark" />
        
        <div style={{ textAlign: 'center', marginBottom: useUltraCompact ? '15px' : '30px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '25px', marginBottom: useUltraCompact ? '8px' : '15px' }}>
            <img src={RLogo} alt="Logo" style={{ width: useUltraCompact ? '60px' : '85px', height: useUltraCompact ? '60px' : '85px', objectFit: 'contain' }} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: useUltraCompact ? '22px' : '26px', fontWeight: '1000', color: '#00843e', margin: 0, letterSpacing: '2px', fontFamily: 'Outfit, sans-serif' }}>UHAS BASIC SCHOOL</h1>
              <div style={{ fontSize: useUltraCompact ? '14px' : '18px', fontWeight: '900', color: '#00843e', marginTop: '4px', letterSpacing: '1px' }}>
                CLASS PERFORMANCE SYNTHESIS (BROADSHEET)
              </div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#00843e', textTransform: 'uppercase', marginTop: '5px', opacity: 0.8 }}>
                {filters.grade} - {filters.section ? `SECTION ${filters.section}` : 'ALL SECTIONS'} | {filters.term}, {filters.year}
              </div>
            </div>
            <img src={UbsLogo} alt="UBS Logo" style={{ width: useUltraCompact ? '60px' : '85px', height: useUltraCompact ? '60px' : '85px', objectFit: 'contain' }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', padding: useUltraCompact ? '10px' : '15px', backgroundColor: 'var(--slate-50)', borderRadius: '12px', border: '1.5px solid var(--brand-green-soft)' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--slate-500)', fontWeight: '900' }}>TOTAL NODES</div>
              <div style={{ fontSize: '13px', fontWeight: '1000', color: 'var(--brand-green)' }}>{reports.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--slate-500)', fontWeight: '900' }}>SECTION NODE</div>
              <div style={{ fontSize: '13px', fontWeight: '1000', color: 'var(--brand-green)' }}>{filters.section || 'ALL'}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--slate-500)', fontWeight: '900' }}>CLASS AVERAGE</div>
              <div style={{ fontSize: '13px', fontWeight: '1000', color: 'var(--brand-green)' }}>{classAvg.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--slate-500)', fontWeight: '900' }}>PEAK SCORE</div>
              <div style={{ fontSize: '13px', fontWeight: '1000', color: 'var(--brand-green)' }}>{topScore}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', border: '2px solid #00843e', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: getDensity('fontSize') }}>
            <thead>
              <tr style={{ background: '#00843e', color: 'white' }}>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'left', borderBottom: '2px solid #005a2b' }}>RANK</th>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'left', borderBottom: '2px solid #005a2b' }}>SCHOLAR IDENTITY</th>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'center', borderBottom: '2px solid #005a2b' }}>ADMISSION</th>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'center', borderBottom: '2px solid #005a2b' }}>AGGREGATE</th>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'center', borderBottom: '2px solid #005a2b' }}>ATTENDANCE</th>
                <th style={{ padding: getDensity('headerPadding'), textAlign: 'left', borderBottom: '2px solid #005a2b' }}>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {[...reports].sort((a, b) => (b.aggregate || 0) - (a.aggregate || 0)).map((report, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)' }}>
                  <td style={{ padding: getDensity('padding'), fontWeight: '1000', color: 'var(--brand-green)' }}>{i + 1}</td>
                  <td style={{ padding: getDensity('padding'), fontWeight: '800' }}>{report.studentName?.toUpperCase()}</td>
                  <td style={{ padding: getDensity('padding'), textAlign: 'center', color: 'var(--slate-600)', fontWeight: '700' }}>{report.admissionNumber}</td>
                  <td style={{ padding: getDensity('padding'), textAlign: 'center', fontWeight: '900', color: 'var(--brand-green)' }}>{report.aggregate}</td>
                  <td style={{ padding: getDensity('padding'), textAlign: 'center', fontWeight: '800' }}>{report.attendance} / {report.totalDays}</td>
                  <td style={{ padding: getDensity('padding'), fontSize: '8.5px', fontWeight: '700', fontStyle: 'italic', color: 'var(--slate-500)' }}>{report.teacherRemarks?.substring(0, 50)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1.5px solid black', width: '200px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Class Teacher's Signature</div>
          </div>
          <div style={{ textAlign: 'center', paddingBottom: '10px' }}>
            <div className="official-seal" style={{ margin: '0 auto', opacity: 0.5 }}>OFFICIAL SEAL</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1.5px solid black', width: '200px', marginBottom: '8px' }}></div>
            <div style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Head of School's Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
