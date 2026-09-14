import Link from "next/link";
import { Users, ShieldCheck, PackageSearch, Receipt, PackageX, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, hasPermission, getSalespersonScope } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/order-labels";
import { OrderStatus } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const user = await requireUser();

  const [canViewStock, canViewOrders, canViewFinance, salespersonScope] = await Promise.all([
    hasPermission(user.roleId, MODULES.ESTOQUE, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.PEDIDOS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.FINANCEIRO, PermissionAction.VIEW),
    getSalespersonScope(user.roleId, user.id),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activeUsers, roleCount, outOfStock, lowStockCandidates, ordersThisMonth, receivedThisMonth, overdueReceivables] =
    await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.role.count(),
    canViewStock ? prisma.product.count({ where: { active: true, currentStock: { lte: 0 } } }) : null,
    canViewStock
      ? prisma.product.findMany({
          where: { active: true, currentStock: { gt: 0 }, minStock: { not: null } },
          select: { currentStock: true, minStock: true },
        })
      : null,
    canViewOrders && salespersonScope.type !== "none"
      ? prisma.order.count({
          where: {
            createdAt: { gte: startOfMonth },
            status: { notIn: [OrderStatus.CANCELADO, OrderStatus.PERDIDO] },
            salespersonId: salespersonScope.type === "own" ? salespersonScope.salespersonId : undefined,
          },
        })
      : canViewOrders
        ? 0
        : null,
    canViewFinance
      ? prisma.receivablePayment
          .findMany({ where: { paidAt: { gte: startOfMonth } }, select: { amount: true } })
          .then((payments) => payments.reduce((sum, p) => sum + Number(p.amount), 0))
      : null,
    canViewFinance
      ? prisma.accountsReceivable
          .findMany({
            where: { cancelled: false, dueDate: { lt: new Date() } },
            include: { payments: { select: { amount: true } } },
          })
          .then(
            (receivables) =>
              receivables.filter(
                (r) => r.payments.reduce((sum, p) => sum + Number(p.amount), 0) < Number(r.amount),
              ).length,
          )
      : null,
  ]);
  const lowStock = lowStockCandidates?.filter((p) => Number(p.currentStock) <= Number(p.minStock)).length ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {(user.name ?? user.email ?? "").split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Visão geral do sistema. Os indicadores comerciais (vendas, estoque, financeiro e fiscal)
          serão exibidos aqui à medida que os respectivos módulos forem implementados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis cadastrados</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCount}</div>
          </CardContent>
        </Card>

        {canViewStock && (
          <Link href="/estoque">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos sem estoque</CardTitle>
                <PackageX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outOfStock}</div>
              </CardContent>
            </Card>
          </Link>
        )}

        {canViewStock && (
          <Link href="/estoque">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos com estoque baixo</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStock}</div>
              </CardContent>
            </Card>
          </Link>
        )}

        {canViewOrders && (
          <Link href="/pedidos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos do mês</CardTitle>
                <PackageSearch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordersThisMonth}</div>
              </CardContent>
            </Card>
          </Link>
        )}

        {canViewFinance && (
          <Link href="/financeiro/receber">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebido no mês</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoney(receivedThisMonth ?? 0)}</div>
              </CardContent>
            </Card>
          </Link>
        )}

        {canViewFinance && (
          <Link href="/financeiro/receber">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contas vencidas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueReceivables}</div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
