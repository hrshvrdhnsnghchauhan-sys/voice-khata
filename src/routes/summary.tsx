import { createFileRoute } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import {
  useKhata,
  todayStats,
  lowStockItems,
  rupees,
  isToday,
  customerBalance,
} from "@/lib/khata";
import { openWhatsApp, summaryMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/summary")({
  head: () => ({
    meta: [
      { title: "Din ka Hisaab — VoiceKhata" },
      { name: "description", content: "Aaj ki total bikri, cash, udhaar aur kam stock ka summary — WhatsApp par share karein." },
      { property: "og:title", content: "Din ka Hisaab — VoiceKhata" },
      { property: "og:description", content: "End-of-day summary ek tap mein WhatsApp par." },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const data = useKhata();
  const s = todayStats(data);
  const low = lowStockItems(data);
  const todayTxns = data.txns.filter((t) => isToday(t.date));
  const totalUdhaar = data.customers.reduce(
    (acc, c) => acc + customerBalance(data, c.id).outstanding,
    0,
  );

  return (
    <AppShell title="Aaj ka Hisaab">
      <p className="text-sm font-semibold text-muted-foreground">
        {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard label="Total Bikri" value={rupees(s.sales)} />
        <StatCard label="Cash Collected" value={rupees(s.collected)} />
        <StatCard label="Credit Given" value={rupees(s.credit)} tone="accent" />
        <StatCard label="Kul Bill" value={s.count} />
        <StatCard label="Baki Udhaar (sab)" value={rupees(totalUdhaar)} tone="accent" />
        <StatCard
          label="Kam Stock"
          value={low.length}
          tone={low.length ? "danger" : "default"}
        />
      </div>

      {low.length > 0 && (
        <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="font-bold text-destructive">Kam stock wale saman</p>
          <ul className="mt-2 space-y-1 text-sm font-medium">
            {low.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.name}</span>
                <span>
                  {i.stock} {i.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mt-6 text-lg font-bold">Aaj ki entries</h2>
      <ul className="mt-2 space-y-2">
        {todayTxns.map((t) => (
          <li key={t.id} className="flex justify-between rounded-2xl border border-border bg-card p-3">
            <span className="font-semibold">
              {t.itemName} · {t.customerName}
            </span>
            <span className="font-extrabold">{rupees(t.amount)}</span>
          </li>
        ))}
        {todayTxns.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Aaj koi entry nahi
          </li>
        )}
      </ul>

      <button
        onClick={() => openWhatsApp("", summaryMessage(data))}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-5 text-lg font-extrabold text-success-foreground"
      >
        <Share2 className="size-5" /> WhatsApp par bhejein
      </button>
    </AppShell>
  );
}
