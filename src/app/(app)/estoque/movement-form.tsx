"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ProductCombobox, type ProductOption } from "@/components/product-combobox";
import { StockMovementType } from "@/generated/prisma/enums";
import { STOCK_MOVEMENT_TYPE_LABELS, MANUAL_STOCK_MOVEMENT_TYPES } from "@/lib/stock-labels";
import { createStockMovementAction, type ActionState } from "@/lib/actions/stock";

export function MovementForm({
  products,
  defaultProductId,
}: {
  products: ProductOption[];
  defaultProductId?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createStockMovementAction,
    { success: false },
  );
  const [productId, setProductId] = useState(defaultProductId ?? "");
  const selected = products.find((p) => p.id === productId);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  // Reseta a seleção de produto quando o envio é bem-sucedido. Ajustar estado
  // durante a renderização (em vez de em um efeito) evita um re-render extra
  // em cascata: https://react.dev/learn/you-might-not-need-an-effect
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setProductId("");
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">Nova movimentação</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Produto</Label>
            <ProductCombobox products={products} value={productId} onChange={setProductId} name="productId" />
            {selected && (
              <p className="text-xs text-muted-foreground">
                Estoque atual: {selected.currentStock} {selected.unitCode}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select name="type" defaultValue={StockMovementType.ENTRADA}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? STOCK_MOVEMENT_TYPE_LABELS[value as StockMovementType] : "Selecione"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_STOCK_MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {STOCK_MOVEMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" step="0.001" min="0.001" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Documento relacionado</Label>
            <Input id="document" name="document" placeholder="Ex: NF 12345, Pedido de compra #45" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo / observação</Label>
            <Textarea id="reason" name="reason" rows={2} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="text-sm text-emerald-600">Movimentação registrada.</p>}
          <Button type="submit" disabled={isPending || !productId}>
            Registrar movimentação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
