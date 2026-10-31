import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from '../Components/Navigation/Sidebar';
import TopNav from '../Components/Navigation/TopNav';

export default function Layout() {
  const user = useSelector((state) => state.user?.userData);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer whenever the user navigates to a new page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && user) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, user]);

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex text-[#171A35] font-sans antialiased overflow-x-hidden">
      {/* Desktop Sidebar: ONLY rendered when logged in */}
      {user && (
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
          isMobile={false} 
        />
      )}

      {/* Mobile Drawer: ONLY rendered when logged in */}
      {user && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-[#171A35]/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)} 
          />

          {/* Slide-out Drawer Container */}
          <div className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300">
            <Sidebar 
              collapsed={false} 
              isMobile={true} 
              onCloseMobile={() => setMobileMenuOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Main Content Area: Full width if not logged in; padded if logged in */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          user ? (collapsed ? 'lg:pl-20' : 'lg:pl-64') : 'pl-0'
        }`}
      >
        <TopNav onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
