"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function LoginPage() {


  const router = useRouter();


  const [mobile,setMobile] = useState("");

  const [loading,setLoading] = useState(false);



  const sendOTP = async()=>{


    if(mobile.length !== 10){

      alert(
        "Enter valid mobile number"
      );

      return;

    }



    try{


      setLoading(true);



      const res = await fetch(
        "/api/auth/send-otp",
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            mobile
          })

        }
      );



      const data = await res.json();



      if(data.success){


        localStorage.setItem(
          "mobile",
          mobile
        );


        localStorage.setItem(
          "otp",
          data.otp
        );



        router.push(
          "/verify-otp"
        );


      }
      else{


        alert(
          data.message
        );


      }



    }
    catch(error){


      alert(
        "Server Error"
      );


    }
    finally{


      setLoading(false);


    }



  };



  return (

    <div className="
      min-h-screen
      flex
      items-center
      justify-center
      bg-gray-100
      px-4
    ">


      <div className="
        bg-white
        p-8
        rounded-xl
        shadow-lg
        max-w-md
        w-full
      ">


        <h1 className="
          text-3xl
          font-bold
          text-center
        ">
          Welcome Back
        </h1>


        <p className="
          text-gray-500
          text-center
          mt-2
          mb-8
        ">
          Login with Mobile Number
        </p>



        <input

          type="tel"

          placeholder="Enter Mobile Number"

          value={mobile}

          onChange={(e)=>
            setMobile(e.target.value)
          }

          maxLength={10}

          className="
            w-full
            border
            rounded-lg
            px-4
            py-3
          "

        />



        <button

          onClick={sendOTP}

          disabled={loading}

          className="
            mt-5
            w-full
            bg-black
            text-white
            py-3
            rounded-lg
          "

        >

          {
            loading
            ?
            "Sending OTP..."
            :
            "Send OTP"
          }


        </button>



      </div>


    </div>

  );

}
