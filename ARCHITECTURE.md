# System Architecture: Eventic

## 📁 App Structure

```text
backend/
├── app/
│   ├── api/             # API Route Handlers (FastAPI)
│   ├── core/            # Config, DB connection, Security
│   ├── models/          # Beanie/Pydantic Data Models
│   ├── services/        # Business Logic (Email, Registration, Event)
│   └── main.py          # App Entrypoint
├── tests/               # Pytest Suite
└── seed.py              # Production-grade Data Seeder

frontend/
├── src/
│   ├── app/             # Next.js App Router (Dashboard & Public)
│   ├── components/      # UI Components (Shadcn-like)
│   ├── lib/             # API Client & Utilities
│   └── middleware.ts    # Clerk Auth Middleware
```

---

## 🏗️ Main Models

1.  **Event**: The core entity. Contains metadata (title, date, venue), configuration (`registration_mode`), and real-time state (`registrations_count`).
2.  **Registration**: Tracks attendee interest. Stores `status`, `status_history` for auditing, and `custom_fields` for flexibility.
3.  **Organizer**: Profile data and integration keys (e.g., encrypted HubSpot API Key).
4.  **EmailLog**: A persistent record of every email sent, including delivery status and the exact template used.

---

## 🚦 RSVP State Machine (Logic)

The system enforces strict transition rules based on the event's `registration_mode`:

- **Open Mode**:
  - `registered` (Auto-approved, consumes capacity) → `checked_in`
  - `registered` → `cancelled` (Freed capacity)
- **Shortlisted Mode**:
  - `pending` (Default, no capacity consumed) → `approved` (Consumes capacity)
  - `approved` → `checked_in`
  - `pending` → `rejected`

**Atomic Integrity**: We use MongoDB `$expr` with `$inc` to ensure that `registrations_count` never exceeds `capacity`, even during high-concurrency registration spikes.

---

## 📧 Email Flow

Notifications are handled through a **Fire-and-Forget** service layer:

1.  **Triggers**: Logic in `registration_service` or `event_service` calls a specific trigger (e.g., `trigger_registration_approved`).
2.  **Template Engine**: `email_templates.py` assembles a responsive HTML body using curated brand colors and event metadata.
3.  **Background Dispatch**: The `email_service` wraps the SMTP call in an `asyncio.create_task`.
4.  **Persistence**: Every attempt is logged to the `email_logs` collection. If SMTP fails (e.g., misconfiguration), the log captures the error message while the user's registration remains successful.
