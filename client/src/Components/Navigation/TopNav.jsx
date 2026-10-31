import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Search, 
  Bell, 
  Menu, 
  Moon, 
  Sun, 
  ChevronDown, 
  Sparkles,
  Command,
  CheckCircle2
} from 'lucide-react';
import { clearUserData } from '../../store/slice/userSlice';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function TopNav({ onToggleMobileMenu }) {
  const user = useSelector((state) => state.user?.userData);
  const location = useLocation();
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Generate dynamic breadcrumb from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPageTitle = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Dashboard';

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      toast.info('Dark mode activated');
    } else {
      document.documentElement.classList.remove('dark');
      toast.info('Light mode activated');
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      dispatch(clearUserData());
      localStorage.removeItem('token');
      toast.info('Logged out successfully');
      window.location.href = '/login';
    }
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-softLavender px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slateGray hover:text-deepNavy rounded-lg hover:bg-mainBg transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Modern Breadcrumb */}
        <nav className="flex items-center text-xs font-medium text-slateGray">
          <Link to="/dashboard" className="hover:text-primary transition">Brightloop</Link>
          <span className="mx-2 text-softLavender">/</span>
          <span className="text-deepNavy font-semibold">{currentPageTitle}</span>
        </nav>
      </div>

      {/* Center: Quick Search Bar */}
      <div className="hidden md:flex items-center relative max-w-sm w-full mx-6">
        <Search className="w-4 h-4 text-slateGray absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search subscriptions, customers, invoices..."
          className="w-full pl-9 pr-9 py-2 bg-mainBg border border-softLavender rounded-xl text-xs text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
        />
        <div className="absolute right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-softLavender rounded text-[10px] text-slateGray font-mono font-bold">
          <Command className="w-2.5 h-2.5" /> K
        </div>
      </div>

      {/* Right: Actions, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-slateGray hover:text-deepNavy rounded-xl hover:bg-mainBg border border-transparent hover:border-softLavender transition cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slateGray hover:text-deepNavy rounded-xl hover:bg-mainBg border border-transparent hover:border-softLavender transition cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5145E5] ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-softLavender p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-softLavender">
                <span className="text-xs font-bold text-deepNavy uppercase tracking-wider">Notifications</span>
                <span className="text-[11px] font-semibold text-primary cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="py-2 space-y-2 text-xs">
                <div className="p-2.5 bg-mainBg rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-deepNavy">Recurring run completed</p>
                    <p className="text-[11px] text-slateGray">142 invoices billed successfully ($32,840.00)</p>
                    <span className="text-[10px] text-slateGray/70 mt-1 block">5 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pl-2 rounded-xl hover:bg-mainBg border border-transparent hover:border-softLavender transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <span className="hidden sm:inline text-xs font-bold text-deepNavy max-w-[100px] truncate">
              {user?.name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slateGray" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-softLavender p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-softLavender">
                <p className="text-xs font-bold text-deepNavy">{user?.name || 'Brightloop User'}</p>
                <p className="text-[11px] text-slateGray truncate">{user?.email || 'user@brightloop.io'}</p>
              </div>
              <div className="py-1 text-xs">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-3 py-2 text-slateGray hover:text-deepNavy hover:bg-mainBg rounded-lg font-medium transition"
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-3 py-2 text-slateGray hover:text-deepNavy hover:bg-mainBg rounded-lg font-medium transition"
                >
                  Workspace Settings
                </Link>
              </div>
              <div className="pt-1 border-t border-softLavender">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

