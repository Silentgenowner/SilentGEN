import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Product from "@/models/Product";
import Order from "@/models/Order";
import User from "@/models/User";

import Ledger from "@/models/Ledger";
import SalesInvoice from "@/models/SalesInvoice";
import PurchaseBill from "@/models/PurchaseBill";
import Expense from "@/models/Expense";
import AccountTransaction from "@/models/AccountTransaction";

/* =========================================================
   TYPES
========================================================= */

const allowedRoles = [
  "super_admin",
  "product_manager",
  "order_manager",
  "support_admin",
  "finance_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

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

function startOfDay(
  date: Date
) {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

function endOfDay(
  date: Date
) {
  const result =
    new Date(date);

  result.setHours(
    23,
    59,
    59,
    999
  );

  return result;
}

function startOfMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function startOfFinancialYear(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  const startYear =
    month >= 4
      ? year
      : year - 1;

  return new Date(
    startYear,
    3,
    1,
    0,
    0,
    0,
    0
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
   COMMON FILTERS
========================================================= */

const activeDocumentCondition = {
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

const activeTransactionCondition = {
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
   GET ADMIN DASHBOARD
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

    const now =
      new Date();

    const todayStart =
      startOfDay(
        now
      );

    const todayEnd =
      endOfDay(
        now
      );

    const monthStart =
      startOfMonth(
        now
      );

    const financialYearStart =
      startOfFinancialYear(
        now
      );

    /* =====================================================
       ECOMMERCE ORDER OVERVIEW
    ===================================================== */

    const orderSummaryResult =
      await Order.aggregate([
        {
          $group: {
            _id: null,

            totalOrders: {
              $sum: 1,
            },

            totalRevenue: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Cancelled",
                    ],
                  },

                  0,

                  {
                    $ifNull: [
                      "$totalAmount",

                      {
                        $ifNull: [
                          "$grandTotal",
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const orderSummary =
      orderSummaryResult[0] ?? {
        totalOrders: 0,
        totalRevenue: 0,
      };

    /* =====================================================
       TODAY ORDERS
    ===================================================== */

    const todayOrderResult =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                todayStart,

              $lte:
                todayEnd,
            },
          },
        },

        {
          $group: {
            _id: null,

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Cancelled",
                    ],
                  },

                  0,

                  {
                    $ifNull: [
                      "$totalAmount",

                      {
                        $ifNull: [
                          "$grandTotal",
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const todayOrders =
      todayOrderResult[0] ?? {
        orders: 0,
        revenue: 0,
      };

    /* =====================================================
       CURRENT MONTH ORDERS
    ===================================================== */

    const monthOrderResult =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                monthStart,

              $lte:
                todayEnd,
            },
          },
        },

        {
          $group: {
            _id: null,

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$orderStatus",
                      "Cancelled",
                    ],
                  },

                  0,

                  {
                    $ifNull: [
                      "$totalAmount",

                      {
                        $ifNull: [
                          "$grandTotal",
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const monthOrders =
      monthOrderResult[0] ?? {
        orders: 0,
        revenue: 0,
      };

    /* =====================================================
       ORDER STATUS
    ===================================================== */

    const [
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      returnRequests,
      exchangeRequests,
    ] =
      await Promise.all([
        Order.countDocuments({
          orderStatus: {
            $in: [
              "Placed",
              "Confirmed",
              "Packed",
              "Shipped",
              "Out For Delivery",
            ],
          },
        }),

        Order.countDocuments({
          orderStatus:
            "Delivered",
        }),

        Order.countDocuments({
          orderStatus:
            "Cancelled",
        }),

        Order.countDocuments({
          orderStatus: {
            $in: [
              "Return Requested",
              "Returned",
            ],
          },
        }),

        Order.countDocuments({
          orderStatus: {
            $in: [
              "Exchange Requested",
              "Exchange Approved",
              "Exchange Completed",
            ],
          },
        }),
      ]);

    const orderStatusBreakdown =
      await Order.aggregate([
        {
          $group: {
            _id:
              "$orderStatus",

            count: {
              $sum: 1,
            },

            amount: {
              $sum: {
                $ifNull: [
                  "$totalAmount",

                  {
                    $ifNull: [
                      "$grandTotal",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]);

    /* =====================================================
       PAYMENT BREAKDOWN
    ===================================================== */

    const [
      paymentStatusBreakdown,
      paymentMethodBreakdown,
    ] =
      await Promise.all([
        Order.aggregate([
          {
            $group: {
              _id:
                "$paymentStatus",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$totalAmount",

                    {
                      $ifNull: [
                        "$grandTotal",
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        ]),

        Order.aggregate([
          {
            $group: {
              _id:
                "$paymentMethod",

              count: {
                $sum: 1,
              },

              amount: {
                $sum: {
                  $ifNull: [
                    "$totalAmount",

                    {
                      $ifNull: [
                        "$grandTotal",
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          },
        ]),
      ]);

    /* =====================================================
       PRODUCTS
    ===================================================== */

    const [
      totalProducts,
      activeProducts,
      draftProducts,
      featuredProducts,
    ] =
      await Promise.all([
        Product.countDocuments({
          ...activeDocumentCondition,
        }),

        Product.countDocuments({
          ...activeDocumentCondition,

          status:
            "Active",
        }),

        Product.countDocuments({
          ...activeDocumentCondition,

          status:
            "Draft",
        }),

        Product.countDocuments({
          ...activeDocumentCondition,

          featured:
            true,
        }),
      ]);

    const outOfStockProducts =
      await Product.countDocuments({
        $and: [
          activeDocumentCondition,

          {
            $or: [
              {
                status:
                  "Out of Stock",
              },

              {
                stock: {
                  $lte: 0,
                },
              },
            ],
          },
        ],
      });

    const lowStockProducts =
      await Product.find({
        $and: [
          activeDocumentCondition,

          {
            status: {
              $ne:
                "Archived",
            },
          },

          {
            stock: {
              $gt: 0,
            },
          },

          {
            $expr: {
              $lte: [
                {
                  $ifNull: [
                    "$stock",
                    0,
                  ],
                },

                {
                  $ifNull: [
                    "$lowStockLimit",
                    5,
                  ],
                },
              ],
            },
          },
        ],
      })
        .select(
          "_id name sku thumbnail stock lowStockLimit status price"
        )
        .sort({
          stock: 1,
        })
        .limit(10)
        .lean();

    /* =====================================================
       CUSTOMERS
    ===================================================== */

    const [
      totalCustomers,
      todayCustomers,
      monthCustomers,
    ] =
      await Promise.all([
        User.countDocuments({
          role: "user",
        }),

        User.countDocuments({
          role: "user",

          createdAt: {
            $gte:
              todayStart,

            $lte:
              todayEnd,
          },
        }),

        User.countDocuments({
          role: "user",

          createdAt: {
            $gte:
              monthStart,

            $lte:
              todayEnd,
          },
        }),
      ]);

    /* =====================================================
       ACCOUNTS SALES
    ===================================================== */

    const salesResult =
      await SalesInvoice.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

              {
                status: {
                  $ne:
                    "cancelled",
                },
              },
            ],
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

                  {
                    $ifNull: [
                      "$paid",
                      0,
                    ],
                  },
                ],
              },
            },

            due: {
              $sum: {
                $ifNull: [
                  "$dueAmount",

                  {
                    $ifNull: [
                      "$due",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const sales =
      salesResult[0] ?? {
        count: 0,
        taxable: 0,
        gst: 0,
        total: 0,
        paid: 0,
        due: 0,
      };

    /* =====================================================
       ACCOUNTS PURCHASE
    ===================================================== */

    const purchaseResult =
      await PurchaseBill.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

              {
                status: {
                  $ne:
                    "cancelled",
                },
              },
            ],
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

                  {
                    $ifNull: [
                      "$paid",
                      0,
                    ],
                  },
                ],
              },
            },

            due: {
              $sum: {
                $ifNull: [
                  "$dueAmount",

                  {
                    $ifNull: [
                      "$due",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const purchases =
      purchaseResult[0] ?? {
        count: 0,
        taxable: 0,
        gst: 0,
        total: 0,
        paid: 0,
        due: 0,
      };

    /* =====================================================
       ACCOUNTS EXPENSES
    ===================================================== */

    const expenseResult =
      await Expense.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

              {
                status: {
                  $ne:
                    "cancelled",
                },
              },
            ],
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
      ]);

    const expenses =
      expenseResult[0] ?? {
        count: 0,
        taxable: 0,
        gst: 0,
        total: 0,
      };

    /* =====================================================
       CURRENT MONTH ACCOUNTS
    ===================================================== */

    const [
      monthSalesResult,
      monthPurchaseResult,
      monthExpenseResult,
    ] =
      await Promise.all([
        SalesInvoice.aggregate([
          {
            $match: {
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  invoiceDate: {
                    $gte:
                      monthStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  purchaseDate: {
                    $gte:
                      monthStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  expenseDate: {
                    $gte:
                      monthStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$totalAmount",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const accountMonthSales =
      monthSalesResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    const accountMonthPurchases =
      monthPurchaseResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    const accountMonthExpenses =
      monthExpenseResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    /* =====================================================
       FINANCIAL YEAR ACCOUNTS
    ===================================================== */

    const [
      fySalesResult,
      fyPurchaseResult,
      fyExpenseResult,
    ] =
      await Promise.all([
        SalesInvoice.aggregate([
          {
            $match: {
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  invoiceDate: {
                    $gte:
                      financialYearStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  purchaseDate: {
                    $gte:
                      financialYearStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$grandTotal",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  expenseDate: {
                    $gte:
                      financialYearStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: {
                  $ifNull: [
                    "$totalAmount",
                    0,
                  ],
                },
              },

              taxable: {
                $sum: {
                  $ifNull: [
                    "$taxableAmount",
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const fySales =
      fySalesResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    const fyPurchases =
      fyPurchaseResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    const fyExpenses =
      fyExpenseResult[0] ?? {
        total: 0,
        taxable: 0,
      };

    /* =====================================================
       RECEIVABLE
    ===================================================== */

    const receivableResult =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

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
              $sum:
                "$currentBalance",
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
       PAYABLE
    ===================================================== */

    const payableResult =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

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
       CASH + BANK
    ===================================================== */

    const cashBankResult =
      await Ledger.aggregate([
        {
          $match: {
            $and: [
              activeDocumentCondition,

              {
                isActive:
                  true,
              },

              {
                ledgerType: {
                  $in: [
                    "cash",
                    "bank",
                  ],
                },
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
      cashBankResult
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
       PROFIT
    ===================================================== */

    const accountProfit =
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

    const monthAccountProfit =
      roundMoney(
        Number(
          accountMonthSales.taxable ||
            0
        ) -
          Number(
            accountMonthPurchases.taxable ||
              0
          ) -
          Number(
            accountMonthExpenses.taxable ||
              0
          )
      );

    const financialYearProfit =
      roundMoney(
        Number(
          fySales.taxable ||
            0
        ) -
          Number(
            fyPurchases.taxable ||
              0
          ) -
          Number(
            fyExpenses.taxable ||
              0
          )
      );

    /* =====================================================
       RECENT DATA
    ===================================================== */

    const [
      recentOrders,
      recentCustomers,
      topProducts,
      recentTransactions,
      topReceivables,
      topPayables,
    ] =
      await Promise.all([
        Order.find({})
          .populate(
            "user",
            "name mobile email"
          )
          .sort({
            createdAt: -1,
          })
          .limit(8)
          .lean(),

        User.find({
          role:
            "user",
        })
          .select(
            "_id name mobile email profileImage isVerified isBlocked createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .limit(8)
          .lean(),

        Product.find({
          ...activeDocumentCondition,
        })
          .select(
            "_id name sku thumbnail price stock sold status"
          )
          .sort({
            sold: -1,
          })
          .limit(8)
          .lean(),

        AccountTransaction.find({
          $and: [
            activeTransactionCondition,
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
              -1,

            createdAt:
              -1,
          })
          .limit(10)
          .lean(),

        Ledger.find({
          $and: [
            activeDocumentCondition,

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
        })
          .select(
            "name phone email currentBalance"
          )
          .sort({
            currentBalance:
              -1,
          })
          .limit(6)
          .lean(),

        Ledger.aggregate([
          {
            $match: {
              $and: [
                activeDocumentCondition,

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
            $project: {
              name: 1,
              phone: 1,
              email: 1,
              currentBalance: 1,

              payable: {
                $abs:
                  "$currentBalance",
              },
            },
          },

          {
            $sort: {
              payable: -1,
            },
          },

          {
            $limit: 6,
          },
        ]),
      ]);

    /* =====================================================
       MONTHLY ORDER TREND
    ===================================================== */

    const trendStart =
      new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1,
        0,
        0,
        0,
        0
      );

    const orderTrendRaw =
      await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                trendStart,

              $lte:
                todayEnd,
            },

            orderStatus: {
              $ne:
                "Cancelled",
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year:
                  "$createdAt",
              },

              month: {
                $month:
                  "$createdAt",
              },
            },

            orders: {
              $sum: 1,
            },

            revenue: {
              $sum: {
                $ifNull: [
                  "$totalAmount",

                  {
                    $ifNull: [
                      "$grandTotal",
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    /* =====================================================
       ACCOUNTS TREND
    ===================================================== */

    const [
      accountSalesTrend,
      accountPurchaseTrend,
      accountExpenseTrend,
    ] =
      await Promise.all([
        SalesInvoice.aggregate([
          {
            $match: {
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  invoiceDate: {
                    $gte:
                      trendStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  purchaseDate: {
                    $gte:
                      trendStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
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
              $and: [
                activeDocumentCondition,

                {
                  status: {
                    $ne:
                      "cancelled",
                  },
                },

                {
                  expenseDate: {
                    $gte:
                      trendStart,

                    $lte:
                      todayEnd,
                  },
                },
              ],
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
       BUILD 12 MONTH TREND
    ===================================================== */

    const trendMap =
      new Map<
        string,
        {
          year: number;
          month: number;
          ecommerceRevenue: number;
          orders: number;
          accountSales: number;
          purchases: number;
          expenses: number;
        }
      >();

    for (
      let index = 0;
      index < 12;
      index++
    ) {
      const date =
        new Date(
          trendStart.getFullYear(),
          trendStart.getMonth() +
            index,
          1
        );

      const year =
        date.getFullYear();

      const month =
        date.getMonth() +
        1;

      trendMap.set(
        `${year}-${month}`,
        {
          year,
          month,
          ecommerceRevenue: 0,
          orders: 0,
          accountSales: 0,
          purchases: 0,
          expenses: 0,
        }
      );
    }

    for (
      const item of
      orderTrendRaw
    ) {
      const row =
        trendMap.get(
          `${item._id.year}-${item._id.month}`
        );

      if (row) {
        row.orders =
          Number(
            item.orders ||
              0
          );

        row.ecommerceRevenue =
          roundMoney(
            Number(
              item.revenue ||
                0
            )
          );
      }
    }

    for (
      const item of
      accountSalesTrend
    ) {
      const row =
        trendMap.get(
          `${item._id.year}-${item._id.month}`
        );

      if (row) {
        row.accountSales =
          roundMoney(
            Number(
              item.amount ||
                0
            )
          );
      }
    }

    for (
      const item of
      accountPurchaseTrend
    ) {
      const row =
        trendMap.get(
          `${item._id.year}-${item._id.month}`
        );

      if (row) {
        row.purchases =
          roundMoney(
            Number(
              item.amount ||
                0
            )
          );
      }
    }

    for (
      const item of
      accountExpenseTrend
    ) {
      const row =
        trendMap.get(
          `${item._id.year}-${item._id.month}`
        );

      if (row) {
        row.expenses =
          roundMoney(
            Number(
              item.amount ||
                0
            )
          );
      }
    }

    const monthlyTrend =
      Array.from(
        trendMap.values()
      ).map(
        (row) => ({
          ...row,

          difference:
            roundMoney(
              row.accountSales -
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

        admin: {
          role:
            admin.role,
        },

        overview: {
          ecommerceRevenue:
            roundMoney(
              Number(
                orderSummary.totalRevenue ||
                  0
              )
            ),

          orders:
            Number(
              orderSummary.totalOrders ||
                0
            ),

          customers:
            totalCustomers,

          products:
            totalProducts,

          accountSales:
            roundMoney(
              Number(
                sales.total ||
                  0
              )
            ),

          purchases:
            roundMoney(
              Number(
                purchases.total ||
                  0
              )
            ),

          expenses:
            roundMoney(
              Number(
                expenses.total ||
                  0
              )
            ),

          profitEstimate:
            accountProfit,
        },

        today: {
          ecommerceRevenue:
            roundMoney(
              Number(
                todayOrders.revenue ||
                  0
              )
            ),

          orders:
            Number(
              todayOrders.orders ||
                0
            ),

          customers:
            todayCustomers,
        },

        currentMonth: {
          ecommerceRevenue:
            roundMoney(
              Number(
                monthOrders.revenue ||
                  0
              )
            ),

          orders:
            Number(
              monthOrders.orders ||
                0
            ),

          customers:
            monthCustomers,

          sales:
            roundMoney(
              Number(
                accountMonthSales.total ||
                  0
              )
            ),

          purchases:
            roundMoney(
              Number(
                accountMonthPurchases.total ||
                  0
              )
            ),

          expenses:
            roundMoney(
              Number(
                accountMonthExpenses.total ||
                  0
              )
            ),

          profitEstimate:
            monthAccountProfit,
        },

        financialYear: {
          sales:
            roundMoney(
              Number(
                fySales.total ||
                  0
              )
            ),

          purchases:
            roundMoney(
              Number(
                fyPurchases.total ||
                  0
              )
            ),

          expenses:
            roundMoney(
              Number(
                fyExpenses.total ||
                  0
              )
            ),

          profitEstimate:
            financialYearProfit,
        },

        orderSummary: {
          pending:
            pendingOrders,

          delivered:
            deliveredOrders,

          cancelled:
            cancelledOrders,

          returns:
            returnRequests,

          exchanges:
            exchangeRequests,

          statusBreakdown:
            orderStatusBreakdown,

          paymentStatusBreakdown,

          paymentMethodBreakdown,
        },

        productSummary: {
          total:
            totalProducts,

          active:
            activeProducts,

          draft:
            draftProducts,

          outOfStock:
            outOfStockProducts,

          featured:
            featuredProducts,

          lowStock:
            lowStockProducts,
        },

        customerSummary: {
          total:
            totalCustomers,

          today:
            todayCustomers,

          month:
            monthCustomers,
        },

        accounts: {
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

          profitEstimate:
            accountProfit,
        },

        topReceivables,

        topPayables,

        lowStockProducts,

        recentOrders,

        recentCustomers,

        topProducts,

        recentTransactions,

        monthlyTrend,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET_ADMIN_DASHBOARD_ERROR:",
      error
    );

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Unable to load admin dashboard.",
      500
    );
  }
}