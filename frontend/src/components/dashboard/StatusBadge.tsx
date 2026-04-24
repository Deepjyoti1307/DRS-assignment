"use client";

import { type EventStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; classes: string; dot: string }
> = {
  published: {
    label: "Published",
    classes: "bg-lime/10 text-lime border border-lime/20",
    dot: "bg-lime",
  },
  draft: {
    label: "Draft",
    classes: "bg-white/5 text-gray-400 border border-white/10",
    dot: "bg-gray-400",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
  },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        cfg.classes
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
