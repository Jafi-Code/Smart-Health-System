// --- Tab Navigation ---
const tabs = document.querySelectorAll(".tab");
const buttons = document.querySelectorAll(".tab-btn");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tab;
    buttons.forEach(b => b.classList.remove("active"));
    tabs.forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(tabId).classList.add("active");
  });
});

// --- Mock Data Storage ---
let mockBookings = JSON.parse(localStorage.getItem('smartHealthBookings')) || [
  {
    id: 1,
    name: "Lerato Mokoena",
    phone: "0712345678",
    clinic: "Tembisa Clinic",
    date: "2025-10-12",
    slot: "09:00",
    reason: "Regular checkup",
    status: "booked",
    created_at: new Date().toISOString()
  }
];

// --- Save to Local Storage ---
function saveBookings() {
  localStorage.setItem('smartHealthBookings', JSON.stringify(mockBookings));
}

// --- Booking Logic ---
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const payload = {
    id: mockBookings.length + 1,
    name: document.getElementById("name").value,
    phone: document.getElementById("phone").value,
    clinic: document.getElementById("clinic").value,
    date: document.getElementById("date").value,
    slot: document.getElementById("slot").value,
    reason: document.getElementById("reason").value,
    standby: document.getElementById("standby").checked,
    grace: document.getElementById("grace").checked,
    status: "booked",
    created_at: new Date().toISOString()
  };

  // Add to mock database
  mockBookings.push(payload);
  saveBookings();

  alert(`✅ Appointment booked successfully for ${payload.date} at ${payload.slot}!`);
  addNotification("Appointment booked successfully!");
  document.getElementById("bookingForm").reset();
});

// --- Check Booking Status ---
document.getElementById("viewStatusBtn").addEventListener("click", () => {
  const phone = document.getElementById("statusPhone").value;
  if (!phone) {
    alert("Please enter your phone number.");
    return;
  }

  const userBookings = mockBookings.filter(booking => booking.phone === phone);
  const results = document.getElementById("statusResults");
  
  if (userBookings.length === 0) {
    results.innerHTML = `<p>No appointments found for phone: ${phone}</p>`;
    return;
  }

  let html = '<h3>Your Appointments:</h3>';
  userBookings.forEach(booking => {
    const statusColor = booking.status === 'booked' ? 'orange' : 
                       booking.status === 'checked_in' ? 'green' : 'red';
    
    html += `
      <div class="booking-card">
        <p><strong>${booking.name}</strong></p>
        <p>Date: ${booking.date} at ${booking.slot}</p>
        <p>Clinic: ${booking.clinic}</p>
        <p>Status: <span style="color: ${statusColor}; font-weight: bold;">${booking.status}</span></p>
        ${booking.status === 'booked' ? `<button onclick="cancelBooking(${booking.id})">Cancel Appointment</button>` : ''}
      </div>
    `;
  });
  
  results.innerHTML = html;
});

// --- Cancel Booking ---
function cancelBooking(id) {
  const booking = mockBookings.find(b => b.id === id);
  if (booking && confirm(`Cancel appointment for ${booking.name} on ${booking.date}?`)) {
    booking.status = 'cancelled';
    saveBookings();
    alert("Appointment cancelled successfully!");
    addNotification("Appointment cancelled.");
    document.getElementById("viewStatusBtn").click(); // Refresh view
  }
}

// --- Notifications ---
const notificationsList = document.getElementById("notificationsList");
const refreshBtn = document.getElementById("refreshNotifs");

function addNotification(msg) {
  const time = new Date().toLocaleTimeString();
  const note = document.createElement("div");
  note.innerHTML = `🔔 ${msg} <small>(${time})</small>`;
  note.classList.add("notif-item");
  notificationsList.prepend(note);
}

refreshBtn.addEventListener("click", () => {
  addNotification("System refresh completed.");
  addNotification("No new slot availability updates.");
});

// Add some sample notifications on load
addNotification("Welcome to SmartHealthSystem!");
addNotification("System is running in demo mode.");