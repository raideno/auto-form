import { TextArea } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";
import { cn } from "@/lib/utils";

export function TextAreaController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, meta, ui } = params;
  const { placeholder, maxLength } = fieldConfig;

  const value = typeof field.value === "string" ? field.value : "";
  const resize = meta?.type === "textarea" && "resize" in meta && !!meta.resize;

  return (
    <TextArea
      size="3"
      placeholder={placeholder}
      className={cn("min-h-[80px]", resize && "resize-y")}
      maxLength={maxLength}
      value={value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      disabled={ui.disabled}
      readOnly={ui.readOnly}
    />
  );
}
