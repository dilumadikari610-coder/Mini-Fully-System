import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Search, Package, X, CheckCircle } from 'lucide-react';

const MaterialsRegistry = () => {
  // --- STATES ---
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    costPrice: '0.00'
  });

  // Load items on mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // ✅ FIXED: පරණ api/inventory වෙනුවට නිවැරදි /api/materials GET End-point එක දමා ඇත
  const fetchMaterials = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/materials');
      setMaterials(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch materials from server:", err);
      setMaterials([]); // Error එකක් ආවොත් හිස් ලිස්ට් එකක් පෙන්වයි
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED: පරණ api/inventory වෙනුවට නිවැරදි /api/materials POST End-point එක දමා ඇත
  const handleRegisterMaterial = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return toast.error("Material Code is strictly required");
    if (!formData.name.trim()) return toast.error("Material Name is strictly required");

    setLoading(true);
    try {
      await axios.post('http://192.168.1.19:5000/api/materials', {
        code: formData.code.trim().toUpperCase(),
        itemName: formData.name.trim(),
        description: formData.description.trim(),
        cost: Number(formData.costPrice)
      });

      toast.success("Material Registered Successfully!");
      setIsModalOpen(false);
      
      // Reset Form State Safely
      setFormData({ code: '', name: '', description: '', costPrice: '0.00' });
      fetchMaterials(); // අලුත් දත්ත එකතු වූ පසු ලිස්ට් එක refresh කරයි
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to register material";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(item => 
    item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased p-6 text-slate-700 animate-in fade-in duration-300">
      
      {/* 1. TOP BAR CONTROL */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Materials Registry</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Master listing of internal items, garments components and assets</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search by parameters (Code, Name)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all"
            />
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={15} /> Add +
          </button>
        </div>
      </div>

      {/* 2. REGISTRY DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-500 text-white text-xs font-semibold tracking-wide uppercase border-b border-slate-600">
                <th className="py-2.5 px-4 text-slate-100 w-1/4">Material Code</th>
                <th className="py-2.5 px-4 text-slate-100 w-1/4">Material Name</th>
                <th className="py-2.5 px-4 text-slate-100">Description</th>
                <th className="py-2.5 px-4 text-right text-slate-100 w-36">Cost Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-600 bg-white">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">{item.itemName}</td>
                    <td className="py-2.5 px-4 text-slate-500 truncate max-w-xs">{item.description || item.itemName}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 font-bold">{(item.cost || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400 uppercase text-[10px] font-bold tracking-widest bg-slate-50/10">
                    No matching materials registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. UPDATED MODAL POPUP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Register New Material</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleRegisterMaterial} className="p-5 space-y-4">
              
              {/* Row 1: Code & Name side-by-side */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Material Code</label>
                  <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="e.g. 2323213" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all uppercase" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Material Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. ssdsd" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all" />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="e.g. ssdsd" rows={3} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all resize-none" />
              </div>

              {/* Row 3: Cost Price Only */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Cost Price (LKR)</label>
                <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all" />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="bg-[#16a34a] hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors">
                  <CheckCircle size={14} /> {loading ? "Saving..." : "Register Item"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// 💡 404 Error එක සදහටම නැති කිරීම සඳහා Component එක නිවැරදිව Export කර ඇත
export default MaterialsRegistry;