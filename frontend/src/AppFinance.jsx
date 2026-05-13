import { useEffect, useState } from "react";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import FinanceDashboard from "./pages/FinanceDashboard";
import Report from "./pages/Report";
import "./App.css";
import "./Background.css";

function App() {
  const [page, setPage] = useState("signup");
  const [role, setRole] = useState(localStorage.getItem("userRole"));

  // Keeps the current dashboard/report page even after refresh
  const [activePage, setActivePage] = useState(
    localStorage.getItem("activePage") || "dashboard"
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("activePage");

    setRole(null);
    setPage("signup");
    setActivePage("dashboard");
  };

  const showFinanceDashboard =
    role === "FinanceAdmin" ||
    role === "ParkingManager" ||
    role === "SystemAdmin";

  useEffect(() => {
    if (role && showFinanceDashboard && activePage === "report") {
      document.title = "ParkSmart Finance- Revenue Report";
    } else if (role && showFinanceDashboard) {
      document.title = "ParkSmart Finance";
    } else if (page === "login") {
      document.title = "ParkSmart Login";
    } else {
      document.title = "ParkSmart Sign Up";
    }
  }, [role, showFinanceDashboard, activePage, page]);

  const openReport = () => {
    localStorage.setItem("activePage", "report");
    setActivePage("report");
  };

  const backToDashboard = () => {
    localStorage.setItem("activePage", "dashboard");
    setActivePage("dashboard");
  };

  if (role && showFinanceDashboard && activePage === "report") {
    return <Report backToDashboard={backToDashboard} />;
  }

  return (
    <div>
      <nav className="navbar">
        <span className="logo">ParkSmart 🚗</span>

        <div className="nav-buttons">
          {!role && (
            <>
              <button className="btn-nav" onClick={() => setPage("signup")}>
                Sign Up
              </button>

              <button className="btn-nav" onClick={() => setPage("login")}>
                Login
              </button>
            </>
          )}

          {role && (
            <button className="btn-danger" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </nav>

      <div className="container">
        {!role && page === "signup" && <Signup setPage={setPage} />}

        {!role && page === "login" && <Login setRole={setRole} />}

        {role && showFinanceDashboard && (
          <FinanceDashboard openReport={openReport} />
        )}

        {role && !showFinanceDashboard && (
          <div className="card main-card">
            <h3>Dashboard Not Connected Yet</h3>
            <p className="subtitle">
              Login successful. This role does not have access to the finance dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;