require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY);

const subjects = [
  { name: 'English Language', code: 'ENG', category: 'Core', description: 'GES Standard' },
  { name: 'Mathematics', code: 'MATH', category: 'Core', description: 'GES Standard' },
  { name: 'Integrated Science', code: 'SCI', category: 'Core', description: 'GES Standard' },
  { name: 'Social Studies', code: 'SST', category: 'Core', description: 'GES Standard' },
  { name: 'Computing (ICT)', code: 'ICT', category: 'Core', description: 'GES Standard' },
  { name: 'Religious & Moral Education', code: 'RME', category: 'Core', description: 'GES Standard' },
  { name: 'Ghanaian Language', code: 'GH-LANG', category: 'Core', description: 'GES Standard' },
  { name: 'Creative Arts & Design', code: 'CAD', category: 'Elective', description: 'GES Standard' },
  { name: 'Career Technology', code: 'CT', category: 'Elective', description: 'GES Standard' },
  { name: 'French', code: 'FRE', category: 'Elective', description: 'GES Standard' },
  { name: 'Our World Our People', code: 'OWOP', category: 'Core', description: 'GES Standard' },
  { name: 'History', code: 'HIST', category: 'Core', description: 'GES Standard' },
  { name: 'Physical Education', code: 'PE', category: 'Elective', description: 'GES Standard' },
  // KG Specific Subjects
  { name: 'Language and Literacy', code: 'KG-LAL', category: 'Core', description: 'KG Standard' },
  { name: 'Numeracy', code: 'KG-NUM', category: 'Core', description: 'KG Standard' },
  { name: 'Our World and Our People', code: 'KG-OWOP', category: 'Core', description: 'KG Standard' },
  { name: 'Creative Activities', code: 'KG-CA', category: 'Core', description: 'KG Standard' },
  { name: 'General Conduct', code: 'KG-GC', category: 'Core', description: 'KG Standard' },
];

async function seed() {
  console.log('Fetching existing subjects...');
  const { data: existing, error: fetchError } = await supabase.from('subjects').select('name, code');
  
  if (fetchError) {
    console.error('Error fetching existing subjects:', fetchError);
    return;
  }
  
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));
  const existingCodes = new Set(existing.map(s => s.code ? s.code.toUpperCase() : ''));
  
  const toInsert = subjects.filter(s => !existingNames.has(s.name.toLowerCase()) && !existingCodes.has(s.code.toUpperCase()));
  
  if (toInsert.length === 0) {
    console.log('All GES subjects are already present in the database.');
    return;
  }

  console.log(`Inserting ${toInsert.length} GES subjects...`);
  const { error } = await supabase.from('subjects').insert(toInsert);
  
  if (error) {
    console.error('Error inserting subjects:', error);
  } else {
    console.log('Successfully inserted standard GES subjects!');
  }
}

seed();
