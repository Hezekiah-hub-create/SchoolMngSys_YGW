const normalizeSection = (sectionName) => {
  if (!sectionName) return 'yellow';
  const name = String(sectionName).toUpperCase().trim();
  if (name === 'A' || name === 'Y' || name === 'YELLOW' || name.startsWith('YELLOW')) return 'yellow';
  if (name === 'B' || name === 'G' || name === 'GREEN' || name.startsWith('GREEN')) return 'green';
  if (name === 'C' || name === 'R' || name === 'RED' || name.startsWith('RED')) return 'red';
  if (name === 'D' || name === 'BL' || name === 'BLUE' || name.startsWith('BLUE')) return 'blue';
  
  const stripped = name.replace(/\([^)]*\)/g, '').trim().toLowerCase();
  return stripped;
};

module.exports = { normalizeSection };
