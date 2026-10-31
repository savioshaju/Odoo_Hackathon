import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../Config/axiosInstance';
import { saveUserData } from '../../store/slice/userSlice';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    
    // For phone: only digits, max 10 characters
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/users/signup', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Account created successfully!');
        if (response.data.user) {
          dispatch(saveUserData(response.data.user));
        }
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        navigate('/dashboard');
      } else {
        toast.error(response.data?.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
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
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create your account</h2>
          <p className="text-sm text-gray-500 mt-2">Sign up with your details to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="rahul@example.com"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone Number (Simple 10 digits) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
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
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
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
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 text-sm border rounded-lg transition focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-400 bg-red-50/30'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 px-4 rounded-lg shadow-sm transition duration-200 flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
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
