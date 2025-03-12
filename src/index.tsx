import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { SerialProvider } from "context/SerialContext";
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter>
    <HelmetProvider>
      <SerialProvider>
        <App />
      </SerialProvider>
    </HelmetProvider>
  </BrowserRouter>
);
