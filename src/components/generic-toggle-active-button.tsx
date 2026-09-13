"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function GenericToggleActiveButton({
  active,
  action,
}: {
  active: boolean;
  action: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => action())}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
