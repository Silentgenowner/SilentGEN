import mongoose, {
  Schema,
  models,
  model,
  Document,
} from "mongoose";



export interface IOrderTimeline extends Document {


  order: mongoose.Types.ObjectId;


  status:
    | "Placed"
    | "Confirmed"
    | "Packed"
    | "Shipped"
    | "Out For Delivery"
    | "Delivered"
    | "Cancelled"
    | "Return Requested"
    | "Exchange Requested"
    | "Refund Completed";


  message:string;


  createdAt:Date;


  updatedAt:Date;

}





const OrderTimelineSchema =
new Schema<IOrderTimeline>(

{

order:{

type:Schema.Types.ObjectId,

ref:"Order",

required:true,

},



status:{

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

"Exchange Requested",

"Refund Completed"


],

required:true,

},



message:{

type:String,

required:true,

},


},

{

timestamps:true,

}

);






const OrderTimeline =

models.OrderTimeline ||

model<IOrderTimeline>(

"OrderTimeline",

OrderTimelineSchema

);





export default OrderTimeline;
