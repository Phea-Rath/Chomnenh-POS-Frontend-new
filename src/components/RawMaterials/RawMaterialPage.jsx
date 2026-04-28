import React, { useState, useEffect } from 'react';
import {
    LuSearch,
    LuPlus,
    LuRefreshCw,
    LuDownload,
    LuEye,
    LuTrash2,
    LuList,
    LuDollarSign,
    LuPackage,
    LuScale,
    LuCalendar,
    LuGrid3X3,
    LuChevronLeft,
    LuChevronRight,
    LuChevronsLeft,
    LuChevronsRight,
    LuX
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link, useNavigate } from 'react-router';
import ExportExel from '../../services/ExportExel';
import { BiEdit } from 'react-icons/bi';
import api from '../../services/api';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

dayjs.extend(relativeTime);

const RawMaterials = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        pageSizeOptions: [10, 20, 50, 100]
    });
    const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showDeleted, setShowDeleted] = useState(false);
    const [sortConfig, setSortConfig] = useState({ field: null, order: null }); // for table sorting
    const [deleteConfirmId, setDeleteConfirmId] = useState(null); // for custom delete modal

    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const { data: raw, refetch, isLoading: queryLoading } = useGetAllRawMaterialQuery({
        limit: pagination.pageSize,
        page: pagination.current,
        search: debouncedSearch,
        token
    });

    // Update data when query returns
    useEffect(() => {
        const data = raw?.data || [];

        setPagination(prev => ({
            ...prev,
            current: raw?.pagination?.current_page || prev.current,
            pageSize: raw?.pagination?.per_page || prev.pageSize,
            total: raw?.pagination?.total || 0
        }));
        setMaterials(data);
        setFilteredMaterials(data);
    }, [raw]);

    // Apply filters and search
    useEffect(() => {
        let filtered = [...materials];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(m =>
                m.material_name?.toLowerCase().includes(term) ||
                m.material_code?.toLowerCase().includes(term) ||
                m.material_description?.toLowerCase().includes(term)
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(m => m.category === selectedCategory);
        }

        if (sortConfig.field && sortConfig.order) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.field];
                let bVal = b[sortConfig.field];
                if (sortConfig.field === 'material_cost') {
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                } else if (sortConfig.field === 'created_at') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        setFilteredMaterials(filtered);
    }, [materials, searchTerm, selectedCategory, showDeleted, sortConfig]);

    // Handle pagination change
    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current: page }));
    };

    const handlePageSizeChange = (e) => {
        const size = parseInt(e.target.value);
        setPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
    };

    // Handle sort
    const handleSort = (field) => {
        let order = 'asc';
        if (sortConfig.field === field && sortConfig.order === 'asc') {
            order = 'desc';
        } else if (sortConfig.field === field && sortConfig.order === 'desc') {
            order = null;
        }
        setSortConfig({ field: order ? field : null, order });
    };

    // Handle delete
    const handleDelete = async (id) => {
        setDeleteConfirmId(null);
        try {
            setLoading(true);
            const response = await api.delete(`/raw_materials/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 200) {
                toast.success(t('materialDeletedSuccessfully'));
                refetch();
            }
        } catch (error) {
            toast.error(t('failedToDeleteMaterial'));
        } finally {
            setLoading(false);
        }
    };

    // Format helpers
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };
    const formatDate = (date) => dayjs(date).format('MMM D, YYYY');
    const formatQuantity = (amount) => Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const getImageSrc = (material) => {
        if (typeof material?.material_image === 'string' && material.material_image.trim()) return material.material_image;
        if (typeof material?.image === 'string' && material.image.trim()) return material.image;
        return '';
    };
    const getStockData = (material) => material?.stock || {};
    const getStockValue = (material, field) => getStockData(material)?.[field] ?? 0;
    
    const stockSummaryFields = [
        { key: 'stock_in', label: t('stockIn'), tone: 'text-emerald-600 dark:text-emerald-400' },
        { key: 'stock_return', label: t('returned'), tone: 'text-sky-600 dark:text-sky-400' },
        { key: 'stock_out', label: t('stockOut'), tone: 'text-orange-500 dark:text-orange-400' },
        { key: 'stock_wasted', label: t('wasted'), tone: 'text-rose-500 dark:text-rose-400' },
    ];
    
    const stockFields = [
        { key: 'in_stock', label: t('inStock') },
        { key: 'stock_in', label: t('stockIn') },
        { key: 'stock_out', label: t('stockOut') },
        { key: 'stock_return', label: t('returned') },
        { key: 'stock_wasted', label: t('wasted') },
    ];

    // Export data
    const exportData = filteredMaterials.map(m => ({
        [t('id')]: m.id,
        [t('productName')]: m.material_name,
        [t('itemCode')]: m.material_code,
        [t('description')]: m.material_description,
        [t('primaryUnit')]: m.primary_unit,
        [t('secondaryUnitOptional')]: m.secondary_unit || 'N/A',
        [t('conversionValue')]: m.conversion_value || 'N/A',
        [t('cost')]: formatCurrency(m.material_cost),
        [t('status')]: m.is_deleted === 0 ? t('active') : t('deleted'),
        [t('created')]: formatDate(m.created_at)
    }));

    // Custom components
    const Avatar = ({ src, alt, size = 40, className = '' }) => {
        const [error, setError] = useState(false);
        if (src && !error) {
            return <img src={src} alt={alt} className={className || 'h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700'} onError={() => setError(true)} />;
        }
        return (
            <div className={`${className || 'h-10 w-10 rounded'} flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-blue-50 dark:from-gray-700 dark:to-gray-800 text-blue-700 dark:text-blue-400`}>
                <LuPackage className="text-xl" />
            </div>
        );
    };

    const Badge = ({ isDeleted }) => {
        if (isDeleted === 1) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('deleted')}</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('active')}</span>;
    };

    const DeleteConfirmModal = () => {
        if (!deleteConfirmId) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('deleteMaterial')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{t('confirmDeleteMaterial')}</p>
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

    const PaginationControls = () => {
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
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <LuChevronsLeft />
                    </button>
                    <button
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <LuChevronLeft />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                        {t('page')} {pagination.current} {t('of')} {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <LuChevronRight />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                        <LuChevronsRight />
                    </button>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {t('showing')} {start} {t('to')} {end} {t('of')} {pagination.total} {t('materials')}
                </div>
            </div>
        );
    };

    // Table View
    const TableView = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const paginatedData = filteredMaterials;

        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 w-16">#</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('material_name')}>
                                    {t('material')} {sortConfig.field === 'material_name' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('units')}</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('stock')}</th>
                                <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('material_cost')}>
                                    {t('cost')} {sortConfig.field === 'material_cost' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('status')}</th>
                                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('created_at')}>
                                    {t('created')} {sortConfig.field === 'created_at' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, idx) => {
                                const index = start + idx + 1;
                                return (
                                    <tr key={item.id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${item.is_deleted === 1 ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-3 text-center text-gray-600 dark:text-gray-400">{index}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={item.material_image} alt={item.material_name} size={48} />
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{item.material_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.material_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 text-sm dark:text-gray-300">
                                                <LuScale className="text-gray-500 dark:text-gray-400" />
                                                <span>{item.primary_unit}</span>
                                                {item.secondary_unit && (
                                                    <>
                                                        <span>→</span>
                                                        <span>{item.secondary_unit}</span>
                                                        {item.conversion_value && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                                                (1 {item.primary_unit} = {item.conversion_value} {item.secondary_unit})
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                {stockFields.map(({ key, label }) => (
                                                    <div key={key} className="flex items-center justify-between gap-2">
                                                        <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                                                        <span className={key === 'in_stock' ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium text-gray-700 dark:text-gray-300'}>
                                                            {formatQuantity(getStockValue(item, key))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(item.material_cost)}</div>
                                        </td>
                                        <td className="p-3"><Badge isDeleted={item.is_deleted} /></td>
                                        <td className="p-3">
                                            <div className="text-sm text-gray-900 dark:text-white">{formatDate(item.created_at)}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{dayjs(item.created_at).fromNow()}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`view/${item.id}`)}
                                                    className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                    title={t('view')}
                                                >
                                                    <LuEye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`edit/${item.id}`)}
                                                    className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    title={t('edit')}
                                                >
                                                    <BiEdit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(item.id)}
                                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                    title={t('delete')}
                                                >
                                                    <LuTrash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <PaginationControls />
            </div>
        );
    };

    // Card View
    const CardView = () => {
        const paginatedData = filteredMaterials;

        return (
            <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {paginatedData.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_-28px_rgba(37,99,235,0.35)]"
                        >
                            <div className="relative h-44 overflow-hidden bg-slate-900">
                                <Avatar
                                    src={getImageSrc(item)}
                                    alt={item.material_name}
                                    className="h-full w-full rounded-none border-0 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                            </div>
                            <div className="space-y-4 p-4">
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{item.material_name}</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{item.material_code}</p>
                                    <p className="mt-2 text-[15px] text-slate-600 dark:text-gray-300">
                                        {t('unit')}: <span className="font-semibold text-slate-800 dark:text-gray-100">{item.primary_unit}</span>
                                        {item.secondary_unit && (
                                            <span className="text-slate-500 dark:text-gray-400"> | 1 {item.primary_unit} = {item.conversion_value} {item.secondary_unit}</span>
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-[20px] bg-slate-50 dark:bg-gray-700/50 p-4 shadow-inner transition-colors">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        {stockSummaryFields.slice(0, 4).map(({ key, label, tone }) => (
                                            <div key={key}>
                                                <p className="text-[13px] font-medium text-slate-500 dark:text-gray-400">{label}</p>
                                                <p className={`mt-1 text-md font-bold ${tone}`}>
                                                    {key === 'stock_in' || key === 'stock_return' ? '+' : '-'} {formatQuantity(getStockValue(item, key))}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[20px] border border-blue-100 dark:border-blue-900/30 bg-gradient-to-b from-sky-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 px-4 py-2 text-center transition-colors">
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{t('availableStock')}</p>
                                    <p className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                        {formatQuantity(getStockValue(item, 'in_stock'))} {item.primary_unit}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                                        {t('cost')}: <span className="font-semibold text-slate-700 dark:text-gray-200">{formatCurrency(item.material_cost * getStockValue(item, 'in_stock'))}</span>
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 dark:border-gray-700 pt-3 text-xs text-slate-500 dark:text-gray-400 transition-colors">
                                    <span>{formatDate(item.created_at)}</span>
                                    <Badge isDeleted={item.is_deleted} />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => navigate(`view/${item.id}`)}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        title={t('view')}
                                    >
                                        <LuEye size={14} />
                                        {t('view')}
                                    </button>
                                    <button
                                        onClick={() => navigate(`edit/${item.id}`)}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 dark:border-emerald-400 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                        title={t('edit')}
                                    >
                                        <BiEdit size={14} />
                                        {t('edit')}
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(item.id)}
                                        className="flex items-center justify-center gap-2 rounded-xl border border-red-500 dark:border-red-400 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 transition-all hover:bg-red-50 dark:hover:bg-red-900/30"
                                        title={t('delete')}
                                    >
                                        <LuTrash2 size={14} />
                                        {t('delete')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="mt-6">
                    <PaginationControls />
                </div>
            </>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-transparent p-4 md:p-6 view-page"
        >
            <DeleteConfirmModal />

            <div className="mx-auto">
                {/* Header */}
                <div className="mb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3"
                        >
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                                <LuPackage className="text-xl text-white" />
                            </div>
                            {t('rawMaterials')}
                        </motion.h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('manageTrackRawMaterials')}</p>
                    </div>

                    <div className="flex text-sm items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={loading || queryLoading}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <LuRefreshCw className={loading || queryLoading ? 'animate-spin' : ''} />
                            {t('refresh')}
                        </button>
                        <ExportExel
                            data={exportData}
                            title="Raw_Materials_Report"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
                        >
                            <LuDownload />
                            {t('export')}
                        </ExportExel>
                        <Link to="create">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                                <LuPlus />
                                {t('new')}
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border text-sm border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-4">
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('searchRawMaterialsLong')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <LuX />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="lg:col-span-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="all">{t('allCategories')}</option>
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <LuList />
                                    <span>{t('table')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <LuGrid3X3 />
                                    <span>{t('card')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading || queryLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 transition-colors">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                            <LuPackage className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">{t('noMaterialsFound')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs text-center max-w-md mb-6">
                            {searchTerm || selectedCategory !== 'all' || showDeleted
                                ? t('noMaterialsMatchFilters')
                                : t('startAddingFirstMaterial')}
                        </p>
                        {!searchTerm && selectedCategory === 'all' && !showDeleted && (
                            <Link to="create">
                                <button className="p-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                                    <LuPlus /> {t('addYourFirstMaterial')}
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    viewMode === 'table' ? <TableView /> : <CardView />
                )}
            </div>
        </motion.div>
    );
};

export default RawMaterials;
