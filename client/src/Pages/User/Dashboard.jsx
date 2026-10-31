import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Receipt, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Sparkles,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const user = useSelector((state) => state.user?.userData);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto py-2">
      {/* Personalized Welcome Header */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-softLavender shadow-premium relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gradient-to-bl from-primary/10 via-secondary/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5145E5] via-[#8067F8] to-[#38C6D9] text-white flex items-center justify-center font-black text-2xl uppercase shadow-lg shadow-primary/20 shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {user?.role || 'Member'} Workspace
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Verified Account
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight mt-1.5">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-xs sm:text-sm text-slateGray mt-1">
                Access your subscriptions, invoices, and profile settings from your Brightloop portal.
              </p>
            </div>
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <User className="w-4 h-4" />
            <span>Manage Profile</span>
          </Link>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          to="/subscriptions"
          className="bg-white p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group relative flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white mb-4 shadow-md shadow-primary/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-deepNavy group-hover:text-primary transition-colors">
              My Subscriptions
            </h3>
            <p className="text-xs text-slateGray mt-1 leading-relaxed">
              View your active recurring billing plans, renewal schedules, and quotas.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-softLavender flex items-center justify-between text-xs font-bold text-primary">
            <span>View Subscriptions</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/invoices"
          className="bg-white p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group relative flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-secondary to-accent flex items-center justify-center text-white mb-4 shadow-md shadow-secondary/20">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-deepNavy group-hover:text-primary transition-colors">
              Billing & Invoices
            </h3>
            <p className="text-xs text-slateGray mt-1 leading-relaxed">
              Download tax receipts, review payment history, and manage payment methods.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-softLavender flex items-center justify-between text-xs font-bold text-primary">
            <span>View Invoices</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/subscription-plans"
          className="bg-white p-6 rounded-2xl border border-softLavender shadow-premium hover:shadow-premium-hover transition-all duration-200 group relative flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white mb-4 shadow-md shadow-accent/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-deepNavy group-hover:text-primary transition-colors">
              Browse Plans & Products
            </h3>
            <p className="text-xs text-slateGray mt-1 leading-relaxed">
              Explore available subscription tiers, add-on features, and upgrades.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-softLavender flex items-center justify-between text-xs font-bold text-primary">
            <span>Explore Plans</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Clean Account Activity Container */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium p-6 sm:p-8">
        <h2 className="text-base font-bold text-deepNavy mb-1">Recent Activity</h2>
        <p className="text-xs text-slateGray mb-6">Latest notifications and billing actions on your account</p>

        <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-softLavender rounded-2xl bg-mainBg">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slateGray mb-3 border border-softLavender shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-deepNavy">No Recent Activity</h3>
          <p className="text-xs text-slateGray max-w-sm mt-1">
            When you subscribe to a plan or receive an invoice, updates will appear right here.
          </p>
        </div>
      </div>
    </div>
  );
}
