// ==========================================
// 1. THE "HELLO! I'M NEW" LOGIC (SIGNUP)
// ==========================================
const signupBtn = document.getElementById('signup-btn');
const responseMsg = document.getElementById('response-message');

signupBtn.addEventListener('click', async () => {
    // We grab the name, email, and password the user typed in the boxes
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // We "ship" this data to our backend server
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        // If the server says "OK," we show a green success message!
        if (response.ok) {
            responseMsg.innerText = "Success: " + data.message;
            responseMsg.style.color = "green";
        } else {
            // If the email is already used, we show a red error message
            responseMsg.innerText = "Error: " + (data.message || data.error);
            responseMsg.style.color = "red";
        }
    } catch (error) {
        responseMsg.innerText = "Oh no! Could not connect to the server.";
    }
});

// ==========================================
// 2. THE "I'M BACK!" LOGIC (LOGIN)
// ==========================================
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            responseMsg.innerText = "Welcome, " + data.username;
            responseMsg.style.color = "green";
            
            // Save the role in the browser so we remember it even if we refresh
            localStorage.setItem('userRole', data.role);
            
            // Immediately update the screen based on the new role
            checkPermissions();
        } else {
            responseMsg.innerText = "Error: " + (data.message || data.error);
            responseMsg.style.color = "red";
        }
    } catch (error) {
        responseMsg.innerText = "Connection Error.";
    }
});

// ==========================================
// 3. THE "ADMIN'S CLIPBOARD" (LOG ENTRY)
// ==========================================
const logEntryBtn = document.getElementById('log-entry-btn');
const financeMsg = document.getElementById('finance-message');

logEntryBtn.addEventListener('click', async () => {
    const userId = document.getElementById('userId').value;
    const hourlyRate = document.getElementById('hourlyRate').value;

    try {
        const response = await fetch('http://localhost:5000/api/finance/log-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, hourlyRate })
        });

        if (response.ok) {
            financeMsg.innerText = "Car Entry Recorded!";
            financeMsg.style.color = "green";
            // We refresh the table so the new car shows up right away!
            updateActivityTable(); 
        } else {
            financeMsg.innerText = "Error logging entry.";
        }
    } catch (err) {
        financeMsg.innerText = "Connection Error.";
    }
});

