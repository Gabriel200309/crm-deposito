import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createDriverAction } from "@/lib/actions/drivers";
import { DriverForm } from "../driver-form";

export default async function NewDriverPage() {
  await requirePermission(MODULES.MOTORISTAS, PermissionAction.CREATE);

  const users = await prisma.user.findMany({
    where: { active: true, driver: { is: null } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo motorista</h1>
        <p className="text-muted-foreground">
          Associe um perfil de motorista e veículo a um usuário já cadastrado.
        </p>
      </div>
      <DriverForm action={createDriverAction} users={users} mode="create" />
    </div>
  );
}
