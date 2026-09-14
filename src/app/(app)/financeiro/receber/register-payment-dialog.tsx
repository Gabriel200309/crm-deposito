"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod } from "@/generated/prisma/enums";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-labels";
import { registerReceivablePaymentAction, type ActionState } from "@/lib/actions/receivables";

export function RegisterPaymentDialog({
  receivableId,
  remaining,
}: {
  receivableId: string;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const action = registerReceivablePaymentAction.bind(null, receivableId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });

  // Fecha o diálogo após sucesso. Ajustar estado durante a renderização (em vez
  // de em um efeito) evita um re-render extra em cascata.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Registrar pagamento</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={remaining.toFixed(2)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Forma de pagamento</Label>
            <Select name="paymentMethod" defaultValue={PaymentMethod.PIX}>
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
            <Label htmlFor="notes">Observação</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
