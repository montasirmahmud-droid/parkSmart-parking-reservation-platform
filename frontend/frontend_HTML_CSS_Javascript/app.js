// ==========================================
// 1. THE "HELLO! I'M NEW" LOGIC (SIGNUP)
// ==========================================
// On page load
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('admin-dashboard');
    const authSection = document.querySelector('.auth-container');
    
    // Ensure dashboard is hidden at the start
    dashboard.classList.add('hidden-section');
});

const signupBtn = document.getElementById('signup-btn');
const responseMsg = document.getElementById('response-message');

const DEFAULT_GRACE_PERIOD_MINUTES = 15;

signupBtn.addEventListener('click', async () => {
    //Clear ALL messages when switching
    clearAllMessages();
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
            clearAllMessages(); // Wipe any old red errors
            const successDiv = document.createElement('div');
            successDiv.className = 'signup-error'; // Use same class for position
            successDiv.style.color = "#B76E79";   
            successDiv.style.fontWeight = 'bold';
            successDiv.style.marginTop = '15px'; 
            successDiv.innerText = data.message;
            successDiv.style.textAlign = 'center';

            signupCard.parentNode.insertBefore(successDiv, signupCard.nextSibling);

        } else {

            // 1. Remove any old error from under the card
            const oldError = document.querySelector('.signup-error');
            if (oldError) oldError.remove();

            // 2. Create the error message div
            const errorDiv = document.createElement('div');
            errorDiv.className = 'signup-error';
            errorDiv.style.color = "#B76E79";
            errorDiv.style.fontSize = '1rem';
            errorDiv.style.fontWeight = 'bold';
            errorDiv.style.marginTop = '15px'; 
            errorDiv.style.textAlign = 'center';

            // 3. LOGIC: Check why it failed
            if (response.status === 409) {
                // 409 is the standard code for "Conflict" (Email exists)
                errorDiv.innerText = "⚠️ Email account already exists!";
            } else if (!username || !email || !password) {
                // If boxes are empty
                errorDiv.innerText = "⚠️ Incomplete Info";
            } else {
                // Fallback for other errors (like "Invalid Info")
                errorDiv.innerText = data.message || "⚠️ Invalid Info. Try again.";
            }

            // 4. Place it UNDER the card on the white background
            signupCard.parentNode.insertBefore(errorDiv, signupCard.nextSibling);
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
    //Clear ALL messages when switching
    clearAllMessages();
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
            responseMsg.innerText = "Welcome, " + data.username + "!";
            responseMsg.style.color = "#B76E79";
            
            // Save the role in the browser so system can remember it even if we refresh
            //localStorage.setItem('userRole', data.role);
            
            // Save the token and role in the browser so system can remember login
            localStorage.setItem("token", data.token);
            localStorage.setItem("userRole", data.role);
            
            // Show the dashboard
            checkPermissions();

            // Immediately load the parking entries
            updateActivityTable();

        } else {
            // 1. Clear the top message
            responseMsg.innerText = ""; 

            // 2. Remove any old error from under the card
            const oldError = document.querySelector('.login-error');
            if (oldError) oldError.remove();

            // 3. Create the error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'login-error'; 
            errorDiv.style.color = '#660d0d';   
            errorDiv.style.fontSize = '1rem';
            errorDiv.style.fontWeight = 'bold';
            errorDiv.style.marginTop = '15px'; // Adds space between card and error
            errorDiv.style.textAlign = 'center';
            errorDiv.innerText = "⚠️ Invalid Credentials";
            //errorDiv.innerText = "⚠️ " + (data.message || data.error);
            
            // 4. THE MAGIC LINE: Put it AFTER the card, on the white background
            loginCard.parentNode.insertBefore(errorDiv, loginCard.nextSibling);
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

const BOOKING_PRE_HOUR = 1;

logEntryBtn.addEventListener('click', async () => {

    // Clear old messages
    financeMsg.innerText = "";

    const errorMsg = document.getElementById('error-message');

    // We grab everything the admin typed/chose
    const userId = document.getElementById('userId').value.trim();
    const vehicleType = document.getElementById('vehicleType-select').value.trim();

    //const parkingType = document.getElementById('parkingType-select').value.trim();
    const parkingTypeInput = document.getElementById('parkingType-select');                // Grab the parking type input box.
    const parkingType = parkingTypeInput.dataset.value || parkingTypeInput.value.trim();   // Use the secret value first. Example: "WalkIn" or "Booked"

    const entryDate = document.getElementById('entry-date').value;
    const exitDate = document.getElementById('exit-date').value;

    const entryHour = document.getElementById('entry-hour').value;
    const entryMinute = document.getElementById('entry-minute').value;
    const entryPeriod = document.getElementById('entry-period').value;

    const exitHour = document.getElementById('exit-hour').value;
    const exitMinute = document.getElementById('exit-minute').value;
    const exitPeriod = document.getElementById('exit-period').value;

    // If anything important is missing, we stop here
    // if (!userId || !vehicleType || !parkingType ) {
    if (!userId || !vehicleType || !parkingType) {
        errorMsg.style.color = "#B76E79";
        errorMsg.innerText = "⚠️ Please fill in User ID, Vehicle Type, Parking Type.";
        return;
    }

    
    if (parkingType === "Booked" && !entryDate) {
        errorMsg.style.color = "#B76E79";
        errorMsg.innerText = "⚠️ Please fill in Entry Date for booking.";
        return;
    }

    if (parkingType === "Booked" && !exitDate) {
        errorMsg.style.color = "#B76E79";
        errorMsg.innerText = "⚠️ Please fill in Exit Date for booking.";
        return;
    }



    // Turns date + hour + minute + AM/PM into a real time
    function makeDateTime(date, hour, minute, period) {
        let h = parseInt(hour);

        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;

        return new Date(`${date}T${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    }

    const entryDateTime = parkingType === "Booked"
        ? makeDateTime(entryDate, entryHour, entryMinute, entryPeriod)
        : null;

    const exitDateTime = parkingType === "Booked"
        ? makeDateTime(exitDate, exitHour, exitMinute, exitPeriod)
        : null;

    const finalEntryTime = parkingType === "WalkIn" ? new Date() : entryDateTime;

    const now = new Date();
    const bookingAllowedFrom = new Date(now.getTime() + BOOKING_PRE_HOUR * 60 * 60 * 1000);

    // Booking rule: entry time must be at least 1 hour from now
    if (parkingType === "Booked" && entryDateTime < bookingAllowedFrom) {
        errorMsg.style.color = "#B76E79";
        errorMsg.innerText = `⚠️ Bookings must be made at least ${BOOKING_PRE_HOUR} hour(s) before entry time.`;
        return;
    }


    // Optional: prevent future entry time too
    //if (entryDateTime > now) {
        //errorMsg.style.color = "#B76E79";
        //errorMsg.innerText = "⚠️ Entry time cannot be in the future.";
        //return;
    //}

    
    let durationHours = null;
    if (parkingType === "Booked") {
        durationHours = (exitDateTime - entryDateTime) / (1000 * 60 * 60);

        if (durationHours <= 0) {
            errorMsg.style.color = "#B76E79";
            errorMsg.innerText = "⚠️ Exit time must be after entry time.";
            return;
        }
    }
    // Turning off the button so user cannot click it twice quickly.    
    // As, now all small checks are finished. So now it is safe to lock the button.
    logEntryBtn.disabled = true;    

    try {                                                                                       // We ship this parking session to our backend server
        const requestBody = {
            userId,
            vehicleType,
            parkingType,
            entryTime: finalEntryTime,
            exitTime: parkingType === "Booked" ? exitDateTime : null,
            durationHours
        };

        // First ask backend to calculate the preview
        const previewResponse = await fetch('http://localhost:5000/api/finance/preview-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)                                                  // We ship this parking session to our backend server
        });

        const previewData = await previewResponse.json();

        if (!previewResponse.ok) {
            financeMsg.style.color = "#B76E79";
            financeMsg.innerText = previewData.message || previewData.error || "Preview failed.";
            return;
        }

        let confirmMessage = "";

        if (previewData.parkingType === "Booked") {
            confirmMessage = [
                "          --- Parking Type: Booking ---          ",
                "",
                `Name: ${previewData.userName}`,
                `User ID: ${previewData.userId}`,
                "",
                `Vehicle Type: ${previewData.vehicleType}`,                
                `Hourly Rate: BDT ${previewData.hourlyRate}`,
                `Late Fee: BDT ${previewData.penaltyRatePer10Minutes} per 10 minutes of overstay`,
                `Grace Period: ${previewData.gracePeriodinMinutes} minutes`,
                "",
                `Booked Check-in Time: ${new Date(previewData.entryTime).toLocaleString()}`,
                `Booked Checkout Time: ${new Date(previewData.expectedExitTime).toLocaleString()}`,
                `Expected Stay Duration: ${previewData.expectedStay}`,
                `Expected Fee: BDT ${previewData.expectedFee}`,
                "",
                //"Do you want to record this booking?"
                "Record Booking Entry? "
            ].join("\n");
        } else {
            confirmMessage = [
                "          --- Parking Type: Walk-in ---          ",
                "",                
                `Name: ${previewData.userName}`,
                `User ID: ${previewData.userId}`,
                "",
                `Vehicle Type: ${previewData.vehicleType}`,                
                `Hourly Rate: BDT ${previewData.hourlyRate}`,
                "",
                `Entry Time: ${new Date(previewData.entryTime).toLocaleString()}`,
                "",
                //"Walk-in Billing Rule:",
                previewData.walkInRule,
                "",
                //"Do you want to record this walk-in entry?"
                "Record Walk-in Entry?"
            ].join("\n");
        }

        const confirmEntry = confirm(confirmMessage);

        if (!confirmEntry) {
            financeMsg.style.color = "#B76E79";
            financeMsg.innerText = "Entry cancelled before saving.";
            return;
        }

        // If admin confirms, now actually save it
        const response = await fetch('http://localhost:5000/api/finance/log-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        //Reseting everything after saving
        if (response.ok) {
            errorMsg.innerText = "";
            financeMsg.style.color = "var(--deep-teal)";
            financeMsg.innerText = "✅ Car Entry Recorded!";

            updateActivityTable();

            document.getElementById('userId').value = "";                              // Clear the user ID box.
            document.getElementById('vehicleType-select').value = "";                  // Clear the visible vehicle type box.
            document.getElementById('parkingType-select').value = "";                  // Clear the visible parking type box.
            document.getElementById('entry-date').value = "";                          // Clear booking date boxes.
            document.getElementById('exit-date').value = "";                           // Clear booking date boxes.
 


            document.getElementById('vehicle-type-dropdown').selectedIndex = 0;            // Reset the real vehicle dropdown back to "Select Vehicle Type".
            document.getElementById('parkingType-select').dataset.value = "";            // Clear the secret parking type value. "Booked","WalkIn"
            document.getElementById('parking-type-dropdown').selectedIndex = 0;            // Reset the real parking dropdown back to "Select Parking Type".
            
            updateBookingTimeVisibility();                    // Hides the booking time section again.

           
        } else {
            financeMsg.style.color = "#B76E79";
            financeMsg.innerText = data.message || data.error || "Error logging entry.";
        }


    } catch (err) {
        financeMsg.style.color = "#B76E79";
        financeMsg.innerText = "Connection Error.";
    } finally {
        // Turn the button back on after saving is finished or after an error.
        logEntryBtn.disabled = false;
    }    

});


// ==========================================
// 4. THE "LIVE VIEW" TABLE LOGIC
// ==========================================

function formatTableDate(dateValue) {
    if (!dateValue) {
        return `<div class="table-date">---</div>`;
    }

    const date = new Date(dateValue);

    const dateText = date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    const timeText = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });

    return `
        <div class="table-date">
            <div>${dateText}</div>
            <div>${timeText}</div>
        </div>
    `;
}

function isLogOverstay(log) {
    if (log.status === "Overstay") return true;

    if (log.status !== "Active" || !log.expectedExitTime) return false;

    const expectedExitTime = new Date(log.expectedExitTime);
    const gracePeriod = log.gracePeriodinMinutes ?? DEFAULT_GRACE_PERIOD_MINUTES;

    const overstayStartTime = new Date(
        expectedExitTime.getTime() + gracePeriod * 60 * 1000
    );

    return new Date() > overstayStartTime;
}

async function updateActivityTable() {
    try {
        // We ask the backend for a list of EVERYONE who has parked
        const response = await fetch('http://localhost:5000/api/finance/activity-log');
        const logs = await response.json();

        const selectedParking = document.getElementById('parking-filter')?.value || "All";
        const selectedStatus = document.getElementById('status-filter')?.value || "All";                      //Reads the filter in updateActivityTable() for search filtering     
        const selectedVehicle = document.getElementById('vehicle-filter')?.value || "All";

        // If user leaves one empty, it becomes "". And NOT "All"
        const selectedFromDate = document.getElementById('from-date-filter')?.value || "";
        const selectedToDate = document.getElementById('to-date-filter')?.value || "";   
        
        // Stop if From Date is after To Date. Example: From May 10 to May 8 is impossible.
        if (selectedFromDate && selectedToDate) {
            const fromDate = new Date(selectedFromDate);
            const toDate = new Date(selectedToDate);

            if (fromDate > toDate) {
                const tableResultMessage = document.getElementById('table-result-message');

                if (tableResultMessage) {
                    tableResultMessage.innerText = "⚠️ From Date cannot be after To Date.";
                }

                return;
            }
        }        

        // Default is 10 if something goes wrong.
        const selectedLimit = document.getElementById('limit-filter')?.value || "10";


        

        //logs.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));         //This makes latest entry time appear at the top.    
        // Sort by newest saved record first. MongoDB automatically creates _id for every record. Newer records usually have bigger _id values.
        logs.sort((a, b) => b._id.localeCompare(a._id));        //This makes newest entries appear at the top.

                
        // Start with all logs. Then we slowly remove the ones that do not match the filters.
        let filteredLogs = logs;

        // 1. Parking Type filter
        if (selectedParking !== "All") {                                         // If user did NOT choose "All Parking Types", show only matching parking type.
            filteredLogs = filteredLogs.filter(log => log.parkingType === selectedParking);
        }

        // 2. Status filter
        if (selectedStatus !== "All") {                                       // If user did NOT choose "All", then filter by status.

            // Overstay is special because sometimes we calculate it on the frontend.
            if (selectedStatus === "Overstay") {
                filteredLogs = filteredLogs.filter(log => isLogOverstay(log));
            } 
            
            // Normal statuses: Booked, Active, Completed, Cancelled
            else {
                filteredLogs = filteredLogs.filter(log => log.status === selectedStatus);
            }
        }

        // 3. Vehicle Type filter
        if (selectedVehicle !== "All") {                                          // If user did NOT choose "All Vehicles", show only matching vehicle type.
            filteredLogs = filteredLogs.filter(log => log.vehicleType === selectedVehicle);
        }

        // 4. From Date filter
        if (selectedFromDate) {                                                   // If From Date is filled, show records from that date or later.
            const fromDate = new Date(selectedFromDate);
            fromDate.setHours(0, 0, 0, 0);

            filteredLogs = filteredLogs.filter(log => {
                const recordDate = new Date(log.entryTime);
                return recordDate >= fromDate;
            });
        }

        // 5. To Date filter
        if (selectedToDate) {                                                   // If From Date is filled, show records from that date or later.
            const toDate = new Date(selectedToDate);
            toDate.setHours(23, 59, 59, 999);

            filteredLogs = filteredLogs.filter(log => {
                const recordDate = new Date(log.entryTime);
                return recordDate <= toDate;
            });
        }

        //const visibleLogs = filteredLogs;                                         //Show only latest 10 data entry 
        //const visibleLogs = filteredLogs.slice(0, 10);                           //Show only latest 10 data entry         //Number
        
        // Decide how many records to show. If user chooses "All", show everything. Otherwise, show only the number they selected.
        const visibleLogs = selectedLimit === "All"
            ? filteredLogs
            : filteredLogs.slice(0, Number(selectedLimit));

        // This is the small message under the filters. Example: "0 records found" or "2 records found — showing all 2 because you asked for 50"
        const tableResultMessage = document.getElementById('table-result-message');

        if (tableResultMessage) {
            const totalFound = filteredLogs.length;

            if (totalFound === 0) {
                tableResultMessage.innerText = "0 records found.";
            } 
            
            else if (selectedLimit !== "All" && totalFound < Number(selectedLimit)) {
                tableResultMessage.innerText = `Total ${totalFound} records found. Showing all ${totalFound} records:`;
            } 
            
            else if (selectedLimit === "All") {
                tableResultMessage.innerText = `Total ${totalFound} records found. Showing all records:`;
            } 
            
            else {
                tableResultMessage.innerText = `Total ${totalFound} records found. Showing ${selectedLimit} records:`;
            }
        }




        const tableBody = document.getElementById('activity-body');
        const revenueText = document.getElementById('total-revenue');
        const counterText = document.getElementById('active-cars-count');

        tableBody.innerHTML = ""; // We empty the table first
        
        let totalMoney = 0; // We start counting money from zero
        let activeCars = 0; // We start counting cars from zero

        logs.forEach(log => {                                         //This counts all records.
            // If the car has already "Paid," we add its fee to our total
            if (log.status === 'Completed') {
                totalMoney += log.totalFee || 0;
            }

            //If the car is still parked, add 1 to the counter
            if (log.status === 'Active' || log.status === 'Overstay') {
                activeCars++;
            }
        });



        visibleLogs.forEach(log => {                                           //This shows only latest 10 rows.        

            // ... (keep all existing Overstay and Row logic here) ...

            // --- FEATURE 20: OVERSTAY ALERT (THE BRAIN) ---
            const entryTime = new Date(log.entryTime);
            const currentTime = new Date();
            
            // Subtract entry time from current time to see how long they've been here
            const hoursElapsed = (currentTime - entryTime) / (1000 * 60 * 60);
            
            const expectedExitTime = log.expectedExitTime ? new Date(log.expectedExitTime) : null;

            const gracePeriod = log.gracePeriodinMinutes ?? DEFAULT_GRACE_PERIOD_MINUTES;     

            let statusBadge = "";
            let actionButton = "";

            // Future booking
            if (log.status === "Booked") {
                statusBadge = `<span class="status-badge status-booked">📅 Booked</span>`;
                //statusBadge = "📅 Booked";
                actionButton = `<button class="table-action-btn" onclick="handleCancel('${log._id}')">Cancel</button>`;
            }

            // Currently parked
            else if (log.status === "Active") {
                statusBadge = `<span class="status-badge status-active">🅿️ Parked</span>`;
                //statusBadge = "🅿️ Parked";
                actionButton = `<button class="table-action-btn" onclick="handleExit('${log._id}')">Check Out</button>`;
            }

            // Already overstay
            else if (log.status === "Overstay") {
                statusBadge = `<span class="status-badge status-overstay">⚠️ Overstay</span>`;
                //statusBadge = '⚠️ <span style="color: red; font-weight: bold;">OVERSTAY</span>';
                actionButton = `<button class="table-action-btn" onclick="handleExit('${log._id}')">Check Out</button>`;
            }

            // Completed/paid
            else if (log.status === "Completed") {
                statusBadge = `<span class="status-badge status-paid">Paid</span>`;
                //statusBadge = "Paid";
                actionButton = "---";
            }

            // Cancelled
            else if (log.status === "Cancelled") {
                statusBadge = `<span class="status-badge status-cancelled">Cancelled</span>`;
                //statusBadge = "Cancelled";
                actionButton = "---";
            }

            // Fallback
            else {
                statusBadge = log.status;
                actionButton = "---";
            }

            let receiptButton = "---";
            if (log.status === "Completed") {
                receiptButton = `<button class="table-action-btn" onclick="viewReceipt('${log._id}')">View</button>`;
            }

            // Display Active record as overstay if it passed expected exit + grace. If they are still parked AND stayed over expected+grace hours, will show a red warning!
            if (log.status === "Active" && entryTime <= currentTime && expectedExitTime) {
                const overstayStartTime = new Date(expectedExitTime.getTime() + gracePeriod * 60 * 1000);

                if (currentTime > overstayStartTime) {
                    statusBadge = `<span class="status-badge status-overstay">⚠️ Overstay</span>`;
                    //statusBadge = '⚠️ <span style="color: red; font-weight: bold;">OVERSTAY</span>';
                    actionButton = `<button class="table-action-btn" onclick="handleExit('${log._id}')">Check Out</button>`;
                }
            }            

        
            // We create a new row for each car in the database
            const row = `
                <tr>
                    <td>${log.userId ? log.userId.username : 'Unknown'}</td>
                    <td>${log.vehicleType || 'Unknown'}</td>
                    <td>${formatTableDate(log.entryTime)}</td>
                    <td>${formatTableDate(log.expectedExitTime)}</td>                
                    <td>${statusBadge}</td>
                    <td>${actionButton}</td>
                    <td>${receiptButton}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // We update the green "Money Box" and "Occupancy Box" on the screen
        revenueText.innerText = totalMoney;
        updateRevenueCurrency();        
        counterText.innerText = activeCars;

    } catch (err) {
        console.error("Error updating table:", err);
    }
}

// ==========================================
// 5. THE "PRICE CALCULATOR" (CHECK OUT)
// ==========================================

//In case of booking cancellation
async function handleCancel(recordId) {
    const confirmCancel = confirm("Cancel this booking?");
    if (!confirmCancel) return;

    try {
        const response = await fetch('http://localhost:5000/api/finance/cancel-entry', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId })
        });

        const data = await response.json();

        if (response.ok) {
            showMessageModal("Booking Cancelled", data.message || "Booking cancelled!");
            updateActivityTable();
        } else {
            alert(data.message || data.error || "Cancel failed.");
        }
    } catch (err) {
        alert("Connection Error.");
    }
}



//In case of checking out(exiting)
async function handleExit(recordId) {
    
        const confirmCheckout = confirm("Check out now?");

            if (!confirmCheckout) {
                return;
            } 

    try {
        const response = await fetch('http://localhost:5000/api/finance/handle-exit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordId })
        });

        const data = await response.json();       

        if (response.ok) {
            let checkoutMessage = "";

            const parkingTypeText = data.parkingType === "WalkIn" ? "Walk-in" : "Booking";   

            if (data.parkingType === "WalkIn" || data.parkingType === "Walk-in") {            
                checkoutMessage = [
                    `User ID: ${data.customerId}`,
                    `Username: ${data.customerName}`,                                       
                    "",                    
                    `Parking Type: ${parkingTypeText}`,                    
                    `Vehicle Type:  ${data.vehicle}`,
                    `Rate per Hour: BDT ${data.hourlyRate}`,
                    `Stay Duration: ${data.duration}`,
                    `Total Fee: BDT ${data.finalFee}`
                ].join("\n");

            } else {
            // This tells the user exactly how long they stayed and what they owe!
                checkoutMessage = [
                    `User ID: ${data.customerId}`,
                    `Username: ${data.customerName}`,                    
                    "",                    
                    `Parking Type: ${parkingTypeText}`,                    
                    `Vehicle Type:  ${data.vehicle}`,
                    `Rate per Hour: BDT ${data.hourlyRate}`,
                    `Expected Stay Duration:  ${data.expectedStay}`,
                    "",
                    `Stay Duration: ${data.duration}`,
                    `Overstay Duration: ${data.overstayDuration}`,
                    `Received Grace Period: ${data.receivedGracePeriod}`,
                    "",
                    `Late Fee: BDT ${data.penaltyFee}`,
                    `Total Fee: BDT ${data.finalFee}`
                ].join("\n");
            }

           
            showMessageModal("Checkout Successful!", checkoutMessage);

            updateActivityTable(); // Refresh to show they have "Paid"

        } else {
            alert("Error: " + (data.message || data.error));
        }
    } catch (err) {
        alert("Connection Error.");
    }
}



