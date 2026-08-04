import { apiFetch } from "./api";

/**
 * Tiny helper for the couple of one-off preference flags that used to live
 * directly in localStorage (sidebar collapsed state, "member since" date).
 * Backed by the `settings` key/value table in the database.
 */
export async function getSetting(key: string): Promise<string | null> {
  const res = await apiFetch<{ key: string; value: string | null }>(
    `/api/settings/${encodeURIComponent(key)}`
  );
  return res.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await apiFetch(`/api/settings/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}
