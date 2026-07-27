import mongoose, {
  Schema,
  Model,
} from "mongoose";


export interface IAddress {

  userId: mongoose.Types.ObjectId;

  fullName:string;

  mobile:string;

  address:string;

  area:string;

  city:string;

  state:string;

  country:string;

  pincode:string;

  landmark?:string;

  isDefault?:boolean;

  createdAt?:Date;

  updatedAt?:Date;

}



const AddressSchema =
new Schema<IAddress>(

{

userId:{


type:Schema.Types.ObjectId,

ref:"User",

required:true,


},



fullName:{


type:String,

required:true,

trim:true,


},



mobile:{


type:String,

required:true,

trim:true,


},




address:{


type:String,

required:true,

trim:true,


},




area:{


type:String,

required:true,

trim:true,


},




city:{


type:String,

required:true,

trim:true,


},




state:{


type:String,

required:true,

trim:true,


},




country:{


type:String,

default:"India",


},




pincode:{


type:String,

required:true,


},




landmark:{


type:String,

default:"",


},




isDefault:{


type:Boolean,

default:false,


},



},

{
timestamps:true
}

);



const Address:Model<IAddress> =

mongoose.models.Address ||

mongoose.model<IAddress>(
"Address",
AddressSchema
);



export default Address;
