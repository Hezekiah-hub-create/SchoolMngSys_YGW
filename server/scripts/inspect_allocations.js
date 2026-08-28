require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  try {
    const { data: tt, error: sError } = await supabase.from('timetable').select('*').limit(50);
    if (sError) throw sError;
    console.log(`=== TIMETABLE ENTRIES (Total: ${tt.length}) ===`);
    tt.forEach(row => {
      console.log(`ID: ${row.id} | Grade: ${row.grade} | Section: ${row.section} | AcadYear: ${row.academic_year}`);
    });
  } catch (error) {
    console.error('Inspection failed:', error);
  }
}

run();
