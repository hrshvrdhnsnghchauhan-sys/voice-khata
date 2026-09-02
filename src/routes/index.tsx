import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, IndianRupee, HandCoins, AlertTriangle, Wallet, Share2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useKhata, todayStats, lowStockItems, rupees, customerBalance } from "@/lib/khata";
import { openWhatsApp, summaryMessage } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VoiceKhata — Bolkar Hisaab Rakhein | Kirana Ledger" },
      {
        name: "description",
        content:
          "VoiceKhata: kirana dukan ke liye voice se ledger, udhaar tracking, stock update aur 1-tap WhatsApp invoice. Bina login, offline bhi chalta hai.",
      },
      { property: "og:title", content: "VoiceKhata — Bolkar Hisaab Rakhein" },
      {
        property: "og:description",
        content: "Hindi mein bolo, bill ban jaye. Udhaar, stock aur WhatsApp invoice — sab ek jagah.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const data = useKhata();
  const nav = useNavigate();
  const stats = todayStats(data);
  const low = lowStockItems(data);
  const totalUdhaar = data.customers.reduce(
    (s, c) => s + customerBalance(data, c.id).outstanding,
    0,
  );

  return (
    <AppShell>
      {/* Big speak button — the entire product in one tap */}
      <section className="rounded-3xl bg-gradient-to-b from-primary to-primary/85 p-6 text-center text-primary-foreground shadow-lg">
        <p className="text-base font-semibold opacity-90">Bolkar entry karein</p>
        <button
          onClick={() => nav({ to: "/speak" })}
          className="mic-pulse mx-auto mt-4 flex size-32 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl transition active:scale-95"
          aria-label="Bolkar entry karein"
        >
          <Mic className="size-16" strokeWidth={2.2} />
        </button>
        <p className="mt-4 text-xl font-bold">Boliye 🎙️</p>
        <p className="mt-1 text-sm opacity-90">"2 kg chini Ram ko 90 rupaye udhaar"</p>
      </section>

      <h2 className="mt-6 text-lg font-bold">Aaj ka Hisaab</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard
          label="Bikri"
          value={rupees(stats.sales)}
          icon={<IndianRupee className="size-4" />}
        />
        <StatCard
          label="Cash aaya"
          value={rupees(stats.collected)}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Udhaar diya"
          value={rupees(stats.credit)}
          icon={<HandCoins className="size-4" />}
          tone="accent"
        />
        <StatCard label="Kul baki udhaar" value={rupees(totalUdhaar)} tone="accent" />
      </div>

      {low.length > 0 && (
        <div className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="flex items-center gap-2 font-bold text-destructive">
            <AlertTriangle className="size-5" /> Kam Stock ({low.length})
          </p>
          <ul className="mt-2 space-y-1 text-sm font-medium">
            {low.map((i) => (
              <li key={i.id} className="flex justify-between">
                <span>{i.name}</span>
                <span className="text-destructive">
                  {i.stock} {i.unit} (min {i.minStock})
                </span>
              </li>
            ))}
          </ul>
          <Link
            to="/stock"
            className="mt-3 inline-flex rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white"
          >
            Stock bharein
          </Link>
        </div>
      )}

      <button
        onClick={() => openWhatsApp("", summaryMessage(data))}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-4 py-4 text-lg font-bold text-success-foreground active:scale-[0.99]"
      >
        <Share2 className="size-5" /> Aaj ka hisaab WhatsApp par
      </button>

      <h2 className="mt-6 text-lg font-bold">Aaj ke Bill</h2>
      <ul className="mt-3 space-y-2">
        {data.txns.filter((t) => new Date(t.date).toDateString() === new Date().toDateString())
          .slice(0, 5)
          .map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-3"
            >
              <div>
                <p className="font-bold">
                  {t.itemName} · {t.qty} {t.unit}
                </p>
                <p className="text-sm text-muted-foreground">{t.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold">{rupees(t.amount)}</p>
                <p
                  className={
                    t.type === "udhaar"
                      ? "text-xs font-bold text-accent-foreground"
                      : "text-xs font-bold text-success"
                  }
                >
                  {t.type === "udhaar" ? "UDHAAR" : "CASH"}
                </p>
              </div>
            </li>
          ))}
        {stats.count === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            Aaj koi entry nahi — mic dabakar boliye
          </li>
        )}
      </ul>
    </AppShell>
  );
}
