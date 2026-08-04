"use client";

import { X, Mail, Send, Building2, BriefcaseBusiness } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { EmailCategory, MailFolder } from "@/lib/emailMeta";
import { styleForCategory } from "@/lib/categoryStyle";
import { cn } from "@/lib/utils";

interface MailViewModalProps {
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  body: string;
  receivedAt: string;
  folder?: MailFolder;
  category?: EmailCategory;
  company?: string;
  position?: string;
  // Whether the app's own left nav sidebar is collapsed — used to leave the
  // right amount of room on the left so this drawer stays inside the main
  // page (it never covers the nav sidebar) instead of the whole viewport.
  sidebarCollapsed?: boolean;
  onClose: () => void;
}

export function MailViewModal({
  fromName,
  fromEmail,
  toName,
  toEmail,
  subject,
  body,
  receivedAt,
  folder = "inbox",
  category,
  company,
  position,
  sidebarCollapsed,
  onClose,
}: MailViewModalProps) {
  const style = styleForCategory(category);
  const CategoryIcon = style.icon;
  const FolderIcon = folder === "inbox" ? Mail : Send;

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 left-0 z-50 flex justify-end bg-ink/55 backdrop-blur-[2px] overlay-fade-in",
        // On large screens the nav sidebar is visible (68px collapsed /
        // 256px expanded) — start the overlay right after it so this stays
        // "inside" the main page instead of covering the whole screen.
        sidebarCollapsed ? "lg:left-[68px]" : "lg:left-64",
      )}
      onClick={onClose}
    >
      {/* Right-side drawer — a little over half of the main content width */}
      <div
        className="drawer-slide-in relative h-full w-full sm:w-[85%] lg:w-2/3 bg-white shadow-float flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Industrial header panel */}
        <div className="relative shrink-0 overflow-hidden bg-ink text-fog-50 px-6 py-5">
          <div
            className="absolute inset-0 bg-blueprint bg-grid opacity-25 pointer-events-none"
            aria-hidden
          />
          <div
            className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-signal via-circuit to-teal"
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-circuit-600/30 text-fog-50 border border-fog-50/10">
                <FolderIcon size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-steel-300">
                  {folder === "inbox" ? "Incoming message" : "Sent message"}
                </div>
                <div className="font-display font-semibold text-lg leading-snug break-words mt-0.5">
                  {subject || "(no subject)"}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-sm text-steel-300 hover:bg-fog-50/10 hover:text-fog-50 transition-colors"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          <div className="relative mt-4 flex flex-col gap-1.5 text-xs">
            <div className="text-steel-300">
              From{" "}
              <span className="text-fog-50 font-medium">
                {fromName || fromEmail}
              </span>{" "}
              <span className="font-mono text-steel-300">
                {fromEmail && `<${fromEmail}>`}
              </span>
            </div>
            <div className="text-steel-300">
              To{" "}
              <span className="text-fog-50 font-medium">
                {toName || toEmail}
              </span>{" "}
              <span className="font-mono text-steel-300">
                {toEmail && `<${toEmail}>`}
              </span>
            </div>
            <div className="text-steel-300 font-mono">
              {formatDate(receivedAt)}
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2 mt-4">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium font-mono uppercase tracking-wide",
                style.text,
                style.bg,
                style.border,
              )}
            >
              <CategoryIcon size={12} />
              {category ?? "Uncategorized"}
            </span>
            {company && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fog-50/15 bg-fog-50/10 text-fog-50 px-3 py-1 text-[11px] font-medium">
                <Building2 size={12} />
                {company}
              </span>
            )}
            {position && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fog-50/15 bg-fog-50/10 text-fog-50 px-3 py-1 text-[11px] font-medium">
                <BriefcaseBusiness size={12} />
                {position}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-fog-50">
          <div className="bg-white border border-steel-100 rounded-lg shadow-panel px-6 py-5 text-sm text-ink whitespace-pre-wrap leading-relaxed">
            {body || "This message has no readable body."}
          </div>
        </div>
      </div>
    </div>
  );
}
