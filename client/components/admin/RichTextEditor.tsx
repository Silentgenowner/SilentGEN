"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  EditorContent,
  useEditor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";

import Link from "@tiptap/extension-link";

import {
  TableKit,
} from "@tiptap/extension-table";

import {
  FileText,
  FileUp,
  Loader2,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type ImportResponse = {
  success: boolean;

  type?:
    | "docx"
    | "pdf";

  fileName?: string;

  html?: string;

  message?: string;

  warnings?: string[];
};

type RichTextEditorProps = {
  value: string;

  onChange: (
    html: string
  ) => void;

  variables?: string[];
};

/*
|--------------------------------------------------------------------------
| TOOLBAR BUTTON
|--------------------------------------------------------------------------
*/

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;

  active?: boolean;

  disabled?: boolean;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-black bg-black text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-black hover:text-black"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN EDITOR
|--------------------------------------------------------------------------
*/

export default function RichTextEditor({
  value,
  onChange,
  variables = [],
}: RichTextEditorProps) {
  /*
  |--------------------------------------------------------------------------
  | FILE INPUT REFS
  |--------------------------------------------------------------------------
  */

  const wordInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const pdfInputRef =
    useRef<HTMLInputElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | IMPORT STATE
  |--------------------------------------------------------------------------
  */

  const [
    importing,
    setImporting,
  ] =
    useState<
      | "word"
      | "pdf"
      | null
    >(null);

  const [
    importMessage,
    setImportMessage,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | RESET FILE INPUTS
  |--------------------------------------------------------------------------
  */

  function resetFileInputs() {
    if (
      wordInputRef.current
    ) {
      wordInputRef.current.value =
        "";
    }

    if (
      pdfInputRef.current
    ) {
      pdfInputRef.current.value =
        "";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TIPTAP
  |--------------------------------------------------------------------------
  */

  const editor =
    useEditor({
      /*
      |--------------------------------------------------------------------------
      | IMPORTANT FOR NEXT.JS SSR
      |--------------------------------------------------------------------------
      */

      immediatelyRender:
        false,

      /*
      |--------------------------------------------------------------------------
      | EXTENSIONS
      |--------------------------------------------------------------------------
      */

      extensions: [
        /*
        |--------------------------------------------------------------------------
        | STARTER KIT
        |--------------------------------------------------------------------------
        */

        StarterKit.configure({
          /*
          |--------------------------------------------------------------------------
          | Link is configured separately below.
          |--------------------------------------------------------------------------
          */

          link:
            false,

          /*
          |--------------------------------------------------------------------------
          | HEADINGS
          |--------------------------------------------------------------------------
          */

          heading: {
            levels: [
              1,
              2,
              3,
            ],

            HTMLAttributes: {
              class:
                "mt-6 mb-3 font-bold text-gray-950",
            },
          },

          /*
          |--------------------------------------------------------------------------
          | PARAGRAPH
          |--------------------------------------------------------------------------
          */

          paragraph: {
            HTMLAttributes: {
              class:
                "mb-3 leading-7 text-gray-700",
            },
          },

          /*
          |--------------------------------------------------------------------------
          | BULLET LIST
          |--------------------------------------------------------------------------
          */

          bulletList: {
            HTMLAttributes: {
              class:
                "my-4 list-disc space-y-1 pl-6",
            },
          },

          /*
          |--------------------------------------------------------------------------
          | ORDERED LIST
          |--------------------------------------------------------------------------
          */

          orderedList: {
            HTMLAttributes: {
              class:
                "my-4 list-decimal space-y-1 pl-6",
            },
          },

          /*
          |--------------------------------------------------------------------------
          | BLOCKQUOTE
          |--------------------------------------------------------------------------
          */

          blockquote: {
            HTMLAttributes: {
              class:
                "my-5 border-l-4 border-gray-300 pl-4 italic text-gray-600",
            },
          },

          /*
          |--------------------------------------------------------------------------
          | CODE BLOCK
          |--------------------------------------------------------------------------
          */

          codeBlock: {
            HTMLAttributes: {
              class:
                "my-4 overflow-x-auto rounded-xl bg-gray-950 p-4 font-mono text-sm text-white",
            },
          },
        }),

        /*
        |--------------------------------------------------------------------------
        | LINK
        |--------------------------------------------------------------------------
        */

        Link.configure({
          openOnClick:
            false,

          autolink:
            true,

          protocols: [
            "mailto",
            "tel",
          ],

          HTMLAttributes: {
            class:
              "font-medium text-blue-700 underline underline-offset-2",

            target:
              "_blank",

            rel:
              "noopener noreferrer",
          },
        }),

        /*
        |--------------------------------------------------------------------------
        | TABLE
        |--------------------------------------------------------------------------
        */

        TableKit.configure({
          table: {
            resizable:
              true,

            HTMLAttributes: {
              class:
                "my-5 w-full border-collapse text-sm",
            },
          },

          tableHeader: {
            HTMLAttributes: {
              class:
                "border border-gray-300 bg-gray-100 p-3 text-left font-bold",
            },
          },

          tableCell: {
            HTMLAttributes: {
              class:
                "border border-gray-300 p-3 align-top",
            },
          },

          tableRow: {
            HTMLAttributes: {
              class:
                "border-gray-300",
            },
          },
        }),
      ],

      /*
      |--------------------------------------------------------------------------
      | INITIAL CONTENT
      |--------------------------------------------------------------------------
      */

      content:
        value ||
        "<p></p>",

      /*
      |--------------------------------------------------------------------------
      | EDITOR CLASSES
      |--------------------------------------------------------------------------
      */

      editorProps: {
        attributes: {
          class:
            "min-h-[420px] w-full px-5 py-5 text-sm text-gray-900 outline-none",
        },
      },

      /*
      |--------------------------------------------------------------------------
      | CONTENT UPDATE
      |--------------------------------------------------------------------------
      */

      onUpdate({
        editor:
          currentEditor,
      }) {
        onChange(
          currentEditor.getHTML()
        );
      },
    });

  /*
  |--------------------------------------------------------------------------
  | EXTERNAL VALUE SYNC
  |--------------------------------------------------------------------------
  |
  | Admin Content pageમાંથી બીજી page select થાય ત્યારે editor content
  | correctly update થાય.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue =
      value ||
      "<p></p>";

    const currentValue =
      editor.getHTML();

    if (
      currentValue !==
      nextValue
    ) {
      editor.commands.setContent(
        nextValue,
        {
          emitUpdate:
            false,
        }
      );
    }
  }, [
    editor,
    value,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SET LINK
  |--------------------------------------------------------------------------
  */

  function setLink() {
    if (!editor) {
      return;
    }

    const currentHref =
      String(
        editor.getAttributes(
          "link"
        )?.href ||
          ""
      );

    const url =
      window.prompt(
        "Link URL લખો:",
        currentHref ||
          "https://"
      );

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    if (
      url === null
    ) {
      return;
    }

    const cleanUrl =
      url.trim();

    /*
    |--------------------------------------------------------------------------
    | EMPTY = REMOVE LINK
    |--------------------------------------------------------------------------
    */

    if (
      !cleanUrl
    ) {
      editor
        .chain()
        .focus()
        .extendMarkRange(
          "link"
        )
        .unsetLink()
        .run();

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | SET LINK
    |--------------------------------------------------------------------------
    */

    editor
      .chain()
      .focus()
      .extendMarkRange(
        "link"
      )
      .setLink({
        href:
          cleanUrl,
      })
      .run();
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORT FILE
  |--------------------------------------------------------------------------
  */

  async function importFile(
    file:
      | File
      | undefined,
    type:
      | "word"
      | "pdf"
  ) {
    if (
      !file ||
      !editor
    ) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT CONTENT CHECK
    |--------------------------------------------------------------------------
    */

    const hasContent =
      editor
        .getText()
        .trim()
        .length >
      0;

    /*
    |--------------------------------------------------------------------------
    | CONFIRM REPLACE
    |--------------------------------------------------------------------------
    */

    if (
      hasContent
    ) {
      const confirmed =
        window.confirm(
          "Import કરવાથી હાલનું Page Content replace થશે. Continue કરવું છે?"
        );

      /*
      |--------------------------------------------------------------------------
      | CANCEL FIX
      |--------------------------------------------------------------------------
      |
      | Same file ફરી select કરી શકાય એ માટે input reset કરીએ.
      |
      |--------------------------------------------------------------------------
      */

      if (
        !confirmed
      ) {
        resetFileInputs();

        return;
      }
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | START LOADING
      |--------------------------------------------------------------------------
      */

      setImporting(
        type
      );

      setImportMessage(
        ""
      );

      /*
      |--------------------------------------------------------------------------
      | FORM DATA
      |--------------------------------------------------------------------------
      */

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      /*
      |--------------------------------------------------------------------------
      | REQUEST
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          "/api/admin/content/import",
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              formData,
          }
        );

      const data =
        (await response.json()) as
          ImportResponse;

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      if (
        !response.ok ||
        !data.success ||
        !data.html
      ) {
        setImportMessage(
          data.message ||
            "Unable to import file."
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SET IMPORTED HTML
      |--------------------------------------------------------------------------
      */

      editor.commands.setContent(
        data.html,
        {
          emitUpdate:
            false,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | GET CLEAN EDITOR HTML
      |--------------------------------------------------------------------------
      */

      const html =
        editor.getHTML();

      /*
      |--------------------------------------------------------------------------
      | UPDATE PARENT FORM
      |--------------------------------------------------------------------------
      */

      onChange(
        html
      );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS MESSAGE
      |--------------------------------------------------------------------------
      */

      let message =
        data.message ||
        "Document imported successfully.";

      if (
        data.warnings &&
        data.warnings.length >
          0
      ) {
        message +=
          ` ${data.warnings.length} conversion warning(s) found.`;
      }

      setImportMessage(
        message
      );
    } catch (
      error
    ) {
      console.error(
        "IMPORT FILE ERROR:",
        error
      );

      setImportMessage(
        "Unable to import document."
      );
    } finally {
      /*
      |--------------------------------------------------------------------------
      | RESET
      |--------------------------------------------------------------------------
      */

      setImporting(
        null
      );

      resetFileInputs();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | EDITOR LOADING
  |--------------------------------------------------------------------------
  */

  if (
    !editor
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-300 bg-white">
        <Loader2
          size={
            22
          }
          className="animate-spin text-gray-500"
        />
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
      {/*
      |--------------------------------------------------------------------------
      | IMPORT BAR
      |--------------------------------------------------------------------------
      */}

      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">
            Write or Import
            Content
          </p>

          <p className="mt-1 text-xs text-gray-500">
            સીધું લખો,
            paste કરો અથવા
            Word / PDF import
            કરો.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/*
          |--------------------------------------------------------------------------
          | WORD INPUT
          |--------------------------------------------------------------------------
          */}

          <input
            ref={
              wordInputRef
            }
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(
              event
            ) =>
              void importFile(
                event
                  .target
                  .files?.[0],
                "word"
              )
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | WORD BUTTON
          |--------------------------------------------------------------------------
          */}

          <button
            type="button"
            disabled={
              importing !==
              null
            }
            onClick={() =>
              wordInputRef.current?.click()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ===
            "word" ? (
              <Loader2
                size={
                  15
                }
                className="animate-spin"
              />
            ) : (
              <FileText
                size={
                  15
                }
              />
            )}

            Import Word
          </button>

          {/*
          |--------------------------------------------------------------------------
          | PDF INPUT
          |--------------------------------------------------------------------------
          */}

          <input
            ref={
              pdfInputRef
            }
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(
              event
            ) =>
              void importFile(
                event
                  .target
                  .files?.[0],
                "pdf"
              )
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | PDF BUTTON
          |--------------------------------------------------------------------------
          */}

          <button
            type="button"
            disabled={
              importing !==
              null
            }
            onClick={() =>
              pdfInputRef.current?.click()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importing ===
            "pdf" ? (
              <Loader2
                size={
                  15
                }
                className="animate-spin"
              />
            ) : (
              <FileUp
                size={
                  15
                }
              />
            )}

            Import PDF
          </button>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | TOOLBAR
      |--------------------------------------------------------------------------
      */}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-white p-3">
        {/*
        |--------------------------------------------------------------------------
        | PARAGRAPH
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="P"
          active={
            editor.isActive(
              "paragraph"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .setParagraph()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | H1
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="H1"
          active={
            editor.isActive(
              "heading",
              {
                level:
                  1,
              }
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level:
                  1,
              })
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | H2
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="H2"
          active={
            editor.isActive(
              "heading",
              {
                level:
                  2,
              }
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level:
                  2,
              })
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | H3
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="H3"
          active={
            editor.isActive(
              "heading",
              {
                level:
                  3,
              }
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level:
                  3,
              })
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | BOLD
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Bold"
          active={
            editor.isActive(
              "bold"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | ITALIC
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Italic"
          active={
            editor.isActive(
              "italic"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | STRIKE
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Strike"
          active={
            editor.isActive(
              "strike"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleStrike()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | BULLET LIST
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="• List"
          active={
            editor.isActive(
              "bulletList"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | ORDERED LIST
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="1. List"
          active={
            editor.isActive(
              "orderedList"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | BLOCKQUOTE
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Quote"
          active={
            editor.isActive(
              "blockquote"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | LINK
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Link"
          active={
            editor.isActive(
              "link"
            )
          }
          onClick={
            setLink
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | REMOVE LINK
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Remove Link"
          disabled={
            !editor.isActive(
              "link"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetLink()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | TABLE
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Table 3×3"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({
                rows:
                  3,

                cols:
                  3,

                withHeaderRow:
                  true,
              })
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | ADD ROW
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="+ Row"
          disabled={
            !editor.isActive(
              "table"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .addRowAfter()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | ADD COLUMN
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="+ Column"
          disabled={
            !editor.isActive(
              "table"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .addColumnAfter()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | DELETE TABLE
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Delete Table"
          disabled={
            !editor.isActive(
              "table"
            )
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .deleteTable()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | UNDO
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Undo"
          disabled={
            !editor
              .can()
              .chain()
              .focus()
              .undo()
              .run()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | REDO
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Redo"
          disabled={
            !editor
              .can()
              .chain()
              .focus()
              .redo()
              .run()
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
        />

        {/*
        |--------------------------------------------------------------------------
        | CLEAR FORMATTING
        |--------------------------------------------------------------------------
        */}

        <ToolbarButton
          label="Clear Format"
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .run()
          }
        />
      </div>

      {/*
      |--------------------------------------------------------------------------
      | EDITOR
      |--------------------------------------------------------------------------
      */}

      <div className="bg-white">
        <EditorContent
          editor={
            editor
          }
        />
      </div>

      {/*
      |--------------------------------------------------------------------------
      | DYNAMIC VARIABLES
      |--------------------------------------------------------------------------
      */}

      {variables.length >
        0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-900">
              Dynamic Variables
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Variable પર click
              કરશો તો editorમાં
              cursor જ્યાં હશે ત્યાં
              insert થશે.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {variables.map(
              (
                variable
              ) => (
                <button
                  key={
                    variable
                  }
                  type="button"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertContent(
                        variable
                      )
                      .run()
                  }
                  className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-700 transition hover:border-black hover:bg-black hover:text-white"
                >
                  {
                    variable
                  }
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/*
      |--------------------------------------------------------------------------
      | IMPORT MESSAGE
      |--------------------------------------------------------------------------
      */}

      {importMessage && (
        <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-600">
          {
            importMessage
          }
        </div>
      )}
    </div>
  );
}