//message popup function
function showMessageModal(title, message) {
    const modal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('message-modal-title');
    const modalBody = document.getElementById('message-modal-body');

    // Put the title and message inside the modal
    modalTitle.innerText = title;
    modalBody.innerText = message;

    // Show the modal
    modal.classList.remove('hidden-section');
}

// Closes the message popup function
function closeMessageModal() {
    const modal = document.getElementById('message-modal');

    // Hide the modal again
    modal.classList.add('hidden-section');
}

//receipt modal/card popup function
function showReceiptModal(title, message) {
    const modal = document.getElementById('receipt-modal');
    const modalTitle = document.getElementById('receipt-modal-title');
    const modalBody = document.getElementById('receipt-modal-body');

    modalTitle.innerText = title;
    modalBody.innerText = message;

    // Show the modal
    modal.classList.remove('hidden-section');
}

// Closes the receipt modal/card
function closeReceiptModal() {
    const modal = document.getElementById('receipt-modal');

    // Hide the modal again
    modal.classList.add('hidden-section');
}

async function viewReceipt(recordId) {
    try {
        const response = await fetch(`http://localhost:5000/api/finance/receipt/${recordId}`);
        const data = await response.json();

        if (!response.ok) {
            alert(data.message || data.error || "Could not load receipt.");
            return;
        }

        let receiptMessage = "";

        if (data.parkingType === "WalkIn" || data.parkingType === "Walk-in") {
            receiptMessage = [
                "",
                `Customer: ${data.customerName}`,
                `User ID: ${data.customerId}`,
                "",
                `Vehicle Type: ${data.vehicleType}`,
                `Rate per Hour: BDT ${data.hourlyRate}`,
                "",
                `Check-in: ${new Date(data.checkIn).toLocaleString()}`,
                `Checkout: ${new Date(data.actualCheckOut).toLocaleString()}`,
                "",
                `Total Stay: ${data.totalStay}`,
                `Amount Paid: BDT ${data.amountPaid}`
                
                
            ].join("\n");

        } else {
            receiptMessage = [
                "",
                `Customer: ${data.customerName}`,
                `User ID: ${data.customerId}`,
                "",
                `Vehicle Type: ${data.vehicleType}`,
                `Rate per Hour: BDT ${data.hourlyRate}`,
                "",
                `Booked Checkin Time: ${new Date(data.checkIn).toLocaleString()}`,
                `Booked Checkout Time: ${new Date(data.expectedCheckOut).toLocaleString()}`,
                `Expected Duration: ${data.expectedStay}`,
                `Expected Fee: BDT ${data.expectedFee}`,
                "",
                `Actual CheckOut Time: ${new Date(data.actualCheckOut).toLocaleString()}`,
                `Total Stay: ${data.totalStay}`,                
                "",
                `Overstay Duration: ${data.overstayDuration}`,
                `Received Grace Period: ${data.receivedGracePeriod || "0 minutes"}`,                
                `Penalized Duration: ${data.penalizedDuration}`,
                `Penalty Fee: BDT ${data.penaltyFee}`,
                "",
                `Amount Paid: BDT ${data.amountPaid}`             
                
            ].join("\n");
        }

        showReceiptModal(data.receiptType || "Parking Receipt", receiptMessage);

    } catch (err) {
        alert("Connection Error.");
    }
}


