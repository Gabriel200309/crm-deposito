import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission, getSalespersonScope } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { formatMoney } from "@/lib/order-labels";
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
import { MarkCommissionPaidButton } from "@/components/mark-commission-paid-button";
import type { Prisma } from "@/generated/prisma/client";
import { CommissionStatus } from "@/generated/prisma/enums";

export default async function CommissionsPage() {
  const actor = await requirePermission(MODULES.COMISSOES, PermissionAction.VIEW);
  const salespersonScope = await getSalespersonScope(actor.roleId, actor.id);
  const canEdit = await hasPermission(actor.roleId, MODULES.COMISSOES, PermissionAction.EDIT);

  const where: Prisma.CommissionWhereInput =
    salespersonScope.type === "own"
      ? { salespersonId: salespersonScope.salespersonId }
      : salespersonScope.type === "none"
        ? { id: "" } // vendedor sem perfil associado: não vê nenhuma comissão
        : {};

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      salesperson: { include: { user: { select: { name: true } } } },
      order: { select: { number: true, customer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const generated = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const paid = commissions
    .filter((c) => c.status === CommissionStatus.PAGA)
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const pending = generated - paid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comissões</h1>
        <p className="text-muted-foreground">
          {salespersonScope.type === "all"
            ? "Comissões de todos os vendedores."
            : "Suas comissões geradas por pedidos faturados."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissão gerada</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(generated)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paga</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(paid)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(pending)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{commissions.length} comissão(ões)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Percentual</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <Link href={`/pedidos/${commission.orderId}`} className="hover:underline">
                      #{commission.order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{commission.salesperson.user.name}</TableCell>
                  <TableCell>{formatMoney(commission.baseAmount)}</TableCell>
                  <TableCell>{Number(commission.rate)}%</TableCell>
                  <TableCell className="font-medium">{formatMoney(commission.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={commission.status === CommissionStatus.PAGA ? "default" : "secondary"}>
                      {commission.status === CommissionStatus.PAGA ? "Paga" : "Pendente"}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      {commission.status === CommissionStatus.PENDENTE && (
                        <MarkCommissionPaidButton commissionId={commission.id} />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} className="text-center text-muted-foreground">
                    Nenhuma comissão gerada ainda.
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
