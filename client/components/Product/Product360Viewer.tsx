"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Frame = {
  angle: number;
  name?: string;
  url?: string;
  base64?: string;
  mimeType?: string;
};

type Props = {
  frames: Frame[];
  enabled?: boolean;
  autoRotateDefault?: boolean;
};

export default function Product360Viewer({
  frames,
  enabled = true,
  autoRotateDefault = false,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoRotate, setAutoRotate] =
    useState(autoRotateDefault);

  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const accumulatedRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  // ============================================================
  // VALID FRAMES
  // ============================================================

  const validFrames = useMemo(() => {
    if (!Array.isArray(frames)) {
      return [];
    }

    return frames.filter(
      (frame): frame is Frame =>
        !!frame &&
        typeof frame === "object" &&
        typeof frame.angle === "number" &&
        Number.isFinite(frame.angle) &&
        (typeof frame.url === "string" ||
          (typeof frame.base64 === "string" &&
            frame.base64.length > 0))
    );
  }, [frames]);

  // ============================================================
  // KEEP CURRENT INDEX SAFE
  // ============================================================

  useEffect(() => {
    setCurrentIndex((current) => {
      if (validFrames.length === 0) {
        return 0;
      }

      if (current >= validFrames.length) {
        return validFrames.length - 1;
      }

      if (current < 0) {
        return 0;
      }

      return current;
    });
  }, [validFrames.length]);

  // ============================================================
  // IMAGE SOURCE
  // ============================================================

  const getImageSrc = useCallback((frame: Frame) => {
    if (typeof frame.url === "string" && frame.url.trim()) {
      return frame.url.trim();
    }

    if (
      typeof frame.base64 === "string" &&
      frame.base64.trim()
    ) {
      const mimeType =
        typeof frame.mimeType === "string" &&
        frame.mimeType.trim()
          ? frame.mimeType.trim()
          : "image/jpeg";

      return `data:${mimeType};base64,${frame.base64}`;
    }

    return "";
  }, []);

  // ============================================================
  // CHANGE FRAME
  // ============================================================

  const changeFrame = useCallback(
    (direction: number) => {
      if (validFrames.length < 2) {
        return;
      }

      setCurrentIndex((current) => {
        let next = current + direction;

        if (next >= validFrames.length) {
          next = 0;
        }

        if (next < 0) {
          next = validFrames.length - 1;
        }

        return next;
      });
    },
    [validFrames.length]
  );

  // ============================================================
  // GO TO FRAME
  // ============================================================

  const goToFrame = useCallback(
    (index: number) => {
      if (!validFrames.length) {
        return;
      }

      const safeIndex = Math.max(
        0,
        Math.min(index, validFrames.length - 1)
      );

      setCurrentIndex(safeIndex);
    },
    [validFrames.length]
  );

  // ============================================================
  // PRELOAD ALL FRAMES
  // ============================================================

  useEffect(() => {
    if (validFrames.length < 2) {
      return;
    }

    const imageObjects: HTMLImageElement[] = [];

    validFrames.forEach((frame) => {
      const src = getImageSrc(frame);

      if (!src) {
        return;
      }

      const image = new Image();

      image.decoding = "async";
      image.src = src;

      imageObjects.push(image);
    });

    return () => {
      imageObjects.forEach((image) => {
        image.src = "";
      });
    };
  }, [validFrames, getImageSrc]);

  // ============================================================
  // AUTO ROTATE
  // ============================================================

  useEffect(() => {
    if (
      !autoRotate ||
      validFrames.length < 2
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!draggingRef.current) {
        changeFrame(1);
      }
    }, 180);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    autoRotate,
    changeFrame,
    validFrames.length,
  ]);

  // ============================================================
  // POINTER DOWN
  // ============================================================

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (validFrames.length < 2) {
      return;
    }

    // Only primary mouse/touch pointer.
    if (!event.isPrimary) {
      return;
    }

    draggingRef.current = true;

    lastXRef.current = event.clientX;
    accumulatedRef.current = 0;
    pointerIdRef.current = event.pointerId;

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  };

  // ============================================================
  // POINTER MOVE
  // ============================================================

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (
      !draggingRef.current ||
      validFrames.length < 2
    ) {
      return;
    }

    if (
      pointerIdRef.current !== null &&
      event.pointerId !== pointerIdRef.current
    ) {
      return;
    }

    const movement =
      event.clientX - lastXRef.current;

    lastXRef.current = event.clientX;

    accumulatedRef.current += movement;

    // Smaller = more sensitive.
    // Larger = less sensitive.
    const threshold = 10;

    while (
      Math.abs(accumulatedRef.current) >=
      threshold
    ) {
      if (accumulatedRef.current < 0) {
        changeFrame(1);
        accumulatedRef.current += threshold;
      } else {
        changeFrame(-1);
        accumulatedRef.current -= threshold;
      }
    }
  };

  // ============================================================
  // POINTER UP / CANCEL
  // ============================================================

  const handlePointerUp = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    draggingRef.current = false;
    accumulatedRef.current = 0;

    if (
      pointerIdRef.current === event.pointerId
    ) {
      pointerIdRef.current = null;
    }

    try {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        );
      }
    } catch {
      // Pointer capture may already be released.
    }
  };

  // ============================================================
  // KEYBOARD CONTROL
  // ============================================================

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeFrame(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      changeFrame(1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToFrame(0);
    }

    if (event.key === "End") {
      event.preventDefault();
      goToFrame(validFrames.length - 1);
    }

    if (event.key === " ") {
      event.preventDefault();
      setAutoRotate((current) => !current);
    }
  };

  // ============================================================
  // NOTHING TO SHOW
  // ============================================================

  if (
    !enabled ||
    validFrames.length === 0
  ) {
    return null;
  }

  const safeCurrentIndex = Math.min(
    currentIndex,
    validFrames.length - 1
  );

  const currentFrame =
    validFrames[safeCurrentIndex];

  if (!currentFrame) {
    return null;
  }

  const imageSrc =
    getImageSrc(currentFrame);

  if (!imageSrc) {
    return null;
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <section className="mt-4 w-full">
      {/* ======================================================
          360 VIEWER
      ====================================================== */}

      <div
        role="application"
        tabIndex={0}
        aria-label="360 degree product viewer"
        aria-roledescription="360 degree product viewer"
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={(event) => {
          if (draggingRef.current) {
            handlePointerUp(event);
          }
        }}
        className={`
          relative
          w-full
          select-none
          overflow-hidden
          rounded-2xl
          border
          border-gray-200
          bg-white
          outline-none
          touch-pan-y
          cursor-grab
          focus:ring-2
          focus:ring-black
          focus:ring-offset-2
          active:cursor-grabbing
        `}
      >
        {/* ====================================================
            PRODUCT IMAGE
        ==================================================== */}

        <div className="flex aspect-square w-full items-center justify-center bg-white">
          <img
            src={imageSrc}
            alt={
              currentFrame.name
                ? `${currentFrame.name} - ${currentFrame.angle} degree view`
                : `360 degree product view - ${currentFrame.angle} degrees`
            }
            draggable={false}
            decoding="async"
            className="
              h-full
              w-full
              object-contain
              pointer-events-none
            "
          />
        </div>

        {/* ====================================================
            360 BADGE
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            left-4
            top-4
            rounded-full
            bg-black
            px-3
            py-1.5
            text-xs
            font-semibold
            text-white
            shadow
          "
        >
          360°
        </div>

        {/* ====================================================
            FRAME NUMBER
        ==================================================== */}

        <div
          className="
            pointer-events-none
            absolute
            right-4
            top-4
            rounded-full
            bg-white/90
            px-3
            py-1.5
            text-xs
            font-medium
            text-gray-700
            shadow
            backdrop-blur
          "
        >
          {safeCurrentIndex + 1} /{" "}
          {validFrames.length}
        </div>

        {/* ====================================================
            PREVIOUS BUTTON
        ==================================================== */}

        <button
          type="button"
          aria-label="Previous 360 frame"
          onClick={() => changeFrame(-1)}
          className="
            absolute
            left-3
            top-1/2
            flex
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/90
            text-2xl
            leading-none
            text-gray-800
            shadow-md
            backdrop-blur
            transition
            hover:bg-white
            active:scale-95
            focus:outline-none
            focus:ring-2
            focus:ring-black
          "
        >
          ‹
        </button>

        {/* ====================================================
            NEXT BUTTON
        ==================================================== */}

        <button
          type="button"
          aria-label="Next 360 frame"
          onClick={() => changeFrame(1)}
          className="
            absolute
            right-3
            top-1/2
            flex
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-white/90
            text-2xl
            leading-none
            text-gray-800
            shadow-md
            backdrop-blur
            transition
            hover:bg-white
            active:scale-95
            focus:outline-none
            focus:ring-2
            focus:ring-black
          "
        >
          ›
        </button>

        {/* ====================================================
            DRAG INSTRUCTION
        ==================================================== */}

        {validFrames.length > 1 && (
          <div
            className="
              pointer-events-none
              absolute
              bottom-4
              left-1/2
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-black/75
              px-4
              py-2
              text-xs
              font-medium
              text-white
              shadow
              backdrop-blur
            "
          >
            ← Drag / Swipe to rotate →
          </div>
        )}
      </div>

      {/* ======================================================
          CONTROLS
      ====================================================== */}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            360° Product View
          </p>

          <p className="text-xs text-gray-500">
            Drag or swipe left/right to rotate
          </p>
        </div>

        {/* ====================================================
            AUTO ROTATE BUTTON
        ==================================================== */}

        {validFrames.length > 1 && (
          <button
            type="button"
            aria-pressed={autoRotate}
            onClick={() =>
              setAutoRotate(
                (current) => !current
              )
            }
            className={`
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              focus:outline-none
              focus:ring-2
              focus:ring-black
              ${
                autoRotate
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            {autoRotate
              ? "⏸ Stop Rotate"
              : "▶ Auto Rotate"}
          </button>
        )}
      </div>

      {/* ======================================================
          FRAME INDICATOR
      ====================================================== */}

      {validFrames.length > 1 && (
        <div
          className="
            mt-3
            flex
            gap-1
            overflow-x-auto
            pb-1
          "
          aria-label="360 degree frame selector"
        >
          {validFrames.map(
            (frame, index) => {
              const isActive =
                index === safeCurrentIndex;

              return (
                <button
                  key={`${frame.angle}-${index}`}
                  type="button"
                  aria-label={`Show ${frame.angle} degree view`}
                  aria-current={
                    isActive
                      ? "true"
                      : undefined
                  }
                  onClick={() =>
                    goToFrame(index)
                  }
                  className={`
                    h-2
                    min-w-7
                    rounded-full
                    transition
                    focus:outline-none
                    focus:ring-2
                    focus:ring-black
                    ${
                      isActive
                        ? "bg-black"
                        : "bg-gray-200 hover:bg-gray-400"
                    }
                  `}
                />
              );
            }
          )}
        </div>
      )}
    </section>
  );
}