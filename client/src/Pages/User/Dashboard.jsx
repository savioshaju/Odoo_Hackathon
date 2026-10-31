import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Layers,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  const stats = [
    {
      title: 'Monthly Recurring Revenue',
      value: '$248,650.00',
      change: '+14.2%',
      isPositive: true,
      subtext: 'vs. previous month ($217,800)',
      icon: DollarSign,
      gradient: 'from-[#5145E5] to-[#8067F8]',
    },
    {
      title: 'Active Subscriptions',
      value: '3,842',
      change: '+8.4%',
      isPositive: true,
      subtext: '124 new subscribers this week',
      icon: CreditCard,
      gradient: 'from-[#8067F8] to-[#38C6D9]',
    },
    {
      title: 'Customer Churn Rate',
      value: '1.24%',
      change: '-0.3%',
      isPositive: true,
      subtext: 'Industry benchmark: 3.5%',
      icon: Users,
      gradient: 'from-[#38C6D9] to-[#5145E5]',
    },
    {
      title: 'Net Revenue Retention',
      value: '118.6%',
      change: '+2.1%',
      isPositive: true,
      subtext: 'Driven by enterprise plan upgrades',
      icon: TrendingUp,
      gradient: 'from-[#5145E5] to-[#38C6D9]',
    },
  ];

  const recentTransactions = [
    { id: 'INV-2026-0891', customer: 'Vercel Systems Inc.', plan: 'Enterprise Cloud (Annual)', amount: '$12,400.00', status: 'Paid', date: 'Just now' },
    { id: 'INV-2026-0890', customer: 'Linear Technologies', plan: 'Scale Plus (Monthly)', amount: '$850.00', status: 'Paid', date: '14 mins ago' },
    { id: 'INV-2026-0889', customer: 'Supabase Global', plan: 'Custom Tier', amount: '$3,200.00', status: 'Processing', date: '1 hour ago' },
    { id: 'INV-2026-0888', customer: 'Raycast Labs', plan: 'Team Pro (Monthly)', amount: '$420.00', status: 'Paid', date: '3 hours ago' },
    { id: 'INV-2026-0887', customer: 'Figma Cloud Ltd.', plan: 'Startup Tier', amount: '$190.00', status: 'Retrying', date: '5 hours ago' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
              Revenue Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3 text-[#38C6D9]" /> Live Stream
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slateGray mt-1">
            Real-time subscriber lifecycle metrics, cash collection, and health indicators.
          </p>
        </div>

        {/* Filters and New Subscription Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-softLavender rounded-xl p-1 shadow-xs">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeRange(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timeRange === period
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slateGray hover:text-deepNavy'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>

          <Link
            to="/subscriptions"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#5145E5] to-[#8067F8] hover:from-[#4338CA] hover:to-[#6D52F7] text-white font-bold text-xs rounded-xl shadow-md shadow-[#5145E5]/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </Link>
        </div>
      </div>

      {/* 4 Distinctive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group relative overflow-hidden"
            >
              {/* Subtle accent border on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                style={{ backgroundImage: `linear-gradient(to right, #5145E5, #38C6D9)` }} 
              />

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slateGray uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${stat.gradient} flex items-center justify-center text-white shadow-md shadow-primary/10`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
                  {stat.value}
                </span>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                  stat.isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'
                }`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>

              <p className="text-[11px] text-slateGray/80 mt-2 truncate font-medium">
                {stat.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Interactive Chart & Subscriptions Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Trajectory Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-softLavender shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-deepNavy">Recurring Revenue Growth</h2>
              <p className="text-xs text-slateGray mt-0.5">Historical trajectory and 2026 forecast</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slateGray font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> MRR Actual
              </span>
              <span className="inline-flex items-center gap-1.5 text-slateGray font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Projection
              </span>
            </div>
          </div>

          {/* SVG Vector Interactive Visual Chart */}
          <div className="h-64 w-full relative flex flex-col justify-between pt-4">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5145E5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5145E5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Horizontal grid lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#E8E9F2" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#E8E9F2" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#E8E9F2" strokeDasharray="3 3" />

              {/* Area */}
              <path
                d="M0,160 Q75,140 150,110 T300,80 T450,45 T600,20 L600,190 L0,190 Z"
                fill="url(#chartGrad)"
              />
              {/* Gradient Line */}
              <path
                d="M0,160 Q75,140 150,110 T300,80 T450,45 T600,20"
                fill="none"
                stroke="#5145E5"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Future Projection Dashed */}
              <path
                d="M450,45 T600,10"
                fill="none"
                stroke="#38C6D9"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />

              {/* Data points */}
              <circle cx="150" cy="110" r="4.5" fill="#FFFFFF" stroke="#5145E5" strokeWidth="2.5" />
              <circle cx="300" cy="80" r="4.5" fill="#FFFFFF" stroke="#5145E5" strokeWidth="2.5" />
              <circle cx="450" cy="45" r="5" fill="#FFFFFF" stroke="#38C6D9" strokeWidth="3" />
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between text-[11px] font-semibold text-slateGray pt-3 border-t border-softLavender">
              <span>Nov</span>
              <span>Dec</span>
              <span>Jan 2026</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr (Proj)</span>
            </div>
          </div>
        </div>

        {/* Tier Distribution & Quick Metrics Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-softLavender shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-deepNavy">Subscription Plans</h2>
              <Link to="/subscription-plans" className="text-xs text-primary font-semibold hover:underline">
                View all
              </Link>
            </div>
            <p className="text-xs text-slateGray mb-6">Distribution across revenue tiers</p>

            <div className="space-y-4">
              {[
                { name: 'Enterprise Cloud', percent: 54, amount: '$134,271', color: 'bg-primary' },
                { name: 'Scale Pro', percent: 28, amount: '$69,622', color: 'bg-secondary' },
                { name: 'Growth Team', percent: 14, amount: '$34,811', color: 'bg-accent' },
                { name: 'Starter Tier', percent: 4, amount: '$9,946', color: 'bg-slateGray' },
              ].map((tier, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-deepNavy">{tier.name}</span>
                    <span className="text-slateGray">{tier.amount} ({tier.percent}%)</span>
                  </div>
                  <div className="w-full bg-softLavender h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${tier.color} rounded-full`} style={{ width: `${tier.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-softLavender flex items-center justify-between text-xs">
            <span className="text-slateGray font-medium">Average Revenue Per User (ARPU)</span>
            <span className="font-extrabold text-deepNavy text-sm">$64.71</span>
          </div>
        </div>
      </div>

      {/* Minimal, High-Precision Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-softLavender flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-deepNavy">Recent Billing Activity</h2>
            <p className="text-xs text-slateGray mt-0.5">Real-time settlement status of subscription invoices</p>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold text-primary hover:text-secondary transition flex items-center gap-1"
          >
            <span>View All Invoices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-mainBg text-[11px] font-bold uppercase tracking-wider text-slateGray border-b border-softLavender">
                <th className="py-3 px-6">Invoice</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Subscription Plan</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softLavender text-xs">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-mainBg/60 transition duration-150">
                  <td className="py-3.5 px-6 font-mono font-bold text-deepNavy">{tx.id}</td>
                  <td className="py-3.5 px-6 font-bold text-deepNavy">{tx.customer}</td>
                  <td className="py-3.5 px-6 text-slateGray font-medium">{tx.plan}</td>
                  <td className="py-3.5 px-6 font-bold text-deepNavy">{tx.amount}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      tx.status === 'Paid' 
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                        : tx.status === 'Processing'
                        ? 'text-primary bg-indigo-50 border border-indigo-200'
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}>
                      {tx.status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                      {tx.status === 'Processing' && <Clock className="w-3 h-3 animate-spin" />}
                      {tx.status === 'Retrying' && <AlertCircle className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right text-slateGray font-medium">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
