"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionState } from "@/lib/actions/users";

type Role = { id: string; name: string };

export function UserForm({
  action,
  roles,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  roles: Role[];
  defaultValues?: { name: string; email: string; roleId: string };
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          required
        />
      </div>
      {mode === "create" && (
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="roleId">Perfil</Label>
        <Select name="roleId" defaultValue={defaultValues?.roleId}>
          <SelectTrigger id="roleId" className="w-full">
            <SelectValue placeholder="Selecione um perfil">
              {(value: string | null) =>
                roles.find((role) => role.id === value)?.name ?? "Selecione um perfil"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {mode === "create" ? "Criar usuário" : "Salvar alterações"}
      </Button>
    </form>
  );
}
