import React, { useEffect, useState } from "react";
import {
  LuTruck,
  LuDownload,
  LuSearch,
  LuFilter,
  LuRefreshCw,
  LuPlus,
  LuArrowRightLeft,
  LuCalendar,
  LuWarehouse,
  LuPackage,
  LuInfo,
  LuMenu,
  LuX,
  LuList,
  LuGrid3X3,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

// Helper for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const StockTransferList = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    sortField: null,
    sortOrder: null,
  });
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [warehouses, setWarehouses] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Responsive detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto switch to grid view on mobile
  useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('grid');
    } else if (!isMobile && viewMode === 'grid') {
      setViewMode('table');
    }
  }, [isMobile]);

  // Calculate statistics
  const calculateStats = () => {
    const totalTransfers = filteredData.length;
    const totalStockIn = filteredData.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const totalStockOut = filteredData.reduce((sum, item) => sum + (Number(item.stock_out) || 0), 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const netTransfer = totalStockIn - totalStockOut;

    const uniqueFrom = new Set(filteredData.map(item => item.from_warehouse_name));
    const uniqueTo = new Set(filteredData.map(item => item.to_warehouse_name));
    const uniqueWarehouses = new Set([...uniqueFrom, ...uniqueTo]).size;

    return { totalTransfers, totalStockIn, totalStockOut, totalQuantity, netTransfer, uniqueWarehouses };
  };
  const stats = calculateStats();

  // Extract unique warehouses for filter dropdown
  useEffect(() => {
    if (data.length > 0) {
      const warehouseSet = new Set();
      data.forEach(item => {
        if (item.from_warehouse_name) warehouseSet.add(item.from_warehouse_name);
        if (item.to_warehouse_name) warehouseSet.add(item.to_warehouse_name);
      });
      setWarehouses(Array.from(warehouseSet));
    }
  }, [data]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: tableParams.pagination.current,
      limit: tableParams.pagination.pageSize,
    });
    try {
      const res = await api.get(`/stock_transfer?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.status === 200 && res.data) {
        setData(res.data.data);
        setFilteredData(res.data.data);
        setTableParams(prev => ({
          ...prev,
          pagination: {
            ...prev.pagination,
            total: res.data.pagination?.total || res.data.data?.length || 0,
          },
        }));
      }
    } catch (error) {
      toast.error(t('failedToFetchData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableParams.pagination.current, tableParams.pagination.pageSize, tableParams.sortField, tableParams.sortOrder]);

  // Apply filters
  useEffect(() => {
    let result = [...data];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.item_code?.toLowerCase().includes(term) ||
        item.item_name?.toLowerCase().includes(term) ||
        item.barcode?.includes(term) ||
        item.category_name?.toLowerCase().includes(term) ||
        item.brand_name?.toLowerCase().includes(term) ||
        item.from_warehouse_name?.toLowerCase().includes(term) ||
        item.to_warehouse_name?.toLowerCase().includes(term)
      );
    }
    if (selectedWarehouse !== "all") {
      result = result.filter(item =>
        item.from_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase() ||
        item.to_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase()
      );
    }
    if (dateRange.start && dateRange.end) {
      const start = dayjs(dateRange.start);
      const end = dayjs(dateRange.end);
      result = result.filter(item => {
        const itemDate = dayjs(item.created_at);
        return itemDate.isAfter(start) && itemDate.isBefore(end.add(1, 'day'));
      });
    }
    // Sorting
    if (tableParams.sortField) {
      result.sort((a, b) => {
        let aVal = a[tableParams.sortField];
        let bVal = b[tableParams.sortField];
        if (tableParams.sortField === 'quantity' || tableParams.sortField === 'stock_in' || tableParams.sortField === 'stock_out') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }
        if (aVal < bVal) return tableParams.sortOrder === 'ascend' ? -1 : 1;
        if (aVal > bVal) return tableParams.sortOrder === 'ascend' ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(result);
  }, [data, searchTerm, selectedWarehouse, dateRange, tableParams.sortField, tableParams.sortOrder]);

  // Handlers
  const handleSort = (field) => {
    let order = 'ascend';
    if (tableParams.sortField === field && tableParams.sortOrder === 'ascend') {
      order = 'descend';
    } else if (tableParams.sortField === field && tableParams.sortOrder === 'descend') {
      order = null;
    }
    setTableParams(prev => ({ ...prev, sortField: order ? field : null, sortOrder: order }));
  };

  const handlePageChange = (page) => {
    setTableParams(prev => ({
      ...prev,
      pagination: { ...prev.pagination, current: page },
    }));
  };

  const handlePageSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setTableParams(prev => ({
      ...prev,
      pagination: { ...prev.pagination, pageSize: size, current: 1 },
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDeleteTransfer'))) return;
    try {
      const res = await api.delete(`stock_masters/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.status === 200) {
        toast.success(t('transferDeleted'));
        fetchData();
      }
    } catch (error) {
      toast.error(t('deleteFailed'));
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedWarehouse('all');
    setDateRange({ start: null, end: null });
    if (mobileFiltersOpen) setMobileFiltersOpen(false);
  };

  const exportToExcel = () => {
    try {
      setExportLoading(true);
      const dataToExport = filteredData.map(item => ({
        [t('stockNumber')]: item.stock_no,
        [t('fromWarehouse')]: item.from_warehouse_name,
        [t('toWarehouse')]: item.to_warehouse_name,
        [t('quantity')]: item.quantity,
        [t('productName')]: item.item_name,
        [t('itemCode')]: item.item_code,
        [t('transferDate')]: dayjs(item.created_at).format('YYYY-MM-DD HH:mm'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(fileData, `stock_transfers_${dayjs().format('YYYYMMDD')}.xlsx`);
      toast.success(`${t('exported')} ${dataToExport.length} ${t('items')}`);
    } catch (error) {
      toast.error(t('exportFailed'));
    } finally {
      setExportLoading(false);
    }
  };

  // Helper components
  const Badge = ({ children, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[color]} transition-colors`}>{children}</span>;
  };

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-gray-500/20 dark:to-gray-500/20 transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 bg-white dark:bg-gray-800 rounded-full text-${color}-600 dark:text-${color}-400 shadow-sm`}>{icon}</div>
      </div>
    </div>
  );

  const Pagination = () => {
    const totalPages = Math.ceil(tableParams.pagination.total / tableParams.pagination.pageSize);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('rowsPerPage')}:</span>
          <select
            value={tableParams.pagination.pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={tableParams.pagination.current === 1}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <LuChevronsLeft />
          </button>
          <button
            onClick={() => handlePageChange(tableParams.pagination.current - 1)}
            disabled={tableParams.pagination.current === 1}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <LuChevronLeft />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {t('page')} {tableParams.pagination.current} {t('of')} {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(tableParams.pagination.current + 1)}
            disabled={tableParams.pagination.current === totalPages || totalPages === 0}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <LuChevronRight />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={tableParams.pagination.current === totalPages || totalPages === 0}
            className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <LuChevronsRight />
          </button>
        </div>
      </div>
    );
  };

  // Table View
  const TableView = () => {
    const start = (tableParams.pagination.current - 1) * tableParams.pagination.pageSize;
    const paginatedData = filteredData.slice(start, start + tableParams.pagination.pageSize);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 w-16">#</th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('stock_no')}>
                  {t('stockNumber')} {tableParams.sortField === 'stock_no' && (tableParams.sortOrder === 'ascend' ? '↑' : '↓')}
                </th>
                {!isMobile && (
                  <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">{t('transferDetails')}</th>
                )}
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort('quantity')}>
                  {t('quantityCount')} {tableParams.sortField === 'quantity' && (tableParams.sortOrder === 'ascend' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => {
                const index = start + idx + 1;
                return (
                  <tr key={`${item.stock_id}-${item.created_at}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{index}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.stock_no}</div>
                      {isMobile && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {dayjs(item.created_at).format('MMM DD')}
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge color="red">{item.from_warehouse_name}</Badge>
                            <LuArrowRightLeft className="text-gray-400 dark:text-gray-500 text-xs" />
                            <Badge color="green">{item.to_warehouse_name}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <LuCalendar className="w-3 h-3" />
                            {dayjs(item.created_at).format('MMM DD, YYYY HH:mm')}
                          </div>
                          {item.item_name && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-xs">
                              <span className="font-medium">{t('material')}:</span> {item.item_name} ({item.item_code})
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{item.quantity}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Link to={`detail/${item.stock_id}`} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                          <FaEye size={14} />
                        </Link>
                        <Link to={`update/${item.stock_id}`} className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                          <FaEdit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.stock_id)}
                          className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>
    );
  };

  // Grid View (Mobile/Responsive)
  const GridView = () => {
    const start = (tableParams.pagination.current - 1) * tableParams.pagination.pageSize;
    const paginatedData = filteredData.slice(start, start + tableParams.pagination.pageSize);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {paginatedData.map((item, idx) => (
            <div key={`${item.stock_id}-${item.created_at}`} className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color="blue">{item.stock_no}</Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{start + idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-white text-lg">{item.item_name || t('transfer')}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <LuWarehouse className="text-red-500 w-4 h-4" />
                    <span className="text-sm text-red-600 dark:text-red-400">{item.from_warehouse_name}</span>
                    <LuArrowRightLeft className="text-gray-400 dark:text-gray-500 mx-1" />
                    <LuWarehouse className="text-green-500 w-4 h-4" />
                    <span className="text-sm text-green-600 dark:text-green-400">{item.to_warehouse_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{item.quantity}</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('unitsCount')}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2 transition-colors">
                <div className="flex items-center gap-1">
                  <LuCalendar className="w-3 h-3" />
                  {dayjs(item.created_at).format('MMM DD, YYYY HH:mm')}
                </div>
                <div className="flex gap-2">
                  <Link to={`detail/${item.stock_id}`} className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition-colors hover:bg-blue-200 dark:hover:bg-blue-900/50">
                    <FaEye size={14} />
                  </Link>
                  <Link to={`update/${item.stock_id}`} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded transition-colors hover:bg-green-200 dark:hover:bg-green-900/50">
                    <FaEdit size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.stock_id)}
                    className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition-colors hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination />
      </div>
    );
  };

  // Mobile Filters Drawer
  const MobileFilters = () => (
    <>
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity" onClick={() => setMobileFiltersOpen(false)} />
      )}
      <div className={`fixed top-0 right-0 z-50 h-full w-80 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${mobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('filters')}</h2>
            <button onClick={() => setMobileFiltersOpen(false)}>
              <LuX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('search')}</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchTransfers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('warehouse')}</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="all">{t('allWarehouses')}</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('startDate')}</label>
              <input
                type="date"
                value={dateRange.start ? dayjs(dateRange.start).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? dayjs(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('endDate')}</label>
              <input
                type="date"
                value={dateRange.end ? dayjs(dateRange.end).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? dayjs(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md transition-colors"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={resetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('resetAll')}
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Empty State
  const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50 transition-colors">
      <LuTruck className="text-5xl text-gray-400 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">{t('noRecordsFound')}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{t('tryAdjustingSearch')}</p>
      <Link to="/transfer-stock">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto transition-colors">
          <LuPlus /> {t('createTransfer')}
        </button>
      </Link>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-4 md:p-6 view-page"
    >
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 shadow-lg dark:shadow-blue-800/50">
              <LuTruck className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('stockTransferRecords')}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{t('monitorTrackTransfers')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMobile && (
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden transition-colors">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <LuList />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <LuGrid3X3 />
                </button>
              </div>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <LuRefreshCw className={loading ? 'animate-spin' : ''} /> {!isMobile && t('refresh')}
            </button>
            <button
              onClick={exportToExcel}
              disabled={exportLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <LuDownload /> {!isMobile && (exportLoading ? t('exporting') : t('export'))}
            </button>
            <Link to="/transfer-stock">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                <LuPlus /> {!isMobile && t('newTransfer')}
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-6">
          <StatCard title={t('total')} value={stats.totalTransfers} icon={<LuTruck />} color="blue" />
          <StatCard title={t('net')} value={stats.netTransfer} icon={<LuArrowRightLeft />} color="cyan" />
          <StatCard title={t('warehouses')} value={stats.uniqueWarehouses} icon={<LuWarehouse />} color="orange" />
        </div>

        {/* Filters - Desktop */}
        {!isMobile && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
            <div className="flex flex-wrap text-sm items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchTransfers')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="all">{t('allWarehouses')}</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateRange.start ? dayjs(dateRange.start).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? dayjs(e.target.value) : null }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md transition-colors"
                placeholder={t('startDate')}
              />
              <input
                type="date"
                value={dateRange.end ? dayjs(dateRange.end).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? dayjs(e.target.value) : null }))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md transition-colors"
                placeholder={t('endDate')}
              />
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('resetFilters')}
              </button>
            </div>
          </div>
        )}

        {/* Filters - Mobile */}
        {isMobile && (
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <LuFilter />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {viewMode === 'grid' ? <LuList /> : <LuGrid3X3 />}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'table' && !isMobile ? (
          <TableView />
        ) : (
          <GridView />
        )}

        {/* Mobile Filters Drawer */}
        <MobileFilters />

        {/* Mobile FAB */}
        {isMobile && (
          <Link to="/transfer-stock">
            <button className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors">
              <LuPlus size={24} />
            </button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default StockTransferList;
