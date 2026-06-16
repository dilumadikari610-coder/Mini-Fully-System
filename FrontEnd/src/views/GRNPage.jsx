import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, CheckCircle, ArrowLeft, Package, 
  Truck, CreditCard, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GRNPage = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- HEADER STATE ---
  const [header, setHeader] = useState({
    invoiceCode: 'GENERATING...', // මුලින්ම Auto-Generate වෙනකම් පෙන්වන text එක
    vehicle: '',
    driverName: '',
    vendor: '', 
    date: new Date().toISOString().split('T')[0]
  });

  // --- SKU ENTRY STATE ---
  const [currentSKU, setCurrentSKU] = useState({
    itemName: '',
    qty: '',
    cost: '',
  });

  const [itemsList, setItemsList] = useState([]);

  // පිටුව ලෝඩ් වන විටම පවතින GRN ලැයිස්තුව පරීක්ෂා කර ඊළඟ අංකය සෑදීම
  useEffect(() => {
    generateFrontendInvoiceCode();
  }, []);

  // ✅ FRONTEND AUTO-GENERATE LOGIC
  const generateFrontendInvoiceCode = async () => {
    try {
      // දැනට database එකේ තියෙන ඔක්කොම GRN Records ගෙන්න ගන්නවා
      const res = await axios.get('http://192.168.1.19:5000/api/grn');
      const grnData = res.data;

      if (!grnData || grnData.length === 0) {
        setHeader(prev => ({ ...prev, invoiceCode: 'INV000001' }));
        return;
      }

      // 1. දැනට තියෙන ඉහළම/අවසාන invoiceCode එක සොයා ගැනීම
      // (සමහර විට පිළිවෙල වෙනස් වුණොත් කියලා ආරක්ෂාවට sort කරලා ඉහළම එක ගන්නවා)
      const sortedGrns = [...grnData].sort((a, b) => {
        const numA = parseInt(a.invoiceCode?.replace("INV", "") || "0", 10);
        const numB = parseInt(b.invoiceCode?.replace("INV", "") || "0", 10);
        return numB - numA; // Descending sort
      });

      const lastInvoiceCode = sortedGrns[0]?.invoiceCode;

      if (!lastInvoiceCode || !lastInvoiceCode.startsWith("INV")) {
        setHeader(prev => ({ ...prev, invoiceCode: 'INV000001' }));
        return;
      }

      // 2. "INV" කෑල්ල අයින් කර ඉලක්කම පමණක් ගෙන 1ක් එකතු කිරීම
      const lastNum = parseInt(lastInvoiceCode.replace("INV", ""), 10);
      const nextNum = lastNum + 1;
      
      // 3. 'INV000002' ලෙස පේළියට බිංදු 6ක් පිරවීම (Padding)
      const nextInvoiceCode = `INV${nextNum.toString().padStart(6, '0')}`;
      
      setHeader(prev => ({ ...prev, invoiceCode: nextInvoiceCode }));

    } catch (err) {
      console.error("Error generating invoice code on frontend:", err);
      setHeader(prev => ({ ...prev, invoiceCode: 'INV000001' })); // සර්වර් එක offline නම් fallback එකක් ලෙස
    }
  };

  const handleAddToList = (e) => {
    if (e) e.preventDefault();
    if (!currentSKU.itemName.trim()) return toast.error("Please enter material description");
    if (!currentSKU.qty || Number(currentSKU.qty) <= 0) return toast.error("Enter a valid quantity");
    if (!currentSKU.cost || Number(currentSKU.cost) <= 0) return toast.error("Enter a valid unit cost");

    const qtyNum = Number(currentSKU.qty);
    const costNum = Number(currentSKU.cost);

    if (isNaN(qtyNum) || isNaN(costNum)) {
      return toast.error("Quantity and Cost must be numeric values");
    }

    const newItem = { 
      itemName: currentSKU.itemName.trim().toUpperCase(), 
      qty: qtyNum, 
      cost: costNum,
      total: qtyNum * costNum
    };

    setItemsList([...itemsList, newItem]);
    setCurrentSKU({ itemName: '', qty: '', cost: '' });
    toast.success(`Material Added: ${newItem.itemName}`);
  };

  const totalSkuCount = itemsList.length;
  const totalQty = itemsList.reduce((acc, item) => acc + item.qty, 0);
  const grandTotalCost = itemsList.reduce((acc, item) => acc + item.total, 0);

  const handleConfirmGRN = async () => {
    if (!header.invoiceCode.trim() || header.invoiceCode === 'GENERATING...') return toast.error("Invoice Code is not ready");
    if (!header.vendor.trim()) return toast.error("Vendor/Supplier name is required");
    if (itemsList.length === 0) return toast.error("Please add at least one item before saving");

    setLoading(true);
    const t = toast.loading('Confirming and Saving GRN...');

    const payload = { 
      invoiceCode: header.invoiceCode.trim().toUpperCase(),
      supplier: header.vendor.trim().toUpperCase(), 
      vehicleNumber: header.vehicle.trim().toUpperCase(),
      driverName: header.driverName.trim().toUpperCase(),
      date: header.date,
      items: itemsList.map(item => ({
        itemName: item.itemName,
        qty: item.qty,     
        cost: item.cost    
      }))
    };

    try {
      await axios.post('http://192.168.1.19:5000/api/grn', payload);
      toast.success("GRN Registered Successfully", { id: t });
      if (onRefresh) onRefresh();
      navigate('/inventory');
    } catch (err) {
      console.error("Submission Error Details:", err.response?.data);
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      toast.error(serverMessage || "Failed to save GRN", { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 text-slate-800 animate-in fade-in duration-300">
      
      {/* HEADER CONTROLS */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all text-slate-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Create New GRN</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Operational Stock Entry</p>
          </div>
        </div>

        <button 
          onClick={handleConfirmGRN} 
          disabled={loading || header.invoiceCode === 'GENERATING...'} 
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle size={16} /> {loading ? "Saving..." : "Confirm & Save GRN"}
        </button>
      </div>

      {/* BODY CONTAINER */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: REFERENCE INFO */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
              <div className="p-2 bg-slate-900 text-white rounded-xl"><FileText size={16}/></div>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference Info</h3>
            </div>
            
            <div className="space-y-4">
              {/* readOnly කර ඇති නිසා පරිශීලකයාට වෙනස් කළ නොහැක */}
              <InputField label="Invoice Code (Auto-Generated)" icon={<CreditCard size={14}/>} placeholder="Generating..." value={header.invoiceCode} readOnly={true} onChange={() => {}} />
              <InputField label="Vendor / Supplier" icon={<Truck size={14}/>} placeholder="e.g. Finished Goods Stores" value={header.vendor} onChange={(v) => setHeader({...header, vendor: v})} />
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
                <div className="p-2 bg-slate-900 text-white rounded-xl"><Package size={16}/></div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GR SKU Posting Form</h3>
              </div>

              <form onSubmit={handleAddToList} className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material / Item Description</label>
                  <input className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 uppercase transition-all" placeholder="Select or enter a material" value={currentSKU.itemName} onChange={(e) => setCurrentSKU({...currentSKU, itemName: e.target.value})} />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                  <input type="number" className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" placeholder="Qty" value={currentSKU.qty} onChange={(e) => setCurrentSKU({...currentSKU, qty: e.target.value})} />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cost (LKR)</label>
                  <input type="number" step="0.01" className="w-full mt-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" placeholder="COST" value={currentSKU.cost} onChange={(e) => setCurrentSKU({...currentSKU, cost: e.target.value})} />
                </div>
                <button type="submit" className="col-span-12 mt-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10">
                  <Plus size={16} /> Add item
                </button>
              </form>
            </div>

            {/* LIVE SUMMARY TOTALS */}
            <div className="mt-8 p-5 bg-slate-50 rounded-xl border border-slate-100 flex justify-around text-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKU</p>
                <p className="text-xl font-extrabold text-slate-700 mt-0.5">{totalSkuCount}</p>
              </div>
              <div className="border-l border-slate-200"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Qty</p>
                <p className="text-xl font-extrabold text-slate-700 mt-0.5">{totalQty}</p>
              </div>
              <div className="border-l border-slate-200"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Cost Value</p>
                <p className="text-xl font-extrabold text-blue-600 mt-0.5">{grandTotalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- INPUT FIELD HELPER ---
const InputField = ({ label, icon, placeholder, value, readOnly, onChange }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input 
        className={`w-full pl-11 pr-4 py-2.5 border rounded-xl text-xs font-semibold outline-none transition-all ${readOnly ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-mono' : 'bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-slate-900/5'}`} 
        placeholder={placeholder} 
        value={value} 
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  </div>
);

export default GRNPage;