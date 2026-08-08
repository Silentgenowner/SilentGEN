"use client";


import QRCode from "qrcode";

import { useEffect, useState } from "react";



type Props = {

  orderId:string;

};



export default function ShippingQRCode({

  orderId

}:Props){


  const [qr,setQr] = useState("");



  useEffect(()=>{


    async function generateQR(){


      const data =

      `SilentGEN Shipping Bill
Order ID: ${orderId}`;



      const result =

        await QRCode.toDataURL(

          data

        );



      setQr(result);


    }



    generateQR();



  },[orderId]);




  return (

    <div className="mt-6">


      <h2 className="font-bold mb-3">

        Shipping Verification QR

      </h2>



      {

        qr &&

        <img

          src={qr}

          alt="Shipping QR Code"

          className="
          w-32
          h-32
          "

        />

      }



    </div>

  );


}
