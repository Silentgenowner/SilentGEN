"use client";

import {
  Check,
  Languages,
  Sparkles,
} from "lucide-react";

import {
  SILENTGEN_LANGUAGES,
  SILENTGEN_LANGUAGE_SELECTION_SUBTITLE,
  SILENTGEN_LANGUAGE_SELECTION_TITLE,
  type SilentGenLanguageCode,
} from "@/lib/ai/languageConfig";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  selectedLanguage:
    | SilentGenLanguageCode
    | null;

  onSelect: (
    language:
      SilentGenLanguageCode
  ) => void;

  compact?: boolean;
};

/*
|--------------------------------------------------------------------------
| LANGUAGE SELECTOR
|--------------------------------------------------------------------------
*/

export default function AILanguageSelector({
  selectedLanguage,
  onSelect,
  compact = false,
}: Props) {
  return (
    <div
      className="
        overflow-hidden
        rounded-[26px]
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-blue-950
          px-5
          py-5
          text-white
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-blue-600
              shadow-sm
            "
          >
            <Languages
              size={22}
            />
          </div>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <h3
                className="
                  text-base
                  font-extrabold
                  leading-6
                "
              >
                {
                  SILENTGEN_LANGUAGE_SELECTION_TITLE
                }
              </h3>

              <Sparkles
                size={14}
                className="
                  shrink-0
                  text-blue-300
                "
              />
            </div>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-300
              "
            >
              {
                SILENTGEN_LANGUAGE_SELECTION_SUBTITLE
              }
            </p>

            <p
              className="
                mt-2
                text-[11px]
                leading-4
                text-slate-400
              "
            >
              अपनी भाषा चुनें • તમારી ભાષા પસંદ કરો
            </p>
          </div>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | LANGUAGE GRID
      |--------------------------------------------------------------------------
      */}

      <div
        className={
          compact
            ? `
              grid
              grid-cols-2
              gap-2
              p-3
            `
            : `
              grid
              grid-cols-2
              gap-2
              p-4
            `
        }
      >
        {SILENTGEN_LANGUAGES.map(
          (
            language
          ) => {
            const selected =
              selectedLanguage ===
              language.code;

            return (
              <button
                key={
                  language.code
                }
                type="button"
                onClick={() =>
                  onSelect(
                    language.code
                  )
                }
                aria-pressed={
                  selected
                }
                aria-label={
                  language.isAuto
                    ? "Use automatic language detection"
                    : `Use ${language.name}`
                }
                className={
                  selected
                    ? `
                      group
                      relative
                      flex
                      min-h-[62px]
                      items-center
                      justify-between
                      gap-2
                      rounded-2xl
                      border
                      border-blue-600
                      bg-blue-50
                      px-3
                      py-3
                      text-left
                      shadow-sm
                      outline-none
                      transition
                      focus-visible:ring-2
                      focus-visible:ring-blue-500
                      focus-visible:ring-offset-2
                    `
                    : `
                      group
                      relative
                      flex
                      min-h-[62px]
                      items-center
                      justify-between
                      gap-2
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      text-left
                      outline-none
                      transition
                      hover:border-blue-300
                      hover:bg-blue-50/60
                      focus-visible:ring-2
                      focus-visible:ring-blue-500
                      focus-visible:ring-offset-2
                    `
                }
              >
                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className={
                      selected
                        ? `
                          truncate
                          text-sm
                          font-bold
                          text-blue-900
                        `
                        : `
                          truncate
                          text-sm
                          font-bold
                          text-slate-900
                        `
                    }
                  >
                    {
                      language.displayName
                    }
                  </p>

                  {language.isAuto ? (
                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[10px]
                        leading-4
                        text-slate-400
                      "
                    >
                      Detect automatically
                    </p>
                  ) : (
                    <p
                      className="
                        mt-0.5
                        truncate
                        text-[10px]
                        leading-4
                        text-slate-400
                      "
                    >
                      {
                        language.name
                      }
                    </p>
                  )}
                </div>

                {selected && (
                  <div
                    className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-blue-600
                      text-white
                      shadow-sm
                    "
                  >
                    <Check
                      size={13}
                      strokeWidth={3}
                    />
                  </div>
                )}
              </button>
            );
          }
        )}
      </div>

      {/*
      |--------------------------------------------------------------------------
      | CURRENT SELECTION
      |--------------------------------------------------------------------------
      */}

      {selectedLanguage && (
        <div
          className="
            border-t
            border-slate-100
            bg-blue-50/60
            px-4
            py-2
          "
        >
          <p
            className="
              text-center
              text-[10px]
              font-medium
              leading-4
              text-blue-700
            "
          >
            {selectedLanguage ===
            "auto"
              ? "Auto Detect selected"
              : `${
                  SILENTGEN_LANGUAGES.find(
                    (
                      language
                    ) =>
                      language.code ===
                      selectedLanguage
                  )
                    ?.displayName ||
                  "Language"
                } selected`}
          </p>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | FOOTER
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          border-t
          border-slate-100
          bg-slate-50
          px-4
          py-3
        "
      >
        <p
          className="
            text-center
            text-[10px]
            leading-4
            text-slate-500
          "
        >
          You can change your language anytime
          from the SilentGEN AI header.
        </p>
      </div>
    </div>
  );
}