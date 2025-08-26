import React, { useRef, useState } from "react";

import { IconButton, Text, Dialog, Flex } from "@radix-ui/themes";
import { Cross1Icon, FileIcon, UploadIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
};

const mimeToExt = (mime: string): string => {
  if (!mime) return "bin";
  const mapping: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return mapping[mime] || mime.split("/")[1] || "bin";
};

const ImageThumbnail = ({
  file,
  onClick,
}: {
  file: File;
  onClick: () => void;
}) => {
  const [thumbnail, setThumbnail] = useState<string>("");

  React.useEffect(() => {
    if (isImageFile(file)) {
      createImagePreview(file).then(setThumbnail);
    }
  }, [file]);

  if (!isImageFile(file)) {
    return (
      <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200 flex-shrink-0">
        <FileIcon color="gray" className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer rounded overflow-hidden border border-gray-200"
      onClick={onClick}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={file.name}
          className="w-8 h-8 object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center bg-gray-100">
          <FileIcon color="gray" className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export interface FileUploadProps {
  value?: Array<File>;
  onChange: (files: Array<File>) => void;
  multiple?: boolean;
  accept?: string;
  minSize?: number; // in bytes
  maxSize?: number; // in bytes
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  minSize = 1, // 1 Byte
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  placeholder = "Choose file(s) or drag and drop",
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const handleImagePreview = async (file: File) => {
    if (isImageFile(file)) {
      setIsPreviewLoading(true);
      setIsPreviewOpen(true);
      try {
        const preview = await createImagePreview(file);
        setPreviewImage(preview);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  const isDuplicateFile = (
    newFile: File,
    existingFiles: Array<File>
  ): boolean => {
    return existingFiles.some(
      (existingFile) =>
        existingFile.name === newFile.name &&
        existingFile.size === newFile.size &&
        existingFile.lastModified === newFile.lastModified
    );
  };

  const validateFiles = (
    files: FileList | Array<File>
  ): { valid: Array<File>; errors: Array<string> } => {
    const validFiles: Array<File> = [];
    const errors: Array<string> = [];

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        errors.push(
          `${file.name}: File size exceeds ${formatFileSize(maxSize)}`
        );
        return;
      }

      if (file.size < minSize) {
        errors.push(
          `${file.name}: File size must exceed ${formatFileSize(minSize)}`
        );
        return;
      }

      if (isDuplicateFile(file, value)) {
        errors.push(`${file.name}: File already uploaded`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  // Single path to process files regardless of source (input, drop, paste)
  const processFiles = (files: FileList | Array<File>) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors[0]);
      setTimeout(() => setError(""), 3000);
    }

    if (valid.length > 0) {
      const newFiles = [...value, ...valid];
      onChange(newFiles);
      setError("");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // const { valid, errors } = validateFiles(files);

    // if (errors.length > 0) {
    //   setError(errors[0]);
    //   setTimeout(() => setError(""), 3000);
    // }

    // if (valid.length > 0) {
    //   const newFiles = [...value, ...valid];
    //   onChange(newFiles);
    //   setError("");
    // }

    processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    processFiles(files);
  };

  // Handle CtrlV anywhere on the page (except when typing in inputs)
  React.useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      if (disabled) return;

      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable)
      ) {
        // Let normal text paste happen in editable controls
        return;
      }

      const dt = e.clipboardData;
      if (!dt) return;

      const files: File[] = [];

      if (dt.files && dt.files.length > 0) {
        files.push(...Array.from(dt.files));
      } else if (dt.items && dt.items.length > 0) {
        for (const item of Array.from(dt.items)) {
          if (item.kind === "file") {
            const f = item.getAsFile?.();
            if (f) {
              const needsName = !f.name || f.name.trim().length === 0;
              const name = needsName
                ? `pasted-${Date.now()}.${mimeToExt(f.type)}`
                : f.name;
              files.push(
                needsName
                  ? new File([f], name, {
                      type: f.type,
                      lastModified: Date.now(),
                    })
                  : f
              );
            }
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        processFiles(files); // reuse your existing flow
      }
    };

    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [disabled, value, onChange]);

  // Handle Ctrl+V paste of files/images as if dropped
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const dt = e.clipboardData;
    const pastedFiles: File[] = [];

    if (dt.files && dt.files.length > 0) {
      pastedFiles.push(...Array.from(dt.files));
    } else if (dt.items && dt.items.length > 0) {
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const file = item.getAsFile?.();
          if (file) {
            const needsName = !file.name || file.name.trim().length === 0;
            const name = needsName
              ? `pasted-${Date.now()}.${mimeToExt(file.type)}`
              : file.name;
            const finalized = needsName
              ? new File([file], name, {
                  type: file.type,
                  lastModified: Date.now(),
                })
              : file;
            pastedFiles.push(finalized);
          }
        }
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      processFiles(pastedFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* File List - Show uploaded files */}
      {value.length > 0 && (
        <div className="mb-3 space-y-2">
          <>
            {value.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${
                  file.lastModified || Date.now()
                }`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-solid border-[var(--gray-7)]"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <ImageThumbnail
                    file={file}
                    onClick={() => handleImagePreview(file)}
                  />
                  <div className="flex-1 min-w-0">
                    <Text size="1" color="gray">
                      {formatFileSize(file.size)}
                    </Text>
                    <Text> - </Text>
                    <Text size="2" className="font-medium truncate">
                      {file.name}
                    </Text>
                  </div>
                </div>
                <IconButton
                  type="button"
                  variant="ghost"
                  size="1"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-2"
                >
                  <Cross1Icon className="w-4 h-4" />
                </IconButton>
              </div>
            ))}
          </>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && !disabled
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-gray-400 cursor-pointer"
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
          multiple={true}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          // className="absolute inset-0 w-full h-full opacity-100 cursor-pointer"
          // style={{ fontSize: 0 }}
        />

        <div className="flex flex-col items-center space-y-2">
          <UploadIcon className="w-8 h-8 text-gray-400" />
          <div>
            <Text size="3" className="font-medium text-gray-700">
              {placeholder}
            </Text>
            <Text size="2" color="gray" className="block mt-1">
              {accept ? `Accepted: ${accept}` : "All file types accepted"} • Min{" "}
              {formatFileSize(minSize)} • Max {formatFileSize(maxSize)}
            </Text>
          </div>
        </div>
      </div>

      {/* Uploaded Files Summary */}
      {value.length > 0 && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          {value.length} file{value.length === 1 ? "" : "s"} uploaded
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog.Root
        open={isPreviewOpen}
        onOpenChange={(open) => {
          setIsPreviewOpen(open);
          if (!open) {
            setPreviewImage(null);
            setIsPreviewLoading(false);
          }
        }}
      >
        <Dialog.Content
          style={{ maxWidth: "95vw", maxHeight: "95vh", padding: 0 }}
          className="relative overflow-hidden"
        >
          {/* Close button in top right */}
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

          {/* Image container */}
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
