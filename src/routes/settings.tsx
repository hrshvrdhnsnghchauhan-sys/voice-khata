import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useKhata, saveSettings, resetData, type Settings } from "@/lib/khata";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — VoiceKhata" },
      { name: "description", content: "Dukan ka naam, bhasha aur minimum stock level set karein." },
      { property: "og:title", content: "Settings — VoiceKhata" },
      { property: "og:description", content: "Shop name, language aur default minimum stock." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const data = useKhata();
  const [form, setForm] = useState<Settings>(data.settings);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setForm({ ...form, [k]: v });
    setSaved(false);
  };

  return (
    <AppShell title="Settings">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-bold text-muted-foreground">Dukan ka naam</span>
          <input
            className="mt-1 w-full rounded-2xl border border-border bg-card p-4 text-lg"
            value={form.shopName}
            onChange={(e) => set("shopName", e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-muted-foreground">Aapka naam</span>
          <input
            className="mt-1 w-full rounded-2xl border border-border bg-card p-4 text-lg"
            value={form.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
          />
        </label>
        <div>
          <span className="text-sm font-bold text-muted-foreground">Bhasha / Language</span>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {(["hi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => set("language", l)}
                className={`rounded-2xl border-2 py-4 text-lg font-bold ${
                  form.language === l
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card"
                }`}
              >
                {l === "hi" ? "हिंदी" : "English"}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm font-bold text-muted-foreground">
            Default minimum stock level
          </span>
          <input
            type="number"
            className="mt-1 w-full rounded-2xl border border-border bg-card p-4 text-lg"
            value={form.defaultMinStock}
            onChange={(e) => set("defaultMinStock", Number(e.target.value))}
          />
        </label>

        <button
          onClick={() => {
            saveSettings(form);
            setSaved(true);
          }}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-extrabold text-primary-foreground"
        >
          {saved ? "Save ho gaya ✅" : "Save karein"}
        </button>

        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-bold text-foreground">Data & Offline</p>
          <p className="mt-1">
            Saara data aapke phone mein hi save hota hai — internet ke bina bhi app poori tarah
            chalta hai. Koi login ki zarurat nahi.
          </p>
        </div>

        <button
          onClick={() => {
            resetData();
            setForm({
              shopName: "Sharma Kirana Store",
              ownerName: "Sanjay Sharma",
              language: "hi",
              defaultMinStock: 10,
            });
          }}
          className="w-full rounded-2xl border border-destructive py-4 font-bold text-destructive"
        >
          Sample data wapas layein (reset)
        </button>
      </div>
    </AppShell>
  );
}