// ==========================================
// 6. THE "BYE-BYE" LOGIC (LOGOUT)
// ==========================================
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', async () => {

    const confirmLogout = confirm("Log out now?");

    if (!confirmLogout) {
        return;
    }

    // When we logout, we clear our role so the next person can't see our stuff
    //localStorage.removeItem('userRole'); 

    // When we logout, we clear our saved login info
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    clearAllMessages();

    window.location.hash = "login";  // This tells the browser: "When you reload, go straight to #login"
    window.location.reload();     // This clears the screen!
});

// ==========================================
// 7. THE "WHO IS ALLOWED?" LOGIC (PERMISSIONS)
// ==========================================

function checkPermissions() {
    const role = localStorage.getItem('userRole');
    
    // Elements from your file
    const navSignup = document.getElementById('nav-signup-link');
    const navLogin = document.getElementById('nav-login-link');
    const logoutBtn = document.getElementById('logout-btn');
    const authContainer = document.querySelector('.auth-container');
    const adminDashboard = document.getElementById('admin-dashboard');

    // --- CASE A: LOGGED OUT ---
    if (!role) {
        if (navSignup) navSignup.classList.remove('hidden-section');
        if (navLogin) navLogin.classList.remove('hidden-section');
        if (logoutBtn) logoutBtn.classList.add('hidden-section');

        // Show your cards with your original 120px margin
        if (authContainer) {
            authContainer.classList.remove('hidden-section');
            authContainer.classList.remove('dashboard-active');
        }
        if (adminDashboard) adminDashboard.classList.add('hidden-section');
        return; 
    }

    // --- CASE B: LOGGED IN ---
    // 1. Hide Navbar buttons
    if (navSignup) navSignup.classList.add('hidden-section');
    if (navLogin) navLogin.classList.add('hidden-section');
    if (logoutBtn) logoutBtn.classList.remove('hidden-section');

    // 2. Hide Auth Container and REMOVE the 120px gap
    if (authContainer) {
        authContainer.classList.add('hidden-section');
        authContainer.classList.add('dashboard-active'); // Prepares it for when it's hidden
    }

    // 3. Show Dashboard
    if (role === 'FinanceAdmin' || role === 'ParkingManager') {
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden-section');
            // This pulls the dashboard up so the gap disappears
            adminDashboard.style.marginTop = "20px"; 
        }
    }
}


