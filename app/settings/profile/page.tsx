'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { KeyRound, MapPin, MessageCircle, ShieldAlert, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { citiesApi, masterCabinetApi, usersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { waLink } from '@/lib/whatsapp';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import { resolveOwnFileUrl, uploadFile } from '@/lib/api/upload';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';
import type { City } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageBody } from '@/components/layout/PageBody';
import { Panel } from '@/components/dashboard/Panel';
import { Notice } from '@/components/dashboard/Notice';
import { useDateFormat } from '@/lib/datetime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const MasterLocationPicker = dynamic(() => import('@/components/masters/MasterLocationPicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-[320px] w-full rounded-2xl" />,
});

export default function EditProfilePage() {
  const t = useTranslations('settingsProfile');
  const tm = useTranslations('dashboardMaster');
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

  /**
   * One primary button for the whole cabinet, in the neutral.
   *
   * It used to take the role's accent, which put a saturated amber or blue slab next to
   * every form — and the accent then had nothing left to mean, because it was already
   * on the button, the header tile and the active nav row. The accent marks *whose*
   * cabinet this is; the button marks what to press.
   */
  const primaryBtn =
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200';

  return (
    <>
      <PageHeader
        icon="User"
        eyebrow={t('accountSettings')}
        title={t('editProfile')}
        hint={t('displayNameHint')}
        accent="blue"
      />
    <PageBody narrow>

      {/* The identity card, on the banner rather than under it.
          The name and the email used to sit on a white strip below the picture with the
          avatar hanging off the seam between them, which gave the page two headers and a
          fifty-pixel band of nothing. Everything now lives on the photograph the master
          chose, with one scrim carrying the type — the same treatment the dashboard's
          welcome band uses, so the two read as the same product. */}
      {isMaster && (
        <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/[0.06] dark:border-slate-800 dark:shadow-none">
          <img src={effectiveBanner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/15" />
          <div aria-hidden className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />

          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          <Button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute right-4 top-4 z-10 h-auto rounded-xl border border-white/25 bg-white/15 px-3 py-2 text-[11px] font-bold text-white backdrop-blur-md transition hover:bg-white/25"
          >
            {uploadingBanner ? '…' : t('changeBanner')}
          </Button>

          <div className="relative flex flex-wrap items-end justify-between gap-4 p-5 pt-32 sm:p-6 sm:pt-40">
            <div className="flex min-w-0 items-center gap-4">
              <span className="relative shrink-0">
                <span
                  aria-hidden
                  className="absolute -inset-1 rounded-[1.4rem] bg-gradient-to-br from-blue-500 to-sky-400 opacity-70 blur"
                />
                <img
                  src={effectiveAvatar}
                  alt=""
                  className="relative h-[72px] w-[72px] rounded-2xl border-2 border-white/30 object-cover"
                />
              </span>
              <div className="min-w-0">
                <span className="inline-block rounded-full border border-blue-400/40 bg-blue-500/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-blue-100 backdrop-blur-md">
                  {tm('badge')}
                </span>
                <h2 className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {displayName || '—'}
                </h2>
                <p className="truncate text-[12.5px] font-medium text-white/70">{user?.email}</p>
              </div>
            </div>

            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <Button
              variant="brand"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="h-auto rounded-2xl bg-white px-4 py-2.5 text-[13px] font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              {uploadingAvatar ? '…' : t('changeAvatar')}
            </Button>
          </div>
        </section>
      )}

      <Panel title={t('personalDetailsTitle')} Icon={UserRound} accent="blue" divided bodyClassName="space-y-5">
        {!isMaster && (
          <div className="flex items-center gap-5">
            <img
              src={effectiveAvatar}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              variant="ghost"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="h-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              {uploadingAvatar ? '…' : t('changeAvatar')}
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
          <div className="space-y-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <MessageCircle size={17} className="text-[#25D366]" />
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
                    'h-auto w-full rounded-xl py-3 text-xs font-bold',
                    whatsappEnabled
                      ? 'bg-[#25D366] text-white hover:bg-[#1ebe5d]'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600',
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
                className="h-auto gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#1ebe5d]"
              >
                <a href={waLink(whatsappPhone)!} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15} />
                  {t('whatsappTest')}
                </a>
              </Button>
            )}
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t('whatsappChangeWarning')}
            </p>
          </div>
        )}

        {isMaster && (
          <div className="space-y-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <MapPin size={17} className="text-blue-600 dark:text-sky-400" />
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

        {error && <Notice tone="danger">{error}</Notice>}
        {saved && <Notice tone="success">{t('savedOk')}</Notice>}

        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <Button
            variant="brand"
            onClick={handleSave}
            disabled={saving}
            className={cn('h-auto rounded-2xl px-7 py-3 text-[13px] font-medium', primaryBtn)}
          >
            {t('saveChanges')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="h-auto gap-2 rounded-xl px-5 py-3 text-xs font-extrabold"
          >
            <ShieldAlert size={14} />
            {deleting ? '…' : t('deleteAccount')}
          </Button>
          <Button
            asChild
            variant="ghost"
            className="ml-auto h-auto gap-2 rounded-xl border border-slate-200 px-5 py-3 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Link href="/settings/security">
              <KeyRound size={14} />
              {t('securitySettings')}
            </Link>
          </Button>
        </div>
      </Panel>
    </PageBody>
    </>
  );
}
