const { supabaseService, COLLECTIONS } = require('../services/supabaseService');

// Collection for settings (we'll add it to COLLECTIONS if needed, or just use a string)
const SETTINGS_COLLECTION = 'settings';

const settingsController = {
  // Get all settings
  getSettings: async (req, res) => {
    try {
      // Try to get any settings row first
      const allSettings = await supabaseService.getAll(SETTINGS_COLLECTION);
      let settings = allSettings && allSettings.length > 0 ? allSettings[0] : null;
      
      // If settings don't exist, return default values
      if (!settings) {
        settings = {
          school_name: 'UHAS-Basic School',
          school_code: 'UHAS-001',
          current_session: '2024-2025',
          current_term: 'First Term',
          vacation_date: '11 April 2025',
          resumption_date: '06 May 2025',
          grading_system: [
            { grade: 'A+', minScore: 90, maxScore: 100, gradePoint: 4.0, remark: 'Excellent' },
            { grade: 'A', minScore: 80, maxScore: 89, gradePoint: 3.5, remark: 'Very Good' },
            { grade: 'B', minScore: 70, maxScore: 79, gradePoint: 3.0, remark: 'Good' },
            { grade: 'C', minScore: 60, maxScore: 69, gradePoint: 2.0, remark: 'Credit' }
          ]
        };
        
        // Auto-create settings if empty
        try {
          const created = await supabaseService.create(SETTINGS_COLLECTION, settings);
          settings = created;
        } catch (e) {
          console.error("Could not auto-create settings row:", e.message);
          // Continue with default settings even if DB insert fails
        }
      }
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Settings Fetch Error:", error);
      res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
  },

  // Update settings
  updateSettings: async (req, res) => {
    try {
      const updateData = req.body;
      const allSettings = await supabaseService.getAll(SETTINGS_COLLECTION);
      
      let settings;
      if (allSettings && allSettings.length > 0) {
        settings = await supabaseService.update(SETTINGS_COLLECTION, allSettings[0].id, updateData);
      } else {
        settings = await supabaseService.create(SETTINGS_COLLECTION, updateData);
      }
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Settings Update Error:", error);
      res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
  }
};

module.exports = settingsController;
