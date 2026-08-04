"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Link2 } from "lucide-react";
import {
  EmailCategory,
  EmailMeta,
  EmailMetaMap,
  getEmailMeta,
} from "@/lib/emailMeta";
import { GmailReply, JobApplication } from "@/lib/types";
import { EmailCard } from "./EmailCard";

interface MatchedRepliesSectionProps {
  matchedMail: { reply: GmailReply; app: JobApplication }[];
  emailMeta: EmailMetaMap;
  onUpdateMeta: (id: string, patch: Partial<Omit<EmailMeta, "updatedAt">>) => void;
  categoryFilter: EmailCategory | "Uncategorized" | "All";
  sidebarCollapsed?: boolean;
}

const PAGE_SIZE = 40;

/**
 * Every synced reply whose sender/company matches one of the person's
 * logged applications (same matching used for the small "Matched to your
 * applications" preview on the dashboard), shown here in full with the
 * same classify/save controls as Inbox and Sent. Replies stay Uncategorized
 * until manually saved — nothing here is auto-classified either.
 */
export function MatchedRepliesSection({
  matchedMail,
  emailMeta,
  onUpdateMeta,
  categoryFilter,
  sidebarCollapsed,
}: MatchedRepliesSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoryFilter]);

  const visible = matchedMail.filter(({ reply: r }) => {
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
          <Link2 size={15} className="shrink-0 text-circuit" />
          <span className="truncate">
            Replies matched to your logged applications by company
          </span>
        </div>
        <span className="relative shrink-0 text-xs font-mono text-fog-50/70">
          {matchedMail.length} matched
        </span>
      </div>

      {matchedMail.length === 0 && (
        <div className="text-center py-12 text-sm text-steel-500 bg-white border border-steel-100 rounded-lg">
          No matches yet — this fills in once an incoming email&apos;s sender or
          company matches one of the applications you&apos;ve logged with
          &quot;+ Log application&quot;.
        </div>
      )}

      {matchedMail.length > 0 && visible.length === 0 && (
        <div className="text-center py-12 text-sm text-steel-500 bg-white border border-steel-100 rounded-lg">
          Nothing in this category yet.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map(({ reply: r, app }) => {
          const meta = getEmailMeta(emailMeta, "inbox", r.id);
          return (
            <div key={r.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono uppercase tracking-wide text-circuit-600">
                <Link2 size={11} className="shrink-0" />
                <span className="truncate">
                  Matches your application — {app.companyName} · {app.position}
                </span>
              </div>
              <EmailCard
                reply={r}
                folder="inbox"
                meta={meta}
                onSave={(patch) => onUpdateMeta(r.id, patch)}
                sidebarCollapsed={sidebarCollapsed}
              />
            </div>
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