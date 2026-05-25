export const ROLE_PRIMARY_COLOR = '#1B66A4';
export const DEFAULT_PRIMARY_COLOR = '#1d4ed8';
export const CLIENT_DRAWER_COLOR = '#1B66A4';

export function isPsicologoRole(role) {
  const roleId = Number(role?.id);
  const roleName = String(role?.role || role || '').toUpperCase();

  return roleId === 1 || roleId === 3 || roleName === 'PSICOLOGO' || roleName === 'PSICOLOGO_ASSISTENTE' || roleName === 'PSYCHOLOGIST' || roleName === 'ADMIN';
}

export function isClienteRole(role) {
  const roleId = Number(role?.id);
  const roleName = String(role?.role || role || '').toUpperCase();

  return roleId === 2 || roleName === 'CLIENTE' || roleName === 'USER';
}

export function getPrimaryColorForRole(role) {
  return isPsicologoRole(role) ? ROLE_PRIMARY_COLOR : DEFAULT_PRIMARY_COLOR;
}

export function getDrawerColorForRole(role) {
  if (isClienteRole(role)) return CLIENT_DRAWER_COLOR;
  if (isPsicologoRole(role)) return ROLE_PRIMARY_COLOR;
  return DEFAULT_PRIMARY_COLOR;
}
