import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { customerDisplayName } from "@/lib/crm-labels";
import { formatMoney } from "@/lib/order-labels";
import { computeReceivableStatus, RECEIVABLE_STATUS_LABELS, type ReceivableComputedStatus } from "@/lib/finance-labels";
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
import { FinanceSubNav } from "../finance-subnav";
import { RegisterPaymentDialog } from "./register-payment-dialog";
import { CancelReceivableButton } from "./cancel-receivable-button";

const STATUS_BADGE_VARIANT: Record<ReceivableComputedStatus, "default" | "secondary" | "destructive" | "outline"> = {
  ABERTO: "outline",
  PARCIALMENTE_PAGO: "secondary",
  PAGO: "default",
  VENCIDO: "destructive",
  CANCELADO: "secondary",
};

export default async function AccountsReceivablePage() {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.VIEW);
  const canEdit = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.EDIT);
  const canDelete = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.DELETE);

  const receivables = await prisma.accountsReceivable.findMany({
    include: { customer: true, order: { select: { number: true } }, payments: true },
    orderBy: { dueDate: "asc" },
  });

  const rows = receivables.map((r) => {
    const totalPaid = r.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const status = computeReceivableStatus({
      amount: r.amount.toString(),
      dueDate: r.dueDate,
      totalPaid,
      cancelled: r.cancelled,
    });
    const remaining = Math.max(0, Number(r.amount) - totalPaid);
    return { ...r, totalPaid, status, remaining };
  });

  const totalAberto = rows
    .filter((r) => r.status === "ABERTO" || r.status === "PARCIALMENTE_PAGO")
    .reduce((sum, r) => sum + r.remaining, 0);
  const totalVencido = rows.filter((r) => r.status === "VENCIDO").reduce((sum, r) => sum + r.remaining, 0);
  const totalRecebido = rows.reduce((sum, r) => sum + r.totalPaid, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Contas a receber, contas a pagar e fluxo de caixa.</p>
      </div>

      <FinanceSubNav />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Em aberto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalAberto)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Vencido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-destructive">{formatMoney(totalVencido)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Recebido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalRecebido)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{rows.length} conta(s) a receber</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link href={`/pedidos/${r.orderId}`} className="font-medium hover:underline">
                      #{r.order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{customerDisplayName(r.customer)}</TableCell>
                  <TableCell>
                    {r.installmentNumber}/{r.installmentsTotal}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR").format(r.dueDate)}
                  </TableCell>
                  <TableCell>{formatMoney(r.amount)}</TableCell>
                  <TableCell>{formatMoney(r.remaining)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[r.status]}>{RECEIVABLE_STATUS_LABELS[r.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && r.status !== "PAGO" && r.status !== "CANCELADO" && (
                        <RegisterPaymentDialog receivableId={r.id} remaining={r.remaining} />
                      )}
                      {canDelete && r.status !== "PAGO" && r.status !== "CANCELADO" && (
                        <CancelReceivableButton receivableId={r.id} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma conta a receber encontrada.
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
