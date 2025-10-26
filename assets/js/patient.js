// /assets/js/patient.js

// --- 0. Mock User Data Storage ---
let mockUsers = JSON.parse(localStorage.getItem('smartHealthUsers')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function saveUsers() {
    localStorage.setItem('smartHealthUsers', JSON.stringify(mockUsers));
}

function saveCurrentUser(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

// --- Mock Booking Data Storage ---
let mockBookings = JSON.parse(localStorage.getItem('smartHealthBookings')) || [
    // Initial mock data if storage is empty
    { id: 1, name: "Mock Patient 1", phone: "0712345678", clinic: "Tembisa Clinic", date: "2025-10-27", slot: "09:00", reason: "Fever", standby: false, grace: true, status: "booked" }
];
let lastBookingId = mockBookings.length > 0 ? Math.max(...mockBookings.map(b => b.id)) : 0;

function saveBookings() {
    localStorage.setItem('smartHealthBookings', JSON.stringify(mockBookings));
    // When patient app updates bookings, it should also refresh status
    document.getElementById("viewStatusBtn")?.click();
    renderQueueStatus(); // Refresh queue view too
}


// --- Globals and DOM Elements ---
const tabs = document.querySelectorAll(".tab");
const tabButtons = document.querySelectorAll(".tab-btn");
const quickButtons = document.querySelectorAll(".quick-btn");
const spinner = document.getElementById("loading-spinner");
const bookingForm = document.getElementById("bookingForm");
const suggestedSlotArea = document.getElementById("suggestedSlotArea");
const suggestedClinicDisplay = document.getElementById("suggestedClinicDisplay");
const suggestedDateDisplay = document.getElementById("suggestedDateDisplay");
const suggestedTimeDisplay = document.getElementById("suggestedTimeDisplay");
const acceptSlotBtn = document.getElementById("acceptSlotBtn");
const denySlotBtn = document.getElementById("denySlotBtn");
const refreshNotifs = document.getElementById("refreshNotifs");

// AUTH ELEMENTS
const authScreen = document.getElementById("authScreen");
const appContent = document.getElementById("app-content");
const loginForm = document.getElementById("loginForm");
const authTitle = document.getElementById("authTitle");
const authNameInput = document.getElementById("authName");
const authPhoneInput = document.getElementById("authPhone");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const logoutBtn = document.getElementById("logoutBtn");
const currentUserNameDisplay = document.getElementById("currentUserName");
let isRegisterMode = false;

// NEW QUEUE ELEMENTS
const queueStatusDisplay = document.getElementById("queueStatusDisplay");
const refreshQueueBtn = document.getElementById("refreshQueueBtn");

let currentSuggestedSlot = null;


// --- UI Helpers ---

function showSpinner() {
    spinner.classList.remove("hidden");
}

function hideSpinner() {
    spinner.classList.add("hidden");
}

function toggleAuthMode(toRegister) {
    isRegisterMode = toRegister;
    authTitle.textContent = toRegister ? "Register" : "Login";
    authSubmitBtn.textContent = toRegister ? "Register" : "Login";
    authNameInput.required = toRegister;
    authNameInput.style.display = toRegister ? 'block' : 'none';
    authNameInput.previousElementSibling.style.display = toRegister ? 'block' : 'none'; 
    
    document.getElementById("toggleAuth").innerHTML = toRegister
        ? 'Already have an account? <a href="#" id="toggleLogin">Login here</a>'
        : 'New user? <a href="#" id="toggleRegister">Register here</a>';
    
    document.getElementById("toggleRegister")?.addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(true); });
    document.getElementById("toggleLogin")?.addEventListener('click', (e) => { e.preventDefault(); toggleAuthMode(false); });
}

