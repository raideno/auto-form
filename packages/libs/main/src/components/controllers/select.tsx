import { ErrorBoundary } from "react-error-boundary";
import { Select } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";
import { startCase } from "@/components/auto-form/helpers";

export function SelectController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const options = fieldConfig.enhancedOptions ?? [];
  const { placeholder } = fieldConfig;

  const value = field.value == null ? undefined : String(field.value as string);

  return (
    <Select.Root
      size="3"
      value={value}
      disabled={ui.disabled}
      onValueChange={(v) => field.onChange(v)}
    >
      <Select.Trigger className="w-full" placeholder={placeholder} />
      <ErrorBoundary
        FallbackComponent={(props) => {
          console.error("[select-error]:", props.error);
          return <></>;
        }}
      >
        <Select.Content className="z-50">
          {options.map((option) => {
            const v = typeof option === "string" ? option : option.value;
            const label =
              typeof option === "string"
                ? startCase(option)
                : option.label || startCase(option.value);

            return (
              <Select.Item key={v} value={v}>
                {label}
              </Select.Item>
            );
          })}
        </Select.Content>
      </ErrorBoundary>
    </Select.Root>
  );
}
