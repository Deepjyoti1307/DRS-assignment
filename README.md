# Eventic: Mini Event Management Platform

Eventic is a full-stack event management platform for creating, publishing, and operating events end to end. Organizers can manage event lifecycles, attendee registrations, and RSVP decisions from a single dashboard, while attendees register through a public event page.

The platform includes:
- Organizer authentication and protected dashboard access
- Event creation and status lifecycle (`draft`, `published`, `cancelled`)
- Public event pages with registration and capacity enforcement
- RSVP workflows for both open and shortlisted event modes
- Transactional email notifications
- HubSpot CRM sync for attendee and RSVP lifecycle data

## Key Features

### Event Management
- Create, edit, publish, and cancel events
- Use templates or start from scratch
- Share public event links
- Enforce validation and scheduling rules for publish actions

### Registration and RSVP
- Public registration form for attendees
- Open mode: automatic confirmation (`registered`)
- Shortlisted mode: review queue (`pending` -> `approved` / `rejected`)
- Revoke flow with capacity restoration (`revoked`)
- Optional check-in workflow (`checked_in`)

### Organizer Dashboard
- Event list with status and registration visibility
- Attendee management view with search/filter/actions
- Registration status tracking per attendee
- HubSpot sync status visibility when integration is configured

### Notifications and Integrations
- Transactional emails for registration, RSVP, and event updates
- HubSpot contact sync on registration and RSVP status changes
- Non-blocking integration behavior to keep core flows reliable

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Clerk Next.js SDK
- Backend: FastAPI, Python, Pydantic, Beanie, Motor
- Database: MongoDB (Atlas/local)
- Authentication: Clerk
- Email: Resend or SMTP
- CRM Integration: HubSpot API
- Testing: Pytest, pytest-asyncio

## Project Structure

```text
DRS-assignment/
├── backend/
│   ├── requirements.txt
│   ├── seed.py
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+ (3.12 recommended)
- Node.js 20+
- MongoDB connection URI
- Clerk application keys
- Email provider credentials (Resend or SMTP)
- Optional: HubSpot API key for integration testing

### 1) Configure Environment

Use `DRS-assignment/.env.example` as the base configuration.

- Create `DRS-assignment/backend/.env` for backend runtime values
- Create `DRS-assignment/frontend/.env.local` for frontend runtime values

Set all required keys before running the app.

### 2) Run Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
python seed.py   # optional demo data
uvicorn main:app --reload
```

Backend default: `http://localhost:8000`

### 3) Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:3000`

## Configuration Reference

### Application and Database
- `APP_SECRET_KEY`
- `APP_ENV`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `DATABASE_URL`

### Clerk Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER`
- `CLERK_JWKS_URL`
- `CLERK_AUDIENCE`
- `CLERK_AUTHORIZED_PARTY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `CLERK_SESSION_DURATION_HOURS`

### Email Delivery
- `EMAIL_PROVIDER` (`resend` or `smtp`)
- `RESEND_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `FROM_EMAIL`

### HubSpot and Encryption
- `ENCRYPTION_KEY`
- `HUBSPOT_DEFAULT_API_KEY` (optional)

## API Overview

### Auth
- `POST /api/auth/sync`
- `GET /api/auth/me`

### Events
- `GET /api/events`
- `POST /api/events`
- `GET /api/events/{id}`
- `PATCH /api/events/{id}`
- `DELETE /api/events/{id}`
- `PATCH /api/events/{id}/publish`
- `PATCH /api/events/{id}/cancel`
- `GET /e/{slug}`

### Registrations
- `POST /api/events/{id}/register`
- `GET /api/events/{id}/registrations`
- `PATCH /api/registrations/{id}/approve`
- `PATCH /api/registrations/{id}/reject`
- `PATCH /api/registrations/{id}/revoke`
- `PATCH /api/registrations/{id}/checkin`

### Settings and HubSpot
- `GET /api/settings`
- `PATCH /api/settings/hubspot`
- `DELETE /api/settings/hubspot`
- `POST /api/registrations/{id}/sync-hubspot`

## Engineering Notes

### Assumptions
- Clerk is the source of identity; organizers are linked by `clerk_user_id`
- Datetimes are stored in UTC and formatted for display at the UI layer
- HubSpot sync runs asynchronously after successful domain actions

### Tradeoffs
- Background task execution is used instead of an external queue for simpler local operation
- MongoDB document modeling is favored for flexible iteration on event and registration data
- Core registration reliability is prioritized over strict real-time CRM consistency

## Seed Data and Testing

- Seed demo data with `python seed.py`
- Run backend tests with `pytest`

## Operational Note

If critical environment values are missing, related modules (auth, email, or HubSpot sync) will not initialize correctly.