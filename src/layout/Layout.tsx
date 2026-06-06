import React from "react";
import Sidebar from "./Sidebar";
import "./Sidebar.css";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">{children}</div>
    </div>
  );
};

export default Layout;
