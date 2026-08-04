"use client";

import { useEffect, useState } from "react";
import { Eye, Save, Check } from "lucide-react";
import { GmailReply } from "@/lib/types";
import {
  EMAIL_CATEGORY_ORDER,
  EmailCategory,
  EmailMeta,
  MailFolder,
} from "@/lib/emailMeta";
import { styleForCategory } from "@/lib/categoryStyle";
import { cn, formatDate } from "@/lib/utils";
import { MailViewModal } from "./MailViewModal";

interface EmailCardProps {
  reply: GmailReply;
  folder: MailFolder;
  meta?: EmailMeta;
  onSave: (patch: {
    category?: EmailCategory;
    company?: string;
    position?: string;
  }) => void;
  sidebarCollapsed?: boolean;
}

export function EmailCard({
  reply,
  folder,
  meta,
  onSave,
  sidebarCollapsed,
}: EmailCardProps) {
  const [category, setCategory] = useState<EmailCategory | "">(
    meta?.category ?? "",
  );
  const [company, setCompany] = useState(
    meta?.company ?? reply.aiCompanyName ?? "",
  );
  const [position, setPosition] = useState(
    meta?.position ?? reply.aiPosition ?? "",
  );
  const [viewing, setViewing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setCategory(meta?.category ?? "");
    setCompany(meta?.company ?? reply.aiCompanyName ?? "");
    setPosition(meta?.position ?? reply.aiPosition ?? "");
  }, [
    meta?.category,
    meta?.company,
    meta?.position,
    reply.aiCompanyName,
    reply.aiPosition,
  ]);

  const dirty =
    category !== (meta?.category ?? "") ||
    company !== (meta?.company ?? "") ||
    position !== (meta?.position ?? "");

  const activeStyle = styleForCategory(
    (meta?.category as EmailCategory) || undefined,
  );
  const ActiveIcon = activeStyle.icon;

  const handleSave = () => {
    onSave({
      category: category ? (category as EmailCategory) : undefined,
      company: company.trim() || undefined,
      position: position.trim() || undefined,
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const counterpartName =
    folder === "inbox"
      ? reply.fromName || reply.fromEmail
      : reply.toName || reply.toEmail;
  const counterpartEmail = folder === "inbox" ? reply.fromEmail : reply.toEmail;
  const counterpartLabel = folder === "inbox" ? "From" : "To";

  const initials = (counterpartName || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <>
      <div className="group relative overflow-hidden rounded-lg border border-steel-100 bg-white shadow-panel transition-all duration-200 hover:shadow-float hover:-translate-y-0.5 hover:border-circuit-100">
        {/* colorful category accent rail — the "industrial" strip */}
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1 sm:w-1.5 transition-colors",
            activeStyle.dot,
          )}
          aria-hidden
        />

        <div className="px-3.5 pl-5 py-3.5 sm:px-5 sm:pl-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full font-display font-semibold text-xs sm:text-sm",
                  activeStyle.bg,
                  activeStyle.text,
                )}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wide text-steel-300">
                  {counterpartLabel}
                </div>
                <div className="text-sm font-medium text-ink truncate">
                  {counterpartName}
                </div>
                <div className="text-[11px] sm:text-xs text-steel-500 font-mono truncate">
                  {counterpartEmail}
                </div>
                <div className="text-sm text-ink mt-1.5 line-clamp-2 sm:truncate font-medium">
                  {reply.subject || "(no subject)"}
                </div>
                <p className="text-xs text-steel-500 mt-1 line-clamp-2">
                  {reply.snippet}
                </p>
              </div>
            </div>

            {/* status + action row — full width row on mobile, stacked column on larger screens */}
            <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:shrink-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 sm:px-2.5 text-[10px] sm:text-[11px] font-medium font-mono uppercase tracking-wide shadow-sm whitespace-nowrap",
                  activeStyle.text,
                  activeStyle.bg,
                  activeStyle.border,
                )}
              >
                <ActiveIcon size={12} />
                {meta?.category ?? "Uncategorized"}
              </span>
              <button
                onClick={() => setViewing(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-circuit/30 bg-circuit-100 text-circuit-600 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-circuit hover:text-white hover:border-circuit transition-colors whitespace-nowrap shrink-0"
              >
                <Eye size={12} />
                <span className="hidden xs:inline sm:inline">View mail</span>
                <span className="inline xs:hidden sm:hidden">View</span>
              </button>
            </div>
          </div>

          {/* control strip — industrial "panel" for classifying the message */}
          <div className="mt-3 sm:mt-3.5 pt-3 sm:pt-3.5 border-t border-steel-100">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:gap-2.5 rounded-md bg-fog-50 border border-steel-100 p-2 sm:p-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-steel-300 px-0.5">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as EmailCategory | "")
                  }
                  className="rounded-sm border border-steel-100 bg-white px-2.5 py-2 sm:py-1.5 text-xs text-ink outline-none focus:border-circuit focus:ring-1 focus:ring-circuit/30"
                >
                  <option value="">Not selected</option>
                  {EMAIL_CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-steel-300 px-0.5">
                  Company
                </span>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company"
                  className="rounded-sm border border-steel-100 bg-white px-2.5 py-2 sm:py-1.5 text-xs text-ink outline-none focus:border-circuit focus:ring-1 focus:ring-circuit/30 placeholder:text-steel-300"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-steel-300 px-0.5">
                  Position
                </span>
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Position"
                  className="rounded-sm border border-steel-100 bg-white px-2.5 py-2 sm:py-1.5 text-xs text-ink outline-none focus:border-circuit focus:ring-1 focus:ring-circuit/30 placeholder:text-steel-300"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={handleSave}
                  disabled={!dirty && !justSaved}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-sm text-xs font-semibold px-3 py-2 sm:py-1.5 transition-colors shrink-0 w-full sm:w-auto",
                    justSaved
                      ? "bg-success-100 text-success-700"
                      : "bg-signal hover:bg-signal-600 text-ink disabled:opacity-40 disabled:cursor-not-allowed shadow-panel",
                  )}
                >
                  {justSaved ? (
                    <>
                      <Check size={13} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5 text-[10px] sm:text-[11px] text-steel-300 font-mono gap-2">
            <span className="truncate">{formatDate(reply.receivedAt)}</span>
            {meta?.updatedAt && (
              <span className="truncate shrink-0">
                classified {formatDate(meta.updatedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      {viewing && (
        <MailViewModal
          fromName={reply.fromName}
          fromEmail={reply.fromEmail}
          toName={reply.toName}
          toEmail={reply.toEmail}
          subject={reply.subject}
          body={reply.body}
          receivedAt={reply.receivedAt}
          folder={folder}
          category={(meta?.category as EmailCategory) || undefined}
          company={meta?.company || company || undefined}
          position={meta?.position || position || undefined}
          sidebarCollapsed={sidebarCollapsed}
          onClose={() => setViewing(false)}
        />
      )}
    </>
  );
}