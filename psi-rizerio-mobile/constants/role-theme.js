export const ROLE_PRIMARY_COLOR = '#1B66A4'; // Azul (Profissional)
export const DEFAULT_PRIMARY_COLOR = '#db2777'; // Rosa (Paciente)
export const CLIENT_DRAWER_COLOR = '#db2777';

/**
 * Normaliza o role recebido para uma string comparável.
 * O backend retorna: "ADMIN", "PSYCHOLOGIST", "USER"
 * O mock retorna: { id: 1, role: "PSICOLOGO" } ou strings legadas
 */
function getRoleName(role) {
  if (!role) return '';
  if (typeof role === 'string') return role.toUpperCase().trim();
  if (typeof role === 'object') {
    return String(role?.role || '').toUpperCase().trim();
  }
  return '';
}

export function isAdminRole(role) {
  const name = getRoleName(role);
  return name === 'ADMIN';
}

export function isPsicologoRole(role) {
  const name = getRoleName(role);
  const id = Number(role?.id);
  return (
    id === 1 || id === 3 ||
    name === 'PSICOLOGO' ||
    name === 'PSICOLOGO_ASSISTENTE' ||
    name === 'PSYCHOLOGIST' ||
    name === 'ADMIN'
  );
}

export function isClienteRole(role) {
  const name = getRoleName(role);
  const id = Number(role?.id);
  return (
    id === 2 ||
    name === 'CLIENTE' ||
    name === 'USER' ||
    name === 'PATIENT'
  );
}

export function getPrimaryColorForRole(role) {
  return isPsicologoRole(role) ? ROLE_PRIMARY_COLOR : DEFAULT_PRIMARY_COLOR;
}

export function getDrawerColorForRole(role) {
  if (isClienteRole(role)) return CLIENT_DRAWER_COLOR;
  if (isPsicologoRole(role)) return ROLE_PRIMARY_COLOR;
  return DEFAULT_PRIMARY_COLOR;
}
