"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Film,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export type ProductReelVideo = {
  enabled: boolean;
  url: string;
  publicId: string;
  duration: number;
  poster: string;
};

type UploadResponse = {
  success?: boolean;
  message?: string;

  video?: {
    enabled?: boolean;
    url?: string;
    publicId?: string;
    duration?: number;
    poster?: string;
    width?: number;
    height?: number;
    format?: string;
    bytes?: number;
  };
};

type Props = {
  value?: ProductReelVideo;

  onChange: (
    value: ProductReelVideo
  ) => void;

  disabled?: boolean;

  label?: string;

  helperText?: string;
};

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const MAX_DURATION = 30;

const MAX_FILE_SIZE_MB = 50;

const MAX_FILE_SIZE =
  MAX_FILE_SIZE_MB *
  1024 *
  1024;

const ALLOWED_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);

const ALLOWED_EXTENSIONS =
  new Set([
    ".mp4",
    ".webm",
    ".mov",
  ]);

/*
|--------------------------------------------------------------------------
| EMPTY REEL
|--------------------------------------------------------------------------
*/

export const EMPTY_PRODUCT_REEL_VIDEO:
  ProductReelVideo = {
    enabled: false,
    url: "",
    publicId: "",
    duration: 0,
    poster: "",
  };

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getExtension(
  fileName: string
) {
  const index =
    fileName.lastIndexOf(".");

  if (index < 0) {
    return "";
  }

  return fileName
    .slice(index)
    .toLowerCase();
}

function isAllowedFile(
  file: File
) {
  return (
    ALLOWED_TYPES.has(
      file.type
    ) ||
    ALLOWED_EXTENSIONS.has(
      getExtension(
        file.name
      )
    )
  );
}

function formatDuration(
  seconds: number
) {
  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds <= 0
  ) {
    return "0 sec";
  }

  return `${seconds.toFixed(
    1
  )} sec`;
}

/*
|--------------------------------------------------------------------------
| READ VIDEO DURATION
|--------------------------------------------------------------------------
*/

