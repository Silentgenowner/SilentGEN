import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Ledger from "@/models/Ledger";
import AccountTransaction from "@/models/AccountTransaction";

/*
|--------------------------------------------------------------------------
| ROLES
|--------------------------------------------------------------------------
*/

const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type LedgerType =
  | "customer"
  | "supplier"
  | "sales"
  | "purchase"
  | "expense"
  | "gst_input"
  | "gst_output"
  | "cash"
  | "bank"
  | "other";

type BalanceType =
  | "debit"
  | "credit";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isLedgerType(
  value: unknown
): value is LedgerType {
  return [
    "customer",
    "supplier",
    "sales",
    "purchase",
    "expense",
    "gst_input",
    "gst_output",
    "cash",
    "bank",
    "other",
  ].includes(
    String(value)
  );
}

function isBalanceType(
  value: unknown
): value is BalanceType {
  return (
    value === "debit" ||
    value === "credit"
  );
}

async function hasPermission(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return false;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    return Boolean(
      payload?.adminId &&
        payload?.role &&
        allowedRoles.includes(
          String(
            payload.role
          ) as AllowedRole
        )
    );
  } catch {
    return false;
  }
}

function denied() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Permission denied.",
    },
    {
      status: 403,
    }
  );
}

function invalid(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}

function notFound() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Ledger not found.",
    },
    {
      status: 404,
    }
  );
}