function switchTab(tabId) {
    tabs.forEach(tab => {
        tab.classList.remove("active");
    });
    tabButtons.forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById(tabId).classList.add("active");
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add("active");

    if (tabId === 'appointmentsTab') {
        document.getElementById("viewStatusBtn").click(); // Refresh user's appointments
    } else if (tabId === 'queueTab') {
        renderQueueStatus(); // Render queue status
    } else if (tabId === 'notificationsTab') {
        refreshNotifications(); // Refresh notifications
    }
}


function renderApp() {
    if (currentUser) {
        authScreen.classList.add("hidden");
        appContent.classList.remove("hidden");
        currentUserNameDisplay.textContent = currentUser.name;
        // Start on Home tab
        switchTab('homeTab'); 
    } else {
        authScreen.classList.remove("hidden");
        appContent.classList.add("hidden");
        currentUserNameDisplay.textContent = "Guest";
        toggleAuthMode(false);
    }
}


// --- Core Scheduling Logic ---

function findAvailableSlot(clinic, date) {
    // Generate potential slots (simple mock: every 30 mins from 9am to 4:30pm)
    const mockSlots = [];
    for (let hour = 9; hour < 17; hour++) {
        mockSlots.push(`${String(hour).padStart(2, '0')}:00`);
        if (hour < 16) { // Don't add 30 min slot after 16:30
            mockSlots.push(`${String(hour).padStart(2, '0')}:30`);
        }
    }

    // Filter slots based on existing bookings for that clinic and date
    for (const slot of mockSlots) {
        const bookingsInSlot = mockBookings.filter(b => 
            b.clinic === clinic && 
            b.date === date && 
            b.slot === slot && 
            b.status !== 'cancelled' // Don't count cancelled bookings
        ).length;

        // Mock limit: only 1 booking per 30-min slot
        if (bookingsInSlot === 0) {
            return slot; // Return the first available slot
        }
    }
    return null; // Fully booked
}

function isDoubleBooking(data) {
    // Check if the user already has an active booking for the same clinic and date
    return mockBookings.some(b => 
        b.phone === data.phone && 
        b.clinic === data.clinic && 
        b.date === data.date && 
        b.status !== 'cancelled' && 
        b.status !== 'completed'
    );
}

