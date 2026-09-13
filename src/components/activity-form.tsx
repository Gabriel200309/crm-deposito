"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityType } from "@/generated/prisma/enums";
import { ACTIVITY_TYPE_LABELS } from "@/lib/crm-labels";
import type { ActionState } from "@/lib/actions/activities";

export function ActivityForm({
  action,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select name="type" defaultValue={ActivityType.NOTA}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue>
              {(value: string | null) =>
                value ? ACTIVITY_TYPE_LABELS[value as ActivityType] : "Tipo"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(ActivityType).map((value) => (
              <SelectItem key={value} value={value}>
                {ACTIVITY_TYPE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input name="dueDate" type="date" className="w-full sm:w-44" title="Data prevista (opcional)" />
      </div>
      <Textarea name="description" placeholder="Descreva o contato ou observação..." rows={2} required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        Registrar atividade
      </Button>
    </form>
  );
}
