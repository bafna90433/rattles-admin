import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdDevicesOther,
  MdAddCircleOutline,
  MdCallMerge,
  MdBuild,
  MdInventory,
  MdExitToApp,
  MdMenu,
  MdClose,
  MdPrecisionManufacturing,
  MdFactory,
  MdPointOfSale
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {mobileOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
        <h2 className="mobile-logo">🧱 STOCK MANAGER</h2>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      {/* Sidebar */}
      <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">🧱</div>
            <div className="logo-text">
              <h2>STOCK MANAGER</h2>
              <span>Inventory System</span>
            </div>
          </div>
          <button className="close-mobile" onClick={toggleMobileMenu}>
            <MdClose size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {/* ========================================================= */}
          {/* 👑 ADMIN SECTIONS */}
          {/* ========================================================= */}
          {role === "admin" && (
            <>
              {/* Dashboard */}
              <div className="sidebar-group single-item">
                <div className={`nav-item ${location.pathname === "/admin/dashboard" ? "active" : ""}`}>
                  <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                    <div className="nav-icon">
                      <MdDashboard size={20} />
                    </div>
                    <span>Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* Section: CONFIGURATION */}
              <div className="sidebar-group">
                <div className="sidebar-group-title">⚙️ Setup & Masters</div>
                <div className="sidebar-group-items">
                  <div className={`nav-item ${location.pathname === "/admin/reference" ? "active" : ""}`}>
                    <Link to="/admin/reference" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdDevicesOther size={20} />
                      </div>
                      <span>Product Reference</span>
                    </Link>
                  </div>
                  <div className={`nav-item ${location.pathname === "/admin/packet-reference" ? "active" : ""}`}>
                    <Link to="/admin/packet-reference" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdAddCircleOutline size={20} />
                      </div>
                      <span>Packet Reference</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Section: COMBINATIONS */}
              <div className="sidebar-group">
                <div className="sidebar-group-title">🧩 Combinations</div>
                <div className="sidebar-group-items">
                  <div className={`nav-item ${location.pathname === "/admin/combination" ? "active" : ""}`}>
                    <Link to="/admin/combination" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdCallMerge size={20} />
                      </div>
                      <span>Group Setup</span>
                    </Link>
                  </div>
                  <div className={`nav-item ${location.pathname === "/admin/packet-combination" ? "active" : ""}`}>
                    <Link to="/admin/packet-combination" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdCallMerge size={20} />
                      </div>
                      <span>Packet Combination</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Section: OPERATIONS */}
              <div className="sidebar-group">
                <div className="sidebar-group-title">📦 Operations</div>
                <div className="sidebar-group-items">
                  <div className={`nav-item ${location.pathname === "/admin/raw-list" ? "active" : ""}`}>
                    <Link to="/admin/raw-list" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdBuild size={20} />
                      </div>
                      <span>Raw Entries</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Section: STOCKS & REPORTS */}
              <div className="sidebar-group stock-overview-section">
                <div className="sidebar-group-title">📊 Stocks & Reports</div>
                <div className="sidebar-group-items">
                  <div className={`nav-item ${location.pathname === "/admin/stock-overview" ? "active" : ""}`}>
                    <Link to="/admin/stock-overview" onClick={() => setMobileOpen(false)}>
                      <div className="nav-icon">
                        <MdInventory size={20} />
                      </div>
                      <span>Stock Overview</span>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <MdExitToApp size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;