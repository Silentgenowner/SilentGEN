import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import AccountGroup from "@/models/AccountGroup";
import { verifyAdminToken } from "@/lib/adminAuth";


const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;



async function checkPermission(
  request: NextRequest
) {

  const token =
    request.cookies.get(
      "adminToken"
    )?.value;


  if (!token) {

    return {
      success: false,
      adminId: null,
      role: null,
    };

  }


  try {

    const payload =
      await verifyAdminToken(token);


    if (
      !payload.adminId ||
      !payload.role ||
      !allowedRoles.includes(
        payload.role as
        (typeof allowedRoles)[number]
      )
    ) {

      return {
        success: false,
        adminId: null,
        role: null,
      };

    }


    return {
      success: true,
      adminId:
        payload.adminId,
      role:
        payload.role,
    };


  } catch {

    return {
      success: false,
      adminId: null,
      role: null,
    };

  }

}
export async function GET(
  request: NextRequest
) {

  try {

    const permission =
      await checkPermission(request);


    if (!permission.success) {

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



    const { searchParams } =
      new URL(
        request.url
      );


    const search =
      searchParams.get(
        "search"
      ) || "";



    const page =
      Number(
        searchParams.get(
          "page"
        ) || 1
      );


    const limit =
      Number(
        searchParams.get(
          "limit"
        ) || 20
      );


    const skip =
      (page - 1) * limit;



    const query: any = {
      isDeleted: true,
    };



    if (search.trim()) {

      query.$or = [

        {
          name: {
            $regex:
              search,
            $options:
              "i",
          },
        },


        {
          code: {
            $regex:
              search,
            $options:
              "i",
          },
        },

      ];

    }



    const [
      groups,
      total,
    ] = await Promise.all([


      AccountGroup.find(query)
        .populate(
          "parent",
          "name code"
        )
        .populate(
          "deletedBy",
          "name email"
        )
        .sort({
          deletedAt:
            -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),



      AccountGroup.countDocuments(
        query
      ),


    ]);
        return NextResponse.json(
      {
        success: true,

        data: groups,

        pagination: {
          total,

          page,

          limit,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },

      },
      {
        status: 200,
      }
    );


  } catch (error) {


    console.error(
      "GET_TRASH_ACCOUNT_GROUP_ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to fetch deleted account groups.",
      },
      {
        status: 500,
      }
    );

  }

}
