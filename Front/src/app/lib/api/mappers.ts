export const roleToUi: Record<string, 'Turista' | 'Agencia' | 'Guía' | 'Administrador'> = {
  Tourist: 'Turista',
  Agency: 'Agencia',
  Guide: 'Guía',
  Admin: 'Administrador',
};

export const userStatusToUi: Record<string, 'Activo' | 'Pendiente' | 'Suspendido'> = {
  Active: 'Activo',
  Pending: 'Pendiente',
  Suspended: 'Suspendido',
};

export const tourStatusToUi: Record<string, 'Activo' | 'Inactivo'> = {
  Active: 'Activo',
  Inactive: 'Inactivo',
};
