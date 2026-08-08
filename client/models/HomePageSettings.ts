import { Schema, model, models } from "mongoose";

const HomePageImageSchema = new Schema(
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

    mobileImage: {
      type: String,
      default: "",
      trim: true,
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    buttonText: {
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

const HomePageSettingsSchema = new Schema(
  {
    // ==========================================
    // HERO BANNERS
    // ==========================================

    heroBanners: {
      type: [HomePageImageSchema],
      default: [],
    },

    // ==========================================
    // SHOP BY CATEGORY
    // ==========================================

    categories: {
      type: [HomePageImageSchema],
      default: [],
    },

    // ==========================================
    // SHOP BY GENDER
    // ==========================================

    genders: {
      type: [HomePageImageSchema],
      default: [],
    },

    // ==========================================
    // OFFERS & DEALS
    // ==========================================

    offers: {
      type: [HomePageImageSchema],
      default: [],
    },

    // ==========================================
    // SEASONAL COLLECTION
    // ==========================================

    seasonalCollections: {
      type: [HomePageImageSchema],
      default: [],
    },

    // ==========================================
    // NEWSLETTER / PROMOTIONAL BANNER
    // ==========================================

    newsletter: {
      title: {
        type: String,
        default: "Stay Updated With SilentGEN",
      },

      subtitle: {
        type: String,
        default: "Get exclusive offers and new collection updates.",
      },

      image: {
        type: String,
        default: "",
      },

      active: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================
    // WHY SHOP SILENTGEN
    // ==========================================

    whyShop: {
      title: {
        type: String,
        default: "Why Shop SilentGEN?",
      },

      subtitle: {
        type: String,
        default: "Premium fashion with trusted service.",
      },

      image: {
        type: String,
        default: "",
      },

      active: {
        type: Boolean,
        default: true,
      },
    },

    // ==========================================
    // GLOBAL HOME PAGE SETTINGS
    // ==========================================

    featuredSection: {
      type: Boolean,
      default: true,
    },

    trendingSection: {
      type: Boolean,
      default: true,
    },

    newArrivalsSection: {
      type: Boolean,
      default: true,
    },

    bestSellerSection: {
      type: Boolean,
      default: true,
    },

    menCollectionSection: {
      type: Boolean,
      default: true,
    },

    womenCollectionSection: {
      type: Boolean,
      default: true,
    },

    kidsCollectionSection: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const HomePageSettings =
  models.HomePageSettings ||
  model("HomePageSettings", HomePageSettingsSchema);

export default HomePageSettings;
