import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import TicketDashboardPage from './pages/TicketDashboardPage';
import ShouldIGoNowPage from './pages/ShouldIGoNowPage';
import KioskPage from './pages/KioskPage';
import StaffDashboardPage from './pages/StaffDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminServicesPage from './pages/AdminServicesPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminSimulationPage from './pages/AdminSimulationPage';
import CampusMapPage from './pages/CampusMapPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout wrapper to conditionally hide Navbar/Footer on Kiosk terminal mode
function AppLayout() {
  const location = useLocation();
  const isKioskMode = location.pathname.startsWith('/kiosk');

  return (
    <div className="flex flex-col min-h-screen">
      {!isKioskMode && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/services/:id/join" element={<ServiceDetailPage />} />
          <Route path="/tickets/:id" element={<TicketDashboardPage />} />
          <Route path="/tickets/guest/:guestToken" element={<TicketDashboardPage />} />
          <Route path="/should-i-go" element={<ShouldIGoNowPage />} />
          <Route path="/map" element={<CampusMapPage />} />
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="/staff" element={<StaffDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/services" element={<AdminServicesPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/simulation" element={<AdminSimulationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {!isKioskMode && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppLayout />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
