export function toWaDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function waLink(phone: string | null | undefined, text?: string): string | null {
  const digits = phone ? toWaDigits(phone) : '';
  if (!digits) return null;
  const url = `https://wa.me/${digits}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}

export function waBookingText(serviceTitle: string, bookingNumber: string): string {
  return `Салом! Ман аз UstoGo барои хидмати «${serviceTitle}» навиштам. Рамзи банд: ${bookingNumber}`;
}