import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PermissionAction, ModuleName } from "@/lib/permissions";

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
