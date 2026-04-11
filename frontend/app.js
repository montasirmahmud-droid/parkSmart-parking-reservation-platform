// 1. Find the button and the input boxes on the screen
const signupBtn = document.getElementById('signup-btn');
const responseMsg = document.getElementById('response-message');

// 2. This function runs when someone clicks the button
signupBtn.addEventListener('click', async () => {
    
    // Get values from the boxes
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 3. The "POST" request: Send this data to your server.js
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();


        // 4. Show the success or error message on the screen
        if (response.ok) {
            responseMsg.innerText = "Success: " + data.message;
            responseMsg.style.color = "green";
        } else {
            // FIX: Check for message (your duplicate check) OR error (database crash)
            responseMsg.innerText = "Error: " + (data.message || data.error);
            responseMsg.style.color = "red";
        }

    } catch (error) {
        responseMsg.innerText = "Could not connect to server.";
    }
});



// 1. Find the Login elements
const loginBtn = document.getElementById('login-btn');

// 2. Login Logic
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
            // In the future, we will redirect the user to a dashboard here!
        } else {
            responseMsg.innerText = "❌ Error: " + (data.message || data.error);
            responseMsg.style.color = "red";
        }
    } catch (error) {
        responseMsg.innerText = "Could not connect to server.";
    }
});



// ==========================================
// MEMBER 3: FINANCE & ACTIVITY LOGIC (FEAT 15)
// ==========================================

const logEntryBtn = document.getElementById('log-entry-btn');
const financeMsg = document.getElementById('finance-message');

// This handles recording a car entry into the system
logEntryBtn.addEventListener('click', async () => {
    // 1. Collect the User ID and the current Parking Rate from the form
    const userId = document.getElementById('userId').value;
    const hourlyRate = document.getElementById('hourlyRate').value;

    try {
        // 2. Send this data to our Finance Controller in the Backend
        const response = await fetch('http://localhost:5000/api/finance/log-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, hourlyRate })
        });

        const data = await response.json();

        // 3. Show success or error message
        if (response.ok) {
            financeMsg.innerText = "✅ Entry Logged!";
            financeMsg.style.color = "green";
        } else {
            financeMsg.innerText = "❌ Error: " + data.error;
            financeMsg.style.color = "red";
        }
    } catch (err) {
        financeMsg.innerText = "Connection Error: Is the server running?";
    }
});


