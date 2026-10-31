import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  UserX 
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function CustomerDirectory() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">Customer Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              {users.length} {users.length === 1 ? 'User' : 'Users'}
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">
            Manage subscriber accounts, platform permissions, and account statuses.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-mainBg hover:bg-softLavender/40 text-slateGray hover:text-deepNavy rounded-xl text-xs font-bold border border-softLavender transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-mainBg border border-softLavender rounded-xl text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <div className="text-xs text-slateGray font-medium self-end sm:self-center">
          Showing {filteredUsers.length} of {users.length} accounts
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slateGray">
            Loading user directory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-mainBg text-[10px] font-black uppercase tracking-wider text-slateGray border-b border-softLavender">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5">Role</th>
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
                    <td colSpan="5" className="py-12 text-center text-xs text-slateGray">
                      No users match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

