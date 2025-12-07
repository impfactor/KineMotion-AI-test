import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-3 px-6 rounded-lg font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-cyan-700 shadow-cyan-500/20",
    secondary: "bg-secondary text-white hover:bg-emerald-700 shadow-emerald-500/20",
    danger: "bg-danger text-white hover:bg-red-700 shadow-red-500/20",
    ghost: "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100 shadow-none border border-slate-300",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};