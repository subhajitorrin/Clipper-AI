"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileVideo, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface UploadZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
}

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE_MB = 500;

export function UploadZone({ selectedFile, onFileSelect, error }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndSet = (file: File) => {
    setValidationError(null);

    const isValidType =
      ACCEPTED_TYPES.includes(file.type) ||
      file.name.endsWith(".mp4") ||
      file.name.endsWith(".mov") ||
      file.name.endsWith(".webm");

    if (!isValidType) {
      setValidationError("Unsupported file format. Please upload an MP4, MOV, or WebM video.");
      onFileSelect(null);
      return;
    }

    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > MAX_FILE_SIZE_MB) {
      setValidationError(`File is too large (${sizeInMb.toFixed(1)}MB). Max limit is ${MAX_FILE_SIZE_MB}MB.`);
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  const displayError = error || validationError;

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center cursor-pointer transition-all duration-150",
            isDragging
              ? "border-white bg-[#202020]"
              : "border-[#292929] bg-[#090909]/40 hover:border-[#404040] hover:bg-[#171717]"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#171717] border border-[#292929] text-[#A3A3A3] mb-3">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-white">
            Drag and drop your video file here, or{" "}
            <span className="text-white underline underline-offset-4 font-semibold">browse</span>
          </p>
          <p className="text-xs text-[#737373] mt-1.5">
            Supported formats: MP4, MOV, WebM (up to {MAX_FILE_SIZE_MB}MB)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-[#292929] bg-[#171717] p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#202020] border border-[#292929] text-white">
              <FileVideo className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-white">{selectedFile.name}</p>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#A3A3A3] shrink-0" />
              </div>
              <p className="text-xs text-[#737373]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[#292929] px-3 py-1.5 text-xs font-medium text-[#A3A3A3] hover:border-[#404040] hover:text-white transition-colors"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#292929] text-[#737373] hover:text-white hover:border-[#404040] transition-colors"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-xs text-[#A3A3A3] bg-[#202020] border border-[#292929] px-3 py-2 rounded-lg">
          {displayError}
        </p>
      )}
    </div>
  );
}
