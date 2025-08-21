import React, { useRef, useState } from "react";

import { Button, Text } from "@radix-ui/themes";
import { Cross1Icon, FileIcon, UploadIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: Array<File>;
  onChange: (files: Array<File>) => void;
  multiple?: boolean;
  accept?: string;
  minFiles?: number;
  maxFiles?: number;
  minSize?: number; // in bytes
  maxSize?: number; // in bytes
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  multiple = false,
  accept,
  minFiles = 1,
  maxFiles = multiple ? 10 : 1,
  minSize = 10, // 10MB default
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  placeholder = multiple
    ? "Choose files or drag and drop"
    : "Choose file or drag and drop",
  className,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFiles = (
    files: FileList
  ): { valid: Array<File>; errors: Array<string> } => {
    const validFiles: Array<File> = [];
    const errors: Array<string> = [];

    Array.from(files).forEach((file) => {
      // Check file size
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

      // Check total file count
      const totalFiles = multiple ? value.length + validFiles.length : 0;
      if (totalFiles >= maxFiles) {
        errors.push(
          `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`
        );
        return;
      }

      if (totalFiles < minFiles) {
        errors.push(
          `Must have a minimum of ${minFiles} file${minFiles > 1 ? "s" : ""}`
        );
        return;
      }

      // Check for duplicates
      const isDuplicate = value.some(
        (existingFile) =>
          existingFile.name === file.name && existingFile.size === file.size
      );
      if (isDuplicate) {
        errors.push(`${file.name}: File already exists`);
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors[0]); // Show first error
      setTimeout(() => setError(""), 3000); // Clear error after 3 seconds
    }

    if (valid.length > 0) {
      const newFiles = multiple ? [...value, ...valid] : valid;
      onChange(newFiles);
      setError("");
    }

    // Reset input
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

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors[0]);
      setTimeout(() => setError(""), 3000);
    }

    if (valid.length > 0) {
      const newFiles = multiple ? [...value, ...valid] : valid;
      onChange(newFiles);
      setError("");
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
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text size="2" className="font-medium truncate">
                    {file.name}
                  </Text>
                  <Text size="1" color="gray">
                    {formatFileSize(file.size)}
                  </Text>
                </div>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="1"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-2"
                >
                  <Cross1Icon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
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
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ fontSize: 0 }} // Prevent file name from showing
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
            {multiple && (
              <Text size="2" color="gray">
                At least {minFiles} and Up to {maxFiles} files
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
