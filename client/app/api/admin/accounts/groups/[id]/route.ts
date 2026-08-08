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
    request.cookies
      .get("adminToken")
      ?.value;



  if (!token) {

    return {

      success:false,

      adminId:null,

      role:null,

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

        success:false,

        adminId:null,

        role:null,

      };

    }



    return {

      success:true,

      adminId:
        payload.adminId,

      role:
        payload.role,

    };


  } catch {


    return {

      success:false,

      adminId:null,

      role:null,

    };

  }

}





type UpdateGroupBody = {

  name?: string;

  code?: string;

  type?:
    | "ASSET"
    | "LIABILITY"
    | "INCOME"
    | "EXPENSE"
    | "EQUITY";

  parent?: string | null;

  description?: string;

  isActive?: boolean;

};





// ======================================
// GET SINGLE ACCOUNT GROUP
// ======================================


export async function GET(

  request: NextRequest,

  context: {
    params: Promise<{
      id:string;
    }>;
  }

) {


  try {


    const permission =
      await hasPermission(
        request
      );



    if(!permission.success){


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





    const {
      id
    } =
    await context.params;





    if(
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ){

      return NextResponse.json(

        {
          success:false,

          message:
            "Invalid account group id.",
        },

        {
          status:400,
        }

      );

    }





    const group =
      await AccountGroup.findOne({

        _id:id,

        isDeleted:false,

      })

       .populate(
        "parent",
        "name code type"
        )

       .lean();


    if(!group){


      return NextResponse.json(

        {
          success:false,

          message:
            "Account group not found.",
        },

        {
          status:404,
        }

      );

    }





    return NextResponse.json(

      {

        success:true,

        group,

      },

      {
        status:200,
      }

    );



  } catch(error){


    console.error(
      "GET_SINGLE_ACCOUNT_GROUP_ERROR:",
      error
    );



    return NextResponse.json(

      {
        success:false,

        message:
          "Unable to fetch account group.",
      },

      {
        status:500,
      }

    );

  }

}
// ======================================
// UPDATE ACCOUNT GROUP
// ======================================


export async function PATCH(

  request: NextRequest,

  context: {
    params: Promise<{
      id:string;
    }>;
  }

) {


  try {


    const permission =
      await hasPermission(
        request
      );



    if(
      !permission.success ||
      !permission.adminId
    ){

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





    const {
      id
    } =
    await context.params;





    if(
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ){

      return NextResponse.json(

        {
          success:false,

          message:
            "Invalid account group id.",
        },

        {
          status:400,
        }

      );

    }





    const group =
      await AccountGroup.findOne({

        _id:id,

        isDeleted:false,

      });





    if(!group){


      return NextResponse.json(

        {
          success:false,

          message:
            "Account group not found.",
        },

        {
          status:404,
        }

      );

    }





    const body:
      UpdateGroupBody =
      await request.json();





    const {

      name,

      code,

      type,

      parent,

      description,

      isActive,

    } = body;





    // ============================
    // Name Update
    // ============================


    if(

      name &&

      name.trim() !== group.name

    ){


      const duplicateName =
        await AccountGroup.findOne({

          _id:{
            $ne:id,
          },


          name:
            name.trim(),


          isDeleted:false,

        });





      if(duplicateName){


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





      group.name =
        name.trim();

    }





    // ============================
    // Code Update
    // ============================


    if(

      code &&

      code.trim()
          .toUpperCase()
          !== group.code

    ){


      const newCode =
        code
        .trim()
        .toUpperCase();





      const duplicateCode =
        await AccountGroup.findOne({

          _id:{
            $ne:id,
          },


          code:newCode,


          isDeleted:false,

        });





      if(duplicateCode){


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





      group.code =
        newCode;

    }





    // ============================
    // Type Update
    // ============================


    if (type) {

  if (
    ![
      "ASSET",
      "LIABILITY",
      "INCOME",
      "EXPENSE",
      "EQUITY",
    ].includes(type)
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid account type.",
      },
      {
        status: 400,
      }
    );
  }

  group.type = type;

}


    // ============================
    // Description Update
    // ============================


    if(
      typeof description === "string"
    ){

      group.description =
        description.trim();

    }





    // ============================
    // Active Status Update
    // ============================


    if(
      typeof isActive === "boolean"
    ){

      group.isActive =
        isActive;

    }
        // ============================
    // Parent Update
    // ============================


    if(
      parent !== undefined
    ){


      // Remove Parent

      if(
        parent === null ||
        parent === ""
      ){

        group.parent =
          null;

        group.level =
          0;

      }

      else {


        if(

          !mongoose.Types.ObjectId.isValid(
            parent
          )

        ){

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





        // Self parent protection

        if(
          parent === id
        ){

          return NextResponse.json(

            {
              success:false,

              message:
                "Parent group cannot be itself.",
            },

            {
              status:400,
            }

          );

        }





        const parentGroup =
          await AccountGroup.findOne({

            _id:parent,

            isDeleted:false,

          });





        if(!parentGroup){


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





        group.parent =
          parentGroup._id;



        group.level =
          (parentGroup.level || 0) + 1;


      }

    }





    // ============================
    // Update Audit
    // ============================


    const adminObjectId =
      new mongoose.Types.ObjectId(
        permission.adminId
      );



    group.updatedBy =
      adminObjectId;





    await group.save();





    return NextResponse.json(

      {

        success:true,


        message:
          "Account group updated successfully.",


        group,

      },

      {
        status:200,
      }

    );





  } catch(error){


    console.error(

      "UPDATE_ACCOUNT_GROUP_ERROR:",

      error

    );



    return NextResponse.json(

      {

        success:false,


        message:
          "Unable to update account group.",

      },

      {
        status:500,
      }

    );

  }

}





// ======================================
// SOFT DELETE ACCOUNT GROUP
// ======================================
export async function DELETE(

  request: NextRequest,

  context: {
    params: Promise<{
      id:string;
    }>;
  }

) {


  try {


    const permission =
      await hasPermission(
        request
      );



    if(
      !permission.success ||
      !permission.adminId
    ){

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





    const {
      id
    } =
    await context.params;





    if(
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ){

      return NextResponse.json(

        {
          success:false,

          message:
            "Invalid account group id.",
        },

        {
          status:400,
        }

      );

    }





    const group =
      await AccountGroup.findOne({

        _id:id,

        isDeleted:false,

      });





    if(!group){


      return NextResponse.json(

        {
          success:false,

          message:
            "Account group not found.",
        },

        {
          status:404,
        }

      );

    }





    // System Group Protection

    if(
      group.isSystem
    ){

      return NextResponse.json(

        {
          success:false,

          message:
            "System account groups cannot be deleted.",
        },

        {
          status:403,
        }

      );

    }





    // Child Group Protection

    const childGroup =
      await AccountGroup.exists({

        parent:id,

        isDeleted:false,

      });





    if(childGroup){


      return NextResponse.json(

        {
          success:false,

          message:
            "Cannot delete group. Remove child groups first.",
        },

        {
          status:400,
        }

      );

    }





    const adminObjectId =
      new mongoose.Types.ObjectId(
        permission.adminId
      );





    group.isDeleted =
      true;



    group.isActive =
      false;



    group.deletedAt =
      new Date();



    group.updatedBy =
      adminObjectId;



    // only if model has deletedBy

    if(
      "deletedBy" in group
    ){

      group.deletedBy =
        adminObjectId;

    }





    await group.save();





    return NextResponse.json(

      {

        success:true,


        message:
          "Account group moved to trash successfully.",

      },

      {
        status:200,
      }

    );





  } catch(error){


    console.error(

      "DELETE_ACCOUNT_GROUP_ERROR:",

      error

    );



    return NextResponse.json(

      {

        success:false,


        message:
          "Unable to delete account group.",

      },

      {
        status:500,
      }

    );

  }

}