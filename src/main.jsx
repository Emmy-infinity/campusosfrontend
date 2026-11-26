import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { HelmetProvider } from "react-helmet-async"; // 👈 ADDED THIS LINE

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider> {/* 👈 ADDED THIS WRAPPER */}
      <App />
    </HelmetProvider> {/* 👈 ADDED THIS CLOSING TAG */}
  </React.StrictMode>
);
