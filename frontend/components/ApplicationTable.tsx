"use client";

import { ExternalLink, Pencil, Trash2, Clock } from "lucide-react";
import { ApplicationStatus, JobApplication, STATUS_ORDER } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { cn, formatDate, isOverdue } from "@/lib/utils";

interface ApplicationTableProps {
  applications: JobApplication[];
  onEdit: (a: JobApplication) => void;
  onDelete: (a: JobApplication) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationTable({
  applications,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationTableProps) {
  return (
    <div className="bg-white border border-steel-100 rounded-md shadow-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-steel-100 bg-fog-50/60">
              <th className="text-left font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Company / Position
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Email
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Status
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Applied
              </th>
              <th className="text-left font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Follow-up
              </th>
              <th className="text-right font-mono text-[10px] uppercase tracking-wide text-steel-500 px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => {
              const overdue = isOverdue(a.followUpDate) && a.status !== "Rejected" && a.status !== "Offer" && a.status !== "Withdrawn";
              return (
                <tr
                  key={a.id}
                  className="border-b border-steel-100 last:border-0 hover:bg-fog-50/60 transition-colors"
                >
                  <td className="px-4 py-3.5 max-w-[240px]">
                    <a
                      href={a.jobLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 font-medium text-ink hover:text-circuit truncate"
                    >
                      <span className="truncate">{a.companyName}</span>
                      <ExternalLink
                        size={12}
                        className="shrink-0 text-steel-500 group-hover:text-circuit"
                      />
                    </a>
                    <div className="text-xs text-steel-500 truncate mt-0.5">
                      {a.position}
                      <span className="ml-1.5 inline-block rounded-sm bg-fog-100 text-steel-700 px-1.5 py-0.5 text-[10px] font-mono align-middle">
                        {a.positionType}
                      </span>
                    </div>
                    {a.replySnippet && (
                      <div className="text-[11px] text-steel-500 truncate mt-1 italic max-w-[220px]">
                        &ldquo;{a.replySnippet}&rdquo;
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-steel-700 font-mono text-xs">{a.email}</td>
                  <td className="px-4 py-3.5">
                    <select
                      value={a.status}
                      onChange={(e) => onStatusChange(a.id, e.target.value as ApplicationStatus)}
                      className="bg-transparent text-xs font-mono uppercase tracking-wide border-0 outline-none cursor-pointer"
                      aria-label={`Change status for ${a.companyName}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <StatusBadge status={a.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-steel-700 text-xs font-mono">
                    {formatDate(a.appliedDate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-mono",
                        overdue ? "text-danger font-medium" : "text-steel-700"
                      )}
                    >
                      {overdue && <Clock size={12} />}
                      {formatDate(a.followUpDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(a)}
                        className="p-1.5 rounded-sm text-steel-500 hover:text-circuit hover:bg-circuit-100 transition-colors"
                        aria-label={`Edit ${a.companyName} application`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(a)}
                        className="p-1.5 rounded-sm text-steel-500 hover:text-danger hover:bg-danger-100 transition-colors"
                        aria-label={`Delete ${a.companyName} application`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
