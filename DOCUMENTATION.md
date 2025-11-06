#  Smart Health System — Technical Documentation

---

##  Overview

**Smart Health System** is a browser-based healthcare management platform built using front-end web technologies.  
It digitizes the appointment booking and queue management process for public clinics — ensuring efficiency, transparency, and accessibility.

This **Minimum Viable Product (MVP)** runs entirely in the browser using `localStorage` for data persistence and **JavaScript polling** to simulate real-time queue updates.

> **Note:**  
> We couldn’t fully implement the backend due to our current academic level — we’re second-year IT students and have not yet covered APIs in class.  
> However, we believe our submission demonstrates a clear vision, logic, and technical structure that can scale with backend integration in future versions.  
> Please do not see this as an excuse but as potential — we didn’t let our limited skillset discourage us. Thank you.

---

##  Technology Stack

| Component | Technology | Description |
|------------|-------------|-------------|
| Frontend Structure | **HTML5** | Provides the core structure and layout of the application. |
| Styling | **CSS3** | Ensures a responsive, user-friendly, and mobile-adaptive design. |
| Logic & Interactivity | **Pure JavaScript (ES6)** | Manages booking logic, UI updates, and real-time data polling. |
| Data Storage | **localStorage API** | Stores all appointments, queue data, and user settings persistently in the browser. |
| Real-time Simulation | **JavaScript Polling + localStorage Sync** | Mimics live backend-driven updates by refreshing local data at fixed time intervals. |

---

###  Offline-First Design

Because it uses `localStorage` and client-side logic, **Smart Health System works fully offline**, mirroring how the real system will operate in clinics with poor or no connectivity.

---

##  Data Model (localStorage Structure)

All clinic and patient information is stored locally in the browser’s `localStorage` as JSON strings.  
The following schemas define the data model:

---

###  Appointment Object

