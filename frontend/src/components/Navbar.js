import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, Car, Bell, Clock, Menu, LogIn as LoginIcon, MapPin, History, Receipt } from 'lucide-react';
import { AuthContext } from '../auth/AuthContext';
import api from '../api/axios'; // Assure-toi que ce fichier est bien configuré

function Navbar() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setCollapsed(prev => !prev);

  // 🔔 Charger le nombre de notifications non lues
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error('Erreur lors du chargement du compteur de notifications:', err);
        setUnreadCount(0);
      }
    };

    if (isLoggedIn) {
      fetchUnreadCount();
      // Actualiser le compteur toutes les 30 secondes
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  return (
    <aside className={`fixed top-0 left-0 h-full bg-[#0f172a] border-r border-[#1e293b] shadow-xl z-50 text-white flex flex-col justify-between transition-all duration-300
      ${collapsed ? 'w-20' : 'w-64'}`}>

      <div>
        <div className={`p-6 flex items-center justify-between border-b border-[#1e293b] ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <div className="text-2xl font-bold tracking-wide text-center">
              Mini<span className="text-blue-500">Uber</span>
            </div>
          )}
          <button onClick={toggleSidebar} aria-label="Toggle sidebar" className="text-gray-400 hover:text-white focus:outline-none">
            <Menu size={24} />
          </button>
        </div>

        <nav className="mt-8 px-2 space-y-2">
          <NavItem to="/" icon={<Home size={20} />} label="Dashboard" collapsed={collapsed} />
          <NavItem to="/drivers" icon={<Users size={20} />} label="Chauffeurs" collapsed={collapsed} />
          <NavItem to="/driver-dashboard" icon={<Car size={20} />} label="Tableau Chauffeur" collapsed={collapsed} />
          <NavItem to="/courses" icon={<Car size={20} />} label="Courses" collapsed={collapsed} />
          <NavItem to="/my-courses" icon={<Clock size={20} />} label="Mes Courses" collapsed={collapsed} />
          
          {/* Driver Interface Section */}
          {!collapsed && <div className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2 mt-6">Interface Chauffeur</div>}
          <NavItem to="/driver-login" icon={<LoginIcon size={20} />} label="Connexion Chauffeur" collapsed={collapsed} />
          <NavItem to="/driver-interface" icon={<MapPin size={20} />} label="Interface Chauffeur" collapsed={collapsed} />
          <NavItem to="/driver-ride-history" icon={<History size={20} />} label="Historique Courses" collapsed={collapsed} />
          <NavItem to="/driver-receipts" icon={<Receipt size={20} />} label="Reçus" collapsed={collapsed} />

          {/* 🔔 Badge de notifications */}
          <NavItem
            to="/notifications"
            icon={
              <div className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
            }
            label="Notifications"
            collapsed={collapsed}
          />

          {!isLoggedIn && (
            <NavItem to="/login" icon={<LoginIcon size={20} />} label="Connexion" collapsed={collapsed} />
          )}
          {isLoggedIn && (
            <NavItem to="/profile" icon={<Users size={20} />} label="Profil" collapsed={collapsed} />
          )}
        </nav>
      </div>

      {isLoggedIn && (
        <div className="mb-6 px-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
          >
            <LogOut size={18} />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

function NavItem({ to, icon, label, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg transition whitespace-nowrap
        ${isActive ? 'bg-blue-600 text-white shadow' : 'hover:bg-[#1e293b] text-gray-300'}
        ${collapsed ? 'justify-center px-0' : ''}`
      }
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default Navbar;
