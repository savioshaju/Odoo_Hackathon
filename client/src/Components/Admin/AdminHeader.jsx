import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminHeader() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <Link to="/admin" className="font-bold text-lg text-gray-800">
        Admin Portal
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Admin</span>
      </div>
    </header>
  );
}
