/**
 * api.ts — Thin API client for the Eventic FastAPI backend.
 * Uses the Clerk session token for authenticated requests.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

// ─── Events ────────────────────────────────────────────────────────────

import type { Event, EventStatus } from "./types";

export async function fetchEvents(
  token: string,
  status?: EventStatus
): Promise<Event[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Event[]>(`/api/events${qs}`, token);
}

export async function fetchEvent(token: string, id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`, token);
}

export async function createEvent(
  token: string,
  payload: Omit<
    Event,
    "id" | "organizer_id" | "status" | "slug" | "created_at" | "updated_at"
  >
): Promise<Event> {
  return apiFetch<Event>("/api/events", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(
  token: string,
  id: string,
  payload: Partial<Event>
): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function publishEvent(token: string, id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}/publish`, token, {
    method: "PATCH",
  });
}

export async function cancelEvent(token: string, id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}/cancel`, token, {
    method: "PATCH",
  });
}

export async function duplicateEvent(token: string, id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}/duplicate`, token, {
    method: "POST",
  });
}

export async function deleteEvent(
  token: string,
  id: string
): Promise<void> {
  await apiFetch<void>(`/api/events/${id}`, token, { method: "DELETE" });
}

// ─── Registrations ─────────────────────────────────────────────────────

import type { Registration, RSVPStatus } from "./types";

export async function fetchRegistrations(
  token: string,
  eventId: string,
  status?: RSVPStatus,
  limit: number = 50,
  offset: number = 0
): Promise<Registration[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const qs = params.toString();
  return apiFetch<Registration[]>(
    `/api/events/${eventId}/registrations?${qs}`,
    token
  );
}

export async function fetchAllRegistrations(
  token: string,
  status?: RSVPStatus,
  limit: number = 50,
  offset: number = 0
): Promise<Registration[]> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const qs = params.toString();
  return apiFetch<Registration[]>(`/api/registrations?${qs}`, token);
}

export async function fetchAuditLogs(
  token: string,
  limit: number = 100
): Promise<any[]> {
  return apiFetch<any[]>(`/api/registrations/audit?limit=${limit}`, token);
}

export async function approveRegistration(
  token: string,
  id: string
): Promise<Registration> {
  return apiFetch<Registration>(`/api/registrations/${id}/approve`, token, {
    method: "PATCH",
  });
}

export async function rejectRegistration(
  token: string,
  id: string
): Promise<Registration> {
  return apiFetch<Registration>(`/api/registrations/${id}/reject`, token, {
    method: "PATCH",
  });
}

export async function revokeRegistration(
  token: string,
  id: string
): Promise<Registration> {
  return apiFetch<Registration>(`/api/registrations/${id}/revoke`, token, {
    method: "PATCH",
  });
}

export async function checkInRegistration(
  token: string,
  id: string
): Promise<Registration> {
  return apiFetch<Registration>(`/api/registrations/${id}/check-in`, token, {
    method: "PATCH",
  });
}

// ─── Public ────────────────────────────────────────────────────────────

export interface PublicEventResponse {
  event: Event;
  availability: {
    capacity: number;
    consumed: number;
    remaining: number;
    state: "open" | "full" | "closed" | "cancelled";
    requires_phone?: boolean;
  };
}

export async function fetchPublicEvent(slug: string): Promise<PublicEventResponse> {
  const res = await fetch(`${BASE_URL}/e/${slug}`);
  if (!res.ok) {
    throw new Error("Event not found");
  }
  return res.json();
}

export async function registerForEvent(eventId: string, payload: {
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
}): Promise<Registration> {
  const res = await fetch(`${BASE_URL}/api/events/${eventId}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(body.detail || "Registration failed");
  }
  return res.json();
}

// ─── Settings ──────────────────────────────────────────────────────────

export interface Settings {
  clerk_user_id: string;
  email: string | null;
  name: string | null;
  hubspot_api_key_masked: string | null;
  has_hubspot_key: boolean;
}

export async function fetchSettings(token: string): Promise<Settings> {
  return apiFetch<Settings>("/api/settings", token);
}

export async function updateSettings(
  token: string,
  payload: { name?: string; hubspot_api_key?: string }
): Promise<Settings> {
  return apiFetch<Settings>("/api/settings", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function syncOrganizer(token: string): Promise<void> {
  await apiFetch("/api/auth/sync", token, { method: "POST" });
}
