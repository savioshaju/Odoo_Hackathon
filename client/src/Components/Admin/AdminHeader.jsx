import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminHeader() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/admin" className="font-bold text-lg text-indigo-600 flex items-center gap-2">
          <span>⚡</span> LoopLedger Admin
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/admin" className="text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            Dashboard
          </Link>
          <Link to="/admin/products" className="text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
            Products & Variants
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">
          Admin Portal
        </span>
      </div>
    </header>
  );
}
