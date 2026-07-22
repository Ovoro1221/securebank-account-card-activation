// Simple shared activation status store using localStorage + cross-tab events.
// Not real auth or backend — just enough to demo the admin-confirms-activation flow.

export type ActivationStatus = "idle" | "processing" | "activated";

const KEY = "card-activation-status";
const CARD_KEY = "card-activation-details";
const SESSION_KEY = "card-session-active";
const RECORDS_KEY = "card-activation-records";
const EVENT = "card-activation-change";

export interface StoredCard {
  cardNumber: string;
  cardholder: string;
  expiry: string;
  submittedAt: number;
}

interface StoredCardRecord extends StoredCard {
  status: ActivationStatus;
}

function normalizeCardNumber(cardNumber: string) {
  return cardNumber.replace(/\s+/g, "");
}

function getRecords(): Record<string, StoredCardRecord> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(RECORDS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, StoredCardRecord>;
  } catch {
    return {};
  }
}

function setRecords(records: Record<string, StoredCardRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getStatus(): ActivationStatus {
  if (typeof window === "undefined") return "idle";
  return (localStorage.getItem(KEY) as ActivationStatus) || "idle";
}

export function setStatus(status: ActivationStatus) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, status);
  const card = getCard();
  if (card) {
    const records = getRecords();
    const cardKey = normalizeCardNumber(card.cardNumber);
    records[cardKey] = { ...card, status };
    setRecords(records);
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

let cachedRaw: string | null = null;
let cachedCard: StoredCard | null = null;

export function getCard(): StoredCard | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CARD_KEY);
  if (raw === cachedRaw) return cachedCard;
  cachedRaw = raw;
  if (!raw) {
    cachedCard = null;
    return null;
  }
  try {
    cachedCard = JSON.parse(raw) as StoredCard;
  } catch {
    cachedCard = null;
  }
  return cachedCard;
}

export function setCard(card: StoredCard) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CARD_KEY, JSON.stringify(card));
  localStorage.setItem(SESSION_KEY, "1");
  const records = getRecords();
  records[normalizeCardNumber(card.cardNumber)] = { ...card, status: "processing" };
  setRecords(records);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearActivation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(CARD_KEY);
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_KEY) === "1";
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function loginWithCardNumber(cardNumber: string): boolean {
  if (typeof window === "undefined") return false;
  const normalizedInput = normalizeCardNumber(cardNumber);
  const records = getRecords();
  const record = records[normalizedInput];
  if (record) {
    const { status, ...card } = record;
    localStorage.setItem(CARD_KEY, JSON.stringify(card));
    localStorage.setItem(KEY, status);
    localStorage.setItem(SESSION_KEY, "1");
    window.dispatchEvent(new CustomEvent(EVENT));
    return true;
  }
  const card = getCard();
  if (!card) return false;
  if (normalizeCardNumber(card.cardNumber) !== normalizedInput) return false;
  localStorage.setItem(SESSION_KEY, "1");
  window.dispatchEvent(new CustomEvent(EVENT));
  return true;
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
