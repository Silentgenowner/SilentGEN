import { Schema, model, models } from "mongoose";

/*
|--------------------------------------------------------------------------
| HOMEPAGE IMAGE
|--------------------------------------------------------------------------
*/

const HomePageImageSchema = new Schema(
  {
    url: {
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
| HOMEPAGE BUTTON
|--------------------------------------------------------------------------
*/

const HomePageButtonSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    href: {
      type: String,
      default: "",
      trim: true,
    },

    openInNewTab: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| HERO SLIDE
|--------------------------------------------------------------------------
*/

const HomePageHeroSlideSchema = new Schema(
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

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    mobileImage: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    button: {
      type: HomePageButtonSchema,
      default: () => ({}),
    },

    secondaryButton: {
      type: HomePageButtonSchema,
      default: () => ({}),
    },

    enabled: {
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

/*
|--------------------------------------------------------------------------
| CATEGORY
|--------------------------------------------------------------------------
*/

const HomePageCategorySchema = new Schema(
  {
    category: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

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

    image: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    href: {
      type: String,
      default: "/shop",
      trim: true,
    },

    enabled: {
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

/*
|--------------------------------------------------------------------------
| COLLECTION
|--------------------------------------------------------------------------
*/

const HomePageCollectionSchema = new Schema(
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

    image: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    href: {
      type: String,
      default: "/shop",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "View Collection",
      trim: true,
    },

    enabled: {
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

/*
|--------------------------------------------------------------------------
| OFFER
|--------------------------------------------------------------------------
*/

const HomePageOfferSchema = new Schema(
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

    discountText: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    href: {
      type: String,
      default: "/shop",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "Shop Now",
      trim: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);

/*
|--------------------------------------------------------------------------
| PRODUCT SECTION
|--------------------------------------------------------------------------
*/

const HomePageProductSectionSchema = new Schema(
  {
    title: {
      type: String,
      default: "Featured Products",
      trim: true,
    },

    subtitle: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "featured",
        "trending",
        "new-arrivals",
        "best-sellers",
        "manual",
      ],
      default: "featured",
    },

    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    enabled: {
      type: Boolean,
      default: true,
    },

    slider: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    viewAllText: {
      type: String,
      default: "View All",
      trim: true,
    },

    viewAllHref: {
      type: String,
      default: "/shop",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

/*
|--------------------------------------------------------------------------
| WHY SHOP ITEM
|--------------------------------------------------------------------------
*/

const HomePageWhyShopItemSchema = new Schema(
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
      type: HomePageImageSchema,
      default: () => ({}),
    },

    enabled: {
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

/*
|--------------------------------------------------------------------------
| NEWSLETTER
|--------------------------------------------------------------------------
*/

const HomePageNewsletterSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },

    title: {
      type: String,
      default: "Stay Updated",
      trim: true,
    },

    description: {
      type: String,
      default:
        "Subscribe for exclusive offers and updates.",
      trim: true,
    },

    buttonText: {
      type: String,
      default: "Subscribe",
      trim: true,
    },

    backgroundImage: {
      type: HomePageImageSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| GLOBAL SETTINGS
|--------------------------------------------------------------------------
*/

const HomePageSettingsSchema = new Schema(
  {
    primaryFont: {
      type: String,
      default: "Inter",
      trim: true,
    },

    headingFont: {
      type: String,
      default: "Inter",
      trim: true,
    },

    bodyFont: {
      type: String,
      default: "Inter",
      trim: true,
    },

    primaryColor: {
      type: String,
      default: "#000000",
      trim: true,
    },

    secondaryColor: {
      type: String,
      default: "#ffffff",
      trim: true,
    },

    accentColor: {
      type: String,
      default: "#111111",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| MAIN HOMEPAGE SCHEMA
|--------------------------------------------------------------------------
*/

const HomePageSchema = new Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {
      enabled: {
        type: Boolean,
        default: true,
      },

      sticky: {
        type: Boolean,
        default: true,
      },

      showSearch: {
        type: Boolean,
        default: true,
      },

      showWishlist: {
        type: Boolean,
        default: true,
      },

      showCart: {
        type: Boolean,
        default: true,
      },

      showAccount: {
        type: Boolean,
        default: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | LOGO
    |--------------------------------------------------------------------------
    */

    logo: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    /*
    |--------------------------------------------------------------------------
    | FAVICON
    |--------------------------------------------------------------------------
    */

    favicon: {
      type: HomePageImageSchema,
      default: () => ({}),
    },

    /*
    |--------------------------------------------------------------------------
    | HERO
    |--------------------------------------------------------------------------
    */

    hero: {
      enabled: {
        type: Boolean,
        default: true,
      },

      autoSlide: {
        type: Boolean,
        default: true,
      },

      slideInterval: {
        type: Number,
        default: 5000,
        min: 1000,
      },

      slides: {
        type: [HomePageHeroSlideSchema],
        default: [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | PRODUCT SECTIONS
    |--------------------------------------------------------------------------
    */

    productSections: {
      type: [HomePageProductSectionSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | SHOP BY CATEGORY
    |--------------------------------------------------------------------------
    */

    categories: {
      enabled: {
        type: Boolean,
        default: true,
      },

      title: {
        type: String,
        default: "Shop by Category",
        trim: true,
      },

      subtitle: {
        type: String,
        default:
          "Find your style from our complete fashion collection.",
        trim: true,
      },

      items: {
        type: [HomePageCategorySchema],
        default: [],
      },

      viewAllText: {
        type: String,
        default: "View All Categories",
        trim: true,
      },

      viewAllHref: {
        type: String,
        default: "/shop",
        trim: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | SHOP BY GENDER
    |--------------------------------------------------------------------------
    */

    gender: {
      enabled: {
        type: Boolean,
        default: true,
      },

      eyebrow: {
        type: String,
        default: "FIND YOUR STYLE",
        trim: true,
      },

      title: {
        type: String,
        default: "Shop by Gender",
        trim: true,
      },

      subtitle: {
        type: String,
        default:
          "Discover collections designed for everyone.",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | MEN
      |--------------------------------------------------------------------------
      */

      menTitle: {
        type: String,
        default: "Men",
        trim: true,
      },

      menDescription: {
        type: String,
        default:
          "Explore Men's Collection",
        trim: true,
      },

      menImage: {
        type: HomePageImageSchema,
        default: () => ({}),
      },

      menHref: {
        type: String,
        default:
          "/shop?gender=men",
        trim: true,
      },

      menEnabled: {
        type: Boolean,
        default: true,
      },

      /*
      |--------------------------------------------------------------------------
      | WOMEN
      |--------------------------------------------------------------------------
      */

      womenTitle: {
        type: String,
        default: "Women",
        trim: true,
      },

      womenDescription: {
        type: String,
        default:
          "Explore Women's Collection",
        trim: true,
      },

      womenImage: {
        type: HomePageImageSchema,
        default: () => ({}),
      },

      womenHref: {
        type: String,
        default:
          "/shop?gender=women",
        trim: true,
      },

      womenEnabled: {
        type: Boolean,
        default: true,
      },

      /*
      |--------------------------------------------------------------------------
      | KIDS
      |--------------------------------------------------------------------------
      */

      kidsTitle: {
        type: String,
        default: "Kids",
        trim: true,
      },

      kidsDescription: {
        type: String,
        default:
          "Explore Kids' Collection",
        trim: true,
      },

      kidsImage: {
        type: HomePageImageSchema,
        default: () => ({}),
      },

      kidsHref: {
        type: String,
        default:
          "/shop?gender=kids",
        trim: true,
      },

      kidsEnabled: {
        type: Boolean,
        default: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | OFFERS / BANNERS
    |--------------------------------------------------------------------------
    */

    offers: {
      enabled: {
        type: Boolean,
        default: true,
      },

      title: {
        type: String,
        default: "Offers & Deals",
        trim: true,
      },

      items: {
        type: [HomePageOfferSchema],
        default: [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | COLLECTIONS
    |--------------------------------------------------------------------------
    */

    collections: {
      enabled: {
        type: Boolean,
        default: true,
      },

      men: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Men's Collection",
          description: "",
          href:
            "/shop?gender=men",
          buttonText:
            "View Collection",
          enabled: true,
          sortOrder: 0,
        }),
      },

      women: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Women's Collection",
          description: "",
          href:
            "/shop?gender=women",
          buttonText:
            "View Collection",
          enabled: true,
          sortOrder: 1,
        }),
      },

      kids: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Kids' Collection",
          description: "",
          href:
            "/shop?gender=kids",
          buttonText:
            "View Collection",
          enabled: true,
          sortOrder: 2,
        }),
      },
    },

    /*
    |--------------------------------------------------------------------------
    | SEASONAL
    |--------------------------------------------------------------------------
    */

    seasonal: {
      enabled: {
        type: Boolean,
        default: true,
      },

      title: {
        type: String,
        default:
          "Seasonal Collection",
        trim: true,
      },

      summer: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Summer Collection",
          description: "",
          href:
            "/shop?season=summer",
          buttonText:
            "Shop Summer",
          enabled: true,
          sortOrder: 0,
        }),
      },

      winter: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Winter Collection",
          description: "",
          href:
            "/shop?season=winter",
          buttonText:
            "Shop Winter",
          enabled: true,
          sortOrder: 1,
        }),
      },

      festive: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "Festive Collection",
          description: "",
          href:
            "/shop?season=festive",
          buttonText:
            "Shop Festive",
          enabled: true,
          sortOrder: 2,
        }),
      },

      newSeason: {
        type: HomePageCollectionSchema,
        default: () => ({
          title:
            "New Season",
          description: "",
          href: "/shop",
          buttonText:
            "Explore",
          enabled: true,
          sortOrder: 3,
        }),
      },
    },

    /*
    |--------------------------------------------------------------------------
    | WHY SHOP
    |--------------------------------------------------------------------------
    */

    whyShop: {
      enabled: {
        type: Boolean,
        default: true,
      },

      title: {
        type: String,
        default:
          "Why Shop SilentGEN",
        trim: true,
      },

      items: {
        type: [
          HomePageWhyShopItemSchema,
        ],
        default: [],
      },
    },

    /*
    |--------------------------------------------------------------------------
    | NEWSLETTER
    |--------------------------------------------------------------------------
    */

    newsletter: {
      type: HomePageNewsletterSchema,
      default: () => ({}),
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      enabled: {
        type: Boolean,
        default: true,
      },

      logo: {
        type: HomePageImageSchema,
        default: () => ({}),
      },

      about: {
        type: String,
        default: "",
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        trim: true,
      },

      address: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | SOCIAL LINKS
      |--------------------------------------------------------------------------
      */

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

      whatsapp: {
        type: String,
        default: "",
        trim: true,
      },

      copyrightText: {
        type: String,
        default:
          "© SilentGEN. All rights reserved.",
        trim: true,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | GLOBAL SETTINGS
    |--------------------------------------------------------------------------
    */

    settings: {
      type: HomePageSettingsSchema,
      default: () => ({}),
    },

    /*
    |--------------------------------------------------------------------------
    | SECTION ORDER
    |--------------------------------------------------------------------------
    */

    sectionOrder: {
      type: [String],

      default: [
        "header",
        "hero",
        "featured",
        "categories",
        "gender",
        "offers",
        "new-arrivals",
        "best-sellers",
        "men-collection",
        "women-collection",
        "kids-collection",
        "seasonal",
        "why-shop",
        "newsletter",
        "footer",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | PUBLISH STATUS
    |--------------------------------------------------------------------------
    */

    isPublished: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | LAST UPDATED BY
    |--------------------------------------------------------------------------
    */

    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
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

const HomePage =
  models.HomePage ||
  model(
    "HomePage",
    HomePageSchema
  );

export default HomePage;