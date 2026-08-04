"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mail, RefreshCw, LogOut } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { EmailCategory, EmailMeta, EmailMetaMap, getEmailMeta } from "@/lib/emailMeta";
import { useGmailInbox } from "@/lib/useGmailInbox";
import { timeAgo } from "@/lib/utils";
import { EmailCard } from "./EmailCard";

interface InboxSectionProps {
  emailMeta: EmailMetaMap;
  onUpdateMeta: (id: string, patch: Partial<Omit<EmailMeta, "updatedAt">>) => void;
  categoryFilter: EmailCategory | "Uncategorized" | "All";
  sidebarCollapsed?: boolean;
}

const PAGE_SIZE = 40;

export function InboxSection({
  emailMeta,
  onUpdateMeta,
  categoryFilter,
  sidebarCollapsed,
}: InboxSectionProps) {
  const { session, status, replies, loading, error, lastSyncedAt, refresh } =
    useGmailInbox("inbox");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Jump back to the first page whenever the category filter changes, so
  // switching filters doesn't leave "See more" stuck deep into a list that
  // no longer applies.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoryFilter]);

  // NOTE: mail is intentionally left Uncategorized until the person picks a
  // category from the dropdown below and clicks Save — nothing is
  // auto-saved on sync. The suggested category is still shown as a hint in
  // the dropdown's placeholder option (see EmailCard), the person just has
  // to confirm it themselves.

  if (status === "loading") {
    return <div className="text-sm text-steel-500">Checking connection…</div>;
  }

  if (status !== "authenticated") {
    return (
      <div className="bg-white border border-steel-100 rounded-lg shadow-panel p-8 flex flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-circuit-100 text-circuit mb-4">
          <Mail size={20} />
        </div>
        <div className="font-display font-semibold text-ink text-base">
          Connect your Gmail inbox
        </div>
        <p className="text-sm text-steel-500 mt-1.5 max-w-md">
          Once connected, mail sent to you — interview invites, offers, rejections — is pulled in
          automatically here and kept in sync in the background. Open any message, then set its
          category, company, and position yourself, exactly the way you want it organized.
        </p>
        <button
          onClick={() => signIn("google", { callbackUrl: "/profile" })}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal hover:bg-signal-600 text-ink font-semibold text-sm px-4 py-2 transition-colors shadow-panel"
        >
          Connect Gmail
        </button>
        <p className="text-[11px] text-steel-500 mt-3 max-w-md">
          This requires the app owner to have set up a Google OAuth client (see README) — read-only
          access to Gmail is requested, and nothing is ever sent out from your account.
        </p>
      </div>
    );
  }

  const visible = replies.filter((r) => {
    if (categoryFilter === "All") return true;
    const meta = getEmailMeta(emailMeta, "inbox", r.id);
    const category = meta?.category ?? "Uncategorized";
    return category === categoryFilter;
  });
  const shown = visible.slice(0, visibleCount);
  const hasMore = visible.length > shown.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden flex items-center justify-between gap-3 bg-ink text-fog-50 rounded-lg shadow-float px-5 py-3.5">
        <div className="absolute inset-0 bg-blueprint bg-grid opacity-20 pointer-events-none" aria-hidden />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-signal via-circuit to-teal" aria-hidden />
        <div className="relative flex items-center gap-2.5 text-sm min-w-0">
          <span className={loading ? "h-2 w-2 rounded-full bg-signal animate-pulse shrink-0" : "h-2 w-2 rounded-full bg-success shrink-0 shadow-[0_0_6px_rgba(47,125,79,0.7)]"} />
          <span className="truncate">
            Connected as <strong className="text-fog-50">{session?.user?.email}</strong>
            {lastSyncedAt && !loading && (
              <span className="text-steel-300 font-normal"> · synced {timeAgo(lastSyncedAt)}</span>
            )}
          </span>
        </div>
        <div className="relative flex items-center gap-2 shrink-0">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-fog-50/15 bg-fog-50/5 px-3 py-1.5 text-xs font-medium text-fog-50 hover:bg-circuit-600/30 hover:border-circuit/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {loading ? "Syncing…" : "Sync now"}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="inline-flex items-center gap-1.5 rounded-md border border-fog-50/15 bg-fog-50/5 px-3 py-1.5 text-xs font-medium text-fog-50 hover:bg-danger/20 hover:border-danger/40 hover:text-danger transition-colors"
          >
            <LogOut size={13} />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 text-sm text-danger bg-danger-100 border border-danger/30 rounded-md px-4 py-3">
          <span>{error}</span>
          {error.toLowerCase().includes("sign in again") && (
            <button
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
              className="shrink-0 rounded-md bg-white border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger-100 transition-colors"
            >
              Sign in again
            </button>
          )}
        </div>
      )}

      {!error && replies.length === 0 && !loading && (
        <div className="text-center py-12 text-sm text-steel-500 bg-white border border-steel-100 rounded-lg">
          No job-related mail found in your inbox in the last 120 days.
        </div>
      )}

      {!error && replies.length > 0 && visible.length === 0 && (
        <div className="text-center py-12 text-sm text-steel-500 bg-white border border-steel-100 rounded-lg">
          Nothing in this category yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map((r) => {
          const meta = getEmailMeta(emailMeta, "inbox", r.id);
          return (
            <EmailCard
              key={r.id}
              reply={r}
              folder="inbox"
              meta={meta}
              onSave={(patch) => onUpdateMeta(r.id, patch)}
              sidebarCollapsed={sidebarCollapsed}
            />
          );
        })}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-1.5 pt-1 pb-3">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 rounded-md border border-steel-100 bg-white px-4 py-2 text-xs font-semibold text-steel-700 hover:border-circuit hover:text-circuit-600 transition-colors shadow-panel"
          >
            <ChevronDown size={14} />
            See more ({shown.length} of {visible.length})
          </button>
        </div>
      )}
    </div>
  );
}