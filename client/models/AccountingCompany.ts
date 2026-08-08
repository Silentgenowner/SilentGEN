import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";


export interface IAccountingCompany
  extends Document {

  companyName: string;

  gstNumber: string;

  panNumber?: string;

  phone?: string;

  email?: string;

  address?: string;

  state: string;

  stateCode: string;


  cgstRate: number;

  sgstRate: number;

  igstRate: number;


  isActive: boolean;


  createdAt: Date;

  updatedAt: Date;

}



const AccountingCompanySchema =
new Schema<IAccountingCompany>(
{

companyName:{
 type:String,
 required:true,
 trim:true,
},


gstNumber:{
 type:String,
 required:true,
 uppercase:true,
 trim:true,
},


panNumber:{
 type:String,
 trim:true,
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


address:{
 type:String,
 trim:true,
},


state:{
 type:String,
 required:true,
 trim:true,
},


stateCode:{
 type:String,
 required:true,
 trim:true,
},



cgstRate:{
 type:Number,
 default:9,
},


sgstRate:{
 type:Number,
 default:9,
},


igstRate:{
 type:Number,
 default:18,
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



const AccountingCompany:
Model<IAccountingCompany> =
mongoose.models.AccountingCompany ||
mongoose.model<IAccountingCompany>(
"AccountingCompany",
AccountingCompanySchema
);



export default AccountingCompany;
