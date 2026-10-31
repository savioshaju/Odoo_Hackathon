import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Inbox,
  RefreshCw,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function GenericCatalogPage({ 
  title = "Products Catalog", 
  subtitle = "Manage active SaaS subscription products, base pricing, and plans.",
  entityName = "Product",
  canMutate = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '30',
    features: ''
  });

  const currentUser = useSelector((state) => state.user?.userData);
  const isPrivileged = currentUser?.role === 'admin' || canMutate;

  useEffect(() => {
    fetchItems();
  }, [entityName]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/service').catch(() => axiosInstance.get('/services')).catch(() => null);
      if (res?.data?.services) {
        const formatted = res.data.services.map(s => ({
          id: s._id,
          name: s.name,
          description: s.description,
          category: s.duration ? `${s.duration} Days` : 'Service',
          price: `$${s.price}`,
          rawPrice: s.price,
          status: s.isActive ? 'Active' : 'Inactive',
          features: s.features || []
        }));
        setItems(formatted);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast.warn('Please provide at least a name and price');
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
        description: formData.description.trim() || `${formData.name.trim()} subscription module`,
        price: formData.price.toString(),
        duration: Number(formData.duration) || 30,
        features: parsedFeatures,
        isActive: true
      };

      const res = await axiosInstance.post('/service', payload).catch(() => 
        axiosInstance.post('/services', payload)
      );

      if (res.data?.success) {
        toast.success(`${entityName} created successfully in database!`);
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: '30',
          features: ''
        });
        fetchItems();
      } else {
        toast.error(res.data?.message || `Failed to create ${entityName}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Error saving ${entityName}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    try {
      const res = await axiosInstance.delete(`/service/${itemId}`).catch(() => 
        axiosInstance.delete(`/services/${itemId}`)
      );
      if (res.data?.success) {
        toast.info(`${entityName} removed`);
        setItems(items.filter(i => i.id !== itemId));
      } else {
        toast.error(res.data?.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting item');
    }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              {filteredItems.length} {filteredItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">{subtitle}</p>
        </div>

        {isPrivileged && (
          <button 
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New {entityName}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 bg-mainBg border border-softLavender rounded-xl text-xs text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button 
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-mainBg text-slateGray hover:text-deepNavy rounded-xl text-xs font-semibold border border-softLavender hover:border-slateGray/30 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table vs Empty State */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-slateGray">
            Loading {title.toLowerCase()} from database...
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-mainBg text-[11px] font-bold uppercase tracking-wider text-slateGray border-b border-softLavender">
                  <th className="py-3 px-6">ID</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Duration / Category</th>
                  <th className="py-3 px-6">Price</th>
                  <th className="py-3 px-6">Status</th>
                  {isPrivileged && <th className="py-3 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-softLavender text-xs">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-mainBg/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-deepNavy">{item.id.slice(-6)}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-deepNavy">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-slateGray line-clamp-1">{item.description}</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slateGray">{item.category}</td>
                    <td className="py-4 px-6 font-bold text-deepNavy">{item.price}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    {isPrivileged && (
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray mb-3 border border-softLavender">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-deepNavy">No {title} Recorded</h3>
            <p className="text-xs text-slateGray max-w-sm mt-1 mb-5">
              There are no {title.toLowerCase()} in your database yet.
            </p>
            {isPrivileged && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create {entityName}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* CREATE ITEM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-softLavender shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-softLavender">
              <div>
                <h3 className="text-base font-black text-deepNavy">Add New {entityName}</h3>
                <p className="text-xs text-slateGray">Saves directly into your database.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-deepNavy block mb-1">{entityName} Name *</label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Enterprise CRM or Analytics Suite`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Key features and use cases"
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
                    placeholder="49"
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
                  placeholder="Unlimited API calls&#10;99.99% Uptime SLA&#10;Dedicated account manager"
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
                  {submitting ? 'Saving...' : `Save ${entityName}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
