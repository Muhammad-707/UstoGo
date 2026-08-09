'use client';

import React from 'react';

/**
 * Shared shell for all /auth pages: the form card centered on a full-bleed backdrop.
 * Pass `image` for a page-specific photo backdrop (login, register/client, register/master);
 * pages without one fall back to the plain decorative gradient.
 */
export function AuthShell({
  children,
  minHeight = '80vh',
  image,
}: {
  children: React.ReactNode;
  minHeight?: string;
  image?: string;
}) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden p-4 sm:p-6 py-12"
      style={{ minHeight }}
    >
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950/40" />
        </>
      ) : (
        <>
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-sky-400/20 dark:bg-sky-500/10 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(rgba(100,116,139,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </>
      )}

      <div className="relative w-full flex justify-center">{children}</div>
    </div>
  );
}
