export const kgAssessments = {
  'LANGUAGE AND LITERACY': [
    'Recognizes and writes letters of the alphabets.',
    'Identifies and uses letter sounds in reading.',
    'Builds and recognizes words (2 letters, 3 letters etc).',
    'Identifies vowels from consonants.',
    'Writes legibly using proper spacing and size.',
    'Demonstrates the ability to read.',
    'Initiates own writing.',
    'Responds to stories, draws and dramatizes concepts.',
    'Demonstrates the ability to listen and to comprehend.',
    'Expresses ideas fluently when speaking and reciting rhymes.'
  ],
  'NUMERACY': [
    'Recognizes and writes numerals.',
    'Identifies shapes and patterns.',
    'Describes, names and matches sets correctly.',
    'Computes well with numbers (addition, subtraction).'
  ],
  'OUR WORLD AND OUR PEOPLE': [
    'Shows curiosity and interest in the environment.',
    'Demonstrates content knowledge.'
  ],
  'CREATIVE ACTIVITIES': [
    'Recognizes and colours different shapes.',
    'Participates in art work and creativity.',
    'Can follow and complete patterns.'
  ],
  'GENERAL CONDUCT': [
    'Is usually prepared for class.',
    'Works co-operatively.',
    'Concentrates and completes various class tasks.',
    'Completes homework.',
    'Responds well to suggestion for improvement.'
  ]
};

// Maps subject code to the assessment key
export const getKGAreas = (subjectName) => {
  if (!subjectName) return [];
  const name = subjectName.toUpperCase();
  if (name.includes('LANGUAGE') || name.includes('LITERACY')) return kgAssessments['LANGUAGE AND LITERACY'];
  if (name.includes('NUMERACY') || name.includes('MATH')) return kgAssessments['NUMERACY'];
  if (name.includes('WORLD') || name.includes('PEOPLE')) return kgAssessments['OUR WORLD AND OUR PEOPLE'];
  if (name.includes('CREATIVE') || name.includes('ART')) return kgAssessments['CREATIVE ACTIVITIES'];
  if (name.includes('CONDUCT') || name.includes('GENERAL')) return kgAssessments['GENERAL CONDUCT'];
  return [];
};
