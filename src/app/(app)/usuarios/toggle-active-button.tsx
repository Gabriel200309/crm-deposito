"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/lib/actions/users";

export function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => toggleUserActiveAction(userId))}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}
