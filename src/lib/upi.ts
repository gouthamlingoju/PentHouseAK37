/**
 * Helper to generate NPCI-standard UPI deep links and web intents
 * Spec: upi://pay?pa=<payee_vpa>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
 */

export interface UpiPaymentParams {
  payeeUpiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
}

export function generateUpiUrl({
  payeeUpiId,
  payeeName,
  amount,
  transactionNote = 'PentHouse AK37 Settlement',
}: UpiPaymentParams): string {
  const cleanUpi = payeeUpiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim());
  const cleanNote = encodeURIComponent(transactionNote.trim());
  const formattedAmount = amount.toFixed(2);

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${formattedAmount}&cu=INR&tn=${cleanNote}`;
}

export function generateQrCodeUrl(upiUrl: string, size: number = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    upiUrl
  )}&bgcolor=0f172a&color=f8fafc&margin=8`;
}
