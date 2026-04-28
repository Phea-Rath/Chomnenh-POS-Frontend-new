import React, { useEffect, useState } from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useOutletsContext } from '../../layouts/Management';
import { useDeleteStockMutation, useGetAllStockRawQuery } from '../../../app/Features/stocksSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import { useTranslation } from 'react-i18next';
import {
    FaWarehouse,
    FaExchangeAlt,
    FaCalendarAlt,
    FaUser,
    FaEdit,
    FaTrash,
    FaEye,
    FaPlus,
    FaBox,
    FaBoxOpen,
    FaCubes,
    FaClipboardList,
    FaShoppingCart,
    FaArrowRight,
    FaFileExport,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';

const StockRaws = () => {
    const { t } = useTranslation();
    const [stocks, setStocks] = useState([]);
    const token = localStorage.getItem('token');
    const [id, setId] = useState(0);
    const [alertBox, setAlertBox] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('stockViewMode') || 'grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const { setLoading } = useOutletsContext();

    // Pagination States
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading, refetch } = useGetAllStockRawQuery({
        limit,
        page,
        search: searchTerm,
        token
    });
    const { refetch: saleRefetch } = useGetAllSaleQuery(token);

    useEffect(() => {
        const stockData = data?.data || [];
        setStocks(stockData);
    }, [data?.data]);

    // Helper functions
    const getStockTypeColor = (type) => {
        const colors = {
            'stock in': 'green',
            'stock out': 'red',
            'stock sale': 'orange',
            'transfer': 'blue',
            'adjustment': 'purple',
            'return': 'yellow',
        };
        return colors[type?.toLowerCase()] || 'gray';
    };

    const getStockTypeIcon = (type) => {
        const icons = {
            'stock in': <FaBoxOpen className="text-green-500" />,
            'stock out': <FaBox className="text-red-500" />,
            'stock sale': <FaShoppingCart className="text-orange-500" />,
            'transfer': <FaExchangeAlt className="text-blue-500" />,
            'adjustment': <FaEdit className="text-purple-500" />,
            'return': <FaExchangeAlt className="text-yellow-500" />,
        };
        return icons[type?.toLowerCase()] || <FaBox className="text-gray-500" />;
    };

    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const formatDateTime = (date) =>
        new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const getStockItems = (stock) => (Array.isArray(stock?.items) ? stock.items : []);
    const getTotalItems = (stock) => getStockItems(stock).length;
    const getTotalQuantity = (stock) =>
        getStockItems(stock).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const getTotalValue = (stock) =>
        getStockItems(stock).reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.item_cost) || 0),
            0
        );

    // Delete handlers
    const handleDelete = (stockId) => {
        setAlertBox(true);
        setId(stockId);
    };

    const handleCancel = () => setAlertBox(false);

    const handleConfirm = async () => {
        setAlertBox(false);
        setLoading(true);
        try {
            const res = await api.delete(`stock_masters_raw/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                refetch();
                saleRefetch();
                toast.success(t('rawStockDeletedSuccess'));
            }
        } catch (error) {
            toast.error(error.message || t('rawStockDeleteFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Search handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setPage(1); // Reset to first page on search
    };

    // View mode toggle
    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('stockViewMode', mode);
    };

    // Export to Excel
    const exportToExcel = () => {
        try {
            setExportLoading(true);
            const dataToExport = stocks;
            if (dataToExport.length === 0) {
                toast.warning(t('noDataToExport'));
                setExportLoading(false);
                return;
            }

            const workbook = XLSX.utils.book_new();

            // Sheet 1: Stock Summary
            const summaryData = dataToExport.map((stock, idx) => ({
                [t('sNo')]: idx + 1,
                [t('stockId')]: stock.stock_id,
                [t('stockNumber')]: stock.stock_no || 'N/A',
                [t('stockType')]: stock.stock_type_name || 'N/A',
                [t('fromWarehouse')]: stock.from_warehouse_name || 'N/A',
                [t('toWarehouse')]: stock.to_warehouse_name || 'N/A',
                [t('stockDate')]: stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
                [t('createdDate')]: stock.created_at ? formatDateTime(stock.created_at) : 'N/A',
                [t('createdBy')]: stock.created_by_name || 'N/A',
                [t('remark')]: stock.stock_remark || 'N/A',
                [t('totalItems')]: getTotalItems(stock),
                [t('totalQuantity')]: getTotalQuantity(stock),
                [t('totalValue')]: `$${getTotalValue(stock).toFixed(2)}`,
                [t('status')]: stock.status || 'Active',
            }));
            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, t('stockSummary'));

            // Sheet 2: Items Details
            const itemsData = [];
            dataToExport.forEach((stock) => {
                getStockItems(stock).forEach((item) => {
                    itemsData.push({
                        [t('stockNumber')]: stock.stock_no,
                        [t('stockType')]: stock.stock_type_name,
                        [t('materialName')]: item.material_name,
                        [t('materialCode')]: item.material_code,
                        [t('quantity')]: item.quantity,
                        [t('unitCost')]: item.item_cost,
                        [t('totalValue')]: (item.quantity || 0) * (item.item_cost || 0),
                        [t('expireDate')]: item.expire_date || 'N/A',
                        [t('fromWarehouse')]: stock.from_warehouse_name,
                        [t('toWarehouse')]: stock.to_warehouse_name,
                        [t('stockDate')]: stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
                    });
                });
            });
            if (itemsData.length) {
                const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
                XLSX.utils.book_append_sheet(workbook, itemsSheet, t('itemsDetails'));
            }

            const fileName = `Stock_Raw_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success(`${t('exported')} ${dataToExport.length} ${t('records')}`);
        } catch (error) {
            console.error(error);
            toast.error(t('exportFailed'));
        } finally {
            setExportLoading(false);
        }
    };

    // ----- Custom Components -----
    const Badge = ({ children, color }) => {
        const colorMap = {
            green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
            blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            gray: 'bg-gray-100 text-gray-800 bg-primary dark:text-gray-400',
        };
        return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${colorMap[color] || colorMap.gray}`}>{children}</span>;
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className={`bg-gradient-to-r ${color} p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className="p-2 bg-white bg-primary rounded-full">{icon}</div>
            </div>
        </div>
    );

    // Grid Item Card
    const GridItem = ({ stock }) => {
        const typeColor = getStockTypeColor(stock.stock_type_name);
        return (
            <div
                className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white bg-primary shadow-sm hover:shadow-md transition-all duration-300"
            >
                <div className="p-4">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <Badge color={typeColor}>{stock.stock_type_name}</Badge>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mt-2">{stock.stock_no}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <FaCalendarAlt className="text-gray-400" />
                                <span>{formatDate(stock.stock_date)}</span>
                            </div>
                        </div>
                        <div className="text-2xl">{getStockTypeIcon(stock.stock_type_name)}</div>
                    </div>

                    {/* Transfer info */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg mb-3">
                        <div className="flex items-center gap-1">
                            <FaWarehouse className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stock.from_warehouse_name}</span>
                        </div>
                        <FaArrowRight className="text-gray-400" />
                        <div className="flex items-center gap-1">
                            <FaWarehouse className="text-green-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stock.to_warehouse_name}</span>
                        </div>
                    </div>

                    {/* Items summary */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <FaCubes className="text-purple-500" />
                            <span>{getTotalItems(stock)} {t('itemsCount')}</span>
                        </div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">{t('qty')}: {getTotalQuantity(stock)}</div>
                        {/* <div className="font-bold text-purple-600 dark:text-purple-400">${getTotalValue(stock).toFixed(2)}</div> */}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                            <FaEye />
                        </Link>
                        <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                            <FaEdit />
                        </Link>
                        <button
                            onClick={() => handleDelete(stock.stock_id)}
                            className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <FaTrash />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // List Item Row
    const ListItem = ({ stock }) => (
        <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors border-b border-gray-100 dark:border-gray-700">
            <td className="px-6 py-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        {getStockTypeIcon(stock.stock_type_name)}
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white">{stock.stock_no}</div>
                            <Badge color={getStockTypeColor(stock.stock_type_name)}>{stock.stock_type_name}</Badge>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FaUser className="text-gray-400" />
                    <span>{stock.created_by_name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-xs">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <FaWarehouse className="text-blue-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{stock.from_warehouse_name}</span>
                    </div>
                    <FaArrowRight className="text-gray-400 mx-2" />
                    <div className="flex items-center gap-2">
                        <FaWarehouse className="text-green-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{stock.to_warehouse_name}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-xs">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <FaCubes className="text-purple-500" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{getTotalItems(stock)} {t('itemsCount')}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalQty')}: <span className="font-semibold">{getTotalQuantity(stock)}</span></div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(stock.created_at)}</div>
                </div>
            </td>
            {/* <td className="px-6 py-4">
                <div className="font-bold text-lg text-purple-600 dark:text-purple-400">${getTotalValue(stock).toFixed(2)}</div>
            </td> */}
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <FaEye />
                    </Link>
                    <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                        <FaEdit />
                    </Link>
                    <button
                        onClick={() => handleDelete(stock.stock_id)}
                        className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    );

    // Empty State
    const EmptyState = () => (
        <div className="bg-white bg-primary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                    <FaBoxOpen className="text-4xl text-blue-500 dark:text-blue-400" />
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('noRawStockRecordsFound')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto">
                {stocks.length === 0
                    ? t('startTrackingRawStock')
                    : t('noStockMatchSearch')}
            </p>
            {stocks.length === 0 && (
                <Link to="add">
                    <button className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto shadow-lg transition-all">
                        <FaPlus /> {t('createFirstRawStockRecord')}
                    </button>
                </Link>
            )}
        </div>
    );

    // Loading State
    const LoadingState = () => (
        <div className="bg-white bg-primary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">{t('loadingRawStockData')}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">{t('fetchingInventoryRecords')}</p>
            </div>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-transparent p-6"
        >
            <AlertBox
                isOpen={alertBox}
                title={t('deleteRawStockRecord')}
                message={t('deleteStockConfirm')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                confirmColor="error"
            />

            <div className="mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('rawStock')} <span className="text-blue-600 dark:text-blue-400">{t('inventory')}</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{t('trackManageRawMovements')}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* View Mode Toggle */}
                        <div className="flex bg-white bg-primary rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                title={t('gridView')}
                            >
                                <IoIosGrid size={20} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                title={t('listView')}
                            >
                                <IoIosList size={20} />
                            </button>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToExcel}
                            disabled={exportLoading}
                            className="px-4 py-2 bg-white bg-primary border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
                            title={t('exportExcel')}
                        >
                            <FaFileExport />
                            {exportLoading ? t('exporting') : t('exportExcel')}
                        </button>

                        <Link to="add">
                            <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 flex items-center gap-2 shadow-lg transition-all">
                                <FaPlus />
                                {t('addNewRawStock')}
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Search & Limit Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:max-w-xl">
                        <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder={t('searchRawStockPlaceholder')}
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white bg-primary dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-3 bg-white bg-primary px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('show')}:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
                        >
                            <option value={10}>10 {t('itemsCount')}</option>
                            <option value={25}>25 {t('itemsCount')}</option>
                            <option value={50}>50 {t('itemsCount')}</option>
                            <option value={100}>100 {t('itemsCount')}</option>
                        </select>
                    </div>
                </div>

                {/* Summary Dashboard */}
                {data?.pagination && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <StatCard
                            title={t('totalRawStockRecords')}
                            value={data.pagination.total}
                            icon={<FaClipboardList className="text-blue-500" />}
                            color="from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"
                        />
                        <StatCard
                            title={t('currentPage')}
                            value={data.pagination.current_page}
                            icon={<FaBoxOpen className="text-green-500" />}
                            color="from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20"
                        />
                        <StatCard
                            title={t('itemsOnPage')}
                            value={stocks.length}
                            icon={<FaCubes className="text-orange-500" />}
                            color="from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20"
                        />
                        <StatCard
                            title={t('lastPage')}
                            value={data.pagination.last_page}
                            icon={<FaShoppingCart className="text-purple-500" />}
                            color="from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
                        />
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <LoadingState />
                ) : stocks.length === 0 ? (
                    <EmptyState />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {stocks.map((stock) => (
                            <GridItem key={stock.stock_id} stock={stock} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white bg-primary rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('stockDetails')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('createdBy')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('transfer')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('items')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('date')}</th>
                                        {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('totalValue')}</th> */}
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {stocks.map((stock) => (
                                        <ListItem key={stock.stock_id} stock={stock} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {data?.pagination && data.pagination.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 bg-white bg-primary p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t('showing')} <span className="font-bold text-gray-900 dark:text-white">{(page - 1) * limit + 1}</span> {t('to')}{' '}
                            <span className="font-bold text-gray-900 dark:text-white">{Math.min(page * limit, data.pagination.total)}</span> {t('of')}{' '}
                            <span className="font-bold text-gray-900 dark:text-white">{data.pagination.total}</span> {t('results')}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
                            </button>
                            {Array.from({ length: data.pagination.last_page }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === data.pagination.last_page || (p >= page - 1 && p <= page + 1))
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                                        <button
                                            onClick={() => setPage(p)}
                                            className={`w-10 h-10 rounded-lg font-semibold transition-all ${page === p ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'hover:bg-blue-50 dark:hover:bg-blue-700 text-gray-600 dark:text-gray-400'}`}
                                        >
                                            {p}
                                        </button>
                                    </React.Fragment>
                                ))}
                            <button
                                onClick={() => setPage(p => Math.min(data.pagination.last_page, p + 1))}
                                disabled={page === data.pagination.last_page}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FaChevronRight className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockRaws;
