const smsService = require('../services/smsService');
const supabase = require('../config/supabase');
const { COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @desc    Send custom SMS (Single or Bulk)
// @route   POST /api/sms/send
// @access  Private (Admin, Staff, Teacher)
const sendSMS = asyncHandler(async (req, res) => {
  const { recipients, message, senderId } = req.body;

  if (!recipients || !message) {
    return res.status(400).json({ success: false, message: 'Recipients and message content are required' });
  }

  const result = await smsService.sendBulkSMS(recipients, message, senderId);
  res.json({ success: true, ...result });
});

// @desc    Send test SMS to verify gateway connection
// @route   POST /api/sms/test
// @access  Private (Admin)
const testSMS = asyncHandler(async (req, res) => {
  const { recipient, provider, apiKey, senderId } = req.body;

  if (!recipient) {
    return res.status(400).json({ success: false, message: 'Recipient phone number is required' });
  }

  const testConfig = {
    provider: provider || 'arkesel',
    apiKey: apiKey || '',
    senderId: senderId || 'UHASSCH'
  };

  const testMessage = `[TEST] This is a test notification from UHAS Basic School Management System. Your SMS Gateway is successfully connected.`;
  
  const result = await smsService.sendRawSMS({
    recipients: recipient,
    message: testMessage,
    senderId: testConfig.senderId,
    config: testConfig
  });
  res.json({ success: true, ...result });
});

// @desc    Get current SMS status and configuration
// @route   GET /api/sms/config
// @access  Private (Admin)
const getSMSStatus = asyncHandler(async (req, res) => {
  const config = await smsService.getSMSConfig();
  // Mask API key for security
  const maskedApiKey = config.apiKey 
    ? `${config.apiKey.substring(0, 4)}••••••••${config.apiKey.substring(config.apiKey.length - 4)}` 
    : '';

  res.json({
    success: true,
    data: {
      provider: config.provider,
      senderId: config.senderId,
      isConfigured: !!config.apiKey,
      apiKeyMasked: maskedApiKey,
      alertAttendance: config.alertAttendance,
      alertReports: config.alertReports,
      alertAssignments: config.alertAssignments
    }
  });
});

// @desc    Broadcast SMS to parents of specific Grade/Section or All School
// @route   POST /api/sms/broadcast
// @access  Private (Admin, Teacher)
const broadcastSMS = asyncHandler(async (req, res) => {
  const { grade, section, message, title } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Broadcast message content is required' });
  }

  // Fetch parent phone numbers from students matching grade/section
  let query = supabase.from(COLLECTIONS.STUDENTS).select('phone, guardian_phone, parent:parent_id(phone)');
  if (grade && grade !== 'all') {
    query = query.eq('grade', grade);
  }
  if (section && section !== 'all') {
    query = query.eq('section', section);
  }

  const { data: students, error } = await query;
  if (error) throw error;

  const phoneNumbers = new Set();
  (students || []).forEach(s => {
    if (s.guardian_phone) phoneNumbers.add(s.guardian_phone);
    if (s.phone) phoneNumbers.add(s.phone);
    if (s.parent?.phone) phoneNumbers.add(s.parent.phone);
  });

  const uniquePhones = Array.from(phoneNumbers).filter(Boolean);

  if (uniquePhones.length === 0) {
    return res.status(404).json({ success: false, message: 'No recipient phone numbers found for the selected cohort' });
  }

  const result = await smsService.sendBroadcastAnnouncement({
    title: title || 'School Announcement',
    content: message,
    parentPhones: uniquePhones
  });

  res.json({
    success: true,
    recipientsCount: uniquePhones.length,
    ...result
  });
});

module.exports = {
  sendSMS,
  testSMS,
  getSMSStatus,
  broadcastSMS
};
