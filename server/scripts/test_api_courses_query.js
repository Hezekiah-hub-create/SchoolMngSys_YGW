require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function run() {
  try {
    // Let's mimic what the backend does for course query
    let query = supabase
      .from('class_subjects')
      .select('*, subject:subject_id(*), class:class_id(*), teacher:teacher_id(*)');
    
    const { data, error } = await query;
    if (error) throw error;
    
    console.log('Total allocations returned by Supabase query:', data.length);
    
    const basic1Allocations = data.filter(c => c.class?.name === 'Basic 1');
    console.log('Total Basic 1 allocations returned:', basic1Allocations.length);
    basic1Allocations.forEach(a => {
      console.log(`- ID: ${a.id} | Subject: ${a.subject?.name} (${a.subject?.code}) | Class: ${a.class?.name} | Section: ${a.section}`);
    });
  } catch (e) {
    console.error(e);
  }
}

run();
