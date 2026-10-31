import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Layers, 
  CreditCard, 
  Users, 
  Receipt, 
  DollarSign, 
  Percent,
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  User as UserIcon, 
  X
} from 'lucide-react';
import { clearUserData } from '../../store/slice/userSlice';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';
import BrightloopLogo from '../Shared/BrightloopLogo';

export default function Sidebar({ 
  collapsed = false, 
  setCollapsed = () => {}, 
  isMobile = false, 
  onCloseMobile = null 
}) {
  const user = useSelector((state) => state.user?.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // If not logged in, do not render any sidebar
  if (!user) {
    return null;
  }

  const userRole = user?.role === 'admin' ? 'admin' : 'user';

  const handleLinkClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
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
      if (isMobile && onCloseMobile) {
        onCloseMobile();
      }
      navigate('/login');
    }
  };

  const navGroups = [
    {
      group: 'Core Platform',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['user', 'admin'] },
        { label: 'My Subscriptions', icon: CreditCard, path: '/subscriptions', roles: ['user', 'admin'] },
        { label: 'Subscription Plans', icon: Layers, path: '/subscription-plans', roles: ['user', 'admin'] },
        { label: 'My Invoices', icon: Receipt, path: '/invoices', roles: ['user', 'admin'] },
        { label: 'My Profile', icon: UserIcon, path: '/profile', roles: ['user', 'admin'] },
      ]
    },
    {
      group: 'Admin Portal',
      items: [
        { label: 'Admin Overview', icon: LayoutDashboard, path: '/admin', roles: ['admin'] },
        { label: 'Customer Directory', icon: Users, path: '/admin/customers', roles: ['admin'] },
        { label: 'Service Packages', icon: Layers, path: '/admin/services', roles: ['admin'] },
        { label: 'Discounts & Coupons', icon: Percent, path: '/admin/discounts', roles: ['admin'] },
        { label: 'Payments', icon: DollarSign, path: '/admin/payments', roles: ['admin'] },
      ]
    }
  ];

  return (
    <aside 
      className={`${
        isMobile 
          ? 'relative h-full w-full flex flex-col justify-between bg-white overflow-hidden' 
          : `fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-softLavender hidden lg:flex flex-col justify-between transition-all duration-300 ease-in-out ${
              collapsed ? 'w-20' : 'w-64'
            }`
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className={`h-16 flex items-center border-b border-softLavender ${
          collapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!collapsed || isMobile ? (
            <>
              <NavLink to="/" onClick={handleLinkClick} className="flex items-center overflow-hidden">
                <BrightloopLogo 
                  className="h-8 w-8 min-w-8" 
                  withText={true} 
                  textClassName="text-lg font-black text-deepNavy"
                />
              </NavLink>

              {/* Desktop Collapse Button */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer hidden lg:flex shrink-0"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            /* When collapsed on desktop: Centered interactive button that smoothly toggles between logo and expand chevron */
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 rounded-xl hover:bg-mainBg text-slateGray hover:text-primary transition flex items-center justify-center cursor-pointer group shrink-0"
              title="Click to expand sidebar"
            >
              <div className="group-hover:hidden">
                <BrightloopLogo className="h-8 w-8" withText={false} />
              </div>
              <div className="hidden group-hover:flex items-center justify-center text-primary font-bold">
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </div>
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Area */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8.5rem)]">
          {navGroups.map((grp, idx) => {
            const visibleItems = grp.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slateGray/80 mb-2">
                    {grp.group}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center transition duration-150 group rounded-xl ${
                        collapsed && !isMobile
                          ? 'w-10 h-10 mx-auto justify-center'
                          : 'gap-3 px-3 py-2.5 font-semibold text-xs'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                          : 'text-slateGray hover:text-deepNavy hover:bg-mainBg'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slateGray group-hover:text-primary transition-colors'}`} />
                      {(!collapsed || isMobile) && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: User profile summary */}
      <div className="p-3 border-t border-softLavender">
        {!collapsed || isMobile ? (
          <div className="p-2.5 rounded-xl bg-mainBg border border-softLavender flex items-center justify-between">
            <NavLink 
              to="/profile" 
              onClick={handleLinkClick}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {user.name ? user.name[0] : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-deepNavy truncate">{user.name}</p>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    userRole === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'
                  }`}>
                    {userRole}
                  </span>
                </div>
                <p className="text-[11px] text-slateGray truncate">{user.email}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* When collapsed on desktop: Centered avatar + logout icons */
          <div className="flex flex-col items-center gap-2">
            <NavLink 
              to="/profile" 
              onClick={handleLinkClick}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs hover:opacity-90 transition"
              title={`${user.name} (${userRole})`}
            >
              {user.name ? user.name[0] : 'U'}
            </NavLink>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
