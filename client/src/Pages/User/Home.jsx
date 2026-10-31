import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  BarChart3,
  CreditCard,
  Lock
} from 'lucide-react';
import BrightloopLogo from '../../Components/Shared/BrightloopLogo';

export default function Home() {
  return (
    <div className="space-y-16 py-6 animate-fadeIn">
      {/* Hero Section */}
      <div className="relative text-center max-w-4xl mx-auto pt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>The 2026 Subscription Intelligence Standard</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-deepNavy tracking-tight leading-[1.1]">
          Everything subscriptions. <br />
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            One beautiful platform.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slateGray max-w-2xl mx-auto leading-relaxed">
          Brightloop brings billing automation, churn prevention, and product catalog management into a high-speed, modern interface engineered for high-growth SaaS teams.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Start Free 14-Day Pro Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-deepNavy bg-white border border-softLavender hover:border-slateGray/30 shadow-xs hover:shadow-sm transition"
          >
            Explore Live Dashboard
          </Link>
        </div>
      </div>

      {/* Hero Mockup Preview */}
      <div className="relative mx-auto max-w-6xl rounded-2xl bg-white p-3 border border-softLavender shadow-premium">
        <div className="bg-mainBg rounded-xl overflow-hidden border border-softLavender p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 border-b border-softLavender">
            <div className="flex items-center gap-3">
              <BrightloopLogo className="w-8 h-8" textClassName="text-base font-extrabold text-deepNavy" />
              <span className="text-xs text-slateGray font-medium hidden sm:inline">/ Enterprise Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                ● Live Operations
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white p-5 rounded-xl border border-softLavender shadow-xs">
              <p className="text-xs text-slateGray font-bold uppercase tracking-wider">Annual Recurring Run-Rate</p>
              <p className="text-2xl font-black text-deepNavy mt-1">$2,983,800.00</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">↑ +32.4% year-over-year</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-softLavender shadow-xs">
              <p className="text-xs text-slateGray font-bold uppercase tracking-wider">Global Subscribers</p>
              <p className="text-2xl font-black text-deepNavy mt-1">42,910</p>
              <p className="text-xs text-primary font-semibold mt-1">across 64 countries</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-softLavender shadow-xs">
              <p className="text-xs text-slateGray font-bold uppercase tracking-wider">Failed Payment Recovery</p>
              <p className="text-2xl font-black text-deepNavy mt-1">94.8%</p>
              <p className="text-xs text-accent font-semibold mt-1">Instant dunning rescue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-6">
        {[
          {
            icon: Zap,
            title: 'Linear & Stripe Simplicity',
            desc: 'Keyboard-first navigation, instant live filtering, and zero-latency database responses.',
          },
          {
            icon: ShieldCheck,
            title: 'Bulletproof Nodemailer OTP',
            desc: 'Strict verified email onboarding with in-memory validation and anti-thread headers.',
          },
          {
            icon: TrendingUp,
            title: 'Intelligent Billing Logic',
            desc: 'Automate tiered rates, usage meters, and custom enterprise contracts in seconds.',
          },
        ].map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="bg-white p-7 rounded-2xl border border-softLavender shadow-premium">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white mb-4 shadow-md shadow-primary/10">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-deepNavy">{feat.title}</h3>
              <p className="text-xs text-slateGray mt-2 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
