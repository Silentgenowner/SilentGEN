import {
  NextRequest,
  NextResponse,
} from "next/server";

import connectDB from "@/lib/connectDB";

import {
  verifyAdminToken,
} from "@/lib/adminAuth";

import Admin from "@/models/Admin";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

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
      "finance_manager",
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

    const orders =
      await Order.find()
        .select(
          "items totalAmount paymentMethod paymentStatus orderStatus createdAt"
        )
        .lean();

    const totalOrders =
      orders.length;

    const delivered =
      orders.filter(
        (order: any) =>
          order.orderStatus ===
          "Delivered"
      ).length;

    const cancelled =
      orders.filter(
        (order: any) =>
          order.orderStatus ===
          "Cancelled"
      ).length;

    const pending =
      orders.filter(
        (order: any) =>
          ![
            "Delivered",
            "Cancelled",
            "Returned",
          ].includes(
            order.orderStatus
          )
      ).length;

    const totalRevenue =
      orders.reduce(
        (
          total: number,
          order: any
        ) =>
          [
            "Cancelled",
            "Returned",
          ].includes(
            order.orderStatus
          )
            ? total
            : total +
              Number(
                order.totalAmount ||
                  0
              ),
        0
      );

    const codRevenue =
      orders.reduce(
        (
          total: number,
          order: any
        ) =>
          order.paymentMethod ===
            "COD" &&
          ![
            "Cancelled",
            "Returned",
          ].includes(
            order.orderStatus
          )
            ? total +
              Number(
                order.totalAmount ||
                  0
              )
            : total,
        0
      );

    const onlineRevenue =
      totalRevenue -
      codRevenue;

    const customerCount =
      await User.countDocuments({
        role: {
          $ne: "admin",
        },
      });

    const productCount =
      await Product.countDocuments({
        isDeleted: {
          $ne: true,
        },
      });

    const lowStockProducts =
      await Product.find({
        isDeleted: {
          $ne: true,
        },

        $expr: {
          $lte: [
            "$stock",

            {
              $ifNull: [
                "$lowStockLimit",
                5,
              ],
            },
          ],
        },
      })
        .select(
          "_id name sku stock lowStockLimit"
        )
        .sort({
          stock: 1,
        })
        .limit(10)
        .lean();

    const productSales =
      new Map<
        string,
        {
          name: string;
          quantity: number;
          revenue: number;
        }
      >();

    for (const order of orders as any[]) {
      if (
        [
          "Cancelled",
          "Returned",
        ].includes(
          order.orderStatus
        )
      ) {
        continue;
      }

      for (
        const item of
        order.items || []
      ) {
        const key =
          String(
            item.product ||
              item.name
          );

        const current =
          productSales.get(
            key
          ) || {
            name:
              item.name ||
              "Product",

            quantity: 0,

            revenue: 0,
          };

        current.quantity +=
          Number(
            item.quantity ||
              0
          );

        current.revenue +=
          Number(
            item.quantity ||
              0
          ) *
          Number(
            item.price ||
              0
          );

        productSales.set(
          key,
          current
        );
      }
    }

    const topProducts =
      Array.from(
        productSales.values()
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity
        )
        .slice(
          0,
          10
        );

    const dailyMap =
      new Map<
        string,
        {
          date: string;
          orders: number;
          revenue: number;
        }
      >();

    for (const order of orders as any[]) {
      const date =
        new Date(
          order.createdAt
        )
          .toISOString()
          .slice(
            0,
            10
          );

      const current =
        dailyMap.get(
          date
        ) || {
          date,
          orders: 0,
          revenue: 0,
        };

      current.orders +=
        1;

      if (
        ![
          "Cancelled",
          "Returned",
        ].includes(
          order.orderStatus
        )
      ) {
        current.revenue +=
          Number(
            order.totalAmount ||
              0
          );
      }

      dailyMap.set(
        date,
        current
      );
    }

    const dailySales =
      Array.from(
        dailyMap.values()
      )
        .sort(
          (a, b) =>
            a.date.localeCompare(
              b.date
            )
        )
        .slice(-30);

    return NextResponse.json({
      success: true,

      summary: {
        totalRevenue,

        totalOrders,

        delivered,

        pending,

        cancelled,

        customerCount,

        productCount,

        codRevenue,

        onlineRevenue,

        averageOrderValue:
          totalOrders > 0
            ? totalRevenue /
              totalOrders
            : 0,
      },

      dailySales,

      topProducts,

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "REPORTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to load reports.",
      },
      {
        status: 500,
      }
    );
  }
}