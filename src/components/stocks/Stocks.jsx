import React, { useEffect, useState } from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useOutletsContext } from '../../layouts/Management';
import { useDeleteStockMutation, useGetAllStockQuery } from '../../../app/Features/stocksSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
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
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const token = localStorage.getItem('token');
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('stockViewMode') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const { setLoading } = useOutletsContext();
  const { data, isLoading, refetch } = useGetAllStockQuery(token);
  const { refetch: saleRefetch } = useGetAllSaleQuery(token);

  useEffect(() => {
    const stockData = data?.data || [];
    setStocks(stockData);
    setFilteredStocks(stockData);
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
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.item_price) || 0),
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
      const res = await api.delete(`stock_masters/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.status === 200) {
        refetch();
        saleRefetch();
        toast.success('Stock record deleted successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete stock record!');
    } finally {
      setLoading(false);
    }
  };

  // Search handler
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) {
      setFilteredStocks(stocks);
      return;
    }
    const filtered = stocks.filter(
      (stock) =>
        stock.stock_no?.toLowerCase().includes(value.toLowerCase()) ||
        stock.stock_type_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.from_warehouse_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.to_warehouse_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.stock_remark?.toLowerCase().includes(value.toLowerCase()) ||
        getStockItems(stock).some(
          (item) =>
            item.item_name?.toLowerCase().includes(value.toLowerCase()) ||
            item.item_code?.toLowerCase().includes(value.toLowerCase())
        )
    );
    setFilteredStocks(filtered);
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
      const dataToExport = searchTerm ? filteredStocks : stocks;
      if (dataToExport.length === 0) {
        toast.warning('No data to export');
        setExportLoading(false);
        return;
      }

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Stock Summary
      const summaryData = dataToExport.map((stock, idx) => ({
        'S.No': idx + 1,
        'Stock ID': stock.stock_id,
        'Stock Number': stock.stock_no || 'N/A',
        'Stock Type': stock.stock_type_name || 'N/A',
        'From Warehouse': stock.from_warehouse_name || 'N/A',
        'To Warehouse': stock.to_warehouse_name || 'N/A',
        'Stock Date': stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
        'Created Date': stock.created_at ? formatDateTime(stock.created_at) : 'N/A',
        'Created By': stock.created_by_name || 'N/A',
        'Remark': stock.stock_remark || 'N/A',
        'Total Items': getTotalItems(stock),
        'Total Quantity': getTotalQuantity(stock),
        'Total Value': `$${getTotalValue(stock).toFixed(2)}`,
        'Status': stock.status || 'Active',
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Stock Summary');

      // Sheet 2: Items Details
      const itemsData = [];
      dataToExport.forEach((stock) => {
        getStockItems(stock).forEach((item) => {
          itemsData.push({
            'Stock Number': stock.stock_no,
            'Stock Type': stock.stock_type_name,
            'Item Name': item.item_name,
            'Item Code': item.item_code,
            'Quantity': item.quantity,
            'Unit Price': item.item_price,
            'Total Value': (item.quantity || 0) * (item.item_price || 0),
            'Batch No': item.batch_no || 'N/A',
            'Expiry Date': item.expiry_date || 'N/A',
            'From Warehouse': stock.from_warehouse_name,
            'To Warehouse': stock.to_warehouse_name,
            'Stock Date': stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
          });
        });
      });
      if (itemsData.length) {
        const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
        XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items Details');
      }

      // Sheet 3: Statistics
      const statsData = [
        ['STOCK REPORT'],
        [],
        ['Generated:', new Date().toLocaleString()],
        ['Total Records:', dataToExport.length],
        ['Stock In:', dataToExport.filter((s) => s.stock_type_name?.toLowerCase() === 'stock in').length],
        ['Stock Out:', dataToExport.filter((s) => s.stock_type_name?.toLowerCase() === 'stock out').length],
        ['Transfers:', dataToExport.filter((s) => s.stock_type_name?.toLowerCase() === 'transfer').length],
        ['Total Items:', dataToExport.reduce((acc, s) => acc + getTotalItems(s), 0)],
        ['Total Quantity:', dataToExport.reduce((acc, s) => acc + getTotalQuantity(s), 0)],
        ['Total Value:', `$${dataToExport.reduce((acc, s) => acc + getTotalValue(s), 0).toFixed(2)}`],
      ];
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');

      const fileName = `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Exported ${dataToExport.length} records`);
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  // ----- Custom Components -----
  const Badge = ({ children, color }) => {
    const colorMap = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${colorMap[color] || colorMap.gray}`}>{children}</span>;
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-gradient-to-r ${color} p-4 rounded-lg shadow-sm border border-gray-100`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-2 bg-white rounded-full">{icon}</div>
      </div>
    </div>
  );

  const ProductImage = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
      return (
        <div className={`${className} bg-blue-100 flex items-center justify-center`}>
          <span className="text-blue-600 text-xl">{alt?.charAt(0) || 'P'}</span>
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
  };

  // Grid Item Card
  const GridItem = ({ stock }) => {
    const typeColor = getStockTypeColor(stock.stock_type_name);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <Badge color={typeColor}>{stock.stock_type_name}</Badge>
              <h3 className="font-bold text-lg text-gray-800 mt-2">{stock.stock_no}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaCalendarAlt className="text-gray-400" />
                <span>{formatDate(stock.stock_date)}</span>
              </div>
            </div>
            <div className="text-2xl">{getStockTypeIcon(stock.stock_type_name)}</div>
          </div>

          {/* Transfer info */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg mb-3">
            <div className="flex items-center gap-1">
              <FaWarehouse className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{stock.from_warehouse_name}</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className="flex items-center gap-1">
              <FaWarehouse className="text-green-500" />
              <span className="text-sm font-medium text-gray-700">{stock.to_warehouse_name}</span>
            </div>
          </div>

          {/* Items summary */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <FaCubes className="text-purple-500" />
              <span>{getTotalItems(stock)} items</span>
            </div>
            <div className="font-semibold">Qty: {getTotalQuantity(stock)}</div>
            <div className="font-bold text-purple-600">${getTotalValue(stock).toFixed(2)}</div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
              <FaEye />
            </Link>
            <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
              <FaEdit />
            </Link>
            <button
              onClick={() => handleDelete(stock.stock_id)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // List Item Row
  const ListItem = ({ stock }) => (
    <tr className="hover:bg-blue-50/50 transition-colors border-b border-gray-100">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {getStockTypeIcon(stock.stock_type_name)}
            <div>
              <div className="font-bold text-gray-900">{stock.stock_no}</div>
              <Badge color={getStockTypeColor(stock.stock_type_name)}>{stock.stock_type_name}</Badge>
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaUser className="text-gray-400" />
          <span>{stock.created_by_name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaWarehouse className="text-blue-500" />
            <span className="font-medium">{stock.from_warehouse_name}</span>
          </div>
          <FaArrowRight className="text-gray-400 mx-2" />
          <div className="flex items-center gap-2">
            <FaWarehouse className="text-green-500" />
            <span className="font-medium">{stock.to_warehouse_name}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaCubes className="text-purple-500" />
            <span className="font-semibold">{getTotalItems(stock)} items</span>
          </div>
          <div className="text-sm text-gray-600">Total Qty: <span className="font-semibold">{getTotalQuantity(stock)}</span></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">{formatDateTime(stock.created_at)}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-bold text-lg text-purple-600">${getTotalValue(stock).toFixed(2)}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
            <FaEye />
          </Link>
          <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200">
            <FaEdit />
          </Link>
          <button
            onClick={() => handleDelete(stock.stock_id)}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          >
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  );

  // Empty State
  const EmptyState = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
          <FaBoxOpen className="text-4xl text-blue-500" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Stock Records Found</h3>
      <p className="text-gray-500 text-lg max-w-md mx-auto">
        {stocks.length === 0
          ? 'Start tracking your inventory movements by creating your first stock record'
          : 'No stock records match your search criteria'}
      </p>
      {stocks.length === 0 && (
        <Link to="/dashboard/add-to-stock">
          <button className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto">
            <FaPlus /> Create First Stock Record
          </button>
        </Link>
      )}
    </div>
  );

  // Loading State
  const LoadingState = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading stock data...</p>
        <p className="text-gray-500 mt-2">Fetching inventory records from database</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-6"
    >
      <AlertBox
        isOpen={alertBox}
        title="Delete Stock Record"
        message="This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Stock Management <span className="text-blue-600">Inventory</span>
            </h1>
            <p className="text-gray-600">Track and manage inventory movements, transfers, and stock operations</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Grid View"
              >
                <IoIosGrid size={20} />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <IoIosList size={20} />
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToExcel}
              disabled={exportLoading}
              className="px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 shadow-sm disabled:opacity-50"
              title="Export to Excel"
            >
              <FaFileExport />
              {exportLoading ? 'Exporting...' : 'Export Excel'}
            </button>

            <Link to="/dashboard/add-to-stock">
              <button className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 flex items-center gap-2 shadow-lg">
                <FaPlus />
                Add New Stock
              </button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-lg p-1 mb-3">
          <div className="relative max-w-xl">
            <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by stock number, warehouse, item name, or remark..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Badge color="blue">{filteredStocks.length} records</Badge>
            </div>
          </div>
        </div>

        {/* Summary Dashboard */}
        {filteredStocks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <StatCard
              title="Total Stock Records"
              value={filteredStocks.length}
              icon={<FaClipboardList className="text-blue-500" />}
              color="from-blue-50 to-blue-100"
            />
            <StatCard
              title="Stock In Records"
              value={filteredStocks.filter(s => s.stock_type_name?.toLowerCase() === 'stock in').length}
              icon={<FaBoxOpen className="text-green-500" />}
              color="from-green-50 to-green-100"
            />
            <StatCard
              title="Total Items"
              value={filteredStocks.reduce((acc, s) => acc + getTotalItems(s), 0)}
              icon={<FaCubes className="text-orange-500" />}
              color="from-orange-50 to-orange-100"
            />
            <StatCard
              title="Total Value"
              value={`$${filteredStocks.reduce((acc, s) => acc + getTotalValue(s), 0).toFixed(2)}`}
              icon={<FaShoppingCart className="text-purple-500" />}
              color="from-purple-50 to-purple-100"
            />
          </div>
        )}

        {/* Clear Search */}
        {searchTerm && (
          <div className="flex justify-end mb-4">
            <button onClick={() => setSearchTerm('')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Clear search
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : filteredStocks.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {filteredStocks.map((stock) => (
              <GridItem key={stock.stock_id} stock={stock} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created By</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Transfer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStocks.map((stock) => (
                    <ListItem key={stock.stock_id} stock={stock} />
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

export default Stocks;
