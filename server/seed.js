require('dotenv').config();
const supabase = require('./config/supabase');
const { COLLECTIONS } = require('./services/supabaseService');

async function seed() {
  const { data: students } = await supabase.from('students').select('grade, section');
  const uniqueClasses = [...new Set(students.map(s => s.grade))].filter(Boolean);
  const uniqueSectionsByClass = {};
  
  for (const s of students) {
    if (!s.grade || !s.section) continue;
    if (!uniqueSectionsByClass[s.grade]) uniqueSectionsByClass[s.grade] = new Set();
    uniqueSectionsByClass[s.grade].add(s.section);
  }
  
  for (const className of uniqueClasses) {
    let { data: cls } = await supabase.from('academic_classes').select('*').eq('name', className).single();
    if (!cls) {
      const res = await supabase.from('academic_classes').insert({ name: className, academic_year: '2024/2025' }).select().single();
      cls = res.data;
    }
    
    if (uniqueSectionsByClass[className]) {
      for (const sectionName of uniqueSectionsByClass[className]) {
        const { data: sec } = await supabase.from('sections').select('*').eq('class_id', cls.id).eq('name', sectionName).single();
        if (!sec) {
          await supabase.from('sections').insert({ class_id: cls.id, name: sectionName, capacity: 40 });
        }
      }
    }
  }
  console.log("Seeding complete.");
}

seed();
