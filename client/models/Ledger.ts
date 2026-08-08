import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type LedgerType =
  | "customer"
  | "supplier"
  | "sales"
  | "purchase"
  | "expense"
  | "gst_input"
  | "gst_output"
  | "cash"
  | "bank"
  | "other";


export interface ILedger extends Document {

  name: string;

  ledgerType: LedgerType;


  phone?: string;

  email?: string;


  gstNumber?: string;


  address?: string;


  openingBalance: number;


  balanceType:
    | "debit"
    | "credit";


  currentBalance: number;


  isActive: boolean;


  createdAt: Date;

  updatedAt: Date;

}



const LedgerSchema =
new Schema<ILedger>(
{

name:{
 type:String,
 required:true,
 trim:true,
},



ledgerType:{
 type:String,
 required:true,

 enum:[
 "customer",
 "supplier",
 "sales",
 "purchase",
 "expense",
 "gst_input",
 "gst_output",
 "cash",
 "bank",
 "other",
 ],

},



phone:{
 type:String,
 trim:true,
},


email:{
 type:String,
 trim:true,
 lowercase:true,
},



gstNumber:{
 type:String,
 trim:true,
 uppercase:true,
},



address:{
 type:String,
 trim:true,
},



openingBalance:{
 type:Number,
 default:0,
},



balanceType:{
 type:String,

 enum:[
 "debit",
 "credit",
 ],

 default:"debit",

},



currentBalance:{
 type:Number,
 default:0,
},



isActive:{
 type:Boolean,
 default:true,
},



},
{
 timestamps:true,
}

);



const Ledger:
Model<ILedger> =
mongoose.models.Ledger ||
mongoose.model<ILedger>(
"Ledger",
LedgerSchema
);



export default Ledger;