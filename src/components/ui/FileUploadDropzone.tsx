"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface FileUploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadDropzone({
  accept,
  multiple = true,
  maxSizeMB = 10,
  onFilesSelected,
  className,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const valid = Array.from(fileList).filter(
        (f) => f.size <= maxSizeMB * 1024 * 1024,
      );
      const mapped = valid.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      setFiles((prev) => (multiple ? [...prev, ...mapped] : mapped));
      onFilesSelected?.(valid);
    },
    [maxSizeMB, multiple, onFilesSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Upload files. ${accept || "Any file"} up to ${maxSizeMB}MB`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: isDragging
            ? "rgba(76,133,255,0.5)"
            : "rgba(255,255,255,0.06)",
          backgroundColor: isDragging
            ? "rgba(76,133,255,0.05)"
            : "rgba(255,255,255,0.01)",
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors"
      >
        <motion.div
          animate={{ scale: isDragging ? 1.1 : 1 }}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
        </motion.div>
        <p className="mt-3 text-sm font-medium">
          <span className="text-primary">Click to upload</span>{" "}
          <span className="text-muted-foreground">or drag and drop</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {accept || "Any file"} up to {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
              >
                <File className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(file.size)}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22d3a1]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  aria-label={`Remove ${file.name}`}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
