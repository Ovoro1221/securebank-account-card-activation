import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Hand,
} from "lucide-react";
import {
  getCard,
  getStatus,
  subscribe,
  type ActivationStatus,
  type StoredCard,
} from "@/lib/activation-store";

export const Route = createFileRoute("/my-card")({
  head: () => ({
    meta: [
      { title: "My Card — SecureBank" },
      {
        name: "description",
        content:
          "Tap your card to check whether your SecureBank debit card has been activated.",
      },
      { property: "og:title", content: "My Card — SecureBank" },
      {
        property: "og:description",
        content: "Tap your card to reveal its activation status.",
      },
    ],
  }),
  component: MyCard,
});

function MyCard() {
  const card = useSyncExternalStore<StoredCard | null>(
    subscribe,
    () => getCard(),
    () => null,
  );
  const status = useSyncExternalStore<ActivationStatus>(
    subscribe,
    () => getStatus(),
    () => "idle" as ActivationStatus,
  );
  const [flipped, setFlipped] = useState(false);

  const activated = status === "activated";
  const hasCard = !!card;
  const last4 = card?.cardNumber.replace(/\s/g, "").slice(-4) ?? "••••";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-300/80">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold">My Card</h1>
          </div>
          <div className="h-10 w-10" />
        </header>

        {!hasCard ? (
          <EmptyState />
        ) : (
          <section className="flex-1">
            <div className="mb-3 flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold">
                {flipped ? "Activation status" : "Tap your card"}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-slate-400">
                {flipped
                  ? "Here's the current status of your debit card."
                  : "Tap the card below to check if it has been activated."}
              </p>
            </div>

            {/* Flippable card */}
            <div
              className="mx-auto mt-6 aspect-[1.6/1] w-full [perspective:1200px]"
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={
                flipped ? "Hide activation status" : "Reveal activation status"
              }
              onClick={() => setFlipped((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setFlipped((v) => !v);
                }
              }}
            >
              <div
                className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
                  flipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-indigo-900/50 [backface-visibility:hidden]">
                  <div className="flex h-full flex-col justify-between text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest opacity-80">
                          Debit
                        </p>
                        <p className="mt-1 text-lg font-semibold">SecureBank</p>
                      </div>
                      <div className="h-8 w-10 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-90" />
                    </div>
                    <div>
                      <p className="font-mono text-lg tracking-widest">
                        •••• •••• •••• {last4}
                      </p>
                      <div className="mt-3 flex items-end justify-between text-xs uppercase opacity-90">
                        <div>
                          <p className="opacity-70">Cardholder</p>
                          <p className="mt-0.5 text-sm font-medium">
                            {card?.cardholder || "YOUR NAME"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="opacity-70">Expires</p>
                          <p className="mt-0.5 text-sm font-medium">
                            {card?.expiry || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!flipped && (
                    <div className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                      <Hand className="h-3 w-3" />
                      Tap
                    </div>
                  )}
                </div>

                {/* Back */}
                <div
                  className={`absolute inset-0 rounded-2xl p-5 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                    activated
                      ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-900/50"
                      : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 shadow-black/50"
                  }`}
                >
                  <div className="flex h-full flex-col items-center justify-center text-center text-white">
                    {activated ? (
                      <>
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-white/15" />
                          <CheckCircle2
                            className="relative h-10 w-10"
                            strokeWidth={2}
                          />
                        </div>
                        <p className="mt-3 text-lg font-semibold">
                          Card Activated
                        </p>
                        <p className="mt-1 text-xs opacity-90">
                          •••• {last4} · ready to use
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
                          <Clock className="relative h-10 w-10 text-amber-300" />
                        </div>
                        <p className="mt-3 text-lg font-semibold">
                          Awaiting Activation
                        </p>
                        <p className="mt-1 text-xs opacity-80">
                          An admin is confirming your card
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status detail */}
            <div className="mt-8">
              {activated ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <Sparkles className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-200">
                        Your card is active
                      </p>
                      <p className="mt-1 text-sm text-emerald-100/80">
                        You can now use your SecureBank debit card for purchases
                        and ATM withdrawals.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                      <Clock className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-200">
                        Activation pending
                      </p>
                      <p className="mt-1 text-sm text-amber-100/80">
                        Wait for confirmation. Tap the card again in a moment to
                        re-check.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setFlipped((v) => !v)}
                className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
              >
                {flipped ? "Flip back" : "Tap to check status"}
              </button>
            </div>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Secure activation status
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
        <CreditCard className="h-10 w-10 text-slate-500" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">No card on file</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-400">
        You haven't submitted a card for activation yet. Start the activation
        flow to add your debit card.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition active:scale-[0.98]"
      >
        Activate a card
      </Link>
    </section>
  );
}
