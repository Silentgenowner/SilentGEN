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
| ALLOWED ROLES
|--------------------------------------------------------------------------
*/

const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;

type AllowedRole =
  (typeof allowedRoles)[number];

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type AdminPayload = {
  adminId?: string;
  role?: string;
};

type LedgerType =
  | "customer"
  | "supplier"
  | "sales"
  | "purchase"
  | "expense"
  | "gst_input"
  | "gst_output"
  | "cash"
  | "bank"
  | "other";

type BalanceType =
  | "debit"
  | "credit";

/*
|--------------------------------------------------------------------------
| ADMIN AUTH
|--------------------------------------------------------------------------
*/

async function getAdminPayload(
  request: NextRequest
): Promise<AdminPayload | null> {
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

function permissionDeniedResponse() {
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

function invalidResponse(
  message: string
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status: 400,
    }
  );
}

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

function isLedgerType(
  value: unknown
): value is LedgerType {
  return [
    "customer",
    "supplier",
    "sales",
    "purchase",
    "expense",
    "gst_input",
    "gst_output",
    "cash",
    "bank",
    "other",
  ].includes(
    String(value)
  );
}

function isBalanceType(
  value: unknown
): value is BalanceType {
  return (
    value === "debit" ||
    value === "credit"
  );
}

function parsePageNumber(
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

function escapeRegex(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| GET LEDGERS
|--------------------------------------------------------------------------
|
| GET /api/admin/accounts/ledger
|
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    await connectDB();

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const page =
      parsePageNumber(
        searchParams.get(
          "page"
        ),
        1
      );

    const limit =
      Math.min(
        parsePageNumber(
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

    const type =
      cleanString(
        searchParams.get(
          "type"
        )
      );

    const status =
      cleanString(
        searchParams.get(
          "status"
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
            name:
              regex,
          },
          {
            phone:
              regex,
          },
          {
            email:
              regex,
          },
          {
            gstNumber:
              regex,
          },
        ],
      });
    }

    if (
      type &&
      isLedgerType(
        type
      )
    ) {
      filters.push({
        ledgerType:
          type,
      });
    }

    if (
      status === "active"
    ) {
      filters.push({
        isActive:
          true,
      });
    }

    if (
      status === "inactive"
    ) {
      filters.push({
        isActive:
          false,
      });
    }

    const filter = {
      $and:
        filters,
    };

    const [
      ledgers,
      totalLedgers,
      totals,
    ] =
      await Promise.all([
        Ledger.find(
          filter
        )
          .sort({
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

        Ledger.countDocuments(
          filter
        ),

        Ledger.aggregate([
          {
            $match: {
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
              _id: null,

              totalDebit: {
                $sum: {
                  $cond: [
                    {
                      $gt: [
                        "$currentBalance",
                        0,
                      ],
                    },
                    "$currentBalance",
                    0,
                  ],
                },
              },

              totalCredit: {
                $sum: {
                  $cond: [
                    {
                      $lt: [
                        "$currentBalance",
                        0,
                      ],
                    },
                    {
                      $abs:
                        "$currentBalance",
                    },
                    0,
                  ],
                },
              },

              totalLedgers: {
                $sum: 1,
              },

              activeLedgers: {
                $sum: {
                  $cond: [
                    "$isActive",
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const summary =
      totals[0] ?? {
        totalDebit: 0,
        totalCredit: 0,
        totalLedgers: 0,
        activeLedgers: 0,
      };

    return NextResponse.json(
      {
        success:
          true,

        ledgers,

        summary: {
          totalLedgers:
            Number(
              summary.totalLedgers ??
                0
            ),

          activeLedgers:
            Number(
              summary.activeLedgers ??
                0
            ),

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
        },

        pagination: {
          page,

          limit,

          totalLedgers,

          totalPages:
            Math.max(
              1,
              Math.ceil(
                totalLedgers /
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
      "GET_LEDGER_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        message:
          "Unable to load ledgers.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| CREATE LEDGER
|--------------------------------------------------------------------------
|
| POST /api/admin/accounts/ledger
|
|--------------------------------------------------------------------------
*/

export async function POST(
  request: NextRequest
) {
  try {
    const admin =
      await getAdminPayload(
        request
      );

    if (!admin) {
      return permissionDeniedResponse();
    }

    await connectDB();

    let body:
      unknown;

    try {
      body =
        await request.json();
    } catch {
      return invalidResponse(
        "Invalid JSON request body."
      );
    }

    if (
      !isRecord(
        body
      )
    ) {
      return invalidResponse(
        "Invalid request body."
      );
    }

    const name =
      cleanString(
        body.name
      );

    if (!name) {
      return invalidResponse(
        "Ledger name is required."
      );
    }

    if (
      !isLedgerType(
        body.ledgerType
      )
    ) {
      return invalidResponse(
        "Invalid ledger type."
      );
    }

    const ledgerType =
      body.ledgerType;

    const balanceType:
      BalanceType =
      isBalanceType(
        body.balanceType
      )
        ? body.balanceType
        : "debit";

    const openingBalance =
      Number(
        body.openingBalance ??
          0
      );

    if (
      !Number.isFinite(
        openingBalance
      ) ||
      openingBalance <
        0
    ) {
      return invalidResponse(
        "Opening balance must be a valid non-negative number."
      );
    }

    const phone =
      cleanString(
        body.phone
      );

    const email =
      cleanString(
        body.email
      ).toLowerCase();

    const gstNumber =
      cleanString(
        body.gstNumber
      ).toUpperCase();

    const address =
      cleanString(
        body.address
      );

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
      }).lean();

    if (existing) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "A ledger with the same name and type already exists.",
        },
        {
          status:
            409,
        }
      );
    }

    const currentBalance =
      balanceType ===
      "credit"
        ? -Math.abs(
            openingBalance
          )
        : Math.abs(
            openingBalance
          );

    const ledger =
      await Ledger.create({
        name,

        ledgerType,

        phone,

        email,

        gstNumber,

        address,

        openingBalance,

        balanceType,

        currentBalance,

        isActive:
          body.isActive !==
          false,

        isDeleted:
          false,

        deletedAt:
          null,
      });

    /*
    |--------------------------------------------------------------------------
    | OPENING TRANSACTION
    |--------------------------------------------------------------------------
    */

    if (
      openingBalance >
      0
    ) {
      const transactionNumber =
        `OP-${Date.now()}-${String(
          ledger._id
        ).slice(-6)}`;

      await AccountTransaction.create({
        transactionNumber,

        transactionDate:
          new Date(),

        transactionType:
          "opening",

        ledgerId:
          ledger._id,

        debit:
          balanceType ===
          "debit"
            ? openingBalance
            : 0,

        credit:
          balanceType ===
          "credit"
            ? openingBalance
            : 0,

        amount:
          openingBalance,

        paymentMode:
          "other",

        referenceType:
          "opening",

        referenceId:
          ledger._id,

        referenceNumber:
          "",

        narration:
          "Opening balance",

        gstAmount:
          0,

        cgst:
          0,

        sgst:
          0,

        igst:
          0,

        isDeleted:
          false,

        deletedAt:
          null,
      });
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Ledger created successfully.",

        ledger,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE_LEDGER_ERROR:",
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
            "Ledger validation failed.",

          errors:
            Object.values(
              error.errors
            ).map(
              (item) =>
                item.message
            ),
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to create ledger.",
      },
      {
        status: 500,
      }
    );
  }
}