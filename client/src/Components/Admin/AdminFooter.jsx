import React from 'react';

export default function AdminFooter() {
  return (
    <footer className="border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500 bg-white">
      <p>© {new Date().getFullYear()} Admin Portal. All rights reserved.</p>
    </footer>
  );
}

