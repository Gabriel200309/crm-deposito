"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteContactAction } from "@/lib/actions/contacts";

export function DeleteContactButton({
  customerId,
  contactId,
}: {
  customerId: string;
  contactId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() => startTransition(() => deleteContactAction(customerId, contactId))}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}
