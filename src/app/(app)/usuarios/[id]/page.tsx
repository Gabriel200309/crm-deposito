import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateUserAction } from "@/lib/actions/users";
import { UserForm } from "../user-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.USUARIOS, PermissionAction.EDIT);
  const { id } = await params;

  const [user, roles] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar usuário</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>
      <UserForm
        action={updateUserAction.bind(null, user.id)}
        roles={roles}
        mode="edit"
        defaultValues={{ name: user.name, email: user.email, roleId: user.roleId }}
      />
    </div>
  );
}
