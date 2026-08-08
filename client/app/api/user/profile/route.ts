import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyToken } from "@/lib/jwt";
import User from "@/models/User";





// ======================
// GET PROFILE
// ======================

export async function GET(
req:NextRequest
){

try{


await connectDB();




const token =
req.cookies.get("token")?.value;




if(!token){


return NextResponse.json(

{

success:false,

message:"Please login first"

},

{

status:401

}

);

}






let decoded:any;



try{


decoded = verifyToken(token);


}
catch{


return NextResponse.json(

{

success:false,

message:"Invalid token"

},

{

status:401

}

);


}





const userId =
decoded.id ||
decoded.userId;





const user =
await User.findById(userId)
.select("-password");






if(!user){


return NextResponse.json(

{

success:false,

message:"User not found"

},

{

status:404

}

);


}







return NextResponse.json(

{

success:true,

user

}

);


}
catch(error:any){



console.log(
"PROFILE GET ERROR:",
error
);



return NextResponse.json(

{

success:false,

message:
error.message ||
"Something went wrong"

},

{

status:500

}

);


}


}









// ======================
// UPDATE PROFILE
// ======================

export async function PUT(
req:NextRequest
){

try{


await connectDB();





const token =
req.cookies.get("token")?.value;





if(!token){


return NextResponse.json(

{

success:false,

message:"Please login first"

},

{

status:401

}

);


}







let decoded:any;



try{


decoded = verifyToken(token);


}
catch{


return NextResponse.json(

{

success:false,

message:"Invalid token"

},

{

status:401

}

);


}






const userId =
decoded.id ||
decoded.userId;






const body =
await req.json();





const {

name,

email,

mobile

}=body;






if(!name || !mobile){


return NextResponse.json(

{

success:false,

message:"Name and mobile are required"

},

{

status:400

}

);


}







// check duplicate mobile


const existingUser =
await User.findOne({

mobile,

_id:{
$ne:userId
}

});





if(existingUser){


return NextResponse.json(

{

success:false,

message:"Mobile number already registered"

},

{

status:400

}

);


}








// check duplicate email

if(email){


const existingEmail =
await User.findOne({

email,

_id:{
$ne:userId
}

});



if(existingEmail){


return NextResponse.json(

{

success:false,

message:"Email already registered"

},

{

status:400

}

);


}


}









const user =
await User.findByIdAndUpdate(

userId,

{

name,

email,

mobile,

isProfileCompleted:true

},

{

new:true

}

)

.select("-password");








return NextResponse.json(

{

success:true,

message:"Profile updated successfully",

user

}

);



}
catch(error:any){


console.log(

"PROFILE UPDATE ERROR:",

error

);





return NextResponse.json(

{

success:false,

message:
error.message ||
"Something went wrong"

},

{

status:500

}

);



}


}
