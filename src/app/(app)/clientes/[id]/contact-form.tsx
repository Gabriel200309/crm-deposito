"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createContactAction, type ActionState } from "@/lib/actions/contacts";

export function ContactForm({ customerId }: { customerId: string }) {
  const action = createContactAction.bind(null, customerId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <Input name="name" placeholder="Nome" required className="sm:col-span-2" />
      <Input name="role" placeholder="Cargo" />
      <Input name="phone" placeholder="Telefone" />
      <Input name="whatsapp" placeholder="WhatsApp" />
      <Input name="email" type="email" placeholder="E-mail" className="sm:col-span-2" />
      <Button type="submit" variant="outline" disabled={isPending} className="sm:col-span-1">
        Adicionar
      </Button>
      {state.error && <p className="col-span-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
