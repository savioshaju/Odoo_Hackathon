import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Receipt, 
  XCircle
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function Subscriptions() {
  const currentUser = useSelector((state) => state.user?.userData);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // First try /subscriptions/my, then /subscriptions/user/:id
      const userId = currentUser?._id || currentUser?.id;
      let res = await axiosInstance.get('/subscriptions/my').catch(() => null);
      if (!res?.data?.success && userId) {
        res = await axiosInstance.get(`/subscriptions/user/${userId}`).catch(() => null);
      }
      if (res?.data?.success) {
        setSubscriptions(res.data.subscriptions || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentUser]);

  const handleCancelSubscription = async (id, planName) => {
    if (!window.confirm(`Are you sure you want to cancel your ${planName} subscription?`)) {
      return;
    }

    setCancelingId(id);
    try {
      const res = await axiosInstance.patch(`/subscriptions/${id}/cancel`).catch(() => 
        axiosInstance.post(`/subscriptions/cancel/${id}`)
      );
      if (res.data?.success) {
        toast.info(`Your ${planName} subscription has been canceled.`);
        fetchSubscriptions();
      } else {
        toast.error(res.data?.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error canceling subscription');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
              My Subscriptions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {subscriptions.filter(s => s.status === 'active').length} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slateGray mt-1">
            Manage your subscribed plans, service renewals, and billing records.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="p-2 text-slateGray hover:text-deepNavy rounded-xl border border-softLavender hover:bg-mainBg transition cursor-pointer"
            title="Refresh subscriptions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <Link
            to="/subscription-plans"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer text-center"
          >
            <Plus className="w-4 h-4" />
            <span>Browse Plans & Upgrade</span>
          </Link>
        </div>
      </div>

      {/* Subscriptions Content */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-softLavender shadow-premium">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slateGray">Loading your active subscriptions...</p>
        </div>
      ) : subscriptions.length > 0 ? (
        <div className="space-y-5">
          {/* Active Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map((sub) => {
              const isActive = sub.status === 'active';
              const name = sub.serviceId?.name || sub.planName || 'Active Subscription';
              const price = sub.amountPaid !== undefined ? sub.amountPaid : (sub.price || 0);
              const nextDate = sub.endDate || sub.nextBillingDate;
              const features = sub.serviceId?.features || sub.features || [];

              return (
                <div
                  key={sub._id}
                  className={`bg-white rounded-2xl border p-6 shadow-premium transition relative flex flex-col justify-between ${
                    isActive ? 'border-primary/30 ring-1 ring-primary/10' : 'border-softLavender opacity-80'
                  }`}
                >
                  <div>
                    {/* Top pill & status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {sub.serviceId?.duration ? `${sub.serviceId.duration} Days` : 'Subscription'}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {sub.status ? sub.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </div>

                    {/* Plan Name & Price */}
                    <h3 className="text-xl font-black text-deepNavy">{name}</h3>
                    {sub.serviceId?.description && (
                      <p className="text-xs text-slateGray mt-1 line-clamp-2">{sub.serviceId.description}</p>
                    )}
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-deepNavy">${price}</span>
                      <span className="text-xs font-semibold text-slateGray">paid</span>
                    </div>

                    {/* Dates */}
                    <div className="mt-4 pt-4 border-t border-softLavender space-y-1.5 text-xs text-slateGray">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" /> Started:
                        </span>
                        <span className="font-semibold text-deepNavy">
                          {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      {nextDate && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-accent" /> {isActive ? 'Expires / Renews:' : 'Ended:'}
                          </span>
                          <span className="font-bold text-primary">
                            {new Date(nextDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features summary */}
                    {features.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-softLavender">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray mb-2">
                          Included Benefits:
                        </p>
                        <ul className="space-y-1.5 text-xs text-slateGray">
                          {features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-softLavender flex items-center justify-between">
                    <Link
                      to="/invoices"
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Invoices</span>
                    </Link>

                    {isActive && (
                      <button
                        onClick={() => handleCancelSubscription(sub._id, name)}
                        disabled={cancelingId === sub._id}
                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {cancelingId === sub._id ? 'Canceling...' : 'Cancel Subscription'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-softLavender p-10 sm:p-14 text-center shadow-premium">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-deepNavy">No Active Subscriptions Found</h2>
          <p className="text-xs text-slateGray max-w-md mx-auto mt-1 leading-relaxed">
            You do not currently have any active software subscriptions. Browse the plans catalog to get started.
          </p>
          <div className="mt-6">
            <Link
              to="/subscription-plans"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer"
            >
              <span>Explore Subscription Plans</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
