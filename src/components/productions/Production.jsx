import React, { useState, useEffect } from 'react';
import {
    FaSearch,
    FaPlus,
    FaFilter,
    FaSyncAlt,
    FaDownload,
    FaEye,
    FaTrash,
    FaList,
    FaDollarSign,
    FaBox,
    FaCalendarAlt,
    FaIndustry,
    FaFileAlt,
    FaUsers,
    FaClipboardList,
    FaChartBar,
    FaChevronLeft,
    FaChevronRight,
    FaTh,
    FaTimes,
    FaCheck,
    FaClock,
    FaEdit
} from 'react-icons/fa';
import {
    LuChevronLeft,
    LuChevronRight,
    LuChevronsLeft,
    LuChevronsRight,
    LuDownload,
    LuPlus,
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ExportExcel from '../../services/ExportExcel';
import { useGetAllProductionQuery } from '../../../app/Features/productSlice';
import { useDebounce } from 'use-debounce';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import AlertMessage from '../../services/AlertMessage';
import AlertBox from '../../services/AlertBox';
import ActionButton from '../../utils/ActionButton';
import Button from '../../utils/Button';
import RefreshButton from '../../utils/RefreshButton';

dayjs.extend(relativeTime);
const MENU_ID = 21;
const Production = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [productions, setProductions] = useState([]);
    const [filteredProductions, setFilteredProductions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 50, 100]
    });
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [showDeleted, setShowDeleted] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [sortConfig, setSortConfig] = useState({ field: null, order: null }); // for table sorting
    const [expandedRows, setExpandedRows] = useState({}); // for expandable materials in table
    const [deleteConfirmId, setDeleteConfirmId] = useState(null); // for custom delete confirmation
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [id, setId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { data, refetch, isLoading: queryLoading } = useGetAllProductionQuery({
        limit: pagination.pageSize,
        page: pagination.current,
        search: debouncedSearch,
        token
    });

    const ActionButtons = ({ item }) => {
        const actions = [
            // Confirm (Primary - Conditional)
            ...(item.status !== 'confirmed' ? [{
                type: 'modify',
                icon: <FaCheck size={14} />,
                onClick: () => handleSubmit(item.id),
                title: t('confirm'),
                label: t('confirm'),
                className: 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
            }] : []),
            // View (Primary)
            {
                type: 'view',
                icon: <FaEye size={14} />,
                onClick: () => navigate(`view/${item.id}`),
                title: t('view'),
                label: t('view')
            },
            // Edit (Primary - Conditional)
            ...(item.status !== 'confirmed' ? [{
                type: 'modify',
                icon: <FaEdit size={14} />,
                onClick: () => navigate(`/inventories/production/edit/${item.id}`),
                title: t('edit'),
                label: t('edit'),
                disabled: item.is_deleted === 1
            }] : []),
            // Delete (Overflow)
            {
                type: 'drop',
                icon: <FaTrash size={14} />,
                onClick: () => setDeleteConfirmId(item.id),
                title: t('delete'),
                label: t('delete')
            },
        ];

        return (
            <div className="flex justify-center">
                <ActionButton menuId={MENU_ID} actions={actions} />
            </div>
        );
    };

    // Update data when query returns
    useEffect(() => {
        setProductions(data?.data || []);
        setFilteredProductions(data?.data || []);
        setPagination(prev => ({
            ...prev,
            total: data?.pagination?.total || 0
        }));
    }, [data]);

    // Apply filters and sorting
    useEffect(() => {
        let filtered = productions || [];

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.production_no?.toLowerCase().includes(term) ||
                p.item_name?.toLowerCase().includes(term) ||
                p.item_code?.toLowerCase().includes(term) ||
                p.created_by_name?.toLowerCase().includes(term) ||
                p.details?.some(d =>
                    d.material_name?.toLowerCase().includes(term) ||
                    d.material_code?.toLowerCase().includes(term)
                )
            );
        }

        // Show deleted
        if (!showDeleted) {
            filtered = filtered.filter(p => p.is_deleted === 0);
        }

        // Status filter (active/deleted)
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p =>
                statusFilter === 'active' ? p.is_deleted === 0 : p.is_deleted === 1
            );
        }

        // Date range
        if (dateRange.start && dateRange.end) {
            const start = dayjs(dateRange.start).startOf('day');
            const end = dayjs(dateRange.end).endOf('day');
            filtered = filtered.filter(p => {
                const d = dayjs(p.production_date);
                return d.isAfter(start) && d.isBefore(end);
            });
        }

        // Sorting (if any)
        if (sortConfig.field && sortConfig.order) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.field];
                let bVal = b[sortConfig.field];
                if (sortConfig.field === 'production_date') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                } else if (sortConfig.field === 'quantity' || sortConfig.field === 'total_cost') {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                }
                if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredProductions(filtered);
    }, [productions, searchTerm, showDeleted, statusFilter, dateRange, sortConfig]);

    // Format helpers
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const formatDate = (date) => dayjs(date).format('MMM D, YYYY');

    // Statistics
    const stats = (() => {
        const active = filteredProductions.filter(p => p.is_deleted === 0);
        const totalCost = active.reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0);
        const totalQuantity = active.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
        return {
            totalProductions: productions?.length || 0,
            totalActive: active.length,
            totalDeleted: (productions?.length || 0) - active.length,
            totalCost,
            totalQuantity,
            avgCostPerProduction: active.length > 0 ? totalCost / active.length : 0,
            avgQuantityPerProduction: active.length > 0 ? totalQuantity / active.length : 0
        };
    })();

    // Handlers
    const handleDelete = async (id) => {
        setDeleteConfirmId(null);
        try {
            setLoading(true);
            const res = await api.delete(`/production/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                toast.success(t('productionRecordDeleted'));
                refetch();
            }
        } catch (error) {
            toast.error(t('deleteFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (id) => {
        event.preventDefault();
        setId(id);
        setIsOpen(true);
    }

    const handleSort = (field) => {
        let order = 'asc';
        if (sortConfig.field === field && sortConfig.order === 'asc') {
            order = 'desc';
        } else if (sortConfig.field === field && sortConfig.order === 'desc') {
            order = null;
        }
        setSortConfig({ field: order ? field : null, order });
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current: page }));
    };

    const handlePageSizeChange = (e) => {
        const size = parseInt(e.target.value);
        setPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
    };

    const toggleExpandRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleConfirm = async () => {
        setId(id);
        event.preventDefault();
        try {            
            setLoading(true);
            const res = await api.put(`/confirm_production/${id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200) {
                toast.success(t('productionConfirmed'));
                refetch();
            }
        } catch (error) {
            toast.error(t('confirmFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Custom delete confirmation modal
    const DeleteConfirmModal = () => {
        if (!deleteConfirmId) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('deleteProductionRecord')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{t('confirmDeleteProduction')}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={() => handleDelete(deleteConfirmId)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            {t('delete')}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Custom components
    const Badge = ({ isDeleted }) => {
        if (isDeleted === 1) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('deleted')}</span>;
        }
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('active')}</span>;
    };

    const Avatar = ({ src, name, size = 40 }) => {
        const [error, setError] = useState(false);
        if (src && !error) {
            return <img src={src} alt={name} className={`w-${size / 4} h-${size / 4} rounded object-cover border border-gray-200 dark:border-gray-700`} onError={() => setError(true)} />;
        }
        return (
            <div className={`w-${size / 4} h-${size / 4} bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg`}>
                {name?.charAt(0) || 'P'}
            </div>
        );
    };

    const StatCard = ({ title, value, subValue, icon, color = 'blue' }) => {
        return (
            <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-white to-${color}-50 dark:from-gray-800 dark:to-${color}-900/10 transition-all`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                        {subValue && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subValue}</p>}
                    </div>
                    <div className={`p-3 bg-gradient-to-r from-${color}-100 to-${color}-200 dark:from-${color}-900/30 dark:to-${color}-800/20 rounded-full text-${color}-600 dark:text-${color}-400`}>
                        {icon}
                    </div>
                </div>
            </div>
        );
    };

    // Pagination component
    const Pagination = () => {
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        const start = (pagination.current - 1) * pagination.pageSize + 1;
        const end = Math.min(pagination.current * pagination.pageSize, pagination.total);
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('rowsPerPage')}:</span>
                    <select
                        value={pagination.pageSize}
                        onChange={handlePageSizeChange}
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    >
                        {pagination.pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.current === 1}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <LuChevronsLeft />
                    </button>
                    <button
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <LuChevronLeft />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('page')} {pagination.current} {t('of')} {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <LuChevronRight />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                        <LuChevronsRight />
                    </button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('showing')} {start} {t('to')} {end} {t('of')} {pagination.total} {t('productions')}
                </div>
            </div>
        );
    };

    // Table View
    const TableView = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const paginatedData = filteredProductions.slice(start, start + pagination.pageSize);

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 w-16">#</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('production_no')}>
                                    {t('productionNo')} {sortConfig.field === 'production_no' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('production_date')}>
                                    {t('date')} {sortConfig.field === 'production_date' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('product')}</th>
                                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('quantity')}>
                                    {t('quantity')} {sortConfig.field === 'quantity' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('total_cost')}>
                                    {t('cost')} {sortConfig.field === 'total_cost' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('costPerUnit')}</th>
                                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('materials')}</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('createdBy')}</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('status')}</th>
                                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, idx) => {
                                const index = start + idx + 1;
                                const isExpanded = expandedRows[item.id];
                                const costPerUnit = item.quantity > 0 ? Number(item.total_cost) / Number(item.quantity) : 0;
                                return (
                                    <React.Fragment key={item.id}>
                                        <tr className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${item.is_deleted === 1 ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                            <td className="p-3 text-center text-gray-600 dark:text-gray-400">{index}</td>
                                            <td className="p-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{item.production_no}</td>
                                            <td className="p-3">
                                                <div className="font-medium text-gray-900 dark:text-white">{formatDate(item.production_date)}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{dayjs(item.production_date).fromNow()}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar src={item.image?.image} name={item.item_name} size={40} />
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{item.item_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.item_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.quantity}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('unitsCount')}</div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(item.total_cost)}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('total')}</div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(costPerUnit)}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{t('perUnit')}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => toggleExpandRow(item.id)}
                                                    disabled={!item.details?.length}
                                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${item.details?.length ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 cursor-pointer hover:bg-blue-200' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'}`}
                                                    title={item.details?.length ? t('showMaterials') : t('noMaterials')}
                                                >
                                                    <FaClipboardList className="mr-1" />
                                                    {item.details?.length || 0}
                                                </button>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium dark:text-gray-300 transition-colors">
                                                        {item.created_by_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="text-sm dark:text-gray-300">{item.created_by_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3"><Badge isDeleted={item.is_deleted} /></td>
                                            <td className="p-3">
                                                <ActionButtons item={item} />
                                            </td>
                                        </tr>
                                        {isExpanded && item.details?.length > 0 && (
                                            <tr className="bg-gray-50 dark:bg-gray-900/30 transition-colors">
                                                <td colSpan="11" className="p-3">
                                                    <div className="border dark:border-gray-700 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-semibold text-gray-700 dark:text-gray-300">{t('rawMaterialsUsed')}</h4>
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">{item.details.length} {t('materials')}</span>
                                                        </div>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr className="border-b dark:border-gray-700">
                                                                    <th className="py-2 text-left font-medium text-gray-600 dark:text-gray-400">{t('material')}</th>
                                                                    <th className="py-2 text-center font-medium text-gray-600 dark:text-gray-400">{t('quantity')}</th>
                                                                    <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">{t('costPerUnit')}</th>
                                                                    <th className="py-2 text-right font-medium text-gray-600 dark:text-gray-400">{t('totalCost')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {item.details.map((d, i) => (
                                                                    <tr key={d.id || i} className="border-b dark:border-gray-700 last:border-0">
                                                                        <td className="py-2">
                                                                            <div className="font-medium dark:text-gray-200">{d.material_name}</div>
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{d.material_code}</div>
                                                                        </td>
                                                                        <td className="py-2 text-center dark:text-gray-300">{d.quantity}</td>
                                                                        <td className="py-2 text-right text-green-600 dark:text-green-400">{formatCurrency(d.cost_per_unit)}</td>
                                                                        <td className="py-2 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(d.total_cost)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination />
            </div>
        );
    };

    // Grid View
    const GridView = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const paginatedData = filteredProductions.slice(start, start + pagination.pageSize);

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedData.map((item) => {
                    const costPerUnit = item.quantity > 0 ? Number(item.total_cost) / Number(item.quantity) : 0;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${item.is_deleted === 1 ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{item.production_no}</span>
                                    <Badge isDeleted={item.is_deleted} />
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <Avatar src={item.image?.image} name={item.item_name} size={48} />
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{item.item_name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.item_code}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(item.production_date)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.quantity}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('unitsCount')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(item.total_cost)}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('totalCost')}</div>
                                    </div>
                                </div>
                                <div className="text-center mb-3">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('costPerUnit')}</div>
                                    <div className="font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(costPerUnit)}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">{t('materials')}:</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs">{item.details?.length || 0}</span>
                                    </div>
                                    {item.details && item.details.length > 0 && (
                                        <div className="space-y-1 max-h-24 overflow-y-auto text-xs dark:scrollbar-thin dark:scrollbar-thumb-gray-700">
                                            {item.details.slice(0, 3).map((d, i) => (
                                                <div key={d.id || i} className="flex justify-between">
                                                    <span className="truncate max-w-[100px] dark:text-gray-300">{d.material_name}</span>
                                                    <span className="text-gray-500 dark:text-gray-400">{d.quantity} × {formatCurrency(d.cost_per_unit)}</span>
                                                </div>
                                            ))}
                                            {item.details.length > 3 && (
                                                <div className="text-center text-gray-500 dark:text-gray-500">+{item.details.length - 3} {t('more')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm mb-4">
                                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium dark:text-gray-300 transition-colors">
                                        {item.created_by_name?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-400">{t('by')} {item.created_by_name}</span>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                                    <ActionButtons item={item} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-transparent p-4 md:p-6 view-page"
        >
            <DeleteConfirmModal />
            <AlertBox
                message={'Are you sure that you want confirm and add to stock'}
                isOpen={isOpen}
                onCancel={() => setIsOpen(false)}
                title={'Confirm Production'}
                confirmText='Confirm'
                cancelText='No'
                onConfirm={handleConfirm}
             />

            <div className="mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3"
                        >
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm transition-all">
                                <FaIndustry className="text-xl text-white" />
                            </div>
                            {t('productionRecords')}
                        </motion.h1>
                        <p className="text-gray-600 dark:text-gray-400 text-md">{t('manageTrackProductionBatches')}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <RefreshButton onRefresh={refetch}/>
                        <ExportExcel
                            data={filteredProductions.map(p => ({
                                [t('productionNo')]: p.production_no,
                                [t('date')]: formatDate(p.production_date),
                                [t('product')]: p.item_name,
                                [t('itemCode')]: p.item_code,
                                [t('quantity')]: p.quantity,
                                [t('totalCost')]: formatCurrency(p.total_cost),
                                [t('costPerUnit')]: formatCurrency(p.quantity > 0 ? Number(p.total_cost) / Number(p.quantity) : 0),
                                [t('createdBy')]: p.created_by_name,
                                [t('status')]: p.is_deleted === 0 ? t('active') : t('deleted'),
                                [t('materials')]: p.details?.length || 0,
                            }))}
                            title="Production_Records_Report"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md"
                        >
                            <LuDownload />
                            {t('export')}
                        </ExportExcel>
                        <Link to="create">
                            <Button actionType='is_modify' menuId={MENU_ID} variant='save'>
                                <LuPlus />
                                {t('newProduction')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-3">
                    <StatCard
                        title={t('totalProductions')}
                        value={stats.totalProductions.toLocaleString()}
                        subValue={`${stats.totalActive} ${t('active')} • ${stats.totalDeleted} ${t('deleted')}`}
                        icon={<FaIndustry className="text-2xl" />}
                        color="blue"
                    />
                    <StatCard
                        title={t('totalQuantity')}
                        value={stats.totalQuantity.toLocaleString()}
                        subValue={t('unitsProduced')}
                        icon={<FaBox className="text-2xl" />}
                        color="green"
                    />
                    <StatCard
                        title={t('totalCost')}
                        value={formatCurrency(stats.totalCost)}
                        subValue={t('productionCost')}
                        icon={<FaDollarSign className="text-2xl" />}
                        color="purple"
                    />
                    <StatCard
                        title={t('avgPerProduction')}
                        value={formatCurrency(stats.avgCostPerProduction)}
                        subValue={`${t('cost')} • ${stats.avgQuantityPerProduction.toFixed(1)} ${t('unitsCount')}`}
                        icon={<FaChartBar className="text-2xl" />}
                        color="orange"
                    />
                </div>

                {/* Filters and Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border text-sm border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="lg:col-span-4 grow">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('searchProductionPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    <FaList />
                                    <span>{t('table')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                                >
                                    <FaTh />
                                    <span>{t('grid')}</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateRange.start ? dayjs(dateRange.start).format('YYYY-MM-DD') : ''}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? dayjs(e.target.value) : null }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder={t('startDate')}
                            />
                            <span className="dark:text-gray-500">-</span>
                            <input
                                type="date"
                                value={dateRange.end ? dayjs(dateRange.end).format('YYYY-MM-DD') : ''}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? dayjs(e.target.value) : null }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder={t('endDate')}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading || queryLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">{t('loadingProductionRecords')}</p>
                    </div>
                ) : filteredProductions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 transition-colors">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                            <FaIndustry className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">{t('noProductionRecordsFound')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                            {searchTerm || statusFilter !== 'all' || showDeleted || dateRange.start
                                ? t('noRecordsMatchFiltersProduction')
                                : t('startCreatingFirstProductionBatch')}
                        </p>
                        {!searchTerm && statusFilter === 'all' && !showDeleted && !dateRange.start && (
                            <Link to="/home/production/create">
                                <button className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                                    <FaPlus /> {t('createFirstProduction')}
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    viewMode === 'table' ? <TableView /> : <GridView />
                )}

                {/* Pagination for grid view */}
                {viewMode === 'grid' && filteredProductions.length > 0 && (
                    <div className="mt-6">
                        <Pagination />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Helper Link component to avoid react-router import issues
const Link = ({ to, children }) => {
    const navigate = useNavigate();
    return (
        <a href={to} onClick={(e) => { e.preventDefault(); navigate(to); }} className="cursor-pointer">
            {children}
        </a>
    );
};

export default Production;
