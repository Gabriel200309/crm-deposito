"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { LEAD_STAGE_LABELS, LEAD_STAGES_ORDER } from "@/lib/crm-labels";
import { changeLeadStageAction } from "@/lib/actions/leads";
import { LeadStage } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

export type LeadCardData = {
  id: string;
  title: string;
  stage: LeadStage;
  estimatedValue: string | null;
  customerName: string | null;
  responsibleName: string | null;
};

function formatCurrency(value: string | null) {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function DraggableCard({ lead }: { lead: LeadCardData }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none rounded-lg border bg-background p-3 shadow-sm",
        isDragging && "z-10 opacity-60",
      )}
    >
      <Link href={`/leads/${lead.id}`} className="space-y-1.5 block" draggable={false}>
        <p className="text-sm font-medium">{lead.title}</p>
        {lead.customerName && <p className="text-xs text-muted-foreground">{lead.customerName}</p>}
        <div className="flex items-center justify-between">
          {formatCurrency(lead.estimatedValue) && (
            <span className="text-xs font-medium">{formatCurrency(lead.estimatedValue)}</span>
          )}
          {lead.responsibleName && (
            <Badge variant="outline" className="text-[10px]">
              {lead.responsibleName}
            </Badge>
          )}
        </div>
      </Link>
    </div>
  );
}

function DroppableColumn({
  stage,
  leads,
}: {
  stage: LeadStage;
  leads: LeadCardData[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{LEAD_STAGE_LABELS[stage]}</h3>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors",
          isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30",
        )}
      >
        {leads.map((lead) => (
          <DraggableCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ leads }: { leads: LeadCardData[] }) {
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const newStage = over.id as LeadStage;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;
    startTransition(() => changeLeadStageAction(leadId, newStage));
  }

  return (
    <DndContext id="leads-kanban" sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STAGES_ORDER.map((stage) => (
          <DroppableColumn
            key={stage}
            stage={stage}
            leads={leads.filter((lead) => lead.stage === stage)}
          />
        ))}
      </div>
    </DndContext>
  );
}
