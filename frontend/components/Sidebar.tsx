"use client";

import {
  LayoutGrid,
  BarChart3,
  Download,
  Trash2,
  Settings2,
  Mail,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Inbox as InboxIcon,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EMAIL_CATEGORY_ORDER, EmailCategory } from "@/lib/emailMeta";
import { CATEGORY_STYLE, UNCATEGORIZED_STYLE } from "@/lib/categoryStyle";

export type View = "dashboard" | "inbox" | "sent" | "matched" | "analytics";
export type CategoryFilter = EmailCategory | "Uncategorized" | "All";

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  onExport: () => void;
  onClearAll: () => void;
  totalCount: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  categoryCounts: Record<EmailCategory | "Uncategorized", number>;
  categoryFilter: CategoryFilter;
  onCategoryFilterChange: (c: CategoryFilter) => void;
}

const NAV_ITEMS: { key: View; label: string; icon: typeof LayoutGrid }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "inbox", label: "Inbox", icon: InboxIcon },
  { key: "sent", label: "Sent", icon: Send },
  { key: "matched", label: "Matched Replies", icon: Link2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({
  view,
  onViewChange,
  onExport,
  onClearAll,
  totalCount,
  collapsed,
  onToggleCollapsed,
  categoryCounts,
  categoryFilter,
  onCategoryFilterChange,
}: SidebarProps) {
  const showCategories =
    (view === "inbox" || view === "sent" || view === "matched") && !collapsed;
  const totalMail = Object.values(categoryCounts).reduce(
    (sum, n) => sum + n,
    0,
  );

  return (
    <aside
      onClick={() => {
        if (collapsed) onToggleCollapsed();
      }}
      className={cn(
        "hidden lg:flex shrink-0 flex-col bg-ink text-fog-50 relative transition-[width] duration-200 ease-out sticky top-0 h-screen overflow-hidden",
        collapsed ? "w-[68px] cursor-pointer" : "w-64",
      )}
    >
      <div
        className="absolute inset-0 bg-blueprint bg-grid opacity-40 pointer-events-none"
        aria-hidden
      />
      {/* top accent rail — purely decorative, reinforces the industrial feel */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-signal via-circuit to-teal"
        aria-hidden
      />

      {/* Full-height flex column: header+nav fixed, categories scroll, footer fixed */}
      <div className="relative flex flex-col h-full w-full">
        {/* ---- FIXED TOP: logo + primary nav (never scrolls) ---- */}
        <div className="shrink-0 px-3 pt-6">
          <div
            className={cn(
              "flex items-center gap-2.5 px-2 mb-8",
              collapsed && "justify-center px-0",
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-signal text-ink font-display font-bold text-sm shadow-rivet">
              R
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-display font-semibold text-[15px] leading-none tracking-tight truncate">
                  ROLODEX
                </div>
                <div className="text-[10px] font-mono text-steel-300 tracking-widest mt-1 truncate">
                  APPLICATION LOG
                </div>
              </div>
            )}
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors text-left",
                  collapsed && "justify-center px-0",
                  view === key
                    ? "bg-circuit-600/25 text-fog-50 border-l-2 border-signal shadow-[inset_0_0_0_1px_rgba(224,138,43,0.15)]"
                    : "text-steel-300 hover:bg-steel-900/60 hover:text-fog-50 border-l-2 border-transparent",
                )}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0" />
                {!collapsed && label}
              </button>
            ))}
            <button
              onClick={onExport}
              title={collapsed ? "Export CSV" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-steel-300 hover:bg-steel-900/60 hover:text-fog-50 transition-colors text-left border-l-2 border-transparent",
                collapsed && "justify-center px-0",
              )}
            >
              <Download size={16} strokeWidth={2} className="shrink-0" />
              {!collapsed && "Export CSV"}
            </button>
            {totalCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
                title={collapsed ? "Clear all applications" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-steel-300 hover:bg-danger/20 hover:text-danger transition-colors text-left border-l-2 border-transparent",
                  collapsed && "justify-center px-0",
                )}
              >
                <Trash2 size={16} strokeWidth={2} className="shrink-0" />
                {!collapsed && "Clear all applications"}
              </button>
            )}
          </nav>
        </div>

        {/* ---- SCROLLABLE MIDDLE: category filters only ---- */}
        <div className="flex-1 min-h-0 overflow-y-auto sidebar-scroll px-3">
          {showCategories && (
            <div className="mt-6 pt-5 border-t border-steel-700/60 flex flex-col gap-1 pb-4">
              <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-steel-300 mb-1.5">
                Filter by status
              </div>
              <button
                onClick={() => onCategoryFilterChange("All")}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors text-left",
                  categoryFilter === "All"
                    ? "bg-steel-900 text-fog-50"
                    : "text-steel-300 hover:bg-steel-900/60 hover:text-fog-50",
                )}
              >
                <Mail size={13} className="shrink-0" />
                <span className="truncate">All mail</span>
                <span className="ml-auto text-[11px] font-mono text-steel-300">
                  {totalMail}
                </span>
              </button>

              {EMAIL_CATEGORY_ORDER.map((cat) => {
                const style = CATEGORY_STYLE[cat];
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => onCategoryFilterChange(cat)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors text-left",
                      active
                        ? "bg-steel-900 text-fog-50"
                        : "text-steel-300 hover:bg-steel-900/60 hover:text-fog-50",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        style.dot,
                        active &&
                          "ring-2 ring-offset-1 ring-offset-steel-900 ring-white/20",
                      )}
                    />
                    <span className="truncate">{cat}</span>
                    <span className="ml-auto text-[11px] font-mono text-steel-300">
                      {categoryCounts[cat] ?? 0}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => onCategoryFilterChange("Uncategorized")}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors text-left",
                  categoryFilter === "Uncategorized"
                    ? "bg-steel-900 text-fog-50"
                    : "text-steel-300 hover:bg-steel-900/60 hover:text-fog-50",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    UNCATEGORIZED_STYLE.dot,
                  )}
                />
                <span className="truncate">Uncategorized</span>
                <span className="ml-auto text-[11px] font-mono text-steel-300">
                  {categoryCounts.Uncategorized ?? 0}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ---- FIXED BOTTOM: entry count + collapse toggle (never scrolls) ---- */}
        <div className="shrink-0 px-3 pb-6 pt-6 border-t border-steel-700/60 flex flex-col gap-3">
          {!collapsed && (
            <div className="flex items-center gap-2 text-steel-300 text-xs font-mono px-1">
              <Settings2 size={13} className="shrink-0" />
              <span className="truncate">{totalCount} entries logged</span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapsed();
            }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-3 py-2 text-xs font-medium text-steel-300 hover:bg-steel-900/60 hover:text-fog-50 transition-colors",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} strokeWidth={2} className="shrink-0" />
            ) : (
              <>
                <PanelLeftClose
                  size={16}
                  strokeWidth={2}
                  className="shrink-0"
                />
                Collapse
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
