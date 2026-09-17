import {
  NextRequest,
  NextResponse,
} from "next/server";

import mammoth from "mammoth";

import {
  PDFParse,
} from "pdf-parse";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";

import {
  sanitizeCmsHtml,
} from "@/lib/cms/sanitizeCmsHtml";

/*
|--------------------------------------------------------------------------
| NODE RUNTIME
|--------------------------------------------------------------------------
*/

export const runtime =
  "nodejs";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const MAX_FILE_SIZE =
  10 *
  1024 *
  1024;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

async function authenticate(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const payload =
    await verifyAdminToken(
      token
    );

  if (!payload.adminId) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const admin =
    await Admin.findById(
      payload.adminId
    )
      .select(
        "role isActive"
      )
      .lean();

  if (
    !admin ||
    admin.isActive ===
      false
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (
    admin.role !==
    "super_admin"
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }
}

/*
|--------------------------------------------------------------------------
| AUTH RESPONSE
|--------------------------------------------------------------------------
*/

function authErrorResponse(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (
    message ===
    "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        success:
          false,

        message:
          "Admin login required.",
      },
      {
        status:
          401,
      }
    );
  }

  if (
    message ===
    "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        success:
          false,

        message:
          "Access denied.",
      },
      {
        status:
          403,
      }
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
  value: string
) {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

/*
|--------------------------------------------------------------------------
| PDF TEXT -> HTML
|--------------------------------------------------------------------------
*/

function pdfTextToHtml(
  text: string
) {
  const normalized =
    String(
      text || ""
    )
      .replace(
        /\r\n/g,
        "\n"
      )
      .replace(
        /\r/g,
        "\n"
      )
      .trim();

  if (!normalized) {
    return "";
  }

  const blocks =
    normalized
      .split(
        /\n\s*\n+/
      )
      .map(
        (block) =>
          block.trim()
      )
      .filter(
        Boolean
      );

  return blocks
    .map(
      (block) => {
        const lines =
          block
            .split(
              "\n"
            )
            .map(
              (line) =>
                line.trim()
            )
            .filter(
              Boolean
            );

        const body =
          lines
            .map(
              escapeHtml
            )
            .join(
              "<br>"
            );

        return `<p>${body}</p>`;
      }
    )
    .join("\n");
}

/*
|--------------------------------------------------------------------------
| FILE EXTENSION
|--------------------------------------------------------------------------
*/

function getExtension(
  fileName: string
) {
  const parts =
    fileName
      .toLowerCase()
      .split(".");

  return parts.length >
    1
    ? parts.pop() ||
        ""
    : "";
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
|
| Accept:
| - .docx
| - .pdf
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    /*
    |--------------------------------------------------------------------------
    | FORM DATA
    |--------------------------------------------------------------------------
    */

    const formData =
      await request.formData();

    const fileValue =
      formData.get(
        "file"
      );

    if (
      !fileValue ||
      !(fileValue instanceof File)
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Please select a Word or PDF file.",
        },
        {
          status:
            400,
        }
      );
    }

    const file =
      fileValue;

    /*
    |--------------------------------------------------------------------------
    | SIZE
    |--------------------------------------------------------------------------
    */

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "File is too large. Maximum allowed size is 10 MB.",
        },
        {
          status:
            413,
        }
      );
    }

    const extension =
      getExtension(
        file.name
      );

    if (
      extension !==
        "docx" &&
      extension !==
        "pdf"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Only .docx and .pdf files are supported.",
        },
        {
          status:
            400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | BUFFER
    |--------------------------------------------------------------------------
    */

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer =
      Buffer.from(
        arrayBuffer
      );

    /*
    |--------------------------------------------------------------------------
    | WORD DOCX
    |--------------------------------------------------------------------------
    */

    if (
      extension ===
      "docx"
    ) {
      const result =
        await mammoth.convertToHtml(
          {
            buffer,
          }
        );

      const cleanHtml =
        sanitizeCmsHtml(
          result.value
        );

      if (
        !cleanHtml.trim()
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "No readable content was found in the Word file.",
          },
          {
            status:
              400,
          }
        );
      }

      return NextResponse.json({
        success:
          true,

        type:
          "docx",

        fileName:
          file.name,

        html:
          cleanHtml,

        warnings:
          result.messages
            .map(
              (
                item
              ) =>
                item.message
            )
            .slice(
              0,
              10
            ),

        message:
          "Word document imported successfully.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PDF
    |--------------------------------------------------------------------------
    */

    const parser =
      new PDFParse({
        data:
          buffer,
      });

    try {
      const result =
        await parser.getText();

      const rawHtml =
        pdfTextToHtml(
          result.text ||
            ""
        );

      const cleanHtml =
        sanitizeCmsHtml(
          rawHtml
        );

      if (
        !cleanHtml.trim()
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "No readable text was found in the PDF.",
          },
          {
            status:
              400,
          }
        );
      }

      return NextResponse.json({
        success:
          true,

        type:
          "pdf",

        fileName:
          file.name,

        html:
          cleanHtml,

        message:
          "PDF imported successfully.",
      });
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error(
      "CONTENT IMPORT ERROR:",
      error
    );

    const authResponse =
      authErrorResponse(
        error
      );

    if (
      authResponse
    ) {
      return authResponse;
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to import file.",
      },
      {
        status:
          500,
      }
    );
  }
}