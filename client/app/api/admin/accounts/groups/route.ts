import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/connectDB";
import AccountGroup from "@/models/AccountGroup";
import { verifyAdminToken } from "@/lib/adminAuth";


const allowedRoles = [
  "super_admin",
  "finance_manager",
] as const;



async function hasPermission(
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





type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "INCOME"
  | "EXPENSE"
  | "EQUITY";




type CreateGroupBody = {

  name: string;

  code: string;

  type: AccountType;

  parent?: string | null;

  description?: string;

};






export async function POST(
  request: NextRequest
) {


  try {


    const permission =
      await hasPermission(
        request
      );



    if (
      !permission.success ||
      !permission.adminId
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




    const body:
      CreateGroupBody =
      await request.json();




    const {
      name,
      code,
      type,
      parent,
      description,

    } = body;





    const cleanName =
      name?.trim();



    const cleanCode =
      code
        ?.trim()
        .toUpperCase();





    if (!cleanName) {

      return NextResponse.json(
        {
          success:false,

          message:
            "Group name is required.",
        },
        {
          status:400,
        }
      );

    }





    if (!cleanCode) {

      return NextResponse.json(
        {
          success:false,

          message:
            "Group code is required.",
        },
        {
          status:400,
        }
      );

    }





    const validTypes:
      AccountType[] =
      [
        "ASSET",
        "LIABILITY",
        "INCOME",
        "EXPENSE",
        "EQUITY",
      ];



    if (
      !validTypes.includes(
        type
      )
    ) {

      return NextResponse.json(
        {
          success:false,

          message:
            "Invalid account type.",
        },
        {
          status:400,
        }
      );

    }
        // ==============================
    // Duplicate Name Check
    // ==============================


    const existingName =
      await AccountGroup.findOne({

        name: cleanName,

        isDeleted: false,

      });



    if (existingName) {

      return NextResponse.json(
        {
          success:false,

          message:
            "Account group name already exists.",
        },
        {
          status:409,
        }
      );

    }





    // ==============================
    // Duplicate Code Check
    // ==============================


    const existingCode =
      await AccountGroup.findOne({

        code: cleanCode,

        isDeleted:false,

      });



    if (existingCode) {

      return NextResponse.json(
        {
          success:false,

          message:
            "Account group code already exists.",
        },
        {
          status:409,
        }
      );

    }





    // ==============================
    // Parent Group Validation
    // ==============================


    let parentId:
      mongoose.Types.ObjectId | null =
      null;



    let level = 0;




    if (parent) {


      if (
        !mongoose.Types.ObjectId.isValid(
          parent
        )
      ) {

        return NextResponse.json(
          {
            success:false,

            message:
              "Invalid parent group.",
          },
          {
            status:400,
          }
        );

      }





      const parentGroup =
        await AccountGroup.findOne({

          _id: parent,

          isDeleted:false,

        });





      if (!parentGroup) {


        return NextResponse.json(
          {
            success:false,

            message:
              "Parent group not found.",
          },
          {
            status:404,
          }
        );


      }





      parentId =
        parentGroup._id;



      level =
        (parentGroup.level || 0) + 1;


    }






    // ==============================
    // Create Account Group
    // ==============================


    const adminObjectId =
      new mongoose.Types.ObjectId(
        permission.adminId
      );





    const group =
      await AccountGroup.create({

        name:
          cleanName,


        code:
          cleanCode,


        type,


        parent:
          parentId,



        level,



        description:
          description?.trim() || "",



        isSystem:
          false,



        isActive:
          true,



        isDeleted:
          false,



        createdBy:
          adminObjectId,



        updatedBy:
          adminObjectId,

      });
          return NextResponse.json(
      {
        success:true,

        message:
          "Account group created successfully.",


        data: {

          _id:
            group._id,

          name:
            group.name,

          code:
            group.code,

          type:
            group.type,

          parent:
            group.parent,

          level:
            group.level,

          description:
            group.description,

          isSystem:
            group.isSystem,

          isActive:
            group.isActive,

          createdAt:
            group.createdAt,

          updatedAt:
            group.updatedAt,

        },

      },
      {
        status:201,
      }
    );



  } catch(error) {


    console.error(
      "CREATE_ACCOUNT_GROUP_ERROR:",
      error
    );


    return NextResponse.json(
      {
        success:false,

        message:
          "Unable to create account group.",
      },
      {
        status:500,
      }
    );


  }

}





// ======================================
// GET ACCOUNT GROUPS
// ======================================


export async function GET(
  request: NextRequest
) {


  try {


    const permission =
      await hasPermission(
        request
      );



    if (
      !permission.success
    ) {


      return NextResponse.json(
        {
          success:false,

          message:
            "Permission denied.",
        },
        {
          status:403,
        }
      );


    }





    await connectDB();





    const {searchParams} =
      new URL(
        request.url
      );





    const page =
      Math.max(
        Number(
          searchParams.get("page")
        ) || 1,

        1
      );





    const limit =
      Math.min(

        Math.max(

          Number(
            searchParams.get("limit")
          ) || 20,

          1

        ),

        100

      );





    const search =
      searchParams
        .get("search")
        ?.trim() || "";





    const type =
      searchParams
        .get("type")
        ?.trim()
        ?.toUpperCase() || "";





    const filter:any = {

      isDeleted:false,

    };





    if(search){


      const regex =
        new RegExp(
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );



      filter.$or = [

        {
          name:regex,
        },

        {
          code:regex,
        },

      ];

    }
        if (
      [
        "ASSET",
        "LIABILITY",
        "INCOME",
        "EXPENSE",
        "EQUITY",
      ].includes(
        type as AccountType
      )
    ) {

      filter.type =
        type;

    }





    const totalGroups =
      await AccountGroup.countDocuments(
        filter
      );





    const groups =
      await AccountGroup.find(
        filter
      )

        .populate(
          "parent",
          "name code type"
        )

        .sort({

          type:1,

          level:1,

          name:1,

        })

        .skip(
          (page - 1) * limit
        )

        .limit(
          limit
        )

        .lean();






    return NextResponse.json(
      {

        success:true,


        // frontend compatibility
        data:
          groups,



        // direct access
        groups,



        pagination: {

          page,

          limit,

          totalGroups,



          totalPages:
            Math.ceil(
              totalGroups / limit
            ),

        },


      },

      {
        status:200,
      }

    );




  } catch(error) {


    console.error(
      "GET_ACCOUNT_GROUPS_ERROR:",
      error
    );



    return NextResponse.json(
      {

        success:false,

        message:
          "Unable to fetch account groups.",

      },

      {
        status:500,
      }

    );


  }

}
