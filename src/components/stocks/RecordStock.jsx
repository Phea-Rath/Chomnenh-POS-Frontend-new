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
import ExportExcel from "../../services/ExportExcel";
import { useGetAllCategoriesQuery } from "@/features/products/categoriesSlice";
import dayjs from "dayjs";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import RefreshButton from "../../utils/RefreshButton";
import { getToken } from '@/utils/tokenStore';

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
  const { t } = useTranslation();
  const token = getToken();
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
          Authorization: `Bearer ${getToken()}`,
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
        <div className={`${className} bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center`}>
          <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
            {alt?.charAt(0) || 'P'}
          </span>
        </div>
      );
    }
    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
  };

  // ---------- Table View ----------
  const TableView = () => {
    const totalIn = filteredData.reduce((s, r) => s + (Number(r.stock_in) || 0), 0);
    const totalOut = filteredData.reduce((s, r) => s + (Number(r.stock_out) || 0), 0);
    const totalSale = filteredData.reduce((s, r) => s + (Number(r.stock_sale) || 0), 0);
    const totalWaste = filteredData.reduce((s, r) => s + (Number(r.stock_waste) || 0), 0);
    const totalReturn = filteredData.reduce((s, r) => s + (Number(r.stock_return) || 0), 0);
    const totalQuantity = filteredData.reduce((s, r) => s + (calculateAvailableStock(r) || 0), 0);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600">#</th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 uppercase">{t("product")}</th>
                <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 uppercase">{t("productInfo")}</th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort("stock_in")}>
                  {t("stockIn")} {tableParams.sortField === "stock_in" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort("stock_out")}>
                  {t("stockOut")} {tableParams.sortField === "stock_out" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort("stock_sale")}>
                  {t("sold")} {tableParams.sortField === "stock_sale" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort("stock_waste")}>
                  {t("wasted")} {tableParams.sortField === "stock_waste" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 cursor-pointer" onClick={() => handleSort("stock_return")}>
                  {t("returned")} {tableParams.sortField === "stock_return" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
                <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 cursor-pointer" onClick={() => handleSort("net")}>
                  NET {tableParams.sortField === "net" && (tableParams.sortOrder === "ascend" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-400">{t("loading")}...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-400">{t("noOrdersFound")}</td></tr>
              ) : (
                filteredData.map((item, idx) => {
                  const net = calculateAvailableStock(item);
                  return (
                    <tr key={`${item.item_id}-${item.created_at}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 text-center font-medium text-gray-600 dark:text-gray-400">{idx + 1}</td>
                      <td className="p-3">
                        <div className="flex justify-center">
                          <ProductImage
                            src={item.image}
                            alt={item.item_name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{item.item_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2">{item.item_code}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full text-xs">{item.category_name}</span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs">{item.brand_name}</span>
                          {item.barcode && <span className="text-xs text-gray-500 dark:text-gray-400">Barcode: {item.barcode}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-green-600 dark:text-green-400 text-lg">{item.stock_in}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("received")}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-red-600 dark:text-red-400 text-lg">{item.stock_out}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("sent")}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-purple-600 dark:text-purple-400 text-lg">{item.stock_sale}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("sold")}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">{item.stock_waste || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("wasted")}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-bold text-cyan-600 dark:text-cyan-400 text-lg">{item.stock_return || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("returned")}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${net >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                          {net}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("available")}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-50 to-cyan-50 dark:from-gray-700 dark:to-cyan-900/20 border-t border-gray-200 dark:border-gray-600">
              <tr>
                <td colSpan="3" className="p-3 text-right"><strong className="text-gray-700 dark:text-gray-200 text-sm">{t("transactionSummary")}</strong></td>
                <td className="p-3 text-center"><span className="font-semibold text-green-600 dark:text-green-400">{totalIn}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-red-600 dark:text-red-400">{totalOut}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-purple-600 dark:text-purple-400">{totalSale}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-yellow-600 dark:text-yellow-400">{totalWaste}</span></td>
                <td className="p-3 text-center"><span className="font-semibold text-cyan-600 dark:text-cyan-400">{totalReturn}</span></td>
                <td className="p-3 text-center">
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">{totalQuantity}</span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t("totalQuantity")}</div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("rowsPerPage")}:</span>
            <select
              value={tableParams.pagination.pageSize}
              onChange={handlePageSizeChange}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
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
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              ⟪
            </button>
            <button
              onClick={() => handlePageChange(tableParams.pagination.current - 1)}
              disabled={tableParams.pagination.current === 1}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              ⟨
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-200">
              {t("page")} {tableParams.pagination.current} {t("of")} {Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
            </span>
            <button
              onClick={() => handlePageChange(tableParams.pagination.current + 1)}
              disabled={tableParams.pagination.current >= Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              ⟩
            </button>
            <button
              onClick={() => handlePageChange(Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize))}
              disabled={tableParams.pagination.current >= Math.ceil((tableParams.pagination.total || 0) / tableParams.pagination.pageSize)}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
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
      if (stockIn > 0) return { color: 'green', icon: <LuPackagePlus className="text-green-600 dark:text-green-400" />, label: t('stockIn') };
      if (stockOut > 0) return { color: 'red', icon: <LuPackageMinus className="text-red-600 dark:text-red-400" />, label: t('stockOut') };
      if (stockSale > 0) return { color: 'purple', icon: <LuShoppingCart className="text-purple-600 dark:text-purple-400" />, label: t('sold') };
      if (stockWaste > 0) return { color: 'yellow', icon: <LuPackageX className="text-yellow-600 dark:text-yellow-400" />, label: t('wasted') };
      if (stockReturn > 0) return { color: 'cyan', icon: <LuRefreshCw className="text-cyan-600 dark:text-cyan-400" />, label: t('returned') };
      return { color: 'gray', icon: <LuPackagePlus className="text-gray-600 dark:text-gray-400" />, label: t('allTransactions') };
    };

    const transaction = getTransactionType();

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 hover:scale-[1.02] cursor-pointer"
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <ProductImage
                src={item.image}
                alt={item.item_name}
                className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-md"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">{item.item_name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{item.item_code}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-${transaction.color}-100 dark:bg-${transaction.color}-900/30 text-${transaction.color}-800 dark:text-${transaction.color}-300`}>
              {transaction.icon}
              <span>{transaction.label}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full text-xs font-semibold">{item.category_name}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate">{item.brand_name}</span>
          </div>

          <div className="space-y-2 mb-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("transactionDate")}:</span>
              <span className="font-medium dark:text-gray-200">{dayjs(item.created_at).format('MMM DD')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("expiry")}:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${dayjs().isAfter(dayjs(item.expire_date)) ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                {dayjs(item.expire_date).format('MMM DD')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("quantityCount")}:</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{item.quantity}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center mb-2">
            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 transition-colors">
              <div className="font-bold text-green-600 dark:text-green-400 text-sm">{stockIn}</div>
              <div className="text-[10px] text-green-800 dark:text-green-300">In</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 transition-colors">
              <div className="font-bold text-red-600 dark:text-red-400 text-sm">{stockOut}</div>
              <div className="text-[10px] text-red-800 dark:text-red-300">Out</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2 transition-colors">
              <div className="font-bold text-purple-600 dark:text-purple-400 text-sm">{stockSale}</div>
              <div className="text-[10px] text-purple-800 dark:text-purple-300">S</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2 transition-colors">
              <div className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">{stockWaste}</div>
              <div className="text-[10px] text-yellow-800 dark:text-yellow-300">W</div>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded p-2 transition-colors">
              <div className="font-bold text-cyan-600 dark:text-cyan-400 text-sm">{stockReturn}</div>
              <div className="text-[10px] text-cyan-800 dark:text-cyan-300">R</div>
            </div>
          </div>

          <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t("available")}:</span>
              <span className={`text-lg font-bold ${availableStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {availableStock} {t("itemCount")}
              </span>
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
      <div className="min-h-screen bg-transparent p-4 view-page">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-cyan-600 rounded-lg">
                <LuListChecks className="text-white text-xl" />
              </div>
              {t("stockTransactions")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("trackStockMovements")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RefreshButton onClick={fetchData} loading={loading} />
            <ExportExcel
              data={itemData}
              title={"Stock_Transactions_Report"}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors"
            >
              <LuDownload />
              {t("export")}
            </ExportExcel>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard title={t("totalTransactions")} value={stats.totalTransactions} icon={<LuListChecks />} color="cyan" />
          <StatCard title={t("totalStockIn")} value={stats.totalStockIn} icon={<LuPackagePlus />} color="green" />
          <StatCard title={t("totalStockOut")} value={stats.totalStockOut} icon={<LuPackageMinus />} color="red" />
          <StatCard title={t("totalSales")} value={stats.totalSales} icon={<LuShoppingCart />} color="purple" />
          <StatCard title={t("totalWaste")} value={stats.totalWaste} icon={<LuPackageX />} color="yellow" />
          <StatCard title={t("totalReturns")} value={stats.totalReturns} icon={<LuRefreshCw />} color="cyan" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col flex-wrap sm:flex-row sm:items-center gap-4 flex-1">
              <div className="flex bg-gray-100 dark:bg-gray-700 text-sm rounded-lg p-1 border border-gray-300 dark:border-gray-600 transition-colors">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "table" ? "bg-white dark:bg-gray-600 shadow-md text-cyan-600 dark:text-cyan-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}
                >
                  <CiBoxList className="text-lg" />
                  <span>{t("table")}</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid" ? "bg-white dark:bg-gray-600 shadow-md text-cyan-600 dark:text-cyan-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}
                >
                  <LuGrid2X2 className="text-lg" />
                  <span>{t("grid")}</span>
                </button>
              </div>

              {viewMode === "grid" && (
                <select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(parseInt(e.target.value))}
                  className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value={2}>2 {t("columns")}</option>
                  <option value={3}>3 {t("columns")}</option>
                  <option value={4}>4 {t("columns")}</option>
                  <option value={6}>6 {t("columns")}</option>
                </select>
              )}

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("searchOrdersPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-wrap sm:flex-row sm:items-center gap-3">
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                <option value="">{t("allCategories")}</option>
                {categories?.data?.map((cat, idx) => (
                  <option key={idx} value={cat.category_name}>{cat.category_name}</option>
                ))}
              </select>

              <select
                value={selectedTransaction || ""}
                onChange={(e) => setSelectedTransaction(e.target.value || null)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
              >
                <option value="">{t("allTransactions")}</option>
                <option value="stock-in">{t("stockIn")}</option>
                <option value="stock-out">{t("stockOut")}</option>
                <option value="sales">{t("sold")}</option>
                <option value="waste">{t("wasted")}</option>
                <option value="returns">{t("returned")}</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate ? dayjs(startDate).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setStartDate(e.target.value ? dayjs(e.target.value) : null)}
                  className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder={t("startDate")}
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate ? dayjs(endDate).format('YYYY-MM-DD') : ''}
                  onChange={(e) => setEndDate(e.target.value ? dayjs(e.target.value) : null)}
                  className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder={t("endDate")}
                />
              </div>

              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("reset")}
              </button>
            </div>
          </div>
        </div>

        {viewMode === "table" ? (
          <TableView />
        ) : (
          <div className={`grid ${getGridColClass()} gap-6`}>
            {filteredData.map((item, index) => (
              <StockTransactionCard key={`${item.item_id}-${item.created_at}`} item={item} index={index} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    cyan: "from-cyan-500 to-cyan-600 text-cyan-500",
    green: "from-green-500 to-green-600 text-green-500",
    red: "from-red-500 to-red-600 text-red-500",
    purple: "from-purple-500 to-purple-600 text-purple-500",
    yellow: "from-yellow-500 to-yellow-600 text-yellow-500",
  };
  const bgColor = colorClasses[color] || colorClasses.cyan;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br ${bgColor.split(' ')[0]} ${bgColor.split(' ')[1]} bg-opacity-10 dark:bg-opacity-20 shadow-sm transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-xs font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2 rounded-full bg-white/20 dark:bg-gray-800/40 text-white shadow-inner`}>
          {React.cloneElement(icon, { className: "text-xl" })}
        </div>
      </div>
    </div>
  );
};

export default StockTransactions;