// ==========================================
// 8. ANALYTICS REPORT (FEATURE 18)
// ==========================================

async function updateRevenueCurrency() {
    const currencySelector = document.getElementById('currency-selector');
    const convertedRevenue = document.getElementById('converted-revenue');

    if (!currencySelector || !convertedRevenue) return;

    const selectedCurrency = currencySelector.value;

    try {
        const response = await fetch(`http://localhost:5000/api/finance/revenue-report?target=${selectedCurrency}`);
        const data = await response.json();

        if (!data.success) {
            convertedRevenue.innerText = data.message || "Could not convert revenue.";
            return;
        }

        if (selectedCurrency === "BDT") {
            convertedRevenue.innerText = "Showing local currency";
        } else {
            convertedRevenue.innerText = `≈ ${data.convertedTotal} ${data.currency}`;
        }

    } catch (err) {
        convertedRevenue.innerText = "Currency conversion failed.";
    }
}


// ==========================================
// 9. PAGE SWITCHER LOGIC
// ==========================================

const signupCard = document.getElementById('signup-card');
const loginCard = document.getElementById('login-card');
const navSignup = document.getElementById('nav-signup-link');
const navLogin = document.getElementById('nav-login-link');
const adminDashboard = document.getElementById('admin-dashboard');

// 1. Navbar Login Click
navLogin.addEventListener('click', () => {
    // SAFE GUARD: If someone is logged in, do nothing!
    if (localStorage.getItem('userRole')) return; 
    //Clear ALL messages when switching
    clearAllMessages();
    signupCard.classList.add('hidden-section');
    loginCard.classList.remove('hidden-section');
    
    // Add this line to hide the "Ghost" dashboard
    if (adminDashboard) adminDashboard.classList.add('hidden-section');

    window.location.hash = "login"; // Adds #login to your URL
    handleRouting();
});

