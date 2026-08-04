"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock3,
  Fingerprint,
  Inbox as InboxIcon,
  Laptop2,
  LogOut,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { loadApplications } from "@/lib/storage";
import {
  countByCategory,
  loadEmailMeta,
  EMAIL_CATEGORY_ORDER,
} from "@/lib/emailMeta";
import { CATEGORY_STYLE } from "@/lib/categoryStyle";
import { useGmailInbox } from "@/lib/useGmailInbox";
import { isOverdue, timeAgo, formatDate } from "@/lib/utils";
import { getSetting, setSetting } from "@/lib/settings";

const MEMBER_SINCE_KEY = "job-tracker:signed-in-since";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [memberSince, setMemberSince] = useState<string | undefined>();
  const [imgError, setImgError] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const inbox = useGmailInbox("inbox");
  const sent = useGmailInbox("sent");

  useEffect(() => {
    (async () => {
      try {
        const apps = await loadApplications();
        setApplicationsCount(apps.length);
        setOverdueCount(
          apps.filter(
            (a) =>
              isOverdue(a.followUpDate) &&
              a.status !== "Rejected" &&
              a.status !== "Offer" &&
              a.status !== "Withdrawn",
          ).length,
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const existing = await getSetting(MEMBER_SINCE_KEY);
        if (existing) {
          setMemberSince(existing);
        } else {
          const now = new Date().toISOString();
          await setSetting(MEMBER_SINCE_KEY, now);
          setMemberSince(now);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [status]);

  useEffect(() => {
    (async () => {
      try {
        const meta = await loadEmailMeta();
        const inboxCounts = countByCategory(meta, "inbox");
        const sentCounts = countByCategory(meta, "sent");
        const merged: Record<string, number> = {};
        EMAIL_CATEGORY_ORDER.forEach((c) => {
          merged[c] = (inboxCounts[c] ?? 0) + (sentCounts[c] ?? 0);
        });
        setCategoryCounts(merged);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [inbox.replies, sent.replies]);

  const totalMailSynced = inbox.replies.length + sent.replies.length;
  const mostRecentSync = [inbox.lastSyncedAt, sent.lastSyncedAt]
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const isSyncing = inbox.loading || sent.loading;
  const activeCategories = EMAIL_CATEGORY_ORDER.filter(
    (c) => categoryCounts[c] > 0,
  );

  const statPill = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
    accent?: "danger",
  ) => (
    <div className="group rounded-xl bg-fog-50 border border-steel-100 px-4 py-3.5 flex items-center gap-3 transition-all hover:border-circuit-200 hover:bg-white hover:shadow-sm">
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
          accent === "danger"
            ? "bg-danger-100 text-danger"
            : "bg-circuit-100 text-circuit"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-steel-500 text-[10px] font-mono uppercase tracking-wide truncate">
          {label}
        </div>
        <div
          className={`font-display font-semibold text-xl mt-0.5 leading-none break-words ${
            accent === "danger" ? "text-danger" : "text-ink"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );

  const detailRow = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
  ) => (
    <div className="flex items-center gap-3 rounded-lg bg-fog-50 border border-steel-100 px-3.5 py-3">
      <div className="h-9 w-9 rounded-lg bg-white border border-steel-100 flex items-center justify-center text-circuit shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-mono uppercase tracking-wide text-steel-500">
          {label}
        </div>
        <div className="text-ink text-sm font-medium mt-0.5 break-words">
          {value}
        </div>
      </div>
    </div>
  );

  const initials = (session?.user?.name ?? session?.user?.email ?? "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="min-h-screen w-full bg-fog-50 flex flex-col">
      <header className="border-b border-steel-100 bg-white px-5 sm:px-8 py-3.5 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-700 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 sm:px-5 py-6">
        {status === "loading" && (
          <div className="bg-white border border-steel-100 rounded-xl shadow-panel p-8 text-sm text-steel-500">
            Loading your account…
          </div>
        )}

        {status !== "loading" && status !== "authenticated" && (
          <div className="bg-white border border-steel-100 rounded-xl shadow-panel p-8 flex flex-col items-center text-center max-w-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-circuit-100 text-circuit mb-4">
              <User size={22} />
            </div>
            <div className="font-display font-semibold text-ink text-base">
              You're not signed in
            </div>
            <p className="text-sm text-steel-500 mt-1.5 max-w-sm">
              Sign in with Google to see your profile and connect your Gmail
              inbox for automatic application-mail syncing.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/profile" })}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal hover:bg-signal-600 text-ink font-semibold text-sm px-4 py-2 transition-colors shadow-panel"
            >
              Continue with Google
            </button>
          </div>
        )}

        {status === "authenticated" && (
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
            {/* LEFT: profile summary column */}
            <div className="bg-white border border-steel-100 rounded-2xl shadow-float overflow-hidden flex flex-col">
              <div className="h-2 bg-circuit shrink-0" aria-hidden />
              <div className="px-6 pt-6 pb-6 flex flex-col">
                <div className="relative w-fit">
                  {session.user?.image && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "Profile photo"}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="h-[104px] w-[104px] rounded-full ring-4 ring-fog-100 object-cover shadow-sm bg-fog-100"
                    />
                  ) : (
                    <span className="h-[104px] w-[104px] rounded-full ring-4 ring-fog-100 bg-circuit text-white flex items-center justify-center text-3xl font-display font-semibold shadow-sm">
                      {initials}
                    </span>
                  )}
                  <span
                    className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-success ring-[3px] ring-white"
                    title="Online"
                  />
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display font-semibold text-ink text-lg leading-tight break-words">
                      {session.user?.name ?? "Signed-in user"}
                    </span>
                  </div>
                  <span
                    title="Verified Google account"
                    className="inline-flex items-center gap-1 rounded-full bg-success-100 text-success-700 text-[11px] font-semibold px-2.5 py-1 mt-2"
                  >
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                  <div className="text-sm text-steel-500 break-words mt-2.5">
                    {session.user?.email}
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-steel-100 flex flex-col gap-2.5">
                  {detailRow(
                    <ShieldCheck size={16} />,
                    "Signed in with",
                    "Google OAuth",
                  )}
                  {detailRow(
                    <Calendar size={16} />,
                    "Signed in since",
                    memberSince ? formatDate(memberSince) : "—",
                  )}
                  {detailRow(
                    <Laptop2 size={16} />,
                    "Data storage",
                    "This device",
                  )}
                </div>

                <div className="mt-auto pt-5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-steel-100 px-4 py-2.5 text-sm font-medium text-steel-700 hover:bg-danger-100 hover:text-danger hover:border-danger/30 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out &amp; disconnect Gmail
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: details column */}
            <div className="flex flex-col gap-5">
              {/* Top stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                {statPill(
                  <Briefcase size={17} />,
                  "Applications",
                  applicationsCount,
                )}
                {statPill(
                  <Clock3 size={17} />,
                  "Follow-ups due",
                  overdueCount,
                  overdueCount > 0 ? "danger" : undefined,
                )}
                {statPill(<Mail size={17} />, "Mail synced", totalMailSynced)}
                {statPill(
                  <Calendar size={17} />,
                  "Since",
                  memberSince ? formatDate(memberSince) : "—",
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                {/* Account details */}
                <div className="bg-white border border-steel-100 rounded-2xl shadow-panel p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2 text-base font-display font-semibold text-ink">
                    <Fingerprint size={18} className="text-circuit" />
                    Account details
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {detailRow(
                      <User size={16} />,
                      "Full name",
                      session.user?.name ?? "—",
                    )}
                    {detailRow(
                      <Mail size={16} />,
                      "Email",
                      session.user?.email ?? "—",
                    )}
                    {detailRow(
                      <ShieldCheck size={16} />,
                      "Gmail access",
                      "Read-only",
                    )}
                  </div>

                  <div className="pt-5 border-t border-steel-100">
                    <div className="text-[10px] font-mono uppercase tracking-wide text-steel-500 mb-3">
                      What we can see
                    </div>
                    <ul className="flex flex-col gap-3 text-sm text-steel-600">
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        Subject lines &amp; senders of application-related mail
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        We never send, delete, or modify your emails
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        All parsed data stays on this device
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Gmail connection */}
                <div className="bg-white border border-steel-100 rounded-2xl shadow-panel p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2 text-base font-display font-semibold text-ink">
                      <Mail size={18} className="text-circuit" />
                      Gmail sync
                    </div>
                    <button
                      onClick={() => {
                        inbox.refresh();
                        sent.refresh();
                      }}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-steel-100 px-2.5 py-1.5 text-xs font-medium text-steel-700 hover:bg-fog-100 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        size={12}
                        className={isSyncing ? "animate-spin" : ""}
                      />
                      {isSyncing ? "Syncing…" : "Sync"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-ink shrink-0">
                    <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                    Connected
                  </div>
                  <div className="text-xs text-steel-500 mb-4 shrink-0">
                    {mostRecentSync
                      ? `Synced ${timeAgo(mostRecentSync)}`
                      : "Waiting to sync…"}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
                    <div className="rounded-lg bg-fog-50 border border-steel-100 px-3.5 py-3">
                      <div className="flex items-center gap-1.5 text-steel-500 text-[10px] font-mono uppercase tracking-wide">
                        <InboxIcon size={12} />
                        Inbox
                      </div>
                      <div className="font-display font-semibold text-ink text-xl mt-1">
                        {inbox.replies.length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-fog-50 border border-steel-100 px-3.5 py-3">
                      <div className="flex items-center gap-1.5 text-steel-500 text-[10px] font-mono uppercase tracking-wide">
                        <Send size={12} />
                        Sent
                      </div>
                      <div className="font-display font-semibold text-ink text-xl mt-1">
                        {sent.replies.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-[10px] font-mono uppercase tracking-wide text-steel-500 mb-3 shrink-0">
                      By category
                    </div>
                    {activeCategories.length > 0 ? (
                      <div className="flex flex-col gap-3.5">
                        {activeCategories.map((c) => {
                          const style = CATEGORY_STYLE[c];
                          const pct = totalMailSynced
                            ? Math.max(
                                4,
                                Math.round(
                                  (categoryCounts[c] / totalMailSynced) * 100,
                                ),
                              )
                            : 0;
                          return (
                            <div key={c} className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`inline-flex items-center gap-1.5 font-medium ${style.text}`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${style.dot}`}
                                  />
                                  {c}
                                </span>
                                <span className="text-steel-500 font-mono">
                                  {categoryCounts[c]}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-fog-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${style.dot} transition-all`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-center px-4 py-6">
                        <div className="h-11 w-11 rounded-full bg-circuit-100 text-circuit flex items-center justify-center">
                          <Mail size={18} />
                        </div>
                        <div className="text-sm font-medium text-ink">
                          No categories yet
                        </div>
                        <div className="text-xs text-steel-400 max-w-[220px]">
                          They&apos;ll appear automatically once your synced
                          mail has been analyzed.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
