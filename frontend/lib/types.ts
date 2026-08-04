import { EmailCategory } from "./emailMeta";

export type ApplicationStatus =
  | "Saved"
  | "Applied"
  | "Interviewing"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export const STATUS_ORDER: ApplicationStatus[] = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export type PositionType =
  | "Intern"
  | "Full Stack"
  | "Frontend"
  | "Backend"
  | "Other";

export const POSITION_TYPE_ORDER: PositionType[] = [
  "Intern",
  "Full Stack",
  "Frontend",
  "Backend",
  "Other",
];

export interface JobApplication {
  id: string;
  jobLink: string;
  companyName: string;
  position: string;
  positionType: PositionType;
  email: string;
  applied: boolean;
  status: ApplicationStatus;
  appliedDate?: string;
  followUpDate?: string;
  notes?: string;
  resumeVersion?: string;
  // populated when a Gmail reply gets linked to this application
  replySnippet?: string;
  replyFrom?: string;
  replyReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobApplicationInput = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
>;

export type ReplyVerdict =
  | "Offer"
  | "Interviewing"
  | "Rejected"
  | "Acknowledged"
  | "Unclear";

export type MailFolder = "inbox" | "sent";

export interface GmailReply {
  id: string;
  folder: MailFolder;
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string;
  suggestedVerdict: ReplyVerdict;
  matchedApplicationId?: string;
  matchedCompany?: string;
  // Populated when Gemini classification succeeds for this message; falls
  // back to verdictToCategory(suggestedVerdict) in the UI when absent.
  suggestedCategory?: EmailCategory;
  aiCompanyName?: string | null;
  aiPosition?: string | null;
}
