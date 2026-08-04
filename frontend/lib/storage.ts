import { JobApplication, JobApplicationInput } from "./types";
import { apiFetch, ApiError } from "./api";

/**
 * All application data now lives in the SQLite database behind the Express
 * API (see /backend). These functions used to read/write localStorage —
 * they now hit REST endpoints instead, but keep similar names/shapes so the
 * rest of the app didn't need a full rewrite.
 */

export async function loadApplications(): Promise<JobApplication[]> {
  return apiFetch<JobApplication[]>("/api/applications");
}

export async function addApplication(
  input: JobApplicationInput
): Promise<{ created?: JobApplication; duplicate?: JobApplication }> {
  try {
    const res = await apiFetch<{ created: JobApplication }>("/api/applications", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return { created: res.created };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { duplicate: err.payload?.duplicate };
    }
    throw err;
  }
}

export async function updateApplication(
  id: string,
  input: JobApplicationInput
): Promise<{ updated?: JobApplication; duplicate?: JobApplication }> {
  try {
    const res = await apiFetch<{ updated: JobApplication }>(`/api/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return { updated: res.updated };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { duplicate: err.payload?.duplicate };
    }
    throw err;
  }
}

export async function deleteApplication(id: string): Promise<void> {
  await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
}

export async function clearApplications(): Promise<void> {
  await apiFetch("/api/applications", { method: "DELETE" });
}

export async function setStatus(
  id: string,
  status: JobApplication["status"]
): Promise<JobApplication | undefined> {
  const res = await apiFetch<{ updated: JobApplication }>(
    `/api/applications/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
  return res.updated;
}

export async function applyReplyToApplication(
  id: string,
  reply: {
    snippet: string;
    fromEmail: string;
    receivedAt: string;
    status?: JobApplication["status"];
  }
): Promise<JobApplication | undefined> {
  const res = await apiFetch<{ updated: JobApplication }>(
    `/api/applications/${id}/reply`,
    { method: "PATCH", body: JSON.stringify(reply) }
  );
  return res.updated;
}

export function toCsv(apps: JobApplication[]): string {
  const headers = [
    "Company",
    "Position",
    "Position Type",
    "Email",
    "Applied",
    "Status",
    "Job Link",
    "Applied Date",
    "Follow-up Date",
    "Resume Version",
    "Notes",
    "Last Reply From",
    "Last Reply Snippet",
  ];
  const rows = apps.map((a) => [
    a.companyName,
    a.position,
    a.positionType,
    a.email,
    a.applied ? "Yes" : "No",
    a.status,
    a.jobLink,
    a.appliedDate ?? "",
    a.followUpDate ?? "",
    a.resumeVersion ?? "",
    (a.notes ?? "").replace(/\n/g, " "),
    a.replyFrom ?? "",
    (a.replySnippet ?? "").replace(/\n/g, " "),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(","))
    .join("\n");
}
