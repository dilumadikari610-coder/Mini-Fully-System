import React, { useState } from 'react';
import { Printer, Package, ClipboardList, Database } from 'lucide-react';

const InventoryManager = ({ grns = [] }) => {
  const [activeTab, setActiveTab] = useState('grn'); 
  const systemColor = "#A47148";

  // Print Logic for GRN Log
  const handlePrintGRN = (grn) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>MMS CORE - GRN PRINT ${grn.grnId}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #334155; }
            .header { border-bottom: 2px solid #334155; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>GOODS RECEIVED NOTE (GRN)</h2>
            <p><strong>GRN ID:</strong> ${grn.grnId} | <strong>Date:</strong> ${new Date(grn.receivedDate || grn.date).toLocaleDateString()}</p>
            <p><strong>Supplier:</strong> ${(grn.supplier || 'N/A').toUpperCase()}</p>
            <p><strong>Invoice:</strong> ${grn.invoiceCode || '---'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Item Name</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${grn.items.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.quantity || item.qty}</td>
                  <td>${parseFloat(item.cost).toFixed(2)}</td>
                  <td>${( (item.quantity || item.qty) * item.cost ).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-8 font-sans animate-in fade-in duration-500 selection:bg-[#A47148]/10">
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight uppercase">Tools & Inventory</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Stock Management & Ledger</p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button 
            onClick={() => setActiveTab('grn')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all ${activeTab === 'grn' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ClipboardList size={14} /> GRN Log
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Database size={14} /> General Stock
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {activeTab === 'grn' ? (
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">GRN Reference</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Supplier / Vendor</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Entry Date</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grns.length > 0 ? grns.map((grn) => (
                <tr key={grn._id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-700">{grn.grnId}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Ref: {grn.invoiceCode || '---'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-600 uppercase">{grn.supplier || 'Unknown'}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                    {new Date(grn.receivedDate || grn.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button 
                      onClick={() => handlePrintGRN(grn)}
                      className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                    >
                      <Printer size={12} /> Print View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-medium uppercase tracking-widest">No GRN records available in ledger</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GENERAL STOCK VIEW */
        <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Material Description</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Current Balance</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Cost Center</th>
                <th className="px-6 py-4 text-[10px] font-semibold uppercase text-slate-400 tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grns.flatMap(g => g.items.map(item => ({ ...item, grnId: g.grnId }))).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-700 uppercase">{item.itemName}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">Source: {item.grnId}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-600">{item.quantity || item.qty} <span className="text-[10px] text-slate-400 font-normal ml-1">PCS</span></p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">Main Warehouse</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
                      item.status === 'In Stock' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {item.status || 'In Stock'}
                    </span>
                  </td>
                </tr>
              ))}
              {grns.length === 0 && (
                <tr><td colSpan="4" className="py-32 text-center text-slate-300 font-medium uppercase tracking-widest">No inventory data found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="mt-6 flex justify-between items-center px-2">
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest italic">Internal Inventory Ledger | MMS CORE</p>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Live Data Sync</p>
      </div>
    </div>
  );
};

export default InventoryManager;