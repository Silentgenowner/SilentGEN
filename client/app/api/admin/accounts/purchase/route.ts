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

type PaymentMode =
  | "cash"
  | "bank"
  | "upi"
  | "card"
  | "cheque"
  | "credit"
  | "other";

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

function isPaymentMode(
  value: unknown
): value is PaymentMode {
  return [
    "cash",
    "bank",
    "upi",
    "card",
    "cheque",
    "credit",
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
   RESPONSE
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
   ACTIVE LEDGER FILTER
========================================================= */

function activeLedgerFilter() {
  return {
    isActive: true,

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
  };
}

/* =========================================================
   PURCHASE NUMBER
========================================================= */

async function generatePurchaseNumber() {
  const year =
    new Date().getFullYear();

  const prefix =
    `PB-${year}-`;

  const lastPurchase =
    await PurchaseBill.findOne({
      purchaseNumber: {
        $regex:
          `^${prefix}`,
      },
    })
      .sort({
        purchaseNumber: -1,
      })
      .select(
        "purchaseNumber"
      )
      .lean();

  let nextNumber =
    1;

  if (
    lastPurchase?.purchaseNumber
  ) {
    const lastNumber =
      Number(
        lastPurchase.purchaseNumber.replace(
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
   SYSTEM LEDGER
========================================================= */

async function getOrCreateSystemLedger({
  name,
  ledgerType,
}: {
  name: string;

  ledgerType:
    | "purchase"
    | "gst_input"
    | "cash"
    | "bank"
    | "other";
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
          isDeleted: false,
        },

        {
          isDeleted: {
            $exists: false,
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

    phone: "",
    email: "",
    gstNumber: "",
    address: "",

    openingBalance: 0,

    balanceType:
      ledgerType ===
        "purchase" ||
      ledgerType ===
        "gst_input" ||
      ledgerType ===
        "cash" ||
      ledgerType ===
        "bank"
        ? "debit"
        : "credit",

    currentBalance: 0,

    isActive: true,

    isDeleted: false,

    deletedAt: null,
  });
}

/* =========================================================
   APPLY LEDGER ENTRY
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
   CREATE ACCOUNT TRANSACTION
========================================================= */

async function createTransaction({
  transactionNumber,
  transactionDate,
  transactionType,
  ledgerId,
  contraLedgerId = null,
  debit = 0,
  credit = 0,
  paymentMode = "other",
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
    | "purchase"
    | "payment"
    | "gst";

  ledgerId:
    mongoose.Types.ObjectId;

  contraLedgerId?:
    mongoose.Types.ObjectId | null;

  debit?: number;

  credit?: number;

  paymentMode?:
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
      "Accounting transaction amount must be greater than zero."
    );
  }

  if (
    finalDebit > 0 &&
    finalCredit > 0
  ) {
    throw new Error(
      "Accounting transaction cannot contain both debit and credit."
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
      "purchase",

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

    isDeleted: false,

    deletedAt: null,
  });
}

/* =========================================================
   GET PURCHASE BILLS
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

    const status =
      cleanString(
        searchParams.get(
          "status"
        )
      );

    const paymentStatus =
      cleanString(
        searchParams.get(
          "paymentStatus"
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
              isDeleted: false,
            },

            {
              isDeleted: {
                $exists: false,
              },
            },
          ],
        },
      ];

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
            purchaseNumber:
              regex,
          },

          {
            supplierInvoiceNumber:
              regex,
          },

          {
            supplierName:
              regex,
          },

          {
            supplierPhone:
              regex,
          },

          {
            supplierGstNumber:
              regex,
          },
        ],
      });
    }

    if (
      [
        "draft",
        "issued",
        "cancelled",
      ].includes(
        status
      )
    ) {
      conditions.push({
        status,
      });
    }

    if (
      [
        "unpaid",
        "partial",
        "paid",
      ].includes(
        paymentStatus
      )
    ) {
      conditions.push({
        paymentStatus,
      });
    }

    const filter = {
      $and:
        conditions,
    };

    const [
      purchases,
      total,
      summaryResult,
    ] =
      await Promise.all([
        PurchaseBill.find(
          filter
        )
          .sort({
            purchaseDate: -1,
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(
            limit
          )
          .lean(),

        PurchaseBill.countDocuments(
          filter
        ),

        PurchaseBill.aggregate([
          {
            $match:
              filter,
          },

          {
            $group: {
              _id: null,

              grandTotal: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              paidAmount: {
                $sum: {
                  $ifNull: [
                    "$paidAmount",
                    0,
                  ],
                },
              },

              dueAmount: {
                $sum: {
                  $ifNull: [
                    "$dueAmount",
                    0,
                  ],
                },
              },

              taxableAmount: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
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
            },
          },
        ]),
      ]);

    const summary =
      summaryResult[0] ?? {
        grandTotal: 0,

        paidAmount: 0,

        dueAmount: 0,

        taxableAmount:
          0,

        totalGst: 0,
      };

    return NextResponse.json(
      {
        success: true,

        purchases,

        summary: {
          grandTotal:
            Number(
              summary.grandTotal ??
                0
            ),

          paidAmount:
            Number(
              summary.paidAmount ??
                0
            ),

          dueAmount:
            Number(
              summary.dueAmount ??
                0
            ),

          taxableAmount:
            Number(
              summary.taxableAmount ??
                0
            ),

          totalGst:
            Number(
              summary.totalGst ??
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
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_PURCHASE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to load purchase bills.",
      500
    );
  }
}

/* =========================================================
   POST CREATE PURCHASE
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
       SUPPLIER
    ===================================================== */

    const supplierLedgerId =
      cleanString(
        body.supplierLedgerId
      );

    if (
      !mongoose.Types.ObjectId.isValid(
        supplierLedgerId
      )
    ) {
      return errorResponse(
        "Valid supplier ledger is required."
      );
    }

    const supplierLedger =
      await Ledger.findOne({
        _id:
          supplierLedgerId,

        ledgerType:
          "supplier",

        ...activeLedgerFilter(),
      });

    if (!supplierLedger) {
      return errorResponse(
        "Supplier ledger not found."
      );
    }

    /* =====================================================
       GST TYPE
    ===================================================== */

    const gstType =
      body.gstType ===
      "inter_state"
        ? "inter_state"
        : body.gstType ===
          "none"
        ? "none"
        : "intra_state";

    /* =====================================================
       ITEMS
    ===================================================== */

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length ===
        0
    ) {
      return errorResponse(
        "At least one purchase item is required."
      );
    }

    let subtotal = 0;

    let itemDiscount =
      0;

    let taxableBeforeAdditionalDiscount =
      0;

    const normalizedItems: {
      productId:
        string | null;

      name: string;

      sku: string;

      hsnCode: string;

      quantity: number;

      rate: number;

      discountPercent:
        number;

      discountAmount:
        number;

      taxableAmount:
        number;

      gstRate: number;

      cgst: number;

      sgst: number;

      igst: number;

      total: number;
    }[] = [];

    for (
      const rawItem of
      body.items
    ) {
      if (
        !isRecord(
          rawItem
        )
      ) {
        return errorResponse(
          "Invalid purchase item."
        );
      }

      const name =
        cleanString(
          rawItem.name
        );

      const quantity =
        Number(
          rawItem.quantity
        );

      const rate =
        Number(
          rawItem.rate
        );

      const discountPercent =
        Number(
          rawItem.discountPercent ??
            0
        );

      const rawGstRate =
        Number(
          rawItem.gstRate ??
            0
        );

      if (!name) {
        return errorResponse(
          "Purchase item name is required."
        );
      }

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return errorResponse(
          "Purchase item quantity must be greater than zero."
        );
      }

      if (
        !Number.isFinite(
          rate
        ) ||
        rate < 0
      ) {
        return errorResponse(
          "Purchase item rate is invalid."
        );
      }

      if (
        !Number.isFinite(
          discountPercent
        ) ||
        discountPercent <
          0 ||
        discountPercent >
          100
      ) {
        return errorResponse(
          "Item discount must be between 0 and 100."
        );
      }

      if (
        !Number.isFinite(
          rawGstRate
        ) ||
        rawGstRate < 0 ||
        rawGstRate > 100
      ) {
        return errorResponse(
          "Invalid GST rate."
        );
      }

      const gstRate =
        gstType === "none"
          ? 0
          : rawGstRate;

      const lineSubtotal =
        roundMoney(
          quantity *
            rate
        );

      const discountAmount =
        roundMoney(
          lineSubtotal *
            discountPercent /
            100
        );

      const taxableAmount =
        roundMoney(
          lineSubtotal -
            discountAmount
        );

      subtotal +=
        lineSubtotal;

      itemDiscount +=
        discountAmount;

      taxableBeforeAdditionalDiscount +=
        taxableAmount;

      const rawProductId =
        cleanString(
          rawItem.productId
        );

      normalizedItems.push({
        productId:
          rawProductId &&
          mongoose.Types.ObjectId.isValid(
            rawProductId
          )
            ? rawProductId
            : null,

        name,

        sku:
          cleanString(
            rawItem.sku
          ),

        hsnCode:
          cleanString(
            rawItem.hsnCode
          ),

        quantity:
          roundMoney(
            quantity
          ),

        rate:
          roundMoney(
            rate
          ),

        discountPercent:
          roundMoney(
            discountPercent
          ),

        discountAmount,

        taxableAmount,

        gstRate:
          roundMoney(
            gstRate
          ),

        cgst: 0,

        sgst: 0,

        igst: 0,

        total: 0,
      });
    }

    subtotal =
      roundMoney(
        subtotal
      );

    itemDiscount =
      roundMoney(
        itemDiscount
      );

    taxableBeforeAdditionalDiscount =
      roundMoney(
        taxableBeforeAdditionalDiscount
      );

    /* =====================================================
       ADDITIONAL DISCOUNT
    ===================================================== */

    const rawAdditionalDiscount =
      Number(
        body.additionalDiscount ??
          0
      );

    if (
      !Number.isFinite(
        rawAdditionalDiscount
      ) ||
      rawAdditionalDiscount <
        0
    ) {
      return errorResponse(
        "Additional discount is invalid."
      );
    }

    const additionalDiscount =
      roundMoney(
        rawAdditionalDiscount
      );

    if (
      additionalDiscount >
      taxableBeforeAdditionalDiscount
    ) {
      return errorResponse(
        "Additional discount cannot exceed taxable amount."
      );
    }

    /* =====================================================
       GST CALCULATION
    ===================================================== */

    let distributedDiscount =
      0;

    let taxableAmount =
      0;

    let cgst = 0;

    let sgst = 0;

    let igst = 0;

    for (
      let index = 0;
      index <
      normalizedItems.length;
      index++
    ) {
      const item =
        normalizedItems[
          index
        ];

      let itemAdditionalDiscount =
        0;

      if (
        additionalDiscount >
          0 &&
        taxableBeforeAdditionalDiscount >
          0
      ) {
        if (
          index ===
          normalizedItems.length -
            1
        ) {
          itemAdditionalDiscount =
            roundMoney(
              additionalDiscount -
                distributedDiscount
            );
        } else {
          itemAdditionalDiscount =
            roundMoney(
              additionalDiscount *
                item.taxableAmount /
                taxableBeforeAdditionalDiscount
            );

          distributedDiscount =
            roundMoney(
              distributedDiscount +
                itemAdditionalDiscount
            );
        }
      }

      const finalTaxable =
        Math.max(
          0,
          roundMoney(
            item.taxableAmount -
              itemAdditionalDiscount
          )
        );

      let itemCgst = 0;

      let itemSgst = 0;

      let itemIgst = 0;

      if (
        gstType ===
        "intra_state"
      ) {
        itemCgst =
          roundMoney(
            finalTaxable *
              item.gstRate /
              200
          );

        itemSgst =
          roundMoney(
            finalTaxable *
              item.gstRate /
              200
          );
      }

      if (
        gstType ===
        "inter_state"
      ) {
        itemIgst =
          roundMoney(
            finalTaxable *
              item.gstRate /
              100
          );
      }

      item.taxableAmount =
        finalTaxable;

      item.cgst =
        itemCgst;

      item.sgst =
        itemSgst;

      item.igst =
        itemIgst;

      item.total =
        roundMoney(
          finalTaxable +
            itemCgst +
            itemSgst +
            itemIgst
        );

      taxableAmount +=
        finalTaxable;

      cgst += itemCgst;

      sgst += itemSgst;

      igst += itemIgst;
    }

    taxableAmount =
      roundMoney(
        taxableAmount
      );

    cgst =
      roundMoney(cgst);

    sgst =
      roundMoney(sgst);

    igst =
      roundMoney(igst);

    const totalGst =
      roundMoney(
        cgst +
          sgst +
          igst
      );

    /* =====================================================
       ROUND OFF
    ===================================================== */

    const rawRoundOff =
      Number(
        body.roundOff ??
          0
      );

    if (
      !Number.isFinite(
        rawRoundOff
      )
    ) {
      return errorResponse(
        "Round off value is invalid."
      );
    }

    const roundOff =
      roundMoney(
        rawRoundOff
      );

    const grandTotal =
      roundMoney(
        taxableAmount +
          totalGst +
          roundOff
      );

    if (
      grandTotal < 0
    ) {
      return errorResponse(
        "Grand total cannot be negative."
      );
    }

    /* =====================================================
       PAYMENT
    ===================================================== */

    const rawPaidAmount =
      Number(
        body.paidAmount ??
          0
      );

    if (
      !Number.isFinite(
        rawPaidAmount
      ) ||
      rawPaidAmount < 0
    ) {
      return errorResponse(
        "Paid amount is invalid."
      );
    }

    const paidAmount =
      roundMoney(
        rawPaidAmount
      );

    if (
      paidAmount >
      grandTotal
    ) {
      return errorResponse(
        "Paid amount cannot exceed purchase total."
      );
    }

    const dueAmount =
      roundMoney(
        grandTotal -
          paidAmount
      );

    const paymentStatus =
      dueAmount <= 0
        ? "paid"
        : paidAmount > 0
        ? "partial"
        : "unpaid";

    const paymentMode:
      PaymentMode =
      isPaymentMode(
        body.paymentMode
      )
        ? body.paymentMode
        : paidAmount > 0
        ? "cash"
        : "credit";

    if (
      paidAmount > 0 &&
      paymentMode ===
        "credit"
    ) {
      return errorResponse(
        "Paid purchase cannot use Credit payment mode."
      );
    }

    /* =====================================================
       DATES
    ===================================================== */

    const purchaseDate =
      body.purchaseDate
        ? new Date(
            cleanString(
              body.purchaseDate
            )
          )
        : new Date();

    if (
      Number.isNaN(
        purchaseDate.getTime()
      )
    ) {
      return errorResponse(
        "Invalid purchase date."
      );
    }

    let dueDate:
      Date | null =
      null;

    if (
      body.dueDate
    ) {
      dueDate =
        new Date(
          cleanString(
            body.dueDate
          )
        );

      if (
        Number.isNaN(
          dueDate.getTime()
        )
      ) {
        return errorResponse(
          "Invalid due date."
        );
      }

      if (
        dueDate <
        purchaseDate
      ) {
        return errorResponse(
          "Due date cannot be before purchase date."
        );
      }
    }

    /* =====================================================
       CREATE PURCHASE
    ===================================================== */

    const purchaseNumber =
      await generatePurchaseNumber();

    const purchase =
      await PurchaseBill.create({
        purchaseNumber,

        supplierInvoiceNumber:
          cleanString(
            body.supplierInvoiceNumber
          ),

        purchaseDate,

        dueDate,

        supplierLedgerId:
          supplierLedger._id,

        supplierName:
          supplierLedger.name,

        supplierPhone:
          supplierLedger.phone ??
          "",

        supplierEmail:
          supplierLedger.email ??
          "",

        supplierGstNumber:
          supplierLedger.gstNumber ??
          "",

        billingAddress:
          cleanString(
            body.billingAddress
          ) ||
          cleanString(
            supplierLedger.address
          ),

        placeOfSupply:
          cleanString(
            body.placeOfSupply
          ),

        gstType,

        items:
          normalizedItems,

        subtotal,

        itemDiscount,

        additionalDiscount,

        taxableAmount,

        cgst,

        sgst,

        igst,

        totalGst,

        roundOff,

        grandTotal,

        paidAmount,

        dueAmount,

        paymentStatus,

        status:
          "issued",

        notes:
          cleanString(
            body.notes
          ),

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

    /* =====================================================
       SYSTEM LEDGERS
    ===================================================== */

    const purchaseLedger =
      await getOrCreateSystemLedger({
        name:
          "Purchase",

        ledgerType:
          "purchase",
      });

    let inputCgstLedger:
      any = null;

    let inputSgstLedger:
      any = null;

    let inputIgstLedger:
      any = null;

    if (cgst > 0) {
      inputCgstLedger =
        await getOrCreateSystemLedger({
          name:
            "Input CGST",

          ledgerType:
            "gst_input",
        });
    }

    if (sgst > 0) {
      inputSgstLedger =
        await getOrCreateSystemLedger({
          name:
            "Input SGST",

          ledgerType:
            "gst_input",
        });
    }

    if (igst > 0) {
      inputIgstLedger =
        await getOrCreateSystemLedger({
          name:
            "Input IGST",

          ledgerType:
            "gst_input",
        });
    }

    const transactionIds:
      mongoose.Types.ObjectId[] =
      [];

    /* =====================================================
       PURCHASE DR
    ===================================================== */

    if (
      taxableAmount > 0
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-PUR-DR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "purchase",

          ledgerId:
            purchaseLedger._id,

          contraLedgerId:
            supplierLedger._id,

          debit:
            taxableAmount,

          paymentMode:
            "credit",

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Purchase value for ${purchaseNumber}`,
        });

      transactionIds.push(
        transaction._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          purchaseLedger,

        debit:
          taxableAmount,
      });
    }

    /* =====================================================
       INPUT CGST
    ===================================================== */

    if (
      cgst > 0 &&
      inputCgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-CGST-DR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "gst",

          ledgerId:
            inputCgstLedger._id,

          contraLedgerId:
            supplierLedger._id,

          debit:
            cgst,

          paymentMode:
            "credit",

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Input CGST on ${purchaseNumber}`,

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
       INPUT SGST
    ===================================================== */

    if (
      sgst > 0 &&
      inputSgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-SGST-DR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "gst",

          ledgerId:
            inputSgstLedger._id,

          contraLedgerId:
            supplierLedger._id,

          debit:
            sgst,

          paymentMode:
            "credit",

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Input SGST on ${purchaseNumber}`,

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
       INPUT IGST
    ===================================================== */

    if (
      igst > 0 &&
      inputIgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-IGST-DR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "gst",

          ledgerId:
            inputIgstLedger._id,

          contraLedgerId:
            supplierLedger._id,

          debit:
            igst,

          paymentMode:
            "credit",

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Input IGST on ${purchaseNumber}`,

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
       ROUND OFF
    ===================================================== */

    if (
      roundOff !== 0
    ) {
      const roundOffLedger =
        await getOrCreateSystemLedger({
          name:
            "Purchase Round Off",

          ledgerType:
            "other",
        });

      const debit =
        roundOff > 0
          ? roundOff
          : 0;

      const credit =
        roundOff < 0
          ? Math.abs(
              roundOff
            )
          : 0;

      const transaction =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-ROUND`,

          transactionDate:
            purchaseDate,

          transactionType:
            "purchase",

          ledgerId:
            roundOffLedger._id,

          contraLedgerId:
            supplierLedger._id,

          debit,

          credit,

          paymentMode:
            "other",

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Purchase round off ${purchaseNumber}`,
        });

      transactionIds.push(
        transaction._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          roundOffLedger,

        debit,

        credit,
      });
    }

    /* =====================================================
       SUPPLIER CR
    ===================================================== */

    if (
      grandTotal > 0
    ) {
      const supplierCredit =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-SUP-CR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "purchase",

          ledgerId:
            supplierLedger._id,

          contraLedgerId:
            purchaseLedger._id,

          credit:
            grandTotal,

          paymentMode:
            dueAmount > 0
              ? "credit"
              : paymentMode,

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Purchase Bill ${purchaseNumber}`,

          gstAmount:
            totalGst,

          cgst,

          sgst,

          igst,
        });

      transactionIds.push(
        supplierCredit._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          supplierLedger,

        credit:
          grandTotal,
      });
    }

    /* =====================================================
       PAYMENT
    ===================================================== */

    if (
      paidAmount > 0
    ) {
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
        await getOrCreateSystemLedger({
          name:
            paymentLedgerType ===
            "bank"
              ? "Bank"
              : "Cash",

          ledgerType:
            paymentLedgerType,
        });

      const supplierDebit =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-SUP-DR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "payment",

          ledgerId:
            supplierLedger._id,

          contraLedgerId:
            paymentLedger._id,

          debit:
            paidAmount,

          paymentMode,

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Payment against ${purchaseNumber}`,
        });

      transactionIds.push(
        supplierDebit._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          supplierLedger,

        debit:
          paidAmount,
      });

      const paymentCredit =
        await createTransaction({
          transactionNumber:
            `${purchaseNumber}-PAY-CR`,

          transactionDate:
            purchaseDate,

          transactionType:
            "payment",

          ledgerId:
            paymentLedger._id,

          contraLedgerId:
            supplierLedger._id,

          credit:
            paidAmount,

          paymentMode,

          referenceId:
            purchase._id,

          referenceNumber:
            purchaseNumber,

          narration:
            `Payment against ${purchaseNumber}`,
        });

      transactionIds.push(
        paymentCredit._id as mongoose.Types.ObjectId
      );

      await applyLedgerEntry({
        ledger:
          paymentLedger,

        credit:
          paidAmount,
      });
    }

    /* =====================================================
       MARK ACCOUNTING POSTED
    ===================================================== */

    purchase.accountingPosted =
      true;

    purchase.accountingTransactionIds =
      transactionIds;

    await purchase.save();

    return NextResponse.json(
      {
        success: true,

        message:
          "Purchase bill created successfully.",

        purchase,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_PURCHASE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to create purchase bill.",
      500
    );
  }
}