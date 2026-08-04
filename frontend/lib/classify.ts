import { GmailReply, JobApplication, ReplyVerdict } from "./types";
import { EmailCategory } from "./emailMeta";

// ============================================================
// PURE KEYWORD-BASED CLASSIFICATION (no AI / no external API)
// ------------------------------------------------------------
// Every email is classified ONLY by matching against the phrase
// lists below. There is no guessing "by category" in isolation —
// classifyEmailByKeywords() below always reads the FULL combined
// text (subject + snippet + body) and walks through every rule
// in a fixed, deliberate priority order before deciding, so a
// stronger/more specific signal always wins over a weaker one
// found anywhere else in the same text.
// ============================================================

// ------------------------------------------------------------
// Matching helper
// ------------------------------------------------------------
// Multi-word phrases are safe to match as plain substrings.
// Short single tokens (cv, hr, nid, otp, 2fa, ...) are matched
// with word boundaries so they never fire inside an unrelated
// word (e.g. "cv" must not match inside "curve").
function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => {
    if (needle.includes(" ") || needle.length > 5) {
      return haystack.includes(needle);
    }
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(
      haystack,
    );
  });
}

function countMatches(haystack: string, needles: string[]): number {
  return needles.reduce((n, needle) => (containsAny(haystack, [needle]) ? n + 1 : n), 0);
}

// ==============================================================
// 1. Phrase banks — one per signal. Kept broad on purpose (more
//    real-world phrasing = fewer misses) but every entry here is
//    an unambiguous, specific phrase, never a bare generic word.
// ==============================================================

// Emails that are not about a job process at all, even if a
// stray word elsewhere might look job-adjacent. Checked first —
// a match here short-circuits straight to "not job related",
// unless a strong job-specific signal is also present (handled
// in looksJobRelated / classifyEmailByKeywords below).
const EXCLUDE_WORDS = [
  "verification code",
  "one-time password",
  "one time password",
  "otp",
  "passcode",
  "security code",
  "login code",
  "sign-in code",
  "sign in code",
  "security alert",
  "new sign-in",
  "password reset",
  "reset your password",
  "confirm your email",
  "verify your email",
  "verify your account",
  "two-factor",
  "2fa",
  "receipt",
  "invoice",
  "payment successful",
  "payment received",
  "order confirmed",
  "order confirmation",
  "your order",
  "has shipped",
  "out for delivery",
  "delivery update",
  "unsubscribe",
  "newsletter",
  "webinar",
  "% off",
  "limited time offer",
  "flash sale",
  "coupon code",
  "cashback",
  "subscription renewed",
  "auto-renew",
  "statement is ready",
  "top up",
  "recharge successful",
];

// Explicit, unambiguous negative outcome. Rejections take
// priority over everything else — a mail can mention
// "congratulations on reaching the final round" and still end in
// "unfortunately... other candidates", and the bad news must win.
const REJECT_WORDS = [
  "unfortunately",
  "not moving forward",
  "other candidates",
  "not selected",
  "regret to inform",
  "decided not to proceed",
  "will not be moving forward",
  "position has been filled",
  "not be pursuing your application",
  "we have decided to move forward with other candidates",
  "unable to offer you the position",
  "after careful consideration, we have decided",
  "have chosen another candidate",
  "position is no longer available",
  "decided to pursue other candidates",
  "candidacy will not be moving forward",
  "unable to move forward with your application",
  "no longer under consideration",
  "application was not successful",
  "not successful this time",
  "closing your application",
  "close your candidacy",
  "will not be progressing",
  "not progressing to the next stage",
];

// Person has been explicitly placed on a waitlist/backup list —
// a specific, distinct outcome, not a rejection and not a
// confirmed offer.
const WAITLIST_WORDS = [
  "waiting list",
  "wait list",
  "waitlisted",
  "on the waitlist",
  "backup list",
  "reserve list",
  "kept on hold for now",
  "shortlisted as a backup",
  "on our shortlist for future openings",
  "placed on our talent pool",
  "added to our talent pool",
];

