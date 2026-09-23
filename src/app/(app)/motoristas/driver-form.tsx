"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionState } from "@/lib/actions/drivers";

type UserOption = { id: string; name: string; email: string };

export type DriverFormValues = {
  userId: string;
  userName?: string;
  phone?: string | null;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
};

export function DriverForm({
  action,
  users,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  users: UserOption[];
  defaultValues?: DriverFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil de motorista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "create" ? (
            <div className="space-y-2">
              <Label htmlFor="userId">Usuário</Label>
              <Select name="userId" defaultValue={users[0]?.id}>
                <SelectTrigger id="userId" className="w-full">
                  <SelectValue placeholder="Selecione um usuário">
                    {(value: string | null) => {
                      const user = users.find((u) => u.id === value);
                      return user ? `${user.name} (${user.email})` : "Selecione um usuário";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {users.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Todos os usuários ativos já têm um perfil de motorista.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Usuário</Label>
              <p className="text-sm">{defaultValues?.userName}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Placa do veículo</Label>
              <Input id="vehiclePlate" name="vehiclePlate" defaultValue={defaultValues?.vehiclePlate ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vehicleModel">Modelo do veículo</Label>
              <Input id="vehicleModel" name="vehicleModel" defaultValue={defaultValues?.vehicleModel ?? ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending || (mode === "create" && users.length === 0)}>
        {mode === "create" ? "Criar motorista" : "Salvar alterações"}
      </Button>
    </form>
  );
}
