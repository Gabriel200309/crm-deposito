"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import { changeOrderStatusAction } from "@/lib/actions/orders";
import { DeliveryType, OrderStatus } from "@/generated/prisma/enums";

const PRE_INVOICE_OPTIONS: OrderStatus[] = [
  OrderStatus.RASCUNHO,
  OrderStatus.ORCAMENTO,
  OrderStatus.AGUARDANDO_APROVACAO,
  OrderStatus.AGUARDANDO_PAGAMENTO,
  OrderStatus.PAGAMENTO_CONFIRMADO,
  OrderStatus.EM_SEPARACAO,
  OrderStatus.SEPARADO,
  OrderStatus.FATURADO,
  OrderStatus.CANCELADO,
  OrderStatus.PERDIDO,
];

// Pedidos com entrega (deliveryType = ENTREGA) avançam de Faturado em diante
// só pelo módulo Entregas (agendamento, rota, confirmação) — o seletor aqui
// fica travado nesses estágios para não ter dois lugares "donos" do status.
function optionsFor(current: OrderStatus, deliveryType: DeliveryType): OrderStatus[] {
  if (current === OrderStatus.FATURADO) {
    if (deliveryType === DeliveryType.ENTREGA) return [OrderStatus.FATURADO];
    return [OrderStatus.FATURADO, OrderStatus.EM_TRANSPORTE, OrderStatus.ENTREGUE];
  }
  if (current === OrderStatus.EM_TRANSPORTE) {
    if (deliveryType === DeliveryType.ENTREGA) return [OrderStatus.EM_TRANSPORTE];
    return [OrderStatus.EM_TRANSPORTE, OrderStatus.ENTREGUE];
  }
  if (current === OrderStatus.ENTREGUE || current === OrderStatus.CANCELADO || current === OrderStatus.PERDIDO) {
    return [current];
  }
  return PRE_INVOICE_OPTIONS;
}

export function StatusChanger({
  orderId,
  status,
  deliveryType,
}: {
  orderId: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reasonDialogStatus, setReasonDialogStatus] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState("");
  const options = optionsFor(status, deliveryType);
  const disabled = options.length === 1;

  function apply(next: OrderStatus, changeReason?: string) {
    startTransition(async () => {
      const result = await changeOrderStatusAction(orderId, next, changeReason);
      setError(result.success ? null : result.error ?? "Não foi possível alterar o status");
    });
  }

  function handleChange(next: string | null) {
    if (!next) return;
    const nextStatus = next as OrderStatus;
    if (nextStatus === OrderStatus.CANCELADO || nextStatus === OrderStatus.PERDIDO) {
      setReasonDialogStatus(nextStatus);
      return;
    }
    apply(nextStatus);
  }

  function confirmReason() {
    if (!reasonDialogStatus) return;
    apply(reasonDialogStatus, reason);
    setReasonDialogStatus(null);
    setReason("");
  }

  return (
    <div className="space-y-1">
      <Select value={status} onValueChange={handleChange} disabled={isPending || disabled}>
        <SelectTrigger className="w-64">
          <SelectValue>{(value: string | null) => ORDER_STATUS_LABELS[value as OrderStatus]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {disabled && deliveryType === DeliveryType.ENTREGA && (status === OrderStatus.FATURADO || status === OrderStatus.EM_TRANSPORTE) && (
        <p className="text-xs text-muted-foreground">Avança pelo módulo Entregas.</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={reasonDialogStatus !== null} onOpenChange={(open) => !open && setReasonDialogStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Motivo {reasonDialogStatus === OrderStatus.PERDIDO ? "da perda" : "do cancelamento"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Descreva o motivo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialogStatus(null)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmReason}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
