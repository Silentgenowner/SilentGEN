import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import Product from "@/models/Product";
import { verifyAdminToken } from "@/lib/adminAuth";

const allowedRoles = [
  "super_admin",
  "product_manager",
] as const;

async function hasPermission(request: NextRequest) {
  const token =
    request.cookies.get("adminToken")?.value;

  if (!token) {
    return false;
  }

  try {
    const payload =
      await verifyAdminToken(token);

    return Boolean(
      payload.adminId &&
        payload.role &&
        allowedRoles.includes(
          payload.role as (typeof allowedRoles)[number]
        )
    );
  } catch {
    return false;
  }
}
export async function GET(request: NextRequest) {
  try {
    const permitted = await hasPermission(request);

    if (!permitted) {
      return NextResponse.json(
        {
          success: false,
          message: "Permission denied.",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 10,
        1
      ),
      100
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const filter: any = {
      isDeleted: true,
    };

    if (search) {
      const regex = new RegExp(search, "i");

      filter.$or = [
        { name: regex },
        { sku: regex },
        { category: regex },
        { brand: regex },
      ];
    }

   const totalProducts =
   await Product.countDocuments(filter);


   const now = new Date();


   const startOfToday = new Date(
   now.getFullYear(),
   now.getMonth(),
   now.getDate()
   );


   const startOfWeek = new Date(
   startOfToday
   );

   startOfWeek.setDate( 
   startOfWeek.getDate() - startOfWeek.getDay()
   );


   const startOfMonth = new Date(
   now.getFullYear(),
   now.getMonth(),
   1
    );


   const [
   deletedToday,
   deletedThisWeek,
   deletedThisMonth,
   ] = await Promise.all([

   Product.countDocuments({
    isDeleted: true,
    deletedAt: {
      $gte: startOfToday,
    },
   }),


   Product.countDocuments({
     isDeleted: true,
     deletedAt: {
       $gte: startOfWeek,
     },
    }),


     Product.countDocuments({
     isDeleted: true,
     deletedAt: {
      $gte: startOfMonth,
     },
     }),

     ]);


    const products = await Product.find(filter)
     .sort({
     deletedAt: -1,
     updatedAt: -1,
     })
     .skip((page - 1) * limit)
     .limit(limit)
     .lean();

return NextResponse.json(
{
  success:true,

  stats:{
    totalDeleted: await Product.countDocuments({
      isDeleted:true,
    }),

    deletedToday: await Product.countDocuments({
      isDeleted:true,
      deletedAt:{
        $gte:new Date(
          new Date().setHours(
            0,0,0,0
          )
        ),
      },
    }),

    deletedThisWeek: await Product.countDocuments({
      isDeleted:true,
      deletedAt:{
        $gte:new Date(
          Date.now() -
          7 * 24 * 60 * 60 * 1000
        ),
      },
    }),

    deletedThisMonth: await Product.countDocuments({
      isDeleted:true,
      deletedAt:{
        $gte:new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ),
      },
    }),
  },


  products,


  pagination:{
    page,
    limit,
    totalProducts,
    totalPages:Math.ceil(
      totalProducts / limit
    ),
  },
},
{
 status:200
}
);

  } catch (error) {
    console.error(
      "GET TRASH PRODUCTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to fetch deleted products.",
      },
      {
        status: 500,
      }
    );
  }
}
