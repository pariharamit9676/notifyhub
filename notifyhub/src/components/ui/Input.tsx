import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', id, ...props }) => {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
          error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;
