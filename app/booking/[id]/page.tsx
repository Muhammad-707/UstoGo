'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/icons/LucideIcons';
import { MOCK_BOOKINGS } from '@/lib/mockData';

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId) || MOCK_BOOKINGS[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-mono font-extrabold">
              {booking.bookingCode}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
              {booking.status}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {booking.serviceName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">Scheduled for {booking.scheduledDate} ({booking.scheduledTime})</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/messages?master=${booking.masterId}`}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2"
          >
            <Icon name="MessageSquare" size={16} />
            <span>Chat with Master</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Timeline Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Stage Progress Timeline */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="Clock" size={20} className="text-blue-600 dark:text-sky-400" />
              Live Stage Progress Timeline
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-8">
              {booking.timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      item.completed
                        ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        item.completed
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.stage}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Info Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <img src={booking.masterAvatar} alt={booking.masterName} className="w-14 h-14 rounded-2xl object-cover" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{booking.masterName}</h4>
                <p className="text-xs text-slate-500">{booking.categoryName}</p>
                <span className="text-xs font-bold text-blue-600 dark:text-sky-400">{booking.masterPhone}</span>
              </div>
            </div>
            <Link
              href={`/master/${booking.masterId}`}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Profile
            </Link>
          </div>

        </div>

        {/* Receipt Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment & Address</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-bold text-slate-900 dark:text-white">${booking.totalPrice - 20}.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Platform Protection</span>
                <span className="font-bold text-slate-900 dark:text-white">$20.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Total Paid</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${booking.totalPrice}.00</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">Service Address:</span>
              <p className="text-slate-500">{booking.address}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
