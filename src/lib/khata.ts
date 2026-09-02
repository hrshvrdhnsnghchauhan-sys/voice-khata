/**
 * VoiceKhata data layer.
 * Everything lives in localStorage so the app works 100% offline and needs no login.
 * A tiny pub/sub + useSyncExternalStore gives React components live updates.
 */
import { useSyncExternalStore } from "react";

export type PaymentType = "cash" | "udhaar";

export interface Item {
  id: string;
  name: string; // Hindi/roman name shown to shopkeeper
  unit: string; // kg, ltr, pkt, pc
  rate: number; // price per unit
  stock: number;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // 10 digit, used for wa.me links
}

export interface Txn {
  id: string;
  date: string; // ISO
  itemName: string;
  qty: number;
  unit: string;
  amount: number;
  customerId: string | null;
  customerName: string;
  type: PaymentType;
  note?: string;
}

/** Payment received against udhaar */
export interface Payment {
  id: string;
  date: string;
  customerId: string;
  amount: number;
}

export interface Settings {
  shopName: string;
  ownerName: string;
  language: "hi" | "en";
  defaultMinStock: number;
}

export interface KhataData {
  items: Item[];
  customers: Customer[];
  txns: Txn[];
  payments: Payment[];
  settings: Settings;
}

const KEY = "voicekhata:v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

/** Sample data so the app never looks empty on first open. */
function seed(): KhataData {
  const customers: Customer[] = [
    { id: "c1", name: "Ram Prasad", phone: "9876543210" },
    { id: "c2", name: "Sunita Devi", phone: "9812345678" },
    { id: "c3", name: "Mohan Lal", phone: "9900112233" },
  ];
  const items: Item[] = [
    { id: "i1", name: "Chini", unit: "kg", rate: 45, stock: 18, minStock: 10 },
    { id: "i2", name: "Chawal", unit: "kg", rate: 60, stock: 42, minStock: 15 },
    { id: "i3", name: "Atta", unit: "kg", rate: 38, stock: 8, minStock: 12 },
    { id: "i4", name: "Tel", unit: "ltr", rate: 140, stock: 6, minStock: 8 },
    { id: "i5", name: "Dal", unit: "kg", rate: 110, stock: 25, minStock: 10 },
    { id: "i6", name: "Doodh", unit: "ltr", rate: 30, stock: 20, minStock: 10 },
    { id: "i7", name: "Chai patti", unit: "pkt", rate: 55, stock: 14, minStock: 6 },
  ];
  const txns: Txn[] = [
    {
      id: uid(),
      date: new Date().toISOString(),
      itemName: "Chini",
      qty: 2,
      unit: "kg",
      amount: 90,
      customerId: "c1",
      customerName: "Ram Prasad",
      type: "udhaar",
    },
    {
      id: uid(),
      date: new Date().toISOString(),
      itemName: "Doodh",
      qty: 3,
      unit: "ltr",
      amount: 90,
      customerId: null,
      customerName: "Cash Grahak",
      type: "cash",
    },
    {
      id: uid(),
      date: new Date().toISOString(),
      itemName: "Chawal",
      qty: 5,
      unit: "kg",
      amount: 300,
      customerId: "c2",
      customerName: "Sunita Devi",
      type: "cash",
    },
    {
      id: uid(),
      date: daysAgo(9),
      itemName: "Tel",
      qty: 2,
      unit: "ltr",
      amount: 280,
      customerId: "c3",
      customerName: "Mohan Lal",
      type: "udhaar",
    },
    {
      id: uid(),
      date: daysAgo(20),
      itemName: "Dal",
      qty: 1,
      unit: "kg",
      amount: 110,
      customerId: "c1",
      customerName: "Ram Prasad",
      type: "udhaar",
    },
  ];
  return {
    items,
    customers,
    txns,
    payments: [{ id: uid(), date: daysAgo(5), customerId: "c1", amount: 50 }],
    settings: {
      shopName: "Sharma Kirana Store",
      ownerName: "Sanjay Sharma",
      language: "hi",
      defaultMinStock: 10,
    },
  };
}

let cache: KhataData | null = null;
const listeners = new Set<() => void>();

function read(): KhataData {
  if (cache) return cache;
  if (typeof window === "undefined") return (cache = seed());
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as KhataData) : seed();
  } catch {
    cache = seed();
  }
  return cache;
}

function write(next: KhataData) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full / private mode — app keeps working in memory */
  }
  listeners.forEach((l) => l());
}

