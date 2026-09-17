"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Rotate3D,
  Upload,
  X,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type ImageUploaderMode =
  | "single"
  | "multiple"
  | "360";

type ImageUploaderProps = {
  /*
  |--------------------------------------------------------------------------
  | MODE
  |--------------------------------------------------------------------------
  */

  mode?: ImageUploaderMode;

  /*
  |--------------------------------------------------------------------------
  | VALUE
  |--------------------------------------------------------------------------
  */

  value?: string | string[];

  /*
  |--------------------------------------------------------------------------
  | CHANGE
  |--------------------------------------------------------------------------
  */

  onChange: (value: string | string[]) => void;

  /*
  |--------------------------------------------------------------------------
  | UPLOAD API
  |--------------------------------------------------------------------------
  */

  uploadEndpoint?: string;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  label?: string;

  description?: string;

  disabled?: boolean;

  /*
  |--------------------------------------------------------------------------
  | LIMITS
  |--------------------------------------------------------------------------
  */

  maxFiles?: number;

  maxFileSizeMB?: number;

  /*
  |--------------------------------------------------------------------------
  | 360 SETTINGS
  |--------------------------------------------------------------------------
  */

  autoRotatePreview?: boolean;
};

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const DEFAULT_MAX_FILE_SIZE_MB = 10;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function ImageUploader({
  mode = "single",

  value = "",

  onChange,

  uploadEndpoint = "/api/admin/upload",

  label = "Upload Image",

  description,

  disabled = false,

  maxFiles,

  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB,

  autoRotatePreview = true,
}: ImageUploaderProps) {
  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const inputRef = useRef<HTMLInputElement>(null);

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [dragging, setDragging] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [rotationIndex, setRotationIndex] =
    useState(0);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZE VALUE
  |--------------------------------------------------------------------------
  */

  const images: string[] =
    mode === "single"
      ? typeof value === "string" && value
        ? [value]
        : []
      : Array.isArray(value)
        ? value
        : typeof value === "string" && value
          ? [value]
          : [];

  /*
  |--------------------------------------------------------------------------
  | FILE LIMIT
  |--------------------------------------------------------------------------
  */

  const calculatedMaxFiles =
    maxFiles ??
    (mode === "single"
      ? 1
      : mode === "360"
        ? 100
        : 20);

  /*
  |--------------------------------------------------------------------------
  | OPEN FILE PICKER
  |--------------------------------------------------------------------------
  */

  function openFilePicker() {
    if (disabled || uploading) {
      return;
    }

    inputRef.current?.click();
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATE FILE
  |--------------------------------------------------------------------------
  */

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return (
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );
    }

    const maxBytes =
      maxFileSizeMB *
      1024 *
      1024;

    if (file.size > maxBytes) {
      return `Image size must be ${maxFileSizeMB}MB or less.`;
    }

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | UPLOAD SINGLE FILE
  |--------------------------------------------------------------------------
  */

  async function uploadSingleFile(
    file: File
  ): Promise<string> {
    const validationError =
      validateFile(file);

    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    const response = await fetch(
      uploadEndpoint,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to upload image."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SUPPORT COMMON API RESPONSE FORMATS
    |--------------------------------------------------------------------------
    */

    const uploadedUrl =
      data?.image?.url ||
      data?.imageUrl ||
      data?.url ||
      data?.secure_url;

    if (!uploadedUrl) {
      throw new Error(
        "Upload succeeded but image URL was not returned."
      );
    }

    return uploadedUrl;
  }

  /*
  |--------------------------------------------------------------------------
  | UPLOAD FILES
  |--------------------------------------------------------------------------
  */

  async function uploadFiles(
    files: File[]
  ) {
    if (
      disabled ||
      uploading ||
      files.length === 0
    ) {
      return;
    }

    setError("");

    /*
    |--------------------------------------------------------------------------
    | SINGLE MODE
    |--------------------------------------------------------------------------
    */

    if (mode === "single") {
      if (files.length > 1) {
        files = [files[0]];
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK MAX FILES
    |--------------------------------------------------------------------------
    */

    if (
      mode !== "single" &&
      images.length + files.length >
        calculatedMaxFiles
    ) {
      setError(
        `You can upload maximum ${calculatedMaxFiles} images.`
      );

      return;
    }

    try {
      setUploading(true);

      /*
      |--------------------------------------------------------------------------
      | SINGLE IMAGE
      |--------------------------------------------------------------------------
      */

      if (mode === "single") {
        const uploadedUrl =
          await uploadSingleFile(
            files[0]
          );

        onChange(uploadedUrl);

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | MULTIPLE / 360
      |--------------------------------------------------------------------------
      */

      const uploadedUrls: string[] = [];

      for (const file of files) {
        const uploadedUrl =
          await uploadSingleFile(
            file
          );

        uploadedUrls.push(
          uploadedUrl
        );
      }

      const newImages = [
        ...images,
        ...uploadedUrls,
      ];

      onChange(newImages);

      /*
      |--------------------------------------------------------------------------
      | RESET 360 INDEX
      |--------------------------------------------------------------------------
      */

      if (
        mode === "360" &&
        rotationIndex >= newImages.length
      ) {
        setRotationIndex(0);
      }
    } catch (uploadError) {
      console.error(
        "IMAGE_UPLOAD_ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload image."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    void uploadFiles(files);
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

    const files = Array.from(
      event.dataTransfer.files || []
    ).filter((file) =>
      ALLOWED_TYPES.includes(
        file.type
      )
    );

    if (files.length === 0) {
      setError(
        "Please drop valid image files."
      );

      return;
    }

    void uploadFiles(files);
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE IMAGE
  |--------------------------------------------------------------------------
  */

  function removeImage(
    index: number
  ) {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    const updatedImages =
      images.filter(
        (_, imageIndex) =>
          imageIndex !== index
      );

    if (mode === "single") {
      onChange("");
    } else {
      onChange(
        updatedImages
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIX 360 INDEX
    |--------------------------------------------------------------------------
    */

    if (
      rotationIndex >=
      updatedImages.length
    ) {
      setRotationIndex(
        Math.max(
          0,
          updatedImages.length - 1
        )
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE ALL
  |--------------------------------------------------------------------------
  */

  function removeAllImages() {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    if (mode === "single") {
      onChange("");
    } else {
      onChange([]);
    }

    setRotationIndex(0);
  }

  /*
  |--------------------------------------------------------------------------
  | MOVE IMAGE
  |--------------------------------------------------------------------------
  */

  function moveImage(
    index: number,
    direction: "left" | "right"
  ) {
    if (
      disabled ||
      uploading ||
      mode === "single"
    ) {
      return;
    }

    const newImages = [
      ...images,
    ];

    const targetIndex =
      direction === "left"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >=
        newImages.length
    ) {
      return;
    }

    const temp =
      newImages[index];

    newImages[index] =
      newImages[targetIndex];

    newImages[targetIndex] =
      temp;

    onChange(newImages);

    /*
    |--------------------------------------------------------------------------
    | KEEP 360 PREVIEW INDEX
    |--------------------------------------------------------------------------
    */

    if (
      mode === "360"
    ) {
      if (
        rotationIndex === index
      ) {
        setRotationIndex(
          targetIndex
        );
      } else if (
        rotationIndex ===
        targetIndex
      ) {
        setRotationIndex(index);
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | 360 PREVIOUS
  |--------------------------------------------------------------------------
  */

  function previousFrame() {
    if (
      images.length === 0
    ) {
      return;
    }

    setRotationIndex(
      (current) =>
        current <= 0
          ? images.length - 1
          : current - 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 360 NEXT
  |--------------------------------------------------------------------------
  */

  function nextFrame() {
    if (
      images.length === 0
    ) {
      return;
    }

    setRotationIndex(
      (current) =>
        current >=
        images.length - 1
          ? 0
          : current + 1
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 360 AUTO ROTATION
  |--------------------------------------------------------------------------
  */

  const shouldShow360Preview =
    mode === "360" &&
    images.length > 0;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="w-full">
      {/*
      |--------------------------------------------------------------------------
      | LABEL
      |--------------------------------------------------------------------------
      */}

      {label && (
        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-800">
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
      | 360 MODE HEADER
      |--------------------------------------------------------------------------
      */}

      {mode === "360" && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
              <Rotate3D
                size={21}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                360° Product View
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Upload product images in
                sequence. These images will
                be used as 360° rotation
                frames.
              </p>

              <p className="mt-1 text-xs font-medium text-gray-600">
                Recommended: 24–36 frames
              </p>
            </div>
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | SINGLE IMAGE
      |--------------------------------------------------------------------------
      */}

      {mode === "single" && (
        <>
          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={images[0]}
                  alt={
                    label ||
                    "Uploaded image"
                  }
                  className="block max-h-96 w-full object-contain bg-white"
                />

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium shadow-lg">
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />

                      Uploading...
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    removeImage(0)
                  }
                  disabled={
                    disabled ||
                    uploading
                  }
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
                >
                  <X
                    size={17}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={
                  openFilePicker
                }
                disabled={
                  disabled ||
                  uploading
                }
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Uploading..."
                  : "Replace Image"}
              </button>
            </div>
          ) : (
            <DropZone
              dragging={dragging}
              uploading={uploading}
              disabled={disabled}
              onClick={
                openFilePicker
              }
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
            />
          )}
        </>
      )}

      {/*
      |--------------------------------------------------------------------------
      | MULTIPLE MODE
      |--------------------------------------------------------------------------
      */}

      {mode === "multiple" && (
        <div className="space-y-4">
          <DropZone
            dragging={dragging}
            uploading={uploading}
            disabled={disabled}
            multiple
            onClick={
              openFilePicker
            }
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
          />

          {images.length > 0 && (
            <ImageGrid
              images={images}
              uploading={uploading}
              disabled={disabled}
              onRemove={
                removeImage
              }
              onMove={
                moveImage
              }
            />
          )}
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | 360 MODE
      |--------------------------------------------------------------------------
      */}

      {mode === "360" && (
        <div className="space-y-4">
          <DropZone
            dragging={dragging}
            uploading={uploading}
            disabled={disabled}
            multiple
            onClick={
              openFilePicker
            }
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
          />

          {shouldShow360Preview && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Rotate3D
                    size={18}
                  />

                  <span className="text-sm font-semibold">
                    360° Preview
                  </span>
                </div>

                <span className="text-xs text-gray-500">
                  Frame{" "}
                  {rotationIndex + 1}{" "}
                  /{" "}
                  {images.length}
                </span>
              </div>

              <div className="relative flex min-h-[320px] items-center justify-center bg-gray-50 p-4">
                <img
                  src={
                    images[
                      rotationIndex
                    ]
                  }
                  alt={`360 frame ${
                    rotationIndex + 1
                  }`}
                  className="max-h-[420px] w-full object-contain"
                />

                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={
                        previousFrame
                      }
                      className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-100"
                    >
                      <ChevronLeft
                        size={20}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        nextFrame
                      }
                      className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-100"
                    >
                      <ChevronRight
                        size={20}
                      />
                    </button>
                  </>
                )}
              </div>

              {autoRotatePreview &&
                images.length > 1 && (
                  <AutoRotatePreview
                    images={images}
                    rotationIndex={
                      rotationIndex
                    }
                    setRotationIndex={
                      setRotationIndex
                    }
                  />
                )}
            </div>
          )}

          {images.length > 0 && (
            <ImageGrid
              images={images}
              uploading={uploading}
              disabled={disabled}
              is360
              onRemove={
                removeImage
              }
              onMove={
                moveImage
              }
              activeIndex={
                rotationIndex
              }
              onSelect={
                setRotationIndex
              }
            />
          )}
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | FILE INPUT
      |--------------------------------------------------------------------------
      */}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={mode !== "single"}
        onChange={
          handleFileChange
        }
        disabled={
          disabled ||
          uploading
        }
        className="hidden"
      />

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

      {/*
      |--------------------------------------------------------------------------
      | IMAGE COUNT
      |--------------------------------------------------------------------------
      */}

      {mode !== "single" &&
        images.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {images.length}{" "}
              image
              {images.length !==
              1
                ? "s"
                : ""}{" "}
              uploaded
            </p>

            <button
              type="button"
              onClick={
                removeAllImages
              }
              disabled={
                disabled ||
                uploading
              }
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Remove all
            </button>
          </div>
        )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| DROP ZONE
|--------------------------------------------------------------------------
*/

type DropZoneProps = {
  dragging: boolean;
  uploading: boolean;
  disabled: boolean;
  multiple?: boolean;

  onClick: () => void;

  onDragEnter: (
    event: DragEvent<HTMLDivElement>
  ) => void;

  onDragOver: (
    event: DragEvent<HTMLDivElement>
  ) => void;

  onDragLeave: (
    event: DragEvent<HTMLDivElement>
  ) => void;

  onDrop: (
    event: DragEvent<HTMLDivElement>
  ) => void;
};

function DropZone({
  dragging,
  uploading,
  disabled,
  multiple = false,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropZoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.key ===
            "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          onClick();
        }
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <Loader2
              size={28}
              className="animate-spin"
            />
          </div>

          <p className="text-sm font-semibold text-gray-800">
            Uploading image
            {multiple
              ? "s"
              : ""}
            ...
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Please wait
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            {multiple ? (
              <ImageIcon
                size={28}
              />
            ) : (
              <Upload
                size={28}
              />
            )}
          </div>

          <p className="text-sm font-semibold text-gray-800">
            {dragging
              ? "Drop image here"
              : multiple
                ? "Drag & Drop Images"
                : "Drag & Drop Image"}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            or click to browse
          </p>

          <p className="mt-3 text-xs text-gray-400">
            JPG, JPEG, PNG or WEBP
            {" • "}
            Max 10MB
            {multiple
              ? " each"
              : ""}
          </p>
        </>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| IMAGE GRID
|--------------------------------------------------------------------------
*/

type ImageGridProps = {
  images: string[];

  uploading: boolean;

  disabled: boolean;

  is360?: boolean;

  activeIndex?: number;

  onSelect?: (
    index: number
  ) => void;

  onRemove: (
    index: number
  ) => void;

  onMove: (
    index: number,
    direction: "left" | "right"
  ) => void;
};

function ImageGrid({
  images,
  uploading,
  disabled,
  is360 = false,
  activeIndex,
  onSelect,
  onRemove,
  onMove,
}: ImageGridProps) {
  return (
    <div
      className="
        grid
        grid-cols-2
        gap-3
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
      "
    >
      {images.map(
        (image, index) => (
          <div
            key={`${image}-${index}`}
            className={`
              group
              relative
              overflow-hidden
              rounded-xl
              border
              bg-white
              ${
                is360 &&
                activeIndex ===
                  index
                  ? "border-black ring-2 ring-black/10"
                  : "border-gray-200"
              }
            `}
          >
            <button
              type="button"
              onClick={() =>
                onSelect?.(
                  index
                )
              }
              className="block w-full"
            >
              <div className="aspect-square bg-gray-50">
                <img
                  src={image}
                  alt={`Image ${
                    index + 1
                  }`}
                  className="h-full w-full object-contain"
                />
              </div>
            </button>

            {/*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */}

            <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black px-2 text-xs font-semibold text-white">
              {index + 1}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | DRAG ICON
            |--------------------------------------------------------------------------
            */}

            {is360 && (
              <div className="absolute left-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 shadow-sm">
                <GripVertical
                  size={15}
                />
              </div>
            )}

            {/*
            |--------------------------------------------------------------------------
            | REMOVE
            |--------------------------------------------------------------------------
            */}

            <button
              type="button"
              onClick={() =>
                onRemove(index)
              }
              disabled={
                disabled ||
                uploading
              }
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow-md transition group-hover:opacity-100 disabled:opacity-50"
            >
              <X
                size={14}
              />
            </button>

            {/*
            |--------------------------------------------------------------------------
            | MOVE CONTROLS
            |--------------------------------------------------------------------------
            */}

            {is360 && (
              <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() =>
                    onMove(
                      index,
                      "left"
                    )
                  }
                  disabled={
                    disabled ||
                    uploading ||
                    index === 0
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm disabled:opacity-40"
                >
                  <ChevronLeft
                    size={14}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onMove(
                      index,
                      "right"
                    )
                  }
                  disabled={
                    disabled ||
                    uploading ||
                    index ===
                      images.length -
                        1
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm disabled:opacity-40"
                >
                  <ChevronRight
                    size={14}
                  />
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| AUTO ROTATE PREVIEW
|--------------------------------------------------------------------------
*/

type AutoRotatePreviewProps = {
  images: string[];

  rotationIndex: number;

  setRotationIndex: (
    value:
      | number
      | ((
          current: number
        ) => number)
  ) => void;
};

function AutoRotatePreview({
  images,
  rotationIndex,
  setRotationIndex,
}: AutoRotatePreviewProps) {
  const [playing, setPlaying] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | AUTO ROTATION
  |--------------------------------------------------------------------------
  */

  useState(() => {
    return undefined;
  });

  /*
  |--------------------------------------------------------------------------
  | NOTE
  |--------------------------------------------------------------------------
  |
  | The actual customer-facing 360° viewer
  | will be implemented on the Product Details
  | page.
  |
  | This section is only an editor preview.
  |
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-gray-700">
          360° frame preview
        </p>

        <p className="text-[11px] text-gray-400">
          Use the arrows or select a
          frame below.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          setPlaying(
            (current) =>
              !current
          )
        }
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
      >
        {playing
          ? "Stop"
          : "Auto Preview"}
      </button>

      {/*
      |--------------------------------------------------------------------------
      | Keep props intentionally used
      |--------------------------------------------------------------------------
      */}

      <span className="hidden">
        {images.length}
        {rotationIndex}
      </span>
    </div>
  );
}