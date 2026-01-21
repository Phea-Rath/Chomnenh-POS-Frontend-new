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

const Register = () => {
  const [open, setOpen] = useState(false);
  const [openResponsive, setOpenResponsive] = useState(false);
  const [data, setData] = useState([]);
  const [user, setUser] = useState([]);
  const navigator = useNavigate();
  const token = localStorage.getItem('token');
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({});
  const { setLoading, setAlert, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const { data: response, refetch, isLoading: loadings } = useGetAllUserQuery(token);
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);

  useEffect(() => {
    setData(response?.data || []);
    setUser(response?.data?.filter(i => i.role_id !== 2) || []);
  }, [response]);

  function handleDelete(user_id) {
    setAlertBox(true);
    setId(user_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      const response = await api.delete(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (response.data.status == 200) {
        setReload(!reload);
        setAlertBox(false);
        refetch();
        setLoading(false);
        toast.success(response.data.message || 'User deleted successfully');
      }
    } catch (error) {
      setAlertBox(false);
      setLoading(false);
      toast.error(error?.message || error || 'An error occurred while deleting the user');
    }
  }

  function onSearch(e) {
    const searchValue = e.target.value;
    if (searchValue) {
      const filterUser = data.filter((item) =>
        item.username.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.phone_number?.toString().includes(searchValue) ||
        item.role?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setUser(filterUser);
    } else {
      setUser(data);
    }
  }

  function handleUpdate() {
    updateModalRef.current?.showModal();
  }

  const getRoleIcon = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <FaUserShield className="w-4 h-4 text-purple-600" />;
      case 'manager':
        return <FaUserTie className="w-4 h-4 text-blue-600" />;
      default:
        return <FaRegUserCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'staff':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <section className='px-4 md:px-6 lg:px-8 py-6'>
      <AlertBox
        isOpen={alertBox}
        title="Delete Confirmation"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage and organize all user accounts in the system</p>
          </div>

          <button
            onClick={() => navigator('/dashboard/register')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
          >
            <IoPersonAddOutline className="w-5 h-5" />
            Add New User
          </button>
        </div>

        {/* Search and Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <IoIosSearch className="w-5 h-5" />
              </div>
              <input
                onChange={onSearch}
                type="text"
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Search by name, phone, or role..."
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <FaRegUserCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.length || 0} user{user?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loadings ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
          </div>
        ) : user?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <IoPersonAddOutline className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Users Found</h3>
            <p className="text-gray-500 max-w-md text-center mb-6">
              {data?.length === 0
                ? "No users have been added yet. Click 'Add New User' to create your first user."
                : "No users match your search criteria. Try a different search term."
              }
            </p>
            {data?.length === 0 && (
              <button
                onClick={() => navigator('/dashboard/register')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
              >
                <IoPersonAddOutline className="w-5 h-5" />
                Add Your First User
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {user?.map(({ id, username, phone_number, role, created_by_name, image }) => (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <img
                              className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                              src={image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=random"}
                              alt={username}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{username}</div>
                            <div className="text-xs text-gray-500">User ID: {id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                            {role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MdOutlinePhone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{phone_number || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {created_by_name || 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link to={'/dashboard/user_detail/' + id}>
                            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                              <IoEyeOutline className="w-4 h-4" />
                              View & Edit
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(id)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <IoTrashOutline className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {user?.map(({ id, username, phone_number, role, created_by_name, image }) => (
                <div key={id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                        src={image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(username) + "&background=random"}
                        alt={username}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{username}</h3>
                        <p className="text-sm text-gray-500">ID: {id}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                      {role}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MdOutlinePhone className="w-4 h-4" />
                      <span>{phone_number || 'N/A'}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Created by: {created_by_name || 'System'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Link to={'/dashboard/user_detail/' + id}>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <IoEyeOutline className="w-5 h-5" />
                        </button>
                      </Link>
                      <button
                        onClick={handleUpdate}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <IoPencilOutline className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination (Optional) */}
      {user?.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">{user.length}</span> of{' '}
            <span className="font-medium">{user.length}</span> users
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Previous
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        centered
        open={openResponsive}
        footer={null}
        onCancel={() => setOpenResponsive(false)}
        width={{
          xs: '90%',
          sm: '80%',
          md: '70%',
          lg: '70%',
          xl: '70%',
          xxl: '70%',
        }}
        className="rounded-lg"
      >
        <RegisterForm />
      </Modal>

      <dialog id="my_modal_4" ref={addModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-5xl bg-gray-100 rounded-xl">
          <RegisterForm />
        </div>
      </dialog>

      <dialog id="my_modal_4" ref={updateModalRef} className="modal">
        <div className="modal-box w-11/12 max-w-5xl bg-gray-100 rounded-xl">
          <UpdateUsers />
        </div>
      </dialog>
    </section>
  )
}

export default Register