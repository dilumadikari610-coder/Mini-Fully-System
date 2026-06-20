import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, CheckCircle, ArrowLeft, Package, 
  Truck, CreditCard, FileText, Search, Trash2, Calendar, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GRNPage = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [grnList, setGrnList] = useState([]); 
  const [dbMaterials, setDbMaterials] = useState([]); 
  
  // 💡 NEW STATE: ඩේටාබේස් එකෙන් එන Suppliers ලැයිස්තුව තබා ගැනීමට
  const [suppliersList, setSuppliersList] = useState([]); 

  const [isCreating, setIsCreating] = useState(false);
  const [printTarget, setPrintTarget] = useState(null);

  // --- SEARCHABLE DROPDOWN STATES ---
  const [materialSearch, setMaterialSearch] = useState(''); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const dropdownRef = useRef(null);

  // --- HEADER STATE ---
  const [header, setHeader] = useState({
    invoiceCode: 'GENERATING...', 
    vehicle: '',
    driverName: '',
    vendor: '', 
    date: new Date().toISOString().split('T')[0]
  });

  // --- SKU ENTRY STATE ---
  const [currentSKU, setCurrentSKU] = useState({
    code: '', 
    itemName: '',
    qty: '',
    cost: '',
  });

  const [itemsList, setItemsList] = useState([]);

  useEffect(() => {
    fetchAllGRNRecords();
    fetchRegisteredMaterials();
    fetchRegisteredSuppliers(); // 💡 පිටුව ලෝඩ් වෙද්දීම සැබෑ Suppliers ලෝඩ් කරයි

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCreating) {
      generateFrontendInvoiceCode();
      setHeader(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }
  }, [isCreating, grnList]);

  const fetchAllGRNRecords = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/grn');
      setGrnList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch GRN list:", err);
    }
  };

  const fetchRegisteredMaterials = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/materials');
      setDbMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch registered materials:", err);
    }
  };

  // 💡 NEW FUNCTION: Supplier Registration එකෙන් සේව් කරන Suppliers API එකෙන් ලෝඩ් කිරීම
  const fetchRegisteredSuppliers = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/suppliers');
      setSuppliersList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch registered suppliers:", err);
    }
  };

  const generateFrontendInvoiceCode = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/grn/next-invoice');
      if (res.data && res.data.nextInvoice) {
        const customGRNCode = res.data.nextInvoice.replace("INV", "GRN");
        setHeader(prev => ({ ...prev, invoiceCode: customGRNCode }));
        return;
      }
    } catch (err) {
      console.log("Backend invoice API slow, fallback to local sort...");
    }

    if (grnList.length === 0) {
      setHeader(prev => ({ ...prev, invoiceCode: 'GRN000001' }));
      return;
    }

    const sortedGrns = [...grnList].sort((a, b) => {
      const numA = parseInt(a.invoiceCode?.replace("GRN", "").replace("INV", "") || "0", 10);
      const numB = parseInt(b.invoiceCode?.replace("GRN", "").replace("INV", "") || "0", 10);
      return numB - numA; 
    });

    const lastInvoiceCode = sortedGrns[0]?.invoiceCode;

    if (!lastInvoiceCode) {
      setHeader(prev => ({ ...prev, invoiceCode: 'GRN000001' }));
      return;
    }

    const lastNum = parseInt(lastInvoiceCode.replace("GRN", "").replace("INV", ""), 10);
    const nextInvoiceCode = `GRN${(lastNum + 1).toString().padStart(6, '0')}`;
    setHeader(prev => ({ ...prev, invoiceCode: nextInvoiceCode }));
  };

  const selectMaterialItem = (mat) => {
    setCurrentSKU({
      ...currentSKU,
      code: mat.code || '',
      itemName: mat.itemName || '',
      cost: mat.cost || '0.00'
    });
    setMaterialSearch(`${mat.code} - ${mat.itemName}`); 
    setIsDropdownOpen(false); 
  };

  const handleAddToList = (e) => {
    e.preventDefault();
    if (!currentSKU.itemName.trim()) return toast.error("Please search and select a valid registered material");
    if (!currentSKU.qty || Number(currentSKU.qty) <= 0) return toast.error("Enter a valid quantity");
    if (!currentSKU.cost || Number(currentSKU.cost) <= 0) return toast.error("Enter a valid unit cost");

    const qtyNum = Number(currentSKU.qty);
    const costNum = Number(currentSKU.cost);

    if (isNaN(qtyNum) || isNaN(costNum)) {
      return toast.error("Quantity and Cost must be numeric values");
    }

    const newItem = { 
      id: Date.now(),
      code: currentSKU.code || "GEN-MAT", 
      itemName: currentSKU.itemName.trim().toUpperCase(), 
      qty: qtyNum, 
      cost: costNum,
      total: qtyNum * costNum
    };

    setItemsList([...itemsList, newItem]);
    setCurrentSKU({ code: '', itemName: '', qty: '', cost: '' });
    setMaterialSearch('');
    toast.success(`Material Added: ${newItem.itemName}`);
  };

  const handleRemoveItem = (id) => {
    setItemsList(itemsList.filter(item => item.id !== id));
    toast.success("Item removed from list");
  };

  const totalSkuCount = itemsList.length;
  const totalQty = itemsList.reduce((acc, item) => acc + item.qty, 0);
  const grandTotalCost = itemsList.reduce((acc, item) => acc + item.total, 0);

  const handleConfirmGRN = async () => {
    if (!header.invoiceCode.trim() || header.invoiceCode === 'GENERATING...') return toast.error("GRN Code is not ready");
    
    if (!header.vendor.trim()) return toast.error("Vendor / Supplier name is required!");
    if (!header.vehicle.trim()) return toast.error("Vehicle Number is required!");
    if (!header.driverName.trim()) return toast.error("Driver Name / Received By is required!");
    if (itemsList.length === 0) return toast.error("Please add at least one material item to the table before saving");

    setLoading(true);
    const t = toast.loading('Confirming and Saving GRN...');

    const payload = { 
      invoiceCode: header.invoiceCode.trim().toUpperCase(),
      supplier: header.vendor.trim().toUpperCase(), 
      vendor: header.vendor.trim().toUpperCase(), 
      vehicleNumber: header.vehicle.trim().toUpperCase(),
      vehicle: header.vehicle.trim().toUpperCase(),
      driverName: header.driverName.trim().toUpperCase(),
      receivedBy: header.driverName.trim().toUpperCase(), 
      date: header.date,
      items: itemsList.map(item => ({
        code: item.code,
        materialCode: item.code,
        itemName: item.itemName,
        itemDescription: item.itemName,
        qty: item.qty,     
        quantity: item.qty, 
        cost: item.cost,
        price: item.cost
      }))
    };

    try {
      await axios.post('http://192.168.1.19:5000/api/grn', payload);
      toast.success("GRN Registered Successfully", { id: t });
      
      setIsCreating(false);
      setItemsList([]);
      setHeader({
        invoiceCode: 'GENERATING...',
        vehicle: '',
        driverName: '',
        vendor: '',
        date: new Date().toISOString().split('T')[0]
      });

      fetchAllGRNRecords();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Submission Error Details:", err.response?.data);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      toast.error(serverMessage || "Failed to save GRN (400 Bad Request)", { id: t });
    } finally {
      setLoading(false);
    }
  };

  const filteredDbMaterials = dbMaterials.filter(mat => 
    mat.code?.toLowerCase().includes(materialSearch.toLowerCase()) ||
    mat.itemName?.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const triggerPrintReceipt = () => {
    window.print();
  };

  return (
    // 💡 FIXED: Segoe UI Font Family එක සමස්ත Layout එකටම ඇතුළත් කරන ලදී
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-700 tracking-normal antialiased select-none" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-invoice-area, .printable-document * { visibility: visible; }
          .printable-invoice-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* PRINT RECEIPT PREVIEW OVERLAY */}
      {printTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl p-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Printer size={16} /> GRN Receipt Print Preview
              </h3>
              <button 
                onClick={() => setPrintTarget(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase border border-slate-200 px-3 py-1.5 rounded-lg"
              >
                Close Preview
              </button>
            </div>

            <div className="printable-invoice-area bg-white border border-slate-300 p-8 text-xs text-slate-800 tracking-normal uppercase">
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <h1 className="text-lg font-black tracking-tight text-slate-900">ELISHA CLOTHING PVT LTD</h1>
                <p className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5">Garment Inventory & Material Management Pipeline</p>
                <div className="mt-2 inline-block bg-slate-100 font-bold px-3 py-1 border border-slate-300 text-[10px]">GOODS RECEIVED NOTE RECEIPT</div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-5 font-medium">
                <div className="space-y-1">
                  <p><span className="text-slate-400 font-bold">GRN CODE:</span> <span className="font-mono font-bold text-blue-600">{printTarget.invoiceCode || printTarget.grnId}</span></p>
                  <p><span className="text-slate-400 font-bold">DATE RECEIVED:</span> <span className="font-mono font-bold">{printTarget.date ? printTarget.date.split('T')[0] : 'N/A'}</span></p>
                  <p><span className="text-slate-400 font-bold">VEHICLE NUMBER:</span> <span className="font-mono font-bold">{printTarget.vehicleNumber || printTarget.vehicle || 'N/A'}</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="text-slate-400 font-bold">SUPPLIER / VENDOR:</span> <span className="font-bold text-slate-900">{printTarget.supplier || printTarget.vendor || 'N/A'}</span></p>
                  <p><span className="text-slate-400 font-bold">RECEIVED BY:</span> <span className="font-bold text-slate-900">{printTarget.receivedBy || printTarget.driverName || 'N/A'}</span></p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-400 text-[11px] mb-8">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-400 text-slate-700">
                    <th className="p-2 border-r border-slate-300 w-10 text-center">#</th>
                    <th className="p-2 border-r border-slate-300">Material Name / Identification</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Qty</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">Unit Cost</th>
                    <th className="p-2 text-right w-28">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                  {printTarget.items?.map((item, index) => {
                    const itemUnitCost = Number(item.cost !== undefined ? item.cost : item.price || 0);
                    const itemQty = Number(item.qty !== undefined ? item.qty : item.quantity || 0);
                    const itemSubTotal = itemQty * itemUnitCost;

                    return (
                      <tr key={index}>
                        <td className="p-2 border-r border-slate-300 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="p-2 border-r border-slate-300">
                          <span className="font-mono text-blue-600">[{item.code || item.materialCode}]</span> {item.itemName || item.itemDescription}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-mono">{itemQty}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">{itemUnitCost.toFixed(2)}</td>
                        <td className="p-2 text-right font-mono text-slate-900">{itemSubTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 font-bold border-t border-slate-400 text-slate-900">
                    <td colSpan="4" className="p-2 text-right border-r border-slate-300 uppercase">Gross Aggregate Value (LKR):</td>
                    <td className="p-2 text-right font-mono font-black border-b-4 border-double border-slate-900">
                      {(printTarget.items?.reduce((acc, i) => {
                        const c = Number(i.cost !== undefined ? i.cost : i.price || 0);
                        const q = Number(i.qty !== undefined ? i.qty : i.quantity || 0);
                        return acc + (q * c);
                      }, 0) || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-12 text-center text-[10px] font-bold mt-16">
                <div>
                  <div className="w-40 border-b border-slate-400 mx-auto mb-1.5 h-6"></div>
                  <p className="text-slate-400 uppercase">Storekeeper Signature</p>
                </div>
                <div>
                  <div className="w-40 border-b border-slate-400 mx-auto mb-1.5 h-6"></div>
                  <p className="text-slate-400 uppercase">Authorized Officer Verification</p>
                </div>
              </div>
            </div>

            <button 
              onClick={triggerPrintReceipt}
              className="w-full mt-6 py-3 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Printer size={15} /> Confirm & Trigger Hardware Printer
            </button>
          </div>
        </div>
      )}

      {/* HEADER CONTROLS */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm no-print">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => isCreating ? setIsCreating(false) : navigate(-1)} 
            className="p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-slate-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              {isCreating ? "Create New GRN" : "Goods Received Notes (GRN)"}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {isCreating ? "Operational Stock Entry Form" : "View and Manage Goods Received History"}
            </p>
          </div>
        </div>

        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)} 
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus size={16} /> Add New GRN
          </button>
        ) : (
          <button 
            onClick={handleConfirmGRN} 
            disabled={loading || header.invoiceCode === 'GENERATING...'} 
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle size={15} /> {loading ? "Saving..." : "Confirm & Save GRN"}
          </button>
        )}
      </div>

      {/* BODY CONTAINER */}
      <div className="max-w-7xl mx-auto p-6">
        
        {/* CONDITION 1: GRN Records ලැයිස්තුව (List View) */}
        {!isCreating ? (
          <div className="bg-white border border-slate-200 overflow-hidden shadow-none rounded-none no-print animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Recent GRN Records History</h3>
            </div>

            {grnList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 text-[10px] font-bold tracking-wide uppercase border-b border-slate-200">
                      <th className="py-2.5 px-5 border-r border-slate-200">GRN Code</th>
                      <th className="py-2.5 px-5 border-r border-slate-200">Date</th>
                      <th className="py-2.5 px-5 border-r border-slate-200">Vendor / Supplier</th>
                      <th className="py-2.5 px-5 border-r border-slate-200">Vehicle No</th>
                      <th className="py-2.5 px-5 border-r border-slate-200">Received By</th>
                      <th className="py-2.5 px-5 border-r border-slate-200 text-center">Items</th>
                      <th className="py-2.5 px-5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-600 bg-white">
                    {[...grnList].reverse().map((grn, idx) => (
                      <tr key={grn._id || idx} className="hover:bg-slate-50/50 transition-colors uppercase">
                        <td className="py-2.5 px-5 font-mono font-bold text-blue-600 border-r border-slate-200/60">
                          {grn.invoiceCode || grn.grnId || `GRN-${grn._id?.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="py-2.5 px-5 text-slate-500 font-mono flex items-center gap-1.5 border-r border-slate-200/60 tracking-normal lowercase">
                          <Calendar size={13} className="text-slate-400" />
                          {grn.date ? grn.date.split('T')[0] : '2026-06-20'}
                        </td>
                        <td className="py-2.5 px-5 text-slate-800 font-bold border-r border-slate-200/60">{grn.vendor || grn.supplier || 'N/A'}</td>
                        <td className="py-2.5 px-5 font-mono text-slate-700 font-bold border-r border-slate-200/60">{grn.vehicleNumber || grn.vehicle || 'N/A'}</td>
                        <td className="py-2.5 px-5 text-slate-600 border-r border-slate-200/60">{grn.receivedBy || grn.driverName || 'N/A'}</td>
                        <td className="py-2.5 px-5 text-center font-bold text-slate-700 border-r border-slate-200/60">
                          {grn.items ? grn.items.length : 0}
                        </td>
                        <td className="py-2.5 px-5 text-center">
                          <button 
                            type="button"
                            onClick={() => setPrintTarget(grn)}
                            className="p-1 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded transition-all flex items-center justify-center mx-auto"
                            title="Print GRN Slip"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center space-y-3">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-full inline-block">
                  <Package size={24} />
                </div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">No GRN Records Found in Database</p>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="text-xs text-blue-600 font-semibold underline hover:text-blue-700"
                >
                  Click here to create the first record
                </button>
              </div>
            )}
          </div>
        ) : (
          
          // CONDITION 2: ADD NEW FORM CREATION VIEW
          <div className="grid grid-cols-12 gap-6 no-print animate-in slide-in-from-bottom-4 duration-200">
            
            {/* LEFT COLUMN: REFERENCE INFO */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
                  <div className="p-1.5 bg-slate-100 text-slate-700 rounded-xl"><FileText size={15}/></div>
                  <h3 className="text-xs font-bold text-slate-800">Reference Info</h3>
                </div>
                
                <div className="space-y-4">
                  <InputField label="GRN Code (Auto-Generated)" icon={<CreditCard size={14}/>} placeholder="Generating..." value={header.invoiceCode} readOnly={true} onChange={() => {}} />
                  <InputField label="Transaction Date" icon={<Calendar size={14}/>} placeholder="YYYY-MM-DD" value={header.date} readOnly={true} onChange={() => {}} />
                  
                  {/* 💡 FIXED LOGIC: අතින් ලියන Input එක වෙනුවට, Supplier Registration එකෙන් එන දත්ත Dropdown එකකට දමන ලදී */}
                  <div className="space-y-1 block">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Vendor / Supplier</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Truck size={14}/></div>
                      <select
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all uppercase"
                        value={header.vendor}
                        onChange={(e) => setHeader({...header, vendor: e.target.value})}
                        required
                      >
                        <option value="" disabled>Select Registered Supplier</option>
                        {suppliersList.map(sup => (
                          <option key={sup._id} value={sup.name}>{sup.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <InputField label="Vehicle Number" icon={<Truck size={14}/>} placeholder="e.g. WP LC-4920" value={header.vehicle} onChange={(v) => setHeader({...header, vehicle: v})} />
                  <InputField label="Driver Name" icon={<FileText size={14}/>} placeholder="e.g. Receiving Department" value={header.driverName} onChange={(v) => setHeader({...header, driverName: v})} />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SKU FORM */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3 mb-5">
                    <div className="p-1.5 bg-slate-100 text-slate-700 rounded-xl"><Package size={15}/></div>
                    <h3 className="text-xs font-bold text-slate-800">GR SKU Posting Form</h3>
                  </div>

                  <form onSubmit={handleAddToList} className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6 relative" ref={dropdownRef}>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Material / Item Description</label>
                      <div className="relative mt-1.5">
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                          placeholder="Type at least 2 characters to search..."
                          value={materialSearch}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMaterialSearch(val);
                            if (val.trim().length >= 2) setIsDropdownOpen(true);
                            else setIsDropdownOpen(false);
                            if(!val) setCurrentSKU({ code: '', itemName: '', qty: '', cost: '' });
                          }}
                        />
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
                      </div>

                      {isDropdownOpen && materialSearch.trim().length >= 2 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 animate-in fade-in duration-100">
                          {filteredDbMaterials.length > 0 ? (
                            filteredDbMaterials.map((mat) => (
                              <div
                                key={mat._id}
                                onClick={() => selectMaterialItem(mat)}
                                className="px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 font-medium cursor-pointer transition-colors flex justify-between items-center border-b border-slate-50 last:border-b-0 bg-white"
                              >
                                <div>
                                  <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold">{mat.code}</span>
                                  <span className="font-semibold text-slate-800">{mat.itemName}</span>
                                </div>
                                <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-full">LKR {mat.cost.toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-white">
                              No matching registered materials found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Qty</label>
                      <input type="number" className="w-full mt-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all" placeholder="Qty" value={currentSKU.qty} onChange={(e) => setCurrentSKU({...currentSKU, qty: e.target.value})} />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Cost (LKR)</label>
                      <input type="number" step="0.01" className="w-full mt-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all" placeholder="Cost" value={currentSKU.cost} onChange={(e) => setCurrentSKU({...currentSKU, cost: e.target.value})} />
                    </div>
                    <button type="submit" className="col-span-12 mt-3 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/5">
                      <Plus size={15} /> Add Item
                    </button>
                  </form>
                </div>

                {itemsList.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] font-semibold tracking-wide uppercase">
                            <th className="py-2.5 px-4 w-12 text-center">#</th>
                            <th className="py-2.5 px-4">Item Name</th>
                            <th className="py-2.5 px-4 text-center w-20">Qty</th>
                            <th className="py-2.5 px-4 text-right w-28">Cost</th>
                            <th className="py-2.5 px-4 text-right w-32">Total Value</th>
                            <th className="py-2.5 px-4 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600 bg-white">
                          {itemsList.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors uppercase">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-bold">{index + 1}</td>
                              <td className="py-2.5 px-4 text-slate-800 font-bold">{item.itemName}</td>
                              <td className="py-2.5 px-4 text-center font-extrabold text-slate-700">{item.qty}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-500">{item.cost.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-blue-600 font-bold">{item.total.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-center">
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveItem(item.id)} 
                                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-around text-center text-xs font-medium">
                  <div>
                    <p className="text-slate-500">Total SKU</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{totalSkuCount}</p>
                  </div>
                  <div className="border-l border-slate-200"></div>
                  <div>
                    <p className="text-slate-500">Total Qty</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">{totalQty}</p>
                  </div>
                  <div className="border-l border-slate-200"></div>
                  <div>
                    <p className="text-slate-500">Net Cost Value</p>
                    <p className="text-lg font-bold text-blue-600 mt-0.5">{grandTotalCost.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="mt-4 text-slate-400 hover:text-slate-600 text-xs font-semibold text-center uppercase tracking-wider"
                >
                  Cancel and View History
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

const InputField = ({ label, icon, placeholder, value, readOnly, onChange }) => (
  <div className="space-y-1 block">
    <label className="text-xs font-semibold text-slate-600 block mb-1">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs font-medium outline-none transition-all ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-mono' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`} 
        placeholder={placeholder} 
        value={value} 
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

export default GRNPage;