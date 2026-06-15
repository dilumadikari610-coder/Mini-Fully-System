import React from 'react';
import ReactDOM from 'react-dom/client'; // ✅ Add this missing import
import { BrowserRouter } from 'react-router-dom'; // Required for the routing fix we did
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);