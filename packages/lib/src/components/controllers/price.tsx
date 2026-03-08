import { Box, Text, TextField } from "@radix-ui/themes";

import type { ControllerParams } from "@/components/auto-form/registry";
import { cn } from "@/lib/utils";

export function PriceController(params: ControllerParams) {
  const { fieldConfig, field, ui } = params;
  const { placeholder } = fieldConfig;

  const num = (() => {
    const v = field.value as number | string | null | undefined;
    if (v == null || v === "") return NaN;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? NaN : n;
  })();

  const displayValue = Number.isNaN(num) ? "" : String(num);

  return (
    <TextField.Root
      size="3"
      type="number"
      className="text-right! pr-1 group"
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
      <TextField.Slot side="left" className="p-0!">
        <Box
          className={cn(
            "p-3 flex! items-center justify-center h-full",
            "[box-shadow:inset_-1px_0_0_var(--gray-a7)]",
            "group-focus-within:[box-shadow:inset_-2px_0_0_var(--text-field-focus-color)]"
          )}
        >
          <Text color="gray">USD</Text>
        </Box>
      </TextField.Slot>
      <TextField.Slot side="right" className="p-0!">
        <Box
          className={cn(
            "p-3 flex! items-center justify-center h-full",
            "[box-shadow:inset_1px_0_0_var(--gray-a7)]",
            "group-focus-within:[box-shadow:inset_2px_0_0_var(--text-field-focus-color)]"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16px"
            height="16px"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18 8.5V8.35417C18 6.50171 16.4983 5 14.6458 5H9.5C7.567 5 6 6.567 6 8.5C6 10.433 7.567 12 9.5 12H14.5C16.433 12 18 13.567 18 15.5C18 17.433 16.433 19 14.5 19H9.42708C7.53436 19 6 17.4656 6 15.5729V15.5M12 3V21"
              stroke="#60655e"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </Box>
      </TextField.Slot>
    </TextField.Root>
  );
}
