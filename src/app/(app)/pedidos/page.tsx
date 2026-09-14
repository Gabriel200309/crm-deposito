import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, getSalespersonScope } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { customerDisplayName } from "@/lib/crm-labels";
import { ORDER_STATUS_LABELS, formatMoney } from "@/lib/order-labels";
import { calculateOrderTotal } from "@/lib/order-totals";
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
import type { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";

export default async function OrdersPage() {
  const actor = await requirePermission(MODULES.PEDIDOS, PermissionAction.VIEW);
  const salespersonScope = await getSalespersonScope(actor.roleId, actor.id);

  const where: Prisma.OrderWhereInput =
    salespersonScope.type === "own"
      ? { salespersonId: salespersonScope.salespersonId }
      : salespersonScope.type === "none"
        ? { id: "" } // vendedor sem perfil associado: não vê nenhum pedido
        : {};

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orçamentos e pedidos</h1>
          <p className="text-muted-foreground">
            {salespersonScope.type === "all" ? "Todos os orçamentos e pedidos." : "Seus orçamentos e pedidos."}
          </p>
        </div>
        <Button render={<Link href="/pedidos/novo" />} nativeButton={false}>
          <Plus className="mr-2 h-4 w-4" />
          Novo pedido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{orders.length} pedido(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const total = calculateOrderTotal(
                  order.items.map((item) => ({
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitPrice.toString(),
                    discount: item.discount.toString(),
                  })),
                  order.discount.toString(),
                  order.freight.toString(),
                );
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link href={`/pedidos/${order.id}`} className="font-medium hover:underline">
                        #{order.number}
                      </Link>
                    </TableCell>
                    <TableCell>{customerDisplayName(order.customer)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === OrderStatus.CANCELADO || order.status === OrderStatus.PERDIDO
                            ? "secondary"
                            : "default"
                        }
                      >
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatMoney(total)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR").format(order.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum pedido encontrado.
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
