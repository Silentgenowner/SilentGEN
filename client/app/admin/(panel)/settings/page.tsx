"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WalletCards,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| SETTINGS TYPE
|--------------------------------------------------------------------------
*/

type Settings = {
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
  | CONTACT / EMAIL
  |--------------------------------------------------------------------------
  */

  supportEmail: string;
  contactEmail: string;
  orderEmail: string;
  returnRefundEmail: string;

  supportMobile: string;
  customerCareNumber: string;

  /*
  |--------------------------------------------------------------------------
  | QUERY NUMBERS
  |--------------------------------------------------------------------------
  */

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
  | STOCK
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
};

/*
|--------------------------------------------------------------------------
| DEFAULT SETTINGS
|--------------------------------------------------------------------------
*/

const defaultSettings: Settings = {
  storeName: "SilentGEN",

  storeLogo: "",

  currency: "INR",

  gstNumber: "",

  /*
  |--------------------------------------------------------------------------
  | EMAIL
  |--------------------------------------------------------------------------
  */

  supportEmail:
    "silentgenofficial@gmail.com",

  contactEmail:
    "silentgenofficial@gmail.com",

  orderEmail:
    "silentgenofficial@gmail.com",

  returnRefundEmail:
    "silentgenofficial@gmail.com",

  /*
  |--------------------------------------------------------------------------
  | GENERAL PHONE
  |--------------------------------------------------------------------------
  */

  supportMobile: "",

  customerCareNumber: "",

  /*
  |--------------------------------------------------------------------------
  | QUERY NUMBERS
  |--------------------------------------------------------------------------
  */

  productQueryNumber:
    "+919998665658",

  deliveryQueryNumber:
    "+919998765658",

  paymentRefundNumber:
    "+919998665652",

  /*
  |--------------------------------------------------------------------------
  | WHATSAPP
  |--------------------------------------------------------------------------
  */

  whatsappNumber: "",

  whatsappMessage:
    "Hello SilentGEN, I need help.",

  /*
  |--------------------------------------------------------------------------
  | BUSINESS
  |--------------------------------------------------------------------------
  */

  businessAddress: "",

  legalBusinessName: "",

  supportHours: "",

  /*
  |--------------------------------------------------------------------------
  | SOCIAL
  |--------------------------------------------------------------------------
  */

  instagramUrl:
    "https://www.instagram.com/silentgenofficial/",

  facebookUrl:
    "https://www.facebook.com/share/1AiwV1MKfb/",

  youtubeUrl:
    "https://www.youtube.com/@SilentGEN-org",

  /*
  |--------------------------------------------------------------------------
  | SHIPPING
  |--------------------------------------------------------------------------
  */

  shippingCharge: 0,

  freeShippingMinimum: 0,

  /*
  |--------------------------------------------------------------------------
  | PAYMENT
  |--------------------------------------------------------------------------
  */

  codEnabled: true,

  onlinePaymentEnabled: false,

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  returnDays: 7,

  exchangeDays: 7,

  /*
  |--------------------------------------------------------------------------
  | STOCK
  |--------------------------------------------------------------------------
  */

  lowStockLimit: 5,

  /*
  |--------------------------------------------------------------------------
  | SEO
  |--------------------------------------------------------------------------
  */

  defaultSeoTitle:
    "SilentGEN",

  defaultSeoDescription: "",

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  maintenanceMode: false,
};