// The company explicitly says a decision will come later, with
// nothing decided yet — distinct from a plain acknowledgement.
const INFORMED_LATER_WORDS = [
  "will be informed",
  "will inform you",
  "will notify you",
  "will let you know",
  "will get back to you",
  "will contact you if",
  "will reach out if",
  "keep your resume on file",
  "keep your profile on file",
  "keep your cv on file",
  "may reach out in the future",
  "will update you soon",
  "will follow up soon",
  "we will be in touch",
  "will contact shortlisted candidates",
];

// A request for actual paperwork/documents — ID, transcripts,
// references, signed acceptance forms, etc.
const DOCUMENT_REQUEST_WORDS = [
  "please send your documents",
  "please provide the following documents",
  "submit the following documents",
  "kindly send us your documents",
  "please share the following documents",
  "provide your transcripts",
  "academic transcript",
  "national id card",
  "nid copy",
  "passport copy",
  "certificate copy",
  "reference letter",
  "signed offer acceptance",
  "acceptance form",
  "please sign and return",
  "background check",
  "verification documents",
  "proof of employment",
  "salary certificate",
  "please attach your documents",
];

// A literal offer letter document was sent/attached — for an
// internship OR a full job. Own category, checked independently
// of the generic OFFER_WORDS below since a mail can deliver the
// letter without using celebratory language at all.
const OFFER_LETTER_WORDS = [
  "offer letter",
  "your offer letter",
  "attached is your offer letter",
  "please find your offer letter",
  "please find attached your offer letter",
  "issuing your offer letter",
  "offer letter is attached",
  "letter of employment attached",
  "kindly find the offer letter",
  "sharing your offer letter",
  "here is your offer letter",
];

// Describes an application/profile step the PERSON just
// completed — not a decision by the company — even though such
// mails very often also say "congratulations".
const APPLICATION_PROGRESS_WORDS = [
  "application has been submitted",
  "application submitted",
  "successfully submitted your application",
  "thank you for submitting",
  "your profile has been updated",
  "profile has been updated",
  "profile update",
  "application is complete",
  "application is now complete",
  "complete your application",
  "application has been received",
  "successfully applied for",
  "successfully applied to",
  "you have successfully applied",
  "you have applied for",
  "your application was submitted",
  "we have received your application",
  "application successfully submitted",
  "your candidacy has been registered",
  "your profile is now complete",
  "cv has been submitted",
  "resume has been submitted",
];

// Phrases that unambiguously confirm a real, finalized, paid
// job/employment — not an internship, not an interview
// congratulations, not a vague "you're moving forward". Only
// these should ever produce "Job Confirmed".
const STRONG_JOB_CONFIRM_WORDS = [
  "offer of employment",
  "employment offer",
  "welcome to the team",
  "welcome aboard",
  "your employment is confirmed",
  "confirm your employment",
  "confirmed your offer",
  "employment contract",
  "joining date",
  "date of joining",
  "excited to offer you the position",
  "excited to offer you the role",
  "pleased to offer you the position",
  "pleased to offer you the role",
  "extend an offer of employment",
  "successful candidate for the position",
  "pleased to confirm your appointment",
  "your appointment is confirmed",
  "letter of appointment",
  "appointment letter",
  "your start date is",
  "final offer accepted",
  "confirm your selection for the position",
];

// Any mention of these means the email is about an
// internship/trainee track, not a full job — this takes priority
// over job-confirmation wording so "congratulations, your
// internship is confirmed" never gets filed as "Job Confirmed".
const INTERN_WORDS = [
  "internship",
  "intern position",
  "intern role",
  "as an intern",
  "trainee",
  "internship program",
  "summer intern",
  "internship offer",
  "trainee program",
  "co-op position",
  "apprenticeship",
];

// Broad "something positive happened" signal. On its own this is
// NOT enough to call something "Job Confirmed" — it only decides
// the coarse verdict bucket (Offer vs Interviewing vs ...); the
// actual EmailCategory is refined by the stronger, more specific
// lists above/below.
const OFFER_WORDS = [
  "pleased to inform",
  "pleased to offer",
  "congratulations",
  "we are excited to offer",
  "offer of employment",
  "welcome to the team",
  "successful candidate",
  "extend an offer",
  "happy to inform you",
  "delighted to inform you",
  "we are delighted to offer",
];

