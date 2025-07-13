import React from "react";
// import ReactDOM from 'react-dom';
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
// import 'bootstrap/dist/css/bootstrap.min.css';

// Import createRoot from "react-dom/client"
import { createRoot } from "react-dom/client";

// Replace ReactDOM.render with createRoot
const root = createRoot(document.getElementById("root"));

// Use root.render to render the App component
root.render(
  <AuthProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </AuthProvider>
);
