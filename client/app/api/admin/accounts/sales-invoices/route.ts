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

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| RESPONSES
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| ACTIVE LEDGER FILTER
|--------------------------------------------------------------------------
*/

function activeLedgerFilter() {
  return {
    isActive:
      true,

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
  };
}

/*
|--------------------------------------------------------------------------
| GENERATE INVOICE NUMBER
|--------------------------------------------------------------------------
*/

async function generateInvoiceNumber() {
  const year =
    new Date().getFullYear();

  const prefix =
    `SI-${year}-`;

  const lastInvoice =
    await SalesInvoice.findOne({
      invoiceNumber: {
        $regex:
          `^${prefix}`,
      },
    })
      .sort({
        invoiceNumber:
          -1,
      })
      .select(
        "invoiceNumber"
      )
      .lean();

  let nextNumber =
    1;

  if (
    lastInvoice?.invoiceNumber
  ) {
    const lastNumber =
      Number(
        lastInvoice.invoiceNumber.replace(
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
        lastNumber +
        1;
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

/*
|--------------------------------------------------------------------------
| GET / CREATE SYSTEM LEDGER
|--------------------------------------------------------------------------
*/

async function getOrCreateSystemLedger({
  name,
  ledgerType,
}: {
  name: string;

  ledgerType:
    | "sales"
    | "gst_output"
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

    balanceType:
      ledgerType ===
        "cash" ||
      ledgerType ===
        "bank"
        ? "debit"
        : "credit",

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

/*
|--------------------------------------------------------------------------
| APPLY LEDGER ENTRY
|--------------------------------------------------------------------------
|
| Debit  => current balance increases
| Credit => current balance decreases
|
|--------------------------------------------------------------------------
*/

async function applyLedgerEntry({
  ledger,
  debit = 0,
  credit = 0,
}: {
  ledger: any;

  debit?: number;

  credit?: number;
}) {
  const currentBalance =
    Number(
      ledger.currentBalance ??
        0
    );

  ledger.currentBalance =
    roundMoney(
      currentBalance +
        Number(
          debit || 0
        ) -
        Number(
          credit || 0
        )
    );

  await ledger.save();
}

/*
|--------------------------------------------------------------------------
| CREATE ACCOUNT TRANSACTION
|--------------------------------------------------------------------------
*/

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
    | "sales"
    | "payment"
    | "receipt"
    | "gst";

  ledgerId:
    mongoose.Types.ObjectId;

  contraLedgerId?:
    mongoose.Types.ObjectId | null;

  debit?:
    number;

  credit?:
    number;

  paymentMode?:
    PaymentMode;

  referenceId:
    mongoose.Types.ObjectId;

  referenceNumber:
    string;

  narration:
    string;

  gstAmount?:
    number;

  cgst?:
    number;

  sgst?:
    number;

  igst?:
    number;
}) {
  const amount =
    roundMoney(
      Math.max(
        Number(
          debit || 0
        ),
        Number(
          credit || 0
        )
      )
    );

  return AccountTransaction.create({
    transactionNumber,

    transactionDate,

    transactionType,

    ledgerId,

    contraLedgerId,

    debit:
      roundMoney(
        debit
      ),

    credit:
      roundMoney(
        credit
      ),

    amount,

    paymentMode,

    referenceType:
      "sales_invoice",

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

/*
|--------------------------------------------------------------------------
| GET SALES INVOICES
|--------------------------------------------------------------------------
*/

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

    const filters:
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

    if (search) {
      const regex =
        new RegExp(
          escapeRegex(
            search
          ),
          "i"
        );

      filters.push({
        $or: [
          {
            invoiceNumber:
              regex,
          },

          {
            customerName:
              regex,
          },

          {
            customerPhone:
              regex,
          },

          {
            customerGstNumber:
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
      filters.push({
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
      filters.push({
        paymentStatus,
      });
    }

    const filter = {
      $and:
        filters,
    };

    const [
      invoices,
      total,
      summary,
    ] =
      await Promise.all([
        SalesInvoice.find(
          filter
        )
          .sort({
            invoiceDate:
              -1,

            createdAt:
              -1,
          })
          .skip(
            (page -
              1) *
              limit
          )
          .limit(
            limit
          )
          .lean(),

        SalesInvoice.countDocuments(
          filter
        ),

        SalesInvoice.aggregate([
          {
            $match: {
              $and:
                filters,
            },
          },

          {
            $group: {
              _id:
                null,

              grandTotal: {
                $sum:
                  "$grandTotal",
              },

              paidAmount: {
                $sum:
                  "$paidAmount",
              },

              dueAmount: {
                $sum:
                  "$dueAmount",
              },

              taxableAmount: {
                $sum:
                  "$taxableAmount",
              },

              totalGst: {
                $sum:
                  "$totalGst",
              },
            },
          },
        ]),
      ]);

    const totals =
      summary[0] ?? {
        grandTotal:
          0,

        paidAmount:
          0,

        dueAmount:
          0,

        taxableAmount:
          0,

        totalGst:
          0,
      };

    return NextResponse.json(
      {
        success:
          true,

        invoices,

        summary: {
          grandTotal:
            Number(
              totals.grandTotal ??
                0
            ),

          paidAmount:
            Number(
              totals.paidAmount ??
                0
            ),

          dueAmount:
            Number(
              totals.dueAmount ??
                0
            ),

          taxableAmount:
            Number(
              totals.taxableAmount ??
                0
            ),

          totalGst:
            Number(
              totals.totalGst ??
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
      "GET_SALES_INVOICE_ERROR:",
      error
    );

    return errorResponse(
      error instanceof
      Error
        ? error.message
        : "Unable to load sales invoices.",
      500
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE SALES INVOICE
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | BODY
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    |--------------------------------------------------------------------------
    */

    const customerLedgerId =
      cleanString(
        body.customerLedgerId
      );

    if (
      !mongoose.Types.ObjectId.isValid(
        customerLedgerId
      )
    ) {
      return errorResponse(
        "Valid customer ledger is required."
      );
    }

    const customerLedger =
      await Ledger.findOne({
        _id:
          customerLedgerId,

        ledgerType:
          "customer",

        ...activeLedgerFilter(),
      });

    if (
      !customerLedger
    ) {
      return errorResponse(
        "Customer ledger not found."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | GST TYPE
    |--------------------------------------------------------------------------
    */

    const gstType =
      body.gstType ===
      "inter_state"
        ? "inter_state"
        : body.gstType ===
          "none"
        ? "none"
        : "intra_state";

    /*
    |--------------------------------------------------------------------------
    | ITEMS
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length ===
        0
    ) {
      return errorResponse(
        "At least one invoice item is required."
      );
    }

    let subtotal =
      0;

    let itemDiscount =
      0;

    let taxableBeforeAdditionalDiscount =
      0;

    const normalizedItems: {
      productId:
        string | null;

      name:
        string;

      sku:
        string;

      hsnCode:
        string;

      quantity:
        number;

      rate:
        number;

      discountPercent:
        number;

      discountAmount:
        number;

      taxableAmount:
        number;

      gstRate:
        number;

      cgst:
        number;

      sgst:
        number;

      igst:
        number;

      total:
        number;
    }[] = [];

    /*
    |--------------------------------------------------------------------------
    | FIRST PASS
    |--------------------------------------------------------------------------
    */

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
          "Invalid invoice item."
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

      const rawDiscount =
        Number(
          rawItem.discountPercent ??
            0
        );

      const rawGstRate =
        Number(
          rawItem.gstRate ??
            0
        );

      if (
        !name
      ) {
        return errorResponse(
          "Invoice item name is required."
        );
      }

      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {
        return errorResponse(
          "Invoice item quantity must be greater than zero."
        );
      }

      if (
        !Number.isFinite(
          rate
        ) ||
        rate < 0
      ) {
        return errorResponse(
          "Invoice item rate is invalid."
        );
      }

      if (
        !Number.isFinite(
          rawDiscount
        ) ||
        rawDiscount <
          0 ||
        rawDiscount >
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
        rawGstRate <
          0 ||
        rawGstRate >
          100
      ) {
        return errorResponse(
          "Invalid GST rate."
        );
      }

      const gstRate =
        gstType ===
        "none"
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
            rawDiscount /
            100
        );

      const lineTaxable =
        roundMoney(
          lineSubtotal -
            discountAmount
        );

      subtotal +=
        lineSubtotal;

      itemDiscount +=
        discountAmount;

      taxableBeforeAdditionalDiscount +=
        lineTaxable;

      const productId =
        cleanString(
          rawItem.productId
        );

      normalizedItems.push({
        productId:
          productId &&
          mongoose.Types.ObjectId.isValid(
            productId
          )
            ? productId
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
            rawDiscount
          ),

        discountAmount,

        taxableAmount:
          lineTaxable,

        gstRate:
          roundMoney(
            gstRate
          ),

        cgst:
          0,

        sgst:
          0,

        igst:
          0,

        total:
          0,
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

    /*
    |--------------------------------------------------------------------------
    | ADDITIONAL DISCOUNT
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | DISTRIBUTE ADDITIONAL DISCOUNT
    |--------------------------------------------------------------------------
    |
    | GST must be calculated after all discounts.
    |
    |--------------------------------------------------------------------------
    */

    let cgst =
      0;

    let sgst =
      0;

    let igst =
      0;

    let taxableAmount =
      0;

    let distributedDiscount =
      0;

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

      const finalItemTaxable =
        Math.max(
          0,
          roundMoney(
            item.taxableAmount -
              itemAdditionalDiscount
          )
        );

      let itemCgst =
        0;

      let itemSgst =
        0;

      let itemIgst =
        0;

      if (
        gstType ===
        "intra_state"
      ) {
        itemCgst =
          roundMoney(
            finalItemTaxable *
              item.gstRate /
              200
          );

        itemSgst =
          roundMoney(
            finalItemTaxable *
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
            finalItemTaxable *
              item.gstRate /
              100
          );
      }

      item.taxableAmount =
        finalItemTaxable;

      item.cgst =
        itemCgst;

      item.sgst =
        itemSgst;

      item.igst =
        itemIgst;

      item.total =
        roundMoney(
          finalItemTaxable +
            itemCgst +
            itemSgst +
            itemIgst
        );

      taxableAmount +=
        finalItemTaxable;

      cgst +=
        itemCgst;

      sgst +=
        itemSgst;

      igst +=
        itemIgst;
    }

    taxableAmount =
      roundMoney(
        taxableAmount
      );

    cgst =
      roundMoney(
        cgst
      );

    sgst =
      roundMoney(
        sgst
      );

    igst =
      roundMoney(
        igst
      );

    const totalGst =
      roundMoney(
        cgst +
          sgst +
          igst
      );

    /*
    |--------------------------------------------------------------------------
    | ROUND OFF + TOTAL
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | PAYMENT
    |--------------------------------------------------------------------------
    */

    const rawPaidAmount =
      Number(
        body.paidAmount ??
          0
      );

    if (
      !Number.isFinite(
        rawPaidAmount
      ) ||
      rawPaidAmount <
        0
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
        "Paid amount cannot exceed invoice total."
      );
    }

    const dueAmount =
      roundMoney(
        grandTotal -
          paidAmount
      );

    const paymentStatus =
      dueAmount <=
      0
        ? "paid"
        : paidAmount >
          0
        ? "partial"
        : "unpaid";

    const paymentMode:
      PaymentMode =
      isPaymentMode(
        body.paymentMode
      )
        ? body.paymentMode
        : paidAmount >
          0
        ? "cash"
        : "credit";

    if (
      paidAmount >
        0 &&
      paymentMode ===
        "credit"
    ) {
      return errorResponse(
        "Paid invoice amount cannot use Credit payment mode."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DATES
    |--------------------------------------------------------------------------
    */

    const invoiceDate =
      body.invoiceDate
        ? new Date(
            cleanString(
              body.invoiceDate
            )
          )
        : new Date();

    if (
      Number.isNaN(
        invoiceDate.getTime()
      )
    ) {
      return errorResponse(
        "Invalid invoice date."
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
    }

    /*
    |--------------------------------------------------------------------------
    | NUMBER
    |--------------------------------------------------------------------------
    */

    const invoiceNumber =
      await generateInvoiceNumber();

    /*
    |--------------------------------------------------------------------------
    | CREATE INVOICE
    |--------------------------------------------------------------------------
    */

    const invoice =
      await SalesInvoice.create({
        invoiceNumber,

        invoiceDate,

        dueDate,

        customerLedgerId:
          customerLedger._id,

        customerName:
          customerLedger.name,

        customerPhone:
          customerLedger.phone ??
          "",

        customerEmail:
          customerLedger.email ??
          "",

        customerGstNumber:
          customerLedger.gstNumber ??
          "",

        billingAddress:
          cleanString(
            body.billingAddress
          ) ||
          cleanString(
            customerLedger.address
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

        terms:
          cleanString(
            body.terms
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

    /*
    |--------------------------------------------------------------------------
    | SYSTEM LEDGERS
    |--------------------------------------------------------------------------
    */

    const salesLedger =
      await getOrCreateSystemLedger({
        name:
          "Sales",

        ledgerType:
          "sales",
      });

    let cgstLedger:
      any = null;

    let sgstLedger:
      any = null;

    let igstLedger:
      any = null;

    if (
      cgst > 0
    ) {
      cgstLedger =
        await getOrCreateSystemLedger({
          name:
            "Output CGST",

          ledgerType:
            "gst_output",
        });
    }

    if (
      sgst > 0
    ) {
      sgstLedger =
        await getOrCreateSystemLedger({
          name:
            "Output SGST",

          ledgerType:
            "gst_output",
        });
    }

    if (
      igst > 0
    ) {
      igstLedger =
        await getOrCreateSystemLedger({
          name:
            "Output IGST",

          ledgerType:
            "gst_output",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNTING ENTRIES
    |--------------------------------------------------------------------------
    */

    const transactionIds:
      mongoose.Types.ObjectId[] =
      [];

    /*
    |--------------------------------------------------------------------------
    | 1. CUSTOMER DR - GRAND TOTAL
    |--------------------------------------------------------------------------
    */

    const customerDebit =
      await createTransaction({
        transactionNumber:
          `${invoiceNumber}-CUS-DR`,

        transactionDate:
          invoiceDate,

        transactionType:
          "sales",

        ledgerId:
          customerLedger._id,

        contraLedgerId:
          salesLedger._id,

        debit:
          grandTotal,

        credit:
          0,

        paymentMode:
          dueAmount >
          0
            ? "credit"
            : paymentMode,

        referenceId:
          invoice._id,

        referenceNumber:
          invoiceNumber,

        narration:
          `Sales Invoice ${invoiceNumber}`,

        gstAmount:
          totalGst,

        cgst,

        sgst,

        igst,
      });

    transactionIds.push(
      customerDebit._id
    );

    await applyLedgerEntry({
      ledger:
        customerLedger,

      debit:
        grandTotal,
    });

    /*
    |--------------------------------------------------------------------------
    | 2. SALES CR - TAXABLE VALUE
    |--------------------------------------------------------------------------
    */

    if (
      taxableAmount >
      0
    ) {
      const salesCredit =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-SALE-CR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "sales",

          ledgerId:
            salesLedger._id,

          contraLedgerId:
            customerLedger._id,

          debit:
            0,

          credit:
            taxableAmount,

          paymentMode:
            "credit",

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Sales value for ${invoiceNumber}`,
        });

      transactionIds.push(
        salesCredit._id
      );

      await applyLedgerEntry({
        ledger:
          salesLedger,

        credit:
          taxableAmount,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. OUTPUT CGST CR
    |--------------------------------------------------------------------------
    */

    if (
      cgst >
        0 &&
      cgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-CGST-CR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "gst",

          ledgerId:
            cgstLedger._id,

          contraLedgerId:
            customerLedger._id,

          credit:
            cgst,

          paymentMode:
            "credit",

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Output CGST on ${invoiceNumber}`,

          gstAmount:
            cgst,

          cgst,
        });

      transactionIds.push(
        transaction._id
      );

      await applyLedgerEntry({
        ledger:
          cgstLedger,

        credit:
          cgst,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. OUTPUT SGST CR
    |--------------------------------------------------------------------------
    */

    if (
      sgst >
        0 &&
      sgstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-SGST-CR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "gst",

          ledgerId:
            sgstLedger._id,

          contraLedgerId:
            customerLedger._id,

          credit:
            sgst,

          paymentMode:
            "credit",

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Output SGST on ${invoiceNumber}`,

          gstAmount:
            sgst,

          sgst,
        });

      transactionIds.push(
        transaction._id
      );

      await applyLedgerEntry({
        ledger:
          sgstLedger,

        credit:
          sgst,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. OUTPUT IGST CR
    |--------------------------------------------------------------------------
    */

    if (
      igst >
        0 &&
      igstLedger
    ) {
      const transaction =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-IGST-CR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "gst",

          ledgerId:
            igstLedger._id,

          contraLedgerId:
            customerLedger._id,

          credit:
            igst,

          paymentMode:
            "credit",

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Output IGST on ${invoiceNumber}`,

          gstAmount:
            igst,

          igst,
        });

      transactionIds.push(
        transaction._id
      );

      await applyLedgerEntry({
        ledger:
          igstLedger,

        credit:
          igst,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ROUND OFF LEDGER
    |--------------------------------------------------------------------------
    */

    if (
      roundOff !==
      0
    ) {
      const roundOffLedger =
        await getOrCreateSystemLedger({
          name:
            "Round Off",

          ledgerType:
            "other",
        });

      /*
      | Positive round off increases invoice:
      | Round Off is credited.
      |
      | Negative round off reduces invoice:
      | Round Off is debited.
      */

      const roundDebit =
        roundOff <
        0
          ? Math.abs(
              roundOff
            )
          : 0;

      const roundCredit =
        roundOff >
        0
          ? roundOff
          : 0;

      const transaction =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-ROUND`,

          transactionDate:
            invoiceDate,

          transactionType:
            "sales",

          ledgerId:
            roundOffLedger._id,

          contraLedgerId:
            customerLedger._id,

          debit:
            roundDebit,

          credit:
            roundCredit,

          paymentMode:
            "other",

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Round off for ${invoiceNumber}`,
        });

      transactionIds.push(
        transaction._id
      );

      await applyLedgerEntry({
        ledger:
          roundOffLedger,

        debit:
          roundDebit,

        credit:
          roundCredit,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT ENTRIES
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | Invoice = 1180
    | Paid    = 500
    |
    | Dr Cash/Bank 500
    | Cr Customer  500
    |
    | Customer outstanding = 680 Dr
    |
    |--------------------------------------------------------------------------
    */

    if (
      paidAmount >
      0
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

      const paymentLedgerName =
        paymentLedgerType ===
        "bank"
          ? "Bank"
          : "Cash";

      const paymentLedger =
        await getOrCreateSystemLedger({
          name:
            paymentLedgerName,

          ledgerType:
            paymentLedgerType,
        });

      /*
      |--------------------------------------------------------------------------
      | CASH / BANK DR
      |--------------------------------------------------------------------------
      */

      const receiptDebit =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-PAY-DR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "receipt",

          ledgerId:
            paymentLedger._id,

          contraLedgerId:
            customerLedger._id,

          debit:
            paidAmount,

          paymentMode,

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Payment received against ${invoiceNumber}`,
        });

      transactionIds.push(
        receiptDebit._id
      );

      await applyLedgerEntry({
        ledger:
          paymentLedger,

        debit:
          paidAmount,
      });

      /*
      |--------------------------------------------------------------------------
      | CUSTOMER CR
      |--------------------------------------------------------------------------
      */

      const customerCredit =
        await createTransaction({
          transactionNumber:
            `${invoiceNumber}-CUS-CR`,

          transactionDate:
            invoiceDate,

          transactionType:
            "receipt",

          ledgerId:
            customerLedger._id,

          contraLedgerId:
            paymentLedger._id,

          credit:
            paidAmount,

          paymentMode,

          referenceId:
            invoice._id,

          referenceNumber:
            invoiceNumber,

          narration:
            `Payment received against ${invoiceNumber}`,
        });

      transactionIds.push(
        customerCredit._id
      );

      await applyLedgerEntry({
        ledger:
          customerLedger,

        credit:
          paidAmount,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MARK ACCOUNTING POSTED
    |--------------------------------------------------------------------------
    */

    invoice.accountingPosted =
      true;

    invoice.accountingTransactionIds =
      transactionIds;

    await invoice.save();

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Sales invoice created and accounting entries posted successfully.",

        invoice,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_SALES_INVOICE_ERROR:",
      error
    );

    if (
      error instanceof
      mongoose.Error
        .ValidationError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Sales invoice validation failed.",

          errors:
            Object.values(
              error.errors
            ).map(
              (
                item
              ) =>
                item.message
            ),
        },
        {
          status:
            400,
        }
      );
    }

    return errorResponse(
      error instanceof
      Error
        ? error.message
        : "Unable to create sales invoice.",
      500
    );
  }
}