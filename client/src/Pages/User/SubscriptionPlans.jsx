import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Layers,
  Crown,
  Inbox
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user?.userData);

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get('/subscriptions/plans');
        if (res.data?.success) {
          setPlans(res.data.plans || []);
        }
      } catch (err) {
        console.error('Failed to load database plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planIdentifier, planName) => {
    if (!currentUser) {
      toast.info('Please log in to choose a subscription plan');
      navigate('/login');
      return;
    }

    setSubscribingId(planIdentifier);
    try {
      const res = await axiosInstance.post('/subscriptions/subscribe', {
        planId: planIdentifier,
        billingCycle
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Subscribed to ${planName}!`);
        navigate('/subscriptions');
      } else {
        toast.error(res.data?.message || 'Subscription failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error subscribing to plan';
      toast.error(msg);
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-flex items-center gap-1.5 mb-3">
          <Crown className="w-3.5 h-3.5" /> Database Plans Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight">
          Subscription Tiers
        </h1>
        <p className="text-xs sm:text-sm text-slateGray mt-2">
          Plans retrieved directly from the database for your Brightloop portal.
        </p>

        {/* Billing cycle toggle */}
        {plans.length > 0 && (
          <div className="mt-6 inline-flex items-center p-1 bg-mainBg border border-softLavender rounded-2xl shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-deepNavy shadow-xs'
                  : 'text-slateGray hover:text-deepNavy'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slateGray hover:text-deepNavy'
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                billingCycle === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-16 text-center">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slateGray">Loading database subscription plans...</p>
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const planKey = plan._id || plan.planCode || plan.planId;
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isPopular = plan.popular;

            return (
              <div
                key={planKey}
                className={`bg-white rounded-3xl p-7 transition-all duration-300 relative flex flex-col justify-between ${
                  isPopular
                    ? 'border-2 border-primary shadow-glow-indigo shadow-lg scale-102 z-10'
                    : 'border border-softLavender shadow-premium hover:shadow-premium-hover'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-deepNavy">{plan.name}</h3>
                    {isPopular && <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slateGray mt-1 min-h-[32px]">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-softLavender">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-deepNavy tracking-tight">${price}</span>
                      <span className="text-xs font-semibold text-slateGray">/ month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">
                        Billed annually (${price * 12}/year)
                      </p>
                    )}
                  </div>

                  {/* Features list */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-deepNavy">
                        Included Features:
                      </p>
                      <ul className="space-y-2.5 text-xs text-slateGray">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Subscribe CTA */}
                <div className="mt-8 pt-4">
                  <button
                    onClick={() => handleSubscribe(planKey, plan.name)}
                    disabled={subscribingId === planKey}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isPopular
                        ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white shadow-primary/20'
                        : 'bg-mainBg hover:bg-primary hover:text-white text-deepNavy border border-softLavender'
                    } disabled:opacity-50`}
                  >
                    <span>
                      {subscribingId === planKey
                        ? 'Subscribing...'
                        : `Subscribe to ${plan.name}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State when zero plans in MongoDB */
        <div className="bg-white rounded-3xl border border-softLavender p-10 sm:p-14 text-center shadow-premium">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-deepNavy">No Subscription Plans Found in Database</h2>
          <p className="text-xs sm:text-sm text-slateGray max-w-md mx-auto mt-2">
            There are currently no active subscription plans stored in the database. When plans are added to MongoDB, they will automatically be displayed here.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Guarantee Banner */}
      <div className="p-6 bg-white rounded-2xl border border-softLavender shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-deepNavy">Enterprise-grade Security</h4>
            <p className="text-[11px] text-slateGray mt-0.5">All billing and subscriptions are securely managed in database.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
