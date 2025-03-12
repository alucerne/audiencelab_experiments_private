import { useRef, useState } from 'react';

import { X } from 'lucide-react';

import { cn } from '@kit/ui/utils';

export default function FileDropZone({
  onFileChange,
  onFileRemove,
  accept,
}: {
  onFileChange: (file: File) => void;
  onFileRemove: () => void;
  accept?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function removeFile() {
    setFile(null);
    onFileRemove();
  }

  function openFileExplorer() {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  }

  return (
    <div
      className={cn(
        'border-input bg-background relative flex min-h-20 w-full flex-col items-center justify-center rounded-md border-2 border-dashed p-4 text-center transition-all duration-100',
        dragActive && 'border-primary',
      )}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
    >
      <input
        className="hidden"
        ref={inputRef}
        type="file"
        multiple={false}
        onChange={handleChange}
        accept={accept}
      />
      {!file ? (
        <div
          onClick={openFileExplorer}
          className="text-muted-foreground cursor-pointer text-sm"
        >
          <span className="text-primary font-semibold underline">
            Click to upload
          </span>
          {` or drag and drop a file`}
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4">
            <X
              className="text-destructive w-5 cursor-pointer"
              onClick={removeFile}
            />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base font-medium">{file.name}</span>
          </div>
        </>
      )}
    </div>
  );
}