/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function SettingsPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<Settings>(
      defaultSettings
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      setMessage("");

      const response =
        await fetch(
          "/api/admin/settings",
          {
            method: "GET",

            cache: "no-store",

            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setSettings({
          ...defaultSettings,

          ...(data.settings || {}),
        });
      } else {
        setMessage(
          data.message ||
            "Unable to load settings."
        );
      }
    } catch (error) {
      console.error(
        "LOAD SETTINGS ERROR:",
        error
      );

      setMessage(
        "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  function updateField<
    K extends keyof Settings
  >(
    field: K,
    value: Settings[K]
  ) {
    setSettings(
      (previous) => ({
        ...previous,

        [field]:
          value,
      })
    );
  }

  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  async function saveSettings() {
    try {
      setSaving(true);

      setMessage("");

      setSuccess(false);

      const response =
        await fetch(
          "/api/admin/settings",
          {
            method: "PUT",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                settings
              ),
          }
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success
      ) {
        setSuccess(true);

        setMessage(
          data.message ||
            "Settings saved successfully."
        );

        if (
          data.settings
        ) {
          setSettings({
            ...defaultSettings,

            ...data.settings,
          });
        }
      } else {
        setSuccess(false);

        setMessage(
          data.message ||
            "Unable to save settings."
        );
      }
    } catch (error) {
      console.error(
        "SAVE SETTINGS ERROR:",
        error
      );

      setSuccess(false);

      setMessage(
        "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            size={22}
            className="animate-spin"
          />

          Loading Settings...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-black p-3 text-white">
            <Settings2
              size={24}
            />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-950">
              Settings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage SilentGEN
              store, contact,
              support and policy
              settings.
            </p>
          </div>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | MESSAGE
      |--------------------------------------------------------------------------
      */}

      {message && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
            success
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {success && (
            <CheckCircle2
              size={20}
            />
          )}

          <span>
            {message}
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/*
        |--------------------------------------------------------------------------
        | STORE
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <ShoppingBag
              size={20}
            />
          }
          title="Store Information"
          description="Main SilentGEN store information."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Store Name"
              value={
                settings.storeName
              }
              placeholder="SilentGEN"
              onChange={(
                value
              ) =>
                updateField(
                  "storeName",
                  value
                )
              }
            />

            <Field
              label="Store Logo URL"
              value={
                settings.storeLogo
              }
              placeholder="/images/logo.png"
              onChange={(
                value
              ) =>
                updateField(
                  "storeLogo",
                  value
                )
              }
            />

            <Field
              label="Currency"
              value={
                settings.currency
              }
              placeholder="INR"
              onChange={(
                value
              ) =>
                updateField(
                  "currency",
                  value
                )
              }
            />

            <Field
              label="GST Number"
              value={
                settings.gstNumber
              }
              placeholder="GST Number"
              onChange={(
                value
              ) =>
                updateField(
                  "gstNumber",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | EMAIL / GENERAL CONTACT
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Mail
              size={20}
            />
          }
          title="Email & Contact"
          description="These details can also be used automatically inside policies."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              type="email"
              label="Support Email"
              value={
                settings.supportEmail
              }
              placeholder="silentgenofficial@gmail.com"
              onChange={(
                value
              ) =>
                updateField(
                  "supportEmail",
                  value
                )
              }
            />

            <Field
              type="email"
              label="Contact Email"
              value={
                settings.contactEmail
              }
              placeholder="silentgenofficial@gmail.com"
              onChange={(
                value
              ) =>
                updateField(
                  "contactEmail",
                  value
                )
              }
            />

            <Field
              type="email"
              label="Order / Delivery Email"
              value={
                settings.orderEmail
              }
              placeholder="silentgenofficial@gmail.com"
              onChange={(
                value
              ) =>
                updateField(
                  "orderEmail",
                  value
                )
              }
            />

            <Field
              type="email"
              label="Return / Refund Email"
              value={
                settings.returnRefundEmail
              }
              placeholder="silentgenofficial@gmail.com"
              onChange={(
                value
              ) =>
                updateField(
                  "returnRefundEmail",
                  value
                )
              }
            />

            <Field
              label="Support Mobile"
              value={
                settings.supportMobile
              }
              placeholder="+91..."
              onChange={(
                value
              ) =>
                updateField(
                  "supportMobile",
                  value
                )
              }
            />

            <Field
              label="Customer Care Number"
              value={
                settings.customerCareNumber
              }
              placeholder="+91..."
              onChange={(
                value
              ) =>
                updateField(
                  "customerCareNumber",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | QUERY CONTACT NUMBERS
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Phone
              size={20}
            />
          }
          title="Query Contact Numbers"
          description="These numbers are shown in the footer Need Help section."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <Field
              label="Product Query Number"
              value={
                settings.productQueryNumber
              }
              placeholder="+91 9998665658"
              onChange={(
                value
              ) =>
                updateField(
                  "productQueryNumber",
                  value
                )
              }
            />

            <Field
              label="Delivery Query Number"
              value={
                settings.deliveryQueryNumber
              }
              placeholder="+91 9998765658"
              onChange={(
                value
              ) =>
                updateField(
                  "deliveryQueryNumber",
                  value
                )
              }
            />

            <Field
              label="Payment & Refund Number"
              value={
                settings.paymentRefundNumber
              }
              placeholder="+91 9998665652"
              onChange={(
                value
              ) =>
                updateField(
                  "paymentRefundNumber",
                  value
                )
              }
            />
          </div>

          <p className="mt-4 text-xs leading-6 text-gray-500">
            આ ત્રણ numbers
            Footerના Product,
            Delivery અને Payment
            buttonsમાં અલગ-अलग
            ઉપયોગ થશે.
          </p>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | WHATSAPP
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <MessageCircle
              size={20}
            />
          }
          title="WhatsApp"
          description="Used by the Help & Support WhatsApp link."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="WhatsApp Number"
              value={
                settings.whatsappNumber
              }
              placeholder="919876543210"
              onChange={(
                value
              ) =>
                updateField(
                  "whatsappNumber",
                  value
                )
              }
            />

            <Field
              label="Default WhatsApp Message"
              value={
                settings.whatsappMessage
              }
              placeholder="Hello SilentGEN, I need help."
              onChange={(
                value
              ) =>
                updateField(
                  "whatsappMessage",
                  value
                )
              }
            />
          </div>

          <p className="mt-3 text-xs text-gray-500">
            WhatsApp number
            country code સાથે
            રાખવો. Example:
            919876543210
          </p>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | BUSINESS
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Building2
              size={20}
            />
          }
          title="Business Information"
          description="Business and legal information shown where required."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Legal Business Name"
              value={
                settings.legalBusinessName
              }
              placeholder="Legal business name"
              onChange={(
                value
              ) =>
                updateField(
                  "legalBusinessName",
                  value
                )
              }
            />

            <Field
              label="Support Hours"
              value={
                settings.supportHours
              }
              placeholder="Mon - Sat, 10 AM - 6 PM"
              onChange={(
                value
              ) =>
                updateField(
                  "supportHours",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <TextAreaField
                label="Business Address"
                value={
                  settings.businessAddress
                }
                placeholder="Complete business address"
                onChange={(
                  value
                ) =>
                  updateField(
                    "businessAddress",
                    value
                  )
                }
              />
            </div>
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | SOCIAL
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Globe2
              size={20}
            />
          }
          title="Social Media"
          description="Official SilentGEN social media links."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="Instagram URL"
              value={
                settings.instagramUrl
              }
              placeholder="https://www.instagram.com/silentgenofficial/"
              onChange={(
                value
              ) =>
                updateField(
                  "instagramUrl",
                  value
                )
              }
            />

            <Field
              label="Facebook URL"
              value={
                settings.facebookUrl
              }
              placeholder="https://facebook.com/..."
              onChange={(
                value
              ) =>
                updateField(
                  "facebookUrl",
                  value
                )
              }
            />

            <Field
              label="YouTube URL"
              value={
                settings.youtubeUrl
              }
              placeholder="https://youtube.com/..."
              onChange={(
                value
              ) =>
                updateField(
                  "youtubeUrl",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | SHIPPING
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Truck
              size={20}
            />
          }
          title="Shipping"
          description="Default shipping configuration."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label="Shipping Charge"
              value={
                settings.shippingCharge
              }
              min={0}
              onChange={(
                value
              ) =>
                updateField(
                  "shippingCharge",
                  value
                )
              }
            />

            <NumberField
              label="Free Shipping Minimum"
              value={
                settings.freeShippingMinimum
              }
              min={0}
              onChange={(
                value
              ) =>
                updateField(
                  "freeShippingMinimum",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | RETURN / EXCHANGE
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <ShieldCheck
              size={20}
            />
          }
          title="Return & Exchange"
          description="Default return and exchange window."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <NumberField
              label="Return Days"
              value={
                settings.returnDays
              }
              min={0}
              onChange={(
                value
              ) =>
                updateField(
                  "returnDays",
                  value
                )
              }
            />

            <NumberField
              label="Exchange Days"
              value={
                settings.exchangeDays
              }
              min={0}
              onChange={(
                value
              ) =>
                updateField(
                  "exchangeDays",
                  value
                )
              }
            />

            <NumberField
              label="Low Stock Limit"
              value={
                settings.lowStockLimit
              }
              min={0}
              onChange={(
                value
              ) =>
                updateField(
                  "lowStockLimit",
                  value
                )
              }
            />
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Policy pageના actual
            terms Content
            Managementમાંથી edit
            થશે. આ values system
            rules માટે રહેશે.
          </p>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | PAYMENT
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <WalletCards
              size={20}
            />
          }
          title="Payment"
          description="Enable or disable payment methods."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <ToggleCard
              title="Cash on Delivery"
              description="Allow customers to place COD orders."
              checked={
                settings.codEnabled
              }
              onChange={(
                checked
              ) =>
                updateField(
                  "codEnabled",
                  checked
                )
              }
            />

            <ToggleCard
              title="Online Payment"
              description="Allow online payment during checkout."
              checked={
                settings.onlinePaymentEnabled
              }
              onChange={(
                checked
              ) =>
                updateField(
                  "onlinePaymentEnabled",
                  checked
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Search
              size={20}
            />
          }
          title="Default SEO"
          description="Default SEO information used where page-specific SEO is unavailable."
        >
          <div className="grid gap-5">
            <Field
              label="Default SEO Title"
              value={
                settings.defaultSeoTitle
              }
              placeholder="SilentGEN"
              onChange={(
                value
              ) =>
                updateField(
                  "defaultSeoTitle",
                  value
                )
              }
            />

            <TextAreaField
              label="Default SEO Description"
              value={
                settings.defaultSeoDescription
              }
              placeholder="SilentGEN default website description"
              onChange={(
                value
              ) =>
                updateField(
                  "defaultSeoDescription",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | SYSTEM
        |--------------------------------------------------------------------------
        */}

        <SettingsSection
          icon={
            <Settings2
              size={20}
            />
          }
          title="System"
          description="Important website-wide controls."
        >
          <ToggleCard
            title="Maintenance Mode"
            description="Enable only when you temporarily want to restrict the customer website."
            checked={
              settings.maintenanceMode
            }
            danger
            onChange={(
              checked
            ) =>
              updateField(
                "maintenanceMode",
                checked
              )
            }
          />
        </SettingsSection>

        {/*
        |--------------------------------------------------------------------------
        | SAVE
        |--------------------------------------------------------------------------
        */}

        <div className="sticky bottom-4 z-20 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void saveSettings()
            }
            className="flex min-w-44 items-center justify-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-white shadow-xl transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Saving...
              </>
            ) : (
              <>
                <Save
                  size={18}
                />

                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| SETTINGS SECTION
|--------------------------------------------------------------------------
*/

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;

  title: string;

  description: string;

  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-black p-2 text-white">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              {title}
            </h2>

            <p className="mt-0.5 text-sm text-gray-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">
        {children}
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| TEXT FIELD
|--------------------------------------------------------------------------
*/

function Field({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;

  value: string;

  placeholder?: string;

  type?: string;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| NUMBER FIELD
|--------------------------------------------------------------------------
*/

function NumberField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;

  value: number;

  min?: number;

  onChange: (
    value: number
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        onChange={(event) => {
          const nextValue =
            Number(
              event.target.value
            );

          onChange(
            Number.isFinite(
              nextValue
            )
              ? nextValue
              : 0
          );
        }}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
      />
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| TEXTAREA
|--------------------------------------------------------------------------
*/

function TextAreaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;

  value: string;

  placeholder?: string;

  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <textarea
        rows={4}
        value={value}
        placeholder={
          placeholder
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black"
      />
    </label>
  );
}

/*
|--------------------------------------------------------------------------
| TOGGLE
|--------------------------------------------------------------------------
*/

function ToggleCard({
  title,
  description,
  checked,
  danger = false,
  onChange,
}: {
  title: string;

  description: string;

  checked: boolean;

  danger?: boolean;

  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-between gap-5 rounded-xl border p-4 ${
        danger
          ? "border-red-200 bg-red-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div>
        <p
          className={`font-medium ${
            danger
              ? "text-red-900"
              : "text-gray-900"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1 text-sm ${
            danger
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="h-5 w-5 shrink-0 accent-black"
      />
    </label>
  );
}