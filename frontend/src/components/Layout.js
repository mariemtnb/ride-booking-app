// src/components/Layout.js
import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

// src/components/Layout.js
function Layout() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Navbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
