import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Inbox
} from 'lucide-react';

export default function GenericCatalogPage({ 
  title = "Products Catalog", 
  subtitle = "Manage active SaaS subscription products, base pricing, and plans.",
  entityName = "Product",
  canMutate = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items] = useState([]); // Zero dummy items; ready for database records
  const currentUser = useSelector((state) => state.user?.userData);

  // Users can view; only admin can create/mutate items
  const isPrivileged = currentUser?.role === 'admin' || canMutate;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">{subtitle}</p>
        </div>

        {isPrivileged && (
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            <span>Add New {entityName}</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 bg-mainBg border border-softLavender rounded-xl text-xs text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-mainBg text-slateGray hover:text-deepNavy rounded-xl text-xs font-semibold border border-softLavender hover:border-slateGray/30 transition cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Empty State vs Table */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        {items.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-mainBg text-[11px] font-bold uppercase tracking-wider text-slateGray border-b border-softLavender">
                <th className="py-3 px-6">ID</th>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Price</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-softLavender text-xs">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-mainBg/60 transition">
                  <td className="py-4 px-6 font-mono font-bold text-deepNavy">{item.id}</td>
                  <td className="py-4 px-6 font-bold text-deepNavy">{item.name}</td>
                  <td className="py-4 px-6 text-slateGray">{item.category}</td>
                  <td className="py-4 px-6 font-bold text-deepNavy">{item.price}</td>
                  <td className="py-4 px-6">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray mb-3 border border-softLavender">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-deepNavy">No {title} Recorded</h3>
            <p className="text-xs text-slateGray max-w-sm mt-1">
              There are no {title.toLowerCase()} in your database yet.
            </p>
            {isPrivileged && (
              <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <span>Create {entityName}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