/*
|--------------------------------------------------------------------------
| GET SINGLE LEDGER
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    if (
      !(await hasPermission(
        request
      ))
    ) {
      return denied();
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalid(
        "Invalid ledger id."
      );
    }

    const ledger =
      await Ledger.findOne({
        _id: id,

        $or: [
          {
            isDeleted:
              false,
          },
          {
            isDeleted: {
              $exists:
                false,
            },
          },
        ],
      }).lean();

    if (!ledger) {
      return notFound();
    }

    return NextResponse.json({
      success:
        true,

      ledger,
    });
  } catch (error) {
    console.error(
      "GET_LEDGER_BY_ID_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load ledger.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH LEDGER
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    if (
      !(await hasPermission(
        request
      ))
    ) {
      return denied();
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalid(
        "Invalid ledger id."
      );
    }

    const ledger =
      await Ledger.findOne({
        _id: id,

        $or: [
          {
            isDeleted:
              false,
          },
          {
            isDeleted: {
              $exists:
                false,
            },
          },
        ],
      });

    if (!ledger) {
      return notFound();
    }

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return invalid(
        "Invalid JSON request body."
      );
    }

    if (
      !isRecord(
        body
      )
    ) {
      return invalid(
        "Invalid request body."
      );
    }

    if (
      body.name !==
      undefined
    ) {
      const name =
        cleanString(
          body.name
        );

      if (!name) {
        return invalid(
          "Ledger name is required."
        );
      }

      ledger.name =
        name;
    }

    if (
      body.ledgerType !==
      undefined
    ) {
      if (
        !isLedgerType(
          body.ledgerType
        )
      ) {
        return invalid(
          "Invalid ledger type."
        );
      }

      ledger.ledgerType =
        body.ledgerType;
    }

    if (
      body.phone !==
      undefined
    ) {
      ledger.phone =
        cleanString(
          body.phone
        );
    }

    if (
      body.email !==
      undefined
    ) {
      ledger.email =
        cleanString(
          body.email
        ).toLowerCase();
    }

    if (
      body.gstNumber !==
      undefined
    ) {
      ledger.gstNumber =
        cleanString(
          body.gstNumber
        ).toUpperCase();
    }

    if (
      body.address !==
      undefined
    ) {
      ledger.address =
        cleanString(
          body.address
        );
    }

    if (
      body.isActive !==
      undefined
    ) {
      if (
        typeof body.isActive !==
        "boolean"
      ) {
        return invalid(
          "isActive must be true or false."
        );
      }

      ledger.isActive =
        body.isActive;
    }

    /*
    |--------------------------------------------------------------------------
    | OPENING BALANCE EDIT
    |--------------------------------------------------------------------------
    */

    if (
      body.openingBalance !==
        undefined ||
      body.balanceType !==
        undefined
    ) {
      const openingBalance =
        body.openingBalance !==
        undefined
          ? Number(
              body.openingBalance
            )
          : Number(
              ledger.openingBalance ??
                0
            );

      if (
        !Number.isFinite(
          openingBalance
        ) ||
        openingBalance <
          0
      ) {
        return invalid(
          "Opening balance must be a valid non-negative number."
        );
      }

      const balanceType:
        BalanceType =
        body.balanceType !==
        undefined
          ? isBalanceType(
              body.balanceType
            )
            ? body.balanceType
            : "debit"
          : ledger.balanceType;

      const oldOpening =
        Number(
          ledger.openingBalance ??
            0
        );

      const oldSignedOpening =
        ledger.balanceType ===
        "credit"
          ? -Math.abs(
              oldOpening
            )
          : Math.abs(
              oldOpening
            );

      const newSignedOpening =
        balanceType ===
        "credit"
          ? -Math.abs(
              openingBalance
            )
          : Math.abs(
              openingBalance
            );

      const balanceWithoutOpening =
        Number(
          ledger.currentBalance ??
            0
        ) -
        oldSignedOpening;

      ledger.openingBalance =
        openingBalance;

      ledger.balanceType =
        balanceType;

      ledger.currentBalance =
        balanceWithoutOpening +
        newSignedOpening;

      /*
      |--------------------------------------------------------------------------
      | UPDATE OPENING TRANSACTION
      |--------------------------------------------------------------------------
      */

      const openingTransaction =
        await AccountTransaction.findOne({
          ledgerId:
            ledger._id,

          transactionType:
            "opening",

          referenceType:
            "opening",

          $or: [
            {
              isDeleted:
                false,
            },
            {
              isDeleted: {
                $exists:
                  false,
              },
            },
          ],
        });

      if (
        openingBalance >
        0
      ) {
        if (
          openingTransaction
        ) {
          openingTransaction.debit =
            balanceType ===
            "debit"
              ? openingBalance
              : 0;

          openingTransaction.credit =
            balanceType ===
            "credit"
              ? openingBalance
              : 0;

          openingTransaction.amount =
            openingBalance;

          await openingTransaction.save();
        } else {
          await AccountTransaction.create({
            transactionNumber:
              `OP-${Date.now()}-${String(
                ledger._id
              ).slice(-6)}`,

            transactionDate:
              new Date(),

            transactionType:
              "opening",

            ledgerId:
              ledger._id,

            debit:
              balanceType ===
              "debit"
                ? openingBalance
                : 0,

            credit:
              balanceType ===
              "credit"
                ? openingBalance
                : 0,

            amount:
              openingBalance,

            paymentMode:
              "other",

            referenceType:
              "opening",

            referenceId:
              ledger._id,

            narration:
              "Opening balance",

            isDeleted:
              false,

            deletedAt:
              null,
          });
        }
      } else if (
        openingTransaction
      ) {
        openingTransaction.isDeleted =
          true;

        openingTransaction.deletedAt =
          new Date();

        await openingTransaction.save();
      }
    }

    await ledger.save();

    return NextResponse.json({
      success:
        true,

      message:
        "Ledger updated successfully.",

      ledger,
    });
  } catch (error) {
    console.error(
      "PATCH_LEDGER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to update ledger.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE LEDGER
|--------------------------------------------------------------------------
*/

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    if (
      !(await hasPermission(
        request
      ))
    ) {
      return denied();
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return invalid(
        "Invalid ledger id."
      );
    }

    const ledger =
      await Ledger.findOne({
        _id: id,

        $or: [
          {
            isDeleted:
              false,
          },
          {
            isDeleted: {
              $exists:
                false,
            },
          },
        ],
      });

    if (!ledger) {
      return notFound();
    }

    /*
    |--------------------------------------------------------------------------
    | BLOCK DELETE IF TRANSACTIONS EXIST
    |--------------------------------------------------------------------------
    */

    const transactionCount =
      await AccountTransaction.countDocuments({
        ledgerId:
          ledger._id,

        transactionType: {
          $ne:
            "opening",
        },

        $or: [
          {
            isDeleted:
              false,
          },
          {
            isDeleted: {
              $exists:
                false,
            },
          },
        ],
      });

    if (
      transactionCount >
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "This ledger has accounting transactions and cannot be deleted. You can make it inactive instead.",
        },
        {
          status: 409,
        }
      );
    }

    ledger.isDeleted =
      true;

    ledger.deletedAt =
      new Date();

    ledger.isActive =
      false;

    await ledger.save();

    await AccountTransaction.updateMany(
      {
        ledgerId:
          ledger._id,

        transactionType:
          "opening",
      },
      {
        $set: {
          isDeleted:
            true,

          deletedAt:
            new Date(),
        },
      }
    );

    return NextResponse.json({
      success:
        true,

      message:
        "Ledger deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE_LEDGER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to delete ledger.",
      },
      {
        status: 500,
      }
    );
  }
}