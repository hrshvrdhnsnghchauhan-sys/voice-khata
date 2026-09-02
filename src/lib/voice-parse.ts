/**
 * Hindi/Hinglish speech -> structured transaction.
 * Example: "2 kg chini Ram ko 120 rupaye udhaar"
 *   => { itemName: "Chini", qty: 2, unit: "kg", amount: 120, customerName: "Ram", type: "udhaar" }
 *
 * Pure rule-based so it runs instantly and fully offline.
 */
import type { DraftTxn, Item } from "./khata";

const NUM_WORDS: Record<string, number> = {
  aadha: 0.5,
  adha: 0.5,
  "आधा": 0.5,
  ek: 1,
  "एक": 1,
  do: 2,
  "दो": 2,
  teen: 3,
  "तीन": 3,
  char: 4,
  chaar: 4,
  "चार": 4,
  panch: 5,
  paanch: 5,
  "पांच": 5,
  "पाँच": 5,
  chah: 6,
  cheh: 6,
  "छह": 6,
  saat: 7,
  "सात": 7,
  aath: 8,
  "आठ": 8,
  nau: 9,
  "नौ": 9,
  das: 10,
  "दस": 10,
  bees: 20,
  "बीस": 20,
  pachas: 50,
  "पचास": 50,
  sau: 100,
  "सौ": 100,
};

const UNITS: Record<string, string> = {
  kg: "kg",
  kilo: "kg",
  "किलो": "kg",
  gram: "gram",
  "ग्राम": "gram",
  litre: "ltr",
  liter: "ltr",
  ltr: "ltr",
  "लीटर": "ltr",
  packet: "pkt",
  pkt: "pkt",
  "पैकेट": "pkt",
  piece: "pc",
  pc: "pc",
  "पीस": "pc",
  dozen: "dz",
  "दर्जन": "dz",
};

/** Words that mark the start of a customer name ("... Ram ko ...") */
const CREDIT_WORDS = ["udhaar", "udhar", "उधार", "credit", "baki", "बाकी"];
const CASH_WORDS = ["cash", "nakad", "नकद", "नगद", "diya", "paid"];

const STOP = new Set([
  "ko",
  "ke",
  "ka",
  "ki",
  "rupaye",
  "rupees",
  "rupay",
  "rs",
  "rupee",
  "का",
  "को",
  "के",
  "रुपये",
  "रुपए",
  "me",
  "mein",
  "aur",
  "and",
  "bech",
  "becha",
  "diya",
  "de",
  "do",
  "bill",
]);

function toNumber(tok: string): number | null {
  const n = parseFloat(tok.replace(/[^\d.]/g, ""));
  if (!isNaN(n) && /\d/.test(tok)) return n;
  return NUM_WORDS[tok] ?? null;
}

export interface ParseResult extends DraftTxn {
  raw: string;
  confident: boolean;
}

/**
 * @param text  recognised speech
 * @param items known catalogue (used to match item names & auto-price)
 */
export function parseSpeech(text: string, items: Item[]): ParseResult {
  const raw = text.trim();
  const tokens = raw.toLowerCase().replace(/[,.!?]/g, " ").split(/\s+/).filter(Boolean);

  let qty = 1;
  let unit = "pc";
  let amount = 0;
  let itemName = "";
  let customerName = "";
  let type: DraftTxn["type"] = "cash";

  if (tokens.some((t) => CREDIT_WORDS.includes(t))) type = "udhaar";
  else if (tokens.some((t) => CASH_WORDS.includes(t))) type = "cash";

  // 1. Item: first catalogue item whose name appears in the sentence
  const matched = items.find((i) => tokens.includes(i.name.toLowerCase().split(" ")[0]));
  if (matched) {
    itemName = matched.name;
    unit = matched.unit;
  }

  // 2. Quantity: number that sits right before a unit word, else first number
  const numbers: { value: number; index: number }[] = [];
  tokens.forEach((t, i) => {
    const n = toNumber(t);
    if (n !== null) numbers.push({ value: n, index: i });
  });

  let qtyIdx = -1;
  for (const n of numbers) {
    const next = tokens[n.index + 1];
    if (next && UNITS[next]) {
      qty = n.value;
      unit = UNITS[next];
      qtyIdx = n.index;
      break;
    }
  }
  if (qtyIdx === -1 && numbers.length) {
    qty = numbers[0].value;
    qtyIdx = numbers[0].index;
  }

  // 3. Amount: number followed by rupaye/rupees, else the last (larger) number
  let amtIdx = -1;
  for (const n of numbers) {
    const next = tokens[n.index + 1] ?? "";
    if (["rupaye", "rupay", "rupees", "rs", "रुपये", "रुपए", "rupee"].includes(next)) {
      amount = n.value;
      amtIdx = n.index;
      break;
    }
  }
  if (amtIdx === -1) {
    const rest = numbers.filter((n) => n.index !== qtyIdx);
    if (rest.length) {
      const biggest = rest.reduce((a, b) => (a.value >= b.value ? a : b));
      amount = biggest.value;
      amtIdx = biggest.index;
    }
  }
  // Fall back to catalogue rate
  if (!amount && matched) amount = +(matched.rate * qty).toFixed(2);

  // 4. Customer: word before "ko", else first unknown non-stop word
  const koIdx = tokens.findIndex((t) => t === "ko" || t === "को");
  if (koIdx > 0) {
    customerName = tokens[koIdx - 1];
  } else {
    const known = new Set(items.map((i) => i.name.toLowerCase().split(" ")[0]));
    const cand = tokens.find(
      (t, i) =>
        i !== qtyIdx &&
        i !== amtIdx &&
        toNumber(t) === null &&
        !STOP.has(t) &&
        !UNITS[t] &&
        !known.has(t) &&
        !CREDIT_WORDS.includes(t) &&
        !CASH_WORDS.includes(t),
    );
    if (cand) customerName = cand;
  }

  const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!itemName) {
    // Unknown item: take the word right after the unit / quantity
    const after = tokens[(qtyIdx >= 0 ? qtyIdx : -1) + 2] ?? tokens[qtyIdx + 1] ?? "";
    itemName = after && !STOP.has(after) ? title(after) : "Saman";
  }

  return {
    raw,
    itemName,
    qty,
    unit,
    amount,
    customerName: customerName ? title(customerName) : "",
    type,
    confident: Boolean(matched && amount > 0),
  };
}

/** Ready-made examples shown on the voice screen. */
export const VOICE_EXAMPLES = [
  "2 kg chini Ram ko 90 rupaye udhaar",
  "3 litre doodh cash 90 rupaye",
  "1 kg atta Sunita ko udhaar",
  "5 kg chawal Mohan ko 300 rupaye cash",
];
