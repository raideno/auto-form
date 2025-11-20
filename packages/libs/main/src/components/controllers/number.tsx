import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";
import { IconButton, TextField } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";

export function NumberController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, meta, ui } = params;
  const { placeholder, greaterThan, lessThan } = fieldConfig;

  const showControls = !!meta?.withControls;

  const num = (() => {
    const v = field.value as number | string | null | undefined;
    if (v == null || v === "") return NaN;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? NaN : n;
  })();

  const displayValue = Number.isNaN(num) ? "" : String(num);
  const step = meta?.step || 1;

  const decDisabled =
    ui.disabled ||
    ui.readOnly ||
    (greaterThan
      ? greaterThan.inclusive
        ? !Number.isNaN(num) && num <= greaterThan.value
        : !Number.isNaN(num) && num < greaterThan.value
      : false);

  const incDisabled =
    ui.disabled ||
    ui.readOnly ||
    (lessThan
      ? lessThan.inclusive
        ? !Number.isNaN(num) && num >= lessThan.value
        : !Number.isNaN(num) && num > lessThan.value
      : false);

  return (
    <TextField.Root
      size="3"
      type="number"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => {
        const v = e.target.value;
        field.onChange(v === "" ? undefined : Number(v));
      }}
      onBlur={field.onBlur}
      disabled={ui.disabled}
      readOnly={ui.readOnly}
    >
      {showControls && (
        <TextField.Slot side="right">
          <div className="flex items-center gap-1">
            <IconButton
              variant="soft"
              size="1"
              type="button"
              disabled={decDisabled}
              onClick={(e) => {
                e.preventDefault();
                const curr = Number.isNaN(num) ? 0 : num;
                const next = !greaterThan
                  ? curr - step
                  : Math.max(curr - step, greaterThan.value);
                field.onChange(next);
              }}
              aria-label="Decrement"
              title="Decrement"
            >
              <MinusIcon />
            </IconButton>
            <IconButton
              variant="soft"
              size="1"
              type="button"
              disabled={incDisabled}
              onClick={(e) => {
                e.preventDefault();
                const curr = Number.isNaN(num) ? 0 : num;
                const next = !lessThan
                  ? curr + step
                  : Math.min(curr + step, lessThan.value);
                field.onChange(next);
              }}
              aria-label="Increment"
              title="Increment"
            >
              <PlusIcon />
            </IconButton>
          </div>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}
