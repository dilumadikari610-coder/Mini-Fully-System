import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search, Truck, User, Phone, MapPin, Layers } from 'lucide-react';

const SupplierRegister = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    contactPerson: '', 
    phone: '', 
    address: '' 
  });

  useEffect(() => { 
    fetchSuppliers(); 
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('http://192.168.1.19:5000/api/suppliers');
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Error loading suppliers", err); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Supplier Name is required");

    try {
      await axios.post('http://192.168.1.19:5000/api/suppliers', formData);
      toast.success("Supplier Registered Successfully!");
      setFormData({ name: '', contactPerson: '', phone: '', address: '' });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await axios.delete(`http://192.168.1.19:5000/api/suppliers/${id}`);
      toast.success("Supplier Deleted");
      fetchSuppliers();
    } catch (err) { 
      toast.error("Delete failed"); 
    }
  };

  const filteredSuppliers = suppliers.filter(sup => 
    sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.supplierId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased pb-20 text-slate-700 p-6 animate-in fade-in duration-300">
      
      {/* 1. TOP HEADER WITH TOTAL COUNTER */}
      <div className="mb-6 flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Truck size={22} className="text-slate-600" /> Supplier Registration
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Register and Manage Supply Vendors Pipeline</p>
        </div>
        <div className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-sm">
          Active Vendors: {filteredSuppliers.length}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* 2. LEFT COLUMN: REGISTRATION INPUT FORM CARD */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-xl">
                <Plus size={15}/>
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Add New Supplier</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Supplier Name */}
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Company Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Truck size={14}/></div>
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-400"
                    placeholder="e.g. SERTI TEXTILES"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Contact Person</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={14}/></div>
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-400"
                    placeholder="e.g. MR. PERERA"
                    value={formData.contactPerson}
                    onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={14}/></div>
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="07XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-1 block">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Business Address</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><MapPin size={14}/></div>
                  <input 
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all uppercase placeholder:text-slate-400"
                    placeholder="COLOMBO, SRI LANKA"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full mt-2 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/5"
              >
                <Plus size={15} /> Save Vendor Entry
              </button>
            </form>
          </div>
        </div>

        {/* 3. RIGHT COLUMN: MODERN LIVE SEARCH REGISTRY TABLE */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            
            {/* Search Toolbar */}
            <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Registered Vendor Database</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                  placeholder="Filter by vendor name or code..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 text-[10px] font-bold tracking-wide uppercase border-b border-slate-200">
                    <th className="py-3 px-5 text-center w-24">Vendor ID</th>
                    <th className="py-3 px-5">Company Name</th>
                    <th className="py-3 px-5">Contact Person</th>
                    <th className="py-3 px-5">Contact Number</th>
                    <th className="py-3 px-5">Address / Region</th>
                    <th className="py-3 px-4 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600 bg-white">
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((sup, index) => (
                      <tr key={sup._id || index} className="hover:bg-slate-50/70 transition-colors uppercase">
                        <td className="py-3.5 px-5 font-mono font-bold text-blue-600 text-center">{sup.supplierId}</td>
                        <td className="py-3.5 px-5 text-slate-800 font-bold tracking-tight">{sup.name}</td>
                        <td className="py-3.5 px-5 text-slate-600 font-semibold">{sup.contactPerson || '---'}</td>
                        <td className="py-3.5 px-5 font-mono text-slate-500 font-bold tracking-normal">{sup.phone || '---'}</td>
                        <td className="py-3.5 px-5 text-slate-400 max-w-xs truncate">{sup.address || '---'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={() => handleDelete(sup._id)} 
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Delete Supplier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-white">
                        No registered suppliers match your search criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SupplierRegister;