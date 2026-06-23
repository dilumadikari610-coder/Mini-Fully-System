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
  const [suppliersList, setSuppliersList] = useState([]); 

  // 💡 NEW WORKFLOW STATES
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

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
    fetchRegisteredSuppliers();
    fetchActiveWorkflowTemplates(); // 💡 පිටුව ලෝඩ් වෙද්දීම සක්‍රීය වර්ක්ෆ්ලෝ ටෙම්ප්ලේට්ස් ලෝඩ් කරයි

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

  const fetchRegisteredSuppliers = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/suppliers');
      setSuppliersList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch registered suppliers:", err);
    }
  };

  // 💡 NEW FETCH LOGIC: අපේ සිස්ටම් එකේ හදපු වර්ක්ෆ්ලෝ ටෙම්ප්ලේට්ස් ලෝඩ් කිරීම
  const fetchActiveWorkflowTemplates = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/workflow/templates');
      setWorkflowTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load workflow matrix:", err);
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
      workflowTemplateCode: selectedWorkflow || undefined, // 💡 PAYLOAD UPDATE
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
      toast.success("GRN Saved & Routed Successfully", { id: t });
      
      setIsCreating(false);
      setItemsList([]);
      setSelectedWorkflow(''); // Reset
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
    <div className="min-h-screen bg-[#EFEFEF] pb-20 text-[#000000] tracking-normal antialiased select-none" style={{ fontFamily: 'Segoe UI, Open Sans, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      
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
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl p-8 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-sm font-normal text-[#000000] uppercase tracking-tight flex items-center gap-1.5" style={{ fontWeight: 'normal' }}>
                <Printer size={16} /> GRN Receipt Print Preview
              </h3>
              <button 
                onClick={() => setPrintTarget(null)}
                className="text-xs text-slate-500 uppercase border border-slate-200 px-3 py-1.5 rounded-lg"
                style={{ fontWeight: 'normal' }}
              >
                Close Preview
              </button>
            </div>

            <div className="printable-invoice-area bg-white border border-slate-300 p-8 text-xs text-black tracking-normal uppercase" style={{ fontWeight: 'normal' }}>
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
                <h1 className="text-lg text-black tracking-tight" style={{ fontWeight: 'normal' }}>ELISHA CLOTHING PVT LTD</h1>
                <p className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5">Garment Inventory & Material Management Pipeline</p>
                <div className="mt-2 inline-block bg-slate-100 px-3 py-1 border border-slate-300 text-[10px]">GOODS RECEIVED NOTE RECEIPT</div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-5 font-medium">
                <div className="space-y-1">
                  <p><span className="text-slate-400">GRN CODE:</span> <span className="font-mono text-blue-600">{printTarget.invoiceCode || printTarget.grnId}</span></p>
                  <p><span className="text-slate-400">DATE RECEIVED:</span> <span className="font-mono">{printTarget.date ? printTarget.date.split('T')[0] : 'N/A'}</span></p>
                  <p><span className="text-slate-400">VEHICLE NUMBER:</span> <span className="font-mono">{printTarget.vehicleNumber || printTarget.vehicle || 'N/A'}</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="text-slate-400">SUPPLIER / VENDOR:</span> <span className="text-black">{printTarget.supplier || printTarget.vendor || 'N/A'}</span></p>
                  <p><span className="text-slate-400">RECEIVED BY:</span> <span className="text-black">{printTarget.receivedBy || printTarget.driverName || 'N/A'}</span></p>
                </div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-400 text-[11px] mb-8">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-400 text-black" style={{ fontWeight: 'normal' }}>
                    <th className="p-2 border-r border-slate-300 w-10 text-center" style={{ fontWeight: 'normal' }}>#</th>
                    <th className="p-2 border-r border-slate-300" style={{ fontWeight: 'normal' }}>Material Name / Identification</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20 " style={{ fontWeight: 'normal' }}>Qty</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24" style={{ fontWeight: 'normal' }}>Unit Cost</th>
                    <th className="p-2 text-right w-28" style={{ fontWeight: 'normal' }}>Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-black" style={{ fontWeight: 'normal' }}>
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
                        <td className="p-2 text-right font-mono text-black">{itemSubTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50 text-black">
                    <td colSpan="4" className="p-2 text-right border-r border-slate-300 uppercase">Gross Aggregate Value (LKR):</td>
                    <td className="p-2 text-right font-mono border-b-4 border-double border-slate-900">
                      {(printTarget.items?.reduce((acc, i) => {
                        const q = Number(i.qty !== undefined ? i.qty : i.quantity || 0);
                        const c = Number(i.cost !== undefined ? i.cost : i.price || 0);
                        return acc + (q * c);
                      }, 0) || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-12 text-center text-[10px] mt-16">
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
              className="w-full mt-6 py-3 bg-slate-900 text-white text-xs uppercase rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
              style={{ fontWeight: 'normal' }}
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
            <h1 className="text-lg text-black tracking-tight" style={{ fontWeight: 'normal' }}>
              {isCreating ? "Create New GRN" : "Goods Received Notes (GRN)"}
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCreating ? "Operational Stock Entry Form" : "View and Manage Goods Received History"}
            </p>
          </div>
        </div>

        {!isCreating ? (
          <button 
            onClick={() => setIsCreating(true)} 
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5"
            style={{ fontWeight: 'normal' }}
          >
            <Plus size={16} /> Add New GRN
          </button>
        ) : (
          <button 
            onClick={handleConfirmGRN} 
            disabled={loading || header.invoiceCode === 'GENERATING...'} 
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center gap-2"
            style={{ fontWeight: 'normal' }}
          >
            <CheckCircle size={15} /> {loading ? "Saving..." : "Confirm & Save GRN"}
          </button>
        )}
      </div>

      {/* BODY CONTAINER */}
      <div className="max-w-7xl mx-auto p-6">
        
        {!isCreating ? (
          <div className="bg-white border border-slate-200 overflow-hidden shadow-sm rounded-[24px] no-print animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <FileText size={15} className="text-slate-500" />
              <h3 className="text-xs text-black uppercase tracking-wide" style={{ fontWeight: 'normal' }}>Recent GRN Records History</h3>
            </div>

            {grnList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-black text-[10px] tracking-wide uppercase border-b border-slate-200" style={{ fontWeight: 'normal' }}>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>GRN Code</th>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Date</th>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Vendor / Supplier</th>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Vehicle No</th>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Received By</th>
                      <th className="py-2.5 px-5 border-r border-slate-200" style={{ fontWeight: 'normal' }}>Status</th>
                      <th className="py-2.5 px-5 text-center w-24" style={{ fontWeight: 'normal' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-black bg-white" style={{ fontWeight: 'normal' }}>
                    {[...grnList].reverse().map((grn, idx) => (
                      <tr key={grn._id || idx} className="hover:bg-slate-50/50 transition-colors uppercase">
                        <td className="py-2.5 px-5 font-mono text-blue-600 border-r border-slate-200/60">
                          {grn.invoiceCode || grn.grnId}
                        </td>
                        <td className="py-2.5 px-5 text-slate-500 font-mono border-r border-slate-200/60 tracking-normal lowercase">
                          {grn.date ? grn.date.split('T')[0] : '2026-06-20'}
                        </td>
                        <td className="py-2.5 px-5 text-black border-r border-slate-200/60">{grn.vendor || grn.supplier || 'N/A'}</td>
                        <td className="py-2.5 px-5 font-mono text-black border-r border-slate-200/60">{grn.vehicleNumber || grn.vehicle || 'N/A'}</td>
                        <td className="py-2.5 px-5 text-black border-r border-slate-200/60">{grn.receivedBy || grn.driverName || 'N/A'}</td>
                        {/* Status Matrix Display */}
                        <td className="py-2.5 px-5 border-r border-slate-200/60">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] border ${
                            grn.status === 'In Stock' || grn.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {grn.status || 'In Stock'}
                          </span>
                        </td>
                        <td className="py-2.5 px-5 text-center">
                          <button 
                            type="button"
                            onClick={() => setPrintTarget(grn)}
                            className="p-1 text-slate-500 hover:text-black transition-all flex items-center justify-center mx-auto"
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
              <div className="p-16 text-center space-y-3 bg-white">
                <p className="text-slate-400 text-xs uppercase tracking-wider">No GRN Records Found in Database</p>
              </div>
            )}
          </div>
        ) : (
          
          /* FORM CREATION VIEW */
          <div className="grid grid-cols-12 gap-6 no-print animate-in slide-in-from-bottom-4 duration-200">
            
            {/* LEFT COLUMN: REFERENCE INFO CARD */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="p-1.5 bg-slate-100 text-black rounded-xl"><FileText size={15}/></div>
                  <h3 className="text-xs text-black uppercase tracking-wider" style={{ fontWeight: 'normal' }}>Reference Info</h3>
                </div>
                
                <div className="space-y-4">
                  <InputField label="GRN Code (Auto-Generated)" icon={<CreditCard size={14}/>} placeholder="Generating..." value={header.invoiceCode} readOnly={true} onChange={() => {}} />
                  <InputField label="Transaction Date" icon={<Calendar size={14}/>} placeholder="YYYY-MM-DD" value={header.date} readOnly={true} onChange={() => {}} />
                  
                  <div className="space-y-1 block">
                    <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>Vendor / Supplier</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Truck size={14}/></div>
                      <select
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-black rounded-xl text-xs outline-none focus:border-slate-400 focus:bg-white transition-all uppercase cursor-pointer"
                        value={header.vendor}
                        onChange={(e) => setHeader({...header, vendor: e.target.value})}
                        style={{ fontWeight: 'normal' }}
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
                  
                  {/* 💡 FIXED: REFERENCE INFO පැනලයට සාර්ථකව සම්බන්ධ කළ නවතම WORKFLOW SELECTION DROPDOWN එක */}
                  <div className="space-y-1 block border-t border-slate-100 pt-3">
                    <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>Authorization Workflow Routing</label>
                    <div className="relative">
                      <select
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-black rounded-xl text-xs outline-none cursor-pointer uppercase hover:bg-white hover:border-slate-400 transition-all shadow-sm"
                        style={{ fontWeight: 'normal' }}
                        value={selectedWorkflow}
                        onChange={e => setSelectedWorkflow(e.target.value)}
                      >
                        <option value="">-- Direct Post (No Workflow) --</option>
                        {workflowTemplates.map(tmpl => (
                          <option key={tmpl._id} value={tmpl.code}>{tmpl.code} - {tmpl.description}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SKU FORM */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
                    <div className="p-1.5 bg-slate-100 text-black rounded-xl"><Package size={15}/></div>
                    <h3 className="text-xs text-black uppercase tracking-wider" style={{ fontWeight: 'normal' }}>GR SKU Posting Form</h3>
                  </div>

                  <form onSubmit={handleAddToList} className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6 relative" ref={dropdownRef}>
                      <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>Material / Item Description</label>
                      <div className="relative mt-1.5">
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black outline-none focus:border-slate-400 transition-all placeholder:text-slate-400 uppercase"
                          style={{ fontWeight: 'normal' }}
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
                                className="px-4 py-2.5 hover:bg-slate-50 text-xs text-black cursor-pointer transition-colors flex justify-between items-center border-b border-slate-100 last:border-b-0 bg-white uppercase"
                                style={{ fontWeight: 'normal' }}
                              >
                                <div>
                                  <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] mr-2 font-bold">{mat.code}</span>
                                  <span>{mat.itemName}</span>
                                </div>
                                <span className="text-[10px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-full">LKR {mat.cost.toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-center text-slate-400 text-[10px] uppercase tracking-wider bg-white">
                              No matching registered materials found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>Qty</label>
                      <input type="number" className="w-full mt-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black outline-none focus:border-slate-400 transition-all font-mono" placeholder="Qty" value={currentSKU.qty} onChange={(e) => setCurrentSKU({...currentSKU, qty: e.target.value})} style={{ fontWeight: 'normal' }} />
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>Cost (LKR)</label>
                      <input type="number" step="0.01" className="w-full mt-1.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black outline-none focus:border-slate-400 transition-all font-mono" placeholder="Cost" value={currentSKU.cost} onChange={(e) => setCurrentSKU({...currentSKU, cost: e.target.value})} style={{ fontWeight: 'normal' }} />
                    </div>
                    <button type="submit" className="col-span-12 mt-3 py-2.5 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5" style={{ fontWeight: 'normal' }}>
                      <Plus size={15} /> Add Item
                    </button>
                  </form>
                </div>

                {itemsList.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-white text-[10px] tracking-wide uppercase" style={{ fontWeight: 'normal' }}>
                            <th className="py-2.5 px-4 w-12 text-center" style={{ fontWeight: 'normal' }}>#</th>
                            <th className="py-2.5 px-4" style={{ fontWeight: 'normal' }}>Item Name</th>
                            <th className="py-2.5 px-4 text-center w-20" style={{ fontWeight: 'normal' }}>Qty</th>
                            <th className="py-2.5 px-4 text-right w-28" style={{ fontWeight: 'normal' }}>Cost</th>
                            <th className="py-2.5 px-4 text-right w-32" style={{ fontWeight: 'normal' }}>Total Value</th>
                            <th className="py-2.5 px-4 w-12 text-center" style={{ fontWeight: 'normal' }}></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-black bg-white uppercase" style={{ fontWeight: 'normal' }}>
                          {itemsList.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{index + 1}</td>
                              <td className="py-2.5 px-4 text-black">{item.itemName}</td>
                              <td className="py-2.5 px-4 text-center font-mono">{item.qty}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-slate-500">{item.cost.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-right font-mono text-blue-600">{item.total.toFixed(2)}</td>
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

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-around text-center text-xs text-black font-medium">
                  <div>
                    <p className="text-slate-400 uppercase tracking-tight text-[10px]">Total SKU</p>
                    <p className="text-lg text-black mt-0.5 font-mono">{totalSkuCount}</p>
                  </div>
                  <div className="border-l border-slate-200"></div>
                  <div>
                    <p className="text-slate-400 uppercase tracking-tight text-[10px]">Total Qty</p>
                    <p className="text-lg text-black mt-0.5 font-mono">{totalQty}</p>
                  </div>
                  <div className="border-l border-slate-200"></div>
                  <div>
                    <p className="text-slate-400 uppercase tracking-tight text-[10px]">Net Cost Value</p>
                    <p className="text-lg text-blue-600 mt-0.5 font-mono">{grandTotalCost.toFixed(2)}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="mt-4 text-slate-400 hover:text-slate-600 text-xs text-center uppercase tracking-wider"
                  style={{ fontWeight: 'normal' }}
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
  <div className="space-y-1 block text-left" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
    <label className="text-xs text-black block mb-1" style={{ fontWeight: 'normal' }}>{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs outline-none transition-all ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-mono' : 'bg-slate-50 border-slate-200 text-black focus:border-slate-400'}`} 
        placeholder={placeholder} 
        value={value} 
        readOnly={readOnly}
        style={{ fontWeight: 'normal' }}
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

export default GRNPage;