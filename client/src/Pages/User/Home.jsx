import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const user = useSelector((state) => state.user?.userData);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
        Welcome to <span className="text-indigo-600">LoopLedger</span>
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-xl">
        Manage your events, staff, billing, and services with an intuitive and responsive workspace.
      </p>
      <div className="mt-8 flex gap-4">
        {user ? (
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/signup"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition"
            >
              Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
