import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { formatMoney } from "@/lib/order-labels";
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

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

export default async function CashFlowPage() {
  await requirePermission(MODULES.FINANCEIRO, PermissionAction.VIEW);

  const months = Array.from({ length: 6 }, (_, i) => monthRange(5 - i));

  const rows = await Promise.all(
    months.map(async ({ start, end }) => {
      const [payments, payables] = await Promise.all([
        prisma.receivablePayment.findMany({
          where: { paidAt: { gte: start, lt: end } },
          select: { amount: true },
        }),
        prisma.accountsPayable.findMany({
          where: { status: PayableStatus.PAGO, paidAt: { gte: start, lt: end } },
          select: { amount: true },
        }),
      ]);
      const entradas = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const saidas = payables.reduce((sum, p) => sum + Number(p.amount), 0);
      return { start, entradas, saidas, saldo: entradas - saidas };
    }),
  );

  const totalEntradas = rows.reduce((sum, r) => sum + r.entradas, 0);
  const totalSaidas = rows.reduce((sum, r) => sum + r.saidas, 0);

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
            <CardTitle className="text-sm text-muted-foreground">Entradas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalEntradas)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saídas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalSaidas)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatMoney(totalEntradas - totalSaidas)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.start.toISOString()}>
                  <TableCell className="font-medium capitalize">
                    {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(r.start)}
                  </TableCell>
                  <TableCell className="text-emerald-600">{formatMoney(r.entradas)}</TableCell>
                  <TableCell className="text-destructive">{formatMoney(r.saidas)}</TableCell>
                  <TableCell className={r.saldo < 0 ? "text-destructive font-medium" : "font-medium"}>
                    {formatMoney(r.saldo)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
