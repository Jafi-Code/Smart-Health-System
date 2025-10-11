// Mock data - no API needed!
let mockBookings = JSON.parse(localStorage.getItem('smartHealthBookings')) || [
  {
    id: 1,
    name: "Lerato Mokoena",
    phone: "0712345678", 
    clinic: "Tembisa Clinic",
    date: "2025-10-12",
    slot: "09:00",
    status: "booked",
    reason: "Regular checkup"
  },
  {
    id: 2, 
    name: "John Smith",
    phone: "0723456789",
    clinic: "Vaal Clinic", 
    date: "2025-10-12",
    slot: "09:30",
    status: "checked_in",
    reason: "Follow-up visit"
  },
  {
    id: 3,
    name: "Sarah Johnson",
    phone: "0734567890",
    clinic: "Soweto Clinic",
    date: "2025-10-12", 
    slot: "10:00",
    status: "booked",
    reason: "Vaccination"
  }
];

let autoRefreshInterval;

// Save to localStorage
function saveBookings() {
  localStorage.setItem('smartHealthBookings', JSON.stringify(mockBookings));
}

// Load and display appointments
function loadAppointments(showLoading = true) {
  const table = document.getElementById("appointmentsTable");
  
  if (mockBookings.length === 0) {
    table.innerHTML = `<tr><td colspan="6">No appointments found</td></tr>`;
    resetStats();
    updateQueueOverview(null);
    return;
  }

  // Sort by slot time
  mockBookings.sort((a, b) => (a.slot > b.slot ? 1 : -1));

  let total = 0, checkedIn = 0, cancelled = 0, pending = 0;
  let nextPatient = null;

  table.innerHTML = "";

  mockBookings.forEach(booking => {
    total++;
    if (booking.status === "booked") {
      pending++;
      if (!nextPatient) nextPatient = { name: booking.name, slot: booking.slot };
    }
    if (booking.status === "checked_in") checkedIn++;
    if (booking.status === "cancelled") cancelled++;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${booking.id}</td>
      <td>${booking.name}</td>
      <td>${booking.phone}</td>
      <td>${booking.slot}</td>
      <td><span class="status ${booking.status}">${booking.status.replace("_", " ")}</span></td>
      <td>
        ${booking.status === "booked"
          ? `<button class="update" onclick="updateStatus(${booking.id}, 'checked_in')">Check-In</button>
             <button class="cancel" onclick="updateStatus(${booking.id}, 'cancelled')">Cancel</button>`
          : `<button disabled class="done">Done</button>`
        }
      </td>
    `;
    table.appendChild(tr);
  });

  updateStats(total, checkedIn, pending, cancelled);
  updateQueueOverview(nextPatient);
}

// Update appointment status
function updateStatus(id, status) {
  const confirmAction = confirm(`Are you sure you want to mark appointment #${id} as ${status}?`);
  if (!confirmAction) return;

  const booking = mockBookings.find(b => b.id === id);
  if (booking) {
    booking.status = status;
    saveBookings();
    showToast(`Status updated to ${status}`);
    loadAppointments(false);
  }
}

// Stats handling
function updateStats(total, checkedIn, pending, cancelled) {
  document.getElementById("totalAppointments").innerText = total;
  document.getElementById("checkedIn").innerText = checkedIn;
  document.getElementById("pending").innerText = pending;
  document.getElementById("cancelled").innerText = cancelled;
}

function resetStats() {
  updateStats(0, 0, 0, 0);
}

// Real-time refresh every 10 seconds
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshInterval = setInterval(() => loadAppointments(false), 10000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
}

// Toast notifications
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => toast.classList.remove("show"), 3000);
  setTimeout(() => toast.remove(), 3500);
}

// Update queue overview
function updateQueueOverview(nextPatient) {
  const nameEl = document.getElementById("nextPatient");
  const timeEl = document.getElementById("waitTime");

  if (!nextPatient) {
    nameEl.textContent = "No patients in queue";
    timeEl.textContent = "-";
    return;
  }

  nameEl.textContent = `${nextPatient.name} (${nextPatient.slot})`;
  
  // Simple waiting time calculation
  const now = new Date();
  const [hour, minute] = nextPatient.slot.split(":").map(v => parseInt(v));
  const slotTime = new Date();
  slotTime.setHours(hour);
  slotTime.setMinutes(minute);
  
  let diffMinutes = Math.max((slotTime - now) / 60000, 0);
  let displayTime = diffMinutes < 1 ? "Now" : `${Math.round(diffMinutes)} min`;
  
  timeEl.textContent = displayTime;
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  loadAppointments();
  startAutoRefresh();
  showToast("Clinic Dashboard Loaded");
});