// A coding test / online assessment / assignment — distinct from
// a live interview call.
const ASSESSMENT_WORDS = [
  "assessment test",
  "online assessment",
  "coding test",
  "coding challenge",
  "coding assignment",
  "take-home assignment",
  "take home assignment",
  "take home task",
  "skills test",
  "aptitude test",
  "psychometric test",
  "screening test",
  "technical assessment",
  "hackerrank",
  "hackerearth",
  "codesignal",
  "codility",
  "complete the assessment",
  "complete this test",
  "assignment link",
  "test link below",
];

// An interview is being scheduled, offered, or invited.
const INTERVIEW_WORDS = [
  "interview",
  "schedule a call",
  "next round",
  "would like to invite you",
  "screening call",
  "technical round",
  "meet the team",
  "hiring manager would like to speak",
  "invite you for an interview",
  "schedule your interview",
  "interview invitation",
  "would like to schedule a call",
  "book a slot for your interview",
  "interview scheduled",
  "panel interview",
  "final round interview",
  "hr interview",
  "technical interview",
  "virtual interview",
  "onsite interview",
  "phone screen",
  "meet with the hiring manager",
];

// Asks the person to complete/fix their own profile or resume on
// the company's site — a request aimed at the person, not a
// report of something already done (that's APPLICATION_PROGRESS).
const PROFILE_UPDATE_WORDS = [
  "please update your profile",
  "kindly update your profile",
  "complete your profile",
  "please complete your resume",
  "update your cv",
  "please update your resume",
  "your profile is incomplete",
  "finish setting up your profile",
  "please fill out your profile",
  "complete your candidate profile",
];

// Asks the person to log in and act on an external
// application-tracking / careers portal — distinct from a plain
// profile edit.
const PORTAL_UPDATE_WORDS = [
  "log in to the portal",
  "log into the portal",
  "visit our career portal",
  "check your application status on",
  "kindly log in to",
  "career portal",
  "applicant portal",
  "recruitment portal",
  "candidate portal",
  "next steps on the portal",
  "view your status online",
  "track your application on",
];

// Plain "we got it, nothing decided yet" acknowledgement.
const ACK_WORDS = [
  "received your application",
  "thank you for applying",
  "application received",
  "thank you for your interest",
  "confirms receipt",
  "we appreciate your interest",
  "application is under review",
  "application is being reviewed",
  "we have received your resume",
  "thanks for your interest in joining",
];

// Broader relevance list, used only to decide "is this even
// job-related" — union of every positive signal above plus a few
// generic job-market nouns.
const RELEVANCE_WORDS = [
  ...OFFER_WORDS,
  ...INTERVIEW_WORDS,
  ...ASSESSMENT_WORDS,
  ...REJECT_WORDS,
  ...ACK_WORDS,
  ...WAITLIST_WORDS,
  ...INFORMED_LATER_WORDS,
  ...DOCUMENT_REQUEST_WORDS,
  ...PROFILE_UPDATE_WORDS,
  ...PORTAL_UPDATE_WORDS,
  ...APPLICATION_PROGRESS_WORDS,
  "application",
  "candidacy",
  "candidate",
  "resume",
  "cv",
  "recruiter",
  "recruiting",
  "hiring",
  "position",
  "role",
  "job opening",
  "vacancy",
];

// ==============================================================
// 2. Core classifiers
// ==============================================================

export function classifyReply(subject: string, snippet: string): ReplyVerdict {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (containsAny(text, REJECT_WORDS)) return "Rejected";
  if (
    containsAny(text, APPLICATION_PROGRESS_WORDS) &&
    !containsAny(text, STRONG_JOB_CONFIRM_WORDS)
  ) {
    return "Acknowledged";
  }
  if (containsAny(text, OFFER_WORDS)) return "Offer";
  if (containsAny(text, INTERVIEW_WORDS) || containsAny(text, ASSESSMENT_WORDS))
    return "Interviewing";
  if (containsAny(text, ACK_WORDS)) return "Acknowledged";
  return "Unclear";
}

