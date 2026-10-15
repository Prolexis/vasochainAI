// Definición y control de accesos basados en roles (RBAC) para VasoChain AI

export const ROLES = {
  ADMIN: 'ADMIN',
  COORDINADORA: 'COORDINADORA',
  AUDITOR: 'AUDITOR',
};

export function obtenerRolNormalizado(rol) {
  const r = (rol || '').toLowerCase();
  if (r.includes('admin') || r.includes('supervisor')) return ROLES.ADMIN;
  if (r.includes('coordinadora') || r.includes('presidenta') || r.includes('comit')) return ROLES.COORDINADORA;
  if (r.includes('auditor') || r.includes('fiscalizador') || r.includes('oci')) return ROLES.AUDITOR;
  return ROLES.ADMIN;
}

export const RUTAS_POR_ROL = {
  // 1. Supervisor / Administrador Municipal: Acceso total a todo el sistema
  [ROLES.ADMIN]: [
    '/',
    '/beneficiarios',
    '/entregas',
    '/simulador',
    '/controles',
    '/controles/menu',
    '/controles/dashboard',
  ],

  // 2. Presidenta / Coordinadora de Comité:
  // Operación local en comedor: Padrón de su club, registro de entregas y reparto
  [ROLES.COORDINADORA]: [
    '/beneficiarios',
    '/entregas',
    '/simulador',
  ],

  // 3. Auditor de Contraloría / OCI:
  // Fiscalización y control: Estadísticas generales, auditoría de Blockchain y reglas del arnés
  [ROLES.AUDITOR]: [
    '/',
    '/entregas',
    '/controles',
    '/controles/menu',
    '/controles/dashboard',
  ],
};

export function tieneAccesoRuta(rol, ruta) {
  const rolNorm = obtenerRolNormalizado(rol);
  const rutasPermitidas = RUTAS_POR_ROL[rolNorm] || [];
  if (ruta === '/') return rutasPermitidas.includes('/');
  return rutasPermitidas.some((r) => r !== '/' && ruta.startsWith(r));
}

export function obtenerRutaInicio(rol) {
  const rolNorm = obtenerRolNormalizado(rol);
  if (rolNorm === ROLES.COORDINADORA) return '/beneficiarios';
  return '/';
}
