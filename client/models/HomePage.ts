import { Schema, model, models } from "mongoose";

const HomepageImageSchema = new Schema(
  {
    image: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "",
      trim: true,
    },

    buttonLink: {
      type: String,
      default: "",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const HomepageCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const HomepageSectionSchema = new Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

const HomepageSchema = new Schema(
  {
    // ==========================================
    // HERO SLIDER
    // ==========================================

    heroSlides: {
      type: [HomepageImageSchema],
      default: [],
    },

    // ==========================================
    // SHOP BY CATEGORY
    // ==========================================

    categories: {
      type: [HomepageCategorySchema],
      default: [],
    },

    // ==========================================
    // SHOP BY GENDER
    // ==========================================

    genderSections: {
      type: [HomepageSectionSchema],
      default: [],
    },

    // ==========================================
    // OFFERS & DEALS
    // ==========================================

    offers: {
      type: [HomepageSectionSchema],
      default: [],
    },

    // ==========================================
    // SEASONAL COLLECTION
    // ==========================================

    seasonalCollections: {
      type: [HomepageSectionSchema],
      default: [],
    },

    // ==========================================
    // WHY SHOP SILENTGEN
    // ==========================================

    whyShop: {
      type: [
        {
          title: {
            type: String,
            default: "",
            trim: true,
          },

          description: {
            type: String,
            default: "",
            trim: true,
          },

          icon: {
            type: String,
            default: "",
            trim: true,
          },

          image: {
            type: String,
            default: "",
            trim: true,
          },

          active: {
            type: Boolean,
            default: true,
          },

          sortOrder: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },

    // ==========================================
    // NEWSLETTER
    // ==========================================

    newsletter: {
      title: {
        type: String,
        default: "Stay Updated With SilentGEN",
        trim: true,
      },

      description: {
        type: String,
        default: "Get exclusive offers and latest collection updates.",
        trim: true,
      },

      active: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================
    // FOOTER
    // ==========================================

    footer: {
      aboutUs: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
      },

      mobile: {
        type: String,
        default: "",
        trim: true,
      },

      instagram: {
        type: String,
        default: "",
        trim: true,
      },

      facebook: {
        type: String,
        default: "",
        trim: true,
      },

      youtube: {
        type: String,
        default: "",
        trim: true,
      },

      logo: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // ==========================================
    // HOMEPAGE STATUS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Homepage =
  models.Homepage ||
  model("Homepage", HomepageSchema);

export default Homepage;
