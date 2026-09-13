"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleProductActiveAction } from "@/lib/actions/products";

export function ToggleProductActiveButton({
  productId,
  active,
}: {
  productId: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => toggleProductActiveAction(productId))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
