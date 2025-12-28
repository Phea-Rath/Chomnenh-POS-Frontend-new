import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { Link } from 'react-router'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { motion } from "framer-motion";
import { useDeleteStockMutation, useGetAllStockQuery } from '../../../app/Features/stocksSlice';
import {
  Card,
  Tag,
  Empty,
  Button,
  Tooltip,
  Badge,
  Statistic,
  Avatar,
  Collapse,
  Progress,
  Image
} from 'antd';
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
  FaTags,
  FaPalette,
  FaRuler,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { MdInventory, MdLocalShipping } from 'react-icons/md';

const { Panel } = Collapse;

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const token = localStorage.getItem('token');
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [viewMode, setViewMode] = useState(localStorage.getItem('stockViewMode') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { setLoading } = useOutletsContext();
  const { data, isLoading, refetch } = useGetAllStockQuery(token);
  const [deleteStock] = useDeleteStockMutation();

  useEffect(() => {
    const stockData = data?.data || [];
    setStocks(stockData);
    setFilteredStocks(stockData);
  }, [data?.data]);

  const handleDelete = (stockId) => {
    setAlertBox(true);
    setId(stockId);
  }

  const handleCancel = () => {
    setAlertBox(false);
  }

  const handleConfirm = async () => {
    try {
      setAlertBox(false);
      setLoading(true);
      const res = await deleteStock({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success("Stock record deleted successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || 'Failed to delete stock record!');
      setLoading(false);
    }
  }

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value) {
      const filtered = stocks.filter((stock) =>
        stock.stock_no?.toLowerCase().includes(value.toLowerCase()) ||
        stock.stock_type_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.from_warehouse_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.to_warehouse_name?.toLowerCase().includes(value.toLowerCase()) ||
        stock.stock_remark?.toLowerCase().includes(value.toLowerCase()) ||
        stock.items?.some(item =>
          item.item_name?.toLowerCase().includes(value.toLowerCase()) ||
          item.item_code?.toLowerCase().includes(value.toLowerCase())
        )
      );
      setFilteredStocks(filtered);
    } else {
      setFilteredStocks(stocks);
    }
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('stockViewMode', mode);
  }

  const getStockTypeColor = (type) => {
    const typeColors = {
      'stock in': 'green',
      'stock out': 'red',
      'stock sale': 'orange',
      'transfer': 'blue',
      'adjustment': 'purple',
      'return': 'yellow'
    };
    return typeColors[type?.toLowerCase()] || 'default';
  }

  const getStockTypeIcon = (type) => {
    const typeIcons = {
      'stock in': <FaBoxOpen className="text-green-500" />,
      'stock out': <FaBox className="text-red-500" />,
      'stock sale': <FaShoppingCart className="text-orange-500" />,
      'transfer': <FaExchangeAlt className="text-blue-500" />,
      'adjustment': <FaEdit className="text-purple-500" />,
      'return': <FaExchangeAlt className="text-yellow-500" />
    };
    return typeIcons[type?.toLowerCase()] || <FaBox className="text-gray-500" />;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const getTotalItems = (stock) => {
    return stock.items?.length || 0;
  }

  const getTotalQuantity = (stock) => {
    return stock.items?.reduce((total, item) => total + (item.quantity || 0), 0) || 0;
  }

  const getTotalValue = (stock) => {
    return stock.items?.reduce((total, item) => total + ((item.quantity || 0) * (item.item_price || 0)), 0) || 0;
  }

  const getAttributeValue = (item, attributeName) => {
    const attribute = item.attributes?.find(attr => attr.name === attributeName);
    return attribute?.value || 'N/A';
  }

  const renderGridItem = (stock, index) => (
    <motion.div
      key={stock.stock_id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        className="h-full border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        actions={[
          <Tooltip title="View Details">
            <Link to={`detail/${stock.stock_id}`}>
              <FaEye className="text-blue-500 mx-auto hover:text-blue-600 transition-colors" />
            </Link>
          </Tooltip>,
          <Tooltip title="Edit Stock">
            <Link to={`update/${stock.stock_id}`}>
              <FaEdit className="text-green-500 mx-auto hover:text-green-600 transition-colors" />
            </Link>
          </Tooltip>,
          <Tooltip title="Delete Stock">
            <FaTrash
              className="text-red-500 hover:text-red-600 mx-auto cursor-pointer transition-colors"
              onClick={() => handleDelete(stock.stock_id)}
            />
          </Tooltip>
        ]}
      >
        {/* Header with Stock Info */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <Badge
              count={stock.stock_type_name}
              style={{ backgroundColor: getStockTypeColor(stock.stock_type_name) }}
              className="mb-2 font-medium"
            />
            <h3 className="font-bold text-lg text-gray-800">{stock.stock_no}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <FaCalendarAlt className="text-gray-400" />
              <span>{formatDate(stock.stock_date)}</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {formatDateTime(stock.created_at)}
              </span>
            </div>
          </div>
          <div className="text-2xl">
            {getStockTypeIcon(stock.stock_type_name)}
          </div>
        </div>

        {/* Warehouse Transfer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaWarehouse className="text-blue-500" />
              <span className="font-medium text-gray-700">Transfer</span>
            </div>
            <FaArrowRight className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">From</div>
              <div className="font-semibold text-gray-800 truncate" title={stock.from_warehouse_name}>
                {stock.from_warehouse_name}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">To</div>
              <div className="font-semibold text-gray-800 truncate" title={stock.to_warehouse_name}>
                {stock.to_warehouse_name}
              </div>
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FaCubes className="text-purple-500" />
              <span className="font-medium text-gray-700">Items Summary</span>
            </div>
            <span className="text-sm font-semibold text-gray-600">
              {getTotalItems(stock)} items
            </span>
          </div>

          {stock.items && stock.items.length > 0 ? (
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {stock.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-100 rounded-lg">
                  <Avatar
                    size="small"
                    src={item.image}
                    icon={<FaBox />}
                    className="border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{item.item_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag color="blue" className="!m-0 text-xs">
                        {item.item_code}
                      </Tag>
                      <Tag color="green" className="!m-0 text-xs">
                        Qty: {item.quantity}
                      </Tag>
                      <Tag color="orange" className="!m-0 text-xs">
                        ${item.item_price}
                      </Tag>
                    </div>
                  </div>
                </div>
              ))}

              {stock.items.length > 3 && (
                <div className="text-center text-sm text-gray-500">
                  +{stock.items.length - 3} more items
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              <FaInfoCircle className="inline mr-2" />
              No items in this stock record
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Items</div>
            <div className="font-bold text-gray-800">{getTotalItems(stock)}</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Total Qty</div>
            <div className="font-bold text-gray-800">{getTotalQuantity(stock)}</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Value</div>
            <div className="font-bold text-gray-800">${getTotalValue(stock).toFixed(2)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FaUser className="text-gray-400" />
              <span className="text-gray-600">{stock.created_by_name}</span>
            </div>
            {stock.stock_remark && (
              <Tooltip title={stock.stock_remark}>
                <div className="text-gray-500 truncate max-w-[120px]">
                  <FaClipboardList className="inline mr-1" />
                  {stock.stock_remark}
                </div>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6"
    >
      <AlertBox
        isOpen={alertBox}
        title="Delete Stock Record"
        message="Are you sure you want to delete this stock record? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
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
              <Tooltip title="Grid View">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <IoIosGrid size={20} />
                </button>
              </Tooltip>
              <Tooltip title="List View">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <IoIosList size={20} />
                </button>
              </Tooltip>
            </div>

            <Link to="/dashboard/add-to-stock">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                <FaPlus />
                Add New Stock
              </button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative max-w-xl">
            <IoIosSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by stock number, warehouse, item name, or remark..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Tag color="blue" className="font-medium">
                {filteredStocks.length} records
              </Tag>
            </div>
          </div>
        </div>

        {/* Summary Dashboard */}
        {filteredStocks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-0 shadow-sm">
              <Statistic
                title="Total Stock Records"
                value={filteredStocks.length}
                prefix={<FaClipboardList className="text-blue-500" />}
                valueStyle={{ color: '#1d4ed8' }}
              />
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-0 shadow-sm">
              <Statistic
                title="Stock In Records"
                value={filteredStocks.filter(s => s.stock_type_name?.toLowerCase() === 'stock in').length}
                prefix={<FaBoxOpen className="text-green-500" />}
                valueStyle={{ color: '#059669' }}
              />
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-0 shadow-sm">
              <Statistic
                title="Total Items"
                value={filteredStocks.reduce((total, stock) => total + getTotalItems(stock), 0)}
                prefix={<FaCubes className="text-orange-500" />}
                valueStyle={{ color: '#ea580c' }}
              />
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-0 shadow-sm">
              <Statistic
                title="Total Value"
                value={filteredStocks.reduce((total, stock) => total + getTotalValue(stock), 0).toFixed(2)}
                prefix="$"
                valueStyle={{ color: '#7c3aed' }}
              />
            </Card>
          </div>
        )}

        {/* Clear Search Button */}
        {searchTerm && (
          <div className="flex justify-end mb-4">
            <Button
              type="link"
              onClick={() => setSearchTerm('')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredStocks.map((stock, index) => renderGridItem(stock, index))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock Details</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Transfer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total Value</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStocks.map((stock) => (
                    <tr key={stock.stock_id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStockTypeIcon(stock.stock_type_name)}
                            <div>
                              <div className="font-bold text-gray-900">{stock.stock_no}</div>
                              <Badge
                                count={stock.stock_type_name}
                                style={{ backgroundColor: getStockTypeColor(stock.stock_type_name) }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaUser className="text-gray-400" />
                            <span>{stock.created_by_name}</span>
                          </div>
                          {stock.stock_remark && (
                            <div className="text-sm text-gray-500 max-w-xs">
                              <FaClipboardList className="inline mr-1" />
                              {stock.stock_remark}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FaWarehouse className="text-blue-500" />
                            <div className="font-medium text-gray-800">{stock.from_warehouse_name}</div>
                          </div>
                          <FaArrowRight className="text-gray-400 mx-2" />
                          <div className="flex items-center gap-2">
                            <FaWarehouse className="text-green-500" />
                            <div className="font-medium text-gray-800">{stock.to_warehouse_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FaCubes className="text-purple-500" />
                            <span className="font-semibold text-gray-800">
                              {getTotalItems(stock)} items
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Total Qty: <span className="font-semibold">{getTotalQuantity(stock)}</span>
                          </div>
                          {/* {stock.items && stock.items.length > 0 && (
                            <div className="flex -space-x-2">
                              {stock.items.slice(0, 3).map((item, idx) => (
                                <Avatar
                                  key={idx}
                                  size="small"
                                  src={item.images[idx].image}
                                  title={item.item_name}
                                  className="border-2 border-white"
                                />
                              ))}
                              {stock.items.length > 3 && (
                                <Avatar size="small" className="bg-gray-200 text-gray-600 font-medium">
                                  +{stock.items.length - 3}
                                </Avatar>
                              )}
                            </div>
                          )} */}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-800">{formatDate(stock.stock_date)}</div>
                          <div className="text-xs text-gray-500">{formatDateTime(stock.created_at)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-lg text-purple-600">
                          ${getTotalValue(stock).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Tooltip title="View Details">
                            <Link to={`detail/${stock.stock_id}`}>
                              <button className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
                                <FaEye />
                              </button>
                            </Link>
                          </Tooltip>
                          <Tooltip title="Edit Stock">
                            <Link to={`update/${stock.stock_id}`}>
                              <button className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors">
                                <FaEdit />
                              </button>
                            </Link>
                          </Tooltip>
                          <Tooltip title="Delete Stock">
                            <button
                              onClick={() => handleDelete(stock.stock_id)}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            >
                              <FaTrash />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredStocks.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Empty
              image={
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <MdLocalShipping className="text-4xl text-blue-500" />
                  </div>
                </div>
              }
              description={
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Stock Records Found</h3>
                  <p className="text-gray-500 text-lg max-w-md mx-auto">
                    {stocks.length === 0
                      ? "Start tracking your inventory movements by creating your first stock record"
                      : "No stock records match your search criteria"}
                  </p>
                </div>
              }
            >
              <Link to="/dashboard/add-to-stock">
                <Button
                  type="primary"
                  size="large"
                  icon={<FaPlus />}
                  className="px-8 py-4 h-auto text-lg bg-gradient-to-r from-blue-600 to-purple-600 border-0 hover:from-blue-700 hover:to-purple-700"
                >
                  Create First Stock Record
                </Button>
              </Link>
            </Empty>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
              <p className="text-gray-600 text-lg font-medium">Loading stock data...</p>
              <p className="text-gray-500 mt-2">Fetching inventory records from database</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Stocks