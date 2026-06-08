import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { api } from "./api";
import toast from "react-hot-toast";

// Map electronAPI to Axios backend calls
(window as any).electronAPI = api;

// Global window.alert override for beautiful toasts
window.alert = (message: any) => {
  const msgStr = String(message);
  const cleanMsg = msgStr.replace(/^[✅❌⚠️?!\s]+/g, "").trim();

  if (
    msgStr.includes("✅") ||
    msgStr.toLowerCase().includes("success") ||
    msgStr.toLowerCase().includes("saved") ||
    msgStr.toLowerCase().includes("updated")
  ) {
    toast.success(cleanMsg);
  } else if (
    msgStr.includes("❌") ||
    msgStr.includes("⚠️") ||
    msgStr.toLowerCase().includes("error") ||
    msgStr.toLowerCase().includes("fail") ||
    msgStr.toLowerCase().includes("invalid")
  ) {
    toast.error(cleanMsg);
  } else {
    toast(cleanMsg, { icon: "ℹ️" });
  }
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
