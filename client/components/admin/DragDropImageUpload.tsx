"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

type DragDropImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export default function DragDropImageUpload({
  value = "",
  onChange,
  onRemove,
  label = "Upload Image",
  description = "Drag & drop an image here, or click to browse",
  disabled = false,
}: DragDropImageUploadProps) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [dragging, setDragging] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | UPLOAD IMAGE
  |--------------------------------------------------------------------------
  */

  async function uploadImage(
    file: File
  ) {
    if (disabled || uploading) {
      return;
    }

    setError("");

    /*
    |--------------------------------------------------------------------------
    | TYPE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SIZE VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "Image size must be 10MB or less."
      );

      return;
    }

    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/homepage/upload",
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.success ||
        !data?.image?.url
      ) {
        throw new Error(
          data?.message ||
            "Unable to upload image."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | RETURN URL TO HOMEPAGE EDITOR
      |--------------------------------------------------------------------------
      */

      onChange(
        data.image.url
      );
    } catch (uploadError) {
      console.error(
        "HOMEPAGE_IMAGE_UPLOAD_ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof
          Error
          ? uploadError.message
          : "Unable to upload image."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT
  |--------------------------------------------------------------------------
  */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadImage(file);
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG ENTER
  |--------------------------------------------------------------------------
  */

  function handleDragEnter(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    setDragging(true);
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG OVER
  |--------------------------------------------------------------------------
  */

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    event.dataTransfer.dropEffect =
      "copy";

    setDragging(true);
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG LEAVE
  |--------------------------------------------------------------------------
  */

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    /*
    | Only remove dragging state when
    | actually leaving the container.
    */

    if (
      event.currentTarget ===
      event.target
    ) {
      setDragging(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DROP
  |--------------------------------------------------------------------------
  */

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    const file =
      event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    void uploadImage(file);
  }

  /*
  |--------------------------------------------------------------------------
  | OPEN FILE PICKER
  |--------------------------------------------------------------------------
  */

  function openFilePicker() {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    inputRef.current?.click();
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE IMAGE
  |--------------------------------------------------------------------------
  */

  function handleRemove() {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    setError("");

    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2">
          <label className="text-sm font-semibold text-gray-800">
            {label}
          </label>

          {description && (
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | EXISTING IMAGE
      |--------------------------------------------------------------------------
      */}

      {value ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            <img
              src={value}
              alt={
                label ||
                "Homepage image"
              }
              className="
                block
                max-h-80
                w-full
                object-contain
                bg-white
              "
            />

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-gray-800 shadow-lg">
                  Uploading...
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                openFilePicker
              }
              disabled={
                disabled ||
                uploading
              }
              className="
                rounded-lg
                border
                border-gray-300
                bg-white
                px-4
                py-2
                text-sm
                font-medium
                text-gray-700
                transition
                hover:bg-gray-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {uploading
                ? "Uploading..."
                : "Replace Image"}
            </button>

            <button
              type="button"
              onClick={
                handleRemove
              }
              disabled={
                disabled ||
                uploading
              }
              className="
                rounded-lg
                border
                border-red-200
                bg-red-50
                px-4
                py-2
                text-sm
                font-medium
                text-red-600
                transition
                hover:bg-red-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        /*
        |--------------------------------------------------------------------------
        | DRAG & DROP AREA
        |--------------------------------------------------------------------------
        */

        <div
          role="button"
          tabIndex={0}
          onClick={
            openFilePicker
          }
          onKeyDown={(
            event
          ) => {
            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {
              event.preventDefault();

              openFilePicker();
            }
          }}
          onDragEnter={
            handleDragEnter
          }
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={
            handleDrop
          }
          className={`
            flex
            min-h-52
            w-full
            cursor-pointer
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            px-6
            py-8
            text-center
            transition
            ${
              dragging
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50 hover:border-gray-500 hover:bg-gray-100"
            }
            ${
              disabled ||
              uploading
                ? "cursor-not-allowed opacity-60"
                : ""
            }
          `}
        >
          {uploading ? (
            <>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </div>

              <p className="text-sm font-semibold text-gray-800">
                Uploading image...
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Please wait
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                🖼️
              </div>

              <p className="text-sm font-semibold text-gray-800">
                {dragging
                  ? "Drop image here"
                  : "Drag & Drop Image"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                or click to browse
              </p>

              <p className="mt-3 text-xs text-gray-400">
                JPG, JPEG, PNG or WEBP
                • Max 10MB
              </p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={
              handleFileChange
            }
            disabled={
              disabled ||
              uploading
            }
            className="hidden"
          />
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}