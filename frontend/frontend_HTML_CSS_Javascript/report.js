// ==========================================
// PARKSMART REVENUE REPORT PAGE
// ==========================================

// Grab the summary card elements
const reportTotalRevenue = document.getElementById('report-total-revenue');
const summaryCurrencySelector = document.getElementById("summary-currency-selector");    //Dropdown inside the Total Revenue card
const reportTotalCars = document.getElementById('report-total-cars');
const reportAverageStay = document.getElementById('report-average-stay');
const reportMostUsedVehicle = document.getElementById('report-most-used-vehicle');

// Grab the table body
const dailyReportBody = document.getElementById('daily-report-body');

// Grab text areas
const reportGeneratedTime = document.getElementById('report-generated-time');
const reportErrorMessage = document.getElementById('report-error-message');

// Grab filter elements
const reportFromDate = document.getElementById('report-from-date');
const reportToDate = document.getElementById('report-to-date');
const applyReportFilterBtn = document.getElementById('apply-report-filter');
const resetReportFilterBtn = document.getElementById('reset-report-filter');
const reportFilterMessage = document.getElementById('report-filter-message');


// This variable will store ALL logs after we fetch them once.
// Then filters can reuse this data without asking backend again.
let allReportLogs = [];

// This keeps the current total revenue in original BDT. Remembers the real BDT total before converting.”
let currentTotalRevenueBDT = 0;


// This makes MongoDB _id shorter for the report table.
// Example: "663c0bb4e281fbb4f2abc123" becomes "#abc123" , not a color though T.T
function getShortRecordId(log) {
    if (!log._id) {
        return "N/A";
    }

    return "#" + log._id.slice(-6);
}

// This protects number math. If something is missing, it becomes 0.
function safeNumber(value) {
    return Number(value) || 0;
}

// This pulls only the number out of money text. Example: "USD 300.25" becomes 300.25
function getNumberFromMoney(value) {
    return Number(String(value).replace(/[^\d.-]/g, "")) || 0;
}

// This formats money nicely. Example: 500 becomes "BDT 500"
function formatBDT(amount) {
    const roundedAmount = Math.round(safeNumber(amount));

    const moneyText = String(roundedAmount).padStart(2, "0");

    return `BDT ${moneyText}`;
}

// Your backend populates user like this:      .populate('userId', 'username')
function getCustomerText(log) {
    if (log.userId && typeof log.userId === "object") {
        return log.userId.username || log.userId.email || log.userId._id || "Customer";
    }

    return log.userId || "Customer";
}


// Format date for table. Example: May 8, 2026
function formatReportDate(dateValue) {
    if (!dateValue) {
        return "N/A";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
        return "N/A";
    }

    return date.toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}


// Calculate stay duration in hours.
function getDurationHours(log) {
    if (log.entryTime && log.actualExitTime) {
        const entry = new Date(log.entryTime);
        const exit = new Date(log.actualExitTime);

        const differenceInMs = exit - entry;
        const differenceInHours = differenceInMs / (1000 * 60 * 60);

        if (differenceInHours > 0) {
            return differenceInHours;
        }
    }

    return safeNumber(log.expectedDurationInHours);
}


// Convert duration number to text.
function getDurationText(log) {
    const hours = getDurationHours(log);

    // If duration is missing or broken, show 00h 00m
    if (hours === null || hours === undefined || isNaN(hours)) {
        return "00h 00m";
    }

    // Convert hours into total minutes. Example: 1.5 hours becomes 90 minutes
    const totalMinutes = Math.max(0, Math.round(hours * 60));

    const fullHours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    // Make hours always 2 digits
    const paddedHours = String(fullHours).padStart(2, "0");

    // Make minutes always 2 digits
    const paddedMinutes = String(minutes).padStart(2, "0");

    return `${paddedHours}h ${paddedMinutes}m`;
}

// Backend stores "WalkIn", but humans should see "Walk-in".
function formatParkingType(parkingType) {
    if (parkingType === "WalkIn") {
        return "Walk-in";
    }

    if (parkingType === "Booked") {
        return "Booked";
    }

    return parkingType || "N/A";
}

