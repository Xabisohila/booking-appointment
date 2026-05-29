# Dental AI Receptionist

AI-powered WhatsApp booking system for dental practices. Replaces a human receptionist for the full patient journey — from first message to Google review.

---

## Flow

```
Patient WhatsApp message
        ↓
  AI Qualification (Claude)
  - Collects name, concern, new/returning, preferred time
        ↓
  Booking Created + Confirmation sent
        ↓
  Reminder sent 24h before appointment  ← [manual for now]
        ↓
  Mark Done → Google Review request sent
        ↓
  Review tracked on dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS (Vite) |
| Backend | ASP.NET Core 10 (C#) |
| Database | PostgreSQL 18 |
| AI | Claude API (claude-sonnet-4-6) |
| Messaging | Meta WhatsApp Business Cloud API |

---

## Project Structure

```
Booking Systsem/
├── AmalindaPlumbing.Api/        # ASP.NET Core backend
│   ├── Controllers/
│   │   ├── WebhookController.cs     # Meta webhook receiver
│   │   ├── LeadsController.cs       # Lead CRUD
│   │   └── BookingsController.cs    # Booking actions + reminder + review
│   ├── Services/
│   │   ├── AiQualificationService.cs  # Claude conversation handler
│   │   └── WhatsAppService.cs         # WhatsApp message sender
│   ├── Models/
│   │   ├── Lead.cs          # Patient lead
│   │   ├── Booking.cs       # Appointment booking
│   │   ├── Conversation.cs  # WhatsApp message history
│   │   └── Job.cs           # Completed appointment + review tracking
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Migrations/
│   │   ├── 20260528130619_InitialCreate.cs
│   │   └── 20260529120000_DentalPivot.cs   # Issue→Concern, TechnicianNotes→DentistNotes
│   └── appsettings.json
│
└── amalinda-client/             # React frontend
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx   # Stats overview
        │   ├── Leads.tsx       # Lead list + WhatsApp conversation panel
        │   ├── Bookings.tsx    # Appointment management
        │   └── Reviews.tsx     # Completed appointments + review tracking
        └── components/
            └── Sidebar.tsx
```

---

## Configuration — `appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=dental_reception;Username=postgres;Password=YOUR_PASSWORD"
  },
  "Anthropic": {
    "ApiKey": "YOUR_ANTHROPIC_API_KEY"
  },
  "WhatsApp": {
    "PhoneNumberId": "YOUR_WHATSAPP_PHONE_NUMBER_ID",
    "AccessToken": "YOUR_WHATSAPP_ACCESS_TOKEN",
    "VerifyToken": "your_custom_verify_token"
  },
  "Practice": {
    "Name": "Smile Dental Practice",
    "GoogleReviewLink": "https://g.page/r/YOUR_REVIEW_LINK"
  }
}
```

Get your WhatsApp credentials from [Meta for Developers](https://developers.facebook.com) → WhatsApp → API Setup.

---

## Running Locally

### Prerequisites
- .NET 10 SDK
- Node.js 18+
- PostgreSQL 18

### Backend

> `dotnet run` is blocked by WDAC on corporate machines. Use this instead:

```powershell
# First time only — build
cd "AmalindaPlumbing.Api"
dotnet build -c Debug

# Every time — run
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5000"
dotnet "AmalindaPlumbing.Api\bin\Debug\net10.0\AmalindaPlumbing.Api.dll"
```

The API auto-creates the `dental_reception` database and runs all migrations on startup.

### Frontend

```powershell
cd "amalinda-client"
npm run dev
```

Open `http://localhost:5173`

---

## WhatsApp Webhook Setup

1. In Meta Developer Console, set your webhook URL to:
   `https://your-domain.com/api/webhook`
2. Set the verify token to match `WhatsApp:VerifyToken` in appsettings
3. Subscribe to the `messages` field under WhatsApp → Webhooks

For local testing, use [ngrok](https://ngrok.com):
```bash
ngrok http 5000
```

---

## AI Qualification — BOOKING_READY Format

When Claude has collected all required information it emits:

```
BOOKING_READY|{name}|{concern}|{NewPatient or ReturningPatient}|{preferredTime}
```

Example:
```
BOOKING_READY|Sarah Jones|Toothache - moderate pain|NewPatient|2025-06-05 10:00
```

The backend parses this, creates the `Booking` record, and sends a confirmation WhatsApp to the patient automatically.

---

## Database

| Table | Purpose |
|---|---|
| `Leads` | Every patient who messages — name, phone, concern, status |
| `Bookings` | Confirmed appointments with scheduled time |
| `Conversations` | Full WhatsApp message history per lead |
| `Jobs` | Completed appointments — dentist notes, review request tracking |

Lead statuses: `New` → `Qualifying` → `Qualified` → `Booked` → *(Completed via Booking)*

---

## What's Still Needed

- [ ] Practice name + Google review link pulled from config (not hardcoded)
- [ ] Automated 24h reminder (background service / Hangfire)
- [ ] STOP / RESCHEDULE keyword handling in webhook
- [ ] Dashboard login / auth
