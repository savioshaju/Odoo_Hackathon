import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert } from 'lucide-react';

/**
 * RoleBasedRoute: Restricts frontend access to authenticated users with specified roles
 * Usage: <RoleBasedRoute allowedRoles={['user', 'admin']} />
 */
export default function RoleBasedRoute({ allowedRoles = [] }) {
  const user = useSelector((state) => state.user?.userData);

  // If not logged in, block access and redirect immediately to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.role || 'user';

  // If role is not allowed, show modern 403 Forbidden screen
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-deepNavy tracking-tight">Access Restricted</h1>
        <p className="text-xs sm:text-sm text-slateGray max-w-md mt-2 leading-relaxed">
          Your current account role is <span className="font-bold text-deepNavy uppercase">[{userRole}]</span>. This section is reserved for {allowedRoles.join(' or ')} accounts.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <Outlet />;
}
