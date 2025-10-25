// /assets/js/patient-app.js

// --- Globals and DOM Elements ---
const tabs = document.querySelectorAll(".tab");
const tabButtons = document.querySelectorAll(".tab-btn");
const quickButtons = document.querySelectorAll(".quick-btn");
const spinner = document.getElementById("loading-spinner");

// NEW: Elements for Slot Suggestion
const bookingForm = document.getElementById("bookingForm");
const suggestedSlotArea = document.getElementById("suggestedSlotArea");
const suggestedClinicDisplay = document.getElementById("suggestedClinicDisplay");
const suggestedDateDisplay = document.getElementById("suggestedDateDisplay");
const suggestedTimeDisplay = document.getElementById("suggestedTimeDisplay");
const acceptSlotBtn = document.getElementById("acceptSlotBtn");
const denySlotBtn = document.getElementById("denySlotBtn");

let currentSuggestedSlot = null; // Stores the slot found by the system

// --- Slot Time Definitions (Available times for any clinic) ---
const availableSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00"
];

// --- Spinner Helpers ---
function showSpinner() {
    if (spinner) {
        spinner.classList.remove("hidden");
    }
}
function hideSpinner() {
    if (spinner) {
        spinner.classList.add("hidden");
    }
}

// --- Tab Navigation ---
// Function to switch tabs
function switchTab(tabId) {
    // Update button states
    tabButtons.forEach(b => {
        b.classList.remove("active");
        if (b.dataset.tab === tabId) {
            b.classList.add("active");
        }
    });
    
    // Update tab visibility
    tabs.forEach(t => t.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
}

// Handle tab button clicks
tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
    });
});

// Handle quick action button clicks
quickButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab);
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

// --- NEW HELPER FUNCTION: Check for existing booking (Double Booking) ---
function isDoubleBooking(newBooking) {
    // 1. Filter out already cancelled appointments
    const activeBookings = mockBookings.filter(b => b.status !== 'cancelled');

    // 2. Check if any active booking matches the patient (phone), date, and clinic
    return activeBookings.some(booking => 
        booking.phone === newBooking.phone && 
        booking.date === newBooking.date && 
        booking.clinic === newBooking.clinic
    );
}

// --- NEW HELPER FUNCTION: Find the next available slot ---
function findAvailableSlot(clinic, date) {
    // 1. Get all active bookings for the requested clinic and date
    const bookedSlots = mockBookings
        .filter(b => b.clinic === clinic && b.date === date && b.status !== 'cancelled')
        .map(b => b.slot);

    // 2. Find the first available slot in our defined schedule
    const availableSlot = availableSlots.find(slot => !bookedSlots.includes(slot));

    return availableSlot; // Returns "08:00", "08:30", etc., or undefined if fully booked
}


// --- Booking Logic (UPDATED: Step 1 - Find Slot) ---
bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Collect preliminary data from the form
    const preliminaryData = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        clinic: document.getElementById("clinic").value,
        date: document.getElementById("date").value,
        reason: document.getElementById("reason").value,
        standby: document.getElementById("standby").checked,
        grace: document.getElementById("grace").checked,
    };
    
    // Hide the suggestion area and clear any prior suggested slot
    suggestedSlotArea.classList.add("hidden");
    currentSuggestedSlot = null; 

    showSpinner(); 

    // Simulate network delay (1.5 seconds)
    setTimeout(() => {
        
        // Check 1: Prevent double booking (same person, same clinic, same day)
        if (isDoubleBooking(preliminaryData)) {
            hideSpinner();
            alert("🛑 Booking Failed: You already have an active appointment scheduled for this clinic on this date.");
            return;
        }

        // Check 2: Find the next available time slot
        const availableTime = findAvailableSlot(preliminaryData.clinic, preliminaryData.date);

        if (availableTime) {
            // SUCCESS: Found a slot
            currentSuggestedSlot = { ...preliminaryData, slot: availableTime };

            // Update the display area
            suggestedClinicDisplay.textContent = preliminaryData.clinic;
            suggestedDateDisplay.textContent = preliminaryData.date;
            suggestedTimeDisplay.textContent = availableTime;
            
            // Show the suggestion area and hide the form submission button
            suggestedSlotArea.classList.remove("hidden");
            document.getElementById("findSlotBtn").classList.add("hidden");
            
            alert(`💡 We found an available slot! Please Accept or Deny the suggestion.`);

        } else {
            // FAILURE: Fully booked
            alert(`😞 Sorry, the ${preliminaryData.clinic} is fully booked on ${preliminaryData.date}. Please try a different date or clinic.`);
        }

        hideSpinner();

    }, 1500);
});


