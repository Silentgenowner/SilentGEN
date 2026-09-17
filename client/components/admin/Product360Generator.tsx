"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  RefreshCcw,
  Rotate3D,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type GeneratedFrame = {
  angle: number;
  name: string;
  base64: string;
  mimeType: string;
};

type SavedFrame = {
  angle: number;
  name: string;
  url: string;
};

type Product360Data = {
  enabled?: boolean;
  frames?: SavedFrame[];
};

type ColorVariant = {
  color: string;
  images?: string[];

  product360?: Product360Data;

  /*
   * Legacy support.
   */
  view360Images?: string[];
};

type ProductApiData = {
  _id?: string;
  name?: string;

  product360?: Product360Data;

  colorVariants?: ColorVariant[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;

  product?: ProductApiData;

  images?: GeneratedFrame[];

  frame?: SavedFrame;
  frames?: SavedFrame[];

  enabled?: boolean;
  totalFrames?: number;

  product360?: Product360Data;
};

type Product360GeneratorProps = {
  productId: string;

  initialProduct360?: Product360Data;

  initialColorVariants?: ColorVariant[];

  onSaved?: (data: {
    targetType: "main" | "color";
    color?: string;
    product360: Product360Data;
  }) => void;
};

type ManualFileFrame = {
  id: string;

  file: File;

  previewUrl: string;

  angle: number;

  name: string;
};

type TargetOption = {
  key: string;

  type: "main" | "color";

  label: string;

  color?: string;

  product360: Product360Data;

  images: string[];
};

/* ============================================================
   CONSTANTS
============================================================ */

const MAIN_TARGET_KEY =
  "__MAIN_PRODUCT__";

const MANUAL_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_MANUAL_FILE_SIZE_MB =
  10;

/* ============================================================
   HELPERS
============================================================ */

async function readJsonResponse(
  response: Response
): Promise<{
  data: ApiResponse | null;
  responseText: string;
}> {
  const responseText =
    await response.text();

  if (!responseText.trim()) {
    return {
      data: null,
      responseText: "",
    };
  }

  try {
    return {
      data: JSON.parse(
        responseText
      ) as ApiResponse,

      responseText,
    };
  } catch (error) {
    console.error(
      "INVALID JSON RESPONSE:",
      responseText
    );

    console.error(
      "JSON PARSE ERROR:",
      error
    );

    return {
      data: null,
      responseText,
    };
  }
}

function fileToBase64(
  file: File
): Promise<{
  base64: string;
  mimeType: string;
}> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = () => {
        const result =
          reader.result;

        if (
          typeof result !==
          "string"
        ) {
          reject(
            new Error(
              "Unable to read image."
            )
          );

          return;
        }

        const commaIndex =
          result.indexOf(",");

        if (
          commaIndex === -1
        ) {
          reject(
            new Error(
              "Invalid image data."
            )
          );

          return;
        }

        resolve({
          base64:
            result.slice(
              commaIndex + 1
            ),

          mimeType:
            file.type ||
            "image/jpeg",
        });
      };

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read image."
          )
        );
      };

      reader.readAsDataURL(
        file
      );
    }
  );
}

function buildEvenAngles(
  total: number
): number[] {
  if (total <= 0) {
    return [];
  }

  return Array.from(
    {
      length: total,
    },
    (_, index) =>
      Math.round(
        (360 / total) *
          index
      ) % 360
  );
}

function clampAngle(
  value: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  const normalized =
    Math.round(value) %
    360;

  return normalized < 0
    ? normalized + 360
    : normalized;
}

function cleanSavedFrames(
  value: unknown
): SavedFrame[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        frame
      ): frame is SavedFrame => {
        if (
          !frame ||
          typeof frame !==
            "object"
        ) {
          return false;
        }

        const current =
          frame as Partial<SavedFrame>;

        return (
          typeof current.angle ===
            "number" &&
          typeof current.name ===
            "string" &&
          typeof current.url ===
            "string" &&
          current.url.trim() !== ""
        );
      }
    )
    .map((frame) => ({
      angle:
        clampAngle(
          frame.angle
        ),

      name:
        frame.name.trim(),

      url:
        frame.url.trim(),
    }))
    .sort(
      (a, b) =>
        a.angle - b.angle
    );
}

function cleanColorVariants(
  value: unknown
): ColorVariant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (variant) =>
        variant &&
        typeof variant ===
          "object"
    )
    .map((variant) => {
      const current =
        variant as ColorVariant;

      return {
        color:
          String(
            current.color ??
              ""
          ).trim(),

        images:
          Array.isArray(
            current.images
          )
            ? current.images
                .filter(
                  (
                    image
                  ): image is string =>
                    typeof image ===
                      "string" &&
                    image.trim() !==
                      ""
                )
                .map((image) =>
                  image.trim()
                )
            : [],

        view360Images:
          Array.isArray(
            current.view360Images
          )
            ? current.view360Images
                .filter(
                  (
                    image
                  ): image is string =>
                    typeof image ===
                      "string" &&
                    image.trim() !==
                      ""
                )
                .map((image) =>
                  image.trim()
                )
            : [],

        product360: {
          enabled:
            Boolean(
              current
                .product360
                ?.enabled
            ),

          frames:
            cleanSavedFrames(
              current
                .product360
                ?.frames
            ),
        },
      };
    })
    .filter(
      (variant) =>
        variant.color.length >
        0
    );
}

/* ============================================================
   NORMALIZE PRODUCT 360
============================================================ */

function cleanProduct360(
  value:
    | Product360Data
    | undefined
): Product360Data {
  const frames =
    cleanSavedFrames(
      value?.frames
    );

  return {
    /*
     * Frames exist means the saved 360 is usable.
     * This also protects old products where enabled was stale.
     */
    enabled:
      frames.length > 0,

    frames,
  };
}

/* ============================================================
   SIGNATURE HELPERS
============================================================ */

