"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { PayableStatus } from "@/generated/prisma/enums";
import { markPayablePaidAction, cancelPayableAction } from "@/lib/actions/payables";

export function PayableActions({
  payableId,
  status,
  canEdit,
  canDelete,
}: {
  payableId: string;
  status: PayableStatus;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  if (status !== PayableStatus.ABERTO) return null;

  return (
    <div className="flex justify-end gap-2">
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => markPayablePaidAction(payableId))}
        >
          Marcar como pago
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Cancelar esta conta a pagar?")) return;
            startTransition(() => cancelPayableAction(payableId));
          }}
        >
          Cancelar
        </Button>
      )}
    </div>
  );
}
