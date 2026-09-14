import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES, PermissionAction, type ModuleName } from "@/lib/permissions";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function hasPermission(
  roleId: string,
  module: ModuleName,
  action: PermissionAction,
) {
  const match = await prisma.rolePermission.findFirst({
    where: { roleId, permission: { module, action } },
    select: { roleId: true },
  });
  return match !== null;
}

/** Garante que o usuário logado tenha a permissão informada; senão redireciona. */
export async function requirePermission(module: ModuleName, action: PermissionAction) {
  const user = await requireUser();
  const allowed = await hasPermission(user.roleId, module, action);
  if (!allowed) redirect("/dashboard?erro=sem-permissao");
  return user;
}

export type SalespersonScope =
  | { type: "all" }
  | { type: "own"; salespersonId: string }
  | { type: "none" };

/**
 * Escopo de visibilidade em pedidos/comissões: quem pode excluir pedidos
 * (Gerente/Administrador) vê tudo; um Vendedor sem essa permissão vê só o
 * que está atribuído ao seu próprio perfil de vendedor — e nada, se ele nem
 * tiver um perfil de vendedor associado (nunca "ver tudo" por omissão).
 */
export async function getSalespersonScope(roleId: string, userId: string): Promise<SalespersonScope> {
  const canViewAll = await hasPermission(roleId, MODULES.PEDIDOS, PermissionAction.DELETE);
  if (canViewAll) return { type: "all" };
  const salesperson = await prisma.salesperson.findUnique({ where: { userId } });
  if (!salesperson) return { type: "none" };
  return { type: "own", salespersonId: salesperson.id };
}
