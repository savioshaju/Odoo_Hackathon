import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../Config/axiosInstance';
import { saveUserData } from '../../store/slice/userSlice';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  // Automatically pre-fill the identifier if navigated from successful signup
  useEffect(() => {
    if (location.state?.email) {
      setFormData((prev) => ({
        ...prev,
        identifier: location.state.email,
      }));
    }
  }, [location.state]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
        toast.success(response.data.message || 'Logged in successfully!');
        if (response.data.user) {
          dispatch(saveUserData(response.data.user));
        }
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        // Navigate directly to dashboard after login
        navigate('/dashboard');
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
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
          <p className="text-sm text-gray-500 mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email or Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email or Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
              placeholder="e.g. rahul@example.com or 9876543210"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Sign In Button */}
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
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
