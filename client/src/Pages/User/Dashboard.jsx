import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearUserData } from '../../store/slice/userSlice';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const user = useSelector((state) => state.user?.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearUserData());
    localStorage.removeItem('token');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here is your account overview and personal dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

