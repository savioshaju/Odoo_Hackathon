import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  X,
  Package
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function ProductVariants() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    features: ''
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/service').catch(() => axiosInstance.get('/services')).catch(() => null);
      if (res?.data?.services) {
        setPlans(res.data.services);
      }
    } catch (err) {
      console.error('Failed to load variants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast.warn('Please provide name and price');
      return;
    }

    setSubmitting(true);
    try {
      const parsedFeatures = formData.features
        ? formData.features.split('\n').map(f => f.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        companyId: '6ae5be46084c29e301fedb60',
        description: formData.description.trim() || `${formData.name.trim()} packaging tier`,
        price: formData.price.toString(),
        duration: Number(formData.duration) || 30,
        features: parsedFeatures,
        isActive: true
      };

      const res = await axiosInstance.post('/service', payload).catch(() => 
        axiosInstance.post('/services', payload)
      );

      if (res.data?.success) {
        toast.success('Product variant created in database!');
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '30',
          features: ''
        });
        fetchPlans();
      } else {
        toast.error(res.data?.message || 'Failed to create variant');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving variant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${planName}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/service/${planId}`).catch(() => 
        axiosInstance.delete(`/services/${planId}`)
      );
      if (res.data?.success) {
        toast.info('Variant deactivated');
        setPlans(plans.filter(p => p._id !== planId));
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete variant');
    }
  };

  const filtered = plans.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Product Variants</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              {filtered.length} {filtered.length === 1 ? 'Variant' : 'Variants'}
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">
            Configure regional editions, seat counts, and recurring duration packages.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product Variant</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search variants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-mainBg border border-softLavender rounded-xl text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <button
          onClick={fetchPlans}
          disabled={loading}
          className="p-2 text-slateGray hover:text-deepNavy rounded-xl border border-softLavender hover:bg-mainBg transition cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Grid of Variants */}
      {loading ? (
        <div className="p-16 text-center text-xs font-bold text-slateGray bg-white rounded-2xl border border-softLavender">
          Loading product variants...
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div 
              key={p._id} 
              className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slateGray bg-mainBg px-2 py-0.5 rounded-md border border-softLavender">
                  ID: {p._id.slice(-6)}
                </span>
                <h4 className="text-base font-bold text-deepNavy mt-2">{p.name}</h4>
                <p className="text-xs text-slateGray mt-0.5">{p.description}</p>

                <div className="mt-4 pt-3 border-t border-softLavender flex items-baseline gap-2">
                  <span className="text-2xl font-black text-deepNavy">${p.price}</span>
                  <span className="text-xs text-slateGray">/ {p.duration ? `${p.duration} Days` : '30 Days'}</span>
                </div>

                {p.features && p.features.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slateGray">Features:</p>
                    {p.features.map((f, i) => (
                      <div key={i} className="text-xs text-deepNavy/80 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-softLavender flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
                <button
                  onClick={() => handleDeletePlan(p._id, p.name)}
                  className="p-1.5 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  title="Deactivate variant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-softLavender flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-deepNavy">No Product Variants Recorded</h3>
          <p className="text-xs text-slateGray max-w-sm mt-1 mb-4">
            Add regional editions, seat tiers, or packaging configurations to your database.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Variant</span>
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-softLavender shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-softLavender">
              <div>
                <h3 className="text-base font-black text-deepNavy">Add Product Variant</h3>
                <p className="text-xs text-slateGray">Persists directly into MongoDB `Service` collection.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-deepNavy block mb-1">Variant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Tier (US-East)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Edition details and inclusions"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="79"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                  />
                </div>
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Features (One per line)</label>
                <textarea
                  rows="3"
                  placeholder="50 Seats included&#10;Custom domain&#10;Priority SLA"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

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
                  {submitting ? 'Saving...' : 'Save Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

