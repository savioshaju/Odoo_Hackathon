import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layers, 
  CreditCard, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Tag,
  Star,
  ExternalLink,
  UserCheck,
  UserX
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function AdminHome({ defaultTab = 'overview' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);

  // Overview Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlans: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    monthlyRecurringRevenue: 0
  });

  // Users List
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Plans List
  const [plans, setPlans] = useState([]);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    planCode: '',
    tagline: '',
    monthlyPrice: '',
    annualPrice: '',
    features: '',
    popular: false
  });
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Subscriptions List
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch overview stats
      const statsRes = await axiosInstance.get('/admin/overview').catch(() => null);
      if (statsRes?.data?.success) {
        setStats(statsRes.data.stats);
      }

      // 2. Fetch users
      const usersRes = await axiosInstance.get('/admin/users').catch(() => null);
      if (usersRes?.data?.success) {
        setUsers(usersRes.data.users);
      }

      // 3. Fetch plans from MongoDB
      const plansRes = await axiosInstance.get('/subscriptions/plans').catch(() => null);
      if (plansRes?.data?.success) {
        setPlans(plansRes.data.plans);
      }

      // 4. Fetch all subscriptions
      const subsRes = await axiosInstance.get('/subscriptions/all').catch(() => null);
      if (subsRes?.data?.success) {
        setSubscriptions(subsRes.data.subscriptions);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // User Actions: Role Toggle
  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success(`User role changed to ${newRole}`);
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // User Actions: Status Toggle
  const handleToggleStatus = async (userId) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/status`);
      if (res.data?.success) {
        const updatedStatus = res.data.user.isActive;
        toast.info(`User ${updatedStatus ? 'activated' : 'deactivated'}`);
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: updatedStatus } : u));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  // Plan Actions: Create Plan
  const handleCreatePlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.name || !planForm.planCode || !planForm.monthlyPrice || !planForm.annualPrice) {
      toast.warn('Please fill in all required fields');
      return;
    }

    setCreatingPlan(true);
    try {
      const payload = {
        name: planForm.name,
        planCode: planForm.planCode.toLowerCase().trim().replace(/\s+/g, '_'),
        tagline: planForm.tagline,
        monthlyPrice: Number(planForm.monthlyPrice),
        annualPrice: Number(planForm.annualPrice),
        features: planForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        popular: planForm.popular
      };

      const res = await axiosInstance.post('/subscriptions/plans', payload);
      if (res.data?.success) {
        toast.success('Subscription plan created in database!');
        setShowCreatePlanModal(false);
        setPlanForm({
          name: '',
          planCode: '',
          tagline: '',
          monthlyPrice: '',
          annualPrice: '',
          features: '',
          popular: false
        });
        fetchDashboardData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setCreatingPlan(false);
    }
  };

  // Plan Actions: Delete Plan
  const handleDeletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to deactivate "${planName}"?`)) return;
    try {
      const res = await axiosInstance.delete(`/subscriptions/plans/${planId}`);
      if (res.data?.success) {
        toast.info('Plan deactivated');
        setPlans(plans.filter(p => p._id !== planId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto py-2">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-softLavender shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-deepNavy tracking-tight mt-1.5">
            Admin Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slateGray mt-1">
            Complete database management for subscribers, subscription plans, platform revenue, and accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-mainBg hover:bg-softLavender/50 text-slateGray hover:text-deepNavy rounded-xl text-xs font-bold border border-softLavender transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Registered Users</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{stats.totalUsers || users.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Active Subs</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{stats.activeSubscriptions || subscriptions.filter(s => s.status === 'active').length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">DB Plans</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">{plans.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-softLavender shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Est. MRR</p>
            <p className="text-xl sm:text-2xl font-black text-deepNavy mt-0.5">${stats.monthlyRecurringRevenue || 0}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-softLavender gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-slateGray hover:text-deepNavy'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-slateGray hover:text-deepNavy'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'border-primary text-primary'
              : 'border-transparent text-slateGray hover:text-deepNavy'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Subscription Plans ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'border-primary text-primary'
              : 'border-transparent text-slateGray hover:text-deepNavy'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Client Subscriptions ({subscriptions.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slateGray">Subscription Health</h3>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-deepNavy">
                {subscriptions.length > 0 ? (
                  Math.round((subscriptions.filter(s => s.status === 'active').length / subscriptions.length) * 100)
                ) : 100}%
              </div>
              <p className="text-xs text-slateGray">
                Ratio of active paying subscriber clients currently retaining active status.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slateGray">Total Settled Revenue</h3>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-black text-deepNavy">
                ${stats.totalRevenue || 0}
              </div>
              <p className="text-xs text-slateGray">
                Total processed invoice transactions across all subscription billing cycles.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slateGray">Active Database Plans</h3>
                <Tag className="w-4 h-4 text-secondary" />
              </div>
              <div className="text-2xl font-black text-deepNavy">
                {plans.length}
              </div>
              <p className="text-xs text-slateGray">
                Available subscription plans loaded from MongoDB for client self-checkout.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-6 rounded-2xl border border-softLavender shadow-xs">
            <h3 className="text-sm font-bold text-deepNavy mb-4">Quick Management Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => { setActiveTab('plans'); setShowCreatePlanModal(true); }}
                className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-left transition flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-deepNavy group-hover:text-primary">Create New Plan</p>
                  <p className="text-[11px] text-slateGray mt-0.5">Add a recurring billing tier to MongoDB.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className="p-4 rounded-xl border border-softLavender bg-mainBg hover:bg-softLavender/40 text-left transition flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary text-white flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-deepNavy group-hover:text-secondary">Manage Users & Roles</p>
                  <p className="text-[11px] text-slateGray mt-0.5">Promote users or deactivate accounts.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('subscriptions')}
                className="p-4 rounded-xl border border-softLavender bg-mainBg hover:bg-softLavender/40 text-left transition flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-deepNavy group-hover:text-amber-600">Review Subscriptions</p>
                  <p className="text-[11px] text-slateGray mt-0.5">Audit customer lifecycle and renewals.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-softLavender">
            <div className="relative w-full sm:max-w-sm">
              <Search className="w-4 h-4 text-slateGray absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-mainBg border border-softLavender rounded-xl text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary transition"
              />
            </div>
            <div className="text-xs text-slateGray font-medium self-end sm:self-center">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-softLavender shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-mainBg text-[10px] font-black uppercase tracking-wider text-slateGray border-b border-softLavender">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Phone</th>
                    <th className="py-3 px-5">Current Role</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-softLavender text-xs">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-mainBg/40 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#5145E5] to-[#8067F8] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {u.name ? u.name[0] : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-deepNavy">{u.name}</p>
                              <p className="text-[11px] text-slateGray">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slateGray">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'admin' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          {u.isActive !== false ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500">
                              <XCircle className="w-3.5 h-3.5" /> Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleToggleRole(u._id, u.role)}
                              title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-softLavender hover:border-primary/40 bg-mainBg hover:bg-white text-deepNavy transition cursor-pointer"
                            >
                              {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u._id)}
                              title={u.isActive !== false ? 'Deactivate user' : 'Activate user'}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                u.isActive !== false 
                                  ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.isActive !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-xs text-slateGray">
                        No users match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-softLavender">
            <div>
              <h3 className="text-sm font-bold text-deepNavy">Database Plans Catalog</h3>
              <p className="text-xs text-slateGray">
                All plans stored in MongoDB. Users can view and subscribe to active plans.
              </p>
            </div>
            <button
              onClick={() => setShowCreatePlanModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>

          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((p) => (
                <div 
                  key={p._id || p.planCode} 
                  className="bg-white p-5 rounded-2xl border border-softLavender shadow-xs flex flex-col justify-between relative group"
                >
                  {p.popular && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Popular
                    </span>
                  )}

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slateGray bg-mainBg px-2 py-0.5 rounded-md border border-softLavender">
                      {p.planCode}
                    </span>
                    <h4 className="text-base font-bold text-deepNavy mt-2">{p.name}</h4>
                    {p.tagline && <p className="text-xs text-slateGray mt-0.5">{p.tagline}</p>}

                    <div className="mt-4 pt-3 border-t border-softLavender flex items-baseline gap-2">
                      <span className="text-2xl font-black text-deepNavy">${p.monthlyPrice}</span>
                      <span className="text-xs text-slateGray">/ month</span>
                      <span className="text-xs text-slateGray/80 ml-auto">
                        (${p.annualPrice}/mo billed annually)
                      </span>
                    </div>

                    {p.features && p.features.length > 0 && (
                      <div className="mt-4 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slateGray">Included Features:</p>
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
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active in DB
                    </span>
                    <button
                      onClick={() => handleDeletePlan(p._id, p.name)}
                      className="p-1.5 text-slateGray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Deactivate plan"
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
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-deepNavy">No Plans in Database Yet</h3>
              <p className="text-xs text-slateGray max-w-sm mt-1">
                Zero dummy data is used. Add your first real subscription plan to store it in MongoDB.
              </p>
              <button
                onClick={() => setShowCreatePlanModal(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Plan</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLIENT SUBSCRIPTIONS */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-softLavender shadow-xs overflow-hidden">
          <div className="p-4 border-b border-softLavender flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-deepNavy">All Active & Historical Subscriptions</h3>
              <p className="text-xs text-slateGray">Live customer subscriptions recorded across the platform.</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-mainBg rounded-xl border border-softLavender text-slateGray">
              {subscriptions.length} Subscriptions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-mainBg text-[10px] font-black uppercase tracking-wider text-slateGray border-b border-softLavender">
                  <th className="py-3 px-5">Subscriber</th>
                  <th className="py-3 px-5">Plan</th>
                  <th className="py-3 px-5">Cycle & Price</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Renewal / Expiry</th>
                  <th className="py-3 px-5">Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-softLavender text-xs">
                {subscriptions.length > 0 ? (
                  subscriptions.map((sub) => (
                    <tr key={sub._id} className="hover:bg-mainBg/40 transition">
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-deepNavy">{sub.userId?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slateGray">{sub.userId?.email || '—'}</p>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-deepNavy">
                        {sub.planName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-bold text-deepNavy">${sub.price}</span>
                        <span className="text-[11px] text-slateGray capitalize"> / {sub.billingCycle}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slateGray border border-slate-200'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-[11px] text-slateGray">
                        {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-deepNavy">
                        {sub.invoices?.length || 0} invoice(s)
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-xs text-slateGray">
                      No active client subscriptions registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {showCreatePlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-softLavender shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-softLavender">
              <div>
                <h3 className="text-base font-black text-deepNavy">Create Subscription Plan</h3>
                <p className="text-xs text-slateGray">Persists directly to MongoDB `Plan` collection.</p>
              </div>
              <button
                onClick={() => setShowCreatePlanModal(false)}
                className="p-1 rounded-lg text-slateGray hover:text-deepNavy hover:bg-mainBg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-deepNavy block mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter Cloud or Enterprise Scale"
                  value={planForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    setPlanForm({ ...planForm, name, planCode: planForm.planCode || code });
                  }}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Plan Code (Unique Identifier) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. plan_starter"
                  value={planForm.planCode}
                  onChange={(e) => setPlanForm({ ...planForm, planCode: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="Short marketing summary of the tier"
                  value={planForm.tagline}
                  onChange={(e) => setPlanForm({ ...planForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Monthly Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="29"
                    value={planForm.monthlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                  />
                </div>
                <div>
                  <label className="font-bold text-deepNavy block mb-1">Annual Price ($/mo) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="24"
                    value={planForm.annualPrice}
                    onChange={(e) => setPlanForm({ ...planForm, annualPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-deepNavy block mb-1">Features (One per line)</label>
                <textarea
                  rows="3"
                  placeholder="Up to 5 client seats&#10;Automated invoices&#10;24/7 Support"
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-3 py-2 bg-mainBg border border-softLavender rounded-xl focus:outline-none focus:border-primary text-deepNavy"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={planForm.popular}
                  onChange={(e) => setPlanForm({ ...planForm, popular: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="font-semibold text-deepNavy">Highlight as Most Popular plan</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="px-4 py-2 border border-softLavender text-slateGray hover:text-deepNavy rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingPlan}
                  className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
                >
                  {creatingPlan ? 'Saving to DB...' : 'Save Plan to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
