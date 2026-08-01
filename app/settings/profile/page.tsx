'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { uploadFile } from '@/lib/api/upload';
import { getAvatarUrl } from '@/lib/placeholders';

export default function EditProfilePage() {
  const t = useTranslations('settingsProfile');
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const profile = user.clientProfile ?? user.masterProfile;
    setFullName(profile ? `${profile.firstName} ${profile.lastName}` : '');
    setPhone(user.phone ?? '');
    setBio(user.masterProfile?.bio ?? '');
  }, [user]);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const [firstName, ...rest] = fullName.trim().split(/\s+/);
      const data: Record<string, unknown> = {
        firstName: firstName || '',
        lastName: rest.join(' '),
        phone: phone || undefined,
      };
      if (user?.masterProfile) data.bio = bio;
      await usersApi.updateMe(data);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('accountSettings')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('editProfile')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-6">
          <img src={getAvatarUrl(user?.id ?? '')} alt="" className="w-20 h-20 rounded-3xl object-cover border-2 border-blue-500" />
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-60"
          >
            {uploadingAvatar ? '...' : t('changeAvatar')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('fullNameLabel')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('phoneLabel')}</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>
        </div>

        {user?.masterProfile && (
          <div className="space-y-1 text-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300">{t('bioLabel')}</label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>
        )}

        {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('saveChanges')} ✓</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple disabled:opacity-60"
        >
          {t('saveChanges')}
        </button>
      </div>
    </div>
  );
}
