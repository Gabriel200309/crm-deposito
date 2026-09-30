"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeliveryStatus } from "@/generated/prisma/enums";
import {
  scheduleDeliveryAction,
  startRouteAction,
  completeDeliveryAction,
  failDeliveryAction,
  cancelDeliveryAction,
  type ActionState,
} from "@/lib/actions/deliveries";

type DriverOption = { id: string; name: string };

function useCloseOnSuccess(state: ActionState, setOpen: (open: boolean) => void) {
  // Fecha o diálogo após sucesso. Ajustar estado durante a renderização (em vez
  // de em um efeito) evita um re-render extra em cascata.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }
}

function ScheduleDialog({
  deliveryId,
  drivers,
  currentDriverId,
  currentScheduledDate,
  label,
}: {
  deliveryId: string;
  drivers: DriverOption[];
  currentDriverId: string | null;
  currentScheduledDate: string | null;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const action = scheduleDeliveryAction.bind(null, deliveryId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, { success: false });
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>{label}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir motorista e data</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="driverId">Motorista</Label>
            <Select name="driverId" defaultValue={currentDriverId ?? "none"}>
              <SelectTrigger id="driverId" className="w-full">
                <SelectValue placeholder="Sem motorista">
                  {(value: string | null) =>
                    value && value !== "none" ? drivers.find((d) => d.id === value)?.name ?? "Sem motorista" : "Sem motorista"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem motorista</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Data prevista</Label>
            <Input id="scheduledDate" name="scheduledDate" type="date" defaultValue={currentScheduledDate ?? ""} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteDialog({ deliveryId }: { deliveryId: string }) {
  const [open, setOpen] = useState(false);
  const action = completeDeliveryAction.bind(null, deliveryId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, { success: false });
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Marcar como entregue</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar entrega</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recebido por</Label>
            <Input id="recipientName" name="recipientName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observação</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              Confirmar entrega
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FailDialog({ deliveryId }: { deliveryId: string }) {
  const [open, setOpen] = useState(false);
  const action = failDeliveryAction.bind(null, deliveryId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, { success: false });
  useCloseOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-destructive hover:text-destructive" />}>
        Registrar falha
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar falha na entrega</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" name="reason" rows={3} required />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              Registrar falha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StartRouteButton({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          startRouteAction(deliveryId);
        })
      }
    >
      Iniciar rota
    </Button>
  );
}

function CancelDeliveryButton({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Cancelar esta entrega?")) return;
        startTransition(() => {
          cancelDeliveryAction(deliveryId);
        });
      }}
    >
      Cancelar
    </Button>
  );
}

export function DeliveryActions({
  deliveryId,
  status,
  driverId,
  scheduledDate,
  canDispatch,
  drivers,
}: {
  deliveryId: string;
  status: DeliveryStatus;
  driverId: string | null;
  scheduledDate: string | null;
  canDispatch: boolean;
  drivers: DriverOption[];
}) {
  const isOpen = status === DeliveryStatus.AGENDADA || status === DeliveryStatus.EM_ROTA;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canDispatch && (status === DeliveryStatus.AGENDADA || status === DeliveryStatus.FALHOU) && (
        <ScheduleDialog
          deliveryId={deliveryId}
          drivers={drivers}
          currentDriverId={driverId}
          currentScheduledDate={scheduledDate}
          label={status === DeliveryStatus.FALHOU ? "Reagendar" : "Atribuir"}
        />
      )}
      {status === DeliveryStatus.AGENDADA && <StartRouteButton deliveryId={deliveryId} />}
      {isOpen && <CompleteDialog deliveryId={deliveryId} />}
      {isOpen && <FailDialog deliveryId={deliveryId} />}
      {canDispatch && isOpen && <CancelDeliveryButton deliveryId={deliveryId} />}
    </div>
  );
}
