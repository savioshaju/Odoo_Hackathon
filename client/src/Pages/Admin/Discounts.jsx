import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  Tag, 
  CheckCircle2, 
  X, 
  Calendar, 
  Copy, 
  Check, 
  Package, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'percentage', // 'percentage' | 'fixed'
    value: '',
    serviceId: 'all', // 'all' or service ID
    description: '',
    expiresAt: '',
    isActive: true
  });

  // Fetch all existing products from DB
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/service').catch(() => axiosInstance.get('/services')).catch(() => null);
      if (res?.data?.services) {
        setProducts(res.data.services);
      }
    } catch (err) {
      console.warn('Could not load services:', err);
    }
  };

  // Fetch all discounts
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/discounts').catch(() => null);
      if (res?.data?.discounts) {
        setDiscounts(res.data.discounts);
      }
    } catch (err) {
      console.warn('Could not load discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchDiscounts();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied discount code "${code}"`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.value) {
      toast.warn('Please fill in code, name, and discount value');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        type: formData.type,
        value: Number(formData.value),
        serviceId: formData.serviceId === 'all' ? null : formData.serviceId,
        description: formData.description.trim(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive
      };

      const res = await axiosInstance.post('/discounts', payload);
      if (res.data?.success) {
        toast.success(`Discount "${res.data.discount.code}" created successfully!`);
        setShowModal(false);
        setFormData({
          code: '',
          name: '',
          type: 'percentage',
          value: '',
          serviceId: 'all',
          description: '',
          expiresAt: '',
          isActive: true
        });
        fetchDiscounts();
      } else {
        toast.error(res.data?.message || 'Failed to create discount');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving discount');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete discount code "${code}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/discounts/${id}`);
      if (res.data?.success) {
        toast.info(`Discount code "${code}" deleted`);
        setDiscounts(prev => prev.filter(d => d._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete discount');
    }
  };

  const handleToggleStatus = async (discount) => {
    try {
      const res = await axiosInstance.put(`/discounts/${discount._id}`, {
        isActive: !discount.isActive
      });
      if (res.data?.success) {
        setDiscounts(prev => prev.map(d => d._id === discount._id ? res.data.discount : d));
        toast.success(`Discount ${res.data.discount.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Find selected product for preview in modal
  const selectedProductInModal = products.find(p => p._id === formData.serviceId);

  // Compute live price preview in modal
  const calculatePreviewPrice = () => {
    if (!selectedProductInModal) return null;
    const basePrice = Number(selectedProductInModal.price) || 0;
    const val = Number(formData.value) || 0;
    let finalPrice = basePrice;
    let saving = 0;

    if (formData.type === 'percentage') {
      saving = (basePrice * val) / 100;
      finalPrice = Math.max(0, basePrice - saving);
    } else {
      saving = Math.min(basePrice, val);
      finalPrice = Math.max(0, basePrice - val);
    }

    return {
      basePrice,
      saving,
      finalPrice
    };
  };

  const preview = calculatePreviewPrice();

  // Filter discounts
  const filteredDiscounts = discounts.filter(item => {
    const matchesSearch = 
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.serviceId?.name && item.serviceId.name.toLowerCase().includes(search.toLowerCase()));
    
    if (filterProduct === 'all') return matchesSearch;
    if (filterProduct === 'universal') return matchesSearch && !item.serviceId;
    return matchesSearch && item.serviceId?._id === filterProduct;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-softLavender shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4" />
            <span>Product Pricing & Promotion Rules</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
            Discounts & Coupons
          </h1>
          <p className="text-slateGray text-sm mt-1">
            Create promotional discount codes and attach them directly to existing database products.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchDiscounts(); fetchProducts(); }}
            className="p-2.5 rounded-xl border border-softLavender text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Discount</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-primary flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slateGray uppercase">Total Discounts</div>
            <div className="text-2xl font-black text-deepNavy">{discounts.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slateGray uppercase">Active Campaigns</div>
            <div className="text-2xl font-black text-deepNavy">
              {discounts.filter(d => d.isActive).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slateGray uppercase">Product-Specific</div>
            <div className="text-2xl font-black text-deepNavy">
              {discounts.filter(d => d.serviceId).length}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slateGray uppercase">Available Products</div>
            <div className="text-2xl font-black text-deepNavy">{products.length}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-softLavender shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, campaign name, or product..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Product selector filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slateGray whitespace-nowrap">Filter by Product:</span>
          <select
            value={filterProduct}
            onChange={(e) => setFilterProduct(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-softLavender bg-white text-deepNavy focus:outline-none focus:border-primary transition w-full md:w-64"
          >
            <option value="all">All Discounts ({discounts.length})</option>
            <option value="universal">Universal (All Products)</option>
            {products.map(prod => (
              <option key={prod._id} value={prod._id}>
                Only {prod.name} (${prod.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Discounts List */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slateGray flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium">Loading discounts from database...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="p-12 text-center text-slateGray flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray">
              <Percent className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-deepNavy">No Discounts Found</h3>
            <p className="text-sm max-w-md text-slateGray">
              {search || filterProduct !== 'all'
                ? 'No promotional discounts match your current filter criteria.'
                : 'You have not created any discounts yet. Add a promotional discount to give customers price reductions on existing products.'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Discount</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-softLavender bg-mainBg/60 text-xs uppercase tracking-wider text-slateGray font-bold">
                  <th className="py-3.5 px-6">Promo Code</th>
                  <th className="py-3.5 px-6">Campaign / Name</th>
                  <th className="py-3.5 px-6">Applies To (Product)</th>
                  <th className="py-3.5 px-6">Discount Rate</th>
                  <th className="py-3.5 px-6">Pricing Effect</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-softLavender text-sm">
                {filteredDiscounts.map((discount) => {
                  const targetProduct = discount.serviceId;
                  const originalPrice = targetProduct ? Number(targetProduct.price) || 0 : null;
                  let discountedPrice = null;

                  if (originalPrice !== null) {
                    if (discount.type === 'percentage') {
                      discountedPrice = Math.max(0, originalPrice - (originalPrice * discount.value / 100));
                    } else {
                      discountedPrice = Math.max(0, originalPrice - discount.value);
                    }
                  }

                  return (
                    <tr key={discount._id} className="hover:bg-mainBg/40 transition">
                      {/* Code */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 text-xs tracking-wider">
                            {discount.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(discount.code)}
                            className="p-1 text-slateGray hover:text-deepNavy rounded transition cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === discount.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-deepNavy">{discount.name}</div>
                        {discount.description && (
                          <div className="text-xs text-slateGray mt-0.5 line-clamp-1">
                            {discount.description}
                          </div>
                        )}
                      </td>

                      {/* Applicable Product */}
                      <td className="py-4 px-6">
                        {targetProduct ? (
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-indigo-50 text-primary">
                              <Package className="w-3.5 h-3.5" />
                            </span>
                            <div>
                              <div className="font-bold text-deepNavy text-xs">
                                {targetProduct.name}
                              </div>
                              <div className="text-[11px] text-slateGray">
                                Regular ${targetProduct.price} · {targetProduct.duration || 30} days
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="w-3 h-3" />
                            All Products (Storewide)
                          </span>
                        )}
                      </td>

                      {/* Discount Rate */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 font-extrabold text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {discount.type === 'percentage' ? `${discount.value}% OFF` : `$${discount.value}.00 OFF`}
                        </span>
                      </td>

                      {/* Pricing Effect */}
                      <td className="py-4 px-6">
                        {originalPrice !== null ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="line-through text-slateGray font-medium">
                              ${originalPrice.toFixed(2)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slateGray" />
                            <span className="font-black text-emerald-600">
                              ${discountedPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slateGray">
                            {discount.type === 'percentage' ? `${discount.value}% deducted at checkout` : `$${discount.value} deducted at checkout`}
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(discount)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            discount.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {discount.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(discount._id, discount.code)}
                          className="p-1.5 text-slateGray hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete discount"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Discount with Existing Product Selector */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deepNavy/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-softLavender my-8">
            <div className="flex items-center justify-between pb-4 border-b border-softLavender">
              <div>
                <h3 className="text-xl font-extrabold text-deepNavy">Create Promotional Discount</h3>
                <p className="text-xs text-slateGray mt-0.5">
                  Attach discount rates to an existing database product or apply storewide.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slateGray hover:text-deepNavy rounded-full hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-5">
              {/* Product Selector Dropdown (USER KEY REQUIREMENT) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-deepNavy flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span>Select Existing Product to Discount</span>
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary transition font-medium bg-white"
                >
                  <option value="all">🌐 All Products (Universal Discount)</option>
                  <optgroup label="Existing Products in Database">
                    {products.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} — ${prod.price} ({prod.duration || 30} days)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slateGray">
                  Choose a specific product from MongoDB to bind this discount only to that service.
                </p>
              </div>

              {/* Selected Product Card & Live Discount Preview */}
              {selectedProductInModal && preview && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-white text-primary shadow-xs">
                        <Package className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-xs text-deepNavy">
                        {selectedProductInModal.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slateGray">
                      Standard: <strong className="text-deepNavy">${preview.basePrice.toFixed(2)}</strong>
                    </span>
                  </div>

                  {formData.value && (
                    <div className="mt-1 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs">
                      <span className="text-slateGray">
                        Discount ({formData.type === 'percentage' ? `${formData.value}%` : `$${formData.value}`}):
                        <strong className="text-emerald-700 ml-1">-${preview.saving.toFixed(2)}</strong>
                      </span>
                      <span className="font-black text-deepNavy">
                        Customer Pays:{' '}
                        <span className="text-emerald-600 text-sm">
                          ${preview.finalPrice.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Discount Code & Campaign Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-deepNavy">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH30, SAVE15"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary font-mono uppercase font-bold tracking-wider"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-deepNavy">
                    Campaign Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Adopter Promotion"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-deepNavy">Discount Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'percentage' })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.type === 'percentage'
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slateGray border-softLavender hover:bg-mainBg'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'fixed' })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        formData.type === 'fixed'
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-white text-slateGray border-softLavender hover:bg-mainBg'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Fixed Amount ($)
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-deepNavy">
                    {formData.type === 'percentage' ? 'Percentage Off (%)' : 'Deduction Amount ($)'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.type === 'percentage' ? '100' : '9999'}
                    required
                    placeholder={formData.type === 'percentage' ? '20' : '10'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-deepNavy">Expiration Date (Optional)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slateGray absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-deepNavy">Description / Internal Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Promotional rate for Q4 sales campaign"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-softLavender focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-softLavender text-slateGray hover:text-deepNavy font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>Save Discount</span>
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

