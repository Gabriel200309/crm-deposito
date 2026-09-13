import { PermissionAction } from "@/generated/prisma/client";

// Módulos com permissões registradas. Cada fase futura (clientes, produtos,
// estoque, pedidos, financeiro, fiscal, entregas...) adiciona sua entrada aqui
// e semeia as permissões correspondentes em prisma/seed.ts.
export const MODULES = {
  USUARIOS: "usuarios",
  PERFIS: "perfis",
  DASHBOARD: "dashboard",
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const MODULE_LABELS: Record<string, string> = {
  [MODULES.USUARIOS]: "Usuários",
  [MODULES.PERFIS]: "Perfis e permissões",
  [MODULES.DASHBOARD]: "Dashboard",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  [PermissionAction.VIEW]: "Visualizar",
  [PermissionAction.CREATE]: "Criar",
  [PermissionAction.EDIT]: "Editar",
  [PermissionAction.DELETE]: "Excluir",
  [PermissionAction.APPROVE]: "Aprovar",
  [PermissionAction.CANCEL]: "Cancelar",
};

export { PermissionAction };
