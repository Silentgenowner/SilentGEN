import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export type InvoiceStatus =
  | "unpaid"
  | "partial"
  | "paid";


export interface IInvoiceItem {

  productId: mongoose.Types.ObjectId;

  name: string;

  quantity: number;

  price: number;

  discount: number;

  taxableAmount: number;

  gstRate: number;

  cgst: number;

  sgst: number;

  igst: number;

  total: number;

}



export interface IInvoice
  extends Document {


  invoiceNumber: string;


  invoiceDate: Date;



  customerId: mongoose.Types.ObjectId;



  customerName: string;


  customerPhone?: string;


  customerGST?: string;


  customerAddress?: string;



  items: IInvoiceItem[];



  subtotal: number;


  discountTotal: number;



  taxableAmount: number;



  cgstTotal: number;


  sgstTotal: number;


  igstTotal: number;



  grandTotal: number;



  paidAmount: number;



  dueAmount: number;



  paymentStatus: InvoiceStatus;



  orderId?: mongoose.Types.ObjectId;



  createdBy?: mongoose.Types.ObjectId;



  createdAt: Date;


  updatedAt: Date;

}




const InvoiceItemSchema =
new Schema<IInvoiceItem>(
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


price:{
 type:Number,
 required:true,
},


discount:{
 type:Number,
 default:0,
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





const InvoiceSchema =
new Schema<IInvoice>(
{

invoiceNumber:{
 type:String,
 required:true,
 unique:true,
 trim:true,
},



invoiceDate:{
 type:Date,
 default:Date.now,
},



customerId:{
 type:Schema.Types.ObjectId,
 ref:"User",
 required:true,
},



customerName:{
 type:String,
 required:true,
},



customerPhone:{
 type:String,
},



customerGST:{
 type:String,
 uppercase:true,
},



customerAddress:{
 type:String,
},




items:{
 type:[InvoiceItemSchema],
 required:true,
},



subtotal:{
 type:Number,
 default:0,
},



discountTotal:{
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



orderId:{
 type:Schema.Types.ObjectId,
 ref:"Order",
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



const Invoice:
Model<IInvoice> =
mongoose.models.Invoice ||
mongoose.model<IInvoice>(
"Invoice",
InvoiceSchema
);



export default Invoice;