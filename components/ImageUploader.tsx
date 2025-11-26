import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, FileWarning } from 'lucide-react';

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validFiles = files.filter(file => validImageTypes.includes(file.type));
    
    if (validFiles.length > 0) {
      onUpload(validFiles);
    } else {
        alert("Please upload valid image files (JPG, PNG, WebP)");
    }
    
    // Reset input
    if(inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
        flex flex-col items-center justify-center gap-4 group
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50/50' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      
      <div className={`
        p-4 rounded-full transition-colors
        ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}
      `}>
        <Upload size={32} />
      </div>

      <div className="space-y-1">
        <p className="text-lg font-medium text-slate-700">
          Click or Drag images here
        </p>
        <p className="text-sm text-slate-500">
          Supports JPG, PNG, WebP (Max 20MB per file)
        </p>
      </div>
    </div>
  );
};
