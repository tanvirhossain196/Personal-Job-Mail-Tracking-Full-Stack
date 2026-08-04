import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  HelpCircle,
  Mail,
  MailQuestion,
  PartyPopper,
  RefreshCcw,
  UserCog,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { EmailCategory } from "./emailMeta";

interface CategoryStyle {
  label: string;
  icon: LucideIcon;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

export const CATEGORY_STYLE: Record<EmailCategory, CategoryStyle> = {
  "Application Received": {
    label: "Application Received",
    icon: Mail,
    dot: "bg-signal",
    text: "text-signal-600",
    bg: "bg-signal-100",
    border: "border-signal/30",
  },
  "Interview Call": {
    label: "Interview Call",
    icon: CalendarClock,
    dot: "bg-circuit",
    text: "text-circuit-600",
    bg: "bg-circuit-100",
    border: "border-circuit/30",
  },
  "Assessment Invite": {
    label: "Assessment Invite",
    icon: ClipboardList,
    dot: "bg-circuit-600",
    text: "text-circuit-600",
    bg: "bg-circuit-100",
    border: "border-circuit/30",
  },
  "Profile Update Requested": {
    label: "Profile Update Requested",
    icon: UserCog,
    dot: "bg-teal",
    text: "text-teal-700",
    bg: "bg-teal-100",
    border: "border-teal/30",
  },
  "Job Portal Update Requested": {
    label: "Job Portal Update Requested",
    icon: RefreshCcw,
    dot: "bg-warning",
    text: "text-warning-700",
    bg: "bg-warning-100",
    border: "border-warning/30",
  },
  "Document Request": {
    label: "Document Request",
    icon: FileText,
    dot: "bg-violet",
    text: "text-violet-700",
    bg: "bg-violet-100",
    border: "border-violet/30",
  },
  "Waiting List": {
    label: "Waiting List",
    icon: Clock3,
    dot: "bg-warning",
    text: "text-warning-700",
    bg: "bg-warning-100",
    border: "border-warning/30",
  },
  "Will Be Informed Later": {
    label: "Will Be Informed Later",
    icon: MailQuestion,
    dot: "bg-violet",
    text: "text-violet-700",
    bg: "bg-violet-100",
    border: "border-violet/30",
  },
  "Internship Approved": {
    label: "Internship Approved",
    icon: GraduationCap,
    dot: "bg-teal",
    text: "text-teal-700",
    bg: "bg-teal-100",
    border: "border-teal/30",
  },
  "Offer Letter": {
    label: "Offer Letter",
    icon: FileCheck2,
    dot: "bg-signal-600",
    text: "text-signal-700",
    bg: "bg-signal-100",
    border: "border-signal/40",
  },
  "Job Confirmed": {
    label: "Job Confirmed",
    icon: PartyPopper,
    dot: "bg-success",
    text: "text-success-700",
    bg: "bg-success-100",
    border: "border-success/30",
  },
  Approved: {
    label: "Approved",
    icon: CheckCircle2,
    dot: "bg-success-600",
    text: "text-success-700",
    bg: "bg-success-100",
    border: "border-success/30",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    dot: "bg-danger",
    text: "text-danger-700",
    bg: "bg-danger-100",
    border: "border-danger/30",
  },
  Others: {
    label: "Others",
    icon: HelpCircle,
    dot: "bg-steel-500",
    text: "text-steel-700",
    bg: "bg-steel-100",
    border: "border-steel-300/60",
  },
};

export const UNCATEGORIZED_STYLE: CategoryStyle = {
  label: "Uncategorized",
  icon: HelpCircle,
  dot: "bg-steel-300",
  text: "text-steel-500",
  bg: "bg-fog-100",
  border: "border-steel-100",
};

export function styleForCategory(category?: EmailCategory): CategoryStyle {
  if (!category) return UNCATEGORIZED_STYLE;
  return CATEGORY_STYLE[category];
}