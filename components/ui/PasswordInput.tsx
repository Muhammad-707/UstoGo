'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/LucideIcons';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', error, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={`${className} pr-11 ${error ? 'border-red-500' : ''}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <Icon name={visible ? 'eyeoff' : 'eye'} size={16} />
      </button>
    </div>
  );
};
