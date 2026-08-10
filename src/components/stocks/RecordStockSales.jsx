import React, { useEffect, useState } from "react";
import {
  LuDownload,
  LuSearch,
  LuFilter,
  LuRefreshCw,
  LuTrendingUp,
  LuDollarSign,
  LuShoppingCart,
  LuPackage,
  LuStore,
  LuTag,
  LuBarcode,
  LuChartBar,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { motion } from "framer-motion";
import ExportExcel from "../../services/ExportExcel";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useGetAllOrderTransectionQuery } from "@/features/sales/ordersSlice";
import { useDebounce } from "use-debounce";
import { useTranslation } from "react-i18next";
import { getToken } from '@/utils/tokenStore';

dayjs.extend(relativeTime);

const RecordStockSale = () => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const token = getToken();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [sortConfig, setSortConfig] = useState({ field: null, order: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: stockTran, refetch, isLoading } = useGetAllOrderTransectionQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debouncedSearch,
  });

  // Transform API data
  useEffect(() => {
    if (stockTran?.data) {
      const products = stockTran.data.map((item, index) => ({
        ...item,
        key: item.item_id || index,
        index: index + 1,
        amount_sold: Number(item.amount_sold) || 0,
        total_quantity_sold: Number(item.total_quantity_sold) || 0,
        item_code: item.item_code || `PRD-${String(index + 1).padStart(5, "0")}`,
        category_name: item.category_name || "Uncategorized",
        brand_name: item.brand_name || "Unknown",
      }));
      setData(products);
      setFilteredData(products);
    }
  }, [stockTran]);

  // Get unique categories and brands
  const getCategories = () => {
    const categories = new Set();
    data.forEach((item) => {
      if (item.category_name) categories.add(item.category_name);
    });
    return Array.from(categories);
  };

  const getBrands = () => {
    const brands = new Set();
    data.forEach((item) => {
      if (item.brand_name) brands.add(item.brand_name);
    });
    return Array.from(brands);
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalProducts = filteredData.length;
    const totalAmountSold = filteredData.reduce(
      (sum, item) => sum + (Number(item.amount_sold) || 0),
      0
    );
    const totalQuantitySold = filteredData.reduce(
      (sum, item) => sum + (Number(item.total_quantity_sold) || 0),
      0
    );
    const avgAmountPerProduct = totalProducts > 0 ? totalAmountSold / totalProducts : 0;
    const avgQuantityPerProduct = totalProducts > 0 ? totalQuantitySold / totalProducts : 0;

    const categorySales = filteredData.reduce((acc, item) => {
      const category = item.category_name || "Uncategorized";
      if (!acc[category]) acc[category] = { amount: 0, quantity: 0 };
      acc[category].amount += Number(item.amount_sold) || 0;
      acc[category].quantity += Number(item.total_quantity_sold) || 0;
      return acc;
    }, {});

    const brandSales = filteredData.reduce((acc, item) => {
      const brand = item.brand_name || "Unknown";
      if (!acc[brand]) acc[brand] = { amount: 0, quantity: 0 };
      acc[brand].amount += Number(item.amount_sold) || 0;
      acc[brand].quantity += Number(item.total_quantity_sold) || 0;
      return acc;
    }, {});

    return {
      totalProducts,
      totalAmountSold,
      totalQuantitySold,
      avgAmountPerProduct,
      avgQuantityPerProduct,
      categorySales,
      brandSales,
    };
  };

  const stats = calculateStats();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get item image
  const getItemImage = (item) => {
    if (item.image?.image) return item.image.image;
    if (item.images?.[0]?.image) return item.images[0].image;
    return null;
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...data];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode?.includes(searchTerm) ||
          item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category_name === selectedCategory);
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter((item) => item.brand_name === selectedBrand);
    }

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, selectedCategory, selectedBrand, data]);

  // Sorting logic
  const handleSort = (field) => {
    let order = "asc";
    if (sortConfig.field === field && sortConfig.order === "asc") {
      order = "desc";
    } else if (sortConfig.field === field && sortConfig.order === "desc") {
      order = null;
    }
    setSortConfig({ field, order });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.field || !sortConfig.order) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];

      if (sortConfig.field === "amount_sold" || sortConfig.field === "total_quantity_sold") {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }

      if (aVal < bVal) return sortConfig.order === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.order === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-4 font-sans view-page"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-cyan-600 rounded-lg">
              <LuChartBar className="text-white text-xl" />
            </div>
            {t("salesAnalytics")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("salesAnalyticsSubtitle")}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <LuRefreshCw className={`text-gray-500 dark:text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
            {t("refresh")}
          </button>
          <ExportExcel
            data={filteredData.map((item) => ({
              [t("productID")]: item.item_id,
              [t("productName")]: item.item_name,
              [t("itemCode")]: item.item_code,
              [t("barcode")]: item.barcode,
              [t("category")]: item.category_name,
              [t("brand")]: item.brand_name,
              [t("amountSold")]: formatCurrency(item.amount_sold),
              [t("quantitySold")]: item.total_quantity_sold,
              [t("avgPrice")]: formatCurrency(item.amount_sold / (item.total_quantity_sold || 1)),
            }))}
            title={"Product_Sales_Report"}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium hover:bg-cyan-700 transition-colors"
          >
            <LuDownload />
            {t("export")}
          </ExportExcel>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t("productsTracked")}
          value={stats.totalProducts?.toLocaleString() || "0"}
          subtitle={t("activeProducts")}
          icon={<LuPackage className="text-cyan-600" />}
          bgColor="bg-cyan-50 dark:bg-cyan-900/20"
        />
        <StatCard
          title={t("totalRevenue")}
          value={formatCurrency(stats.totalAmountSold)}
          subtitle={t("salesAmount")}
          icon={<LuDollarSign className="text-green-600" />}
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
        <StatCard
          title={t("unitsSold")}
          value={stats.totalQuantitySold?.toLocaleString() || "0"}
          subtitle={t("totalQuantity")}
          icon={<LuShoppingCart className="text-purple-600" />}
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
        <StatCard
          title={t("avgSaleValue")}
          value={formatCurrency(stats.avgAmountPerProduct)}
          subtitle={t("perProduct")}
          icon={<LuTrendingUp className="text-orange-600" />}
          bgColor="bg-orange-50 dark:bg-orange-900/20"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 transition-colors">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchByNameCode")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
            >
              <option value="all">{t("allCategories")}</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full text-sm px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
            >
              <option value="all">{t("allBrands")}</option>
              {getBrands().map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={resetFilters}
            className="px-2 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t("resetFilters")}
          </button>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {t("showing")} <span className="font-medium dark:text-gray-200">{paginatedData.length}</span> {t("of")}{" "}
            <span className="font-medium dark:text-gray-200">{totalItems}</span> {t("items")}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                <TableHeader
                  label="#"
                  field="index"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-16"
                  t={t}
                />
                <TableHeader label={t("product")} field="item_name" sortConfig={sortConfig} onSort={handleSort} t={t} />
                <TableHeader label={t("category")} field="category_name" sortConfig={sortConfig} onSort={handleSort} t={t} />
                <TableHeader label={t("brand")} field="brand_name" sortConfig={sortConfig} onSort={handleSort} t={t} />
                <TableHeader
                  label={t("salesAmount")}
                  field="amount_sold"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="right"
                  t={t}
                />
                <TableHeader
                  label={t("quantityCount")}
                  field="total_quantity_sold"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="center"
                  t={t}
                />
                <TableHeader label={t("avgPrice")} align="right" t={t} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t("loading")}...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t("noOrdersFound")}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.key} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-3 text-gray-600 dark:text-gray-400 font-medium">{idx + 1 + (currentPage - 1) * pageSize}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {getItemImage(item) ? (
                          <img
                            src={getItemImage(item)}
                            alt={item.item_name}
                            className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors">
                            <LuPackage />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.item_name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <LuTag className="w-3 h-3" /> {item.item_code}
                            </span>
                            <span className="flex items-center gap-1">
                              <LuBarcode className="w-3 h-3" /> {item.barcode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full text-xs font-medium">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{item.brand_name}</td>
                    <td className="p-3 text-right">
                      <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.amount_sold)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t("revenue")}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-semibold text-cyan-600 dark:text-cyan-400">
                        {Number(item.total_quantity_sold).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t("unitsCount")}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(
                          item.total_quantity_sold > 0
                            ? item.amount_sold / item.total_quantity_sold
                            : 0
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t("perUnit")}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t("rowsPerPage")}:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LuChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LuChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("page")} {currentPage} {t("of")} {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <LuChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon, bgColor }) => (
  <div className={`${bgColor} border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm transition-all`}>
    <div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">{icon}</div>
  </div>
);

// Table Header Component with sorting
const TableHeader = ({ label, field, sortConfig, onSort, align = "left", className = "", t }) => {
  const isSorted = sortConfig?.field === field;
  const sortOrder = isSorted ? sortConfig?.order : null;

  return (
    <th
      className={`p-3 font-semibold text-gray-700 dark:text-gray-200 border-r border-gray-300 dark:border-gray-600 last:border-r-0 ${className}`}
      style={{ textAlign: align }}
    >
      {field ? (
        <button
          onClick={() => onSort(field)}
          className="flex items-center gap-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors"
          style={{ justifyContent: align === "right" ? "flex-end" : "flex-start" }}
        >
          {label}
          {sortOrder && (
            <span className="text-xs">
              {sortOrder === "asc" ? " ↑" : " ↓"}
            </span>
          )}
        </button>
      ) : (
        label
      )}
    </th>
  );
};

export default RecordStockSale;
