"use client";

export function EventCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6 animate-pulse space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-20 bg-white/10 rounded-full" />
          <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
        </div>
        <div className="h-7 w-24 bg-white/10 rounded-full ml-4" />
      </div>
      <div className="h-4 w-1/2 bg-white/10 rounded" />
      <div className="h-2 w-full bg-white/10 rounded-full" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-white/10 rounded-lg" />
        <div className="h-8 w-24 bg-white/10 rounded-lg" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6 animate-pulse">
      <div className="h-4 w-24 bg-white/10 rounded mb-4" />
      <div className="h-10 w-16 bg-white/10 rounded" />
    </div>
  );
}