// 2. Navbar Sign Up Click
navSignup.addEventListener('click', () => {
    // 🛡️ SAFE GUARD: If someone is logged in, do nothing!    
    if (localStorage.getItem('userRole')) return;

    //Clear ALL messages when switching 
    clearAllMessages();
    loginCard.classList.add('hidden-section');
    signupCard.classList.remove('hidden-section');
    
    // Add this line to hide the "Ghost" dashboard
    if (adminDashboard) adminDashboard.classList.add('hidden-section');

    window.location.hash = "signup"; // Adds #signup to your URL
    handleRouting();
});


function clearAllMessages() {
    // 1. Clear the top text
    responseMsg.innerText = ""; 
    
    // 2. Find EVERY message and remove them all at once
    const allMessages = document.querySelectorAll('.signup-error, .login-error');
    allMessages.forEach(msg => msg.remove());
}

// ==========================================
// 10. PAGE ROUTING (THE "REMEMBERER")
// ==========================================
function handleRouting() {
    const role = localStorage.getItem('userRole');
    const signupCard = document.getElementById('signup-card');
    const loginCard = document.getElementById('login-card');

    // 1. If someone is ALREADY logged in, keep cards hidden and stop
    if (role) {
        if (signupCard) signupCard.classList.add('hidden-section');
        if (loginCard) loginCard.classList.add('hidden-section');

        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden-section');
            adminDashboard.style.marginTop = "20px"
        }

        return; 
    }

    // 2. Look at the URL hash to decide which card to show
    if (window.location.hash === "#login") {
        // If the URL is exactly .../#login, show Login
        if (signupCard) signupCard.classList.add('hidden-section');
        if (loginCard) loginCard.classList.remove('hidden-section');
        console.log("Routing to: Login");
    } 
    else {
        // DEFAULT: For everything else (including #signup or first open), show Signup
        // This makes Signup the "Home Page"
        if (loginCard) loginCard.classList.add('hidden-section');
        if (signupCard) signupCard.classList.remove('hidden-section');
        console.log("Routing to: Signup (Default)");
    }
}

