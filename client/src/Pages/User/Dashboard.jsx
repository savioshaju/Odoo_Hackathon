import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign, 
  Plus, 
  Clock, 
  Sparkles,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('30d');

  // Real data state (defaults to clean initial metrics without mockup numbers)
  const [stats] = useState([
    {
      title: 'Monthly Recurring Revenue',
      value: '$0.00',
      change: '0.0%',
      isPositive: true,
      subtext: 'No active recurring charges yet',
      icon: DollarSign,
      gradient: 'from-[#5145E5] to-[#8067F8]',
    },
    {
      title: 'Active Subscriptions',
      value: '0',
      change: '0',
      isPositive: true,
      subtext: 'No customers subscribed yet',
      icon: CreditCard,
      gradient: 'from-[#8067F8] to-[#38C6D9]',
    },
    {
      title: 'Customer Churn Rate',
      value: '0.0%',
      change: '0.0%',
      isPositive: true,
      subtext: 'Awaiting subscription activity',
      icon: Users,
      gradient: 'from-[#38C6D9] to-[#5145E5]',
    },
    {
      title: 'Net Revenue Retention',
      value: '100.0%',
      change: '0.0%',
      isPositive: true,
      subtext: 'Baseline retention metric',
      icon: TrendingUp,
      gradient: 'from-[#5145E5] to-[#38C6D9]',
    },
  ]);

  // Real transaction list (empty until real invoices are generated)
  const [transactions] = useState([]);

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

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
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
                <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md text-slateGray bg-mainBg border border-softLavender">
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

      {/* Revenue Trajectory & Plan Distribution Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trajectory Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-2xl border border-softLavender shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-deepNavy">Recurring Revenue Growth</h2>
              <p className="text-xs text-slateGray mt-0.5">Historical trajectory and revenue run-rate</p>
            </div>
          </div>

          <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-softLavender rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray mb-3 border border-softLavender">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-deepNavy">No Revenue Data Yet</p>
            <p className="text-xs text-slateGray max-w-sm mt-1">
              Once subscriptions are created and invoices are paid, your revenue trends will automatically render here.
            </p>
            <Link
              to="/subscription-plans"
              className="mt-4 px-4 py-2 bg-mainBg hover:bg-softLavender/60 text-primary border border-softLavender rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Create First Subscription Plan
            </Link>
          </div>
        </div>

        {/* Plan Distribution Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-softLavender shadow-premium flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-deepNavy">Plan Distribution</h2>
              <Link to="/subscription-plans" className="text-xs text-primary font-semibold hover:underline">
                View all
              </Link>
            </div>
            <p className="text-xs text-slateGray mb-6">Breakdown across subscription plans</p>

            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-mainBg flex items-center justify-center text-slateGray mb-2 border border-softLavender">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-deepNavy">No Plans Assigned</p>
              <p className="text-[11px] text-slateGray mt-0.5">Add subscribers to view tier distribution.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-softLavender flex items-center justify-between text-xs">
            <span className="text-slateGray font-medium">Average Revenue Per User (ARPU)</span>
            <span className="font-extrabold text-deepNavy text-sm">$0.00</span>
          </div>
        </div>
      </div>

      {/* Invoices List / Clean Empty State */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        <div className="p-6 sm:p-7 border-b border-softLavender flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-deepNavy">Recent Billing Activity</h2>
            <p className="text-xs text-slateGray mt-0.5">Real-time settlement status of subscription invoices</p>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold text-primary hover:text-secondary transition"
          >
            Go to Invoices
          </Link>
        </div>

        {transactions.length > 0 ? (
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-mainBg/60 transition duration-150">
                    <td className="py-3.5 px-6 font-mono font-bold text-deepNavy">{tx.id}</td>
                    <td className="py-3.5 px-6 font-bold text-deepNavy">{tx.customer}</td>
                    <td className="py-3.5 px-6 text-slateGray font-medium">{tx.plan}</td>
                    <td className="py-3.5 px-6 font-bold text-deepNavy">{tx.amount}</td>
                    <td className="py-3.5 px-6">{tx.status}</td>
                    <td className="py-3.5 px-6 text-right text-slateGray font-medium">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray mb-3 border border-softLavender">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-deepNavy">No Transactions Yet</h3>
            <p className="text-xs text-slateGray max-w-sm mt-1">
              Invoices generated for your subscribers will automatically appear here with settlement states.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
