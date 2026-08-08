import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type GSTEntryType =
  | "sale"
  | "purchase"
  | "expense";


export interface IGST
extends Document {


  entryNumber: string;


  entryType: GSTEntryType;


  date: Date;



  referenceId?: mongoose.Types.ObjectId;



  referenceModel?: 
    | "Invoice"
    | "Purchase"
    | "Expense";



  taxableAmount: number;



  gstRate: number;



  cgst: number;



  sgst: number;



  igst: number;



  totalGST: number;



  createdBy?: mongoose.Types.ObjectId;



  createdAt: Date;


  updatedAt: Date;

}





const GSTSchema =
new Schema<IGST>(
{

entryNumber:{
 type:String,
 required:true,
 unique:true,
 trim:true,
},




entryType:{
 type:String,

 enum:[
 "sale",
 "purchase",
 "expense",
 ],

 required:true,

},




date:{
 type:Date,
 default:Date.now,
},




referenceId:{
 type:Schema.Types.ObjectId,
},




referenceModel:{
 type:String,

 enum:[
 "Invoice",
 "Purchase",
 "Expense",
 ],

},




taxableAmount:{
 type:Number,
 default:0,
},




gstRate:{
 type:Number,
 default:18,
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




totalGST:{
 type:Number,
 default:0,
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





const GST:
Model<IGST> =
mongoose.models.GST ||
mongoose.model<IGST>(
"GST",
GSTSchema
);



export default GST;
