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

type PaymentMode =
  | "cash"
  | "bank"
  | "upi"
  | "card"
  | "cheque"
  | "other";

type GstType =
  | "intra_state"
  | "inter_state"
  | "none";

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

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function toPositiveInteger(
  value: string | null,
  fallback: number
) {
  const parsed =
    Number.parseInt(
      value || "",
      10
    );

  if (
    !Number.isInteger(
      parsed
    ) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isPaymentMode(
  value: unknown
): value is PaymentMode {
  return [
    "cash",
    "bank",
    "upi",
    "card",
    "cheque",
    "other",
  ].includes(
    String(value)
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
   ERROR RESPONSE
========================================================= */

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
   EXPENSE NUMBER
========================================================= */

async function generateExpenseNumber() {
  const year =
    new Date().getFullYear();

  const prefix =
    `EXP-${year}-`;

  const lastExpense =
    await Expense.findOne({
      expenseNumber: {
        $regex:
          `^${prefix}`,
      },
    })
      .sort({
        expenseNumber:
          -1,
      })
      .select(
        "expenseNumber"
      )
      .lean();

  let nextNumber =
    1;

  if (
    lastExpense?.expenseNumber
  ) {
    const lastNumber =
      Number(
        lastExpense.expenseNumber.replace(
          prefix,
          ""
        )
      );

    if (
      Number.isFinite(
        lastNumber
      )
    ) {
      nextNumber =
        lastNumber + 1;
    }
  }

  return (
    prefix +
    String(
      nextNumber
    ).padStart(
      5,
      "0"
    )
  );
}

/* =========================================================
   GET OR CREATE SYSTEM LEDGER
========================================================= */

async function getOrCreateLedger({
  name,
  ledgerType,
  balanceType,
}: {
  name: string;

  ledgerType:
    | "expense"
    | "gst_input"
    | "cash"
    | "bank";

  balanceType:
    | "debit"
    | "credit";
}) {
  const existing =
    await Ledger.findOne({
      name: {
        $regex:
          new RegExp(
            `^${escapeRegex(
              name
            )}$`,
            "i"
          ),
      },

      ledgerType,

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

  if (existing) {
    if (
      existing.isActive ===
      false
    ) {
      existing.isActive =
        true;

      await existing.save();
    }

    return existing;
  }

  return Ledger.create({
    name,

    ledgerType,

    phone:
      "",

    email:
      "",

    gstNumber:
      "",

    address:
      "",

    openingBalance:
      0,

    balanceType,

    currentBalance:
      0,

    isActive:
      true,

    isDeleted:
      false,

    deletedAt:
      null,
  });
}

/* =========================================================
   APPLY LEDGER BALANCE
========================================================= */

async function applyLedgerEntry({
  ledger,
  debit = 0,
  credit = 0,
}: {
  ledger: any;

  debit?: number;

  credit?: number;
}) {
  ledger.currentBalance =
    roundMoney(
      Number(
        ledger.currentBalance ??
          0
      ) +
        Number(
          debit || 0
        ) -
        Number(
          credit || 0
        )
    );

  await ledger.save();
}

/* =========================================================
   CREATE TRANSACTION
========================================================= */

async function createTransaction({
  transactionNumber,
  transactionDate,
  transactionType,
  ledgerId,
  contraLedgerId = null,
  debit = 0,
  credit = 0,
  paymentMode,
  referenceId,
  referenceNumber,
  narration,
  gstAmount = 0,
  cgst = 0,
  sgst = 0,
  igst = 0,
}: {
  transactionNumber: string;

  transactionDate: Date;

  transactionType:
    | "expense"
    | "payment"
    | "gst";

  ledgerId:
    mongoose.Types.ObjectId;

  contraLedgerId?:
    mongoose.Types.ObjectId | null;

  debit?: number;

  credit?: number;

  paymentMode:
    PaymentMode;

  referenceId:
    mongoose.Types.ObjectId;

  referenceNumber:
    string;

  narration:
    string;

  gstAmount?: number;

  cgst?: number;

  sgst?: number;

  igst?: number;
}) {
  const finalDebit =
    roundMoney(
      debit
    );

  const finalCredit =
    roundMoney(
      credit
    );

  if (
    finalDebit <= 0 &&
    finalCredit <= 0
  ) {
    throw new Error(
      "Accounting amount must be greater than zero."
    );
  }

  if (
    finalDebit > 0 &&
    finalCredit > 0
  ) {
    throw new Error(
      "Transaction cannot contain both debit and credit."
    );
  }

  return AccountTransaction.create({
    transactionNumber,

    transactionDate,

    transactionType,

    ledgerId,

    contraLedgerId,

    debit:
      finalDebit,

    credit:
      finalCredit,

    amount:
      Math.max(
        finalDebit,
        finalCredit
      ),

    paymentMode,

    referenceType:
      "expense",

    referenceId,

    referenceNumber,

    narration,

    gstAmount:
      roundMoney(
        gstAmount
      ),

    cgst:
      roundMoney(
        cgst
      ),

    sgst:
      roundMoney(
        sgst
      ),

    igst:
      roundMoney(
        igst
      ),

    isDeleted:
      false,

    deletedAt:
      null,
  });
}

/* =========================================================
   GET EXPENSES
========================================================= */

export async function GET(
  request: NextRequest
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

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const page =
      toPositiveInteger(
        searchParams.get(
          "page"
        ),
        1
      );

    const limit =
      Math.min(
        toPositiveInteger(
          searchParams.get(
            "limit"
          ),
          20
        ),
        100
      );

    const search =
      cleanString(
        searchParams.get(
          "search"
        )
      );

    const category =
      cleanString(
        searchParams.get(
          "category"
        )
      );

    const status =
      cleanString(
        searchParams.get(
          "status"
        )
      );

    const paymentMode =
      cleanString(
        searchParams.get(
          "paymentMode"
        )
      );

    const from =
      cleanString(
        searchParams.get(
          "from"
        )
      );

    const to =
      cleanString(
        searchParams.get(
          "to"
        )
      );

    const conditions:
      Record<
        string,
        unknown
      >[] = [
        {
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
        },
      ];

    /* =====================================================
       SEARCH
    ===================================================== */

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      conditions.push({
        $or: [
          {
            expenseNumber:
              regex,
          },

          {
            category:
              regex,
          },

          {
            description:
              regex,
          },

          {
            vendorName:
              regex,
          },

          {
            billNumber:
              regex,
          },

          {
            gstNumber:
              regex,
          },
        ],
      });
    }

    /* =====================================================
       CATEGORY
    ===================================================== */

    if (category) {
      conditions.push({
        category,
      });
    }

    /* =====================================================
       STATUS
    ===================================================== */

    if (
      [
        "active",
        "cancelled",
      ].includes(
        status
      )
    ) {
      conditions.push({
        status,
      });
    }

    /* =====================================================
       PAYMENT MODE
    ===================================================== */

    if (
      [
        "cash",
        "bank",
        "upi",
        "card",
        "cheque",
        "other",
      ].includes(
        paymentMode
      )
    ) {
      conditions.push({
        paymentMode,
      });
    }

    /* =====================================================
       DATE FILTER
    ===================================================== */

    const dateFilter:
      Record<
        string,
        Date
      > = {};

    if (from) {
      const fromDate =
        new Date(
          `${from}T00:00:00`
        );

      if (
        !Number.isNaN(
          fromDate.getTime()
        )
      ) {
        dateFilter.$gte =
          fromDate;
      }
    }

    if (to) {
      const toDate =
        new Date(
          `${to}T23:59:59.999`
        );

      if (
        !Number.isNaN(
          toDate.getTime()
        )
      ) {
        dateFilter.$lte =
          toDate;
      }
    }

    if (
      Object.keys(
        dateFilter
      ).length > 0
    ) {
      conditions.push({
        expenseDate:
          dateFilter,
      });
    }

    const filter = {
      $and:
        conditions,
    };

    /* =====================================================
       QUERY
    ===================================================== */

    const [
      expenses,
      total,
      summaryResult,
      categories,
    ] =
      await Promise.all([
        Expense.find(
          filter
        )
          .populate(
            "expenseLedgerId",
            "name ledgerType"
          )
          .populate(
            "paymentLedgerId",
            "name ledgerType"
          )
          .sort({
            expenseDate:
              -1,

            createdAt:
              -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(
            limit
          )
          .lean(),

        Expense.countDocuments(
          filter
        ),

        Expense.aggregate([
          {
            $match:
              filter,
          },

          {
            $group: {
              _id:
                null,

              taxableAmount: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
                    0,
                  ],
                },
              },

              cgst: {
                $sum: {
                  $ifNull: [
                    "$cgst",
                    0,
                  ],
                },
              },

              sgst: {
                $sum: {
                  $ifNull: [
                    "$sgst",
                    0,
                  ],
                },
              },

              igst: {
                $sum: {
                  $ifNull: [
                    "$igst",
                    0,
                  ],
                },
              },

              totalGst: {
                $sum: {
                  $ifNull: [
                    "$totalGst",
                    0,
                  ],
                },
              },

              totalAmount: {
                $sum: {
                  $ifNull: [
                    "$totalAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        Expense.distinct(
          "category",
          {
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
          }
        ),
      ]);

    const summary =
      summaryResult[0] ?? {
        taxableAmount:
          0,

        cgst:
          0,

        sgst:
          0,

        igst:
          0,

        totalGst:
          0,

        totalAmount:
          0,
      };

    return NextResponse.json(
      {
        success:
          true,

        expenses,

        categories:
          categories
            .filter(
              (
                value
              ) =>
                Boolean(
                  cleanString(
                    value
                  )
                )
            )
            .sort(),

        summary: {
          taxableAmount:
            Number(
              summary.taxableAmount ??
                0
            ),

          cgst:
            Number(
              summary.cgst ??
                0
            ),

          sgst:
            Number(
              summary.sgst ??
                0
            ),

          igst:
            Number(
              summary.igst ??
                0
            ),

          totalGst:
            Number(
              summary.totalGst ??
                0
            ),

          totalAmount:
            Number(
              summary.totalAmount ??
                0
            ),
        },

        pagination: {
          page,

          limit,

          total,

          totalPages:
            Math.max(
              1,
              Math.ceil(
                total /
                  limit
              )
            ),
        },
      },
      {
        status:
          200,
      }
    );
  } catch (error) {
    console.error(
      "GET_EXPENSES_ERROR:",
      error
    );

    return errorResponse(
      error instanceof
      Error
        ? error.message
        : "Unable to load expenses.",
      500
    );
  }
}

/* =========================================================
   CREATE EXPENSE
========================================================= */

export async function POST(
  request: NextRequest
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

    /* =====================================================
       BODY
    ===================================================== */

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return errorResponse(
        "Invalid JSON request body."
      );
    }

    if (
      !isRecord(
        body
      )
    ) {
      return errorResponse(
        "Invalid request body."
      );
    }

    /* =====================================================
       BASIC DATA
    ===================================================== */

    const category =
      cleanString(
        body.category
      );

    const description =
      cleanString(
        body.description
      );

    const vendorName =
      cleanString(
        body.vendorName
      );

    const billNumber =
      cleanString(
        body.billNumber
      );

    const gstNumber =
      cleanString(
        body.gstNumber
      ).toUpperCase();

    const notes =
      cleanString(
        body.notes
      );

    if (!category) {
      return errorResponse(
        "Expense category is required."
      );
    }

    if (!description) {
      return errorResponse(
        "Expense description is required."
      );
    }

    /* =====================================================
       DATE
    ===================================================== */

    const expenseDate =
      body.expenseDate
        ? new Date(
            cleanString(
              body.expenseDate
            )
          )
        : new Date();

    if (
      Number.isNaN(
        expenseDate.getTime()
      )
    ) {
      return errorResponse(
        "Invalid expense date."
      );
    }

    /* =====================================================
       GST TYPE
    ===================================================== */

    const gstType:
      GstType =
      body.gstType ===
      "inter_state"
        ? "inter_state"
        : body.gstType ===
          "intra_state"
        ? "intra_state"
        : "none";

    /* =====================================================
       TAXABLE AMOUNT
    ===================================================== */

    const taxableAmount =
      roundMoney(
        Number(
          body.taxableAmount ??
            0
        )
      );

    if (
      !Number.isFinite(
        taxableAmount
      ) ||
      taxableAmount <= 0
    ) {
      return errorResponse(
        "Taxable amount must be greater than zero."
      );
    }

    /* =====================================================
       GST RATE
    ===================================================== */

    const rawGstRate =
      Number(
        body.gstRate ??
          0
      );

    if (
      !Number.isFinite(
        rawGstRate
      ) ||
      rawGstRate < 0 ||
      rawGstRate > 100
    ) {
      return errorResponse(
        "GST rate is invalid."
      );
    }

    const gstRate =
      gstType === "none"
        ? 0
        : roundMoney(
            rawGstRate
          );

    /* =====================================================
       GST CALCULATION
    ===================================================== */

    let cgst =
      0;

    let sgst =
      0;

    let igst =
      0;

    if (
      gstType ===
      "intra_state"
    ) {
      cgst =
        roundMoney(
          taxableAmount *
            gstRate /
            200
        );

      sgst =
        roundMoney(
          taxableAmount *
            gstRate /
            200
        );
    }

    if (
      gstType ===
      "inter_state"
    ) {
      igst =
        roundMoney(
          taxableAmount *
            gstRate /
            100
        );
    }

    const totalGst =
      roundMoney(
        cgst +
          sgst +
          igst
      );

    const totalAmount =
      roundMoney(
        taxableAmount +
          totalGst
      );

    /* =====================================================
       PAYMENT MODE
    ===================================================== */

    const paymentMode:
      PaymentMode =
      isPaymentMode(
        body.paymentMode
      )
        ? body.paymentMode
        : "cash";

    /* =====================================================
       VENDOR LEDGER OPTIONAL
    ===================================================== */

    let vendorLedgerId:
      mongoose.Types.ObjectId | null =
      null;

    const rawVendorLedgerId =
      cleanString(
        body.vendorLedgerId
      );

    if (
      rawVendorLedgerId
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          rawVendorLedgerId
        )
      ) {
        return errorResponse(
          "Invalid vendor ledger."
        );
      }

      const vendorLedger =
  await Ledger.findOne({
    _id:
      rawVendorLedgerId,

    isActive:
      true,

    $and: [
      {
        $or: [
          {
            ledgerType:
              "supplier",
          },

          {
            ledgerType:
              "other",
          },
        ],
      },

      {
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
      },
    ],
  });
      if (!vendorLedger) {
        return errorResponse(
          "Vendor ledger not found."
        );
      }

      vendorLedgerId =
        vendorLedger._id;
    }

    /* =====================================================
       EXPENSE LEDGER
    ===================================================== */

    const expenseLedger =
      await getOrCreateLedger({
        name:
          `${category} Expense`,

        ledgerType:
          "expense",

        balanceType:
          "debit",
      });

    /* =====================================================
       PAYMENT LEDGER
    ===================================================== */

    const paymentLedgerType =
      paymentMode ===
        "bank" ||
      paymentMode ===
        "upi" ||
      paymentMode ===
        "card" ||
      paymentMode ===
        "cheque"
        ? "bank"
        : "cash";

    const paymentLedger =
      await getOrCreateLedger({
        name:
          paymentLedgerType ===
          "bank"
            ? "Bank"
            : "Cash",

        ledgerType:
          paymentLedgerType,

        balanceType:
          "debit",
      });

    /* =====================================================
       INPUT GST LEDGERS
    ===================================================== */

    let inputCgstLedger:
      any = null;

    let inputSgstLedger:
      any = null;

    let inputIgstLedger:
      any = null;

    if (cgst > 0) {
      inputCgstLedger =
        await getOrCreateLedger({
          name:
            "Input CGST",

          ledgerType:
            "gst_input",

          balanceType:
            "debit",
        });
    }

    if (sgst > 0) {
      inputSgstLedger =
        await getOrCreateLedger({
          name:
            "Input SGST",

          ledgerType:
            "gst_input",

          balanceType:
            "debit",
        });
    }

    if (igst > 0) {
      inputIgstLedger =
        await getOrCreateLedger({
          name:
            "Input IGST",

          ledgerType:
            "gst_input",

          balanceType:
            "debit",
        });
    }

    /* =====================================================
       NUMBER
    ===================================================== */

    const expenseNumber =
      await generateExpenseNumber();

    /* =====================================================
       CREATE EXPENSE
    ===================================================== */

    const expense =
      await Expense.create({
        expenseNumber,

        expenseDate,

        category,

        description,

        vendorName,

        vendorLedgerId,

        billNumber,

        gstNumber,

        gstType,

        taxableAmount,

        gstRate,

        cgst,

        sgst,

        igst,

        totalGst,

        totalAmount,

        paymentMode,

        expenseLedgerId:
          expenseLedger._id,

        paymentLedgerId:
          paymentLedger._id,

        notes,

        status:
          "active",

        accountingPosted:
          false,

        accountingTransactionIds:
          [],

        createdBy:
          mongoose.Types.ObjectId.isValid(
            admin.adminId
          )
            ? new mongoose.Types.ObjectId(
                admin.adminId
              )
            : null,

        isDeleted:
          false,

        deletedAt:
          null,
      });

    const transactionIds:
      mongoose.Types.ObjectId[] =
      [];

    /* =====================================================
       1. EXPENSE DR
    ===================================================== */

    const expenseDebit =
      await createTransaction({
        transactionNumber:
          `${expenseNumber}-EXP-DR`,

        transactionDate:
          expenseDate,

        transactionType:
          "expense",

        ledgerId:
          expenseLedger._id,

        contraLedgerId:
          paymentLedger._id,

        debit:
          taxableAmount,

        paymentMode,

        referenceId:
          expense._id,

        referenceNumber:
          expenseNumber,

        narration:
          `${category} expense - ${description}`,
      });

    transactionIds.push(
      expenseDebit._id as mongoose.Types.ObjectId
    );

    await applyLedgerEntry({
      ledger:
        expenseLedger,

      debit:
        taxableAmount,
    });

    /* =====================================================
       2. INPUT CGST DR
    ===================================================== */

    if (
      cgst > 0 &&
      inputCgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${expenseNumber}-CGST-DR`,

          transactionDate:
            expenseDate,

          transactionType:
            "gst",

          ledgerId:
            inputCgstLedger._id,

          contraLedgerId:
            paymentLedger._id,

          debit:
            cgst,

          paymentMode,

          referenceId:
            expense._id,

          referenceNumber:
            expenseNumber,

          narration:
            `Input CGST on ${expenseNumber}`,

          gstAmount:
            cgst,

          cgst,
        });

      transactionIds.push(
        transaction._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          inputCgstLedger,

        debit:
          cgst,
      });
    }

    /* =====================================================
       3. INPUT SGST DR
    ===================================================== */

    if (
      sgst > 0 &&
      inputSgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${expenseNumber}-SGST-DR`,

          transactionDate:
            expenseDate,

          transactionType:
            "gst",

          ledgerId:
            inputSgstLedger._id,

          contraLedgerId:
            paymentLedger._id,

          debit:
            sgst,

          paymentMode,

          referenceId:
            expense._id,

          referenceNumber:
            expenseNumber,

          narration:
            `Input SGST on ${expenseNumber}`,

          gstAmount:
            sgst,

          sgst,
        });

      transactionIds.push(
        transaction._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          inputSgstLedger,

        debit:
          sgst,
      });
    }

    /* =====================================================
       4. INPUT IGST DR
    ===================================================== */

    if (
      igst > 0 &&
      inputIgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${expenseNumber}-IGST-DR`,

          transactionDate:
            expenseDate,

          transactionType:
            "gst",

          ledgerId:
            inputIgstLedger._id,

          contraLedgerId:
            paymentLedger._id,

          debit:
            igst,

          paymentMode,

          referenceId:
            expense._id,

          referenceNumber:
            expenseNumber,

          narration:
            `Input IGST on ${expenseNumber}`,

          gstAmount:
            igst,

          igst,
        });

      transactionIds.push(
        transaction._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          inputIgstLedger,

        debit:
          igst,
      });
    }

    /* =====================================================
       5. PAYMENT LEDGER CR
    ===================================================== */

    const paymentCredit =
      await createTransaction({
        transactionNumber:
          `${expenseNumber}-PAY-CR`,

        transactionDate:
          expenseDate,

        transactionType:
          "payment",

        ledgerId:
          paymentLedger._id,

        contraLedgerId:
          expenseLedger._id,

        credit:
          totalAmount,

        paymentMode,

        referenceId:
          expense._id,

        referenceNumber:
          expenseNumber,

        narration:
          `Payment for ${expenseNumber}`,
      });

    transactionIds.push(
      paymentCredit._id as mongoose.Types.ObjectId
    );

    await applyLedgerEntry({
      ledger:
        paymentLedger,

      credit:
        totalAmount,
    });

    /* =====================================================
       MARK POSTED
    ===================================================== */

    expense.accountingPosted =
      true;

    expense.accountingTransactionIds =
      transactionIds;

    await expense.save();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Expense created and accounting entries posted successfully.",

        expense,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_EXPENSE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof
      Error
        ? error.message
        : "Unable to create expense.",
      500
    );
  }
}