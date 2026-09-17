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

function getDateRange(
  request: NextRequest
) {
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

  const dateFilter: {
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

  return {
    from,
    to,
    dateFilter,
  };
}

function isValidGstin(
  value: unknown
) {
  const gstin =
    cleanString(
      value
    ).toUpperCase();

  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
    gstin
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
   GET GST REPORT
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
       DATE RANGE
    ===================================================== */

    const {
      from,
      to,
      dateFilter,
    } =
      getDateRange(
        request
      );

    const hasDateFilter =
      Object.keys(
        dateFilter
      ).length > 0;

    /* =====================================================
       SALES FILTER
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

    if (
      hasDateFilter
    ) {
      salesConditions.push({
        invoiceDate:
          dateFilter,
      });
    }

    /* =====================================================
       PURCHASE FILTER
    ===================================================== */

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

    if (
      hasDateFilter
    ) {
      purchaseConditions.push({
        purchaseDate:
          dateFilter,
      });
    }

    /* =====================================================
       EXPENSE FILTER

       Supports both expenseDate and date for compatibility.
    ===================================================== */

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
      expenseConditions.push({
        $or: [
          {
            expenseDate:
              dateFilter,
          },

          {
            date:
              dateFilter,
          },
        ],
      });
    }

    /* =====================================================
       FULL SALES GST REGISTER
    ===================================================== */

    const salesRegister =
      await SalesInvoice.aggregate([
        {
          $match: {
            $and:
              salesConditions,
          },
        },

        {
          $sort: {
            invoiceDate:
              -1,

            createdAt:
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
          },
        },
      ]);

    /* =====================================================
       FULL PURCHASE GST REGISTER
    ===================================================== */

    const purchaseRegister =
      await PurchaseBill.aggregate([
        {
          $match: {
            $and:
              purchaseConditions,
          },
        },

        {
          $sort: {
            purchaseDate:
              -1,

            createdAt:
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
          },
        },
      ]);

    /* =====================================================
       FULL EXPENSE GST REGISTER
    ===================================================== */

    const expenseRegister =
      await Expense.aggregate([
        {
          $match: {
            $and:
              expenseConditions,
          },
        },

        {
          $addFields: {
            reportDate: {
              $ifNull: [
                "$expenseDate",
                "$date",
              ],
            },
          },
        },

        {
          $sort: {
            reportDate:
              -1,

            createdAt:
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

            expenseNumber: {
              $ifNull: [
                "$expenseNumber",
                "",
              ],
            },

            expenseDate:
              "$reportDate",

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
          },
        },
      ]);

    /* =====================================================
       OUTPUT GST SUMMARY
    ===================================================== */

    const outputResult =
      await SalesInvoice.aggregate([
        {
          $match: {
            $and:
              salesConditions,
          },
        },

        {
          $group: {
            _id: null,

            taxableSales: {
              $sum: {
                $ifNull: [
                  "$taxableAmount",
                  0,
                ],
              },
            },

            outputCgst: {
              $sum: {
                $ifNull: [
                  "$cgst",
                  0,
                ],
              },
            },

            outputSgst: {
              $sum: {
                $ifNull: [
                  "$sgst",
                  0,
                ],
              },
            },

            outputIgst: {
              $sum: {
                $ifNull: [
                  "$igst",
                  0,
                ],
              },
            },

            outputGst: {
              $sum: {
                $ifNull: [
                  "$totalGst",
                  0,
                ],
              },
            },

            grandTotal: {
              $sum: {
                $ifNull: [
                  "$grandTotal",
                  0,
                ],
              },
            },

            invoiceCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const output =
      outputResult[0] ?? {
        taxableSales: 0,
        outputCgst: 0,
        outputSgst: 0,
        outputIgst: 0,
        outputGst: 0,
        grandTotal: 0,
        invoiceCount: 0,
      };

    /* =====================================================
       PURCHASE INPUT GST SUMMARY
    ===================================================== */

    const purchaseInputResult =
      await PurchaseBill.aggregate([
        {
          $match: {
            $and:
              purchaseConditions,
          },
        },

        {
          $group: {
            _id: null,

            taxablePurchase: {
              $sum: {
                $ifNull: [
                  "$taxableAmount",
                  0,
                ],
              },
            },

            inputCgst: {
              $sum: {
                $ifNull: [
                  "$cgst",
                  0,
                ],
              },
            },

            inputSgst: {
              $sum: {
                $ifNull: [
                  "$sgst",
                  0,
                ],
              },
            },

            inputIgst: {
              $sum: {
                $ifNull: [
                  "$igst",
                  0,
                ],
              },
            },

            inputGst: {
              $sum: {
                $ifNull: [
                  "$totalGst",
                  0,
                ],
              },
            },

            grandTotal: {
              $sum: {
                $ifNull: [
                  "$grandTotal",
                  0,
                ],
              },
            },

            purchaseCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const purchaseInput =
      purchaseInputResult[0] ?? {
        taxablePurchase: 0,
        inputCgst: 0,
        inputSgst: 0,
        inputIgst: 0,
        inputGst: 0,
        grandTotal: 0,
        purchaseCount: 0,
      };

    /* =====================================================
       EXPENSE INPUT GST SUMMARY
    ===================================================== */

    const expenseInputResult =
      await Expense.aggregate([
        {
          $match: {
            $and:
              expenseConditions,
          },
        },

        {
          $group: {
            _id: null,

            taxableExpense: {
              $sum: {
                $ifNull: [
                  "$taxableAmount",
                  0,
                ],
              },
            },

            inputCgst: {
              $sum: {
                $ifNull: [
                  "$cgst",
                  0,
                ],
              },
            },

            inputSgst: {
              $sum: {
                $ifNull: [
                  "$sgst",
                  0,
                ],
              },
            },

            inputIgst: {
              $sum: {
                $ifNull: [
                  "$igst",
                  0,
                ],
              },
            },

            inputGst: {
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

            expenseCount: {
              $sum: 1,
            },
          },
        },
      ]);

    const expenseInput =
      expenseInputResult[0] ?? {
        taxableExpense: 0,
        inputCgst: 0,
        inputSgst: 0,
        inputIgst: 0,
        inputGst: 0,
        totalAmount: 0,
        expenseCount: 0,
      };

    /* =====================================================
       GST INPUT TOTALS
    ===================================================== */

    const purchaseInputCgst =
      roundMoney(
        Number(
          purchaseInput.inputCgst ||
            0
        )
      );

    const purchaseInputSgst =
      roundMoney(
        Number(
          purchaseInput.inputSgst ||
            0
        )
      );

    const purchaseInputIgst =
      roundMoney(
        Number(
          purchaseInput.inputIgst ||
            0
        )
      );

    const purchaseInputTotal =
      roundMoney(
        Number(
          purchaseInput.inputGst ||
            0
        )
      );

    const expenseInputCgst =
      roundMoney(
        Number(
          expenseInput.inputCgst ||
            0
        )
      );

    const expenseInputSgst =
      roundMoney(
        Number(
          expenseInput.inputSgst ||
            0
        )
      );

    const expenseInputIgst =
      roundMoney(
        Number(
          expenseInput.inputIgst ||
            0
        )
      );

    const expenseInputTotal =
      roundMoney(
        Number(
          expenseInput.inputGst ||
            0
        )
      );

    const inputCgst =
      roundMoney(
        purchaseInputCgst +
          expenseInputCgst
      );

    const inputSgst =
      roundMoney(
        purchaseInputSgst +
          expenseInputSgst
      );

    const inputIgst =
      roundMoney(
        purchaseInputIgst +
          expenseInputIgst
      );

    const totalInputGst =
      roundMoney(
        purchaseInputTotal +
          expenseInputTotal
      );

    /* =====================================================
       OUTPUT TOTALS
    ===================================================== */

    const outputCgst =
      roundMoney(
        Number(
          output.outputCgst ||
            0
        )
      );

    const outputSgst =
      roundMoney(
        Number(
          output.outputSgst ||
            0
        )
      );

    const outputIgst =
      roundMoney(
        Number(
          output.outputIgst ||
            0
        )
      );

    const totalOutputGst =
      roundMoney(
        Number(
          output.outputGst ||
            0
        )
      );

    /* =====================================================
       NET GST
    ===================================================== */

    const netCgst =
      roundMoney(
        outputCgst -
          inputCgst
      );

    const netSgst =
      roundMoney(
        outputSgst -
          inputSgst
      );

    const netIgst =
      roundMoney(
        outputIgst -
          inputIgst
      );

    const netGst =
      roundMoney(
        totalOutputGst -
          totalInputGst
      );

    const gstPayable =
      netGst > 0
        ? netGst
        : 0;

    const gstCredit =
      netGst < 0
        ? Math.abs(
            netGst
          )
        : 0;

    /* =====================================================
       B2B / B2C SALES
    ===================================================== */

    const b2bSales =
      salesRegister.filter(
        (row) =>
          isValidGstin(
            row.customerGstNumber
          )
      );

    const b2cSales =
      salesRegister.filter(
        (row) =>
          !isValidGstin(
            row.customerGstNumber
          )
      );

    const b2bSummary =
      b2bSales.reduce(
        (
          total,
          row
        ) => {
          total.taxable +=
            Number(
              row.taxableAmount ||
                0
            );

          total.cgst +=
            Number(
              row.cgst ||
                0
            );

          total.sgst +=
            Number(
              row.sgst ||
                0
            );

          total.igst +=
            Number(
              row.igst ||
                0
            );

          total.gst +=
            Number(
              row.totalGst ||
                0
            );

          total.total +=
            Number(
              row.grandTotal ||
                0
            );

          return total;
        },
        {
          count:
            b2bSales.length,

          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          gst: 0,
          total: 0,
        }
      );

    const b2cSummary =
      b2cSales.reduce(
        (
          total,
          row
        ) => {
          total.taxable +=
            Number(
              row.taxableAmount ||
                0
            );

          total.cgst +=
            Number(
              row.cgst ||
                0
            );

          total.sgst +=
            Number(
              row.sgst ||
                0
            );

          total.igst +=
            Number(
              row.igst ||
                0
            );

          total.gst +=
            Number(
              row.totalGst ||
                0
            );

          total.total +=
            Number(
              row.grandTotal ||
                0
            );

          return total;
        },
        {
          count:
            b2cSales.length,

          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          gst: 0,
          total: 0,
        }
      );

    /* =====================================================
       GSTIN-WISE CUSTOMER SALES
    ===================================================== */

    const customerGstinMap =
      new Map<
        string,
        {
          gstNumber: string;
          customerName: string;

          invoices: number;

          taxable: number;
          cgst: number;
          sgst: number;
          igst: number;
          gst: number;

          total: number;
        }
      >();

    for (
      const row of
      salesRegister
    ) {
      const gstNumber =
        cleanString(
          row.customerGstNumber
        ).toUpperCase();

      const key =
        gstNumber ||
        `UNREGISTERED:${cleanString(
          row.customerName
        ).toUpperCase()}`;

      const current =
        customerGstinMap.get(
          key
        ) ?? {
          gstNumber,

          customerName:
            cleanString(
              row.customerName
            ) ||
            "Customer",

          invoices: 0,

          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          gst: 0,

          total: 0,
        };

      current.invoices +=
        1;

      current.taxable +=
        Number(
          row.taxableAmount ||
            0
        );

      current.cgst +=
        Number(
          row.cgst ||
            0
        );

      current.sgst +=
        Number(
          row.sgst ||
            0
        );

      current.igst +=
        Number(
          row.igst ||
            0
        );

      current.gst +=
        Number(
          row.totalGst ||
            0
        );

      current.total +=
        Number(
          row.grandTotal ||
            0
        );

      customerGstinMap.set(
        key,
        current
      );
    }

    const customerGstinSummary =
      Array.from(
        customerGstinMap.values()
      )
        .map(
          (row) => ({
            ...row,

            taxable:
              roundMoney(
                row.taxable
              ),

            cgst:
              roundMoney(
                row.cgst
              ),

            sgst:
              roundMoney(
                row.sgst
              ),

            igst:
              roundMoney(
                row.igst
              ),

            gst:
              roundMoney(
                row.gst
              ),

            total:
              roundMoney(
                row.total
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.total -
            a.total
        );

    /* =====================================================
       GSTIN-WISE SUPPLIER PURCHASE
    ===================================================== */

    const supplierGstinMap =
      new Map<
        string,
        {
          gstNumber: string;
          supplierName: string;

          bills: number;

          taxable: number;
          cgst: number;
          sgst: number;
          igst: number;
          gst: number;

          total: number;
        }
      >();

    for (
      const row of
      purchaseRegister
    ) {
      const gstNumber =
        cleanString(
          row.supplierGstNumber
        ).toUpperCase();

      const key =
        gstNumber ||
        `UNREGISTERED:${cleanString(
          row.supplierName
        ).toUpperCase()}`;

      const current =
        supplierGstinMap.get(
          key
        ) ?? {
          gstNumber,

          supplierName:
            cleanString(
              row.supplierName
            ) ||
            "Supplier",

          bills: 0,

          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          gst: 0,

          total: 0,
        };

      current.bills +=
        1;

      current.taxable +=
        Number(
          row.taxableAmount ||
            0
        );

      current.cgst +=
        Number(
          row.cgst ||
            0
        );

      current.sgst +=
        Number(
          row.sgst ||
            0
        );

      current.igst +=
        Number(
          row.igst ||
            0
        );

      current.gst +=
        Number(
          row.totalGst ||
            0
        );

      current.total +=
        Number(
          row.grandTotal ||
            0
        );

      supplierGstinMap.set(
        key,
        current
      );
    }

    const supplierGstinSummary =
      Array.from(
        supplierGstinMap.values()
      )
        .map(
          (row) => ({
            ...row,

            taxable:
              roundMoney(
                row.taxable
              ),

            cgst:
              roundMoney(
                row.cgst
              ),

            sgst:
              roundMoney(
                row.sgst
              ),

            igst:
              roundMoney(
                row.igst
              ),

            gst:
              roundMoney(
                row.gst
              ),

            total:
              roundMoney(
                row.total
              ),
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.total -
            a.total
        );

    /* =====================================================
       MONTH-WISE GST
    ===================================================== */

    const monthlyMap =
      new Map<
        string,
        {
          year: number;
          month: number;

          salesTaxable: number;
          outputCgst: number;
          outputSgst: number;
          outputIgst: number;
          outputGst: number;

          purchaseTaxable: number;
          purchaseInputGst: number;

          expenseTaxable: number;
          expenseInputGst: number;

          totalInputGst: number;
          netGst: number;
        }
      >();

    function ensureMonth(
      dateValue:
        | string
        | Date
        | null
        | undefined
    ) {
      if (!dateValue) {
        return null;
      }

      const date =
        new Date(
          dateValue
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }

      const year =
        date.getFullYear();

      const month =
        date.getMonth() +
        1;

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

        salesTaxable: 0,

        outputCgst: 0,
        outputSgst: 0,
        outputIgst: 0,
        outputGst: 0,

        purchaseTaxable: 0,
        purchaseInputGst: 0,

        expenseTaxable: 0,
        expenseInputGst: 0,

        totalInputGst: 0,
        netGst: 0,
      };

      monthlyMap.set(
        key,
        created
      );

      return created;
    }

    for (
      const row of
      salesRegister
    ) {
      const monthRow =
        ensureMonth(
          row.invoiceDate
        );

      if (!monthRow) {
        continue;
      }

      monthRow.salesTaxable +=
        Number(
          row.taxableAmount ||
            0
        );

      monthRow.outputCgst +=
        Number(
          row.cgst ||
            0
        );

      monthRow.outputSgst +=
        Number(
          row.sgst ||
            0
        );

      monthRow.outputIgst +=
        Number(
          row.igst ||
            0
        );

      monthRow.outputGst +=
        Number(
          row.totalGst ||
            0
        );
    }

    for (
      const row of
      purchaseRegister
    ) {
      const monthRow =
        ensureMonth(
          row.purchaseDate
        );

      if (!monthRow) {
        continue;
      }

      monthRow.purchaseTaxable +=
        Number(
          row.taxableAmount ||
            0
        );

      monthRow.purchaseInputGst +=
        Number(
          row.totalGst ||
            0
        );
    }

    for (
      const row of
      expenseRegister
    ) {
      const monthRow =
        ensureMonth(
          row.expenseDate
        );

      if (!monthRow) {
        continue;
      }

      monthRow.expenseTaxable +=
        Number(
          row.taxableAmount ||
            0
        );

      monthRow.expenseInputGst +=
        Number(
          row.totalGst ||
            0
        );
    }

    const monthlySummary =
      Array.from(
        monthlyMap.values()
      )
        .map(
          (row) => {
            const totalInput =
              row.purchaseInputGst +
              row.expenseInputGst;

            return {
              year:
                row.year,

              month:
                row.month,

              salesTaxable:
                roundMoney(
                  row.salesTaxable
                ),

              outputCgst:
                roundMoney(
                  row.outputCgst
                ),

              outputSgst:
                roundMoney(
                  row.outputSgst
                ),

              outputIgst:
                roundMoney(
                  row.outputIgst
                ),

              outputGst:
                roundMoney(
                  row.outputGst
                ),

              purchaseTaxable:
                roundMoney(
                  row.purchaseTaxable
                ),

              purchaseInputGst:
                roundMoney(
                  row.purchaseInputGst
                ),

              expenseTaxable:
                roundMoney(
                  row.expenseTaxable
                ),

              expenseInputGst:
                roundMoney(
                  row.expenseInputGst
                ),

              totalInputGst:
                roundMoney(
                  totalInput
                ),

              netGst:
                roundMoney(
                  row.outputGst -
                    totalInput
                ),
            };
          }
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
        );

    /* =====================================================
       GSTR-1 WORKING SUMMARY

       Current database allows:
       - B2B working
       - B2C working
       - total outward taxable
       - CGST / SGST / IGST
    ===================================================== */

    const gstr1Working = {
      totalInvoices:
        Number(
          output.invoiceCount ||
            0
        ),

      totalTaxableValue:
        roundMoney(
          Number(
            output.taxableSales ||
              0
          )
        ),

      b2b: {
        count:
          b2bSummary.count,

        taxable:
          roundMoney(
            b2bSummary.taxable
          ),

        cgst:
          roundMoney(
            b2bSummary.cgst
          ),

        sgst:
          roundMoney(
            b2bSummary.sgst
          ),

        igst:
          roundMoney(
            b2bSummary.igst
          ),

        gst:
          roundMoney(
            b2bSummary.gst
          ),

        total:
          roundMoney(
            b2bSummary.total
          ),
      },

      b2c: {
        count:
          b2cSummary.count,

        taxable:
          roundMoney(
            b2cSummary.taxable
          ),

        cgst:
          roundMoney(
            b2cSummary.cgst
          ),

        sgst:
          roundMoney(
            b2cSummary.sgst
          ),

        igst:
          roundMoney(
            b2cSummary.igst
          ),

        gst:
          roundMoney(
            b2cSummary.gst
          ),

        total:
          roundMoney(
            b2cSummary.total
          ),
      },

      tax: {
        cgst:
          outputCgst,

        sgst:
          outputSgst,

        igst:
          outputIgst,

        total:
          totalOutputGst,
      },
    };

    /* =====================================================
       GSTR-3B WORKING SUMMARY

       Only values supported by current books are populated.
    ===================================================== */

    const gstr3bWorking = {
      table31: {
        outwardTaxableSupplies: {
          taxableValue:
            roundMoney(
              Number(
                output.taxableSales ||
                  0
              )
            ),

          igst:
            outputIgst,

          cgst:
            outputCgst,

          sgst:
            outputSgst,

          cess:
            0,
        },

        reverseChargeInwardSupplies: {
          supported:
            false,

          taxableValue:
            0,

          igst:
            0,

          cgst:
            0,

          sgst:
            0,

          cess:
            0,
        },

        zeroRatedSupplies: {
          supported:
            false,

          taxableValue:
            0,

          igst:
            0,
        },

        nilExemptSupplies: {
          supported:
            false,

          taxableValue:
            0,
        },

        nonGstSupplies: {
          supported:
            false,

          taxableValue:
            0,
        },
      },

      table4EligibleItc: {
        purchase: {
          igst:
            purchaseInputIgst,

          cgst:
            purchaseInputCgst,

          sgst:
            purchaseInputSgst,

          total:
            purchaseInputTotal,
        },

        expense: {
          igst:
            expenseInputIgst,

          cgst:
            expenseInputCgst,

          sgst:
            expenseInputSgst,

          total:
            expenseInputTotal,
        },

        total: {
          igst:
            inputIgst,

          cgst:
            inputCgst,

          sgst:
            inputSgst,

          total:
            totalInputGst,
        },

        reversal: {
          supported:
            false,

          total:
            0,
        },
      },

      booksNetPosition: {
        output:
          totalOutputGst,

        input:
          totalInputGst,

        net:
          netGst,

        payable:
          roundMoney(
            gstPayable
          ),

        credit:
          roundMoney(
            gstCredit
          ),
      },
    };

    /* =====================================================
       ITC REGISTER

       Purchase + Expense input GST.
    ===================================================== */

    const itcRegister = [
      ...purchaseRegister.map(
        (row) => ({
          source:
            "purchase",

          id:
            row.id,

          documentNumber:
            row.purchaseNumber,

          externalInvoiceNumber:
            row.supplierInvoiceNumber,

          date:
            row.purchaseDate,

          partyName:
            row.supplierName,

          gstNumber:
            row.supplierGstNumber,

          taxableAmount:
            roundMoney(
              Number(
                row.taxableAmount ||
                  0
              )
            ),

          cgst:
            roundMoney(
              Number(
                row.cgst ||
                  0
              )
            ),

          sgst:
            roundMoney(
              Number(
                row.sgst ||
                  0
              )
            ),

          igst:
            roundMoney(
              Number(
                row.igst ||
                  0
              )
            ),

          totalGst:
            roundMoney(
              Number(
                row.totalGst ||
                  0
              )
            ),

          eligible:
            true,

          eligibilitySource:
            "books",
        })
      ),

      ...expenseRegister
        .filter(
          (row) =>
            Number(
              row.totalGst ||
                0
            ) !== 0
        )
        .map(
          (row) => ({
            source:
              "expense",

            id:
              row.id,

            documentNumber:
              row.expenseNumber,

            externalInvoiceNumber:
              row.billNumber,

            date:
              row.expenseDate,

            partyName:
              row.vendorName,

            gstNumber:
              row.gstNumber,

            taxableAmount:
              roundMoney(
                Number(
                  row.taxableAmount ||
                    0
                )
              ),

            cgst:
              roundMoney(
                Number(
                  row.cgst ||
                    0
                )
              ),

            sgst:
              roundMoney(
                Number(
                  row.sgst ||
                    0
                )
              ),

            igst:
              roundMoney(
                Number(
                  row.igst ||
                    0
                )
              ),

            totalGst:
              roundMoney(
                Number(
                  row.totalGst ||
                    0
                )
              ),

            eligible:
              true,

            eligibilitySource:
              "books",
          })
        ),
    ].sort(
      (
        a,
        b
      ) => {
        const aDate =
          a.date
            ? new Date(
                a.date
              ).getTime()
            : 0;

        const bDate =
          b.date
            ? new Date(
                b.date
              ).getTime()
            : 0;

        return (
          bDate -
          aDate
        );
      }
    );

    /* =====================================================
       OUTPUT TAX REGISTER
    ===================================================== */

    const outputTaxRegister =
      salesRegister.map(
        (row) => ({
          id:
            row.id,

          invoiceNumber:
            row.invoiceNumber,

          invoiceDate:
            row.invoiceDate,

          customerName:
            row.customerName,

          customerGstNumber:
            row.customerGstNumber,

          supplyType:
            isValidGstin(
              row.customerGstNumber
            )
              ? "B2B"
              : "B2C",

          taxableAmount:
            roundMoney(
              Number(
                row.taxableAmount ||
                  0
              )
            ),

          cgst:
            roundMoney(
              Number(
                row.cgst ||
                  0
              )
            ),

          sgst:
            roundMoney(
              Number(
                row.sgst ||
                  0
              )
            ),

          igst:
            roundMoney(
              Number(
                row.igst ||
                  0
              )
            ),

          totalGst:
            roundMoney(
              Number(
                row.totalGst ||
                  0
              )
            ),

          grandTotal:
            roundMoney(
              Number(
                row.grandTotal ||
                  0
              )
            ),
        })
      );

    /* =====================================================
       COMPONENT REGISTERS
    ===================================================== */

    const cgstRegister = {
      output:
        salesRegister
          .filter(
            (row) =>
              Number(
                row.cgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "sales",

              documentNumber:
                row.invoiceNumber,

              date:
                row.invoiceDate,

              partyName:
                row.customerName,

              gstNumber:
                row.customerGstNumber,

              taxable:
                row.taxableAmount,

              cgst:
                row.cgst,
            })
          ),

      input: [
        ...purchaseRegister
          .filter(
            (row) =>
              Number(
                row.cgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "purchase",

              documentNumber:
                row.purchaseNumber,

              date:
                row.purchaseDate,

              partyName:
                row.supplierName,

              gstNumber:
                row.supplierGstNumber,

              taxable:
                row.taxableAmount,

              cgst:
                row.cgst,
            })
          ),

        ...expenseRegister
          .filter(
            (row) =>
              Number(
                row.cgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "expense",

              documentNumber:
                row.expenseNumber,

              date:
                row.expenseDate,

              partyName:
                row.vendorName,

              gstNumber:
                row.gstNumber,

              taxable:
                row.taxableAmount,

              cgst:
                row.cgst,
            })
          ),
      ],

      summary: {
        output:
          outputCgst,

        input:
          inputCgst,

        net:
          netCgst,
      },
    };

    const sgstRegister = {
      output:
        salesRegister
          .filter(
            (row) =>
              Number(
                row.sgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "sales",

              documentNumber:
                row.invoiceNumber,

              date:
                row.invoiceDate,

              partyName:
                row.customerName,

              gstNumber:
                row.customerGstNumber,

              taxable:
                row.taxableAmount,

              sgst:
                row.sgst,
            })
          ),

      input: [
        ...purchaseRegister
          .filter(
            (row) =>
              Number(
                row.sgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "purchase",

              documentNumber:
                row.purchaseNumber,

              date:
                row.purchaseDate,

              partyName:
                row.supplierName,

              gstNumber:
                row.supplierGstNumber,

              taxable:
                row.taxableAmount,

              sgst:
                row.sgst,
            })
          ),

        ...expenseRegister
          .filter(
            (row) =>
              Number(
                row.sgst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "expense",

              documentNumber:
                row.expenseNumber,

              date:
                row.expenseDate,

              partyName:
                row.vendorName,

              gstNumber:
                row.gstNumber,

              taxable:
                row.taxableAmount,

              sgst:
                row.sgst,
            })
          ),
      ],

      summary: {
        output:
          outputSgst,

        input:
          inputSgst,

        net:
          netSgst,
      },
    };

    const igstRegister = {
      output:
        salesRegister
          .filter(
            (row) =>
              Number(
                row.igst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "sales",

              documentNumber:
                row.invoiceNumber,

              date:
                row.invoiceDate,

              partyName:
                row.customerName,

              gstNumber:
                row.customerGstNumber,

              taxable:
                row.taxableAmount,

              igst:
                row.igst,
            })
          ),

      input: [
        ...purchaseRegister
          .filter(
            (row) =>
              Number(
                row.igst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "purchase",

              documentNumber:
                row.purchaseNumber,

              date:
                row.purchaseDate,

              partyName:
                row.supplierName,

              gstNumber:
                row.supplierGstNumber,

              taxable:
                row.taxableAmount,

              igst:
                row.igst,
            })
          ),

        ...expenseRegister
          .filter(
            (row) =>
              Number(
                row.igst ||
                  0
              ) !== 0
          )
          .map(
            (row) => ({
              source:
                "expense",

              documentNumber:
                row.expenseNumber,

              date:
                row.expenseDate,

              partyName:
                row.vendorName,

              gstNumber:
                row.gstNumber,

              taxable:
                row.taxableAmount,

              igst:
                row.igst,
            })
          ),
      ],

      summary: {
        output:
          outputIgst,

        input:
          inputIgst,

        net:
          netIgst,
      },
    };

    /* =====================================================
       DATA QUALITY / CA CHECKS
    ===================================================== */

    const invalidCustomerGstinInvoices =
      salesRegister.filter(
        (row) => {
          const gstin =
            cleanString(
              row.customerGstNumber
            );

          return (
            gstin.length >
              0 &&
            !isValidGstin(
              gstin
            )
          );
        }
      );

    const invalidSupplierGstinBills =
      purchaseRegister.filter(
        (row) => {
          const gstin =
            cleanString(
              row.supplierGstNumber
            );

          return (
            gstin.length >
              0 &&
            !isValidGstin(
              gstin
            )
          );
        }
      );

    const taxMismatchSales =
      salesRegister.filter(
        (row) => {
          const calculated =
            roundMoney(
              Number(
                row.cgst ||
                  0
              ) +
                Number(
                  row.sgst ||
                    0
                ) +
                Number(
                  row.igst ||
                    0
                )
            );

          const stored =
            roundMoney(
              Number(
                row.totalGst ||
                  0
              )
            );

          return (
            Math.abs(
              calculated -
                stored
            ) >
            0.02
          );
        }
      );

    const taxMismatchPurchases =
      purchaseRegister.filter(
        (row) => {
          const calculated =
            roundMoney(
              Number(
                row.cgst ||
                  0
              ) +
                Number(
                  row.sgst ||
                    0
                ) +
                Number(
                  row.igst ||
                    0
                )
            );

          const stored =
            roundMoney(
              Number(
                row.totalGst ||
                  0
              )
            );

          return (
            Math.abs(
              calculated -
                stored
            ) >
            0.02
          );
        }
      );

    const taxMismatchExpenses =
      expenseRegister.filter(
        (row) => {
          const calculated =
            roundMoney(
              Number(
                row.cgst ||
                  0
              ) +
                Number(
                  row.sgst ||
                    0
                ) +
                Number(
                  row.igst ||
                    0
                )
            );

          const stored =
            roundMoney(
              Number(
                row.totalGst ||
                  0
              )
            );

          return (
            Math.abs(
              calculated -
                stored
            ) >
            0.02
          );
        }
      );

    /* =====================================================
       REPORT CAPABILITIES
    ===================================================== */

    const capabilities = {
      executiveSummary:
        true,

      gstr1Working:
        true,

      gstr3bWorking:
        true,

      salesRegister:
        true,

      purchaseRegister:
        true,

      expenseRegister:
        true,

      itcRegister:
        true,

      outputTaxRegister:
        true,

      b2bSales:
        true,

      b2cSales:
        true,

      customerGstinSummary:
        true,

      supplierGstinSummary:
        true,

      cgstRegister:
        true,

      sgstRegister:
        true,

      igstRegister:
        true,

      monthlySummary:
        true,

      hsnSummary:
        false,

      sacSummary:
        false,

      reverseChargeRegister:
        false,

      creditDebitNoteRegister:
        false,

      gstr2bReconciliation:
        false,

      gstr1PortalReconciliation:
        false,

      gstr3bPortalReconciliation:
        false,

      annualGstr9Working:
        false,

      gstr9cWorking:
        false,
    };

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

        capabilities,

        /* =================================================
           EXECUTIVE SUMMARY
        ================================================= */

        executiveSummary: {
          outward: {
            invoices:
              Number(
                output.invoiceCount ||
                  0
              ),

            taxable:
              roundMoney(
                Number(
                  output.taxableSales ||
                    0
                )
              ),

            cgst:
              outputCgst,

            sgst:
              outputSgst,

            igst:
              outputIgst,

            gst:
              totalOutputGst,

            grandTotal:
              roundMoney(
                Number(
                  output.grandTotal ||
                    0
                )
              ),
          },

          purchase: {
            bills:
              Number(
                purchaseInput.purchaseCount ||
                  0
              ),

            taxable:
              roundMoney(
                Number(
                  purchaseInput.taxablePurchase ||
                    0
                )
              ),

            cgst:
              purchaseInputCgst,

            sgst:
              purchaseInputSgst,

            igst:
              purchaseInputIgst,

            gst:
              purchaseInputTotal,

            grandTotal:
              roundMoney(
                Number(
                  purchaseInput.grandTotal ||
                    0
                )
              ),
          },

          expenses: {
            vouchers:
              Number(
                expenseInput.expenseCount ||
                  0
              ),

            taxable:
              roundMoney(
                Number(
                  expenseInput.taxableExpense ||
                    0
                )
              ),

            cgst:
              expenseInputCgst,

            sgst:
              expenseInputSgst,

            igst:
              expenseInputIgst,

            gst:
              expenseInputTotal,

            total:
              roundMoney(
                Number(
                  expenseInput.totalAmount ||
                    0
                )
              ),
          },

          inputTaxCredit: {
            cgst:
              inputCgst,

            sgst:
              inputSgst,

            igst:
              inputIgst,

            total:
              totalInputGst,
          },

          net: {
            cgst:
              netCgst,

            sgst:
              netSgst,

            igst:
              netIgst,

            total:
              netGst,

            payable:
              roundMoney(
                gstPayable
              ),

            credit:
              roundMoney(
                gstCredit
              ),
          },
        },

        /* =================================================
           OLD RESPONSE COMPATIBILITY
        ================================================= */

        output: {
          taxableSales:
            roundMoney(
              Number(
                output.taxableSales ||
                  0
              )
            ),

          cgst:
            outputCgst,

          sgst:
            outputSgst,

          igst:
            outputIgst,

          totalGst:
            totalOutputGst,

          invoiceCount:
            Number(
              output.invoiceCount ||
                0
            ),
        },

        input: {
          taxablePurchase:
            roundMoney(
              Number(
                purchaseInput.taxablePurchase ||
                  0
              )
            ),

          taxableExpense:
            roundMoney(
              Number(
                expenseInput.taxableExpense ||
                  0
              )
            ),

          purchaseCgst:
            purchaseInputCgst,

          purchaseSgst:
            purchaseInputSgst,

          purchaseIgst:
            purchaseInputIgst,

          purchaseGst:
            purchaseInputTotal,

          expenseCgst:
            expenseInputCgst,

          expenseSgst:
            expenseInputSgst,

          expenseIgst:
            expenseInputIgst,

          expenseGst:
            expenseInputTotal,

          cgst:
            inputCgst,

          sgst:
            inputSgst,

          igst:
            inputIgst,

          totalGst:
            totalInputGst,

          purchaseCount:
            Number(
              purchaseInput.purchaseCount ||
                0
            ),

          expenseCount:
            Number(
              expenseInput.expenseCount ||
                0
            ),
        },

        net: {
          cgst:
            netCgst,

          sgst:
            netSgst,

          igst:
            netIgst,

          total:
            netGst,

          payable:
            roundMoney(
              gstPayable
            ),

          credit:
            roundMoney(
              gstCredit
            ),
        },

        /* =================================================
           RETURN WORKINGS
        ================================================= */

        gstr1Working,

        gstr3bWorking,

        /* =================================================
           REGISTERS
        ================================================= */

        salesRegister,

        purchaseRegister,

        expenseRegister,

        outputTaxRegister,

        itcRegister,

        cgstRegister,

        sgstRegister,

        igstRegister,

        /* =================================================
           SALES CLASSIFICATION
        ================================================= */

        b2bSales,

        b2cSales,

        b2bSummary: {
          ...b2bSummary,

          taxable:
            roundMoney(
              b2bSummary.taxable
            ),

          cgst:
            roundMoney(
              b2bSummary.cgst
            ),

          sgst:
            roundMoney(
              b2bSummary.sgst
            ),

          igst:
            roundMoney(
              b2bSummary.igst
            ),

          gst:
            roundMoney(
              b2bSummary.gst
            ),

          total:
            roundMoney(
              b2bSummary.total
            ),
        },

        b2cSummary: {
          ...b2cSummary,

          taxable:
            roundMoney(
              b2cSummary.taxable
            ),

          cgst:
            roundMoney(
              b2cSummary.cgst
            ),

          sgst:
            roundMoney(
              b2cSummary.sgst
            ),

          igst:
            roundMoney(
              b2cSummary.igst
            ),

          gst:
            roundMoney(
              b2cSummary.gst
            ),

          total:
            roundMoney(
              b2cSummary.total
            ),
        },

        /* =================================================
           GSTIN REPORTS
        ================================================= */

        customerGstinSummary,

        supplierGstinSummary,

        /* =================================================
           MONTHLY
        ================================================= */

        monthlySummary,

        /* =================================================
           CA CHECKS
        ================================================= */

        dataQuality: {
          invalidCustomerGstin: {
            count:
              invalidCustomerGstinInvoices.length,

            records:
              invalidCustomerGstinInvoices,
          },

          invalidSupplierGstin: {
            count:
              invalidSupplierGstinBills.length,

            records:
              invalidSupplierGstinBills,
          },

          taxMismatch: {
            sales: {
              count:
                taxMismatchSales.length,

              records:
                taxMismatchSales,
            },

            purchases: {
              count:
                taxMismatchPurchases.length,

              records:
                taxMismatchPurchases,
            },

            expenses: {
              count:
                taxMismatchExpenses.length,

              records:
                taxMismatchExpenses,
            },

            total:
              taxMismatchSales.length +
              taxMismatchPurchases.length +
              taxMismatchExpenses.length,
          },
        },

        /* =================================================
           CURRENT MODEL LIMITATIONS
        ================================================= */

        pendingModules: [
          {
            id:
              "hsn_sac",

            name:
              "HSN / SAC Summary",

            ready:
              false,

            reason:
              "Invoice and purchase item level HSN/SAC fields are required.",
          },

          {
            id:
              "rcm",

            name:
              "Reverse Charge Register",

            ready:
              false,

            reason:
              "RCM applicability and tax component fields are required.",
          },

          {
            id:
              "credit_debit_notes",

            name:
              "Credit / Debit Note Register",

            ready:
              false,

            reason:
              "Credit note and debit note documents are not yet stored separately.",
          },

          {
            id:
              "gstr2b",

            name:
              "GSTR-2B Reconciliation",

            ready:
              false,

            reason:
              "GST Portal GSTR-2B file import is required for portal-vs-books matching.",
          },

          {
            id:
              "gstr9",

            name:
              "GSTR-9 Annual Working",

            ready:
              false,

            reason:
              "Annual working should use complete HSN, adjustment, return and reconciliation data.",
          },

          {
            id:
              "gstr9c",

            name:
              "GSTR-9C Reconciliation Working",

            ready:
              false,

            reason:
              "Additional reconciliation and turnover adjustment data is required.",
          },
        ],

        /* =================================================
           LEGACY KEYS
        ================================================= */

        recentSales:
          salesRegister.slice(
            0,
            25
          ),

        recentPurchases:
          purchaseRegister.slice(
            0,
            25
          ),

        recentExpenses:
          expenseRegister.slice(
            0,
            25
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_GST_REPORT_ERROR:",
      error
    );

    return errorResponse(
      error instanceof
        Error
        ? error.message
        : "Unable to load GST report.",
      500
    );
  }
}