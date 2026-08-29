require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  try {
    const classId = '19af6c13-b5c5-465c-a73e-2932dfeb1bf1';
    const { data: allocations, error: aError } = await supabase
      .from('class_subjects')
      .select('*, subject:subject_id(*)')
      .eq('class_id', classId);
    if (aError) throw aError;
    
    console.log(`=== ALLOCATIONS FOR BASIC 1 (Total: ${allocations.length}) ===`);
    allocations.forEach(a => {
      console.log(`ID: ${a.id} | Section: ${a.section} | Subject: ${a.subject?.name} (${a.subject?.code}) | TeacherID: ${a.teacher_id} | Academic Year: ${a.academic_year}`);
    });
  } catch (error) {
    console.error('Inspection failed:', error);
  }
}

run();
