import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connectDB";
import { verifyAdminToken } from "@/lib/adminAuth";

import Order from "@/models/Order";
import Invoice from "@/models/Invoice";
import Purchase from "@/models/Purchase";
import Transaction from "@/models/Transaction";
import Ledger from "@/models/Ledger";



export async function GET(
  request: NextRequest
) {

  try {


    const token =
      request.cookies.get("adminToken")?.value;



    if(!token){

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



    await verifyAdminToken(token);



    await connectDB();




    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );



    const tomorrow =
      new Date(today);



    tomorrow.setDate(
      tomorrow.getDate()+1
    );







    // ============================
    // TODAY SALES
    // ============================


    const todayInvoices =
      await Invoice.find({

        invoiceDate:{
          $gte:today,
          $lt:tomorrow
        }

      });



    const invoiceSales =
      todayInvoices.reduce(
        (
          total,
          invoice
        ) =>
          total +
          (
            invoice.grandTotal || 0
          ),
        0
      );






    const todayOrders =
      await Order.find({

        createdAt:{
          $gte:today,
          $lt:tomorrow
        },

        paymentStatus:"Paid"

      });




    const orderSales =
      todayOrders.reduce(
        (
          total,
          order
        ) =>
          total +
          (
            order.totalAmount || 0
          ),
        0
      );





    const todaySales =
      invoiceSales +
      orderSales;







    // ============================
    // PURCHASE
    // ============================


    const purchases =
      await Purchase.find({

        purchaseDate:{
          $gte:today,
          $lt:tomorrow
        }

      });




    const todayPurchase =
      purchases.reduce(
        (
          total,
          purchase
        ) =>
          total +
          (
            purchase.grandTotal || 0
          ),
        0
      );









    // ============================
    // EXPENSE
    // ============================


    const expenses =
      await Transaction.find({

        transactionType:"expense",

        date:{
          $gte:today,
          $lt:tomorrow
        }

      });




    const todayExpense =
      expenses.reduce(
        (
          total,
          expense
        ) =>
          total +
          (
            expense.totalAmount || 0
          ),
        0
      );









    // ============================
    // CASH
    // ============================


    const cashLedger =
      await Ledger.findOne({

        ledgerType:"cash"

      });



    const cashBalance =
      cashLedger?.currentBalance || 0;







    // ============================
    // BANK
    // ============================


    const bankLedger =
      await Ledger.findOne({

        ledgerType:"bank"

      });



    const bankBalance =
      bankLedger?.currentBalance || 0;









    // ============================
    // RECEIVABLE
    // ============================


    const receivableData =
      await Ledger.aggregate([

        {
          $match:{
            ledgerType:"customer",
            balanceType:"debit"
          }
        },


        {
          $group:{
            _id:null,
            total:{
              $sum:"$currentBalance"
            }
          }
        }


      ]);



    const receivable =
      receivableData[0]?.total || 0;









    // ============================
    // PAYABLE
    // ============================


    const payableData =
      await Ledger.aggregate([

        {
          $match:{
            ledgerType:"supplier",
            balanceType:"credit"
          }
        },


        {
          $group:{
            _id:null,
            total:{
              $sum:"$currentBalance"
            }
          }
        }


      ]);



    const payable =
      payableData[0]?.total || 0;









    // ============================
    // GST
    // ============================


    const gstOutput =
      await Ledger.findOne({

        ledgerType:"gst_output"

      });



    const gstInput =
      await Ledger.findOne({

        ledgerType:"gst_input"

      });





    const gstPayable =
      gstOutput?.currentBalance || 0;



    const gstReceivable =
      gstInput?.currentBalance || 0;









    return NextResponse.json({

      success:true,


      stats:{


        todaySales,


        todayPurchase,


        todayExpense,



        cashBalance,


        bankBalance,



        receivable,


        payable,



        gstPayable,


        gstReceivable


      }


    });





  }

  catch(error){


    console.error(
      "ACCOUNT DASHBOARD ERROR:",
      error
    );


    return NextResponse.json(

      {
        success:false,
        message:"Unable to load dashboard"
      },

      {
        status:500
      }

    );


  }


}