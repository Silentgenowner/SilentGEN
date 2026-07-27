import mongoose, {
  Schema,
  Document,
  models,
  model,
} from "mongoose";



export interface IOrderItem {


  product: mongoose.Types.ObjectId;


  name:string;


  image:string;


  price:number;


  quantity:number;


  size?:string;


  color?:string;


}





export interface IAddress {


  fullName:string;


  mobile:string;


  address:string;


  area:string;


  city:string;


  state:string;


  country:string;


  pincode:string;


  landmark?:string;


}






export interface IDeliveryHistory {


  status:
  |
  "Placed"
  |
  "Confirmed"
  |
  "Packed"
  |
  "Shipped"
  |
  "Out For Delivery"
  |
  "Delivered";


  date:Date;


  note?:string;


}







export interface IReturnRequest {


  reason:string;


  image?:string;


  status:
  |
  "Pending"
  |
  "Approved"
  |
  "Rejected"
  |
  "Completed";


  requestedAt:Date;


}







export interface IExchangeRequest {


  reason:string;


  status:
  |
  "Pending"
  |
  "Approved"
  |
  "Rejected"
  |
  "Completed";


  requestedAt:Date;


}









export interface IOrder extends Document {


user:mongoose.Types.ObjectId;



items:IOrderItem[];



shippingAddress:IAddress;




paymentMethod:
"COD"
|
"ONLINE";





paymentStatus:
"Pending"
|
"Paid"
|
"Failed"
|
"Refunded";






orderStatus:
"Placed"
|
"Confirmed"
|
"Packed"
|
"Shipped"
|
"Out For Delivery"
|
"Delivered"
|
"Cancelled"
|
"Return Requested"
|
"Returned"
|
"Exchange Requested"
|
"Refunded";






deliveryHistory:IDeliveryHistory[];






subtotal:number;


shippingCharge:number;


discount:number;


totalAmount:number;





trackingNumber?:string;


courierPartner?:string;





returnRequest?:IReturnRequest;



exchangeRequest?:IExchangeRequest;





refundStatus:
"None"
|
"Requested"
|
"Processing"
|
"Completed";





deliveredAt?:Date;



createdAt:Date;


updatedAt:Date;



}









const OrderItemSchema =


new Schema<IOrderItem>(


{


product:{


type:Schema.Types.ObjectId,


ref:"Product",


required:true,


},





name:{


type:String,


required:true,


},





image:{


type:String,


default:"",


},





price:{


type:Number,


required:true,


},





quantity:{


type:Number,


required:true,


},





size:String,



color:String,



},


{


_id:false,


}



);









const AddressSchema =


new Schema<IAddress>(


{


fullName:{


type:String,


required:true,


},




mobile:{


type:String,


required:true,


},





address:{


type:String,


required:true,


},





area:{


type:String,


required:true,


},





city:{


type:String,


required:true,


},





state:{


type:String,


required:true,


},





country:{


type:String,


default:"India",


},





pincode:{


type:String,


required:true,


},





landmark:String,



},


{


_id:false,


}



);









const DeliveryHistorySchema =


new Schema<IDeliveryHistory>(


{


status:{


type:String,


required:true,


},





date:{


type:Date,


default:Date.now,


},





note:String,



},


{


_id:false,


}



);









const ReturnRequestSchema =


new Schema<IReturnRequest>(


{


reason:{


type:String,


required:true,


},




image:String,





status:{


type:String,


default:"Pending",


},





requestedAt:{


type:Date,


default:Date.now,


},



},


{


_id:false,


}



);









const ExchangeRequestSchema =


new Schema<IExchangeRequest>(


{


reason:{


type:String,


required:true,


},




status:{


type:String,


default:"Pending",


},





requestedAt:{


type:Date,


default:Date.now,


},



},


{


_id:false,


}



);









const OrderSchema =


new Schema<IOrder>(


{


user:{


type:Schema.Types.ObjectId,


ref:"User",


required:true,


},






items:{


type:[OrderItemSchema],


required:true,


},






shippingAddress:{


type:AddressSchema,


required:true,


},






paymentMethod:{


type:String,


enum:[

"COD",

"ONLINE"

],


default:"COD",


},






paymentStatus:{


type:String,


enum:[

"Pending",

"Paid",

"Failed",

"Refunded"

],


default:"Pending",


},







orderStatus:{


type:String,


enum:[


"Placed",

"Confirmed",

"Packed",

"Shipped",

"Out For Delivery",

"Delivered",

"Cancelled",

"Return Requested",

"Returned",

"Exchange Requested",

"Refunded"


],


default:"Placed",


},







deliveryHistory:{


type:[DeliveryHistorySchema],


default:[],


},






subtotal:{


type:Number,


required:true,


},





shippingCharge:{


type:Number,


default:0,


},





discount:{


type:Number,


default:0,


},





totalAmount:{


type:Number,


required:true,


},







trackingNumber:String,



courierPartner:String,







returnRequest:ReturnRequestSchema,




exchangeRequest:ExchangeRequestSchema,






refundStatus:{


type:String,


enum:[

"None",

"Requested",

"Processing",

"Completed"

],


default:"None",


},






deliveredAt:Date,



},


{


timestamps:true,


}



);








const Order =


models.Order ||


model<IOrder>(


"Order",


OrderSchema


);






export default Order;
