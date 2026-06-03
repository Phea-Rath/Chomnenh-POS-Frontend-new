import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IoIosGrid, IoIosList, IoIosSearch } from 'react-icons/io';
import {
    FaBoxOpen,
    FaClipboardList,
    FaFileExport,
    FaListUl,
    FaShoppingCart,
    FaSyncAlt,
    FaWarehouse,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useGetAllWarehousesQuery } from '../../../app/Features/warehousesSlice';
import api from '../../services/api';
import { useParams } from 'react-router';
import RefreshButton from '../../utils/RefreshButton';

const STOCK_FIELDS = [
    { key: 'in_stock', label: 'In Stock', kh: 'ក្នុងស្តុក', className: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    { key: 'stock_in', label: 'Stock In', kh: 'ស្តុកចូល', className: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
    { key: 'stock_out', label: 'Stock Out', kh: 'ស្តុកចេញ', className: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
    { key: 'stock_return', label: 'Stock Return', kh: 'ស្តុកប្តូរវិញ', className: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400' },
    { key: 'stock_wasted', label: 'Stock Wasted', kh: 'ស្តុកខូច', className: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400' },
    { key: 'sold', label: 'Sold', kh: 'លក់ចេញ', className: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
];

const StockByWarehouse = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const warehouse_id = id ?? 1;
    const isKhmer = i18n.language === 'kh';
    const token = localStorage.getItem('token');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('stockByWarehouseViewMode') || 'grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');

    const { data: warehouseResponse, isLoading: warehouseLoading } = useGetAllWarehousesQuery(token);
    const warehouses = warehouseResponse?.data || [];

    useEffect(() => {
        if (!selectedWarehouse && warehouses.length > 0) {
            setSelectedWarehouse(String(warehouse_id));
        }
    }, [warehouses, selectedWarehouse]);

    const fetchStocksByWarehouse = async (warehouseId) => {
        if (!warehouseId) {
            setStocks([]);
            setResponseMessage('');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/stock_by_warehouse/${warehouseId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            setStocks(Array.isArray(res?.data?.data) ? res.data.data : []);
            setResponseMessage(res?.data?.message || '');
        } catch (error) {
            setStocks([]);
            setResponseMessage('');
            toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch stock');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocksByWarehouse(selectedWarehouse);
    }, [selectedWarehouse]);

    const filteredStocks = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return stocks;

        return stocks.filter((item) =>
            item.item_name?.toLowerCase().includes(keyword) ||
            item.item_code?.toLowerCase().includes(keyword) ||
            item.barcode?.toLowerCase().includes(keyword) ||
            item.category_name?.toLowerCase().includes(keyword) ||
            item.brand_name?.toLowerCase().includes(keyword)
        );
    }, [stocks, searchTerm]);

    const selectedWarehouseName = useMemo(() => {
        return warehouses.find((warehouse) => String(warehouse.warehouse_id) === String(selectedWarehouse))?.warehouse_name || t('warehouse');
    }, [warehouses, selectedWarehouse, t]);

    const getImageSrc = (item) => {
        if (typeof item?.image === 'string' && item.image.trim()) return item.image;
        if (typeof item?.images === 'string' && item.images.trim()) return item.images;
        return '';
    };

    const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const getNetAvailable = (item) => Number(item?.stock?.in_stock || 0);

    const totals = useMemo(() => {
        return filteredStocks.reduce((acc, item) => {
            STOCK_FIELDS.forEach(({ key }) => {
                acc[key] += Number(item?.stock?.[key] || 0);
            });
            return acc;
        }, { in_stock: 0, stock_return: 0, stock_in: 0, stock_out: 0, stock_wasted: 0, sold: 0 });
    }, [filteredStocks]);

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('stockByWarehouseViewMode', mode);
    };

    const exportToExcel = () => {
        if (filteredStocks.length === 0) {
            toast.warning(t('noDataToExport', 'No data to export'));
            return;
        }

        try {
            setExportLoading(true);

            const dataToExport = filteredStocks.map((item, index) => ({
                'No.': index + 1,
                'Item ID': item.item_id,
                'Item Code': item.item_code || 'N/A',
                Barcode: item.barcode || 'N/A',
                'Item Name': item.item_name || 'N/A',
                Category: item.category_name || 'N/A',
                Brand: item.brand_name || 'N/A',
                'Item Price': Number(item.item_price || 0),
                'Item Cost': Number(item.item_cost || 0),
                'Wholesale Price': Number(item.wholesale_price || 0),
                'In Stock': Number(item?.stock?.in_stock || 0),
                'Stock In': Number(item?.stock?.stock_in || 0),
                'Stock Out': Number(item?.stock?.stock_out || 0),
                'Stock Return': Number(item?.stock?.stock_return || 0),
                'Stock Wasted': Number(item?.stock?.stock_wasted || 0),
                Sold: Number(item?.stock?.sold || 0),
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock By Warehouse');
            XLSX.writeFile(workbook, `Stock_By_Warehouse_${selectedWarehouseName.replace(/\s+/g, '_')}.xlsx`);
            toast.success(`${t('exported')} ${filteredStocks.length} ${t('items')}`);
        } catch (error) {
            toast.error(t('exportFailed', 'Export failed'));
        } finally {
            setExportLoading(false);
        }
    };

    const ProductImage = ({ src, alt, className = 'h-14 w-14 ' }) => {
        const [hasError, setHasError] = useState(false);

        if (!src || hasError) {
            return (
                <div className={`flex items-center justify-center border border-blue-200 bg-gradient-to-br from-slate-200 via-slate-100 to-blue-50 text-lg font-bold text-blue-700 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:text-blue-400 dark:border-slate-600 ${className}`}>
                    {alt?.charAt(0) || 'P'}
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                className={`border border-gray-200 dark:border-slate-700 object-cover ${className}`}
                onError={() => setHasError(true)}
            />
        );
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className={` border border-gray-200 dark:border-slate-700 bg-gradient-to-r ${color} p-4 shadow-xs transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className="rounded-full bg-white dark:bg-slate-800 p-3 shadow-xs">{icon}</div>
            </div>
        </div>
    );

    const EmptyState = () => (
        <div className=" border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <FaWarehouse className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{t('noStockFound', 'No Stock Found')}</h3>
            <p className="mx-auto max-w-lg text-gray-500 dark:text-slate-400">
                {selectedWarehouse
                    ? t('noStockMatch', 'No items match the selected warehouse or current search.')
                    : t('selectWarehousePrompt', 'Select a warehouse to view available stock.')}
            </p>
        </div>
    );

    const LoadingState = () => (
        <div className=" border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-12 text-center shadow-xs">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400" />
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">{t('loadingWarehouseStock', 'Loading warehouse stock...')}</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-500">{t('fetchingItemBalances', 'Fetching item balances for the selected warehouse')}</p>
        </div>
    );

    const GridItem = ({ item }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_rgba(37,99,235,0.25)]"
        >
            <div className="relative h-52 overflow-hidden bg-slate-900">
                <ProductImage
                    src={getImageSrc(item)}
                    alt={item.item_name}
                    className="h-full w-full rounded-none border-0 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <p className="inline-flex rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                            {item.category_name || t('stockItem')}
                        </p>
                        {/* <p className="truncate text-lg font-bold text-white">{item.item_name}</p> */}
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {item.brand_name || 'N/A'}
                    </div>
                </div>
            </div>

            <div className="space-y-2 p-5">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">{item.item_name}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.item_code || 'N/A'} {item.barcode ? `| ${item.barcode}` : ''}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        {t('price')}: <span className="font-semibold text-slate-800 dark:text-slate-100">${formatNumber(item.item_price)}</span> | {t('wholesale')}: <span className="font-semibold text-slate-800 dark:text-slate-100">${formatNumber(item.wholesale_price)}</span>
                    </p>
                </div>

                <div className="rounded-[20px] bg-slate-50 dark:bg-slate-900/50 p-4 shadow-inner border border-slate-100 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stockIn')} (IN)</p>
                            <p className="mt-1 text-md font-bold text-emerald-600 dark:text-emerald-400">+ {Number(item?.stock?.stock_in)}</p>
                        </div>
                        <div>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stockReturn')} (RET)</p>
                            <p className="mt-1 text-md font-bold text-sky-600 dark:text-sky-400">+ {Number(item?.stock?.stock_return)}</p>
                        </div>
                        <div>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stockOut')} (OUT)</p>
                            <p className="mt-1 text-md font-bold text-orange-500 dark:text-orange-400">- {Number(item?.stock?.stock_out)}</p>
                        </div>
                        <div>
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('stockWasted')}</p>
                            <p className="mt-1 text-md font-bold text-rose-500 dark:text-rose-400">- {Number(item?.stock?.stock_wasted)}</p>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-dashed border-slate-300 dark:border-slate-700 pt-3">
                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('sold')}</p>
                        <p className="mt-1 text-md font-bold text-violet-600 dark:text-violet-400">- {Number(item?.stock?.sold)}</p>
                    </div>
                </div>

                <div className="rounded-sm border border-blue-100 dark:border-blue-900/30 bg-gradient-to-b from-sky-50 to-blue-50 dark:from-slate-800/50 dark:to-blue-900/10 px-5 py-2 text-center">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('availableStock')}</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-blue-500 dark:text-blue-600">{getNetAvailable(item)}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {t('costValue')}: <span className="font-semibold text-slate-700 dark:text-slate-200">${formatNumber(Number(item.item_cost || 0) * getNetAvailable(item))}</span>
                    </p>
                </div>

                {/* <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2  border border-blue-500 bg-white dark:bg-slate-700 px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-300 transition-colors hover:bg-blue-50 dark:hover:bg-slate-600"
                >
                    <FaListUl className="text-base" />
                    {t('viewStockDetails', 'View Stock Details')}
                </button> */}
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className={`min-h-screen bg-transparent p-2 md:p-2 ${isKhmer ? 'font-khmer' : ''}`}
        >
            <div className="mx-auto">
                <div className="mb-2 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                            {t('stockBy')} <span className="text-blue-600 dark:text-blue-400">{t('warehouse')}</span>
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400">{t('stockByWarehouseDesc', 'Select a warehouse to view item stock balances and all stock movement totals.')}</p>
                        {/* {responseMessage && <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">{responseMessage}</p>} */}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex  border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-xs">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('table')}
                                className={` p-2 transition-all ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                title={t('tableView')}
                            >
                                <IoIosList size={22} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('grid')}
                                className={` p-2 transition-all ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                                title={t('gridView')}
                            >
                                <IoIosGrid size={22} />
                            </button>
                        </div>

                        <RefreshButton onRefresh={() => fetchStocksByWarehouse(selectedWarehouse)} />

                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={exportLoading || filteredStocks.length === 0}
                            className="inline-flex items-center gap-2  border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 shadow-xs hover:bg-blue-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaFileExport />
                            {exportLoading ? t('exporting') : t('exportExcel')}
                        </button>
                    </div>
                </div>

                <div className="mb-2  border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('warehouse')}</label>
                            <div className="relative">
                                <FaWarehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                                <select
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    disabled={warehouseLoading}
                                    className="w-full  border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                >
                                    <option value="">{t('selectWarehouse', 'Select warehouse')}</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                                            {warehouse.warehouse_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex-[2]">
                            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('searchItem')}</label>
                            <div className="relative">
                                <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('searchStockPlaceholder', 'Search by item name, code, barcode...')}
                                    className="w-full  border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="w-full  border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 lg:w-auto"
                            >
                                {t('clearSearch')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title={t('selectedWarehouse')}
                        value={selectedWarehouseName}
                        icon={<FaWarehouse className="text-blue-600 dark:text-blue-400" />}
                        color="from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900"
                    />
                    <StatCard
                        title={t('itemsFound')}
                        value={filteredStocks.length}
                        icon={<FaClipboardList className="text-green-600 dark:text-green-400" />}
                        color="from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900"
                    />
                    <StatCard
                        title={t('totalInStock')}
                        value={totals.in_stock}
                        icon={<FaBoxOpen className="text-orange-600 dark:text-orange-400" />}
                        color="from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-900"
                    />
                    <StatCard
                        title={t('totalSold')}
                        value={totals.sold}
                        icon={<FaShoppingCart className="text-purple-600 dark:text-purple-400" />}
                        color="from-purple-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    {STOCK_FIELDS.map((field) => (
                        <div key={field.key} className=" border grow border-gray-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-xs">
                            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">{isKhmer ? field.kh : field.label}</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white leading-none">{totals[field.key]}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <LoadingState />
                ) : filteredStocks.length === 0 ? (
                    <EmptyState />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {filteredStocks.map((item) => (
                            <GridItem key={item.item_id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead className="border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">{t('product')}</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">{t('code')}</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">{t('category')}</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700 dark:text-slate-300">{t('brand')}</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">{t('price')}</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">{t('cost')}</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">{t('wholesale')}</th>
                                        {STOCK_FIELDS.map((field) => (
                                            <th key={field.key} className="px-4 py-4 text-right text-sm font-semibold text-gray-700 dark:text-slate-300">
                                                {isKhmer ? field.kh : field.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs dark:divide-slate-700">
                                    {filteredStocks.map((item) => (
                                        <tr key={item.item_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={getImageSrc(item)} alt={item.item_name} />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{item.item_name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.barcode || 'No barcode'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-mono text-gray-600 dark:text-slate-400">{item.item_code || 'N/A'}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-slate-300">{item.category_name || 'N/A'}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-slate-300">{item.brand_name || 'N/A'}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-slate-100">${Number(item.item_price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-slate-100">${Number(item.item_cost || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-slate-100">${Number(item.wholesale_price || 0).toFixed(2)}</td>
                                            {STOCK_FIELDS.map((field) => (
                                                <td key={field.key} className="px-4 py-4 text-right text-sm font-bold text-gray-800 dark:text-slate-100">
                                                    {Number(item?.stock?.[field.key] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StockByWarehouse;
