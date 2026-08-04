import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "circuit" | "signal" | "success" | "danger" | "steel";
  hint?: string;
}

const ACCENTS = {
  circuit: "text-circuit bg-circuit-100",
  signal: "text-signal-600 bg-signal-100",
  success: "text-success bg-success-100",
  danger: "text-danger bg-danger-100",
  steel: "text-steel-700 bg-steel-100",
};

export function StatCard({ label, value, icon: Icon, accent = "steel", hint }: StatCardProps) {
  return (
    <div className="bg-white border border-steel-100 rounded-md shadow-panel px-5 py-4 flex items-start justify-between">
      <div>
        <div className="text-[11px] font-mono tracking-wide text-steel-500 uppercase">
          {label}
        </div>
        <div className="font-display text-2xl font-semibold text-ink mt-1.5">
          {value}
        </div>
        {hint && <div className="text-xs text-steel-500 mt-1">{hint}</div>}
      </div>
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-sm shrink-0", ACCENTS[accent])}>
        <Icon size={17} strokeWidth={2} />
      </div>
    </div>
  );
}
