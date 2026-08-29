require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  try {
    const { data: allocations, error: aError } = await supabase
      .from('class_subjects')
      .select('*, class:class_id(*), subject:subject_id(*), teacher:teacher_id(*)');
    if (aError) throw aError;
    const assigned = allocations.filter(a => a.teacher_id !== null);
    console.log(`=== ASSIGNED ALLOCATIONS (Total: ${assigned.length}) ===`);
    assigned.forEach(alloc => {
      console.log(`ID: ${alloc.id} | Grade: ${alloc.class?.name} | Section: ${alloc.section} | Subject: ${alloc.subject?.name} | Teacher: ${alloc.teacher ? (alloc.teacher.first_name + ' ' + alloc.teacher.last_name) : 'UNKNOWN'}`);
    });
  } catch (error) {
    console.error('Inspection failed:', error);
  }
}

run();