// We tell the browser: "Check the URL every time you finish loading"
window.addEventListener('load', () => {
    handleRouting();
    checkPermissions();
});

// We also tell it: "Check the URL if the user clicks a back/forward button"
window.addEventListener('hashchange', () => {
    handleRouting();
    checkPermissions();
});


const displayInput = document.getElementById('vehicleType-select');
const dropdownList = document.getElementById('vehicle-type-dropdown');

// Vehicle type dropdown listener
if (dropdownList && displayInput) {
    dropdownList.addEventListener('change', () => {
        displayInput.value = dropdownList.options[dropdownList.selectedIndex].text;
        console.log("Vehicle selected:", displayInput.value);
    });
}


// Parking type filter listener
const parkingFilter = document.getElementById('parking-filter');

if (parkingFilter) {
    parkingFilter.addEventListener('change', updateActivityTable);                  // When the parking type dropdown changes, reload the table.
}

// Status filter listener
const statusFilter = document.getElementById('status-filter');

if (statusFilter) {
    statusFilter.addEventListener('change', updateActivityTable);                    // When the status dropdown changes, reload the table.
}

// Vehicle filter listener
const vehicleFilter = document.getElementById('vehicle-filter');

if (vehicleFilter) {
    vehicleFilter.addEventListener('change', updateActivityTable);                  // When the vehicle dropdown changes, reload the table.
}

