"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelReceivableAction } from "@/lib/actions/receivables";

export function CancelReceivableButton({ receivableId }: { receivableId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Cancelar esta conta a receber? Essa ação não pode ser desfeita.")) return;
        startTransition(() => {
          cancelReceivableAction(receivableId);
        });
      }}
    >
      Cancelar
    </Button>
  );
}
