"use client";

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";


type Props = {

  invoiceId:string;

};



export default function DownloadInvoice({

  invoiceId

}:Props){


  async function download(){


    const element =
      document.getElementById("invoice");


    if(!element) return;



    const canvas =
      await html2canvas(element);



    const imgData =
      canvas.toDataURL("image/png");



    const pdf =
      new jsPDF("p","mm","a4");



    const width =
      pdf.internal.pageSize.getWidth();



    const height =
      (canvas.height * width) /
      canvas.width;



    pdf.addImage(

      imgData,

      "PNG",

      0,

      0,

      width,

      height

    );



    pdf.save(

      `Invoice-${invoiceId}.pdf`

    );


  }





  return (

    <button

      onClick={download}

      className="
      bg-black
      text-white
      px-6
      py-3
      rounded-lg
      print:hidden
      "

    >

      Download Invoice PDF

    </button>

  );


}