const VERDICT_TO_STATUS: Record<
  ReplyVerdict,
  JobApplication["status"] | undefined
> = {
  Offer: "Offer",
  Interviewing: "Interviewing",
  Rejected: "Rejected",
  Acknowledged: "Applied",
  Unclear: undefined,
};

export function verdictToStatus(v: ReplyVerdict) {
  return VERDICT_TO_STATUS[v];
}

const VERDICT_TO_CATEGORY: Record<ReplyVerdict, EmailCategory> = {
  Offer: "Job Confirmed",
  Interviewing: "Interview Call",
  Rejected: "Rejected",
  Acknowledged: "Application Received",
  Unclear: "Others",
};

/** Best-guess starting category for the manual classifier — the person can always change it. */
export function verdictToCategory(v: ReplyVerdict): EmailCategory {
  return VERDICT_TO_CATEGORY[v];
}

/**
 * Full keyword-only EmailCategory decision. Reads the ENTIRE combined
 * subject + snippet + body text (never just an isolated word) and checks
 * every category's phrase bank in a fixed priority order, so a stronger,
 * more specific signal anywhere in the text always wins over a weaker one.
 * Nothing here is guessed independently per-category — every branch below
 * only fires after all higher-priority, more-specific rules have already
 * been ruled out against the SAME full text.
 */
export function keywordCategoryFor(
  subject: string,
  snippet: string,
  body?: string,
): EmailCategory {
  const text = `${subject} ${snippet} ${body ?? ""}`.toLowerCase();

  // 1. Bad news always wins, no matter what else is in the mail.
  if (containsAny(text, REJECT_WORDS)) return "Rejected";

  // 2. Other explicit, unambiguous outcomes.
  if (containsAny(text, WAITLIST_WORDS)) return "Waiting List";
  if (containsAny(text, INFORMED_LATER_WORDS)) return "Will Be Informed Later";
  if (containsAny(text, DOCUMENT_REQUEST_WORDS)) return "Document Request";

  // 3. Application/profile steps the person themselves completed —
  //    filed as received unless a genuinely unambiguous confirmation
  //    phrase is ALSO present in the same text.
  if (
    containsAny(text, APPLICATION_PROGRESS_WORDS) &&
    !containsAny(text, STRONG_JOB_CONFIRM_WORDS)
  ) {
    return "Application Received";
  }

  // 4. A literal offer-letter document, independent of celebratory wording.
  if (containsAny(text, OFFER_LETTER_WORDS)) return "Offer Letter";

  // 5. Explicit, unambiguous employment confirmation.
  if (containsAny(text, STRONG_JOB_CONFIRM_WORDS)) {
    if (containsAny(text, INTERN_WORDS)) return "Internship Approved";
    return "Job Confirmed";
  }

  // 6. Weaker positive/offer-ish wording (e.g. bare "congratulations",
  //    "pleased to inform") without a concrete confirmation phrase.
  if (containsAny(text, OFFER_WORDS)) {
    if (containsAny(text, INTERN_WORDS)) return "Internship Approved";
    return "Approved";
  }

  // 7. Coding test / online assessment, checked before a plain interview
  //    call so "complete this assessment" never gets filed as an interview.
  if (containsAny(text, ASSESSMENT_WORDS)) return "Assessment Invite";

  // 8. Live interview scheduling/invitation.
  if (containsAny(text, INTERVIEW_WORDS)) return "Interview Call";

  // 9. Requests aimed at the person to act on their own profile/resume.
  if (containsAny(text, PROFILE_UPDATE_WORDS)) return "Profile Update Requested";

  // 10. Requests to act on an external tracking/careers portal.
  if (containsAny(text, PORTAL_UPDATE_WORDS)) return "Job Portal Update Requested";

  // 11. Plain "we got it" acknowledgement.
  if (containsAny(text, ACK_WORDS)) return "Application Received";

  return "Others";
}

