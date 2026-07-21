import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { CreditCard, Lock, ShieldCheck, Loader2, ChevronLeft, CheckCircle2 } from "lucide-react";
import {
  getStatus,
  subscribe,
  setCard,
  setStatus,
  clearActivation,
} from "@/lib/activation-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Activate Your Debit Card — SecureBank" },
      {
        name: "description",
        content:
          "Activate your new SecureBank debit card in a few secure steps. Enter your card details, verify with your PIN, and you're ready to go.",
      },
      { property: "og:title", content: "Activate Your Debit Card — SecureBank" },
      {
        property: "og:description",
        content: "Activate your new SecureBank debit card in a few secure steps. Enter your card details, verify with your PIN, and you're ready to go.",
      },
    ],
  }),
  component: Activation,
});

type Step = "details" | "pin" | "processing";

interface CardDetails {
  cardNumber: string;
  cardholder: string;
  expiry: string;
  cvv: string;
}

function Activation() {
  const navigate = useNavigate();
  const status = useSyncExternalStore(
    subscribe,
    () => getStatus(),
    () => "idle" as const,
  );
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<CardDetails>({
    cardNumber: "",
    cardholder: "",
    expiry: "",
    cvv: "",
  });
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);

  // If activation is already in progress or done, redirect to My Card page.
  useEffect(() => {
    if (status === "processing" || status === "activated") {
      navigate({ to: "/my-card" });
    }
  }, [status, navigate]);


  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = details.cardNumber.replace(/\s/g, "");
    if (digits.length < 15 || digits.length > 16) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!details.cardholder.trim()) {
      setError("Please enter the cardholder name.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(details.expiry)) {
      setError("Expiry must be in MM/YY format.");
      return;
    }
    if (details.cvv.length !== 3) {
      setError("CVV must be 3 digits.");
      return;
    }
    setStep("pin");
  };

  const handlePinChange = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[idx] = digit;
    setPin(next);
    if (digit && idx < 3) {
      const el = document.getElementById(`pin-${idx + 1}`);
      el?.focus();
    }
  };

  const handlePinSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.some((p) => p === "")) {
      setError("Please enter your full 4-digit PIN.");
      return;
    }
    setError(null);
    setCard({
      cardNumber: details.cardNumber,
      cardholder: details.cardholder,
      expiry: details.expiry,
      submittedAt: Date.now(),
    });
    setStatus("processing");
    navigate({ to: "/my-card" });
  };


  const formatCardNumber = (value: string) =>
    value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();

  const formatExpiry = (value: string) => {
    const d = value.replace(/\D/g, "").slice(0, 4);
    if (d.length < 3) return d;
    return `${d.slice(0, 2)}/${d.slice(2)}`;
  };

  const maskedCard = details.cardNumber
    ? `•••• •••• •••• ${details.cardNumber.replace(/\s/g, "").slice(-4).padStart(4, "•")}`
    : "•••• •••• •••• ••••";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          {step !== "processing" ? (
            <button
              onClick={() => {
                setError(null);
                if (step === "pin") setStep("details");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
              disabled={step === "details"}
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-10 w-10" />
          )}
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-300/80">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold text-slate-100">Card Activation</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to="/my-card"
              aria-label="My card"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95"
            >
              <CreditCard className="h-5 w-5 text-indigo-300" />
            </Link>
            <Link
              to="/admin"
              aria-label="Admin portal"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 transition hover:bg-white/10 active:scale-95"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </Link>
          </div>
        </header>

        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {(["details", "pin", "processing"] as Step[]).map((s, i) => {
            const active =
              ["details", "pin", "processing"].indexOf(step) >= i;
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  active ? "bg-indigo-400" : "bg-white/10"
                }`}
              />
            );
          })}
        </div>

        {/* Card visual */}
        <div className="mb-8 aspect-[1.6/1] w-full rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-indigo-900/50">
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
              <p className="font-mono text-lg tracking-widest">{maskedCard}</p>
              <div className="mt-3 flex items-end justify-between text-xs uppercase opacity-90">
                <div>
                  <p className="opacity-70">Cardholder</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {details.cardholder || "YOUR NAME"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="opacity-70">Expires</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {details.expiry || "MM/YY"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <section className="flex-1">
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Activate your card</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter the details printed on your new debit card.
                </p>
              </div>

              <Field label="Card number">
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={details.cardNumber}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        cardNumber: formatCardNumber(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-base tracking-wider text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </div>
              </Field>

              <Field label="Cardholder name">
                <input
                  autoComplete="cc-name"
                  placeholder="Full name on card"
                  value={details.cardholder}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      cardholder: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Expiry (MM/YY)">
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    value={details.expiry}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </Field>
                <Field label="CVV">
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="•••"
                    type="password"
                    maxLength={3}
                    value={details.cvv}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                      })
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base tracking-widest text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                </Field>
              </div>

              {error && <ErrorMsg message={error} />}

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition active:scale-[0.98]"
              >
                Verify Details
              </button>

              <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Your information is encrypted end-to-end
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-sm font-medium text-slate-200">
                  Already activated a card?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tap below to sign in with your card number.
                </p>
                <Link
                  to="/my-card"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  <CreditCard className="h-4 w-4" />
                  Tap to login using Card Number
                </Link>
              </div>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">Enter PIN to verify</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter the 4-digit PIN you set for your debit card.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                {pin.map((v, i) => (
                  <input
                    key={i}
                    id={`pin-${i}`}
                    inputMode="numeric"
                    type="password"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !pin[i] && i > 0) {
                        document.getElementById(`pin-${i - 1}`)?.focus();
                      }
                    }}
                    className="h-16 w-14 rounded-xl border border-white/10 bg-white/5 text-center text-2xl font-bold text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30"
                  />
                ))}
              </div>

              {error && <ErrorMsg message={error} />}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition active:scale-[0.98]"
              >
                Confirm PIN
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Never share your PIN with anyone
              </p>
            </form>
          )}

          {step === "processing" && <ProcessingView />}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}

function useActivationStatus() {
  return useSyncExternalStore(
    subscribe,
    () => getStatus(),
    () => "processing" as const,
  );
}

function ProcessingView() {
  const status = useActivationStatus();
  const activated = status === "activated";

  // Auto-reset after showing success so a new activation can start clean.
  useEffect(() => {
    if (!activated) return;
    const t = setTimeout(() => clearActivation(), 10_000);
    return () => clearTimeout(t);
  }, [activated]);

  if (activated) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20" />
          <div className="absolute inset-3 rounded-full bg-emerald-500/20" />
          <CheckCircle2 className="relative h-16 w-16 text-emerald-400" strokeWidth={2} />
        </div>

        <h2 className="mt-8 text-2xl font-semibold text-white">Card Activated</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
          Your debit card has been successfully activated and is ready to use.
        </p>

        <div className="mt-8 w-full space-y-3">
          <ProgressRow label="Details received" status="done" />
          <ProgressRow label="PIN verified" status="done" />
          <ProgressRow label="Admin confirmed" status="done" />
          <ProgressRow label="Card activated" status="done" />
        </div>

        <Link
          to="/my-card"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition active:scale-[0.98]"
        >
          <CreditCard className="h-4 w-4" />
          View my card
        </Link>

        <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          You're all set — enjoy your new card
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
        <div className="absolute inset-3 animate-pulse rounded-full bg-indigo-500/20" />
        <Loader2 className="relative h-14 w-14 animate-spin text-indigo-300" />
      </div>

      <h2 className="mt-8 text-xl font-semibold text-white">
        Card Activation In Process…
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
        We're verifying your details with our team. This usually takes a few
        moments. Please keep this screen open — an admin will confirm your card
        activation shortly.
      </p>

      <div className="mt-8 w-full space-y-3">
        <ProgressRow label="Details received" status="done" />
        <ProgressRow label="PIN verified" status="done" />
        <ProgressRow label="Awaiting admin confirmation" status="active" />
        <ProgressRow label="Card activated" status="pending" />
      </div>

      <Link
        to="/my-card"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
      >
        <CreditCard className="h-4 w-4" />
        Tap my card to check status
      </Link>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="h-3 w-3" />
        Secure connection
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  status,
}: {
  label: string;
  status: "done" | "active" | "pending";
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full ${
          status === "done"
            ? "bg-emerald-500/20 text-emerald-400"
            : status === "active"
              ? "bg-indigo-500/20 text-indigo-300"
              : "bg-white/5 text-slate-500"
        }`}
      >
        {status === "done" ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : status === "active" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
        )}
      </div>
      <span
        className={`text-sm ${
          status === "pending" ? "text-slate-500" : "text-slate-200"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
