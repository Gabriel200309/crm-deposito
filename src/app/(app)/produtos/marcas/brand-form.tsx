"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrandAction, type ActionState } from "@/lib/actions/brands";

export function BrandForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createBrandAction, {
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <Input name="name" placeholder="Nome da marca" required className="max-w-xs" />
      <Button type="submit" variant="outline" disabled={isPending}>
        Adicionar
      </Button>
      {state.error && <p className="self-center text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
