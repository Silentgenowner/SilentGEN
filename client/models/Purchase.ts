import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type PurchaseStatus =
  | "unpaid"
  | "partial"
  | "paid";



export interface IPurchaseItem {


  productId: mongoose.Types.ObjectId;


  name: string;


  quantity: number;


  purchasePrice: number;


  taxableAmount: number;


  gstRate: number;


  cgst: number;


  sgst: number;


  igst: number;


  total: number;

}




export interface IPurchase
extends Document {


  purchaseNumber: string;


  purchaseDate: Date;



  supplierId: mongoose.Types.ObjectId;



  supplierName: string;



  supplierGST?: string;



  supplierPhone?: string;



  supplierAddress?: string;




  items: IPurchaseItem[];



  subtotal: number;



  taxableAmount: number;



  cgstTotal: number;



  sgstTotal: number;



  igstTotal: number;



  grandTotal: number;



  paidAmount: number;



  dueAmount: number;



  paymentStatus: PurchaseStatus;



  invoiceNumber?: string;



  createdBy?: mongoose.Types.ObjectId;



  createdAt: Date;


  updatedAt: Date;

}





const PurchaseItemSchema =
new Schema<IPurchaseItem>(
{

productId:{
 type:Schema.Types.ObjectId,
 ref:"Product",
 required:true,
},



name:{
 type:String,
 required:true,
},



quantity:{
 type:Number,
 required:true,
},



purchasePrice:{
 type:Number,
 required:true,
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



total:{
 type:Number,
 default:0,
},


},
{
 _id:false,
}
);







const PurchaseSchema =
new Schema<IPurchase>(
{

purchaseNumber:{
 type:String,
 required:true,
 unique:true,
 trim:true,
},



purchaseDate:{
 type:Date,
 default:Date.now,
},




supplierId:{
 type:Schema.Types.ObjectId,
 ref:"Supplier",
 required:true,
},



supplierName:{
 type:String,
 required:true,
},



supplierGST:{
 type:String,
 uppercase:true,
},



supplierPhone:{
 type:String,
},



supplierAddress:{
 type:String,
},




items:{
 type:[PurchaseItemSchema],
 required:true,
},




subtotal:{
 type:Number,
 default:0,
},




taxableAmount:{
 type:Number,
 default:0,
},




cgstTotal:{
 type:Number,
 default:0,
},




sgstTotal:{
 type:Number,
 default:0,
},




igstTotal:{
 type:Number,
 default:0,
},




grandTotal:{
 type:Number,
 default:0,
},




paidAmount:{
 type:Number,
 default:0,
},




dueAmount:{
 type:Number,
 default:0,
},




paymentStatus:{
 type:String,

 enum:[
 "unpaid",
 "partial",
 "paid",
 ],

 default:"unpaid",

},




invoiceNumber:{
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





const Purchase:
Model<IPurchase> =
mongoose.models.Purchase ||
mongoose.model<IPurchase>(
"Purchase",
PurchaseSchema
);



export default Purchase;
