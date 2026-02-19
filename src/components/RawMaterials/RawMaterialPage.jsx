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

dayjs.extend(relativeTime);

const RawMaterials = () => {
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
        const data = raw?.data?.data || [];

        setPagination(prev => ({
            ...prev,
            current: raw?.data?.current_page || 1,
            pageSize: raw?.data?.per_page || prev.pageSize,
            total: raw?.data?.total || 0
        }));
        setMaterials(data);
        setFilteredMaterials(data);
    }, [raw]);

    // Apply filters and search (client-side, because we also filter by category and showDeleted)
    useEffect(() => {
        let filtered = [...materials];

        // Search (already partially done by API, but we also filter by description and code)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(m =>
                m.material_name?.toLowerCase().includes(term) ||
                m.material_code?.toLowerCase().includes(term) ||
                m.material_description?.toLowerCase().includes(term)
            );
        }

        // Category filter (if implemented)
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(m => m.category === selectedCategory);
        }



        // Apply sorting (if any)
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

        console.log(materials);
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
                toast.success('Material deleted successfully');
                refetch();
            }
        } catch (error) {
            toast.error('Failed to delete material');
        } finally {
            setLoading(false);
        }
    };

    // Format helpers
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
    };
    const formatDate = (date) => dayjs(date).format('MMM D, YYYY');

    // Export data
    const exportData = filteredMaterials.map(m => ({
        ID: m.id,
        Name: m.material_name,
        Code: m.material_code,
        Description: m.material_description,
        'Primary Unit': m.primary_unit,
        'Secondary Unit': m.secondary_unit || 'N/A',
        'Conversion Value': m.conversion_value || 'N/A',
        Cost: formatCurrency(m.material_cost),
        Status: m.is_deleted === 0 ? 'Active' : 'Deleted',
        'Created At': formatDate(m.created_at)
    }));

    // Custom components
    const Avatar = ({ src, alt, size = 40 }) => {
        const [error, setError] = useState(false);
        if (src && !error) {
            return <img src={src} alt={alt} className={`w-${size / 4} h-${size / 4} rounded object-cover border border-gray-200`} onError={() => setError(true)} />;
        }
        return (
            <div className={`w-${size / 4} h-${size / 4} bg-blue-100 rounded flex items-center justify-center text-blue-600`}>
                <LuPackage className={`text-${size / 4 - 2}`} />
            </div>
        );
    };

    const Badge = ({ isDeleted }) => {
        if (isDeleted === 1) {
            return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Deleted</span>;
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
    };

    const DeleteConfirmModal = () => {
        if (!deleteConfirmId) return null;
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Material</h3>
                    <p className="text-gray-600 mb-6">Are you sure you want to delete this material? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDelete(deleteConfirmId)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Delete
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                        value={pagination.pageSize}
                        onChange={handlePageSizeChange}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                        <LuChevronsLeft />
                    </button>
                    <button
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                        className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                        <LuChevronLeft />
                    </button>
                    <span className="text-sm text-gray-700">
                        Page {pagination.current} of {totalPages || 1}
                    </span>
                    <button
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                        <LuChevronRight />
                    </button>
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pagination.current === totalPages || totalPages === 0}
                        className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                        <LuChevronsRight />
                    </button>
                </div>
                <div className="text-sm text-gray-600">
                    Showing {start} to {end} of {pagination.total} materials
                </div>
            </div>
        );
    };

    // Table View
    const TableView = () => {
        const start = (pagination.current - 1) * pagination.pageSize;
        const paginatedData = filteredMaterials.slice(start, start + pagination.pageSize);

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300 w-16">#</th>
                                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort('material_name')}>
                                    Material {sortConfig.field === 'material_name' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Units</th>
                                <th className="p-3 text-right font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort('material_cost')}>
                                    Cost {sortConfig.field === 'material_cost' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Status</th>
                                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort('created_at')}>
                                    Created {sortConfig.field === 'created_at' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 text-center font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, idx) => {
                                const index = start + idx + 1;
                                return (
                                    <tr key={item.id} className={`border-b border-gray-200 hover:bg-gray-50 ${item.is_deleted === 1 ? 'bg-red-50' : ''}`}>
                                        <td className="p-3 text-center text-gray-600">{index}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar src={item.material_image} alt={item.material_name} size={48} />
                                                <div>
                                                    <div className="font-semibold text-gray-900">{item.material_name}</div>
                                                    <div className="text-xs text-gray-500">{item.material_code}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 text-sm">
                                                <LuScale className="text-gray-500" />
                                                <span>{item.primary_unit}</span>
                                                {item.secondary_unit && (
                                                    <>
                                                        <span>→</span>
                                                        <span>{item.secondary_unit}</span>
                                                        {item.conversion_value && (
                                                            <span className="text-xs text-gray-500 ml-1">
                                                                (1 {item.primary_unit} = {item.conversion_value} {item.secondary_unit})
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="font-bold text-green-600">{formatCurrency(item.material_cost)}</div>
                                        </td>
                                        <td className="p-3"><Badge isDeleted={item.is_deleted} /></td>
                                        <td className="p-3">
                                            <div className="text-sm text-gray-900">{formatDate(item.created_at)}</div>
                                            <div className="text-xs text-gray-500">{dayjs(item.created_at).fromNow()}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`view/${item.id}`)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                                    title="View"
                                                >
                                                    <LuEye size={14} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`edit/${item.id}`)}
                                                    className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                    title="Edit"
                                                >
                                                    <BiEdit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(item.id)}
                                                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                    title="Delete"
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
        const start = (pagination.current - 1) * pagination.pageSize;
        const paginatedData = filteredMaterials.slice(start, start + pagination.pageSize);

        return (
            <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {paginatedData.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex justify-center mb-3">
                                    <Avatar src={item.material_image} alt={item.material_name} size={64} />
                                </div>
                                <div className="text-center mb-3">
                                    <h3 className="font-bold text-lg text-gray-900">{item.material_name}</h3>
                                    <p className="text-sm text-gray-500">{item.material_code}</p>
                                </div>
                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Unit:</span>
                                        <span className="font-medium">{item.primary_unit}</span>
                                    </div>
                                    {item.secondary_unit && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">Conversion:</span>
                                            <span className="font-medium">1 {item.primary_unit} = {item.conversion_value} {item.secondary_unit}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Cost:</span>
                                        <span className="font-bold text-green-600">{formatCurrency(item.material_cost)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span className="text-sm">{formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => navigate(`view/${item.id}`)}
                                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                        title="View"
                                    >
                                        <LuEye size={14} />
                                    </button>
                                    <button
                                        onClick={() => navigate(`edit/${item.id}`)}
                                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                        title="Edit"
                                    >
                                        <BiEdit size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirmId(item.id)}
                                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                        title="Delete"
                                    >
                                        <LuTrash2 size={14} />
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
            className="min-h-screen bg-transparent p-4 md:p-6"
        >
            <DeleteConfirmModal />

            <div className="mx-auto">
                {/* Header */}
                <div className="mb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"
                        >
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                                <LuPackage className="text-xl text-white" />
                            </div>
                            Raw Materials
                        </motion.h1>
                        <p className="text-gray-600 text-sm">Manage and track all raw materials</p>
                    </div>

                    <div className="flex text-sm items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={loading || queryLoading}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                        >
                            <LuRefreshCw className={loading || queryLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                        <ExportExel
                            data={exportData}
                            title="Raw_Materials_Report"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <LuDownload />
                            Export
                        </ExportExel>
                        <Link to="/dashboard/raw-materials/create">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                <LuPlus />
                                New
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="bg-white rounded-lg shadow-sm border text-sm border-gray-200 p-4 mb-3">
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-4">
                            <div className="relative">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, code, or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <LuX />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Category Filter (if needed) - we can add a select here */}
                        <div className="lg:col-span-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {/* Add category options dynamically if available */}
                            </select>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-md border border-gray-300">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <LuList />
                                    <span>Table</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    <LuGrid3X3 />
                                    <span>Card</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading || queryLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600">Loading materials...</p>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <LuPackage className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Materials Found</h3>
                        <p className="text-gray-500 text-xs text-center max-w-md mb-6">
                            {searchTerm || selectedCategory !== 'all' || showDeleted
                                ? 'No materials match your filters. Try adjusting them.'
                                : 'Start by adding your first raw material.'}
                        </p>
                        {!searchTerm && selectedCategory === 'all' && !showDeleted && (
                            <Link to="/dashboard/raw-materials/create">
                                <button className="p-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-2">
                                    <LuPlus /> Add Your First Material
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