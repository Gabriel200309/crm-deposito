import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createSalespersonAction } from "@/lib/actions/salespeople";
import { SalespersonForm } from "../salesperson-form";

export default async function NewSalespersonPage() {
  await requirePermission(MODULES.VENDEDORES, PermissionAction.CREATE);

  const users = await prisma.user.findMany({
    where: { active: true, salesperson: { is: null } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo vendedor</h1>
        <p className="text-muted-foreground">
          Associe um perfil de comissão e meta a um usuário já cadastrado.
        </p>
      </div>
      <SalespersonForm action={createSalespersonAction} users={users} mode="create" />
    </div>
  );
}
