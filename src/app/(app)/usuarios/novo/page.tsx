import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createUserAction } from "@/lib/actions/users";
import { UserForm } from "../user-form";

export default async function NewUserPage() {
  await requirePermission(MODULES.USUARIOS, PermissionAction.CREATE);

  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo usuário</h1>
        <p className="text-muted-foreground">Cadastre um novo usuário e associe um perfil de acesso.</p>
      </div>
      <UserForm action={createUserAction} roles={roles} mode="create" />
    </div>
  );
}
