import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useKhata, rupees } from "@/lib/khata";
import { invoiceMessage, openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Khata / Ledger — VoiceKhata" },
      { name: "description", content: "Saari bikri aur udhaar entries ek list mein, WhatsApp invoice ke saath." },
      { property: "og:title", content: "Khata / Ledger — VoiceKhata" },
      { property: "og:description", content: "Har transaction ka record, cash aur udhaar alag-alag." },
    ],
  }),
  component: LedgerPage,
});

type Filter = "all" | "cash" | "udhaar";

function LedgerPage() {
  const data = useKhata();
  const [filter, setFilter] = useState<Filter>("all");
  const txns = data.txns.filter((t) => filter === "all" || t.type === filter);

  return (
    <AppShell title="Khata">
      <div className="grid grid-cols-3 gap-2">
        {(["all", "cash", "udhaar"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-2xl py-3 font-bold ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {f === "all" ? "Sab" : f === "cash" ? "Cash" : "Udhaar"}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {txns.map((t) => (
          <li key={t.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">
                  {t.itemName} · {t.qty} {t.unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.customerName} • {new Date(t.date).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold">{rupees(t.amount)}</p>
                <span
                  className={`text-xs font-bold ${
                    t.type === "udhaar" ? "text-accent-foreground" : "text-success"
                  }`}
                >
                  {t.type === "udhaar" ? "UDHAAR" : "CASH"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const phone = data.customers.find((c) => c.id === t.customerId)?.phone ?? "";
                openWhatsApp(phone, invoiceMessage(t, data.settings.shopName));
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 font-bold text-success-foreground"
            >
              <MessageCircle className="size-5" /> Invoice bhejo
            </button>
          </li>
        ))}
        {txns.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Koi entry nahi
          </li>
        )}
      </ul>
    </AppShell>
  );
}
