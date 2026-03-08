import { Switch } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";

export function SwitchController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { field, ui } = params;

  return (
    <Switch
      checked={!!field.value}
      onCheckedChange={(checked) => field.onChange(checked)}
      disabled={ui.disabled}
    />
  );
}
