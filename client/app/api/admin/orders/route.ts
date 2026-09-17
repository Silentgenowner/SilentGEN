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

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type OrderFilter = {
  orderStatus?: string;
};

/*
|--------------------------------------------------------------------------
| GET ADMIN ORDERS
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | DATABASE
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | ADMIN TOKEN
    |--------------------------------------------------------------------------
    */

    const token =
      request.cookies.get(
        "adminToken"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Admin authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY ADMIN TOKEN
    |--------------------------------------------------------------------------
    */

    let tokenPayload;

    try {
      tokenPayload =
        await verifyAdminToken(
          token
        );
    } catch (error) {
      console.error(
        "ADMIN ORDERS TOKEN ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid or expired admin session. Please login again.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN ID
    |--------------------------------------------------------------------------
    */

    const adminId =
      tokenPayload.adminId;

    if (!adminId) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid admin session.",
        },
        {
          status: 401,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND ADMIN
    |--------------------------------------------------------------------------
    */

    const admin =
      await Admin.findById(
        adminId
      )
        .select(
          "_id name email role isActive"
        )
        .lean();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Admin account not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE CHECK
    |--------------------------------------------------------------------------
    */

    if (
      admin.isActive ===
      false
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Admin account is disabled.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE CHECK
    |--------------------------------------------------------------------------
    */

    const allowedRoles = [
      "super_admin",
      "order_manager",
      "support_admin",
    ];

    if (
      !allowedRoles.includes(
        String(
          admin.role || ""
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "You do not have permission to view orders.",
        },
        {
          status: 403,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY PARAMS
    |--------------------------------------------------------------------------
    */

    const search =
      request.nextUrl
        .searchParams
        .get("search")
        ?.trim() || "";

    const status =
      request.nextUrl
        .searchParams
        .get("status")
        ?.trim() || "";

    /*
    |--------------------------------------------------------------------------
    | FILTER
    |--------------------------------------------------------------------------
    */

    const filter:
      OrderFilter = {};

    if (status) {
      filter.orderStatus =
        status;
    }

    /*
    |--------------------------------------------------------------------------
    | FETCH ORDERS
    |--------------------------------------------------------------------------
    */

    let orders =
      await Order.find(
        filter
      )
        .populate({
          path: "user",

          select:
            "name email mobile phone",
        })
        .populate({
          path:
            "items.product",

          select:
            "name slug sku thumbnail images price mrp",
        })
        .sort({
          createdAt: -1,
        })
        .lean();

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (search) {
      const keyword =
        search
          .trim()
          .toLowerCase();

      orders =
        orders.filter(
          (order: any) => {
            const user =
              order?.user ||
              {};

            const shipping =
              order?.shippingAddress ||
              {};

            const customerName =
              String(
                user?.name ||
                  shipping?.fullName ||
                  ""
              ).toLowerCase();

            const customerEmail =
              String(
                user?.email ||
                  ""
              ).toLowerCase();

            const customerMobile =
              String(
                user?.mobile ||
                  user?.phone ||
                  shipping?.mobile ||
                  ""
              ).toLowerCase();

            const orderId =
              String(
                order?._id ||
                  ""
              ).toLowerCase();

            const invoiceNo =
              String(
                order?.invoiceNo ||
                  order?.invoiceNumber ||
                  ""
              ).toLowerCase();

            const trackingNumber =
              String(
                order?.trackingNumber ||
                  ""
              ).toLowerCase();

            return (
              customerName.includes(
                keyword
              ) ||
              customerEmail.includes(
                keyword
              ) ||
              customerMobile.includes(
                keyword
              ) ||
              orderId.includes(
                keyword
              ) ||
              invoiceNo.includes(
                keyword
              ) ||
              trackingNumber.includes(
                keyword
              )
            );
          }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    const summary = {
      total:
        orders.length,

      placed:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Placed"
        ).length,

      confirmed:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Confirmed"
        ).length,

      packed:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Packed"
        ).length,

      shipped:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Shipped"
        ).length,

      outForDelivery:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Out For Delivery"
        ).length,

      delivered:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Delivered"
        ).length,

      cancelled:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Cancelled"
        ).length,

      returnRequested:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Return Requested"
        ).length,

      returned:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Returned"
        ).length,

      exchangeRequested:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Exchange Requested"
        ).length,

      exchangeApproved:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Exchange Approved"
        ).length,

      exchangeCompleted:
        orders.filter(
          (order: any) =>
            order.orderStatus ===
            "Exchange Completed"
        ).length,
    };

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json(
      {
        success: true,

        totalOrders:
          orders.length,

        summary,

        orders,

        admin: {
          id:
            String(
              admin._id
            ),

          name:
            admin.name,

          email:
            admin.email,

          role:
            admin.role,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "ADMIN ORDERS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof
          Error
            ? error.message
            : "Unable to load orders.",
      },
      {
        status: 500,
      }
    );
  }
}