import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useKhata, customerBalance, rupees } from "@/lib/khata";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Grahak & Udhaar — VoiceKhata" },
      { name: "description", content: "Customer-wise udhaar list, baki rakam aur WhatsApp reminder." },
      { property: "og:title", content: "Grahak & Udhaar — VoiceKhata" },
      { property: "og:description", content: "Kis grahak par kitna udhaar baki hai, ek nazar mein." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const data = useKhata();
  const rows = data.customers
    .map((c) => ({ c, ...customerBalance(data, c.id) }))
    .sort((a, b) => b.outstanding - a.outstanding);
  const total = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <AppShell title="Grahak">
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
        <p className="text-sm font-semibold opacity-90">Kul baki udhaar</p>
        <p className="text-3xl font-extrabold">{rupees(total)}</p>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.map(({ c, outstanding, days }) => (
          <li key={c.id}>
            <Link
              to="/customers/$id"
              params={{ id: c.id }}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <div>
                <p className="text-lg font-bold">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.phone || "Number nahi hai"}
                  {outstanding > 0 && days > 7 ? ` • ${days} din purana` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xl font-extrabold ${
                    outstanding > 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {rupees(outstanding)}
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
