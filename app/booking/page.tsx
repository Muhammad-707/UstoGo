'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { CATEGORIES, MASTERS } from '@/lib/mockData';

export default function BookingWizardPage() {
  const t = useTranslations('booking');
  const tm = useTranslations('mockData');
  const searchParams = useSearchParams();
  const preselectedMasterId = searchParams.get('master');

  const [step, setStep] = useState<number>(1);
  const [selectedMaster, setSelectedMaster] = useState(
    MASTERS.find((m) => m.id === preselectedMasterId) || MASTERS[0]
  );
  const [selectedService, setSelectedService] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState('2026-10-15');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [address, setAddress] = useState('742 Evergreen Terrace, Apt 4B, New York, NY');
  const [jobNotes, setJobNotes] = useState('Please bring 200A breaker switches.');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM',
  ];

  const estimatedHours = 2;
  const totalPrice = selectedMaster.hourlyRate * estimatedHours;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Page Title */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-xs font-bold uppercase tracking-wider">
          {t('instantCheckout')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('pageTitle')}
        </h1>
      </div>

      {/* Step Progress Bar */}
      {!bookingConfirmed && (
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 px-4">
          {[
            { num: 1, label: t('stepService') },
            { num: 2, label: t('stepSchedule') },
            { num: 3, label: t('stepLocation') },
            { num: 4, label: t('stepConfirmation') },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation View Screen */}
      {bookingConfirmed ? (
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Icon name="CheckCircle2" size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('confirmedTitle')}</h2>
            <p className="text-sm text-slate-500">{t('confirmedDesc')}</p>
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 font-mono text-xs font-extrabold">
              {t('bookingRef')}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl text-left text-xs space-y-3 border border-slate-200 dark:border-slate-700 max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-slate-400">{t('master')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedMaster.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('scheduledDate')}</span>
              <span className="font-bold text-slate-900 dark:text-white">{date} ({timeSlot})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{t('totalPrice')}</span>
              <span className="font-extrabold text-blue-600 dark:text-sky-400">${totalPrice}.00</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link
              href="/booking/b-101"
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
            >
              {t('trackBooking')}
            </Link>
            <Link
              href="/home"
              className="px-8 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('backToHome')}
            </Link>
          </div>
        </div>
      ) : (
        /* Booking Step Form Wrapper */
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
          
          {/* STEP 1: Select Master & Service */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step1Heading')}</h3>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('chosenCraftsman')}</label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <img src={selectedMaster.avatar} alt={selectedMaster.name} className="w-14 h-14 rounded-2xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{selectedMaster.name}</h4>
                    <p className="text-xs text-blue-600 dark:text-sky-400 font-semibold">{tm(`categories.${selectedMaster.categoryId}.name`)}</p>
                    <span className="text-xs text-slate-500 font-bold">${selectedMaster.hourlyRate}/hr</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('jobDescription')}</label>
                <textarea
                  rows={3}
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder={t('jobDescriptionPlaceholder')}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
              >
                {t('continueToSchedule')}
              </button>
            </div>
          )}

          {/* STEP 2: Schedule Date & Time */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step2Heading')}</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('appointmentDate')}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('availableTimeSlots')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTimeSlot(slot)}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition ${
                        timeSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('continueToAddress')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Address */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step3Heading')}</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('fullAddress')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-300 dark:border-slate-700">
                {t('mapPlaceholder')}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
                >
                  {t('reviewOrder')}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Summary & Confirm */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('step4Heading')}</h3>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">{t('craftsman')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedMaster.name} (${selectedMaster.hourlyRate}/hr)</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">{t('scheduledTime')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{date} ({timeSlot})</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400">{t('estimatedDuration')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{t('hoursUnit', { count: estimatedHours })}</span>
                </div>
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">{t('totalAmount')}</span>
                  <span className="font-extrabold text-blue-600 dark:text-sky-400">${totalPrice}.00</span>
                </div>
              </div>

              <button
                onClick={() => setBookingConfirmed(true)}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl transition btn-ripple"
              >
                {t('confirmAndPay', { amount: totalPrice })}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
