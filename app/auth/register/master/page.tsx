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
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell minHeight="85vh" image="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=2400&q=90">
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
              <Label htmlFor="master-full-name">{t('fullNameLabel')}</Label>
              <Input
                id="master-full-name"
                type="text"
                placeholder={t('fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={!!fieldErrors.fullName}
                required
              />
              {fieldErrors.fullName && <p className="text-red-500 text-xs">{tv(fieldErrors.fullName)}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="master-specialty">{t('specialtyLabel')}</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger id="master-specialty" className="w-full font-bold">
                  <SelectValue placeholder={t('specialtyLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="master-email">{t('emailLabel')}</Label>
              <Input
                id="master-email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
                required
              />
              {fieldErrors.email && <p className="text-red-500 text-xs">{tv(fieldErrors.email)}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="master-password">{t('passwordLabel')}</Label>
              <PasswordInput
                id="master-password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!fieldErrors.password}
                required
              />
              {fieldErrors.password && <p className="text-red-500 text-xs">{tv(fieldErrors.password)}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="master-phone">{t('phoneWhatsappLabel')}</Label>
              <Input
                id="master-phone"
                type="tel"
                placeholder={t('phoneWhatsappPlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!fieldErrors.phone}
                required
              />
              {fieldErrors.phone && <p className="text-red-500 text-xs">{tv(fieldErrors.phone)}</p>}
              <p className="text-[10px] text-slate-400">{t('phoneWhatsappHint')}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="master-city">{t('cityLabel')}</Label>
              <Select value={cityId} onValueChange={setCityId} required>
                <SelectTrigger id="master-city" className="w-full font-bold" aria-invalid={!!fieldErrors.cityId}>
                  <SelectValue placeholder={t('cityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="master-rate">{t('hourlyRateLabel')}</Label>
              <Input id="master-rate" type="number" placeholder="45" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="master-experience">{t('experienceLabel')}</Label>
              <Input
                id="master-experience"
                type="number"
                placeholder="10"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('uploadLabel')}</Label>
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center text-xs text-slate-400">
              {t('dragDropText')} <span className="text-blue-600 font-bold">{t('browse')}</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            variant="brand"
            size="xl"
            disabled={submitting}
            className="w-full bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 hover:shadow-amber-600/30"
          >
            {submitting ? t('submitting') : t('submitButton')}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t('alreadyMaster')} <Link href="/auth/login" className="font-bold text-amber-500 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </AuthShell>
  );
}
