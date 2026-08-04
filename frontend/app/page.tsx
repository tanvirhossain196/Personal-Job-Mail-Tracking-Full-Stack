"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import {
  Plus,
  Briefcase,
  CheckCircle2,
  Clock3,
  Menu,
  Mail,
  LogIn,
  ChevronRight,
  Link2,
  LayoutGrid,
} from "lucide-react";
import { Sidebar, View, CategoryFilter } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { ApplicationTable } from "@/components/ApplicationTable";
import { TableToolbar, SortKey } from "@/components/TableToolbar";
import { ApplicationFormModal } from "@/components/ApplicationFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ToastStack, ToastItem } from "@/components/Toast";
import { AnalyticsSection } from "@/components/AnalyticsSection";
import { InboxSection } from "@/components/InboxSection";
import { SentSection } from "@/components/SentSection";
import { MatchedRepliesSection } from "@/components/MatchedRepliesSection";
import {
  ApplicationStatus,
  GmailReply,
  JobApplication,
  PositionType,
  POSITION_TYPE_ORDER,
} from "@/lib/types";
import { matchReplyToApplication } from "@/lib/classify";
import {
  addApplication,
  clearApplications,
  deleteApplication,
  loadApplications,
  setStatus,
  toCsv,
  updateApplication,
} from "@/lib/storage";
import {
  EmailMeta,
  EmailMetaMap,
  EmailCategory,
  EMAIL_CATEGORY_ORDER,
  loadEmailMeta,
  setEmailMeta as persistEmailMeta,
  countByCategory,
  getEmailMeta,
} from "@/lib/emailMeta";
import { useGmailInbox } from "@/lib/useGmailInbox";
import { isOverdue, timeAgo } from "@/lib/utils";
import { getSetting, setSetting } from "@/lib/settings";

const SIDEBAR_KEY = "job-tracker:sidebar-collapsed";

