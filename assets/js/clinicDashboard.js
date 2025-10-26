
// --- Globals ---
const resultsTableBody = document.getElementById("resultsTableBody");
const nextPatientCard = document.getElementById("nextPatientCard");
const patientCountDisplay = document.getElementById("patientCount");
const currentQueueDisplay = document.getElementById("currentQueue");
const currentWaitTimeDisplay = document.getElementById("currentWaitTime");

// Stats Elements
const totalAppointmentsDisplay = document.getElementById("totalAppointments");
const checkedInCountDisplay = document.getElementById("checkedInCount");
const pendingCountDisplay = document.getElementById("pendingCount");
const cancelledCountDisplay = document.getElementById("cancelledCount");

// NEW: Clinic Selection and Authentication
const clinicSelector = document.getElementById("clinicSelector");
const dashboardHeader = document.getElementById("dashboardHeader");
let currentClinic = clinicSelector.value; // Initialize with the selected value

// Add clinic selection event listener
clinicSelector.addEventListener('change', function() {
    currentClinic = this.value;
    dashboardHeader.textContent = currentClinic + " Dashboard";
    renderDashboard();
});

// --- Data Fetching and Management ---

// This pulls the central booking data shared with the patient app
let mockBookings = JSON.parse(localStorage.getItem('smartHealthBookings')) || [];

function saveBookings() {
    localStorage.setItem('smartHealthBookings', JSON.stringify(mockBookings));
    // Re-render immediately after a change
    renderDashboard();
}

function findBookingById(id) {
    return mockBookings.find(b => b.id === id);
}

// --- Status Management Logic ---

// Function to update the status of a patient by ID
function updateStatus(id, newStatus) {
    const booking = findBookingById(id);
    if (!booking) return;

    // 1. Update the booking status
    booking.status = newStatus;

    // 2. Perform actions based on new status
    if (newStatus === 'cancelled') {
        // If a patient cancels, check for a standby patient to fill the slot
        checkAndNotifyStandby(booking.clinic, booking.date, booking.slot);
    } else if (newStatus === 'completed') {
        // Remove completed appointment from the active list
        mockBookings = mockBookings.filter(b => b.id !== id);
    }

    saveBookings();
}


// --- Standby/Queue Logic (Simplified for this task) ---

// Placeholder function - a real system would handle this complex logic
function checkAndNotifyStandby(clinic, date, cancelledSlot) {
    // 1. Find a standby patient for this clinic and date
    const standbyPatient = mockBookings.find(b => 
        b.clinic === clinic && 
        b.date === date && 
        b.standby &&
        b.status === 'booked' // only consider active, booked appointments
    );

    if (standbyPatient) {
        // 2. If found, give them the cancelled slot
        standbyPatient.slot = cancelledSlot;
        standbyPatient.standby = false; // Standby fulfilled

        // 3. Notify the patient (simulate a notification)
        console.log(`[NOTIFICATION SENT] ${standbyPatient.name} has been moved to an earlier slot: ${cancelledSlot}`);
        // In a real system, this would push a notification to the patient's local storage/app.
    }
}


// --- Dashboard Rendering (UPDATED) ---