/** The category to show/auto-save for a reply. */
export function resolveSuggestedCategory(
  reply: Pick<GmailReply, "suggestedCategory" | "suggestedVerdict">,
): EmailCategory {
  return reply.suggestedCategory ?? verdictToCategory(reply.suggestedVerdict);
}

/**
 * Best-effort match of an inbound email to a tracked application, by
 * looking for the company name inside the sender's name/email/domain
 * or the subject line. Returns undefined when nothing matches well.
 */
export function matchReplyToApplication(
  reply: Pick<GmailReply, "fromName" | "fromEmail" | "subject" | "snippet">,
  applications: JobApplication[],
): JobApplication | undefined {
  const haystack =
    `${reply.fromName} ${reply.fromEmail} ${reply.subject} ${reply.snippet}`.toLowerCase();
  let best: { app: JobApplication; score: number } | undefined;

  for (const app of applications) {
    const company = app.companyName.toLowerCase().trim();
    if (!company) continue;
    let score = 0;
    if (haystack.includes(company)) score += 2;
    const domainGuess = company.replace(/[^a-z0-9]/g, "");
    if (
      domainGuess &&
      reply.fromEmail
        .toLowerCase()
        .replace(/[^a-z0-9@.]/g, "")
        .includes(domainGuess)
    ) {
      score += 3;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { app, score };
    }
  }
  return best?.app;
}

// ==============================================================
// 3. Keyword-based relevance filter
// ==============================================================

/**
 * Decides whether an email is job-related at all, from the full
 * combined text. EXCLUDE_WORDS (OTP codes, receipts, newsletters, ...)
 * are checked first and win outright — a stray word like "role" inside
 * a shipping notification must never flip this to true.
 */
export function looksJobRelated(
  subject: string,
  snippet: string,
  body?: string,
): boolean {
  const text = `${subject} ${snippet} ${body ?? ""}`.toLowerCase();
  if (containsAny(text, EXCLUDE_WORDS)) return false;
  return containsAny(text, RELEVANCE_WORDS);
}

// ==============================================================
// 4. Heuristic (non-AI) company name / position extraction
// ==============================================================

const GENERIC_SENDER_WORDS = [
  "noreply",
  "no-reply",
  "no reply",
  "donotreply",
  "do-not-reply",
  "careers",
  "career",
  "recruiting",
  "recruitment",
  "talent acquisition",
  "talent",
  "hr",
  "human resources",
  "jobs",
  "job alerts",
  "hiring",
  "support",
  "notifications",
  "notification",
  "admin",
  "administrator",
  "team",
  "info",
  "contact",
  "system",
  "automated",
  "mailer",
  "newsletter",
  "updates",
];

// Job boards / ATS platforms are never the employer — never guess these
// as the companyName even when they're the visible sender.
const KNOWN_PORTALS = [
  "linkedin",
  "indeed",
  "bdjobs",
  "glassdoor",
  "ziprecruiter",
  "naukri",
  "monster",
  "greenhouse",
  "lever",
  "workday",
  "smartrecruiters",
  "bamboohr",
  "icims",
  "taleo",
  "successfactors",
  "myworkday",
  "zohorecruit",
  "freshteam",
  "breezy",
  "jobvite",
  "recruitee",
  "personio",
  "gmail",
  "outlook",
  "yahoo",
  "hotmail",
];

function titleCaseWord(word: string): string {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word;
}

/**
 * Heuristic, keyword-only company name guess — derived strictly from the
 * sender's display name or email domain, never from free-text guessing in
 * the body. Returns null rather than a low-confidence guess whenever the
 * sender looks generic (no-reply, HR, a job board, a personal email
 * provider, ...): a missing value is safer than a wrong one.
 */
