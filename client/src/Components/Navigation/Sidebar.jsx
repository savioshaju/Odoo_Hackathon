import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  CreditCard, 
  Users, 
  FileText, 
  Receipt, 
  DollarSign, 
  Percent, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  LogIn,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { clearUserData } from '../../store/slice/userSlice';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';
import BrightloopLogo from '../Shared/BrightloopLogo';

export default function Sidebar({ collapsed, setCollapsed }) {
  const user = useSelector((state) => state.user?.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Strictly two roles: 'user' or 'admin'
  const userRole = user?.role === 'admin' ? 'admin' : 'user';

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      dispatch(clearUserData());
      localStorage.removeItem('token');
      toast.info('Logged out successfully');
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
        { label: 'Customers', icon: Users, path: '/customers', roles: ['admin'] },
      ]
    },
    {
      group: 'Catalog & Services',
      items: [
        { label: 'Products', icon: Package, path: '/products', roles: ['user', 'admin'] },
        { label: 'Product Variants', icon: Layers, path: '/product-variants', roles: ['admin'] },
        { label: 'Discounts', icon: Percent, path: '/discounts', roles: ['admin'] },
      ]
    },
    {
      group: 'Billing & Finance',
      items: [
        { label: 'Quotations', icon: FileText, path: '/quotations', roles: ['admin'] },
        { label: 'My Invoices', icon: Receipt, path: '/invoices', roles: ['user', 'admin'] },
        { label: 'Payments', icon: DollarSign, path: '/payments', roles: ['admin'] },
        { label: 'Reports & Analytics', icon: BarChart3, path: '/reports', roles: ['admin'] },
      ]
    },
    {
      group: 'Settings & Account',
      items: [
        { label: 'My Profile', icon: UserIcon, path: '/profile', roles: ['user', 'admin'] },
        { label: 'Workspace Settings', icon: Settings, path: '/settings', roles: ['admin'] },
      ]
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-softLavender flex flex-col justify-between transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-softLavender">
          <NavLink to="/" className="flex items-center overflow-hidden">
            <BrightloopLogo 
              className="h-8 w-8 min-w-8" 
              withText={!collapsed} 
              textClassName="text-lg font-black text-deepNavy"
            />
          </NavLink>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer hidden lg:flex"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Group Items */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8.5rem)]">
          {navGroups.map((grp, idx) => {
            // Filter visible items according to strict role: 'user' vs 'admin'
            const visibleItems = grp.items.filter(item => 
              user ? item.roles.includes(userRole) : item.roles.includes('user')
            );

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
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition duration-150 group ${
                        isActive
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                          : 'text-slateGray hover:text-deepNavy hover:bg-mainBg'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slateGray group-hover:text-primary transition-colors'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: User profile summary OR Log In action */}
      <div className="p-3 border-t border-softLavender">
        {user ? (
          !collapsed ? (
            <div className="p-2.5 rounded-xl bg-mainBg border border-softLavender flex items-center justify-between">
              <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition">
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
            <div className="flex flex-col items-center gap-2">
              <NavLink 
                to="/profile" 
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs hover:opacity-90 transition"
                title={`${user.name} (${userRole})`}
              >
                {user.name ? user.name[0] : 'U'}
              </NavLink>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          /* When NOT logged in: Show clean Log In button */
          !collapsed ? (
            <NavLink
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in to Brightloop</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className="w-9 h-9 mx-auto flex items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark transition"
              title="Log in"
            >
              <LogIn className="w-4 h-4" />
            </NavLink>
          )
        )}
      </div>
    </aside>
  );
}
