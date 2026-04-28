import React, { useEffect, useState } from 'react';
import { FiEdit2, FiSave, FiX, FiPhone, FiCalendar, FiClock, FiKey, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useGetUserProfileQuery } from '../../../app/Features/usersSlice';
import { useParams } from 'react-router';
import { useUpdateAddressMutation, useUpdateImageMutation, useUpdateNameMutation, useUpdateNumberPhoneMutation, useUpdateQrCodeMutation, useUpdateTelegramServiceMutation } from '../../../app/Features/userProfileSlice';
import { useOutletsContext } from '../../layouts/Management';
import { toast } from 'react-toastify';
import { Card, Badge, Progress, Tooltip } from 'antd';
import { PiBuildingsLight } from 'react-icons/pi';
import { LiaTelegram } from 'react-icons/lia';
import { useTranslation } from 'react-i18next';

const UserProfile = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { setLoading } = useOutletsContext();

  const [viewImage, setViewImage] = useState('');
  const [image, setImage] = useState('');
  const [viewQr, setViewQr] = useState('');
  const [qrFile, setQrFile] = useState('');
  const [address, setAddress] = useState('');

  const { data: profileData, refetch } = useGetUserProfileQuery({ id, token });
  const [updateImage] = useUpdateImageMutation();
  const [updateTelegramService] = useUpdateTelegramServiceMutation();
  const [updateQrCode] = useUpdateQrCodeMutation();
  const [updateNumberPhone] = useUpdateNumberPhoneMutation();
  const [updateName] = useUpdateNameMutation();
  const [updateAddress] = useUpdateAddressMutation();

  const [data, setData] = useState(null);
  const [editing, setEditing] = useState({ profile_name: false, telephone: false, address: false, image: false, telegram_service: false, qr_code: false });
  const [tempData, setTempData] = useState({ profile_name: '', telephone: '', bot_token: '', chat_id: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profileData?.data) {
      setData(profileData.data);
      setViewImage(profileData.data.image);
      setTempData({ profile_name: profileData.data.profile_name || '', telephone: profileData.data.telephone || '', bot_token: profileData.data.bot_token || '', chat_id: profileData.data.chat_id || '' });
      setViewQr(profileData.data.qr_code || '');
    }
  }, [profileData]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set';

  const calcDaysRemaining = (end) => {
    if (!end) return 0;
    const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const calcProgress = () => {
    if (!data?.start_date || !data?.end_date) return 0;
    const total = new Date(data.end_date) - new Date(data.start_date);
    const elapsed = new Date() - new Date(data.start_date);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getSubStatus = () => {
    const d = calcDaysRemaining(data?.end_date);
    if (d <= 0) return { text: t('subscriptionExpired'), color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    if (d <= 7) return { text: t('subscriptionExpiringSoonLabel'), color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' };
    return { text: t('subscriptionActive'), color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  const handleEdit = (field) => setEditing(p => ({ ...p, [field]: true }));
  const handleCancel = (field) => {
    setEditing(p => ({ ...p, [field]: false }));
    setTempData(p => ({ ...p, [field]: data?.[field] || '' }));
    if (field === 'image') setViewImage(data?.image || '');
    if (field === 'qr_code') setViewQr(data?.qr_code || '');
  };

  const handleSave = async (field) => {
    setIsSaving(true); setLoading(true);
    try {
      let response;
      if (field === 'image') { const fd = new FormData(); fd.append('image', image); response = await updateImage({ id, itemData: fd, path: '/profile/image', token }); }
      else if (field === 'qr_code') { const fd = new FormData(); fd.append('qr_code', qrFile); response = await updateQrCode({ id, itemData: fd, path: '/profile/qr_code', token }); }
      else if (field === 'profile_name') response = await updateName({ id, itemData: { profile_name: tempData.profile_name }, path: '/profile/name', token });
      else if (field === 'telegram_service') response = await updateTelegramService({ id, itemData: { bot_token: tempData.bot_token, chat_id: tempData.chat_id }, path: '/profile/telegram_service', token });
      else if (field === 'telephone') response = await updateNumberPhone({ id, itemData: { number_phone: tempData.telephone }, path: '/profile/number_phone', token });
      else if (field === 'address') response = await updateAddress({ id, itemData: { address }, path: '/profile/address', token });

      if (response?.data?.status === 200) {
        await refetch(); setEditing(p => ({ ...p, [field]: false }));
        toast.success(response.data.message || `${field} updated`);
        if (field === 'image') setImage('');
        if (field === 'qr_code') setQrFile('');
      }
    } catch (err) { toast.error(err.message || `Error updating ${field}`); }
    finally { setIsSaving(false); setLoading(false); }
  };

  const handleChange = (e, field) => {
    const value = e.target.value;
    setTempData(p => ({ ...p, [field]: value }));
    if (field === 'address') setAddress(value);
  };

  const handleImageUpload = (e, field = 'image') => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image size exceeds 3MB'); return; }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) { toast.error('Invalid image type'); return; }
    if (field === 'image') { setImage(file); setViewImage(URL.createObjectURL(file)); setEditing(p => ({ ...p, image: true })); }
    else { setQrFile(file); setViewQr(URL.createObjectURL(file)); setEditing(p => ({ ...p, qr_code: true })); }
  };

  const cardCls = `shadow-xl border-0 ${darkMode ? '!bg-gray-800' : ''}`;
  const inputCls = 'flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm';
  const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300';
  const valueCls = 'text-lg font-semibold text-gray-800 dark:text-gray-100 px-1 py-2';
  const btnSave = 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1 text-sm';
  const btnCancel = 'px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center gap-1 text-sm';
  const editBtn = 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors';
  const sectionRow = 'flex items-center justify-between mb-3';

  return (
    <div className="bg-transparent py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('profileSettings')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('profileSettingsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Card */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="h-full">
              <Card className={cardCls + ' h-full'}>
                <div className="flex flex-col items-center p-6">
                  {/* Avatar */}
                  <div className="relative group mb-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
                      {viewImage ? (
                        <img src={viewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">{data?.profile_name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <Tooltip title="Change profile picture">
                      <label htmlFor="profile-image-upload" className="absolute bottom-2 right-2 w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-blue-200 dark:border-blue-700">
                        <FiEdit2 size={18} />
                      </label>
                    </Tooltip>
                    <input type="file" id="profile-image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>

                  {editing.image && (
                    <div className="flex gap-2 mb-6">
                      <button onClick={() => handleSave('image')} disabled={isSaving} className={btnSave}><FiSave size={16} /></button>
                      <button onClick={() => handleCancel('image')} className={btnCancel}><FiX size={16} /></button>
                    </div>
                  )}

                  <div className="text-center mb-6 w-full">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{data?.profile_name}</h2>
                    {/* Address */}
                    {editing.address ? (
                      <div className="flex items-center gap-3">
                        <input type="text" value={tempData.address} onChange={e => handleChange(e, 'address')} className={inputCls} placeholder={t('address')} />
                        <div className="flex gap-2">
                          <button onClick={() => handleSave('address')} disabled={isSaving} className={btnSave}><FiSave size={16} /></button>
                          <button onClick={() => handleCancel('address')} className={btnCancel}><FiX size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-300 px-1 py-2">
                        {data?.address}
                        <button onClick={() => handleEdit('address')} className={editBtn}><FiEdit2 size={14} /></button>
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('profileId')}: {data?.id}</span>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="w-full bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <FiCalendar className="text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('memberSince')}</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{formatDate(data?.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Status Badge */}
                  <div className="w-full mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSubStatus().color}`}>{getSubStatus().text}</span>
                  </div>

                  {/* QR Code */}
                  <div className="mt-2 w-full">
                    <label className={labelCls + ' mb-2 block'}>{t('bankQrCode')}</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 border dark:border-gray-600">
                        {viewQr ? <img src={viewQr} alt="QR Code" className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{t('noQr')}</div>}
                      </div>
                      <div className="flex-1">
                        {editing.qr_code && (
                          <div className="flex items-center gap-2 mb-2">
                            <label htmlFor="qr-image-upload" className="px-3 py-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm">
                              <FiUpload className="inline mr-1" />{t('uploadQr')}
                            </label>
                            <input id="qr-image-upload" type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'qr_code')} />
                          </div>
                        )}
                        {!editing.qr_code && <button onClick={() => handleEdit('qr_code')} className={editBtn}><FiEdit2 /></button>}
                        {editing.qr_code && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleSave('qr_code')} disabled={isSaving} className={btnSave}><FiSave /></button>
                            <button onClick={() => handleCancel('qr_code')} className={btnCancel}><FiX /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Company Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className={cardCls}>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                    <PiBuildingsLight className="text-blue-500" />{t('companyInformation')}
                  </h2>
                  <div className="space-y-4">
                    {/* Profile Name */}
                    <div>
                      <div className={sectionRow}>
                        <label className={labelCls}>{t('fullName')}</label>
                        {!editing.profile_name && <button onClick={() => handleEdit('profile_name')} className={editBtn}><FiEdit2 size={16} /></button>}
                      </div>
                      {editing.profile_name ? (
                        <div className="flex items-center gap-3">
                          <input type="text" value={tempData.profile_name} onChange={e => handleChange(e, 'profile_name')} className={inputCls} placeholder={t('fullName')} />
                          <div className="flex gap-2">
                            <button onClick={() => handleSave('profile_name')} disabled={isSaving} className={btnSave}><FiSave size={16} /></button>
                            <button onClick={() => handleCancel('profile_name')} className={btnCancel}><FiX size={16} /></button>
                          </div>
                        </div>
                      ) : <p className={valueCls}>{data?.profile_name}</p>}
                    </div>

                    {/* Telephone */}
                    <div>
                      <div className={sectionRow}>
                        <label className={labelCls + ' flex items-center gap-2'}><FiPhone className="text-gray-400" />{t('phoneNumber')}</label>
                        {!editing.telephone && <button onClick={() => handleEdit('telephone')} className={editBtn}><FiEdit2 size={16} /></button>}
                      </div>
                      {editing.telephone ? (
                        <div className="flex items-center gap-3">
                          <input type="tel" value={tempData.telephone} onChange={e => handleChange(e, 'telephone')} className={inputCls} placeholder={t('phoneNumber')} />
                          <div className="flex gap-2">
                            <button onClick={() => handleSave('telephone')} disabled={isSaving} className={btnSave}><FiSave size={16} /></button>
                            <button onClick={() => handleCancel('telephone')} className={btnCancel}><FiX size={16} /></button>
                          </div>
                        </div>
                      ) : <p className={valueCls}>{data?.telephone || t('notProvided')}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Telegram */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card className={cardCls}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <LiaTelegram className="text-blue-500" />{t('telegramService')}
                    </h2>
                    <div className="flex items-center gap-2">
                      {!editing.telegram_service && <button onClick={() => handleEdit('telegram_service')} className={editBtn}><FiEdit2 /></button>}
                      {editing.telegram_service && (
                        <div className="flex gap-2">
                          <button onClick={() => handleSave('telegram_service')} disabled={isSaving} className={btnSave}><FiSave /></button>
                          <button onClick={() => handleCancel('telegram_service')} className={btnCancel}><FiX /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls + ' mb-2 block'}>{t('botToken')}</label>
                      {editing.telegram_service
                        ? <input type="text" value={tempData.bot_token} onChange={e => handleChange(e, 'bot_token')} className={inputCls} placeholder={t('botToken')} />
                        : <p className="text-md font-normal italic text-blue-800 dark:text-blue-400 px-1 py-2">{data?.bot_token || t('notProvided')}</p>}
                    </div>
                    <div>
                      <label className={labelCls + ' mb-2 flex items-center gap-2'}><FiPhone className="text-gray-400" />{t('chatId')}</label>
                      {editing.telegram_service
                        ? <input type="tel" value={tempData.chat_id} onChange={e => handleChange(e, 'chat_id')} className={inputCls} placeholder={t('chatId')} />
                        : <p className="text-md font-normal italic text-blue-800 dark:text-blue-400 px-1 py-2">{data?.chat_id || t('notProvided')}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Subscription */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className={cardCls}>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <FiCalendar className="text-blue-500" />{t('subscriptionDetails')}
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{t('subscriptionTimeline')}</span>
                        <span>{calcProgress().toFixed(1)}% {t('complete')}</span>
                      </div>
                      <Progress percent={calcProgress()} strokeColor={{ '0%': '#1e3a5f', '100%': '#3b82f6' }} strokeWidth={6} showInfo={false} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('startDate')}</p>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{formatDate(data?.start_date)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 rounded-xl p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('endDate')}</p>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{formatDate(data?.end_date)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-xl p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('termDuration')}</p>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{data?.term || 0} {t('months')}</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-xl p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('daysRemaining')}</p>
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100">{calcDaysRemaining(data?.end_date)} {t('days')}</p>
                      </div>
                    </div>
                    {calcDaysRemaining(data?.end_date) <= 30 && calcDaysRemaining(data?.end_date) > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg"><FiCalendar className="h-5 w-5 text-orange-600 dark:text-orange-400" /></div>
                          <div>
                            <p className="font-medium text-orange-800 dark:text-orange-300">{t('subscriptionExpiringSoon')}</p>
                            <p className="text-sm text-orange-700 dark:text-orange-400">{t('renewSubscription', { days: calcDaysRemaining(data?.end_date) })}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Account Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className={cardCls}>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <FiKey className="text-blue-500" />{t('accountInformation')}
                  </h2>
                  <div className="space-y-4">
                    {[
                      { icon: <FiKey className="text-gray-400" />, label: t('profileId'), value: data?.id },
                      { icon: <FiCalendar className="text-gray-400" />, label: t('createdAt'), value: formatDate(data?.created_at) },
                      { icon: <FiClock className="text-gray-400" />, label: t('lastUpdated'), value: formatDate(data?.updated_at) },
                    ].map(({ icon, label, value }, i) => (
                      <div key={i} className={`flex justify-between items-center py-3 ${i < 2 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                        <div className="flex items-center gap-2">{icon}<span className="text-gray-600 dark:text-gray-400 text-sm">{label}</span></div>
                        <span className="font-mono text-gray-800 dark:text-gray-200 text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;