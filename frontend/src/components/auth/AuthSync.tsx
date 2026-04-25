"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { syncOrganizer } from "@/lib/api";

export default function AuthSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    async function runSync() {
      if (!isSignedIn || !user?.id) return;

      const storageKey = `eventic:auth-sync:${user.id}`;
      if (sessionStorage.getItem(storageKey) === "done") return;

      try {
        const token = await getToken();
        if (!token) return;
        await syncOrganizer(token);
        sessionStorage.setItem(storageKey, "done");
      } catch (error) {
        // Best-effort bootstrap. Profile APIs can still recover organizer creation.
        console.warn("Auth bootstrap sync failed", error);
      }
    }

    runSync();
  }, [isSignedIn, user?.id, getToken]);

  return null;
}
