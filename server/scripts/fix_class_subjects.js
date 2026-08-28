const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY);

async function fixClassSubjects() {
  console.log('Fetching teachers...');
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('id');
  if (tErr || !teachers || teachers.length === 0) {
    console.error('No teachers found', tErr);
    return;
  }
  const teacherIds = teachers.map(t => t.id);

  console.log('Fetching class_subjects...');
  const { data: classSubjects, error: csErr } = await supabase.from('class_subjects').select('id');
  if (csErr) {
    console.error('Error fetching class_subjects', csErr);
    return;
  }
  
  if (classSubjects && classSubjects.length > 0) {
    console.log(`Updating ${classSubjects.length} class_subjects...`);
    for (const cs of classSubjects) {
      const randomTeacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      await supabase.from('class_subjects').update({ teacher_id: randomTeacherId }).eq('id', cs.id);
    }
    console.log('Updated class_subjects successfully.');
  }

  console.log('Fetching sections...');
  const { data: sections, error: secErr } = await supabase.from('sections').select('id');
  if (secErr) {
    console.error('Error fetching sections', secErr);
    return;
  }

  if (sections && sections.length > 0) {
    console.log(`Updating ${sections.length} sections...`);
    for (const sec of sections) {
      const randomTeacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
      await supabase.from('sections').update({ class_master_id: randomTeacherId }).eq('id', sec.id);
    }
    console.log('Updated sections successfully.');
  }
}

fixClassSubjects();
