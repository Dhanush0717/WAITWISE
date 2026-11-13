# WaitWise — 10-Minute Presentation Speaker Notes

> [!IMPORTANT]
> Practice this out loud. Target pace: ~120 words/minute. This script is ~1,200 words ≈ 10 minutes.

---

## Slide 1 — Opening (0:00 – 0:45)

**Say:**
> "Good [morning/afternoon]. My project is called **WaitWise** — a real-time digital queue management system. The core problem it solves is simple: nobody likes standing in a physical line not knowing how long they'll wait. WaitWise replaces that frustration with a smart, live token system — accessible from a kiosk at the location, or from your phone anywhere."

**Key point to land:** One sentence problem → one sentence solution.

---

## Slide 2 — What Does It Do? (0:45 – 2:00)

**Say:**
> "Any organization — a clinic, a government office, a telecom service center — can register on WaitWise and set up their own service with custom desks and counters. Once set up, three types of users interact with the system:
>
> - **Visitors** join the queue by entering their name at a kiosk or on their phone. They get a printed token — for example, `SVC-001`.
> - **Staff** sit at the counter dashboard. When they call the next token, the kiosk display and the visitor's screen both update instantly.
> - **The Organization Admin** manages everything — opening or closing desks, monitoring queue depth, and reviewing completed tickets for the day.
>
> All three views update simultaneously, in real time, with no page refresh."

**Key point to land:** 3 user roles, 1 live system.

---

## Slide 3 — Technology Stack (2:00 – 3:30)

**Say:**
> "The tech stack is a clean separation of concerns:
>
> On the **backend**, I used **Node.js with Express** as the REST API server. Data is stored in **MongoDB** via **Mongoose** ODM — that gives me schema validation, indexing, and clean model relationships between Organizations, Services, Counters, and Tickets.
>
> On the **frontend**, I used **Angular 18** with standalone components and Angular Signals for reactive state — no need for heavy state libraries like NgRx.
>
> The real-time layer is powered by **Socket.IO** — a WebSocket library that lets the server push live events to every connected client the moment something changes.
>
> These are connected by a **proxy** so the Angular dev server forwards `/api` calls to the Node backend, keeping everything on one origin during development."

**Key point to land:** REST for data operations, Socket.IO for live push.

---

## Slide 4 — Live Demo Walk-through (3:30 – 6:00)

> [!TIP]
> Open two browser windows side-by-side: one Kiosk (`/kiosk/:id`), one Staff Dashboard (`/staff/:id`). Have the backend running.

**Say:**
> "Let me show you this live. *(Switch to browser.)*
>
> This is the **Kiosk screen** — what a visitor sees when they walk in. I'll enter a name and select priority. *(Type name, click 'Get Token'.)* The system issues token `SVC-001` and prints it on screen.
>
> Now watch the **Staff Dashboard** on the right. *(Point.)* The waiting queue instantly shows the new token with the customer's name — no refresh, no polling. That update traveled from the kiosk through the backend to Socket.IO, which pushed the `tokenCreated` event to all subscribers of this service's room.
>
> The staff member clicks **'Call Next'**. *(Click.)* The token moves from Waiting to Serving. The visitor's ticket screen shows **'Your turn — please proceed to Counter 1'**.
>
> When service is complete, the staff clicks **'Complete'**. The ticket moves to the Completed tab, and `actualDurationMinutes` is recorded — that feeds the prediction engine."

**Key point to land:** Demonstrate the complete lifecycle — join → call → serve → complete.

---

## Slide 5 — Wait Time Prediction Engine (6:00 – 7:15)

**Say:**
> "One of the smarter features is the **wait time estimator**. When a visitor joins or checks their position, the system calculates:
>
> ```
> EstimatedWait = (PeopleAhead ÷ ActiveCounters) × AvgServiceTime
> ```
>
> `PeopleAhead` is a live count of WAITING tickets with a lower sequence number. `ActiveCounters` is the number of open desks right now. `AvgServiceTime` comes from actual `actualDurationMinutes` values recorded from completed tickets in the last 24 hours — if fewer than 3 real records exist, it falls back to the service's default estimate.
>
> There's also a ±20% uncertainty margin so we show a range like '8–12 minutes' rather than a false-precise single number.
>
> The 'Should I Go Now?' feature extends this by letting a visitor enter their current location — the system estimates travel time and compares it against the wait — telling you if you can leave now and still arrive on time."

**Key point to land:** Formula = (people ÷ counters) × avg time. Historical data beats static defaults.

---

## Slide 6 — Database Design (7:15 – 8:15)

**Say:**
> "The MongoDB schema has six core collections:
>
> - **Organisation** — the top-level tenant (the company that signed up).
> - **Service** — a queue offered by that org, like 'SIM Card Support'.
> - **Counter** — a physical desk within a service, with status: `open`, `busy`, `on_break`, or `closed`.
> - **Ticket** — one queue entry per visitor, tracking `sequenceNumber`, `status`, `customerName`, `priority`, and timestamps like `joinedAt`, `calledAt`, `completedAt`.
> - **QueueSession** — a daily session that acts as the atomic token counter. Using MongoDB's `$inc` operator ensures no two tickets ever get the same number, even under concurrent requests.
> - **User** — staff and admin accounts with JWT-based authentication.
>
> All ObjectId references are cross-linked so a single query can join Organisation → Service → Counter → Ticket."

**Key point to land:** Atomic `$inc` prevents duplicate tokens. Multi-tenant via `organisationId` on every document.

---

## Slide 7 — Validation & Security (8:15 – 9:00)

**Say:**
> "Validation happens at three layers:
>
> - **Frontend (Angular)**: Reactive Forms with Validators — required fields, pattern checks (phone, email), min/max length. The form won't submit if invalid.
> - **Backend (Express)**: Manual validation in controllers before any DB write — `serviceId` present, service exists, service is `active`, queue not at capacity.
> - **Database (Mongoose)**: Schema-level `required`, `enum`, `trim`, and `default` rules enforce data integrity even if the API is called directly.
>
> Authentication uses **JWT tokens** stored in localStorage. Protected routes use an `authMiddleware` that verifies the token and attaches `req.user` before any controller runs."

**Key point to land:** 3-layer validation — client, server, database.

---

## Slide 8 — Closing (9:00 – 10:00)

**Say:**
> "To summarize — WaitWise is a **multi-tenant, real-time queue management platform**. The key technologies are Angular 18, Node.js/Express, MongoDB/Mongoose, and Socket.IO. The key concepts demonstrated are: REST API design, real-time WebSocket communication, reactive frontend with signals, JWT authentication, schema validation, and a statistical prediction algorithm using historical data.
>
> The system is fully customizable — any organization can onboard, create their own services and counters, and start managing queues within minutes. No hardcoded industries. No static data.
>
> Thank you — I'm happy to take questions."

**Key point to land:** Recap the 5 technologies and 6 concepts in one breath.

---

## Quick Reference — Things to Have Ready

| What | Where |
|------|-------|
| Backend running | `cd backend && node server.js` |
| Frontend running | `cd frontend && npm run dev` |
| Kiosk URL | `http://localhost:4200/kiosk/<serviceId>` |
| Staff Dashboard | `http://localhost:4200/staff/<serviceId>` |
| Organisation setup | `http://localhost:4200/register` → `/organisation-onboarding` |
| Service management | `http://localhost:4200/service-management` |

> [!NOTE]
> Have your MongoDB Atlas or local MongoDB running before demo. Have the browser windows already open — don't navigate live during the presentation.
