import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useAlert } from '../../../context/AlertContext';
import { settingsAPI, smsAPI } from '../../../services/api';
import '../Settings.css';

const SMSConfig = () => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    sms_provider: 'arkesel',
    sms_api_key: '',
    sms_sender_id: 'UHASSCH',
    sms_enabled: true,
    sms_alert_attendance: true,
    sms_alert_reports: true,
    sms_alert_assignments: true
  });

  const [testRecipient, setTestRecipient] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getSettings();
      if (res.data?.data) {
        const s = res.data.data;
        setFormData({
          sms_provider: s.sms_provider || 'arkesel',
          sms_api_key: s.sms_api_key || '',
          sms_sender_id: s.sms_sender_id || 'UHASSCH',
          sms_enabled: s.sms_enabled !== false,
          sms_alert_attendance: s.sms_alert_attendance !== false,
          sms_alert_reports: s.sms_alert_reports !== false,
          sms_alert_assignments: s.sms_alert_assignments !== false
        });
      }
    } catch (err) {
      console.error('Error loading SMS settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsAPI.updateSettings(formData);
      showAlert('success', 'SMS Settings Updated', 'Phone push notification & SMS gateway configuration saved successfully.');
    } catch (err) {
      showAlert('error', 'Update Failed', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestSMS = async () => {
    if (!testRecipient) {
      showAlert('warning', 'Missing Phone Number', 'Please enter a test recipient phone number (e.g. 024XXXXXXX).');
      return;
    }

    try {
      setTesting(true);
      const res = await smsAPI.testSMS({
        recipient: testRecipient,
        provider: formData.sms_provider,
        apiKey: formData.sms_api_key,
        senderId: formData.sms_sender_id
      });

      if (res.data?.success) {
        showAlert('success', 'Test SMS Dispatched', res.data.message || `Test message dispatched to ${testRecipient}`);
      } else {
        showAlert('error', 'Test Failed', res.data?.error || res.data?.message || 'Could not send test SMS');
      }
    } catch (err) {
      showAlert('error', 'Gateway Error', err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div className="premium-loader" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b', fontWeight: '600' }}>Loading SMS Gateway Configuration...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px' }}>
          Phone Push Notifications & SMS Gateway
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
          Configure live SMS notifications dispatched directly to parents, teachers, and guardians for attendance, report releases, assignments, and school broadcasts.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Gateway Credentials
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Provider Selector */}
            <div>
              <label className="premium-label" style={{ marginBottom: '8px', display: 'block' }}>SMS Gateway Provider</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { id: 'arkesel', name: 'Arkesel', tag: 'Popular in Ghana' },
                  { id: 'mnotify', name: 'mNotify', tag: 'West Africa' },
                  { id: 'hubtel', name: 'Hubtel', tag: 'Enterprise' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, sms_provider: p.id })}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: formData.sms_provider === p.id ? '2px solid var(--brand-green)' : '1px solid #e2e8f0',
                      backgroundColor: formData.sms_provider === p.id ? 'rgba(0, 132, 62, 0.05)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '14px', color: formData.sms_provider === p.id ? 'var(--brand-green)' : '#1e293b' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.tag}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sender ID */}
            <div>
              <label className="premium-label" style={{ marginBottom: '8px', display: 'block' }}>Sender ID (Header)</label>
              <input
                type="text"
                maxLength={11}
                value={formData.sms_sender_id}
                onChange={(e) => setFormData({ ...formData, sms_sender_id: e.target.value.toUpperCase() })}
                placeholder="e.g. UHASSCH"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '700' }}
              />
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Max 11 alphanumeric characters (must match your registered Sender ID at the provider).</p>
            </div>

            {/* API Key */}
            <div>
              <label className="premium-label" style={{ marginBottom: '8px', display: 'block' }}>API Key / Auth Token</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.sms_api_key}
                  onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                  placeholder="Paste your API key here..."
                  style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: '700' }}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />

            {/* Automated Triggers */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>Automated Phone Push Triggers</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  {
                    key: 'sms_alert_attendance',
                    label: 'Attendance Alerts (Absent / Late)',
                    desc: 'Automatically send an instant SMS alert to parents whenever a student is marked Absent or Late.'
                  },
                  {
                    key: 'sms_alert_reports',
                    label: 'Academic Report Publication Alerts',
                    desc: 'Automatically notify parents via SMS as soon as their child’s terminal report is published.'
                  },
                  {
                    key: 'sms_alert_assignments',
                    label: 'New Assignment & Assessment Alerts',
                    desc: 'Notify parents via SMS when a teacher posts a new homework or project assignment.'
                  }
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <input
                      type="checkbox"
                      checked={formData[item.key]}
                      onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--brand-green)', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{item.label}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="premium-btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '12px' }}
            >
              {saving ? 'Saving Settings...' : 'Save SMS Configuration'}
            </button>
          </div>
        </form>

        {/* Live Test & Gateway Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Test SMS Box */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              Live Test SMS
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Send a real test message to your phone number to verify API connectivity and Sender ID delivery.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="tel"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Phone Number (e.g. 0241234567)"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={handleSendTestSMS}
                disabled={testing || !testRecipient}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '13px',
                  border: 'none',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  opacity: (!testRecipient || testing) ? 0.6 : 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {testing ? 'Sending Test SMS...' : 'Send Test Notification'}
              </button>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#166534', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Quick Setup Guide
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '1.5' }}>
              <li><strong>Arkesel:</strong> Register at <a href="https://arkesel.com" target="_blank" rel="noreferrer" style={{ color: '#166534', textDecoration: 'underline' }}>arkesel.com</a>, generate an API Key, and enter your approved Sender ID.</li>
              <li><strong>mNotify:</strong> Register at <a href="https://mnotify.com" target="_blank" rel="noreferrer" style={{ color: '#166534', textDecoration: 'underline' }}>mnotify.com</a> and copy your API Key from the developer settings.</li>
              <li><strong>Hubtel:</strong> Generate Quick SMS API keys directly from your Hubtel Merchant portal.</li>
              <li><strong>Simulation Mode:</strong> If no API key is set, notifications will automatically log to the system console in simulation mode without failing.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSConfig;
