const supabase = require('../config/supabase');
const { COLLECTIONS } = require('./supabaseService');

/**
 * Normalizes phone numbers to standard format for Ghana / International
 * e.g. "0241234567" -> "233241234567"
 * e.g. "+233 24 123 4567" -> "233241234567"
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  let clean = String(phone).replace(/[^0-9+]/g, '').trim();
  if (clean.startsWith('+')) {
    clean = clean.substring(1);
  }
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '233' + clean.substring(1);
  }
  return clean.length >= 9 ? clean : null;
};

/**
 * Retrieves the active SMS settings from the database or environment variables
 */
const getSMSConfig = async () => {
  try {
    const { data: settingsData } = await supabase
      .from(COLLECTIONS.SETTINGS)
      .select('*')
      .limit(1);

    const settings = settingsData?.[0] || {};
    
    return {
      provider: settings.sms_provider || process.env.SMS_PROVIDER || 'arkesel', // 'arkesel' | 'mnotify' | 'hubtel'
      apiKey: settings.sms_api_key || process.env.SMS_API_KEY || '',
      senderId: settings.sms_sender_id || process.env.SMS_SENDER_ID || 'UHASSCH',
      enabled: settings.sms_enabled !== false && (!!settings.sms_api_key || !!process.env.SMS_API_KEY),
      alertAttendance: settings.sms_alert_attendance !== false,
      alertReports: settings.sms_alert_reports !== false,
      alertAssignments: settings.sms_alert_assignments !== false,
      schoolName: settings.school_name || 'UHAS Basic School'
    };
  } catch (err) {
    console.warn('[SMS] Could not load SMS config from DB, using defaults:', err.message);
    return {
      provider: process.env.SMS_PROVIDER || 'arkesel',
      apiKey: process.env.SMS_API_KEY || '',
      senderId: process.env.SMS_SENDER_ID || 'UHASSCH',
      enabled: !!process.env.SMS_API_KEY,
      alertAttendance: true,
      alertReports: true,
      alertAssignments: true,
      schoolName: 'UHAS Basic School'
    };
  }
};

/**
 * Dispatches an SMS using native fetch (zero external dependencies)
 */
const sendRawSMS = async ({ recipients, message, senderId, config }) => {
  const cfg = config || (await getSMSConfig());
  const sender = senderId || cfg.senderId || 'UHASSCH';
  const apiKey = cfg.apiKey;
  const provider = (cfg.provider || 'arkesel').toLowerCase();

  // Normalize all recipient phone numbers
  const phoneList = (Array.isArray(recipients) ? recipients : [recipients])
    .map(normalizePhoneNumber)
    .filter(Boolean);

  if (phoneList.length === 0) {
    console.warn('[SMS] No valid phone numbers provided for SMS dispatch.');
    return { success: false, message: 'No valid phone numbers' };
  }

  if (!apiKey) {
    console.warn(`[SMS SIMULATION] SMS Gateway (${provider}) API Key not configured. Message would have been sent to: ${phoneList.join(', ')} | Body: "${message}"`);
    return { 
      success: true, 
      simulated: true, 
      recipients: phoneList, 
      message: 'SMS logged in simulation mode (Add SMS API Key in Settings to send live messages).' 
    };
  }

  try {
    console.log(`[SMS] Sending via ${provider} to ${phoneList.length} recipients: ${phoneList.join(', ')}`);

    if (provider === 'arkesel') {
      // Arkesel SMS API v2
      const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: sender.substring(0, 11),
          message,
          recipients: phoneList
        })
      });
      const data = await res.json();
      return { success: res.ok, data };
    } 
    
    if (provider === 'mnotify') {
      // mNotify SMS API v2
      const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: phoneList,
          sender: sender.substring(0, 11),
          message,
          is_schedule: false
        })
      });
      const data = await res.json();
      return { success: res.ok, data };
    } 
    
    if (provider === 'hubtel') {
      // Hubtel Quick SMS API
      const authHeader = 'Basic ' + Buffer.from(apiKey).toString('base64');
      const res = await fetch('https://api.hubtel.com/v1/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          From: sender.substring(0, 11),
          To: phoneList[0],
          Content: message
        })
      });
      const data = await res.json();
      return { success: res.ok, data };
    }

    throw new Error(`Unsupported SMS provider: ${provider}`);
  } catch (error) {
    console.error(`[SMS ERROR] Failed to send SMS via ${provider}:`, error.message);
    return { success: false, error: error.message };
  }
};

const smsService = {
  getSMSConfig,
  normalizePhoneNumber,
  sendRawSMS,
  sendSMS: async (to, message, senderId) => {
    const config = await getSMSConfig();
    return sendRawSMS({ recipients: to, message, senderId, config });
  },

  sendBulkSMS: async (recipients, message, senderId) => {
    const config = await getSMSConfig();
    return sendRawSMS({ recipients, message, senderId, config });
  },

  /**
   * Automated Attendance Alert: Sends instant SMS to parent when student is Absent or Late
   */
  sendAttendanceAlert: async ({ studentName, parentPhone, status, date, schoolName }) => {
    const config = await getSMSConfig();
    if (!config.alertAttendance || !parentPhone) return;

    const sch = schoolName || config.schoolName;
    const formattedDate = date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'today';
    const statusText = String(status || '').toUpperCase();
    
    let message = '';
    if (statusText === 'ABSENT') {
      message = `Dear Parent, please be notified that ${studentName} was marked ABSENT from school on ${formattedDate}. Kindly contact administration if this is an error. - ${sch}`;
    } else if (statusText === 'LATE') {
      message = `Dear Parent, please be notified that ${studentName} arrived LATE to school on ${formattedDate}. - ${sch}`;
    } else {
      return; // Only send alerts for Absent or Late
    }

    return sendRawSMS({ recipients: parentPhone, message, config });
  },

  /**
   * Automated Academic Report Dispatch Alert
   */
  sendReportAlert: async ({ studentName, parentPhone, term, academicYear, schoolName }) => {
    const config = await getSMSConfig();
    if (!config.alertReports || !parentPhone) return;

    const sch = schoolName || config.schoolName;
    const message = `Dear Parent, the official academic report for ${studentName} (${term}, ${academicYear}) has been compiled and published. Log into the Parent Portal to view full details. - ${sch}`;

    return sendRawSMS({ recipients: parentPhone, message, config });
  },

  /**
   * Automated Assignment Alert
   */
  sendAssignmentAlert: async ({ taskTitle, courseName, dueDate, parentPhones, schoolName }) => {
    const config = await getSMSConfig();
    if (!config.alertAssignments || !parentPhones || parentPhones.length === 0) return;

    const sch = schoolName || config.schoolName;
    const due = dueDate ? `Due: ${new Date(dueDate).toLocaleDateString('en-GB')}` : '';
    const message = `New Assignment Alert: "${taskTitle}" has been posted for ${courseName}. ${due}. Please encourage your ward to complete it on time. - ${sch}`;

    return sendRawSMS({ recipients: parentPhones, message, config });
  },

  /**
   * Broadcast Announcement SMS
   */
  sendBroadcastAnnouncement: async ({ title, content, parentPhones, schoolName }) => {
    const config = await getSMSConfig();
    if (!parentPhones || parentPhones.length === 0) return;

    const sch = schoolName || config.schoolName;
    const preview = content?.length > 110 ? content.substring(0, 107) + '...' : content;
    const message = `[NOTICE - ${sch}]: ${title} - ${preview}`;

    return sendRawSMS({ recipients: parentPhones, message, config });
  }
};

module.exports = smsService;
