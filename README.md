# WAITWISE: Universal Smart Queue & Crowd Management Platform

> *"One Platform. Every Queue. Zero Unnecessary Waiting."*

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Executive Summary & Universal Vision

**WAITWISE** is a modern, enterprise-grade, multi-tenant virtual queue orchestration and crowd intelligence platform. Built entirely with **Angular 18** and **Node.js / Express / MongoDB / Socket.IO**, WAITWISE eliminates chaotic physical waiting lines across any organization, institution, or business experiencing crowd pressure:

- 🏥 **Healthcare & Hospitals:** Outpatient clinics, diagnostic laboratories, triage, pharmacies, consultation rooms.
- 🏦 **Banking & Finance:** Teller cash desks, loan approvals, foreign exchange, priority customer desks.
- 🏛️ **Government & Public Services:** Passport service centers, regional transport offices (RTO), civic municipal desks.
- 🎓 **Education & Campuses:** Registrar offices, fee counters, exam halls, campus library, student services.
- 🛍️ **Retail & Commercial:** Electronics customer support, returns & order pick-up counters, service hubs.
- 🏨 **Hospitality & Transportation:** Railway ticket booking counters, airport check-in desks, hotel receptions.

### Core Architectural Principle
> **"Every person waiting for a service must be represented by a valid queue token, whether they use a smartphone, an entrance kiosk, or receive staff assistance."**

---

## 2. Universal Multi-Tenant Architecture

WAITWISE operates on a true multi-tenant structure where each organization maintains an isolated workspace with custom branding, operating hours, branches, services, and dynamic terminology dictionaries:

```
Platform Super Admin Console
│
├── Metro Health General Hospital (/org/metro-health)
│   ├── Main Hospital Center
│   │   ├── General OPD & Triage (Prefix: DOC)  ── Counter 1 (Dr. Sarah)
│   │   ├── Diagnostic Pathology (Prefix: LAB)  ── Counter 1 (Lab Desk)
│   │   └── Radiology / X-Ray    (Prefix: RAD)  ── Counter 1 (Imaging 1)
│
├── Horizon Trust Bank (/org/horizon-bank)
│   ├── Downtown Financial Branch
│   │   ├── Cash Deposit / Withdrawal (Prefix: CS) ── Window 1 & 2
│   │   └── Loan & Advisory Desk      (Prefix: LN) ── Window 3
│
├── State Citizen Services Center (/org/citizen-services)
│   ├── Central Civic Complex
│   │   ├── Passport Application (Prefix: PASS) ── Counter 1 (Officer Priya)
│   │   └── Driving License Desk (Prefix: RTO)  ── Counter 2
│
└── Central University Campus (/org/central-univ)
    ├── Main Administrative Block
        ├── Student Administration (Prefix: ADM) ── Window 1
        └── Fee Payment Counter    (Prefix: FEE) ── Window 2
```

### Dynamic Terminology Dictionary
No organization is hardcoded. Terminology dynamically adapts across the frontend and notification channels based on the active organization profile:

| Industry Preset | Service Label | Token Label | Counter Label | Staff Label | Visitor Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Healthcare** | Specialty / Clinic | Patient Token | Consultation Room | Doctor / Nurse | Patient |
| **Banking** | Counter Service | Queue Token | Teller Window | Bank Teller | Customer |
| **Government** | Citizen Counter | Application Token | Officer Desk | Service Officer | Citizen / Applicant |
| **Education** | Campus Service | Student Token | Service Desk | Staff Operator | Student / Faculty |
| **Retail** | Service Desk | Order Token | Pick-up Counter | Store Associate | Customer |

---

## 3. The 3-Way Hybrid Queue Architecture

WAITWISE bridges the digital divide through three inclusive ticket issuance channels synchronized into **one atomic FIFO engine**:

```
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │ 1. Mobile QR Scan    │   │ 2. Touch Kiosk       │   │ 3. Assisted Walk-In  │
 │ (Zero-app mobile browser│ │ (Standalone entrance │ │ (Staff operator      │
 │  self-service pass)  │   │  tablet receipt pass)│ │  issuance for elder) │
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
                  Socket.IO Real-Time Bidirectional Sync
```

1. **Mobile QR Self-Join:** Visitors scan department entrance posters. Instantly receives a live browser pass with countdown timer and audio chime.
2. **Touch Kiosk Mode (`/kiosk`):** Standalone fullscreen tablet UI for reception entrances. Features high-contrast touch cards, 1-touch visitor generation, and printable token slips.
3. **Staff Assisted Walk-In:** Counter operators issue tokens directly for elderly visitors, non-smartphone users, and emergency patients with priority escalation flags.

