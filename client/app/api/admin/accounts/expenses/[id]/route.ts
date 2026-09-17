import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Expense from "@/models/Expense";
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
   GET SINGLE EXPENSE
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
        "Invalid expense id."
      );
    }

    const expense =
      await Expense.findOne({
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
          "expenseLedgerId",
          "name ledgerType currentBalance"
        )
        .populate(
          "paymentLedgerId",
          "name ledgerType currentBalance"
        )
        .populate(
          "vendorLedgerId",
          "name ledgerType currentBalance phone email gstNumber address"
        )
        .lean();

    if (!expense) {
      return errorResponse(
        "Expense not found.",
        404
      );
    }

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "expense",

        referenceId:
          expense._id,

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

        expense,

        transactions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_EXPENSE_BY_ID_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to load expense.",
      500
    );
  }
}

/* =========================================================
   CANCEL EXPENSE
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
        "Invalid expense id."
      );
    }

    const expense =
      await Expense.findOne({
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

    if (!expense) {
      return errorResponse(
        "Expense not found.",
        404
      );
    }

    if (
      expense.status ===
      "cancelled"
    ) {
      return errorResponse(
        "Expense is already cancelled.",
        409
      );
    }

    /* =====================================================
       LOAD ACCOUNTING TRANSACTIONS
    ===================================================== */

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "expense",

        referenceId:
          expense._id,

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
       REVERSE TRANSACTIONS
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
        throw new Error(
          `Ledger missing for transaction ${transaction.transactionNumber}.`
        );
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
       CANCEL EXPENSE
    ===================================================== */

    expense.status =
      "cancelled";

    expense.accountingPosted =
      false;

    await expense.save();

    return NextResponse.json(
      {
        success: true,

        message:
          "Expense cancelled and accounting entries reversed successfully.",

        expense,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CANCEL_EXPENSE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to cancel expense.",
      500
    );
  }
}