// This function draws the report on the page.
// It does NOT fetch data. It only receives logs and displays them.
function renderRevenueReport(logs, messageText) {

    // Update filter message
    reportFilterMessage.innerText = messageText;

    // If no logs match, show empty report.
    if (!Array.isArray(logs) || logs.length === 0) {
        reportTotalRevenue.innerText = "BDT 0";
        reportTotalCars.innerText = "0";
        reportAverageStay.innerText = "0 hour(s)";
        reportMostUsedVehicle.innerText = "N/A";

        dailyReportBody.innerHTML = `
            <tr>
                <td colspan="11">No parking records found for this filter.</td>
            </tr>
        `;

        return;
    }

    // Sort newest records first using MongoDB _id.
    const sortedLogs = [...logs].sort((a, b) => b._id.localeCompare(a._id));

    // Start summary numbers from zero.
    let totalRevenue = 0;
    let totalCarsServed = 0;
    let totalDurationHours = 0;
    let durationCount = 0;

    // This object counts vehicle types.
    const vehicleCount = {};

    // Loop through each parking record.
    sortedLogs.forEach((log) => {
        const totalFee = safeNumber(log.totalFee);

        // Your backend already puts cancellation fee into totalFee
        // when the record is Cancelled.
        totalRevenue += totalFee;

        // Cancelled bookings are not counted as cars served.
        if (log.status !== "Cancelled") {
            totalCarsServed++;
        }

        // Add duration for average stay.
        const durationHours = getDurationHours(log);

        if (durationHours > 0) {
            totalDurationHours += durationHours;
            durationCount++;
        }

        // Count vehicle type.
        const vehicleType = log.vehicleType || "Unknown";

        if (!vehicleCount[vehicleType]) {
            vehicleCount[vehicleType] = 0;
        }

        vehicleCount[vehicleType]++;
    });

    // Calculate average stay.
    let averageStay = 0;

    if (durationCount > 0) {
        averageStay = totalDurationHours / durationCount;
    }

    // Find most used vehicle type.
    let mostUsedVehicle = "N/A";
    let highestVehicleCount = 0;

    for (let vehicle in vehicleCount) {
        if (vehicleCount[vehicle] > highestVehicleCount) {
            highestVehicleCount = vehicleCount[vehicle];
            mostUsedVehicle = vehicle;
        }
    }



    currentTotalRevenueBDT = totalRevenue;      // Save the real BDT total first
    summaryCurrencySelector.value = "BDT";     // Whenever the report redraws, go back to BDT by default

    // Put summary values into the cards.
    reportTotalRevenue.innerText = formatBDT(currentTotalRevenueBDT);    
    reportTotalCars.innerText = totalCarsServed;
    reportAverageStay.innerText = `${averageStay.toFixed(1)} hour(s)`;
    reportMostUsedVehicle.innerText = mostUsedVehicle;

    // Create table rows.
    dailyReportBody.innerHTML = sortedLogs.map((log) => {
        const expectedFee = safeNumber(log.expectedFee);
        const penaltyFee = safeNumber(log.penaltyFee);
        const cancellationFee = safeNumber(log.cancellationFee);
        const totalPaid = safeNumber(log.totalFee);

        return `
            <tr>
                <td>${getShortRecordId(log)}</td>
                <td>${formatReportDate(log.entryTime)}</td>
                <td>${getCustomerText(log)}</td>
                <td>${log.vehicleType || "N/A"}</td>
                <td>${formatParkingType(log.parkingType)}</td>
                <td>${getDurationText(log)}</td>
                <td>${formatBDT(expectedFee)}</td>
                <td>${formatBDT(penaltyFee)}</td>
                <td>${formatBDT(cancellationFee)}</td>
                <td>${formatBDT(totalPaid)}</td>
                <td>${log.status || "N/A"}</td>
            </tr>
        `;
    }).join("");
}


// This function applies From Date and To Date filters.
function applyDateFilter() {
    const fromValue = reportFromDate.value;
    const toValue = reportToDate.value;

    // Stop if From Date is after To Date. Example: From May 10 to May 8 is impossible.    
    if (fromValue && toValue) {
        const fromDate = new Date(fromValue);
        const toDate = new Date(toValue);

        if (fromDate > toDate) {
            reportErrorMessage.innerText = "⚠️ From Date cannot be after To Date.";
            return;
        }
    }

    // Start with all records.
    let filteredLogs = allReportLogs;

    // Convert From Date into start of that day.
    if (fromValue) {
        const fromDate = new Date(fromValue);
        fromDate.setHours(0, 0, 0, 0);

        filteredLogs = filteredLogs.filter((log) => {
            const recordDate = new Date(log.entryTime);
            return recordDate >= fromDate;
        });
    }

    // Convert To Date into end of that day.
    if (toValue) {
        const toDate = new Date(toValue);
        toDate.setHours(23, 59, 59, 999);

        filteredLogs = filteredLogs.filter((log) => {
            const recordDate = new Date(log.entryTime);
            return recordDate <= toDate;
        });
    }

    // If user picked both dates, check if From is after To.
    if (fromValue && toValue) {
        const fromDate = new Date(fromValue);
        const toDate = new Date(toValue);

        if (fromDate > toDate) {
            reportErrorMessage.innerText = "From Date cannot be after To Date.";
            return;
        }
    }

    // Clear old error if filter is okay.
    reportErrorMessage.innerText = "";

    // Make a friendly message.
    let messageText = "";

    //fromValue && toValue && fromValue === toValue  means: “if both boxes(from & to) are filled and both dates are the same.”
    if (fromValue && toValue && fromValue === toValue) {               
        messageText = `Report Date: ${fromValue}. Showing ${filteredLogs.length} records.`;
    } else if (fromValue && toValue) {
        messageText = `Date Range: ${fromValue} to ${toValue}. Showing ${filteredLogs.length} records.`;
    } else if (fromValue) {
        messageText = `Showing ${filteredLogs.length} records from ${fromValue} onward.`;
    } else if (toValue) {
        messageText = `Showing ${filteredLogs.length} records up to ${toValue}.`;
    } else {
        messageText = `Showing all ${filteredLogs.length} records.`;
    }

    // Draw the filtered report.
    renderRevenueReport(filteredLogs, messageText);
}


