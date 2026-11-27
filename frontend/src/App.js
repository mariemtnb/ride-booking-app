// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './auth/Login';
import Register from './auth/Register';
import Home from './pages/Home';
import DriverProfile from './components/DriverProfile';
import DriversList from './components/DriversList';
import Courses from './pages/Courses';
import Layout from './components/Layout'; // ✅ Layout avec Navbar
import UserProfile from './components/UserProfile';  // ton composant profil
import UserCourses from './pages/UserCourses';
import Notifications from './components/Notifications'; // ton composant notifications
import NotificationManager from './components/NotificationManager'; // Gestionnaire de notifications toast

// Lazy loading des composants conducteur
const DriverDashboard = React.lazy(() => import('./pages/DriverDashboard'));
const DriverLogin = React.lazy(() => import('./components/DriverLogin'));
const DriverInterface = React.lazy(() => import('./components/DriverInterface'));
const DriverRideHistory = React.lazy(() => import('./components/DriverRideHistory'));
const DriverReceipts = React.lazy(() => import('./components/DriverReceipts'));

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Toutes les pages passent par le layout avec Navbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/drivers" element={<DriversList />} />
          <Route path="/create-driver" element={<DriverProfile />} />
          <Route path="/driver-dashboard" element={<Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>}><DriverDashboard /></Suspense>} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-courses" element={<UserCourses />} />
          <Route path="/notifications" element={<Notifications />} />
          
          {/* Routes pour l'interface conducteur */}
          <Route path="/driver-login" element={<Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>}><DriverLogin /></Suspense>} />
          <Route path="/driver-interface" element={<Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>}><DriverInterface /></Suspense>} />
          <Route path="/driver-ride-history" element={<Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>}><DriverRideHistory /></Suspense>} />
          <Route path="/driver-receipts" element={<Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Chargement...</div>}><DriverReceipts /></Suspense>} />
        </Route>
      </Routes>
      
      {/* Gestionnaire de notifications toast global */}
      <NotificationManager />
    </Router>
  );
}

export default App;