function cancelBooking(id) {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
        return;
    }

    const booking = mockBookings.find(b => b.id === id);
    if (booking) {
        booking.status = 'cancelled';
        saveBookings();
        
        // Notify the user
        let notifications = JSON.parse(localStorage.getItem('smartHealthNotifs')) || [];
        notifications.push({
            id: Date.now(),
            title: "Appointment Cancelled",
            message: `Your appointment for ${booking.clinic} on ${booking.date} at ${booking.slot} has been successfully cancelled.`,
            read: false,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('smartHealthNotifs', JSON.stringify(notifications));

        alert("Appointment cancelled successfully.");
    }
    document.getElementById("viewStatusBtn").click(); // Refresh the list
}


// --- Queue Status Rendering ---
function renderQueueStatus() {
    if (!currentUser) {
        queueStatusDisplay.innerHTML = `<p>Please log in to view your queue status.</p>`;
        return;
    }

    const userActiveBooking = mockBookings.find(b => 
        b.phone === currentUser.phone && 
        b.status !== 'cancelled' && 
        b.status !== 'completed' &&
        b.status !== 'no_show'
    );

    if (!userActiveBooking) {
        queueStatusDisplay.innerHTML = `<p>You have no active appointments in a queue.</p>`;
        return;
    }

    // Get all active patients for the same clinic and date
    const clinicQueue = mockBookings
        .filter(b => 
            b.clinic === userActiveBooking.clinic && 
            b.date === userActiveBooking.date && 
            b.status !== 'cancelled' && 
            b.status !== 'completed' &&
            b.status !== 'no_show'
        )
        .sort((a, b) => new Date(`1970/01/01 ${a.slot}`) - new Date(`1970/01/01 ${b.slot}`)); // Sort by time slot

    // Find the user's position in this sorted queue
    const userPosition = clinicQueue.findIndex(b => b.id === userActiveBooking.id) + 1;

    // Calculate estimated wait time (simple mock: 10 mins per patient ahead)
    const patientsAhead = userPosition - 1;
    const estimatedWaitMinutes = patientsAhead * 10; 

    let statusText = '';
    if (userActiveBooking.status === 'booked') {
        statusText = 'You are currently **waiting to be checked in**.';
    } else if (userActiveBooking.status === 'checked_in') {
        statusText = 'You have **checked in** and are waiting to see a doctor.';
    } else if (userActiveBooking.status === 'in_consult') {
        statusText = 'You are currently **in consultation**.';
    }


    queueStatusDisplay.innerHTML = `
        <h3>Your Queue Status for ${userActiveBooking.clinic}</h3>
        <p>Appointment Time: <strong>${userActiveBooking.slot}</strong> on <strong>${userActiveBooking.date}</strong></p>
        <p>Current Status: <span class="status-badge ${userActiveBooking.status === 'booked' ? 'waiting' : userActiveBooking.status === 'checked_in' ? 'checked-in' : userActiveBooking.status === 'in_consult' ? 'in-consult' : ''}">${userActiveBooking.status.toUpperCase().replace('_', ' ')}</span></p>
        ${userPosition > 0 ? `
            <p>Your Position in Queue: <strong>#${userPosition}</strong></p>
            <p>Estimated Wait Time: <strong>~${estimatedWaitMinutes} minutes</strong></p>
        ` : `<p>No active queue found for your appointment.</p>`}
        <p>${statusText}</p>
        ${patientsAhead === 0 && userActiveBooking.status === 'checked_in' ? '<p>You are next in line!</p>' : ''}
    `;
}


// --- Notifications Logic ---

function refreshNotifications() {
    const notificationsList = document.getElementById("notificationsList");
    let notifications = JSON.parse(localStorage.getItem('smartHealthNotifs')) || [];
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `<p>You have no new alerts.</p>`;
        return;
    }

    // Sort by newest first
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    let html = '<h3>Recent Notifications</h3>';
    notifications.forEach(notif => {
        const unreadClass = notif.read ? '' : 'unread';
        const timestamp = new Date(notif.timestamp).toLocaleString();
        html += `
            <div class="notification-card ${unreadClass}">
                <h4>${notif.title}</h4>
                <p>${notif.message}</p>
                <small>${timestamp}</small>
            </div>
        `;
    });

    notificationsList.innerHTML = html;
    
    // Mark all as read after display (simple read mechanism)
    notifications.forEach(notif => notif.read = true);
    localStorage.setItem('smartHealthNotifs', JSON.stringify(notifications));
}


// --- Event Listeners ---

// 1. AUTHENTICATION LOGIC
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = authNameInput.value.trim();
    const phone = authPhoneInput.value.trim();
    const existingUser = mockUsers.find(u => u.phone === phone);

    if (isRegisterMode) {
        if (existingUser) {
            alert("This phone number is already registered. Please login.");
            toggleAuthMode(false); 
            return;
        }
        if (!name) {
            alert("Please enter your full name to register.");
            return;
        }
        
        const newUser = { 
            id: mockUsers.length + 1, 
            name: name, 
            phone: phone 
        };
        mockUsers.push(newUser);
        saveUsers();
        saveCurrentUser(newUser);
        
        alert(`Registration successful! Welcome, ${newUser.name}.`);
        renderApp();

    } else {
        if (!existingUser) {
            alert("Account not found. Please register first.");
            toggleAuthMode(true); 
            return;
        }

        saveCurrentUser(existingUser);
        alert(`Welcome back, ${existingUser.name}.`);
        renderApp();
    }
});

logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    clearCurrentUser();
    alert("You have been logged out.");
    renderApp();
});


// 2. TAB SWITCHING
tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        const tabId = button.dataset.tab;
        switchTab(tabId);
    });
});
quickButtons.forEach(button => {
    button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
    });
});
refreshNotifs.addEventListener('click', refreshNotifications);
refreshQueueBtn.addEventListener('click', renderQueueStatus);


