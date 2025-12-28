import React, { useEffect, useState } from "react";
import {
  LuListChecks,
  LuGrid2X2,
  LuList,
  LuDownload,
  LuSearch,
  LuFilter,
  LuPlus,
  LuRefreshCw,
  LuCheckCheck,
  LuLayoutGrid,
  LuPackagePlus,
  LuPackageMinus,
  LuShoppingCart,
  LuPackageX
} from "react-icons/lu";
import {
  CiBoxList
} from "react-icons/ci";
import {
  VscSignOut
} from "react-icons/vsc";
import { Link } from "react-router";
import { Table, Tag, Card, Row, Col, Input, Select, Button, Statistic, Progress, Dropdown, DatePicker, Image } from "antd";
import { motion } from "framer-motion";
import ExportExel from "../../services/ExportExel";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
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
  const { pagination, filters, sortField, sortOrder } = params,
    restParams = __rest(params, [
      "pagination",
      "filters",
      "sortField",
      "sortOrder",
    ]);
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
  const [dateRange, setDateRange] = useState(null);
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

    return {
      totalTransactions,
      totalStockIn,
      totalStockOut,
      totalSales,
      totalWaste,
      totalReturns
    };
  };

  const calculateAvailableStock = (item) => {
    return parseInt(item.stock_in) -
      parseInt(item.stock_out) -
      parseInt(item.stock_sale) -
      parseInt(item.stock_waste || "0") -
      parseInt(item.stock_return || "0");
  };

  const stats = calculateStats();

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      width: "60px",
      render: (text, record, index) => (
        <div className="text-center font-semibold text-gray-600">
          {index + 1}
        </div>
      ),
    },
    {
      title: "PRODUCT",
      width: "100px",
      render: (_, record) => (
        <div className="flex items-center justify-center">
          <Image
            width={60}
            height={60}
            src={record.image}
            alt={record.item_name}
            className="rounded-lg object-cover border border-gray-200"
            fallback={
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center">
                <span className="text-lg font-bold text-blue-600">
                  {record.item_name?.charAt(0) || 'P'}
                </span>
              </div>
            }
          />
        </div>
      ),
    },
    {
      title: "PRODUCT INFO",
      width: "250px",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm mb-1">{record.item_name}</div>
          <div className="text-xs text-gray-500 font-mono mb-2">{record.item_code}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <Tag color="blue" className="text-xs px-2 py-0.5">
              {record.category_name}
            </Tag>
            <Tag color="purple" className="text-xs px-2 py-0.5">
              {record.brand_name}
            </Tag>
            {record.barcode && (
              <div className="text-xs text-gray-500">
                Barcode: {record.barcode}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "TRANSACTION INFO",
      width: "200px",
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transaction Date:</span>
            <span className="font-medium text-gray-700">
              {dayjs(record.created_at).format('MMM DD, YYYY')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Expiry:</span>
            <Tag color={dayjs().isAfter(dayjs(record.expire_date)) ? "red" : "green"} className="text-xs">
              {dayjs(record.expire_date).format('MMM DD, YYYY')}
            </Tag>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Quantity:</span>
            <span className="font-bold text-blue-600">{record.quantity}</span>
          </div>
        </div>
      ),
    },
    {
      title: "STOCK IN",
      dataIndex: "stock_in",
      width: "100px",
      align: 'center',
      sorter: (a, b) => parseInt(a.stock_in) - parseInt(b.stock_in),
      render: (stock) => (
        <div className="text-center">
          <div className="font-bold text-green-600 text-lg">{stock}</div>
          <div className="text-xs text-gray-500">Received</div>
        </div>
      ),
    },
    {
      title: "STOCK OUT",
      dataIndex: "stock_out",
      width: "100px",
      align: 'center',
      sorter: (a, b) => parseInt(a.stock_out) - parseInt(b.stock_out),
      render: (stock) => (
        <div className="text-center">
          <div className="font-bold text-red-600 text-lg">{stock}</div>
          <div className="text-xs text-gray-500">Sent</div>
        </div>
      ),
    },
    {
      title: "SALES",
      dataIndex: "stock_sale",
      width: "100px",
      align: 'center',
      sorter: (a, b) => parseInt(a.stock_sale) - parseInt(b.stock_sale),
      render: (stock) => (
        <div className="text-center">
          <div className="font-bold text-purple-600 text-lg">{stock}</div>
          <div className="text-xs text-gray-500">Sold</div>
        </div>
      ),
    },
    {
      title: "WASTE",
      dataIndex: "stock_waste",
      width: "100px",
      align: 'center',
      sorter: (a, b) => parseInt(a.stock_waste) - parseInt(b.stock_waste),
      render: (stock) => (
        <div className="text-center">
          <div className="font-bold text-yellow-600 text-lg">{stock || 0}</div>
          <div className="text-xs text-gray-500">Wasted</div>
        </div>
      ),
    },
    {
      title: "RETURNS",
      dataIndex: "stock_return",
      width: "100px",
      align: 'center',
      sorter: (a, b) => parseInt(a.stock_return) - parseInt(b.stock_return),
      render: (stock) => (
        <div className="text-center">
          <div className="font-bold text-cyan-600 text-lg">{stock || 0}</div>
          <div className="text-xs text-gray-500">Returned</div>
        </div>
      ),
    },
    {
      title: "NET",
      width: "100px",
      align: 'center',
      render: (_, record) => {
        const net = calculateAvailableStock(record);
        return (
          <div className="text-center">
            <Tag
              color={net >= 0 ? "green" : "red"}
              className="font-bold text-sm"
            >
              {net}
            </Tag>
            <div className="text-xs text-gray-500">Available</div>
          </div>
        );
      },
      sorter: (a, b) => calculateAvailableStock(a) - calculateAvailableStock(b),
    },
  ];

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

    const matchesDate = !dateRange || !dateRange.length ||
      (dayjs(item.created_at).isAfter(dayjs(dateRange[0])) &&
        dayjs(item.created_at).isBefore(dayjs(dateRange[1]).add(1, 'day')));

    return matchesSearch && matchesCategory && matchesTransaction && matchesDate;
  });

  const params = toURLSearchParams(getRandomuserParams(tableParams));

  const fetchData = () => {
    setLoading(true);
    fetch(
      `http://127.0.0.1:8000/api/stock_transection?${params.toString()}`,
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
        if (res.status === 200 && res.data) {
          setData(res.data);
          setItemData(res.data.map(item => ({
            item_code: item.item_code,
            item_name: item.item_name,
            category_name: item.category_name,
            brand_name: item.brand_name,
            stock_in: parseInt(item.stock_in),
            stock_out: parseInt(item.stock_out),
            stock_sale: parseInt(item.stock_sale),
            stock_waste: parseInt(item.stock_waste || "0"),
            stock_return: parseInt(item.stock_return || "0"),
            quantity: parseInt(item.quantity),
            created_at: item.created_at,
            expire_date: item.expire_date
          })));
          setTableParams({
            ...tableParams,
            pagination: {
              ...tableParams.pagination,
              total: res.pagination?.total || 100,
            },
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
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

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortOrder: Array.isArray(sorter) ? undefined : sorter.order,
      sortField: Array.isArray(sorter) ? undefined : sorter.field,
    });

    if (pagination.pageSize !== tableParams.pagination?.pageSize) {
      setData([]);
    }
  };

  // Grid Layout Configuration
  const getGridCols = () => {
    switch (gridColumns) {
      case 2: return { xs: 24, sm: 24, md: 12, lg: 12, xl: 12 };
      case 3: return { xs: 24, sm: 24, md: 12, lg: 8, xl: 8 };
      case 4: return { xs: 24, sm: 12, md: 12, lg: 6, xl: 6 };
      case 6: return { xs: 24, sm: 12, md: 8, lg: 6, xl: 4 };
      default: return { xs: 24, sm: 12, md: 12, lg: 6, xl: 6 };
    }
  };

  const StockTransactionCard = ({ item, index }) => {
    const availableStock = calculateAvailableStock(item);
    const stockIn = parseInt(item.stock_in);
    const stockOut = parseInt(item.stock_out);
    const stockSale = parseInt(item.stock_sale);
    const stockWaste = parseInt(item.stock_waste || "0");
    const stockReturn = parseInt(item.stock_return || "0");

    const getTransactionType = () => {
      if (stockIn > 0) return { color: 'green', icon: <LuPackagePlus />, label: 'Stock In' };
      if (stockOut > 0) return { color: 'red', icon: <LuPackageMinus />, label: 'Stock Out' };
      if (stockSale > 0) return { color: 'purple', icon: <LuShoppingCart />, label: 'Sale' };
      if (stockWaste > 0) return { color: 'yellow', icon: <LuPackageX />, label: 'Waste' };
      if (stockReturn > 0) return { color: 'cyan', icon: <LuRefreshCw />, label: 'Return' };
      return { color: 'gray', icon: <LuPackagePlus />, label: 'Transaction' };
    };

    const transaction = getTransactionType();

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 hover:scale-[1.02] cursor-pointer"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="flex flex-col h-full">
            {/* Header with Image and Transaction Type */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Image
                  width={48}
                  height={48}
                  src={item.image}
                  alt={item.item_name}
                  className="rounded-xl object-cover border-2 border-white shadow-md"
                  fallback={
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">
                        {item.item_name?.charAt(0) || 'P'}
                      </span>
                    </div>
                  }
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                    {item.item_name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono truncate">{item.item_code}</p>
                </div>
              </div>
              <Tag color={transaction.color} className="font-semibold text-xs flex items-center gap-1">
                {transaction.icon}
                <span>{transaction.label}</span>
              </Tag>
            </div>

            {/* Category and Brand */}
            <div className="flex items-center justify-between mb-3">
              <Tag color="blue" className="text-xs font-semibold">
                {item.category_name}
              </Tag>
              <span className="text-xs text-gray-600 font-medium truncate">{item.brand_name}</span>
            </div>

            {/* Transaction Details */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction Date:</span>
                <span className="font-medium">{dayjs(item.created_at).format('MMM DD')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expiry:</span>
                <Tag color={dayjs().isAfter(dayjs(item.expire_date)) ? "red" : "green"} className="text-xs">
                  {dayjs(item.expire_date).format('MMM DD')}
                </Tag>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-bold text-blue-600">{item.quantity}</span>
              </div>
            </div>

            {/* Stock Movement Metrics */}
            <div className="grid grid-cols-5 gap-1 text-center mb-2">
              <div className="bg-green-50 rounded p-2">
                <div className="font-bold text-green-600 text-sm">{stockIn}</div>
                <div className="text-[10px] text-green-800">Stock In</div>
              </div>
              <div className="bg-red-50 rounded p-2">
                <div className="font-bold text-red-600 text-sm">{stockOut}</div>
                <div className="text-[10px] text-red-800">Stock Out</div>
              </div>
              <div className="bg-purple-50 rounded p-2">
                <div className="font-bold text-purple-600 text-sm">{stockSale}</div>
                <div className="text-[10px] text-purple-800">Sales</div>
              </div>
              <div className="bg-yellow-50 rounded p-2">
                <div className="font-bold text-yellow-600 text-sm">{stockWaste}</div>
                <div className="text-[10px] text-yellow-800">Waste</div>
              </div>
              <div className="bg-cyan-50 rounded p-2">
                <div className="font-bold text-cyan-600 text-sm">{stockReturn}</div>
                <div className="text-[10px] text-cyan-800">Returns</div>
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
        </Card>
      </motion.div>
    );
  };

  const CompactTransactionCard = ({ item, index }) => {
    const availableStock = calculateAvailableStock(item);
    const stockIn = parseInt(item.stock_in);
    const stockOut = parseInt(item.stock_out);
    const stockSale = parseInt(item.stock_sale);

    const getTransactionType = () => {
      if (stockIn > 0) return { color: 'green', icon: <LuPackagePlus className="text-green-500" /> };
      if (stockOut > 0) return { color: 'red', icon: <LuPackageMinus className="text-red-500" /> };
      if (stockSale > 0) return { color: 'purple', icon: <LuShoppingCart className="text-purple-500" /> };
      return { color: 'gray', icon: <LuPackagePlus className="text-gray-500" /> };
    };

    const transaction = getTransactionType();

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50 cursor-pointer"
          bodyStyle={{ padding: '12px' }}
        >
          <div className="flex items-center justify-between">
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
        </Card>
      </motion.div>
    );
  };

  const gridColumnItems = [
    {
      key: '2',
      label: '2 Columns',
      icon: <LuGrid2X2 />,
    },
    {
      key: '3',
      label: '3 Columns',
      icon: <LuGrid2X2 />,
    },
    {
      key: '4',
      label: '4 Columns',
      icon: <LuGrid2X2 />,
    },
    {
      key: '6',
      label: '6 Columns',
      icon: <LuGrid2X2 />,
    },
  ];

  const handleGridColumnChange = ({ key }) => {
    setGridColumns(parseInt(key));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Stock Transactions
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Track all stock movements including sales, returns, and adjustments
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<LuRefreshCw />}
                onClick={fetchData}
                loading={loading}
                className="flex items-center space-x-2 border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600"
              >
                Refresh
              </Button>
              <ExportExel
                data={itemData}
                title={"Stock_Transactions_Report"}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-500 text-sm font-medium mb-1">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {stats.totalTransactions}
                  </p>
                </div>
                <div className="p-2 bg-blue-400 rounded-full">
                  <LuListChecks className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-500 text-sm font-medium mb-1">Total Stock In</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.totalStockIn}
                  </p>
                </div>
                <div className="p-2 bg-green-400 rounded-full">
                  <LuPackagePlus className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-500 text-sm font-medium mb-1">Total Stock Out</p>
                  <p className="text-2xl font-bold text-red-500">
                    {stats.totalStockOut}
                  </p>
                </div>
                <div className="p-2 bg-red-400 rounded-full">
                  <LuPackageMinus className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-500 text-sm font-medium mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {stats.totalSales}
                  </p>
                </div>
                <div className="p-2 bg-purple-400 rounded-full">
                  <LuShoppingCart className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-500 text-sm font-medium mb-1">Total Waste</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {stats.totalWaste}
                  </p>
                </div>
                <div className="p-2 bg-yellow-400 rounded-full">
                  <LuPackageX className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-500 to-cyan-600">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-500 text-sm font-medium mb-1">Total Returns</p>
                  <p className="text-2xl font-bold text-cyan-500">
                    {stats.totalReturns}
                  </p>
                </div>
                <div className="p-2 bg-cyan-400 rounded-full">
                  <LuRefreshCw className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View Toggle and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 border">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "table"
                    ? "bg-white shadow text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <CiBoxList className="text-lg" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <LuGrid2X2 className="text-lg" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center space-x-2 ${viewMode === "compact"
                    ? "bg-white shadow text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <LuList className="text-lg" />
                  <span>Compact</span>
                </button>
              </div>

              {/* Grid Column Selector */}
              {viewMode === "grid" && (
                <Dropdown
                  menu={{
                    items: gridColumnItems,
                    onClick: handleGridColumnChange,
                    selectedKeys: [gridColumns.toString()],
                  }}
                  trigger={['click']}
                >
                  <Button className="flex items-center space-x-2 h-10 px-3 border border-gray-300">
                    <LuLayoutGrid />
                    <span>{gridColumns} Columns</span>
                  </Button>
                </Dropdown>
              )}

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search products, codes, categories..."
                  prefix={<LuSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 rounded-lg border-gray-300 hover:border-blue-400 focus:border-blue-500"
                  allowClear
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select
                placeholder="Category"
                value={selectedCategory}
                onChange={setSelectedCategory}
                className="w-full sm:w-40 h-10"
                allowClear
                suffixIcon={<LuFilter className="text-gray-400" />}
              >
                {categories?.data && categories?.data?.map((category) => (
                  <Option key={category.id} value={category.category_name}>
                    {category.category_name}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Transaction Type"
                value={selectedTransaction}
                onChange={setSelectedTransaction}
                className="w-full sm:w-40 h-10"
                allowClear
              >
                <Option value="stock-in">Stock In</Option>
                <Option value="stock-out">Stock Out</Option>
                <Option value="sales">Sales</Option>
                <Option value="waste">Waste</Option>
                <Option value="returns">Returns</Option>
              </Select>

              <RangePicker
                placeholder={['Start Date', 'End Date']}
                value={dateRange}
                onChange={setDateRange}
                className="h-10"
                format="MMM DD, YYYY"
              />
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === "table" ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <Table
                columns={columns}
                rowKey={(record) => `${record.item_id}-${record.created_at}`}
                dataSource={filteredData.map((item, index) => ({ ...item, index }))}
                pagination={{
                  ...tableParams.pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total} transactions`,
                  className: "px-6 py-4 border-t border-gray-200",
                  pageSizeOptions: ['10', '25', '50', '100'],
                }}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 1500 }}
                className="ant-table-custom"
                summary={() => {
                  const totalIn = filteredData.reduce((s, r) => s + (Number(r.stock_in) || 0), 0);
                  const totalOut = filteredData.reduce((s, r) => s + (Number(r.stock_out) || 0), 0);
                  const totalSale = filteredData.reduce((s, r) => s + (Number(r.stock_sale) || 0), 0);
                  const totalWaste = filteredData.reduce((s, r) => s + (Number(r.stock_waste) || 0), 0);
                  const totalReturn = filteredData.reduce((s, r) => s + (Number(r.stock_return) || 0), 0);
                  const totalQuantity = filteredData.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          <strong className="text-gray-700 text-sm">Transaction Summary</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <div className="text-center">
                            <div className="font-semibold text-green-600">{totalIn}</div>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2}>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{totalOut}</div>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">{totalSale}</div>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600">{totalWaste}</div>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5}>
                          <div className="text-center">
                            <div className="font-semibold text-cyan-600">{totalReturn}</div>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} colSpan={2}>
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{totalQuantity}</div>
                            <div className="text-xs text-gray-500">Total Quantity</div>
                          </div>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>
          ) : viewMode === "grid" ? (
            <div className="bg-transparent">
              <Row gutter={[24, 24]}>
                {filteredData.map((item, index) => (
                  <Col {...getGridCols()} key={`${item.item_id}-${item.created_at}`}>
                    <StockTransactionCard item={item} index={index} />
                  </Col>
                ))}
              </Row>

              {filteredData.length === 0 && !loading && (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No transactions found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Compact View
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="space-y-3">
                  {filteredData.map((item, index) => (
                    <CompactTransactionCard key={`${item.item_id}-${item.created_at}`} item={item} index={index} />
                  ))}
                </div>

                {filteredData.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-1">No transactions found</h3>
                    <p className="text-gray-500 text-sm">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StockTransactions;