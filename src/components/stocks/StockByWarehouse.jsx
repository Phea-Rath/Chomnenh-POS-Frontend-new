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
import { useGetAllWarehousesQuery } from '../../../app/Features/warehousesSlice';
import api from '../../services/api';

const STOCK_FIELDS = [
    { key: 'in_stock', label: 'In Stock', className: 'text-blue-600 bg-blue-50' },
    { key: 'stock_in', label: 'Stock In', className: 'text-green-600 bg-green-50' },
    { key: 'stock_out', label: 'Stock Out', className: 'text-red-600 bg-red-50' },
    { key: 'stock_return', label: 'Stock Return', className: 'text-cyan-600 bg-cyan-50' },
    { key: 'stock_wasted', label: 'Stock Wasted', className: 'text-yellow-600 bg-yellow-50' },
    { key: 'sold', label: 'Sold', className: 'text-purple-600 bg-purple-50' },
];

const StockByWarehouse = () => {
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
            setSelectedWarehouse(String(warehouses[0].warehouse_id));
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
            toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch stock by warehouse');
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
        return warehouses.find((warehouse) => String(warehouse.warehouse_id) === String(selectedWarehouse))?.warehouse_name || 'Warehouse';
    }, [warehouses, selectedWarehouse]);

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
            toast.warning('No data to export');
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
            toast.success(`Exported ${filteredStocks.length} items`);
        } catch (error) {
            toast.error('Export failed');
        } finally {
            setExportLoading(false);
        }
    };

    const ProductImage = ({ src, alt, className = 'h-14 w-14 rounded-xl' }) => {
        const [hasError, setHasError] = useState(false);

        if (!src || hasError) {
            return (
                <div className={`flex items-center justify-center border border-blue-200 bg-gradient-to-br from-slate-200 via-slate-100 to-blue-50 text-lg font-bold text-blue-700 ${className}`}>
                    {alt?.charAt(0) || 'P'}
                </div>
            );
        }

        return (
            <img
                src={src}
                alt={alt}
                className={`border border-gray-200 object-cover ${className}`}
                onError={() => setHasError(true)}
            />
        );
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className={`rounded-xl border border-gray-200 bg-gradient-to-r ${color} p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="rounded-full bg-white p-3 shadow-sm">{icon}</div>
            </div>
        </div>
    );

    const EmptyState = () => (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <FaWarehouse className="text-3xl text-blue-600" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">No Stock Found</h3>
            <p className="mx-auto max-w-lg text-gray-500">
                {selectedWarehouse
                    ? 'No items match the selected warehouse or current search.'
                    : 'Select a warehouse to view available stock.'}
            </p>
        </div>
    );

    const LoadingState = () => (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-6 h-14 w-14 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-lg font-medium text-gray-700">Loading warehouse stock...</p>
            <p className="mt-2 text-sm text-gray-500">Fetching item balances for the selected warehouse</p>
        </div>
    );

    const GridItem = ({ item }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_rgba(37,99,235,0.35)]"
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
                        <p className="mb-1 inline-flex rounded-full bg-white/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-sm">
                            {item.category_name || 'Stock Item'}
                        </p>
                        <p className="truncate text-lg font-bold text-white">{item.item_name}</p>
                    </div>
                    <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {item.brand_name || 'N/A'}
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div>
                    <h3 className="text-[1.55rem] font-bold tracking-tight text-slate-900">{item.item_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {item.item_code || 'N/A'} {item.barcode ? `| ${item.barcode}` : ''}
                    </p>
                    <p className="mt-2 text-[15px] text-slate-600">
                        Price: <span className="font-semibold text-slate-800">${formatNumber(item.item_price)}</span> | Wholesale: <span className="font-semibold text-slate-800">${formatNumber(item.wholesale_price)}</span>
                    </p>
                </div>

                <div className="rounded-[20px] bg-slate-50 p-4 shadow-inner">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                            <p className="text-[13px] font-medium text-slate-500">Stock In (IN)</p>
                            <p className="mt-1 text-md font-bold text-emerald-600">+ {formatNumber(item?.stock?.stock_in)}</p>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500">Stock Return (RET)</p>
                            <p className="mt-1 text-md font-bold text-sky-600">+ {formatNumber(item?.stock?.stock_return)}</p>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500">Stock Out (OUT)</p>
                            <p className="mt-1 text-md font-bold text-orange-500">- {formatNumber(item?.stock?.stock_out)}</p>
                        </div>
                        <div>
                            <p className="text-[13px] font-medium text-slate-500">Stock Wasted</p>
                            <p className="mt-1 text-md font-bold text-rose-500">- {formatNumber(item?.stock?.stock_wasted)}</p>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-dashed border-slate-300 pt-3">
                        <p className="text-[13px] font-medium text-slate-500">Sold</p>
                        <p className="mt-1 text-md font-bold text-violet-600">- {formatNumber(item?.stock?.sold)}</p>
                    </div>
                </div>

                <div className="rounded-[20px] border border-blue-100 bg-gradient-to-b from-sky-50 to-blue-50 px-5 py-6 text-center">
                    <p className="text-sm font-semibold text-blue-600">Available Stock</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-slate-900">{formatNumber(getNetAvailable(item))}</p>
                    <p className="mt-2 text-sm text-slate-500">
                        Cost Value: <span className="font-semibold text-slate-700">${formatNumber(Number(item.item_cost || 0) * getNetAvailable(item))}</span>
                    </p>
                </div>

                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                >
                    <FaListUl className="text-base" />
                    View Stock Details
                </button>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-transparent p-4 md:p-6"
        >
            <div className="mx-auto">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900">
                            Stock By <span className="text-blue-600">Warehouse</span>
                        </h1>
                        <p className="text-gray-600">Select a warehouse to view item stock balances and all stock movement totals.</p>
                        {responseMessage && <p className="mt-2 text-sm font-medium text-green-600">{responseMessage}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('table')}
                                className={`rounded-md p-2 transition-all ${viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Table View"
                            >
                                <IoIosList size={22} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleViewModeChange('grid')}
                                className={`rounded-md p-2 transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <IoIosGrid size={22} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => fetchStocksByWarehouse(selectedWarehouse)}
                            disabled={!selectedWarehouse || loading}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={exportToExcel}
                            disabled={exportLoading || filteredStocks.length === 0}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FaFileExport />
                            {exportLoading ? 'Exporting...' : 'Export Excel'}
                        </button>
                    </div>
                </div>

                <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Warehouse</label>
                            <div className="relative">
                                <FaWarehouse className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    disabled={warehouseLoading}
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                                            {warehouse.warehouse_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">Search Item</label>
                            <div className="relative">
                                <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by item name, code, barcode, category, brand..."
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:w-auto"
                            >
                                Clear Search
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Selected Warehouse"
                        value={selectedWarehouseName}
                        icon={<FaWarehouse className="text-blue-600" />}
                        color="from-blue-50 to-cyan-50"
                    />
                    <StatCard
                        title="Items Found"
                        value={filteredStocks.length}
                        icon={<FaClipboardList className="text-green-600" />}
                        color="from-green-50 to-emerald-50"
                    />
                    <StatCard
                        title="Total In Stock"
                        value={totals.in_stock}
                        icon={<FaBoxOpen className="text-orange-600" />}
                        color="from-orange-50 to-amber-50"
                    />
                    <StatCard
                        title="Total Sold"
                        value={totals.sold}
                        icon={<FaShoppingCart className="text-purple-600" />}
                        color="from-purple-50 to-fuchsia-50"
                    />
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
                    {STOCK_FIELDS.map((field) => (
                        <div key={field.key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <p className="text-sm font-medium text-gray-600">{field.label}</p>
                            <p className="mt-2 text-2xl font-bold text-gray-900">{totals[field.key]}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <LoadingState />
                ) : filteredStocks.length === 0 ? (
                    <EmptyState />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {filteredStocks.map((item) => (
                            <GridItem key={item.item_id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Product</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Brand</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Price</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Cost</th>
                                        <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Wholesale</th>
                                        {STOCK_FIELDS.map((field) => (
                                            <th key={field.key} className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                                                {field.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStocks.map((item) => (
                                        <tr key={item.item_id} className="hover:bg-blue-50/40">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <ProductImage src={getImageSrc(item)} alt={item.item_name} />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{item.item_name}</p>
                                                        <p className="text-xs text-gray-500">{item.barcode || 'No barcode'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-mono text-gray-600">{item.item_code || 'N/A'}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700">{item.category_name || 'N/A'}</td>
                                            <td className="px-4 py-4 text-sm text-gray-700">{item.brand_name || 'N/A'}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800">${Number(item.item_price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800">${Number(item.item_cost || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right text-sm font-medium text-gray-800">${Number(item.wholesale_price || 0).toFixed(2)}</td>
                                            {STOCK_FIELDS.map((field) => (
                                                <td key={field.key} className="px-4 py-4 text-right text-sm font-bold text-gray-800">
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
