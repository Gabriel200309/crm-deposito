import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { PAYABLE_STATUS_LABELS } from "@/lib/finance-labels";
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
import { PayableStatus } from "@/generated/prisma/enums";
import { FinanceSubNav } from "../finance-subnav";
import { NewPayableDialog } from "./new-payable-dialog";
import { PayableActions } from "./payable-actions";

export default async function AccountsPayablePage() {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.VIEW);
  const canCreate = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.CREATE);
  const canEdit = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.EDIT);
  const canDelete = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.DELETE);

  const payables = await prisma.accountsPayable.findMany({
    orderBy: { dueDate: "asc" },
  });

  const totalAberto = payables
    .filter((p) => p.status === PayableStatus.ABERTO)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPago = payables
    .filter((p) => p.status === PayableStatus.PAGO)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">Contas a receber, contas a pagar e fluxo de caixa.</p>
      </div>

      <FinanceSubNav />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Em aberto</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalAberto)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Pago</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalPago)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{payables.length} conta(s) a pagar</CardTitle>
          {canCreate && <NewPayableDialog />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.description}</TableCell>
                  <TableCell>{p.supplierName ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR").format(p.dueDate)}
                  </TableCell>
                  <TableCell>{formatMoney(p.amount)}</TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[p.paymentMethod]}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === PayableStatus.PAGO
                          ? "default"
                          : p.status === PayableStatus.CANCELADO
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {PAYABLE_STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PayableActions
                      payableId={p.id}
                      status={p.status}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {payables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma conta a pagar encontrada.
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
