'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { citiesApi, categoriesApi, masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { City, Category } from '@/lib/api/types';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validateEmail, validateName, validatePassword, validatePhone, normalizePhone, type ValidationErrorKey } from '@/lib/validation';

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => (c.isLeaf ? [c] : flattenCategories(c.children ?? [])));
}

type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'phone' | 'cityId', ValidationErrorKey>>;

export default function RegisterMasterPage() {
  const t = useTranslations('authRegisterMaster');
  const tv = useTranslations('validation');
  const router = useRouter();
  const { registerMaster } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => setCities([]));
    categoriesApi.tree().then((cats) => {
      const leaves = flattenCategories(cats);
      setCategories(leaves);
      if (leaves.length > 0) setSpecialty((prev) => prev || leaves[0].id);
    }).catch(() => setCategories([]));
  }, []);

  const validate = (): { firstName: string; lastName: string; normalizedPhone: string } | null => {
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.join(' ');
    const normalizedPhone = normalizePhone(phone);
    const errors: FieldErrors = {};

    const firstNameErr = validateName(firstName ?? '');
    const lastNameErr = validateName(lastName);
    if (firstNameErr || lastNameErr) errors.fullName = firstNameErr ?? lastNameErr!;

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    const phoneErr = validatePhone(normalizedPhone);
    if (phoneErr) errors.phone = phoneErr;

    if (!cityId) errors.cityId = 'required';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return null;
    return { firstName, lastName, normalizedPhone };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const valid = validate();
    if (!valid) return;
    setSubmitting(true);
    try {
      await registerMaster({
        email,
        password,
        firstName: valid.firstName,
        lastName: valid.lastName,
        phone: valid.normalizedPhone,
        cityId,
        displayName: fullName.trim(),
        timezone: 'Asia/Dushanbe',
        yearsOfExperience: experienceYears ? Number(experienceYears) : undefined,
      });
      if (specialty) {
        await masterCabinetApi.attachCategory(specialty).catch(() => {});
      }
      await masterCabinetApi.submit().catch(() => {});
      router.push('/dashboard/master');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-lg shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase">
            {t('joinEliteNetwork')}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('fullNameLabel')}</label>
              <input
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                required
              />
              {fieldErrors.fullName && <p className="text-red-500 text-xs">{tv(fieldErrors.fullName)}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('specialtyLabel')}</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('emailLabel')}</label>
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs ${fieldErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                required
              />
              {fieldErrors.email && <p className="text-red-500 text-xs">{tv(fieldErrors.email)}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('passwordLabel')}</label>
              <PasswordInput
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                error={!!fieldErrors.password}
                required
              />
              {fieldErrors.password && <p className="text-red-500 text-xs">{tv(fieldErrors.password)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('phoneLabel')}</label>
              <input
                type="tel"
                placeholder={t('phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs ${fieldErrors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                required
              />
              {fieldErrors.phone && <p className="text-red-500 text-xs">{tv(fieldErrors.phone)}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('cityLabel')}</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className={`w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold ${fieldErrors.cityId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                required
              >
                <option value="" disabled>{t('cityPlaceholder')}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('hourlyRateLabel')}</label>
              <input type="number" placeholder="45" className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('experienceLabel')}</label>
              <input
                type="number"
                placeholder="10"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('uploadLabel')}</label>
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-400">
              {t('dragDropText')} <span className="text-blue-600 font-bold">{t('browse')}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg btn-ripple"
          >
            {submitting ? t('submitting') : t('submitButton')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t('alreadyMaster')} <Link href="/auth/login" className="font-bold text-amber-500 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </div>
  );
}
