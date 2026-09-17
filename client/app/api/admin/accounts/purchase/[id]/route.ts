import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import PurchaseBill from "@/models/PurchaseBill";
import Ledger from "@/models/Ledger";
import AccountTransaction from "@/models/AccountTransaction";

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

function roundMoney(
  value: number
) {
  return Number(
    Number(
      value || 0
    ).toFixed(2)
  );
}

function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

/* =========================================================
   AUTH
========================================================= */

async function getAdmin(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    return null;
  }

  try {
    const payload =
      await verifyAdminToken(
        token
      );

    if (
      !payload?.adminId ||
      !payload?.role
    ) {
      return null;
    }

    const role =
      String(
        payload.role
      );

    if (
      !allowedRoles.includes(
        role as AllowedRole
      )
    ) {
      return null;
    }

    return {
      adminId:
        String(
          payload.adminId
        ),

      role,
    };
  } catch {
    return null;
  }
}

/* =========================================================
   GET SINGLE PURCHASE
========================================================= */

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin =
      await getAdmin(
        request
      );

    if (!admin) {
      return errorResponse(
        "Permission denied.",
        403
      );
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return errorResponse(
        "Invalid purchase id."
      );
    }

    const purchase =
      await PurchaseBill.findOne({
        _id: id,

        $or: [
          {
            isDeleted: false,
          },

          {
            isDeleted: {
              $exists: false,
            },
          },
        ],
      })
        .populate(
          "supplierLedgerId",
          "name phone email gstNumber address currentBalance ledgerType"
        )
        .lean();

    if (!purchase) {
      return errorResponse(
        "Purchase bill not found.",
        404
      );
    }

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "purchase",

        referenceId:
          purchase._id,

        $or: [
          {
            isDeleted: false,
          },

          {
            isDeleted: {
              $exists: false,
            },
          },
        ],
      })
        .populate(
          "ledgerId",
          "name ledgerType"
        )
        .populate(
          "contraLedgerId",
          "name ledgerType"
        )
        .sort({
          transactionDate: 1,
          createdAt: 1,
        })
        .lean();

    return NextResponse.json(
      {
        success: true,

        purchase,

        transactions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_PURCHASE_BY_ID_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to load purchase bill.",
      500
    );
  }
}

/* =========================================================
   CANCEL PURCHASE
========================================================= */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin =
      await getAdmin(
        request
      );

    if (!admin) {
      return errorResponse(
        "Permission denied.",
        403
      );
    }

    await connectDB();

    const { id } =
      await context.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return errorResponse(
        "Invalid purchase id."
      );
    }

    const purchase =
      await PurchaseBill.findOne({
        _id: id,

        $or: [
          {
            isDeleted: false,
          },

          {
            isDeleted: {
              $exists: false,
            },
          },
        ],
      });

    if (!purchase) {
      return errorResponse(
        "Purchase bill not found.",
        404
      );
    }

    if (
      purchase.status ===
      "cancelled"
    ) {
      return errorResponse(
        "Purchase bill is already cancelled.",
        409
      );
    }

    /* =====================================================
       LOAD ACTIVE ACCOUNTING ENTRIES
    ===================================================== */

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "purchase",

        referenceId:
          purchase._id,

        $or: [
          {
            isDeleted: false,
          },

          {
            isDeleted: {
              $exists: false,
            },
          },
        ],
      });

    /* =====================================================
       REVERSE EACH LEDGER ENTRY
    ===================================================== */

    for (
      const transaction of
      transactions
    ) {
      const ledger =
        await Ledger.findById(
          transaction.ledgerId
        );

      if (!ledger) {
        continue;
      }

      const debit =
        Number(
          transaction.debit ||
            0
        );

      const credit =
        Number(
          transaction.credit ||
            0
        );

      /*
      |--------------------------------------------------------------------------
      | Original balance posting:
      |
      | currentBalance += debit
      | currentBalance -= credit
      |
      | Reversal:
      |
      | currentBalance -= debit
      | currentBalance += credit
      |--------------------------------------------------------------------------
      */

      ledger.currentBalance =
        roundMoney(
          Number(
            ledger.currentBalance ||
              0
          ) -
            debit +
            credit
        );

      await ledger.save();

      transaction.isDeleted =
        true;

      transaction.deletedAt =
        new Date();

      await transaction.save();
    }

    /* =====================================================
       CANCEL PURCHASE
    ===================================================== */

    purchase.status =
      "cancelled";

    purchase.accountingPosted =
      false;

    await purchase.save();

    return NextResponse.json(
      {
        success: true,

        message:
          "Purchase bill cancelled and accounting entries reversed successfully.",

        purchase,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CANCEL_PURCHASE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to cancel purchase bill.",
      500
    );
  }
}