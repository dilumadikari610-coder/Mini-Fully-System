import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Layers, UserCheck, ShieldAlert, FileCode, Search, ArrowLeft, ToggleLeft } from 'lucide-react';

const WorkflowConfiguration = () => {
  // --- STATES ---
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  
  // 💡 NEW STATE: දැනට පෙන්වන්නේ ලිස්ට් එකද (list) නැත්නම් ක්‍රියේට් ෆෝම් එකද (create) කියා තීරණය කිරීමට
  const [viewMode, setViewMode] = useState('list'); 
  
  // 💡 NEW STATE: සර්ච් බාර් එක සඳහා
  const [searchQuery, setSearchQuery] = useState('');

  // Form Main Inputs
  const [workflowCode, setWorkflowCode] = useState('');
  const [description, setDescription] = useState('');
  const [permission, setPermission] = useState('NEED_ALL');

  // Approver Row Inputs
  const [selectedUser, setSelectedUser] = useState('');
  const [orderLevel, setOrderLevel] = useState(1);

  // Dynamic Grid/Table Array
  const [currentApprovers, setCurrentApprovers] = useState([]);

  // --- FETCH INITIAL DATA ---
  const fetchData = async () => {
    try {
      const resUsers = await axios.get('http://192.168.1.19:5000/api/users');
      setUsersList(resUsers.data || []);

      const resTemplates = await axios.get('http://192.168.1.19:5000/api/workflow/templates');
      setSavedTemplates(resTemplates.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync structural configuration metrics");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ➕ APPEND APPROVER ROW
  const handleAddApproverRow = () => {
    if (!selectedUser) return toast.error("Please select an employee first");

    const userObj = usersList.find(u => u._id === selectedUser);
    if (!userObj) return;

    if (currentApprovers.some(app => app.user === selectedUser)) {
      return toast.error("This employee is already in the approval sequence matrix");
    }

    const newApproverRow = {
      user: userObj._id,
      employeeName: userObj.username,
      designation: userObj.userType || 'Staff',
      email: `${userObj.username.toLowerCase()}@elisha.lk`,
      orderLevel: Number(orderLevel)
    };

    const updatedList = [...currentApprovers, newApproverRow].sort((a, b) => a.orderLevel - b.orderLevel);
    setCurrentApprovers(updatedList);
    setSelectedUser('');
  };

  // 🗑️ REMOVE APPROVER ROW
  const handleRemoveApproverRow = (userId) => {
    setCurrentApprovers(currentApprovers.filter(item => item.user !== userId));
  };

  // --- 💾 SAVE WORKFLOW TEMPLATE ---
  const handleSaveWorkflowTemplate = async (e) => {
    e.preventDefault();
    if (!workflowCode.trim()) return toast.error("Workflow Code is required");
    if (!description.trim()) return toast.error("Description context is required");
    if (currentApprovers.length === 0) return toast.error("Please insert at least one authorization level row");

    setLoading(true);
    const t = toast.loading("Registering new workflow routing structure...");

    const payload = {
      code: workflowCode.trim().toUpperCase(),
      description: description.trim(),
      permission,
      approvers: currentApprovers
    };

    try {
      await axios.post('http://192.168.1.19:5000/api/workflow/templates', payload);
      toast.success("Workflow Configuration Matrix Saved!", { id: t });

      setWorkflowCode('');
      setDescription('');
      setPermission('NEED_ALL');
      setCurrentApprovers([]);
      
      // සේව් වුණාට පස්සේ නැවත ලිස්ට් එකටම හරවා යැවීම
      setViewMode('list');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to compile template architecture", { id: t });
    } finally {
      setLoading(false);
    }
  };

  // --- 🗑️ DELETE TEMPLATE ---
  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to completely purge this workflow template?")) return;
    try {
      await axios.delete(`http://192.168.1.19:5000/api/workflow/templates/${id}`);
      toast.success("Template matrix removed from core configuration");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  // 💡 FILTERING LOGIC: සර්ච් බාර් එකෙන් කෝඩ් එක හෝ විස්තරය අනුව Filter කිරීම
  const filteredTemplates = savedTemplates.filter(tmpl => 
    tmpl.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tmpl.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 antialiased text-[#000000] bg-[#EFEFEF] min-h-screen flex flex-col items-center justify-start w-full select-none" style={{ fontFamily: 'Segoe UI, Open Sans, Tahoma, Geneva, Verdana, sans-serif', fontWeight: 'normal' }}>
      
      {/* PAGE HEADER */}
      <div className="w-full max-w-5xl mb-8 border-b border-slate-300 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl text-[#000000] tracking-tight flex items-center gap-2" style={{ fontWeight: 'normal' }}>
            <Layers size={22} className="text-[#000000]" /> Workflow Template Configuration
          </h1>
          <p className="text-xs text-slate-500 tracking-widest mt-1 uppercase" style={{ fontWeight: 'normal' }}>Manage authorization tiers and hierarchical approval configurations</p>
        </div>

        {/* VIEW TOGGLE ACTION BUTTON */}
        {viewMode === 'list' ? (
          <button
            onClick={() => setViewMode('create')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5"
            style={{ fontWeight: 'normal' }}
          >
            <Plus size={14} /> Create New Template
          </button>
        ) : (
          <button
            onClick={() => setViewMode('list')}
            className="px-4 py-2 bg-white border border-slate-300 text-[#000000] rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-1.5"
            style={{ fontWeight: 'normal' }}
          >
            <ArrowLeft size={14} /> Back To Active List
          </button>
        )}
      </div>

      {/* ========================================================== */}
      {/* 💡 VIEW 1: ACTIVE WORKFLOWS LIST TABLE (පිටුවට ආ සැණින් පෙනෙන කොටස) */}
      {/* ========================================================== */}
      {viewMode === 'list' && (
        <div className="w-full max-w-5xl space-y-4">
          
          {/* SEARCH BAR INPUT CONTROLLER */}
          <div className="w-full bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex items-center gap-3">
            <Search size={16} className="text-slate-400 ml-2" />
            <input 
              type="text"
              placeholder="Search by workflow code or description context..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs text-[#000000] outline-none bg-transparent placeholder-slate-400"
              style={{ fontWeight: 'normal' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-[#000000] uppercase pr-2 font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* ACTIVE REGISTRY MASTER DATA TABLE */}
          <div className="w-full bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm text-left">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] text-[#000000] uppercase tracking-wider" style={{ fontWeight: 'normal' }}>
                    <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Workflow Code</th>
                    <th className="px-6 py-3.5 border-r border-slate-100" style={{ fontWeight: 'normal' }}>Description Context</th>
                    <th className="px-6 py-3.5 border-r border-slate-100 w-44" style={{ fontWeight: 'normal' }}>Validation Rule</th>
                    <th className="px-6 py-3.5 border-r border-slate-100 text-center w-28" style={{ fontWeight: 'normal' }}>Active Tiers</th>
                    <th className="px-6 py-3.5 text-center w-20" style={{ fontWeight: 'normal' }}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-[#000000] bg-white uppercase" style={{ fontWeight: 'normal' }}>
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((tmpl) => (
                      <tr key={tmpl._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono text-blue-600 border-r border-slate-100">
                          {tmpl.code}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-100 text-slate-700 normal-case">
                          {tmpl.description}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-100 text-[10px] text-slate-600">
                          {tmpl.permission === 'NEED_ALL' ? 'Chain Order Validation' : 'Single User Access'}
                        </td>
                        <td className="px-6 py-4 text-center border-r border-slate-100 font-mono text-slate-600 bg-slate-50/20">
                          {tmpl.approvers?.length || 0} Level(s)
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDeleteTemplate(tmpl._id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-400 text-xs uppercase tracking-wider bg-slate-50/30" style={{ fontWeight: 'normal' }}>
                        No matching master workflow sequences discovered inside registry database
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 💡 VIEW 2: CREATE TEMPLATE FORM LAYOUT (බටන් එක එබූ පසු පෙනෙන කොටස) */}
      {/* ========================================================== */}
      {viewMode === 'create' && (
        <div className="w-full max-w-5xl grid grid-cols-12 gap-6 items-start">
          
          {/* LEFT CARD: WORKFLOW MAIN META INPUTS */}
          <div className="col-span-12 md:col-span-4 bg-white border border-slate-200 p-6 rounded-[20px] shadow-sm space-y-4 text-left">
            <h2 className="text-sm text-[#000000] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ fontWeight: 'normal' }}>
              <FileCode size={16} className="text-[#000000]" /> Template Parameters
            </h2>

            <div className="space-y-1">
              <label className="text-[10px] text-[#000000] uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Workflow Code</label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase outline-none focus:border-slate-400 focus:bg-white text-[#000000] font-mono"
                placeholder="e.g. PURCHASING_ELISHA"
                value={workflowCode}
                onChange={e => setWorkflowCode(e.target.value)}
                style={{ fontWeight: 'normal' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#000000] uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Description / Hierarchy Context</label>
              <textarea 
                rows="3"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-400 focus:bg-white text-[#000000]"
                placeholder="e.g. Approval Sequence By Dushmantha, Imasha..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ fontWeight: 'normal' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[#000000] uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Execution Permission Level</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-400 focus:bg-white text-[#000000] cursor-pointer uppercase"
                value={permission}
                onChange={e => setPermission(e.target.value)}
                style={{ fontWeight: 'normal' }}
              >
                <option value="NEED_ALL">NEED ALL (Sequence-wise Chain)</option>
                <option value="ANY_ONE">ANY ONE (Single Peer Authorization)</option>
              </select>
            </div>
          </div>

          {/* RIGHT CARD: USER GRID CONFIGURATION ROW & MATRIX */}
          <div className="col-span-12 md:col-span-8 bg-white border border-slate-200 p-6 rounded-[20px] shadow-sm space-y-6 text-left">
            <h2 className="text-sm text-[#000000] uppercase tracking-wider flex items-center gap-1.5" style={{ fontWeight: 'normal' }}>
              <UserCheck size={16} className="text-[#000000]" /> User Configuration Mapping
            </h2>

            {/* DYNAMIC FORM ROW INPUT */}
            <div className="grid grid-cols-12 gap-3 bg-slate-50 border border-slate-300 p-4 rounded-xl items-end">
              <div className="col-span-12 md:col-span-6 space-y-1">
                <label className="text-[9px] text-[#000000] uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Select Employee</label>
                <select
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-[#000000] outline-none cursor-pointer uppercase"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  style={{ fontWeight: 'normal' }}
                >
                  <option value="">-- Choose User Profile --</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>{u.username} ({u.userType || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 md:col-span-3 space-y-1">
                <label className="text-[9px] text-[#000000] uppercase tracking-wider block" style={{ fontWeight: 'normal' }}>Routing Level</label>
                <select
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-[#000000] outline-none cursor-pointer font-mono"
                  value={orderLevel}
                  onChange={e => setOrderLevel(Number(e.target.value))}
                  style={{ fontWeight: 'normal' }}
                >
                  <option value="1">Level - 1</option>
                  <option value="2">Level - 2</option>
                  <option value="3">Level - 3</option>
                  <option value="4">Level - 4</option>
                </select>
              </div>

              <div className="col-span-6 md:col-span-3">
                <button
                  type="button"
                  onClick={handleAddApproverRow}
                  className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-1"
                  style={{ fontWeight: 'normal' }}
                >
                  <Plus size={12} /> Append Row
                </button>
              </div>
            </div>

            {/* IN-CONFIG TABLE PREVIEW */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[9px] text-[#000000] uppercase tracking-wider" style={{ fontWeight: 'normal' }}>
                    <th className="p-2.5 pl-4 w-20" style={{ fontWeight: 'normal' }}>Order</th>
                    <th className="p-2.5" style={{ fontWeight: 'normal' }}>Employee Name</th>
                    <th className="p-2.5" style={{ fontWeight: 'normal' }}>Designation</th>
                    <th className="p-2.5" style={{ fontWeight: 'normal' }}>Email @</th>
                    <th className="p-2.5 text-center w-16" style={{ fontWeight: 'normal' }}>Purge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-[#000000] bg-white uppercase" style={{ fontWeight: 'normal' }}>
                  {currentApprovers.length > 0 ? (
                    currentApprovers.map((item) => (
                      <tr key={item.user} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 pl-4 font-mono text-blue-600">{item.orderLevel}</td>
                        <td className="p-2.5 text-[#000000]">{item.employeeName}</td>
                        <td className="p-2.5 text-[#000000] text-[10px]">{item.designation}</td>
                        <td className="p-2.5 text-[#000000] font-mono text-[10px] lowercase">{item.email}</td>
                        <td className="p-2.5 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveApproverRow(item.user)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontWeight: 'normal' }}>
                        No sequence levels appended yet. Choose mapping parameters above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* GLOBAL CARD ACTION BUTTON */}
            <button
              type="button"
              onClick={handleSaveWorkflowTemplate}
              disabled={loading || currentApprovers.length === 0}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              style={{ fontWeight: 'normal' }}
            >
              <Save size={13} /> Compile & Save Complete Workflow Matrix
            </button>
          </div>

        </div>
      )}

      {/* FOOTER NOTICE METRICS */}
      <div className="w-full max-w-5xl mt-6 flex items-center gap-1.5 px-3 opacity-50 text-slate-500 text-[10px] uppercase tracking-wide" style={{ fontWeight: 'normal' }}>
        <ShieldAlert size={12} /> Core Enterprise Approval Routing Configuration Engine | MMS CORE
      </div>
    </div>
  );
};

export default WorkflowConfiguration;