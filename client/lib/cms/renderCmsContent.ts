type CmsSettings = {
  storeName?: string;

  businessName?: string;

  businessAddress?: string;

  legalBusinessName?: string;

  supportEmail?: string;

  contactEmail?: string;

  orderEmail?: string;

  returnRefundEmail?: string;

  supportMobile?: string;

  customerCareNumber?: string;

  productQueryNumber?: string;

  deliveryQueryNumber?: string;

  paymentRefundNumber?: string;

  whatsappNumber?: string;

  supportHours?: string;

  gstNumber?: string;

  currency?: string;

  returnDays?: number;

  exchangeDays?: number;

  shippingCharge?: number;

  freeShippingMinimum?: number;
};

/*
|--------------------------------------------------------------------------
| ESCAPE REGEX
|--------------------------------------------------------------------------
*/

function escapeRegExp(
  value: string
) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/*
|--------------------------------------------------------------------------
| TO TEXT
|--------------------------------------------------------------------------
*/

function toText(
  value:
    | string
    | number
    | undefined
    | null
) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
}

/*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

export function renderCmsContent(
  content: string,
  settings: CmsSettings
) {
  let renderedContent =
    content || "";

  const businessName =
    settings.businessName ||
    settings.storeName ||
    "";

  const replacements:
    Record<string, string> = {
      storeName:
        toText(
          settings.storeName
        ),

      businessName:
        toText(
          businessName
        ),

      businessAddress:
        toText(
          settings.businessAddress
        ),

      legalBusinessName:
        toText(
          settings.legalBusinessName
        ),

      gstNumber:
        toText(
          settings.gstNumber
        ),

      supportEmail:
        toText(
          settings.supportEmail
        ),

      contactEmail:
        toText(
          settings.contactEmail
        ),

      orderEmail:
        toText(
          settings.orderEmail
        ),

      returnRefundEmail:
        toText(
          settings.returnRefundEmail
        ),

      supportMobile:
        toText(
          settings.supportMobile
        ),

      customerCareNumber:
        toText(
          settings.customerCareNumber
        ),

      productQueryNumber:
        toText(
          settings.productQueryNumber
        ),

      deliveryQueryNumber:
        toText(
          settings.deliveryQueryNumber
        ),

      paymentRefundNumber:
        toText(
          settings.paymentRefundNumber
        ),

      whatsappNumber:
        toText(
          settings.whatsappNumber
        ),

      supportHours:
        toText(
          settings.supportHours
        ),

      currency:
        toText(
          settings.currency
        ),

      returnDays:
        toText(
          settings.returnDays
        ),

      exchangeDays:
        toText(
          settings.exchangeDays
        ),

      shippingCharge:
        toText(
          settings.shippingCharge
        ),

      freeShippingMinimum:
        toText(
          settings.freeShippingMinimum
        ),
    };

  for (
    const [key, value]
    of Object.entries(
      replacements
    )
  ) {
    const expression =
      new RegExp(
        `{{\\s*${escapeRegExp(
          key
        )}\\s*}}`,
        "g"
      );

    renderedContent =
      renderedContent.replace(
        expression,
        value
      );
  }

  return renderedContent;
}

export default renderCmsContent;