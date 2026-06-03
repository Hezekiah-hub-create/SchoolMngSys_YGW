import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import api from '../../../services/api';
import { Activity, Search, Filter, Clock, User, Shield, Target } from 'lucide-react';

const ActivityLogs = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [filterAction, setFilterAction] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, [filterRole, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audit', {
        params: { role: filterRole, action: filterAction, limit: 100 }
      });
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      showAlert({ type: 'error', title: 'Error', message: 'Failed to fetch activity logs' });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return { bg: '#dcfce7', text: '#166534' };
      case 'UPDATE': return { bg: '#fef9c3', text: '#854d0e' };
      case 'DELETE': return { bg: '#fee2e2', text: '#991b1b' };
      case 'LOGIN': return { bg: '#e0e7ff', text: '#3730a3' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ color: '#00843e' }} />
            System Audit Trail
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Monitor all activities and state changes across the system.</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>FILTER BY ROLE</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>FILTER BY ACTION</label>
            <select 
              value={filterAction} 
              onChange={(e) => setFilterAction(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
            >
              <option value="All">All Actions</option>
              <option value="LOGIN">Login / Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="READ">Read</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>TIMESTAMP</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>USER</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ACTION</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ENTITY</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>IP ADDRESS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading audit logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No activity records found for the current filters.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '8px' }}>
                        <User size={14} style={{ color: '#64748b' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{log.user_name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{String(log.role).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      background: getActionColor(log.action).bg, 
                      color: getActionColor(log.action).text, 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      fontSize: '11px', 
                      fontWeight: '700' 
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{log.entity}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{log.details?.method} {log.details?.url}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLogs;
