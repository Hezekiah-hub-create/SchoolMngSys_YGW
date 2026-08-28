const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY);

async function test() {
  const { data: teachers } = await supabase.from('teachers').select('*').limit(1);
  if (!teachers || teachers.length === 0) {
    console.log('No teachers found');
    return;
  }
  const teacher = teachers[0];
  console.log('Teacher:', teacher.id, teacher.first_name);

  const { data: assignments, error } = await supabase
    .from('class_subjects')
    .select(`
      *,
      subject:subject_id (*),
      class:class_id (*)
    `)
    .eq('teacher_id', teacher.id);
  
  if (error) {
    console.error('Error fetching assignments:', error);
  } else {
    console.log('Assignments:', JSON.stringify(assignments, null, 2));
  }
}
test();