export function extractCompanyName(
  fromName?: string,
  fromEmail?: string,
): string | null {
  const name = (fromName ?? "").trim();
  const nameLower = name.toLowerCase();

  const isGeneric =
    !name ||
    GENERIC_SENDER_WORDS.some((w) => nameLower === w || nameLower.includes(w)) ||
    KNOWN_PORTALS.some((p) => nameLower.includes(p));

  if (!isGeneric) {
    // Strip a trailing role suffix like "Acme Corp Recruiting Team" ->
    // "Acme Corp", but only when the suffix is clearly a department label,
    // never trimming a name down to nothing.
    const cleaned = name
      .replace(
        /\s*(hr|human resources|recruiting|recruitment|talent acquisition|talent|careers?|hiring)\s*(team)?$/i,
        "",
      )
      .trim();
    if (cleaned.length >= 2) return cleaned;
  }

  const email = (fromEmail ?? "").trim().toLowerCase();
  const domainMatch = email.match(/@([a-z0-9.-]+)\./i);
  if (domainMatch) {
    const label = domainMatch[1].split(".")[0];
    if (label && !KNOWN_PORTALS.includes(label) && label.length >= 2) {
      return titleCaseWord(label);
    }
  }

  return null;
}

// Regex patterns that reliably introduce a job title in recruiting
// emails. Checked in order; the first confident match wins. Kept
// conservative on purpose — returning null is preferred over a wrong
// guess.
const POSITION_PATTERNS: RegExp[] = [
  /for the position of ([a-z0-9&()+/\- ]{2,60}?)(?:[.,!\n]|$| position| role| at )/i,
  /for the role of ([a-z0-9&()+/\- ]{2,60}?)(?:[.,!\n]|$| position| role| at )/i,
  /application for the ([a-z0-9&()+/\- ]{2,60}?) position/i,
  /application for the ([a-z0-9&()+/\- ]{2,60}?) role/i,
  /regarding your ([a-z0-9&()+/\- ]{2,60}?) application/i,
  /position:\s*([a-z0-9&()+/\- ]{2,60})/i,
  /role:\s*([a-z0-9&()+/\- ]{2,60})/i,
];

/**
 * Heuristic, keyword-only position/role guess from the subject/snippet
 * text using a small set of conservative, specific patterns. Returns
 * null when nothing matches confidently rather than guessing.
 */
export function extractPosition(subject: string, snippet: string): string | null {
  const text = `${subject}. ${snippet}`;
  for (const pattern of POSITION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].trim().replace(/\s{2,}/g, " ");
      if (cleaned.length >= 2 && cleaned.length <= 60) {
        return cleaned
          .split(" ")
          .map((w) => (w.length > 2 ? titleCaseWord(w) : w))
          .join(" ");
      }
    }
  }
  return null;
}

export interface KeywordClassificationResult {
  isJobRelated: boolean;
  category: EmailCategory;
  companyName: string | null;
  position: string | null;
}

/**
 * The single entry point for classifying an email — 100% keyword-based,
 * no AI/network call involved. Always looks at the full combined text
 * (subject + snippet + body) before deciding anything, applies the hard
 * safety rules (internship always wins over "Job Confirmed"; "Job
 * Confirmed" is never used without a company name attached), and returns
 * everything the UI needs in one call.
 */
export function classifyEmailByKeywords(
  subject: string,
  snippet: string,
  body?: string,
  fromName?: string,
  fromEmail?: string,
): KeywordClassificationResult {
  const isJobRelated = looksJobRelated(subject, snippet, body);

  if (!isJobRelated) {
    return {
      isJobRelated: false,
      category: "Others",
      companyName: null,
      position: null,
    };
  }

  let category = keywordCategoryFor(subject, snippet, body);
  const companyName = extractCompanyName(fromName, fromEmail);
  const position = extractPosition(subject, snippet);

  // Hard rule: "Job Confirmed" is never used without a company name —
  // if the sender's identity is generic/unresolvable, this is downgraded
  // rather than risk stating a confirmed job at an unknown company.
  if (category === "Job Confirmed" && !companyName) {
    category = "Others";
  }

  return { isJobRelated, category, companyName, position };
}

// ==============================================================
// 5. Legacy AI classification result type
// ------------------------------------------------------------
// Kept only so any old imports of this type don't break the build.
// The Gemini/AI classification path itself has been removed — all
// classification now goes exclusively through classifyEmailByKeywords.
// ==============================================================
export interface AIClassificationResult {
  isJobRelated: boolean;
  category: EmailCategory;
  companyName: string | null;
  position: string | null;
}