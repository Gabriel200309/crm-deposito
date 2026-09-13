import { Badge } from "@/components/ui/badge";
import { ACTIVITY_TYPE_LABELS } from "@/lib/crm-labels";
import { ToggleActivityButton } from "@/components/toggle-activity-button";
import type { MODULES } from "@/lib/permissions";
import type { ActivityType } from "@/generated/prisma/client";

type ActivityItem = {
  id: string;
  type: ActivityType;
  description: string;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  createdBy: { name: string } | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function ActivityTimeline({
  activities,
  revalidateTo,
  module,
}: {
  activities: ActivityItem[];
  revalidateTo: string;
  module: (typeof MODULES)[keyof typeof MODULES];
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <ul className="space-y-3">
      {activities.map((activity) => {
        const isTask = activity.dueDate !== null;
        const done = activity.completedAt !== null;
        return (
          <li key={activity.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                {isTask && (
                  <Badge variant={done ? "default" : "secondary"}>
                    {done ? "Concluída" : `Prevista para ${formatDate(activity.dueDate!)}`}
                  </Badge>
                )}
              </div>
              <p className={done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.createdBy?.name ?? "Sistema"} em {formatDate(activity.createdAt)}
              </p>
            </div>
            {isTask && (
              <ToggleActivityButton
                activityId={activity.id}
                revalidateTo={revalidateTo}
                module={module}
                done={done}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
