/*
|--------------------------------------------------------------------------
| DEFAULT CMS PAGES
|--------------------------------------------------------------------------
|
| આ pages MongoDB માં first time automatic create થશે.
|
| IMPORTANT:
| Existing page/content overwrite કરવામાં આવશે નહીં.
|
|--------------------------------------------------------------------------
*/

export type DefaultCmsPage = {
  title: string;
  slug: string;

  section:
    | "help"
    | "policy";

  pageType:
    | "content"
    | "external"
    | "whatsapp";

  content: string;

  shortDescription: string;

  status:
    | "Published"
    | "Draft";

  sortOrder: number;

  seoTitle: string;

  seoDescription: string;

  externalUrl: string;

  whatsappNumber: string;

  whatsappMessage: string;

  icon: string;

  isSystem: boolean;
};

/*
|--------------------------------------------------------------------------
| HELP & SUPPORT
|--------------------------------------------------------------------------
*/

const helpPages: DefaultCmsPage[] = [
  {
    title: "Contact Us",

    slug: "contact-us",

    section: "help",

    pageType: "content",

    shortDescription:
      "Get in touch with SilentGEN customer support.",

    content: `
<h1>Contact Us</h1>

<p>
Need help? Our customer support team is here to assist you.
</p>

<h2>Email Support</h2>

<p>
General Support:
<a href="mailto:{{supportEmail}}">
{{supportEmail}}
</a>
</p>

<p>
Contact:
<a href="mailto:{{contactEmail}}">
{{contactEmail}}
</a>
</p>

<h2>Customer Care</h2>

<p>
{{customerCareNumber}}
</p>

<h2>WhatsApp</h2>

<p>
{{whatsappNumber}}
</p>

<h2>Support Hours</h2>

<p>
{{supportHours}}
</p>

<h2>Business Address</h2>

<p>
{{businessAddress}}
</p>
`.trim(),

    status: "Published",

    sortOrder: 1,

    seoTitle:
      "Contact SilentGEN",

    seoDescription:
      "Contact SilentGEN customer support for product, order, delivery, return and payment assistance.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "headphones",

    isSystem: true,
  },

  {
    title: "Size Guide",

    slug: "size-guide",

    section: "help",

    pageType: "content",

    shortDescription:
      "Find the right SilentGEN size.",

    content: `
<h1>Size Guide</h1>

<p>
Use this guide to select the correct size before placing your order.
</p>

<h2>Important</h2>

<p>
Actual measurements may vary slightly depending on product style,
fabric and fit.
</p>

<p>
For size related assistance, contact us at
<a href="mailto:{{supportEmail}}">
{{supportEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 2,

    seoTitle:
      "SilentGEN Size Guide",

    seoDescription:
      "Check the SilentGEN size guide before purchasing your product.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "ruler",

    isSystem: true,
  },

  {
    title: "FAQ",

    slug: "faq",

    section: "help",

    pageType: "content",

    shortDescription:
      "Frequently asked questions about SilentGEN.",

    content: `
<h1>Frequently Asked Questions</h1>

<h2>How can I place an order?</h2>

<p>
Select your product, choose the required options and complete checkout.
</p>

<h2>How can I track my order?</h2>

<p>
You can check your order status from your SilentGEN account.
</p>

<h2>Need more help?</h2>

<p>
Contact
<a href="mailto:{{supportEmail}}">
{{supportEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 3,

    seoTitle:
      "SilentGEN FAQ",

    seoDescription:
      "Frequently asked questions about SilentGEN orders, products, delivery and support.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "circle-help",

    isSystem: true,
  },

  {
    title: "WhatsApp",

    slug: "whatsapp",

    section: "help",

    pageType: "whatsapp",

    shortDescription:
      "Chat with SilentGEN on WhatsApp.",

    content: "",

    status: "Published",

    sortOrder: 4,

    seoTitle: "",

    seoDescription: "",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage:
      "Hello SilentGEN, I need help.",

    icon: "message-circle",

    isSystem: true,
  },

  {
    title: "Product Query",

    slug: "product-query",

    section: "help",

    pageType: "content",

    shortDescription:
      "Need more information about a SilentGEN product?",

    content: `
<h1>Product Query</h1>

<p>
For product details, size, color, stock or other product-related
questions, please contact our support team.
</p>

<p>
Email:
<a href="mailto:{{supportEmail}}">
{{supportEmail}}
</a>
</p>

<p>
WhatsApp:
{{whatsappNumber}}
</p>
`.trim(),

    status: "Published",

    sortOrder: 5,

    seoTitle:
      "SilentGEN Product Query",

    seoDescription:
      "Contact SilentGEN for product related questions.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "shirt",

    isSystem: true,
  },

  {
    title: "Delivery Query",

    slug: "delivery-query",

    section: "help",

    pageType: "content",

    shortDescription:
      "Get help regarding your SilentGEN delivery.",

    content: `
<h1>Delivery Query</h1>

<p>
For shipment, tracking or delivery related questions,
please contact our order support team.
</p>

<p>
Order Support:
<a href="mailto:{{orderEmail}}">
{{orderEmail}}
</a>
</p>

<p>
Customer Care:
{{customerCareNumber}}
</p>
`.trim(),

    status: "Published",

    sortOrder: 6,

    seoTitle:
      "SilentGEN Delivery Support",

    seoDescription:
      "Get assistance with SilentGEN shipping, tracking and delivery.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "truck",

    isSystem: true,
  },

  {
    title: "Payment & Refund",

    slug: "payment-refund",

    section: "help",

    pageType: "content",

    shortDescription:
      "Payment and refund assistance.",

    content: `
<h1>Payment & Refund</h1>

<p>
For payment, refund or transaction related assistance,
please contact:
</p>

<p>
<a href="mailto:{{returnRefundEmail}}">
{{returnRefundEmail}}
</a>
</p>

<p>
Please include your order number when contacting our support team.
</p>
`.trim(),

    status: "Published",

    sortOrder: 7,

    seoTitle:
      "SilentGEN Payment & Refund Support",

    seoDescription:
      "Get payment and refund assistance for your SilentGEN order.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "wallet-cards",

    isSystem: true,
  },
];

/*
|--------------------------------------------------------------------------
| POLICY PAGES
|--------------------------------------------------------------------------
|
| હાલમાં starter content રાખેલું છે.
|
| તમે actual policy મોકલશો ત્યારે content replace કરીશું.
|
|--------------------------------------------------------------------------
*/

const policyPages: DefaultCmsPage[] = [
  {
    title: "Shipping Policy",

    slug: "shipping-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN shipping and delivery policy.",

    content: `
<h1>Shipping Policy</h1>

<p>
This Shipping Policy explains how SilentGEN processes
and delivers customer orders.
</p>

<p>
The complete Shipping Policy will be updated here.
</p>

<p>
For shipping related questions contact
<a href="mailto:{{orderEmail}}">
{{orderEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 1,

    seoTitle:
      "SilentGEN Shipping Policy",

    seoDescription:
      "Read the SilentGEN shipping and delivery policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "truck",

    isSystem: true,
  },

  {
    title: "Return Policy",

    slug: "return-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN product return policy.",

    content: `
<h1>Return Policy</h1>

<p>
This page contains SilentGEN's product return terms and conditions.
</p>

<p>
The complete Return Policy will be updated here.
</p>

<p>
Return related queries:
<a href="mailto:{{returnRefundEmail}}">
{{returnRefundEmail}}
</a>
</p>
`.trim(),

    status: "Published",

    sortOrder: 2,

    seoTitle:
      "SilentGEN Return Policy",

    seoDescription:
      "Read the SilentGEN return policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "rotate-ccw",

    isSystem: true,
  },

  {
    title: "Exchange Policy",

    slug: "exchange-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN product exchange policy.",

    content: `
<h1>Exchange Policy</h1>

<p>
This page contains SilentGEN's exchange terms and conditions.
</p>

<p>
The complete Exchange Policy will be updated here.
</p>

<p>
For assistance contact
<a href="mailto:{{supportEmail}}">
{{supportEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 3,

    seoTitle:
      "SilentGEN Exchange Policy",

    seoDescription:
      "Read the SilentGEN product exchange policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "repeat-2",

    isSystem: true,
  },

  {
    title: "Cancellation Policy",

    slug: "cancellation-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN order cancellation policy.",

    content: `
<h1>Cancellation Policy</h1>

<p>
This page explains SilentGEN's order cancellation terms.
</p>

<p>
The complete Cancellation Policy will be updated here.
</p>

<p>
For order assistance contact
<a href="mailto:{{orderEmail}}">
{{orderEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 4,

    seoTitle:
      "SilentGEN Cancellation Policy",

    seoDescription:
      "Read the SilentGEN order cancellation policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "circle-x",

    isSystem: true,
  },

  {
    title: "Refund Policy",

    slug: "refund-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN refund policy.",

    content: `
<h1>Refund Policy</h1>

<p>
This page contains SilentGEN's refund terms and conditions.
</p>

<p>
The complete Refund Policy will be updated here.
</p>

<p>
Refund assistance:
<a href="mailto:{{returnRefundEmail}}">
{{returnRefundEmail}}
</a>
</p>
`.trim(),

    status: "Published",

    sortOrder: 5,

    seoTitle:
      "SilentGEN Refund Policy",

    seoDescription:
      "Read the SilentGEN refund policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "badge-indian-rupee",

    isSystem: true,
  },

  {
    title: "Privacy Policy",

    slug: "privacy-policy",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN privacy policy.",

    content: `
<h1>Privacy Policy</h1>

<p>
This page explains how SilentGEN handles customer information.
</p>

<p>
The complete Privacy Policy will be updated here.
</p>

<p>
For privacy related questions contact
<a href="mailto:{{contactEmail}}">
{{contactEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 6,

    seoTitle:
      "SilentGEN Privacy Policy",

    seoDescription:
      "Read the SilentGEN privacy policy.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "shield-check",

    isSystem: true,
  },

  {
    title: "Terms & Conditions",

    slug: "terms-conditions",

    section: "policy",

    pageType: "content",

    shortDescription:
      "SilentGEN website terms and conditions.",

    content: `
<h1>Terms & Conditions</h1>

<p>
These terms govern the use of SilentGEN's website,
products and services.
</p>

<p>
The complete Terms & Conditions will be updated here.
</p>

<p>
For questions contact
<a href="mailto:{{contactEmail}}">
{{contactEmail}}
</a>.
</p>
`.trim(),

    status: "Published",

    sortOrder: 7,

    seoTitle:
      "SilentGEN Terms & Conditions",

    seoDescription:
      "Read the SilentGEN terms and conditions.",

    externalUrl: "",

    whatsappNumber: "",

    whatsappMessage: "",

    icon: "file-text",

    isSystem: true,
  },
];

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export const DEFAULT_CMS_PAGES: DefaultCmsPage[] = [
  ...helpPages,
  ...policyPages,
];