import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BellRing, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  useKhata,
  customerBalance,
  rupees,
  recordPayment,
  setCustomerPhone,
} from "@/lib/khata";
import { invoiceMessage, openWhatsApp, reminderMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "Grahak ka Khata — VoiceKhata" },
      { name: "description", content: "Ek grahak ka pura udhaar history, payment entry aur WhatsApp reminder." },
      { property: "og:title", content: "Grahak ka Khata — VoiceKhata" },
      { property: "og:description", content: "Udhaar history, bhugtan aur vinamr reminder ek tap mein." },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const data = useKhata();
  const nav = useNavigate();
  const [pay, setPay] = useState("");
  const customer = data.customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <AppShell title="Grahak">
        <p className="text-center text-muted-foreground">Grahak nahi mila.</p>
      </AppShell>
    );
  }

  const { outstanding, given, paid, days } = customerBalance(data, customer.id);
  const history = [
    ...data.txns
      .filter((t) => t.customerId === customer.id)
      .map((t) => ({ id: t.id, date: t.date, label: `${t.itemName} ${t.qty} ${t.unit}`, amount: t.amount, kind: t.type })),
    ...data.payments
      .filter((p) => p.customerId === customer.id)
      .map((p) => ({ id: p.id, date: p.date, label: "Bhugtan mila", amount: p.amount, kind: "payment" as const })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <AppShell title={customer.name}>
      <button
        onClick={() => nav({ to: "/customers" })}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Grahak list
      </button>

      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="text-sm opacity-90">Baki udhaar</p>
        <p className="text-4xl font-extrabold">{rupees(outstanding)}</p>
        <p className="mt-1 text-sm opacity-90">
            Kul udhaar {rupees(given)} • jama {rupees(paid)}
        </p>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-muted-foreground">WhatsApp number</span>
        <input
          className="mt-1 w-full rounded-2xl border border-border bg-card p-4 text-lg"
          placeholder="10 digit number"
          value={customer.phone}
          onChange={(e) => setCustomerPhone(customer.id, e.target.value)}
        />
      </label>

      {outstanding > 0 && (
        <button
          onClick={() =>
            openWhatsApp(
              customer.phone,
              reminderMessage(customer.name, outstanding, days, data.settings.shopName),
            )
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-lg font-bold text-accent-foreground"
        >
          <BellRing className="size-5" /> Vinamr reminder bhejo
        </button>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="font-bold">Bhugtan darj karein</p>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
            placeholder="Rupaye"
            className="w-full rounded-2xl border border-border p-4 text-lg"
          />
          <button
            onClick={() => {
              const amt = Number(pay);
              if (amt > 0) recordPayment(customer.id, amt);
              setPay("");
            }}
            className="rounded-2xl bg-success px-6 font-bold text-success-foreground"
          >
            Jama
          </button>
        </div>
      </div>

      <h2 className="mt-6 text-lg font-bold">History</h2>
      <ul className="mt-2 space-y-2">
        {history.map((h) => (
          <li
            key={h.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3"
          >
            <div>
              <p className="font-semibold">{h.label}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(h.date).toLocaleDateString("en-IN")}
              </p>
            </div>
            <span
              className={`font-extrabold ${
                h.kind === "payment" ? "text-success" : h.kind === "udhaar" ? "text-destructive" : ""
              }`}
            >
              {h.kind === "payment" ? "-" : "+"}
              {rupees(h.amount)}
            </span>
          </li>
        ))}
      </ul>

      {data.txns.filter((t) => t.customerId === customer.id)[0] && (
        <button
          onClick={() => {
            const last = data.txns.find((t) => t.customerId === customer.id);
            if (last) openWhatsApp(customer.phone, invoiceMessage(last, data.settings.shopName));
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 font-bold"
        >
          <MessageCircle className="size-5" /> Aakhri bill dobara bhejein
        </button>
      )}
    </AppShell>
  );
}
