import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Receipt, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  ArrowUpRight 
} from 'lucide-react';
import axiosInstance from '../../Config/axiosInstance';
import { toast } from 'react-toastify';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/subscriptions/invoices');
      if (res.data?.success) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadInvoice = (inv) => {
    toast.success(`Downloading receipt ${inv.invoiceNumber}...`);
  };

  const filtered = invoices.filter((inv) =>
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.planName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-deepNavy tracking-tight">
              Billing & Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {invoices.length} {invoices.length === 1 ? 'Receipt' : 'Receipts'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slateGray mt-1">
            Review your past subscription charges, transaction dates, and download payment receipts.
          </p>
        </div>

        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="p-2 text-slateGray hover:text-deepNavy rounded-xl border border-softLavender hover:bg-mainBg transition cursor-pointer self-start sm:self-auto"
          title="Refresh invoices"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-softLavender shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slateGray absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or plan..."
            className="w-full pl-9 pr-4 py-2 bg-mainBg border border-softLavender rounded-xl text-xs text-deepNavy placeholder-slateGray/70 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>
      </div>

      {/* Table vs Empty */}
      <div className="bg-white rounded-2xl border border-softLavender shadow-premium overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slateGray">Loading billing history...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-mainBg text-[11px] font-bold uppercase tracking-wider text-slateGray border-b border-softLavender">
                  <th className="py-3.5 px-6">Invoice #</th>
                  <th className="py-3.5 px-6">Plan / Item</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-softLavender text-xs">
                {filtered.map((inv) => (
                  <tr key={inv._id || inv.invoiceNumber} className="hover:bg-mainBg/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-deepNavy">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 font-bold text-deepNavy">
                      {inv.planName}
                    </td>
                    <td className="py-4 px-6 text-slateGray">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-black text-deepNavy">
                      ${inv.amount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mainBg hover:bg-primary hover:text-white text-slateGray rounded-lg text-xs font-semibold border border-softLavender transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-mainBg flex items-center justify-center text-slateGray mb-3 border border-softLavender">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-deepNavy">No Billing Invoices Recorded</h3>
            <p className="text-xs text-slateGray max-w-sm mt-1">
              You haven't been billed for any subscriptions yet. When you subscribe to a plan, your tax invoices and receipts will show up here.
            </p>
            <Link
              to="/subscription-plans"
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <span>Explore Plans</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
