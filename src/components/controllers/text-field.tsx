import { Badge, TextField } from "@radix-ui/themes";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";

export function TextFieldController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const { type, placeholder, maxLength } = fieldConfig;

  // keep the character count for text, password, url
  const showCharCount =
    ["text", "password", "url"].includes(type) && !!maxLength;

  const value =
    field.value == null
      ? ""
      : typeof field.value === "string"
      ? field.value
      : String(field.value);

  return (
    <TextField.Root
      size="3"
      type={type as "text" | "password" | "email" | "url"}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      onChange={(e) => field.onChange(e.target.value)}
      onBlur={field.onBlur}
      disabled={ui.disabled}
      readOnly={ui.readOnly}
    >
      {showCharCount && (
        <TextField.Slot side="right">
          <Badge color="gray" variant="soft">
            {String(value || "").length} / {maxLength}
          </Badge>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}
