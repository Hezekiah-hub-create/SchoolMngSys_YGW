import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const PremiumSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select Option",
  label = "",
  disabled = false,
  icon = null,
  name = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(300, Math.max(60, options.length * 44 + 16));
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setCoords({
        top: openUp ? Math.max(8, rect.top - estimatedHeight - 6) : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 140),
        maxHeight: openUp ? Math.min(300, rect.top - 16) : Math.min(300, spaceBelow - 16),
        openUp
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScroll = () => updateCoords();
      const handleResize = () => updateCoords();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (optionValue) => {
    onChange({ target: { name: name || label, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="premium-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '12px 16px',
          backgroundColor: disabled ? '#f8fafc' : 'white',
          opacity: disabled ? 0.7 : 1,
          position: 'relative',
          borderColor: isOpen ? 'var(--brand-green)' : 'var(--brand-slate-200)',
          boxShadow: isOpen ? '0 0 0 4px rgba(0, 132, 62, 0.08)' : 'none',
          userSelect: 'none'
        }}
      >
        {icon && <span style={{ color: 'var(--brand-green)', display: 'flex' }}>{icon}</span>}
        <span style={{ 
          color: selectedOption ? '#0f172a' : '#94a3b8', 
          fontSize: '14px', 
          fontWeight: '700',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" 
          style={{ 
            marginLeft: 'auto', 
            transform: isOpen ? 'rotate(180deg)' : 'none', 
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
          }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="premium-select-dropdown"
          style={{ 
            position: 'fixed', 
            top: `${coords.top}px`, 
            left: `${coords.left}px`, 
            width: `${coords.width}px`,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08)',
            border: '1.5px solid #e2e8f0',
            padding: '8px',
            zIndex: 9999999,
            maxHeight: `${coords.maxHeight || 280}px`,
            overflowY: 'auto',
            animation: 'premiumSelectFadeIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <style>{`
            @keyframes premiumSelectFadeIn {
              from { opacity: 0; transform: translateY(${coords.openUp ? '8px' : '-8px'}); }
              to { opacity: 1; transform: translateY(0); }
            }
            .premium-option {
              padding: 10px 14px;
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
              font-size: 13.5px;
              font-weight: 700;
              color: #334155;
              display: flex;
              align-items: center;
              gap: 10px;
              user-select: none;
            }
            .premium-option:hover {
              background-color: rgba(0, 132, 62, 0.08);
              color: var(--brand-green);
              padding-left: 18px;
            }
            .premium-option.selected {
              background-color: var(--brand-green);
              color: white;
              box-shadow: 0 4px 12px rgba(0, 132, 62, 0.25);
            }
            /* Custom Scrollbar */
            .premium-select-dropdown::-webkit-scrollbar {
              width: 5px;
            }
            .premium-select-dropdown::-webkit-scrollbar-track {
              background: transparent;
            }
            .premium-select-dropdown::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
          {options.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>No options available</div>
          ) : (
            options.map((opt) => (
              <div 
                key={opt.value}
                className={`premium-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {String(opt.value) === String(value) && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ flexShrink: 0 }}>
                    <path d="M20 6L9 17L4 12"/>
                  </svg>
                )}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default PremiumSelect;
