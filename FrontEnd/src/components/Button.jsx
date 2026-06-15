import React from 'react';

/**
 * Reusable Button Component
 * @param {Object} props
 * @param {string} variant - 'primary', 'secondary', 'danger', 'ghost'
 * @param {boolean} loading - Shows a spinner if true
 * @param {React.ElementType} icon - A Lucide icon component
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  icon: Icon, 
  disabled = false, 
  loading = false,
  type = "button" 
}) => {
  
  // Your system brand color
  const systemColor = "#A47148";

  // Base styles for all buttons
  const baseStyles = "flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

  // Variant specific styles
  const variants = {
    primary: "text-white shadow-md hover:brightness-110",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
  };

  // Inline style for the primary brand color to ensure it matches your #A47148 exactly
  const customStyle = variant === 'primary' ? { backgroundColor: systemColor } : {};

  return (
    <button 
      type={type}
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      disabled={disabled || loading}
      style={customStyle}
    >
      {loading ? (
        // Loading Spinner
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        // Icon (if provided)
        Icon && <Icon size={18} strokeWidth={2.5} />
      )}
      
      {/* Button Text */}
      <span className="uppercase tracking-widest">{children}</span>
    </button>
  );
};

export default Button;