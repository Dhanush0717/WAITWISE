# WAITWISE: Real-Time Intelligent Campus Queue & Crowd Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Executive Summary & Project Vision

**WAITWISE** is a full-stack, real-time virtual queue and crowd-management platform built specifically for college campuses. It enables students and visitors to join service queues digitally, monitor their queue position and estimated waiting time in real time, and return to the service desk only when their turn approaches.

WAITWISE addresses physical congestion at key campus hubs:
- **College Administration Office** (Certificates, Migration, ID Passes)
- **Student Services & Examination Section** (Grade cards, Transcripts, Exam tickets)
- **Central Campus Canteen** (Meal tokens, Pre-orders)
- **University Central Library** (Circulation desk, Book returns)
- **Laboratory Service Desks** (Components, Project kits)
- **Campus Health & Medical Room** (Triage, Doctor consults)
- **Fee Payment & Accounts Counters** (Tuition receipts, Caution deposits)
- **Event & Tech-Fest Registration Desks** (Badge issuance, Kits)

### Core Architectural Principle
> **"Every person waiting for a service must be represented by a valid queue token, whether they use a smartphone or not."**

---

## 2. The 3-Way Hybrid Queue Architecture

WAITWISE eliminates the digital divide by accepting tickets through three coordinated channels into **one centralized atomic FIFO queue**:

```
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │ 1. Mobile QR Scan    │   │ 2. Entrance Kiosk    │   │ 3. Staff-Assisted    │
 │ (Smartphone camera / │   │ (Tablet at facility  │   │ (Desk operator entry │
 │  direct web link)    │   │  entrance)           │   │  for walk-ins)       │
 └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                   ┌───────────────────────────────────────┐
                   │    Single Centralized Atomic Queue    │
                   │   FIFO Sequential Sequence (MongoDB)  │
                   └───────────────────┬───────────────────┘
                                       │
                      Socket.IO Real-Time Broadcasts
                                       ▼
            ┌─────────────────────────────────────────────────────┐
            │ Live Display • Mobile Turn Alerts • Counter Portal  │
            └─────────────────────────────────────────────────────┘
```

1. **Self-Service QR / Web Portal:** Scan service entrance QR or join via web. Live real-time token tracking with turn alerts.
2. **Touch Kiosk Mode:** Touch-optimized interface on shared tablets at department entrances. Generates printable/on-screen slip with a scannable tracking QR.
3. **Staff-Assisted Concierge:** Desk operators manually issue tokens with zero contact information required for visitors without smartphones or requiring accessibility assistance.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with custom responsive layout & animations
- **Routing:** React Router v7
- **Real-Time Client:** Socket.IO Client
- **Analytics:** Chart.js & react-chartjs-2
- **Campus Geo-Map:** Leaflet.js & react-leaflet
- **QR Generation & Scanning:** `qrcode.react` & `html5-qrcode` (camera-based scanning)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js & Express.js
- **Database:** MongoDB with Mongoose ODM
- **Real-Time Engine:** Socket.IO with room subscriptions
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Security:** Helmet, CORS, Express-Rate-Limit
- **Testing:** Jest & Supertest

---

## 4. Key Engineering Highlights

### 4.1 Queue State Machine
Strict transitions enforced on the backend:
- `WAITING` ➔ `CALLED` (Staff calls next FIFO token)
- `CALLED` ➔ `SERVING` (Student arrives at counter)
- `SERVING` ➔ `COMPLETED` (Staff concludes inquiry; duration recorded)
- `WAITING` / `CALLED` ➔ `CANCELLED` (Customer or staff cancels)
- `CALLED` ➔ `SKIPPED` (With recorded mandatory reason, e.g., missing documents)
- `CALLED` ➔ `NO_SHOW` (Unattended after grace period)