// 3. BOOKING LOGIC (UPDATED to use currentUser)
bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("You must be logged in to book an appointment.");
        return;
    }

    // 1. Collect preliminary data (NOW USING currentUser DETAILS)
    const preliminaryData = {
        name: currentUser.name, 
        phone: currentUser.phone, 
        clinic: document.getElementById("clinic").value,
        date: document.getElementById("date").value,
        reason: document.getElementById("reason").value,
        standby: document.getElementById("standby").checked,
        grace: document.getElementById("grace").checked,
    };
    
    suggestedSlotArea.classList.add("hidden");
    document.getElementById("findSlotBtn").classList.remove("hidden");
    currentSuggestedSlot = null; 

    showSpinner(); 

    // Simulate network delay
    setTimeout(() => {
        
        // Check 1: Prevent double booking
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

// 4. SLOT CONFIRMATION
acceptSlotBtn.addEventListener("click", () => {
    if (currentSuggestedSlot) {
        lastBookingId++;
        const newBooking = {
            id: lastBookingId,
            ...currentSuggestedSlot,
            status: 'booked'
        };
        mockBookings.push(newBooking);
        saveBookings();
        alert(`✅ Appointment confirmed for ${newBooking.date} at ${newBooking.slot} at ${newBooking.clinic}.`);
        
        // Reset the view
        suggestedSlotArea.classList.add("hidden");
        document.getElementById("findSlotBtn").classList.remove("hidden");
        bookingForm.reset();
        switchTab('appointmentsTab');
    }
});

denySlotBtn.addEventListener("click", () => {
    currentSuggestedSlot = null;
    alert("Suggestion denied. Please adjust your criteria and try again.");
    
    // Reset the view
    suggestedSlotArea.classList.add("hidden");
    document.getElementById("findSlotBtn").classList.remove("hidden");
});


// 5. STATUS CHECK (UPDATED to use currentUser)
document.getElementById("viewStatusBtn").addEventListener("click", () => {
    const results = document.getElementById("statusResults");
    
    if (!currentUser) {
        results.innerHTML = `<p>Please log in to view your appointments.</p>`;
        return;
    }
    
    const phone = currentUser.phone; 

    const userBookings = mockBookings
        .filter(booking => booking.phone === phone)
        .sort((a, b) => new Date(a.date + ' ' + a.slot) - new Date(b.date + ' ' + b.slot));
        
    
    if (userBookings.length === 0) {
        results.innerHTML = `<p>No active appointments found for ${currentUser.name}.</p>`;
        return;
    }

    let html = `<h3>Your Appointments for ${currentUser.name}:</h3>`;
    userBookings.forEach(booking => {
        let statusBadgeClass = '';
        if (booking.status === 'booked') {
            statusBadgeClass = 'waiting'; 
        } else if (booking.status === 'checked_in') {
            statusBadgeClass = 'checked-in';
        } else if (booking.status === 'cancelled' || booking.status === 'no_show') {
            statusBadgeClass = 'unstamp'; 
        } else if (booking.status === 'in_consult') {
            statusBadgeClass = 'in-consult';
        }

        html += `
            <div class="booking-card">
                <p><strong>${booking.date} at ${booking.slot}</strong></p>
                <p>Clinic: ${booking.clinic}</p>
                <p>Reason: ${booking.reason || 'Not specified'}</p>
                <p>
                    Status: <span class="status-badge ${statusBadgeClass}">${booking.status.toUpperCase().replace('_', ' ')}</span>
                    ${booking.standby ? ' (Standby Active)' : ''}
                </p>
                ${booking.status === 'booked' ? `<button onclick="cancelBooking(${booking.id})">Cancel Appointment</button>` : ''}
            </div>
        `;
    });
    
    results.innerHTML = html;
});


// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
    // Set min date for booking to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").setAttribute('min', today);
    
    // Check user session first
    renderApp(); 
});