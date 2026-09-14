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
import { toggleSalespersonActiveAction } from "@/lib/actions/salespeople";
import { formatMoney } from "@/lib/order-labels";

export default async function SalespeoplePage() {
  const actor = await requirePermission(MODULES.VENDEDORES, PermissionAction.VIEW);

  const [salespeople, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.salesperson.findMany({
      include: { user: { select: { name: true, email: true } }, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    }),
    hasPermission(actor.roleId, MODULES.VENDEDORES, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.VENDEDORES, PermissionAction.EDIT),
    hasPermission(actor.roleId, MODULES.VENDEDORES, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground">Perfis de comissão e metas por vendedor.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/vendedores/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Novo vendedor
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{salespeople.length} vendedor(es)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Meta mensal</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salespeople.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell className="font-medium">
                    {sp.user.name}
                    <span className="block text-xs font-normal text-muted-foreground">{sp.user.email}</span>
                  </TableCell>
                  <TableCell>{sp.team || "—"}</TableCell>
                  <TableCell>{Number(sp.commissionRate)}%</TableCell>
                  <TableCell>{sp.monthlyGoal ? formatMoney(sp.monthlyGoal) : "—"}</TableCell>
                  <TableCell>{sp._count.orders}</TableCell>
                  <TableCell>
                    <Badge variant={sp.active ? "default" : "secondary"}>
                      {sp.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        render={<Link href={`/vendedores/${sp.id}/editar`} />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <GenericToggleActiveButton
                        active={sp.active}
                        action={toggleSalespersonActiveAction.bind(null, sp.id)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {salespeople.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum vendedor cadastrado.
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
