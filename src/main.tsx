import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { api } from "./api";

// Map electronAPI to Axios backend calls
(window as any).electronAPI = api;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
