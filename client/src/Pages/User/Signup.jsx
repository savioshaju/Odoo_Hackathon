import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Mail, Phone, Lock, ShieldCheck, ArrowRight, Sparkles, RefreshCw, Layers, Check } from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import BrightloopLogo from '../../Components/Shared/BrightloopLogo';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\d{10}$/;

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAgreed: true,
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(formData.password),
  };

  const getPasswordStrength = () => {
    const metCount = Object.values(passwordCriteria).filter(Boolean).length;
    if (metCount <= 2) return { label: 'Weak', color: 'bg-red-400', width: '25%' };
    if (metCount === 3) return { label: 'Fair', color: 'bg-amber-400', width: '50%' };
    if (metCount === 4) return { label: 'Good', color: 'bg-indigo-400', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email (e.g. name@domain.com)';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!PHONE_REGEX.test(value.trim())) return 'Phone number must be exactly 10 digits';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (type !== 'checkbox') {
      const fieldError = validateField(name, processedValue);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError,
        ...(name === 'password' && prev.confirmPassword
          ? { confirmPassword: processedValue !== formData.confirmPassword ? 'Passwords do not match' : '' }
          : {}),
      }));
    }
  };

  const validateAll = () => {
    const newErrors = {};
    ['name', 'email', 'phone', 'password', 'confirmPassword'].forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Send OTP to verify email
  const handleSendOTP = async () => {
    if (!validateAll()) {
      toast.error('Please resolve the field errors before requesting OTP');
      return;
    }
    if (!formData.termsAgreed) {
      toast.error('Please accept the Brightloop terms to continue');
      return;
    }

    setSendingOtp(true);
    try {
      const response = await axiosInstance.post('/users/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data?.success) {
        setOtpSent(true);
        setCountdown(60);
        toast.success(response.data.message || 'OTP sent to your email!');
      } else {
        toast.error(response.data?.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to connect to the server';
      toast.error(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setSendingOtp(true);
    try {
      const response = await axiosInstance.post('/users/resend-otp', {
        email: formData.email.trim(),
      });

      if (response.data?.success) {
        setCountdown(60);
        toast.success('A new verification code has been dispatched!');
      } else {
        toast.error(response.data?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 3: Verify OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      toast.error('Please send an OTP first');
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setVerifying(true);
    try {
      const response = await axiosInstance.post('/users/verify-otp', {
        email: formData.email.trim(),
        otp: otp.trim(),
      });

      if (response.data?.success) {
        toast.success('Account created successfully! Welcome to Brightloop.');
        navigate('/login', { state: { email: formData.email.trim() } });
      } else {
        toast.error(response.data?.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setVerifying(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8FC]">
      {/* LEFT ARTWORK SECTION: 2026 Split-Screen with Abstract Geometric Artwork */}
      <div className="relative w-full lg:w-[46%] min-h-[460px] lg:min-h-screen bg-gradient-to-br from-[#171A35] via-[#5145E5] to-[#8067F8] p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden text-white">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#38C6D9]/25 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#8067F8]/40 blur-[110px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/">
            <BrightloopLogo 
              className="h-10 w-10 shadow-lg shadow-black/20" 
              textClassName="text-2xl font-black text-white" 
            />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-[#38C6D9]" /> 14-Day Pro Trial
          </span>
        </div>

        {/* Center Artwork & Visual Features */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#38C6D9]/15 border border-[#38C6D9]/30 text-[#38C6D9] mb-5">
            <Layers className="w-3.5 h-3.5" /> Modern Architecture
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Build your recurring <br />
            <span className="bg-gradient-to-r from-white via-white/95 to-[#38C6D9] bg-clip-text text-transparent">
              revenue engine.
            </span>
          </h2>

          <p className="mt-4 text-base text-white/80 leading-relaxed font-normal">
            Join thousands of modern founders and finance teams operating subscription billing, automated invoicing, and instant dunning without friction.
          </p>

          {/* Abstract 3D Geometric Card Artwork */}
          <div className="mt-8 space-y-3">
            {[
              { title: 'Automated Invoice Reconciliation', sub: 'Instant syncing with your ledger and bank feeds' },
              { title: 'Smart Dunning & Card Recovery', sub: 'Recover up to 74% of failed payments automatically' },
              { title: 'Multi-Currency & Regional Taxes', sub: 'Built-in support for global SaaS compliance' },
            ].map((item, idx) => (
              <div key={idx} className="glass-dark rounded-xl p-3.5 border border-white/15 backdrop-blur-md flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#5145E5] to-[#38C6D9] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-wide">{item.title}</p>
                  <p className="text-[11px] text-white/70">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
          <span>Enterprise Grade SOC-2 Type II Certified</span>
          <span>© 2026 Brightloop</span>
        </div>
      </div>

      {/* RIGHT REGISTRATION SECTION */}
      <div className="w-full lg:w-[54%] flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-deepNavy tracking-tight">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slateGray">
              Get started with Brightloop today. Verify your email to complete registration.
            </p>
          </div>

          <form onSubmit={handleVerifyAndRegister} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                Full Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  disabled={otpSent}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white text-sm text-deepNavy border rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                    errors.name ? 'border-red-400 focus:border-red-500' : 'border-softLavender focus:border-primary'
                  } ${otpSent ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                Work Email Address <span className="text-primary">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    disabled={otpSent}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white text-sm text-deepNavy border rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                      errors.email ? 'border-red-400 focus:border-red-500' : 'border-softLavender focus:border-primary'
                    } ${otpSent ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                  />
                </div>
                {/* "Send OTP" button only appears when OTP has NOT been sent yet */}
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOtp}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#5145E5] to-[#8067F8] hover:from-[#4338CA] hover:to-[#6D52F7] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-[#5145E5]/20 transition cursor-pointer whitespace-nowrap min-w-[100px] flex items-center justify-center"
                  >
                    {sendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              {otpSent && (
                <div className="flex items-center justify-between mt-1 text-xs text-emerald-600 font-medium">
                  <span>✓ 6-Digit code sent to {formData.email}</span>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Change email
                  </button>
                </div>
              )}
            </div>

            {/* Email OTP Code Field (Appears only once OTP is sent, with Resend OTP button right next to it) */}
            {otpSent && (
              <div className="animate-fadeIn p-3.5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy">
                    Enter 6-Digit Email OTP <span className="text-primary">*</span>
                  </label>
                  <span className="text-[11px] text-slateGray">Valid for 10 minutes</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      autoFocus
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-sm tracking-[0.3em] font-bold text-deepNavy border border-primary/40 rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
                    />
                  </div>
                  {/* Resend OTP button placed right next to the OTP input field */}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={sendingOtp || countdown > 0}
                    className="px-4 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 disabled:bg-gray-100 disabled:text-gray-400 text-primary font-bold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap min-w-[105px] flex items-center justify-center"
                  >
                    {sendingOtp ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : 'Resend OTP'}
                  </button>
                </div>
                <p className="text-[11px] text-slateGray">
                  Enter the verification code sent to <strong>{formData.email}</strong>.
                </p>
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                Mobile Number <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  disabled={otpSent}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit number (e.g. 9876543210)"
                  maxLength={10}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white text-sm text-deepNavy border rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                    errors.phone ? 'border-red-400 focus:border-red-500' : 'border-softLavender focus:border-primary'
                  } ${otpSent ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy">
                    Password <span className="text-primary">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-primary hover:text-secondary font-medium cursor-pointer"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    disabled={otpSent}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white text-sm text-deepNavy border rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                      errors.password ? 'border-red-400 focus:border-red-500' : 'border-softLavender focus:border-primary'
                    } ${otpSent ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-deepNavy mb-1.5">
                  Confirm Password <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slateGray">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    disabled={otpSent}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 bg-white text-sm text-deepNavy border rounded-xl shadow-xs transition duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                      errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-softLavender focus:border-primary'
                    } ${otpSent ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="p-3 bg-white border border-softLavender rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slateGray">Password Strength:</span>
                  <span className={strength.label === 'Strong' ? 'text-emerald-600' : 'text-primary'}>
                    {strength.label}
                  </span>
                </div>
                <div className="w-full bg-softLavender h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-slateGray pt-1">
                  <span className={passwordCriteria.length ? 'text-emerald-600 font-medium' : ''}>✓ 8+ chars</span>
                  <span className={passwordCriteria.uppercase ? 'text-emerald-600 font-medium' : ''}>✓ 1 Uppercase</span>
                  <span className={passwordCriteria.number ? 'text-emerald-600 font-medium' : ''}>✓ 1 Number</span>
                  <span className={passwordCriteria.special ? 'text-emerald-600 font-medium' : ''}>✓ 1 Special symbol</span>
                </div>
              </div>
            )}

            {/* Terms and conditions checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 text-primary bg-white border-softLavender rounded focus:ring-primary/20 accent-[#5145E5] cursor-pointer"
                />
                <span className="text-xs text-slateGray leading-relaxed select-none">
                  I agree to the Brightloop <a href="#" className="text-primary hover:underline font-semibold">Terms of Service</a> and acknowledge the <a href="#" className="text-primary hover:underline font-semibold">Privacy Policy</a>.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOtp}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5145E5] to-[#8067F8] hover:from-[#4338CA] hover:to-[#6D52F7] shadow-lg shadow-[#5145E5]/25 hover:shadow-xl hover:shadow-[#5145E5]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {sendingOtp ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Checking Details & Sending OTP...
                    </span>
                  ) : (
                    <>
                      <span>Send OTP to Verify Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={verifying || otp.length !== 6}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5145E5] to-[#38C6D9] hover:from-[#4338CA] hover:to-[#22A5B8] shadow-lg shadow-[#5145E5]/25 hover:shadow-xl hover:shadow-[#5145E5]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying OTP & Registering...
                    </span>
                  ) : (
                    <>
                      <span>Verify OTP & Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slateGray">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary hover:text-secondary transition"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
