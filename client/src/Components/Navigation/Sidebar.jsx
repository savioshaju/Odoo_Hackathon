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
  User as UserIcon,
  HelpCircle,
  Sparkles
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
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'Subscriptions', icon: CreditCard, path: '/subscriptions' },
        { label: 'Subscription Plans', icon: Layers, path: '/subscription-plans' },
        { label: 'Customers', icon: Users, path: '/customers' },
      ]
    },
    {
      group: 'Catalog & Inventory',
      items: [
        { label: 'Products', icon: Package, path: '/products' },
        { label: 'Product Variants', icon: Layers, path: '/product-variants' },
        { label: 'Discounts', icon: Percent, path: '/discounts' },
      ]
    },
    {
      group: 'Billing & Finance',
      items: [
        { label: 'Quotations', icon: FileText, path: '/quotations' },
        { label: 'Invoices', icon: Receipt, path: '/invoices' },
        { label: 'Payments', icon: DollarSign, path: '/payments' },
        { label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
      ]
    },
    {
      group: 'System',
      items: [
        { label: 'Profile', icon: UserIcon, path: '/profile' },
        { label: 'Settings', icon: Settings, path: '/settings' },
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
            className="hidden lg:flex p-1.5 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slateGray/70">
                  {group.group}
                </div>
              )}
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group cursor-pointer ${
                      isActive
                        ? 'bg-[#5145E5]/10 text-primary border border-primary/20 shadow-xs'
                        : 'text-slateGray hover:text-deepNavy hover:bg-mainBg'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-slateGray group-hover:text-deepNavy'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-softLavender bg-white">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-mainBg border border-softLavender flex items-center justify-between">
            <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-deepNavy truncate">{user?.name || 'Brightloop User'}</p>
                <p className="text-[11px] text-slateGray truncate">{user?.email || ''}</p>
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
              title={user?.name || 'Profile'}
            >
              {user?.name ? user.name[0] : 'U'}
            </NavLink>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

