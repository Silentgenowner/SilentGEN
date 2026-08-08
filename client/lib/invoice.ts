// client/lib/invoice.ts

export function generateInvoiceNumber(orderId: string) {
  const year = new Date().getFullYear();

  const shortId = orderId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();

  return `INV-${year}-${shortId}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function generateTrackingUrl(orderId: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}/track/${orderId}`;
}

export function generateQRCodeData(params: {
  orderId: string;
  invoiceNumber: string;
  trackingNumber?: string;
  amount: number;
}) {
  return JSON.stringify({
    orderId: params.orderId,
    invoiceNumber: params.invoiceNumber,
    trackingNumber: params.trackingNumber || "",
    amount: params.amount,
    trackingUrl: generateTrackingUrl(params.orderId),
  });
}

export function generateBarcodeData(trackingNumber?: string) {
  return trackingNumber || "";
}
