"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markCommissionPaidAction } from "@/lib/actions/commissions";

export function MarkCommissionPaidButton({ commissionId }: { commissionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => markCommissionPaidAction(commissionId))}
    >
      Marcar como paga
    </Button>
  );
}