### 4.2 Transparent Wait-Time Prediction Engine
WAITWISE avoids arbitrary black-box claims and calculates wait time dynamically:
$$\text{Estimated Wait} = \frac{\text{Students Ahead in Queue}}{\max(1, \text{Active Open Counters})} \times \text{Average Service Duration Today}$$
- Calibrated using historical duration metrics for the current service desk.
- Displays realistic uncertainty range (e.g., `8 - 12 mins`).
- Discloses all assumptions transparently on-screen.

### 4.3 Signature Feature: "Should I Go Now?"
An interactive decision meter helping students decide when to start walking:
- **🟢 PROCEED IMMEDIATELY:** When token is called or customer is next in line.
- **🟡 START HEADING BACK:** When estimated wait $\le$ (travel walk time + safety buffer).
- **🔵 WAIT COMFORTABLY:** When remaining wait is ample; enjoy time at the library or canteen.
- Works with live browser Geolocation (Haversine formula on campus walkways) or a simple manual walk-time slider (2, 5, 10, 15 mins).

### 4.4 Counter Overflow & Simulation Mode (Section 14)
- Automated rule-based alert triggered when queue volume exceeds the service threshold.
- Evaluator interactive simulator: test opening Counter 2 or Counter 3 and see projected wait-time drops.

---

## 5. Pre-Seeded Demo Accounts

The database comes pre-populated with realistic campus services and test credentials:

| Role | Email | Password | Access & Purpose |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@waitwise.campus` | `admin123` | Campus Crowd Dashboard, Counter Simulator, Analytics, Desk CRUD, CSV Export. |
| **👔 Staff (Admin)** | `staff.admin@waitwise.campus` | `staff123` | Assigned to **Admin Office Counter 1**. Call next, serve, skip, walk-in token issuance. |
| **👔 Staff (Exam)** | `staff.exam@waitwise.campus` | `staff123` | Assigned to **Exam Section Counter 1**. |
| **🎓 Student (Alex)** | `student@waitwise.campus` | `student123` | Holds active token **ADM-006** (waiting in queue). Test "Should I Go Now?". |
| **🎓 Student (Priya)** | `priya@waitwise.campus` | `student123` | Currently being served at Counter 1. |

*Note: You can also browse and join any queue as an **anonymous guest** without logging in!*

---

## 6. Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20+)
- [MongoDB](https://www.mongodb.com/) running locally on port 27017, or a free MongoDB Atlas connection string.

### Step 1: Clone and Install
```bash
git clone https://github.com/your-username/waitwise.git
cd WAITWISE

# Install root orchestrator dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### Step 2: Seed the Database
Populates 8 campus services, counters, staff accounts, sample tickets, and duration history:
```bash
npm run seed
```

### Step 3: Start the Application
Run both backend (port 5000) and frontend (port 5173) simultaneously:
```bash
npm start
```
- Open **http://localhost:5173** in your browser.
- Backend API & WebSockets run on **http://localhost:5000**.

---

## 7. Automated Testing

WAITWISE includes automated Jest integration tests verifying critical queue logic:
- System health checks
- Role authorization boundaries
- Atomic FIFO token generation
- Duplicate token prevention
- Kiosk & staff-assisted hybrid issuance
- Counter call-next atomic operations
- Complete ticket lifecycle
- Cancellation & position re-calculation
- Admin counter simulation

To run the test suite:
```bash
npm test
```

---

## 8. REST API Reference

### Authentication (`/api/auth`)
- `POST /register`: Register student account.
- `POST /login`: Authenticate and receive JWT.
- `GET /me`: Get authenticated user profile and active ticket.

### Services (`/api/services`)
- `GET /`: List all campus desks with live waiting counts and load levels.
- `GET /:id`: Get detailed service info, counters, and queue prediction.
- `POST /`: Create service (Admin only).
- `PATCH /:id/status`: Toggle status (`active`, `paused`, `closed`).
- `GET /:id/qr`: Get service QR payload for entrance poster.

