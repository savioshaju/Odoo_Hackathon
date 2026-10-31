import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500 bg-white">
      <p>© {new Date().getFullYear()} LoopLedger. All rights reserved.</p>
    </footer>
  );
}

