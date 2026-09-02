import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mic, Square, Check, Pencil, MessageCircle, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSpeech } from "@/lib/use-speech";
import { parseSpeech, VOICE_EXAMPLES, type ParseResult } from "@/lib/voice-parse";
import { saveTxn, useKhata, rupees, type Txn } from "@/lib/khata";
import { invoiceMessage, openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/speak")({
  head: () => ({
    meta: [
      { title: "Bolkar Entry — VoiceKhata" },
      {
        name: "description",
        content: "Hindi mein transaction boliye, VoiceKhata turant ledger entry bana dega.",
      },
      { property: "og:title", content: "Bolkar Entry — VoiceKhata" },
      { property: "og:description", content: "Awaaz se ledger entry, sirf 8 second mein." },
    ],
  }),
  component: SpeakPage,
});

type Step = "listen" | "confirm" | "done";

function SpeakPage() {
  const data = useKhata();
  const nav = useNavigate();
  const speech = useSpeech(data.settings.language === "hi" ? "hi-IN" : "en-IN");
  const [step, setStep] = useState<Step>("listen");
  const [draft, setDraft] = useState<ParseResult | null>(null);
  const [saved, setSaved] = useState<Txn | null>(null);

  /** Parse whatever we heard (or typed) and move to the confirmation screen. */
  function review(text: string) {
    if (!text.trim()) return;
    speech.stop();
    setDraft(parseSpeech(text, data.items));
    setStep("confirm");
  }

  function confirmSave() {
    if (!draft) return;
    setSaved(saveTxn(draft));
    setStep("done");
  }

  return (
    <AppShell title="Bolkar Entry">
      <button
        onClick={() => nav({ to: "/" })}
        className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Wapas
      </button>

      {step === "listen" && (
        <section className="text-center">
          <button
            onClick={() => (speech.listening ? review(speech.transcript) : speech.start())}
            className={`mx-auto flex size-40 items-center justify-center rounded-full text-primary-foreground shadow-xl transition active:scale-95 ${
              speech.listening ? "mic-pulse bg-destructive" : "bg-primary"
            }`}
            aria-label={speech.listening ? "Rokein" : "Boliye"}
          >
            {speech.listening ? <Square className="size-14" /> : <Mic className="size-20" />}
          </button>
          <p className="mt-4 text-xl font-bold">
            {speech.listening ? "Sun raha hoon… boliye" : "Mic dabakar boliye"}
          </p>

          {speech.transcript && (
            <p className="mt-4 rounded-2xl bg-secondary p-4 text-lg font-semibold">
              “{speech.transcript}”
            </p>
          )}
          {speech.error && <p className="mt-3 font-semibold text-destructive">{speech.error}</p>}
          {!speech.supported && (
            <p className="mt-3 text-sm text-muted-foreground">
              Is browser mein mic support nahi hai — neeche likh kar bhejiye.
            </p>
          )}

          {speech.transcript && !speech.listening && (
            <button
              onClick={() => review(speech.transcript)}
              className="mt-4 w-full rounded-2xl bg-success px-4 py-4 text-lg font-bold text-success-foreground"
            >
              Aage badhein →
            </button>
          )}

          {/* Manual fallback (also the Whisper-style backup path) */}
          <div className="mt-6 text-left">
            <label className="text-sm font-bold text-muted-foreground" htmlFor="manual">
              Ya yahan likhiye
            </label>
            <input
              id="manual"
              className="mt-1 w-full rounded-2xl border border-border bg-card p-4 text-lg"
              placeholder="2 kg chini Ram ko 90 rupaye udhaar"
              onKeyDown={(e) => {
                if (e.key === "Enter") review((e.target as HTMLInputElement).value);
              }}
              onChange={(e) => speech.setTranscript(e.target.value)}
            />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">Examples:</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {VOICE_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => review(ex)}
                  className="rounded-full bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === "confirm" && draft && (
        <section>
          <p className="rounded-2xl bg-secondary p-3 text-center text-base font-semibold">
            “{draft.raw}”
          </p>
          <h2 className="mt-4 flex items-center gap-2 text-lg font-bold">
            <Pencil className="size-5" /> Sahi hai? Badal bhi sakte hain
          </h2>

          <div className="mt-3 space-y-3">
            <Field label="Saman">
              <input
                className="field"
                value={draft.itemName}
                onChange={(e) => setDraft({ ...draft, itemName: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kitna">
                <input
                  className="field"
                  type="number"
                  value={draft.qty}
                  onChange={(e) => setDraft({ ...draft, qty: Number(e.target.value) })}
                />
              </Field>
              <Field label="Unit">
                <input
                  className="field"
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Rupaye">
              <input
                className="field"
                type="number"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Grahak ka naam">
              <input
                className="field"
                placeholder="Cash Grahak"
                value={draft.customerName}
                onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {(["cash", "udhaar"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDraft({ ...draft, type: t })}
                  className={`rounded-2xl border-2 py-4 text-lg font-bold ${
                    draft.type === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {t === "cash" ? "CASH 💵" : "UDHAAR 📒"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={confirmSave}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-5 text-xl font-extrabold text-success-foreground active:scale-[0.99]"
          >
            <Check className="size-6" /> Save karein
          </button>
          <button
            onClick={() => setStep("listen")}
            className="mt-2 w-full rounded-2xl border border-border py-3 font-semibold"
          >
            Dobara boliye
          </button>
        </section>
      )}

      {step === "done" && saved && (
        <section className="text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success text-success-foreground">
            <Check className="size-12" />
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">Save ho gaya!</h2>
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-left">
            <p className="text-lg font-bold">
              {saved.itemName} · {saved.qty} {saved.unit}
            </p>
            <p className="text-muted-foreground">{saved.customerName}</p>
            <p className="mt-2 text-3xl font-extrabold">{rupees(saved.amount)}</p>
            <p className="font-bold">{saved.type === "udhaar" ? "UDHAAR 📒" : "CASH 💵"}</p>
          </div>

          <button
            onClick={() => {
              const phone =
                data.customers.find((c) => c.id === saved.customerId)?.phone ?? "";
              openWhatsApp(phone, invoiceMessage(saved, data.settings.shopName));
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-5 text-xl font-extrabold text-success-foreground"
          >
            <MessageCircle className="size-6" /> WhatsApp Invoice Bhejo
          </button>
          <button
            onClick={() => {
              setStep("listen");
              setSaved(null);
              speech.setTranscript("");
            }}
            className="mt-2 w-full rounded-2xl bg-primary py-4 text-lg font-bold text-primary-foreground"
          >
            Nayi entry
          </button>
          <button
            onClick={() => nav({ to: "/" })}
            className="mt-2 w-full rounded-2xl border border-border py-3 font-semibold"
          >
            Home
          </button>
        </section>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-muted-foreground">{label}</span>
      <div className="mt-1 [&_.field]:w-full [&_.field]:rounded-2xl [&_.field]:border [&_.field]:border-border [&_.field]:bg-card [&_.field]:p-4 [&_.field]:text-lg [&_.field]:font-semibold">
        {children}
      </div>
    </label>
  );
}