### Queues & Tickets (`/api/queues`)
- `POST /join`: Self-service queue join (Authenticated or Guest).
- `POST /kiosk-join`: Entrance touch kiosk token generation.
- `POST /staff-issue`: Staff-assisted walk-in token generation.
- `GET /tickets/:id`: Query ticket status, people ahead, and prediction.
- `POST /tickets/:id/cancel`: Cancel an active ticket.
- `GET /services/:id/live`: Live queue sequence list for hallway screens.
- `GET /my-history`: User's ticket history.

### Staff Station (`/api/staff`)
- `GET /my-station`: Operator station, assigned counter, active queues.
- `POST /call-next`: Atomically call next FIFO waiting customer.
- `POST /start-service`: Mark ticket as `SERVING`.
- `POST /complete-service`: Conclude inquiry and record duration.
- `POST /skip`: Mark as `SKIPPED` with mandatory reason.
- `POST /no-show`: Mark as `NO_SHOW`.

### Admin & Intelligence (`/api/admin`)
- `GET /dashboard`: Campus crowd metrics and active load levels.
- `GET /analytics`: Hourly arrival trends, duration pacing, resolution breakdown.
- `POST /simulate-counter`: Run overflow simulation model.
- `GET /export-csv`: Download raw ticket log CSV.

---

## 9. Real-Time Socket.IO Architecture

| Event Name | Direction | Payload Description |
| :--- | :--- | :--- |
| `queueUpdated` | Server ➔ Service Room | Broadcasts updated waiting counts when tickets join or depart. |
| `tokenCreated` | Server ➔ Service Room | New ticket joined FIFO sequence. |
| `tokenCalled` | Server ➔ Ticket / Service | Alerts student when their turn arrives; directs to specific counter. |
| `serviceStarted` | Server ➔ Service Room | Counter status switched to serving. |
| `tokenCompleted` | Server ➔ Ticket / Service | Concludes service and frees counter. |
| `tokenSkipped` | Server ➔ Ticket / Service | Marks skip/no-show and alerts next in line. |
| `counterStatusChanged` | Server ➔ Service Room | Counter opened, closed, or placed on break. |
| `overload_alert` | Server ➔ Admin Room | Alerts administrators when queue threshold is exceeded. |

---

## 10. Live Demonstration Guide for College Project Presentation

To impress evaluators during a project defense:

1. **Two-Browser Setup:**
   - Open Browser Window 1 (Chrome): Log in as **Staff Operator** (`staff.admin@waitwise.campus`).
   - Open Browser Window 2 (Firefox / Incognito): Log in as **Student** (`student@waitwise.campus`) with ticket **ADM-006**.
2. **Observe Real-Time Synchronization:**
   - On the Staff screen, click **"CALL NEXT TOKEN"**.
   - Notice that within milliseconds, the Student screen flashes **"PROCEED TO COUNTER 1 NOW!"** without any page refresh!
3. **Showcase Hybrid Accessibility:**
   - Open `/kiosk` to show the tablet entrance mode.
   - Click **"Quick Visitor Token"** to issue a paperless slip with an instant tracking QR code.
4. **Demonstrate "Should I Go Now?":**
   - Navigate to `/should-i-go`. Adjust the walking slider or toggle live GPS to see the decision meter change between *Wait Comfortably*, *Start Moving*, and *Proceed Now*.
5. **Showcase Admin Counter Simulation:**
   - Open `/admin/simulation`. Move the slider to +2 Counters and show judges the mathematical projected wait time reduction.
6. **Showcase Campus Map:**
   - Open `/map` to view the interactive Leaflet map with campus pins and real-time crowd heat indicators.

---

## 11. Production Deployment

### Frontend (Vercel / Netlify)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_API_URL=https://your-backend.onrender.com`

### Backend (Render / Railway / Heroku)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Environment Variables:
  - `PORT=5000`
  - `NODE_ENV=production`
  - `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/waitwise`
  - `JWT_SECRET=your_production_secret`
  - `CLIENT_URL=https://your-frontend.vercel.app`

---

## 12. License & Acknowledgements

Developed as a modern Web Technologies project showcase.
Open-source under the [MIT License](LICENSE).
