import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, CheckCircle, ArrowLeft, Package, 
  Truck, CreditCard, FileText, Trash2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GRNPage = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Header State
  const [header, setHeader] = useState({
    invoiceCode: '',
    docRef: '',
    vehicle: '',
    driverName: '',
    vendor: '', 
    date: new Date().toISOString().split('T')[0]
  });

  // SKU Entry State
  const [currentSKU, setCurrentSKU] = useState({
    itemName: '',
    qty: '',
    cost: '',
  });

  // Grid List State
  const [itemsList, setItemsList] = useState([]);

  const handleAddToList = () => {
    if (!currentSKU.itemName.trim() || !currentSKU.qty || !currentSKU.cost) {
      return toast.error("Please fill all item fields");
    }

    const qtyNum = Number(currentSKU.qty);
    const costNum = Number(currentSKU.cost);

    if (isNaN(qtyNum) || isNaN(costNum) || qtyNum <= 0) {
      return toast.error("Enter valid quantity and cost");
    }

    setItemsList([...itemsList, { 
      itemName: currentSKU.itemName.trim(), 
      qty: qtyNum, 
      cost: costNum,
      id: Date.now() 
    }]);
    
    setCurrentSKU({ itemName: '', qty: '', cost: '' });
  };

  const removeItem = (id) => {
    setItemsList(itemsList.filter(item => item.id !== id));
  };

  const handleConfirmGRN = async () => {
    // Basic validation to prevent 400 errors
    if (itemsList.length === 0) return toast.error("No items in the list");
    if (!header.vendor.trim()) return toast.error("Vendor name is required");
    if (!header.invoiceCode.trim()) return toast.error("Invoice Code is required");

    setLoading(true);
    const t = toast.loading('Confirming GRN...');

    try {
      // ✅ Explicitly Map Payload to Backend Schema
      const payload = { 
        supplier: header.vendor.trim(), 
        invoiceCode: header.invoiceCode.trim(),
        docRef: header.docRef.trim() || "N/A",
        vehicle: header.vehicle.trim(),
        driverName: header.driverName.trim(),
        date: header.date,
        items: itemsList.map(item => ({
          itemName: item.itemName,
          quantity: Number(item.qty),
          cost: Number(item.cost)
        })),
        receivedBy: "Admin" 
      };

      await axios.post('http://192.168.1.19:5000/api/grn', payload);
      
      toast.success("GRN Registered Successfully", { id: t });
      if (onRefresh) onRefresh();
      navigate('/inventory');
    } catch (err) {
      // This catches the specific object shown in image_a1a057.png
      console.error("Submission Error Details:", err.response?.data);
      
      const serverMessage = err.response?.data?.message || err.response?.data?.error;
      
      if (serverMessage?.includes('duplicate key')) {
         toast.error("Error: Invoice Code already exists", { id: t });
      } else {
         toast.error(serverMessage || "Failed to save GRN (Bad Request)", { id: t });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20 selection:bg-black/5 text-black">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-black/5 px-8 py-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-black">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight uppercase">Create New GRN</h1>
            <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">Operational Entry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleConfirmGRN} disabled={loading} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-black/20 hover:bg-zinc-800 transition-all flex items-center gap-2">
            <CheckCircle size={18} /> {loading ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MASTER INFO */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black text-white rounded-xl"><FileText size={18}/></div>
              <h3 className="text-[11px] font-bold text-black uppercase tracking-wider">Reference Info</h3>
            </div>
            
            <div className="space-y-5">
              <InputField label="Invoice Code (Unique)" icon={<CreditCard size={14}/>} value={header.invoiceCode} onChange={(v) => setHeader({...header, invoiceCode: v})} />
              <InputField label="Vendor / Supplier" icon={<Truck size={14}/>} value={header.vendor} onChange={(v) => setHeader({...header, vendor: v})} />
              <InputField label="Vehicle Number" icon={<Truck size={14}/>} value={header.vehicle} onChange={(v) => setHeader({...header, vehicle: v})} />
              <InputField label="Driver Name" icon={<FileText size={14}/>} value={header.driverName} onChange={(v) => setHeader({...header, driverName: v})} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ITEM POSTING */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black text-white rounded-xl"><Package size={18}/></div>
              <h3 className="text-[11px] font-bold text-black uppercase tracking-wider">Post Materials</h3>
            </div>

            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-6">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Item Description</label>
                <input className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-black/5 rounded-2xl text-sm font-normal text-black outline-none focus:border-black transition-all" value={currentSKU.itemName} onChange={(e) => setCurrentSKU({...currentSKU, itemName: e.target.value})} />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Qty</label>
                <input type="number" className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-black/5 rounded-2xl text-sm font-normal text-black outline-none focus:border-black transition-all" value={currentSKU.qty} onChange={(e) => setCurrentSKU({...currentSKU, qty: e.target.value})} />
              </div>
              <div className="col-span-3">
                <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">Cost</label>
                <input type="number" className="w-full mt-2 px-5 py-3.5 bg-slate-50 border border-black/5 rounded-2xl text-sm font-normal text-black outline-none focus:border-black transition-all" value={currentSKU.cost} onChange={(e) => setCurrentSKU({...currentSKU, cost: e.target.value})} />
              </div>
              <button onClick={handleAddToList} className="col-span-12 mt-2 py-4 bg-zinc-100 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> Append to List
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-black/5">
                  <th className="px-6 py-4 text-[10px] font-bold text-black uppercase tracking-widest">Item Detail</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-black uppercase tracking-widest text-center">Qty</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-black uppercase tracking-widest text-right">Total</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {itemsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-medium text-black uppercase">{item.itemName}</td>
                    <td className="px-6 py-4 text-center font-bold text-black">{item.qty}</td>
                    <td className="px-6 py-4 text-right font-bold text-black">{(item.qty * item.cost).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeItem(item.id)} className="p-2 text-black/20 hover:text-red-500 transition-all"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, icon, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">{icon}</div>
      <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-black/5 rounded-2xl text-sm font-normal text-black outline-none focus:border-black transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </div>
);

export default GRNPage;