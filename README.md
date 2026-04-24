# Eventic: Production-Grade Event Management Ecosystem

Eventic is a high-performance, full-stack event management platform designed for organizers to create, manage, and track event registrations with atomic integrity and premium notification systems.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Design System
- **Authentication**: Clerk (Multi-role support)
- **State Management**: React Context + TanStack Query (planned/partial)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Database**: MongoDB (Atlas)
- **ODM**: Beanie (Pydantic-based ODM)
- **Integrations**: HubSpot CRM (Contact & Note Sync)
- **Email**: SMTP (Gmail) with responsive HTML templates
- **Testing**: Pytest + Asyncio

---

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- Gmail account (for SMTP)

### Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv .venv`
3. Activate it: `.\.venv\Scripts\activate` (Windows) or `source .venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file (see [Environment Variables](#environment-variables) below).
6. Run the seed script to populate data: `python seed.py`
7. Start the server: `python main.py` or `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Create a `.env.local` file with Clerk and Backend URL.
4. Start the dev server: `npm run dev`

---

## 🔑 Environment Variables

### Backend (.env)
```env
DATABASE_URL=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
APP_SECRET_KEY=your-random-secret

# SMTP Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧠 Assumptions
- **Authentication**: We assume Clerk is the source of truth for user identities. The `organizer_id` in our database maps to Clerk's `user.id` (`sub`).
- **Capacity**: Event capacity is enforced at the moment of registration (for Open mode) or at the moment of approval (for Shortlisted mode).
- **Timezones**: All dates are stored and compared in UTC to ensure consistency across different user locales.

---

## ⚖️ Tradeoffs
- **Fire-and-Forget Emails**: We use `asyncio.create_task` for sending emails. This ensures the API response is instant for the user, but means emails are not retried if the server crashes immediately after the API call. *Tradeoff: UX Speed vs. Delivery Guarantee.*
- **No SQL Relations**: Using MongoDB for event data allows for highly flexible "Custom Fields" in registrations. *Tradeoff: Schema Flexibility vs. Complex Join Performance.*
- **Sync vs Async CRM**: HubSpot sync is currently triggered via background tasks within the registration flow rather than a dedicated message queue (like Celery). This simplifies the infrastructure for this scale. *Tradeoff: Infrastructure Simplicity vs. Distributed Robustness.*