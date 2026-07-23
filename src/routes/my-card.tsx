import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  ChevronLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Hand,
  LogOut,
  LogIn,
  Lock,
} from "lucide-react";
import {
  getActivationByCard,
  getSessionCardNumber,
  setSessionCardNumber,
  clearSession,
  subscribeSession,
  subscribeToActivations,
  type Activation,
} from "@/lib/activations";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyCard,
});

function useSessionCard() {
  return useSyncExternalStore(
    subscribeSession,
    () => getSessionCardNumber(),
    () => null,
  );
}

function MyCard() {
  const sessionCard = useSessionCard();
  const [activation, setActivation] = useState<Activation | null>(null);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Fetch activation for the current session card + subscribe to realtime.
  useEffect(() => {
    if (!sessionCard) {
      setActivation(null);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      setLoading(true);
      getActivationByCard(sessionCard)
        .then((row) => {
          if (!cancelled) setActivation(row);
        })
        .catch((err) => console.error(err))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    refresh();
    const unsub = subscribeToActivations(refresh);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [sessionCard]);

  const loggedIn = !!sessionCard && !!activation;
  const activated = activation?.status === "activated";
  const last4 = activation?.card_number.slice(-4) ?? "••••";

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold">My Card</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to="/admin"
              aria-label="Admin portal"
              title="Admin portal"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </Link>
            {loggedIn && (
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  setFlipped(false);
                }}
                aria-label="Log out"
                title="Log out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </header>

        {!loggedIn ? (
          <LoginForm loading={loading && !!sessionCard} />
        ) : (
          <section className="flex-1">
            <div className="mb-3 flex flex-col items-center text-center">
              <h2 className="text-xl font-semibold">
                {flipped ? "Activation status" : "Tap your card"}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                {flipped
                  ? "Here's the current status of your debit card."
                  : "Tap the card below to check if it has been activated."}
              </p>
            </div>

            <div
              className="mx-auto mt-6 aspect-[1.6/1] w-full [perspective:1200px]"
              role="button"
              tabIndex={0}
              aria-pressed={flipped}
              aria-label={flipped ? "Hide activation status" : "Reveal activation status"}
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
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-indigo-900/50 [backface-visibility:hidden]">
                  <div className="flex h-full flex-col justify-between text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest opacity-80">Debit</p>
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
                            {activation?.cardholder || "YOUR NAME"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="opacity-70">Expires</p>
                          <p className="mt-0.5 text-sm font-medium">
                            {activation?.expiry || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!flipped && (
                    <div className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-1 rounded-full bg-slate-950/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                      <Hand className="h-3 w-3" />
                      Tap
                    </div>
                  )}
                </div>

                <div
                  className={`absolute inset-0 rounded-2xl p-5 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                    activated
                      ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-900/50"
                      : "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-slate-400/50"
                  }`}
                >
                  <div className="flex h-full flex-col items-center justify-center text-center text-white">
                    {activated ? (
                      <>
                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-white/15" />
                          <CheckCircle2 className="relative h-10 w-10" strokeWidth={2} />
                        </div>
                        <p className="mt-3 text-lg font-semibold">Card Activated</p>
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
                        <p className="mt-3 text-lg font-semibold">Awaiting Activation</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {activated ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        Your card is active
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        You can now use your SecureBank debit card for purchases and ATM
                        withdrawals.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Activation pending
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        Wait for confirmation. Tap the card again in a moment to re-check.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setFlipped((v) => !v)}
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
              >
                {flipped ? "Flip back" : "Tap to check status"}
              </button>

              <button
                onClick={() => {
                  clearSession();
                  setFlipped(false);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>

            <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Secure activation status
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function LoginForm({ loading }: { loading: boolean }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formatCard = (raw: string) =>
    raw
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = value.replace(/\s/g, "");
    if (digits.length < 15 || digits.length > 16) {
      setError("Enter your full 16-digit card number.");
      return;
    }
    setBusy(true);
    try {
      const row = await getActivationByCard(digits);
      if (!row) {
        setError(
          "No activation found for that card. Start a new activation to continue.",
        );
        return;
      }
      setSessionCardNumber(digits);
    } catch (err) {
      console.error(err);
      setError("Could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const startNewActivation = () => {
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="relative mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-xl shadow-slate-200/70">
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Lock className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Enter your card number to check activation.
            </p>
          </div>
        </div>
        <p className="relative mt-6 text-xs leading-relaxed text-slate-500">
          Already activated a card? Enter your 16-digit card number below to sign in and
          view its activation status from any device.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label
            htmlFor="cardNumber"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            Card number
          </label>
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              id="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234 5678 9012 3456"
              value={value}
              onChange={(e) => setValue(formatCard(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 font-mono text-base tracking-widest text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-violet-500 active:scale-[0.98] disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {busy ? "Signing in..." : "Sign in to My Card"}
        </button>

        <button
          type="button"
          onClick={startNewActivation}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
        >
          Start a new activation
        </button>
      </form>
    </section>
  );
}
