import { Inbox } from "lucide-react";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-dashed border-steel-300 rounded-md bg-white">
      <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-fog-100 text-steel-500 mb-4">
        <Inbox size={20} />
      </div>
      <div className="font-display font-semibold text-ink text-base">
        No applications logged yet
      </div>
      <p className="text-sm text-steel-500 mt-1.5 max-w-sm">
        Add the first job you&apos;re tracking — the posting link, company, position, and the
        email you&apos;ll apply with.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-sm bg-signal hover:bg-signal-600 text-ink font-medium text-sm px-4 py-2 transition-colors"
      >
        Log an application
      </button>
    </div>
  );
}
