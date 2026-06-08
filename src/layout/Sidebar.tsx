import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdDevicesOther,
  MdInventory2,
  MdCallMerge,
  MdBuild,
  MdInventory,
  MdLogout,
  MdMenu,
  MdClose,
  MdAdminPanelSettings,
  MdSettings,
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username") || "Admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const navItem = (path: string, label: string, icon: React.ReactNode) => (
    <div className={`nav-item ${location.pathname === path ? "active" : ""}`}>
      <Link to={path} onClick={() => setMobileOpen(false)}>
        <div className="nav-icon">{icon}</div>
        <span>{label}</span>
      </Link>
    </div>
  );

  return (
    <>
      <div className="mobile-header">
        <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
        <div className="mobile-brand">
          <span className="mobile-brand-mark">BS</span>
          <span>Stock Manager</span>
        </div>
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">BS</div>
            <div className="logo-text">
              <h2>Bafna Stock</h2>
              <span>Inventory Management</span>
            </div>
          </div>
          <button className="close-mobile" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <MdClose size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {role === "admin" && (
            <>
              <div className="sidebar-group">
                <div className="sidebar-group-title">Overview</div>
                <div className="sidebar-group-items">
                  {navItem("/admin/dashboard", "Dashboard", <MdDashboard size={20} />)}
                </div>
              </div>

              <div className="sidebar-group">
                <div className="sidebar-group-title">Masters</div>
                <div className="sidebar-group-items">
                  {navItem("/admin/reference", "Products", <MdDevicesOther size={20} />)}
                  {navItem("/admin/packet-reference", "Packets", <MdInventory2 size={20} />)}
                </div>
              </div>

              <div className="sidebar-group">
                <div className="sidebar-group-title">Configuration</div>
                <div className="sidebar-group-items">
                  {navItem("/admin/combination", "Product Groups", <MdCallMerge size={20} />)}
                  {navItem("/admin/packet-combination", "Packet Groups", <MdCallMerge size={20} />)}
                </div>
              </div>

              <div className="sidebar-group">
                <div className="sidebar-group-title">Inventory</div>
                <div className="sidebar-group-items">
                  {navItem("/admin/raw-list", "Raw Material Entries", <MdBuild size={20} />)}
                  {navItem("/admin/stock-overview", "Stock Overview", <MdInventory size={20} />)}
                </div>
              </div>

              <div className="sidebar-group">
                <div className="sidebar-group-title">System</div>
                <div className="sidebar-group-items">
                  {navItem("/admin/settings", "Settings", <MdSettings size={20} />)}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar"><MdAdminPanelSettings size={21} /></div>
            <div className="user-details">
              <strong>{username}</strong>
              <span>Administrator</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Sign out" aria-label="Sign out">
              <MdLogout size={20} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
