import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RetailerDashboard from './pages/RetailerDashboard';
import CustomerHome from './pages/CustomerHome';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/retailer-dashboard" element={<RetailerDashboard />} />
        <Route path="/customer-home" element={<CustomerHome />} />
      </Routes>
    </Router>
  );
}

export default App;