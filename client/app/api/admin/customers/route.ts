import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";
import User from "@/models/User";
import Order from "@/models/Order";

async function authenticate(
  request: NextRequest
) {
  const token =
    request.cookies.get(
      "adminToken"
    )?.value;

  if (!token) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  const payload =
    await verifyAdminToken(
      token
    );

  const admin =
    await Admin.findById(
      payload.adminId
    )
      .select(
        "role isActive"
      )
      .lean();

  if (
    !admin ||
    admin.isActive === false
  ) {
    throw new Error(
      "UNAUTHORIZED"
    );
  }

  if (
    ![
      "super_admin",
      "support_admin",
      "order_manager",
    ].includes(
      String(admin.role)
    )
  ) {
    throw new Error(
      "FORBIDDEN"
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    await authenticate(
      request
    );

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() || "";

    const status =
      request.nextUrl.searchParams
        .get("status") || "";

    const page =
      Math.max(
        1,
        Number(
          request.nextUrl.searchParams.get(
            "page"
          ) || 1
        )
      );

    const limit =
      20;

    const filter: any = {
      role: {
        $ne: "admin",
      },
    };

    if (
      status ===
      "blocked"
    ) {
      filter.isBlocked =
        true;
    }

    if (
      status ===
      "active"
    ) {
      filter.isBlocked = {
        $ne: true,
      };
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex:
              search,
            $options:
              "i",
          },
        },

        {
          email: {
            $regex:
              search,
            $options:
              "i",
          },
        },

        {
          mobile: {
            $regex:
              search,
            $options:
              "i",
          },
        },
      ];
    }

    const [
      customers,
      total,
      totalCustomers,
      blockedCustomers,
    ] =
      await Promise.all([
        User.find(filter)
          .select(
            "_id name email mobile profileImage isVerified isBlocked lastLogin createdAt"
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) *
              limit
          )
          .limit(limit)
          .lean(),

        User.countDocuments(
          filter
        ),

        User.countDocuments({
          role: {
            $ne: "admin",
          },
        }),

        User.countDocuments({
          role: {
            $ne: "admin",
          },
          isBlocked:
            true,
        }),
      ]);

    const ids =
      customers.map(
        (customer: any) =>
          customer._id
      );

    const orderStats =
      await Order.aggregate([
        {
          $match: {
            user: {
              $in: ids,
            },
          },
        },

        {
          $group: {
            _id: "$user",

            orderCount: {
              $sum: 1,
            },

            totalSpend: {
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
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

    const statsMap =
      new Map(
        orderStats.map(
          (item) => [
            String(
              item._id
            ),
            item,
          ]
        )
      );

    const result =
      customers.map(
        (customer: any) => {
          const stats =
            statsMap.get(
              String(
                customer._id
              )
            );

          return {
            ...customer,

            orderCount:
              stats?.orderCount ||
              0,

            totalSpend:
              stats?.totalSpend ||
              0,
          };
        }
      );

    return NextResponse.json({
      success: true,

      customers:
        result,

      summary: {
        total:
          totalCustomers,

        active:
          totalCustomers -
          blockedCustomers,

        blocked:
          blockedCustomers,
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
    });
  } catch (error) {
    console.error(
      "CUSTOMERS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load customers.",
      },
      {
        status: 500,
      }
    );
  }
}