'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/LucideIcons';
import { MASTERS } from '@/lib/mockData';

export default function ReviewsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const allReviews = MASTERS.flatMap((m) => m.reviews);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header & Rating Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            Verified Experiences
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Customer Reviews & Feedback</h1>
          <p className="text-xs text-slate-500">Authentic reviews from verified UstoGo bookings.</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">4.95</span>
            <div className="flex items-center gap-1 text-amber-500 justify-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Icon key={i} name="Star" size={16} className="fill-amber-400" />
              ))}
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">Based on 38,400+ reviews</span>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
          >
            Write a Review
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allReviews.map((rev) => (
          <div key={rev.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={rev.clientAvatar} alt={rev.clientName} className="w-12 h-12 rounded-2xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rev.clientName}</h4>
                  <span className="text-[11px] text-slate-400">{rev.date} • {rev.serviceTitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                <Icon name="Star" size={14} className="fill-amber-400" />
                <span>{rev.rating}.0</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>

            {rev.craftsmanReply && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-800/80 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <span className="font-bold text-blue-600 dark:text-sky-400">Craftsman Response:</span>
                <p>{rev.craftsmanReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Write Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Leave a Review</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Icon name="X" size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Rating</label>
              <div className="flex gap-2 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon key={s} name="Star" size={24} className="fill-amber-400 cursor-pointer hover:scale-110 transition" />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Review Comments</label>
              <textarea rows={4} placeholder="Describe your experience..." className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