// From Date filter listener
const fromDateFilter = document.getElementById('from-date-filter');   

if (fromDateFilter) {                                                          
    fromDateFilter.addEventListener('change', updateActivityTable);                // When From Date changes, refresh the table.
}

// To Date filter listener
const toDateFilter = document.getElementById('to-date-filter');

if (toDateFilter) {
    toDateFilter.addEventListener('change', updateActivityTable);                // When To Date changes, refresh the table.
}

// Row limit filter listener
const limitFilter = document.getElementById('limit-filter');

if (limitFilter) {
    limitFilter.addEventListener('change', updateActivityTable);             // When user changes Show 10 / Show 20 / Show All, refreshes the table.
}

// Currency Type filter listener
const currencySelector = document.getElementById('currency-selector');

if (currencySelector) {
    currencySelector.addEventListener('change', updateRevenueCurrency);
}

function setDefaultDateFilters() {  
    const today = new Date();                  // Today's date

    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);    // Current year, January 01

    // Helper function: HTML date input needs format like "2026-05-07"
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    // Put January 01 of this year into From Date
    if (fromDateFilter && !fromDateFilter.value) {
        fromDateFilter.value = formatDateForInput(firstDayOfYear);
    }

    // Put today into To Date
    if (toDateFilter && !toDateFilter.value) {
        toDateFilter.value = formatDateForInput(today);
    }
}




