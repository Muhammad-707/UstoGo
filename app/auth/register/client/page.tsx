'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { citiesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { City } from '@/lib/api/types';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validateEmail, validateName, validatePassword, validatePhone, normalizePhone, type ValidationErrorKey } from '@/lib/validation';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FieldErrors = Partial<Record<'fullName' | 'email' | 'password' | 'phone' | 'cityId', ValidationErrorKey>>;

export default function RegisterClientPage() {
  const t = useTranslations('authRegisterClient');
  const tv = useTranslations('validation');
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get('ref') ?? undefined;
  const { registerClient } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => setCities([]));
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
      await registerClient({
        email,
        password,
        firstName: valid.firstName,
        lastName: valid.lastName,
        phone: valid.normalizedPhone,
        cityId,
        referralCode,
      });
      router.push('/dashboard/client');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell minHeight="85vh" image="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=2400&q=90">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
          <p className="text-xs text-slate-500">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="register-full-name">{t('fullNameLabel')}</Label>
            <Input
              id="register-full-name"
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
            <Label htmlFor="register-email">{t('emailLabel')}</Label>
            <Input
              id="register-email"
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
            <Label htmlFor="register-password">{t('passwordLabel')}</Label>
            <PasswordInput
              id="register-password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!fieldErrors.password}
              required
            />
            {fieldErrors.password && <p className="text-red-500 text-xs">{tv(fieldErrors.password)}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="register-phone">{t('phoneLabel')}</Label>
            <Input
              id="register-phone"
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!fieldErrors.phone}
              required
            />
            {fieldErrors.phone && <p className="text-red-500 text-xs">{tv(fieldErrors.phone)}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="register-city">{t('cityLabel')}</Label>
            <Select value={cityId} onValueChange={setCityId} required>
              <SelectTrigger id="register-city" className="w-full font-bold" aria-invalid={!!fieldErrors.cityId}>
                <SelectValue placeholder={t('cityPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" variant="brand" size="xl" disabled={submitting} className="w-full">
            {submitting ? t('registering') : t('registerButton')}
          </Button>
        </form>

        <p className="text-center text-xs text-slate-500">
          {t('alreadyHaveAccount')} <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">{t('logIn')}</Link>
        </p>
      </div>
    </AuthShell>
  );
}
