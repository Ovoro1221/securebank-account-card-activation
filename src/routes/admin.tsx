import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import {
  ShieldCheck,
  Lock,
  LogOut,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import {
  getStatus,
  getCard,
  setStatus,
  subscribe,
  clearActivation,
  type StoredCard,
  type ActivationStatus,
} from "@/lib/activation-store";

// Demo credentials — this is a UI mock, not real auth.
const ADMIN_USER = "igbayiola123@gmail.com";
const ADMIN_PASS = "Igbayiola123$";
const SESSION_KEY = "admin-session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — SecureBank" },
      { name: "description", content: "Internal admin portal for confirming card activations." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPortal,
});

function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => (typeof window === "undefined" ? false : localStorage.getItem(SESSION_KEY) === "1"),
    () => false,
  );
}

function AdminPortal() {
  const authed = useSession();
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10"
            aria-label="Back to app"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-300/80">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold">Admin Portal</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
        </header>

        {authed ? <Dashboard /> : <LoginForm />}
      </div>
    </main>
  );
}

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (username.trim().toLowerCase() === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem(SESSION_KEY, "1");
      window.dispatchEvent(new CustomEvent("card-activation-change"));
      setError(null);
    } else {
      setError("Invalid credentials.");
    }
  };

  return (
    <section className="flex-1">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/5">
          <div className="absolute inset-3 rounded-full bg-emerald-500/10" />
          <ShieldCheck className="relative h-10 w-10 text-emerald-400" strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Admin sign in</h2>
        <p className="mt-1 text-sm text-slate-400">
          Restricted area. Authorized personnel only.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Email
          </span>
          <input
            type="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-base outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition active:scale-[0.98]"
        >
          Sign In
        </button>

        <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-500">
          <Lock className="h-3 w-3" />
          Restricted access — authorized admins only
        </p>
      </form>
    </section>
  );
}

function Dashboard() {
  const status = useSyncExternalStore(
    subscribe,
    () => getStatus() as ActivationStatus,
    () => "idle" as ActivationStatus,
  );
  const card = useSyncExternalStore<StoredCard | null>(
    subscribe,
    () => getCard(),
    () => null,
  );
  const navigate = useNavigate();

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("card-activation-change"));
  };

  const confirm = () => {
    setStatus("activated");
  };

  const last4 = card?.cardNumber.replace(/\s/g, "").slice(-4) ?? "----";

  return (
    <section className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pending activations</h2>
          <p className="text-sm text-slate-400">Confirm to complete customer flow.</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      {status === "idle" || !card ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-300">No pending requests</p>
          <p className="mt-1 text-xs text-slate-500">
            New activations will appear here for confirmation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{card.cardholder || "Cardholder"}</p>
                  <p className="text-xs text-slate-400">Debit •••• {last4}</p>
                </div>
              </div>
              <StatusPill status={status} />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Expires" value={card.expiry || "—"} />
              <Detail
                label="Submitted"
                value={new Date(card.submittedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </dl>
          </div>

          {status === "processing" ? (
            <button
              onClick={confirm}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition active:scale-[0.98]"
            >
              Confirm Card Processing
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3.5 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
                Card Activated
              </div>
              <button
                onClick={() => {
                  clearActivation();
                  navigate({ to: "/admin" });
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Clear queue
              </button>
            </div>
          )}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-500">
        <ShieldCheck className="h-3 w-3 text-emerald-400" />
        Internal admin console
      </p>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-200">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: ActivationStatus }) {
  if (status === "activated") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Activated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
}
