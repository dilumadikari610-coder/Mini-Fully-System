import React, { useState } from 'react';
import { Settings, Lock, User, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import axios from 'axios'; // ✅ Added Axios for DB connection
import toast from 'react-hot-toast'; // ✅ Added for notifications

const LoginView = () => {
  const { login } = useApp();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const systemColor = "#A47148";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // ✅ CONNECTING TO MONGODB: Requesting the login route in server.js
      const response = await axios.post('http://192.168.1.19:5000/api/users/login', {
        username: credentials.username,
        password: credentials.password
      });

      // ✅ SUCCESS: response.data contains name, role, and uid from the DB
      login(response.data);
      toast.success(`Access Granted: Welcome ${response.data.name}`, {
        style: {
          borderRadius: '15px',
          background: '#334155',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      });

    } catch (err) {
      // ❌ FAILURE: Display error message from server
      const errorMessage = err.response?.data?.message || "Connection Error";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 relative overflow-hidden">
      {/* Background Decorative Icon */}
      <div className="absolute -bottom-10 -right-10 text-slate-200 opacity-20 rotate-12">
        <Wrench size={300} />
      </div>

      <div className="w-full max-w-sm bg-white rounded-[45px] p-8 flex flex-col items-center shadow-2xl relative z-10">
        {/* Animated Brand Icon */}
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md"
          style={{ backgroundColor: systemColor }}
        >
          <Settings size={40} className="text-white animate-spin-slow" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-[0.2em]">Maintenance System </h2>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Error Message Display */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-[10px] text-center font-black uppercase tracking-wider border border-red-100 animate-pulse">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <User size={18} />
            </div>
            <input 
              type="text"
              name="username"
              required
              autoComplete="username"
              value={credentials.username}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full focus:outline-none text-sm shadow-sm transition-all focus:border-[#A47148]"
              style={{ borderColor: credentials.username ? systemColor : '#e2e8f0' }}
              placeholder="Username"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock size={18} />
            </div>
            <input 
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-full focus:outline-none text-sm shadow-sm transition-all focus:border-[#A47148]"
              style={{ borderColor: credentials.password ? systemColor : '#e2e8f0' }}
              placeholder="Password"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full text-white font-black py-4 rounded-full shadow-lg transition-all active:scale-[0.96] uppercase text-[10px] tracking-[0.25em] mt-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: systemColor }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;