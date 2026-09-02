import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useKhata, upsertItem, deleteItem, newItem, rupees, type Item } from "@/lib/khata";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock / Inventory — VoiceKhata" },
      { name: "description", content: "Har saman ka stock, minimum level aur kam stock ka alert." },
      { property: "og:title", content: "Stock / Inventory — VoiceKhata" },
      { property: "og:description", content: "Bikri hote hi stock apne aap kam hota hai." },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const data = useKhata();
  const [editing, setEditing] = useState<Item | null>(null);

  return (
    <AppShell title="Stock">
      <button
        onClick={() => setEditing(newItem(data.settings.defaultMinStock))}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground"
      >
        <Plus className="size-5" /> Naya saman jodein
      </button>

      <ul className="mt-4 space-y-2">
        {data.items.map((i) => {
          const low = i.stock <= i.minStock;
          return (
            <li
              key={i.id}
              className={`rounded-2xl border p-4 ${
                low ? "border-destructive/40 bg-destructive/10" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{i.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rupees(i.rate)} / {i.unit} • min {i.minStock}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-extrabold ${low ? "text-destructive" : ""}`}>
                    {i.stock} {i.unit}
                  </p>
                  {low && (
                    <p className="flex items-center gap-1 text-xs font-bold text-destructive">
                      <AlertTriangle className="size-4" /> Kam stock
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setEditing(i)}
                  className="flex-1 rounded-xl bg-secondary py-3 font-bold text-secondary-foreground"
                >
                  Badlein
                </button>
                <button
                  onClick={() => upsertItem({ ...i, stock: i.stock + 10 })}
                  className="flex-1 rounded-xl bg-success py-3 font-bold text-success-foreground"
                >
                  +10 bharein
                </button>
                <button
                  onClick={() => deleteItem(i.id)}
                  aria-label="Hatayein"
                  className="rounded-xl border border-border px-4"
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0">
          <div className="w-full max-w-md rounded-t-3xl bg-card p-5">
            <h2 className="text-xl font-bold">Saman ki jaankari</h2>
            <div className="mt-3 space-y-3">
              <LabeledInput
                label="Naam"
                value={editing.name}
                onChange={(v) => setEditing({ ...editing, name: v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Unit (kg/ltr/pkt)"
                  value={editing.unit}
                  onChange={(v) => setEditing({ ...editing, unit: v })}
                />
                <LabeledInput
                  label="Rate (₹)"
                  type="number"
                  value={String(editing.rate)}
                  onChange={(v) => setEditing({ ...editing, rate: Number(v) })}
                />
                <LabeledInput
                  label="Stock"
                  type="number"
                  value={String(editing.stock)}
                  onChange={(v) => setEditing({ ...editing, stock: Number(v) })}
                />
                <LabeledInput
                  label="Minimum stock"
                  type="number"
                  value={String(editing.minStock)}
                  onChange={(v) => setEditing({ ...editing, minStock: Number(v) })}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 rounded-2xl border border-border py-4 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editing.name.trim()) upsertItem(editing);
                  setEditing(null);
                }}
                className="flex-1 rounded-2xl bg-primary py-4 font-bold text-primary-foreground"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-border bg-background p-4 text-lg"
      />
    </label>
  );
}
