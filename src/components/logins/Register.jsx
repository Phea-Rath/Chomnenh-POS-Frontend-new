import React, { useEffect, useRef, useState } from 'react'
import { IoEyeOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5'
import { FaUserShield, FaUserTie, FaRegUserCircle, FaUserPlus } from 'react-icons/fa'
import { MdOutlinePhone } from 'react-icons/md'
import RegisterForm from './RegisterForm'
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import UpdateUsers from './UpdateUsers';
import { Link, useNavigate } from 'react-router';
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import { toast } from 'react-toastify';
import { Modal } from 'antd';
import { IoIosSearch, IoIosImages } from 'react-icons/io'
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Button from '../../utils/Button';
import Input from '../../utils/Input';
import { LuArrowLeft, LuUserPlus, LuSearch, LuRefreshCw, LuTrash2, LuEye, LuShieldAlert } from 'react-icons/lu';
import Pagination from '../../utils/Pagination';
import RefreshButton from '../../utils/RefreshButton'
import { getToken } from '@/utils/tokenStore';

const Register = () => {
  const { t } = useTranslation();
  const { darkMode, setLoading, setReload, reload } = useOutletsContext();

  const [openResponsive, setOpenResponsive] = useState(false);
  const [data, setData] = useState([]);
  const [user, setUser] = useState([]);
  const navigator = useNavigate();
  const token = getToken();
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: response, refetch, isLoading: loadings, isFetching } = useGetAllUserQuery(token);
  const updateModalRef = useRef(null);

  useEffect(() => {
    setData(response?.data || []);
    setUser(response?.data?.filter(i => i.role_id !== 2) || []);
  }, [response]);

  function handleDelete(user_id) { setAlertBox(true); setId(user_id); }
  function handleCancel() { setAlertBox(false); }

  async function handleConfirm() {
    try {
      setLoading(true);
      const res = await api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.status == 200) {
        setReload(!reload); setAlertBox(false); refetch(); setLoading(false);
        toast.success(res.data.message || 'User deleted successfully');
      }
    } catch (error) {
      setAlertBox(false); setLoading(false);
      toast.error(error?.message || 'An error occurred while deleting the user');
    }
  }

  function onSearch(e) {
    const v = e.target.value;
    if (v) {
      setUser(data.filter(item =>
        item.username.toLowerCase().includes(v.toLowerCase()) ||
        item.phone_number?.toString().includes(v) ||
        item.role?.toLowerCase().includes(v.toLowerCase())
      ));
    } else { setUser(data); }
  }

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return <FaUserShield className="w-3.5 h-3.5 text-purple-500" />;
      case 'manager': return <FaUserTie className="w-3.5 h-3.5 text-cyan-500" />;
      default: return <FaRegUserCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'manager': return 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800';
      case 'staff': return 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <div className="view-page px-4 md:px-6 font-sans antialiased text-slate-900 dark:text-slate-100 pb-8">
      <AlertBox
        isOpen={alertBox}
        title={t('deleteUserTitle')}
        message={t('deleteUserMsg')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        confirmColor="error"
      />

      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {t('userManagement')}
              </h1>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
                {user?.length || 0} {t('USERS')}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-2 dark:text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              {t('userManagementSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={refetch}
            />
            <Button
              variant='save'
              onClick={() => navigator('/register')}
              className="px-6 py-2 bg-[#13b5ea] hover:bg-[#0f92bd] text-white rounded-[2px] text-[13px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <LuUserPlus size={18} />
              {t('addNewUser')}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="space-y-6 mb-8">
        <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] p-4 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-8 w-full">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t('searchUsersPlaceholder')}</label>
              <div className="relative">
                <input
                  onChange={onSearch}
                  placeholder={t('searchUsersPlaceholder')}
                  className="w-full px-3 py-1.5 pl-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[2px] transition-all outline-none focus:border-[#13b5ea] focus:ring-0 text-[13px] h-[38px]"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <LuSearch size={18} />
                </div>
              </div>
            </div>
            <div className="md:col-span-4 w-full">
              <div className="flex items-center gap-2 px-4 h-[38px] bg-indigo-50 dark:bg-indigo-900/20 rounded-[2px] border border-indigo-100 dark:border-indigo-900/40 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                <FaRegUserCircle size={14} />
                <span>Active Personnel: {user?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden bg-white dark:bg-slate-900/50 shadow-sm">
          {loadings ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-[#13b5ea] rounded-full animate-spin mb-4" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{t('loadingUsers')}</p>
            </div>
          ) : user?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-700">
                <LuShieldAlert size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{t('noUsersFound')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md mb-8">
                {data?.length === 0 ? t('noUsersDesc') : t('noSearchResult')}
              </p>
              {data?.length === 0 && (
                <Button
                  onClick={() => navigator('/register')}
                  className="px-6 py-2 bg-[#13b5ea] text-white rounded-[2px] text-xs font-bold uppercase tracking-widest"
                >
                  <LuUserPlus /> {t('addFirstUser')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">{t('userCol')}</th>
                    <th className="px-6 py-4">{t('roleCol')}</th>
                    <th className="px-6 py-4">{t('contactCol')}</th>
                    <th className="px-6 py-4">{t('createdByCol')}</th>
                    <th className="px-6 py-4 text-right">{t('actionsCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {user?.map(({ id, username, phone_number, role, created_by_name, image }) => (
                    <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                            <img
                              className="w-full h-full object-cover"
                              src={image || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e3a5f&color=fff&bold=true`}
                              alt={username}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[13px] text-slate-800 dark:text-slate-100">{username}</div>
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">UID-{id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(role)}`}>
                          {getRoleIcon(role)}
                          {role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 dark:text-slate-400">
                          <MdOutlinePhone className="text-slate-400" />
                          {phone_number || '---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
                          {created_by_name || 'System'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Link to={'/user_detail/' + id}>
                            <button className="p-1.5 text-slate-400 hover:text-[#13b5ea] hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all">
                              <LuEye size={18} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          >
                            <LuTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {!loadings && user?.length > 0 && (
          <div className="mt-8 flex justify-center border-t border-slate-100 dark:border-slate-800 pt-6">
            <Pagination
              current={currentPage}
              total={user.length}
              pageSize={pageSize}
              t={t}
              onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <Modal 
        centered 
        open={openResponsive} 
        footer={null} 
        onCancel={() => setOpenResponsive(false)}
        width={1000}
        styles={{ content: { padding: 0, overflow: 'hidden', borderRadius: '4px' } }}
      >
        <RegisterForm />
      </Modal>
      
      <dialog ref={updateModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-5xl bg-white dark:bg-slate-900 rounded-[2px] p-0 overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
           <UpdateUsers />
        </div>
      </dialog>
    </div>
  );
};

export default Register;
