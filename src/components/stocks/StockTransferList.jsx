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
  LuInfo
} from "react-icons/lu";
import { Link } from "react-router";
import { Table, Tag, Card, Input, Select, Button, DatePicker, Image, Tooltip } from "antd";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";

const { RangePicker } = DatePicker;
const { Option } = Select;

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


  // Calculate statistics based on transfer data only
  const calculateStats = () => {
    const totalTransfers = filteredData.length;
    const totalStockIn = filteredData.reduce((sum, item) => sum + (Number(item.stock_in) || 0), 0);
    const totalStockOut = filteredData.reduce((sum, item) => sum + (Number(item.stock_out) || 0), 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

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
      title: "STOCK MOVEMENT",
      width: "180px",
      render: (_, record) => (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
            <div className="font-bold text-green-600 text-xl">{record.stock_in || 0}</div>
            <div className="text-xs text-green-700 font-medium">Stock In</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center">
            <div className="font-bold text-red-600 text-xl">{record.stock_out || 0}</div>
            <div className="text-xs text-red-700 font-medium">Stock Out</div>
          </div>
          <div className="col-span-2 mt-2">
            <div className="text-center">
              <div className={`text-sm font-bold ${(Number(record.stock_in) - Number(record.stock_out)) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Net: {Number(record.stock_in) - Number(record.stock_out)}
              </div>
              <div className="text-xs text-gray-500">Net Movement</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "EXPIRY DATE",
      dataIndex: "expire_date",
      width: "120px",
      align: 'center',
      render: (value) => {
        const expired = dayjs().isAfter(dayjs(value));
        const expiringSoon = dayjs().add(30, 'day').isAfter(dayjs(value));

        return (
          <div className="text-center">
            <Tag
              color={expired ? "red" : expiringSoon ? "orange" : "green"}
              className="font-medium text-xs px-3 py-1 mb-2"
            >
              {expired ? "Expired" : expiringSoon ? "Expiring Soon" : "Valid"}
            </Tag>
            <div className="text-xs font-medium text-gray-900">
              {dayjs(value).format('MMM DD, YYYY')}
            </div>
          </div>
        );
      },
    },
    {
      title: "PRICE",
      width: "100px",
      align: 'center',
      render: (_, record) => (
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">${record.item_price}</div>
          <div className="text-xs text-gray-500">Retail</div>
          <div className="text-sm font-medium text-blue-600">${record.wholesale_price}</div>
          <div className="text-xs text-gray-500">Wholesale</div>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      width: "100px",
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
      );
    }

    // Warehouse filter
    if (selectedWarehouse !== "all") {
      result = result.filter(
        (item) =>
          item.from_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase() ||
          item.to_warehouse_name?.toLowerCase() === selectedWarehouse.toLowerCase()
      );
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

  const fetchData = () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: tableParams.pagination.current,
      limit: tableParams.pagination.pageSize,
    });

    fetch(`http://127.0.0.1:8000/api/stock_transection?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        Accept: "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((res) => {
        if (res.status === 200 && res.data) {
          setData(res.data);
          setFilteredData(res.data);
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
      })
      .catch((error) => {
        toast.error("Failed to fetch data. Please try again.");
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  };

  const onSearch = (e) => {
    setSearchTerm(e.target.value);
  };


  const resetFilters = () => {
    setSearchTerm("");
    setSelectedWarehouse("all");
    setDateRange(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-transparent p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <LuTruck className="text-2xl text-white" />
                </div>
                Stock Transfer Records
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Monitor and track all inventory transfers between warehouses
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<LuRefreshCw />}
                onClick={fetchData}
                loading={loading}
                className="flex items-center space-x-2 border border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600"
              >
                Refresh Data
              </Button>
              <Button
                icon={<LuDownload />}
                onClick={() => exportToExcel(filteredData)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
              >
                Export Report
              </Button>
              <Link to="/dashboard/transfer-stock">
                <Button
                  icon={<LuPlus />}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                >
                  New Transfer
                </Button>
              </Link>
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
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-500 text-sm font-medium mb-1">Total Transfers</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {stats.totalTransfers}
                  </p>
                </div>
                <div className="p-2 bg-blue-400 rounded-full">
                  <LuTruck className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-green-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-500 text-sm font-medium mb-1">Total Stock In</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.totalStockIn}
                  </p>
                </div>
                <div className="p-2 bg-green-400 rounded-full">
                  <LuPackage className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-500 to-red-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-500 text-sm font-medium mb-1">Total Stock Out</p>
                  <p className="text-2xl font-bold text-red-500">
                    {stats.totalStockOut}
                  </p>
                </div>
                <div className="p-2 bg-red-400 rounded-full">
                  <LuArrowRightLeft className="text-xl text-white transform rotate-90" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-500 text-sm font-medium mb-1">Total Quantity</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {stats.totalQuantity}
                  </p>
                </div>
                <div className="p-2 bg-purple-400 rounded-full">
                  <span className="text-xl text-white">📦</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-cyan-500 to-cyan-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-500 text-sm font-medium mb-1">Net Transfer</p>
                  <p className="text-2xl font-bold text-cyan-500">
                    {stats.netTransfer}
                  </p>
                </div>
                <div className="p-2 bg-cyan-400 rounded-full">
                  <LuArrowRightLeft className="text-xl text-white" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500 to-orange-600">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-500 text-sm font-medium mb-1">Warehouses</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {stats.uniqueWarehouses}
                  </p>
                </div>
                <div className="p-2 bg-orange-400 rounded-full">
                  <LuWarehouse className="text-xl text-white" />
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
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by product, code, warehouse, or barcode..."
                prefix={<LuSearch className="text-gray-400" />}
                value={searchTerm}
                onChange={onSearch}
                className="h-12 rounded-lg border-gray-300 hover:border-blue-400 focus:border-blue-500"
                allowClear
                size="large"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select
                placeholder="Filter by Warehouse"
                value={selectedWarehouse}
                onChange={setSelectedWarehouse}
                className="w-full sm:w-48 h-12"
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
                placeholder={['Transfer Start', 'Transfer End']}
                value={dateRange}
                onChange={setDateRange}
                className="h-12"
                format="MMM DD, YYYY"
              />

              <Button
                icon={<LuFilter />}
                onClick={resetFilters}
                className="h-12 border border-gray-300 hover:border-red-400 hover:text-red-600"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Table
              columns={columns}
              rowKey={(record) => `${record.item_id}-${record.created_at}-${record.from_warehouse}`}
              dataSource={filteredData.map((item, index) => ({ ...item, index }))}
              pagination={{
                ...tableParams.pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} transfer records`,
                className: "px-6 py-4 border-t border-gray-200",
                pageSizeOptions: ['10', '25', '50', '100'],
              }}
              loading={loading}
              onChange={handleTableChange}
              scroll={{ x: 1500 }}
              summary={() => {
                const totalIn = filteredData.reduce((s, r) => s + (Number(r.stock_in) || 0), 0);
                const totalOut = filteredData.reduce((s, r) => s + (Number(r.stock_out) || 0), 0);
                const totalQuantity = filteredData.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
                const netTransfer = totalIn - totalOut;

                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <strong className="text-gray-700 text-sm">Transfer Summary</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <div className="text-center">
                          <div className="font-semibold text-gray-800 text-lg">{totalQuantity}</div>
                          <div className="text-xs text-gray-500">Total Units</div>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={2}>
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <div className="font-semibold text-green-600 text-lg">{totalIn}</div>
                            <div className="text-xs text-gray-500">Stock In</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600 text-lg">{totalOut}</div>
                            <div className="text-xs text-gray-500">Stock Out</div>
                          </div>
                          <div className="text-center">
                            <div className={`font-semibold ${netTransfer >= 0 ? 'text-blue-600' : 'text-red-600'} text-lg`}>
                              {netTransfer}
                            </div>
                            <div className="text-xs text-gray-500">Net Transfer</div>
                          </div>
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} colSpan={3} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StockTransferList;