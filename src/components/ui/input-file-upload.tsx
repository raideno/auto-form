import React, { useRef, useState } from "react";

import { IconButton, Text, Dialog, Flex } from "@radix-ui/themes";
import { Cross1Icon, FileIcon, UploadIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface InputFileUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  minSize?: number; // in bytes
  maxSize?: number; // in bytes
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function InputFileUpload({
  value = null,
  onChange,
  accept,
  minSize = 1, // 1 Byte
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  placeholder = "Choose file or drag and drop",
  className,
}: InputFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

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
      <motion.div
        whileHover={{ scale: 1.1, rotate: 2 }}
        whileTap={{ scale: 0.9 }}
        className="cursor-pointer rounded overflow-hidden border border-gray-200"
        onClick={onClick}
        transition={{ duration: 0.2 }}
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
      </motion.div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${formatFileSize(maxSize)}`,
      };
    }

    if (file.size < minSize) {
      return {
        valid: false,
        error: `File size must exceed ${formatFileSize(minSize)}`,
      };
    }

    return { valid: true };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only take the first file
    const { valid, error } = validateFile(file);

    if (!valid && error) {
      setError(error);
      setTimeout(() => setError(""), 3000);
    } else {
      onChange(file);
      setError("");
    }

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

    const file = files[0]; // Only take the first file
    const { valid, error } = validateFile(file);

    if (!valid && error) {
      setError(error);
      setTimeout(() => setError(""), 3000);
    } else {
      onChange(file);
      setError("");
    }
  };

  const removeFile = () => {
    onChange(null);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // If we have a file, show it as a file list item with the same styling
  if (value) {
    return (
      <div className={cn("w-full", className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-solid border-[var(--gray-7)]"
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <ImageThumbnail
              file={value}
              onClick={() => handleImagePreview(value)}
            />
            <div className="flex-1 min-w-0">
              <Text size="1" color="gray">
                {formatFileSize(value.size)}
              </Text>
              <Text> - </Text>
              <Text size="2" className="font-medium truncate">
                {value.name}
              </Text>
            </div>
          </div>
          <IconButton
            type="button"
            variant="ghost"
            size="1"
            onClick={removeFile}
            className="flex-shrink-0 ml-2"
          >
            <Cross1Icon className="w-4 h-4" />
          </IconButton>
        </motion.div>

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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center"
                >
                  <Text size="3" color="gray">
                    Loading preview...
                  </Text>
                </motion.div>
              ) : previewImage ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  src={previewImage}
                  alt="Preview"
                  className="max-w-full max-h-[90vh] object-contain"
                  style={{ maxWidth: "100%", maxHeight: "90vh" }}
                />
              ) : null}
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  // If no file, show the upload input area
  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
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
      </motion.div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
