import { ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<ApplicationStatus, string> = {
  Saved: "bg-steel-100 text-steel-700 border-steel-300/60",
  Applied: "bg-circuit-100 text-circuit-600 border-circuit/30",
  Interviewing: "bg-signal-100 text-signal-600 border-signal/30",
  Offer: "bg-success-100 text-success border-success/30",
  Rejected: "bg-danger-100 text-danger border-danger/30",
  Withdrawn: "bg-steel-100 text-steel-500 border-steel-300/60",
};

const DOT: Record<ApplicationStatus, string> = {
  Saved: "bg-steel-500",
  Applied: "bg-circuit",
  Interviewing: "bg-signal",
  Offer: "bg-success",
  Rejected: "bg-danger",
  Withdrawn: "bg-steel-300",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium font-mono uppercase tracking-wide",
        STYLES[status]
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {status}
    </span>
  );
}
