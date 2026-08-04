"use client";

import { Search } from "lucide-react";
import { ApplicationStatus, PositionType, POSITION_TYPE_ORDER, STATUS_ORDER } from "@/lib/types";

export type SortKey = "newest" | "oldest" | "company" | "followup";

interface TableToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: ApplicationStatus | "All";
  onStatusFilterChange: (v: ApplicationStatus | "All") => void;
  positionTypeFilter: PositionType | "All";
  onPositionTypeFilterChange: (v: PositionType | "All") => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  resultCount: number;
}

export function TableToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  positionTypeFilter,
  onPositionTypeFilterChange,
  sort,
  onSortChange,
  resultCount,
}: TableToolbarProps) {
  const selectClass =
    "rounded-sm border border-steel-100 bg-white px-3 py-2 text-xs font-medium text-steel-700 outline-none focus:border-circuit transition-colors";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-500"
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by company or position…"
          className="w-full rounded-sm border border-steel-100 bg-white pl-9 pr-3 py-2 text-sm text-ink placeholder:text-steel-500/70 outline-none focus:border-circuit transition-colors"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as ApplicationStatus | "All")}
        className={selectClass}
      >
        <option value="All">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={positionTypeFilter}
        onChange={(e) => onPositionTypeFilterChange(e.target.value as PositionType | "All")}
        className={selectClass}
      >
        <option value="All">All position types</option>
        {POSITION_TYPE_ORDER.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        className={selectClass}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="company">Company A–Z</option>
        <option value="followup">Follow-up soonest</option>
      </select>

      <span className="text-xs font-mono text-steel-500 whitespace-nowrap px-1">
        {resultCount} shown
      </span>
    </div>
  );
}
