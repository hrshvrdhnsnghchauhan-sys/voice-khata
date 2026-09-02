/**
 * WhatsApp helpers — wa.me deep links with pre-filled Hindi messages.
 * Works offline until the user actually taps (link opens WhatsApp app).
 */
import { rupees, type KhataData, type Txn } from "./khata";

const BRAND = "— _VoiceKhata se bheja gaya_ 🎙️";

export function waLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length === 10 ? "91" + digits : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone: string, message: string) {
  window.open(waLink(phone, message), "_blank", "noopener");
}

/** Clean, professional invoice text for a single sale. */
export function invoiceMessage(t: Txn, shopName: string) {
  const date = new Date(t.date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return [
    `*${shopName}*`,
    `🧾 *BILL / रसीद*`,
    `${date}`,
    `------------------------------`,
    `Grahak: *${t.customerName}*`,
    `${t.itemName} — ${t.qty} ${t.unit}`,
    `------------------------------`,
    `*Total: ${rupees(t.amount)}*`,
    t.type === "udhaar" ? `Status: *UDHAAR (baki)* 🔴` : `Status: *CASH PAID* ✅`,
    ``,
    `Dhanyavaad! 🙏`,
    BRAND,
  ].join("\n");
}

/** Polite Hindi reminder for overdue udhaar. */
export function reminderMessage(
  name: string,
  amount: number,
  days: number,
  shopName: string,
) {
  return [
    `Namaste ${name} ji 🙏`,
    ``,
    `${shopName} se vinamr yaad dilana chahte hain — aap par *${rupees(amount)}* ka udhaar baki hai${
      days > 0 ? ` (lagbhag ${days} din purana)` : ""
    }.`,
    ``,
    `Jab bhi suvidha ho, kripya bhugtan kar dijiye. Koi jaldi nahi hai, bas hisaab saaf rahe. 😊`,
    ``,
    `Dhanyavaad!`,
    BRAND,
  ].join("\n");
}

/** End-of-day summary text. */
export function summaryMessage(d: KhataData) {
  const today = d.txns.filter(
    (t) => new Date(t.date).toDateString() === new Date().toDateString(),
  );
  const sales = today.reduce((s, t) => s + t.amount, 0);
  const cash = today.filter((t) => t.type === "cash").reduce((s, t) => s + t.amount, 0);
  const credit = today.filter((t) => t.type === "udhaar").reduce((s, t) => s + t.amount, 0);
  const low = d.items.filter((i) => i.stock <= i.minStock);
  return [
    `*${d.settings.shopName}*`,
    `📊 *Aaj ka Hisaab* — ${new Date().toLocaleDateString("en-IN")}`,
    `------------------------------`,
    `Total Bikri: *${rupees(sales)}*`,
    `Cash aaya: *${rupees(cash)}*`,
    `Udhaar diya: *${rupees(credit)}*`,
    `Kul bill: *${today.length}*`,
    low.length
      ? `\n⚠️ *Kam Stock:*\n${low.map((i) => `• ${i.name} — ${i.stock} ${i.unit}`).join("\n")}`
      : `\n✅ Stock theek hai`,
    ``,
    BRAND,
  ].join("\n");
}
