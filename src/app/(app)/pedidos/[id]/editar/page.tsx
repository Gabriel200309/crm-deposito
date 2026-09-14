import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateOrderAction } from "@/lib/actions/orders";
import { customerDisplayName } from "@/lib/crm-labels";
import { isOrderEditable } from "@/lib/order-labels";
import { OrderForm } from "../../order-form";

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.PEDIDOS, PermissionAction.EDIT);
  const { id } = await params;

  const [order, customers, salespeople, products] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { include: { unit: true } } } } },
    }),
    prisma.customer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.salesperson.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        internalCode: true,
        salePrice: true,
        currentStock: true,
        unit: { select: { code: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!order) notFound();
  if (!isOrderEditable(order.status)) redirect(`/pedidos/${order.id}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar pedido #{order.number}</h1>
      </div>
      <OrderForm
        action={updateOrderAction.bind(null, order.id)}
        customers={customers.map((c) => ({ id: c.id, name: customerDisplayName(c) }))}
        salespeople={salespeople.map((s) => ({ id: s.id, name: s.user.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          internalCode: p.internalCode,
          unitCode: p.unit.code,
          currentStock: p.currentStock.toString(),
          salePrice: p.salePrice.toString(),
        }))}
        mode="edit"
        defaultValues={{
          customerId: order.customerId,
          salespersonId: order.salespersonId,
          validUntil: order.validUntil ? order.validUntil.toISOString().slice(0, 10) : null,
          paymentMethod: order.paymentMethod,
          paymentTerms: order.paymentTerms,
          deliveryType: order.deliveryType,
          deliveryAddressStreet: order.deliveryAddressStreet,
          deliveryAddressNumber: order.deliveryAddressNumber,
          deliveryAddressCity: order.deliveryAddressCity,
          deliveryAddressState: order.deliveryAddressState,
          deliveryAddressZip: order.deliveryAddressZip,
          discount: order.discount.toString(),
          freight: order.freight.toString(),
          notes: order.notes,
          items: order.items.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            unitCode: item.product.unit.code,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount),
          })),
        }}
      />
    </div>
  );
}
