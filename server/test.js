require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
  const { data: students } = await supabase.from('students').select('*').limit(5);
  console.log("Students:", students?.length);
  if(students?.length > 0) {
    console.log("Sample student grade:", students[0].grade);
    console.log("Sample student section:", students[0].section);
  }
}

test();
