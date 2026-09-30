import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission, getDriverScope } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { customerDisplayName } from "@/lib/crm-labels";
import { DELIVERY_STATUS_LABELS } from "@/lib/order-labels";
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
import { DeliveryStatus } from "@/generated/prisma/enums";
import { DeliveryActions } from "./delivery-actions";

const STATUS_BADGE_VARIANT: Record<DeliveryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  AGENDADA: "outline",
  EM_ROTA: "secondary",
  ENTREGUE: "default",
  FALHOU: "destructive",
  CANCELADA: "secondary",
};

export default async function DeliveriesPage() {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.VIEW);
  const scope = await getDriverScope(actor.roleId, actor.id);

  const where: Prisma.DeliveryWhereInput =
    scope.type === "own" ? { driverId: scope.driverId } : scope.type === "none" ? { id: "" } : {};

  const [deliveries, drivers] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        order: { include: { customer: true } },
        driver: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    scope.type === "all"
      ? prisma.driver.findMany({
          where: { active: true },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const driverOptions = drivers.map((d) => ({ id: d.id, name: d.user.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
        <p className="text-muted-foreground">
          {scope.type === "all" ? "Todas as entregas agendadas." : "Suas entregas atribuídas."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{deliveries.length} entrega(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Data prevista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell>
                    <Link href={`/pedidos/${delivery.orderId}`} className="font-medium hover:underline">
                      #{delivery.order.number}
                    </Link>
                  </TableCell>
                  <TableCell>{customerDisplayName(delivery.order.customer)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[delivery.order.deliveryAddressStreet, delivery.order.deliveryAddressNumber]
                      .filter(Boolean)
                      .join(", ")}
                    {delivery.order.deliveryAddressCity ? ` — ${delivery.order.deliveryAddressCity}` : ""}
                  </TableCell>
                  <TableCell>{delivery.driver?.user.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {delivery.scheduledDate ? new Intl.DateTimeFormat("pt-BR").format(delivery.scheduledDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[delivery.status]}>
                      {DELIVERY_STATUS_LABELS[delivery.status]}
                    </Badge>
                    {delivery.status === DeliveryStatus.FALHOU && delivery.failureReason && (
                      <span className="mt-1 block max-w-52 text-xs text-muted-foreground">
                        {delivery.failureReason}
                      </span>
                    )}
                    {delivery.status === DeliveryStatus.ENTREGUE && delivery.recipientName && (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Recebido por {delivery.recipientName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeliveryActions
                      deliveryId={delivery.id}
                      status={delivery.status}
                      driverId={delivery.driverId}
                      scheduledDate={delivery.scheduledDate ? delivery.scheduledDate.toISOString().slice(0, 10) : null}
                      canDispatch={scope.type === "all"}
                      drivers={driverOptions}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {deliveries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma entrega encontrada.
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
