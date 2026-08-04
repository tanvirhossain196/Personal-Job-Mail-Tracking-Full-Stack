"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { GmailReply, MailFolder } from "./types";

// Poll frequently so new mail (interview invites, offers, rejections)
// shows up without the user needing to click "Sync now".
const AUTO_SYNC_INTERVAL_MS = 15_000;
const CACHE_PREFIX = "job-tracker:mail-cache:";

function readCache(folder: MailFolder): { replies: GmailReply[]; syncedAt: string } | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(CACHE_PREFIX + folder);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeCache(folder: MailFolder, replies: GmailReply[], syncedAt: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      CACHE_PREFIX + folder,
      JSON.stringify({ replies, syncedAt })
    );
  } catch {
    // sessionStorage can throw when full/blocked — safe to ignore, it's only a cache.
  }
}

export function useGmailInbox(folder: MailFolder) {
  const { data: session, status } = useSession();
  const cached = readCache(folder);
  const [replies, setReplies] = useState<GmailReply[]>(cached?.replies ?? []);
  // Only show a blocking "loading" state when there's nothing cached to show yet —
  // otherwise the cached data appears instantly and refresh happens quietly behind it.
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | undefined>();
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | undefined>(
    cached ? new Date(cached.syncedAt) : undefined
  );
  const inFlight = useRef(false);

  const fetchReplies = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading((prev) => prev || replies.length === 0);
    setError(undefined);
    try {
      const res = await fetch(`/api/gmail/replies?folder=${folder}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load mail.");
      const next: GmailReply[] = data.replies ?? [];
      const syncedAt = new Date();
      setReplies(next);
      setLastSyncedAt(syncedAt);
      writeCache(folder, next, syncedAt.toISOString());
    } catch (e: any) {
      setError(e.message ?? "Could not load mail.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  useEffect(() => {
    if (status !== "authenticated") {
      setReplies([]);
      return;
    }
    fetchReplies();
    const id = setInterval(fetchReplies, AUTO_SYNC_INTERVAL_MS);
    // Re-sync instantly whenever the tab regains focus.
    const onFocus = () => fetchReplies();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, folder]);

  return { session, status, replies, loading, error, lastSyncedAt, refresh: fetchReplies };
}
