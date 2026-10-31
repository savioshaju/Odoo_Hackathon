import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../Config/axiosInstance';
import { saveUserData } from '../../store/slice/userSlice';

// Strict email regex: requires valid chars, domain, and 2+ char extension
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Simple 10-digit phone regex
const PHONE_REGEX = /^\d{10}$/;

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Live password criteria check
  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(formData.password),
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!EMAIL_REGEX.test(value.trim())) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'phone': {
        const cleaned = value.trim().replace(/\D/g, '');
        if (!cleaned) {
          error = 'Phone number is required';
        } else if (!PHONE_REGEX.test(cleaned)) {
          error = 'Phone number must be exactly 10 digits';
        }
        break;
      }

      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(value)) {
          error = 'Must include at least one uppercase letter (A-Z)';
        } else if (!/[a-z]/.test(value)) {
          error = 'Must include at least one lowercase letter (a-z)';
        } else if (!/[0-9]/.test(value)) {
          error = 'Must include at least one number (0-9)';
        } else if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(value)) {
          error = 'Must include at least one special character (!@#$%^&*...)';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;

      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    const fieldError = validateField(name, processedValue);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
      ...(name === 'password' && prev.confirmPassword
        ? { confirmPassword: processedValue !== formData.confirmPassword ? 'Passwords do not match' : '' }
        : {}),
    }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Send OTP (validates info and verifies email uniqueness on backend first)
  const handleSendOTP = async () => {
    if (!validateAll()) {
      toast.error('Please fix all field errors before requesting OTP');
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
        setCountdown(60); // 60s cooldown
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

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setSendingOtp(true);
    try {
      const response = await axiosInstance.post('/users/resend-otp', {
        email: formData.email.trim(),
      });

      if (response.data?.success) {
        setCountdown(60);
        toast.success(response.data.message || 'A new verification OTP has been sent!');
      } else {
        toast.error(response.data?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      const errorMsg = err.response?.data?.message || 'Error resending OTP';
      toast.error(errorMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Step 2: Verify OTP on registration page, then proceed to login
  const handleRegisterAndLogin = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      toast.error('Please request an OTP first by clicking "Send OTP"');
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Please enter the 6-digit OTP code sent to your email');
      return;
    }

    setVerifying(true);
    try {
      const response = await axiosInstance.post('/users/verify-otp', {
        email: formData.email.trim(),
        otp: otp.trim(),
      });

      if (response.data?.success) {
        toast.success('Email verified and registered successfully! Please log in.');
        // Navigate directly to login with the registered email prefilled
        navigate('/login', { state: { email: formData.email.trim() } });
      } else {
        toast.error(response.data?.message || 'Verification failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed';
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-xl bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
          <p className="text-sm text-gray-500 mt-2">Fill in your details, verify OTP, and proceed to login</p>
        </div>

        <form onSubmit={handleRegisterAndLogin} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              disabled={otpSent}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              } ${otpSent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                name="email"
                disabled={otpSent}
                value={formData.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                className={`flex-1 px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                    : 'border-gray-300 focus:ring-indigo-500'
                } ${otpSent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendingOtp}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow-sm transition text-xs cursor-pointer whitespace-nowrap flex items-center justify-center min-w-[95px]"
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={sendingOtp || countdown > 0}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 font-semibold rounded-lg border border-indigo-200 transition text-xs cursor-pointer whitespace-nowrap min-w-[95px]"
                >
                  {sendingOtp ? 'Sending...' : countdown > 0 ? `Resend (${countdown}s)` : 'Resend OTP'}
                </button>
              )}
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            {otpSent && (
              <div className="flex items-center justify-between mt-1 text-xs text-green-600">
                <span>✓ OTP sent to {formData.email}</span>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  Change email
                </button>
              </div>
            )}
          </div>

          {/* OTP Code Input (Always visible on the page) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Email OTP Code <span className="text-red-500">*</span>
              </label>
              {!otpSent && (
                <span className="text-xs text-gray-400">Click &quot;Send OTP&quot; above to receive code</span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={otpSent ? "Enter 6-digit OTP" : "Click 'Send OTP' first"}
                maxLength={6}
                disabled={!otpSent}
                className={`w-full px-3.5 py-2.5 text-sm tracking-widest font-semibold border rounded-lg transition focus:outline-none focus:ring-2 ${
                  otpSent
                    ? 'border-indigo-400 bg-indigo-50/20 focus:ring-indigo-500'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              />
            </div>
            {otpSent && (
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit verification code sent to your email.
              </p>
            )}
          </div>

          {/* Phone Number (Simple 10 digits) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              disabled={otpSent}
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit number (e.g. 9876543210)"
              maxLength={10}
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.phone
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              disabled={otpSent}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              } ${otpSent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}

            {/* Password checklist criteria */}
            <div className="mt-2.5 p-3 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-2 gap-1.5 text-xs">
              <span className={passwordCriteria.length ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {passwordCriteria.length ? '✓' : '•'} At least 8 characters
              </span>
              <span className={passwordCriteria.uppercase ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {passwordCriteria.uppercase ? '✓' : '•'} 1 Uppercase letter (A-Z)
              </span>
              <span className={passwordCriteria.lowercase ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {passwordCriteria.lowercase ? '✓' : '•'} 1 Lowercase letter (a-z)
              </span>
              <span className={passwordCriteria.number ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {passwordCriteria.number ? '✓' : '•'} 1 Number (0-9)
              </span>
              <span className={`col-span-2 ${passwordCriteria.special ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {passwordCriteria.special ? '✓' : '•'} 1 Special character (!@#$%^&*...)
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              disabled={otpSent}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              } ${otpSent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={sendingOtp}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-sm transition duration-200 flex items-center justify-center cursor-pointer text-sm"
              >
                {sendingOtp ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Checking Email & Sending OTP...
                  </span>
                ) : (
                  'Send OTP to Verify Email'
                )}
              </button>
            ) : (
              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition duration-200 flex items-center justify-center cursor-pointer text-sm"
              >
                {verifying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    Verifying OTP & Registering...
                  </span>
                ) : (
                  'Verify OTP & Complete Registration'
                )}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
