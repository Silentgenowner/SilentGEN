import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface ISettings
  extends Document {
  /*
  |--------------------------------------------------------------------------
  | STORE
  |--------------------------------------------------------------------------
  */

  storeName: string;

  storeLogo: string;

  currency: string;

  gstNumber: string;

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  supportEmail: string;

  contactEmail: string;

  orderEmail: string;

  returnRefundEmail: string;

  /*
  |--------------------------------------------------------------------------
  | PHONE
  |--------------------------------------------------------------------------
  */

  supportMobile: string;

  customerCareNumber: string;

  productQueryNumber: string;

  deliveryQueryNumber: string;

  paymentRefundNumber: string;

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP
  |--------------------------------------------------------------------------
  */

  whatsappNumber: string;

  whatsappMessage: string;

  /*
  |--------------------------------------------------------------------------
  | BUSINESS
  |--------------------------------------------------------------------------
  */

  businessAddress: string;

  legalBusinessName: string;

  supportHours: string;

  /*
  |--------------------------------------------------------------------------
  | SOCIAL
  |--------------------------------------------------------------------------
  */

  instagramUrl: string;

  facebookUrl: string;

  youtubeUrl: string;

  /*
  |--------------------------------------------------------------------------
  | SHIPPING
  |--------------------------------------------------------------------------
  */

  shippingCharge: number;

  freeShippingMinimum: number;

  /*
  |--------------------------------------------------------------------------
  | PAYMENT
  |--------------------------------------------------------------------------
  */

  codEnabled: boolean;

  onlinePaymentEnabled: boolean;

  /*
  |--------------------------------------------------------------------------
  | RETURN / EXCHANGE
  |--------------------------------------------------------------------------
  */

  returnDays: number;

  exchangeDays: number;

  /*
  |--------------------------------------------------------------------------
  | INVENTORY
  |--------------------------------------------------------------------------
  */

  lowStockLimit: number;

  /*
  |--------------------------------------------------------------------------
  | SEO
  |--------------------------------------------------------------------------
  */

  defaultSeoTitle: string;

  defaultSeoDescription: string;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  maintenanceMode: boolean;

  createdAt: Date;

  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const SettingsSchema =
  new Schema<ISettings>(
    {
      storeName: {
        type: String,
        trim: true,
        default: "SilentGEN",
      },

      storeLogo: {
        type: String,
        trim: true,
        default: "",
      },

      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: "INR",
      },

      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | EMAIL
      |--------------------------------------------------------------------------
      */

      supportEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default:
          "silentgenofficial@gmail.com",
      },

      contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default:
          "silentgenofficial@gmail.com",
      },

      orderEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default:
          "silentgenofficial@gmail.com",
      },

      returnRefundEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default:
          "silentgenofficial@gmail.com",
      },

      /*
      |--------------------------------------------------------------------------
      | PHONE
      |--------------------------------------------------------------------------
      */

      supportMobile: {
        type: String,
        trim: true,
        default: "",
      },

      customerCareNumber: {
        type: String,
        trim: true,
        default: "",
      },

      productQueryNumber: {
        type: String,
        trim: true,
        default:
          "+919998665658",
      },

      deliveryQueryNumber: {
        type: String,
        trim: true,
        default:
          "+919998765658",
      },

      paymentRefundNumber: {
        type: String,
        trim: true,
        default:
          "+919998665652",
      },

      /*
      |--------------------------------------------------------------------------
      | WHATSAPP
      |--------------------------------------------------------------------------
      */

      whatsappNumber: {
        type: String,
        trim: true,
        default: "",
      },

      whatsappMessage: {
        type: String,
        trim: true,
        default:
          "Hello SilentGEN, I need help.",
      },

      /*
      |--------------------------------------------------------------------------
      | BUSINESS
      |--------------------------------------------------------------------------
      */

      businessAddress: {
        type: String,
        trim: true,
        default: "",
      },

      legalBusinessName: {
        type: String,
        trim: true,
        default: "",
      },

      supportHours: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | SOCIAL
      |--------------------------------------------------------------------------
      */

      instagramUrl: {
        type: String,
        trim: true,
        default:
          "https://www.instagram.com/silentgenofficial/",
      },

      facebookUrl: {
        type: String,
        trim: true,
        default:
          "https://www.facebook.com/share/1AiwV1MKfb/",
      },

      youtubeUrl: {
        type: String,
        trim: true,
        default:
          "https://www.youtube.com/@SilentGEN-org",
      },

      /*
      |--------------------------------------------------------------------------
      | SHIPPING
      |--------------------------------------------------------------------------
      */

      shippingCharge: {
        type: Number,
        min: 0,
        default: 0,
      },

      freeShippingMinimum: {
        type: Number,
        min: 0,
        default: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | PAYMENT
      |--------------------------------------------------------------------------
      */

      codEnabled: {
        type: Boolean,
        default: true,
      },

      onlinePaymentEnabled: {
        type: Boolean,
        default: false,
      },

      /*
      |--------------------------------------------------------------------------
      | RETURN / EXCHANGE
      |--------------------------------------------------------------------------
      */

      returnDays: {
        type: Number,
        min: 0,
        default: 7,
      },

      exchangeDays: {
        type: Number,
        min: 0,
        default: 7,
      },

      /*
      |--------------------------------------------------------------------------
      | INVENTORY
      |--------------------------------------------------------------------------
      */

      lowStockLimit: {
        type: Number,
        min: 0,
        default: 5,
      },

      /*
      |--------------------------------------------------------------------------
      | SEO
      |--------------------------------------------------------------------------
      */

      defaultSeoTitle: {
        type: String,
        trim: true,
        default: "SilentGEN",
      },

      defaultSeoDescription: {
        type: String,
        trim: true,
        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | SYSTEM
      |--------------------------------------------------------------------------
      */

      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Settings =
  (mongoose.models
    .Settings as
    | Model<ISettings>
    | undefined) ||
  mongoose.model<ISettings>(
    "Settings",
    SettingsSchema
  );

export default Settings;