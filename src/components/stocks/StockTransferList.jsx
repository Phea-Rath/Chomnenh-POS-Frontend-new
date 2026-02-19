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

// Helper for debouncing (optional)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const StockTransferList = () => {
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
      toast.error("Failed to fetch data. Please try again.");
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
    if (!window.confirm('Are you sure you want to delete this transfer?')) return;
    try {
      const res = await api.delete(`stock_transfer/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.data.status === 200) {
        toast.success('Transfer deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Delete failed');
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
        'Stock No.': item.stock_no,
        'From Warehouse': item.from_warehouse_name,
        'To Warehouse': item.to_warehouse_name,
        'Quantity': item.quantity,
        'Item Name': item.item_name,
        'Item Code': item.item_code,
        'Transfer Date': dayjs(item.created_at).format('YYYY-MM-DD HH:mm'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transfers');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(fileData, `stock_transfers_${dayjs().format('YYYYMMDD')}.xlsx`);
      toast.success(`Exported ${dataToExport.length} records`);
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper components
  const Badge = ({ children, color = 'blue' }) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
  };

  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-${color}-50 to-${color}-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 bg-white rounded-full text-${color}-600`}>{icon}</div>
      </div>
    </div>
  );

  const ProductImage = ({ src, alt }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
      return (
        <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold">
          {alt?.charAt(0) || 'P'}
        </div>
      );
    }
    return <img src={src} alt={alt} className="w-10 h-10 rounded object-cover" onError={() => setError(true)} />;
  };

  // Pagination controls
  const totalPages = Math.ceil(tableParams.pagination.total / tableParams.pagination.pageSize);
  const Pagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Rows per page:</span>
        <select
          value={tableParams.pagination.pageSize}
          onChange={handlePageSizeChange}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <LuChevronsLeft />
        </button>
        <button
          onClick={() => handlePageChange(tableParams.pagination.current - 1)}
          disabled={tableParams.pagination.current === 1}
          className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <LuChevronLeft />
        </button>
        <span className="text-sm text-gray-700">
          Page {tableParams.pagination.current} of {totalPages || 1}
        </span>
        <button
          onClick={() => handlePageChange(tableParams.pagination.current + 1)}
          disabled={tableParams.pagination.current === totalPages || totalPages === 0}
          className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <LuChevronRight />
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={tableParams.pagination.current === totalPages || totalPages === 0}
          className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
        >
          <LuChevronsRight />
        </button>
      </div>
    </div>
  );

  // Table View
  const TableView = () => {
    const start = (tableParams.pagination.current - 1) * tableParams.pagination.pageSize;
    const paginatedData = filteredData.slice(start, start + tableParams.pagination.pageSize);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300 w-16">#</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort('stock_no')}>
                  Stock No. {tableParams.sortField === 'stock_no' && (tableParams.sortOrder === 'ascend' ? '↑' : '↓')}
                </th>
                {!isMobile && (
                  <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">Transfer Details</th>
                )}
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort('quantity')}>
                  Quantity {tableParams.sortField === 'quantity' && (tableParams.sortOrder === 'ascend' ? '↑' : '↓')}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, idx) => {
                const index = start + idx + 1;
                return (
                  <tr key={`${item.stock_id}-${item.created_at}`} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-center font-medium text-gray-600">{index}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{item.stock_no}</div>
                      {isMobile && (
                        <div className="text-xs text-gray-500 mt-1">
                          {dayjs(item.created_at).format('MMM DD')}
                        </div>
                      )}
                    </td>
                    {!isMobile && (
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge color="red">{item.from_warehouse_name}</Badge>
                            <LuArrowRightLeft className="text-gray-400 text-xs" />
                            <Badge color="green">{item.to_warehouse_name}</Badge>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <LuCalendar className="w-3 h-3" />
                            {dayjs(item.created_at).format('MMM DD, YYYY HH:mm')}
                          </div>
                          {item.item_name && (
                            <div className="text-xs text-gray-600 truncate max-w-xs">
                              <span className="font-medium">Item:</span> {item.item_name} ({item.item_code})
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="p-3 text-center">
                      <span className="text-lg font-bold text-blue-600">{item.quantity}</span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Link to={`detail/${item.stock_id}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                          <FaEye size={14} />
                        </Link>
                        <Link to={`update/${item.stock_id}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
                          <FaEdit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.stock_id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
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

  // Grid View (Mobile)
  const GridView = () => {
    const start = (tableParams.pagination.current - 1) * tableParams.pagination.pageSize;
    const paginatedData = filteredData.slice(start, start + tableParams.pagination.pageSize);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {paginatedData.map((item, idx) => (
            <div key={`${item.stock_id}-${item.created_at}`} className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color="blue">{item.stock_no}</Badge>
                    <span className="text-xs text-gray-500">#{start + idx + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{item.item_name || 'Transfer'}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <LuWarehouse className="text-red-500 w-4 h-4" />
                    <span className="text-sm text-red-600">{item.from_warehouse_name}</span>
                    <LuArrowRightLeft className="text-gray-400 mx-1" />
                    <LuWarehouse className="text-green-500 w-4 h-4" />
                    <span className="text-sm text-green-600">{item.to_warehouse_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{item.quantity}</span>
                  <div className="text-xs text-gray-500">Units</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 border-t pt-2">
                <div className="flex items-center gap-1">
                  <LuCalendar className="w-3 h-3" />
                  {dayjs(item.created_at).format('MMM DD, YYYY HH:mm')}
                </div>
                <div className="flex gap-2">
                  <Link to={`detail/${item.stock_id}`} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                    <FaEye size={14} />
                  </Link>
                  <Link to={`update/${item.stock_id}`} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                    <FaEdit size={14} />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.stock_id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileFiltersOpen(false)} />
      )}
      <div className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ${mobileFiltersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Filters</h2>
            <button onClick={() => setMobileFiltersOpen(false)}>
              <LuX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start ? dayjs(dateRange.start).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? dayjs(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end ? dayjs(dateRange.end).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? dayjs(e.target.value) : null }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={resetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Reset All
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Empty State
  const EmptyState = () => (
    <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
      <LuTruck className="text-5xl text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Transfer Records Found</h3>
      <p className="text-gray-500 mb-6">Try adjusting your filters or create a new transfer</p>
      <Link to="/dashboard/transfer-stock">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto">
          <LuPlus /> Create Transfer
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
      className="min-h-screen bg-transparent p-4 md:p-6"
    >
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LuTruck className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Transfer Records</h1>
              <p className="text-gray-600 text-sm">Monitor and track all inventory transfers</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMobile && (
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <LuList />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                >
                  <LuGrid3X3 />
                </button>
              </div>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <LuRefreshCw className={loading ? 'animate-spin' : ''} /> {!isMobile && 'Refresh'}
            </button>
            <button
              onClick={exportToExcel}
              disabled={exportLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <LuDownload /> {!isMobile && (exportLoading ? 'Exporting...' : 'Export')}
            </button>
            <Link to="/dashboard/transfer-stock">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                <LuPlus /> {!isMobile && 'New Transfer'}
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 mb-6">
          <StatCard title="Total" value={stats.totalTransfers} icon={<LuTruck />} color="blue" />
          <StatCard title="Net" value={stats.netTransfer} icon={<LuArrowRightLeft />} color="cyan" />
          <StatCard title="Warehouses" value={stats.uniqueWarehouses} icon={<LuWarehouse />} color="orange" />
        </div>

        {/* Filters - Desktop */}
        {!isMobile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
            <div className="flex flex-wrap text-sm items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateRange.start ? dayjs(dateRange.start).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? dayjs(e.target.value) : null }))}
                className="px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.end ? dayjs(dateRange.end).format('YYYY-MM-DD') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? dayjs(e.target.value) : null }))}
                className="px-3 py-2 border border-gray-300 rounded-md"
                placeholder="End Date"
              />
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Reset Filters
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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="p-2 border border-gray-300 rounded-md bg-white"
            >
              <LuFilter />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
              className="p-2 border border-gray-300 rounded-md bg-white"
            >
              {viewMode === 'grid' ? <LuList /> : <LuGrid3X3 />}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transfer records...</p>
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
          <Link to="/dashboard/transfer-stock">
            <button className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700">
              <LuPlus size={24} />
            </button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default StockTransferList;