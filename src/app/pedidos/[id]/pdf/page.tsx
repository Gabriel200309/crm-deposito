import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import {
  customerDisplayName,
  customerDocument,
  CUSTOMER_TYPE_LABELS,
} from "@/lib/crm-labels";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, formatMoney } from "@/lib/order-labels";
import { calculateItemSubtotal, calculateOrderSubtotal, calculateOrderTotal } from "@/lib/order-totals";
import { PrintButton } from "./print-button";

export default async function OrderPdfPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.PEDIDOS, PermissionAction.VIEW);
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      salesperson: { include: { user: { select: { name: true } } } },
      items: { include: { product: { include: { unit: true } } } },
    },
  });
  if (!order) notFound();

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
    <div className="mx-auto max-w-3xl space-y-6 p-8 print:p-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Depósito CRM</h1>
          <p className="text-sm text-muted-foreground">
            Orçamento / Pedido #{order.number} — {ORDER_STATUS_LABELS[order.status]}
          </p>
          <p className="text-sm text-muted-foreground">
            Emitido em {new Intl.DateTimeFormat("pt-BR").format(order.createdAt)}
          </p>
        </div>
        <PrintButton />
      </div>

      <section className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
        <div>
          <p className="font-semibold">Cliente</p>
          <p>{customerDisplayName(order.customer)}</p>
          <p className="text-muted-foreground">
            {CUSTOMER_TYPE_LABELS[order.customer.type]} · {customerDocument(order.customer) || "—"}
          </p>
          <p className="text-muted-foreground">{order.customer.phone || order.customer.whatsapp || ""}</p>
        </div>
        <div>
          <p className="font-semibold">Condições</p>
          <p>Vendedor: {order.salesperson?.user.name ?? "—"}</p>
          <p>Pagamento: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</p>
          {order.paymentTerms && <p>Condição: {order.paymentTerms}</p>}
          {order.validUntil && (
            <p>Válido até: {new Intl.DateTimeFormat("pt-BR").format(order.validUntil)}</p>
          )}
        </div>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1.5">Produto</th>
            <th className="py-1.5">Qtd.</th>
            <th className="py-1.5">Preço unit.</th>
            <th className="py-1.5">Desconto</th>
            <th className="py-1.5 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-1.5">{item.product.name}</td>
              <td className="py-1.5">
                {item.quantity.toString()} {item.product.unit.code}
              </td>
              <td className="py-1.5">{formatMoney(item.unitPrice)}</td>
              <td className="py-1.5">{formatMoney(item.discount)}</td>
              <td className="py-1.5 text-right">
                {formatMoney(
                  calculateItemSubtotal({
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitPrice.toString(),
                    discount: item.discount.toString(),
                  }),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Desconto</span>
          <span>-{formatMoney(order.discount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Frete</span>
          <span>{formatMoney(order.freight)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      {order.notes && (
        <div className="border-t pt-4 text-sm">
          <p className="font-semibold">Observações</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
