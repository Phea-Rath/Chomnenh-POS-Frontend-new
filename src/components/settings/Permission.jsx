import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FaUserCircle, FaShieldAlt, FaSearch, FaChevronRight, FaCheckCircle, FaProjectDiagram } from 'react-icons/fa';
import { FiShield, FiUsers, FiLock, FiUnlock, FiCommand, FiActivity } from 'react-icons/fi';
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import { useGetCurrentMenusByUserWebsiteQuery } from "@/features/auth/menusSlice";
import { useGetPermissionByIdQuery } from "@/features/auth/permissionSlice";
import { toast } from 'react-toastify';
import api from '../../services/api';
import { Checkbox, Select, Tag, Spin, Tooltip, Progress } from 'antd';
import { IoArrowBack, IoGridOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router';
import { useOutletsContext } from '../../layouts/Management';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingOutlined } from '@ant-design/icons';
import RefreshButton from '../../utils/RefreshButton';
import { getToken } from '@/utils/tokenStore';

// --- Internal Sub-components ---

const GranularPermissions = ({ menu, uid, isActionLoading, onUpdate, t, smallIcon }) => {
    const fields = [
        { id: 'is_view', label: t('view', 'View'), color: 'cyan' },
        { id: 'is_modify', label: t('modify', 'Modify'), color: 'emerald' },
        { id: 'is_drop', label: t('drop', 'Drop'), color: 'rose' },
        { id: 'is_execute', label: t('execute', 'Execute'), color: 'purple' },
    ];

    return (
        <div className="flex flex-wrap gap-1.5 mt-2.5 ml-7 select-none">
            {fields.map((field) => {
                const isChecked = menu[field.id] === 1;
                const actionId = `granular-${menu.menu_id}-${field.id}`;
                const isLoading = isActionLoading(actionId);

                return (
                    <label 
                        key={field.id} 
                        className={`
                            group flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight
                            border cursor-pointer transition-all duration-200 active:scale-95
                            ${isChecked 
                                ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm' 
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-cyan-300 hover:text-cyan-600 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-400'
                            }
                            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                        `}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-1">
                                {smallIcon}
                                <span>{field.label}</span>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => onUpdate(uid, menu.menu_id, field.id, e.target.checked, menu)}
                                    className="sr-only"
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

const UserSidebarItem = ({ employee, isActive, onClick }) => {
    return (
        <button 
            type="button" 
            onClick={() => onClick(employee.id)}
            className={`
                group flex w-full items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 px-5 py-4 text-left transition-all relative
                ${isActive
                    ? 'bg-cyan-50/80 dark:bg-cyan-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }
            `}
        >
            {isActive && (
                <motion.div layoutId="active-pill" className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-600 dark:bg-cyan-400" />
            )}
            
            <div className="relative flex-shrink-0">
                {employee?.image ? (
                    <img 
                        src={employee.image} 
                        alt="" 
                        className="h-11 w-11 rounded-xl object-cover shadow-sm ring-2 ring-white dark:ring-gray-800" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} 
                    />
                ) : null}
                <div 
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0 text-gray-400 border border-gray-200 dark:border-gray-600"
                    style={{ display: employee?.image ? 'none' : 'flex' }}
                >
                    <FaUserCircle className="h-6 w-6" />
                </div>
                {employee.status && (
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 bg-emerald-500 shadow-sm" />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className={`truncate text-sm font-bold transition-colors ${isActive ? 'text-cyan-700 dark:text-cyan-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {employee.username}
                    </h3>
                </div>
                <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{employee.role}</p>
            </div>
            
            <FaChevronRight className={`h-3 w-3 transition-transform duration-200 ${isActive ? 'translate-x-1 text-cyan-500' : 'text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5'}`} />
        </button>
    );
};

const Permission = () => {
    const { t } = useTranslation();
    const token = getToken();
    const userId = localStorage.getItem('userId');
    const [activeActions, setActiveActions] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectUser, setSelectUser] = useState(null);
    const [menuPer, setMenuPer] = useState([]);
    const [isAllperm, setAllperm] = useState(false);
    
    const navigator = useNavigate();
    const smallIcon = <LoadingOutlined style={{ fontSize: 12 }} spin />;

    const isActionLoading = useCallback((id) => activeActions.has(id), [activeActions]);
    
    const startAction = (id) => setActiveActions(prev => new Set(prev).add(id));
    const stopAction = (id) => setActiveActions(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });

    const { data: userResponse, refetch: refetchUsers, isFetching: isUsersLoading } = useGetAllUserQuery(token);
    
    const { data: menusResponse, refetch: refetchMenus, isFetching: isMenusLoading } = useGetCurrentMenusByUserWebsiteQuery(
        { id: selectUser?.id || userId, token },
        { skip: !token }
    );

    // --- Memoized Logic ---

    const flattenMenus = useCallback((items = []) =>
        items.flatMap((item) => [item, ...(item?.menus?.length ? flattenMenus(item.menus) : [])]), 
    []);

    const usersList = useMemo(() => {
        if (!userResponse?.data) return [];
        return userResponse.data.filter((i) => i.id != userId && i.role_id !== 2);
    }, [userResponse, userId]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return usersList;
        const lowerSearch = searchTerm.toLowerCase();
        return usersList.filter(
            (u) => u.username.toLowerCase().includes(lowerSearch) ||
                  u.role.toLowerCase().includes(lowerSearch)
        );
    }, [searchTerm, usersList]);

    const allMenusFlat = useMemo(() => {
        if (!menusResponse?.data) return [];
        const flattened = flattenMenus(menusResponse.data);
        return flattened.filter((i) => i.menu_type !== 0 && i.menu_type !== '0');
    }, [menusResponse, flattenMenus]);

    const menuTree = useMemo(() => {
        if (!menuPer?.length) return [];
        const map = {};
        const tree = [];
        
        menuPer.forEach((item) => { 
            map[Number(item.menu_id)] = { ...item, children: [] }; 
        });
        
        menuPer.forEach((item) => {
            const menuId = Number(item.menu_id);
            const parentId = item.parent_menu === null || item.parent_menu === '' ? null : Number(item.parent_menu);
            if (parentId !== null && map[parentId]) {
                map[parentId].children.push(map[menuId]);
            } else {
                tree.push(map[menuId]);
            }
        });

        const sortTree = (nodes) => nodes
            .sort((a, b) => Number(a.order_menu || 0) - Number(b.order_menu || 0))
            .map((node) => ({ ...node, children: sortTree(node.children || []) }));
            
        return sortTree(tree);
    }, [menuPer]);

    // --- Classification Logic ---
    const categorizedMenus = useMemo(() => {
        const groups = menuTree;
        return {
            functional: groups.filter((m) => m.children?.length > 0 || (m.base_on !== 'single' && m.base_on !== 'function')),
            single: groups.filter((m) => m.children?.length === 0 && m.base_on === 'single'),
            utility: groups.filter((m) => m.children?.length === 0 && m.base_on === 'function'),
        };
    }, [menuTree]);

    // --- Effects ---

    useEffect(() => {
        if (usersList.length > 0 && !selectUser) {
            setSelectUser(usersList[0]);
        }
    }, [usersList, selectUser]);

    useEffect(() => {
        if (allMenusFlat.length > 0) {
            const perms = allMenusFlat.map((menu) => ({ 
                ...menu, 
                enabled: menu.active ? 1 : 0, 
                user_id: selectUser?.id 
            }));
            setAllperm(perms.every(p => p.enabled === 1));
            setMenuPer(perms);
        }
    }, [allMenusFlat, selectUser]);

    // --- Handlers ---

    const handleUserChange = (id) => {
        const selected = usersList.find(u => u.id == id);
        if (selected) setSelectUser(selected);
    };

    const updatePermissionState = async (menuIds, uid, type, isAdding, actionId) => {
        try {
            startAction(actionId);
            if (isAdding) {
                await api.post('permission', { user_id: uid, menu_ids: menuIds }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await api.put(`permission-remove/${uid}`, menuIds, { headers: { Authorization: `Bearer ${token}` } });
            }
            await Promise.all([refetchMenus(), refetchUsers()]);
        } catch (err) {
            toast.error(isAdding ? t('failedAddPerm') : t('failedRemovePerm'));
        } finally {
            stopAction(actionId);
        }
    };

    const handleGranularUpdate = async (uid, menuId, field, value, currentPerms) => {
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

    const toggleAllPermissions = (isChecked) => {
        const allIds = menuPer.map(m => m.menu_id);
        setAllperm(isChecked);
        setMenuPer(prev => prev.map(p => ({ ...p, enabled: isChecked ? 1 : 0 })));
        updatePermissionState(allIds, selectUser.id, 'all', isChecked, 'all-permissions');
    };

    const handleParentToggle = (menuId, checked) => {
        const actionId = `parent-${menuId}`;
        const children = menuPer.filter(m => Number(m.parent_menu) === Number(menuId));
        const targetIds = [menuId, ...children.map(c => c.menu_id)];
        
        setMenuPer(prev => prev.map(n => targetIds.includes(n.menu_id) ? { ...n, enabled: checked ? 1 : 0 } : n));
        updatePermissionState(targetIds, selectUser.id, 'parent', checked, actionId);
    };

    const handleChildToggle = (menuId, checked) => {
        const actionId = `child-${menuId}`;
        setMenuPer(prev => prev.map(n => n.menu_id === menuId ? { ...n, enabled: checked ? 1 : 0 } : n));
        updatePermissionState([menuId], selectUser.id, 'child', checked, actionId);
    };

    const enabledCount = menuPer.filter(p => p.enabled === 1).length;
    const progressPct = menuPer.length > 0 ? Math.round((enabledCount / menuPer.length) * 100) : 0;

    const getMenuTypeLabel = (menuType) => {
        const labels = { 1: 'sidebar', 2: 'home', 3: 'settings', 4: 'report', 5: 'inventory', 6: 'footer' };
        return labels[Number(menuType)] || 'system';
    };

    // --- Styles ---
    const inputCls = 'w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all text-sm';

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-transparent">
            {/* Top Navigation Bar */}
            <motion.header 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigator(-1)}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <IoArrowBack size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-600 rounded-lg text-white shadow-cyan-200 dark:shadow-none shadow-md">
                            <FiShield size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">{t('permissionsTitle')}</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('permissionsSubtitle')}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isMenusLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 18 }} spin />} />}
                    <RefreshButton onRefresh={() => { refetchMenus(); refetchUsers(); }} />
                </div>
            </motion.header>

            <div className="grid lg:grid-cols-[320px_1fr] h-[calc(100vh-65px)]">
                
                {/* --- Left Sidebar: User Directory --- */}
                <aside className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-2">
                            <FiUsers className="text-cyan-600 dark:text-cyan-400" />
                            <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">{t('teamMembers')}</h2>
                        </div>
                        <div className="relative">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder={t('searchUsers')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((emp) => (
                                <UserSidebarItem 
                                    key={emp.id} 
                                    employee={emp} 
                                    isActive={selectUser?.id === emp.id} 
                                    onClick={handleUserChange} 
                                />
                            ))
                        ) : (
                            <div className="p-10 text-center">
                                <p className="text-sm text-gray-400 font-medium">{t('noUsersFound')}</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- Main Workspace --- */}
                <main className="overflow-y-auto bg-gray-50/30 dark:bg-transparent flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectUser ? (
                            <motion.div 
                                key={selectUser.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col flex-1"
                            >
                                {/* Active User Profile Header */}
                                <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                {selectUser.image ? (
                                                    <img src={selectUser.image} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-cyan-50 dark:ring-cyan-900/20" alt="" />
                                                ) : (
                                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 dark:from-cyan-900/30 dark:to-indigo-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                                        <FaUserCircle size={40} />
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-2 -right-2 p-1.5 bg-cyan-600 rounded-lg text-white shadow-lg">
                                                    <FiShield size={14} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{selectUser.username}</h2>
                                                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-[10px] font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-widest border border-cyan-100 dark:border-cyan-800">
                                                        {selectUser.role}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('selectModulesDesc')}</p>
                                            </div>
                                        </div>

                                        {/* Progress and Global Toggle */}
                                        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                                            <div className="flex flex-col gap-2 min-w-[140px]">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                                    <span>{t('accessProgress')}</span>
                                                    <span className="text-cyan-600">{progressPct}%</span>
                                                </div>
                                                <Progress 
                                                    percent={progressPct} 
                                                    showInfo={false} 
                                                    strokeColor={{ '0%': '#10b981', '100%': '#3b82f6' }}
                                                    trailColor="rgba(0,0,0,0.05)"
                                                    strokeWidth={6}
                                                />
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    {enabledCount} {t('ofItemsEnabled', { total: menuPer.length })}
                                                </span>
                                            </div>

                                            <div className="h-12 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

                                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-600">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        {isAllperm ? <FiUnlock className="text-emerald-500" /> : <FiLock className="text-orange-500" />}
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                                                            {isAllperm ? t('fullAccess') : t('customAccess')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Tooltip title={isAllperm ? t('revokeAll') : t('grantAll')}>
                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={isAllperm}
                                                            disabled={isActionLoading('all-permissions')}
                                                            onChange={(e) => toggleAllPermissions(e.target.checked)}
                                                        />
                                                        {isActionLoading('all-permissions') ? (
                                                            <div className="h-6 w-11 flex items-center justify-center">{smallIcon}</div>
                                                        ) : (
                                                            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
                                                        )}
                                                    </label>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Permissions Scroller */}
                                <div className="p-6 flex-1 max-w-7xl mx-auto w-full">
                                    {menuPer.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-8 pb-10">
                                            
                                            {/* --- Section 1: Functional Business Groups --- */}
                                            {categorizedMenus.functional.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <IoGridOutline className="text-cyan-500" />
                                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">{t('businessUnits', 'Business Units')}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {categorizedMenus.functional.map((parent, idx) => {
                                                            const isEnabled = parent.enabled === 1;
                                                            const loadingId = `parent-${parent.menu_id}`;
                                                            return (
                                                                <motion.div 
                                                                    key={parent.menu_id}
                                                                    initial={{ opacity: 0, y: 20 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.05 }}
                                                                    className={`group rounded-3xl border-2 transition-all duration-300 shadow-sm ${isEnabled 
                                                                        ? 'border-cyan-600/10 bg-white dark:bg-cyan-900/5' 
                                                                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'}`}
                                                                >
                                                                    {/* Parent Header */}
                                                                    <div className="p-5 border-b border-gray-50 dark:border-gray-700/50 flex items-start justify-between bg-gray-50/50 dark:bg-gray-800/50 rounded-t-3xl">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2.5 mb-1.5">
                                                                                <div className={`p-2 rounded-xl transition-colors ${isEnabled ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                                                                    <FiActivity size={16} />
                                                                                </div>
                                                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 truncate">{parent.menu_name}</h4>
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-10">
                                                                                {getMenuTypeLabel(parent.menu_type)} · {parent.menu_path}
                                                                            </span>
                                                                            {isEnabled && (
                                                                                <GranularPermissions 
                                                                                    menu={parent} uid={selectUser.id} t={t} smallIcon={smallIcon}
                                                                                    isActionLoading={isActionLoading} onUpdate={handleGranularUpdate}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                        <Checkbox 
                                                                            className="mt-1" 
                                                                            checked={isEnabled} 
                                                                            loading={isActionLoading(loadingId)}
                                                                            onChange={(e) => handleParentToggle(parent.menu_id, e.target.checked)}
                                                                        />
                                                                    </div>
                                                                    
                                                                    {/* Children Grid */}
                                                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {parent.children.map(child => {
                                                                            const cEnabled = child.enabled === 1;
                                                                            const cLoadingId = `child-${child.menu_id}`;
                                                                            return (
                                                                                <div 
                                                                                    key={child.menu_id}
                                                                                    className={`p-3 rounded-2xl border transition-all ${cEnabled 
                                                                                        ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10' 
                                                                                        : 'border-gray-100 dark:border-gray-700 bg-transparent opacity-60 grayscale'}`}
                                                                                >
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                                            <FiCommand size={12} className={cEnabled ? 'text-cyan-500' : 'text-gray-400'} />
                                                                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{child.menu_name}</span>
                                                                                        </div>
                                                                                        <Checkbox 
                                                                                            size="small"
                                                                                            checked={cEnabled} 
                                                                                            disabled={!isEnabled}
                                                                                            loading={isActionLoading(cLoadingId)}
                                                                                            onChange={(e) => handleChildToggle(child.menu_id, e.target.checked)}
                                                                                        />
                                                                                    </div>
                                                                                    {cEnabled && (
                                                                                        <GranularPermissions 
                                                                                            menu={child} uid={selectUser.id} t={t} smallIcon={smallIcon}
                                                                                            isActionLoading={isActionLoading} onUpdate={handleGranularUpdate}
                                                                                        />
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- Section 2: Core Platform Modules --- */}
                                            {categorizedMenus.single.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <FiCommand className="text-emerald-500" />
                                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">{t('coreModules', 'Core Modules')}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {categorizedMenus.single.map((menu) => {
                                                            const mEnabled = menu.enabled === 1;
                                                            const mLoadingId = `child-${menu.menu_id}`;
                                                            return (
                                                                <div key={menu.menu_id} className={`p-4 rounded-3xl border-2 transition-all bg-white dark:bg-gray-800 ${mEnabled ? 'border-emerald-500/10 shadow-md' : 'border-transparent'}`}>
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`p-2 rounded-xl ${mEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                                                <FiActivity size={14} />
                                                                            </div>
                                                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{menu.menu_name}</span>
                                                                        </div>
                                                                        <Checkbox 
                                                                            checked={mEnabled}
                                                                            loading={isActionLoading(mLoadingId)}
                                                                            onChange={(e) => handleChildToggle(menu.menu_id, e.target.checked)}
                                                                        />
                                                                    </div>
                                                                    {mEnabled && (
                                                                        <GranularPermissions 
                                                                            menu={menu} uid={selectUser.id} t={t} smallIcon={smallIcon}
                                                                            isActionLoading={isActionLoading} onUpdate={handleGranularUpdate}
                                                                        />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- Section 3: System Functions --- */}
                                            {categorizedMenus.utility.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-1">
                                                        <FaProjectDiagram className="text-purple-500" />
                                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">{t('systemFunctions', 'System Functions')}</h3>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4">
                                                        {categorizedMenus.utility.map((menu) => {
                                                            const mEnabled = menu.enabled === 1;
                                                            const mLoadingId = `child-${menu.menu_id}`;
                                                            return (
                                                                <div key={menu.menu_id} className={`px-4 py-3 rounded-2xl border flex items-center gap-4 transition-all bg-white dark:bg-gray-800 ${mEnabled ? 'border-purple-500/20 bg-purple-50/10' : 'border-gray-100 dark:border-gray-700'}`}>
                                                                    <Checkbox 
                                                                        checked={mEnabled}
                                                                        loading={isActionLoading(mLoadingId)}
                                                                        onChange={(e) => handleChildToggle(menu.menu_id, e.target.checked)}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{menu.menu_name}</span>
                                                                        {mEnabled && (
                                                                            <GranularPermissions 
                                                                                menu={menu} uid={selectUser.id} t={t} smallIcon={smallIcon}
                                                                                isActionLoading={isActionLoading} onUpdate={handleGranularUpdate}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ) : (
                                        <div className="h-[60vh] flex items-center justify-center">
                                            <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-20 text-center">
                                <div className="max-w-md">
                                    <div className="mb-6 mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                                        <FiUsers size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('noUserSelected')}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{t('noUserSelectedDesc')}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Permission;
