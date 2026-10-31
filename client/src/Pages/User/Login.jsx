import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Sparkles, TrendingUp } from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { saveUserData } from '../../store/slice/userSlice';
import BrightloopLogo from '../../Components/Shared/BrightloopLogo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({
        ...prev,
        identifier: location.state.email,
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.identifier.trim()) {
      toast.error('Please enter your email or phone number');
      return;
    }
    if (!formData.password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/users/login', {
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Welcome back to Brightloop!');
        if (response.data.user) {
          dispatch(saveUserData(response.data.user));
        }
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        if (response.data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(response.data?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to connect to the server';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8FC]">
      {/* LEFT SECTION: 2026 Premium Deep Indigo Gradient with Glassmorphism Artwork */}
      <div className="relative w-full lg:w-[48%] min-h-[420px] lg:min-h-screen bg-gradient-to-br from-[#171A35] via-[#5145E5] to-[#8067F8] p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden text-white">
        {/* Abstract Glowing Orbs & Geometry */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#38C6D9]/25 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[480px] h-[480px] rounded-full bg-[#8067F8]/40 blur-[110px] pointer-events-none" />
        
        {/* Subtle grid line overlay */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none" 
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        {/* Top: Brand Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BrightloopLogo 
              className="h-10 w-10 shadow-lg shadow-black/20" 
              textClassName="text-2xl font-black text-white" 
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-[#38C6D9]" /> Next-Gen Billing 2026
          </span>
        </div>

        {/* Middle: Hero Statement & 3D Glass Artwork */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#38C6D9]/15 border border-[#38C6D9]/30 text-[#38C6D9] mb-6">
            <Zap className="w-3.5 h-3.5" /> High Velocity Revenue Automation
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Everything subscriptions. <br />
            <span className="bg-gradient-to-r from-white via-white/95 to-[#38C6D9] bg-clip-text text-transparent">
              One beautiful platform.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed font-normal">
            Automate recurrent billing, monitor churn metrics in real time, and scale customer lifetime value with effortless elegance.
          </p>

          {/* Floating Translucent Glass Card */}
          <div className="mt-10 relative">
            <div className="glass-dark rounded-2xl p-5 shadow-2xl border border-white/20 relative backdrop-blur-xl max-w-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5145E5] to-[#38C6D9] flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60 font-medium">Recurring Revenue Engine</p>
                    <p className="text-sm font-bold text-white tracking-tight">Active Automation</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-[#38C6D9] bg-[#38C6D9]/10 rounded-lg border border-[#38C6D9]/20">
                  Live
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#8067F8] to-[#38C6D9] h-full rounded-full w-[100%]" />
              </div>
            </div>

            {/* Small glass decorative pill */}
            <div className="absolute -bottom-4 right-4 glass-dark rounded-xl px-3 py-2 flex items-center gap-2 border border-white/25 shadow-xl">
              <ShieldCheck className="w-4 h-4 text-[#38C6D9]" />
              <span className="text-xs font-semibold text-white/90">Automated Reconciliations</span>
            </div>
          </div>
        </div>

        {/* Bottom: Trust Banner */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <span>Enterprise Grade SOC-2 Type II Certified</span>
          <span>© 2026 Brightloop Inc.</span>
        </div>
      </div>

      {/* RIGHT SECTION: Minimal, Spacious Premium Login Form */}
      <div className="w-full lg:w-[52%] flex items-center justify-center p-6 sm:p-12 lg:p-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-9">
            <h2 className="text-3xl font-extrabold text-deepNavy tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slateGray">
              Sign in to manage your workspaces, invoices, and subscriptions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email or Phone Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-2">
                Email or Mobile Number <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  placeholder="name@company.com or 10-digit phone"
                  className="w-full pl-10 pr-4 py-3 bg-white text-sm text-deepNavy placeholder-slateGray/60 border border-softLavender rounded-xl shadow-xs transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slateGray/40"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy">
                  Password <span className="text-primary">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-secondary transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white text-sm text-deepNavy placeholder-slateGray/60 border border-softLavender rounded-xl shadow-xs transition duration-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slateGray/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slateGray hover:text-deepNavy transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary bg-white border-softLavender rounded focus:ring-primary/20 accent-[#5145E5] cursor-pointer"
                />
                <span className="text-xs font-medium text-slateGray select-none">
                  Remember this device for 30 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5145E5] to-[#8067F8] hover:from-[#4338CA] hover:to-[#6D52F7] shadow-lg shadow-[#5145E5]/25 hover:shadow-xl hover:shadow-[#5145E5]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In to Brightloop</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slateGray">
              New to Brightloop?{' '}
              <Link
                to="/signup"
                className="font-bold text-primary hover:text-secondary transition"
              >
                Create your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
