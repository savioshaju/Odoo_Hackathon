import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearUserData } from '../../store/slice/userSlice';
import { toast } from 'react-toastify';

export default function Navbar() {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold text-indigo-600 tracking-tight">
        LoopLedger
      </Link>
      <div className="flex items-center gap-5 text-sm font-medium text-gray-700">
        <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
        {user ? (
          <>
            <Link to="/dashboard" className="hover:text-indigo-600 transition">Dashboard</Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-900 font-semibold">{user.name}</span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 font-semibold cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-indigo-600 transition">Login</Link>
            <Link
              to="/signup"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg transition"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
