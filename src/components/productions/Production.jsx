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
    LuCalendar,
    LuFactory,
    LuFileText,
    LuUsers,
    LuClipboardList,
    LuChartBar
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
    notification,
    Row,
    Col,
    Statistic,
    Progress,
    Dropdown,
    Menu
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ExportExcel from '../../services/ExportExel';
import { BiEdit } from 'react-icons/bi';
import { BsGrid3X3 } from 'react-icons/bs';
import { useGetAllProductionQuery } from '../../../app/Features/productSlice';
import { useDebounce } from 'use-debounce';
import api from '../../services/api';
import { toast } from 'react-toastify';

dayjs.extend(relativeTime);

const { Option } = Select;

const Production = () => {
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
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100']
    });
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [showDeleted, setShowDeleted] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedProduction, setSelectedProduction] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [debounce] = useDebounce(searchTerm, 5000);
    const { data, refetch } = useGetAllProductionQuery({ limit: pagination?.pageSize, page: pagination.current, search: debounce, token })

    // Fetch productions from API


    useEffect(() => {
        setProductions(data?.data);
        setFilteredProductions(data?.data);
    }, [data, pagination.current, pagination.pageSize]);

    // Apply filters and search
    useEffect(() => {
        let filtered = productions

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(production =>
                production.production_no?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                production.item_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                production.item_code?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                production.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                production.details?.some(detail =>
                    detail.material_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                    detail.material_code?.toLowerCase().includes(searchTerm.toLowerCase().trim())
                )
            );
        }

        // Filter by deletion status
        if (!showDeleted) {
            filtered = filtered?.filter(production => production.is_deleted === 0);
        }

        // Filter by status (active/deleted)
        if (statusFilter !== 'all') {
            filtered = filtered.filter(production =>
                statusFilter === 'active' ? production.is_deleted === 0 : production.is_deleted === 1
            );
        }

        // Filter by date range
        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dayjs(dateRange[0]).startOf('day');
            const end = dayjs(dateRange[1]).endOf('day');
            filtered = filtered.filter(production => {
                const date = dayjs(production.production_date);
                return date.isAfter(start) && date.isBefore(end);
            });
        }

        setFilteredProductions(filtered);
    }, [searchTerm, showDeleted, statusFilter, dateRange, productions]);

    // Handle pagination change
    const handlePaginationChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            current: page,
            pageSize
        }));
        fetchProductions(page, pageSize);
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

    // Calculate statistics
    const calculateStats = () => {
        const activeProductions = productions?.filter(p => p.is_deleted === 0);

        return {
            totalProductions: productions?.length,
            totalActive: activeProductions?.length,
            totalDeleted: productions?.length - activeProductions?.length,
            totalCost: activeProductions?.reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0),
            totalQuantity: activeProductions?.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0),
            avgCostPerProduction: activeProductions?.length > 0
                ? activeProductions?.reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0) / activeProductions?.length
                : 0,
            avgQuantityPerProduction: activeProductions?.length > 0
                ? activeProductions?.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0) / activeProductions?.length
                : 0
        };
    };

    const stats = calculateStats();

    // Handle delete production
    const handleDelete = async (id) => {
        try {
            const response = await api.delete(`/production/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            if (response.status == 200) {
                toast.success('Production record deleted successfully');
                refetch();
                setDeleteModalVisible(false);
                setSelectedProduction(null);
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            toast.error('Failed to delete production record. Please try again.');
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
            title: 'PRODUCTION NO',
            dataIndex: 'production_no',
            width: 160,
            render: (no) => (
                <div className="font-mono font-semibold text-blue-600">
                    {no}
                </div>
            ),
        },
        {
            title: 'DATE',
            dataIndex: 'production_date',
            width: 100,
            render: (date) => (
                <div>
                    <div className="font-medium text-gray-900">{formatDate(date)}</div>
                    <div className="text-xs text-gray-500">{dayjs(date).fromNow()}</div>
                </div>
            ),
            sorter: (a, b) => new Date(a.production_date) - new Date(b.production_date),
        },
        {
            title: 'PRODUCT',
            width: 180,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={40}
                        src={record.image.image}
                        className="bg-gradient-to-r from-blue-100 to-purple-100"
                        shape="square"
                    >
                        <LuPackage className="text-lg text-gray-600" />
                    </Avatar>
                    <div>
                        <div className="font-medium text-gray-900">{record.item_name}</div>
                        <div className="text-xs text-gray-500">{record.item_code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'QUANTITY',
            dataIndex: 'quantity',
            width: 100,
            align: 'center',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (quantity) => (
                <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{quantity}</div>
                    <div className="text-xs text-gray-500">units</div>
                </div>
            ),
        },
        {
            title: 'COST',
            dataIndex: 'total_cost',
            width: 120,
            align: 'right',
            sorter: (a, b) => a.total_cost - b.total_cost,
            render: (cost) => (
                <div className="text-right">
                    <div className="font-bold text-green-600">
                        {formatCurrency(cost)}
                    </div>
                    <div className="text-xs text-gray-500">total</div>
                </div>
            ),
        },
        {
            title: 'COST/UNIT',
            width: 120,
            align: 'right',
            render: (_, record) => {
                const costPerUnit = record.quantity > 0
                    ? Number(record.total_cost) / Number(record.quantity)
                    : 0;
                return (
                    <div className="text-right">
                        <div className="font-medium text-gray-900">
                            {formatCurrency(costPerUnit)}
                        </div>
                        <div className="text-xs text-gray-500">per unit</div>
                    </div>
                );
            },
        },
        {
            title: 'MATERIALS',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Tooltip title={`${record.details?.length || 0} raw materials`}>
                    <Tag color="blue" className="cursor-pointer">
                        {record.details?.length || 0}
                    </Tag>
                </Tooltip>
            ),
        },
        {
            title: 'CREATED BY',
            dataIndex: 'created_by_name',
            width: 120,
            render: (name) => (
                <div className="flex items-center gap-2">
                    <Avatar size={24} className="bg-gray-200">
                        {name?.charAt(0) || 'U'}
                    </Avatar>
                    <span className="text-sm">{name}</span>
                </div>
            ),
        },
        {
            title: 'STATUS',
            dataIndex: 'is_deleted',
            width: 100,
            render: (isDeleted) => getStatusBadge(isDeleted),
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Deleted', value: 'deleted' },
            ],
            onFilter: (value, record) =>
                value === 'active' ? record.is_deleted === 0 : record.is_deleted === 1,
        },
        {
            title: 'ACTIONS',
            width: 180,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<LuEye className="w-4 h-4" />}
                            onClick={() => navigate(`view/${record.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<BiEdit className="w-4 h-4" />}
                            onClick={() => navigate(`/dashboard/production/edit/${record.id}`)}
                            className="text-green-600 hover:text-green-800"
                            disabled={record.is_deleted === 1}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Popconfirm
                            title="Delete Production Record"
                            description="Are you sure you want to delete this production record?"
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

    // Expandable row for details
    const expandedRowRender = (record) => {
        const columns = [
            {
                title: 'Material',
                dataIndex: 'material_name',
                key: 'material_name',
                width: 150,
                render: (text, detail) => (
                    <div>
                        <div className="font-medium">{text}</div>
                        <div className="text-xs text-gray-500">{detail.material_code}</div>
                    </div>
                ),
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 100,
                align: 'center',
                render: (quantity) => (
                    <div className="font-medium">{quantity}</div>
                ),
            },
            {
                title: 'Cost/Unit',
                dataIndex: 'cost_per_unit',
                key: 'cost_per_unit',
                width: 100,
                align: 'right',
                render: (cost) => (
                    <div className="text-green-600">{formatCurrency(cost)}</div>
                ),
            },
            {
                title: 'Total Cost',
                dataIndex: 'total_cost',
                key: 'total_cost',
                width: 100,
                align: 'right',
                render: (cost) => (
                    <div className="font-bold text-green-600">{formatCurrency(cost)}</div>
                ),
            },
        ];

        return (
            <Card size="small" className="border-0 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">Raw Materials Used</h4>
                    <Tag color="blue">{record.details?.length || 0} materials</Tag>
                </div>
                <Table
                    columns={columns}
                    dataSource={record.details || []}
                    pagination={false}
                    size="small"
                    rowKey="id"
                />
            </Card>
        );
    };

    // Export data for Excel
    const exportData = filteredProductions?.map(production => ({
        'Production No': production.production_no,
        'Date': formatDate(production.production_date),
        'Product': production.item_name,
        'Product Code': production.item_code,
        'Quantity': production.quantity,
        'Total Cost': formatCurrency(production.total_cost),
        'Cost per Unit': formatCurrency(Number(production.total_cost) / Number(production.quantity)),
        'Created By': production.created_by_name,
        'Status': production.is_deleted === 0 ? 'Active' : 'Deleted',
        'Created At': dayjs(production.created_at).format('MMM D, YYYY h:mm A'),
        'Updated At': dayjs(production.updated_at).format('MMM D, YYYY h:mm A'),
        'Materials Count': production.details?.length || 0,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="min-h-screen bg-transparent p-4 md:p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
                            >
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                                    <LuFactory className="text-2xl text-white" />
                                </div>
                                Production Records
                            </motion.h1>
                            <p className="text-gray-600 text-lg">
                                Manage and track all production batches
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
                            <ExportExcel
                                data={exportData}
                                title="Production_Records_Report"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold shadow-sm hover:shadow-sm transition-all duration-300 h-12"
                            >
                                <LuDownload className="text-lg" />
                                <span>Export Excel</span>
                            </ExportExcel>
                            <Button
                                type="primary"
                                icon={<LuPlus />}
                                onClick={() => navigate('/dashboard/production/create')}
                                className="h-12 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-none shadow-sm hover:shadow-sm"
                            >
                                New Production
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50 hover:shadow-sm transition-all duration-300">
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-600 text-sm font-semibold mb-2 uppercase tracking-wider">Total Productions</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stats.totalProductions?.toLocaleString() || 0}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-green-600">{stats.totalActive} active</span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-red-600">{stats.totalDeleted} deleted</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                                    <LuFactory className="text-2xl text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-sm transition-all duration-300">
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-600 text-sm font-semibold mb-2 uppercase tracking-wider">Total Quantity</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stats.totalQuantity?.toLocaleString() || 0}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-2">units produced</div>
                                </div>
                                <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                                    <LuPackage className="text-2xl text-green-600" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50 hover:shadow-sm transition-all duration-300">
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-600 text-sm font-semibold mb-2 uppercase tracking-wider">Total Cost</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {formatCurrency(stats.totalCost)}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-2">production cost</div>
                                </div>
                                <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                                    <LuDollarSign className="text-2xl text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50 hover:shadow-sm transition-all duration-300">
                        <div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-600 text-sm font-semibold mb-2 uppercase tracking-wider">Avg. per Production</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(stats.avgCostPerProduction)}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-2">
                                        cost • {stats.avgQuantityPerProduction.toFixed(1)} units
                                    </div>
                                </div>
                                <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl">
                                    <LuChartBar className="text-2xl text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Filters and Controls */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-3"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-4">
                            <Input
                                placeholder="Search by production no, product, material, or created by..."
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
                                    type={viewMode === 'grid' ? 'primary' : 'text'}
                                    icon={<BsGrid3X3 />}
                                    onClick={() => setViewMode('grid')}
                                    className="flex-1"
                                >
                                    Grid
                                </Button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="lg:col-span-2">
                            <div className="h-12 px-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center">
                                <span className="text-blue-700 font-semibold">
                                    {filteredProductions?.length} records
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
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-0 shadow-sm">
                            <Table
                                columns={columns}
                                dataSource={filteredProductions}
                                rowKey="id"
                                loading={loading}
                                pagination={false}
                                scroll={{ x: 1400 }}
                                className="ant-table-striped"
                                rowClassName={(record) =>
                                    record.is_deleted === 1 ? 'bg-red-50 opacity-75' : ''
                                }
                                expandable={{
                                    expandedRowRender,
                                    rowExpandable: (record) => record.details?.length > 0,
                                    expandIcon: ({ expanded, onExpand, record }) => (
                                        <Tooltip title={record.details?.length > 0 ? "Show materials" : "No materials"}>
                                            <Button
                                                type="text"
                                                size="small"
                                                onClick={(e) => onExpand(record, e)}
                                                disabled={!record.details?.length}
                                                className="text-gray-500 hover:text-blue-600"
                                            >
                                                <LuClipboardList className={`w-4 h-4 ${expanded ? 'text-blue-600' : ''}`} />
                                            </Button>
                                        </Tooltip>
                                    ),
                                }}
                            />
                        </Card>
                    </motion.div>
                ) : (
                    /* Grid View */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredProductions.map((production) => (
                            <motion.div
                                key={production.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card
                                    className={`border-0 shadow-sm hover:shadow-sm transition-all duration-300 h-full ${production.is_deleted === 1 ? 'bg-red-50' : ''
                                        }`}
                                    title={
                                        <div className="flex items-center justify-between">
                                            <div className="font-mono font-semibold text-blue-600">
                                                {production.production_no}
                                            </div>
                                            {getStatusBadge(production.is_deleted)}
                                        </div>
                                    }
                                >
                                    <div className="space-y-4">
                                        {/* Product Info */}
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                size={48}
                                                src={production.image.image}
                                                className="bg-gradient-to-r from-blue-100 to-purple-100"
                                                shape="square"
                                            >
                                                <LuPackage className="text-xl text-gray-600" />
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{production.item_name}</h3>
                                                <p className="text-sm text-gray-500">{production.item_code}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(production.production_date)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-blue-600">
                                                    {production.quantity}
                                                </div>
                                                <div className="text-xs text-gray-500">Units</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-green-600">
                                                    {formatCurrency(production.total_cost)}
                                                </div>
                                                <div className="text-xs text-gray-500">Total Cost</div>
                                            </div>
                                        </div>

                                        {/* Cost per Unit */}
                                        <div className="text-center">
                                            <div className="text-sm text-gray-600">Cost per Unit</div>
                                            <div className="font-semibold text-purple-600">
                                                {formatCurrency(Number(production.total_cost) / Number(production.quantity))}
                                            </div>
                                        </div>

                                        {/* Materials */}
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-600">Raw Materials:</span>
                                                <Tag color="blue">{production.details?.length || 0}</Tag>
                                            </div>
                                            {production.details && production.details.length > 0 && (
                                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                                    {production.details.slice(0, 3).map((detail, idx) => (
                                                        <div key={detail.id} className="flex justify-between text-xs">
                                                            <span className="truncate max-w-[120px]">{detail.material_name}</span>
                                                            <span className="text-gray-500">
                                                                {detail.quantity} × {formatCurrency(detail.cost_per_unit)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {production.details.length > 3 && (
                                                        <div className="text-xs text-gray-500 text-center">
                                                            +{production.details.length - 3} more materials
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Created By */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Avatar size={24} className="bg-gray-200">
                                                {production.created_by_name?.charAt(0) || 'U'}
                                            </Avatar>
                                            <span className="text-gray-600">By {production.created_by_name}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                                        <Button
                                            type="text"
                                            icon={<LuEye className="w-4 h-4" />}
                                            onClick={() => navigate(`view/${production.id}`)}
                                            className="text-blue-600 hover:text-blue-800"
                                        >

                                        </Button>
                                        <Button
                                            type="text"
                                            icon={<BiEdit className="w-4 h-4" />}
                                            onClick={() => navigate(`/dashboard/production/edit/${production.id}`)}
                                            className="text-green-600 hover:text-green-800"
                                            disabled={production.is_deleted === 1}
                                        >

                                        </Button>
                                        <Popconfirm
                                            title="Delete Production Record"
                                            description="Are you sure you want to delete this production record?"
                                            onConfirm={() => handleDelete(production.id)}
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
                {filteredProductions?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8"
                    >
                        <Card className="border-0 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="text-gray-600">
                                    Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
                                    {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
                                    {pagination.total} productions
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
                                        `${range[0]}-${range[1]} of ${total} records`
                                    }
                                    className="ant-pagination-mini"
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Empty State */}
                {!loading && filteredProductions?.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-16"
                    >
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                            <LuFactory className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No Production Records Found
                        </h3>
                        <p className="text-gray-500 text-center max-w-md mb-6">
                            {searchTerm || statusFilter !== 'all' || showDeleted
                                ? "No production records match your search criteria. Try adjusting your filters."
                                : "You haven't created any production records yet. Start by creating your first production batch."}
                        </p>
                        {!searchTerm && statusFilter === 'all' && !showDeleted && (
                            <Button
                                type="primary"
                                icon={<LuPlus />}
                                onClick={() => navigate('/dashboard/production/create')}
                                className="h-12 px-8 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                size="large"
                            >
                                Create First Production
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading production records...</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Production;