function renderDashboard() {
    // Filter bookings for current clinic
    const clinicBookings = mockBookings.filter(b => b.clinic === currentClinic);
    
    // Active bookings (not completed/cancelled)
    const activeBookings = clinicBookings
        .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.date + ' ' + a.slot) - new Date(b.date + ' ' + b.slot));

    // Clear previous content
    resultsTableBody.innerHTML = '';
    nextPatientCard.innerHTML = '<h2>No Patients in Queue</h2><p>Select a clinic or wait for a patient to check in.</p>';
    
    // Calculate metrics
    const checkedInCount = clinicBookings.filter(b => b.status === 'checked_in').length;
    const pendingCount = clinicBookings.filter(b => b.status === 'booked').length;
    const cancelledCount = clinicBookings.filter(b => b.status === 'cancelled').length;
    const inQueueCount = activeBookings.filter(b => b.status === 'checked_in' || b.status === 'in_consult').length;
    
    // Update stats cards
    totalAppointmentsDisplay.textContent = clinicBookings.length;
    checkedInCountDisplay.textContent = checkedInCount;
    pendingCountDisplay.textContent = pendingCount;
    cancelledCountDisplay.textContent = cancelledCount;
    
    // Update queue metrics
    patientCountDisplay.textContent = activeBookings.length;
    currentQueueDisplay.textContent = `Queue: ${inQueueCount}`;
    const estimatedMinutes = inQueueCount * 15; // 15 minutes per patient
    currentWaitTimeDisplay.textContent = `Wait: ~${estimatedMinutes} min`;

    if (activeBookings.length === 0) {
        return; 
    }

    // --- 1. Next Patient Card (First in the sorted list) ---
    const nextPatient = activeBookings[0];
    
    // Determine the main action based on patient status
    let actionButtonHTML = '';
    if (nextPatient.status === 'booked') {
        actionButtonHTML = `<button onclick="updateStatus(${nextPatient.id}, 'checked_in')" class="action-btn primary">Check In</button>`;
    } else if (nextPatient.status === 'checked_in' || nextPatient.status === 'in_consult') {
        actionButtonHTML = `
            <button onclick="updateStatus(${nextPatient.id}, 'in_consult')" class="action-btn tertiary">Start Consult</button>
            <button onclick="updateStatus(${nextPatient.id}, 'completed')" class="action-btn success">Mark Complete</button>
        `;
    }
    
    nextPatientCard.innerHTML = `
        <h2>NEXT: ${nextPatient.name}</h2>
        <p>Time: <strong>${nextPatient.slot}</strong> | Status: <strong>${nextPatient.status.toUpperCase().replace('_', ' ')}</strong></p>
        <p>Reason: ${nextPatient.reason || 'N/A'}</p>
        <div class="card-actions">${actionButtonHTML}</div>
    `;


    // --- 2. Full Appointments Table ---
    activeBookings.forEach((booking, index) => {
        
        let statusBadgeClass = '';
        if (booking.status === 'booked') {
            statusBadgeClass = 'waiting'; 
        } else if (booking.status === 'checked_in') {
            statusBadgeClass = 'checked-in';
        } else if (booking.status === 'in_consult') {
            statusBadgeClass = 'in-consult';
        }
        
        const row = resultsTableBody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${booking.name}</td>
            <td>${booking.phone}</td>
            <td>${booking.date}</td>
            <td>${booking.slot}</td>
            <td><span class="status-badge ${statusBadgeClass}">${booking.status.toUpperCase().replace('_', ' ')}</span></td>
            <td>${booking.standby ? 'Yes' : 'No'}</td>
            <td>
                <select onchange="updateStatus(${booking.id}, this.value)">
                    <option value="${booking.status}">${booking.status.toUpperCase().replace('_', ' ')} (Current)</option>
                    <option value="checked_in">Check In</option>
                    <option value="in_consult">In Consult</option>
                    <option value="completed">Complete</option>
                    <option value="cancelled">Cancel</option>
                </select>
            </td>
        `;
    });
}

// --- Event Listeners and Initialization ---

// NEW: Handle clinic selection change
clinicSelector.addEventListener('change', (e) => {
    currentClinic = e.target.value;
    dashboardHeader.textContent = `${currentClinic} Dashboard`;
    renderDashboard();
});

// Initial Render
renderDashboard();



// --- Initialization and Polling (New Block) ---

// Function to start the dashboard rendering loop
function startPolling() {
    // Render the dashboard immediately on load
    renderDashboard();
    
    // Set up a timer to refresh the dashboard every 5 seconds (5000 milliseconds)
    // This solves Issue #1 for the demo by simulating real-time updates.
    setInterval(renderDashboard, 5000); 
}

// Ensure you replace or delete the old 'renderDashboard();' call 
// if it was at the bottom of your file, and replace it with this:
startPolling();