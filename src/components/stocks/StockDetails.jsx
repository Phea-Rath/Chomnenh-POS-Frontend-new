import React, { useState, useEffect } from 'react';
import { useGetStockByIdQuery } from '../../../app/Features/stocksSlice';
import { useParams } from 'react-router';
import {
  FaWarehouse,
  FaUser,
  FaCalendarAlt,
  FaBox,
  FaTags,
  FaDollarSign,
  FaPalette,
  FaRuler,
  FaExchangeAlt,
  FaPlus,
  FaMinus,
  FaEye,
  FaFileInvoice,
  FaArrowLeft,
  FaShare,
  FaDownload,
  FaPrint,
  FaEdit,
  FaLayerGroup
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Card, Badge, Tag, Progress, Tooltip, Divider } from 'antd';
import { format } from 'date-fns';

const StockDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data, isLoading, refetch } = useGetStockByIdQuery({ id, token });
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedColorIndex, setSelectedColorIndex] = useState({});

  const stock = data?.data || {};

  // Format dates
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Get color attribute
  const getColorAttribute = (attributes) => {
    return attributes?.find(attr => attr.name === 'colors')?.value || [];
  };

  // Get attribute display value
  const getAttributeDisplay = (attributes, name) => {
    const attr = attributes?.find(a => a.name === name);
    if (!attr) return null;

    if (attr.type === 'select') {
      return Array.isArray(attr.value) ? attr.value.map(v => v.value).join(', ') : attr.value;
    }
    return attr.value;
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!stock.items) return { totalItems: 0, totalQuantity: 0, totalCost: 0, totalValue: 0 };

    return stock.items.reduce((acc, item) => {
      const quantity = item.quantity || 0;
      const cost = parseFloat(item.item_cost || 0);
      const price = parseFloat(item.item_price || 0);

      return {
        totalItems: acc.totalItems + 1,
        totalQuantity: acc.totalQuantity + quantity,
        totalCost: acc.totalCost + (cost * quantity),
        totalValue: acc.totalValue + (price * quantity)
      };
    }, { totalItems: 0, totalQuantity: 0, totalCost: 0, totalValue: 0 });
  };

  const totals = calculateTotals();

  // Handle color selection
  const handleColorSelect = (itemId, colorIndex) => {
    setSelectedColorIndex(prev => ({
      ...prev,
      [itemId]: colorIndex
    }));
  };

  // Get selected color for item
  const getSelectedColor = (itemId, attributes) => {
    const colors = getColorAttribute(attributes);
    const selectedIndex = selectedColorIndex[itemId] || 0;
    return colors[selectedIndex] || colors[0] || {};
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-3 bg-gray-200 rounded w-full"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Stocks
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Stock #{stock.stock_no}
              </h1>
              <Badge
                count={stock.stock_type_name === 'stock in' ? 'IN' : 'OUT'}
                className="bg-gradient-to-r from-green-500 to-emerald-600"
                style={{
                  backgroundColor: stock.stock_type_name === 'stock in' ? '#10b981' : '#3b82f6',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontWeight: '600'
                }}
              />
            </div>
            <p className="text-gray-600 mt-2">
              {stock.stock_type_name === 'stock in' ? 'Stock received' : 'Stock transferred'} on {formatDate(stock.stock_date)}
            </p>
          </div>

          <div className="flex gap-3">
            <Tooltip title="Print stock details">
              <button className="p-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <FaPrint className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip title="Export as PDF">
              <button className="p-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                <FaDownload className="w-5 h-5" />
              </button>
            </Tooltip>
            <button className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaEdit className="w-4 h-4" />
              Edit Stock
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-800">{totals.totalItems}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaLayerGroup className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold text-gray-800">{totals.totalQuantity}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaBox className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-800">${totals.totalCost.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaDollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-800">${totals.totalValue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaTags className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stock Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stock Information Card */}
          <Card className="shadow-lg border-0">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
              Stock Information
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Stock Number</span>
                <span className="font-medium text-gray-800">{stock.stock_no}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Stock Type</span>
                <Badge
                  count={stock.stock_type_name}
                  className="bg-gradient-to-r from-green-500 to-emerald-600"
                  style={{
                    backgroundColor: stock.stock_type_name === 'stock in' ? '#10b981' : '#3b82f6',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontWeight: '500',
                    fontSize: '12px'
                  }}
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Stock Date</span>
                <span className="font-medium text-gray-800">{formatDate(stock.stock_date)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Created</span>
                <span className="font-medium text-gray-800">{formatDateTime(stock.created_at)}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium text-gray-800">{formatDateTime(stock.updated_at)}</span>
              </div>
            </div>
          </Card>

          {/* Transfer Information Card */}
          <Card className="shadow-lg border-0">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <FaExchangeAlt className="text-blue-500" />
              Transfer Information
            </h2>

            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <FaWarehouse className="text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">From Warehouse</p>
                    <p className="font-bold text-gray-800">{stock.from_warehouse_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <FaWarehouse className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">To Warehouse</p>
                    <p className="font-bold text-gray-800">{stock.to_warehouse_name}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <FaUser className="text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-bold text-gray-800">{stock.created_by_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Remarks Card */}
          <Card className="shadow-lg border-0">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">
              Remarks
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700">{stock.stock_remark || 'No remarks provided'}</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Items List */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaBox className="text-blue-500" />
                  Stock Items ({stock.items?.length || 0})
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Showing all items in this stock transfer
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-6">
              {stock.items?.map((item, index) => {
                const isExpanded = expandedItems[item.detail_id];
                const colors = getColorAttribute(item.attributes);
                const selectedColor = getSelectedColor(item.detail_id, item.attributes);
                const currentImage = item.images?.[0]?.image;

                return (
                  <motion.div
                    key={item.detail_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                      {/* Item Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Item Image */}
                          <div className="relative">
                            <div className="h-20 w-20 rounded-lg border border-gray-300 overflow-hidden bg-white">
                              {currentImage ? (
                                <img
                                  src={currentImage}
                                  alt={item.item_name}
                                  className="h-full w-full object-contain p-2"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=3b82f6&color=fff&size=128`;
                                  }}
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-blue-100">
                                  <span className="text-blue-600 font-bold text-lg">
                                    {item.item_name?.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            {item.images?.length > 1 && (
                              <Badge
                                count={item.images.length}
                                className="absolute -top-2 -right-2 bg-blue-600"
                                style={{
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  fontSize: '10px',
                                  padding: '0 4px'
                                }}
                              />
                            )}
                          </div>

                          {/* Item Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-gray-800 text-lg">{item.item_name}</h3>
                              <Tag color="blue" className="text-xs">
                                {item.item_code}
                              </Tag>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <FaTags className="w-3 h-3" />
                                <span>{item.category_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaDollarSign className="w-3 h-3" />
                                <span>Cost: ${parseFloat(item.item_cost || 0).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* Color Selection */}
                            {colors.length > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <FaPalette className="text-gray-400 w-3 h-3" />
                                <div className="flex gap-1">
                                  {colors.map((color, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleColorSelect(item.detail_id, idx)}
                                      className={`w-5 h-5 rounded-full border ${selectedColorIndex[item.detail_id] === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}
                                      style={{ backgroundColor: typeof color === 'object' ? color.value : color }}
                                      title={typeof color === 'object' ? color.value : color}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Actions */}
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-3 mb-2">
                            <div className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg">
                              {item.quantity} pcs
                            </div>
                            <button
                              onClick={() => toggleItemExpansion(item.detail_id)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              {isExpanded ? <FaMinus className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-500">Expires:</div>
                            <div className={`font-medium ${new Date(item.expire_date) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                              {formatDate(item.expire_date)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Attributes */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Attributes</h4>
                              <div className="space-y-2">
                                {item.attributes?.map((attr, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 capitalize">{attr.name}:</span>
                                    <span className="font-medium">
                                      {attr.type === 'select'
                                        ? Array.isArray(attr.value)
                                          ? attr.value.map(v => v.value).join(', ')
                                          : attr.value
                                        : attr.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Price Information */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Price Information</h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Retail Price</span>
                                  <span className="font-bold text-gray-800">
                                    ${parseFloat(item.item_price || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Wholesale Price</span>
                                  <span className="font-medium text-gray-700">
                                    ${parseFloat(item.wholesale_price || 0).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Discount</span>
                                  <Tag color="green" className="font-medium">
                                    {item.discount || 0}%
                                  </Tag>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Total Value</span>
                                  <span className="font-bold text-blue-600">
                                    ${(parseFloat(item.item_price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Images */}
                          {item.images?.length > 1 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Images</h4>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {item.images.slice(1).map((img, idx) => (
                                  <div key={idx} className="flex-shrink-0">
                                    <img
                                      src={img.image}
                                      alt={`${item.item_name} ${idx + 2}`}
                                      className="h-16 w-16 rounded-lg border border-gray-300 object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=3b82f6&color=fff&size=64`;
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {(!stock.items || stock.items.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">No items found in this stock</div>
                </div>
              )}
            </div>
          </Card>

          {/* Summary Footer */}
          <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Stock Summary</h3>
                <p className="text-gray-300">
                  {stock.stock_type_name === 'stock in' ? 'Received items' : 'Transferred items'} on {formatDate(stock.stock_date)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">${totals.totalValue.toFixed(2)}</div>
                <div className="text-sm text-gray-300">Total Stock Value</div>
              </div>
            </div>

            <Divider className="my-4 border-gray-700" />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-300">Items</div>
                <div className="text-xl font-bold">{totals.totalItems}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Quantity</div>
                <div className="text-xl font-bold">{totals.totalQuantity}</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Avg Cost</div>
                <div className="text-xl font-bold">${(totals.totalCost / totals.totalQuantity || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;