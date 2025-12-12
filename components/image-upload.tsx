'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect?: (file: File, previewUrl: string) => void;
  onImageRemove?: () => void;
  value?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onImageSelect,
  onImageRemove,
  value,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(value || '');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP 파일만 업로드할 수 있습니다.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return '파일 크기가 5MB를 초과합니다.';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onImageSelect?.(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove?.();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={preview}
            alt="미리보기"
            fill
            className="object-cover"
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={disabled ? undefined : handleClick}
          onDrop={disabled ? undefined : handleDrop}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full aspect-square rounded-lg border-2 border-dashed
            flex flex-col items-center justify-center gap-4
            transition-colors
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          `}
        >
          <Upload className="w-12 h-12 text-gray-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              사진을 클릭하거나 드래그하여 업로드
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, GIF, WebP (최대 5MB)
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
