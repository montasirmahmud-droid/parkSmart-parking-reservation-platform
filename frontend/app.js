// ==========================================
// 1. THE "HELLO! I'M NEW" LOGIC (SIGNUP) ✨
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
// 2. THE "I'M BACK!" LOGIC (LOGIN) 🔑
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
            responseMsg.innerText = "✅ Success: " + data.message;
            responseMsg.style.color = "green";
        } else {
            responseMsg.innerText = "❌ Error: " + (data.message || data.error);
            responseMsg.style.color = "red";
        }
    } catch (error) {
        responseMsg.innerText = "Connection Error.";
    }
});

// ==========================================
// 3. THE "ADMIN'S CLIPBOARD" (LOG ENTRY) 📝
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
            financeMsg.innerText = "✅ Car Entry Recorded!";
            financeMsg.style.color = "green";
            // We refresh the table so the new car shows up right away!
            updateActivityTable(); 
        } else {
            financeMsg.innerText = "❌ Error logging entry.";
        }
    } catch (err) {
        financeMsg.innerText = "Connection Error.";
    }
});

// ==========================================
// 4. THE "LIVE VIEW" TABLE LOGIC 📊
// ==========================================
async function updateActivityTable() {
    try {
        // We ask the backend for a list of EVERYONE who has parked
        const response = await fetch('http://localhost:5000/api/finance/activity-log');
        const logs = await response.json();

        const tableBody = document.getElementById('activity-body');
        const revenueText = document.getElementById('total-revenue');
        tableBody.innerHTML = ""; // We empty the table first
        
        let totalMoney = 0; // We start counting money from zero

        logs.forEach(log => {
            // If the car has already "Paid," we add BDT 100 to our total
            if (log.status === 'Completed') {
                totalMoney += 100; 
            }

            // We create a new row for each car in the database
            const row = `
                <tr>
                    <td>${log.userId ? log.userId.username : 'Unknown'}</td>
                    <td>${new Date(log.entryTime).toLocaleString()}</td>
                    <td>${log.status === 'Active' ? '🅿️ Parked' : '✅ Paid'}</td>
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
// 5. THE "PRICE CALCULATOR" (CHECK OUT) 💰
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
            alert(`💰 Check-out Successful!\nStay Duration: ${data.duration} hour(s)\nTotal Fee: BDT ${data.fee}`);
            updateActivityTable(); // Refresh to show they have "Paid"
        } else {
            alert("❌ Error: " + (data.message || data.error));
        }
    } catch (err) {
        alert("❌ Connection Error.");
    }
}

// ==========================================
// 6. THE "BYE-BYE" LOGIC (LOGOUT) 🚪
// ==========================================
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', async () => {
    const response = await fetch('http://localhost:5000/api/auth/logout', { method: 'POST' });
    if (response.ok) {
        alert("Logged out successfully. See you later!");
        window.location.reload(); // This clears the screen!
    }
});

// We tell the table to show itself as soon as the page opens!
updateActivityTable();
