#  Smart Health System — Technical Documentation

---

##  Overview

**Smart Health System** is a browser-based healthcare management platform built using front-end web technologies.  
It digitizes the **appointment booking** and **queue management** process for public clinics — ensuring efficiency, transparency, and accessibility.

This **Minimum Viable Product (MVP)** runs entirely in the browser using `localStorage` for data persistence and **JavaScript polling** to simulate real-time queue updates.

>  **Note:**  
> We couldn’t fully implement the backend due to our current academic level — we’re second-year IT students and have not yet covered APIs in class.  
> However, we believe our submission demonstrates a clear **vision, logic, and technical structure** that can scale with backend integration in future versions.Please do not see this as an excuse but see it as a potential as we didn't let our limited skillset discourage us, thank you.

---

##  Technology Stack

| Component | Technology | Description |
|------------|-------------|-------------|
| **Frontend Structure** | **HTML5** | Provides the core structure and layout of the application. |
| **Styling** | **CSS3** | Ensures a responsive, user-friendly, and mobile-adaptive design. |
| **Logic & Interactivity** | **Pure JavaScript (ES6)** | Manages booking logic, UI updates, and real-time data polling. |
| **Data Storage** | **localStorage API** | Stores all appointments, queue data, and user settings persistently in the browser. |
| **Real-time Simulation** | **JavaScript Polling + localStorage Sync** | Mimics live backend-driven updates by refreshing local data at fixed time intervals. |

###  Offline-First Design
Because it uses `localStorage` and client-side logic, **Smart Health System works fully offline**, mirroring how the real system will operate in clinics with poor or no connectivity.

---

##  Data Model (localStorage Structure)

All clinic and patient information is stored locally in the browser’s `localStorage` as JSON strings.  
The following schemas define the data model:

### 1️ Appointment Object

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


2 Queue Object
{
  "clinic": "VUT Clinic",
  "currentQueue": [
    { "id": "APT-001", "patientName": "John Doe", "status": "waiting" },
    { "id": "APT-002", "patientName": "Jane Smith", "status": "waiting" }
  ],
  "completed": [],
  "lastUpdated": "2025-10-27T10:30:00Z"
}

##  Storage Keys Used
|------------|-------------|
Key	| Purpose
appointments |	Stores all appointment objects created by patients.
queueData |	Maintains the current and completed queue per clinic.
standbyList	| Holds standby patients who opted in for early slots.
notifications	| Stores temporary messages for in-app alerts.


Real-time Updates — Polling & Standby Mechanism
Feature Summary
To simulate real-time behavior, Smart Health System uses a JavaScript polling loop that checks localStorage at a fixed interval (every 10 seconds).
This creates the illusion of “live” queue updates without requiring a backend server.
________________________________________
How It Works (Behind the Scenes)
1.	When the clinic staff updates an appointment status (e.g., marks it as completed), the localStorage queue is updated.
2.	Every 10 seconds, a JavaScript timer on the patient UI runs this logic:
3.	setInterval(() => {
4.	  checkQueueUpdates();
5.	}, 10000);
6.	The checkQueueUpdates() function reads the latest queue data:
7.	function checkQueueUpdates() {
8.	  const queue = JSON.parse(localStorage.getItem('queueData')) || {};
9.	  updateQueueUI(queue);
10.	}
11.	If a cancellation or completion is detected:
o	The next person on the standby list is automatically moved into the available slot.
o	The patient sees a message like:
“A slot has opened up — your appointment has been moved earlier.”
12.	The system updates both the queue display and appointment status instantly in the UI.
________________________________________
Instructions: How to Test the Polling/Standby Feature
Step 1: Launch the App
•	Open index.html in your browser.
•	Ensure you have both the patient view and clinic dashboard tabs open (simulate two users).
Step 2: Book a Few Appointments
•	In the patient tab, use the booking form to create 3–4 appointments.
•	Verify they appear in the clinic dashboard queue.
Step 3: Enable Standby Mode
•	While booking, toggle “Opt-in for Standby” (simulated checkbox).
•	This adds the patient to the standby/waitlist pool.
Step 4: Trigger a Cancellation
•	On the clinic dashboard, cancel or mark an appointment as completed.
•	Wait up to 10 seconds — the polling script detects the change.
Expected Outcome
The standby patient automatically moves up in the queue.
The patient view displays a live notification:
“Your appointment has been rescheduled to an earlier slot.”
Step 5: Inspect Data (Optional)
Open your browser console → Application → Local Storage → View appointments, queueData, and standbyList to see live data changes.
________________________________________
Developer Notes
•	No backend required for MVP testing — everything runs locally.
•	To reset the app, clear localStorage via browser dev tools.
•	Real-time updates are simulated through polling; in future, this will be replaced with WebSocket-based updates from the backend.
________________________________________
Future Backend Integration (Planned)
Once the FastAPI backend is deployed:
•	localStorage will be replaced by API calls to store real data in a Postgres database (via Supabase).
•	Polling will transition into real-time sync using WebSocket or server-sent events (SSE).
________________________________________
Summary
Module	Functionality
Patient UI	Booking, standby opt-in, real-time queue display
Clinic Dashboard	Queue monitoring, appointment management
localStorage Engine	Persistent data layer for both users
Polling System	Simulates live data refresh & standby notifications
Smart Health System’s localStorage-driven architecture ensures it remains functional, fast, and accessible — even in offline or low-network environments.

