import { Button, Text } from "@radix-ui/themes";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams, FieldConfigBase } from "@/components/auto-form/registry";

export function ArrayOfObjectsController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, renderFields, ui } = params;
  const { arrayObjectFields, maxLength, minLength } = fieldConfig;

  const items = Array.isArray(field.value) ? (field.value as Record<string, unknown>[]) : [];

  if (!arrayObjectFields || arrayObjectFields.length === 0) {
    return (
      <Text size="2" color="gray">
        No fields defined.
      </Text>
    );
  }

  const canAdd = !ui.disabled && !ui.readOnly && (maxLength === undefined || items.length < maxLength);
  const canRemove = !ui.disabled && !ui.readOnly && (minLength === undefined || items.length > minLength);

  const handleAdd = () => {
    const emptyItem = arrayObjectFields.reduce<Record<string, unknown>>(
      (acc, f) => {
        acc[f.key] = undefined;
        return acc;
      },
      {}
    );
    field.onChange([...items, emptyItem]);
  };

  const handleRemove = (index: number) => {
    field.onChange(items.filter((_, i) => i !== index));
  };

  const indexedFields = (index: number): FieldConfigBase[] =>
    arrayObjectFields.map((f) => ({
      ...f,
      key: `${field.name}.${index}.${f.key}`,
    }));

  return (
    <div className="flex flex-col gap-3 w-full">
      {items.length === 0 && (
        <Text size="2" color="gray">
          No items yet.
        </Text>
      )}
      {items.map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 p-3 rounded-3 border border-(--gray-a6) w-full"
        >
          <div className="flex flex-row items-center justify-between">
            <Text size="2" weight="medium" color="gray">
              Item {index + 1}
            </Text>
            {canRemove && (
              <Button
                type="button"
                size="1"
                variant="ghost"
                color="red"
                onClick={() => handleRemove(index)}
              >
                <TrashIcon />
                Remove
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full">
            {renderFields(indexedFields(index)) as React.ReactNode}
          </div>
        </div>
      ))}
      {canAdd && (
        <Button
          type="button"
          size="2"
          variant="soft"
          onClick={handleAdd}
          className="self-start"
        >
          <PlusIcon />
          Add item
        </Button>
      )}
    </div>
  );
}
