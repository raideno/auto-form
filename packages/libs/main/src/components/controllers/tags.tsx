import { Badge } from "@radix-ui/themes";
import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";
import { TagInput } from "@/components/ui/tag-input";

export function TagsController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const { placeholder, maxLength, minLength } = fieldConfig;

  const tags = Array.isArray(field.value) ? (field.value as string[]) : [];

  const disabled =
    ui.disabled || (maxLength !== undefined && tags.length >= maxLength);

  return (
    <TagInput.Root
      maxTags={maxLength}
      minTags={minLength}
      className="space-y-2"
      value={tags}
      onValueChange={(newTags) => field.onChange(newTags)}
    >
      <TagInput.Input
        size="3"
        disabled={disabled}
        readOnly={ui.readOnly}
        placeholder={placeholder}
      >
        {maxLength && (
          <TagInput.Slot side="right">
            <Badge color="gray" variant="soft">
              {tags.length} / {maxLength}
            </Badge>
          </TagInput.Slot>
        )}
      </TagInput.Input>
      <TagInput.Content />
    </TagInput.Root>
  );
}
