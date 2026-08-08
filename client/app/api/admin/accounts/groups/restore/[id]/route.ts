import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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
      };
    }


    return {
      success: true,
      adminId: payload.adminId,
    };


  } catch {

    return {
      success: false,
      adminId: null,
    };

  }
}
export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
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


    if (!permission.adminId) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Admin session invalid.",
        },
        {
          status: 401,
        }
      );

    }


    await connectDB();


    const { id } =
      await context.params;



    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid account group id.",
        },
        {
          status: 400,
        }
      );

    }


    const group =
      await AccountGroup.findOne({
        _id: id,
        isDeleted: true,
      });



    if (!group) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Deleted account group not found.",
        },
        {
          status: 404,
        }
      );

    }
        group.isDeleted = false;

    group.deletedAt = null;

    group.deletedBy = null;


    group.updatedBy =
      new mongoose.Types.ObjectId(
        permission.adminId
      );


    await group.save();



    return NextResponse.json(
      {
        success: true,
        message:
          "Account group restored successfully.",
        data: group,
      },
      {
        status: 200,
      }
    );



  } catch (error) {

    console.error(
      "RESTORE_ACCOUNT_GROUP_ERROR:",
      error
    );


    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to restore account group.",
      },
      {
        status: 500,
      }
    );

  }

}
