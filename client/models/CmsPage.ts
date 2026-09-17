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

export type CmsPageSection =
  | "help"
  | "policy";

export type CmsPageStatus =
  | "Published"
  | "Draft";

export type CmsPageType =
  | "content"
  | "external"
  | "whatsapp";

export interface ICmsPage
  extends Document {
  title: string;

  slug: string;

  section: CmsPageSection;

  pageType: CmsPageType;

  content: string;

  shortDescription: string;

  status: CmsPageStatus;

  sortOrder: number;

  seoTitle: string;

  seoDescription: string;

  /*
  |--------------------------------------------------------------------------
  | EXTERNAL LINK
  |--------------------------------------------------------------------------
  |
  | Example:
  | Privacy-related external document,
  | another website link etc.
  |
  */

  externalUrl: string;

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP
  |--------------------------------------------------------------------------
  */

  whatsappNumber: string;

  whatsappMessage: string;

  /*
  |--------------------------------------------------------------------------
  | ICON
  |--------------------------------------------------------------------------
  |
  | Footer/adminમાં optional icon identifier.
  |
  */

  icon: string;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM PAGE
  |--------------------------------------------------------------------------
  |
  | true રાખીએ તો accidentally page delete થવાથી બચાવી શકીએ.
  |
  */

  isSystem: boolean;

  createdAt: Date;

  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| SCHEMA
|--------------------------------------------------------------------------
*/

const CmsPageSchema =
  new Schema<ICmsPage>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },

      section: {
        type: String,
        enum: [
          "help",
          "policy",
        ],
        required: true,
        index: true,
      },

      pageType: {
        type: String,
        enum: [
          "content",
          "external",
          "whatsapp",
        ],
        default: "content",
      },

      content: {
        type: String,
        default: "",
      },

      shortDescription: {
        type: String,
        default: "",
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "Published",
          "Draft",
        ],
        default: "Published",
        index: true,
      },

      sortOrder: {
        type: Number,
        default: 0,
      },

      seoTitle: {
        type: String,
        default: "",
        trim: true,
      },

      seoDescription: {
        type: String,
        default: "",
        trim: true,
      },

      externalUrl: {
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
        default: "",
        trim: true,
      },

      icon: {
        type: String,
        default: "",
        trim: true,
      },

      isSystem: {
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
| INDEX
|--------------------------------------------------------------------------
*/

CmsPageSchema.index({
  section: 1,
  status: 1,
  sortOrder: 1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const CmsPage: Model<ICmsPage> =
  mongoose.models.CmsPage ||
  mongoose.model<ICmsPage>(
    "CmsPage",
    CmsPageSchema
  );

export default CmsPage;