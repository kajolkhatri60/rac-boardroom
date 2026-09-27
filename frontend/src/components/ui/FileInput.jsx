import React, { useRef, useState } from 'react';
import { FileText, Upload, RefreshCw } from 'lucide-react';
import Button from './Button';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FileInput({
  id,
  name,
  file,
  onChange,
  onError,
  maxSizeMB = 5,
  disabled = false,
  required = false,
  error = null,
  className = '',
}) {
  const inputRef = useRef(null);
  const [internalFile, setInternalFile] = useState(null);
  const [internalError, setInternalError] = useState(null);

  const currentFile = file !== undefined ? file : internalFile;
  const displayError = error || internalError;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check PDF extension / mime
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      const err = 'Only PDF files are accepted.';
      setInternalError(err);
      if (onError) onError(err);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      const err = `The file is larger than ${maxSizeMB} MB.`;
      setInternalError(err);
      if (onError) onError(err);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setInternalError(null);
    if (onError) onError(null);
    setInternalFile(selectedFile);
    if (onChange) onChange(selectedFile);
  };

  const handleReplace = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept=".pdf,application/pdf"
        disabled={disabled}
        required={required}
        onChange={handleFileChange}
        className="sr-only"
        aria-invalid={displayError ? 'true' : undefined}
      />

      {currentFile ? (
        <div className="flex items-center justify-between p-3 bg-paper border border-rule rounded">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-desk flex items-center justify-center shrink-0 text-ink">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text truncate max-w-[280px] sm:max-w-md">
                {currentFile.name}
              </p>
              <p className="text-xs text-muted tabular-nums">
                {formatFileSize(currentFile.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleReplace}
            disabled={disabled}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Replace
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border border-dashed rounded bg-paper cursor-pointer transition-colors ${
            displayError
              ? 'border-bad bg-bad-bg/30'
              : 'border-rule hover:bg-desk focus:outline-2 focus:outline-focus'
          } ${disabled ? 'cursor-not-allowed opacity-60 bg-desk' : ''}`}
        >
          <Upload className="w-6 h-6 text-muted mb-2" />
          <p className="text-sm font-medium text-text">
            Choose a PDF file or drag and drop here
          </p>
          <p className="text-xs text-muted mt-1">
            PDF files only, up to {maxSizeMB} MB
          </p>
        </div>
      )}

      {displayError && (
        <p className="text-xs text-bad font-medium mt-1.5" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