---

## 4. Key Platform Features

### 🧭 "Should I Go Now?" Advisor
Eliminates crowded waiting rooms by factoring in real-world walking time.
- Uses **Geolocation API** and **Haversine formula** to measure exact distance in meters from the user's current GPS position to the service counter.
- Dynamically computes walking time ($v \approx 80\text{ m/min}$) plus safety buffer.
- Computes:
  $$\text{Departure Urgency} = (\text{People Ahead} \times \text{Avg Service Duration}) - (\text{Walk Time} + \text{Buffer})$$
- Provides color-coded decision:
  - 🟢 **GO NOW!** Head to the counter immediately.
  - 🟡 **PREPARE TO MOVE:** Wrap up your current activity.
  - 🔵 **RELAX:** You have plenty of time.

### ⚡ Counter Overflow Simulator
Interactive queueing theory simulation using $W_q$ model:
$$W_q = \frac{\lambda}{\mu(c\mu - \lambda)}$$
Allows administrators to adjust arrival rates ($\lambda$), average service durations ($\mu$), and active counters ($c$) to immediately visualize percentage wait-time reduction upon opening additional counters.

### 🔔 Web Audio API Zero-Dependency Chime
Integrated dual-tone browser synthesizer (587 Hz $\rightarrow$ 880 Hz) alerts visitors and staff when tokens are called, eliminating missed turns without needing external media files.

### 🗺️ Interactive Facility Map
Leaflet.js mapping with color-coded live queue density pins:
- 🟢 **Low Load** ($< 3$ waiting)
- 🟡 **Moderate Load** ($3 - 7$ waiting)
- 🔴 **High Pressure** ($> 7$ waiting)

---

## 5. Technology Stack

### Frontend (Angular 18 Standalone Architecture)
- **Framework:** Angular 18 (Standalone Components, Signals, RxJS, Reactive Forms)
- **Styling:** Tailwind CSS with custom branding and dark-mode support
- **Real-Time:** Socket.IO Client
- **Charts:** Chart.js & ng2-charts
- **Mapping:** Leaflet.js
- **QR Engine:** `qrcode` & `html5-qrcode`
- **Audio:** HTML5 Web Audio API synthesizer

### Backend (Node.js & Express)
- **Runtime:** Node.js (ES Modules)
- **Web Framework:** Express.js
- **Database:** MongoDB & Mongoose ODM
- **Real-Time Engine:** Socket.IO Server (Rooms: `join_service`, `join_ticket`, `join_org`)
- **Security:** JWT Authentication, bcrypt password hashing, Tenant Isolation Middleware (`requireTenant`), role-based authorization

---

## 6. Pre-Seeded Demo Accounts

Run `npm --prefix backend run seed` to initialize 4 multi-industry workspaces with pre-configured accounts:

| Role | Email | Password | Industry Focus |
| :--- | :--- | :--- | :--- |
| **🛡️ Super Admin** | `superadmin@waitwise.io` | `admin123` | Platform Overview & Multi-Tenancy |
| **🏥 Doctor** | `doctor@metrohealth.org` | `staff123` | General OPD & Consultation |
| **🏦 Bank Teller** | `teller@horizonbank.com` | `staff123` | Cash Deposit & Teller Desk |
| **🏛️ Passport Clerk** | `clerk@citizenservices.gov` | `staff123` | Passport Renewal & Bio Verification |
| **🎓 University Staff** | `staff.admin@waitwise.campus` | `staff123` | Campus Registrar Office |
| **👤 Visitor / Student** | `student@waitwise.campus` | `student123` | Active Ticket Tracker |

*Tip: You can also use the **1-Click Demo Login** buttons on the `/login` screen for instant access!*

---

## 7. Quick Start & Installation

### Prerequisites
- Node.js v18+ (Node v20+ recommended)
- Local MongoDB running on `127.0.0.1:27017` (or MongoDB Atlas URI in `backend/.env`)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/WAITWISE.git
cd WAITWISE

# Install backend dependencies
cd backend && npm install

# Install Angular frontend dependencies
cd ../frontend && npm install
cd ..
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run Backend Integration Tests
```bash
npm test
```
*Executes all 11 Jest test suites verifying multi-tenant isolation, duplicate token prevention, FIFO sequencing, and service transitions.*

### 4. Start Full-Stack Application
```bash
npm start
```
- **Angular Frontend:** `http://localhost:4200`
- **Backend API & WebSockets:** `http://localhost:5000`

---

## 8. License & Credits

Built with pride as a universal next-generation queue management platform. Distributed under the MIT License.
