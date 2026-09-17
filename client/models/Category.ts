import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

/*
|--------------------------------------------------------------------------
| CATEGORY DOCUMENT
|--------------------------------------------------------------------------
*/

export interface ICategory extends Document {
  name: string;
  slug: string;

  image: {
    url: string;
    publicId: string;
    alt: string;
    title: string;
  };

  enabled: boolean;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

/*
|--------------------------------------------------------------------------
| CATEGORY IMAGE SCHEMA
|--------------------------------------------------------------------------
*/

const CategoryImageSchema = new Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    alt: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| CATEGORY SCHEMA
|--------------------------------------------------------------------------
*/

const CategorySchema = new Schema<ICategory>(
  {
    /*
    |--------------------------------------------------------------------------
    | NAME
    |--------------------------------------------------------------------------
    */

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
    |--------------------------------------------------------------------------
    | SLUG
    |--------------------------------------------------------------------------
    */

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },

    /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

    image: {
      type: CategoryImageSchema,
      default: () => ({
        url: "",
        publicId: "",
        alt: "",
        title: "",
      }),
    },

    /*
    |--------------------------------------------------------------------------
    | ENABLED
    |--------------------------------------------------------------------------
    */

    enabled: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | SORT ORDER
    |--------------------------------------------------------------------------
    */

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

CategorySchema.index(
  {
    slug: 1,
  },
  {
    unique: true,
  }
);

CategorySchema.index({
  enabled: 1,
  sortOrder: 1,
});

/*
|--------------------------------------------------------------------------
| NORMALIZE NAME + SLUG
|--------------------------------------------------------------------------
|
| Mongoose 9:
| pre("save") middleware no longer uses next().
| The function simply completes after the synchronous work.
|
|--------------------------------------------------------------------------
*/

CategorySchema.pre(
  "save",
  function () {
    /*
    |--------------------------------------------------------------------------
    | NORMALIZE NAME
    |--------------------------------------------------------------------------
    */

    if (this.name) {
      this.name = this.name
        .trim()
        .replace(/\s+/g, " ");
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE SLUG
    |--------------------------------------------------------------------------
    */

    if (this.slug) {
      this.slug = this.slug
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(
          /[^a-z0-9-]/g,
          ""
        )
        .replace(
          /-+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        );
    }
  }
);

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>(
    "Category",
    CategorySchema
  );

export default Category;