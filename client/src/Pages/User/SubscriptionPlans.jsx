import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Check, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Crown,
  Inbox,
  CreditCard,
  Calendar,
  ShieldCheck,
  X,
  Tag,
  Percent
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user?.userData);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Checkout Modal State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subscribing, setSubscribing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warn('Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await axiosInstance.post('/discounts/validate', {
        code: couponCode.trim(),
        serviceId: selectedPlan?._id
      });

      if (res.data?.success && res.data?.discount) {
        const disc = res.data.discount;
        const basePrice = Number(selectedPlan.price || selectedPlan.monthlyPrice) || 0;
        let saving = 0;
        if (disc.type === 'percentage') {
          saving = (basePrice * disc.value) / 100;
        } else {
          saving = Math.min(basePrice, disc.value);
        }
        const finalPrice = Math.max(0, basePrice - saving);

        setAppliedDiscount({
          ...disc,
          saving,
          finalPrice
        });
        toast.success(`Coupon ${disc.code} applied! Saved $${saving.toFixed(2)}`);
      } else {
        toast.error('Invalid coupon code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode('');
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        let res = await axiosInstance.get('/service').catch(() => null);
        if (!res?.data?.services && !res?.data?.plans) {
          res = await axiosInstance.get('/services').catch(() => null);
        }
        if (!res?.data?.services && !res?.data?.plans) {
          res = await axiosInstance.get('/subscriptions/plans').catch(() => null);
        }

        const items = res?.data?.services || res?.data?.plans || [];
        setPlans(items);
      } catch (err) {
        console.error('Failed to load database plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const openCheckoutModal = (plan) => {
    if (!currentUser) {
      toast.info('Please log in to choose a subscription plan');
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const serviceId = selectedPlan._id;
    const basePrice = parseFloat(selectedPlan.price) || selectedPlan.monthlyPrice || 0;
    const price = appliedDiscount ? appliedDiscount.finalPrice : basePrice;
    const userId = currentUser.id || currentUser._id;
    const duration = Number(selectedPlan.duration) || 30;

    setSubscribing(true);
    try {
      const res = await axiosInstance.post('/subscriptions', {
        serviceId,
        userId,
        startDate,
        durationInDays: duration,
        amountPaid: price
      }).catch(() => 
        axiosInstance.post('/subscriptions/subscribe', {
          planId: selectedPlan.planCode || serviceId,
          billingCycle: 'monthly',
          amountPaid: price
        })
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Subscribed to ${selectedPlan.name}!`);
        setSelectedPlan(null);
        navigate('/subscriptions');
      } else {
        toast.error(res.data?.message || 'Subscription failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error subscribing to plan';
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-flex items-center gap-1.5 mb-3">
          <Crown className="w-3.5 h-3.5" /> Flexible Subscription Tiers
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight">
          Subscription Tiers
        </h1>
        <p className="text-xs sm:text-sm text-slateGray mt-2">
          Transparent, flexible software subscription packaging directly backed by our database.
        </p>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-softLavender shadow-premium">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slateGray">Loading subscription plans...</p>
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {plans.map((plan) => {
            const price = plan.price !== undefined ? plan.price : plan.monthlyPrice;
            const duration = plan.duration ? `${plan.duration} Days` : 'Monthly';

            return (
              <div
                key={plan._id || plan.planCode}
                className={`bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border border-softLavender hover:shadow-premium-hover ${
                  plan.popular ? 'border-primary ring-2 ring-primary/20 shadow-xl' : 'shadow-premium'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-secondary text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-deepNavy">{plan.name}</h3>
                    {plan.popular && <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-slateGray mt-1 min-h-[32px]">
                    {plan.description || plan.tagline || 'Full SaaS software suite.'}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-softLavender">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-deepNavy tracking-tight">${price}</span>
                      <span className="text-xs font-semibold text-slateGray">/ {duration}</span>
                    </div>
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

                {/* Subscribe Button */}
                <div className="mt-8 pt-5 border-t border-softLavender">
                  <button
                    onClick={() => openCheckoutModal(plan)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white shadow-primary/25'
                        : 'bg-deepNavy hover:bg-deepNavy/90 text-white'
                    }`}
                  >
                    <span>Subscribe to {plan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-softLavender p-12 text-center shadow-premium max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-deepNavy">No Active Plans Yet</h3>
          <p className="text-xs text-slateGray max-w-sm mx-auto mt-1">
            There are currently no active plans in the database. Please check back soon or contact support.
          </p>
          <div className="mt-5">
            <Link
              to="/dashboard"
              className="text-xs font-bold text-primary hover:underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION CHECKOUT MODAL */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-softLavender shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-softLavender">
              <div>
                <h3 className="text-base font-black text-deepNavy">New Subscription Checkout</h3>
                <p className="text-xs text-slateGray">Select your start date and review pricing.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubscribe} className="space-y-4 text-xs">
              {/* Plan Card Summary */}
              <div className="p-3.5 bg-mainBg rounded-xl border border-softLavender space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-deepNavy text-sm">{selectedPlan.name}</span>
                  <span className="text-base font-black text-primary">${selectedPlan.price || selectedPlan.monthlyPrice}</span>
                </div>
                <p className="text-[11px] text-slateGray">{selectedPlan.description || 'Full recurring access'}</p>
                <div className="text-[10px] text-slateGray font-medium pt-1">
                  Duration: <span className="font-bold text-deepNavy">{selectedPlan.duration || 30} Days</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="font-bold text-deepNavy block mb-1">Subscription Start Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slateGray absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Promo Code / Discount Section */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-deepNavy flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Promo / Discount Code</span>
                </label>

                {appliedDiscount ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {appliedDiscount.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% OFF` : `$${appliedDiscount.value} OFF`}
                        {' '}(-${appliedDiscount.saving.toFixed(2)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SAVE20, LAUNCH50"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs uppercase font-mono font-semibold placeholder:normal-case placeholder:font-normal focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      className="px-3.5 py-2 bg-deepNavy hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {validatingCoupon ? 'Validating...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Method Preview */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-deepNavy">Direct Billing</p>
                    <p className="text-[10px] text-slateGray">Card on file (•••• 4242)</p>
                  </div>
                </div>
                <div className="text-right">
                  {appliedDiscount && (
                    <div className="text-[10px] text-slateGray line-through">
                      ${Number(selectedPlan.price || selectedPlan.monthlyPrice).toFixed(2)}
                    </div>
                  )}
                  <div className="text-sm font-black text-emerald-700">
                    ${(appliedDiscount ? appliedDiscount.finalPrice : Number(selectedPlan.price || selectedPlan.monthlyPrice)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Subscriber info */}
              <div className="text-[11px] text-slateGray">
                Subscribing account: <span className="font-bold text-deepNavy">{currentUser?.name}</span> ({currentUser?.email})
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => { setSelectedPlan(null); setAppliedDiscount(null); setCouponCode(''); }}
                  className="px-4 py-2 border border-softLavender text-slateGray hover:text-deepNavy rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {subscribing 
                    ? 'Creating Subscription...' 
                    : `Confirm & Pay $${(appliedDiscount ? appliedDiscount.finalPrice : Number(selectedPlan.price || selectedPlan.monthlyPrice)).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