function createProduct360Signature(
  value:
    | Product360Data
    | undefined
): string {
  return JSON.stringify(
    cleanProduct360(
      value
    )
  );
}

function createColorVariantsSignature(
  value:
    | ColorVariant[]
    | undefined
): string {
  return JSON.stringify(
    cleanColorVariants(
      value
    )
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Product360Generator({
  productId,

  initialProduct360,

  initialColorVariants,

  onSaved,
}: Product360GeneratorProps) {
  /* ==========================================================
     MODE
  ========================================================== */

  const [
    mode,
    setMode,
  ] = useState<
    "ai" | "manual"
  >("ai");

  /* ==========================================================
     PRODUCT DATA
  ========================================================== */

  const [
    mainProduct360,
    setMainProduct360,
  ] =
    useState<Product360Data>(
      () =>
        cleanProduct360(
          initialProduct360
        )
    );

  const [
    colorVariants,
    setColorVariants,
  ] =
    useState<ColorVariant[]>(
      () =>
        cleanColorVariants(
          initialColorVariants
        )
    );

  /* ==========================================================
     STABLE PROP SIGNATURES
  ========================================================== */

  const initialProduct360Signature =
    createProduct360Signature(
      initialProduct360
    );

  const initialColorVariantsSignature =
    createColorVariantsSignature(
      initialColorVariants
    );

  const lastProduct360SignatureRef =
    useRef(
      initialProduct360Signature
    );

  const lastColorVariantsSignatureRef =
    useRef(
      initialColorVariantsSignature
    );

  /* ==========================================================
     SELECTED TARGET
  ========================================================== */

  const [
    selectedTargetKey,
    setSelectedTargetKey,
  ] = useState(
    MAIN_TARGET_KEY
  );

  /* ==========================================================
     EXISTING PREVIEW
  ========================================================== */

  const [
    existingPreviewIndex,
    setExistingPreviewIndex,
  ] = useState(0);

  /* ==========================================================
     AI STATE
  ========================================================== */

  const [
    aiFrames,
    setAiFrames,
  ] = useState<
    GeneratedFrame[]
  >([]);

  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);

  const [
    aiSaving,
    setAiSaving,
  ] = useState(false);

  const [
    aiSavedFrames,
    setAiSavedFrames,
  ] = useState<
    SavedFrame[]
  >([]);

  const [
    aiSaveProgress,
    setAiSaveProgress,
  ] = useState(0);

  const [
    aiApproved,
    setAiApproved,
  ] = useState(false);

  const [
    aiPreviewIndex,
    setAiPreviewIndex,
  ] = useState(0);

  /* ==========================================================
     MANUAL STATE
  ========================================================== */

  const inputRef =
    useRef<HTMLInputElement>(
      null
    );

  const manualFramesRef =
    useRef<
      ManualFileFrame[]
    >([]);

  const [
    manualFrames,
    setManualFrames,
  ] = useState<
    ManualFileFrame[]
  >([]);

  const [
    manualDragging,
    setManualDragging,
  ] = useState(false);

  const [
    manualSaving,
    setManualSaving,
  ] = useState(false);

  const [
    manualSaveProgress,
    setManualSaveProgress,
  ] = useState(0);

  const [
    manualSavedFrames,
    setManualSavedFrames,
  ] = useState<
    SavedFrame[]
  >([]);

  const [
    manualPreviewIndex,
    setManualPreviewIndex,
  ] = useState(0);

  /* ==========================================================
     COMMON STATE
  ========================================================== */

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* ==========================================================
     SYNC MAIN PRODUCT 360 PROP
  ========================================================== */

  useEffect(() => {
    if (
      lastProduct360SignatureRef.current ===
      initialProduct360Signature
    ) {
      return;
    }

    lastProduct360SignatureRef.current =
      initialProduct360Signature;

    const nextProduct360 =
      cleanProduct360(
        initialProduct360
      );

    setMainProduct360(
      (current) => {
        const currentSignature =
          JSON.stringify(
            cleanProduct360(
              current
            )
          );

        if (
          currentSignature ===
          initialProduct360Signature
        ) {
          return current;
        }

        return nextProduct360;
      }
    );
  }, [
    initialProduct360Signature,
    initialProduct360,
  ]);

  /* ==========================================================
     SYNC COLOR VARIANTS PROP
  ========================================================== */

  useEffect(() => {
    if (
      lastColorVariantsSignatureRef.current ===
      initialColorVariantsSignature
    ) {
      return;
    }

    lastColorVariantsSignatureRef.current =
      initialColorVariantsSignature;

    const nextColorVariants =
      cleanColorVariants(
        initialColorVariants
      );

    setColorVariants(
      (current) => {
        const currentSignature =
          JSON.stringify(
            cleanColorVariants(
              current
            )
          );

        if (
          currentSignature ===
          initialColorVariantsSignature
        ) {
          return current;
        }

        return nextColorVariants;
      }
    );
  }, [
    initialColorVariantsSignature,
    initialColorVariants,
  ]);

  /* ==========================================================
     KEEP MANUAL REF UPDATED
  ========================================================== */

  useEffect(() => {
    manualFramesRef.current =
      manualFrames;
  }, [manualFrames]);

  /* ==========================================================
     CLEAN MANUAL OBJECT URLS ON UNMOUNT
  ========================================================== */

  useEffect(() => {
    return () => {
      for (
        const frame of
          manualFramesRef.current
      ) {
        URL.revokeObjectURL(
          frame.previewUrl
        );
      }
    };
  }, []);

  /* ==========================================================
     TARGET OPTIONS
  ========================================================== */

  const targetOptions =
    useMemo<
      TargetOption[]
    >(() => {
      const options: TargetOption[] =
        [
          {
            key:
              MAIN_TARGET_KEY,

            type: "main",

            label:
              "Main Product",

            product360: {
              enabled:
                Boolean(
                  mainProduct360
                    .enabled
                ),

              frames:
                cleanSavedFrames(
                  mainProduct360
                    .frames
                ),
            },

            images: [],
          },
        ];

      for (
        const variant of
          colorVariants
      ) {
        options.push({
          key:
            `COLOR:${variant.color}`,

          type:
            "color",

          label:
            variant.color,

          color:
            variant.color,

          images:
            Array.isArray(
              variant.images
            )
              ? variant.images
              : [],

          product360: {
            enabled:
              Boolean(
                variant
                  .product360
                  ?.enabled
              ),

            frames:
              cleanSavedFrames(
                variant
                  .product360
                  ?.frames
              ),
          },
        });
      }

      return options;
    }, [
      mainProduct360,
      colorVariants,
    ]);

  /* ==========================================================
     SELECTED TARGET
  ========================================================== */

  const selectedTarget =
    useMemo(() => {
      return (
        targetOptions.find(
          (target) =>
            target.key ===
            selectedTargetKey
        ) ||
        targetOptions[0]
      );
    }, [
      targetOptions,
      selectedTargetKey,
    ]);

  const selectedColor =
    selectedTarget?.type ===
    "color"
      ? selectedTarget.color ||
        ""
      : "";

  /* ==========================================================
     KEEP SELECTED TARGET VALID
  ========================================================== */

  useEffect(() => {
    const stillExists =
      targetOptions.some(
        (target) =>
          target.key ===
          selectedTargetKey
      );

    if (!stillExists) {
      setSelectedTargetKey(
        MAIN_TARGET_KEY
      );
    }
  }, [
    targetOptions,
    selectedTargetKey,
  ]);

  /* ==========================================================
     EXISTING FRAMES
  ========================================================== */

  const existingFrames =
    useMemo(() => {
      return cleanSavedFrames(
        selectedTarget
          ?.product360
          ?.frames
      );
    }, [
      selectedTarget,
    ]);

  const existingEnabled =
    Boolean(
      selectedTarget
        ?.product360
        ?.enabled
    );

  const existingPreviewFrame =
    existingFrames[
      existingPreviewIndex
    ];

  const aiPreviewFrame =
    aiFrames[
      aiPreviewIndex
    ];

  const manualPreviewFrame =
    manualFrames[
      manualPreviewIndex
    ];

  /* ==========================================================
     KEEP EXISTING INDEX SAFE
  ========================================================== */

  useEffect(() => {
    if (
      existingPreviewIndex >=
      existingFrames.length
    ) {
      setExistingPreviewIndex(
        0
      );
    }
  }, [
    existingPreviewIndex,
    existingFrames.length,
  ]);

  /* ==========================================================
     KEEP AI INDEX SAFE
  ========================================================== */

  useEffect(() => {
    if (
      aiPreviewIndex >=
      aiFrames.length
    ) {
      setAiPreviewIndex(
        0
      );
    }
  }, [
    aiPreviewIndex,
    aiFrames.length,
  ]);

  /* ==========================================================
     KEEP MANUAL INDEX SAFE
  ========================================================== */

  useEffect(() => {
    if (
      manualPreviewIndex >=
      manualFrames.length
    ) {
      setManualPreviewIndex(
        0
      );
    }
  }, [
    manualPreviewIndex,
    manualFrames.length,
  ]);

  /* ==========================================================
     RESET EDITOR WHEN TARGET CHANGES
  ========================================================== */

  useEffect(() => {
    setExistingPreviewIndex(
      0
    );

    setAiFrames([]);

    setAiSavedFrames([]);

    setAiSaveProgress(0);

    setAiApproved(false);

    setAiPreviewIndex(0);

    for (
      const frame of
        manualFramesRef.current
    ) {
      URL.revokeObjectURL(
        frame.previewUrl
      );
    }

    setManualFrames([]);

    setManualSavedFrames([]);

    setManualSaveProgress(
      0
    );

    setManualPreviewIndex(
      0
    );

    setError("");

    setSuccess("");
  }, [
    selectedTargetKey,
  ]);

  /* ==========================================================
     REFRESH PRODUCT DATA
  ========================================================== */

  async function refreshProductData() {
    try {
      const response =
        await fetch(
          `/api/admin/products/${productId}`,
          {
            method: "GET",

            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const {
        data,
        responseText,
      } =
        await readJsonResponse(
          response
        );

      if (
        !response.ok ||
        !data?.success ||
        !data.product
      ) {
        console.error(
          "REFRESH PRODUCT 360 ERROR:",
          {
            status:
              response.status,

            responseText,

            data,
          }
        );

        return;
      }

      const product =
        data.product;

      const nextMain360 =
        cleanProduct360(
          product.product360
        );

      const nextVariants =
        cleanColorVariants(
          product.colorVariants
        );

      setMainProduct360(
        nextMain360
      );

      setColorVariants(
        nextVariants
      );

      /*
       * Update signatures too so parent receiving same data
       * does not immediately re-sync us again.
       */
      lastProduct360SignatureRef.current =
        JSON.stringify(
          nextMain360
        );

      lastColorVariantsSignatureRef.current =
        JSON.stringify(
          nextVariants
        );

      setExistingPreviewIndex(
        0
      );

      if (
        selectedTarget?.type ===
        "main"
      ) {
        onSaved?.({
          targetType:
            "main",

          product360:
            nextMain360,
        });

        return;
      }

      const matchingVariant =
        nextVariants.find(
          (variant) =>
            variant.color
              .trim()
              .toLowerCase() ===
            selectedColor
              .trim()
              .toLowerCase()
        );

      onSaved?.({
        targetType:
          "color",

        color:
          selectedColor,

        product360:
          cleanProduct360(
            matchingVariant
              ?.product360
          ),
      });
    } catch (
      refreshError
    ) {
      console.error(
        "REFRESH PRODUCT 360 ERROR:",
        refreshError
      );
    }
  }

  /* ==========================================================
     GENERATE AI 360
  ========================================================== */

  async function generateAI360() {
    if (
      aiLoading ||
      aiSaving ||
      manualSaving
    ) {
      return;
    }

    try {
      setAiLoading(true);

      setError("");
      setSuccess("");

      setAiFrames([]);

      setAiSavedFrames(
        []
      );

      setAiSaveProgress(
        0
      );

      setAiApproved(
        false
      );

      setAiPreviewIndex(
        0
      );

      const requestBody =
        selectedTarget?.type ===
        "color"
          ? {
              color:
                selectedColor,
            }
          : {};

      const response =
        await fetch(
          `/api/admin/products/${productId}/generate-360`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                requestBody
              ),
          }
        );

      const {
        data,
        responseText,
      } =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        console.error(
          "GENERATE AI 360 API ERROR:",
          {
            status:
              response.status,

            statusText:
              response.statusText,

            responseText,

            data,
          }
        );

        if (
          response.status ===
          429
        ) {
          throw new Error(
            "Gemini quota is exhausted. Use Manual Upload now or try AI generation again later."
          );
        }

        throw new Error(
          data?.error ||
            data?.message ||
            `360° generation failed (${response.status}).`
        );
      }

      if (
        !Array.isArray(
          data?.images
        ) ||
        data.images.length ===
          0
      ) {
        throw new Error(
          "AI did not return any 360° frames."
        );
      }

      const generated =
        data.images
          .filter(
            (
              frame
            ): frame is GeneratedFrame =>
              typeof frame
                ?.angle ===
                "number" &&
              typeof frame
                ?.name ===
                "string" &&
              typeof frame
                ?.base64 ===
                "string" &&
              typeof frame
                ?.mimeType ===
                "string"
          )
          .map(
            (frame) => ({
              ...frame,

              angle:
                clampAngle(
                  frame.angle
                ),
            })
          )
          .sort(
            (a, b) =>
              a.angle -
              b.angle
          );

      if (
        generated.length ===
        0
      ) {
        throw new Error(
          "AI returned invalid 360° frame data."
        );
      }

      setAiFrames(
        generated
      );

      setSuccess(
        selectedTarget
          ?.type ===
        "color"
          ? `${generated.length} AI 360° frames generated for ${selectedColor}. Review them and click Approve & Save.`
          : `${generated.length} AI 360° frames generated for Main Product. Review them and click Approve & Save.`
      );
    } catch (
      generateError
    ) {
      console.error(
        "GENERATE AI 360 ERROR:",
        generateError
      );

      setError(
        generateError instanceof
          Error
          ? generateError.message
          : "360° generation failed."
      );
    } finally {
      setAiLoading(
        false
      );
    }
  }

  /* ==========================================================
     SAVE GENERATED FRAME
  ========================================================== */

  async function saveGeneratedFrame(
    frame: GeneratedFrame
  ): Promise<SavedFrame> {
    const payload: Record<
      string,
      unknown
    > = {
      frame: {
        angle:
          frame.angle,

        name:
          frame.name,

        base64:
          frame.base64,

        mimeType:
          frame.mimeType,
      },
    };

    if (
      selectedTarget?.type ===
      "color"
    ) {
      payload.color =
        selectedColor;
    }

    const response =
      await fetch(
        `/api/admin/products/${productId}/generate-360/save`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const {
      data,
      responseText,
    } =
      await readJsonResponse(
        response
      );

    if (!response.ok) {
      console.error(
        "SAVE AI 360 FRAME ERROR:",
        {
          status:
            response.status,

          responseText,

          data,
        }
      );

      throw new Error(
        data?.error ||
          data?.message ||
          `Unable to save ${frame.angle}° frame.`
      );
    }

    if (
      !data?.frame?.url
    ) {
      throw new Error(
        `Saved 360° frame ${frame.angle}° did not return a Cloudinary URL.`
      );
    }

    return data.frame;
  }

  /* ==========================================================
     FINALIZE 360
  ========================================================== */

  async function finalize360() {
    const payload: Record<
      string,
      unknown
    > = {
      finalize: true,
    };

    if (
      selectedTarget?.type ===
      "color"
    ) {
      payload.color =
        selectedColor;
    }

    const response =
      await fetch(
        `/api/admin/products/${productId}/generate-360/save`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const {
      data,
      responseText,
    } =
      await readJsonResponse(
        response
      );

    if (!response.ok) {
      console.error(
        "FINALIZE 360 ERROR:",
        {
          status:
            response.status,

          responseText,

          data,
        }
      );

      throw new Error(
        data?.error ||
          data?.message ||
          "Unable to finalize 360° product view."
      );
    }

    return data;
  }

  /* ==========================================================
     APPROVE AI
  ========================================================== */

  async function approveAIFrames() {
    if (
      aiFrames.length ===
        0 ||
      aiSaving
    ) {
      return;
    }

    try {
      setAiSaving(true);

      setError("");
      setSuccess("");

      setAiSavedFrames(
        []
      );

      setAiSaveProgress(
        0
      );

      setAiApproved(
        false
      );

      const uploaded: SavedFrame[] =
        [];

      for (
        let index = 0;
        index <
        aiFrames.length;
        index++
      ) {
        const frame =
          aiFrames[index];

        if (!frame) {
          continue;
        }

        const savedFrame =
          await saveGeneratedFrame(
            frame
          );

        uploaded.push(
          savedFrame
        );

        setAiSavedFrames([
          ...uploaded,
        ]);

        setAiSaveProgress(
          index + 1
        );
      }

      await finalize360();

      setAiApproved(
        true
      );

      setSuccess(
        selectedTarget
          ?.type ===
        "color"
          ? `${selectedColor} 360° view saved successfully with ${uploaded.length} frames.`
          : `Main Product 360° view saved successfully with ${uploaded.length} frames.`
      );

      await refreshProductData();
    } catch (saveError) {
      console.error(
        "APPROVE AI 360 ERROR:",
        saveError
      );

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save AI 360° product view."
      );
    } finally {
      setAiSaving(
        false
      );
    }
  }

  /* ==========================================================
     MANUAL VALIDATION
  ========================================================== */

  function validateManualFile(
    file: File
  ): string | null {
    if (
      !MANUAL_ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      return "Only JPG, JPEG, PNG and WEBP images are allowed.";
    }

    const maxBytes =
      MAX_MANUAL_FILE_SIZE_MB *
      1024 *
      1024;

    if (
      file.size >
      maxBytes
    ) {
      return `Each image must be ${MAX_MANUAL_FILE_SIZE_MB}MB or less.`;
    }

    return null;
  }

  /* ==========================================================
     ADD MANUAL FILES
  ========================================================== */

  function addManualFiles(
    files: File[]
  ) {
    if (
      files.length === 0
    ) {
      return;
    }

    setError("");
    setSuccess("");

    for (
      const file of files
    ) {
      const validation =
        validateManualFile(
          file
        );

      if (validation) {
        setError(
          validation
        );

        return;
      }
    }

    setManualFrames(
      (current) => {
        const merged = [
          ...current,

          ...files.map(
            (
              file,
              index
            ) => ({
              id:
                `${Date.now()}-${index}-${Math.random()}`,

              file,

              previewUrl:
                URL.createObjectURL(
                  file
                ),

              angle: 0,

              name:
                file.name ||
                `manual-360-${index}.jpg`,
            })
          ),
        ];

        const angles =
          buildEvenAngles(
            merged.length
          );

        return merged.map(
          (
            frame,
            index
          ) => ({
            ...frame,

            angle:
              angles[index] ??
              0,
          })
        );
      }
    );

    setManualPreviewIndex(
      0
    );
  }

  /* ==========================================================
     MANUAL INPUT
  ========================================================== */

  function handleManualInput(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    if (
      files.length > 0
    ) {
      addManualFiles(
        files
      );
    }

    event.target.value =
      "";
  }

  /* ==========================================================
     MANUAL DROP
  ========================================================== */

  function handleManualDrop(
    event:
      DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    event.stopPropagation();

    setManualDragging(
      false
    );

    if (
      manualSaving
    ) {
      return;
    }

    const files =
      Array.from(
        event.dataTransfer
          .files || []
      );

    addManualFiles(
      files
    );
  }

  /* ==========================================================
     REMOVE MANUAL FRAME
  ========================================================== */

  function removeManualFrame(
    index: number
  ) {
    setManualFrames(
      (current) => {
        const target =
          current[index];

        if (target) {
          URL.revokeObjectURL(
            target.previewUrl
          );
        }

        const updated =
          current.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          );

        const angles =
          buildEvenAngles(
            updated.length
          );

        return updated.map(
          (
            frame,
            itemIndex
          ) => ({
            ...frame,

            angle:
              angles[
                itemIndex
              ] ?? 0,
          })
        );
      }
    );

    setManualPreviewIndex(
      0
    );
  }

  /* ==========================================================
     REMOVE ALL MANUAL
  ========================================================== */

  function removeAllManualFrames() {
    for (
      const frame of
        manualFrames
    ) {
      URL.revokeObjectURL(
        frame.previewUrl
      );
    }

    setManualFrames([]);

    setManualPreviewIndex(
      0
    );

    setManualSavedFrames(
      []
    );

    setManualSaveProgress(
      0
    );
  }

  /* ==========================================================
     MOVE MANUAL FRAME
  ========================================================== */

  function moveManualFrame(
    index: number,
    direction:
      | "left"
      | "right"
  ) {
    setManualFrames(
      (current) => {
        const targetIndex =
          direction ===
          "left"
            ? index - 1
            : index + 1;

        if (
          targetIndex < 0 ||
          targetIndex >=
            current.length
        ) {
          return current;
        }

        const copy = [
          ...current,
        ];

        const source =
          copy[index];

        const target =
          copy[targetIndex];

        if (
          !source ||
          !target
        ) {
          return current;
        }

        copy[index] =
          target;

        copy[targetIndex] =
          source;

        const angles =
          buildEvenAngles(
            copy.length
          );

        return copy.map(
          (
            frame,
            frameIndex
          ) => ({
            ...frame,

            angle:
              angles[
                frameIndex
              ] ?? 0,
          })
        );
      }
    );

    setManualPreviewIndex(
      0
    );
  }

  /* ==========================================================
     UPDATE MANUAL ANGLE
  ========================================================== */

  function updateManualAngle(
    index: number,
    value: number
  ) {
    setManualFrames(
      (current) =>
        current.map(
          (
            frame,
            frameIndex
          ) =>
            frameIndex ===
            index
              ? {
                  ...frame,

                  angle:
                    clampAngle(
                      value
                    ),
                }
              : frame
        )
    );
  }

  /* ==========================================================
     AUTO ASSIGN ANGLES
  ========================================================== */

  function autoAssignManualAngles() {
    setManualFrames(
      (current) => {
        const angles =
          buildEvenAngles(
            current.length
          );

        return current.map(
          (
            frame,
            index
          ) => ({
            ...frame,

            angle:
              angles[index] ??
              0,
          })
        );
      }
    );

    setManualPreviewIndex(
      0
    );
  }

  /* ==========================================================
     SORT MANUAL
  ========================================================== */

  function sortManualByAngle() {
    setManualFrames(
      (current) =>
        [...current].sort(
          (a, b) =>
            a.angle -
            b.angle
        )
    );

    setManualPreviewIndex(
      0
    );
  }

  /* ==========================================================
     SAVE MANUAL FRAME
  ========================================================== */

  async function saveManualFrame(
    frame: ManualFileFrame
  ): Promise<SavedFrame> {
    const {
      base64,
      mimeType,
    } =
      await fileToBase64(
        frame.file
      );

    const payload: Record<
      string,
      unknown
    > = {
      frame: {
        angle:
          frame.angle,

        name:
          frame.name,

        base64,

        mimeType,
      },
    };

    if (
      selectedTarget?.type ===
      "color"
    ) {
      payload.color =
        selectedColor;
    }

    const response =
      await fetch(
        `/api/admin/products/${productId}/generate-360/save`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              payload
            ),
        }
      );

    const {
      data,
      responseText,
    } =
      await readJsonResponse(
        response
      );

    if (!response.ok) {
      console.error(
        "SAVE MANUAL 360 FRAME ERROR:",
        {
          status:
            response.status,

          responseText,

          data,
        }
      );

      throw new Error(
        data?.error ||
          data?.message ||
          `Unable to save ${frame.angle}° frame.`
      );
    }

    if (
      !data?.frame?.url
    ) {
      throw new Error(
        `Cloudinary URL missing for ${frame.angle}° frame.`
      );
    }

    return data.frame;
  }

  /* ==========================================================
     SAVE MANUAL 360
  ========================================================== */

  async function saveManual360() {
    if (
      manualFrames.length ===
        0 ||
      manualSaving
    ) {
      return;
    }

    try {
      setManualSaving(
        true
      );

      setError("");
      setSuccess("");

      setManualSavedFrames(
        []
      );

      setManualSaveProgress(
        0
      );

      const angleSet =
        new Set(
          manualFrames.map(
            (frame) =>
              frame.angle
          )
        );

      if (
        angleSet.size !==
        manualFrames.length
      ) {
        throw new Error(
          "Every manual 360° frame must have a unique angle."
        );
      }

      const sorted =
        [
          ...manualFrames,
        ].sort(
          (a, b) =>
            a.angle -
            b.angle
        );

      const uploaded: SavedFrame[] =
        [];

      for (
        let index = 0;
        index <
        sorted.length;
        index++
      ) {
        const frame =
          sorted[index];

        if (!frame) {
          continue;
        }

        const savedFrame =
          await saveManualFrame(
            frame
          );

        uploaded.push(
          savedFrame
        );

        setManualSavedFrames([
          ...uploaded,
        ]);

        setManualSaveProgress(
          index + 1
        );
      }

      await finalize360();

      setSuccess(
        selectedTarget
          ?.type ===
        "color"
          ? `${selectedColor} manual 360° view saved successfully with ${uploaded.length} frames.`
          : `Main Product manual 360° view saved successfully with ${uploaded.length} frames.`
      );

      await refreshProductData();
    } catch (saveError) {
      console.error(
        "SAVE MANUAL 360 ERROR:",
        saveError
      );

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Unable to save manual 360° product view."
      );
    } finally {
      setManualSaving(
        false
      );
    }
  }

  /* ==========================================================
     REMOVE SAVED 360
  ========================================================== */

  async function removeSaved360() {
    if (
      existingFrames.length ===
      0
    ) {
      return;
    }

    const label =
      selectedTarget
        ?.type ===
      "color"
        ? selectedColor
        : "Main Product";

    const confirmed =
      window.confirm(
        `Remove saved 360° view for ${label}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await fetch(
          `/api/admin/products/${productId}/generate-360/save`,
          {
            method:
              "DELETE",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                color:
                  selectedTarget
                    ?.type ===
                  "color"
                    ? selectedColor
                    : null,
              }),
          }
        );

      const {
        data,
        responseText,
      } =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        console.error(
          "REMOVE PRODUCT 360 ERROR:",
          {
            status:
              response.status,

            responseText,

            data,
          }
        );

        throw new Error(
          data?.error ||
            data?.message ||
            "Unable to remove saved 360° view."
        );
      }

      setSuccess(
        `${label} 360° view removed successfully.`
      );

      await refreshProductData();
    } catch (
      removeError
    ) {
      setError(
        removeError instanceof
          Error
          ? removeError.message
          : "Unable to remove saved 360° view."
      );
    }
  }

  /* ==========================================================
     PREVIEW NAVIGATION
  ========================================================== */

  function previousExistingFrame() {
    if (
      existingFrames.length ===
      0
    ) {
      return;
    }

    setExistingPreviewIndex(
      (current) =>
        current <= 0
          ? existingFrames.length -
            1
          : current - 1
    );
  }

  function nextExistingFrame() {
    if (
      existingFrames.length ===
      0
    ) {
      return;
    }

    setExistingPreviewIndex(
      (current) =>
        current >=
        existingFrames.length -
          1
          ? 0
          : current + 1
    );
  }

  function previousAIFrame() {
    if (
      aiFrames.length ===
      0
    ) {
      return;
    }

    setAiPreviewIndex(
      (current) =>
        current <= 0
          ? aiFrames.length -
            1
          : current - 1
    );
  }

  function nextAIFrame() {
    if (
      aiFrames.length ===
      0
    ) {
      return;
    }

    setAiPreviewIndex(
      (current) =>
        current >=
        aiFrames.length - 1
          ? 0
          : current + 1
    );
  }

  function previousManualFrame() {
    if (
      manualFrames.length ===
      0
    ) {
      return;
    }

    setManualPreviewIndex(
      (current) =>
        current <= 0
          ? manualFrames.length -
            1
          : current - 1
    );
  }

  function nextManualFrame() {
    if (
      manualFrames.length ===
      0
    ) {
      return;
    }

    setManualPreviewIndex(
      (current) =>
        current >=
        manualFrames.length -
          1
          ? 0
          : current + 1
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                <Rotate3D
                  size={22}
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Product 360° View
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Create separate 360° views for the main product and every color.
                </p>
              </div>
            </div>

            <div className="inline-flex self-start rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() =>
                  setMode("ai")
                }
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "ai"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <Sparkles
                  size={16}
                />

                AI Generate
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode(
                    "manual"
                  )
                }
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode ===
                  "manual"
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <Upload
                  size={16}
                />

                Manual Upload
              </button>
            </div>
          </div>

          {/* =================================================
              TARGET SELECTOR
          ================================================= */}

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-700">
              Select Product / Color
            </p>

            <div className="flex flex-wrap gap-2">
              {targetOptions.map(
                (target) => {
                  const active =
                    target.key ===
                    selectedTargetKey;

                  const has360 =
                    cleanSavedFrames(
                      target
                        .product360
                        .frames
                    ).length >
                    0;

                  return (
                    <button
                      key={
                        target.key
                      }
                      type="button"
                      onClick={() =>
                        setSelectedTargetKey(
                          target.key
                        )
                      }
                      className={`relative rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {
                        target.label
                      }

                      {has360 && (
                        <span
                          className={`ml-2 inline-block h-2 w-2 rounded-full ${
                            active
                              ? "bg-green-300"
                              : "bg-green-500"
                          }`}
                        />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Currently editing:{" "}
              <strong className="text-gray-800">
                {
                  selectedTarget
                    ?.label
                }
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* =====================================================
          EXISTING SAVED VIEW
      ===================================================== */}

      {existingFrames.length >
        0 && (
        <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={20}
                  className="text-green-600"
                />

                <h3 className="text-lg font-bold text-gray-900">
                  {
                    selectedTarget
                      ?.label
                  }{" "}
                  Saved 360°
                </h3>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {
                  existingFrames.length
                }{" "}
                frames
                {existingEnabled
                  ? " • Enabled"
                  : " • Saved"}
              </p>
            </div>

            <button
              type="button"
              onClick={
                removeSaved360
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2
                size={16}
              />

              Remove 360°
            </button>
          </div>

          {existingPreviewFrame && (
            <>
              <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4">
                <img
                  src={
                    existingPreviewFrame.url
                  }
                  alt={`${selectedTarget?.label} 360 angle ${existingPreviewFrame.angle}`}
                  className="max-h-[500px] w-full object-contain"
                />

                {existingFrames.length >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={
                        previousExistingFrame
                      }
                      className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
                    >
                      <ChevronLeft
                        size={22}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        nextExistingFrame
                      }
                      className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
                    >
                      <ChevronRight
                        size={22}
                      />
                    </button>
                  </>
                )}

                <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                  {
                    existingPreviewFrame.angle
                  }
                  °
                </div>

                <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow">
                  {existingPreviewIndex +
                    1}{" "}
                  /{" "}
                  {
                    existingFrames.length
                  }
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {existingFrames.map(
                  (
                    frame,
                    index
                  ) => (
                    <button
                      key={`${frame.angle}-${frame.url}`}
                      type="button"
                      onClick={() =>
                        setExistingPreviewIndex(
                          index
                        )
                      }
                      className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        index ===
                        existingPreviewIndex
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {
                        frame.angle
                      }
                      °
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* =====================================================
          AI MODE
      ===================================================== */}

      {mode === "ai" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                AI 360° —{" "}
                {
                  selectedTarget
                    ?.label
                }
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                AI will generate rotation frames using this product/color as the reference.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={
                  generateAI360
                }
                disabled={
                  aiLoading ||
                  aiSaving ||
                  manualSaving
                }
                className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : aiFrames.length >
                  0 ? (
                  <RefreshCcw
                    size={17}
                  />
                ) : (
                  <Sparkles
                    size={17}
                  />
                )}

                {aiLoading
                  ? "Generating..."
                  : aiFrames.length >
                      0
                    ? "Regenerate 360°"
                    : "Generate AI 360°"}
              </button>

              {aiFrames.length >
                0 &&
                !aiApproved && (
                  <button
                    type="button"
                    onClick={
                      approveAIFrames
                    }
                    disabled={
                      aiSaving
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-green-600 bg-white px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    {aiSaving ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                      />
                    )}

                    {aiSaving
                      ? "Saving..."
                      : "Approve & Save"}
                  </button>
                )}
            </div>
          </div>

          {aiLoading && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin"
              />

              <p className="mt-4 font-semibold">
                Generating{" "}
                {
                  selectedTarget
                    ?.label
                }{" "}
                360°...
              </p>
            </div>
          )}

          {aiSaving && (
            <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-semibold text-blue-900">
                Uploading AI Frames
              </p>

              <p className="mt-1 text-sm text-blue-700">
                {
                  aiSaveProgress
                }
                /
                {
                  aiFrames.length
                }{" "}
                frames uploaded
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width:
                      aiFrames.length >
                      0
                        ? `${
                            (aiSaveProgress /
                              aiFrames.length) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {aiPreviewFrame && (
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              <img
                src={`data:${aiPreviewFrame.mimeType};base64,${aiPreviewFrame.base64}`}
                alt={`${aiPreviewFrame.angle} degree`}
                className="max-h-[500px] w-full object-contain"
              />

              {aiFrames.length >
                1 && (
                <>
                  <button
                    type="button"
                    onClick={
                      previousAIFrame
                    }
                    className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                  >
                    <ChevronLeft
                      size={22}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      nextAIFrame
                    }
                    className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                  >
                    <ChevronRight
                      size={22}
                    />
                  </button>
                </>
              )}

              <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                {
                  aiPreviewFrame.angle
                }
                °
              </div>
            </div>
          )}

          {aiFrames.length >
            0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {aiFrames.map(
                (
                  frame,
                  index
                ) => {
                  const saved =
                    aiSavedFrames.some(
                      (
                        savedFrame
                      ) =>
                        savedFrame.angle ===
                        frame.angle
                    );

                  return (
                    <button
                      key={`${frame.angle}-${frame.name}`}
                      type="button"
                      onClick={() =>
                        setAiPreviewIndex(
                          index
                        )
                      }
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                      <div className="relative aspect-square bg-gray-50">
                        <img
                          src={`data:${frame.mimeType};base64,${frame.base64}`}
                          alt={`${frame.angle} degree`}
                          className="h-full w-full object-contain"
                        />

                        {saved && (
                          <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-1 text-[10px] font-semibold text-white">
                            Saved
                          </span>
                        )}
                      </div>

                      <div className="px-3 py-2 text-sm font-semibold">
                        {
                          frame.angle
                        }
                        °
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          MANUAL MODE
      ===================================================== */}

      {mode ===
        "manual" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <ImagePlus
                size={20}
              />
            </div>

            <div>
              <h3 className="text-lg font-bold">
                Manual 360° —{" "}
                {
                  selectedTarget
                    ?.label
                }
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Upload 12, 24, 36 or more rotation images.
              </p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              inputRef.current?.click()
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

                inputRef.current?.click();
              }
            }}
            onDragEnter={(
              event
            ) => {
              event.preventDefault();

              setManualDragging(
                true
              );
            }}
            onDragOver={(
              event
            ) => {
              event.preventDefault();

              event.dataTransfer.dropEffect =
                "copy";

              setManualDragging(
                true
              );
            }}
            onDragLeave={() =>
              setManualDragging(
                false
              )
            }
            onDrop={
              handleManualDrop
            }
            className={`flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center ${
              manualDragging
                ? "border-black bg-gray-100"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <Upload
              size={32}
              className="text-gray-500"
            />

            <p className="mt-3 font-semibold">
              Drag & Drop 360° Images
            </p>

            <p className="mt-1 text-sm text-gray-500">
              or click to browse
            </p>

            <p className="mt-3 text-xs text-gray-400">
              JPG, JPEG, PNG,
              WEBP • Max 10MB each
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={
              handleManualInput
            }
            className="hidden"
          />

          {manualFrames.length >
            0 && (
            <>
              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      autoAssignManualAngles
                    }
                    className="rounded-lg border px-4 py-2 text-xs font-semibold"
                  >
                    Auto Assign Angles
                  </button>

                  <button
                    type="button"
                    onClick={
                      sortManualByAngle
                    }
                    className="rounded-lg border px-4 py-2 text-xs font-semibold"
                  >
                    Sort by Angle
                  </button>

                  <button
                    type="button"
                    onClick={
                      removeAllManualFrames
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600"
                  >
                    Remove All
                  </button>
                </div>

                <button
                  type="button"
                  onClick={
                    saveManual360
                  }
                  disabled={
                    manualSaving
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {manualSaving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                  {manualSaving
                    ? "Saving..."
                    : "Save Manual 360°"}
                </button>
              </div>

              {manualSaving && (
                <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
                  <p className="font-semibold text-blue-900">
                    Uploading Manual Frames
                  </p>

                  <p className="mt-1 text-sm text-blue-700">
                    {
                      manualSaveProgress
                    }
                    /
                    {
                      manualFrames.length
                    }{" "}
                    frames uploaded
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{
                        width:
                          manualFrames.length >
                          0
                            ? `${
                                (manualSaveProgress /
                                  manualFrames.length) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              )}

              {manualPreviewFrame && (
                <div className="relative mt-5 flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border bg-gray-50">
                  <img
                    src={
                      manualPreviewFrame.previewUrl
                    }
                    alt="Manual 360 preview"
                    className="max-h-[500px] w-full object-contain"
                  />

                  {manualFrames.length >
                    1 && (
                    <>
                      <button
                        type="button"
                        onClick={
                          previousManualFrame
                        }
                        className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                      >
                        <ChevronLeft
                          size={22}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={
                          nextManualFrame
                        }
                        className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow"
                      >
                        <ChevronRight
                          size={22}
                        />
                      </button>
                    </>
                  )}

                  <span className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {
                      manualPreviewFrame.angle
                    }
                    °
                  </span>

                  <span className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                    {manualPreviewIndex +
                      1}
                    /
                    {
                      manualFrames.length
                    }
                  </span>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {manualFrames.map(
                  (
                    frame,
                    index
                  ) => {
                    const saved =
                      manualSavedFrames.some(
                        (
                          savedFrame
                        ) =>
                          savedFrame.angle ===
                          frame.angle
                      );

                    return (
                      <div
                        key={
                          frame.id
                        }
                        className="overflow-hidden rounded-xl border bg-white"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setManualPreviewIndex(
                              index
                            )
                          }
                          className="block w-full"
                        >
                          <div className="relative aspect-square bg-gray-50">
                            <img
                              src={
                                frame.previewUrl
                              }
                              alt={`Frame ${index + 1}`}
                              className="h-full w-full object-contain"
                            />

                            {saved && (
                              <span className="absolute right-2 top-2 rounded-full bg-green-600 px-2 py-1 text-[10px] font-semibold text-white">
                                Saved
                              </span>
                            )}
                          </div>
                        </button>

                        <div className="space-y-3 p-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="359"
                              value={
                                frame.angle
                              }
                              onChange={(
                                event
                              ) =>
                                updateManualAngle(
                                  index,
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                            />

                            <span>
                              °
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                moveManualFrame(
                                  index,
                                  "left"
                                )
                              }
                              disabled={
                                index ===
                                0
                              }
                              className="flex h-9 flex-1 items-center justify-center rounded-lg border disabled:opacity-30"
                            >
                              <ChevronLeft
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveManualFrame(
                                  index,
                                  "right"
                                )
                              }
                              disabled={
                                index ===
                                manualFrames.length -
                                  1
                              }
                              className="flex h-9 flex-1 items-center justify-center rounded-lg border disabled:opacity-30"
                            >
                              <ChevronRight
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                removeManualFrame(
                                  index
                                )
                              }
                              className="flex h-9 flex-1 items-center justify-center rounded-lg border border-red-200 text-red-600"
                            >
                              <X
                                size={16}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}