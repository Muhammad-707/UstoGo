'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({ className, error, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        aria-invalid={error || undefined}
        className={cn('pr-11', className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-transparent dark:hover:bg-transparent"
      >
        <Icon name={visible ? 'eyeoff' : 'eye'} size={16} />
      </Button>
    </div>
  );
};
