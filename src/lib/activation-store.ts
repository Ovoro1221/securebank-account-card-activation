// Simple shared activation status store using localStorage + cross-tab events.
// Not real auth or backend — just enough to demo the admin-confirms-activation flow.

export type ActivationStatus = "idle" | "processing" | "activated";

const KEY = "card-activation-status";
const CARD_KEY = "card-activation-details";
const EVENT = "card-activation-change";

export interface StoredCard {
  cardNumber: string;
  cardholder: string;
  expiry: string;
  submittedAt: number;
}

export function getStatus(): ActivationStatus {
  if (typeof window === "undefined") return "idle";
  return (localStorage.getItem(KEY) as ActivationStatus) || "idle";
}

export function setStatus(status: ActivationStatus) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, status);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getCard(): StoredCard | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CARD_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCard;
  } catch {
    return null;
  }
}

export function setCard(card: StoredCard) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARD_KEY, JSON.stringify(card));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearActivation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CARD_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
