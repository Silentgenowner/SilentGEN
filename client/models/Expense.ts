import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type ExpenseCategory =
  | "rent"
  | "salary"
  | "courier"
  | "marketing"
  | "packaging"
  | "electricity"
  | "software"
  | "transport"
  | "other";


export interface IExpense
extends Document {


  expenseNumber: string;


  date: Date;



  category: ExpenseCategory;



  title: string;



  description?: string;



  vendorName?: string;



  vendorGST?: string;



  amount: number;



  gstRate: number;



  cgst: number;



  sgst: number;



  igst: number;



  totalAmount: number;



  paymentMode:
    | "cash"
    | "bank"
    | "online"
    | "credit";



  ledgerId?: mongoose.Types.ObjectId;



  referenceId?: string;



  createdBy?: mongoose.Types.ObjectId;



  createdAt: Date;


  updatedAt: Date;

}




const ExpenseSchema =
new Schema<IExpense>(
{

expenseNumber:{
 type:String,
 required:true,
 unique:true,
 trim:true,
},



date:{
 type:Date,
 default:Date.now,
},




category:{
 type:String,

 enum:[
 "rent",
 "salary",
 "courier",
 "marketing",
 "packaging",
 "electricity",
 "software",
 "transport",
 "other",
 ],

 required:true,

},




title:{
 type:String,
 required:true,
 trim:true,
},




description:{
 type:String,
 trim:true,
},




vendorName:{
 type:String,
 trim:true,
},




vendorGST:{
 type:String,
 uppercase:true,
 trim:true,
},




amount:{
 type:Number,
 required:true,
 default:0,
},




gstRate:{
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




ledgerId:{
 type:Schema.Types.ObjectId,
 ref:"Ledger",
},




referenceId:{
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





const Expense:
Model<IExpense> =
mongoose.models.Expense ||
mongoose.model<IExpense>(
"Expense",
ExpenseSchema
);



export default Expense;
