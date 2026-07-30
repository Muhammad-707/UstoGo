'use client';

import React, { useState } from 'react';

export default function FAQPage() {
  const faqs = [
    { q: 'How does UstoGo verify master craftsmen?', a: 'Every applicant undergoes mandatory state license checks, identity verification, 10-year criminal background screening, and past client reference audits.' },
    { q: 'When is my payment charged?', a: 'Payment is pre-authorized when you book, but funds are held securely in escrow and released to the master only after you sign off on job completion.' },
    { q: 'What if I need to cancel or reschedule?', a: 'You can reschedule or cancel free of charge up to 2 hours before the scheduled appointment time directly from your Client Dashboard.' },
    { q: 'Is there a guarantee on the work performed?', a: 'Yes! All services booked on UstoGo are covered by our $1,000,000 UstoGo Protection & Satisfaction Guarantee.' },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-2 shadow-sm">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full text-left font-bold text-slate-900 dark:text-white text-base flex justify-between items-center"
            >
              <span>{faq.q}</span>
              <span className="text-blue-600 font-extrabold">{openIdx === idx ? '−' : '+'}</span>
            </button>
            {openIdx === idx && (
              <p className="text-xs text-slate-500 leading-relaxed pt-2 animate-fade-in">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