//Parking type dropdown listener
const parkingTypeInput = document.getElementById('parkingType-select');
const parkingTypeDropdown = document.getElementById('parking-type-dropdown');
const bookingTimeSection = document.getElementById('booking-time-section');


function updateBookingTimeVisibility() {
    if (!parkingTypeInput || !bookingTimeSection) return;

    // The visible box may say "Booking". But the secret/code value should say "Booked". So we use dataset.value first. Example: "Booked" or "WalkIn"
    const parkingTypeValue = parkingTypeInput.dataset.value || parkingTypeInput.value;

    // If the real code value is "Booked", show the date/time boxes.
    if (parkingTypeValue === "Booked") {
        bookingTimeSection.style.display = "flex";             //bookingTimeSection.style.display = "";  OR   //bookingTimeSection.style.display = "block";

    } else {
        bookingTimeSection.style.display = "none";             // If it is WalkIn or empty, hide the date/time boxes.
    }
}



// Hide/show when page first loads
updateBookingTimeVisibility();

// Hide/show when dropdown changes
if (parkingTypeDropdown && parkingTypeInput && bookingTimeSection) {
    parkingTypeDropdown.addEventListener('change', () => {
        parkingTypeInput.value = parkingTypeDropdown.options[parkingTypeDropdown.selectedIndex].text; // Put the pretty text in the box. Example: user sees "Walk-in"
        parkingTypeInput.dataset.value = parkingTypeDropdown.value;       // Store the code-friendly value secretly. Example: JavaScript remembers "WalkIn"
        //parkingTypeInput.value = parkingTypeDropdown.value;
        updateBookingTimeVisibility();
    });
}

// Final existing lines

// We check who is logged in every time the page loads
checkPermissions();

// We tell the table to show itself as soon as the page opens!
setDefaultDateFilters();

// We tell the table to show itself as soon as the page opens!
if (localStorage.getItem('userRole')) {
    updateActivityTable();
}
