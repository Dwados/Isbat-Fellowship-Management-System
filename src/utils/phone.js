export function normalizePhone(input = '') {
  return String(input).trim().replace(/[\s\-().]/g, '');
}

export function isValidPhone(input = '') {
  return /^\+?\d{10,15}$/.test(normalizePhone(input));
}
