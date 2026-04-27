export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatTelefone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCrp(value) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function buildStrength(password) {
  if (!password) return { score: 0, label: 'Vazia', color: '#cbd5e1' };
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score < 3) return { score, label: 'Fraca', color: '#ef4444' };
  if (score < 5) return { score, label: 'Média', color: '#f59e0b' };
  return { score, label: 'Forte', color: '#10b981' };
}
