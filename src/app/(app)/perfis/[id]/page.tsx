import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, MODULE_LABELS, ACTION_LABELS, PermissionAction } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionToggle } from "@/components/permission-toggle";

export default async function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.PERFIS, PermissionAction.VIEW);
  const { id } = await params;

  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { select: { permissionId: true } } },
  });
  if (!role) notFound();

  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });

  const grantedIds = new Set(role.permissions.map((p) => p.permissionId));

  const byModule = new Map<string, typeof allPermissions>();
  for (const permission of allPermissions) {
    const list = byModule.get(permission.module) ?? [];
    list.push(permission);
    byModule.set(permission.module, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{role.name}</h1>
        <p className="text-muted-foreground">{role.description ?? "Defina as permissões deste perfil por módulo."}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...byModule.entries()].map(([moduleName, permissions]) => (
          <Card key={moduleName}>
            <CardHeader>
              <CardTitle className="text-base">{MODULE_LABELS[moduleName] ?? moduleName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between">
                  <span className="text-sm">{ACTION_LABELS[permission.action]}</span>
                  <PermissionToggle
                    roleId={role.id}
                    permissionId={permission.id}
                    granted={grantedIds.has(permission.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
