import {
  NextRequest,
  NextResponse,
} from "next/server";

import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import SalesInvoice from "@/models/SalesInvoice";
import Ledger from "@/models/Ledger";
import AccountTransaction from "@/models/AccountTransaction";

/* =========================================================
   CONFIG
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

function cleanString(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function roundMoney(
  value: number
) {
  return Number(
    Number(
      value || 0
    ).toFixed(2)
  );
}

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
   GET SINGLE INVOICE
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
        "Invalid invoice id."
      );
    }

    const invoice =
      await SalesInvoice.findOne({
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
          "customerLedgerId",
          "name phone email gstNumber address currentBalance ledgerType"
        )
        .lean();

    if (!invoice) {
      return errorResponse(
        "Sales invoice not found.",
        404
      );
    }

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "sales_invoice",

        referenceId:
          invoice._id,

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
          transactionDate:
            1,

          createdAt:
            1,
        })
        .lean();

    return NextResponse.json(
      {
        success: true,

        invoice,

        transactions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_SALES_INVOICE_BY_ID_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to load sales invoice.",
      500
    );
  }
}

/* =========================================================
   CANCEL INVOICE
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
        "Invalid invoice id."
      );
    }

    const invoice =
      await SalesInvoice.findOne({
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

    if (!invoice) {
      return errorResponse(
        "Sales invoice not found.",
        404
      );
    }

    if (
      invoice.status ===
      "cancelled"
    ) {
      return errorResponse(
        "Invoice is already cancelled.",
        409
      );
    }

    const transactions =
      await AccountTransaction.find({
        referenceType:
          "sales_invoice",

        referenceId:
          invoice._id,

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

    /* =====================================================
       REVERSE LEDGER BALANCES
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
       CANCEL INVOICE
    ===================================================== */

    invoice.status =
      "cancelled";

    invoice.accountingPosted =
      false;

    await invoice.save();

    return NextResponse.json(
      {
        success: true,

        message:
          "Sales invoice cancelled and accounting entries reversed successfully.",

        invoice,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "CANCEL_SALES_INVOICE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to cancel invoice.",
      500
    );
  }
}