import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Filter,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

const Assignments = () => {
  const [filter, setFilter] = useState('All');
  
  const dummyAssignments = [
    { id: 1, title: 'Quantum Mechanics Problem Set', subject: 'Physics', deadline: 'Today, 4:00 PM', status: 'Pending', priority: 'High' },
    { id: 2, title: 'Cellular Respiration Essay', subject: 'Biology', deadline: 'Tomorrow', status: 'In Progress', priority: 'Medium' },
    { id: 3, title: 'Calculus III: Multiple Integrals', subject: 'Mathematics', deadline: '12 April 2025', status: 'Submitted', priority: 'High' },
    { id: 4, title: 'Literature Review: Modernism', subject: 'English', deadline: '15 April 2025', status: 'Pending', priority: 'Low' },
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <span style={{ padding: '4px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Tasks</span>
          <h1 style={{ fontSize: '36px', fontWeight: '950', color: '#0f172a', margin: '8px 0 0 0', letterSpacing: '-1.5px' }}>Scholar <span style={{ color: '#00843e' }}>Assignments</span></h1>
          <p style={{ color: '#64748b', margin: '8px 0 0 0', fontWeight: '600' }}>Manage and track terminal academic deliverables.</p>
        </div>
        
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px 24px', 
          backgroundColor: '#00843e', 
          color: 'white', 
          border: 'none', 
          borderRadius: '16px', 
          fontWeight: '800',
          cursor: 'pointer',
          boxShadow: '0 10px 15px -3px rgba(0, 132, 62, 0.2)'
        }}>
          <Plus size={20} /> Create Assignment
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px' }}>
        <aside>
          <div style={{ 
            background: 'white', 
            borderRadius: '24px', 
            padding: '24px', 
            border: '1.5px solid #f1f5f9',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={18} color="#00843e" /> Task Matrix
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['All', 'Active', 'In Progress', 'Submitted', 'Archived'].map(item => (
                <button 
                  key={item}
                  onClick={() => setFilter(item)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: filter === item ? '#f0fdf4' : 'transparent',
                    color: filter === item ? '#00843e' : '#64748b',
                    fontWeight: filter === item ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {item}
                  {filter === item && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section>
          <div style={{ display: 'grid', gap: '20px' }}>
            {dummyAssignments.map(assignment => (
              <div key={assignment.id} style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(24px)',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                transition: 'transform 0.2s'
              }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    background: assignment.status === 'Submitted' ? '#f0fdf4' : '#fff7ed', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: assignment.status === 'Submitted' ? '#00843e' : '#ea580c'
                  }}>
                    {assignment.status === 'Submitted' ? <CheckCircle2 size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{assignment.title}</h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BookOpen size={12} /> {assignment.subject}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {assignment.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '900', 
                      padding: '4px 12px', 
                      borderRadius: '20px',
                      backgroundColor: assignment.priority === 'High' ? '#fef2f2' : '#f8fafc',
                      color: assignment.priority === 'High' ? '#ef4444' : '#64748b',
                      textTransform: 'uppercase'
                    }}>
                      {assignment.priority} Priority
                    </span>
                    <div style={{ fontSize: '12px', fontWeight: '800', marginTop: '4px', color: '#0f172a' }}>{assignment.status}</div>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Assignments;
