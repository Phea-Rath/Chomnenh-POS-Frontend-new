import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaShieldAlt, FaSearch, FaChevronRight, FaCheckCircle } from 'react-icons/fa';
import { FiShield, FiUsers, FiLock, FiUnlock } from 'react-icons/fi';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllMenuQuery } from '../../../app/Features/menusSlice';
import { useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Select, Tag } from 'antd';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import { useOutletsContext } from '../../layouts/Management';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const Permission = () => {
    const { t } = useTranslation();
    const { darkMode } = useOutletsContext();
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
            if (newUser?.length > 0 && !selectUser) handleUser(newUser[0]?.id);
        }
    }, [user, menus]);

    useEffect(() => {
        if (selectUser?.id && newMenus?.length > 0) checkPermission(selectUser.id);
    }, [permissionByUser, selectUser, newMenus]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredUsers(users?.filter(
                (u) => u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.role.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else { setFilteredUsers(users); }
    }, [searchTerm, users]);

    const buildMenuTree = (flatMenus) => {
        const map = {};
        const tree = [];
        flatMenus?.forEach((item) => { map[Number(item.menu_id)] = { ...item, children: [] }; });
        flatMenus?.forEach((item) => {
            const menuId = Number(item.menu_id);
            const parentId = item.parent_menu === null || item.parent_menu === '' ? null : Number(item.parent_menu);
            if (parentId !== null && map[parentId]) map[parentId].children.push(map[menuId]);
            else tree.push(map[menuId]);
        });
        const sortTree = (nodes) => nodes
            .sort((a, b) => Number(a.order_menu || 0) - Number(b.order_menu || 0))
            .map((node) => ({ ...node, children: sortTree(node.children || []) }));
        return sortTree(tree);
    };

    const handleUser = (id) => setSelectUser(users?.find((u) => u.id == id));

    const checkPermission = (id) => {
        const permId = flattenMenus(permissionByUser?.data || []).map((i) => i.menu_id);
        const perms = newMenus?.map((menu) => ({ ...menu, enabled: permId.includes(menu.menu_id) ? 1 : 0, user_id: id }));
        setAllperm(perms?.filter((i) => i.enabled === 1).length === newMenus?.length && newMenus?.length > 0);
        setMenuPer(perms);
    };

    const removePermission = async (menu_ids, uid) => {
        try {
            await api.put(`permission-remove/${uid}`, menu_ids, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(t('permissionRemoved'));
            refetchPermissionByUser(); refectUser();
        } catch { toast.error(t('failedRemovePerm')); }
    };

    const addPermission = async (menuIds, uid) => {
        try {
            await api.post('permission', { user_id: uid, menu_ids: menuIds }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(t('permissionAdded'));
            refetchPermissionByUser(); refectUser();
        } catch { toast.error(t('failedAddPerm')); }
    };

    const onPermission = (uid, isChecked) => {
        const allIds = menuPer?.map((m) => m.menu_id) || [];
        setAllperm(isChecked);
        setMenuPer((prev) => prev.map((n) => ({ ...n, enabled: isChecked ? 1 : 0 })));
        isChecked ? addPermission(allIds, uid) : removePermission(allIds, uid);
    };

    const getEnabledCount = () => menuPer?.filter((p) => p.enabled === 1).length;

    const getMenuTypeLabel = (menuType) => {
        const labels = { 1: 'sidebar', 2: 'home', 3: 'settings', 4: 'report', 5: 'inventory', 6: 'footer' };
        return labels[Number(menuType)] || 'systemMenu';
    };

    function onParent(menu_id, uid, type, checked) {
        const children = menuPer.filter((m) => Number(m.parent_menu ?? m.parent_id) === Number(menu_id));
        const targetIds = [menu_id, ...children.map((c) => c.menu_id)];
        setMenuPer((prev) => prev.map((n) => targetIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n));
        checked ? addPermission(targetIds, uid) : removePermission(targetIds, uid);
    }

    function onChild(menu_id, uid, type, checked) {
        setMenuPer((prev) => prev.map((n) => n.menu_id === menu_id ? { ...n, enabled: checked ? 1 : 0 } : n));
        checked ? addPermission([menu_id], uid) : removePermission([menu_id], uid);
    }

    const permissionGroups = buildMenuTree(menuPer);
    const enabledCount = getEnabledCount();
    const progressPct = menuPer?.length > 0 ? Math.round((enabledCount / menuPer.length) * 100) : 0;

    // Root menus without child menus should be rendered inside grouped cards.
    const withChildren = permissionGroups.filter((menu) => (menu.children?.length || 0) > 0);
    const loneMenus = permissionGroups.filter((menu) => (menu.children?.length || 0) === 0);

    const loneGroups = loneMenus.reduce((acc, m) => {
        const key = m.menu_type ?? 'other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
    }, {});

    // Style helpers
    const cardCls = 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm';
    const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm';

    return (
        <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className={`${cardCls} p-5 mb-6`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigator(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
                            <IoArrowBack className="h-5 w-5" />
                        </button>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e3a5f] shadow-lg">
                            <FiShield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('permissionsTitle')}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('permissionsSubtitle')}</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">

                    {/* ── Sidebar: User List ── */}
                    <motion.aside initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                        className={`${cardCls} overflow-hidden`}>
                        {/* Header */}
                        <div className="border-b border-gray-100 dark:border-gray-700 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <FiUsers className="text-[#1e3a5f] dark:text-blue-400" />
                                <h2 className="text-base font-semibold text-gray-800 dark:text-white">{t('teamMembers')}</h2>
                            </div>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder={t('searchUsers')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Mobile dropdown */}
                        <div className="border-b border-gray-100 dark:border-gray-700 p-4 xl:hidden">
                            <Select
                                showSearch style={{ width: '100%' }} size="large"
                                placeholder={t('selectUser')}
                                value={selectUser?.id}
                                onChange={handleUser}
                                optionFilterProp="title"
                                options={filteredUsers?.map((e) => ({
                                    value: e?.id, title: e?.username,
                                    label: (
                                        <div className="flex items-center gap-3 py-1">
                                            {e?.image
                                                ? <img src={e.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                : <FaUserCircle className="text-2xl text-gray-400" />}
                                            <div><p className="text-sm font-medium text-gray-900">{e.username}</p><p className="text-xs text-gray-500">{e.role}</p></div>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>

                        {/* Desktop list */}
                        <div className="hidden xl:block max-h-[calc(100vh-280px)] overflow-y-auto">
                            {filteredUsers?.map((employee) => (
                                <button key={employee.id} type="button" onClick={() => handleUser(employee.id)}
                                    className={`flex w-full items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 px-5 py-4 text-left transition last:border-b-0
                                        ${selectUser?.id === employee.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-[#1e3a5f] dark:border-l-blue-400'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                    {employee?.image
                                        ? <img src={employee.image} alt="" className="h-11 w-11 rounded-xl object-cover flex-shrink-0" />
                                        : <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                                            <FaUserCircle className="h-6 w-6 text-gray-400" />
                                        </div>}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{employee.username}</h3>
                                            {selectUser?.id === employee.id && <FaCheckCircle className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-blue-400 flex-shrink-0" />}
                                        </div>
                                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{employee.role}</p>
                                        <div className="mt-1.5">
                                            {employee.status
                                                ? <Tag color="success" className="!text-xs">Active</Tag>
                                                : <Tag color="default" className="!text-xs">Inactive</Tag>}
                                        </div>
                                    </div>
                                    <FaChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </motion.aside>

                    {/* ── Main content ── */}
                    <main>
                        <AnimatePresence mode="wait">
                            {selectUser ? (
                                <motion.div key={selectUser.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

                                    {/* User header card */}
                                    <div className={`${cardCls} p-6 mb-5`}>
                                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                            {/* User info */}
                                            <div className="flex items-center gap-4">
                                                {selectUser?.image
                                                    ? <img src={selectUser.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                                                    : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
                                                        <FaUserCircle className="h-8 w-8 text-[#1e3a5f] dark:text-blue-400" />
                                                    </div>}
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectUser.username}</h2>
                                                        <span className="rounded-full bg-[#1e3a5f]/10 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-[#1e3a5f] dark:text-blue-400 uppercase tracking-wider">
                                                            {selectUser.role}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('selectModulesDesc')}</p>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-3 xl:w-64">
                                                {/* Granted */}
                                                <div className="rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('granted')}</p>
                                                    <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{enabledCount}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('ofItemsEnabled', { total: menuPer?.length })}</p>
                                                    <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full">
                                                        <div className="h-1.5 bg-[#1e3a5f] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                                                    </div>
                                                </div>
                                                {/* Access Mode */}
                                                <div className="rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('accessMode')}</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        {isAllperm ? <FiUnlock className="text-green-500" /> : <FiLock className="text-orange-400" />}
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                            {isAllperm ? t('fullAccess') : t('customAccess')}
                                                        </p>
                                                    </div>
                                                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2">
                                                        <input type="checkbox" onChange={(e) => onPermission(selectUser.id, e.target.checked)} checked={isAllperm} className="sr-only peer" />
                                                        <div className="relative h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('all')}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission Groups */}
                                    <div className={`${cardCls} p-6`}>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('permissionGroups')}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('permGroupSubtitle')}</p>
                                            </div>
                                            <span className="self-start sm:self-auto rounded-full bg-[#1e3a5f]/10 dark:bg-blue-900/30 px-4 py-1.5 text-xs font-semibold text-[#1e3a5f] dark:text-blue-400 uppercase tracking-wider">
                                                {t('userBasedAccess')}
                                            </span>
                                        </div>

                                        {permissionGroups?.length > 0 ? (
                                            <div className="space-y-6">
                                                {/* Cards WITH children — each gets its own card */}
                                                {withChildren.length > 0 && (
                                                    <div className="grid gap-4 grid-cols-1">
                                                        {withChildren.map((parent, idx) => {
                                                            const isEnabled = parent.enabled === 1;
                                                            return (
                                                                <motion.section key={parent.menu_id}
                                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.04 }}
                                                                    className={`rounded-2xl border p-4 transition-all ${isEnabled
                                                                        ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                                                                        : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20'
                                                                        }`}>
                                                                    {/* Header */}
                                                                    <div className="flex items-start justify-between gap-3 mb-4">
                                                                        <div className="min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${isEnabled ? 'bg-[#1e3a5f] dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                                                <h4 className="truncate text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{parent.menu_name}</h4>
                                                                            </div>
                                                                            <p className="text-xs text-gray-400 dark:text-gray-500">{parent.menu_path || t('parentMenu')} · {getMenuTypeLabel(parent.menu_type)}</p>
                                                                        </div>
                                                                        <label className="inline-flex cursor-pointer items-center flex-shrink-0">
                                                                            <input type="checkbox" checked={isEnabled} onChange={(e) => onParent(parent.menu_id, selectUser.id, 'any', e.target.checked)} className="sr-only peer" />
                                                                            <div className="relative h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] dark:peer-checked:bg-blue-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                                                                        </label>
                                                                    </div>
                                                                    {/* Children */}
                                                                    <div className="space-y-2 grid grid-cols-2 xl:grid-cols-3 gap-2">
                                                                        {parent.children.map((child) => {
                                                                            const childEnabled = child.enabled === 1;
                                                                            return (
                                                                                <label key={child.menu_id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition cursor-pointer ${childEnabled ? 'border-blue-200 dark:border-blue-700/60 bg-white dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600/50 bg-white dark:bg-gray-800'
                                                                                    } ${parent.enabled === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                                                                    <input type="checkbox" disabled={parent.enabled === 0} checked={childEnabled}
                                                                                        onChange={(e) => onChild(child.menu_id, selectUser.id, 'any', e.target.checked)}
                                                                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#1e3a5f]" />
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{child.menu_name}</p>
                                                                                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{child.menu_path || t('noRoutePath')}</p>
                                                                                    </div>
                                                                                    {childEnabled && <FaCheckCircle className="text-[#1e3a5f] dark:text-blue-400 flex-shrink-0 text-sm" />}
                                                                                </label>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.section>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Lone menus (Sidebar / no children) — grouped by type into one card each */}
                                                {Object.entries(loneGroups).map(([typeKey, items], gIdx) => {
                                                    const groupLabel = getMenuTypeLabel(typeKey);
                                                    const allEnabled = items.every((m) => m.enabled === 1);
                                                    const allIds = items.map((m) => m.menu_id);
                                                    return (
                                                        <motion.section key={`group-${typeKey}`}
                                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: (withChildren.length + gIdx) * 0.04 }}
                                                            className={`rounded-2xl border p-4 transition-all ${allEnabled
                                                                ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10'
                                                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20'
                                                                }`}>
                                                            {/* Group header */}
                                                            <div className="flex items-center justify-between gap-3 mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${allEnabled ? 'bg-[#1e3a5f] dark:bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{groupLabel}</h4>
                                                                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">{items.length}</span>
                                                                </div>
                                                                {/* Toggle all in group */}
                                                                <label className="inline-flex cursor-pointer items-center flex-shrink-0">
                                                                    <input type="checkbox" checked={allEnabled}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            setMenuPer((prev) => prev.map((n) => allIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n));
                                                                            checked ? addPermission(allIds, selectUser.id) : removePermission(allIds, selectUser.id);
                                                                        }}
                                                                        className="sr-only peer" />
                                                                    <div className="relative h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] dark:peer-checked:bg-blue-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                                                                </label>
                                                            </div>
                                                            {/* Items grid */}
                                                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                                                {items.map((menu) => {
                                                                    const menuEnabled = menu.enabled === 1;
                                                                    return (
                                                                        <label key={menu.menu_id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition cursor-pointer ${menuEnabled ? 'border-blue-200 dark:border-blue-700/60 bg-white dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600/50 bg-white dark:bg-gray-800'
                                                                            }`}>
                                                                            <input type="checkbox" checked={menuEnabled}
                                                                                onChange={(e) => onChild(menu.menu_id, selectUser.id, 'any', e.target.checked)}
                                                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#1e3a5f]" />
                                                                            <div className="min-w-0 flex-1">
                                                                                <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{menu.menu_name}</p>
                                                                                <p className="truncate text-xs text-gray-400 dark:text-gray-500">{menu.menu_path || t('noRoutePath')}</p>
                                                                            </div>
                                                                            {menuEnabled && <FaCheckCircle className="text-[#1e3a5f] dark:text-blue-400 flex-shrink-0 text-sm" />}
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.section>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 px-6 py-14 text-center">
                                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
                                                    <FiShield className="h-7 w-7 text-gray-400" />
                                                </div>
                                                <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t('noPermGroups')}</h4>
                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('noPermGroupsDesc')}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="no-user" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className={`${cardCls} p-16 text-center`}>
                                    <div className="mx-auto max-w-sm">
                                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                                            <FiShield className="h-10 w-10 text-[#1e3a5f] dark:text-blue-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('noUserSelected')}</h3>
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('noUserSelectedDesc')}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Permission;