export default function Home() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<JobApplication | undefined>();
  const [pendingDelete, setPendingDelete] = useState<
    JobApplication | undefined
  >();
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">(
    "All",
  );
  const [positionTypeFilter, setPositionTypeFilter] = useState<
    PositionType | "All"
  >("All");
  const [sort, setSort] = useState<SortKey>("newest");

  const [emailMeta, setEmailMetaState] = useState<EmailMetaMap>({});
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");

  const { data: session, status: sessionStatus } = useSession();
  const {
    replies: recentMail,
    loading: mailLoading,
    lastSyncedAt,
  } = useGmailInbox("inbox");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apps, meta, storedCollapsed] = await Promise.all([
          loadApplications(),
          loadEmailMeta(),
          getSetting(SIDEBAR_KEY),
        ]);
        if (cancelled) return;
        setApplications(apps);
        setEmailMetaState(meta);
        if (storedCollapsed) setCollapsed(storedCollapsed === "true");
      } catch (err) {
        console.error(err);
        pushToast(
          "warning",
          "Couldn't reach the backend API — make sure the Express server is running.",
        );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      setSetting(SIDEBAR_KEY, String(next)).catch((err) => console.error(err));
      return next;
    });
  };

  const pushToast = (type: ToastItem["type"], message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };

  const overdueCount = useMemo(
    () =>
      applications.filter(
        (a) =>
          isOverdue(a.followUpDate) &&
          a.status !== "Rejected" &&
          a.status !== "Offer" &&
          a.status !== "Withdrawn",
      ).length,
    [applications],
  );

  const filtered = useMemo(() => {
    let list = [...applications];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.companyName.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (positionTypeFilter !== "All") {
      list = list.filter((a) => a.positionType === positionTypeFilter);
    }
    switch (sort) {
      case "newest":
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "oldest":
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "company":
        list.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      case "followup":
        list.sort((a, b) =>
          (a.followUpDate ?? "9999").localeCompare(b.followUpDate ?? "9999"),
        );
        break;
    }
    return list;
  }, [applications, search, statusFilter, positionTypeFilter, sort]);

  const emailCategoryCounts = useMemo(
    () => countByCategory(emailMeta, view === "sent" ? "sent" : "inbox"),
    [emailMeta, view],
  );

  const matchedMail = useMemo(() => {
    return recentMail
      .map((r) => ({ reply: r, app: matchReplyToApplication(r, applications) }))
      .filter((x): x is { reply: GmailReply; app: JobApplication } =>
        Boolean(x.app),
      );
  }, [recentMail, applications]);

  const matchedMailIds = useMemo(
    () => new Set(matchedMail.map((m) => m.reply.id)),
    [matchedMail],
  );

  const unmatchedRecentMail = useMemo(
    () => recentMail.filter((r) => !matchedMailIds.has(r.id)),
    [recentMail, matchedMailIds],
  );

  // Category counts scoped to just the matched-replies subset — separate
  // from emailCategoryCounts (which counts the whole inbox/sent folder), so
  // the sidebar filter on the "Matched Replies" view reflects only what's
  // shown there.
  const matchedCategoryCounts = useMemo(() => {
    const base: Record<string, number> = { Uncategorized: 0 };
    EMAIL_CATEGORY_ORDER.forEach((c) => (base[c] = 0));
    matchedMail.forEach(({ reply: r }) => {
      const meta = getEmailMeta(emailMeta, "inbox", r.id);
      const cat = meta?.category ?? "Uncategorized";
      base[cat] = (base[cat] ?? 0) + 1;
    });
    return base as Record<EmailCategory | "Uncategorized", number>;
  }, [matchedMail, emailMeta]);

  // How many logged applications fall into each domain (Frontend, Backend,
  // Full Stack, Intern, Other) — powers the "Applying by domain" chips.
  const positionTypeCounts = useMemo(() => {
    const counts = {} as Record<PositionType, number>;
    POSITION_TYPE_ORDER.forEach((p) => (counts[p] = 0));
    applications.forEach((a) => {
      counts[a.positionType] = (counts[a.positionType] ?? 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleAdd = () => {
    setEditing(undefined);
    setModal("add");
  };

  const handleEdit = (a: JobApplication) => {
    setEditing(a);
    setModal("edit");
  };

  const handleFormSubmit = async (
    input: Parameters<typeof addApplication>[0],
  ) => {
    try {
      if (modal === "edit" && editing) {
        const result = await updateApplication(editing.id, input);
        if (result.duplicate) return { duplicate: result.duplicate };
        if (result.updated) {
          setApplications((prev) =>
            prev.map((a) => (a.id === result.updated!.id ? result.updated! : a)),
          );
        }
        pushToast("success", `Updated ${input.companyName} — ${input.position}.`);
        setModal(null);
        return {};
      }
      const result = await addApplication(input);
      if (result.duplicate) return { duplicate: result.duplicate };
      if (result.created) {
        setApplications((prev) => [result.created!, ...prev]);
      }
      pushToast("success", `Logged ${input.companyName} — ${input.position}.`);
      setModal(null);
      return {};
    } catch (err) {
      console.error(err);
      pushToast("warning", "Couldn't save — check the backend API is running.");
      return {};
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    try {
      await deleteApplication(pendingDelete.id);
      setApplications((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      pushToast(
        "warning",
        `Deleted ${pendingDelete.companyName} — ${pendingDelete.position}.`,
      );
    } catch (err) {
      console.error(err);
      pushToast("warning", "Couldn't delete — check the backend API is running.");
    } finally {
      setPendingDelete(undefined);
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      const updated = await setStatus(id, status);
      if (updated) {
        setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error(err);
      pushToast("warning", "Couldn't update status — check the backend API is running.");
    }
  };

  const handleUpdateEmailMeta = async (
    folder: "inbox" | "sent",
    id: string,
    patch: Partial<Omit<EmailMeta, "updatedAt">>,
  ) => {
    try {
      const next = await persistEmailMeta(emailMeta, folder, id, patch);
      setEmailMetaState(next);
      pushToast("success", "Mail classified.");
    } catch (err) {
      console.error(err);
      pushToast("warning", "Couldn't save mail tag — check the backend API is running.");
    }
  };

  const handleExport = () => {
    if (applications.length === 0) {
      pushToast("warning", "Nothing to export yet.");
      return;
    }
    const csv = toCsv(applications);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast("success", "Exported applications to CSV.");
  };

  const handleClearAllConfirmed = async () => {
    try {
      await clearApplications();
      setApplications([]);
      pushToast("warning", "Cleared all logged applications.");
    } catch (err) {
      console.error(err);
      pushToast("warning", "Couldn't clear — check the backend API is running.");
    } finally {
      setConfirmClearAll(false);
    }
  };

  if (!loaded) {
    return <div className="min-h-screen bg-fog-50" />;
  }

  const viewTitle = {
    dashboard: "Application dashboard",
    inbox: "Inbox",
    sent: "Sent applications",
    matched: "Matched replies",
    analytics: "Analytics",
  }[view];

  const changeView = (v: View) => {
    setView(v);
    setCategoryFilter("All");
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-fog-50">
      <Sidebar
        view={view}
        onViewChange={changeView}
        onExport={handleExport}
        onClearAll={() => setConfirmClearAll(true)}
        totalCount={applications.length}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        categoryCounts={
          view === "matched" ? matchedCategoryCounts : emailCategoryCounts
        }
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-steel-100 bg-white px-5 sm:px-8 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-steel-700"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-lg text-ink truncate">
                {viewTitle}
              </h1>
              <p className="text-xs text-steel-500 mt-0.5">
                {overdueCount > 0
                  ? `${overdueCount} follow-up${overdueCount > 1 ? "s" : ""} due or overdue`
                  : "All follow-ups on track"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 rounded-md bg-signal hover:bg-signal-600 text-ink font-semibold text-sm px-3.5 py-2 transition-colors shadow-panel"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Log application</span>
            </button>

            {sessionStatus === "authenticated" ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md border border-steel-100 pl-1 pr-2.5 py-1 hover:bg-fog-100 transition-colors"
                title="View profile"
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full shrink-0"
                  />
                ) : (
                  <span className="h-7 w-7 rounded-full bg-circuit-100 text-circuit-600 flex items-center justify-center text-xs font-semibold shrink-0">
                    {(session?.user?.name ?? session?.user?.email ?? "?")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
                <span className="hidden md:block text-xs font-medium text-ink truncate max-w-[120px]">
                  {session?.user?.name ?? session?.user?.email}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => signIn("google", { callbackUrl: "/profile" })}
                className="inline-flex items-center gap-1.5 rounded-md border border-steel-100 px-3 py-2 text-sm font-medium text-steel-700 hover:bg-fog-100 transition-colors"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}
          </div>
        </header>

        {mobileNavOpen && (
          <div className="lg:hidden flex flex-wrap items-center gap-2 border-b border-steel-100 bg-white px-5 py-2.5">
            <button
              onClick={() => changeView("dashboard")}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => changeView("inbox")}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Inbox
            </button>
            <button
              onClick={() => changeView("sent")}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Sent
            </button>
            <button
              onClick={() => changeView("matched")}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Matched
            </button>
            <button
              onClick={() => changeView("analytics")}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Analytics
            </button>
            <button
              onClick={handleExport}
              className="text-xs font-medium text-steel-700 px-2.5 py-1 rounded-sm hover:bg-fog-100"
            >
              Export CSV
            </button>
          </div>
        )}

        <main className="flex-1 px-5 sm:px-8 py-6 flex flex-col gap-5">
          {view === "dashboard" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total applications"
                  value={applications.length}
                  icon={Briefcase}
                  accent="steel"
                />
                <StatCard
                  label="Actually applied"
                  value={applications.filter((a) => a.applied).length}
                  icon={CheckCircle2}
                  accent="circuit"
                  hint="vs. just saved to apply"
                />
                <StatCard
                  label="Follow-ups due"
                  value={overdueCount}
                  icon={Clock3}
                  accent={overdueCount > 0 ? "danger" : "success"}
                />
              </div>

              {sessionStatus === "authenticated" && (
                <div className="bg-white border border-circuit-100 rounded-lg shadow-panel overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-circuit-100 bg-circuit-100/40">
                    <div className="flex items-center gap-2 text-sm font-display font-semibold text-ink">
                      <Link2 size={15} className="text-circuit" />
                      Matched to your applications
                    </div>
                    <span className="text-xs font-mono text-circuit-600 bg-circuit-100 rounded-full px-2 py-0.5">
                      {matchedMail.length}
                    </span>
                  </div>
                  {matchedMail.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-steel-500 text-center">
                      No matched mail found yet — this fills in once an incoming
                      email&apos;s company or email address matches one of your
                      logged applications.
                    </div>
                  ) : (
                    <div className="divide-y divide-steel-100">
                      {matchedMail.slice(0, 5).map(({ reply: r, app }) => (
                        <button
                          key={r.id}
                          onClick={() => changeView("matched")}
                          className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-fog-100 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-ink truncate">
                                {r.fromName || r.fromEmail}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-circuit-100 text-circuit-600 text-[10px] font-semibold px-2 py-0.5 shrink-0">
                                {app.companyName} · {app.position}
                              </span>
                            </div>
                            <div className="text-xs text-steel-500 truncate mt-0.5">
                              {r.subject || "(no subject)"}
                            </div>
                          </div>
                          <ChevronRight
                            size={15}
                            className="text-steel-300 shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {sessionStatus === "authenticated" && (
                <div className="bg-white border border-steel-100 rounded-lg shadow-panel">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-steel-100">
                    <div className="flex items-center gap-2 text-sm font-display font-semibold text-ink">
                      <Mail size={15} className="text-circuit" />
                      Recent incoming mail
                    </div>
                    <div className="flex items-center gap-2 text-xs text-steel-500">
                      <span
                        className={
                          mailLoading
                            ? "h-1.5 w-1.5 rounded-full bg-signal animate-pulse"
                            : "h-1.5 w-1.5 rounded-full bg-success"
                        }
                      />
                      {mailLoading
                        ? "Syncing…"
                        : lastSyncedAt
                          ? `Synced ${timeAgo(lastSyncedAt)}`
                          : "Waiting to sync"}
                    </div>
                  </div>
                  {unmatchedRecentMail.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-steel-500 text-center">
                      No job-related mail found yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-steel-100">
                      {unmatchedRecentMail.slice(0, 4).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => changeView("inbox")}
                          className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-fog-100 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-ink truncate">
                              {r.fromName || r.fromEmail}
                            </div>
                            <div className="text-xs text-steel-500 truncate">
                              {r.subject || "(no subject)"}
                            </div>
                          </div>
                          <ChevronRight
                            size={15}
                            className="text-steel-300 shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {applications.length > 0 && (
                <div className="bg-white border border-steel-100 rounded-lg shadow-panel px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-display font-semibold text-ink mb-3">
                    <LayoutGrid size={15} className="text-circuit" />
                    Applying by domain
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPositionTypeFilter("All")}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        positionTypeFilter === "All"
                          ? "bg-ink text-fog-50 border-ink"
                          : "bg-fog-50 text-steel-700 border-steel-100 hover:border-circuit hover:text-circuit-600"
                      }`}
                    >
                      All domains
                      <span
                        className={`text-[11px] font-mono rounded-full px-1.5 ${
                          positionTypeFilter === "All"
                            ? "bg-fog-50/15"
                            : "bg-steel-100"
                        }`}
                      >
                        {applications.length}
                      </span>
                    </button>
                    {POSITION_TYPE_ORDER.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPositionTypeFilter(p)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          positionTypeFilter === p
                            ? "bg-circuit text-white border-circuit"
                            : "bg-fog-50 text-steel-700 border-steel-100 hover:border-circuit hover:text-circuit-600"
                        }`}
                      >
                        {p}
                        <span
                          className={`text-[11px] font-mono rounded-full px-1.5 ${
                            positionTypeFilter === p
                              ? "bg-white/20"
                              : "bg-steel-100"
                          }`}
                        >
                          {positionTypeCounts[p] ?? 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {applications.length === 0 ? (
                <EmptyState onAdd={handleAdd} />
              ) : (
                <div>
                  <TableToolbar
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    positionTypeFilter={positionTypeFilter}
                    onPositionTypeFilterChange={setPositionTypeFilter}
                    sort={sort}
                    onSortChange={setSort}
                    resultCount={filtered.length}
                  />
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-sm text-steel-500 bg-white border border-steel-100 rounded-md">
                      No applications match your search or filters.
                    </div>
                  ) : (
                    <ApplicationTable
                      applications={filtered}
                      onEdit={handleEdit}
                      onDelete={setPendingDelete}
                      onStatusChange={handleStatusChange}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {view === "inbox" && (
            <InboxSection
              emailMeta={emailMeta}
              onUpdateMeta={(id, patch) =>
                handleUpdateEmailMeta("inbox", id, patch)
              }
              categoryFilter={categoryFilter}
              sidebarCollapsed={collapsed}
            />
          )}

          {view === "sent" && (
            <SentSection
              emailMeta={emailMeta}
              onUpdateMeta={(id, patch) =>
                handleUpdateEmailMeta("sent", id, patch)
              }
              categoryFilter={categoryFilter}
              sidebarCollapsed={collapsed}
            />
          )}

          {view === "matched" && (
            <MatchedRepliesSection
              matchedMail={matchedMail}
              emailMeta={emailMeta}
              onUpdateMeta={(id, patch) =>
                handleUpdateEmailMeta("inbox", id, patch)
              }
              categoryFilter={categoryFilter}
              sidebarCollapsed={collapsed}
            />
          )}

          {view === "analytics" && (
            <AnalyticsSection applications={applications} />
          )}
        </main>
      </div>

      {(modal === "add" || modal === "edit") && (
        <ApplicationFormModal
          initial={editing}
          onCancel={() => setModal(null)}
          onSubmit={handleFormSubmit}
          sidebarCollapsed={collapsed}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this application?"
          description={`This removes ${pendingDelete.companyName} — ${pendingDelete.position} from your tracker. This can't be undone.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setPendingDelete(undefined)}
        />
      )}

      {confirmClearAll && (
        <ConfirmDialog
          title="Clear all applications?"
          description="This removes every logged application from this device. This can't be undone."
          onConfirm={handleClearAllConfirmed}
          onCancel={() => setConfirmClearAll(false)}
        />
      )}

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </div>
  );
}
