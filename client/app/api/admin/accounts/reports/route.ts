import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import SalesInvoice from "@/models/SalesInvoice";
import PurchaseBill from "@/models/PurchaseBill";
import Expense from "@/models/Expense";
import Ledger from "@/models/Ledger";

/* =========================================================
   TYPES
========================================================= */

const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

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

function buildDateFilter(
  from: string,
  to: string
) {
  const result: {
    $gte?: Date;
    $lte?: Date;
  } = {};

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
      result.$gte =
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
      result.$lte =
        toDate;
    }
  }

  return result;
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
   ACTIVE DOCUMENT FILTER
========================================================= */

const activeDocumentFilter = {
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

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    /* =====================================================
       AUTH
    ===================================================== */

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
       QUERY
    ===================================================== */

    const {
      searchParams,
    } =
      new URL(
        request.url
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

    const dateFilter =
      buildDateFilter(
        from,
        to
      );

    const hasDateFilter =
      Object.keys(
        dateFilter
      ).length > 0;

    /* =====================================================
       CONDITIONS
    ===================================================== */

    const salesConditions: Record<
      string,
      unknown
    >[] = [
      activeDocumentFilter,

      {
        status: {
          $ne:
            "cancelled",
        },
      },
    ];

    const purchaseConditions: Record<
      string,
      unknown
    >[] = [
      activeDocumentFilter,

      {
        status: {
          $ne:
            "cancelled",
        },
      },
    ];

    const expenseConditions: Record<
      string,
      unknown
    >[] = [
      activeDocumentFilter,

      {
        status: {
          $ne:
            "cancelled",
        },
      },
    ];

    if (
      hasDateFilter
    ) {
      salesConditions.push({
        invoiceDate:
          dateFilter,
      });

      purchaseConditions.push({
        purchaseDate:
          dateFilter,
      });

      expenseConditions.push({
        expenseDate:
          dateFilter,
      });
    }

    /* =====================================================
       SUMMARY QUERIES
    ===================================================== */

    const [
      salesResult,
      purchaseResult,
      expenseResult,
    ] =
      await Promise.all([
        SalesInvoice.aggregate([
          {
            $match: {
              $and:
                salesConditions,
            },
          },

          {
            $group: {
              _id: null,

              count: {
                $sum: 1,
              },

              taxable: {
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

              gst: {
                $sum: {
                  $ifNull: [
                    "$totalGst",
                    0,
                  ],
                },
              },

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              paid: {
                $sum: {
                  $ifNull: [
                    "$paidAmount",
                    0,
                  ],
                },
              },

              due: {
                $sum: {
                  $ifNull: [
                    "$dueAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        PurchaseBill.aggregate([
          {
            $match: {
              $and:
                purchaseConditions,
            },
          },

          {
            $group: {
              _id: null,

              count: {
                $sum: 1,
              },

              taxable: {
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

              gst: {
                $sum: {
                  $ifNull: [
                    "$totalGst",
                    0,
                  ],
                },
              },

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              paid: {
                $sum: {
                  $ifNull: [
                    "$paidAmount",
                    0,
                  ],
                },
              },

              due: {
                $sum: {
                  $ifNull: [
                    "$dueAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        Expense.aggregate([
          {
            $match: {
              $and:
                expenseConditions,
            },
          },

          {
            $group: {
              _id: null,

              count: {
                $sum: 1,
              },

              taxable: {
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

              gst: {
                $sum: {
                  $ifNull: [
                    "$totalGst",
                    0,
                  ],
                },
              },

              total: {
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
      ]);

    const sales =
      salesResult[0] ?? {
        count: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        gst: 0,
        total: 0,
        paid: 0,
        due: 0,
      };

    const purchases =
      purchaseResult[0] ?? {
        count: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        gst: 0,
        total: 0,
        paid: 0,
        due: 0,
      };

    const expenses =
      expenseResult[0] ?? {
        count: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        gst: 0,
        total: 0,
      };

    /* =====================================================
       SALES DETAIL

       Aggregation is intentional so model TypeScript
       interface does not block report projections.
    ===================================================== */

    const salesDetails =
      await SalesInvoice.aggregate([
        {
          $match: {
            $and:
              salesConditions,
          },
        },

        {
          $sort: {
            invoiceDate: -1,
            createdAt: -1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            invoiceNumber: {
              $ifNull: [
                "$invoiceNumber",
                "",
              ],
            },

            invoiceDate: {
              $ifNull: [
                "$invoiceDate",
                null,
              ],
            },

            customerLedgerId: {
              $cond: [
                {
                  $ifNull: [
                    "$customerLedgerId",
                    false,
                  ],
                },

                {
                  $toString:
                    "$customerLedgerId",
                },

                "",
              ],
            },

            customerName: {
              $ifNull: [
                "$customerName",
                "",
              ],
            },

            customerGstNumber: {
              $ifNull: [
                "$customerGstNumber",
                "",
              ],
            },

            taxableAmount: {
              $ifNull: [
                "$taxableAmount",
                0,
              ],
            },

            cgst: {
              $ifNull: [
                "$cgst",
                0,
              ],
            },

            sgst: {
              $ifNull: [
                "$sgst",
                0,
              ],
            },

            igst: {
              $ifNull: [
                "$igst",
                0,
              ],
            },

            totalGst: {
              $ifNull: [
                "$totalGst",
                0,
              ],
            },

            roundOff: {
              $ifNull: [
                "$roundOff",
                0,
              ],
            },

            grandTotal: {
              $ifNull: [
                "$grandTotal",
                0,
              ],
            },

            paid: {
              $ifNull: [
                "$paidAmount",
                0,
              ],
            },

            due: {
              $ifNull: [
                "$dueAmount",
                0,
              ],
            },

            paymentStatus: {
              $ifNull: [
                "$paymentStatus",
                "",
              ],
            },

            status: {
              $ifNull: [
                "$status",
                "",
              ],
            },

            notes: {
              $ifNull: [
                "$notes",
                "",
              ],
            },
          },
        },
      ]);

    /* =====================================================
       PURCHASE DETAIL
    ===================================================== */

    const purchaseDetails =
      await PurchaseBill.aggregate([
        {
          $match: {
            $and:
              purchaseConditions,
          },
        },

        {
          $sort: {
            purchaseDate: -1,
            createdAt: -1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            purchaseNumber: {
              $ifNull: [
                "$purchaseNumber",
                "",
              ],
            },

            supplierInvoiceNumber: {
              $ifNull: [
                "$supplierInvoiceNumber",
                "",
              ],
            },

            purchaseDate: {
              $ifNull: [
                "$purchaseDate",
                null,
              ],
            },

            supplierLedgerId: {
              $cond: [
                {
                  $ifNull: [
                    "$supplierLedgerId",
                    false,
                  ],
                },

                {
                  $toString:
                    "$supplierLedgerId",
                },

                "",
              ],
            },

            supplierName: {
              $ifNull: [
                "$supplierName",
                "",
              ],
            },

            supplierGstNumber: {
              $ifNull: [
                "$supplierGstNumber",
                "",
              ],
            },

            taxableAmount: {
              $ifNull: [
                "$taxableAmount",
                0,
              ],
            },

            cgst: {
              $ifNull: [
                "$cgst",
                0,
              ],
            },

            sgst: {
              $ifNull: [
                "$sgst",
                0,
              ],
            },

            igst: {
              $ifNull: [
                "$igst",
                0,
              ],
            },

            totalGst: {
              $ifNull: [
                "$totalGst",
                0,
              ],
            },

            roundOff: {
              $ifNull: [
                "$roundOff",
                0,
              ],
            },

            grandTotal: {
              $ifNull: [
                "$grandTotal",
                0,
              ],
            },

            paid: {
              $ifNull: [
                "$paidAmount",
                0,
              ],
            },

            due: {
              $ifNull: [
                "$dueAmount",
                0,
              ],
            },

            paymentStatus: {
              $ifNull: [
                "$paymentStatus",
                "",
              ],
            },

            status: {
              $ifNull: [
                "$status",
                "",
              ],
            },

            notes: {
              $ifNull: [
                "$notes",
                "",
              ],
            },
          },
        },
      ]);

    /* =====================================================
       EXPENSE DETAIL
    ===================================================== */

    const expenseDetails =
      await Expense.aggregate([
        {
          $match: {
            $and:
              expenseConditions,
          },
        },

        {
          $sort: {
            expenseDate: -1,
            createdAt: -1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            expenseNumber: {
              $ifNull: [
                "$expenseNumber",
                "",
              ],
            },

            expenseDate: {
              $ifNull: [
                "$expenseDate",
                null,
              ],
            },

            category: {
              $ifNull: [
                "$category",
                "",
              ],
            },

            description: {
              $ifNull: [
                "$description",
                "",
              ],
            },

            vendorName: {
              $ifNull: [
                "$vendorName",
                "",
              ],
            },

            vendorLedgerId: {
              $cond: [
                {
                  $ifNull: [
                    "$vendorLedgerId",
                    false,
                  ],
                },

                {
                  $toString:
                    "$vendorLedgerId",
                },

                "",
              ],
            },

            billNumber: {
              $ifNull: [
                "$billNumber",
                "",
              ],
            },

            gstNumber: {
              $ifNull: [
                "$gstNumber",
                "",
              ],
            },

            taxableAmount: {
              $ifNull: [
                "$taxableAmount",
                0,
              ],
            },

            gstRate: {
              $ifNull: [
                "$gstRate",
                0,
              ],
            },

            cgst: {
              $ifNull: [
                "$cgst",
                0,
              ],
            },

            sgst: {
              $ifNull: [
                "$sgst",
                0,
              ],
            },

            igst: {
              $ifNull: [
                "$igst",
                0,
              ],
            },

            totalGst: {
              $ifNull: [
                "$totalGst",
                0,
              ],
            },

            totalAmount: {
              $ifNull: [
                "$totalAmount",
                0,
              ],
            },

            paymentMode: {
              $ifNull: [
                "$paymentMode",
                "",
              ],
            },

            status: {
              $ifNull: [
                "$status",
                "",
              ],
            },

            notes: {
              $ifNull: [
                "$notes",
                "",
              ],
            },
          },
        },
      ]);

    /* =====================================================
       RECEIVABLE SUMMARY
    ===================================================== */

    const receivableResult =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType:
                  "customer",
              },

              {
                isActive:
                  true,
              },

              {
                currentBalance: {
                  $gt: 0,
                },
              },
            ],
          },
        },

        {
          $group: {
            _id: null,

            amount: {
              $sum: {
                $ifNull: [
                  "$currentBalance",
                  0,
                ],
              },
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const receivable =
      receivableResult[0] ?? {
        amount: 0,
        count: 0,
      };

    /* =====================================================
       PAYABLE SUMMARY
    ===================================================== */

    const payableResult =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType:
                  "supplier",
              },

              {
                isActive:
                  true,
              },

              {
                currentBalance: {
                  $lt: 0,
                },
              },
            ],
          },
        },

        {
          $group: {
            _id: null,

            amount: {
              $sum: {
                $abs:
                  "$currentBalance",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const payable =
      payableResult[0] ?? {
        amount: 0,
        count: 0,
      };

    /* =====================================================
       RECEIVABLE DETAILS
    ===================================================== */

    const receivableDetails =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType:
                  "customer",
              },

              {
                isActive:
                  true,
              },

              {
                currentBalance: {
                  $gt: 0,
                },
              },
            ],
          },
        },

        {
          $sort: {
            currentBalance:
              -1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            name: {
              $ifNull: [
                "$name",
                "",
              ],
            },

            phone: {
              $ifNull: [
                "$phone",
                "",
              ],
            },

            email: {
              $ifNull: [
                "$email",
                "",
              ],
            },

            gstNumber: {
              $ifNull: [
                "$gstNumber",
                "",
              ],
            },

            address: {
              $ifNull: [
                "$address",
                "",
              ],
            },

            openingBalance: {
              $ifNull: [
                "$openingBalance",
                0,
              ],
            },

            balanceType: {
              $ifNull: [
                "$balanceType",
                "",
              ],
            },

            amount: {
              $ifNull: [
                "$currentBalance",
                0,
              ],
            },
          },
        },
      ]);

    /* =====================================================
       PAYABLE DETAILS
    ===================================================== */

    const payableDetails =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType:
                  "supplier",
              },

              {
                isActive:
                  true,
              },

              {
                currentBalance: {
                  $lt: 0,
                },
              },
            ],
          },
        },

        {
          $sort: {
            currentBalance:
              1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            name: {
              $ifNull: [
                "$name",
                "",
              ],
            },

            phone: {
              $ifNull: [
                "$phone",
                "",
              ],
            },

            email: {
              $ifNull: [
                "$email",
                "",
              ],
            },

            gstNumber: {
              $ifNull: [
                "$gstNumber",
                "",
              ],
            },

            address: {
              $ifNull: [
                "$address",
                "",
              ],
            },

            openingBalance: {
              $ifNull: [
                "$openingBalance",
                0,
              ],
            },

            balanceType: {
              $ifNull: [
                "$balanceType",
                "",
              ],
            },

            amount: {
              $abs: {
                $ifNull: [
                  "$currentBalance",
                  0,
                ],
              },
            },
          },
        },
      ]);

    /* =====================================================
       CASH & BANK
    ===================================================== */

    const cashBankSummary =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType: {
                  $in: [
                    "cash",
                    "bank",
                  ],
                },
              },

              {
                isActive:
                  true,
              },
            ],
          },
        },

        {
          $group: {
            _id:
              "$ledgerType",

            amount: {
              $sum: {
                $ifNull: [
                  "$currentBalance",
                  0,
                ],
              },
            },
          },
        },
      ]);

    let cashBalance =
      0;

    let bankBalance =
      0;

    for (
      const row of
      cashBankSummary
    ) {
      if (
        row._id ===
        "cash"
      ) {
        cashBalance =
          Number(
            row.amount ||
              0
          );
      }

      if (
        row._id ===
        "bank"
      ) {
        bankBalance =
          Number(
            row.amount ||
              0
          );
      }
    }

    const cashBankDetails =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentFilter,

              {
                ledgerType: {
                  $in: [
                    "cash",
                    "bank",
                  ],
                },
              },

              {
                isActive:
                  true,
              },
            ],
          },
        },

        {
          $sort: {
            ledgerType: 1,
            name: 1,
          },
        },

        {
          $project: {
            _id: 0,

            id: {
              $toString:
                "$_id",
            },

            name: {
              $ifNull: [
                "$name",
                "",
              ],
            },

            ledgerType: {
              $ifNull: [
                "$ledgerType",
                "",
              ],
            },

            openingBalance: {
              $ifNull: [
                "$openingBalance",
                0,
              ],
            },

            balanceType: {
              $ifNull: [
                "$balanceType",
                "",
              ],
            },

            balance: {
              $ifNull: [
                "$currentBalance",
                0,
              ],
            },
          },
        },
      ]);

    /* =====================================================
       GST
    ===================================================== */

    const outputGst =
      roundMoney(
        Number(
          sales.gst ||
            0
        )
      );

    const purchaseInputGst =
      roundMoney(
        Number(
          purchases.gst ||
            0
        )
      );

    const expenseInputGst =
      roundMoney(
        Number(
          expenses.gst ||
            0
        )
      );

    const inputGst =
      roundMoney(
        purchaseInputGst +
          expenseInputGst
      );

    const netGst =
      roundMoney(
        outputGst -
          inputGst
      );

    /* =====================================================
       OPERATING DIFFERENCE

       Not inventory-adjusted net profit.
    ===================================================== */

    const operatingDifference =
      roundMoney(
        Number(
          sales.taxable ||
            0
        ) -
          Number(
            purchases.taxable ||
              0
          ) -
          Number(
            expenses.taxable ||
              0
          )
      );

    /* =====================================================
       TOP CUSTOMERS
    ===================================================== */

    const topCustomers =
      await SalesInvoice.aggregate([
        {
          $match: {
            $and:
              salesConditions,
          },
        },

        {
          $group: {
            _id: {
              customerLedgerId:
                "$customerLedgerId",

              customerName:
                "$customerName",
            },

            invoices: {
              $sum: 1,
            },

            sales: {
              $sum: {
                $ifNull: [
                  "$grandTotal",
                  0,
                ],
              },
            },

            due: {
              $sum: {
                $ifNull: [
                  "$dueAmount",
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            sales: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $project: {
            _id: 0,

            customerLedgerId: {
              $cond: [
                {
                  $ifNull: [
                    "$_id.customerLedgerId",
                    false,
                  ],
                },

                {
                  $toString:
                    "$_id.customerLedgerId",
                },

                "",
              ],
            },

            customerName: {
              $ifNull: [
                "$_id.customerName",
                "Customer",
              ],
            },

            invoices: 1,
            sales: 1,
            due: 1,
          },
        },
      ]);

    /* =====================================================
       TOP SUPPLIERS
    ===================================================== */

    const topSuppliers =
      await PurchaseBill.aggregate([
        {
          $match: {
            $and:
              purchaseConditions,
          },
        },

        {
          $group: {
            _id: {
              supplierLedgerId:
                "$supplierLedgerId",

              supplierName:
                "$supplierName",
            },

            purchases: {
              $sum: 1,
            },

            amount: {
              $sum: {
                $ifNull: [
                  "$grandTotal",
                  0,
                ],
              },
            },

            due: {
              $sum: {
                $ifNull: [
                  "$dueAmount",
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            amount: -1,
          },
        },

        {
          $limit: 10,
        },

        {
          $project: {
            _id: 0,

            supplierLedgerId: {
              $cond: [
                {
                  $ifNull: [
                    "$_id.supplierLedgerId",
                    false,
                  ],
                },

                {
                  $toString:
                    "$_id.supplierLedgerId",
                },

                "",
              ],
            },

            supplierName: {
              $ifNull: [
                "$_id.supplierName",
                "Supplier",
              ],
            },

            purchases: 1,
            amount: 1,
            due: 1,
          },
        },
      ]);

    /* =====================================================
       EXPENSE CATEGORY BREAKDOWN
    ===================================================== */

    const expenseCategories =
      await Expense.aggregate([
        {
          $match: {
            $and:
              expenseConditions,
          },
        },

        {
          $group: {
            _id:
              "$category",

            count: {
              $sum: 1,
            },

            taxable: {
              $sum: {
                $ifNull: [
                  "$taxableAmount",
                  0,
                ],
              },
            },

            gst: {
              $sum: {
                $ifNull: [
                  "$totalGst",
                  0,
                ],
              },
            },

            total: {
              $sum: {
                $ifNull: [
                  "$totalAmount",
                  0,
                ],
              },
            },
          },
        },

        {
          $sort: {
            total: -1,
          },
        },

        {
          $project: {
            _id: 0,

            category: {
              $ifNull: [
                "$_id",
                "Other",
              ],
            },

            count: 1,
            taxable: 1,
            gst: 1,
            total: 1,
          },
        },
      ]);

    /* =====================================================
       MONTHLY DATA
    ===================================================== */

    const [
      salesMonthly,
      purchaseMonthly,
      expenseMonthly,
    ] =
      await Promise.all([
        SalesInvoice.aggregate([
          {
            $match: {
              $and:
                salesConditions,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$invoiceDate",
                },

                month: {
                  $month:
                    "$invoiceDate",
                },
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        PurchaseBill.aggregate([
          {
            $match: {
              $and:
                purchaseConditions,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$purchaseDate",
                },

                month: {
                  $month:
                    "$purchaseDate",
                },
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },
            },
          },
        ]),

        Expense.aggregate([
          {
            $match: {
              $and:
                expenseConditions,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$expenseDate",
                },

                month: {
                  $month:
                    "$expenseDate",
                },
              },

              amount: {
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
      ]);

    /* =====================================================
       BUILD MONTHLY TREND
    ===================================================== */

    const monthlyMap =
      new Map<
        string,
        {
          year: number;
          month: number;
          sales: number;
          purchases: number;
          expenses: number;
        }
      >();

    function ensureMonth(
      year: number,
      month: number
    ) {
      const key =
        `${year}-${month}`;

      const existing =
        monthlyMap.get(
          key
        );

      if (existing) {
        return existing;
      }

      const created = {
        year,
        month,
        sales: 0,
        purchases: 0,
        expenses: 0,
      };

      monthlyMap.set(
        key,
        created
      );

      return created;
    }

    for (
      const row of
      salesMonthly
    ) {
      ensureMonth(
        Number(
          row._id.year
        ),
        Number(
          row._id.month
        )
      ).sales =
        roundMoney(
          Number(
            row.amount ||
              0
          )
        );
    }

    for (
      const row of
      purchaseMonthly
    ) {
      ensureMonth(
        Number(
          row._id.year
        ),
        Number(
          row._id.month
        )
      ).purchases =
        roundMoney(
          Number(
            row.amount ||
              0
          )
        );
    }

    for (
      const row of
      expenseMonthly
    ) {
      ensureMonth(
        Number(
          row._id.year
        ),
        Number(
          row._id.month
        )
      ).expenses =
        roundMoney(
          Number(
            row.amount ||
              0
          )
        );
    }

    const monthlyTrend =
      Array.from(
        monthlyMap.values()
      )
        .sort(
          (
            a,
            b
          ) => {
            if (
              a.year !==
              b.year
            ) {
              return (
                a.year -
                b.year
              );
            }

            return (
              a.month -
              b.month
            );
          }
        )
        .map(
          (row) => ({
            ...row,

            difference:
              roundMoney(
                row.sales -
                  row.purchases -
                  row.expenses
              ),
          })
        );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        generatedAt:
          new Date(),

        period: {
          from:
            from ||
            null,

          to:
            to ||
            null,
        },

        /* =================================================
           SALES SUMMARY
        ================================================= */

        sales: {
          count:
            Number(
              sales.count ||
                0
            ),

          taxable:
            roundMoney(
              Number(
                sales.taxable ||
                  0
              )
            ),

          cgst:
            roundMoney(
              Number(
                sales.cgst ||
                  0
              )
            ),

          sgst:
            roundMoney(
              Number(
                sales.sgst ||
                  0
              )
            ),

          igst:
            roundMoney(
              Number(
                sales.igst ||
                  0
              )
            ),

          gst:
            roundMoney(
              Number(
                sales.gst ||
                  0
              )
            ),

          total:
            roundMoney(
              Number(
                sales.total ||
                  0
              )
            ),

          paid:
            roundMoney(
              Number(
                sales.paid ||
                  0
              )
            ),

          due:
            roundMoney(
              Number(
                sales.due ||
                  0
              )
            ),
        },

        /* =================================================
           PURCHASE SUMMARY
        ================================================= */

        purchases: {
          count:
            Number(
              purchases.count ||
                0
            ),

          taxable:
            roundMoney(
              Number(
                purchases.taxable ||
                  0
              )
            ),

          cgst:
            roundMoney(
              Number(
                purchases.cgst ||
                  0
              )
            ),

          sgst:
            roundMoney(
              Number(
                purchases.sgst ||
                  0
              )
            ),

          igst:
            roundMoney(
              Number(
                purchases.igst ||
                  0
              )
            ),

          gst:
            roundMoney(
              Number(
                purchases.gst ||
                  0
              )
            ),

          total:
            roundMoney(
              Number(
                purchases.total ||
                  0
              )
            ),

          paid:
            roundMoney(
              Number(
                purchases.paid ||
                  0
              )
            ),

          due:
            roundMoney(
              Number(
                purchases.due ||
                  0
              )
            ),
        },

        /* =================================================
           EXPENSE SUMMARY
        ================================================= */

        expenses: {
          count:
            Number(
              expenses.count ||
                0
            ),

          taxable:
            roundMoney(
              Number(
                expenses.taxable ||
                  0
              )
            ),

          cgst:
            roundMoney(
              Number(
                expenses.cgst ||
                  0
              )
            ),

          sgst:
            roundMoney(
              Number(
                expenses.sgst ||
                  0
              )
            ),

          igst:
            roundMoney(
              Number(
                expenses.igst ||
                  0
              )
            ),

          gst:
            roundMoney(
              Number(
                expenses.gst ||
                  0
              )
            ),

          total:
            roundMoney(
              Number(
                expenses.total ||
                  0
              )
            ),
        },

        /* =================================================
           OUTSTANDING
        ================================================= */

        receivable: {
          amount:
            roundMoney(
              Number(
                receivable.amount ||
                  0
              )
            ),

          count:
            Number(
              receivable.count ||
                0
            ),
        },

        payable: {
          amount:
            roundMoney(
              Number(
                payable.amount ||
                  0
              )
            ),

          count:
            Number(
              payable.count ||
                0
            ),
        },

        /* =================================================
           CASH BANK
        ================================================= */

        cashBank: {
          cash:
            roundMoney(
              cashBalance
            ),

          bank:
            roundMoney(
              bankBalance
            ),

          total:
            roundMoney(
              cashBalance +
                bankBalance
            ),
        },

        /* =================================================
           GST
        ================================================= */

        gst: {
          output:
            outputGst,

          purchaseInput:
            purchaseInputGst,

          expenseInput:
            expenseInputGst,

          input:
            inputGst,

          net:
            netGst,

          payable:
            netGst > 0
              ? netGst
              : 0,

          credit:
            netGst < 0
              ? Math.abs(
                  netGst
                )
              : 0,
        },

        /* =================================================
           OPERATING DIFFERENCE
        ================================================= */

        profit: {
          estimate:
            operatingDifference,

          operatingDifference,
        },

        /* =================================================
           ANALYTICS
        ================================================= */

        topCustomers,

        topSuppliers,

        expenseCategories,

        monthlyTrend,

        /* =================================================
           FULL DETAIL REPORTS
        ================================================= */

        salesDetails,

        purchaseDetails,

        expenseDetails,

        receivableDetails,

        payableDetails,

        cashBankDetails,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_ACCOUNTS_REPORTS_ERROR:",
      error
    );

    return errorResponse(
      error instanceof
        Error
        ? error.message
        : "Unable to load accounts reports.",
      500
    );
  }
}