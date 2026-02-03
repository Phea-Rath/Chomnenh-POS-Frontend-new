import React, { useState, useEffect, useCallback } from 'react';
import {
    LuSearch,
    LuPlus,
    LuFilter,
    LuRefreshCw,
    LuDownload,
    LuEye,
    LuTrash2,
    LuList,
    LuDollarSign,
    LuPackage,
    LuScale,
    LuArchive,
    LuUser,
    LuCalendar,
    LuGrid3X3
} from 'react-icons/lu';
import {
    Table,
    Card,
    Input,
    Button,
    Tag,
    Modal,
    Pagination,
    Space,
    Tooltip,
    Avatar,
    Badge,
    Popconfirm,
    Select,
    Switch,
    notification
} from 'antd';
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

const { Option } = Select;

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
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100']
    });
    const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showDeleted, setShowDeleted] = useState(false);
    const [debounce] = useDebounce(searchTerm, 5000);
    const { data: raw, refetch } = useGetAllRawMaterialQuery({ limit: pagination.pageSize, page: pagination.current, search: debounce, token });
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);


    useEffect(() => {
        const data = raw?.data?.data || [];
        console.log(raw?.data);
        setPagination({
            current: raw?.data?.current_page,
            pageSize: raw?.data?.per_page,
            total: raw?.data?.total

        })

        setMaterials(data);
        setFilteredMaterials(data);
    }, [raw, pagination.current, pagination.pageSize]);

    // Apply filters and search
    useEffect(() => {
        let filtered = [...materials];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(material =>
                material.material_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                material.material_code?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                material.material_description?.toLowerCase().includes(searchTerm.toLowerCase().trim())
            );
        }

        // Filter by deletion status
        if (!showDeleted) {
            filtered = filtered.filter(material => material.is_deleted === 0);
        }

        // Filter by category (if you have categories in the future)
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(material => material.category === selectedCategory);
        }

        setFilteredMaterials(filtered);
    }, [searchTerm, showDeleted, selectedCategory, materials]);

    // Handle pagination change
    const handlePaginationChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize
        }));
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (dateString) => {
        return dayjs(dateString).format('MMM D, YYYY');
    };

    // Get status badge
    const getStatusBadge = (isDeleted) => {
        if (isDeleted === 1) {
            return <Badge status="error" text="Deleted" />;
        }
        return <Badge status="success" text="Active" />;
    };

    // Handle delete material
    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.delete(`/raw_materials/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast.success('Material deleted successfully');
                setDeleteModalVisible(false);
                setSelectedMaterial(null);
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            toast.error('Failed to delete material. Please try again.');
        }
    };

    // Table columns
    const columns = [
        {
            title: '#',
            dataIndex: 'index',
            width: 60,
            align: 'center',
            render: (_, __, index) => {
                const current = pagination.current;
                const pageSize = pagination.pageSize;
                return (current - 1) * pageSize + index + 1;
            },
        },
        {
            title: 'MATERIAL',
            dataIndex: 'material_name',
            width: 200,
            render: (name, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={48}
                        src={record.material_image}
                        className="bg-gradient-to-r from-blue-100 to-purple-100 border"
                        shape="square"
                    >
                        <LuPackage className="text-xl text-gray-400" />
                    </Avatar>
                    <div>
                        <div className="font-semibold text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500">{record.material_code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'DESCRIPTION',
            dataIndex: 'material_description',
            width: 250,
            render: (description) => (
                <div className="text-sm text-gray-600 truncate max-w-xs">
                    {description || 'No description'}
                </div>
            ),
        },
        {
            title: 'UNITS',
            width: 150,
            render: (_, record) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <LuScale className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">
                            {record.primary_unit}
                            {record.secondary_unit && ` → ${record.secondary_unit}`}
                        </span>
                    </div>
                    {record.conversion_value && (
                        <div className="text-xs text-gray-500">
                            1 {record.primary_unit} = {record.conversion_value} {record.secondary_unit}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'COST',
            dataIndex: 'material_cost',
            width: 120,
            align: 'right',
            sorter: (a, b) => a.material_cost - b.material_cost,
            render: (cost) => (
                <div className="text-right">
                    <div className="font-bold text-green-600">
                        {formatCurrency(cost)}
                    </div>
                    <div className="text-xs text-gray-500">per unit</div>
                </div>
            ),
        },
        {
            title: 'STATUS',
            dataIndex: 'is_deleted',
            width: 100,
            render: (isDeleted) => getStatusBadge(isDeleted),
        },
        {
            title: 'CREATED',
            dataIndex: 'created_at',
            width: 120,
            render: (date) => (
                <div>
                    <div className="text-sm text-gray-900">{formatDate(date)}</div>
                    <div className="text-xs text-gray-500">{dayjs(date).fromNow()}</div>
                </div>
            ),
        },
        {
            title: 'ACTIONS',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<LuEye className="w-4 h-4" />}
                            onClick={() => navigate(`/dashboard/raw-materials/${record.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<BiEdit className="w-4 h-4" />}
                            onClick={() => navigate(`/dashboard/raw-materials/edit/${record.id}`)}
                            className="text-green-600 hover:text-green-800"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete Material"
                            description="Are you sure you want to delete this material?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true }}
                        >
                            <Button
                                type="text"
                                icon={<LuTrash2 className="w-4 h-4" />}
                                className="text-red-600 hover:text-red-800"
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // Export data for Excel
    const exportData = filteredMaterials.map(material => ({
        'ID': material.id,
        'Name': material.material_name,
        'Code': material.material_code,
        'Description': material.material_description,
        'Primary Unit': material.primary_unit,
        'Secondary Unit': material.secondary_unit || 'N/A',
        'Conversion Value': material.conversion_value || 'N/A',
        'Cost': formatCurrency(material.material_cost),
        'Status': material.is_deleted === 0 ? 'Active' : 'Deleted',
        'Created By': material.created_by,
        'Created At': formatDate(material.created_at),
        'Updated At': formatDate(material.updated_at)
    }));

    console.log(pagination);


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="min-h-screen bg-transparent p-4 md:p-6">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
                            >
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                                    <LuPackage className="text-2xl text-white" />
                                </div>
                                Raw Materials
                            </motion.h1>
                            <p className="text-gray-600 text-lg">
                                Manage and track all raw materials in your inventory
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button
                                icon={<LuRefreshCw />}
                                onClick={() => refetch()}
                                loading={loading}
                                className="flex items-center space-x-2 h-12 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
                            >
                                Refresh
                            </Button>
                            <ExportExel
                                data={exportData}
                                title="Raw_Materials_Report"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold shadow-sm hover:shadow-md transition-all duration-300 h-12"
                            >
                                <LuDownload className="text-lg" />
                                <span>Export</span>
                            </ExportExel>
                            <Button
                                type="primary"
                                icon={<LuPlus />}
                                onClick={() => navigate('/dashboard/raw-materials/create')}
                                className="h-12 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-none shadow-sm hover:shadow-md"
                            >
                                Add New Material
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters and Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-4">
                            <Input
                                placeholder="Search by name, code, or description..."
                                prefix={<LuSearch className="text-gray-400" />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 rounded-xl"
                                allowClear
                                size="large"
                            />
                        </div>



                        {/* View Mode Toggle */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 h-12 px-4 bg-gray-50 rounded-xl border">
                                <Button
                                    type={viewMode === 'table' ? 'primary' : 'text'}
                                    icon={<LuList />}
                                    onClick={() => setViewMode('table')}
                                    className="flex-1"
                                >
                                    Table
                                </Button>
                                <Button
                                    type={viewMode === 'card' ? 'primary' : 'text'}
                                    icon={<LuGrid3X3 />}
                                    onClick={() => setViewMode('card')}
                                    className="flex-1"
                                >
                                    Card
                                </Button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="lg:col-span-2">
                            <div className="h-12 px-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center">
                                <span className="text-blue-700 font-semibold">
                                    {filteredMaterials.length} materials
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Area */}
                {viewMode === 'table' ? (
                    /* Table View */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="border-0 shadow-md">
                            <Table
                                columns={columns}
                                dataSource={filteredMaterials}
                                rowKey="id"
                                loading={loading}
                                pagination={false}
                                scroll={{ x: 1200 }}
                                className="ant-table-striped"
                                rowClassName={(record) =>
                                    record.is_deleted === 1 ? 'bg-red-50 opacity-75' : ''
                                }
                            />
                        </Card>
                    </motion.div>
                ) : (
                    /* Card View */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                    >
                        {filteredMaterials.map((material) => (
                            <motion.div
                                key={material.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card
                                    className="border-0 shadow-sm hover:shadow-md transition-all duration-300 h-full"
                                >
                                    <div className="p-4">
                                        {material.material_image ? <img
                                            src={material.material_image}
                                            className="mx-auto bg-gradient-to-r object-contain w-20 h-20 from-blue-100 to-purple-100 border"
                                        />
                                            : <LuPackage className="text-2xl text-gray-400" />}

                                    </div>
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                                            {material.material_name}
                                        </h3>
                                        <p className="text-sm text-gray-500">{material.material_code}</p>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="text-sm text-gray-600 line-clamp-2">
                                            {material.material_description || 'No description'}
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <LuScale className="w-4 h-4" />
                                                <span>{material.primary_unit}</span>
                                            </div>
                                            <div className="font-bold text-green-600">
                                                {formatCurrency(material.material_cost)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <LuCalendar className="w-4 h-4" />
                                                <span>{formatDate(material.created_at)}</span>
                                            </div>
                                            {getStatusBadge(material.is_deleted)}
                                        </div>
                                    </div>

                                    <div className="flex border-t border-gray-300 items-center justify-between pt-4">
                                        <Button
                                            type="text"
                                            icon={<LuEye className="w-4 h-4" />}
                                            onClick={() => navigate(`/dashboard/raw-materials/${material.id}`)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >

                                        </Button>
                                        <Button
                                            type="text"
                                            icon={<BiEdit className="w-4 h-4" />}
                                            onClick={() => navigate(`/dashboard/raw-materials/edit/${material.id}`)}
                                            className="text-green-600 hover:text-green-800"
                                        >

                                        </Button>
                                        <Popconfirm
                                            title="Delete Material"
                                            description="Are you sure you want to delete this material?"
                                            onConfirm={() => handleDelete(material.id)}
                                            okText="Yes"
                                            cancelText="No"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button
                                                type="text"
                                                icon={<LuTrash2 className="w-4 h-4" />}
                                                className="text-red-600 hover:text-red-800"
                                            >

                                            </Button>
                                        </Popconfirm>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination */}
                {filteredMaterials.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mt-8"
                    >
                        <Card className="border-0 shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="text-gray-600">
                                    Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                                    {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                                    {pagination.total} materials
                                </div>
                                <Pagination
                                    current={pagination.current}
                                    pageSize={pagination.pageSize}
                                    total={pagination.total}
                                    onChange={handlePaginationChange}
                                    showSizeChanger
                                    pageSizeOptions={pagination.pageSizeOptions}
                                    showQuickJumper
                                    showTotal={(total, range) =>
                                        `${range[0]}-${range[1]} of ${total} items`
                                    }
                                    className="ant-pagination-mini"
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && filteredMaterials.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-16"
                    >
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                            <LuPackage className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Materials Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            {searchTerm || selectedCategory !== 'all' || showDeleted
                                ? "No materials match your search criteria. Try adjusting your filters."
                                : "You haven't added any raw materials yet. Start by adding your first material."}
                        </p>
                        {!searchTerm && selectedCategory === 'all' && !showDeleted && (
                            <Button
                                type="primary"
                                icon={<LuPlus />}
                                onClick={() => navigate('/dashboard/raw-materials/create')}
                                className="h-12 px-8 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                size="large"
                            >
                                Add Your First Material
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading materials...</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RawMaterials;