import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type TransactionType =
  | "sale"
  | "purchase"
  | "payment"
  | "receipt"
  | "expense"
  | "journal";


export interface ITransaction
  extends Document {


  transactionNumber: string;


  transactionType: TransactionType;


  date: Date;


  ledgerId: mongoose.Types.ObjectId;



  amount: number;



  taxAmount: number;



  cgst: number;


  sgst: number;


  igst: number;



  totalAmount: number;



  paymentMode:
    | "cash"
    | "bank"
    | "online"
    | "credit";



  referenceId?: string;



  description?: string;



  createdBy?: mongoose.Types.ObjectId;



  createdAt: Date;


  updatedAt: Date;

}




const TransactionSchema =
new Schema<ITransaction>(
{

transactionNumber:{
 type:String,
 required:true,
 unique:true,
 trim:true,
},



transactionType:{
 type:String,

 enum:[
 "sale",
 "purchase",
 "payment",
 "receipt",
 "expense",
 "journal",
 ],

 required:true,

},



date:{
 type:Date,
 default:Date.now,
},



ledgerId:{
 type:Schema.Types.ObjectId,
 ref:"Ledger",
 required:true,
},



amount:{
 type:Number,
 required:true,
 default:0,
},



taxAmount:{
 type:Number,
 default:0,
},



cgst:{
 type:Number,
 default:0,
},



sgst:{
 type:Number,
 default:0,
},



igst:{
 type:Number,
 default:0,
},



totalAmount:{
 type:Number,
 required:true,
 default:0,
},



paymentMode:{
 type:String,

 enum:[
 "cash",
 "bank",
 "online",
 "credit",
 ],

 default:"cash",

},



referenceId:{
 type:String,
 trim:true,
},



description:{
 type:String,
 trim:true,
},



createdBy:{
 type:Schema.Types.ObjectId,
 ref:"Admin",
},


},
{
 timestamps:true,
}

);



const Transaction:
Model<ITransaction> =
mongoose.models.Transaction ||
mongoose.model<ITransaction>(
"Transaction",
TransactionSchema
);



export default Transaction;
