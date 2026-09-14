"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductCombobox, type ProductOption } from "@/components/product-combobox";
import { X } from "lucide-react";
import { DeliveryType, PaymentMethod } from "@/generated/prisma/enums";
import { DELIVERY_TYPE_LABELS, PAYMENT_METHOD_LABELS, formatMoney } from "@/lib/order-labels";
import { calculateItemSubtotal, calculateOrderSubtotal, calculateOrderTotal } from "@/lib/order-totals";
import type { ActionState } from "@/lib/actions/orders";

export type OrderProductOption = ProductOption & { salePrice: string };
type CustomerOption = { id: string; name: string };
type SalespersonOption = { id: string; name: string };

export type OrderItemDraft = {
  productId: string;
  productName: string;
  unitCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export type OrderFormValues = {
  customerId: string;
  salespersonId?: string | null;
  validUntil?: string | null;
  paymentMethod: PaymentMethod;
  paymentTerms?: string | null;
  deliveryType: DeliveryType;
  deliveryAddressStreet?: string | null;
  deliveryAddressNumber?: string | null;
  deliveryAddressCity?: string | null;
  deliveryAddressState?: string | null;
  deliveryAddressZip?: string | null;
  discount?: string | null;
  freight?: string | null;
  notes?: string | null;
  items: OrderItemDraft[];
};

export function OrderForm({
  action,
  customers,
  salespeople,
  products,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  customers: CustomerOption[];
  salespeople: SalespersonOption[];
  products: OrderProductOption[];
  defaultValues?: OrderFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });

  const [customerId, setCustomerId] = useState<string | null>(defaultValues?.customerId ?? null);
  const [deliveryType, setDeliveryType] = useState(defaultValues?.deliveryType ?? DeliveryType.RETIRADA);
  const [discount, setDiscount] = useState(defaultValues?.discount ?? "0");
  const [freight, setFreight] = useState(defaultValues?.freight ?? "0");
  const [items, setItems] = useState<OrderItemDraft[]>(defaultValues?.items ?? []);
  const [selectedProductId, setSelectedProductId] = useState("");

  const subtotal = useMemo(() => calculateOrderSubtotal(items), [items]);
  const total = useMemo(() => calculateOrderTotal(items, discount || 0, freight || 0), [items, discount, freight]);

  function addProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === productId);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }
      return [
        ...current,
        {
          productId: product.id,
          productName: product.name,
          unitCode: product.unitCode,
          quantity: 1,
          unitPrice: Number(product.salePrice),
          discount: 0,
        },
      ];
    });
    setSelectedProductId("");
  }

  function updateItem(index: number, patch: Partial<OrderItemDraft>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));
  }

  const itemsJson = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    })),
  );

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      <input type="hidden" name="items" value={itemsJson} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente e vendedor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerId">Cliente</Label>
            <Select name="customerId" value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customerId" className="w-full">
                <SelectValue placeholder="Selecione o cliente">
                  {(value: string | null) => customers.find((c) => c.id === value)?.name ?? "Selecione o cliente"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salespersonId">Vendedor</Label>
            <Select name="salespersonId" defaultValue={defaultValues?.salespersonId || "none"}>
              <SelectTrigger id="salespersonId" className="w-full">
                <SelectValue placeholder="Sem vendedor">
                  {(value: string | null) => salespeople.find((s) => s.id === value)?.name ?? "Sem vendedor"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem vendedor</SelectItem>
                {salespeople.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id}>
                    {sp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">Validade do orçamento</Label>
            <Input id="validUntil" name="validUntil" type="date" defaultValue={defaultValues?.validUntil ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <ProductCombobox
                products={products}
                value={selectedProductId}
                onChange={(value) => {
                  setSelectedProductId(value);
                  addProduct(value);
                }}
                name="_productPicker"
              />
            </div>
          </div>

          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Preço unit.</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">
                      {item.productName}
                      <span className="block text-xs text-muted-foreground">{item.unitCode}</span>
                    </TableCell>
                    <TableCell className="w-24">
                      <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => updateItem(index, { discount: Number(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>{formatMoney(calculateItemSubtotal(item))}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamento e entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de pagamento</Label>
              <Select name="paymentMethod" defaultValue={defaultValues?.paymentMethod ?? PaymentMethod.OUTROS}>
                <SelectTrigger id="paymentMethod" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? PAYMENT_METHOD_LABELS[value as PaymentMethod] : "Selecione"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PaymentMethod).map((value) => (
                    <SelectItem key={value} value={value}>
                      {PAYMENT_METHOD_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Condição de pagamento</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                placeholder="Ex: à vista, 30/60/90"
                defaultValue={defaultValues?.paymentTerms ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryType">Entrega</Label>
            <Select
              name="deliveryType"
              value={deliveryType}
              onValueChange={(v) => setDeliveryType((v as DeliveryType) ?? DeliveryType.RETIRADA)}
            >
              <SelectTrigger id="deliveryType" className="w-full sm:w-64">
                <SelectValue>
                  {(value: string | null) =>
                    value ? DELIVERY_TYPE_LABELS[value as DeliveryType] : "Selecione"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.values(DeliveryType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {DELIVERY_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {deliveryType === DeliveryType.ENTREGA && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="deliveryAddressStreet">Logradouro</Label>
                <Input
                  id="deliveryAddressStreet"
                  name="deliveryAddressStreet"
                  defaultValue={defaultValues?.deliveryAddressStreet ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddressNumber">Número</Label>
                <Input
                  id="deliveryAddressNumber"
                  name="deliveryAddressNumber"
                  defaultValue={defaultValues?.deliveryAddressNumber ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddressZip">CEP</Label>
                <Input
                  id="deliveryAddressZip"
                  name="deliveryAddressZip"
                  defaultValue={defaultValues?.deliveryAddressZip ?? ""}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="deliveryAddressCity">Cidade</Label>
                <Input
                  id="deliveryAddressCity"
                  name="deliveryAddressCity"
                  defaultValue={defaultValues?.deliveryAddressCity ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddressState">UF</Label>
                <Input
                  id="deliveryAddressState"
                  name="deliveryAddressState"
                  maxLength={2}
                  className="uppercase"
                  defaultValue={defaultValues?.deliveryAddressState ?? ""}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto adicional (R$)</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freight">Frete (R$)</Label>
              <Input
                id="freight"
                name="freight"
                type="number"
                min="0"
                step="0.01"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal dos itens</span>
              <span>{formatMoney(subtotal)}</span>
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
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending || !customerId || items.length === 0}>
        {mode === "create" ? "Criar pedido" : "Salvar alterações"}
      </Button>
    </form>
  );
}
