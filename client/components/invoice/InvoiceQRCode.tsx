"use client";


import QRCode from "qrcode";

import { useEffect,useState } from "react";


type Props = {

  orderId:string;

};



export default function InvoiceQRCode({

  orderId

}:Props){


  const [qr,setQr] = useState("");



  useEffect(()=>{


    async function generate(){


      const url = await QRCode.toDataURL(

        orderId

      );


      setQr(url);


    }


    generate();


  },[orderId]);




  return (

    <div>


      {

        qr &&

        <img

          src={qr}

          alt="Order QR Code"

          className="
          w-32
          h-32
          "

        />

      }


    </div>

  );


}
