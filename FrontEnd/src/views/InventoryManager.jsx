import React, { useState, useRef, useEffect } from 'react';
import { Printer, Package, ClipboardList, Database, Search, Calendar, RotateCcw } from 'lucide-react';

// 💡 CUSTOM MODERN DATE PICKER COMPONENT
const ModernDatePicker = ({ label, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(value ? new Date(value).getFullYear() : today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value).getMonth() : today.getMonth());

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handleDateClick = (day) => {
    const pad = (n) => (n < 10 ? '0' + n : n);
    const selectedDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
    onChange(selectedDate);
    setIsOpen(false);
  };

  return (
    // 💡 FIXED: Label සහ Inputs අකුරුද text-black බවට පත් කරන ලදී
    <div className="space-y-1.5 relative w-full select-none" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      <label className="text-[10px] text-black uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>{label}</label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black outline-none cursor-pointer flex items-center justify-between hover:bg-white hover:border-slate-400 transition-all shadow-sm"
        style={{ fontWeight: 'normal' }}
      >
        <Calendar className="absolute left-3.5 text-slate-400" size={14} />
        <span className="font-mono text-black">{value ? value : "YYYY-MM-DD"}</span>
        {value && (
          <RotateCcw 
            size={11} 
            className="text-slate-400 hover:text-red-500 transition-colors" 
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center mb-3">
            <button 
              type="button"
              className="p-1 hover:bg-slate-100 rounded-lg text-black text-xs"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
            >
              &larr;
            </button>
            <span className="text-xs text-black uppercase tracking-tight" style={{ fontWeight: 'normal' }}>
              {months[currentMonth]} {currentYear}
            </span>
            <button 
              type="button"
              className="p-1 hover:bg-slate-100 rounded-lg text-black text-xs"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
            >
              &rarr;
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-[9px] text-slate-400 uppercase mb-1" style={{ fontWeight: 'normal' }}>
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-black">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`}></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const pad = (n) => (n < 10 ? '0' + n : n);
              const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(dayNum)}`;
              const isSelected = value === dateStr;

              return (
                <div 
                  key={dayNum}
                  onClick={() => handleDateClick(dayNum)}
                  className={`py-1 rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'hover:bg-slate-100 text-black'
                  }`}
                  style={{ fontWeight: 'normal' }}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryManager = ({ grns = [] }) => {
  const [activeTab, setActiveTab] = useState('grn'); 
  const systemColor = "#A47148";

  // --- FILTERS STATES ---
  const [searchGRN, setSearchGRN] = useState('');
  const [searchToolName, setSearchToolName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndingDate] = useState('');

  // දිනය YYYY-MM-DD ලෙස සකසා ගැනීමට
  const formatDateSafe = (dateInput) => {
    if (!dateInput) return 'N/A';
    try {
      const dateObj = new Date(dateInput);
      if (isNaN(dateObj.getTime())) return 'N/A';
      return dateObj.toISOString().split('T')[0];
    } catch (e) {
      return 'N/A';
    }
  };

  // Print Logic for GRN Log
  const handlePrintGRN = (grn) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>MMS CORE - GRN PRINT ${grn.invoiceCode || grn.grnId}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #000000; text-transform: uppercase; }
            .header { border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; color: #000000; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>GOODS RECEIVED NOTE (GRN)</h2>
            <p><strong>GRN ID:</strong> ${grn.invoiceCode || grn.grnId} | <strong>Date:</strong> ${formatDateSafe(grn.date || grn.receivedDate)}</p>
            <p><strong>Supplier:</strong> ${(grn.supplier || grn.vendor || 'N/A').toUpperCase()}</p>
            <p><strong>Vehicle No:</strong> ${grn.vehicleNumber || '---'}</p>
          </div>
          <table>
            <thead>
              <tr><th>Item Name</th><th>Qty</th><th>Unit Cost</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${(grn.items || []).map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.qty || item.quantity}</td>
                  <td>${parseFloat(item.cost || 0).toFixed(2)}</td>
                  <td>${( (item.qty || item.quantity) * (item.cost || 0) ).toFixed(2)}</td>
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

  // GRN LOG VIEW - FLAT ITEM-WISE MAPPING
  const allFlattenedGRNItems = grns.flatMap(g => 
    (g.items || []).map(item => ({
      ...item,
      _parentGRN: g,
      grnId: g.invoiceCode || g.grnId,
      supplier: g.supplier || g.vendor || 'Unknown',
      entryDate: g.date || g.receivedDate
    }))
  );

  // Filter Logic for GRN Log Tab (Item-wise)
  const filteredGRNItems = allFlattenedGRNItems.filter(item => {
    const matchesGRN = item.grnId?.toLowerCase().includes(searchGRN.toLowerCase());
    const matchesTool = item.itemName?.toLowerCase().includes(searchToolName.toLowerCase());
    
    const itemDate = formatDateSafe(item.entryDate);
    const matchesStartDate = startDate && itemDate !== 'N/A' ? itemDate >= startDate : true;
    const matchesEndDate = endDate && itemDate !== 'N/A' ? itemDate <= endDate : true;

    return matchesGRN && matchesTool && matchesStartDate && matchesEndDate;
  });

  // GENERAL STOCK VIEW FILTER LOGIC
  const filteredStockItems = allFlattenedGRNItems.filter(item => {
    const matchesGRN = item.grnId?.toLowerCase().includes(searchGRN.toLowerCase());
    const matchesTool = item.itemName?.toLowerCase().includes(searchToolName.toLowerCase());
    
    const itemDate = formatDateSafe(item.entryDate);
    const matchesStartDate = startDate && itemDate !== 'N/A' ? itemDate >= startDate : true;
    const matchesEndDate = endDate && itemDate !== 'N/A' ? itemDate <= endDate : true;

    return matchesGRN && matchesTool && matchesStartDate && matchesEndDate;
  });

  const handleResetFilters = () => {
    setSearchGRN('');
    setSearchToolName('');
    setStartDate('');
    setEndingDate('');
  };

  return (
    // 💡 FIXED: Main root layout text color එක text-black බවට පත් කරන ලදී
    <div className="p-8 antialiased text-black select-none bg-[#F8FAFC] min-h-screen" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h1 className="text-xl text-black tracking-tight uppercase" style={{ fontWeight: 'normal' }}>Tools & Inventory</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1" style={{ fontWeight: 'normal' }}>Stock Management & Ledger Pipeline</p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          <button 
            onClick={() => { setActiveTab('grn'); handleResetFilters(); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all ${activeTab === 'grn' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-black'}`}
            style={{ fontWeight: 'normal' }}
          >
            <ClipboardList size={14} /> GRN Log
          </button>
          <button 
            onClick={() => { setActiveTab('inventory'); handleResetFilters(); }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-black'}`}
            style={{ fontWeight: 'normal' }}
          >
            <Database size={14} /> General Stock
          </button>
        </div>
      </div>

      {/* --- ADVANCED LIVE CONTROLS & FILTERS SEARCH PANEL --- */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm mb-6 grid grid-cols-12 gap-4 items-end">
        <div className="col-span-12 md:col-span-3 space-y-1.5">
          <label className="text-[10px] text-black uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Search GRN Ref</label>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 text-slate-400" size={14} />
            <input 
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase outline-none focus:border-slate-400 focus:bg-white text-black font-semibold"
              style={{ fontWeight: 'normal' }}
              placeholder="e.g. GRN000001"
              value={searchGRN}
              onChange={e => setSearchGRN(e.target.value)}
            />
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 space-y-1.5">
          <label className="text-[10px] text-black uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Search Tool / Item Name</label>
          <div className="relative flex items-center">
            <Package className="absolute left-3.5 text-slate-400" size={14} />
            <input 
              type="text"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase outline-none focus:border-slate-400 focus:bg-white text-black font-semibold"
              style={{ fontWeight: 'normal' }}
              placeholder="e.g. TETS / HAMMER"
              value={searchToolName}
              onChange={e => setSearchToolName(e.target.value)}
            />
          </div>
        </div>

        {/* CUSTOM MODERN PICKERS */}
        <div className="col-span-6 md:col-span-2">
          <ModernDatePicker label="Start Date" value={startDate} onChange={setStartDate} />
        </div>

        <div className="col-span-6 md:col-span-2">
          <ModernDatePicker label="End Date" value={endDate} onChange={setEndingDate} />
        </div>

        <div className="col-span-12 md:col-span-2">
          <button 
            onClick={handleResetFilters}
            className="w-full py-2 bg-slate-50 border border-slate-200 text-black hover:bg-slate-100 rounded-xl text-[10px] uppercase tracking-wider active:scale-95 transition-all"
            style={{ fontWeight: 'normal' }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      {activeTab === 'grn' ? (
        /* GRN LOG TAB - ITEM WISE VIEW */
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm animate-in fade-in duration-200">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* 💡 FIXED: Table Header text-black කරන ලදී */}
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-black tracking-wider uppercase" style={{ fontWeight: 'normal' }}>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>GRN Reference</th>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Supplier / Vendor</th>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Allocated Item Name</th>
                <th className="px-6 py-3.5 border-r border-slate-100 text-center w-24" style={{ fontWeight: 'normal' }}>Qty</th>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Entry Date</th>
                <th className="px-6 py-3.5 text-center w-32" style={{ fontWeight: 'normal' }}>Action</th>
              </tr>
            </thead>
            {/* 💡 FIXED: Table Body අකුරු සියල්ල text-black බවට පත් කරන ලදී */}
            <tbody className="divide-y divide-slate-100 text-xs text-black bg-white" style={{ fontWeight: 'normal' }}>
              {filteredGRNItems.length > 0 ? filteredGRNItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors uppercase">
                  <td className="py-4 px-6 text-blue-600 border-r border-slate-100 font-mono">
                    {item.grnId}
                  </td>
                  <td className="px-6 py-4 border-r border-slate-100 text-black">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-4 border-r border-slate-100 text-black">
                    <span className="font-mono text-slate-400 text-[10px] mr-1.5">[{item.itemCode}]</span>
                    {item.itemName}
                  </td>
                  <td className="px-6 py-4 text-center border-r border-slate-100 font-mono text-black bg-slate-50/40">
                    {item.qty || item.quantity || 0}
                  </td>
                  <td className="px-6 py-4 border-r border-slate-100 text-black font-mono tracking-normal">
                    {formatDateSafe(item.entryDate)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handlePrintGRN(item._parentGRN)}
                      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-widest text-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                      style={{ fontWeight: 'normal' }}
                    >
                      <Printer size={12} /> Print View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-24 text-center text-slate-400 text-xs uppercase tracking-wider bg-slate-50/40" style={{ fontWeight: 'normal' }}>
                    No matching GRN records available in ledger
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GENERAL STOCK VIEW */
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm animate-in fade-in duration-200">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* 💡 FIXED: General Stock Header text-black කරන ලදී */}
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-black tracking-wider uppercase" style={{ fontWeight: 'normal' }}>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Material Description</th>
                <th className="px-6 py-3.5 border-r border-slate-100 text-center w-36 " style={{ fontWeight: 'normal' }}>Current Balance</th>
                <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Cost Center Location</th>
                <th className="px-6 py-3.5 text-center w-32" style={{ fontWeight: 'normal' }}>Status</th>
              </tr>
            </thead>
            {/* 💡 FIXED: General Stock Table Body අකුරු සියල්ල text-black බවට පත් කරන ලදී */}
            <tbody className="divide-y divide-slate-100 text-xs text-black bg-white" style={{ fontWeight: 'normal' }}>
              {filteredStockItems.length > 0 ? filteredStockItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors uppercase">
                  <td className="px-6 py-4 border-r border-slate-100">
                    <p className="text-sm text-black tracking-tight">
                      <span className="text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded text-[10px] mr-2 font-mono">[{item.itemCode}]</span>
                      {item.itemName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 lowercase tracking-normal">Batch Identifier Source: {item.grnId}</p>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-100 text-center bg-slate-50/40 font-mono text-black">
                    {item.qty || item.quantity} <span className="text-[9px] text-slate-400 ml-0.5">PCS</span>
                  </td>
                  <td className="px-6 py-4 border-r border-slate-100 text-black">
                    Main Warehouse Store
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-xl text-[9px] uppercase tracking-widest border ${
                      item.status === 'In Stock' 
                      ? 'bg-emerald-50/60 text-emerald-600 border-emerald-100' 
                      : 'bg-blue-50/60 text-blue-600 border-blue-100'
                    }`} style={{ fontWeight: 'normal' }}>
                      {item.status || 'In Stock'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="py-24 text-center text-slate-400 text-xs uppercase tracking-wider bg-slate-50/40" style={{ fontWeight: 'normal' }}>
                    No inventory registry data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="mt-6 flex justify-between items-center px-2">
        <p className="text-[9px] text-slate-400 uppercase tracking-widest italic" style={{ fontWeight: 'normal' }}>Internal Inventory Ledger | MMS CORE</p>
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em]" style={{ fontWeight: 'normal' }}>Live Data Sync</p>
      </div>
    </div>
  );
};

export default InventoryManager;