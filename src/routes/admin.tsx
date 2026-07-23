import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  ShieldCheck,
  Lock,
  LogOut,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronLeft,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  listActivations,
  confirmActivation,
  deleteActivation,
  subscribeToActivations,
  type Activation,
} from "@/lib/activations";

const ADMIN_USER = "igbayiola123@gmail.com";
const ADMIN_PASS = "Igbayiola123$";
const SESSION_KEY = "admin-session";
const ADMIN_EVENT = "admin-session-change";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — SecureBank" },
      { name: "description", content: "Internal admin portal for confirming card activations." },
      { property: "og:title", content: "Admin Portal — SecureBank" },
      { property: "og:description", content: "Internal admin portal for confirming card activations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPortal,
});

function subscribeAdmin(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const h = () => cb();
  window.addEventListener(ADMIN_EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(ADMIN_EVENT, h);
    window.removeEventListener("storage", h);
  };
}

function useAdminSession() {
  return useSyncExternalStore(
    subscribeAdmin,
    () => (typeof window === "undefined" ? false : localStorage.getItem(SESSION_KEY) === "1"),
    () => false,
  );
}

function AdminPortal() {
  const authed = useAdminSession();
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        <header className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Back to app"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">
              SecureBank
            </p>
            <h1 className="text-sm font-semibold">Admin Portal</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
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
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT));
      setError(null);
    } else {
      setError("Invalid credentials.");
    }
  };

  return (
    <section className="flex-1">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
          <div className="absolute inset-3 rounded-full bg-emerald-100" />
          <ShieldCheck className="relative h-10 w-10 text-emerald-600" strokeWidth={1.8} />
        </div>
        <h2 className="mt-6 text-xl font-semibold">Admin sign in</h2>
        <p className="mt-1 text-sm text-slate-500">
          Restricted area. Authorized personnel only.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Email
          </span>
          <input
            type="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
  const [rows, setRows] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    listActivations()
      .then(setRows)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeToActivations(refresh);
    return unsub;
  }, []);

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT));
  };

  const handleConfirm = async (id: string) => {
    setBusyId(id);
    try {
      await confirmActivation(id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteActivation(id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const pending = rows.filter((r) => r.status === "processing");
  const activated = rows.filter((r) => r.status === "activated");

  return (
    <section className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Activations</h2>
          <p className="text-sm text-slate-500">
            {pending.length} pending · {activated.length} activated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-800">
            {loading ? "Loading activations..." : "No activation requests yet"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            New activations from any user will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <ActivationCard
              key={row.id}
              row={row}
              busy={busyId === row.id}
              onConfirm={() => handleConfirm(row.id)}
              onDelete={() => handleDelete(row.id)}
            />
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-500">
        <ShieldCheck className="h-3 w-3 text-emerald-500" />
        Internal admin console · live updates
      </p>
    </section>
  );
}

function ActivationCard({
  row,
  busy,
  onConfirm,
  onDelete,
}: {
  row: Activation;
  busy: boolean;
  onConfirm: () => void;
  onDelete: () => void;
}) {
  const last4 = row.card_number.slice(-4);
  const submitted = new Date(row.submitted_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">{row.cardholder}</p>
            <p className="text-xs text-slate-500">Debit •••• {last4}</p>
          </div>
        </div>
        <StatusPill status={row.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Detail label="Expires" value={row.expiry} />
        <Detail label="Submitted" value={submitted} />
      </dl>

      <div className="mt-4 flex gap-2">
        {row.status === "processing" ? (
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Confirming..." : "Confirm Activation"}
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Activated
          </div>
        )}
        <button
          onClick={onDelete}
          disabled={busy}
          aria-label="Delete"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function StatusPill({ status }: { status: Activation["status"] }) {
  if (status === "activated") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Activated
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
}
