"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUnitAction, type ActionState } from "@/lib/actions/units";

export function UnitForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createUnitAction, {
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <Input name="code" placeholder="Código (ex: UN)" required className="max-w-[140px] uppercase" maxLength={10} />
      <Input name="label" placeholder="Nome (ex: Unidade)" required className="max-w-xs" />
      <Button type="submit" variant="outline" disabled={isPending}>
        Adicionar
      </Button>
      {state.error && <p className="self-center text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
