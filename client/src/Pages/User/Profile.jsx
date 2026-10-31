import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  LogOut, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ChevronRight,
  X
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { saveUserData, clearUserData } from '../../store/slice/userSlice';

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user?.userData);

  // Initialize profile data from currentUser if already present in Redux / localStorage
  const [profileData, setProfileData] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    role: currentUser?.role || 'user',
    createdAt: currentUser?.createdAt || '',
  }));

  const [loading, setLoading] = useState(() => !currentUser?.email);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(() => ({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
  }));
  const [savingProfile, setSavingProfile] = useState(false);

  // Synchronize when currentUser is populated or updated
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || 'user',
        createdAt: currentUser.createdAt || '',
      });
      setEditForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser]);

  // Change password collapsible state (NOT always present, toggles on click)
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch fresh profile data from backend API
  const fetchProfile = async () => {
    try {
      if (!currentUser?.email) setLoading(true);
      const isAdmin = currentUser?.role === 'admin';
      const endpoint = isAdmin ? '/admin/profile' : '/users/profile';
      const res = await axiosInstance.get(endpoint)
        .catch(() => axiosInstance.get('/users/profile'))
        .catch(() => axiosInstance.get('/admin/profile'))
        .catch(() => null);
      const u = res?.data?.admin || res?.data?.user || res?.data?.data || res?.data;
      if (u && (u.email || u.name)) {
        setProfileData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || 'user',
          createdAt: u.createdAt || '',
        });
        setEditForm({
          name: u.name || '',
          phone: u.phone || '',
        });
        dispatch(saveUserData(u));
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      if (err.response?.status === 401 && !currentUser?.email) {
        toast.error('Session expired. Please log in.');
        dispatch(clearUserData());
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Profile Info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || editForm.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }
    if (!/^\d{10}$/.test(editForm.phone.trim())) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSavingProfile(true);
    try {
      const isAdmin = currentUser?.role === 'admin' || profileData.role === 'admin';
      const endpoint = isAdmin ? '/admin/profile' : '/users/profile';
      const res = await axiosInstance.put(endpoint, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      }).catch(() => axiosInstance.put('/users/profile', {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      }));

      if (res.data?.success) {
        toast.success(res.data.message || 'Profile updated successfully!');
        setProfileData((prev) => ({
          ...prev,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
        }));
        dispatch(saveUserData(res.data.user || { ...currentUser, name: editForm.name.trim(), phone: editForm.phone.trim() }));
        setIsEditing(false);
      } else {
        toast.error(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const isAdmin = currentUser?.role === 'admin' || profileData.role === 'admin';
      const endpoint = isAdmin ? '/admin/change-password' : '/users/change-password';
      const res = await axiosInstance.put(endpoint, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }).catch(() => axiosInstance.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      }));

      if (res.data?.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordSection(false); // Auto close after success
      } else {
        toast.error(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      dispatch(clearUserData());
      localStorage.removeItem('token');
      toast.info('Logged out successfully');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="flex items-center gap-3 text-primary font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading your Brightloop profile...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto py-1 sm:py-2 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-premium border border-softLavender flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#5145E5] via-[#8067F8] to-[#38C6D9] text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl uppercase shadow-md shadow-primary/20 shrink-0">
            {profileData.name ? profileData.name[0] : 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-deepNavy tracking-tight break-words">{profileData.name || 'Member'}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5145E5]/10 text-primary border border-primary/20 capitalize">
                {profileData.role || 'Member'}
              </span>
            </div>
            <p className="text-xs text-slateGray mt-0.5 break-all">{profileData.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition cursor-pointer w-full sm:w-auto justify-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Grid: Details & Collapsible Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 Cols: Personal Details */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-2xl shadow-premium border border-softLavender">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-softLavender">
            <div>
              <h2 className="text-base font-bold text-deepNavy">Account Details</h2>
              <p className="text-xs text-slateGray mt-0.5">Your personal credentials and billing contact info</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-[#5145E5]/10 transition cursor-pointer self-start sm:self-auto"
            >
              {isEditing ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs text-deepNavy border border-softLavender rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full px-3.5 py-2.5 text-xs border border-softLavender bg-mainBg text-slateGray rounded-xl cursor-not-allowed"
                />
                <p className="text-[11px] text-slateGray mt-1">Verified work email is locked for security.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                  Phone Number <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 text-xs text-deepNavy border border-softLavender rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 bg-mainBg hover:bg-softLavender/60 text-slateGray font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-mainBg rounded-xl border border-softLavender flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Full Name</p>
                  <p className="text-deepNavy font-bold text-sm mt-0.5">{profileData.name || 'Not provided'}</p>
                </div>
                <User className="w-4 h-4 text-slateGray" />
              </div>

              <div className="p-3.5 bg-mainBg rounded-xl border border-softLavender flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Email Address</p>
                  <p className="text-deepNavy font-bold text-sm mt-0.5">{profileData.email}</p>
                </div>
                <Mail className="w-4 h-4 text-emerald-500" />
              </div>

              <div className="p-3.5 bg-mainBg rounded-xl border border-softLavender flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slateGray">Phone Number</p>
                  <p className="text-deepNavy font-bold text-sm mt-0.5">{profileData.phone || 'Not provided'}</p>
                </div>
                <Phone className="w-4 h-4 text-slateGray" />
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Security Card with On-Demand Password Change Toggle */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-premium border border-softLavender flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white mb-4 shadow-md shadow-primary/20">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-deepNavy">Security & Authentication</h3>
            <p className="text-xs text-slateGray mt-1 leading-relaxed">
              Your account password is encrypted with salt rounds. You can update your password on demand.
            </p>

            {/* If NOT open, show a clean, compact button */}
            {!showPasswordSection ? (
              <div className="mt-6 pt-6 border-t border-softLavender">
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(true)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-deepNavy bg-mainBg hover:bg-softLavender/60 border border-softLavender hover:border-slateGray/30 transition-all duration-200 flex items-center justify-between cursor-pointer group"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <span>Change Account Password</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slateGray group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              /* When user clicks "Change Account Password", the form opens cleanly */
              <div className="mt-6 pt-6 border-t border-softLavender animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-deepNavy">Update Password</span>
                  <button
                    type="button"
                    onClick={() => setShowPasswordSection(false)}
                    className="text-[11px] text-slateGray hover:text-deepNavy font-semibold cursor-pointer underline"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-deepNavy mb-1">
                      Current Password <span className="text-primary">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs text-deepNavy border border-softLavender rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-deepNavy">
                        New Password <span className="text-primary">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-primary hover:text-secondary font-medium cursor-pointer"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="At least 8 chars"
                      className="w-full px-3 py-2 text-xs text-deepNavy border border-softLavender rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-deepNavy mb-1">
                      Confirm New Password <span className="text-primary">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 text-xs text-deepNavy border border-softLavender rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="flex-1 py-2.5 px-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer"
                    >
                      {changingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordSection(false)}
                      className="px-3 py-2.5 bg-mainBg hover:bg-softLavender/60 text-slateGray font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="pt-6 mt-6 border-t border-softLavender text-[11px] text-slateGray">
            Session protected with standard TLS 1.3 encryption.
          </div>
        </div>
      </div>
    </div>
  );
}
