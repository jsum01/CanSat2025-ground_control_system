import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppProvider from './modules';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);