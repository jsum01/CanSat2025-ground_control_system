// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom"; // BrowserRouter 대신 HashRouter 사용(electron은 웹과 달리 filepath를 사용하기 때문)
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { SerialProvider } from "context/SerialContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <HashRouter>
    <HelmetProvider>
      <SerialProvider>
        <App />
      </SerialProvider>
    </HelmetProvider>
  </HashRouter>
);