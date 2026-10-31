import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowUpRight, 
  Layers, 
  Tag, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function GenericCatalogPage({ 
  title = "Products Catalog", 
  subtitle = "Manage active SaaS subscription products, base pricing, and plans.",
  entityName = "Product" 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleItems = [
    { id: 'PRD-01', name: 'Cloud Infrastructure API', category: 'Core Platform', price: '$290.00 / mo', status: 'Active', subscribers: '1,420 users', variants: 3 },
    { id: 'PRD-02', name: 'Real-time Event Webhooks', category: 'Add-on', price: '$80.00 / mo', status: 'Active', subscribers: '890 users', variants: 2 },
    { id: 'PRD-03', name: 'Enterprise Audit Logs & SSO', category: 'Compliance', price: '$450.00 / mo', status: 'Active', subscribers: '312 teams', variants: 1 },
    { id: 'PRD-04', name: 'AI Churn Copilot', category: 'Intelligence', price: '$120.00 / mo', status: 'Active', subscribers: '620 users', variants: 2 },
    { id: 'PRD-05', name: 'Dedicated Dedicated IP Pool', category: 'Add-on', price: '$199.00 / mo', status: 'Draft', subscribers: '0 users', variants: 1 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-deepNavy tracking-tight">{title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#5145E5]/10 text-primary border border-primary/20">
              5 Items
            </span>
          </div>
          <p className="text-xs text-slateGray mt-1">{subtitle}</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add New {entityName}</span>
        </button>
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

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-mainBg text-[11px] font-bold uppercase tracking-wider text-slateGray border-b border-softLavender">
              <th className="py-3 px-6">ID</th>
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Base Price</th>
              <th className="py-3 px-6">Variants</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-softLavender text-xs">
            {sampleItems.map((item) => (
              <tr key={item.id} className="hover:bg-mainBg/60 transition">
                <td className="py-4 px-6 font-mono font-bold text-deepNavy">{item.id}</td>
                <td className="py-4 px-6 font-bold text-deepNavy">{item.name}</td>
                <td className="py-4 px-6 text-slateGray font-medium">
                  <span className="px-2.5 py-1 bg-mainBg rounded-lg border border-softLavender font-mono text-[11px]">
                    {item.category}
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-deepNavy">{item.price}</td>
                <td className="py-4 px-6 text-slateGray">{item.variants} variants</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    item.status === 'Active' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slateGray bg-gray-100 border border-gray-200'
                  }`}>
                    {item.status === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                    {item.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-1 text-slateGray hover:text-deepNavy rounded-lg hover:bg-mainBg transition cursor-pointer">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

