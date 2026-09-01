/**
 * Section Helper Utility
 */

export const mapSectionName = (name) => {
  if (!name) return '';
  const str = String(name).trim();
  return str.replace(/^section\s+/i, '');
};

export default {
  mapSectionName
};
