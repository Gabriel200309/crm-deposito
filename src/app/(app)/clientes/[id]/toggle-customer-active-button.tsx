"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleCustomerActiveAction } from "@/lib/actions/customers";

export function ToggleCustomerActiveButton({
  customerId,
  active,
}: {
  customerId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => toggleCustomerActiveAction(customerId))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