```json
{
  "id": "APT-001",
  "patientName": "John Doe",
  "contact": "0712345678",
  "clinic": "VUT Clinic",
  "slot": "2025-10-28 09:30",
  "status": "booked",
  "standbyOptIn": true,
  "notified": false,
  "timestamp": "2025-10-27T10:15:00Z"
}
 Queue Object
{
  "clinic": "VUT Clinic",
  "currentQueue": [
    { "id": "APT-001", "patientName": "John Doe", "status": "waiting" },
    { "id": "APT-002", "patientName": "Jane Smith", "status": "waiting" }
  ],
  "completed": [],
  "lastUpdated": "2025-10-27T10:30:00Z"
}
 Storage Keys Used
Key	Purpose
appointments	Stores all appointment objects created by patients.
queueData	Maintains the current and completed queue per clinic.
standbyList	Holds standby patients who opted in for early slots.
notifications	Stores temporary messages for in-app alerts.

 Real-time Updates — Polling & Standby Mechanism
 Feature Summary
To simulate real-time behavior, Smart Health System uses a JavaScript polling loop that checks localStorage at a fixed interval (every 10 seconds).
This creates the illusion of “live” queue updates without requiring a backend server.

 How It Works (Behind the Scenes)
When the clinic staff updates an appointment status (e.g., marks it as completed), the localStorage queue is updated.

Every 10 seconds, a JavaScript timer on the patient UI runs this logic:


setInterval(() => {
  checkQueueUpdates();
}, 10000);
The checkQueueUpdates() function reads the latest queue data:


function checkQueueUpdates() {
  const queue = JSON.parse(localStorage.getItem('queueData')) || {};
  updateQueueUI(queue);
}
If a cancellation or completion is detected:

The next person on the standby list is automatically moved into the available slot.

The patient sees a message like:

“A slot has opened up — your appointment has been moved earlier.”

The system updates both the queue display and appointment status instantly in the UI.

 Instructions: How to Test the Polling/Standby Feature
Step 1: Launch the App
Open index.html in your browser.

Ensure you have both the patient view and clinic dashboard tabs open (to simulate two users).

Step 2: Book a Few Appointments
In the patient tab, use the booking form to create 3–4 appointments.

# Smart Health System — Technical Documentation

## Overview

Smart Health System is a browser-based healthcare management platform built with standard web technologies. It focuses on appointment booking and queue management for clinics. This Minimum Viable Product (MVP) runs entirely in the browser using `localStorage` for persistence and JavaScript polling to simulate near-real-time updates.

> Note: This repository started as a browser-only MVP. A FastAPI prototype exists for experimentation, but the core app works offline using `localStorage`.

## Technology Stack

| Component | Technology | Notes |
|---|---|---|
| Frontend structure | HTML5 | App structure and pages (patient + clinic dashboard) |
| Styling | CSS3 | Responsive styles for desktop and mobile |
| Logic & interactivity | JavaScript (ES6) | Booking logic, UI updates, polling and localStorage sync |
| Data storage | localStorage API | Client-side persistence for appointments, queue state, and notifications |
| Real-time simulation | Polling (setInterval) | Periodic checks of localStorage to simulate live updates |

### Offline-first design

Because the app uses `localStorage` and client-side logic, Smart Health System works fully offline. In low- or no-network environments the patient and clinic flows remain functional.

## Data model (localStorage)

All persistent data is stored as JSON in `localStorage`. The key names used by the app are described below.

### Appointment object

```json
{
  "id": "APT-001",
  "patientName": "John Doe",
  "contact": "0712345678",
  "clinic": "VUT Clinic",
  "slot": "2025-10-28 09:30",
  "status": "booked",
  "standbyOptIn": true,
  "notified": false,
  "timestamp": "2025-10-27T10:15:00Z"
}
```

### Queue object

```json
{
  "clinic": "VUT Clinic",
  "currentQueue": [
    {
      "id": "APT-001",
      "patientName": "John Doe",
      "status": "waiting"
    },
    {
      "id": "APT-002",
      "patientName": "Jane Smith",
      "status": "waiting"
    }
  ],
  "completed": [],
  "lastUpdated": "2025-10-27T10:30:00Z"
}
```

## Storage keys

| Key | Purpose |
|---|---|
| `appointments` | Stores an array of appointment objects |
| `queueData` | Contains per-clinic queue state (`currentQueue`, `completed`, `lastUpdated`) |
| `standbyList` | Holds patients who opted into standby/waitlist |
| `notifications` | Temporary in-app alert messages |

## Real-time updates (polling & standby)

The app uses polling to simulate real-time updates. The patient UI runs a timer that checks `localStorage` at a fixed interval (default ~10s). When clinic staff changes an appointment, the polling detects the change and updates the UI.

How it works (simplified):

1. Clinic staff updates an appointment status (e.g., `completed` or `canceled`) using the clinic dashboard.
2. The clinic dashboard updates `queueData` and `appointments` in `localStorage`.
3. Patient views execute `setInterval(() => checkQueueUpdates(), 10000)`.
4. `checkQueueUpdates()` reads `queueData` from `localStorage` and updates the UI accordingly.
5. If a cancellation frees a slot and a standby patient exists, the app moves the first standby patient into the open slot and updates their appointment record.

Example (pseudo-code):

```js
setInterval(() => {
  const queue = JSON.parse(localStorage.getItem('queueData')) || {};
  updateQueueUI(queue);
}, 10000);
```

## Testing the polling/standby feature (manual)

1. Open `index.html` in your browser. Open two tabs to simulate a patient and clinic staff.
2. In the patient tab, create several appointments using the booking form.
3. In the clinic tab, mark an appointment as `completed` or `canceled`.
4. Wait up to the polling interval (default 10s) — the patient tab should detect the change and update.
5. If standby is enabled for a patient, they should be moved into the open slot automatically.

## Developer notes

- No backend is required to run the MVP — everything runs locally.
- To reset the app during development, clear `localStorage` in the browser dev tools.
- The current polling mechanism is a pragmatic choice for the MVP; a future production version should use WebSockets or server-sent events for real-time sync.

## Future backend integration

Planned improvements when adding a backend (e.g., FastAPI, Netlify Functions + Supabase):

- Replace `localStorage` writes/reads with API calls to persist data server-side (Postgres via Supabase).
- Migrate polling to real-time protocols (WebSocket/SSE) or server push notifications.

## Summary (module responsibilities)

| Module | Functionality |
|---|---|
| Patient UI | Booking, standby opt-in, real-time queue display |
| Clinic Dashboard | Queue monitoring, appointment management (check-in/start/complete/cancel) |
| localStorage Engine | Client-side persistent data layer |
| Polling System | Simulated live refresh & standby notifications |









