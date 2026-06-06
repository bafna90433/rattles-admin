import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";

// 🧩 Pages
import AdminDashboard from "./pages/AdminDashboard";
import ProductReference from "./pages/ProductReference";
import StockOverview from "./pages/StockOverview";
import CombinationSetup from "./pages/CombinationSetup";
import RawMaterialList from "./pages/RawMaterialList";
import PacketReference from "./pages/PacketReference";
import PacketCombination from "./pages/PacketCombination";

// 🔐 Login
import AdminLogin from "./pages/AdminLogin";

// 🔒 Protected Route
const ProtectedRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const role = localStorage.getItem("role");
  return allowedRoles.includes(role || "") ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Admin Login at Root */}
        <Route path="/" element={<AdminLogin />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />

        {/* 👑 ADMIN ROUTES */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Layout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="reference" element={<ProductReference />} />
                  <Route path="raw-list" element={<RawMaterialList />} />
                  <Route path="stock-overview" element={<StockOverview />} />
                  <Route path="combination" element={<CombinationSetup />} />
                  <Route path="packet-reference" element={<PacketReference />} />
                  <Route path="packet-combination" element={<PacketCombination />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
        
        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
