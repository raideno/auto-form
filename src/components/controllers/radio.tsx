import { Flex, RadioCards, Text } from "@radix-ui/themes";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";
import { startCase } from "../auto-form/helpers";

export function RadioController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const options = fieldConfig.enhancedOptions ?? [];

  const value = field.value == null ? undefined : String(field.value as string);

  return (
    <RadioCards.Root
      size="3"
      value={value}
      disabled={ui.disabled}
      onValueChange={(v) => field.onChange(v)}
    >
      {options.map((option) => {
        const v = typeof option === "string" ? option : option.value;
        const label =
          typeof option === "string"
            ? startCase(option)
            : option.label || startCase(option.value);
        const description =
          typeof option === "string" ? undefined : option.description;

        return (
          <RadioCards.Item key={v} value={v}>
            <Flex direction="column" width="100%">
              <Text weight="bold">{label}</Text>
              {description && (
                <Text size="2" color="gray">
                  {description}
                </Text>
              )}
            </Flex>
          </RadioCards.Item>
        );
      })}
    </RadioCards.Root>
  );
}
