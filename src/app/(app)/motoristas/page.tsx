import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GenericToggleActiveButton } from "@/components/generic-toggle-active-button";
import { toggleDriverActiveAction } from "@/lib/actions/drivers";

export default async function DriversPage() {
  const actor = await requirePermission(MODULES.MOTORISTAS, PermissionAction.VIEW);

  const [drivers, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.driver.findMany({
      include: { user: { select: { name: true, email: true } }, _count: { select: { deliveries: true } } },
      orderBy: { createdAt: "desc" },
    }),
    hasPermission(actor.roleId, MODULES.MOTORISTAS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.MOTORISTAS, PermissionAction.EDIT),
    hasPermission(actor.roleId, MODULES.MOTORISTAS, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Motoristas</h1>
          <p className="text-muted-foreground">Cadastro de motoristas e veículos para as entregas.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/motoristas/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Novo motorista
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{drivers.length} motorista(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Entregas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    {driver.user.name}
                    <span className="block text-xs font-normal text-muted-foreground">{driver.user.email}</span>
                  </TableCell>
                  <TableCell>{driver.phone || "—"}</TableCell>
                  <TableCell>
                    {[driver.vehicleModel, driver.vehiclePlate].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>{driver._count.deliveries}</TableCell>
                  <TableCell>
                    <Badge variant={driver.active ? "default" : "secondary"}>
                      {driver.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        render={<Link href={`/motoristas/${driver.id}/editar`} />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <GenericToggleActiveButton
                        active={driver.active}
                        action={toggleDriverActiveAction.bind(null, driver.id)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum motorista cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