function readVideoDuration(
  file: File
): Promise<number> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const objectUrl =
        URL.createObjectURL(
          file
        );

      const video =
        document.createElement(
          "video"
        );

      let finished =
        false;

      function cleanup() {
        URL.revokeObjectURL(
          objectUrl
        );

        video.removeAttribute(
          "src"
        );

        video.load();
      }

      function fail(
        message: string
      ) {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        reject(
          new Error(
            message
          )
        );
      }

      video.preload =
        "metadata";

      video.muted =
        true;

      video.playsInline =
        true;

      video.onloadedmetadata =
        () => {
          if (finished) {
            return;
          }

          const duration =
            Number(
              video.duration
            );

          if (
            !Number.isFinite(
              duration
            ) ||
            duration <= 0
          ) {
            fail(
              "Unable to detect video duration."
            );

            return;
          }

          finished = true;

          cleanup();

          resolve(
            duration
          );
        };

      video.onerror =
        () => {
          fail(
            "Unable to read this video file."
          );
        };

      video.src =
        objectUrl;
    }
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AdminProductVideoUploader({
  value,
  onChange,
  disabled = false,
  label =
    "Product Reel Video",
  helperText =
    "Upload one short product reel. MP4, WEBM or MOV. Maximum 30 seconds and 50 MB.",
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
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] =
    useState<File | null>(
      null
    );

  const reel =
    value ??
    EMPTY_PRODUCT_REEL_VIDEO;

  const hasVideo =
    Boolean(
      reel.url?.trim()
    );

  /*
  |--------------------------------------------------------------------------
  | RESET FILE INPUT
  |--------------------------------------------------------------------------
  */

  function resetInput() {
    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPLOAD FILE
  |--------------------------------------------------------------------------
  |
  | Important:
  |
  | If an old reel already exists, we DO NOT delete it here.
  |
  | The old Cloudinary asset must only be deleted after the product PATCH
  | succeeds. Otherwise pressing Cancel after Replace would leave the product
  | pointing to a deleted Cloudinary video.
  |
  |--------------------------------------------------------------------------
  */

  async function uploadFile(
    file: File
  ) {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    setError("");

    setSuccessMessage("");

    /*
    |--------------------------------------------------------------------------
    | TYPE
    |--------------------------------------------------------------------------
    */

    if (
      !isAllowedFile(
        file
      )
    ) {
      setError(
        "Only MP4, WEBM and MOV video files are allowed."
      );

      resetInput();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SIZE
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setError(
        `Video must be ${MAX_FILE_SIZE_MB} MB or smaller.`
      );

      resetInput();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CLIENT DURATION CHECK
    |--------------------------------------------------------------------------
    */

    let clientDuration =
      0;

    try {
      clientDuration =
        await readVideoDuration(
          file
        );
    } catch (
      durationError
    ) {
      setError(
        durationError instanceof
          Error
          ? durationError.message
          : "Unable to read video duration."
      );

      resetInput();

      return;
    }

    if (
      clientDuration >
      MAX_DURATION
    ) {
      setError(
        `Video must be ${MAX_DURATION} seconds or shorter. Selected video is ${clientDuration.toFixed(
          1
        )} seconds.`
      );

      resetInput();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SELECTED FILE
    |--------------------------------------------------------------------------
    */

    setSelectedFile(
      file
    );

    try {
      setUploading(
        true
      );

      const formData =
        new FormData();

      formData.append(
        "video",
        file
      );

      const response =
        await fetch(
          "/api/admin/upload/product-video",
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              formData,
          }
        );

      const responseText =
        await response.text();

      let data:
        UploadResponse;

      try {
        data =
          responseText
            ? JSON.parse(
                responseText
              )
            : {};
      } catch {
        throw new Error(
          "Video upload API returned an invalid response."
        );
      }

      if (
        !response.ok ||
        data.success ===
          false
      ) {
        throw new Error(
          data.message ||
            "Unable to upload product reel."
        );
      }

      const uploaded =
        data.video;

      if (
        !uploaded ||
        typeof uploaded.url !==
          "string" ||
        !uploaded.url.trim()
      ) {
        throw new Error(
          "Uploaded video URL was not returned."
        );
      }

      const duration =
        Number(
          uploaded.duration ??
            0
        );

      /*
      |--------------------------------------------------------------------------
      | SERVER RESULT SAFETY CHECK
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isFinite(
          duration
        ) ||
        duration <= 0 ||
        duration >
          MAX_DURATION
      ) {
        throw new Error(
          "Uploaded video duration is invalid."
        );
      }

      const uploadedReel:
        ProductReelVideo = {
          enabled:
            uploaded.enabled !==
            false,

          url:
            uploaded.url.trim(),

          publicId:
            typeof uploaded.publicId ===
              "string"
              ? uploaded.publicId.trim()
              : "",

          duration:
            Number(
              duration.toFixed(
                2
              )
            ),

          poster:
            typeof uploaded.poster ===
              "string"
              ? uploaded.poster.trim()
              : "",
        };

      onChange(
        uploadedReel
      );

      setSuccessMessage(
        hasVideo
          ? "Replacement reel uploaded. Save the product to confirm the change."
          : "Product reel uploaded successfully."
      );
    } catch (
      uploadError
    ) {
      console.error(
        "PRODUCT_REEL_UPLOAD_ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof
          Error
          ? uploadError.message
          : "Unable to upload product reel."
      );
    } finally {
      setUploading(
        false
      );

      setSelectedFile(
        null
      );

      resetInput();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  function handleChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    void uploadFile(
      file
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG OVER
  |--------------------------------------------------------------------------
  */

  function handleDragOver(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    setDragging(
      true
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DRAG LEAVE
  |--------------------------------------------------------------------------
  */

  function handleDragLeave() {
    setDragging(
      false
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DROP
  |--------------------------------------------------------------------------
  */

  function handleDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setDragging(
      false
    );

    if (
      disabled ||
      uploading
    ) {
      return;
    }

    const file =
      event.dataTransfer
        .files?.[0];

    if (!file) {
      return;
    }

    void uploadFile(
      file
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE VIDEO
  |--------------------------------------------------------------------------
  |
  | Only remove from current form.
  |
  | Cloudinary deletion happens after successful product save on backend.
  |
  |--------------------------------------------------------------------------
  */

  function removeVideo() {
    if (
      disabled ||
      uploading
    ) {
      return;
    }

    onChange({
      ...EMPTY_PRODUCT_REEL_VIDEO,
    });

    setError("");

    setSuccessMessage(
      "Reel removed from this form. Save the product to confirm removal."
    );

    resetInput();
  }

  /*
  |--------------------------------------------------------------------------
  | ENABLE / DISABLE
  |--------------------------------------------------------------------------
  */

  function toggleEnabled() {
    if (
      disabled ||
      uploading ||
      !hasVideo
    ) {
      return;
    }

    onChange({
      ...reel,

      enabled:
        !reel.enabled,
    });

    setError("");

    setSuccessMessage(
      reel.enabled
        ? "Reel disabled. Save the product to confirm."
        : "Reel enabled. Save the product to confirm."
    );
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
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Video
              size={20}
              className="text-gray-700"
            />

            <h2 className="text-lg font-bold text-gray-900">
              {label}
            </h2>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {helperText}
          </p>
        </div>

        {hasVideo && (
          <button
            type="button"
            onClick={
              toggleEnabled
            }
            disabled={
              disabled ||
              uploading
            }
            className={`
              rounded-full
              px-3
              py-1.5
              text-xs
              font-bold
              transition
              disabled:cursor-not-allowed
              disabled:opacity-50

              ${
                reel.enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }
            `}
          >
            {reel.enabled
              ? "Enabled"
              : "Disabled"}
          </button>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Video Error
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* SUCCESS */}

      {successMessage &&
        !error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p>
              {successMessage}
            </p>
          </div>
        )}

      {/* DROP ZONE */}

      {!hasVideo && (
        <div
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={
            handleDrop
          }
          onClick={
            openFilePicker
          }
          className={`
            mt-5
            rounded-2xl
            border-2
            border-dashed
            p-8
            text-center
            transition

            ${
              dragging
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }

            ${
              disabled ||
              uploading
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }
          `}
        >
          {uploading ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Loader2
                  size={27}
                  className="animate-spin"
                />
              </div>

              <p className="mt-4 font-bold text-gray-900">
                Uploading Product
                Reel...
              </p>

              {selectedFile && (
                <p className="mt-2 break-all text-sm text-gray-500">
                  {
                    selectedFile.name
                  }
                </p>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Please do not close
                this page.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload
                  size={26}
                />
              </div>

              <p className="mt-4 font-bold text-gray-900">
                Drag & drop reel
                video here
              </p>

              <p className="mt-2 text-sm text-gray-500">
                or click to browse
              </p>

              <p className="mt-3 text-xs font-semibold text-gray-400">
                MP4 / WEBM / MOV •
                Max 30 sec • Max 50
                MB
              </p>
            </>
          )}
        </div>
      )}

      {/* VIDEO PREVIEW */}

      {hasVideo && (
        <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* VIDEO */}

          <div className="relative overflow-hidden rounded-2xl bg-black">
            <div className="aspect-[9/16] w-full">
              <video
                key={
                  reel.url
                }
                src={
                  reel.url
                }
                poster={
                  reel.poster ||
                  undefined
                }
                controls
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
              Reel Preview
            </div>

            {!reel.enabled && (
              <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase text-gray-700 backdrop-blur-sm">
                Disabled
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Film
                    size={21}
                  />
                </div>

                <div>
                  <p className="font-bold text-gray-900">
                    Product Reel
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Cloudinary video
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoBox
                  label="Duration"
                  value={
                    formatDuration(
                      reel.duration
                    )
                  }
                />

                <InfoBox
                  label="Maximum"
                  value="30 sec"
                />

                <InfoBox
                  label="Status"
                  value={
                    reel.enabled
                      ? "Enabled"
                      : "Disabled"
                  }
                />

                <InfoBox
                  label="Storage"
                  value="Cloudinary"
                />
              </div>

              {reel.publicId && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Cloudinary Public ID
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-600">
                    {
                      reel.publicId
                    }
                  </p>
                </div>
              )}

              {reel.url && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Video URL
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-600">
                    {reel.url}
                  </p>
                </div>
              )}
            </div>

            {/* ACTIONS */}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={
                  openFilePicker
                }
                disabled={
                  disabled ||
                  uploading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCcw
                    size={17}
                  />
                )}

                {uploading
                  ? "Uploading..."
                  : "Replace Reel"}
              </button>

              <button
                type="button"
                onClick={
                  removeVideo
                }
                disabled={
                  disabled ||
                  uploading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2
                  size={17}
                />

                Remove Reel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN INPUT */}

      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
        onChange={
          handleChange
        }
        disabled={
          disabled ||
          uploading
        }
        className="hidden"
      />

      {/* RULES */}

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Video
            size={18}
            className="mt-0.5 shrink-0 text-blue-600"
          />

          <div className="text-sm leading-6 text-blue-900">
            <p className="font-bold">
              Reel Upload Rules
            </p>

            <p className="mt-1">
              Recommended vertical
              ratio is 9:16. Video
              must be 30 seconds or
              shorter and 50 MB or
              smaller. Customer
              ProductCard can play
              the reel muted and
              inline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| INFO BOX
|--------------------------------------------------------------------------
*/

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}