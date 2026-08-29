require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  try {
    const { data: students, error } = await supabase.from('students').select('*');
    if (error) throw error;
    console.log(`=== STUDENTS IN SYSTEM (Total: ${students.length}) ===`);
    students.forEach(s => {
      console.log(`Name: ${s.first_name} ${s.last_name} | Grade: "${s.grade}" | Section: "${s.section}"`);
    });
  } catch (e) {
    console.error(e);
  }
}

run();
