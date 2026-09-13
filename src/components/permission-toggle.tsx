"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setRolePermissionAction } from "@/lib/actions/roles";

export function PermissionToggle({
  roleId,
  permissionId,
  granted,
  disabled,
}: {
  roleId: string;
  permissionId: string;
  granted: boolean;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={granted}
      disabled={disabled || isPending}
      onCheckedChange={(checked) =>
        startTransition(() => setRolePermissionAction(roleId, permissionId, checked === true))
      }
    />
  );
}
