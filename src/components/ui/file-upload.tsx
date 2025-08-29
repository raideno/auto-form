import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Dialog, Flex, IconButton, Text, Tooltip } from "@radix-ui/themes";
import {
  Cross1Icon,
  FileIcon,
  InfoCircledIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { formatFileSize, isImageFile, mimeToExt } from "./helpers";

const ImageThumbnail = ({
  file,
  onClick,
}: {
  file: File;
  onClick: () => void;
}) => {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!isImageFile(file)) {
      setSrc("");
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!isImageFile(file)) {
    return (
      <div className="h-[var(--space-5)] w-[var(--space-5)] flex items-center justify-center bg-[var(--gray-2)] rounded-[max(var(--radius-full),var(--radius-2))] border border-[var(--gray-6)] flex-shrink-0">
        <FileIcon color="gray" className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer rounded-[max(var(--radius-full),var(--radius-2))] overflow-hidden border border-[var(--gray-6)]"
      onClick={onClick}
    >
      {src ? (
        <img
          src={src}
          alt={file.name}
          className="h-[var(--space-5)] w-[var(--space-5)] object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-[var(--space-5)] w-[var(--space-5)] flex items-center justify-center bg-[var(--gray-2)]">
          <FileIcon color="gray" className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export const UploadPreview = ({
  file,
  handleImagePreview,
  removeFile,
  disabled,
}: {
  file: File;
  handleImagePreview: () => void;
  removeFile: () => void;
  disabled?: boolean;
}) => (
  <div className="h-[var(--space-7)] flex items-center justify-between p-[var(--space-3)] bg-[var(--gray-4)] rounded-[max(var(--radius-2),var(--radius-full))] border border-solid border-[var(--gray-7)]">
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <ImageThumbnail file={file} onClick={handleImagePreview} />
      <Text as="div" size="2" className="font-medium truncate">
        {file.name}
      </Text>
      <Text as="div"> - </Text>
      <Text as="div" size="1" color="gray">
        {formatFileSize(file.size)}
      </Text>
    </div>
    <IconButton
      type="button"
      variant="ghost"
      size="1"
      onClick={removeFile}
      className="flex-shrink-0 ml-2"
      disabled={disabled}
    >
      <Cross1Icon className="w-4 h-4" />
    </IconButton>
  </div>
);

export interface FileUploadProps {
  value?: Array<File>;
  onChange: (files: Array<File>) => void;
  multiple?: boolean;
  accept?: string;
  minSize?: number;
  maxSize?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  multiple = false,
  accept,
  minSize = 1,
  maxSize = 10 * 1024 * 1024,
  disabled = false,
  placeholder = "Choose file(s) or drag and drop",
  className,
}: FileUploadProps) {
  const isMultiple = !!multiple;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const setTransientError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 3000);
  };

  const handleImagePreview = (file: File) => {
    if (!isImageFile(file)) return;
    setIsPreviewLoading(true);
    setIsPreviewOpen(true);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setIsPreviewLoading(false);
  };

  const isDuplicateFile = (a: File, list: Array<File>) =>
    list.some(
      (b) =>
        b.name === a.name &&
        b.size === a.size &&
        b.lastModified === a.lastModified
    );

  const validateFiles = (
    files: FileList | Array<File>
  ): { valid: Array<File>; errors: Array<string> } => {
    const valid: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((f) => {
      if (f.size > maxSize) {
        errors.push(`${f.name}: File size exceeds ${formatFileSize(maxSize)}`);
      } else if (f.size < minSize) {
        errors.push(
          `${f.name}: File size must exceed ${formatFileSize(minSize)}`
        );
      } else if (isMultiple && isDuplicateFile(f, value)) {
        errors.push(`${f.name}: File already uploaded`);
      } else {
        valid.push(f);
      }
    });

    return { valid, errors };
  };

  const processFiles = (files: FileList | Array<File>) => {
    const { valid, errors } = validateFiles(files);
    if (errors.length) setTransientError(errors[0]);

    if (!valid.length) return;

    if (isMultiple) {
      onChange([...value, ...valid]);
    } else {
      onChange([valid[0]]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files.length) {
      processFiles(
        isMultiple ? e.dataTransfer.files : [e.dataTransfer.files[0]]
      );
    }
  };

  const filesFromDT = (dt: DataTransfer | null): File[] => {
    if (!dt) return [];
    if (dt.files && dt.files.length)
      return Array.from(isMultiple ? dt.files : [dt.files[0]]);

    const out: File[] = [];
    if (dt.items && dt.items.length) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const f = item.getAsFile?.();
          if (f) {
            const needsName = !f.name || !f.name.trim();
            const named = needsName
              ? new File([f], `pasted-${Date.now()}.${mimeToExt(f.type)}`, {
                  type: f.type,
                  lastModified: Date.now(),
                })
              : f;
            out.push(named);
            if (!isMultiple) break;
          }
        }
      }
    }
    return out;
  };

  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        return;
      }
      const files = filesFromDT(e.clipboardData || null);
      if (files.length) {
        e.preventDefault();
        processFiles(files);
      }
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [disabled, value, onChange, minSize, maxSize, isMultiple]);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const files = filesFromDT(e.clipboardData || null);
    if (files.length) {
      e.preventDefault();
      processFiles(files);
    }
  };

  const removeAtIndex = (i: number) => {
    // if (disabled) return;
    onChange(value.filter((_, idx) => idx !== i));
  };

  const clearSingle = () => {
    if (disabled) return;
    onChange([]);
  };

  const openFileDialog = () => !disabled && fileInputRef.current?.click();

  const acceptSummary = accept
    ? `Accepted: ${accept}`
    : "All file types accepted";

  // Single-file current
  const current = !isMultiple && value.length ? value[0] : undefined;

  return (
    <div className={cn("w-full", className)}>
      {isMultiple ? (
        <>
          {value.length > 0 && (
            <div className="mb-3 space-y-2">
              {value.map((file, index) => (
                <UploadPreview
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  file={file}
                  handleImagePreview={() => handleImagePreview(file)}
                  removeFile={() => removeAtIndex(index)}
                  // disabled={disabled}
                />
              ))}
            </div>
          )}

          <div className="bg-[var(--accent-9)] border-[var(--gray-7)]"></div>

          <div
            className={cn(
              "rounded-[max(var(--radius-2),var(--radius-full))] p-6 relative text-center transition-colors",
              "border-2 border-dashed border-[var(--gray-7)] bg-[var(--gray-2)]",
              "hover:border-[var(--gray-9)] cursor-pointer",
              dragActive &&
                !disabled &&
                "border-[var(--accent-9)] bg-[var(--accent-9)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            tabIndex={0}
            onPaste={handlePaste}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={isMultiple}
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
            <div className="flex flex-col items-center space-y-2">
              <UploadIcon color="gray" className="w-8 h-8" />
              <div>
                <Text size="3" className="font-medium">
                  {placeholder}
                </Text>
                <Text size="2" color="gray" className="block mt-1">
                  {acceptSummary} • Min {formatFileSize(minSize)} • Max{" "}
                  {formatFileSize(maxSize)}
                </Text>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {current ? (
            <div className="space-y-2">
              <UploadPreview
                file={current}
                handleImagePreview={() => handleImagePreview(current)}
                removeFile={clearSingle}
                disabled={disabled}
              />
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center justify-between",
                "h-[var(--space-7)] p-[var(--space-3)] rounded-[max(var(--radius-2),var(--radius-full))]",
                "border border-[var(--gray-7)] bg-[var(--gray-2)] hover:border-[var(--gray-4)] cursor-pointer",
                dragActive &&
                  !disabled &&
                  "border-[var(--accent-7)] bg-[var(--accent-2)]",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              tabIndex={0}
              onPaste={handlePaste}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={false}
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
              />
              <div className="w-full flex flex-row items-center justify-between gap-2">
                <div className="flex flex-row items-center gap-2">
                  <UploadIcon color="gray" />
                  <Text size="3" color="gray" className="font-medium">
                    {placeholder}
                  </Text>
                </div>
                <Tooltip
                  content={`Accepted: ${
                    accept || "All file types"
                  } • Min ${formatFileSize(minSize)} • Max ${formatFileSize(
                    maxSize
                  )}`}
                >
                  <InfoCircledIcon />
                </Tooltip>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-2 p-2 bg-[var(--red-4)] border border-[var(--red-2)] rounded text-sm text-[var(--red-9)]">
          {error}
        </div>
      )}

      <Dialog.Root
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (!open) {
            if (previewImage) URL.revokeObjectURL(previewImage);
            setPreviewImage(null);
            setIsPreviewLoading(false);
          }
        }}
      >
        <Dialog.Content
          style={{ maxWidth: "95vw", maxHeight: "95vh", padding: 0 }}
          className="relative overflow-hidden"
        >
          <Dialog.Close>
            <IconButton
              variant="soft"
              color="gray"
              size="2"
              className="absolute top-4 right-4 z-10"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                zIndex: 10,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(4px)",
              }}
            >
              <Cross1Icon />
            </IconButton>
          </Dialog.Close>

          <Dialog.Title className="sr-only">Image Preview</Dialog.Title>
          <Dialog.Description className="sr-only">
            Image Preview
          </Dialog.Description>

          <Flex
            justify="center"
            align="center"
            className="min-h-[300px] bg-black/5"
            style={{ minHeight: "300px" }}
          >
            {isPreviewLoading ? (
              <div className="flex items-center justify-center">
                <Text size="3" color="gray">
                  Loading preview...
                </Text>
              </div>
            ) : previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain"
                style={{ maxWidth: "100%", maxHeight: "90vh" }}
              />
            ) : null}
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}
