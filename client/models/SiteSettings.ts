import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

export interface ISiteSettings
  extends Document {
  key: string;

  /*
  |--------------------------------------------------------------------------
  | BUSINESS
  |--------------------------------------------------------------------------
  */

  businessName: string;

  businessAddress: string;

  /*
  |--------------------------------------------------------------------------
  | EMAILS
  |--------------------------------------------------------------------------
  */

  supportEmail: string;

  contactEmail: string;

  orderEmail: string;

  returnRefundEmail: string;

  /*
  |--------------------------------------------------------------------------
  | PHONE / WHATSAPP
  |--------------------------------------------------------------------------
  */

  customerCareNumber: string;

  whatsappNumber: string;

  whatsappMessage: string;

  /*
  |--------------------------------------------------------------------------
  | SOCIAL LINKS
  |--------------------------------------------------------------------------
  */

  instagramUrl: string;

  facebookUrl: string;

  youtubeUrl: string;

  /*
  |--------------------------------------------------------------------------
  | SUPPORT INFORMATION
  |--------------------------------------------------------------------------
  */

  supportHours: string;

  /*
  |--------------------------------------------------------------------------
  | COMPANY / LEGAL
  |--------------------------------------------------------------------------
  */

  legalBusinessName: string;

  gstNumber: string;

  /*
  |--------------------------------------------------------------------------
  | SEO
  |--------------------------------------------------------------------------
  */

  defaultSeoTitle: string;

  defaultSeoDescription: string;

  createdAt: Date;

  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const SiteSettingsSchema =
  new Schema<ISiteSettings>(
    {
      /*
      |--------------------------------------------------------------------------
      | SINGLETON KEY
      |--------------------------------------------------------------------------
      |
      | Site settings માટે databaseમાં માત્ર એક main document રાખવાનું.
      |
      */

      key: {
        type: String,
        required: true,
        unique: true,
        default: "global",
      },

      /*
      |--------------------------------------------------------------------------
      | BUSINESS
      |--------------------------------------------------------------------------
      */

      businessName: {
        type: String,
        default: "SilentGEN",
        trim: true,
      },

      businessAddress: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | EMAILS
      |--------------------------------------------------------------------------
      */

      supportEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      contactEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      orderEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      returnRefundEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      /*
      |--------------------------------------------------------------------------
      | PHONE / WHATSAPP
      |--------------------------------------------------------------------------
      */

      customerCareNumber: {
        type: String,
        default: "",
        trim: true,
      },

      whatsappNumber: {
        type: String,
        default: "",
        trim: true,
      },

      whatsappMessage: {
        type: String,
        default:
          "Hello SilentGEN, I need help.",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | SOCIAL LINKS
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
      | SUPPORT INFORMATION
      |--------------------------------------------------------------------------
      */

      supportHours: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | COMPANY / LEGAL
      |--------------------------------------------------------------------------
      */

      legalBusinessName: {
        type: String,
        default: "",
        trim: true,
      },

      gstNumber: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | SEO
      |--------------------------------------------------------------------------
      */

      defaultSeoTitle: {
        type: String,
        default:
          "SilentGEN",
        trim: true,
      },

      defaultSeoDescription: {
        type: String,
        default: "",
        trim: true,
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

const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ||
  mongoose.model<ISiteSettings>(
    "SiteSettings",
    SiteSettingsSchema
  );

export default SiteSettings;