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
} from "react-icons/lu";
import { Link } from "react-router";
import { Table, Tag, Card, Input, Select, Button, DatePicker, Image, Tooltip, Drawer, Space, Grid, Row, Col, Switch, Badge } from "antd";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import api from "../../services/api";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { useBreakpoint } = Grid;

const StockTransferList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const screens = useBreakpoint();

  // Auto switch to grid view on mobile
  useEffect(() => {
    if (!screens.md && viewMode === 'table') {
      setViewMode('grid');
    } else if (screens.md && viewMode === 'grid') {
      setViewMode('table');
    }
  }, [screens.md]);

  // Calculate statistics based on transfer data only
  const calculateStats = () => {
    const totalTransfers = filteredData.length;
    const totalStockIn = filteredData?.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const totalStockOut = filteredData?.reduce((sum, item) => sum + (Number(item.stock_out) || 0), 0);
    const totalQuantity = filteredData?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    // Calculate net transfer (incoming - outgoing)
    const netTransfer = totalStockIn - totalStockOut;

    // Get unique warehouses involved in transfers
    const uniqueFromWarehouses = new Set(filteredData.map(item => item.from_warehouse_name));
    const uniqueToWarehouses = new Set(filteredData.map(item => item.to_warehouse_name));
    const uniqueWarehouses = new Set([...uniqueFromWarehouses, ...uniqueToWarehouses]).size;

    return {
      totalTransfers,
      totalStockIn,
      totalStockOut,
      totalQuantity,
      netTransfer,
      uniqueWarehouses
    };
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

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
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
        title: "STOCK NO.",
        dataIndex: "stock_no",
        width: "100px",
        render: (stockNo) => (
          <div className="font-semibold text-gray-900 text-sm">
            {stockNo}
          </div>
        ),
      },
    ];

    if (!screens.md) {
      // Mobile view - compact columns
      return [
        ...baseColumns,
        {
          title: "TRANSFER",
          width: "200px",
          render: (_, record) => (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <Tag color="red" className="text-xs px-2 py-0.5 font-medium">
                    {record.from_warehouse_name?.substring(0, 10)}...
                  </Tag>
                </div>
                <LuArrowRightLeft className="text-gray-400 text-xs" />
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">To</div>
                  <Tag color="green" className="text-xs px-2 py-0.5 font-medium">
                    {record.to_warehouse_name?.substring(0, 10)}...
                  </Tag>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {dayjs(record.created_at).format('MMM DD')}
              </div>
            </div>
          ),
        },
        {
          title: "QTY",
          dataIndex: "quantity",
          width: "80px",
          align: 'center',
          render: (value) => (
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{value}</div>
            </div>
          ),
        },
        {
          title: "ACTIONS",
          width: "100px",
          align: 'center',
          render: (_, record) => (
            <div className="flex gap-1">
              <Tooltip title="View Details">
                <Link to={`detail/${record.stock_id}`}>
                  <button className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
                    <FaEye size={14} />
                  </button>
                </Link>
              </Tooltip>
              <Tooltip title="Edit">
                <Link to={`update/${record.stock_id}`}>
                  <button className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors">
                    <FaEdit size={14} />
                  </button>
                </Link>
              </Tooltip>
            </div>
          ),
        },
      ];
    }

    // Desktop view - full columns
    return [
      ...baseColumns,
      {
        title: "TRANSFER DETAILS",
        width: "250px",
        render: (_, record) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">From</div>
                <div className="flex items-center gap-2">
                  <LuWarehouse className="text-red-500" />
                  <Tag color="red" className="text-xs px-2 py-0.5 font-medium">
                    {record.from_warehouse_name}
                  </Tag>
                </div>
              </div>
              <LuArrowRightLeft className="text-gray-400 text-sm" />
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">To</div>
                <div className="flex items-center gap-2">
                  <LuWarehouse className="text-green-500" />
                  <Tag color="green" className="text-xs px-2 py-0.5 font-medium">
                    {record.to_warehouse_name}
                  </Tag>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              <LuCalendar className="inline mr-1" />
              {dayjs(record.created_at).format('MMM DD, YYYY HH:mm')}
            </div>
          </div>
        ),
      },
      {
        title: "QUANTITY TRANSFERRED",
        dataIndex: "quantity",
        width: "120px",
        align: 'center',
        render: (value) => (
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{value}</div>
            <div className="text-xs text-gray-500">Total Units</div>
          </div>
        ),
      },
      {
        title: "ACTIONS",
        width: "140px",
        align: 'center',
        render: (_, record) => (
          <div className="flex gap-2">
            <Tooltip title="View Details">
              <Link to={`detail/${record.stock_id}`}>
                <button className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
                  <FaEye />
                </button>
              </Link>
            </Tooltip>
            <Tooltip title="Edit Stock">
              <Link to={`update/${record.stock_id}`}>
                <button className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors">
                  <FaEdit />
                </button>
              </Link>
            </Tooltip>
            <Tooltip title="Delete Stock">
              <button
                onClick={() => handleDelete(record.stock_id)}
                className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
              >
                <FaTrash />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ];
  };

  // Render grid/card view for mobile
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 gap-3">
        {filteredData.map((record, index) => (
          <motion.div
            key={`${record.item_id}-${record.created_at}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <Badge
                        count="Transfer"
                        style={{ backgroundColor: '#1890ff', fontSize: '10px' }}
                      />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {record.stock_no}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {record.quantity}
                    </div>
                    <div className="text-xs text-gray-500">Units</div>
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-center flex-1">
                      <div className="text-xs text-gray-500 mb-1">From</div>
                      <div className="flex items-center justify-center gap-1">
                        <LuWarehouse className="text-red-500 text-sm" />
                        <span className="text-sm font-medium text-red-600">
                          {record.from_warehouse_name?.length > 15
                            ? record.from_warehouse_name.substring(0, 15) + '...'
                            : record.from_warehouse_name}
                        </span>
                      </div>
                    </div>

                    <LuArrowRightLeft className="text-gray-400 mx-2" />

                    <div className="text-center flex-1">
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="flex items-center justify-center gap-1">
                        <LuWarehouse className="text-green-500 text-sm" />
                        <span className="text-sm font-medium text-green-600">
                          {record.to_warehouse_name?.length > 15
                            ? record.to_warehouse_name.substring(0, 15) + '...'
                            : record.to_warehouse_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-xs text-gray-500 mt-2">
                    <LuCalendar className="mr-1" />
                    {dayjs(record.created_at).format('MMM DD, YYYY HH:mm')}
                  </div>
                </div>

                {/* Product Info */}
                {record.item_name && (
                  <div className="border-t pt-2">
                    <div className="text-sm text-gray-600 truncate">
                      <span className="font-medium">Product:</span> {record.item_name}
                    </div>
                    {record.item_code && (
                      <div className="text-xs text-gray-500">
                        Code: {record.item_code}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-2">
                    <Link to={`detail/${record.stock_id}`}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<FaEye />}
                        className="flex items-center gap-1"
                      >
                        View
                      </Button>
                    </Link>
                    <Link to={`update/${record.stock_id}`}>
                      <Button
                        size="small"
                        icon={<FaEdit />}
                        className="flex items-center gap-1"
                      >
                        Edit
                      </Button>
                    </Link>
                  </div>

                  <Button
                    size="small"
                    danger
                    icon={<FaTrash />}
                    onClick={() => handleDelete(record.stock_id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Empty State */}
        {filteredData.length === 0 && !loading && (
          <Card className="text-center py-8 border-2 border-dashed border-gray-300">
            <LuTruck className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Transfer Records Found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or create a new transfer</p>
            <Link to="/dashboard/transfer-stock">
              <Button type="primary" icon={<LuPlus />}>
                Create Transfer
              </Button>
            </Link>
          </Card>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(tableParams)]);

  useEffect(() => {
    applyFilters();
  }, [data, searchTerm, selectedWarehouse, dateRange]);

  const applyFilters = () => {
    let result = [...data];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.item_code?.toLowerCase().includes(term) ||
          item.item_name?.toLowerCase().includes(term) ||
          item.barcode?.includes(term) ||
          item.category_name?.toLowerCase().includes(term) ||
          item.brand_name?.toLowerCase().includes(term) ||
          item.from_warehouse_name?.toLowerCase().includes(term) ||
          item.to_warehouse_name?.toLowerCase().includes(term)
      ) || [];
    }

    // Warehouse filter
    if (selectedWarehouse !== "all") {
      result = result.filter(
        (item) =>
          item.from_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase() ||
          item.to_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase()
      ) || [];
    }

    // Date range filter (for transfer date)
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      result = result.filter((item) => {
        const itemDate = dayjs(item.created_at);
        return itemDate.isAfter(start) && itemDate.isBefore(end.add(1, 'day'));
      });
    }

    setFilteredData(result);
  };

  const exportToExcel = (apiResponse) => {
    // Extract data array
    const data = apiResponse?.map(item => ({
      ItemCode: item.item_code,
      Barcode: item.barcode,
      ItemName: item.item_name,
      Category: item.category_name,
      Brand: item.brand_name,
      Price: item.item_price,
      WholesalePrice: item.wholesale_price,
      Quantity: item.quantity,
      StockOut: item.stock_out,
      FromWarehouse: item.from_warehouse_name,
      ToWarehouse: item.to_warehouse_name,
      ExpireDate: item.expire_date,
      CreatedAt: item.created_at
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Transfer Summary");

    // Export file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const fileData = new Blob(
      [excelBuffer],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );

    saveAs(fileData, "stock_transfer.xlsx");
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortOrder: sorter.order,
      sortField: sorter.field,
    });
  };

  const fetchData = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: tableParams.pagination.current,
      limit: tableParams.pagination.pageSize,
    });
    try {
      const res = await api.get(`/stock_transfer?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });

      if (res.status === 200 && res.data) {
        setData(res?.data?.data);
        setFilteredData(res?.data?.data);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            current: res.pagination?.current_page || 1,
            pageSize: res.pagination?.per_page || 10,
            total: res.pagination?.total || res.data?.length || 0,
          },
        });
      } else {
        throw new Error(res.message || "Failed to fetch data");
      }
      setLoading(false);

    } catch (error) {
      toast.error("Failed to fetch data. Please try again.");
      console.error("Error fetching data:", error);
      setLoading(false);
    };
  };

  const onSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedWarehouse("all");
    setDateRange(null);
    if (mobileFiltersOpen) setMobileFiltersOpen(false);
  };

  // Mobile filters drawer
  const renderMobileFilters = () => (
    <Drawer
      title="Filters"
      placement="right"
      onClose={() => setMobileFiltersOpen(false)}
      open={mobileFiltersOpen}
      width={300}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <Input
            placeholder="Search transfers..."
            prefix={<LuSearch className="text-gray-400" />}
            value={searchTerm}
            onChange={onSearch}
            size="large"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse
          </label>
          <Select
            placeholder="Select warehouse"
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
            className="w-full"
            size="large"
          >
            <Option value="all">All Warehouses</Option>
            {warehouses.map(warehouse => (
              <Option key={warehouse} value={warehouse}>
                {warehouse}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <RangePicker
            placeholder={['Start', 'End']}
            value={dateRange}
            onChange={setDateRange}
            className="w-full"
            format="MMM DD, YYYY"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={resetFilters}
            className="flex-1"
            size="large"
          >
            Reset All
          </Button>
          <Button
            type="primary"
            onClick={() => setMobileFiltersOpen(false)}
            className="flex-1"
            size="large"
          >
            Apply
          </Button>
        </div>
      </div>
    </Drawer>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-transparent p-3 md:p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <LuTruck className="text-xl md:text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
                    Stock Transfer Records
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base">
                    Monitor and track all inventory transfers
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* View Toggle for Desktop */}
                {screens.md && (
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                    <Button
                      type={viewMode === 'table' ? 'primary' : 'text'}
                      icon={<LuList />}
                      onClick={() => setViewMode('table')}
                      size="small"
                    />
                    <Button
                      type={viewMode === 'grid' ? 'primary' : 'text'}
                      icon={<LuGrid3X3 />}
                      onClick={() => setViewMode('grid')}
                      size="small"
                    />
                  </div>
                )}

                <Button
                  icon={<LuRefreshCw />}
                  onClick={fetchData}
                  loading={loading}
                  size={screens.md ? "middle" : "small"}
                  className="flex items-center"
                >
                  {screens.sm && "Refresh"}
                </Button>
                <Button
                  icon={<LuDownload />}
                  onClick={() => exportToExcel(filteredData)}
                  size={screens.md ? "middle" : "small"}
                  type="primary"
                  className="flex items-center"
                >
                  {screens.sm && "Export"}
                </Button>
                <Link to="/dashboard/transfer-stock">
                  <Button
                    icon={<LuPlus />}
                    size={screens.md ? "middle" : "small"}
                    type="primary"
                    className="flex items-center bg-green-500 hover:bg-green-600"
                  >
                    {screens.sm && "New Transfer"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-1 sm:gap-3 mb-4"
        >
          <Card className="border-0 shadow-sm">
            <div className="flex items-center flex-col-reverse sm:flex-row justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Total</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                  {stats.totalTransfers}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <LuTruck className="text-lg md:text-xl text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm">
            <div className="flex items-center flex-col-reverse sm:flex-row justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Net</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                  {stats.netTransfer}
                </p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-full">
                <LuArrowRightLeft className="text-lg md:text-xl text-cyan-600" />
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm">
            <div className="flex items-center flex-col-reverse sm:flex-row justify-between">
              <div>
                <p className="text-gray-500 text-xs md:text-sm font-medium mb-1">Warehouses</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                  {stats.uniqueWarehouses}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <LuWarehouse className="text-lg md:text-xl text-orange-600" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-4 md:mb-6"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-lg">
                <Input
                  placeholder="Search transfers..."
                  prefix={<LuSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={onSearch}
                  className="w-full"
                  size="large"
                  allowClear
                />
              </div>

              {!screens.md && (
                <div className="flex gap-2 ml-2">
                  <Button
                    icon={<LuFilter />}
                    onClick={() => setMobileFiltersOpen(true)}
                    size="large"
                  />
                  <Button
                    icon={viewMode === 'grid' ? <LuList /> : <LuGrid3X3 />}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                    size="large"
                  />
                </div>
              )}
            </div>

            {screens.md && (
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Select
                    placeholder="Filter by Warehouse"
                    value={selectedWarehouse}
                    onChange={setSelectedWarehouse}
                    className="w-full sm:w-48"
                    size="large"
                    allowClear
                  >
                    <Option value="all">All Warehouses</Option>
                    {warehouses.map(warehouse => (
                      <Option key={warehouse} value={warehouse}>
                        {warehouse}
                      </Option>
                    ))}
                  </Select>

                  <RangePicker
                    placeholder={['Start Date', 'End Date']}
                    value={dateRange}
                    onChange={setDateRange}
                    className="w-full sm:w-auto"
                    size="large"
                    format="MMM DD, YYYY"
                  />
                </div>

                <Button
                  onClick={resetFilters}
                  size="large"
                  className="whitespace-nowrap"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transfer records...</p>
          </div>
        )}

        {/* Content Section */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* View Mode Toggle for Mobile */}
            {!screens.md && (
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  Showing {filteredData.length} transfers
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {viewMode === 'grid' ? 'Grid View' : 'Table View'}
                  </span>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' ? (
              renderGridView()
            ) : (
              /* Table View */
              <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    columns={getColumns()}
                    rowKey={(record) => `${record.item_id}-${record.created_at}-${record.from_warehouse}`}
                    dataSource={filteredData.map((item, index) => ({ ...item, index }))}
                    pagination={{
                      ...tableParams.pagination,
                      showSizeChanger: screens.sm,
                      showQuickJumper: screens.sm,
                      showTotal: screens.sm ? (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} transfers` : undefined,
                      simple: !screens.sm,
                      className: "px-3 md:px-6 py-3 md:py-4 border-t border-gray-200",
                      pageSizeOptions: ['10', '25', '50', '100'],
                    }}
                    loading={loading}
                    onChange={handleTableChange}
                    scroll={{ x: screens.md ? 1200 : 800 }}
                    size={screens.md ? "middle" : "small"}
                    summary={() => {
                      if (!screens.sm) return null;

                      const totalQuantity = filteredData.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                            <Table.Summary.Cell index={0} colSpan={screens.md ? 3 : 2} align="right">
                              <strong className="text-gray-700 text-sm">Transfer Summary</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <div className="text-center">
                                <div className="font-semibold text-gray-800 text-lg">{totalQuantity}</div>
                                <div className="text-xs text-gray-500">Total Units</div>
                              </div>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={3} colSpan={screens.md ? 3 : 1} />
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State for Table View */}
            {viewMode === 'table' && filteredData.length === 0 && !loading && (
              <Card className="text-center py-12 border-2 border-dashed border-gray-300 mt-4">
                <LuTruck className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Transfer Records Found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or create a new transfer</p>
                <Link to="/dashboard/transfer-stock">
                  <Button type="primary" icon={<LuPlus />}>
                    Create Transfer
                  </Button>
                </Link>
              </Card>
            )}
          </motion.div>
        )}

        {/* Mobile Filters Drawer */}
        {renderMobileFilters()}

        {/* Mobile Floating Action Button */}
        {!screens.md && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<LuPlus />}
              onClick={() => window.location.href = "/dashboard/transfer-stock"}
              className="shadow-lg"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StockTransferList;