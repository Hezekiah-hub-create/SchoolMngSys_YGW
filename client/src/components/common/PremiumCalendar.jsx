import React, { useState } from 'react';

const PremiumCalendar = ({ value, onChange, onClose, style = {} }) => {
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const handleDateClick = (day) => {
    const selected = new Date(year, month, day);
    // Format as YYYY-MM-DD for consistency with native date inputs
    const formatted = selected.toISOString().split('T')[0];
    onChange(formatted);
    if (onClose) onClose();
  };
  
  const today = new Date();
  const isToday = (d) => today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  const isSelected = (d) => {
    if (!value) return false;
    const v = new Date(value);
    return v.getDate() === d && v.getMonth() === month && v.getFullYear() === year;
  };

  const dayCells = [];
  const startOffset = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);
  
  // Empty cells for previous month padding
  for (let i = 0; i < startOffset; i++) {
    dayCells.push(<div key={`pad-${i}`} style={{ height: '40px' }} />);
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const selected = isSelected(d);
    const todayFlag = isToday(d);
    
    dayCells.push(
      <div 
        key={d} 
        onClick={() => handleDateClick(d)}
        style={{
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '700',
          transition: 'all 0.2s',
          backgroundColor: selected ? 'var(--brand-green)' : (todayFlag ? 'var(--brand-green-light)' : 'transparent'),
          color: selected ? 'white' : (todayFlag ? 'var(--brand-green)' : '#1e293b'),
          border: todayFlag && !selected ? '1.5px solid var(--brand-green)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          if (!selected) e.currentTarget.style.backgroundColor = todayFlag ? 'var(--brand-green-light)' : 'transparent';
        }}
      >
        {d}
      </div>
    );
  }

  return (
    <div style={{
      width: '320px',
      maxWidth: '100%',
      backgroundColor: 'white',
      borderRadius: '24px',
      padding: '24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      border: '1px solid #f1f5f9',
      zIndex: 1000,
      ...style
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a' }}>
          {monthNames[month]} {year}
        </div>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      
      {/* Day Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {d}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {dayCells}
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={() => handleDateClick(today.getDate())}
          style={{ background: 'none', border: 'none', color: 'var(--brand-green)', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}
        >
          Jump to Today
        </button>
      </div>
    </div>
  );
};

export default PremiumCalendar;
