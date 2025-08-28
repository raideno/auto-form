import { FileUpload } from "@/components/ui/file-upload";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";

export function FilesController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const { placeholder, fileMime, fileMinSize, fileMaxSize, maxLength } =
    fieldConfig;

  const files = Array.isArray(field.value)
    ? (field.value as File[])
    : field.value
    ? [field.value as File]
    : [];

  const disabled =
    ui.disabled || (maxLength ? files.length >= maxLength : false);

  const accept = Array.isArray(fileMime) ? fileMime.join(",") : fileMime;

  return (
    <FileUpload
      value={files.length ? files : undefined}
      onChange={(newFiles) => field.onChange(newFiles)}
      multiple
      disabled={disabled}
      placeholder={placeholder}
      accept={accept}
      minSize={fileMinSize}
      maxSize={fileMaxSize}
    />
  );
}
