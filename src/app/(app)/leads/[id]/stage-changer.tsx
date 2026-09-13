"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LEAD_STAGE_LABELS, LEAD_STAGES_ORDER } from "@/lib/crm-labels";
import { changeLeadStageAction } from "@/lib/actions/leads";
import { LeadStage } from "@/generated/prisma/enums";

export function StageChanger({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const [isPending, startTransition] = useTransition();
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [lostReason, setLostReason] = useState("");

  function handleChange(next: string | null) {
    if (!next) return;
    const nextStage = next as LeadStage;
    if (nextStage === LeadStage.PERDIDO) {
      setLostDialogOpen(true);
      return;
    }
    startTransition(() => changeLeadStageAction(leadId, nextStage));
  }

  function confirmLost() {
    startTransition(() => changeLeadStageAction(leadId, LeadStage.PERDIDO, lostReason));
    setLostDialogOpen(false);
  }

  return (
    <>
      <Select value={stage} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-56">
          <SelectValue>{(value: string | null) => LEAD_STAGE_LABELS[value as LeadStage]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LEAD_STAGES_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {LEAD_STAGE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da perda</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Descreva por que essa oportunidade foi perdida..."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLostDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmLost}>
              Marcar como perdido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
