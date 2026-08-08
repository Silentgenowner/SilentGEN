import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";


export interface IAccountGroup
  extends Document {

  name:string;

  code:string;


  type:
    | "ASSET"
    | "LIABILITY"
    | "INCOME"
    | "EXPENSE"
    | "EQUITY";



  parent:
    mongoose.Types.ObjectId | null;



  level:number;



  description:string;



  isSystem:boolean;



  isActive:boolean;



  isDeleted:boolean;



  createdBy:
    mongoose.Types.ObjectId;



  updatedBy:
    mongoose.Types.ObjectId;



  deletedBy?:
    mongoose.Types.ObjectId | null;



  deletedAt?:
    Date | null;



  createdAt:Date;

  updatedAt:Date;

}






const AccountGroupSchema =
new Schema<IAccountGroup>(


{


  name:{

    type:String,

    required:true,

    trim:true,

  },



  code:{

    type:String,

    required:true,

    uppercase:true,

    trim:true,

  },



  type:{

    type:String,

    enum:[

      "ASSET",

      "LIABILITY",

      "INCOME",

      "EXPENSE",

      "EQUITY",

    ],

    required:true,

  },





  parent:{

    type:
      Schema.Types.ObjectId,

    ref:
      "AccountGroup",

    default:null,

  },





  level:{

    type:Number,

    default:0,

  },





  description:{

    type:String,

    default:"",

  },





  isSystem:{

    type:Boolean,

    default:false,

  },





  isActive:{

    type:Boolean,

    default:true,

  },





  isDeleted:{

    type:Boolean,

    default:false,

  },





  createdBy:{

    type:
      Schema.Types.ObjectId,

    ref:
      "Admin",

    required:true,

  },





  updatedBy:{

    type:
      Schema.Types.ObjectId,

    ref:
      "Admin",

    required:true,

  },





  deletedBy:{

    type:
      Schema.Types.ObjectId,

    ref:
      "Admin",

    default:null,

  },





  deletedAt:{

    type:Date,

    default:null,

  },


},

{

  timestamps:true,

}

);







// Prevent duplicate model error

const AccountGroup:

Model<IAccountGroup> =
mongoose.models.AccountGroup ||
mongoose.model<IAccountGroup>(
  "AccountGroup",
  AccountGroupSchema
);



export default AccountGroup;