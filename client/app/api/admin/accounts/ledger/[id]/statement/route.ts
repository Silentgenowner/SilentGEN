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
| TYPES
|--------------------------------------------------------------------------
*/

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

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

function startOfDay(
  value: string
) {
  const date =
    new Date(
      `${value}T00:00:00`
    );

  return date;
}

function endOfDay(
  value: string
) {
  const date =
    new Date(
      `${value}T23:59:59.999`
    );

  return date;
}

/*
|--------------------------------------------------------------------------
| GET STATEMENT
|--------------------------------------------------------------------------
|
| GET /api/admin/accounts/ledger/[id]/statement
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | AUTH
    |--------------------------------------------------------------------------
    */

    if (
      !(await hasPermission(
        request
      ))
    ) {
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

    await connectDB();

    const { id } =
      await context.params;

    /*
    |--------------------------------------------------------------------------
    | ID
    |--------------------------------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid ledger id.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LEDGER
    |--------------------------------------------------------------------------
    */

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
    | QUERY
    |--------------------------------------------------------------------------
    */

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
          30
        ),
        100
      );

    const from =
      searchParams.get(
        "from"
      )?.trim() ||
      "";

    const to =
      searchParams.get(
        "to"
      )?.trim() ||
      "";

    /*
    |--------------------------------------------------------------------------
    | TRANSACTION FILTER
    |--------------------------------------------------------------------------
    */

    const filter:
      Record<
        string,
        unknown
      > = {
        ledgerId:
          new mongoose.Types.ObjectId(
            id
          ),

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

    const dateFilter:
      Record<
        string,
        Date
      > = {};

    if (from) {
      const fromDate =
        startOfDay(
          from
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
        endOfDay(
          to
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
      ).length >
      0
    ) {
      filter.transactionDate =
        dateFilter;
    }

    /*
    |--------------------------------------------------------------------------
    | BALANCE BEFORE FILTER
    |--------------------------------------------------------------------------
    */

    let openingRunningBalance =
      0;

    if (from) {
      const fromDate =
        startOfDay(
          from
        );

      if (
        !Number.isNaN(
          fromDate.getTime()
        )
      ) {
        const previousTransactions =
          await AccountTransaction.aggregate(
            [
              {
                $match: {
                  ledgerId:
                    new mongoose.Types.ObjectId(
                      id
                    ),

                  transactionDate: {
                    $lt:
                      fromDate,
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
                },
              },

              {
                $group: {
                  _id:
                    null,

                  debit: {
                    $sum:
                      "$debit",
                  },

                  credit: {
                    $sum:
                      "$credit",
                  },
                },
              },
            ]
          );

        const previous =
          previousTransactions[0];

        openingRunningBalance =
          Number(
            previous?.debit ??
              0
          ) -
          Number(
            previous?.credit ??
              0
          );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | ALL MATCHED TRANSACTIONS FOR RUNNING BALANCE
    |--------------------------------------------------------------------------
    */

    const [
      allTransactions,
      totals,
      totalTransactions,
    ] =
      await Promise.all([
        AccountTransaction.find(
          filter
        )
          .sort({
            transactionDate:
              1,

            createdAt:
              1,
          })
          .lean(),

        AccountTransaction.aggregate(
          [
            {
              $match:
                filter,
            },

            {
              $group: {
                _id:
                  null,

                totalDebit: {
                  $sum:
                    "$debit",
                },

                totalCredit: {
                  $sum:
                    "$credit",
                },

                totalGST: {
                  $sum:
                    "$gstAmount",
                },

                totalCGST: {
                  $sum:
                    "$cgst",
                },

                totalSGST: {
                  $sum:
                    "$sgst",
                },

                totalIGST: {
                  $sum:
                    "$igst",
                },
              },
            },
          ]
        ),

        AccountTransaction.countDocuments(
          filter
        ),
      ]);

    /*
    |--------------------------------------------------------------------------
    | RUNNING BALANCE
    |--------------------------------------------------------------------------
    */

    let runningBalance =
      openingRunningBalance;

    const transactionsWithBalance =
      allTransactions.map(
        (
          transaction:
            any
        ) => {
          const debit =
            Number(
              transaction.debit ??
                0
            );

          const credit =
            Number(
              transaction.credit ??
                0
            );

          runningBalance +=
            debit -
            credit;

          return {
            ...transaction,

            runningBalance,
          };
        }
      );

    /*
    |--------------------------------------------------------------------------
    | MANUAL PAGINATION
    |--------------------------------------------------------------------------
    */

    const startIndex =
      (page - 1) *
      limit;

    const pageTransactions =
      transactionsWithBalance.slice(
        startIndex,
        startIndex +
          limit
      );

    const summary =
      totals[0] ?? {
        totalDebit:
          0,

        totalCredit:
          0,

        totalGST:
          0,

        totalCGST:
          0,

        totalSGST:
          0,

        totalIGST:
          0,
      };

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success:
          true,

        ledger,

        summary: {
          openingBalance:
            openingRunningBalance,

          totalDebit:
            Number(
              summary.totalDebit ??
                0
            ),

          totalCredit:
            Number(
              summary.totalCredit ??
                0
            ),

          totalGST:
            Number(
              summary.totalGST ??
                0
            ),

          totalCGST:
            Number(
              summary.totalCGST ??
                0
            ),

          totalSGST:
            Number(
              summary.totalSGST ??
                0
            ),

          totalIGST:
            Number(
              summary.totalIGST ??
                0
            ),

          closingBalance:
            runningBalance,

          currentBalance:
            Number(
              ledger.currentBalance ??
                0
            ),
        },

        transactions:
          pageTransactions,

        pagination: {
          page,

          limit,

          totalTransactions,

          totalPages:
            Math.max(
              1,
              Math.ceil(
                totalTransactions /
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
      "LEDGER_STATEMENT_ERROR:",
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
            : "Unable to load ledger statement.",
      },
      {
        status: 500,
      }
    );
  }
}