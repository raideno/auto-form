import { Switch } from "@radix-ui/themes";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";

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
