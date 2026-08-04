import { apiFetch } from "./api";

export type MailFolder = "inbox" | "sent";

export type EmailCategory =
  | "Application Received"
  | "Interview Call"
  | "Assessment Invite"
  | "Profile Update Requested"
  | "Job Portal Update Requested"
  | "Document Request"
  | "Waiting List"
  | "Will Be Informed Later"
  | "Internship Approved"
  | "Offer Letter"
  | "Job Confirmed"
  | "Approved"
  | "Rejected"
  | "Others";

export const EMAIL_CATEGORY_ORDER: EmailCategory[] = [
  "Application Received",
  "Interview Call",
  "Assessment Invite",
  "Profile Update Requested",
  "Job Portal Update Requested",
  "Document Request",
  "Waiting List",
  "Will Be Informed Later",
  "Internship Approved",
  "Offer Letter",
  "Job Confirmed",
  "Approved",
  "Rejected",
  "Others",
];

export interface EmailMeta {
  category?: EmailCategory;
  company?: string;
  position?: string;
  updatedAt: string;
}

export type EmailMetaMap = Record<string, EmailMeta>;

export function metaKey(folder: MailFolder, id: string): string {
  return `${folder}:${id}`;
}

/**
 * Email tag/category data used to live in localStorage — it's now persisted
 * in the `email_meta` table via the Express API so it survives across
 * browsers/devices.
 */
export async function loadEmailMeta(): Promise<EmailMetaMap> {
  return apiFetch<EmailMetaMap>("/api/email-meta");
}

export async function setEmailMeta(
  map: EmailMetaMap,
  folder: MailFolder,
  id: string,
  patch: Partial<Omit<EmailMeta, "updatedAt">>
): Promise<EmailMetaMap> {
  const res = await apiFetch<{ key: string; meta: EmailMeta }>(
    `/api/email-meta/${folder}/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(patch) }
  );
  return { ...map, [res.key]: res.meta };
}

/**
 * Batch version of setEmailMeta — used to auto-save AI/keyword suggestions
 * for a whole page of newly-synced mail in one API call instead of one per
 * message.
 */
export async function setManyEmailMeta(
  map: EmailMetaMap,
  folder: MailFolder,
  entries: { id: string; patch: Partial<Omit<EmailMeta, "updatedAt">> }[]
): Promise<EmailMetaMap> {
  if (entries.length === 0) return map;
  await apiFetch("/api/email-meta/batch", {
    method: "POST",
    body: JSON.stringify({ folder, entries }),
  });
  // Refetch so the returned map reflects exactly what the DB now holds.
  return loadEmailMeta();
}

export function getEmailMeta(
  map: EmailMetaMap,
  folder: MailFolder,
  id: string
): EmailMeta | undefined {
  return map[metaKey(folder, id)];
}

export function countByCategory(
  map: EmailMetaMap,
  folder: MailFolder
): Record<EmailCategory | "Uncategorized", number> {
  const base: Record<string, number> = { Uncategorized: 0 };
  EMAIL_CATEGORY_ORDER.forEach((c) => (base[c] = 0));
  const prefix = `${folder}:`;
  Object.entries(map).forEach(([key, meta]) => {
    if (!key.startsWith(prefix)) return;
    const cat = meta.category ?? "Uncategorized";
    base[cat] = (base[cat] ?? 0) + 1;
  });
  return base as Record<EmailCategory | "Uncategorized", number>;
}
