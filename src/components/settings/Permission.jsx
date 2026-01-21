// src/Permission.js
import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaShieldAlt, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { useGetAllPermissionQuery, useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import { toast } from 'react-toastify';
import api from '../../services/api'
import { Select, Input } from 'antd';
import { IoArrowBack, IoChevronForward } from 'react-icons/io5';
import { useNavigate } from 'react-router';

const Permission = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isAllperm, setAllperm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigetor = useNavigate();
    const { data: user, refetch: refectUser } = useGetAllUserQuery(token);
    const [selectUser, setSelectUser] = useState(null);
    const { data: menus } = useGetAllMenuQuery(token);
    const [menuPer, setMenuPer] = useState([]);
    const [newMenus, setNewMenus] = useState([]);
    const { data: permission, refetch } = useGetAllPermissionQuery(token);
    const { refetch: showPermission } = useGetPermissionByIdQuery({ id: userId, token });

    useEffect(() => {
        // refectUser();
        console.log(user, menus, permission);

        if (user?.data?.length !== 0 && menus?.data?.length !== 0 && permission?.data?.length !== 0) {
            const newUser = user?.data?.filter(i => i.id != userId && i.role_id !== 2);
            const newMenu = menus?.data?.filter(i => i.menu_id != 26);
            setNewMenus(newMenu);
            setUsers(newUser);
            setFilteredUsers(newUser);
            if (newUser?.length > 0 && !selectUser) {
                handleUser(newUser[0]?.id);
            }
        }

    }, [user, menus, permission]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users?.filter(user =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const handleUser = (id) => {
        const user = users?.find(u => u.id == id);
        setSelectUser(user);
        checkPermission(id);
    }

    const checkPermission = (id) => {
        const userPermission = permission?.data.filter(i => i.user_id == id) || [];
        const PermId = userPermission.map(i => i.menu_id);

        const perms = newMenus?.map(menu => {
            if (PermId.includes(menu.menu_id)) {
                return {
                    ...menu,
                    enabled: 1,
                    user_id: id
                }
            } else {
                return {
                    ...menu,
                    enabled: 0,
                    user_id: id
                }
            }
        });

        const permSelectUser = permission?.data?.filter(i => i.user_id === Number(id));
        permSelectUser?.length == newMenus?.length ? setAllperm(true) : setAllperm(false);
        setMenuPer(perms);
    }

    const onPermission = async (menu_id, user_id, option) => {
        if (option === 'any') {
            if (event.target.checked) {
                // Enable single permission
                setMenuPer(prev => prev.map(n =>
                    n.menu_id === menu_id && n.user_id === user_id
                        ? { ...n, enabled: 1 }
                        : n
                ));

                try {
                    await api.post('permission', { user_id, menu_id, all_menu: [] }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('Permission enabled successfully');
                    setTimeout(() => { refetch(); showPermission(); }, 1000);
                } catch (error) {
                    toast.error(error.message || 'Failed to enable permission');
                }
            } else {
                // Disable single permission
                setAllperm(false);
                setMenuPer(prev => prev.map(n =>
                    n.menu_id === menu_id && n.user_id === user_id
                        ? { ...n, enabled: 0 }
                        : n
                ));

                try {
                    await api.delete(`permission/${user_id}/${menu_id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('Permission disabled successfully');
                    setTimeout(() => { refetch(); showPermission(); }, 1000);
                } catch (error) {
                    toast.error(error.message || 'Failed to disable permission');
                }
            }
        } else {
            // All permissions toggle
            if (event.target.checked) {
                // Enable all permissions
                const formMenu = menuPer?.filter(n => n.user_id === user_id && n.menu_id !== 26).map(n => ({
                    user_id: user_id,
                    menu_id: n.menu_id
                }));

                setAllperm(true);
                setMenuPer(prev => prev.map(n =>
                    n.user_id === user_id ? { ...n, enabled: 1 } : n
                ));

                try {
                    await api.post('permission', {
                        user_id,
                        menu_id: 1,
                        all_menu: formMenu
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('All permissions enabled successfully');
                    setTimeout(() => { refetch(); showPermission(); }, 1000);
                } catch (error) {
                    toast.error(error.message || 'Failed to enable all permissions');
                }
            } else {
                // Disable all permissions
                setAllperm(false);
                setMenuPer(prev => prev.map(n =>
                    n.user_id === user_id ? { ...n, enabled: 0 } : n
                ));

                try {
                    await api.delete(`permission/${user_id}/0`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('All permissions disabled successfully');
                    setTimeout(() => { refetch(); showPermission(); }, 1000);
                } catch (error) {
                    toast.error(error.message || 'Failed to disable all permissions');
                }
            }
        }
    }

    const getEnabledPermissionsCount = () => {
        return menuPer?.filter(perm => perm.enabled === 1).length;
    }

    return (
        <div className="min-h-screen bgtransparent">
            {/* Header */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigetor(-1)}
                                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-100"
                            >
                                <IoArrowBack className="w-5 h-5" />
                            </button>
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FaShieldAlt className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
                                    <p className="text-gray-600">Manage user access and system permissions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Users Sidebar */}
                    <div className="w-full xl:w-96">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Users</h2>

                                {/* Search */}
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 rounded-lg"
                                        size="large"
                                    />
                                </div>
                            </div>

                            {/* Mobile Select */}
                            <div className="p-4 xl:hidden border-b border-gray-200">
                                <Select
                                    showSearch
                                    style={{ width: "100%" }}
                                    size="large"
                                    placeholder="Select a user..."
                                    value={selectUser?.id}
                                    onChange={handleUser}
                                    optionFilterProp="title"
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.title ?? '').toLowerCase().localeCompare((optionB?.title ?? '').toLowerCase())
                                    }
                                    options={filteredUsers?.map((employee) => ({
                                        value: employee?.id,
                                        title: employee?.username,
                                        label: (
                                            <div className='flex items-center gap-3 py-1'>
                                                {employee?.image ? (
                                                    <img
                                                        src={employee?.image}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <FaUserCircle className='text-2xl text-gray-400' />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                                        {employee?.username}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">{employee?.role}</p>
                                                </div>
                                            </div>
                                        ),
                                    }))}
                                />
                            </div>

                            {/* Users List */}
                            <div className="hidden xl:block max-h-[600px] overflow-y-auto">
                                {filteredUsers?.map((employee, index) => (
                                    <div
                                        key={employee.id}
                                        onClick={() => handleUser(employee.id)}
                                        className={`flex items-center p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${selectUser?.id === employee.id
                                            ? 'bg-blue-50 border-r-4 border-blue-600'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        {employee?.image ? (
                                            <img
                                                src={employee.image}
                                                alt=""
                                                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                                                <FaUserCircle className="w-6 h-6 text-blue-600" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 ml-4">
                                            <h3 className="text-base font-semibold text-gray-900 truncate">
                                                {employee.username}
                                            </h3>
                                            <p className="text-sm text-gray-600 truncate">{employee.role}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {employee.status}
                                                </span>
                                            </div>
                                        </div>

                                        <IoChevronForward className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${selectUser?.id === employee.id ? 'text-blue-600' : ''
                                            }`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Permissions Panel */}
                    <div className="flex-1">
                        {selectUser ? (
                            <>
                                {/* User Header */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {selectUser?.image ? (
                                                <img
                                                    src={selectUser.image}
                                                    alt=""
                                                    className="w-16 h-16 rounded-2xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                                    <FaUserCircle className="w-8 h-8 text-blue-600" />
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">
                                                    {selectUser.username}
                                                </h1>
                                                <p className="text-gray-600">{selectUser.role}</p>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <span className="text-sm text-gray-500">
                                                        User ID: {selectUser.id}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        • {getEnabledPermissionsCount()} of {menuPer?.length} permissions granted
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Global Toggle */}
                                        <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                {isAllperm ? 'All Access' : 'Custom Access'}
                                            </span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    onChange={() => onPermission(0, selectUser.id, "all")}
                                                    checked={isAllperm}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions Grid */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">Menu Permissions</h2>
                                        <p className="text-gray-600 mt-1">
                                            Control which menu sections this user can access
                                        </p>
                                    </div>

                                    <div className="grid gap-2 p-4">
                                        {menuPer?.map((perm, index) => perm.menu_id != 26 && (
                                            <div
                                                key={perm.menu_id}
                                                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-semibold text-gray-900">
                                                        {perm.menu_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1 font-mono">
                                                        {perm.menu_path}
                                                    </p>
                                                </div>

                                                <div className="flex items-center space-x-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${perm.enabled
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {perm.enabled ? (
                                                            <>
                                                                <FaCheck className="w-3 h-3 mr-1" />
                                                                Enabled
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaTimes className="w-3 h-3 mr-1" />
                                                                Disabled
                                                            </>
                                                        )}
                                                    </span>

                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            onChange={() => onPermission(perm.menu_id, selectUser.id, "any")}
                                                            checked={perm.enabled}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State */
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="max-w-md mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                                        <FaUserCircle className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        No User Selected
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        Please select a user from the list to view and manage their permissions.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Permission;