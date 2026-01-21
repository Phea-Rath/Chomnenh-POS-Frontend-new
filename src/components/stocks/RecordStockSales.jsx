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
  LuCalendar,
  LuUser,
  LuReceipt,
  LuCreditCard,
  LuCircleAlert,
  LuCircleCheck,
  LuPercent,
  LuStore,
  LuTag,
  LuBarcode,
  LuChartBar
} from "react-icons/lu";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Progress,
  DatePicker,
  Badge,
  Avatar,
  Tooltip,
  Row,
  Col,
  Statistic
} from "antd";
import { motion } from "framer-motion";
import ExportExel from "../../services/ExportExel";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Option } = Select;
const { RangePicker } = DatePicker;

const RecordStockSale = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  // Get unique categories and brands for filters
  const getCategories = () => {
    const categories = new Set();
    data.forEach(item => {
      if (item.category_name) categories.add(item.category_name);
    });
    return Array.from(categories);
  };

  const getBrands = () => {
    const brands = new Set();
    data.forEach(item => {
      if (item.brand_name) brands.add(item.brand_name);
    });
    return Array.from(brands);
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalProducts = filteredData.length;
    const totalAmountSold = filteredData.reduce((sum, item) => sum + (Number(item.amount_sold) || 0), 0);
    const totalQuantitySold = filteredData.reduce((sum, item) => sum + (Number(item.total_quantity_sold) || 0), 0);
    const avgAmountPerProduct = totalProducts > 0 ? totalAmountSold / totalProducts : 0;
    const avgQuantityPerProduct = totalProducts > 0 ? totalQuantitySold / totalProducts : 0;

    // Top categories
    const categorySales = filteredData.reduce((acc, item) => {
      const category = item.category_name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { amount: 0, quantity: 0 };
      }
      acc[category].amount += Number(item.amount_sold) || 0;
      acc[category].quantity += Number(item.total_quantity_sold) || 0;
      return acc;
    }, {});

    // Top brands
    const brandSales = filteredData.reduce((acc, item) => {
      const brand = item.brand_name || 'Unknown';
      if (!acc[brand]) {
        acc[brand] = { amount: 0, quantity: 0 };
      }
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
      brandSales
    };
  };

  const stats = calculateStats();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
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
      <div key={idx} className="flex items-center gap-1">
        <span className="text-xs text-gray-500">{attr.name}:</span>
        {attr.type === 'select' ? (
          <div className="flex items-center gap-1">
            {attr.value?.map((val, vIdx) => (
              <div key={vIdx} className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: val.value }}
                title={val.value} />
            ))}
          </div>
        ) : (
          <span className="text-xs font-medium">{attr.value}</span>
        )}
      </div>
    ));
  };

  // Table columns
  const columns = [
    {
      title: "#",
      dataIndex: "index",
      width: "60px",
      align: 'center',
      render: (text, record, index) => (
        <div className="font-semibold text-gray-600">
          {index + 1}
        </div>
      ),
    },
    {
      title: "PRODUCT",
      dataIndex: "item_name",
      width: "250px",
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={48}
            src={getItemImage(record)}
            className="bg-gradient-to-r from-blue-100 to-purple-100"
            shape="square"
          >
            <LuPackage className="text-xl text-gray-400" />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{name}</div>
            <div className="flex items-center gap-2 mt-1">
              <Tooltip title="Item Code">
                <div className="flex items-center gap-1">
                  <LuTag className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{record.item_code}</span>
                </div>
              </Tooltip>
              <Tooltip title="Barcode">
                <div className="flex items-center gap-1">
                  <LuBarcode className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{record.barcode}</span>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "category_name",
      width: "120px",
      render: (category) => (
        <Tag color="blue" className="font-medium">
          {category || 'Uncategorized'}
        </Tag>
      ),
      filters: getCategories().map(cat => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category_name === value,
    },
    {
      title: "BRAND",
      dataIndex: "brand_name",
      width: "120px",
      render: (brand) => (
        <div className="text-sm font-medium text-gray-700">
          {brand || 'Unknown'}
        </div>
      ),
      filters: getBrands().map(brand => ({ text: brand, value: brand })),
      onFilter: (value, record) => record.brand_name === value,
    },
    {
      title: "ATTRIBUTES",
      dataIndex: "attributes",
      width: "150px",
      render: (attributes) => (
        <div className="space-y-1">
          {getAttributesDisplay(attributes)}
        </div>
      ),
    },
    {
      title: "AMOUNT SOLD",
      dataIndex: "amount_sold",
      width: "120px",
      align: 'right',
      sorter: (a, b) => (a.amount_sold || 0) - (b.amount_sold || 0),
      render: (amount) => (
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(amount || 0)}
          </div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      ),
    },
    {
      title: "QUANTITY SOLD",
      dataIndex: "total_quantity_sold",
      width: "120px",
      align: 'center',
      sorter: (a, b) => (a.total_quantity_sold || 0) - (b.total_quantity_sold || 0),
      render: (quantity) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {Number(quantity || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Units</div>
        </div>
      ),
    },
    {
      title: "AVG. PRICE",
      width: "100px",
      align: 'right',
      render: (_, record) => {
        const amount = Number(record.amount_sold) || 0;
        const quantity = Number(record.total_quantity_sold) || 1;
        const avgPrice = quantity > 0 ? amount / quantity : 0;
        return (
          <div className="text-right">
            <div className="font-medium text-gray-900">
              {formatCurrency(avgPrice)}
            </div>
            <div className="text-xs text-gray-500">Per unit</div>
          </div>
        );
      },
    },
  ];

  const fetchData = () => {
    setLoading(true);
    fetch(
      `http://127.0.0.1:8000/api/order_transection`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((res) => {
        const products = (res.data || []).map((item, index) => ({
          ...item,
          key: item.item_id || index,
          index: index + 1,
          amount_sold: Number(item.amount_sold) || 0,
          total_quantity_sold: Number(item.total_quantity_sold) || 0,
          item_code: item.item_code || `PRD-${String(index + 1).padStart(5, '0')}`,
          category_name: item.category_name || 'Uncategorized',
          brand_name: item.brand_name || 'Unknown'
        }));

        setData(products);
        setFilteredData(products);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: products.length || 0,
          },
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
      sortField: Array.isArray(sorter) ? undefined : sorter.field,
    });
  };

  // Filter products
  const applyFilters = () => {
    let filtered = [...data];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.barcode?.includes(searchTerm) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category_name === selectedCategory);
    }

    // Brand filter
    if (selectedBrand !== "all") {
      filtered = filtered.filter(item => item.brand_name === selectedBrand);
    }

    setFilteredData(filtered);
    setTableParams({
      ...tableParams,
      pagination: {
        ...tableParams.pagination,
        current: 1,
        total: filtered.length,
      },
    });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setDateRange(null);
    setFilteredData(data);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, selectedBrand, data]);

  // Get top selling products
  const getTopProducts = () => {
    return [...filteredData]
      .sort((a, b) => (b.total_quantity_sold || 0) - (a.total_quantity_sold || 0))
      .slice(0, 5);
  };

  // Get top categories
  const getTopCategories = () => {
    return Object.entries(stats.categorySales)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        quantity: data.quantity
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();
  const topCategories = getTopCategories();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-transparent p-4">
        {/* Header Section */}
        <div className="mb-2">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                  <LuChartBar className="text-2xl text-white" />
                </div>
                Sales Analytics
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Product sales performance and revenue insights
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<LuRefreshCw />}
                onClick={fetchData}
                loading={loading}
                className="flex items-center space-x-2 h-12 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              >
                Refresh Data
              </Button>
              <ExportExel
                data={filteredData.map(item => ({
                  'Product ID': item.item_id,
                  'Product Name': item.item_name,
                  'Item Code': item.item_code,
                  'Barcode': item.barcode,
                  'Category': item.category_name,
                  'Brand': item.brand_name,
                  'Amount Sold': formatCurrency(item.amount_sold),
                  'Quantity Sold': item.total_quantity_sold,
                  'Average Price': formatCurrency(item.amount_sold / (item.total_quantity_sold || 1))
                }))}
                title={"Product_Sales_Report"}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold shadow-sm hover:shadow-sm transition-all duration-300 h-12"
              >
                <LuDownload className="text-lg" />
                <span>Export Report</span>
              </ExportExel>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2"
        >
          {/* Total Products Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50 hover:shadow-sm transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-semibold mb-2 uppercase tracking-wider">Products Tracked</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalProducts?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Active products</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                  <LuPackage className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Total Revenue Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-green-50 hover:shadow-sm transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-semibold mb-2 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totalAmountSold)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Sales amount</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                  <LuDollarSign className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Total Quantity Sold Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-purple-50 hover:shadow-sm transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-semibold mb-2 uppercase tracking-wider">Units Sold</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalQuantitySold?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Total quantity</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                  <LuShoppingCart className="text-2xl text-purple-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Average Sale Card */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-orange-50 hover:shadow-sm transition-all duration-300">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-semibold mb-2 uppercase tracking-wider">Avg. Sale Value</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.avgAmountPerProduct)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Per product</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl">
                  <LuTrendingUp className="text-2xl text-orange-600" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by product name, code, barcode, category or brand..."
                prefix={<LuSearch className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-xl"
                allowClear
                size="large"
              />
            </div>

            {/* Category Filter */}
            <div>
              <Select
                placeholder="Filter by Category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                className="w-full h-12 rounded-xl"
                suffixIcon={<LuFilter className="text-gray-400" />}
              >
                <Option value="all">All Categories</Option>
                {getCategories().map(category => (
                  <Option key={category} value={category}>{category}</Option>
                ))}
              </Select>
            </div>

            {/* Brand Filter */}
            <div>
              <Select
                placeholder="Filter by Brand"
                value={selectedBrand}
                onChange={setSelectedBrand}
                className="w-full h-12 rounded-xl"
                suffixIcon={<LuStore className="text-gray-400" />}
              >
                <Option value="all">All Brands</Option>
                {getBrands().map(brand => (
                  <Option key={brand} value={brand}>{brand}</Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-2">
            <Button
              onClick={resetFilters}
              className="flex items-center space-x-2 h-10 px-4"
            >
              Reset Filters
            </Button>

            <div className="flex items-center gap-2">
              <Tag color="blue" className="text-sm py-1 px-3">
                Showing: {filteredData.length} products
              </Tag>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="">
          {/* Products Table */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card
                className="border-0 shadow-sm h-full"
                bodyStyle={{ padding: 0 }}
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Product Sales Performance
                    </h3>
                    <div className="flex items-center gap-3">
                      <Tag color="green" className="font-medium">
                        Total: {formatCurrency(stats.totalAmountSold)}
                      </Tag>
                      <Tag color="blue" className="font-medium">
                        Units: {stats.totalQuantitySold.toLocaleString()}
                      </Tag>
                    </div>
                  </div>
                </div>

                <Table
                  columns={columns}
                  rowKey="key"
                  dataSource={filteredData}
                  pagination={{
                    ...tableParams.pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `Showing ${range[0]}-${range[1]} of ${total} products`,
                    pageSizeOptions: ['10', '25', '50', '100'],
                    className: "px-6 py-4"
                  }}
                  loading={loading}
                  onChange={handleTableChange}
                  scroll={{ x: 1200 }}
                  className="ant-table-striped"
                  rowClassName={(record, index) =>
                    index % 2 === 0 ? "bg-gray-50" : ""
                  }
                // expandable={{
                //   expandedRowRender: (record) => (
                //     <div className="p-4 bg-gray-50 rounded-lg">
                //       <h4 className="font-semibold text-gray-900 mb-3">Product Details</h4>
                //       <div className="grid grid-cols-2 gap-6">
                //         <div>
                //           <p className="text-sm text-gray-600 mb-2">Product Information:</p>
                //           <div className="space-y-2">
                //             <p className="text-sm">
                //               <span className="text-gray-600">Item Code:</span>{' '}
                //               <span className="font-medium">{record.item_code}</span>
                //             </p>
                //             <p className="text-sm">
                //               <span className="text-gray-600">Barcode:</span>{' '}
                //               <span className="font-medium">{record.barcode}</span>
                //             </p>
                //             <p className="text-sm">
                //               <span className="text-gray-600">Category:</span>{' '}
                //               <span className="font-medium">{record.category_name}</span>
                //             </p>
                //             <p className="text-sm">
                //               <span className="text-gray-600">Brand:</span>{' '}
                //               <span className="font-medium">{record.brand_name}</span>
                //             </p>
                //           </div>
                //         </div>
                //         <div>
                //           <p className="text-sm text-gray-600 mb-2">Sales Metrics:</p>
                //           <div className="space-y-3">
                //             <div>
                //               <div className="flex justify-between text-sm">
                //                 <span className="text-gray-600">Revenue:</span>
                //                 <span className="font-semibold text-green-600">
                //                   {formatCurrency(record.amount_sold)}
                //                 </span>
                //               </div>
                //               <Progress
                //                 percent={stats.totalAmountSold > 0 ?
                //                   Math.round((record.amount_sold / stats.totalAmountSold) * 100) : 0}
                //                 size="small"
                //                 strokeColor="#10b981"
                //                 showInfo={false}
                //                 className="mt-1"
                //               />
                //             </div>
                //             <div>
                //               <div className="flex justify-between text-sm">
                //                 <span className="text-gray-600">Units Sold:</span>
                //                 <span className="font-semibold text-blue-600">
                //                   {record.total_quantity_sold}
                //                 </span>
                //               </div>
                //               <Progress
                //                 percent={stats.totalQuantitySold > 0 ?
                //                   Math.round((record.total_quantity_sold / stats.totalQuantitySold) * 100) : 0}
                //                 size="small"
                //                 strokeColor="#3b82f6"
                //                 showInfo={false}
                //                 className="mt-1"
                //               />
                //             </div>
                //           </div>
                //         </div>
                //       </div>
                //     </div>
                //   ),
                // }}
                />
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Stats and Analytics */}
          {/* <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-8"
            >
              
              <Card className="border-0 shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LuTrendingUp className="text-green-500" />
                    Top Selling Products
                  </h3>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => {
                      const amount = Number(product.amount_sold) || 0;
                      const quantity = Number(product.total_quantity_sold) || 0;
                      const avgPrice = quantity > 0 ? amount / quantity : 0;

                      return (
                        <div key={product.item_id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                              }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.item_name}</p>
                              <p className="text-xs text-gray-500">{quantity} units</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(amount)}</p>
                            <p className="text-xs text-gray-500">{formatCurrency(avgPrice)}/unit</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              
              <Card className="border-0 shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LuPercent className="text-blue-500" />
                    Category Performance
                  </h3>
                  <div className="space-y-4">
                    {topCategories.map((category, index) => (
                      <div key={category.category}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-blue-100 text-blue-600' :
                              index === 1 ? 'bg-green-100 text-green-600' :
                                index === 2 ? 'bg-purple-100 text-purple-600' :
                                  'bg-orange-100 text-orange-600'
                              }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[120px]">{category.category}</span>
                          </div>
                          <span className="font-semibold text-green-600">{formatCurrency(category.amount)}</span>
                        </div>
                        <Progress
                          percent={stats.totalAmountSold > 0 ?
                            Math.round((category.amount / stats.totalAmountSold) * 100) : 0}
                          size="small"
                          strokeColor={index === 0 ? '#3b82f6' :
                            index === 1 ? '#10b981' :
                              index === 2 ? '#8b5cf6' :
                                '#f97316'}
                          className="mt-1"
                          showInfo={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              
              <Card className="border-0 shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LuChartBar className="text-purple-500" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Average Revenue per Product</span>
                        <span className="font-semibold">{formatCurrency(stats.avgAmountPerProduct)}</span>
                      </div>
                      <Progress
                        percent={Math.min(100, Math.round(stats.avgAmountPerProduct / 100))}
                        size="small"
                        strokeColor="#8b5cf6"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Average Units per Product</span>
                        <span className="font-semibold">{stats.avgQuantityPerProduct.toFixed(1)} units</span>
                      </div>
                      <Progress
                        percent={Math.min(100, Math.round(stats.avgQuantityPerProduct * 10))}
                        size="small"
                        strokeColor="#10b981"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Active Products Ratio</span>
                        <span className="font-semibold">
                          {data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0}%
                        </span>
                      </div>
                      <Progress
                        percent={data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0}
                        size="small"
                        strokeColor="#3b82f6"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div> */}
        </div>
      </div>
    </motion.div>
  );
};

export default RecordStockSale;