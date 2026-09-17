"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Heart,
  Languages,
  Loader2,
  MessageCircle,
  Minus,
  Minimize2,
  Package,
  Palette,
  Plus,
  RefreshCcw,
  RotateCcw,
  Ruler,
  Send,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import AILanguageSelector from "@/components/ai/AILanguageSelector";

import {
  getSilentGenLanguage,
  isSilentGenLanguageCode,
  type SilentGenLanguageCode,
} from "@/lib/ai/languageConfig";

/*
|--------------------------------------------------------------------------
| PRODUCT TYPES
|--------------------------------------------------------------------------
*/

type AIProduct = {
  id: string;

  sku?: string;
  name?: string;
  slug?: string;

  category?: string;
  subCategory?: string;

  brand?: string;
  gender?: string;

  fabric?: string;
  fit?: string;

  mrp?: number;
  price?: number;
  discount?: number;

  stock?: number;

  sizes?: string[];
  colors?: string[];

  image?: string;
  images?: string[];

  shortDescription?: string;

  url?: string;

  matchScore?: number;
};

/*
|--------------------------------------------------------------------------
| OUTFIT TYPES
|--------------------------------------------------------------------------
*/

type OutfitGroup = {
  group: string;

  products: AIProduct[];
};

type AIOutfit = {
  baseProduct?: AIProduct | null;

  baseCategory?: string | null;
  baseColor?: string | null;

  matchingColors?: string[];

  occasion?: string | null;
  style?: string | null;

  budget?: number | null;

  basePrice?: number;
  selectedTotal?: number;

  withinBudget?: boolean | null;

  groups?: OutfitGroup[];

  selectedProducts?: AIProduct[];
};

type OutfitSelection = {
  size: string;

  color: string;
};

/*
|--------------------------------------------------------------------------
| CART TYPES
|--------------------------------------------------------------------------
*/

type AICartItem = {
  productId: string;

  sku?: string;
  name?: string;

  category?: string;
  brand?: string;

  image?: string;

  price?: number;
  stock?: number;

  quantity: number;

  size?: string;
  color?: string;

  url?: string;
};

type AICartSummary = {
  totalItems: number;

  subtotal: number;
  shipping: number;
  grandTotal: number;
};

type AICart = {
  success: boolean;

  message?: string;

  requiresLogin?: boolean;

  items: AICartItem[];

  summary?: AICartSummary | null;

  addedItem?: unknown;
  updatedItem?: unknown;
  removedItem?: unknown;
};

/*
|--------------------------------------------------------------------------
| ORDER TYPES
|--------------------------------------------------------------------------
*/

type AIOrderItem = {
  productId?: string;

  name?: string;
  sku?: string;

  image?: string;

  quantity?: number;
  price?: number;

  size?: string;
  color?: string;
};

type AIDeliveryHistoryItem = {
  status?: string;

  date?: string | null;

  note?: string;
};

type AIOrder = {
  id?: string;
  orderId?: string;

  items?: AIOrderItem[];

  paymentMethod?: string;
  paymentStatus?: string;

  orderStatus?: string;

  subtotal?: number;
  shippingCharge?: number;
  discount?: number;
  totalAmount?: number;

  trackingNumber?: string;
  courierPartner?: string;

  deliveryHistory?: AIDeliveryHistoryItem[];

  returnRequest?: {
    reason?: string;
    status?: string;
    requestedAt?: string;
  } | null;

  exchangeRequest?: {
    reason?: string;
    status?: string;
    requestedAt?: string;
  } | null;

  invoiceNo?: string;
  invoiceUrl?: string;

  createdAt?: string;
  updatedAt?: string;

  url?: string;
};

type AIOrdersResult = {
  success: boolean;

  requiresLogin?: boolean;

  message?: string;

  count?: number;

  orders?: AIOrder[];
};

type AIOrderActionResult = {
  success?: boolean;

  requiresLogin?: boolean;

  message?: string;

  confirmationRequired?: boolean;

  actionCompleted?: boolean;

  orderId?: string;

  reason?: string;

  order?: AIOrder;
};

type AITrackingResult = {
  success?: boolean;

  requiresLogin?: boolean;

  message?: string;

  liveTracking?: boolean;

  shiprocketConfigured?: boolean;

  shiprocketError?: string;

  order?: AIOrder;

  tracking?: {
    awb?: string;

    courier?: string;

    status?: string;

    localStatus?: string;

    history?: AIDeliveryHistoryItem[];

    shiprocket?: unknown;
  } | null;
};

