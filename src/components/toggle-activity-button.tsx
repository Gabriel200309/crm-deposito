"use client";

import { useTransition } from "react";
import { Check, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleActivityDoneAction } from "@/lib/actions/activities";
import type { MODULES } from "@/lib/permissions";

export function ToggleActivityButton({
  activityId,
  revalidateTo,
  module,
  done,
}: {
  activityId: string;
  revalidateTo: string;
  module: (typeof MODULES)[keyof typeof MODULES];
  done: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      title={done ? "Reabrir" : "Marcar como concluída"}
      onClick={() => startTransition(() => toggleActivityDoneAction(activityId, revalidateTo, module))}
    >
      {done ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
    </Button>
  );
}
