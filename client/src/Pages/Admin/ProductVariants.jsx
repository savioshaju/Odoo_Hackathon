import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  X,
  Package,
  Percent,
  Tag,
  Calendar,
  Clock,
  ArrowRight,
  Edit2,
  Sparkles
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function ProductVariants() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form data for Product and its multiple subscription plans
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: '',
    plans: [
      { name: 'Monthly Plan', duration: 30, price: '49', discountPercentage: 0 },
      { name: 'Annual Plan', duration: 365, price: '399', discountPercentage: 20 }
    ]
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const [res, discRes] = await Promise.all([
        axiosInstance.get('/service').catch(() => axiosInstance.get('/services')).catch(() => null),
        axiosInstance.get('/discounts').catch(() => null)
      ]);
      if (res?.data?.services) {
        setPlans(res.data.services);
      }
      if (discRes?.data?.discounts) {
        setDiscounts(discRes.data.discounts);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      features: '',
      plans: [
        { name: 'Monthly Plan', duration: 30, price: '49', discountPercentage: 0 },
        { name: 'Annual Plan', duration: 365, price: '399', discountPercentage: 20 }
      ]
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const existingPlans = Array.isArray(product.plans) && product.plans.length > 0
      ? product.plans.map(p => ({
          name: p.name || 'Standard Plan',
          duration: p.duration || 30,
          price: p.price || product.price || '49',
          discountPercentage: p.discountPercentage || 0
        }))
      : [
          {
            name: 'Standard Plan',
            duration: Number(product.duration) || 30,
            price: product.price || '49',
            discountPercentage: 0
          }
        ];

    setFormData({
      name: product.name || '',
      description: product.description || '',
      features: Array.isArray(product.features) ? product.features.join('\n') : '',
      plans: existingPlans
    });
    setShowModal(true);
  };

  const handleAddPlanRow = () => {
    setFormData(prev => ({
      ...prev,
      plans: [
        ...prev.plans,
        { name: 'Quarterly Plan', duration: 90, price: '129', discountPercentage: 10 }
      ]
    }));
  };

  const handleRemovePlanRow = (index) => {
    if (formData.plans.length <= 1) {
      toast.warn('At least one subscription plan is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      plans: prev.plans.filter((_, i) => i !== index)
    }));
  };

  const handlePlanChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.plans];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, plans: updated };
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warn('Please provide a product name');
      return;
    }
    if (formData.plans.length === 0) {
      toast.warn('Please configure at least one subscription plan');
      return;
    }

    // Verify all plan rows have name and price
    for (let i = 0; i < formData.plans.length; i++) {
      const p = formData.plans[i];
      if (!p.name.trim() || p.price === '' || isNaN(Number(p.price))) {
        toast.warn(`Please enter a valid plan name and price for Plan #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const parsedFeatures = formData.features
        ? formData.features.split('\n').map(f => f.trim()).filter(Boolean)
        : [];

      const formattedPlans = formData.plans.map(p => ({
        name: p.name.trim(),
        duration: Number(p.duration) || 30,
        price: Number(p.price),
        discountPercentage: Math.max(0, Math.min(100, Number(p.discountPercentage) || 0)),
        features: parsedFeatures
      }));

      const payload = {
        name: formData.name.trim(),
        companyId: '6ae5be46084c29e301fedb60',
        description: formData.description.trim() || `${formData.name.trim()} subscription package`,
        price: String(formattedPlans[0].price),
        duration: formattedPlans[0].duration,
        features: parsedFeatures,
        plans: formattedPlans,
        isActive: true
      };

      let res;
      if (editingProduct) {
        res = await axiosInstance.put(`/service/${editingProduct._id}`, payload);
      } else {
        res = await axiosInstance.post('/service', payload).catch(() => 
          axiosInstance.post('/services', payload)
        );
      }

      if (res.data?.success) {
        toast.success(editingProduct ? 'Product & plans updated!' : 'Product & subscription plans created!');
        setShowModal(false);
        fetchPlans();
      } else {
        toast.error(res.data?.message || 'Failed to save product');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to delete product "${planName}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/service/${planId}`).catch(() => 
        axiosInstance.delete(`/services/${planId}`)
      );
      if (res.data?.success) {
        toast.info('Product removed');
        setPlans(plans.filter(p => p._id !== planId));
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filtered = plans.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-softLavender shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Multi-Plan Product Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
            Products & Subscription Plans
          </h1>
          <p className="text-slateGray text-xs sm:text-sm mt-1">
            Create products with multiple recurring plans (durations, prices, and percentage discounts) under the same listing.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Search and Refresh Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-softLavender shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products & subscription plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-mainBg border border-softLavender rounded-xl text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <button
          onClick={fetchPlans}
          disabled={loading}
          className="p-2 text-slateGray hover:text-deepNavy rounded-xl border border-softLavender hover:bg-mainBg transition cursor-pointer"
          title="Refresh database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Grid of Products */}
      {loading ? (
        <div className="p-16 text-center text-xs font-bold text-slateGray bg-white rounded-2xl border border-softLavender flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          <span>Loading products & plans...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((p) => {
            const productPlans = Array.isArray(p.plans) && p.plans.length > 0
              ? p.plans
              : [
                  {
                    name: 'Standard Plan',
                    duration: Number(p.duration) || 30,
                    price: Number(p.price) || 49,
                    discountPercentage: 0
                  }
                ];

            return (
              <div 
                key={p._id} 
                className="bg-white p-6 rounded-2xl border border-softLavender shadow-xs flex flex-col justify-between group hover:border-primary/40 transition-all duration-200"
              >
                <div>
                  {/* Title and Top Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-primary">
                          <Package className="w-4 h-4" />
                        </span>
                        <h4 className="text-lg font-bold text-deepNavy">{p.name}</h4>
                      </div>
                      {p.description && (
                        <p className="text-xs text-slateGray mt-1.5 leading-relaxed">{p.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slateGray hover:text-primary hover:bg-primary/10 rounded-lg transition cursor-pointer"
                        title="Edit product and plans"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(p._id, p.name)}
                        className="p-1.5 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Multiple Subscription Plans Under This Product */}
                  <div className="mt-5 pt-4 border-t border-softLavender">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slateGray flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        Subscription Plans ({productPlans.length})
                      </span>
                      <span className="text-[10px] text-slateGray">Multiple Durations & Rates</span>
                    </div>

                    <div className="space-y-2">
                      {productPlans.map((subPlan, idx) => {
                        const basePrice = Number(subPlan.price) || 0;
                        const disc = Number(subPlan.discountPercentage) || 0;
                        const finalPrice = disc > 0 
                          ? Math.max(0, basePrice - (basePrice * disc / 100))
                          : basePrice;

                        return (
                          <div 
                            key={idx}
                            className="p-3 rounded-xl bg-mainBg/70 border border-softLavender/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-white border border-softLavender flex items-center justify-center font-bold text-[10px] text-slateGray">
                                {idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-deepNavy">{subPlan.name}</span>
                                <span className="text-[11px] text-slateGray ml-1.5">
                                  ({subPlan.duration} Days)
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {disc > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {disc}% OFF
                                </span>
                              )}
                              <div className="text-right">
                                {disc > 0 && (
                                  <span className="text-[10px] text-slateGray line-through block leading-none">
                                    ${basePrice.toFixed(2)}
                                  </span>
                                )}
                                <span className="font-black text-deepNavy text-sm">
                                  ${finalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Features List */}
                  {p.features && p.features.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-softLavender space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Included Features:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.features.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] text-deepNavy bg-indigo-50/70 border border-indigo-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                            <span>{f}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="mt-5 pt-3 border-t border-softLavender flex items-center justify-between text-xs">
                  <span className="text-slateGray text-[11px]">
                    Single Product · {productPlans.length} Customer {productPlans.length === 1 ? 'Plan' : 'Plans'}
                  </span>
                  <button
                    onClick={() => openEditModal(p)}
                    className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <span>Configure Plans</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-softLavender flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-deepNavy">No Products Configured Yet</h3>
          <p className="text-xs text-slateGray max-w-sm mt-1 mb-4">
            Create a product and attach multiple subscription tiers with unique durations and discount rates.
          </p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </button>
        </div>
      )}

      {/* Modal: Create or Edit Product with Multiple Subscription Plans */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deepNavy/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-softLavender my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-softLavender">
              <div>
                <h3 className="text-xl font-extrabold text-deepNavy">
                  {editingProduct ? 'Edit Product & Subscription Plans' : 'Create Product with Subscription Plans'}
                </h3>
                <p className="text-xs text-slateGray mt-0.5">
                  Configure a product and add multiple subscription options with individual durations and percentage discounts.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slateGray hover:text-deepNavy rounded-full hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5 pt-5 text-xs">
              {/* Product Info Section */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-sm text-deepNavy flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-primary" />
                  <span>1. Product Overview</span>
                </h4>

                <div className="space-y-1">
                  <label className="font-bold text-deepNavy">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brightloop ERP Suite, Marketing Hub Pro"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-mainBg border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deepNavy">Description</label>
                  <textarea
                    rows="2"
                    placeholder="Brief description of the product and software capabilities..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-mainBg border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deepNavy">Features (One per line)</label>
                  <textarea
                    rows="2"
                    placeholder="Unlimited users&#10;Real-time analytics&#10;API Integration"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-3.5 py-2 bg-mainBg border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary resize-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Multiple Subscription Plans Section */}
              <div className="space-y-3 pt-4 border-t border-softLavender">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-deepNavy flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>2. Subscription Plans Under This Product</span>
                    </h4>
                    <p className="text-[11px] text-slateGray mt-0.5">
                      Customers can choose between these plans under the same product listing.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPlanRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-primary font-bold rounded-lg border border-indigo-200 transition cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Plan</span>
                  </button>
                </div>

                {/* Plan Rows */}
                <div className="space-y-3">
                  {formData.plans.map((planRow, idx) => {
                    const basePrice = Number(planRow.price) || 0;
                    const discount = Math.max(0, Math.min(100, Number(planRow.discountPercentage) || 0));
                    const saving = (basePrice * discount) / 100;
                    const finalPrice = Math.max(0, basePrice - saving);

                    return (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl bg-mainBg/80 border border-softLavender space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-deepNavy text-xs flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>Plan Option #{idx + 1}</span>
                          </span>

                          {formData.plans.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePlanRow(idx)}
                              className="text-slateGray hover:text-red-600 p-1 rounded transition cursor-pointer"
                              title="Delete plan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Plan Name */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slateGray">Plan Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Monthly, Annual Pro"
                              value={planRow.name}
                              onChange={(e) => handlePlanChange(idx, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary font-medium"
                            />
                          </div>

                          {/* Duration in Days */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slateGray">Duration (Days) *</label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                required
                                placeholder="30"
                                value={planRow.duration}
                                onChange={(e) => handlePlanChange(idx, 'duration', e.target.value)}
                                className="w-24 px-3 py-1.5 bg-white border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary font-bold"
                              />
                              {/* Quick Presets */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePlanChange(idx, 'duration', 30)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    Number(planRow.duration) === 30 ? 'bg-primary text-white' : 'bg-white border border-softLavender text-slateGray hover:text-deepNavy'
                                  }`}
                                >
                                  30d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePlanChange(idx, 'duration', 90)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    Number(planRow.duration) === 90 ? 'bg-primary text-white' : 'bg-white border border-softLavender text-slateGray hover:text-deepNavy'
                                  }`}
                                >
                                  90d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePlanChange(idx, 'duration', 365)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                    Number(planRow.duration) === 365 ? 'bg-primary text-white' : 'bg-white border border-softLavender text-slateGray hover:text-deepNavy'
                                  }`}
                                >
                                  365d
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Price & Discount % Configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Price */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slateGray">Regular Price ($) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="49"
                              value={planRow.price}
                              onChange={(e) => handlePlanChange(idx, 'price', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary font-bold"
                            />
                          </div>

                          {/* Percentage Discount */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slateGray flex items-center justify-between">
                              <span>Percentage Discount (%)</span>
                              <span className="text-primary font-bold">{discount}% OFF</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={planRow.discountPercentage}
                                onChange={(e) => handlePlanChange(idx, 'discountPercentage', e.target.value)}
                                className="w-full pl-3 pr-7 py-1.5 bg-white border border-softLavender rounded-xl text-deepNavy focus:outline-none focus:border-primary font-bold"
                              />
                              <Percent className="w-3.5 h-3.5 text-slateGray absolute right-2.5 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                        </div>

                        {/* Automatic Calculation Banner for this Plan */}
                        <div className="p-2.5 rounded-xl bg-white border border-softLavender flex items-center justify-between text-xs">
                          <span className="text-slateGray text-[11px]">
                            Calculation: ${basePrice.toFixed(2)} - {discount}% (-${saving.toFixed(2)})
                          </span>
                          <span className="font-extrabold text-deepNavy">
                            Customer Pays:{' '}
                            <span className="text-emerald-600 font-black text-sm">
                              ${finalPrice.toFixed(2)}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-softLavender text-slateGray hover:text-deepNavy font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Product & Plans...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Update Product & Plans' : 'Save Product & Plans'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
