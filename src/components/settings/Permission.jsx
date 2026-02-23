// src/Permission.js
import React, { useEffect, useState } from 'react';
import {
    FaUserCircle,
    FaShieldAlt,
    FaSearch,
    FaChevronDown,
    FaChevronRight,
} from 'react-icons/fa';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import {
    useGetAllPermissionQuery,
    useGetPermissionByIdQuery,
} from '../../../app/Features/permissionSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Select, Input } from 'antd';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router';

const Permission = () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isAllperm, setAllperm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigator = useNavigate();
    const { data: user, refetch: refectUser } = useGetAllUserQuery(token);
    const [selectUser, setSelectUser] = useState(null);
    const { data: menus } = useGetAllMenuQuery(token);
    const [menuPer, setMenuPer] = useState([]);
    const [newMenus, setNewMenus] = useState([]);
    const { data: permission, refetch } = useGetAllPermissionQuery(token);
    const { refetch: showPermission } = useGetPermissionByIdQuery({
        id: userId,
        token,
    });

    // --- NEW: state for expandable rows (Excel style) ---
    const [expandedParents, setExpandedParents] = useState(new Set());

    useEffect(() => {
        if (user?.data?.length !== 0 && menus?.data?.length !== 0 && permission?.data?.length !== 0) {
            const newUser = user?.data?.filter((i) => i.id != userId && i.role_id !== 2);
            const newMenu = menus?.data?.filter((i) => i.menu_type != 0);
            setNewMenus(newMenu);
            setUsers(newUser);
            setFilteredUsers(newUser);
            if (newUser?.length > 0 && !selectUser) {
                handleUser(newUser[0]?.id);
            }
        }
    }, [user, menus, permission]);

    const buildMenuTree = (flatMenus) => {
        const map = {};
        const tree = [];

        flatMenus?.forEach((item) => {
            map[item.menu_id] = { ...item, children: [] };
        });

        flatMenus?.forEach((item) => {
            if (item.parent_menu && map[item.parent_menu]) {
                map[item.parent_menu].children.push(map[item.menu_id]);
            } else {
                tree.push(map[item.menu_id]);
            }
        });
        return tree;
    };

    useEffect(() => {
        if (searchTerm) {
            const filtered = users?.filter(
                (user) =>
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const handleUser = (id) => {
        const user = users?.find((u) => u.id == id);
        setSelectUser(user);
        checkPermission(id);
    };

    const checkPermission = (id) => {
        const userPermission = permission?.data.filter((i) => i.user_id == id) || [];
        const PermId = userPermission.map((i) => i.menu_id);

        const perms = newMenus?.map((menu) => {
            if (PermId.includes(menu.menu_id)) {
                return {
                    ...menu,
                    enabled: 1,
                    user_id: id,
                };
            } else {
                return {
                    ...menu,
                    enabled: 0,
                    user_id: id,
                };
            }
        });

        const permSelectUser = permission?.data?.filter((i) => i.user_id === Number(id));
        permSelectUser?.length == newMenus?.length ? setAllperm(true) : setAllperm(false);
        setMenuPer(perms);

        // --- NEW: initialise all parents as expanded ---
        const tree = buildMenuTree(perms);
        const parentIds = tree.map((p) => p.menu_id);
        setExpandedParents(new Set(parentIds));
    };

    // --- NEW: toggle expand/collapse for a parent ---
    const toggleExpand = (menuId) => {
        setExpandedParents((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(menuId)) {
                newSet.delete(menuId);
            } else {
                newSet.add(menuId);
            }
            return newSet;
        });
    };

    const onPermission = async (user_id, isChecked) => {

        const allIds = menuPer?.map((m) => m.menu_id) || [];
        setAllperm(isChecked);
        setMenuPer((prev) => prev.map((n) => ({ ...n, enabled: isChecked ? 1 : 0 })));
        if (isChecked) {
            addPermission(allIds, user_id);
        } else {
            removePermission(allIds, user_id);
        }


    };

    const removePermission = async (menu_ids, user_id) => {
        try {
            await api.put(`permission-remove/${user_id}`, menu_ids, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Permission removed');
            refetch();
        }
        catch (error) {
            toast.error('Failed to remove permission');
        }
    };


    const addPermission = async (menus, user_id) => {
        try {
            await api.post(
                'permission',
                { user_id, menu_ids: menus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Permission added');
            refetch();
        } catch (error) {
            toast.error('Failed to add permission');
        }
    };

    const getEnabledPermissionsCount = () => {
        return menuPer?.filter((perm) => perm.enabled === 1).length;
    };

    function onParent(menu_id, user_id, type, checked, isParent) {
        const children = menuPer.filter((m) => Number(m.parent_menu ?? m.parent_id) === Number(menu_id));
        const targetIds = [menu_id, ...children.map((c) => c.menu_id)];
        setMenuPer((prev) =>
            prev.map((n) =>
                targetIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n
            )
        );
        if (checked) addPermission(targetIds, user_id);
        else removePermission(targetIds, user_id);

    }

    function onChild(menu_id, user_id, type, checked, isParent) {
        setMenuPer((prev) =>
            prev.map((n) => (n.menu_id === menu_id ? { ...n, enabled: checked ? 1 : 0 } : n))
        );
        if (checked) addPermission([menu_id], user_id);
        else removePermission([menu_id], user_id);

    }
    return (
        <div className="min-h-screen bg-transparent">
            {/* Header (unchanged) */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigator(-1)}
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
                    {/* Users Sidebar (unchanged) */}
                    <div className="w-full xl:w-96">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Users</h2>
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
                                    style={{ width: '100%' }}
                                    size="large"
                                    placeholder="Select a user..."
                                    value={selectUser?.id}
                                    onChange={handleUser}
                                    optionFilterProp="title"
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.title ?? '').toLowerCase().localeCompare(
                                            (optionB?.title ?? '').toLowerCase()
                                        )
                                    }
                                    options={filteredUsers?.map((employee) => ({
                                        value: employee?.id,
                                        title: employee?.username,
                                        label: (
                                            <div className="flex items-center gap-3 py-1">
                                                {employee?.image ? (
                                                    <img
                                                        src={employee?.image}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <FaUserCircle className="text-2xl text-gray-400" />
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
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {employee.status}
                                                </span>
                                            </div>
                                        </div>
                                        <FaChevronRight
                                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${selectUser?.id === employee.id ? 'text-blue-600' : ''
                                                }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Permissions Panel - EXCEL STYLE TABLE */}
                    <div className="flex-1">
                        {selectUser ? (
                            <>
                                {/* User Header (unchanged) */}
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
                                                <h1 className="text-2xl font-bold text-gray-900">{selectUser.username}</h1>
                                                <p className="text-gray-600">{selectUser.role}</p>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <span className="text-sm text-gray-500">User ID: {selectUser.id}</span>
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
                                                    onChange={(e) => onPermission(selectUser.id, e.target.checked)}
                                                    checked={isAllperm}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-14 h-7 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Excel‑style table */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 border-b border-gray-200 bg-gray-100">
                                        <h2 className="text-xl font-semibold text-gray-900">Menu Permissions</h2>
                                        <p className="text-gray-600 mt-1">
                                            Control which menu sections this user can access
                                        </p>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-100 border-b border-gray-300">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                                    >
                                                        Menu Item
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                                    >
                                                        Type
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                                                    >
                                                        Permission
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {buildMenuTree(menuPer).map((parent) => {
                                                    const isExpanded = expandedParents.has(parent.menu_id);
                                                    return (
                                                        <React.Fragment key={parent.menu_id}>
                                                            {/* Parent row */}
                                                            <tr className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => toggleExpand(parent.menu_id)}
                                                                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                                                        >
                                                                            {isExpanded ? (
                                                                                <FaChevronDown className="w-4 h-4" />
                                                                            ) : (
                                                                                <FaChevronRight className="w-4 h-4" />
                                                                            )}
                                                                        </button>
                                                                        <span className="font-bold">{parent.menu_name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                        PARENT
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={parent.enabled === 1}
                                                                            onChange={(e) =>
                                                                                onParent(parent.menu_id, selectUser.id, 'any', e.target.checked, true)
                                                                            }
                                                                            className="sr-only peer"
                                                                        />
                                                                        <div className="w-11 h-6 bg-gray-400 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                                    </label>
                                                                </td>
                                                            </tr>

                                                            {/* Child rows (only if expanded) */}
                                                            {isExpanded &&
                                                                parent.children?.length > 0 &&
                                                                parent.children.map((child) => (
                                                                    <tr key={child.menu_id} className="hover:bg-gray-50 transition-colors bg-gray-50/30">
                                                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 pl-14">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-gray-400">└─</span>
                                                                                {child.menu_name}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                                                CHILD
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    disabled={parent.enabled === 0} // disabled if parent is off
                                                                                    checked={child.enabled === 1}
                                                                                    onChange={(e) =>
                                                                                        onChild(child.menu_id, selectUser.id, 'any', e.target.checked, false)
                                                                                    }
                                                                                    className="sr-only peer"
                                                                                />
                                                                                <div
                                                                                    className={`w-9 h-5 bg-gray-400 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${parent.enabled === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                                                                        }`}
                                                                                ></div>
                                                                            </label>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Empty State (unchanged) */
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                                <div className="max-w-md mx-auto">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                                        <FaUserCircle className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No User Selected</h3>
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
