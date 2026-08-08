"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export default function ImageUpload({
  value,
  onChange,
  label = "Thumbnail",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadImage(file: File) {
    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Upload failed");
        return;
      }

      onChange(data.imageUrl);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function handleFile(file: File | null) {
    if (!file) return;

    uploadImage(file);
  }
    return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">
        {label}
      </label>

      {/* Upload Area */}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();

          const file = e.dataTransfer.files?.[0];

          if (file) {
            handleFile(file);
          }
        }}
        className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition hover:border-black"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="mb-3 h-10 w-10 animate-spin" />
            <p>Uploading image...</p>
          </>
        ) : value ? (
          <div className="relative">
            <Image
              src={value}
              alt="Preview"
              width={220}
              height={220}
              className="rounded-lg object-cover"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-3 h-12 w-12 text-gray-500" />

            <p className="font-semibold">
              Click or Drag Image Here
            </p>

            <p className="mt-2 text-sm text-gray-500">
              JPG / JPEG / PNG / WEBP
            </p>
          </>
        )}

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/*"
          onChange={(e) =>
            handleFile(e.target.files?.[0] || null)
          }
        />
      </div>

      {/* Manual URL */}

      <input
        type="text"
        placeholder="Or paste Image URL..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-4 py-3"
      />

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
