import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import connectDB from "@/lib/connectDB";

import Address from "@/models/Address";


const JWT_SECRET =
process.env.JWT_SECRET!;



function getUserId(req: NextRequest){


  const token =
  req.cookies.get("token")?.value;



  if(!token){

    return null;

  }



  try{


    const decoded:any =
    jwt.verify(
      token,
      JWT_SECRET
    );


    return decoded.id || decoded.userId;


  }
  catch{


    return null;


  }


}







// ============================
// GET ALL ADDRESS
// ============================

export async function GET(
req:NextRequest
){


try{


await connectDB();



const userId =
getUserId(req);



if(!userId){

return NextResponse.json(
{
success:false,
message:"Unauthorized"
},
{
status:401
}
);

}




const addresses =
await Address.find({

userId

})
.sort({

createdAt:-1

});





return NextResponse.json({

success:true,

addresses

});




}
catch(error:any){


console.log(
"GET ADDRESS ERROR",
error
);



return NextResponse.json({

success:false,

message:error.message

},
{
status:500
}
);



}


}









// ============================
// CREATE ADDRESS
// ============================

export async function POST(
req:NextRequest
){


try{


await connectDB();




const userId =
getUserId(req);



if(!userId){


return NextResponse.json({

success:false,

message:"Unauthorized"

},
{
status:401
});


}




const body =
await req.json();





const address =
await Address.create({



userId,



fullName:
body.fullName,



mobile:
body.mobile,



address:
body.address,



area:
body.area || "",



city:
body.city,



state:
body.state,



country:
body.country || "India",



pincode:
body.pincode,



landmark:
body.landmark || "",



});







return NextResponse.json({

success:true,

address

});






}
catch(error:any){


console.log(
"CREATE ADDRESS ERROR",
error
);



return NextResponse.json({

success:false,

message:error.message ||
"Create Address Failed"

},
{
status:500
});



}


}