// This function resets filters and shows all records again.
function resetDateFilter() {
    reportFromDate.value = "";
    reportToDate.value = "";
    reportErrorMessage.innerText = "";

    renderRevenueReport(
        allReportLogs,
        `Showing all ${allReportLogs.length} records.`
    );
}


// Main function.
// This runs when report.html opens.
async function loadRevenueReport() {
    try {
        // Show generated time.
        reportGeneratedTime.innerText = `Generated on ${new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        })}`;        

        // Ask backend for activity logs.
        const response = await fetch('http://localhost:5000/api/finance/activity-log');

        // Convert response to JavaScript data.
        const logs = await response.json();

        // If backend did not send an array, stop safely.
        if (!Array.isArray(logs)) {
            dailyReportBody.innerHTML = `
                <tr>
                    <td colspan="11">Could not load report data.</td>
                </tr>
            `;

            reportErrorMessage.innerText = "Report data was not in the expected format.";
            return;
        }

        // Save all logs in our global variable.
        allReportLogs = logs;

        // Show all records first.
        renderRevenueReport(
            allReportLogs,
            `Showing all ${allReportLogs.length} records.`
        );

    } catch (err) {
        console.error("Revenue report error:", err);

        reportGeneratedTime.innerText = "Report failed to load.";
        reportErrorMessage.innerText = "Could not connect to the backend server.";

        dailyReportBody.innerHTML = `
            <tr>
                <td colspan="11">Could not generate revenue report.</td>
            </tr>
        `;
    }
}


// This runs when user changes the Total Revenue currency dropdown
async function updateSummaryCurrency() {
    const selectedCurrency = summaryCurrencySelector.value;

    // If user chooses BDT, just shows the original BDT amount again
    if (selectedCurrency === "BDT") {
        reportTotalRevenue.innerText = formatBDT(currentTotalRevenueBDT);
        return;
    }

    try {
        // This uses the existing backend route.
        const response = await fetch(`http://localhost:5000/api/finance/revenue-report?target=${selectedCurrency}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error("Currency conversion failed.");
        }

        // Backend gives: original total in BDT and gets converted total in USD/EUR
        const originalTotal = getNumberFromMoney(data.originalTotal || data.total);
        const convertedTotal = getNumberFromMoney(data.convertedTotal);

        // Example: originalTotal = 31625 BDT. convertedTotal = 300 USD. rate = 300 / 31625
        const rate = convertedTotal / originalTotal;

        // Now the current visible report total is converted
        const convertedCurrentTotal = currentTotalRevenueBDT * rate;

        reportTotalRevenue.innerText = `${selectedCurrency} ${convertedCurrentTotal.toFixed(2)}`;       // Shows converted amount

    } catch (error) {
        console.error("Summary currency error:", error);

        // If anything breaks, safely goes back to BDT
        summaryCurrencySelector.value = "BDT";
        reportTotalRevenue.innerText = formatBDT(currentTotalRevenueBDT);
    }
}


// When Apply Filter is clicked, filters the report.
applyReportFilterBtn.addEventListener('click', applyDateFilter);


// When Reset is clicked, clears filters and shows all records.
resetReportFilterBtn.addEventListener('click', resetDateFilter);

// When user changes BDT / USD / EUR, updates only the Total Revenue card
summaryCurrencySelector.addEventListener("change", updateSummaryCurrency);


// Run this page when it opens.
loadRevenueReport();
