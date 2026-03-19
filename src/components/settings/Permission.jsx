import React, { useEffect, useState } from 'react';
import {
    FaUserCircle,
    FaShieldAlt,
    FaSearch,
    FaChevronRight,
    FaCheckCircle,
} from 'react-icons/fa';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Select, Input, Tag } from 'antd';
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
    const { data: permissionByUser, refetch: refetchPermissionByUser } = useGetPermissionByIdQuery(
        { id: selectUser?.id || userId, token },
        { skip: !token }
    );

    const flattenMenus = (items = []) =>
        items.flatMap((item) => [item, ...(item?.menus?.length ? flattenMenus(item.menus) : [])]);

    useEffect(() => {
        if (user?.data?.length !== 0 && menus?.data?.length !== 0) {
            const newUser = user?.data?.filter((i) => i.id != userId && i.role_id !== 2);
            const allMenu = flattenMenus(menus?.data || []);
            const newMenu = allMenu?.filter((i) => Number(i.menu_type) !== 0);
            setNewMenus(newMenu);
            setUsers(newUser);
            setFilteredUsers(newUser);
            if (newUser?.length > 0 && !selectUser) {
                handleUser(newUser[0]?.id);
            }
        }
    }, [user, menus]);

    useEffect(() => {
        if (selectUser?.id && newMenus?.length > 0) {
            checkPermission(selectUser.id);
        }
    }, [permissionByUser, selectUser, newMenus]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = users?.filter(
                (userItem) =>
                    userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    userItem.role.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchTerm, users]);

    const buildMenuTree = (flatMenus) => {
        const map = {};
        const tree = [];

        flatMenus?.forEach((item) => {
            const menuId = Number(item.menu_id);
            map[menuId] = { ...item, children: [] };
        });

        flatMenus?.forEach((item) => {
            const menuId = Number(item.menu_id);
            const parentId =
                item.parent_menu === null || item.parent_menu === ''
                    ? null
                    : Number(item.parent_menu);
            if (parentId !== null && map[parentId]) {
                map[parentId].children.push(map[menuId]);
            } else {
                tree.push(map[menuId]);
            }
        });

        const sortTree = (nodes) =>
            nodes
                .sort((a, b) => Number(a.order_menu || 0) - Number(b.order_menu || 0))
                .map((node) => ({
                    ...node,
                    children: sortTree(node.children || []),
                }));

        return sortTree(tree);
    };

    const handleUser = (id) => {
        const currentUser = users?.find((u) => u.id == id);
        setSelectUser(currentUser);
    };

    const checkPermission = (id) => {
        const userPermission = flattenMenus(permissionByUser?.data || []);
        const permId = userPermission.map((i) => i.menu_id);

        const perms = newMenus?.map((menu) => ({
            ...menu,
            enabled: permId.includes(menu.menu_id) ? 1 : 0,
            user_id: id,
        }));

        const enabledCount = perms?.filter((i) => i.enabled === 1)?.length || 0;
        setAllperm(enabledCount === newMenus?.length && newMenus?.length > 0);
        setMenuPer(perms);
    };

    const removePermission = async (menu_ids, currentUserId) => {
        try {
            await api.put(`permission-remove/${currentUserId}`, menu_ids, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Permission removed');
            refetchPermissionByUser();
            refectUser();
        } catch (error) {
            toast.error('Failed to remove permission');
        }
    };

    const addPermission = async (menuIds, currentUserId) => {
        try {
            await api.post(
                'permission',
                { user_id: currentUserId, menu_ids: menuIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Permission added');
            refetchPermissionByUser();
            refectUser();
        } catch (error) {
            toast.error('Failed to add permission');
        }
    };

    const onPermission = async (currentUserId, isChecked) => {
        const allIds = menuPer?.map((m) => m.menu_id) || [];
        setAllperm(isChecked);
        setMenuPer((prev) => prev.map((n) => ({ ...n, enabled: isChecked ? 1 : 0 })));
        if (isChecked) {
            addPermission(allIds, currentUserId);
        } else {
            removePermission(allIds, currentUserId);
        }
    };

    const getEnabledPermissionsCount = () => {
        return menuPer?.filter((perm) => perm.enabled === 1).length;
    };

    const getMenuTypeLabel = (menuType) => {
        switch (Number(menuType)) {
            case 1:
                return 'Sidebar';
            case 2:
                return 'Home';
            case 3:
                return 'Settings';
            case 4:
                return 'Report';
            case 5:
                return 'Inventory';
            case 6:
                return 'Footer';
            default:
                return 'System';
        }
    };

    function onParent(menu_id, currentUserId, type, checked, isParent) {
        const children = menuPer.filter((m) => Number(m.parent_menu ?? m.parent_id) === Number(menu_id));
        const targetIds = [menu_id, ...children.map((c) => c.menu_id)];
        setMenuPer((prev) =>
            prev.map((n) =>
                targetIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n
            )
        );
        if (checked) addPermission(targetIds, currentUserId);
        else removePermission(targetIds, currentUserId);
    }

    function onChild(menu_id, currentUserId, type, checked, isParent) {
        setMenuPer((prev) =>
            prev.map((n) => (n.menu_id === menu_id ? { ...n, enabled: checked ? 1 : 0 } : n))
        );
        if (checked) addPermission([menu_id], currentUserId);
        else removePermission([menu_id], currentUserId);
    }

    const permissionGroups = buildMenuTree(menuPer);

    return (
        <div className="min-h-screen bg-[#f8f5f1] text-slate-800">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 rounded-[28px] border border-[#eadfd3] bg-white/90 p-5 shadow-[0_18px_50px_rgba(140,110,80,0.08)] sm:p-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={() => navigator(-1)}
                                className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] text-slate-500 transition hover:text-slate-900"
                            >
                                <IoArrowBack className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4eadf] text-[#9a6b3c]">
                                    <FaShieldAlt className="h-6 w-6" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Permissions & Roles</h1>
                                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                                    Configure access levels and permissions for individual users across your system modules.
                                </p>
                            </div>
                        </div>

                        {/* <div className="rounded-2xl border border-[#eadfd3] bg-[#fcfaf7] p-1.5">
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-sm"
                                >
                                    By User
                                </button>
                                <button
                                    type="button"
                                    disabled
                                    className="rounded-xl px-6 py-2.5 text-sm font-medium text-slate-400"
                                >
                                    By Role
                                </button>
                            </div>
                        </div> */}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="overflow-hidden rounded-[28px] border border-[#eadfd3] bg-white shadow-[0_18px_50px_rgba(140,110,80,0.06)]">
                        <div className="border-b border-[#f0e7de] p-5">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
                                <p className="text-sm text-slate-500">Choose a user to configure access.</p>
                            </div>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="rounded-2xl pl-10"
                                    size="large"
                                />
                            </div>
                        </div>

                        <div className="border-b border-[#f0e7de] p-4 xl:hidden">
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
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <FaUserCircle className="text-2xl text-gray-400" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-sm font-medium text-gray-900">
                                                    {employee?.username}
                                                </h3>
                                                <p className="truncate text-xs text-gray-500">{employee?.role}</p>
                                            </div>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>

                        <div className="hidden max-h-[720px] overflow-y-auto xl:block">
                            {filteredUsers?.map((employee) => (
                                <button
                                    key={employee.id}
                                    type="button"
                                    onClick={() => handleUser(employee.id)}
                                    className={`flex w-full items-center gap-4 border-b border-[#f5ede6] px-5 py-4 text-left transition last:border-b-0 ${selectUser?.id === employee.id ? 'bg-[#fcf7f2]' : 'hover:bg-[#fdfaf6]'
                                        }`}
                                >
                                    {employee?.image ? (
                                        <img
                                            src={employee.image}
                                            alt=""
                                            className="h-12 w-12 rounded-2xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4eadf] text-[#9a6b3c]">
                                            <FaUserCircle className="h-6 w-6" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-semibold text-slate-900">
                                                {employee.username}
                                            </h3>
                                            {selectUser?.id === employee.id && (
                                                <FaCheckCircle className="h-4 w-4 text-[#c08a53]" />
                                            )}
                                        </div>
                                        <p className="truncate text-xs text-slate-500">{employee.role}</p>
                                        <div className="mt-2">
                                            {employee.status ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>}
                                        </div>
                                    </div>
                                    <FaChevronRight className="h-4 w-4 text-slate-300" />
                                </button>
                            ))}
                        </div>
                    </aside>

                    <main>
                        {selectUser ? (
                            <>
                                <div className="mb-6 rounded-[28px] border border-[#eadfd3] bg-white p-6 shadow-[0_18px_50px_rgba(140,110,80,0.06)]">
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                        <div className="flex items-center gap-4">
                                            {selectUser?.image ? (
                                                <img
                                                    src={selectUser.image}
                                                    alt=""
                                                    className="h-16 w-16 rounded-[22px] object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#f4eadf] text-[#9a6b3c]">
                                                    <FaUserCircle className="h-8 w-8" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    <h2 className="text-2xl font-bold text-slate-900">{selectUser.username}</h2>
                                                    <span className="rounded-full border border-[#eadfd3] bg-[#fcfaf7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6b3c]">
                                                        {selectUser.role}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    Select modules below to enable or revoke access for this user.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-[#f0e7de] bg-[#fcfaf7] px-4 py-3">
                                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Granted</div>
                                                <div className="mt-1 text-2xl font-bold text-slate-900">{getEnabledPermissionsCount()}</div>
                                                <div className="text-xs text-slate-500">of {menuPer?.length} items enabled</div>
                                            </div>
                                            <div className="rounded-2xl border border-[#f0e7de] bg-[#fcfaf7] px-4 py-3">
                                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Access Mode</div>
                                                <div className="mt-1 text-base font-semibold text-slate-900">
                                                    {isAllperm ? 'Full Access' : 'Custom Access'}
                                                </div>
                                                <label className="mt-2 inline-flex cursor-pointer items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => onPermission(selectUser.id, e.target.checked)}
                                                        checked={isAllperm}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="relative h-7 w-14 rounded-full bg-[#dbc7b4] transition peer-checked:bg-[#c08a53] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-7"></div>
                                                    <span className="text-sm font-medium text-slate-600">all</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[32px] border border-[#eadfd3] bg-white p-6 shadow-[0_18px_50px_rgba(140,110,80,0.06)]">
                                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-slate-900">Permission Groups</h3>
                                            <p className="text-sm text-slate-500">
                                                Access is organized by parent menu and child actions.
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-[#eadfd3] bg-[#fcfaf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9a6b3c]">
                                            User-Based Access
                                        </span>
                                    </div>

                                    {permissionGroups?.length > 0 ? (
                                        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                            {permissionGroups.map((parent) => (
                                                <section
                                                    key={parent.menu_id}
                                                    className="rounded-[26px] border border-[#eadfd3] bg-[#fffdfa] p-5 shadow-[0_10px_25px_rgba(140,110,80,0.04)]"
                                                >
                                                    <div className="mb-4 flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                <span className="h-4 w-4 rounded-full border-2 border-[#d8b38a]"></span>
                                                                <h4 className="truncate text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
                                                                    {parent.menu_name}
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-slate-500">
                                                                {parent.menu_path || 'Parent menu'} | {getMenuTypeLabel(parent.menu_type)}
                                                            </p>
                                                        </div>
                                                        <label className="inline-flex cursor-pointer items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={parent.enabled === 1}
                                                                onChange={(e) =>
                                                                    onParent(parent.menu_id, selectUser.id, 'any', e.target.checked, true)
                                                                }
                                                                className="sr-only peer"
                                                            />
                                                            <div className="relative h-6 w-11 rounded-full bg-[#dbc7b4] transition peer-checked:bg-[#c08a53] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"></div>
                                                        </label>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(parent.children?.length > 0 ? parent.children : [parent]).map((child) => {
                                                            const isParentFallback = child.menu_id === parent.menu_id;
                                                            return (
                                                                <label
                                                                    key={`${parent.menu_id}-${child.menu_id}`}
                                                                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition ${child.enabled === 1
                                                                        ? 'border-[#ead4bc] bg-[#fcf4eb]'
                                                                        : 'border-[#f1e7db] bg-white'
                                                                        } ${!isParentFallback && parent.enabled === 0 ? 'opacity-50' : ''
                                                                        }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        disabled={!isParentFallback && parent.enabled === 0}
                                                                        checked={child.enabled === 1}
                                                                        onChange={(e) =>
                                                                            isParentFallback
                                                                                ? onParent(child.menu_id, selectUser.id, 'any', e.target.checked, true)
                                                                                : onChild(child.menu_id, selectUser.id, 'any', e.target.checked, false)
                                                                        }
                                                                        className="h-4 w-4 rounded border-[#d5b18b] text-[#c08a53] focus:ring-[#c08a53]"
                                                                    />
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="truncate text-sm font-medium text-slate-800">
                                                                            {child.menu_name}
                                                                        </div>
                                                                        <div className="truncate text-xs text-slate-400">
                                                                            {child.menu_path || 'No route path'}
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </section>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-3xl border border-dashed border-[#eadfd3] bg-[#fcfaf7] px-6 py-12 text-center">
                                            <h4 className="text-lg font-semibold text-slate-900">No permission groups available</h4>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Create menus first, then assign access to users here.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-[28px] border border-[#eadfd3] bg-white p-12 text-center shadow-[0_18px_50px_rgba(140,110,80,0.06)]">
                                <div className="mx-auto max-w-md">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#f4eadf] text-[#9a6b3c]">
                                        <FaUserCircle className="h-10 w-10" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900">No User Selected</h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Select a user from the left panel to view and manage their permission groups.
                                    </p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Permission;
