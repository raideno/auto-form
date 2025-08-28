import { InputFileUpload } from "../ui/input-file-upload";
import type { ControllerParams } from "../auto-form/registry";
import type { FieldValues } from "react-hook-form";

export function FileController<TFieldValues extends FieldValues>(
  params: ControllerParams<TFieldValues>
) {
  const { fieldConfig, field, ui } = params;
  const { placeholder, fileMime, fileMinSize, fileMaxSize } = fieldConfig;

  const value = field.value ? (field.value as File) : undefined;

  const accept = Array.isArray(fileMime) ? fileMime.join(",") : fileMime;

  return (
    <InputFileUpload
      value={value}
      onChange={(file) => field.onChange(file)}
      disabled={ui.disabled || value !== undefined}
      placeholder={placeholder}
      accept={accept}
      minSize={fileMinSize}
      maxSize={fileMaxSize}
    />
  );
}
