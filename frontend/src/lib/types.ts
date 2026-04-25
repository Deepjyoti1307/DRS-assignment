// ─── Shared event + registration types ────────────────────────────────

export type EventMode = "online" | "offline";
export type RegistrationMode = "open" | "shortlisted";
export type EventStatus = "draft" | "published" | "cancelled";
export type RSVPStatus = "pending" | "registered" | "approved" | "rejected" | "revoked" | "checked_in";

export interface Event {
  _id?: string;
  id?: string;
  organizer_id: string;
  title: string;
  description: string;
  date_time: string; // ISO string
  mode: EventMode;
  venue: string;
  capacity: number;
  registrations_count: number;
  registration_mode: RegistrationMode;
  status: EventStatus;
  template_used: string | null;
  slug: string | null;
  image_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface StatusHistoryItem {
  from_status?: RSVPStatus | null;
  to_status: RSVPStatus;
  status?: RSVPStatus; // For backward compatibility if needed
  changed_at: string;
  changed_by: string;
  reason?: string;
}

export interface Registration {
  id: string;
  event_id: string;
  organizer_id: string;
  attendee_email: string;
  attendee_name: string;
  attendee_phone?: string;
  notes?: string;
  status: RSVPStatus;
  status_history: StatusHistoryItem[];
  sync_status: "not_synced" | "pending" | "synced" | "failed";
  hubspot_contact_id?: string;
  hubspot_last_synced_at?: string;
  sync_error_message?: string;
  custom_fields?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Dashboard stats derived from events
export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalRegistrations: number;
}
