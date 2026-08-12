'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { citiesApi, masterCabinetApi, usersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { resolveOwnFileUrl, uploadFile } from '@/lib/api/upload';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';
import type { City } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDateFormat } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const MasterLocationPicker = dynamic(() => import('@/components/masters/MasterLocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />,
});

export default function EditProfilePage() {
  const t = useTranslations('settingsProfile');
  const fmt = useDateFormat();
  const { user, refreshUser, logout } = useAuth();
  const isMaster = user?.role === 'MASTER';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [cityId, setCityId] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('0');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('15');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappChangedAt, setWhatsappChangedAt] = useState<string | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [masterLat, setMasterLat] = useState<number | null>(null);
  const [masterLng, setMasterLng] = useState<number | null>(null);
  const [cityLat, setCityLat] = useState<number | null>(null);
  const [cityLng, setCityLng] = useState<number | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    const profile = user.clientProfile ?? user.masterProfile;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates form fields from the loaded user
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setDisplayName(user.masterProfile?.displayName ?? '');
    setPhone(user.phone ?? '');
    setBio(user.masterProfile?.bio ?? '');
    setCityId(profile?.cityId ?? '');
    setYearsOfExperience(String(user.masterProfile?.yearsOfExperience ?? 0));
    setServiceRadiusKm(String(user.masterProfile?.serviceRadiusKm ?? 15));
    if (isMaster && user.masterProfile) {
      setWhatsappPhone(user.masterProfile.whatsappPhone ?? '');
      setWhatsappEnabled(user.masterProfile.whatsappEnabled);
      setWhatsappChangedAt(user.masterProfile.whatsappChangedAt ?? null);
    }
    setAvatarUrl(null);
    setBannerUrl(null);
    resolveOwnFileUrl(profile?.avatarFileId ?? null).then(setAvatarUrl);
    if (isMaster) resolveOwnFileUrl(user.masterProfile?.bannerFileId ?? null).then(setBannerUrl);
  }, [user, isMaster]);

  useEffect(() => {
    if (!isMaster) return;
    masterCabinetApi.myStatus().then((status) => {
      setMasterLat(status.latitude);
      setMasterLng(status.longitude);
    }).catch(() => {});
  }, [isMaster]);

  useEffect(() => {
    const city = cities.find((c) => c.id === cityId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derives the fallback map center from the selected city
    setCityLat(city?.latitude ?? null);
    setCityLng(city?.longitude ?? null);
  }, [cities, cityId]);

  const refreshMedia = useCallback(async () => {
    const profile = user?.clientProfile ?? user?.masterProfile;
    setAvatarUrl(await resolveOwnFileUrl(profile?.avatarFileId ?? null));
    if (isMaster) setBannerUrl(await resolveOwnFileUrl(user?.masterProfile?.bannerFileId ?? null));
  }, [user, isMaster]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const fileId = await uploadFile(file, 'AVATAR');
      await usersApi.setAvatar(fileId);
      await refreshUser();
      await refreshMedia();
      if (isMaster) revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('uploadFailed'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingBanner(true);
    setError(null);
    try {
      const fileId = await uploadFile(file, 'BANNER');
      await usersApi.setBanner(fileId);
      await refreshUser();
      await refreshMedia();
      revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('uploadFailed'));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('validationName'));
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const data: Record<string, unknown> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        cityId: cityId || undefined,
      };
      if (isMaster) {
        data.displayName = displayName.trim();
        data.bio = bio.trim() || undefined;
        data.yearsOfExperience = Number(yearsOfExperience) || 0;
        data.serviceRadiusKm = Number(serviceRadiusKm) || 15;
        data.whatsappPhone = whatsappPhone.trim() || null;
        data.whatsappEnabled = whatsappEnabled;
      }
      await usersApi.updateMe(data);
      await refreshUser();
      setSaved(true);
      if (isMaster) revalidateMastersCache();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeleting(true);
    setError(null);
    try {
      await usersApi.deleteMe();
      await logout();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteFailed'));
      setDeleting(false);
    }
  };

  const fullName = isMaster ? displayName : `${firstName} ${lastName}`.trim();
  const effectiveAvatar = avatarUrl ?? getAvatarUrl(user?.id ?? '', fullName);
  const effectiveBanner = bannerUrl ?? getCoverUrl(user?.id ?? '');

  return (
    <>
      <PageHeader
        icon="User"
        eyebrow={t('accountSettings')}
        title={t('editProfile')}
        accent={isMaster ? 'amber' : 'blue'}
      />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {isMaster && (
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="relative h-40 sm:h-52">
            <img src={effectiveBanner} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
            <Button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute bottom-3 right-3 h-auto px-3 py-2 rounded-xl bg-white/90 hover:bg-white backdrop-blur text-slate-800 text-[10px] font-extrabold"
            >
              {uploadingBanner ? '...' : t('changeBanner')}
            </Button>
            <img
              src={effectiveAvatar}
              alt=""
              className="absolute -bottom-10 left-6 w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
            />
          </div>
          <div className="pt-12 pb-6 px-6 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white">{displayName || '—'}</h2>
              <p className="text-xs text-slate-400 font-semibold">{user?.email}</p>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              variant="brand"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="h-auto px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 text-xs"
            >
              {uploadingAvatar ? '...' : t('changeAvatar')}
            </Button>
          </div>
        </Card>
      )}

      <Card className="gap-0 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
        {!isMaster && (
          <div className="flex items-center gap-6">
            <img src={effectiveAvatar} alt="" className="w-20 h-20 rounded-3xl object-cover border-2 border-amber-500" />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              variant="secondary"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="h-auto px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              {uploadingAvatar ? '...' : t('changeAvatar')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <Label htmlFor="profile-first-name">{t('firstNameLabel')}</Label>
            <Input
              id="profile-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="p-3.5 font-semibold"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-last-name">{t('lastNameLabel')}</Label>
            <Input
              id="profile-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="p-3.5 font-semibold"
            />
          </div>
          {isMaster && (
            <div className="space-y-1">
              <Label htmlFor="profile-display-name">{t('displayNameLabel')}</Label>
              <Input
                id="profile-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="p-3.5 font-semibold"
              />
              <span className="text-[10px] text-slate-400">{t('displayNameHint')}</span>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="profile-phone">{t('phoneLabel')}</Label>
            <Input
              id="profile-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="p-3.5 font-semibold"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-city">{t('cityLabel')}</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger id="profile-city" className="w-full p-3.5 font-semibold">
                <SelectValue placeholder={t('cityLabel')} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isMaster && (
            <div className="space-y-1">
              <Label htmlFor="profile-experience">{t('experienceLabel')}</Label>
              <Input
                id="profile-experience"
                type="number"
                min="0"
                max="70"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                className="p-3.5 font-semibold"
              />
            </div>
          )}
          {isMaster && (
            <div className="space-y-1">
              <Label htmlFor="profile-radius">{t('radiusLabel')}</Label>
              <Input
                id="profile-radius"
                type="number"
                min="1"
                max="200"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                className="p-3.5 font-semibold"
              />
            </div>
          )}
        </div>

        {isMaster && (
          <div className="space-y-1 text-xs">
            <Label htmlFor="profile-bio">{t('bioLabel')}</Label>
            <Textarea
              id="profile-bio"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="p-3.5 font-semibold"
            />
          </div>
        )}

        {isMaster && (
          <div className="space-y-6 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="whatsapp" size={18} className="text-[#25D366]" />
              {t('whatsappSectionTitle')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="profile-whatsapp">{t('whatsappNumberLabel')}</Label>
                <Input
                  id="profile-whatsapp"
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+992901234567"
                  className="p-3.5 bg-white dark:bg-slate-800 font-semibold"
                />
                <p className="text-[10px] text-slate-400">{t('whatsappNumberHint')}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="profile-whatsapp-toggle">{t('whatsappEnabledLabel')}</Label>
                <Button
                  id="profile-whatsapp-toggle"
                  type="button"
                  aria-pressed={whatsappEnabled}
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={cn(
                    'w-full h-auto py-3 rounded-2xl text-xs font-bold',
                    whatsappEnabled
                      ? 'bg-[#25D366] text-white hover:bg-[#1ebe5d]'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600',
                  )}
                >
                  {whatsappEnabled ? t('whatsappEnabled') : t('whatsappDisabled')}
                </Button>
                {whatsappChangedAt && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    {t('whatsappChanged', { date: fmt.dateTime(whatsappChangedAt) })}
                  </p>
                )}
              </div>
            </div>
            {whatsappPhone && (
              <Button
                asChild
                className="h-auto gap-2 px-5 py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold shadow"
              >
                <a href={waLink(whatsappPhone)!} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={16} />
                  {t('whatsappTest')}
                </a>
              </Button>
            )}
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('whatsappChangeWarning')}</p>
          </div>
        )}

        {isMaster && (
          <div className="space-y-4 p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="mappin" size={18} className="text-amber-600 dark:text-amber-400" />
              {t('locationSectionTitle')}
            </h3>
            <MasterLocationPicker
              initialLatitude={masterLat}
              initialLongitude={masterLng}
              cityLatitude={cityLat}
              cityLongitude={cityLng}
              onSaved={(lat, lng) => {
                setMasterLat(lat);
                setMasterLng(lng);
              }}
            />
          </div>
        )}

        {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('savedOk')}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving}
            className="h-auto px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 text-xs"
          >
            {t('saveChanges')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="h-auto px-5 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs"
          >
            {deleting ? '...' : t('deleteAccount')}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-auto px-5 py-3.5 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 gap-2 ml-auto"
          >
            <Link href="/settings/security">
              <Icon name="key" size={14} />
              {t('securitySettings')}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
    </>
  );
}
