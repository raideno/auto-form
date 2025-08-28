import { TextField } from "@radix-ui/themes";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";

type Mode = "date" | "time" | "datetime-local";

function parseDateLike(mode: Mode, s: string): Date | undefined {
  if (!s) return undefined;
  try {
    // Keep the same behavior as before (simple Date ctor).
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  } catch {
    return undefined;
  }
}

export function createDateTimeController(mode: Mode) {
  return function DateTimeController<TFieldValues extends FieldValues>(
    params: ControllerParams<TFieldValues>
  ) {
    const { fieldConfig, field, ui } = params;
    const { placeholder } = fieldConfig;

    const inputValue =
      field.value instanceof Date
        ? // Use ISO-like value for date/datetime-local if present, or empty.
          // In many cases you may want to format this properly. Kept minimal.
          mode === "date"
          ? field.value.toISOString().slice(0, 10)
          : mode === "datetime-local"
          ? new Date(
              field.value.getTime() - field.value.getTimezoneOffset() * 60000
            )
              .toISOString()
              .slice(0, 16)
          : field.value.toTimeString().slice(0, 5)
        : typeof field.value === "string"
        ? field.value
        : "";

    return (
      <TextField.Root
        size="3"
        type={mode}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value;
          const parsed =
            mode === "date" || mode === "datetime-local"
              ? parseDateLike(mode, v)
              : // For "time" you might keep string; keeping earlier behavior
                parseDateLike(mode, v);
          field.onChange(parsed);
        }}
        onBlur={field.onBlur}
        disabled={ui.disabled}
        readOnly={ui.readOnly}
      />
    );
  };
}
