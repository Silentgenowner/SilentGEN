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
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type UploadResponse = {
  success?: boolean;
  message?: string;
  url?: string;
};

type Props = {
  label: string;

  value: string[];

  onChange: (
    images: string[]
  ) => void;

  multiple?: boolean;

  disabled?: boolean;

  maxImages?: number;

  helperText?: string;

  allowUrl?: boolean;
};

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

export default function AdminImageUploader({
  label,
  value,
  onChange,
  multiple = true,
  disabled = false,
  maxImages = 20,
  helperText,
  allowUrl = true,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    dragging,
    setDragging,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    urlInput,
    setUrlInput,
  ] =
    useState("");

  async function uploadFile(
    file: File
  ): Promise<string> {
    if (
      !ACCEPTED_TYPES.includes(
        file.type
      )
    ) {
      throw new Error(
        `${file.name}: Only JPG, JPEG, PNG and WEBP files are allowed.`
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      throw new Error(
        `${file.name}: Maximum image size is 8MB.`
      );
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        "/api/admin/upload/product-image",
        {
          method: "POST",

          credentials:
            "include",

          body:
            formData,
        }
      );

    const text =
      await response.text();

    let data:
      | UploadResponse
      | null = null;

    if (text) {
      try {
        data =
          JSON.parse(
            text
          ) as UploadResponse;
      } catch {
        throw new Error(
          `Invalid upload server response (${response.status}).`
        );
      }
    }

    if (
      !response.ok ||
      !data?.success ||
      !data.url
    ) {
      throw new Error(
        data?.message ||
          `Image upload failed (${response.status}).`
      );
    }

    return data.url;
  }

  async function processFiles(
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

    let selectedFiles =
      files;

    if (!multiple) {
      selectedFiles =
        files.slice(
          0,
          1
        );
    }

    const availableSlots =
      multiple
        ? Math.max(
            0,
            maxImages -
              value.length
          )
        : 1;

    if (
      availableSlots <= 0
    ) {
      setError(
        `Maximum ${maxImages} images are allowed.`
      );

      return;
    }

    selectedFiles =
      selectedFiles.slice(
        0,
        availableSlots
      );

    try {
      setUploading(true);

      const uploadedUrls: string[] =
        [];

      for (
        const file of
        selectedFiles
      ) {
        const url =
          await uploadFile(
            file
          );

        uploadedUrls.push(
          url
        );
      }

      if (!multiple) {
        onChange(
          uploadedUrls.length
            ? [
                uploadedUrls[0],
              ]
            : []
        );

        return;
      }

      const merged =
        Array.from(
          new Set([
            ...value,
            ...uploadedUrls,
          ])
        ).slice(
          0,
          maxImages
        );

      onChange(
        merged
      );
    } catch (
      uploadError
    ) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof
          Error
          ? uploadError.message
          : "Unable to upload image."
      );
    } finally {
      setUploading(
        false
      );
    }
  }

  function handleInput(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    void processFiles(
      files
    );

    event.target.value =
      "";
  }

  function handleDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    event.stopPropagation();

    setDragging(
      false
    );

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    void processFiles(
      Array.from(
        event.dataTransfer
          .files || []
      )
    );
  }

  function removeImage(
    index: number
  ) {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    onChange(
      value.filter(
        (
          _,
          currentIndex
        ) =>
          currentIndex !==
          index
      )
    );
  }

  function moveImage(
    index: number,
    direction:
      | "left"
      | "right"
  ) {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    const newIndex =
      direction ===
      "left"
        ? index - 1
        : index + 1;

    if (
      newIndex < 0 ||
      newIndex >=
        value.length
    ) {
      return;
    }

    const next = [
      ...value,
    ];

    const source =
      next[index];

    const target =
      next[newIndex];

    if (
      !source ||
      !target
    ) {
      return;
    }

    next[index] =
      target;

    next[newIndex] =
      source;

    onChange(
      next
    );
  }

  function addUrl() {
    const url =
      urlInput.trim();

    if (!url) {
      return;
    }

    if (
      !/^https?:\/\//i.test(
        url
      ) &&
      !url.startsWith(
        "data:image/"
      )
    ) {
      setError(
        "Please enter a valid image URL."
      );

      return;
    }

    if (!multiple) {
      onChange([
        url,
      ]);

      setUrlInput("");
      setError("");

      return;
    }

    if (
      value.length >=
      maxImages
    ) {
      setError(
        `Maximum ${maxImages} images are allowed.`
      );

      return;
    }

    if (
      value.includes(
        url
      )
    ) {
      setError(
        "This image URL is already added."
      );

      return;
    }

    onChange([
      ...value,
      url,
    ]);

    setUrlInput("");
    setError("");
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-800">
          {label}
        </label>

        {helperText && (
          <p className="mt-1 text-xs text-gray-500">
            {
              helperText
            }
          </p>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (
            disabled ||
            uploading
          ) {
            return;
          }

          inputRef.current?.click();
        }}
        onKeyDown={(
          event
        ) => {
          if (
            event.key ===
              "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();

            if (
              !disabled &&
              !uploading
            ) {
              inputRef.current?.click();
            }
          }
        }}
        onDragEnter={(
          event
        ) => {
          event.preventDefault();

          if (
            !disabled &&
            !uploading
          ) {
            setDragging(
              true
            );
          }
        }}
        onDragOver={(
          event
        ) => {
          event.preventDefault();

          event.dataTransfer.dropEffect =
            "copy";

          if (
            !disabled &&
            !uploading
          ) {
            setDragging(
              true
            );
          }
        }}
        onDragLeave={() =>
          setDragging(
            false
          )
        }
        onDrop={
          handleDrop
        }
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition ${
          dragging
            ? "border-black bg-gray-100"
            : "border-gray-300 bg-gray-50 hover:border-gray-500"
        } ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : ""
        }`}
      >
        {uploading ? (
          <Loader2
            size={30}
            className="animate-spin text-gray-600"
          />
        ) : (
          <Upload
            size={30}
            className="text-gray-500"
          />
        )}

        <p className="mt-3 text-sm font-semibold text-gray-800">
          {uploading
            ? "Uploading..."
            : "Drag & Drop Images"}
        </p>

        <p className="mt-1 text-xs text-gray-500">
          or click to browse
        </p>

        <p className="mt-3 text-[11px] text-gray-400">
          JPG, JPEG, PNG,
          WEBP • Max 8MB each
        </p>

        {multiple && (
          <p className="mt-1 text-[11px] text-gray-400">
            {value.length}/
            {maxImages} images
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={
          multiple
        }
        disabled={
          disabled ||
          uploading
        }
        onChange={
          handleInput
        }
        className="hidden"
      />

      {allowUrl && (
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-600">
            Or paste image URL
          </p>

          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <LinkIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="url"
                value={
                  urlInput
                }
                onChange={(
                  event
                ) =>
                  setUrlInput(
                    event.target
                      .value
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();

                    addUrl();
                  }
                }}
                placeholder="https://..."
                disabled={
                  disabled ||
                  uploading
                }
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-black"
              />
            </div>

            <button
              type="button"
              onClick={
                addUrl
              }
              disabled={
                disabled ||
                uploading ||
                !urlInput.trim()
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div
          className={`grid gap-3 ${
            multiple
              ? "grid-cols-2 sm:grid-cols-3"
              : "grid-cols-1"
          }`}
        >
          {value.map(
            (
              image,
              index
            ) => (
              <div
                key={`${image}-${index}`}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <div className="relative aspect-square bg-gray-50">
                  <img
                    src={
                      image
                    }
                    alt={`${label} ${index + 1}`}
                    className="h-full w-full object-contain"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(
                        index
                      )
                    }
                    disabled={
                      disabled ||
                      uploading
                    }
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow hover:bg-red-50 disabled:opacity-40"
                    aria-label="Remove image"
                  >
                    <Trash2
                      size={15}
                    />
                  </button>

                  {index ===
                    0 &&
                    multiple && (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black px-2 py-1 text-[10px] font-semibold text-white">
                        First
                      </span>
                    )}
                </div>

                {multiple &&
                  value.length >
                    1 && (
                    <div className="flex gap-2 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            "left"
                          )
                        }
                        disabled={
                          disabled ||
                          uploading ||
                          index ===
                            0
                        }
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border disabled:opacity-30"
                      >
                        <ChevronLeft
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            "right"
                          )
                        }
                        disabled={
                          disabled ||
                          uploading ||
                          index ===
                            value.length -
                              1
                        }
                        className="flex h-8 flex-1 items-center justify-center rounded-lg border disabled:opacity-30"
                      >
                        <ChevronRight
                          size={15}
                        />
                      </button>
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      )}

      {value.length ===
        0 && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-3 text-xs text-gray-400">
          <ImagePlus
            size={15}
          />

          No image selected
        </div>
      )}

      {value.length >
        0 && (
        <button
          type="button"
          onClick={() =>
            onChange([])
          }
          disabled={
            disabled ||
            uploading
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600"
        >
          <X
            size={14}
          />

          Remove All
        </button>
      )}
    </div>
  );
}