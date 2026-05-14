import { useEffect, useRef, useState } from "react";
import API_BASE_URL from "../api";

function FinanceDashboard({ openReport }) {
  const DEFAULT_GRACE_PERIOD_MINUTES = 15;
  const BOOKING_PRE_HOUR = 1;

  // Wait 0.8 seconds before allowing dropdown-click reset
  const FILTER_CLEAR_DELAY = 800;
  const filterLastChangedTime = useRef({});

  function handleFilterChange(filterName, setFilter, value) {
    filterLastChangedTime.current[filterName] = Date.now();
    setFilter(value);
  }

  function resetDropdownOnSecondClick(event, filterName, currentValue, setFilter) {
    const alreadySelectedSomething = currentValue !== "";
    const enoughTimePassed =
      Date.now() - (filterLastChangedTime.current[filterName] || 0) >
      FILTER_CLEAR_DELAY;

    // If a filter is already selected, clicking the dropdown again later clears it
    if (alreadySelectedSomething && enoughTimePassed) {
      event.preventDefault();
      setFilter("");
    }
  }

  // Form states
  const [userId, setUserId] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [parkingType, setParkingType] = useState("");

  const [entryDate, setEntryDate] = useState("");
  const [exitDate, setExitDate] = useState("");

  const [entryHour, setEntryHour] = useState("12");
  const [entryMinute, setEntryMinute] = useState("0");
  const [entryPeriod, setEntryPeriod] = useState("AM");

  const [exitHour, setExitHour] = useState("12");
  const [exitMinute, setExitMinute] = useState("0");
  const [exitPeriod, setExitPeriod] = useState("AM");

  const [errorMessage, setErrorMessage] = useState("");
  const [financeMessage, setFinanceMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

   // Stat Box states
  const [convertedRevenue, setConvertedRevenue] = useState("Showing local currency");

  // Table states
  const [logs, setLogs] = useState([]);
  const [tableMessage, setTableMessage] = useState("");

  // Filter states
  const [parkingFilter, setParkingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [limitFilter, setLimitFilter] = useState("");

  // Receipt modal states
  const [receiptTitle, setReceiptTitle] = useState("Parking Receipt");
  const [receiptBody, setReceiptBody] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const showBookingTime = parkingType === "Booked";

  function makeDateTime(date, hour, minute, period) {
    let h = parseInt(hour);

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return new Date(
      `${date}T${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
    );
  }

  function formatTableDate(dateValue) {
    if (!dateValue) {
      return (
        <div className="table-date">
          <div>---</div>
        </div>
      );
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return (
        <div className="table-date">
          <div>---</div>
        </div>
      );
    }

    const dateText = date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const timeText = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <div className="table-date">
        <div>{dateText}</div>
        <div>{timeText}</div>
      </div>
    );
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

  function getStatusBadge(log) {
    if (log.status === "Booked") {
      return <span className="status-badge status-booked">📅 Booked</span>;
    }

    if (log.status === "Active") {
      if (isLogOverstay(log)) {
        return <span className="status-badge status-overstay">⚠️ Overstay</span>;
      }

      return <span className="status-badge status-active">🅿️ Parked</span>;
    }

    if (log.status === "Overstay") {
      return <span className="status-badge status-overstay">⚠️ Overstay</span>;
    }

    if (log.status === "Completed") {
      return <span className="status-badge status-paid">Paid</span>;
    }

    if (log.status === "Cancelled") {
      return <span className="status-badge status-cancelled">Cancelled</span>;
    }

    return log.status || "Unknown";
  }

  const updateActivityTable = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/activity-log`);
      const data = await response.json();

      if (!Array.isArray(data)) {
        setLogs([]);
        setTableMessage("Could not load activity records.");
        return;
      }

      data.sort((a, b) => b._id.localeCompare(a._id));
      setLogs(data);
    } catch (error) {
      setLogs([]);
      setTableMessage("Connection Error while loading activity records.");
    }
  };

  useEffect(() => {
    updateActivityTable();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (parkingFilter && parkingFilter !== "All" && log.parkingType !== parkingFilter) {
      return false;
    }

    if (statusFilter && statusFilter !== "All") {
      if (statusFilter === "Overstay") {
        if (!isLogOverstay(log)) return false;
      } else if (log.status !== statusFilter) {
        return false;
      }
    }

    if (vehicleFilter && vehicleFilter !== "All" && log.vehicleType !== vehicleFilter) {
      return false;
    }

    if (fromDateFilter) {
      const fromDate = new Date(fromDateFilter);
      fromDate.setHours(0, 0, 0, 0);

      const recordDate = new Date(log.entryTime);
      if (recordDate < fromDate) return false;
    }

    if (toDateFilter) {
      const toDate = new Date(toDateFilter);
      toDate.setHours(23, 59, 59, 999);

      const recordDate = new Date(log.entryTime);
      if (recordDate > toDate) return false;
    }

    return true;
  });

  const actualLimit = limitFilter || "10";

  const visibleLogs =
    actualLimit === "All"
      ? filteredLogs
      : filteredLogs.slice(0, Number(actualLimit));

  useEffect(() => {
    if (fromDateFilter && toDateFilter) {
      const fromDate = new Date(fromDateFilter);
      const toDate = new Date(toDateFilter);

      if (fromDate > toDate) {
        setTableMessage("⚠️ From Date cannot be after To Date.");
        return;
      }
    }

    const totalFound = filteredLogs.length;

    if (totalFound === 0) {
      setTableMessage("0 records found.");
    } else if (actualLimit === "All") {
      setTableMessage(`Total ${totalFound} records found. Showing all records:`);
    } else if (totalFound < Number(actualLimit)) {
      setTableMessage(
        `Total ${totalFound} records found. Showing all ${totalFound} records:`
      );
    } else {
      setTableMessage(`Total ${totalFound} records found. Showing ${actualLimit} records:`);
    }
  }, [
    logs,
    parkingFilter,
    statusFilter,
    vehicleFilter,
    fromDateFilter,
    toDateFilter,
    actualLimit,
    filteredLogs.length,
  ]);

  const totalRevenue = logs.reduce((sum, log) => {
    if (log.status === "Completed") {
      return sum + (log.totalFee || 0);
    }

    return sum;
  }, 0);
  
  async function updateRevenueCurrency(event) {
    const selectedCurrency = event.target.value;

    try {
      const response = await fetch(
        `${API_BASE_URL}/finance/revenue-report?target=${selectedCurrency}`
      );

      const data = await response.json();

      if (!data.success) {
        setConvertedRevenue(data.message || "Could not convert revenue.");
        return;
      }

      if (selectedCurrency === "BDT") {
        setConvertedRevenue("Showing local currency");
      } else {
        setConvertedRevenue(`≈ ${data.convertedTotal} ${data.currency}`);
      }
    } catch (error) {
      setConvertedRevenue("Currency conversion failed.");
    }
  }

  const activeCars = logs.filter(
    (log) => log.status === "Active" || log.status === "Overstay"
  ).length;

  const handleRecordEntry = async () => {
    setErrorMessage("");
    setFinanceMessage("");

    if (!userId || !vehicleType || !parkingType) {
      setErrorMessage("⚠️ Please fill in User ID, Vehicle Type, Parking Type.");
      return;
    }

    if (parkingType === "Booked" && !entryDate) {
      setErrorMessage("⚠️ Please fill in Entry Date for booking.");
      return;
    }

    if (parkingType === "Booked" && !exitDate) {
      setErrorMessage("⚠️ Please fill in Exit Date for booking.");
      return;
    }

    const entryDateTime =
      parkingType === "Booked"
        ? makeDateTime(entryDate, entryHour, entryMinute, entryPeriod)
        : null;

    const exitDateTime =
      parkingType === "Booked"
        ? makeDateTime(exitDate, exitHour, exitMinute, exitPeriod)
        : null;

    const finalEntryTime = parkingType === "WalkIn" ? new Date() : entryDateTime;

    const now = new Date();
    const bookingAllowedFrom = new Date(
      now.getTime() + BOOKING_PRE_HOUR * 60 * 60 * 1000
    );

    if (parkingType === "Booked" && entryDateTime < bookingAllowedFrom) {
      setErrorMessage(
        `⚠️ Bookings must be made at least ${BOOKING_PRE_HOUR} hour(s) before entry time.`
      );
      return;
    }

    let durationHours = null;

    if (parkingType === "Booked") {
      durationHours = (exitDateTime - entryDateTime) / (1000 * 60 * 60);

      if (durationHours <= 0) {
        setErrorMessage("⚠️ Exit time must be after entry time.");
        return;
      }
    }

    const requestBody = {
      userId,
      vehicleType,
      parkingType,
      entryTime: finalEntryTime,
      exitTime: parkingType === "Booked" ? exitDateTime : null,
      durationHours,
    };

    setIsSaving(true);

    try {
      const previewResponse = await fetch(`${API_BASE_URL}/finance/preview-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const previewData = await previewResponse.json();

      if (!previewResponse.ok) {
        setFinanceMessage(previewData.message || previewData.error || "Preview failed.");
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
          "Record Booking Entry?",
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
          previewData.walkInRule,
          "",
          "Record Walk-in Entry?",
        ].join("\n");
      }

      const confirmEntry = confirm(confirmMessage);

      if (!confirmEntry) {
        setFinanceMessage("Entry cancelled before saving.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/finance/log-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setFinanceMessage("✅ Car Entry Recorded!");
        setErrorMessage("");

        await updateActivityTable();

        setUserId("");
        setVehicleType("");
        setParkingType("");
        setEntryDate("");
        setExitDate("");
        setEntryHour("12");
        setEntryMinute("0");
        setEntryPeriod("AM");
        setExitHour("12");
        setExitMinute("0");
        setExitPeriod("AM");
      } else {
        setFinanceMessage(data.message || data.error || "Error logging entry.");
      }
    } catch (error) {
      setFinanceMessage("Connection Error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckout = async (recordId) => {
    const confirmCheckout = confirm("Check out now?");

    if (!confirmCheckout) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/finance/handle-exit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });

      const data = await response.json();

      if (response.ok) {
        const parkingTypeText =
          data.parkingType === "WalkIn" || data.parkingType === "Walk-in"
            ? "Walk-in"
            : "Booking";

        let checkoutMessage = "";

        if (data.parkingType === "WalkIn" || data.parkingType === "Walk-in") {
          checkoutMessage = [
            `User ID: ${data.customerId}`,
            `Username: ${data.customerName}`,
            "",
            `Parking Type: ${parkingTypeText}`,
            `Vehicle Type:  ${data.vehicle}`,
            `Rate per Hour: BDT ${data.hourlyRate}`,
            `Stay Duration: ${data.duration}`,
            `Total Fee: BDT ${data.finalFee}`,
          ].join("\n");
        } else {
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
            `Total Fee: BDT ${data.finalFee}`,
          ].join("\n");
        }

        setReceiptTitle("Checkout Successful!");
        setReceiptBody(checkoutMessage);
        setShowReceiptModal(true);

        await updateActivityTable();
      } else {
        alert("Error: " + (data.message || data.error || "Checkout failed."));
      }
    } catch (error) {
      alert("Connection Error.");
    }
  };

  const handleCancel = async (recordId) => {
    const confirmCancel = confirm("Cancel this booking?");
    if (!confirmCancel) return;

    try {
      const response = await fetch(`${API_BASE_URL}/finance/cancel-entry`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });

      const data = await response.json();

      if (response.ok) {
        setReceiptTitle("Booking Cancelled");
        setReceiptBody(data.message || "Booking cancelled!");
        setShowReceiptModal(true);

        await updateActivityTable();
      } else {
        alert(data.message || data.error || "Cancel failed.");
      }
    } catch (error) {
      alert("Connection Error.");
    }
  };

  const handleViewReceipt = async (recordId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/receipt/${recordId}`);
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
          `Amount Paid: BDT ${data.amountPaid}`,
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
          `Amount Paid: BDT ${data.amountPaid}`,
        ].join("\n");
      }

      setReceiptTitle(data.receiptType || "Parking Receipt");
      setReceiptBody(receiptMessage);
      setShowReceiptModal(true);
    } catch (error) {
      alert("Connection Error.");
    }
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptBody("");
  };

  return (
    <div id="admin-dashboard">
      {/* PARKING ENTRY CONTROL */}
      <div id="finance-section" className="card main-card">
        <h3>🏁 Parking Entry Control</h3>
        <p className="subtitle">Assign slot and start session timer</p>

        <div className="admin-controls">
          <input
            type="text"
            id="userId"
            placeholder="Enter User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />

          <div className="vehicle-row">
            <input
              type="text"
              id="vehicleType-select"
              placeholder="Enter Vehicle Type"
              value={vehicleType}
              readOnly
            />

            <span className="arrow-wrapper"></span>

            <select
              id="vehicle-type-dropdown"
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value)}
            >
              <option value="" disabled>
                Select Vehicle Type
              </option>
              <option value="🏍️ 2-Wheeler">🏍️ 2-Wheeler</option>
              <option value="🚗 4-Wheeler">🚗 4-Wheeler</option>
              <option value="🚛 6-Wheeler">🚛 6-Wheeler</option>
            </select>
          </div>

          <div className="parking-row">
            <input
              type="text"
              id="parkingType-select"
              placeholder="Enter Parking Type"
              value={
                parkingType === "WalkIn"
                  ? "Walk-in"
                  : parkingType === "Booked"
                  ? "Booking"
                  : ""
              }
              readOnly
            />

            <span className="arrow-wrapper"></span>

            <select
              id="parking-type-dropdown"
              value={parkingType}
              onChange={(event) => setParkingType(event.target.value)}
            >
              <option value="" disabled>
                Select Parking Type
              </option>
              <option value="WalkIn">Walk-in</option>
              <option value="Booked">Booking</option>
            </select>
          </div>

          {showBookingTime && (
            <div className="time-container" id="booking-time-section">
              <div className="time-block">
                <h4>Entry Date & Time</h4>

                <div className="date-row">
                  <input
                    type="date"
                    id="entry-date"
                    value={entryDate}
                    onChange={(event) => setEntryDate(event.target.value)}
                  />
                </div>

                <div className="clock-row">
                  <div className="select-group">
                    <select
                      id="entry-hour"
                      value={entryHour}
                      onChange={(event) => setEntryHour(event.target.value)}
                    >
                      <option value="1">01</option>
                      <option value="2">02</option>
                      <option value="3">03</option>
                      <option value="4">04</option>
                      <option value="5">05</option>
                      <option value="6">06</option>
                      <option value="7">07</option>
                      <option value="8">08</option>
                      <option value="9">09</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>

                    <select
                      id="entry-minute"
                      value={entryMinute}
                      onChange={(event) => setEntryMinute(event.target.value)}
                    >
                      <option value="0">00</option>
                      <option value="30">30</option>
                    </select>

                    <select
                      id="entry-period"
                      value={entryPeriod}
                      onChange={(event) => setEntryPeriod(event.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="time-block">
                <h4>Exit Date & Time</h4>

                <div className="date-row">
                  <input
                    type="date"
                    id="exit-date"
                    value={exitDate}
                    onChange={(event) => setExitDate(event.target.value)}
                  />
                </div>

                <div className="clock-row">
                  <div className="select-group">
                    <select
                      id="exit-hour"
                      value={exitHour}
                      onChange={(event) => setExitHour(event.target.value)}
                    >
                      <option value="1">01</option>
                      <option value="2">02</option>
                      <option value="3">03</option>
                      <option value="4">04</option>
                      <option value="5">05</option>
                      <option value="6">06</option>
                      <option value="7">07</option>
                      <option value="8">08</option>
                      <option value="9">09</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>

                    <select
                      id="exit-minute"
                      value={exitMinute}
                      onChange={(event) => setExitMinute(event.target.value)}
                    >
                      <option value="0">00</option>
                      <option value="30">30</option>
                    </select>

                    <select
                      id="exit-period"
                      value={exitPeriod}
                      onChange={(event) => setExitPeriod(event.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p id="error-message" style={{ color: "#B76E79" }}>
            {errorMessage}
          </p>

          <button
            id="log-entry-btn"
            className="btn-success"
            onClick={handleRecordEntry}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Record Entry"}
          </button>
        </div>

        <p id="finance-message" className="status-text">
          {financeMessage}
        </p>
      </div>

      {/* STATS & ANALYTICS */}
      <div className="stats-grid">
        <div id="revenue-report" className="stat-card revenue">
          <span className="stat-label">Total Revenue</span>

          <span className="stat-value">
            BDT <span id="total-revenue">{totalRevenue}</span>
          </span>

          <select id="currency-selector" className="revenue-currency-selector" onChange={updateRevenueCurrency}>
            <option value="BDT">BDT</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <p id="converted-revenue" className="converted-revenue-text">
            {convertedRevenue}
          </p>

          <button
            id="analytics-btn"
            className="btn-outline report-btn"
            onClick={openReport}
          >
            Generate Full Report
          </button>
        </div>

        <div id="counter-box" className="stat-card capacity">
          <span className="stat-label">Current Occupancy</span>
          <span className="stat-value">
            <span id="active-cars-count">{activeCars}</span> Vehicles
          </span>
        </div>
      </div>

      {/* LIVE ACTIVITY TABLE */}
      <div id="activity-log-section" className="card table-card">
        <h2>Live Parking Activity</h2>

        <div className="table-wrapper">
          <div className="table-filters">
            <select
              id="parking-filter"
              value={parkingFilter}
              onMouseDown={(event) =>
                resetDropdownOnSecondClick(
                  event,
                  "parkingFilter",
                  parkingFilter,
                  setParkingFilter
                )
              }
              onChange={(event) =>
                handleFilterChange("parkingFilter", setParkingFilter, event.target.value)
              }
            >
              <option value="" disabled>
                Parking Type
              </option>
              <option value="All">All</option>
              <option value="Booked">Booking</option>
              <option value="WalkIn">Walk-in</option>
            </select>

            <select
              id="status-filter"
              value={statusFilter}
              onMouseDown={(event) =>
                resetDropdownOnSecondClick(
                  event,
                  "statusFilter",
                  statusFilter,
                  setStatusFilter
                )
              }
              onChange={(event) =>
                handleFilterChange("statusFilter", setStatusFilter, event.target.value)
              }
            >
              <option value="" disabled>
                Status
              </option>
              <option value="All">All</option>
              <option value="Booked">Booked</option>
              <option value="Active">Parked</option>
              <option value="Completed">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Overstay">Overstay</option>
            </select>

            <select
              id="vehicle-filter"
              value={vehicleFilter}
              onMouseDown={(event) =>
                resetDropdownOnSecondClick(
                  event,
                  "vehicleFilter",
                  vehicleFilter,
                  setVehicleFilter
                )
              }
              onChange={(event) =>
                handleFilterChange("vehicleFilter", setVehicleFilter, event.target.value)
              }
            >
              <option value="" disabled>
                Vehicle Type
              </option>
              <option value="All">All</option>
              <option value="🏍️ 2-Wheeler">🏍️ 2-Wheeler</option>
              <option value="🚗 4-Wheeler">🚗 4-Wheeler</option>
              <option value="🚛 6-Wheeler">🚛 6-Wheeler</option>
            </select>

            <div className="table-date-filter-group">
              <label htmlFor="from-date-filter">From:</label>
              <input
                type="date"
                id="from-date-filter"
                value={fromDateFilter}
                onChange={(event) => setFromDateFilter(event.target.value)}
              />
            </div>

            <div className="table-date-filter-group">
              <label htmlFor="to-date-filter">To:</label>
              <input
                type="date"
                id="to-date-filter"
                value={toDateFilter}
                onChange={(event) => setToDateFilter(event.target.value)}
              />
            </div>

            <select
              id="limit-filter"
              value={limitFilter}
              onMouseDown={(event) =>
                resetDropdownOnSecondClick(
                  event,
                  "limitFilter",
                  limitFilter,
                  setLimitFilter
                )
              }
              onChange={(event) =>
                handleFilterChange("limitFilter", setLimitFilter, event.target.value)
              }
            >
              <option value="" disabled>
                Show
              </option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="All">All</option>
            </select>
          </div>

          <p id="table-result-message" className="table-result-message">
            {tableMessage}
          </p>

          <table id="activity-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Vehicle Type</th>
                <th>Entry Time</th>
                <th>Expected Exit</th>
                <th>Status</th>
                <th>Action</th>
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody id="activity-body">
              {visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan="7">No activity records found.</td>
                </tr>
              ) : (
                visibleLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.userId?.username || "Unknown"}</td>
                    <td>{log.vehicleType || "Unknown"}</td>
                    <td>{formatTableDate(log.entryTime)}</td>
                    <td>{formatTableDate(log.expectedExitTime)}</td>
                    <td>{getStatusBadge(log)}</td>

                    <td>
                      {log.status === "Booked" ? (
                        <button
                          className="table-action-btn cancel-btn"
                          onClick={() => handleCancel(log._id)}
                        >
                          Cancel
                        </button>
                      ) : log.status === "Active" ||
                        log.status === "Overstay" ||
                        isLogOverstay(log) ? (
                        <button
                          className="table-action-btn"
                          onClick={() => handleCheckout(log._id)}
                        >
                          Check Out
                        </button>
                      ) : (
                        "---"
                      )}
                    </td>

                    <td>
                      {log.status === "Completed" ? (
                        <button
                          className="table-action-btn"
                          onClick={() => handleViewReceipt(log._id)}
                        >
                          View
                        </button>
                      ) : (
                        "---"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceiptModal && (
        <div id="receipt-modal" className="custom-modal receipt-printable">
          <div className="custom-card receipt-card">
            <h3 id="receipt-modal-title">{receiptTitle}</h3>

            <pre id="receipt-modal-body">{receiptBody}</pre>

            <button className="table-action-btn" onClick={closeReceiptModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceDashboard;
