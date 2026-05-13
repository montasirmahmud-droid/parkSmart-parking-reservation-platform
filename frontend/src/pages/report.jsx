import { useEffect, useState } from "react";
import API_BASE_URL from "../api";

function Report({ backToDashboard }) {
  const [allLogs, setAllLogs] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [filterMessage, setFilterMessage] = useState("Showing all records.");
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedTime, setGeneratedTime] = useState("Loading report...");

  // "" means show the 💱 placeholder, but still display BDT amount by default
  const [currency, setCurrency] = useState("");
  const [convertedRevenueText, setConvertedRevenueText] = useState("");

  // This makes React behave like your old report.html:
  // old file had <body class="report-page">
  useEffect(() => {
    document.body.classList.add("report-page");

    return () => {
      document.body.classList.remove("report-page");
    };
  }, []);

  function safeNumber(value) {
    return Number(value) || 0;
  }

  function getShortRecordId(log) {
    if (!log._id) return "N/A";
    return "#" + log._id.slice(-6);
  }

  function formatBDT(amount) {
    const roundedAmount = Math.round(safeNumber(amount));
    const moneyText = String(roundedAmount).padStart(2, "0");
    return `BDT ${moneyText}`;
  }

  function getCustomerText(log) {
    if (log.userId && typeof log.userId === "object") {
      return log.userId.username || log.userId.email || log.userId._id || "Customer";
    }

    return log.userId || "Customer";
  }

  function formatReportDate(dateValue) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatParkingType(parkingType) {
    if (parkingType === "WalkIn") return "Walk-in";
    if (parkingType === "Booked") return "Booked";
    return parkingType || "N/A";
  }

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

  function getDurationText(log) {
    const hours = getDurationHours(log);

    if (hours === null || hours === undefined || isNaN(hours)) {
      return "00h 00m";
    }

    const totalMinutes = Math.max(0, Math.round(hours * 60));
    const fullHours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const paddedHours = String(fullHours).padStart(2, "0");
    const paddedMinutes = String(minutes).padStart(2, "0");

    return `${paddedHours}h ${paddedMinutes}m`;
  }

  const filteredLogs = allLogs.filter((log) => {
    if (appliedFromDate) {
      const from = new Date(appliedFromDate);
      from.setHours(0, 0, 0, 0);

      const recordDate = new Date(log.entryTime);
      if (recordDate < from) return false;
    }

    if (appliedToDate) {
      const to = new Date(appliedToDate);
      to.setHours(23, 59, 59, 999);

      const recordDate = new Date(log.entryTime);
      if (recordDate > to) return false;
    }

    return true;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    return b._id.localeCompare(a._id);
  });

  const totalRevenueBDT = sortedLogs.reduce((sum, log) => {
    return sum + safeNumber(log.totalFee);
  }, 0);

  const totalCarsServed = sortedLogs.filter((log) => {
    return log.status !== "Cancelled";
  }).length;

  const durationValues = sortedLogs
    .map((log) => getDurationHours(log))
    .filter((hours) => hours > 0);

  const averageStay =
    durationValues.length > 0
      ? durationValues.reduce((sum, hours) => sum + hours, 0) / durationValues.length
      : 0;

  function getMostUsedVehicle() {
    if (sortedLogs.length === 0) return "N/A";

    const vehicleCount = {};

    sortedLogs.forEach((log) => {
      const vehicle = log.vehicleType || "Unknown";
      vehicleCount[vehicle] = (vehicleCount[vehicle] || 0) + 1;
    });

    let mostUsedVehicle = "N/A";
    let highestCount = 0;

    Object.keys(vehicleCount).forEach((vehicle) => {
      if (vehicleCount[vehicle] > highestCount) {
        highestCount = vehicleCount[vehicle];
        mostUsedVehicle = vehicle;
      }
    });

    return mostUsedVehicle;
  }

  const mostUsedVehicle = getMostUsedVehicle();

  const loadRevenueReport = async () => {
    try {
      setGeneratedTime(
        `Generated on ${new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      );

      const response = await fetch(`${API_BASE_URL}/finance/activity-log`);
      const logs = await response.json();

      if (!Array.isArray(logs)) {
        setErrorMessage("Report data was not in the expected format.");
        setAllLogs([]);
        return;
      }

      setAllLogs(logs);
      setFilterMessage(`Showing all ${logs.length} records.`);
      setErrorMessage("");
    } catch (error) {
      setGeneratedTime("Report failed to load.");
      setErrorMessage("Could not connect to the backend server.");
      setAllLogs([]);
    }
  };

  useEffect(() => {
    loadRevenueReport();
  }, []);

  // This keeps the selected currency even after date filter reset.
  // If date filter changes the total, it recalculates using the same currency.
  useEffect(() => {
    const updateConvertedRevenue = async () => {
      if (!currency || currency === "BDT") {
        setConvertedRevenueText(formatBDT(totalRevenueBDT));
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/finance/revenue-report?target=${currency}`
        );

        const data = await response.json();

        if (!data.success) {
          throw new Error("Currency conversion failed.");
        }

        const originalTotal =
          Number(String(data.originalTotal || data.total).replace(/[^\d.-]/g, "")) || 0;

        const convertedTotal =
          Number(String(data.convertedTotal).replace(/[^\d.-]/g, "")) || 0;

        if (originalTotal <= 0) {
          setConvertedRevenueText(`${currency} 0.00`);
          return;
        }

        const rate = convertedTotal / originalTotal;
        const convertedCurrentTotal = totalRevenueBDT * rate;

        setConvertedRevenueText(`${currency} ${convertedCurrentTotal.toFixed(2)}`);
      } catch (error) {
        // Do NOT reset currency here.
        // Keep selected currency, but show BDT amount safely if conversion fails.
        setConvertedRevenueText(formatBDT(totalRevenueBDT));
      }
    };

    updateConvertedRevenue();
  }, [currency, totalRevenueBDT]);

  const applyDateFilter = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (from > to) {
        setErrorMessage("⚠️ From Date cannot be after To Date.");
        return;
      }
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setErrorMessage("");

    const filteredCount = allLogs.filter((log) => {
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);

        const recordDate = new Date(log.entryTime);
        if (recordDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        const recordDate = new Date(log.entryTime);
        if (recordDate > to) return false;
      }

      return true;
    }).length;

    if (fromDate && toDate && fromDate === toDate) {
      setFilterMessage(`Report Date: ${fromDate}. Showing ${filteredCount} records.`);
    } else if (fromDate && toDate) {
      setFilterMessage(`Date Range: ${fromDate} to ${toDate}. Showing ${filteredCount} records.`);
    } else if (fromDate) {
      setFilterMessage(`Showing ${filteredCount} records from ${fromDate} onward.`);
    } else if (toDate) {
      setFilterMessage(`Showing ${filteredCount} records up to ${toDate}.`);
    } else {
      setFilterMessage(`Showing all ${filteredCount} records.`);
    }
  };

  const resetDateFilter = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
    setErrorMessage("");
    setFilterMessage(`Showing all ${allLogs.length} records.`);
  };

  const updateSummaryCurrency = (selectedCurrency) => {
    setCurrency(selectedCurrency);
  };

  const handlePrint = () => {
    window.scrollTo(0, 0);

    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="report-page">
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body::before,
            body::after,
            .bg-icon-car,
            .bg-icon-park,
            .navbar,
            .nav-buttons,
            .no-print,
            #apply-report-filter,
            #reset-report-filter,
            .report-filter-bar {
              display: none !important;
            }

            .container,
            .report-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .report-page-card {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 24px !important;
              box-shadow: none !important;
              border: none !important;
            }

            .daily-report-summary-grid {
              display: grid !important;
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
              page-break-inside: avoid !important;
            }

            .daily-report-table-wrapper {
              margin-top: 24px !important;
              overflow: visible !important;
            }

            #daily-report-table {
              width: 100% !important;
              border-collapse: collapse !important;
              font-size: 10px !important;
            }

            #daily-report-table th,
            #daily-report-table td {
              padding: 6px !important;
              border-bottom: 1px solid #ddd !important;
            }

            @page {
              size: landscape;
              margin: 12mm;
            }
          }
        `}
      </style>

      <nav className="navbar">
        <span className="logo">ParkSmart Revenue Report 📊</span>

        <div className="nav-buttons">
          <button className="btn-nav" onClick={backToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container report-container">
        <div className="card table-card report-page-card">
          <div className="report-page-header">
            <div>
              <h2>Detailed Revenue Report</h2>

              <p id="report-generated-time" className="table-result-message">
                {generatedTime}
              </p>
            </div>

            <button className="table-action-btn no-print" onClick={handlePrint}>
              Print
            </button>
          </div>

          <div className="report-filter-bar">
            <div className="report-filter-group">
              <label htmlFor="report-from-date">From Date</label>
              <input
                type="date"
                id="report-from-date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div className="report-filter-group">
              <label htmlFor="report-to-date">To Date</label>
              <input
                type="date"
                id="report-to-date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>

            <button
              id="apply-report-filter"
              className="table-action-btn"
              onClick={applyDateFilter}
            >
              Apply
            </button>

            <button
              id="reset-report-filter"
              className="table-action-btn"
              onClick={resetDateFilter}
            >
              Reset
            </button>
          </div>

          <p id="report-filter-message" className="table-result-message">
            {filterMessage}
          </p>

          <div className="daily-report-summary-grid">
            <div className="daily-report-mini-card">
              <div className="summary-card-top">
                <span className="stat-label">Total Revenue</span>

                <div className="summary-currency-wrap">
                  <select
                    id="summary-currency-selector"
                    className="summary-currency-selector"
                    value={currency}
                    onChange={(event) => updateSummaryCurrency(event.target.value)}
                  >
                    <option value="" disabled>
                      💱
                    </option>
                    <option value="BDT">BDT</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>

                  <span className="summary-currency-arrow"></span>
                </div>
              </div>

              <span id="report-total-revenue" className="daily-report-value">
                {convertedRevenueText || formatBDT(totalRevenueBDT)}
              </span>
            </div>

            <div className="daily-report-mini-card">
              <span className="stat-label">Total Cars Served</span>

              <span id="report-total-cars" className="daily-report-value">
                {totalCarsServed}
              </span>
            </div>

            <div className="daily-report-mini-card">
              <span className="stat-label">Average Stay</span>

              <span id="report-average-stay" className="daily-report-value">
                {averageStay.toFixed(1)} hour(s)
              </span>
            </div>

            <div className="daily-report-mini-card">
              <span className="stat-label">Most Used Vehicle</span>

              <span id="report-most-used-vehicle" className="daily-report-value">
                {mostUsedVehicle}
              </span>
            </div>
          </div>

          <p id="report-error-message" className="status-text">
            {errorMessage}
          </p>

          <div className="table-wrapper daily-report-table-wrapper">
            <table id="daily-report-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Vehicle Type</th>
                  <th>Parking Type</th>
                  <th>Duration</th>
                  <th>Expected Fee</th>
                  <th>Penalty Fee</th>
                  <th>Cancellation Fee</th>
                  <th>Total Paid</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody id="daily-report-body">
                {sortedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="11">No parking records found for this filter.</td>
                  </tr>
                ) : (
                  sortedLogs.map((log) => (
                    <tr key={log._id}>
                      <td>{getShortRecordId(log)}</td>
                      <td>{formatReportDate(log.entryTime)}</td>
                      <td>{getCustomerText(log)}</td>
                      <td>{log.vehicleType || "N/A"}</td>
                      <td>{formatParkingType(log.parkingType)}</td>
                      <td>{getDurationText(log)}</td>
                      <td>{formatBDT(log.expectedFee)}</td>
                      <td>{formatBDT(log.penaltyFee)}</td>
                      <td>{formatBDT(log.cancellationFee)}</td>
                      <td>{formatBDT(log.totalFee)}</td>
                      <td>{log.status || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;