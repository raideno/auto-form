import type { FieldValues } from "react-hook-form";

import type { ControllerParams } from "@/components/auto-form/registry";
import { FileUpload } from "@/components/ui/file-upload";

export function FileController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const { placeholder, fileMime, fileMinSize, fileMaxSize } = fieldConfig;

  const value = field.value ? (field.value as File) : undefined;
  const accept = Array.isArray(fileMime) ? fileMime.join(",") : fileMime;

  return (
    <FileUpload
      value={value ? [value] : []}
      onChange={(files) => field.onChange(files[0] ?? undefined)}
      multiple={false}
      disabled={ui.disabled}
      placeholder={placeholder}
      accept={accept}
      minSize={fileMinSize}
      maxSize={fileMaxSize}
    />
  );
}
