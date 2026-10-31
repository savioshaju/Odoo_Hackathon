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
  Percent,
  Layers,
  Clock,
  Package
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user?.userData);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track selected plan index per product: { [productId]: planIndex }
  const [selectedPlanIndexByProduct, setSelectedPlanIndexByProduct] = useState({});

  // Checkout Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPlanOption, setSelectedPlanOption] = useState(null);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [subscribing, setSubscribing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        let res = await axiosInstance.get('/service').catch(() => null);
        if (!res?.data?.services && !res?.data?.plans) {
          res = await axiosInstance.get('/services').catch(() => null);
        }
        if (!res?.data?.services && !res?.data?.plans) {
          res = await axiosInstance.get('/subscriptions/plans').catch(() => null);
        }

        const items = res?.data?.services || res?.data?.plans || [];
        setProducts(items);
      } catch (err) {
        console.error('Failed to load database plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const getProductPlans = (product) => {
    if (Array.isArray(product.plans) && product.plans.length > 0) {
      return product.plans;
    }
    return [
      {
        name: 'Standard Plan',
        duration: Number(product.duration) || 30,
        price: Number(product.price) || 49,
        discountPercentage: 0
      }
    ];
  };

  const getActivePlan = (product) => {
    const plans = getProductPlans(product);
    const idx = selectedPlanIndexByProduct[product._id] || 0;
    return plans[idx] || plans[0];
  };

  const handleSelectPlan = (productId, planIndex) => {
    setSelectedPlanIndexByProduct(prev => ({
      ...prev,
      [productId]: planIndex
    }));
  };

  const openCheckoutModal = (product) => {
    if (!currentUser) {
      toast.info('Please log in to choose a subscription plan');
      navigate('/login');
      return;
    }
    const activePlan = getActivePlan(product);
    setSelectedProduct(product);
    setSelectedPlanOption(activePlan);
    setStartDate(new Date().toISOString().split('T')[0]);
    setCouponCode('');
    setAppliedDiscount(null);
  };

  const calculatePlanFinalPrice = (plan) => {
    if (!plan) return 0;
    const base = Number(plan.price) || 0;
    const disc = Number(plan.discountPercentage) || 0;
    if (disc > 0) {
      return Math.max(0, base - (base * disc / 100));
    }
    return base;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.warn('Please enter a coupon code');
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await axiosInstance.post('/discounts/validate', {
        code: couponCode.trim(),
        serviceId: selectedProduct?._id
      });

      if (res.data?.success && res.data?.discount) {
        const disc = res.data.discount;
        const planPrice = calculatePlanFinalPrice(selectedPlanOption);
        let extraSaving = 0;
        if (disc.type === 'percentage') {
          extraSaving = (planPrice * disc.value) / 100;
        } else {
          extraSaving = Math.min(planPrice, disc.value);
        }
        const finalPrice = Math.max(0, planPrice - extraSaving);

        setAppliedDiscount({
          ...disc,
          extraSaving,
          finalPrice
        });
        toast.success(`Coupon ${disc.code} applied! Saved an extra $${extraSaving.toFixed(2)}`);
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

  const handleConfirmSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPlanOption) return;

    const serviceId = selectedProduct._id;
    const planFinalPrice = calculatePlanFinalPrice(selectedPlanOption);
    const finalAmount = appliedDiscount ? appliedDiscount.finalPrice : planFinalPrice;
    const userId = currentUser.id || currentUser._id;
    const duration = Number(selectedPlanOption.duration) || 30;

    setSubscribing(true);
    try {
      const res = await axiosInstance.post('/subscriptions', {
        serviceId,
        userId,
        startDate,
        durationInDays: duration,
        planName: selectedPlanOption.name,
        amountPaid: finalAmount
      }).catch(() => 
        axiosInstance.post('/subscriptions/subscribe', {
          planId: selectedProduct.planCode || serviceId,
          billingCycle: 'monthly',
          amountPaid: finalAmount,
          planName: selectedPlanOption.name
        })
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Subscribed to ${selectedProduct.name} - ${selectedPlanOption.name}!`);
        setSelectedProduct(null);
        setSelectedPlanOption(null);
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

  const calculateEndDate = (start, durationDays) => {
    if (!start) return '';
    const d = new Date(start);
    d.setDate(d.getDate() + Number(durationDays || 30));
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 inline-flex items-center gap-1.5 mb-3">
          <Crown className="w-3.5 h-3.5" /> Select Your Subscription Plan
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight">
          Flexible Subscription Options
        </h1>
        <p className="text-xs sm:text-sm text-slateGray mt-2">
          Choose from custom plan durations and automatic discount rates configured under each product.
        </p>
      </div>

      {/* Products & Plans Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-softLavender shadow-premium">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slateGray">Loading products and subscription plans...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {products.map((product) => {
            const productPlans = getProductPlans(product);
            const activePlan = getActivePlan(product);
            const activeIndex = selectedPlanIndexByProduct[product._id] || 0;

            const basePrice = Number(activePlan.price) || 0;
            const discountPct = Number(activePlan.discountPercentage) || 0;
            const planFinalPrice = calculatePlanFinalPrice(activePlan);
            const savingsAmount = basePrice - planFinalPrice;

            return (
              <div
                key={product._id || product.planCode}
                className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative border border-softLavender hover:shadow-premium-hover shadow-premium"
              >
                <div>
                  {/* Product Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-primary">
                          <Package className="w-5 h-5" />
                        </span>
                        <h3 className="text-2xl font-black text-deepNavy">{product.name}</h3>
                      </div>
                      <p className="text-xs text-slateGray mt-2 leading-relaxed">
                        {product.description || 'Full recurring access to software capabilities.'}
                      </p>
                    </div>

                    {discountPct > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full shadow-xs shrink-0 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        Save {discountPct}%
                      </span>
                    )}
                  </div>

                  {/* Multi-Plan Selection Buttons Under The Same Product */}
                  <div className="mt-6 pt-5 border-t border-softLavender">
                    <label className="text-xs font-extrabold text-deepNavy uppercase tracking-wider block mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-primary" />
                        <span>Select Plan Duration</span>
                      </span>
                      <span className="text-[11px] text-slateGray lowercase font-normal">
                        ({productPlans.length} duration options)
                      </span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {productPlans.map((planOption, pIdx) => {
                        const isSelected = pIdx === activeIndex;
                        const optBase = Number(planOption.price) || 0;
                        const optDisc = Number(planOption.discountPercentage) || 0;
                        const optFinal = optDisc > 0 ? optBase - (optBase * optDisc / 100) : optBase;

                        return (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleSelectPlan(product._id, pIdx)}
                            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                                : 'bg-mainBg/60 border-softLavender hover:border-primary/40 hover:bg-mainBg'
                            }`}
                          >
                            {optDisc > 0 && (
                              <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                                -{optDisc}%
                              </span>
                            )}
                            <div>
                              <div className={`font-black text-xs ${isSelected ? 'text-primary' : 'text-deepNavy'}`}>
                                {planOption.name}
                              </div>
                              <div className="text-[10px] text-slateGray mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{planOption.duration} Days</span>
                              </div>
                            </div>
                            <div className="mt-2 text-xs font-extrabold text-deepNavy">
                              ${optFinal.toFixed(0)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Highlighted Selected Price Display */}
                  <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-slateGray uppercase tracking-wider">
                        {activePlan.name} · {activePlan.duration} Days Access
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl sm:text-4xl font-black text-deepNavy tracking-tight">
                          ${planFinalPrice.toFixed(2)}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-sm font-semibold text-slateGray line-through">
                            ${basePrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-xs text-slateGray font-medium">/ total</span>
                      </div>
                    </div>

                    {discountPct > 0 && (
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                          ${savingsAmount.toFixed(2)} Saved
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mt-6 space-y-2.5">
                      <p className="text-xs font-black uppercase tracking-wider text-deepNavy">
                        Included in this package:
                      </p>
                      {product.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-deepNavy font-medium">
                          <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subscribe Button */}
                <div className="mt-8 pt-6 border-t border-softLavender">
                  <button
                    type="button"
                    onClick={() => openCheckoutModal(product)}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                  >
                    <span>Subscribe to {activePlan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-softLavender shadow-premium flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-deepNavy">No Subscription Plans Found</h3>
          <p className="text-xs text-slateGray max-w-sm mt-1 mb-4">
            No products are currently available in the database.
          </p>
          <Link
            to="/admin/services"
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Create Product in Admin
          </Link>
        </div>
      )}

      {/* Interactive Checkout Modal */}
      {selectedProduct && selectedPlanOption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deepNavy/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-softLavender relative animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-softLavender">
              <div>
                <h3 className="text-lg font-black text-deepNavy">Confirm Subscription Plan</h3>
                <p className="text-[11px] text-slateGray">Complete your subscription setup</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setSelectedPlanOption(null); setAppliedDiscount(null); }}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubscribe} className="space-y-4 text-xs pt-4">
              {/* Product & Selected Plan Summary */}
              <div className="p-4 bg-mainBg rounded-2xl border border-softLavender space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-extrabold text-deepNavy text-sm block">
                      {selectedProduct.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1">
                      <Layers className="w-3 h-3" />
                      Plan: {selectedPlanOption.name} ({selectedPlanOption.duration} Days)
                    </span>
                  </div>

                  <div className="text-right">
                    {selectedPlanOption.discountPercentage > 0 && (
                      <span className="text-[10px] text-slateGray line-through block">
                        ${Number(selectedPlanOption.price).toFixed(2)}
                      </span>
                    )}
                    <span className="text-base font-black text-deepNavy">
                      ${calculatePlanFinalPrice(selectedPlanOption).toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedPlanOption.discountPercentage > 0 && (
                  <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span>Plan Promotional Discount ({selectedPlanOption.discountPercentage}% OFF)</span>
                    <span>-${(Number(selectedPlanOption.price) * selectedPlanOption.discountPercentage / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Start Date & End Date Preview */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Start Date *</label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slateGray absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-deepNavy block mb-1">End Date</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slateGray absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      disabled
                      value={calculateEndDate(startDate, selectedPlanOption.duration)}
                      className="w-full pl-8 pr-2.5 py-2 bg-gray-100 border border-softLavender rounded-xl text-slateGray text-xs cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Promotional Coupon Code Section */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-deepNavy flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Promo / Coupon Code (Optional)</span>
                </label>

                {appliedDiscount ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {appliedDiscount.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% OFF` : `$${appliedDiscount.value} OFF`}
                        {' '}(-${appliedDiscount.extraSaving.toFixed(2)})
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
                      placeholder="e.g. SAVE20, FLASH10"
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
                      {validatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Billing Preview */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-deepNavy">Direct Billing</p>
                    <p className="text-[10px] text-slateGray">Card on file (•••• 4242)</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slateGray">Final Total:</div>
                  <div className="text-base font-black text-emerald-700">
                    ${(appliedDiscount ? appliedDiscount.finalPrice : calculatePlanFinalPrice(selectedPlanOption)).toFixed(2)}
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
                  onClick={() => { setSelectedProduct(null); setSelectedPlanOption(null); setAppliedDiscount(null); }}
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
                    : `Confirm & Pay $${(appliedDiscount ? appliedDiscount.finalPrice : calculatePlanFinalPrice(selectedPlanOption)).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
