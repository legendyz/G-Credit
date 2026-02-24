import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { ALLOWED_EXTENSIONS, MAX_EVIDENCE_ITEMS, validateEvidenceFile } from '@/lib/evidenceApi';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  currentCount: number;
}

/**
 * Drag & drop + browse file upload zone for evidence files.
 * Validates file type + size, enforces max count.
 */
const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  disabled = false,
  currentCount,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_EVIDENCE_ITEMS - currentCount;
  const isDisabled = disabled || remaining <= 0;

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const files = Array.from(fileList);
      const valid: File[] = [];

      for (const file of files) {
        if (valid.length + currentCount >= MAX_EVIDENCE_ITEMS) {
          toast.warning(`Maximum ${MAX_EVIDENCE_ITEMS} evidence items reached`);
          break;
        }
        const error = validateEvidenceFile(file);
        if (error) {
          toast.error(error);
        } else {
          valid.push(file);
        }
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [currentCount, onFilesSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) setIsDragOver(true);
    },
    [isDisabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (isDisabled) return;
      processFiles(e.dataTransfer.files);
    },
    [isDisabled, processFiles]
  );

  const handleBrowse = useCallback(() => {
    if (!isDisabled) inputRef.current?.click();
  }, [isDisabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [processFiles]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowse}
      className={`
        relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer
        ${
          isDisabled
            ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
            : isDragOver
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-neutral-300 bg-white text-neutral-600 hover:border-brand-400 hover:bg-neutral-50'
        }
      `}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label="Upload evidence files"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBrowse();
        }
      }}
    >
      <Upload className="h-6 w-6" />
      <div className="text-sm text-center">
        <span className="font-medium">
          {isDisabled ? 'Upload limit reached' : 'Drag files here or browse'}
        </span>
        <p className="text-xs mt-1 text-neutral-500">PDF, PNG, JPG, DOCX (max 10MB each)</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS}
        className="hidden"
        onChange={handleInputChange}
        disabled={isDisabled}
        aria-hidden="true"
      />
    </div>
  );
};

export default FileUploadZone;
