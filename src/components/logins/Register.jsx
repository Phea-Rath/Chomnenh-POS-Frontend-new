import React, { useEffect, useRef, useState } from 'react'
import { IoPersonAddOutline, IoEyeOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5'
import { FaUserShield, FaUserTie, FaRegUserCircle } from 'react-icons/fa'
import { MdOutlinePhone } from 'react-icons/md'
import RegisterForm from './RegisterForm'
import api from '../../services/api';
import { useOutletsContext } from '../../layouts/Management';
import AlertBox from '../../services/AlertBox';
import UpdateUsers from './UpdateUsers';
import { Link, useNavigate } from 'react-router';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { toast } from 'react-toastify';
import { Modal } from 'antd';
import { IoIosSearch } from 'react-icons/io'
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();

  const [openResponsive, setOpenResponsive] = useState(false);
  const [data, setData] = useState([]);
  const [user, setUser] = useState([]);
  const navigator = useNavigate();
  const token = localStorage.getItem('token');
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const { setLoading, setReload, reload } = useOutletsContext();
  const { data: response, refetch, isLoading: loadings } = useGetAllUserQuery(token);
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);

  useEffect(() => {
    setData(response?.data || []);
    setUser(response?.data?.filter(i => i.role_id !== 2) || []);
  }, [response]);

  function handleDelete(user_id) { setAlertBox(true); setId(user_id); }
  function handleCancel() { setAlertBox(false); }

  async function handleConfirm() {
    try {
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

  function handleUpdate() { updateModalRef.current?.showModal(); }

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return <FaUserShield className="w-4 h-4 text-purple-500" />;
      case 'manager': return <FaUserTie className="w-4 h-4 text-blue-500" />;
      default: return <FaRegUserCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'staff': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <section className="px-4 md:px-6 lg:px-8 py-6 min-h-screen transition-colors duration-200">
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('userManagement')}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('userManagementSubtitle')}</p>
          </div>
          <button
            onClick={() => navigator('/register')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#163057] text-white rounded-lg shadow-sm transition-colors font-medium text-sm"
          >
            <IoPersonAddOutline className="w-4 h-4" />
            {t('addNewUser')}
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IoIosSearch className="w-5 h-5" />
              </div>
              <input
                onChange={onSearch}
                type="text"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors text-sm"
                placeholder={t('searchUsersPlaceholder')}
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 text-sm">
              <FaRegUserCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">{user?.length || 0} {t('usersLabel')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loadings ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-[#1e3a5f] rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('loadingUsers')}</p>
          </div>
        ) : user?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <IoPersonAddOutline className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">{t('noUsersFound')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md text-center mb-6">
              {data?.length === 0 ? t('noUsersDesc') : t('noSearchResult')}
            </p>
            {data?.length === 0 && (
              <button
                onClick={() => navigator('/register')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#163057] text-white rounded-lg shadow-sm font-medium text-sm"
              >
                <IoPersonAddOutline className="w-4 h-4" />
                {t('addFirstUser')}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {[t('userCol'), t('roleCol'), t('contactCol'), t('createdByCol'), t('actionsCol')].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {user?.map(({ id, username, phone_number, role, created_by_name, image }) => (
                    <tr key={id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            src={image || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e3a5f&color=fff`}
                            alt={username}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{username}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(role)}`}>{role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MdOutlinePhone className="w-4 h-4" />
                          {phone_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{created_by_name || 'System'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link to={'/user_detail/' + id}>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                              <IoEyeOutline className="w-4 h-4" />{t('viewAndEdit')}
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <IoTrashOutline className="w-4 h-4" />{t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-4">
              {user?.map(({ id, username, phone_number, role, created_by_name, image }) => (
                <div key={id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-11 w-11 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                        src={image || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e3a5f&color=fff`}
                        alt={username}
                      />
                      <div>
                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{username}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {id}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(role)}`}>{role}</span>
                  </div>
                  <div className="space-y-1 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2"><MdOutlinePhone className="w-4 h-4" />{phone_number || 'N/A'}</div>
                    <div>{t('createdByCol')}: {created_by_name || 'System'}</div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                      <Link to={'/user_detail/' + id}>
                        <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><IoEyeOutline className="w-5 h-5" /></button>
                      </Link>
                      <button onClick={handleUpdate} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"><IoPencilOutline className="w-5 h-5" /></button>
                    </div>
                    <button onClick={() => handleDelete(id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><IoTrashOutline className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {user?.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('showing')} <span className="font-medium">1</span> {t('to')} <span className="font-medium">{user.length}</span> {t('of')} <span className="font-medium">{user.length}</span> {t('usersLabel')}
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">{t('previous')}</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">{t('next')}</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal centered open={openResponsive} footer={null} onCancel={() => setOpenResponsive(false)}
        width={{ xs: '90%', sm: '80%', md: '70%', lg: '70%', xl: '70%', xxl: '70%' }}>
        <RegisterForm />
      </Modal>
      <dialog ref={addModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-5xl bg-gray-100 dark:bg-gray-800 rounded-xl"><RegisterForm /></div>
      </dialog>
      <dialog ref={updateModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-5xl bg-gray-100 dark:bg-gray-800 rounded-xl"><UpdateUsers /></div>
      </dialog>
    </section>
  );
};

export default Register;