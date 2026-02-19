import React, { useEffect, useState } from "react";
import {
  LuListChecks,
  LuGrid2X2,
  LuList,
  LuDownload,
  LuSearch,
  LuFilter,
  LuRefreshCw,
  LuLayoutGrid,
  LuPackagePlus,
  LuPackageMinus,
  LuShoppingCart,
  LuPackageX
} from "react-icons/lu";
import { CiBoxList } from "react-icons/ci";
import { motion } from "framer-motion";
import ExportExel from "../../services/ExportExel";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import dayjs from "dayjs";
import api from "../../services/api";

// Helper functions (unchanged)
var __rest = (this && this.__rest) || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};

const toURLSearchParams = (record) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    params.append(key, value);
  }
  return params;
};

const getRandomuserParams = (params) => {
  const { pagination, filters, sortField, sortOrder } = params, restParams = __rest(params, ["pagination", "filters", "sortField", "sortOrder"]);
  const result = {};
  result.limit = pagination?.pageSize;
  result.page = pagination?.current;

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    });
  }

  if (sortField) {
    result.orderby = sortField;
    result.order = sortOrder === "ascend" ? "asc" : "desc";
  }

  Object.entries(restParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  });
  return result;
};

const StockTransactions = () => {
  const token = localStorage.getItem("token");
  const [data, setData] = useState([]);
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table', 'grid', 'compact'
  const [gridColumns, setGridColumns] = useState(4); // 2, 3, 4, 6 columns
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  // Date range: using two separate inputs
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 12,
    },
  });
  const { data: categories } = useGetAllCategoriesQuery(token);

  // Calculate statistics
  const calculateStats = () => {
    const totalTransactions = data.length;
    const totalStockIn = data.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const totalStockOut = data.reduce((sum, item) => sum + (Number(item.stock_out) || 0), 0);
    const totalSales = data.reduce((sum, item) => sum + (Number(item.stock_sale) || 0), 0);
    const totalWaste = data.reduce((sum, item) => sum + (Number(item.stock_waste) || 0), 0);
    const totalReturns = data.reduce((sum, item) => sum + (Number(item.stock_return) || 0), 0);

    return { totalTransactions, totalStockIn, totalStockOut, totalSales, totalWaste, totalReturns };
  };

  const calculateAvailableStock = (item) => {
    return parseInt(item.stock_in) -
      parseInt(item.stock_out) -
      parseInt(item.stock_sale) -
      parseInt(item.stock_waste || "0") -
      parseInt(item.stock_return || "0");
  };

  const stats = calculateStats();

  // Filtered data based on search, category, transaction type, and date range
  const filteredData = data.filter(item => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.barcode?.includes(searchTerm.toLowerCase()) ||
      item.category_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || item.category_name === selectedCategory;

    const matchesTransaction = !selectedTransaction ||
      (selectedTransaction === 'stock-in' && parseInt(item.stock_in) > 0) ||
      (selectedTransaction === 'stock-out' && parseInt(item.stock_out) > 0) ||
      (selectedTransaction === 'sales' && parseInt(item.stock_sale) > 0) ||
      (selectedTransaction === 'waste' && parseInt(item.stock_waste) > 0) ||
      (selectedTransaction === 'returns' && parseInt(item.stock_return) > 0);

    const itemDate = dayjs(item.created_at);
    const matchesDate = (!startDate || !endDate) ? true :
      (itemDate.isAfter(dayjs(startDate)) && itemDate.isBefore(dayjs(endDate).add(1, 'day')));

    return matchesSearch && matchesCategory && matchesTransaction && matchesDate;
  });

  // Build params for API call
  const params = toURLSearchParams(getRandomuserParams(tableParams));

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stock_tracking?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (res.status === 200 && res.data) {
        setData(res.data.data);
        setItemData(res.data.data.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name,
          category_name: item.category_name,
          brand_name: item.brand_name,
          stock_in: parseInt(item.stock_in),
          stock_out: parseInt(item.stock_out),
          stock_sale: parseInt(item.stock_sale),
          stock_waste: parseInt(item.stock_waste || "0"),
          stock_return: parseInt(item.stock_return || "0"),
        })));
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data.pagination?.total || 100,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    tableParams.pagination?.current,
    tableParams.pagination?.pageSize,
    tableParams?.sortOrder,
    tableParams?.sortField,
    JSON.stringify(tableParams.filters),
  ]);

  // Handle sort from table header
  const handleSort = (field) => {
    let order = "ascend";
    if (tableParams.sortField === field && tableParams.sortOrder === "ascend") {
      order = "descend";
    } else if (tableParams.sortField === field && tableParams.sortOrder === "descend") {
      order = undefined;
    }
    setTableParams({
      ...tableParams,
      sortField: order ? field : undefined,
      sortOrder: order,
    });
  };

  // Handle pagination changes
  const handlePageChange = (page) => {
    setTableParams({
      ...tableParams,
      pagination: { ...tableParams.pagination, current: page },
    });
  };

  const handlePageSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setTableParams({
      ...tableParams,
      pagination: { ...tableParams.pagination, pageSize: size, current: 1 },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedTransaction(null);
    setStartDate(null);
    setEndDate(null);
  };

  // Helper to get grid column class based on gridColumns
  const getGridColClass = () => {
    switch (gridColumns) {
      case 2: return "grid-cols-1 sm:grid-cols-2";
      case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case 4: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case 6: return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6";
      default: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
    }
  };

  // Image component with fallback
  const ProductImage = ({ src, alt, className }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
      return (
        <div className={`${className} bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center`}>
          <span className="text-lg font-bold text-blue-600">
            {alt?.charAt(0) || 'P'}
          </span>
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
  };

  // ---------- Table View ----------
  const TableView = () => {
    // Sort function for in-memory sorting (since we have sorter in columns)
    // We'll use the API sorting via tableParams, but for demo we'll keep it simple:
    // Actually the data is already sorted by API based on tableParams. We'll just display.
    // For the summary row, we calculate totals from filteredData.

    const totalIn = filteredData.reduce((s, r) => s + (Number(r.stock_in) || 0), 0);
    const totalOut = filteredData.reduce((s, r) => s + (Number(r.stock_out) || 0), 0);
    const totalSale = filteredData.reduce((s, r) => s + (Number(r.stock_sale) || 0), 0);
    const totalWaste = filteredData.reduce((s, r) => s + (Number(r.stock_waste) || 0), 0);
    const totalReturn = filteredData.reduce((s, r) => s + (Number(r.stock_return) || 0), 0);
    const totalQuantity = filteredData.reduce((s, r) => s + (calculateAvailableStock(r) || 0), 0);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">#</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">PRODUCT</th>
                <th className="p-3 text-left font-semibold text-gray-700 border-r border-gray-300">PRODUCT INFO</th>
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort("stock_in")}>
                  STOCK IN {tableParams.sortField === "stock_in" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort("stock_out")}>
                  STOCK OUT {tableParams.sortField === "stock_out" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort("stock_sale")}>
                  SALES {tableParams.sortField === "stock_sale" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort("stock_waste")}>
                  WASTE {tableParams.sortField === "stock_waste" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 cursor-pointer" onClick={() => handleSort("stock_return")}>
                  RETURNS {tableParams.sortField === "stock_return" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort("net")}>
                  NET {tableParams.sortField === "net" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-500">No transactions found</td></tr>
              ) : (
                filteredData.map((item, idx) => {
                  const net = calculateAvailableStock(item);
                  return (
                    <tr key={`${item.item_id}-${item.created_at}`} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-center font-medium text-gray-600">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex justify-center">
                          <ProductImage
                            src={item.image}
                            alt={item.item_name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 text-sm mb-1">{item.item_name}</div>
                        <div className="text-xs text-gray-500 font-mono mb-2">{item.item_code}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">{item.category_name}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">{item.brand_name}</span>
                          {item.barcode && <span className="text-xs text-gray-500">Barcode: {item.barcode}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-green-600 text-lg">{item.stock_in}</div>
                        <div className="text-xs text-gray-500">Received</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-red-600 text-lg">{item.stock_out}</div>
                        <div className="text-xs text-gray-500">Sent</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-purple-600 text-lg">{item.stock_sale}</div>
                        <div className="text-xs text-gray-500">Sold</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-yellow-600 text-lg">{item.stock_waste || 0}</div>
                        <div className="text-xs text-gray-500">Wasted</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-cyan-600 text-lg">{item.stock_return || 0}</div>
                        <div className="text-xs text-gray-500">Returned</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${net >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {net}
                        </span>
                        <div className="text-xs text-gray-500">Available</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Summary Row */}
            <tfoot className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
              <tr>
                <td colSpan="3" className="p-3 text-right"><strong className="text-gray-700 text-sm">Transaction Summary</strong></td>
                <td className="p-3 text-center"><span className="font-semibold text-green-600">{totalIn}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-red-600">{totalOut}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-purple-600">{totalSale}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-yellow-600">{totalWaste}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-cyan-600">{totalReturn}</span></td>
                <td className="p-3 text-center">
                  <span className="font-semibold text-blue-600">{totalQuantity}</span>
                  <div className="text-xs text-gray-500">Total Quantity</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={tableParams.pagination.pageSize}
              onChange={handlePageSizeChange}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[10, 12, 25, 50, 100].map(size => (
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
              ⟪
            </button>
            <button
              onClick={() => handlePageChange(tableParams.pagination.current - 1)}
              disabled={tableParams.pagination.current === 1}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              ⟨
            </button>
            <span className="text-sm text-gray-700">
              Page {tableParams.pagination.current} of {Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
            </span>
            <button
              onClick={() => handlePageChange(tableParams.pagination.current + 1)}
              disabled={tableParams.pagination.current >= Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              ⟩
            </button>
            <button
              onClick={() => handlePageChange(Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize))}
              disabled={tableParams.pagination.current >= Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              ⟫
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------- Grid View Card ----------
  const StockTransactionCard = ({ item, index }) => {
    const availableStock = calculateAvailableStock(item);
    const stockIn = parseInt(item.stock_in);
    const stockOut = parseInt(item.stock_out);
    const stockSale = parseInt(item.stock_sale);
    const stockWaste = parseInt(item.stock_waste || "0");
    const stockReturn = parseInt(item.stock_return || "0");

    const getTransactionType = () => {
      if (stockIn > 0) return { color: 'green', icon: <LuPackagePlus className="text-green-600" />, label: 'Stock In' };
      if (stockOut > 0) return { color: 'red', icon: <LuPackageMinus className="text-red-600" />, label: 'Stock Out' };
      if (stockSale > 0) return { color: 'purple', icon: <LuShoppingCart className="text-purple-600" />, label: 'Sale' };
      if (stockWaste > 0) return { color: 'yellow', icon: <LuPackageX className="text-yellow-600" />, label: 'Waste' };
      if (stockReturn > 0) return { color: 'cyan', icon: <LuRefreshCw className="text-cyan-600" />, label: 'Return' };
      return { color: 'gray', icon: <LuPackagePlus className="text-gray-600" />, label: 'Transaction' };
    };

    const transaction = getTransactionType();

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 bg-white hover:scale-[1.02] cursor-pointer"
      >
        <div className="p-4 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <ProductImage
                src={item.image}
                alt={item.item_name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{item.item_name}</h3>
                <p className="text-xs text-gray-500 font-mono truncate">{item.item_code}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-${transaction.color}-100 text-${transaction.color}-800`}>
              {transaction.icon}
              <span>{transaction.label}</span>
            </span>
          </div>

          {/* Category and Brand */}
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{item.category_name}</span>
            <span className="text-xs text-gray-600 font-medium truncate">{item.brand_name}</span>
          </div>

          {/* Transaction Details */}
          <div className="space-y-2 mb-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction Date:</span>
              <span className="font-medium">{dayjs(item.created_at).format('MMM DD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expiry:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${dayjs().isAfter(dayjs(item.expire_date)) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {dayjs(item.expire_date).format('MMM DD')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity:</span>
              <span className="font-bold text-blue-600">{item.quantity}</span>
            </div>
          </div>

          {/* Stock Movement Metrics */}
          <div className="grid grid-cols-5 gap-1 text-center mb-2">
            <div className="bg-green-50 rounded p-2">
              <div className="font-bold text-green-600 text-sm">{stockIn}</div>
              <div className="text-[10px] text-green-800">In</div>
            </div>
            <div className="bg-red-50 rounded p-2">
              <div className="font-bold text-red-600 text-sm">{stockOut}</div>
              <div className="text-[10px] text-red-800">Out</div>
            </div>
            <div className="bg-purple-50 rounded p-2">
              <div className="font-bold text-purple-600 text-sm">{stockSale}</div>
              <div className="text-[10px] text-purple-800">Sale</div>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <div className="font-bold text-yellow-600 text-sm">{stockWaste}</div>
              <div className="text-[10px] text-yellow-800">Waste</div>
            </div>
            <div className="bg-cyan-50 rounded p-2">
              <div className="font-bold text-cyan-600 text-sm">{stockReturn}</div>
              <div className="text-[10px] text-cyan-800">Return</div>
            </div>
          </div>

          {/* Available Stock */}
          <div className="mt-auto pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available:</span>
              <span className={`text-lg font-bold ${availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {availableStock} Units
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ---------- Compact View Card ----------
  const CompactTransactionCard = ({ item, index }) => {
    const availableStock = calculateAvailableStock(item);
    const stockIn = parseInt(item.stock_in);
    const stockOut = parseInt(item.stock_out);
    const stockSale = parseInt(item.stock_sale);

    const getTransactionType = () => {
      if (stockIn > 0) return { icon: <LuPackagePlus className="text-green-500" /> };
      if (stockOut > 0) return { icon: <LuPackageMinus className="text-red-500" /> };
      if (stockSale > 0) return { icon: <LuShoppingCart className="text-purple-500" /> };
      return { icon: <LuPackagePlus className="text-gray-500" /> };
    };

    const transaction = getTransactionType();

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50 cursor-pointer"
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {transaction.icon}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">{item.item_name}</h4>
              <p className="text-xs text-gray-500 truncate">{item.item_code}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-bold text-gray-900 text-sm">{availableStock}</div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="flex gap-1">
              {stockIn > 0 && <span className="text-xs text-green-600">+{stockIn}</span>}
              {stockOut > 0 && <span className="text-xs text-red-600">-{stockOut}</span>}
              {stockSale > 0 && <span className="text-xs text-purple-600">S:{stockSale}</span>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-transparent p-4">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LuListChecks className="text-white text-xl" />
              </div>
              Stock Transactions
            </h1>
            <p className="text-sm text-gray-600">
              Track all stock movements including sales, returns, and adjustments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <LuRefreshCw className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <ExportExel
              data={itemData}
              title={"Stock_Transactions_Report"}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              <LuDownload />
              Export
            </ExportExel>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard title="Total Transactions" value={stats.totalTransactions} icon={<LuListChecks />} color="blue" />
          <StatCard title="Total Stock In" value={stats.totalStockIn} icon={<LuPackagePlus />} color="green" />
          <StatCard title="Total Stock Out" value={stats.totalStockOut} icon={<LuPackageMinus />} color="red" />
          <StatCard title="Total Sales" value={stats.totalSales} icon={<LuShoppingCart />} color="purple" />
          <StatCard title="Total Waste" value={stats.totalWaste} icon={<LuPackageX />} color="yellow" />
          <StatCard title="Total Returns" value={stats.totalReturns} icon={<LuRefreshCw />} color="cyan" />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side: view toggle and search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div className="flex bg-gray-100 text-sm rounded-lg p-1 border border-gray-300">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "table" ? "bg-white shadow-md text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <CiBoxList className="text-lg" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid" ? "bg-white shadow-md text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <LuGrid2X2 className="text-lg" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "compact" ? "bg-white shadow-md text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <LuList className="text-lg" />
                  <span>Compact</span>
                </button>
              </div>

              {viewMode === "grid" && (
                <select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                  <option value={6}>6 Columns</option>
                </select>
              )}

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products, codes, categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Right side: filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories?.data?.map((cat) => (
                  <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                ))}
              </select>

              <select
                value={selectedTransaction || ""}
                onChange={(e) => setSelectedTransaction(e.target.value || null)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Transactions</option>
                <option value="stock-in">Stock In</option>
                <option value="stock-out">Stock Out</option>
                <option value="sales">Sales</option>
                <option value="waste">Waste</option>
                <option value="returns">Returns</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate ? dayjs(startDate).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setStartDate(e.target.value ? dayjs(e.target.value) : null)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate ? dayjs(endDate).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setEndDate(e.target.value ? dayjs(e.target.value) : null)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="End Date"
                />
              </div>

              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "table" ? (
          <TableView />
        ) : viewMode === "grid" ? (
          <div className={`grid ${getGridColClass()} gap-6`}>
            {filteredData.map((item, index) => (
              <StockTransactionCard key={`${item.item_id}-${item.created_at}`} item={item} index={index} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-3">
              {filteredData.map((item, index) => (
                <CompactTransactionCard key={`${item.item_id}-${item.created_at}`} item={item} index={index} />
              ))}
              {filteredData.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">No transactions found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-500",
    green: "from-green-500 to-green-600 text-green-500",
    red: "from-red-500 to-red-600 text-red-500",
    purple: "from-purple-500 to-purple-600 text-purple-500",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-500",
    cyan: "from-cyan-500 to-cyan-600 text-cyan-500",
  };
  const bgColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-gradient-to-br ${bgColor.split(' ')[0]} ${bgColor.split(' ')[1]} bg-opacity-10`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-xs font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-full bg-${color}-100 text-${color}-600`}>
          {React.cloneElement(icon, { className: "text-xl" })}
        </div>
      </div>
    </div>
  );
};

export default StockTransactions;