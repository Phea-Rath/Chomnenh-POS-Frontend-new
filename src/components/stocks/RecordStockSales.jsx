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
import ExportExel from "../../services/ExportExel";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useGetAllOrderTransectionQuery } from "../../../app/Features/ordersSlice";
import { useDebounce } from "use-debounce";

dayjs.extend(relativeTime);

const RecordStockSale = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const token = localStorage.getItem("token");
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

  // Get attribute display
  const getAttributesDisplay = (attributes) => {
    if (!attributes || !Array.isArray(attributes)) return null;
    return attributes.map((attr, idx) => (
      <div key={idx} className="flex items-center gap-1 text-xs">
        <span className="text-gray-500">{attr.name}:</span>
        {attr.type === "select" ? (
          <div className="flex items-center gap-1">
            {attr.value?.map((val, vIdx) => (
              <div
                key={vIdx}
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: val.value }}
                title={val.value}
              />
            ))}
          </div>
        ) : (
          <span className="font-medium">{attr.value}</span>
        )}
      </div>
    ));
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

      // Handle nested fields if needed (e.g., amount_sold, total_quantity_sold)
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

  // Get top products (for potential future use)
  const getTopProducts = () => {
    return [...filteredData]
      .sort((a, b) => (b.total_quantity_sold || 0) - (a.total_quantity_sold || 0))
      .slice(0, 5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent p-4 font-sans"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LuChartBar className="text-white text-xl" />
            </div>
            Sales Analytics
          </h1>
          <p className="text-sm text-gray-600">Product sales performance and revenue insights</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <LuRefreshCw className={`text-gray-500 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <ExportExel
            data={filteredData.map((item) => ({
              "Product ID": item.item_id,
              "Product Name": item.item_name,
              "Item Code": item.item_code,
              Barcode: item.barcode,
              Category: item.category_name,
              Brand: item.brand_name,
              "Amount Sold": formatCurrency(item.amount_sold),
              "Quantity Sold": item.total_quantity_sold,
              "Average Price": formatCurrency(item.amount_sold / (item.total_quantity_sold || 1)),
            }))}
            title={"Product_Sales_Report"}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            <LuDownload />
            Export
          </ExportExel>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Products Tracked"
          value={stats.totalProducts?.toLocaleString() || "0"}
          subtitle="Active products"
          icon={<LuPackage className="text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalAmountSold)}
          subtitle="Sales amount"
          icon={<LuDollarSign className="text-green-600" />}
          bgColor="bg-green-50"
        />
        <StatCard
          title="Units Sold"
          value={stats.totalQuantitySold?.toLocaleString() || "0"}
          subtitle="Total quantity"
          icon={<LuShoppingCart className="text-purple-600" />}
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Avg. Sale Value"
          value={formatCurrency(stats.avgAmountPerProduct)}
          subtitle="Per product"
          icon={<LuTrendingUp className="text-orange-600" />}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-2">
            <div className="relative">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Categories</option>
              {getCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Brands</option>
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
            className="px-2 py-2 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <div className="text-xs text-gray-600">
            Showing <span className="font-medium">{paginatedData.length}</span> of{" "}
            <span className="font-medium">{totalItems}</span> products
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <TableHeader
                  label="#"
                  field="index"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  className="w-16"
                />
                <TableHeader label="Product" field="item_name" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeader label="Category" field="category_name" sortConfig={sortConfig} onSort={handleSort} />
                <TableHeader label="Brand" field="brand_name" sortConfig={sortConfig} onSort={handleSort} />
                {/* <TableHeader label="Attributes" /> */}
                <TableHeader
                  label="Amount Sold"
                  field="amount_sold"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="right"
                />
                <TableHeader
                  label="Quantity Sold"
                  field="total_quantity_sold"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align="center"
                />
                <TableHeader label="Avg. Price" align="right" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.key} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3 text-gray-600 font-medium">{idx + 1 + (currentPage - 1) * pageSize}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {getItemImage(item) ? (
                          <img
                            src={getItemImage(item)}
                            alt={item.item_name}
                            className="w-10 h-10 object-cover rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                            <LuPackage />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.item_name}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
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
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">{item.brand_name}</td>
                    {/* <td className="p-3">{getAttributesDisplay(item.attributes)}</td> */}
                    <td className="p-3 text-right">
                      <div className="font-semibold text-green-600">{formatCurrency(item.amount_sold)}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-semibold text-blue-600">
                        {Number(item.total_quantity_sold).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Units</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium text-gray-900">
                        {formatCurrency(
                          item.total_quantity_sold > 0
                            ? item.amount_sold / item.total_quantity_sold
                            : 0
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Per unit</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              <LuChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              <LuChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
            >
              <LuChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
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
  <div className={`${bgColor} border border-gray-200 rounded-lg p-4 flex items-center justify-between`}>
    <div>
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
    <div className="p-2 bg-white rounded-lg border border-gray-200">{icon}</div>
  </div>
);

// Table Header Component with sorting
const TableHeader = ({ label, field, sortConfig, onSort, align = "left", className = "" }) => {
  const isSorted = sortConfig?.field === field;
  const sortOrder = isSorted ? sortConfig?.order : null;

  return (
    <th
      className={`p-3 font-semibold text-gray-700 border-r border-gray-300 last:border-r-0 ${className}`}
      style={{ textAlign: align }}
    >
      {field ? (
        <button
          onClick={() => onSort(field)}
          className="flex items-center gap-1 w-full hover:text-gray-900"
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