import React, { useEffect, useState } from 'react';
import { FaUserCircle, FaShieldAlt, FaSearch, FaChevronRight, FaCheckCircle } from 'react-icons/fa';
import { FiShield, FiUsers, FiLock, FiUnlock } from 'react-icons/fi';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetCurrentMenusByUserWebsiteQuery } from '../../../app/Features/menusSlice';
import { useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Checkbox, Select, Tag, Spin } from 'antd';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import { useOutletsContext } from '../../layouts/Management';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingOutlined } from '@ant-design/icons';
import RefreshButton from '../../utils/RefreshButton';

const Permission = () => {
    const { t } = useTranslation();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const [activeActions, setActiveActions] = useState(new Set());

    const isActionLoading = (id) => activeActions.has(id);
    const startAction = (id) => setActiveActions(prev => new Set(prev).add(id));
    const stopAction = (id) => setActiveActions(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });

    const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
    const smallIcon = <LoadingOutlined style={{ fontSize: 14 }} spin />;

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isAllperm, setAllperm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigator = useNavigate();

    const { data: user, refetch: refectUser, isFetching } = useGetAllUserQuery(token);
    const [selectUser, setSelectUser] = useState(null);
    const { data: menus, refetch: refetchMenus } = useGetCurrentMenusByUserWebsiteQuery(
        { id: selectUser?.id || userId, token },
        { skip: !token }
    );
    const [menuPer, setMenuPer] = useState([]);
    const [newMenus, setNewMenus] = useState([]);
    const { refetch: refetchPermissionByUser } = useGetPermissionByIdQuery(
        { id: selectUser?.id || userId, token },
        { skip: !token }
    );

    const flattenMenus = (items = []) =>
        items.flatMap((item) => [item, ...(item?.menus?.length ? flattenMenus(item.menus) : [])]);

    useEffect(() => {
        if (user?.data?.length !== 0 && menus?.data?.length !== 0) {
            const newUser = user?.data?.filter((i) => i.id != userId && i.role_id !== 2);
            const allMenu = flattenMenus(menus?.data || []);
            // menu_type null should be included as it represents group headers or untyped menus
            const newMenu = allMenu?.filter((i) => i.menu_type !== 0 && i.menu_type !== '0');
            setNewMenus(newMenu);
            setUsers(newUser);
            setFilteredUsers(newUser);
            if (newUser?.length > 0 && !selectUser) handleUser(newUser[0]?.id);
        }
    }, [user, menus]);

    useEffect(() => {
        if (selectUser?.id && newMenus?.length > 0) checkPermission(selectUser.id);
    }, [menus, selectUser, newMenus]);

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
        const perms = newMenus?.map((menu) => ({ ...menu, enabled: menu.active ? 1 : 0, user_id: id }));
        setAllperm(perms?.filter((i) => i.enabled === 1).length === newMenus?.length && newMenus?.length > 0);
        setMenuPer(perms);
    };

    const removePermission = async (menu_ids, uid, actionId) => {
        try {
            if (actionId) startAction(actionId);
            await api.put(`permission-remove/${uid}`, menu_ids, { headers: { Authorization: `Bearer ${token}` } });
            await Promise.all([refetchMenus(), refectUser()]);
        } catch {
            toast.error(t('failedRemovePerm'));
        } finally {
            if (actionId) stopAction(actionId);
        }
    };

    const addPermission = async (menuIds, uid, actionId) => {
        try {
            if (actionId) startAction(actionId);
            await api.post('permission', { user_id: uid, menu_ids: menuIds }, { headers: { Authorization: `Bearer ${token}` } });
            await Promise.all([refetchMenus(), refectUser()]);
        } catch {
            toast.error(t('failedAddPerm'));
        } finally {
            if (actionId) stopAction(actionId);
        }
    };

    const updateGranularPermission = async (uid, menuId, field, value, currentPerms) => {
        const actionId = `granular-${menuId}-${field}`;
        try {
            startAction(actionId);
            const payload = {
                user_id: uid,
                menu_id: menuId,
                is_view: field === 'is_view' ? value : (currentPerms.is_view || false),
                is_modify: field === 'is_modify' ? value : (currentPerms.is_modify || false),
                is_drop: field === 'is_drop' ? value : (currentPerms.is_drop || false),
                is_execute: field === 'is_execute' ? value : (currentPerms.is_execute || false),
            };
            await api.post('allow-permission', payload, { headers: { Authorization: `Bearer ${token}` } });
            await refetchMenus();
        } catch {
            toast.error(t('failedUpdatePerm'));
        } finally {
            stopAction(actionId);
        }
    };

    const onPermission = (uid, isChecked) => {
        const allIds = menuPer?.map((m) => m.menu_id) || [];
        const actionId = 'all-permissions';
        setAllperm(isChecked);
        setMenuPer((prev) => prev.map((n) => ({ ...n, enabled: isChecked ? 1 : 0 })));
        isChecked ? addPermission(allIds, uid, actionId) : removePermission(allIds, uid, actionId);
    };

    const getEnabledCount = () => menuPer?.filter((p) => p.enabled === 1).length;

    const getMenuTypeLabel = (menuType) => {
        const labels = { 1: 'sidebar', 2: 'home', 3: 'settings', 4: 'report', 5: 'inventory', 6: 'footer' };
        return labels[Number(menuType)] || 'systemMenu';
    };

    function onParent(menu_id, uid, type, checked) {
        const actionId = `parent-${menu_id}`;
        const children = menuPer.filter((m) => Number(m.parent_menu ?? m.parent_id) === Number(menu_id));
        const targetIds = [menu_id, ...children.map((c) => c.menu_id)];
        setMenuPer((prev) => prev.map((n) => targetIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n));
        checked ? addPermission(targetIds, uid, actionId) : removePermission(targetIds, uid, actionId);
    }

    function onChild(menu_id, uid, type, checked) {
        const actionId = `child-${menu_id}`;
        setMenuPer((prev) => prev.map((n) => n.menu_id === menu_id ? { ...n, enabled: checked ? 1 : 0 } : n));
        checked ? addPermission([menu_id], uid, actionId) : removePermission([menu_id], uid, actionId);
    }

    const permissionGroups = buildMenuTree(menuPer);
    const enabledCount = getEnabledCount();
    const progressPct = menuPer?.length > 0 ? Math.round((enabledCount / menuPer.length) * 100) : 0;

    // Separate root menus: those with children (functional groups like 'sale', 'purchase')
    // and those that are "single" base (standalone modules like 'Home', 'Dashboard')
    const functionalGroups = permissionGroups.filter((menu) => (menu.children?.length || 0) > 0 || menu.base_on !== 'single');
    const singleMenus = permissionGroups.filter((menu) => (menu.children?.length || 0) === 0 && menu.base_on === 'single');

    const GranularCheckboxes = ({ menu, uid }) => {
    const fields = [
        { id: 'is_view', label: t('view', 'View') },
        { id: 'is_modify', label: t('modify', 'Modify') },
        { id: 'is_drop', label: t('drop', 'Drop') },
        { id: 'is_execute', label: t('execute', 'Execute') },
    ];

    return (
        <div className="flex flex-wrap gap-2 mt-2 ml-7 select-none">
            {fields.map((field) => {
                const isChecked = menu[field.id] === 1;
                const actionId = `granular-${menu.menu_id}-${field.id}`;
                const isLoading = isActionLoading(actionId);

                return (
                    <label 
                        key={field.id} 
                        className={`
                            flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium 
                            border cursor-pointer transition-all duration-200 ease-in-out
                            ${isChecked 
                                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400' 
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                            }
                            ${isLoading ? 'opacity-70 pointer-events-none' : ''}
                        `}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-1.5">
                                {smallIcon}
                                <span>{field.label}</span>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => updateGranularPermission(uid, menu.menu_id, field.id, e.target.checked, menu)}
                                    className="sr-only" // Completely hides the ugly default browser checkbox safely
                                />
                                <span>{field.label}</span>
                            </>
                        )}
                    </label>
                );
            })}
        </div>
    );
};

    // Style helpers
    const cardCls = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ';
    const inputCls = 'w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-sm';

    return (
        <div>
            <div className="">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className={`${cardCls} p-2 mb-2 rounded-t-xl flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
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
                    <RefreshButton onRefresh={refetchMenus}/>
                </motion.div>

                <div className="grid gap-2 xl:grid-cols-[300px_minmax(0,1fr)]">

                    {/* ── Sidebar: User List ── */}
                    <motion.aside initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                        className={`${cardCls} overflow-hidden rounded-bl-xl`}>
                        {/* Header */}
                        <div className="border-b border-gray-100 dark:border-gray-700 p-2">
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
                        <div className="border-b border-gray-100 dark:border-gray-700 p-2 xl:hidden">
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
                                                ? <img src={e.image} alt="" className="h-8 w-8 rounded-full object-cover" onError={(ev) => { ev.target.src = ''; ev.target.onerror = null; }} />
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
                                        ? <img src={employee.image} alt="" className="h-11 w-11 rounded-xl object-cover flex-shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                        : null}
                                    {( !employee?.image || employee?.image ) && <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0" style={{ display: employee?.image ? 'none' : 'flex' }}>
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
                                    <div className={`${cardCls} p-2 mb-2`}>
                                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                                            {/* User info */}
                                            <div className="flex items-center gap-4">
                                                {selectUser?.image
                                                    ? <div className="relative h-16 w-16">
                                                        <img src={selectUser.image} alt="" className="h-16 w-16 rounded-2xl object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                        <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40">
                                                            <FaUserCircle className="h-8 w-8 text-[#1e3a5f] dark:text-blue-400" />
                                                        </div>
                                                    </div>
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
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('allowed')}</p>
                                                    <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{enabledCount}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('ofItemsEnabled', { total: menuPer?.length })}</p>
                                                    <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full">
                                                        <div className="h-1.5 bg-[#1e3a5f] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                                                    </div>
                                                </div>
                                                {/* Access Mode */}
                                                <div className="rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 p-4">
                                                    {/* <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('accessMode')}</p> */}
                                                    <div className="mt-1 flex items-center gap-2">
                                                        {isAllperm ? <FiUnlock className="text-green-500" /> : <FiLock className="text-orange-400" />}
                                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                            {isAllperm ? t('fullAccess') : t('customAccess')}
                                                        </p>
                                                    </div>
                                                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2">
                                                        <input type="checkbox" disabled={isActionLoading('all-permissions')} onChange={(e) => onPermission(selectUser.id, e.target.checked)} checked={isAllperm} className="sr-only peer" />
                                                        {isActionLoading('all-permissions') ? (
                                                            <div className="h-6 w-11 flex items-center justify-center">
                                                                {smallIcon}
                                                            </div>
                                                        ) : (
                                                            <div className="relative h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                                                        )}
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('all')}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Permission Groups */}
                                    <div className={`${cardCls} p-6 rounded-br-xl`}>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('permissionGroups')}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('permGroupSubtitle')}</p>
                                                </div>
                                                <span className="self-start sm:self-auto rounded-full bg-[#1e3a5f]/10 dark:bg-blue-900/30 px-4 py-1.5 text-xs font-semibold text-[#1e3a5f] dark:text-blue-400 uppercase tracking-wider">
                                                    {t('userBasedAccess')}
                                                </span>
                                            </div>
                                        <div className='  h-[51vh] overflow-auto'>
                                            {permissionGroups?.length > 0 ? (
                                                <div className="space-y-6">
                                                    {/* Cards for functional groups (those with children or non-single base) */}
                                                    {functionalGroups.length > 0 && (
                                                        <div className="grid gap-4 grid-cols-1">
                                                            {functionalGroups.map((parent, idx) => {
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
                                                                                {isEnabled && <GranularCheckboxes menu={parent} uid={selectUser.id} />}
                                                                            </div>
                                                                            <label className="inline-flex cursor-pointer items-center flex-shrink-0">
                                                                                <input type="checkbox" disabled={isActionLoading(`parent-${parent.menu_id}`)} checked={isEnabled} onChange={(e) => onParent(parent.menu_id, selectUser.id, 'any', e.target.checked)} className="sr-only peer" />
                                                                                {isActionLoading(`parent-${parent.menu_id}`) ? (
                                                                                    <div className="h-5 w-9 flex items-center justify-center">
                                                                                        {smallIcon}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="relative h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] dark:peer-checked:bg-blue-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                                                                                )}
                                                                            </label>
                                                                        </div>
                                                                        {/* Children */}
                                                                        {parent.children?.length > 0 && (
                                                                            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                                {parent.children.map((child) => {
                                                                                    const childEnabled = child.enabled === 1;
                                                                                    return (
                                                                                        <div key={child.menu_id} className={`flex flex-col rounded-xl border p-3 transition ${childEnabled ? 'border-blue-200 dark:border-blue-700/60 bg-white dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600/50 bg-white dark:bg-gray-800'
                                                                                            } ${parent.enabled === 0 || isActionLoading(`child-${child.menu_id}`) ? 'opacity-60 pointer-events-none' : ''}`}>
                                                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                                                {isActionLoading(`child-${child.menu_id}`) ? (
                                                                                                    <div className="h-4 w-4 flex items-center justify-center">
                                                                                                        {smallIcon}
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <Checkbox type="checkbox" disabled={parent.enabled === 0} checked={childEnabled}
                                                                                                        onChange={(e) => onChild(child.menu_id, selectUser.id, 'any', e.target.checked)}
                                                                                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#1e3a5f]" />
                                                                                                )}
                                                                                                <div className="min-w-0 flex-1">
                                                                                                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{child.menu_name}</p>
                                                                                                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{child.menu_path || t('noRoutePath')}</p>
                                                                                                </div>
                                                                                                {childEnabled && !isActionLoading(`child-${child.menu_id}`) && <FaCheckCircle className="text-[#1e3a5f] dark:text-blue-400 flex-shrink-0 text-sm" />}
                                                                                            </label>
                                                                                            {childEnabled && <GranularCheckboxes menu={child} uid={selectUser.id} />}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </motion.section>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    {/* Single menus (base_on: 'single' and no children) consolidated into one card */}
                                                    {singleMenus.length > 0 && (
                                                        <motion.section
                                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: (functionalGroups.length) * 0.04 }}
                                                            className={`rounded-2xl border p-4 transition-all border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20`}>
                                                            {/* Group header */}
                                                            <div className="flex items-center justify-between gap-3 mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 bg-[#1e3a5f] dark:bg-blue-400`} />
                                                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{t('mainModules', 'Main Modules')}</h4>
                                                                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">{singleMenus.length}</span>
                                                                </div>
                                                                {/* Toggle all in single group */}
                                                                <label className="inline-flex cursor-pointer items-center flex-shrink-0">
                                                                    <input type="checkbox"
                                                                        disabled={isActionLoading('main-modules-toggle')}
                                                                        checked={singleMenus.every(m => m.enabled === 1)}
                                                                        onChange={(e) => {
                                                                            const checked = e.target.checked;
                                                                            const allIds = singleMenus.map(m => m.menu_id);
                                                                            const actionId = 'main-modules-toggle';
                                                                            setMenuPer((prev) => prev.map((n) => allIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n));
                                                                            checked ? addPermission(allIds, selectUser.id, actionId) : removePermission(allIds, selectUser.id, actionId);
                                                                        }}
                                                                        className="sr-only peer" />
                                                                    {isActionLoading('main-modules-toggle') ? (
                                                                        <div className="h-5 w-9 flex items-center justify-center">
                                                                            {smallIcon}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="relative h-5 w-9 rounded-full bg-gray-300 dark:bg-gray-600 transition peer-checked:bg-[#1e3a5f] dark:peer-checked:bg-blue-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                                                                    )}
                                                                </label>
                                                            </div>
                                                            {/* Items grid */}
                                                            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                                {singleMenus.map((menu) => {
                                                                    const menuEnabled = menu.enabled === 1;
                                                                    return (
                                                                        <div key={menu.menu_id} className={`flex flex-col rounded-xl border p-3 transition ${menuEnabled ? 'border-blue-200 dark:border-blue-700/60 bg-white dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600/50 bg-white dark:bg-gray-800'
                                                                            } ${isActionLoading(`child-${menu.menu_id}`) ? 'opacity-60 pointer-events-none' : ''}`}>
                                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                                {isActionLoading(`child-${menu.menu_id}`) ? (
                                                                                    <div className="h-4 w-4 flex items-center justify-center">
                                                                                        {smallIcon}
                                                                                    </div>
                                                                                ) : (
                                                                                    <Checkbox type="checkbox" disabled={isActionLoading(`child-${menu.menu_id}`)} checked={menuEnabled}
                                                                                        onChange={(e) => onChild(menu.menu_id, selectUser.id, 'any', e.target.checked)}
                                                                                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 accent-[#1e3a5f]" />
                                                                                )}
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{menu.menu_name}</p>
                                                                                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">{menu.menu_path || t('noRoutePath')}</p>
                                                                                </div>
                                                                                {menuEnabled && !isActionLoading(`child-${menu.menu_id}`) && <FaCheckCircle className="text-[#1e3a5f] dark:text-blue-400 flex-shrink-0 text-sm" />}
                                                                            </label>
                                                                            {menuEnabled && <GranularCheckboxes menu={menu} uid={selectUser.id} />}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.section>
                                                    )}
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
