import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { classifyEmailByKeywords, classifyReply } from "@/lib/classify";
import { GmailReply, MailFolder } from "@/lib/types";

// Broadened on purpose: we no longer require job-specific keywords in the
// Gmail search itself — that step used to silently drop legitimate mail
// with unusual subject lines. `category:primary` still excludes Promotions/
// Social/Updates tabs to keep volume sane; relevance and category are both
// decided per-message, purely by keyword matching, in classifyEmailByKeywords
// below (reads the full subject + snippet + body, no AI/network call).
function buildQuery(folder: MailFolder): string {
  const scope = folder === "sent" ? "in:sent" : "in:inbox category:primary";
  return `${scope} newer_than:120d`;
}

function decodeHeader(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string,
) {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

function parseAddress(header: string): { name: string; email: string } {
  const match = header.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  }
  return { name: header, email: header };
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface GmailPart {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: GmailPart[] | null;
}

function extractBody(payload: GmailPart | null | undefined): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data));
  }

  return "";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken as string | undefined;
  const sessionError = (session as any)?.error as string | undefined;

  if (!session || sessionError === "RefreshAccessTokenError") {
    return NextResponse.json(
      {
        error:
          "Your Google session expired. Please sign in again to reconnect Gmail.",
      },
      { status: 401 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not authenticated. Connect Gmail first." },
      { status: 401 },
    );
  }

  const folderParam = req.nextUrl.searchParams.get("folder");
  const folder: MailFolder = folderParam === "sent" ? "sent" : "inbox";

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const gmail = google.gmail({ version: "v1", auth });

    const list = await gmail.users.messages.list({
      userId: "me",
      q: buildQuery(folder),
      // Bumped up since the query is broader now (no keyword pre-filter),
      // and the UI paginates 40 at a time — pull a deep enough pool that
      // "See more" has real pages to reveal across the full 120-day window.
      maxResults: 150,
    });

    const messages = list.data.messages ?? [];

    // Fetch all message bodies in parallel instead of one-by-one — this is
    // what makes sync feel fast. Sequential fetching of 25 messages could
    // take several seconds; in parallel it's bound by the single slowest
    // request instead of the sum of all of them.
    const fetched = await Promise.all(
      messages
        .filter((m) => m.id)
        .map(async (m) => {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: m.id as string,
            format: "full",
          });

          const headers = msg.data.payload?.headers ?? [];
          const from = parseAddress(decodeHeader(headers, "From"));
          const to = parseAddress(decodeHeader(headers, "To"));
          const subject = decodeHeader(headers, "Subject");
          const snippet = msg.data.snippet ?? "";
          const body = extractBody(msg.data.payload as GmailPart) || snippet;
          const dateHeader = decodeHeader(headers, "Date");
          const receivedAt = dateHeader
            ? new Date(dateHeader).toISOString()
            : new Date().toISOString();

          return {
            id: m.id as string,
            from,
            to,
            subject,
            snippet,
            body,
            receivedAt,
          };
        }),
    );

    // Classify every message purely by keyword matching — reads the full
    // subject + snippet + body (not just isolated words) before deciding
    // relevance and category. No AI/network call is involved, so this is
    // synchronous and instant; non-matches are dropped right here.
    const classified = fetched.map((f) => {
      const result = classifyEmailByKeywords(
        f.subject,
        f.snippet,
        f.body,
        f.from.name,
        f.from.email,
      );

      if (!result.isJobRelated) return null;

      const suggestedVerdict = classifyReply(f.subject, f.snippet);

      const reply: GmailReply = {
        id: f.id,
        folder,
        fromName: f.from.name,
        fromEmail: f.from.email,
        toName: f.to.name,
        toEmail: f.to.email,
        subject: f.subject,
        snippet: f.snippet,
        body: f.body,
        receivedAt: f.receivedAt,
        suggestedVerdict,
        suggestedCategory: result.category,
        aiCompanyName: result.companyName,
        aiPosition: result.position,
      };
      return reply;
    });

    const results = classified.filter((r): r is GmailReply => r !== null);
    const replies = results.sort((a, b) =>
      b.receivedAt.localeCompare(a.receivedAt),
    );
    return NextResponse.json({ replies });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch Gmail messages." },
      { status: 500 },
    );
  }
}