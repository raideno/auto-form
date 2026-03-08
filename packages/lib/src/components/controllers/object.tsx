import { Text } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";

export function ObjectController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, renderFields } = params;
  const { objectFields } = fieldConfig;

  if (!objectFields || objectFields.length === 0) {
    return (
      <Text size="2" color="gray">
        No fields defined.
      </Text>
    );
  }

  return <>{renderFields(objectFields)}</>;
}