type AIConfirmation = {
  required: boolean;

  tool?: string;

  action?: string;

  orderId?: string;

  reason?: string | null;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| STYLE PROFILE
|--------------------------------------------------------------------------
*/

type AIStyleProfile = {
  preferredColors: string[];

  dislikedColors: string[];

  preferredSizes: string[];

  preferredFits: string[];

  preferredCategories: string[];

  preferredBrands: string[];

  preferredStyles: string[];

  preferredFabrics: string[];

  preferredOccasions: string[];

  minBudget: number | null;

  maxBudget: number | null;

  likedProductIds: string[];

  dislikedProductIds: string[];

  viewedProductIds: string[];

  personalizationEnabled: boolean;
};

type AIStyleProfileAction = {
  success: boolean;

  requiresLogin?: boolean;

  message?: string;
};

/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

type AIMessage = {
  id: string;

  role:
    | "user"
    | "assistant";

  content: string;

  products?: AIProduct[];

  outfit?: AIOutfit | null;

  cart?: AICart | null;

  orders?: AIOrdersResult | null;

  order?: AIOrderActionResult | null;

  tracking?: AITrackingResult | null;

  confirmation?: AIConfirmation | null;

  styleProfile?: AIStyleProfile | null;

  styleProfileAction?: AIStyleProfileAction | null;
};

/*
|--------------------------------------------------------------------------
| API RESPONSE
|--------------------------------------------------------------------------
*/

type AIChatResponse = {
  success: boolean;

  conversationId?: string;

  sessionId?: string;

  message?: string;

  products?: AIProduct[];

  outfit?: AIOutfit | null;

  cart?: AICart | null;

  orders?: AIOrdersResult | null;

  order?: AIOrderActionResult | null;

  tracking?: AITrackingResult | null;

  confirmation?: AIConfirmation | null;

  styleProfile?: AIStyleProfile | null;

  styleProfileAction?: AIStyleProfileAction | null;

  languagePreference?:
    | SilentGenLanguageCode
    | null;

  /*
  |--------------------------------------------------------------------------
  | LEGACY BACKEND COMPATIBILITY
  |--------------------------------------------------------------------------
  */

  language?:
    | SilentGenLanguageCode
    | null;

  model?: string;
};

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

const SESSION_STORAGE_KEY =
  "silentgen_ai_session_id";

const CONVERSATION_STORAGE_KEY =
  "silentgen_ai_conversation_id";

const LANGUAGE_STORAGE_KEY =
  "silentgen_ai_language";

/*
|--------------------------------------------------------------------------
| WELCOME MESSAGES
|--------------------------------------------------------------------------
*/

const WELCOME_MESSAGES: Record<
  SilentGenLanguageCode,
  string
> = {
  auto:
    "Hi 👋 I'm SilentGEN AI.\n\nStart chatting in your preferred language. I will automatically detect your language and respond naturally.",

  en:
    "Hi 👋 I'm SilentGEN AI.\n\nI can help you discover products, create complete outfits, manage your cart, check orders, track deliveries and remember your style preferences.",

  hi:
    "नमस्ते 👋 मैं SilentGEN AI हूँ।\n\nमैं products खोजने, complete outfits बनाने, cart manage करने, orders देखने, delivery tracking और आपकी style preferences याद रखने में मदद कर सकता हूँ।",

  gu:
    "નમસ્તે 👋 હું SilentGEN AI છું.\n\nહું તમને products શોધવા, complete outfits બનાવવા, cart manage કરવા, orders જોવા, delivery tracking અને તમારી style preferences યાદ રાખવામાં મદદ કરી શકું છું.",

  mr:
    "नमस्कार 👋 मी SilentGEN AI आहे.\n\nमी products शोधणे, complete outfits तयार करणे, cart manage करणे, orders आणि delivery tracking पाहणे तसेच तुमच्या style preferences लक्षात ठेवण्यात मदत करू शकतो.",

  bn:
    "নমস্কার 👋 আমি SilentGEN AI।\n\nআমি products খুঁজতে, complete outfits তৈরি করতে, cart manage করতে, orders ও delivery tracking দেখতে এবং আপনার style preferences মনে রাখতে সাহায্য করতে পারি।",

  ta:
    "வணக்கம் 👋 நான் SilentGEN AI.\n\nProducts கண்டுபிடிக்க, complete outfits உருவாக்க, cart manage செய்ய, orders மற்றும் delivery tracking பார்க்க, உங்கள் style preferences நினைவில் வைத்துக்கொள்ள உதவ முடியும்.",

  te:
    "నమస్కారం 👋 నేను SilentGEN AI.\n\nProducts కనుగొనడం, complete outfits తయారు చేయడం, cart manage చేయడం, orders మరియు delivery tracking చూడడం, మీ style preferences గుర్తుంచుకోవడంలో సహాయం చేస్తాను.",

  kn:
    "ನಮಸ್ಕಾರ 👋 ನಾನು SilentGEN AI.\n\nProducts ಹುಡುಕಲು, complete outfits ರಚಿಸಲು, cart manage ಮಾಡಲು, orders ಮತ್ತು delivery tracking ನೋಡಲು ಹಾಗೂ ನಿಮ್ಮ style preferences ನೆನಪಿಟ್ಟುಕೊಳ್ಳಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ.",

  ml:
    "നമസ്കാരം 👋 ഞാൻ SilentGEN AI ആണ്.\n\nProducts കണ്ടെത്താൻ, complete outfits തയ്യാറാക്കാൻ, cart manage ചെയ്യാൻ, orders, delivery tracking പരിശോധിക്കാൻ, നിങ്ങളുടെ style preferences ഓർക്കാൻ ഞാൻ സഹായിക്കും.",

  pa:
    "ਸਤ ਸ੍ਰੀ ਅਕਾਲ 👋 ਮੈਂ SilentGEN AI ਹਾਂ।\n\nਮੈਂ products ਲੱਭਣ, complete outfits ਬਣਾਉਣ, cart manage ਕਰਨ, orders ਅਤੇ delivery tracking ਦੇਖਣ ਅਤੇ ਤੁਹਾਡੀਆਂ style preferences ਯਾਦ ਰੱਖਣ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।",

  or:
    "ନମସ୍କାର 👋 ମୁଁ SilentGEN AI।\n\nProducts ଖୋଜିବା, complete outfits ବନାଇବା, cart manage କରିବା, orders ଏବଂ delivery tracking ଦେଖିବା ଓ ଆପଣଙ୍କ style preferences ମନେ ରଖିବାରେ ସାହାଯ୍ୟ କରିପାରିବି।",

  as:
    "নমস্কাৰ 👋 মই SilentGEN AI।\n\nProducts বিচৰা, complete outfits তৈয়াৰ কৰা, cart manage কৰা, orders আৰু delivery tracking চোৱা আৰু আপোনাৰ style preferences মনত ৰখাত সহায় কৰিব পাৰোঁ।",

  ur:
    "السلام علیکم 👋 میں SilentGEN AI ہوں۔\n\nمیں products تلاش کرنے، complete outfits بنانے، cart manage کرنے، orders اور delivery tracking دیکھنے اور آپ کی style preferences یاد رکھنے میں مدد کر سکتا ہوں۔",
};

/*
|--------------------------------------------------------------------------
| QUICK PROMPTS
|--------------------------------------------------------------------------
*/

function getQuickPrompts(
  language:
    SilentGenLanguageCode
): string[] {
  switch (
    language
  ) {
    case "gu":
      return [
        "₹2000 નીચે black shirt બતાવો",
        "મારા માટે complete outfit બનાવો",
        "Blue shirt સાથે કયો pant સારું લાગશે?",
        "મારી style preferences બતાવો",
        "મારો cart બતાવો",
        "મારા recent orders બતાવો",
        "મારું છેલ્લું order ક્યાં છે?",
      ];

    case "hi":
      return [
        "₹2000 के अंदर black shirt दिखाओ",
        "मेरे लिए complete outfit बनाओ",
        "Blue shirt के साथ कौन सा pant अच्छा लगेगा?",
        "मेरी style preferences दिखाओ",
        "मेरा cart दिखाओ",
        "मेरे recent orders दिखाओ",
        "मेरा latest order कहाँ है?",
      ];

    case "mr":
      return [
        "₹2000 च्या आत black shirt दाखवा",
        "माझ्यासाठी complete outfit तयार करा",
        "Blue shirt सोबत कोणता pant चांगला दिसेल?",
        "माझ्या style preferences दाखवा",
        "माझा cart दाखवा",
        "माझे recent orders दाखवा",
        "माझा latest order कुठे आहे?",
      ];

    case "bn":
      return [
        "₹2000 এর মধ্যে black shirt দেখাও",
        "আমার জন্য complete outfit তৈরি করো",
        "Blue shirt এর সাথে কোন pant ভালো লাগবে?",
        "আমার style preferences দেখাও",
        "আমার cart দেখাও",
        "আমার recent orders দেখাও",
        "আমার latest order কোথায়?",
      ];

    case "ta":
      return [
        "₹2000க்குள் black shirt காட்டுங்கள்",
        "எனக்காக complete outfit உருவாக்குங்கள்",
        "Blue shirt உடன் எந்த pant நன்றாக இருக்கும்?",
        "என் style preferences காட்டுங்கள்",
        "என் cart காட்டுங்கள்",
        "என் recent orders காட்டுங்கள்",
        "என் latest order எங்கே?",
      ];

    case "te":
      return [
        "₹2000 లోపు black shirt చూపించండి",
        "నా కోసం complete outfit తయారు చేయండి",
        "Blue shirt తో ఏ pant బాగుంటుంది?",
        "నా style preferences చూపించండి",
        "నా cart చూపించండి",
        "నా recent orders చూపించండి",
        "నా latest order ఎక్కడ ఉంది?",
      ];

    case "kn":
      return [
        "₹2000 ಒಳಗೆ black shirt ತೋರಿಸಿ",
        "ನನಗಾಗಿ complete outfit ರಚಿಸಿ",
        "Blue shirt ಜೊತೆ ಯಾವ pant ಚೆನ್ನಾಗಿ ಕಾಣುತ್ತದೆ?",
        "ನನ್ನ style preferences ತೋರಿಸಿ",
        "ನನ್ನ cart ತೋರಿಸಿ",
        "ನನ್ನ recent orders ತೋರಿಸಿ",
        "ನನ್ನ latest order ಎಲ್ಲಿದೆ?",
      ];

    case "ml":
      return [
        "₹2000ന് താഴെയുള്ള black shirt കാണിക്കുക",
        "എനിക്കായി complete outfit തയ്യാറാക്കുക",
        "Blue shirt നൊപ്പം ഏത് pant നല്ലതാണ്?",
        "എന്റെ style preferences കാണിക്കുക",
        "എന്റെ cart കാണിക്കുക",
        "എന്റെ recent orders കാണിക്കുക",
        "എന്റെ latest order എവിടെയാണ്?",
      ];

    case "pa":
      return [
        "₹2000 ਤੋਂ ਘੱਟ black shirt ਦਿਖਾਓ",
        "ਮੇਰੇ ਲਈ complete outfit ਬਣਾਓ",
        "Blue shirt ਨਾਲ ਕਿਹੜਾ pant ਵਧੀਆ ਲੱਗੇਗਾ?",
        "ਮੇਰੀਆਂ style preferences ਦਿਖਾਓ",
        "ਮੇਰਾ cart ਦਿਖਾਓ",
        "ਮੇਰੇ recent orders ਦਿਖਾਓ",
        "ਮੇਰਾ latest order ਕਿੱਥੇ ਹੈ?",
      ];

    case "or":
      return [
        "₹2000 ଭିତରେ black shirt ଦେଖାନ୍ତୁ",
        "ମୋ ପାଇଁ complete outfit ବନାନ୍ତୁ",
        "Blue shirt ସହ କେଉଁ pant ଭଲ ଲାଗିବ?",
        "ମୋ style preferences ଦେଖାନ୍ତୁ",
        "ମୋ cart ଦେଖାନ୍ତୁ",
        "ମୋ recent orders ଦେଖାନ୍ତୁ",
        "ମୋ latest order କେଉଁଠି?",
      ];

    case "as":
      return [
        "₹2000ৰ ভিতৰত black shirt দেখুৱাওক",
        "মোৰ বাবে complete outfit বনাওক",
        "Blue shirtৰ লগত কোনটো pant ভাল লাগিব?",
        "মোৰ style preferences দেখুৱাওক",
        "মোৰ cart দেখুৱাওক",
        "মোৰ recent orders দেখুৱাওক",
        "মোৰ latest order ক'ত আছে?",
      ];

    case "ur":
      return [
        "₹2000 سے کم black shirt دکھائیں",
        "میرے لیے complete outfit بنائیں",
        "Blue shirt کے ساتھ کون سا pant اچھا لگے گا؟",
        "میری style preferences دکھائیں",
        "میرا cart دکھائیں",
        "میرے recent orders دکھائیں",
        "میرا latest order کہاں ہے؟",
      ];

    case "auto":
      return [
        "Show me black shirts under ₹2000",
        "મારા માટે complete outfit બનાવો",
        "मेरा cart दिखाओ",
        "Show my recent orders",
      ];

    case "en":
    default:
      return [
        "Show me black shirts under ₹2000",
        "Build a complete outfit for me",
        "What pants match a blue shirt?",
        "Show my style preferences",
        "Show my cart",
        "Show my recent orders",
        "Where is my latest order?",
      ];
  }
}

/*
|--------------------------------------------------------------------------
| INPUT PLACEHOLDER
|--------------------------------------------------------------------------
*/

function getInputPlaceholder(
  language:
    SilentGenLanguageCode
) {
  switch (
    language
  ) {
    case "gu":
      return "SilentGEN AI ને કંઈપણ પૂછો...";

    case "hi":
      return "SilentGEN AI से कुछ भी पूछें...";

    case "mr":
      return "SilentGEN AI ला काहीही विचारा...";

    case "bn":
      return "SilentGEN AI-কে কিছু জিজ্ঞাসা করুন...";

    case "ta":
      return "SilentGEN AI-யிடம் கேளுங்கள்...";

    case "te":
      return "SilentGEN AI ని అడగండి...";

    case "kn":
      return "SilentGEN AI ಅನ್ನು ಕೇಳಿ...";

    case "ml":
      return "SilentGEN AI-യോട് ചോദിക്കൂ...";

    case "pa":
      return "SilentGEN AI ਨੂੰ ਪੁੱਛੋ...";

    case "or":
      return "SilentGEN AI କୁ ପଚାରନ୍ତୁ...";

    case "as":
      return "SilentGEN AI-ক সোধক...";

    case "ur":
      return "SilentGEN AI سے پوچھیں...";

    case "auto":
      return "Chat in any language...";

    case "en":
    default:
      return "Ask SilentGEN AI...";
  }
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function createId() {
  if (
    typeof window !==
      "undefined" &&
    window.crypto
      ?.randomUUID
  ) {
    return window.crypto
      .randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function createSessionId() {
  return `sg-ai-${createId()}`;
}

function createWelcomeMessage(
  language:
    SilentGenLanguageCode
): AIMessage {
  return {
    id:
      `welcome-${language}-${createId()}`,

    role:
      "assistant",

    content:
      WELCOME_MESSAGES[
        language
      ] ||
      WELCOME_MESSAGES.en,
  };
}

function formatPrice(
  value?:
    number | null
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        0,
    }
  ).format(
    Number(
      value ||
        0
    )
  );
}

function formatDate(
  value?:
    string | null
) {
  if (
    !value
  ) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  );
}

function shortOrderId(
  value?:
    string
) {
  const clean =
    String(
      value ||
        ""
    );

  if (
    clean.length <=
    10
  ) {
    return clean;
  }

  return clean.slice(
    -10
  );
}

function normalizeStatus(
  value?:
    string
) {
  return String(
    value ||
      ""
  )
    .trim()
    .toLowerCase();
}

function orderStatusClass(
  status?:
    string
) {
  const clean =
    normalizeStatus(
      status
    );

  if (
    clean.includes(
      "delivered"
    ) ||
    clean.includes(
      "completed"
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    clean.includes(
      "cancel"
    ) ||
    clean.includes(
      "failed"
    ) ||
    clean.includes(
      "reject"
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    clean.includes(
      "return"
    ) ||
    clean.includes(
      "exchange"
    )
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (
    clean.includes(
      "ship"
    ) ||
    clean.includes(
      "out for delivery"
    )
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

async function readJsonSafe(
  response:
    Response
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function dispatchCartUpdated() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      "cart-updated"
    )
  );

  window.dispatchEvent(
    new CustomEvent(
      "silentgen-cart-updated"
    )
  );
}

function hasAnyStylePreference(
  profile:
    AIStyleProfile
) {
  return (
    profile.preferredColors.length >
      0 ||
    profile.dislikedColors.length >
      0 ||
    profile.preferredSizes.length >
      0 ||
    profile.preferredFits.length >
      0 ||
    profile.preferredCategories.length >
      0 ||
    profile.preferredBrands.length >
      0 ||
    profile.preferredStyles.length >
      0 ||
    profile.preferredFabrics.length >
      0 ||
    profile.preferredOccasions.length >
      0 ||
    profile.likedProductIds.length >
      0 ||
    profile.dislikedProductIds.length >
      0 ||
    profile.viewedProductIds.length >
      0 ||
    typeof profile.minBudget ===
      "number" ||
    typeof profile.maxBudget ===
      "number"
  );
}

/*
|--------------------------------------------------------------------------
| STYLE CHIP
|--------------------------------------------------------------------------
*/

function StyleChip({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700">
      {children}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| STYLE PROFILE CARD
|--------------------------------------------------------------------------
*/

function AIStyleProfileCard({
  profile,
  action,
  onSendMessage,
}: {
  profile:
    AIStyleProfile | null;

  action:
    AIStyleProfileAction | null;

  onSendMessage: (
    message:
      string
  ) => Promise<void>;
}) {
  const [
    processing,
    setProcessing,
  ] =
    useState("");

  if (
    action?.requiresLogin
  ) {
    return (
      <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <UserRound
            size={20}
            className="mt-0.5 text-amber-700"
          />

          <div>
            <p className="text-sm font-bold text-amber-950">
              Login Required
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Login to save and use your personal SilentGEN AI
              style preferences.
            </p>

            <Link
              href="/login"
              className="mt-3 inline-flex items-center gap-1 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white"
            >
              Login

              <ChevronRight
                size={14}
              />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (
    !profile
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT TYPESCRIPT NARROWING
  |--------------------------------------------------------------------------
  */

  const currentProfile =
    profile;

  const hasPreferences =
    hasAnyStylePreference(
      currentProfile
    );

  async function togglePersonalization() {
    if (
      processing
    ) {
      return;
    }

    setProcessing(
      "toggle"
    );

    try {
      if (
        currentProfile
          .personalizationEnabled
      ) {
        await onSendMessage(
          "Disable my AI personalization."
        );
      } else {
        await onSendMessage(
          "Enable my AI personalization."
        );
      }
    } finally {
      setProcessing("");
    }
  }

  async function clearProfile() {
    if (
      processing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear all saved SilentGEN AI style preferences?"
      );

    if (
      !confirmed
    ) {
      return;
    }

    setProcessing(
      "clear"
    );

    try {
      await onSendMessage(
        "Clear all my saved AI style preferences."
      );
    } finally {
      setProcessing("");
    }
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-gradient-to-br from-white via-violet-50/40 to-blue-50 shadow-sm">
      <div className="border-b border-violet-100 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <UserRound
                size={19}
              />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-950">
                My Style
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                SilentGEN Personal Stylist
              </p>
            </div>
          </div>

          <span
            className={
              currentProfile
                .personalizationEnabled
                ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase text-emerald-700"
                : "rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase text-slate-500"
            }
          >
            {currentProfile
              .personalizationEnabled
              ? "Personalized"
              : "Paused"}
          </span>
        </div>

        {action?.message && (
          <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-[11px] text-slate-600">
            {
              action.message
            }
          </p>
        )}
      </div>

      {!hasPreferences ? (
        <div className="px-4 py-6 text-center">
          <Sparkles
            size={26}
            className="mx-auto text-violet-400"
          />

          <p className="mt-3 text-sm font-bold text-slate-800">
            Your style profile is empty
          </p>

          <p className="mx-auto mt-1 max-w-[300px] text-[11px] leading-5 text-slate-500">
            Tell AI your size, favorite colors, fit, style and
            budget to improve future recommendations.
          </p>

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              disabled={
                Boolean(
                  processing
                )
              }
              onClick={() =>
                void onSendMessage(
                  "Remember that my preferred size is L."
                )
              }
              className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-semibold text-violet-700 disabled:opacity-50"
            >
              Remember Size L
            </button>

            <button
              type="button"
              disabled={
                Boolean(
                  processing
                )
              }
              onClick={() =>
                void onSendMessage(
                  "Remember that I prefer black and navy colors."
                )
              }
              className="rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-xs font-semibold text-violet-700 disabled:opacity-50"
            >
              Black + Navy
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 px-4 py-4">
          {currentProfile
            .preferredColors
            .length >
            0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Palette
                  size={13}
                />

                Favorite Colors
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredColors
                  .map(
                    (
                      color
                    ) => (
                      <StyleChip
                        key={
                          color
                        }
                      >
                        {
                          color
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .dislikedColors
            .length >
            0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Avoid Colors
              </p>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .dislikedColors
                  .map(
                    (
                      color
                    ) => (
                      <span
                        key={
                          color
                        }
                        className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700"
                      >
                        {
                          color
                        }
                      </span>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredSizes
            .length >
            0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Ruler
                  size={13}
                />

                Preferred Size
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredSizes
                  .map(
                    (
                      size
                    ) => (
                      <StyleChip
                        key={
                          size
                        }
                      >
                        {
                          size
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredFits
            .length >
            0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <Shirt
                  size={13}
                />

                Preferred Fit
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredFits
                  .map(
                    (
                      fit
                    ) => (
                      <StyleChip
                        key={
                          fit
                        }
                      >
                        {
                          fit
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredStyles
            .length >
            0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <SlidersHorizontal
                  size={13}
                />

                Style
              </div>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredStyles
                  .map(
                    (
                      style
                    ) => (
                      <StyleChip
                        key={
                          style
                        }
                      >
                        {
                          style
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredCategories
            .length >
            0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Categories
              </p>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredCategories
                  .map(
                    (
                      category
                    ) => (
                      <StyleChip
                        key={
                          category
                        }
                      >
                        {
                          category
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredBrands
            .length >
            0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Brands
              </p>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredBrands
                  .map(
                    (
                      brand
                    ) => (
                      <StyleChip
                        key={
                          brand
                        }
                      >
                        {
                          brand
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredFabrics
            .length >
            0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Fabrics
              </p>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredFabrics
                  .map(
                    (
                      fabric
                    ) => (
                      <StyleChip
                        key={
                          fabric
                        }
                      >
                        {
                          fabric
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {currentProfile
            .preferredOccasions
            .length >
            0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Occasions
              </p>

              <div className="flex flex-wrap gap-1.5">
                {currentProfile
                  .preferredOccasions
                  .map(
                    (
                      occasion
                    ) => (
                      <StyleChip
                        key={
                          occasion
                        }
                      >
                        {
                          occasion
                        }
                      </StyleChip>
                    )
                  )}
              </div>
            </div>
          )}

          {(typeof currentProfile
            .minBudget ===
            "number" ||
            typeof currentProfile
              .maxBudget ===
              "number") && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
              <div className="flex items-center gap-2">
                <WalletCards
                  size={15}
                  className="text-emerald-700"
                />

                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Preferred Budget
                </p>
              </div>

              <p className="mt-2 text-sm font-bold text-emerald-950">
                {typeof currentProfile
                  .minBudget ===
                  "number" &&
                typeof currentProfile
                  .maxBudget ===
                  "number"
                  ? `${formatPrice(
                      currentProfile
                        .minBudget
                    )} – ${formatPrice(
                      currentProfile
                        .maxBudget
                    )}`
                  : typeof currentProfile
                        .maxBudget ===
                      "number"
                    ? `Up to ${formatPrice(
                        currentProfile
                          .maxBudget
                      )}`
                    : `From ${formatPrice(
                        currentProfile
                          .minBudget
                      )}`}
              </p>
            </div>
          )}

          {currentProfile
            .likedProductIds
            .length >
            0 && (
            <div className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2.5 text-[11px] font-semibold text-pink-700">
              <Heart
                size={14}
              />

              {
                currentProfile
                  .likedProductIds
                  .length
              }{" "}
              liked product(s) remembered
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-violet-100 bg-white/80 p-3">
        <button
          type="button"
          disabled={
            Boolean(
              processing
            )
          }
          onClick={() =>
            void togglePersonalization()
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-[10px] font-bold text-slate-700 disabled:opacity-50"
        >
          {processing ===
          "toggle" ? (
            <Loader2
              size={13}
              className="animate-spin"
            />
          ) : (
            <SlidersHorizontal
              size={13}
            />
          )}

          {currentProfile
            .personalizationEnabled
            ? "Pause Personalization"
            : "Enable Personalization"}
        </button>

        <button
          type="button"
          disabled={
            Boolean(
              processing
            ) ||
            !hasPreferences
          }
          onClick={() =>
            void clearProfile()
          }
          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 py-2.5 text-[10px] font-bold text-red-700 disabled:opacity-40"
        >
          {processing ===
          "clear" ? (
            <Loader2
              size={13}
              className="animate-spin"
            />
          ) : (
            <Trash2
              size={13}
            />
          )}

          Clear Style
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PRODUCT CARD
|--------------------------------------------------------------------------
*/

function AIProductCard({
  product,
}: {
  product:
    AIProduct;
}) {
  const productUrl =
    product.url ||
    `/product/${product.id}`;

  const image =
    product.image ||
    product.images?.[0] ||
    "";

  const price =
    Number(
      product.price ||
        0
    );

  const mrp =
    Number(
      product.mrp ||
        0
    );

  const hasDiscount =
    mrp >
      price &&
    price >
      0;

  const matchScore =
    typeof product.matchScore ===
    "number"
      ? Math.round(
          product.matchScore
        )
      : null;

  return (
    <Link
      href={
        productUrl
      }
      className="group block min-w-[190px] max-w-[190px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={
              image
            }
            alt={
              product.name ||
              "SilentGEN product"
            }
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <ShoppingBag
              size={32}
            />
          </div>
        )}

        {hasDiscount && (
          <div className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">
            SAVE{" "}
            {Math.round(
              ((mrp -
                price) /
                mrp) *
                100
            )}
            %
          </div>
        )}

        {matchScore !==
          null && (
          <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">
            {
              matchScore
            }
            % Match
          </div>
        )}
      </div>

      <div className="p-3">
        {product.category && (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            {
              product.category
            }
          </p>
        )}

        <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-900">
          {product.name ||
            "SilentGEN Product"}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-bold text-slate-950">
            {formatPrice(
              price
            )}
          </span>

          {hasDiscount && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(
                mrp
              )}
            </span>
          )}
        </div>

        {product.colors
          ?.length ? (
          <p className="mt-2 truncate text-[11px] text-slate-500">
            Colors:{" "}
            {product.colors
              .slice(
                0,
                3
              )
              .join(
                ", "
              )}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-blue-700">
          View Product

          <ChevronRight
            size={15}
          />
        </div>
      </div>
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| MESSAGE BUBBLE
|--------------------------------------------------------------------------
*/

function MessageBubble({
  message,
}: {
  message:
    AIMessage;
}) {
  const isUser =
    message.role ===
    "user";

  return (
    <div
      className={
        isUser
          ? "flex justify-end"
          : "flex justify-start"
      }
    >
      <div
        className={
          isUser
            ? "max-w-[84%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white shadow-sm"
            : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
        }
      >
        {!isUser && (
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-blue-700">
            <Sparkles
              size={14}
            />

            SilentGEN AI
          </div>
        )}

        <div className="whitespace-pre-wrap break-words">
          {
            message.content
          }
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| OUTFIT CARD
|--------------------------------------------------------------------------
*/

function AIOutfitCard({
  outfit,
  onCartUpdated,
}: {
  outfit:
    AIOutfit;

  onCartUpdated: () =>
    Promise<void>;
}) {
  const completeLookProducts =
    useMemo(
      () => {
        const products:
          AIProduct[] =
          [];

        if (
          outfit
            .baseProduct
            ?.id
        ) {
          products.push(
            outfit.baseProduct
          );
        }

        const selectedProducts =
          Array.isArray(
            outfit
              .selectedProducts
          )
            ? outfit.selectedProducts
            : [];

        for (
          const product of
          selectedProducts
        ) {
          if (
            !products.some(
              (
                current
              ) =>
                current.id ===
                product.id
            )
          ) {
            products.push(
              product
            );
          }
        }

        return products;
      },
      [
        outfit.baseProduct,
        outfit.selectedProducts,
      ]
    );

  const matchingColors =
    Array.isArray(
      outfit.matchingColors
    )
      ? outfit.matchingColors
      : [];

  const [
    selections,
    setSelections,
  ] =
    useState<
      Record<
        string,
        OutfitSelection
      >
    >({});

  const [
    isAdding,
    setIsAdding,
  ] =
    useState(false);

  const [
    cartMessage,
    setCartMessage,
  ] =
    useState("");

  const [
    cartError,
    setCartError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | INITIAL SELECTION
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Never silently choose from multiple sizes/colors.
  |
  | If there is exactly ONE valid option, it can safely be selected.
  |
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const next:
      Record<
        string,
        OutfitSelection
      > = {};

    for (
      const product of
      completeLookProducts
    ) {
      const sizes =
        Array.isArray(
          product.sizes
        )
          ? product.sizes.filter(
              Boolean
            )
          : [];

      const colors =
        Array.isArray(
          product.colors
        )
          ? product.colors.filter(
              Boolean
            )
          : [];

      next[
        product.id
      ] = {
        size:
          sizes.length ===
          1
            ? sizes[0]
            : "",

        color:
          colors.length ===
          1
            ? colors[0]
            : "",
      };
    }

    setSelections(
      next
    );
  }, [
    completeLookProducts,
  ]);

  function changeSize(
    productId:
      string,
    size:
      string
  ) {
    setSelections(
      (
        previous
      ) => ({
        ...previous,

        [productId]: {
          size,

          color:
            previous[
              productId
            ]?.color ||
            "",
        },
      })
    );
  }

  function changeColor(
    productId:
      string,
    color:
      string
  ) {
    setSelections(
      (
        previous
      ) => ({
        ...previous,

        [productId]: {
          size:
            previous[
              productId
            ]?.size ||
            "",

          color,
        },
      })
    );
  }

  function validateSelections() {
    for (
      const product of
      completeLookProducts
    ) {
      const selection =
        selections[
          product.id
        ];

      if (
        Number(
          product.stock ||
            0
        ) <=
        0
      ) {
        return `${product.name || "Product"} is currently out of stock.`;
      }

      if (
        product.sizes
          ?.length &&
        !selection?.size
      ) {
        return `Select a size for ${product.name || "Product"}.`;
      }

      if (
        product.colors
          ?.length &&
        !selection?.color
      ) {
        return `Select a color for ${product.name || "Product"}.`;
      }
    }

    return null;
  }

  async function addCompleteLook() {
    if (
      isAdding ||
      completeLookProducts
        .length ===
        0
    ) {
      return;
    }

    setCartMessage("");
    setCartError("");

    const validationError =
      validateSelections();

    if (
      validationError
    ) {
      setCartError(
        validationError
      );

      return;
    }

    setIsAdding(
      true
    );

    try {
      for (
        const product of
        completeLookProducts
      ) {
        const selection =
          selections[
            product.id
          ] || {
            size:
              "",

            color:
              "",
          };

        const response =
          await fetch(
            "/api/cart/add",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              credentials:
                "include",

              body:
                JSON.stringify(
                  {
                    productId:
                      product.id,

                    quantity:
                      1,

                    size:
                      selection.size,

                    color:
                      selection.color,
                  }
                ),
            }
          );

        const data =
          await readJsonSafe(
            response
          );

        if (
          !response.ok ||
          data?.success ===
            false
        ) {
          if (
            response.status ===
            401
          ) {
            throw new Error(
              "Please login before adding the complete look to your cart."
            );
          }

          throw new Error(
            data?.message ||
              `${product.name || "Product"} could not be added to the cart.`
          );
        }
      }

      setCartMessage(
        `${completeLookProducts.length} product(s) added to your cart successfully.`
      );

      await onCartUpdated();

      dispatchCartUpdated();
    } catch (
      error
    ) {
      setCartError(
        error instanceof
        Error
          ? error.message
          : "Unable to add the complete look."
      );
    } finally {
      setIsAdding(
        false
      );
    }
  }

  if (
    completeLookProducts
      .length ===
    0
  ) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50 shadow-sm">
      <div className="border-b border-blue-100 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
          <Sparkles
            size={17}
            className="text-blue-600"
          />

          AI Complete Look
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Real SilentGEN products selected by style, color,
          budget and stock.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        {outfit.baseColor && (
          <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Base Color
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
              {
                outfit.baseColor
              }
            </p>
          </div>
        )}

        {outfit.occasion && (
          <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Occasion
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
              {
                outfit.occasion
              }
            </p>
          </div>
        )}
      </div>

      {matchingColors.length >
        0 && (
        <div className="px-4 pb-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Best Matching Colors
          </p>

          <div className="flex flex-wrap gap-2">
            {matchingColors
              .slice(
                0,
                6
              )
              .map(
                (
                  color
                ) => (
                  <span
                    key={
                      color
                    }
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {
                      color
                    }
                  </span>
                )
              )}
          </div>
        </div>
      )}

      <div className="space-y-3 px-4 pb-4">
        {completeLookProducts.map(
          (
            product,
            index
          ) => {
            const selection =
              selections[
                product.id
              ] || {
                size:
                  "",

                color:
                  "",
              };

            const image =
              product.image ||
              product
                .images?.[0] ||
              "";

            return (
              <div
                key={
                  product.id
                }
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <Link
                    href={
                      product.url ||
                      `/product/${product.id}`
                    }
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                  >
                    {image ? (
                      <img
                        src={
                          image
                        }
                        alt={
                          product.name ||
                          "Product"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <ShoppingBag
                          size={20}
                        />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {index ===
                        0 &&
                        outfit
                          .baseProduct
                          ?.id ===
                          product.id && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase text-blue-700">
                            Base
                          </span>
                        )}

                      {typeof product.matchScore ===
                        "number" && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                          {Math.round(
                            product.matchScore
                          )}
                          % Match
                        </span>
                      )}
                    </div>

                    <Link
                      href={
                        product.url ||
                        `/product/${product.id}`
                      }
                      className="line-clamp-2 text-sm font-semibold text-slate-900"
                    >
                      {product.name ||
                        "SilentGEN Product"}
                    </Link>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-950">
                        {formatPrice(
                          product.price
                        )}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {Number(
                          product.stock ||
                            0
                        )}{" "}
                        left
                      </span>
                    </div>
                  </div>
                </div>

                {product.sizes
                  ?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Size
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes.map(
                        (
                          size
                        ) => (
                          <button
                            key={
                              size
                            }
                            type="button"
                            onClick={() =>
                              changeSize(
                                product.id,
                                size
                              )
                            }
                            className={
                              selection.size ===
                              size
                                ? "rounded-lg border border-slate-950 bg-slate-950 px-2.5 py-1.5 text-[11px] font-bold text-white"
                                : "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"
                            }
                          >
                            {
                              size
                            }
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                {product.colors
                  ?.length ? (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Color
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {product.colors.map(
                        (
                          color
                        ) => (
                          <button
                            key={
                              color
                            }
                            type="button"
                            onClick={() =>
                              changeColor(
                                product.id,
                                color
                              )
                            }
                            className={
                              selection.color ===
                              color
                                ? "rounded-full border border-blue-700 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-800"
                                : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-700"
                            }
                          >
                            {
                              color
                            }
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          }
        )}
      </div>

      <div className="border-t border-blue-100 bg-white/80 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Complete Look Total
            </p>

            <p className="mt-1 text-lg font-extrabold text-slate-950">
              {formatPrice(
                outfit.selectedTotal
              )}
            </p>
          </div>

          {typeof outfit.withinBudget ===
            "boolean" && (
            <div
              className={
                outfit.withinBudget
                  ? "flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"
                  : "flex items-center gap-1 rounded-full bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700"
              }
            >
              {outfit.withinBudget ? (
                <>
                  <CheckCircle2
                    size={14}
                  />

                  Within Budget
                </>
              ) : (
                <>
                  <CircleDollarSign
                    size={14}
                  />

                  Over Budget
                </>
              )}
            </div>
          )}
        </div>

        {typeof outfit.budget ===
          "number" && (
          <p className="mt-1 text-[11px] text-slate-500">
            Budget:{" "}
            {formatPrice(
              outfit.budget
            )}
          </p>
        )}

        {cartError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {
              cartError
            }
          </div>
        )}

        {cartMessage && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
            {
              cartMessage
            }
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            void addCompleteLook()
          }
          disabled={
            isAdding
          }
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isAdding ? (
            <Loader2
              size={18}
              className="animate-spin"
            />
          ) : (
            <ShoppingCart
              size={18}
            />
          )}

          {isAdding
            ? "Adding Look..."
            : "Add Complete Look"}
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MINI CART
|--------------------------------------------------------------------------
*/

function AIMiniCart({
  cart,
  onCartUpdated,
}: {
  cart:
    AICart;

  onCartUpdated: () =>
    Promise<void>;
}) {
  const [
    isExpanded,
    setIsExpanded,
  ] =
    useState(true);

  const [
    processingKey,
    setProcessingKey,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const items =
    Array.isArray(
      cart.items
    )
      ? cart.items
      : [];

  const summary =
    cart.summary || {
      totalItems:
        0,

      subtotal:
        0,

      shipping:
        0,

      grandTotal:
        0,
    };

  if (
    cart.requiresLogin
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">
          Login Required
        </p>

        <p className="mt-1 text-xs text-amber-800">
          Login to view and manage your cart.
        </p>

        <Link
          href="/login"
          className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Keep legacy action-based cart update API compatibility:
  |
  | increase
  | decrease
  |
  |--------------------------------------------------------------------------
  */

  async function updateQuantity(
    item:
      AICartItem,
    action:
      | "increase"
      | "decrease"
  ) {
    const stock =
      Number(
        item.stock ||
          0
      );

    if (
      action ===
        "increase" &&
      stock >
        0 &&
      item.quantity >=
        stock
    ) {
      setError(
        `Only ${stock} item(s) available.`
      );

      return;
    }

    if (
      action ===
        "decrease" &&
      item.quantity <=
        1
    ) {
      return;
    }

    const key =
      `${item.productId}-${item.size || ""}-${item.color || ""}`;

    setProcessingKey(
      key
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/cart/update",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                {
                  productId:
                    item.productId,

                  size:
                    item.size ||
                    "",

                  color:
                    item.color ||
                    "",

                  action,
                }
              ),
          }
        );

      const data =
        await readJsonSafe(
          response
        );

      if (
        !response.ok ||
        data?.success ===
          false
      ) {
        throw new Error(
          data?.message ||
            "Quantity update failed."
        );
      }

      await onCartUpdated();

      dispatchCartUpdated();
    } catch (
      currentError
    ) {
      setError(
        currentError instanceof
        Error
          ? currentError.message
          : "Quantity update failed."
      );
    } finally {
      setProcessingKey("");
    }
  }

  async function removeItem(
    item:
      AICartItem
  ) {
    const key =
      `${item.productId}-${item.size || ""}-${item.color || ""}`;

    setProcessingKey(
      key
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/cart/remove",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                {
                  productId:
                    item.productId,

                  size:
                    item.size ||
                    "",

                  color:
                    item.color ||
                    "",
                }
              ),
          }
        );

      const data =
        await readJsonSafe(
          response
        );

      if (
        !response.ok ||
        data?.success ===
          false
      ) {
        throw new Error(
          data?.message ||
            "Unable to remove product."
        );
      }

      await onCartUpdated();

      dispatchCartUpdated();
    } catch (
      currentError
    ) {
      setError(
        currentError instanceof
        Error
          ? currentError.message
          : "Unable to remove product."
      );
    } finally {
      setProcessingKey("");
    }
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() =>
          setIsExpanded(
            (
              previous
            ) =>
              !previous
          )
        }
        className="flex w-full items-center justify-between bg-slate-950 px-4 py-4 text-white"
      >
        <div className="flex items-center gap-3">
          <ShoppingCart
            size={18}
          />

          <div className="text-left">
            <p className="text-sm font-bold">
              My Cart
            </p>

            <p className="text-[11px] text-slate-300">
              {
                summary.totalItems
              }{" "}
              item(s)
            </p>
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp
            size={18}
          />
        ) : (
          <ChevronDown
            size={18}
          />
        )}
      </button>

      {isExpanded && (
        <>
          {items.length ===
          0 ? (
            <div className="px-4 py-8 text-center">
              <ShoppingBag
                size={30}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-600">
                Your cart is empty
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map(
                (
                  item,
                  index
                ) => {
                  const key =
                    `${item.productId}-${item.size || ""}-${item.color || ""}`;

                  const processing =
                    processingKey ===
                    key;

                  const stock =
                    Number(
                      item.stock ||
                        0
                    );

                  return (
                    <div
                      key={`${key}-${index}`}
                      className="p-3"
                    >
                      <div className="flex gap-3">
                        <Link
                          href={
                            item.url ||
                            `/product/${item.productId}`
                          }
                          className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                        >
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Product"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ShoppingBag
                                size={18}
                                className="text-slate-300"
                              />
                            </div>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={
                              item.url ||
                              `/product/${item.productId}`
                            }
                            className="line-clamp-2 text-sm font-semibold text-slate-900"
                          >
                            {item.name ||
                              "Product"}
                          </Link>

                          <p className="mt-1 text-xs font-bold">
                            {formatPrice(
                              item.price
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {item.size &&
                              `Size: ${item.size}`}

                            {item.size &&
                              item.color &&
                              " • "}

                            {
                              item.color
                            }
                          </p>

                          {stock >
                            0 && (
                            <p className="mt-1 text-[10px] text-slate-400">
                              {
                                stock
                              }{" "}
                              left
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex overflow-hidden rounded-xl border">
                          <button
                            type="button"
                            disabled={
                              processing ||
                              item.quantity <=
                                1
                            }
                            onClick={() =>
                              void updateQuantity(
                                item,
                                "decrease"
                              )
                            }
                            className="h-8 w-8 disabled:opacity-30"
                          >
                            <Minus
                              size={14}
                              className="mx-auto"
                            />
                          </button>

                          <div className="flex h-8 min-w-9 items-center justify-center border-x px-2 text-xs font-bold">
                            {processing ? (
                              <Loader2
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              item.quantity
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={
                              processing ||
                              (stock >
                                0 &&
                                item.quantity >=
                                  stock)
                            }
                            onClick={() =>
                              void updateQuantity(
                                item,
                                "increase"
                              )
                            }
                            className="h-8 w-8 disabled:opacity-30"
                          >
                            <Plus
                              size={14}
                              className="mx-auto"
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={
                            processing
                          }
                          onClick={() =>
                            void removeItem(
                              item
                            )
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 disabled:opacity-40"
                        >
                          <Trash2
                            size={14}
                          />

                          Remove
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {error && (
            <div className="m-3 rounded-xl bg-red-50 p-2 text-xs text-red-700">
              {
                error
              }
            </div>
          )}

          {items.length >
            0 && (
            <div className="border-t bg-slate-50 p-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      summary.subtotal
                    )}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span>
                    Shipping
                  </span>

                  <strong>
                    {summary.shipping ===
                    0
                      ? "FREE"
                      : formatPrice(
                          summary.shipping
                        )}
                  </strong>
                </div>

                <div className="flex justify-between border-t pt-3 text-sm font-bold">
                  <span>
                    Grand Total
                  </span>

                  <span>
                    {formatPrice(
                      summary.grandTotal
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  className="rounded-xl border bg-white py-3 text-center text-xs font-bold"
                >
                  View Cart
                </Link>

                <Link
                  href="/checkout"
                  className="rounded-xl bg-slate-950 py-3 text-center text-xs font-bold text-white"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ORDER CARD
|--------------------------------------------------------------------------
*/

function AIOrderCard({
  order,
  onSendMessage,
}: {
  order:
    AIOrder;

  onSendMessage: (
    message:
      string
  ) => Promise<void>;
}) {
  const orderId =
    order.id ||
    order.orderId ||
    "";

  const status =
    normalizeStatus(
      order.orderStatus
    );

  const canCancel =
    [
      "placed",
      "confirmed",
    ].includes(
      status
    );

  const delivered =
    status ===
    "delivered";

  const hasActiveReturn =
    Boolean(
      order.returnRequest
        ?.status &&
        ![
          "rejected",
          "cancelled",
        ].includes(
          normalizeStatus(
            order
              .returnRequest
              ?.status
          )
        )
    );

  const hasActiveExchange =
    Boolean(
      order.exchangeRequest
        ?.status &&
        ![
          "rejected",
          "cancelled",
        ].includes(
          normalizeStatus(
            order
              .exchangeRequest
              ?.status
          )
        )
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Order
          </p>

          <p className="mt-1 text-sm font-bold">
            #
            {shortOrderId(
              orderId
            )}
          </p>
        </div>

        <span
          className={`
            rounded-full
            border
            px-2.5
            py-1
            text-[10px]
            font-bold
            ${orderStatusClass(
              order.orderStatus
            )}
          `}
        >
          {order.orderStatus ||
            "Unknown"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[9px] uppercase text-slate-400">
            Total
          </p>

          <p className="mt-1 text-xs font-bold">
            {formatPrice(
              order.totalAmount
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-2.5">
          <p className="text-[9px] uppercase text-slate-400">
            Payment
          </p>

          <p className="mt-1 text-xs font-bold">
            {order.paymentStatus ||
              "Unknown"}
          </p>
        </div>
      </div>

      {order.createdAt && (
        <p className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">
          <Clock3
            size={12}
          />

          {formatDate(
            order.createdAt
          )}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            void onSendMessage(
              `Show details for order ${orderId}.`
            )
          }
          className="rounded-xl border px-3 py-2 text-[10px] font-bold"
        >
          Details
        </button>

        <button
          type="button"
          onClick={() =>
            void onSendMessage(
              `Track order ${orderId}.`
            )
          }
          className="flex items-center gap-1 rounded-xl border px-3 py-2 text-[10px] font-bold"
        >
          <Truck
            size={12}
          />

          Track
        </button>

        {order.url && (
          <Link
            href={
              order.url
            }
            className="flex items-center gap-1 rounded-xl border px-3 py-2 text-[10px] font-bold"
          >
            Open

            <ChevronRight
              size={12}
            />
          </Link>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() =>
              void onSendMessage(
                `I want to cancel order ${orderId}.`
              )
            }
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-700"
          >
            Cancel
          </button>
        )}

        {delivered &&
          !hasActiveReturn &&
          !hasActiveExchange && (
            <>
              <button
                type="button"
                onClick={() =>
                  void onSendMessage(
                    `I want to return order ${orderId}.`
                  )
                }
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700"
              >
                Return
              </button>

              <button
                type="button"
                onClick={() =>
                  void onSendMessage(
                    `I want to exchange order ${orderId}.`
                  )
                }
                className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700"
              >
                Exchange
              </button>
            </>
          )}

        {hasActiveReturn && (
          <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700">
            Return{" "}
            {
              order
                .returnRequest
                ?.status
            }
          </span>
        )}

        {hasActiveExchange && (
          <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">
            Exchange{" "}
            {
              order
                .exchangeRequest
                ?.status
            }
          </span>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ORDERS
|--------------------------------------------------------------------------
*/

function AIOrdersCard({
  result,
  onSendMessage,
}: {
  result:
    AIOrdersResult;

  onSendMessage: (
    message:
      string
  ) => Promise<void>;
}) {
  if (
    result.requiresLogin
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">
          Login to view your orders.
        </p>

        <Link
          href="/login"
          className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  const orders =
    Array.isArray(
      result.orders
    )
      ? result.orders
      : [];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Package
          size={17}
          className="text-blue-600"
        />

        <span className="text-sm font-bold">
          My Orders
        </span>

        <span className="ml-auto text-[10px] text-slate-500">
          {
            orders.length
          }
        </span>
      </div>

      {orders.length ===
      0 ? (
        <div className="rounded-xl bg-white p-4 text-center text-xs text-slate-500">
          No orders found.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(
            (
              order,
              index
            ) => (
              <AIOrderCard
                key={
                  order.id ||
                  order.orderId ||
                  index
                }
                order={
                  order
                }
                onSendMessage={
                  onSendMessage
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SINGLE ORDER
|--------------------------------------------------------------------------
*/

function AISingleOrderCard({
  result,
  onSendMessage,
}: {
  result:
    AIOrderActionResult;

  onSendMessage: (
    message:
      string
  ) => Promise<void>;
}) {
  const order =
    result.order;

  if (
    !order
  ) {
    return null;
  }

  const orderId =
    order.id ||
    order.orderId ||
    "";

  const orderUrl =
    order.url ||
    `/account/orders/${orderId}`;

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
      <div className="flex items-center justify-between bg-slate-950 px-4 py-4 text-white">
        <div>
          <p className="text-[10px] text-slate-300">
            ORDER DETAILS
          </p>

          <p className="mt-1 text-sm font-bold">
            #
            {shortOrderId(
              orderId
            )}
          </p>
        </div>

        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold">
          {order.orderStatus ||
            "Unknown"}
        </span>
      </div>

      {result.message && (
        <div className="border-b bg-blue-50 px-4 py-3 text-xs text-blue-700">
          {
            result.message
          }
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[9px] uppercase text-slate-400">
            Total
          </p>

          <p className="mt-1 text-sm font-bold">
            {formatPrice(
              order.totalAmount
            )}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[9px] uppercase text-slate-400">
            Payment
          </p>

          <p className="mt-1 text-sm font-bold">
            {order.paymentStatus ||
              "Unknown"}
          </p>
        </div>
      </div>

      {order.items
        ?.length ? (
        <div className="border-t px-4 py-3">
          <p className="mb-3 text-[10px] font-bold uppercase text-slate-400">
            Products
          </p>

          <div className="space-y-2">
            {order.items.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${item.productId || index}-${index}`}
                  className="flex gap-3 rounded-xl bg-slate-50 p-2"
                >
                  <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.image ? (
                      <img
                        src={
                          item.image
                        }
                        alt={
                          item.name ||
                          "Product"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <ShoppingBag
                          size={16}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {
                        item.name
                      }
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Qty{" "}
                      {item.quantity ||
                        0}

                      {item.size &&
                        ` • ${item.size}`}

                      {item.color &&
                        ` • ${item.color}`}
                    </p>

                    <p className="mt-1 text-xs font-bold">
                      {formatPrice(
                        item.price
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : null}

      {(order.trackingNumber ||
        order.courierPartner) && (
        <div className="border-t px-4 py-3">
          {order.courierPartner && (
            <p className="text-xs text-slate-600">
              Courier:{" "}
              <strong>
                {
                  order.courierPartner
                }
              </strong>
            </p>
          )}

          {order.trackingNumber && (
            <p className="mt-1 break-all text-xs text-slate-600">
              AWB:{" "}
              <strong>
                {
                  order.trackingNumber
                }
              </strong>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 p-4">
        <button
          type="button"
          onClick={() =>
            void onSendMessage(
              `Track order ${orderId}.`
            )
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-bold text-white"
        >
          <Truck
            size={15}
          />

          Track
        </button>

        <Link
          href={
            orderUrl
          }
          className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-800"
        >
          Open Order

          <ChevronRight
            size={14}
          />
        </Link>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TRACKING
|--------------------------------------------------------------------------
*/

function AITrackingCard({
  result,
}: {
  result:
    AITrackingResult;
}) {
  if (
    result.requiresLogin
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">
          Login to view tracking.
        </p>

        <Link
          href="/login"
          className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white"
        >
          Login
        </Link>
      </div>
    );
  }

  const order =
    result.order;

  const history:
    AIDeliveryHistoryItem[] =
    Array.isArray(
      order
        ?.deliveryHistory
    )
      ? order
          ?.deliveryHistory ||
        []
      : Array.isArray(
            result.tracking
              ?.history
          )
        ? result.tracking
            ?.history ||
          []
        : [];

  const awb =
    order
      ?.trackingNumber ||
    result.tracking
      ?.awb ||
    "";

  const courier =
    order
      ?.courierPartner ||
    result.tracking
      ?.courier ||
    "";

  const currentStatus =
    order
      ?.orderStatus ||
    result.tracking
      ?.localStatus ||
    result.tracking
      ?.status ||
    "";

  return (
    <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-white">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <Truck
            size={18}
          />

          <p className="text-sm font-bold">
            Order Tracking
          </p>
        </div>

        <p className="mt-1 text-[11px] text-blue-100">
          {result.liveTracking
            ? "Live Shiprocket Tracking"
            : "Latest SilentGEN Tracking"}
        </p>
      </div>

      <div className="border-b p-4">
        {order && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-slate-400">
                Order
              </p>

              <p className="text-sm font-bold">
                #
                {shortOrderId(
                  order.id ||
                    order.orderId
                )}
              </p>
            </div>

            <span
              className={`
                rounded-full
                border
                px-2.5
                py-1
                text-[10px]
                font-bold
                ${orderStatusClass(
                  currentStatus
                )}
              `}
            >
              {currentStatus ||
                "Unknown"}
            </span>
          </div>
        )}

        {courier && (
          <p className="mt-3 text-xs text-slate-600">
            Courier:{" "}
            <strong>
              {
                courier
              }
            </strong>
          </p>
        )}

        {awb && (
          <p className="mt-1 break-all text-xs text-slate-600">
            AWB:{" "}
            <strong>
              {
                awb
              }
            </strong>
          </p>
        )}

        {result.message && (
          <p className="mt-3 text-[11px] leading-5 text-slate-500">
            {
              result.message
            }
          </p>
        )}
      </div>

      <div className="p-4">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Delivery Timeline
        </p>

        {history.length ===
        0 ? (
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            Delivery history is not available yet.
          </div>
        ) : (
          <div>
            {history.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${item.status || "status"}-${index}`}
                  className="relative flex gap-3 pb-5"
                >
                  {index <
                    history.length -
                      1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-slate-200" />
                  )}

                  <div className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 border-white bg-blue-600 shadow" />

                  <div>
                    <p className="text-xs font-bold">
                      {
                        item.status
                      }
                    </p>

                    {item.date && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(
                          item.date
                        )}
                      </p>
                    )}

                    {item.note && (
                      <p className="mt-1 text-[11px] text-slate-600">
                        {
                          item.note
                        }
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {result.shiprocketError && (
          <div className="rounded-xl bg-amber-50 p-2 text-[10px] text-amber-700">
            Live Shiprocket tracking is temporarily unavailable.
          </div>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CONFIRMATION COMMANDS
|--------------------------------------------------------------------------
|
| These messages are sent as a fresh customer turn.
|
| The backend still independently validates the pending action.
|
|--------------------------------------------------------------------------
*/

function getConfirmationYesText(
  language:
    SilentGenLanguageCode | null
) {
  switch (
    language
  ) {
    case "gu":
      return "હા, હું confirm કરું છું.";

    case "hi":
      return "हाँ, मैं confirm करता हूँ।";

    case "mr":
      return "हो, मी पुष्टी करतो.";

    case "bn":
      return "হ্যাঁ, আমি নিশ্চিত করছি।";

    case "ta":
      return "ஆம், நான் உறுதிப்படுத்துகிறேன்.";

    case "te":
      return "అవును, నేను నిర్ధారిస్తున్నాను.";

    case "kn":
      return "ಹೌದು, ನಾನು ದೃಢೀಕರಿಸುತ್ತೇನೆ.";

    case "ml":
      return "അതെ, ഞാൻ സ്ഥിരീകരിക്കുന്നു.";

    case "pa":
      return "ਹਾਂ, ਮੈਂ ਪੁਸ਼ਟੀ ਕਰਦਾ ਹਾਂ।";

    case "or":
      return "ହଁ, ମୁଁ ନିଶ୍ଚିତ କରୁଛି।";

    case "as":
      return "হয়, মই নিশ্চিত কৰিছোঁ।";

    case "ur":
      return "ہاں، میں تصدیق کرتا ہوں۔";

    case "auto":
    case "en":
    default:
      return "Yes, I confirm.";
  }
}

function getConfirmationNoText(
  language:
    SilentGenLanguageCode | null
) {
  switch (
    language
  ) {
    case "gu":
      return "ના, આ action કરશો નહીં.";

    case "hi":
      return "नहीं, यह action मत करें।";

    case "mr":
      return "नाही, ही action करू नका.";

    case "bn":
      return "না, এই action করবেন না।";

    case "ta":
      return "வேண்டாம், இந்த action செய்ய வேண்டாம்.";

    case "te":
      return "వద్దు, ఈ action చేయవద్దు.";

    case "kn":
      return "ಬೇಡ, ಈ action ಮಾಡಬೇಡಿ.";

    case "ml":
      return "വേണ്ട, ഈ action ചെയ്യരുത്.";

    case "pa":
      return "ਨਹੀਂ, ਇਹ action ਨਾ ਕਰੋ।";

    case "or":
      return "ନା, ଏହି action କରନ୍ତୁ ନାହିଁ।";

    case "as":
      return "নকৰিব, এই action নকৰিব.";

    case "ur":
      return "نہیں، یہ action مت کریں۔";

    case "auto":
    case "en":
    default:
      return "No, do not perform this action.";
  }
}

/*
|--------------------------------------------------------------------------
| CONFIRMATION
|--------------------------------------------------------------------------
*/

function AIConfirmationCard({
  confirmation,
  language,
  onSendMessage,
}: {
  confirmation:
    AIConfirmation;

  language:
    SilentGenLanguageCode | null;

  onSendMessage: (
    message:
      string
  ) => Promise<void>;
}) {
  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  async function confirmAction() {
    if (
      processing
    ) {
      return;
    }

    setProcessing(
      true
    );

    try {
      const confirmationText =
        getConfirmationYesText(
          language
        );

      /*
      |--------------------------------------------------------------------------
      | CANCEL
      |--------------------------------------------------------------------------
      */

      if (
        confirmation.tool ===
        "cancel_order"
      ) {
        const orderText =
          confirmation.orderId
            ? ` Cancel order ${confirmation.orderId}.`
            : "";

        await onSendMessage(
          `${confirmationText}${orderText}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | RETURN
      |--------------------------------------------------------------------------
      |
      | NEVER invent a fallback reason.
      |
      |--------------------------------------------------------------------------
      */

      if (
        confirmation.tool ===
        "request_return"
      ) {
        const orderText =
          confirmation.orderId
            ? ` Submit the return request for order ${confirmation.orderId}.`
            : " Submit the pending return request.";

        const reasonText =
          confirmation.reason
            ? ` Reason: ${confirmation.reason}.`
            : "";

        await onSendMessage(
          `${confirmationText}${orderText}${reasonText}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | EXCHANGE
      |--------------------------------------------------------------------------
      |
      | NEVER invent a fallback reason.
      |
      |--------------------------------------------------------------------------
      */

      if (
        confirmation.tool ===
        "request_exchange"
      ) {
        const orderText =
          confirmation.orderId
            ? ` Submit the exchange request for order ${confirmation.orderId}.`
            : " Submit the pending exchange request.";

        const reasonText =
          confirmation.reason
            ? ` Reason: ${confirmation.reason}.`
            : "";

        await onSendMessage(
          `${confirmationText}${orderText}${reasonText}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | CLEAR STYLE
      |--------------------------------------------------------------------------
      */

      if (
        confirmation.tool ===
        "clear_style_profile"
      ) {
        await onSendMessage(
          `${confirmationText} Clear all my saved AI style preferences.`
        );

        return;
      }

      await onSendMessage(
        confirmationText
      );
    } finally {
      setProcessing(
        false
      );
    }
  }

  async function declineAction() {
    if (
      processing
    ) {
      return;
    }

    setProcessing(
      true
    );

    try {
      await onSendMessage(
        getConfirmationNoText(
          language
        )
      );
    } finally {
      setProcessing(
        false
      );
    }
  }

  return (
    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <RefreshCcw
            size={17}
          />
        </div>

        <div>
          <p className="text-sm font-bold text-amber-950">
            Confirmation Required
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            {confirmation.message ||
              "Please confirm this action."}
          </p>

          {confirmation.reason && (
            <p className="mt-2 rounded-lg bg-white/70 px-2.5 py-2 text-[10px] text-amber-900">
              Reason:{" "}
              {
                confirmation.reason
              }
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={
            processing
          }
          onClick={() =>
            void declineAction()
          }
          className="rounded-xl border border-amber-300 bg-white py-2.5 text-xs font-bold text-amber-900 disabled:opacity-50"
        >
          No
        </button>

        <button
          type="button"
          disabled={
            processing
          }
          onClick={() =>
            void confirmAction()
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {processing && (
            <Loader2
              size={13}
              className="animate-spin"
            />
          )}

          Yes, Confirm
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

export default function SilentGenAI() {
  const pathname =
    usePathname();

  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false);

  const [
    isMinimized,
    setIsMinimized,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    conversationId,
    setConversationId,
  ] =
    useState<
      string | null
    >(null);

  const [
    sessionId,
    setSessionId,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | LANGUAGE
  |--------------------------------------------------------------------------
  */

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] =
    useState<
      SilentGenLanguageCode | null
    >(null);

  const [
    languageLoaded,
    setLanguageLoaded,
  ] =
    useState(false);

  const [
    showLanguageSelector,
    setShowLanguageSelector,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CHAT
  |--------------------------------------------------------------------------
  */

  const [
    messages,
    setMessages,
  ] =
    useState<
      AIMessage[]
    >([]);

  const [
    liveCart,
    setLiveCart,
  ] =
    useState<
      AICart | null
    >(null);

  const [
    latestStyleProfile,
    setLatestStyleProfile,
  ] =
    useState<
      AIStyleProfile | null
    >(null);

  const bottomRef =
    useRef<
      HTMLDivElement | null
    >(null);

  const shouldHide =
    useMemo(
      () =>
        pathname.startsWith(
          "/admin"
        ),
      [
        pathname,
      ]
    );

  const selectedLanguageInfo =
    useMemo(
      () => {
        if (
          !selectedLanguage
        ) {
          return null;
        }

        return getSilentGenLanguage(
          selectedLanguage
        );
      },
      [
        selectedLanguage,
      ]
    );

  const quickPrompts =
    useMemo(
      () =>
        selectedLanguage
          ? getQuickPrompts(
              selectedLanguage
            )
          : [],
      [
        selectedLanguage,
      ]
    );

  const inputPlaceholder =
    useMemo(
      () =>
        selectedLanguage
          ? getInputPlaceholder(
              selectedLanguage
            )
          : "Ask SilentGEN AI...",
      [
        selectedLanguage,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD SESSION + LANGUAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      let savedSession =
        localStorage.getItem(
          SESSION_STORAGE_KEY
        );

      if (
        !savedSession
      ) {
        savedSession =
          createSessionId();

        localStorage.setItem(
          SESSION_STORAGE_KEY,
          savedSession
        );
      }

      setSessionId(
        savedSession
      );

      const savedConversation =
        localStorage.getItem(
          CONVERSATION_STORAGE_KEY
        );

      if (
        savedConversation
      ) {
        setConversationId(
          savedConversation
        );
      }

      const savedLanguage =
        localStorage.getItem(
          LANGUAGE_STORAGE_KEY
        );

      if (
        isSilentGenLanguageCode(
          savedLanguage
        )
      ) {
        setSelectedLanguage(
          savedLanguage
        );

        setMessages([
          createWelcomeMessage(
            savedLanguage
          ),
        ]);

        setShowLanguageSelector(
          false
        );
      } else {
        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | null = first-time customer has NOT selected a language.
        |
        | Do NOT silently default this to "auto".
        |
        |--------------------------------------------------------------------------
        */

        setSelectedLanguage(
          null
        );

        setMessages([]);

        setShowLanguageSelector(
          true
        );
      }
    } catch {
      const newSession =
        createSessionId();

      setSessionId(
        newSession
      );

      setSelectedLanguage(
        null
      );

      setMessages([]);

      setShowLanguageSelector(
        true
      );
    } finally {
      setLanguageLoaded(
        true
      );
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | SELECT LANGUAGE
  |--------------------------------------------------------------------------
  */

  function selectLanguage(
    language:
      SilentGenLanguageCode
  ) {
    setSelectedLanguage(
      language
    );

    setShowLanguageSelector(
      false
    );

    try {
      localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        language
      );
    } catch {
      //
    }

    setMessages(
      (
        previous
      ) => {
        const hasConversation =
          previous.some(
            (
              item
            ) =>
              !item.id.startsWith(
                "welcome-"
              )
          );

        /*
        |--------------------------------------------------------------------------
        | CHANGING LANGUAGE MID-CHAT
        |--------------------------------------------------------------------------
        |
        | Do not insert another welcome message.
        |
        |--------------------------------------------------------------------------
        */

        if (
          hasConversation
        ) {
          return previous;
        }

        return [
          createWelcomeMessage(
            language
          ),
        ];
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REFRESH CART
  |--------------------------------------------------------------------------
  */

  const refreshCart =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/cart/list",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          const data =
            await readJsonSafe(
              response
            );

          if (
            response.status ===
            401
          ) {
            setLiveCart({
              success:
                false,

              requiresLogin:
                true,

              items:
                [],

              summary: {
                totalItems:
                  0,

                subtotal:
                  0,

                shipping:
                  0,

                grandTotal:
                  0,
              },
            });

            return;
          }

          if (
            !response.ok
          ) {
            return;
          }

          const items:
            AICartItem[] =
            Array.isArray(
              data?.items
            )
              ? data.items.map(
                  (
                    item:
                      any
                  ) => ({
                    productId:
                      String(
                        item.productId ||
                          ""
                      ),

                    sku:
                      String(
                        item.sku ||
                          ""
                      ),

                    name:
                      String(
                        item.name ||
                          ""
                      ),

                    category:
                      String(
                        item.category ||
                          ""
                      ),

                    brand:
                      String(
                        item.brand ||
                          ""
                      ),

                    image:
                      String(
                        item.image ||
                          ""
                      ),

                    price:
                      Number(
                        item.price ||
                          0
                      ),

                    stock:
                      Number(
                        item.stock ||
                          0
                      ),

                    quantity:
                      Number(
                        item.quantity ||
                          0
                      ),

                    size:
                      String(
                        item.size ||
                          ""
                      ),

                    color:
                      String(
                        item.color ||
                          ""
                      ),

                    url:
                      `/product/${String(
                        item.productId ||
                          ""
                      )}`,
                  })
                )
              : [];

          setLiveCart({
            success:
              data?.success !==
              false,

            message:
              data?.message ||
              "",

            requiresLogin:
              false,

            items,

            summary:
              data?.summary ||
              {
                totalItems:
                  items.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.quantity ||
                          0
                      ),
                    0
                  ),

                subtotal:
                  0,

                shipping:
                  0,

                grandTotal:
                  0,
              },
          });
        } catch {
          //
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | CART EVENTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    function handleCartUpdate() {
      if (
        !isOpen
      ) {
        return;
      }

      void refreshCart();
    }

    window.addEventListener(
      "cart-updated",
      handleCartUpdate
    );

    window.addEventListener(
      "silentgen-cart-updated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdate
      );

      window.removeEventListener(
        "silentgen-cart-updated",
        handleCartUpdate
      );
    };
  }, [
    isOpen,
    refreshCart,
  ]);

  /*
  |--------------------------------------------------------------------------
  | AUTO SCROLL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !isOpen ||
      showLanguageSelector
    ) {
      return;
    }

    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }, [
    messages,
    isLoading,
    isOpen,
    liveCart,
    showLanguageSelector,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SEND MESSAGE
  |--------------------------------------------------------------------------
  */

  const sendMessage =
    useCallback(
      async (
        text:
          string
      ) => {
        const clean =
          text.trim();

        if (
          !clean ||
          isLoading
        ) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | FIRST-TIME LANGUAGE SELECTION
        |--------------------------------------------------------------------------
        */

        if (
          !selectedLanguage
        ) {
          setShowLanguageSelector(
            true
          );

          return;
        }

        let currentSession =
          sessionId;

        if (
          !currentSession
        ) {
          currentSession =
            createSessionId();

          setSessionId(
            currentSession
          );

          try {
            localStorage.setItem(
              SESSION_STORAGE_KEY,
              currentSession
            );
          } catch {
            //
          }
        }

        setMessages(
          (
            previous
          ) => [
            ...previous,

            {
              id:
                createId(),

              role:
                "user",

              content:
                clean,
            },
          ]
        );

        setMessage("");

        setIsLoading(
          true
        );

        try {
          const response =
            await fetch(
              "/api/ai/chat",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                credentials:
                  "include",

                body:
                  JSON.stringify(
                    {
                      message:
                        clean,

                      conversationId:
                        conversationId ||
                        undefined,

                      sessionId:
                        currentSession,

                      currentPath:
                        pathname,

                      /*
                      |--------------------------------------------------------------------------
                      | CANONICAL LANGUAGE FIELD
                      |--------------------------------------------------------------------------
                      */

                      languagePreference:
                        selectedLanguage,
                    }
                  ),
              }
            );

          const data =
            (
              await readJsonSafe(
                response
              )
            ) as
              | AIChatResponse
              | null;

          if (
            !response.ok ||
            !data?.success
          ) {
            throw new Error(
              data?.message ||
                "SilentGEN AI request failed."
            );
          }

          /*
          |--------------------------------------------------------------------------
          | BACKEND LANGUAGE UPDATE
          |--------------------------------------------------------------------------
          */

          if (
            data.languagePreference &&
            isSilentGenLanguageCode(
              data.languagePreference
            )
          ) {
            if (
              data.languagePreference !==
              selectedLanguage
            ) {
              setSelectedLanguage(
                data.languagePreference
              );

              try {
                localStorage.setItem(
                  LANGUAGE_STORAGE_KEY,
                  data.languagePreference
                );
              } catch {
                //
              }
            }
          }

          /*
          |--------------------------------------------------------------------------
          | SESSION
          |--------------------------------------------------------------------------
          */

          if (
            data.sessionId
          ) {
            setSessionId(
              data.sessionId
            );

            try {
              localStorage.setItem(
                SESSION_STORAGE_KEY,
                data.sessionId
              );
            } catch {
              //
            }
          }

          /*
          |--------------------------------------------------------------------------
          | CONVERSATION
          |--------------------------------------------------------------------------
          */

          if (
            data.conversationId
          ) {
            setConversationId(
              data.conversationId
            );

            try {
              localStorage.setItem(
                CONVERSATION_STORAGE_KEY,
                data.conversationId
              );
            } catch {
              //
            }
          }

          /*
          |--------------------------------------------------------------------------
          | CART
          |--------------------------------------------------------------------------
          */

          if (
            data.cart
          ) {
            setLiveCart(
              data.cart
            );
          }

          /*
          |--------------------------------------------------------------------------
          | STYLE PROFILE
          |--------------------------------------------------------------------------
          */

          if (
            data.styleProfile !==
            undefined
          ) {
            setLatestStyleProfile(
              data.styleProfile ||
                null
            );
          }

          /*
          |--------------------------------------------------------------------------
          | ASSISTANT MESSAGE
          |--------------------------------------------------------------------------
          */

          const assistantMessage:
            AIMessage = {
            id:
              createId(),

            role:
              "assistant",

            content:
              data.message ||
              "I could not generate a response.",

            products:
              Array.isArray(
                data.products
              )
                ? data.products
                : [],

            outfit:
              data.outfit ||
              null,

            cart:
              data.cart ||
              null,

            orders:
              data.orders ||
              null,

            order:
              data.order ||
              null,

            tracking:
              data.tracking ||
              null,

            confirmation:
              data.confirmation ||
              null,

            styleProfile:
              data.styleProfile ||
              null,

            styleProfileAction:
              data.styleProfileAction ||
              null,
          };

          setMessages(
            (
              previous
            ) => [
              ...previous,
              assistantMessage,
            ]
          );
        } catch (
          error
        ) {
          const errorMessage =
            error instanceof
            Error
              ? error.message
              : "Unknown error";

          setMessages(
            (
              previous
            ) => [
              ...previous,

              {
                id:
                  createId(),

                role:
                  "assistant",

                content:
                  `Unable to connect to SilentGEN AI.\n\n${errorMessage}`,
              },
            ]
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        conversationId,
        isLoading,
        pathname,
        selectedLanguage,
        sessionId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  function handleSubmit(
    event:
      FormEvent
  ) {
    event.preventDefault();

    void sendMessage(
      message
    );
  }

  function handleKeyDown(
    event:
      KeyboardEvent<
        HTMLTextAreaElement
      >
  ) {
    if (
      event.key ===
        "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage(
        message
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | NEW CHAT
  |--------------------------------------------------------------------------
  */

  function startNewChat() {
    const newSession =
      createSessionId();

    setConversationId(
      null
    );

    setSessionId(
      newSession
    );

    setLiveCart(
      null
    );

    setMessage("");

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | latestStyleProfile is intentionally NOT cleared.
    |
    | Saved customer style memory belongs to account, not conversation.
    |
    |--------------------------------------------------------------------------
    */

    if (
      selectedLanguage
    ) {
      setMessages([
        createWelcomeMessage(
          selectedLanguage
        ),
      ]);

      setShowLanguageSelector(
        false
      );
    } else {
      setMessages([]);

      setShowLanguageSelector(
        true
      );
    }

    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        newSession
      );

      localStorage.removeItem(
        CONVERSATION_STORAGE_KEY
      );
    } catch {
      //
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN HIDE
  |--------------------------------------------------------------------------
  */

  if (
    shouldHide
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSED
  |--------------------------------------------------------------------------
  */

  if (
    !isOpen
  ) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsOpen(
            true
          );

          setIsMinimized(
            false
          );
        }}
        className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 rounded-full bg-slate-950 px-4 py-3 text-white shadow-2xl transition hover:bg-blue-700"
      >
        <Sparkles
          size={20}
        />

        <div className="hidden text-left sm:block">
          <p className="text-sm font-bold">
            SilentGEN AI
          </p>

          <p className="text-[11px] text-slate-300">
            Personal Shopping Stylist
          </p>
        </div>
      </button>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MINIMIZED
  |--------------------------------------------------------------------------
  */

  if (
    isMinimized
  ) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2 rounded-full bg-slate-950 p-2 text-white shadow-2xl">
        <button
          type="button"
          onClick={() =>
            setIsMinimized(
              false
            )
          }
          className="flex items-center gap-2 px-3 py-2"
        >
          <MessageCircle
            size={18}
          />

          SilentGEN AI
        </button>

        <button
          type="button"
          onClick={() =>
            setIsOpen(
              false
            )
          }
          className="rounded-full bg-white/10 p-2"
        >
          <X
            size={17}
          />
        </button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | WINDOW
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed inset-x-3 bottom-3 z-[9999] flex h-[min(800px,calc(100dvh-24px))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[760px] sm:w-[450px]">
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <header className="bg-slate-950 px-4 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
              <Bot
                size={23}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-bold">
                  SilentGEN AI
                </h2>

                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>

              <p className="truncate text-[11px] text-slate-300">
                Personal Stylist • Shopping • Orders
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              title="Change language"
              onClick={() =>
                setShowLanguageSelector(
                  true
                )
              }
              className="rounded-full p-2 hover:bg-white/10"
            >
              <Languages
                size={16}
              />
            </button>

            <button
              type="button"
              title="My Style"
              disabled={
                isLoading ||
                !selectedLanguage
              }
              onClick={() =>
                void sendMessage(
                  "Show my saved style preferences."
                )
              }
              className="rounded-full p-2 hover:bg-white/10 disabled:opacity-40"
            >
              <UserRound
                size={16}
              />
            </button>

            <button
              type="button"
              title="New chat"
              onClick={
                startNewChat
              }
              className="rounded-full p-2 hover:bg-white/10"
            >
              <RotateCcw
                size={16}
              />
            </button>

            <button
              type="button"
              title="Minimize"
              onClick={() =>
                setIsMinimized(
                  true
                )
              }
              className="rounded-full p-2 hover:bg-white/10"
            >
              <Minimize2
                size={16}
              />
            </button>

            <button
              type="button"
              title="Close"
              onClick={() =>
                setIsOpen(
                  false
                )
              }
              className="rounded-full p-2 hover:bg-white/10"
            >
              <X
                size={17}
              />
            </button>
          </div>
        </div>

        {selectedLanguage &&
          selectedLanguageInfo && (
            <button
              type="button"
              onClick={() =>
                setShowLanguageSelector(
                  true
                )
              }
              className="mt-3 flex w-full items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-left transition hover:bg-white/10"
            >
              <Languages
                size={13}
                className="text-blue-300"
              />

              <p className="min-w-0 flex-1 truncate text-[10px] text-slate-300">
                Language:{" "}
                {selectedLanguageInfo
                  .displayName ||
                  selectedLanguageInfo
                    .nativeName ||
                  selectedLanguageInfo
                    .name}
              </p>

              <ChevronRight
                size={12}
                className="text-slate-400"
              />
            </button>
          )}

        {latestStyleProfile &&
          !showLanguageSelector && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
              <UserRound
                size={13}
                className="text-violet-300"
              />

              <p className="min-w-0 flex-1 truncate text-[10px] text-slate-300">
                Style memory{" "}
                {latestStyleProfile
                  .personalizationEnabled
                  ? "active"
                  : "paused"}

                {latestStyleProfile
                  .preferredSizes
                  .length >
                  0 &&
                  ` • Size ${latestStyleProfile.preferredSizes[0]}`}

                {latestStyleProfile
                  .preferredColors
                  .length >
                  0 &&
                  ` • ${latestStyleProfile.preferredColors
                    .slice(
                      0,
                      2
                    )
                    .join(
                      ", "
                    )}`}
              </p>
            </div>
          )}
      </header>

      {/*
      |--------------------------------------------------------------------------
      | LANGUAGE LOADING
      |--------------------------------------------------------------------------
      */}

      {!languageLoaded ? (
        <div className="flex flex-1 items-center justify-center bg-white">
          <div className="text-center">
            <Loader2
              size={24}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-xs text-slate-500">
              Loading SilentGEN AI...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/*
          |--------------------------------------------------------------------------
          | CONTENT
          |--------------------------------------------------------------------------
          */}

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {showLanguageSelector && (
                <AILanguageSelector
                  selectedLanguage={
                    selectedLanguage
                  }
                  onSelect={
                    selectLanguage
                  }
                />
              )}

              {!showLanguageSelector &&
                messages.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.id
                      }
                      className="space-y-3"
                    >
                      <MessageBubble
                        message={
                          item
                        }
                      />

                      {item.role ===
                        "assistant" &&
                        (item.styleProfile ||
                          item
                            .styleProfileAction
                            ?.requiresLogin) && (
                          <AIStyleProfileCard
                            profile={
                              item.styleProfile ||
                              null
                            }
                            action={
                              item.styleProfileAction ||
                              null
                            }
                            onSendMessage={
                              sendMessage
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        item.outfit && (
                          <AIOutfitCard
                            outfit={
                              item.outfit
                            }
                            onCartUpdated={
                              refreshCart
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        !item.outfit &&
                        item.products &&
                        item.products
                          .length >
                          0 && (
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {item.products.map(
                              (
                                product
                              ) => (
                                <AIProductCard
                                  key={
                                    product.id
                                  }
                                  product={
                                    product
                                  }
                                />
                              )
                            )}
                          </div>
                        )}

                      {item.role ===
                        "assistant" &&
                        item.cart &&
                        item.cart
                          .requiresLogin && (
                          <AIMiniCart
                            cart={
                              item.cart
                            }
                            onCartUpdated={
                              refreshCart
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        item.orders && (
                          <AIOrdersCard
                            result={
                              item.orders
                            }
                            onSendMessage={
                              sendMessage
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        item.order
                          ?.order && (
                          <AISingleOrderCard
                            result={
                              item.order
                            }
                            onSendMessage={
                              sendMessage
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        item.tracking && (
                          <AITrackingCard
                            result={
                              item.tracking
                            }
                          />
                        )}

                      {item.role ===
                        "assistant" &&
                        item.confirmation
                          ?.required && (
                          <AIConfirmationCard
                            confirmation={
                              item.confirmation
                            }
                            language={
                              selectedLanguage
                            }
                            onSendMessage={
                              sendMessage
                            }
                          />
                        )}
                    </div>
                  )
                )}

              {!showLanguageSelector &&
                liveCart && (
                  <AIMiniCart
                    cart={
                      liveCart
                    }
                    onCartUpdated={
                      refreshCart
                    }
                  />
                )}

              {selectedLanguage &&
                !showLanguageSelector &&
                messages.length ===
                  1 &&
                !isLoading && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Try asking
                    </p>

                    {quickPrompts.map(
                      (
                        prompt
                      ) => (
                        <button
                          type="button"
                          key={
                            prompt
                          }
                          onClick={() =>
                            void sendMessage(
                              prompt
                            )
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                        >
                          <span>
                            {
                              prompt
                            }
                          </span>

                          <ChevronRight
                            size={15}
                            className="shrink-0"
                          />
                        </button>
                      )
                    )}
                  </div>
                )}

              {isLoading &&
                !showLanguageSelector && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-xs text-slate-500">
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />

                      SilentGEN AI is thinking...
                    </div>
                  </div>
                )}

              <div
                ref={
                  bottomRef
                }
              />
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | INPUT
          |--------------------------------------------------------------------------
          */}

          {selectedLanguage &&
            !showLanguageSelector && (
              <div className="border-t border-slate-200 bg-white p-3">
                <form
                  onSubmit={
                    handleSubmit
                  }
                >
                  <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                    <textarea
                      value={
                        message
                      }
                      onChange={(
                        event
                      ) =>
                        setMessage(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      rows={1}
                      maxLength={
                        4000
                      }
                      placeholder={
                        inputPlaceholder
                      }
                      disabled={
                        isLoading
                      }
                      className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
                    />

                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !message.trim()
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-blue-700 disabled:opacity-40"
                    >
                      {isLoading ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Send
                          size={16}
                        />
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                  <Sparkles
                    size={11}
                  />

                  AI uses real SilentGEN product, style, cart,
                  order and tracking data.
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}