// ==========================================
// 4. THE "LIVE VIEW" TABLE LOGIC
// ==========================================
async function updateActivityTable() {
    try {
        // We ask the backend for a list of EVERYONE who has parked
        const response = await fetch('http://localhost:5000/api/finance/activity-log');
        const logs = await response.json();

        const tableBody = document.getElementById('activity-body');
        const revenueText = document.getElementById('total-revenue');
        const counterText = document.getElementById('active-cars-count');

        tableBody.innerHTML = ""; // We empty the table first
        
        let totalMoney = 0; // We start counting money from zero
        let activeCars = 0; // We start counting cars from zero

        logs.forEach(log => {
            // If the car has already "Paid," we add its fee to our total
            if (log.status === 'Completed') {
                totalMoney += 100; 
            }

            //If the car is still parked, add 1 to the counter
            if (log.status === 'Active') {
                activeCars++;
            }

            // ... (keep all existing Overstay and Row logic here) ...

            // --- FEATURE 20: OVERSTAY ALERT (THE BRAIN) ---
            const entryTime = new Date(log.entryTime);
            const currentTime = new Date();
            // Subtract entry time from current time to see how long they've been here
            const hoursElapsed = (currentTime - entryTime) / (1000 * 60 * 60);
            
            let statusBadge = log.status === 'Active' ? '🅿️ Parked' : 'Paid';
            
            // If they are still parked AND stayed over 2 hours, show a red warning!
            if (log.status === 'Active' && hoursElapsed > 2) {
                statusBadge = '⚠️ <span style="color: red; font-weight: bold;">OVERSTAY</span>';
            }

            // We create a new row for each car in the database
            const row = `
                <tr>
                    <td>${log.userId ? log.userId.username : 'Unknown'}</td>
                    <td>${entryTime.toLocaleString()}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${log.status === 'Active' 
                            ? `<button onclick="handleExit('${log._id}')">Check Out</button>` 
                            : '---'}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // We update the green "Money Box" on the screen
        revenueText.innerText = totalMoney;

    } catch (err) {
        console.error("Error updating table:", err);
    }
}

// ==========================================
// 5. THE "PRICE CALCULATOR" (CHECK OUT)
// ==========================================
async function handleExit(recordId) {
    try {
        const response = await fetch('http://localhost:5000/api/finance/handle-exit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId })
        });

        const data = await response.json();

        if (response.ok) {
            // This tells the user exactly how long they stayed and what they owe!
            alert(`Check-out Successful!\nStay Duration: ${data.duration} hour(s)\nTotal Fee: BDT ${data.fee}`);
            updateActivityTable(); // Refresh to show they have "Paid"
        } else {
            alert("Error: " + (data.message || data.error));
        }
    } catch (err) {
        alert("Connection Error.");
    }
}

// ==========================================
// 6. THE "BYE-BYE" LOGIC (LOGOUT)
// ==========================================
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', async () => {
    // When we logout, we clear our "Library Card" (role) so the next person can't see our stuff
    localStorage.removeItem('userRole'); 
    alert("Logged out successfully. See you later!");
    window.location.reload(); // This clears the screen!
});

// ==========================================
// 7. THE "WHO IS ALLOWED?" LOGIC (PERMISSIONS)
// ==========================================
function checkPermissions() {
    // We check the "Library Card" we saved in the browser memory
    const role = localStorage.getItem('userRole');
    const revenueBox = document.getElementById('revenue-report');
    const financeInputSection = document.getElementById('finance-section');
    const activityTable = document.getElementById('activity-log-section');

    // 1. ONLY the Finance Admin can see the green Money Box
    if (role === 'FinanceAdmin') {
        revenueBox.style.display = 'block';
    } else {
        revenueBox.style.display = 'none';
    }

    // 2. BOTH Finance Admin and Parking Manager can see the live table and record entries
    if (role === 'FinanceAdmin' || role === 'ParkingManager') {
        financeInputSection.style.display = 'block';
        activityTable.style.display = 'block';
    } else {
        financeInputSection.style.display = 'none';
        activityTable.style.display = 'none';
    }
}


// ==========================================
// 8. ANALYTICS REPORT (FEATURE 18)
// ==========================================
const analyticsBtn = document.getElementById('analytics-btn');

analyticsBtn.addEventListener('click', async () => {
    try {
        // We ask the backend for the latest parking data
        const response = await fetch('http://localhost:5000/api/finance/activity-log');
        const logs = await response.json();
        
        // --- Only look at cars that PAID and LEFT ---
        const completed = logs.filter(l => l.status === 'Completed');
        
        if (completed.length === 0) {
            alert("No completed sessions yet to report!");
            return;
        }

        // --- Calculate total money earned ---
        const totalRev = completed.length * 100;

        // --- Calculate Average Time (Dwell Time) ---
        let totalHours = 0;
        completed.forEach(l => {
            const duration = (new Date(l.exitTime) - new Date(l.entryTime)) / (1000 * 60 * 60);
            totalHours += duration;
        });
        const avgStay = (totalHours / completed.length).toFixed(1);

        // --- Show the results in a pop-up box ---
        alert(` --- DETAILED DAILY REPORT --- \n\n` +
              `Total Cars Served: ${completed.length}\n` +
              `Total Revenue: BDT ${totalRev}\n` +
              `Avg. Stay Duration: ${avgStay} hour(s)\n\n` +
              `Generated on: ${new Date().toLocaleString()}`);

    } catch (err) {
        alert("Report generation failed.");
    }
});


// We tell the table to show itself as soon as the page opens!
updateActivityTable();
// We check who is logged in every time the page loads
checkPermissions();