export function update(fn: (d: KhataData) => KhataData) {
  write(fn(read()));
}

/** Live snapshot of all data. */
export function useKhata(): KhataData {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    seed,
  );
}

export function resetData() {
  write(seed());
}

/* ---------------- mutations ---------------- */

export interface DraftTxn {
  itemName: string;
  qty: number;
  unit: string;
  amount: number;
  customerName: string;
  type: PaymentType;
}

/** Save a sale: creates txn, reduces stock, auto-creates customer if new. */
export function saveTxn(draft: DraftTxn): Txn {
  let saved!: Txn;
  update((d) => {
    const customers = [...d.customers];
    let customerId: string | null = null;
    const clean = draft.customerName.trim();
    if (clean && clean.toLowerCase() !== "cash grahak") {
      const found = customers.find((c) => c.name.toLowerCase() === clean.toLowerCase());
      if (found) customerId = found.id;
      else {
        const nc: Customer = { id: uid(), name: clean, phone: "" };
        customers.push(nc);
        customerId = nc.id;
      }
    }

    // Auto stock update — reduce sold quantity (create item if unknown)
    const items = [...d.items];
    const idx = items.findIndex((i) => i.name.toLowerCase() === draft.itemName.toLowerCase());
    if (idx >= 0) items[idx] = { ...items[idx], stock: +(items[idx].stock - draft.qty).toFixed(2) };
    else
      items.push({
        id: uid(),
        name: draft.itemName,
        unit: draft.unit,
        rate: draft.qty ? +(draft.amount / draft.qty).toFixed(2) : draft.amount,
        stock: -draft.qty,
        minStock: d.settings.defaultMinStock,
      });

    saved = {
      id: uid(),
      date: new Date().toISOString(),
      itemName: draft.itemName,
      qty: draft.qty,
      unit: draft.unit,
      amount: draft.amount,
      customerId,
      customerName: clean || "Cash Grahak",
      type: draft.type,
    };
    return { ...d, items, customers, txns: [saved, ...d.txns] };
  });
  return saved;
}

export function recordPayment(customerId: string, amount: number) {
  update((d) => ({
    ...d,
    payments: [{ id: uid(), date: new Date().toISOString(), customerId, amount }, ...d.payments],
  }));
}

export function upsertItem(item: Item) {
  update((d) => ({
    ...d,
    items: d.items.some((i) => i.id === item.id)
      ? d.items.map((i) => (i.id === item.id ? item : i))
      : [...d.items, item],
  }));
}

export function deleteItem(id: string) {
  update((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
}

export function saveSettings(s: Settings) {
  update((d) => ({ ...d, settings: s }));
}

export function setCustomerPhone(id: string, phone: string) {
  update((d) => ({
    ...d,
    customers: d.customers.map((c) => (c.id === id ? { ...c, phone } : c)),
  }));
}

export const newItem = (defaultMin: number): Item => ({
  id: uid(),
  name: "",
  unit: "kg",
  rate: 0,
  stock: 0,
  minStock: defaultMin,
});

/* ---------------- selectors ---------------- */

export const isToday = (iso: string) =>
  new Date(iso).toDateString() === new Date().toDateString();

export function todayStats(d: KhataData) {
  const today = d.txns.filter((t) => isToday(t.date));
  const sales = today.reduce((s, t) => s + t.amount, 0);
  const cash = today.filter((t) => t.type === "cash").reduce((s, t) => s + t.amount, 0);
  const credit = today.filter((t) => t.type === "udhaar").reduce((s, t) => s + t.amount, 0);
  const collected =
    cash + d.payments.filter((p) => isToday(p.date)).reduce((s, p) => s + p.amount, 0);
  return { sales, cash, credit, collected, count: today.length };
}

export const lowStockItems = (d: KhataData) => d.items.filter((i) => i.stock <= i.minStock);

/** Outstanding udhaar for a customer + how old the oldest unpaid credit is. */
export function customerBalance(d: KhataData, customerId: string) {
  const credits = d.txns.filter((t) => t.customerId === customerId && t.type === "udhaar");
  const given = credits.reduce((s, t) => s + t.amount, 0);
  const paid = d.payments.filter((p) => p.customerId === customerId).reduce((s, p) => s + p.amount, 0);
  const oldest = credits.length
    ? credits.reduce((a, b) => (a.date < b.date ? a : b)).date
    : null;
  const days = oldest ? Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000) : 0;
  return { outstanding: Math.max(0, given - paid), given, paid, days };
}

export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