// --- Booking Logic (UPDATED: Step 2 - Accept/Deny Slot) ---

// Handle ACCEPT button click
acceptSlotBtn.addEventListener('click', () => {
    if (!currentSuggestedSlot) {
        alert("Error: No slot was suggested. Please try finding a slot again.");
        return;
    }

    // This is the final booking action
    const payload = {
        id: mockBookings.length + 1,
        ...currentSuggestedSlot, 
        status: "booked",
        created_at: new Date().toISOString()
    };

    // Save the booking
    mockBookings.push(payload);
    saveBookings();

    // Reset the UI
    alert(`✅ Appointment booked successfully for ${payload.date} at ${payload.slot}!`);
    addNotification("Appointment booked successfully!");
    bookingForm.reset();
    suggestedSlotArea.classList.add("hidden");
    document.getElementById("findSlotBtn").classList.remove("hidden");
    currentSuggestedSlot = null;
});

// Handle DENY button click (WIP: For now, we'll just alert and reset)
denySlotBtn.addEventListener('click', () => {
    alert("You denied the suggested slot. In a future version, we would suggest alternative dates. For now, please select a new date and try again.");
    
    // Reset the UI to allow a new search
    suggestedSlotArea.classList.add("hidden");
    document.getElementById("findSlotBtn").classList.remove("hidden");
    currentSuggestedSlot = null;
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

// /assets/js/patient-app.js

// --- Cancel Booking (UPDATED for Dynamic Waitlist) ---
function cancelBooking(id) {
    const bookingToCancel = mockBookings.find(b => b.id === id);

    if (bookingToCancel && bookingToCancel.status === 'checked_in') {
        alert("Cannot cancel an appointment that has already been checked in.");
        return;
    }

    if (bookingToCancel && confirm(`Cancel appointment for ${bookingToCancel.name} on ${bookingToCancel.date} at ${bookingToCancel.slot}?`)) {
        
        // 1. Mark the current appointment as cancelled
        bookingToCancel.status = 'cancelled';
        saveBookings();
        addNotification(`Appointment ID ${id} cancelled.`);

        // 2. Identify the now-available slot
        const availableSlot = {
            clinic: bookingToCancel.clinic,
            date: bookingToCancel.date,
            slot: bookingToCancel.slot,
        };

        // 3. Find the next eligible standby patient
        // We look for the OLDEST booking (lowest ID/first in line) that is:
        // a) For the same clinic and date
        // b) Has status 'booked' (i.e., hasn't been cancelled or checked in)
        // c) Has opted into 'standby'
        const nextStandbyPatient = mockBookings
            .filter(b => 
                b.clinic === availableSlot.clinic &&
                b.date === availableSlot.date &&
                b.status === 'booked' &&
                b.standby === true
            )
            .sort((a, b) => a.id - b.id) // Sort by ID to get the oldest booking first
            .shift(); // Get and remove the first item (the highest priority standby)

        
        // 4. Assign the slot to the standby patient
        if (nextStandbyPatient) {
            
            // Move the standby patient to the new slot
            nextStandbyPatient.slot = availableSlot.slot; 
            nextStandbyPatient.standby = false; // Turn off standby now that they have a priority slot

            // Save the updated patient data
            saveBookings(); 

            // Notify the standby patient (important for the demo!)
            addNotification(`🎉 Standby Alert! Your appointment at ${nextStandbyPatient.clinic} on ${nextStandbyPatient.date} has been moved to an earlier slot: **${availableSlot.slot}**!`);
            
            alert(`✅ Slot filled! Standby patient ${nextStandbyPatient.name} was moved to ${availableSlot.slot}.`);
        } else {
            alert("No eligible standby patients found for this slot.");
        }
        
        document.getElementById("viewStatusBtn").click(); // Refresh the view immediately
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

// --- Service Worker Registration (for Offline Mode) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') 
            .then(registration => {
                console.log('SW Registered. Scope: ', registration.scope);
            })
            .catch(err => {
                console.error('SW Registration Failed: ', err);
            });
    });
}