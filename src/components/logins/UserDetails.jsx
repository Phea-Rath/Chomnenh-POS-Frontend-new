import { useEffect, useState } from 'react';
import {
  FiEdit2, FiCamera, FiCheck, FiX, FiUser, FiPhone,
  FiShield, FiClock, FiActivity, FiCalendar, FiSave,
} from 'react-icons/fi';
import { BsCheckCircleFill, BsArrowLeft } from 'react-icons/bs';
import { IoSparklesOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetAllUserQuery, useGetUserByIdQuery,
  useGetUserByProIdQuery, useGetUserLoginQuery,
} from "@/features/auth/usersSlice";
import { useNavigate, useParams } from 'react-router';
import {
  useUpdateImageMutation, useUpdateNameMutation,
  useUpdateNumberPhoneMutation, useUpdateRoleMutation,
} from "@/features/auth/userProfileSlice";
import { useOutletsContext } from '../../layouts/Management';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useGetAllRoleQuery } from "@/features/auth/rolesSlice";
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtFull = (d) =>
  d ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const SkeletonPulse = ({ cls = '' }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700 ${cls}`} />
);

/* ── Reusable inline edit field ── */
const EditField = ({ icon, label, value, editing, tempValue, onChange, onEdit, onSave, onCancel, isSaving, type = 'text' }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
      <span className="flex items-center gap-1.5">{icon} {label}</span>
      {!editing && (
        <button onClick={onEdit} className="text-cyan-500 hover:text-cyan-600 p-1 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition">
          <FiEdit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div key="edit" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2 pt-1">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          <button onClick={onSave} disabled={isSaving} className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-50">
            <FiCheck className="w-4 h-4" />
          </button>
          <button onClick={onCancel} className="p-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition">
            <FiX className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-extrabold text-gray-900 dark:text-white">
          {value}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const UserProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const token = getToken();
  const uId = localStorage.getItem('userId');
  const navigator = useNavigate();
  const { setLoading } = useOutletsContext();

  const { data, refetch, isLoading } = useGetUserByIdQuery({ id, token });
  const userLogin = useGetUserLoginQuery(token);
  const { refetch: userRefetch } = useGetAllUserQuery(token);
  const { data: filteredUsers } = useGetUserByProIdQuery({ id: data?.data?.profile_id, token });
  const { data: roles } = useGetAllRoleQuery(token);

  const [updateImage] = useUpdateImageMutation();
  const [updateNumberPhone] = useUpdateNumberPhoneMutation();
  const [updateName] = useUpdateNameMutation();
  const [updateRole] = useUpdateRoleMutation();

  const [user, setUser] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState({ username: false, phone_number: false, image: false, role_id: false });
  const [tempValues, setTempValues] = useState({ username: '', phone_number: '', role_id: '' });

  useEffect(() => {
    if (data?.data) {
      setDisabled(data.data.status);
      setUser(data.data);
      setTempValues({ username: data.data.username || '', phone_number: data.data.phone_number || '', role_id: data.data.role_id || '' });
    }
  }, [data]);

  const handleEdit = (field) => setEditing(p => ({ ...p, [field]: true }));
  const handleCancel = (field) => {
    setEditing(p => ({ ...p, [field]: false }));
    setTempValues(p => ({ ...p, [field]: user?.[field] || '' }));
    if (field === 'image') { setSelectedImage(null); setImageFile(null); }
  };

  const handleSave = async (field) => {
    setIsSaving(true);
    try {
      let response;
      if (field === 'username') response = await updateName({ id, itemData: { user_name: tempValues.username }, path: '/user/name', token });
      else if (field === 'phone_number') response = await updateNumberPhone({ id, itemData: { phone_number: tempValues.phone_number }, path: '/user/number_phone', token });
      else if (field === 'role_id') response = await updateRole({ id, itemData: { role_id: tempValues.role_id }, path: '/user/role', token });
      if (response?.data?.status === 200) {
        await refetch(); await userRefetch(); await userLogin.refetch();
        setEditing(p => ({ ...p, [field]: false }));
        toast.success(response.data.message || `${field.replace('_', ' ')} updated successfully`);
      } else {
        toast.error(response?.data?.message || `Failed to update ${field}`);
      }
    } catch (err) {
      toast.error(err.message || `Error updating ${field}`);
    } finally { setIsSaving(false); setLoading(false); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image size exceeds 3MB limit'); return; }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) { toast.error('Invalid image format'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => { setSelectedImage(reader.result); setEditing(p => ({ ...p, image: true })); };
    reader.readAsDataURL(file);
  };

  const saveImage = async () => {
    if (!imageFile) { toast.error('Please select an image first'); return; }
    setIsSaving(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    try {
      const response = await updateImage({ id, itemData: formData, path: '/user/image', token });
      if (response?.data?.status === 200) {
        await refetch(); await userRefetch(); await userLogin.refetch();
        setEditing(p => ({ ...p, image: false })); setSelectedImage(null); setImageFile(null);
        toast.success(response.data.message || 'Profile image updated');
      }
    } catch (err) { toast.error(err.message || 'Error updating image'); }
    finally { setIsSaving(false); setLoading(false); }
  };

  const statusChange = async () => {
    try {
      setLoading(true);
      const isCompany = data?.data?.id === 1;
      const userId = isCompany ? data?.data?.profile_id : data?.data?.id;
      const url = disabled
        ? (isCompany ? `disabled_company/${userId}` : `disabled_user/${userId}`)
        : (isCompany ? `enabled_company/${userId}` : `enabled_user/${userId}`);
      const response = await api.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response?.data?.status === 200) {
        await refetch(); await userRefetch(); setDisabled(!disabled);
        toast.success(response.data.message);
      }
    } catch (err) { toast.error(err?.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const roleBadgeColor = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (r === 'manager') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (r === 'cashier') return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-12 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 pt-4">
        <div className="h-52 rounded-3xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4"><SkeletonPulse cls="h-64" /><SkeletonPulse cls="h-32" /></div>
          <div className="lg:col-span-2 space-y-4"><SkeletonPulse cls="h-40" /><SkeletonPulse cls="h-28" /><SkeletonPulse cls="h-28" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">

      {/* ══ 1. HERO BANNER ══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm"
      >
        <div className="h-40 sm:h-48 w-full bg-gradient-to-br from-slate-600/30 via-slate-600/40 to-gray-600/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/30" />
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-10 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-4 left-4">
            <button
              onClick={() => navigator(-1)}
              className="p-2 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 hover:bg-white/25 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <BsArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <IoSparklesOutline className="text-yellow-300" />
              <span>ID: #{user?.id || id}</span>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-gray-800 shadow-2xl overflow-hidden bg-gradient-to-br from-cyan-50 to-indigo-100 dark:from-gray-700 dark:to-gray-900 relative">
                {selectedImage || user?.image ? (
                  <img src={selectedImage || user?.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-cyan-600 dark:text-cyan-400">
                    {user?.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <label
                  htmlFor="user-profile-upload"
                  className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer gap-1"
                >
                  <FiCamera className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                </label>
                <input type="file" id="user-profile-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
              <span
                className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow ${user?.status ? 'bg-emerald-500' : 'bg-gray-400'}`}
                title={user?.status ? 'Active' : 'Inactive'}
              />
            </div>
            <div className="mb-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {user?.username || 'User'}
                </h1>
                {user?.status && <BsCheckCircleFill className="text-cyan-500 w-5 h-5" title="Active Account" />}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                {user?.phone_number || t('notProvided')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-1">
            <span className={`px-3 py-1.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 ${roleBadgeColor(user?.role)}`}>
              <FiShield className="w-3.5 h-3.5" />
              {user?.role || 'N/A'}
            </span>
            <span className={`px-3 py-1.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 ${user?.status ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40'}`}>
              <FiActivity className="w-3.5 h-3.5" />
              {user?.status ? t('active') : 'Inactive'}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {editing.image && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cyan-50 dark:bg-cyan-950/40 border-t border-cyan-100 dark:border-cyan-900/50 px-6 py-3 flex items-center justify-between"
            >
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                <FiCamera className="w-4 h-4 animate-bounce" /> New photo selected — ready to save!
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleCancel('image')} className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 transition">
                  Cancel
                </button>
                <button onClick={saveImage} disabled={isSaving} className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow hover:bg-cyan-700 transition flex items-center gap-1 disabled:opacity-50">
                  <FiSave className="w-3.5 h-3.5" /> Save Photo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ══ 2. MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-1 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-5 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-4"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60">
              <FiActivity className="text-cyan-500 w-4 h-4" /> Account Controls
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('status')}</p>
                <p className={`text-sm font-extrabold mt-0.5 ${user?.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {user?.status ? t('active') : 'Inactive'}
                </p>
              </div>
              {uId != id && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" onChange={statusChange} checked={!!disabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              )}
            </div>

            <div className="border-b border-gray-100 dark:border-gray-700/60" />

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FiCalendar className="w-3 h-3" /> {t('memberSince')}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{fmt(user?.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><FiClock className="w-3 h-3" /> {t('lastUpdated')}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{fmt(user?.updated_at)}</span>
              </div>
            </div>
          </motion.div>

          {filteredUsers?.data?.filter(e => e.role_name !== 'guest' && e.id != id)?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="p-5 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-3"
            >
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                <FiUser className="text-cyan-500 w-4 h-4" /> Same Branch Users
              </h3>
              {filteredUsers?.data?.filter(e => e.role_name !== 'guest' && e.id != id)?.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition cursor-pointer">
                  {emp?.image ? (
                    <img src={emp.image} alt="" className="w-10 h-10 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 dark:from-cyan-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">{emp.username?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{emp.username}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize">{emp.role}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${emp?.status ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <FiUser className="text-cyan-500 w-5 h-5" /> {t('userInformation')}
            </h3>

            <EditField
              icon={<FiUser className="w-3.5 h-3.5 text-cyan-500" />}
              label={t('username')}
              value={user?.username}
              editing={editing.username}
              tempValue={tempValues.username}
              onChange={(v) => setTempValues(p => ({ ...p, username: v }))}
              onEdit={() => handleEdit('username')}
              onSave={() => handleSave('username')}
              onCancel={() => handleCancel('username')}
              isSaving={isSaving}
              type="text"
            />

            <div className="border-b border-gray-100 dark:border-gray-700/60" />

            <EditField
              icon={<FiPhone className="w-3.5 h-3.5 text-cyan-500" />}
              label={t('phoneNumber')}
              value={user?.phone_number || t('notProvided')}
              editing={editing.phone_number}
              tempValue={tempValues.phone_number}
              onChange={(v) => setTempValues(p => ({ ...p, phone_number: v }))}
              onEdit={() => handleEdit('phone_number')}
              onSave={() => handleSave('phone_number')}
              onCancel={() => handleCancel('phone_number')}
              isSaving={isSaving}
              type="tel"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm space-y-5"
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700/60">
              <FiShield className="text-cyan-500 w-5 h-5" /> {t('roleField')} & {t('accountStatus')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role edit */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <FiShield className="w-3 h-3" /> {t('roleField')}
                  </span>
                  {!editing.role_id && (
                    <button onClick={() => handleEdit('role_id')} className="text-cyan-500 hover:text-cyan-600 p-1 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition">
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {editing.role_id ? (
                    <motion.div key="edit" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex items-center gap-2">
                      <select
                        value={tempValues.role_id}
                        onChange={(e) => setTempValues(p => ({ ...p, role_id: e.target.value }))}
                        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs font-bold capitalize"
                      >
                        <option value="">{t('selectRole')}</option>
                        {roles?.data?.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                      </select>
                      <button onClick={() => handleSave('role_id')} disabled={isSaving} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition disabled:opacity-50">
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleCancel('role_id')} className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition">
                        <FiX className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-extrabold text-gray-900 dark:text-white capitalize">
                      {user?.role || '—'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Status */}
              <div className={`p-4 rounded-2xl border space-y-2 ${user?.status ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40' : 'bg-red-50/60 dark:bg-red-900/20 border-red-100 dark:border-red-800/40'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${user?.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  <FiActivity className="w-3 h-3" /> {t('accountStatus')}
                </span>
                <p className={`text-sm font-extrabold ${user?.status ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {user?.status ? t('active') : 'Inactive'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-6 rounded-3xl bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700/60 shadow-sm"
          >
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700/60 mb-4">
              <FiClock className="text-cyan-500 w-4 h-4" /> Audit Timestamps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-2">
                  <FiCalendar className="w-3 h-3" /> {t('createdAt')}
                </span>
                <p className="font-bold text-gray-800 dark:text-gray-200">{fmtFull(user?.created_at)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mb-2">
                  <FiClock className="w-3 h-3" /> {t('lastUpdated')}
                </span>
                <p className="font-bold text-gray-800 dark:text-gray-200">{fmtFull(user?.updated_at)}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
