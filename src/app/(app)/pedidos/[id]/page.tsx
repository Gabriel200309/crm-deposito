import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { customerDisplayName } from "@/lib/crm-labels";
import {
  PAYMENT_METHOD_LABELS,
  DELIVERY_TYPE_LABELS,
  isOrderEditable,
  formatMoney,
} from "@/lib/order-labels";
import { calculateItemSubtotal, calculateOrderSubtotal, calculateOrderTotal } from "@/lib/order-totals";
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
import { StatusChanger } from "./status-changer";
import { DeliveryType, OrderStatus } from "@/generated/prisma/enums";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(MODULES.PEDIDOS, PermissionAction.VIEW);
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      salesperson: { include: { user: { select: { name: true } } } },
      items: { include: { product: { include: { unit: true } } } },
      commissions: true,
    },
  });
  if (!order) notFound();

  const canEdit = await hasPermission(actor.roleId, MODULES.PEDIDOS, PermissionAction.EDIT);
  const editable = isOrderEditable(order.status);

  const subtotal = calculateOrderSubtotal(
    order.items.map((item) => ({
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discount: item.discount.toString(),
    })),
  );
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Pedido #{order.number}</h1>
            {order.status === OrderStatus.PERDIDO && <Badge variant="secondary">Perdido</Badge>}
            {order.status === OrderStatus.CANCELADO && <Badge variant="secondary">Cancelado</Badge>}
          </div>
          <Link href={`/clientes/${order.customer.id}`} className="text-muted-foreground hover:underline">
            {customerDisplayName(order.customer)}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <StatusChanger orderId={order.id} status={order.status} />
          {canEdit && editable && (
            <Button render={<Link href={`/pedidos/${order.id}/editar`} />} nativeButton={false} variant="outline">
              Editar
            </Button>
          )}
          <Button render={<Link href={`/pedidos/${order.id}/pdf`} />} nativeButton={false} variant="outline">
            Ver / imprimir
          </Button>
        </div>
      </div>

      {order.lostReason && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Motivo da perda</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{order.lostReason}</CardContent>
        </Card>
      )}
      {order.cancelReason && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Motivo do cancelamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{order.cancelReason}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd.</TableHead>
                <TableHead>Preço unit.</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>
                    {item.quantity.toString()} {item.product.unit.code}
                  </TableCell>
                  <TableCell>{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell>{formatMoney(item.discount)}</TableCell>
                  <TableCell>
                    {formatMoney(
                      calculateItemSubtotal({
                        quantity: item.quantity.toString(),
                        unitPrice: item.unitPrice.toString(),
                        discount: item.discount.toString(),
                      }),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatMoney(order.freight)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Vendedor</p>
            <p>{order.salesperson?.user.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Forma de pagamento</p>
            <p>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Condição de pagamento</p>
            <p>{order.paymentTerms || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Entrega</p>
            <p>{DELIVERY_TYPE_LABELS[order.deliveryType]}</p>
          </div>
          {order.deliveryType === DeliveryType.ENTREGA && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Endereço de entrega</p>
              <p>
                {[order.deliveryAddressStreet, order.deliveryAddressNumber].filter(Boolean).join(", ")}
                {order.deliveryAddressCity ? ` — ${order.deliveryAddressCity}` : ""}
                {order.deliveryAddressState ? `/${order.deliveryAddressState}` : ""}
                {order.deliveryAddressZip ? ` — ${order.deliveryAddressZip}` : ""}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Validade do orçamento</p>
            <p>{order.validUntil ? new Intl.DateTimeFormat("pt-BR").format(order.validUntil) : "—"}</p>
          </div>
        </CardContent>
        {order.notes && <CardContent className="border-t pt-4 text-sm whitespace-pre-wrap">{order.notes}</CardContent>}
      </Card>

      {order.commissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comissão</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {formatMoney(order.commissions[0].amount)} ({Number(order.commissions[0].rate)}% sobre{" "}
            {formatMoney(order.commissions[0].baseAmount)}) —{" "}
            {order.commissions[0].status === "PAGA" ? "Paga" : "Pendente"}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
