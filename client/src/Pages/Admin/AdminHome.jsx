import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  Tag, 
  ArrowRight,
  Percent,
  Sparkles
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';

export default function AdminHome() {
  const [loading, setLoading] = useState(true);

  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const statsRes = await axiosInstance.get('/admin/overview').catch(() => null);
      if (statsRes?.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminModules = [
    {
      title: 'Customer Directory',
      desc: 'Subscriber accounts, role permissions, and active credentials.',
      path: '/admin/customers',
      icon: Users,
      color: 'from-primary to-secondary'
    },
    {
      title: 'Service Packages',
      desc: 'Subscription tiers, recurring duration packaging, and seat pricing.',
      path: '/admin/services',
      icon: Layers,
      color: 'from-secondary to-accent'
    },
    {
      title: 'Payments & Transactions',
      desc: 'Real-time client subscription settlement and invoice records.',
      path: '/admin/payments',
      icon: DollarSign,
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-softLavender shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-deepNavy tracking-tight mt-1.5">
            Admin Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slateGray mt-1">
            Complete database management for subscribers, subscription plans, platform revenue, and accounts.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-mainBg hover:bg-softLavender/50 text-slateGray hover:text-deepNavy rounded-xl text-xs font-bold border border-softLavender transition cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Registered Users</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{stats.totalUsers || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Active Subs</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{stats.activeSubscriptions || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">DB Services</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{stats.totalServices || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Settled Revenue</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">${stats.totalRevenue || 0}</p>
          </div>
        </div>
      </div>

      {/* Overview Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slateGray">Subscription Health</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-deepNavy">
            {stats.totalSubscriptions > 0 
              ? Math.round((stats.activeSubscriptions / stats.totalSubscriptions) * 100) 
              : 100}%
          </div>
          <p className="text-xs text-slateGray leading-relaxed">
            Percentage of active customer subscriptions retaining valid paid credentials.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slateGray">Monthly Recurring Revenue</h3>
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-deepNavy">
            ${stats.monthlyRecurringRevenue || 0}
          </div>
          <p className="text-xs text-slateGray leading-relaxed">
            Projected monthly recurring contract revenue across active database services.
          </p>
        </div>
      </div>

      {/* Admin Operations Grid */}
      <div>
        <h2 className="text-base font-bold text-deepNavy mb-3">Management Functions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {adminModules.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.path}
                to={card.path}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-deepNavy group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slateGray mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-softLavender flex items-center justify-between text-xs font-bold text-primary">
                  <span>Open {card.title}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
