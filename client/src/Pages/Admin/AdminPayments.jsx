import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  RefreshCw, 
  CreditCard, 
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  User,
  Layers
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function AdminPayments() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State for Creating Subscription (Admin)
  const [showModal, setShowModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: '',
    serviceId: '',
    startDate: new Date().toISOString().split('T')[0],
    durationInDays: '30',
    amountPaid: ''
  });

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/subscriptions').catch(() => axiosInstance.get('/subscriptions/all')).catch(() => null);
      if (res?.data?.subscriptions) {
        setSubscriptions(res.data.subscriptions);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async () => {
    try {
      const [usersRes, servicesRes] = await Promise.all([
        axiosInstance.get('/admin/users').catch(() => null),
        axiosInstance.get('/service').catch(() => axiosInstance.get('/services')).catch(() => null)
      ]);

      if (usersRes?.data?.users) {
        setAvailableUsers(usersRes.data.users);
        if (usersRes.data.users.length > 0 && !form.userId) {
          setForm(prev => ({ ...prev, userId: usersRes.data.users[0]._id }));
        }
      }

      const services = servicesRes?.data?.services || [];
      setAvailableServices(services);
      if (services.length > 0 && !form.serviceId) {
        setForm(prev => ({ 
          ...prev, 
          serviceId: services[0]._id,
          amountPaid: services[0].price || '0',
          durationInDays: services[0].duration ? services[0].duration.toString() : '30'
        }));
      }
    } catch (err) {
      console.error('Error fetching modal options:', err);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openCreateModal = () => {
    fetchModalData();
    setShowModal(true);
  };

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    const selectedService = availableServices.find(s => s._id === selectedId);
    setForm(prev => ({
      ...prev,
      serviceId: selectedId,
      amountPaid: selectedService?.price || prev.amountPaid,
      durationInDays: selectedService?.duration ? selectedService.duration.toString() : prev.durationInDays
    }));
  };

  const handleCreateSubscriptionSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.serviceId) {
      toast.warn('Please select both a customer and a service');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        userId: form.userId,
        serviceId: form.serviceId,
        startDate: form.startDate,
        durationInDays: Number(form.durationInDays) || 30,
        amountPaid: Number(form.amountPaid) || 0
      };

      const res = await axiosInstance.post('/subscriptions', payload);
      if (res.data?.success) {
        toast.success('Subscription created and recorded in database!');
        setShowModal(false);
        fetchSubscriptions();
      } else {
        toast.error(res.data?.message || 'Failed to create subscription');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSettled = subscriptions.reduce((sum, s) => sum + (Number(s.amountPaid) || Number(s.price) || 0), 0);

  const filtered = subscriptions.filter(s => 
    s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.serviceId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.planName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Payments & Subscriptions</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              ${totalSettled} Settled
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">
            Real-time transaction settlement, active subscriber billing, and payment records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchSubscriptions}
            disabled={loading}
            className="p-2 text-slateGray hover:text-deepNavy rounded-xl border border-softLavender hover:bg-mainBg transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, email, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-mainBg border border-softLavender rounded-xl text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <div className="text-xs text-slateGray font-medium">
          {filtered.length} Records
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slateGray">
            Loading payment transactions...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-mainBg text-[10px] font-black uppercase tracking-wider text-slateGray border-b border-softLavender">
                  <th className="py-3 px-5">Subscriber</th>
                  <th className="py-3 px-5">Service / Plan</th>
                  <th className="py-3 px-5">Amount Paid</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Start Date</th>
                  <th className="py-3 px-5">Renewal / Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-softLavender text-xs">
                {filtered.length > 0 ? (
                  filtered.map((sub) => {
                    const userName = sub.userId?.name || 'Customer';
                    const userEmail = sub.userId?.email || '—';
                    const serviceName = sub.serviceId?.name || sub.planName || 'Software Service';
                    const amount = sub.amountPaid !== undefined ? sub.amountPaid : (sub.price || 0);

                    return (
                      <tr key={sub._id} className="hover:bg-mainBg/40 transition">
                        <td className="py-3.5 px-5">
                          <p className="font-bold text-deepNavy">{userName}</p>
                          <p className="text-[11px] text-slateGray">{userEmail}</p>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-deepNavy">
                          {serviceName}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-deepNavy">
                          ${amount}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slateGray border border-slate-200'
                          }`}>
                            {sub.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-[11px] text-slateGray">
                          {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-5 text-[11px] text-deepNavy font-medium">
                          {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : (sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slateGray">
                      No payment or subscription transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SUBSCRIPTION MODAL (ADMIN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-softLavender shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-softLavender">
              <div>
                <h3 className="text-base font-black text-deepNavy">Create New Subscription</h3>
                <p className="text-xs text-slateGray">Persists directly into MongoDB `Subscription` collection.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscriptionSubmit} className="space-y-3.5 text-xs">
              {/* Select User */}
              <div>
                <label className="font-bold text-deepNavy block mb-1">Select Customer / Subscriber *</label>
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Choose customer</option>
                  {availableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Service */}
              <div>
                <label className="font-bold text-deepNavy block mb-1">Select Service Package *</label>
                <select
                  required
                  value={form.serviceId}
                  onChange={handleServiceChange}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Choose service package</option>
                  {availableServices.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} - ${s.price} ({s.duration || 30} Days)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates & Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.durationInDays}
                    onChange={(e) => setForm({ ...form, durationInDays: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Amount Paid ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.amountPaid}
                  onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-softLavender text-slateGray hover:text-deepNavy rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Subscription to DB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
