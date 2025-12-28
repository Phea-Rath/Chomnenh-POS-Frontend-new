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
  LuTable,
  LuBarcode,
  LuTrendingUp,
  LuPackage
} from "react-icons/lu";
import {
  Link
} from "react-router";
import { Table, Tag, Card, Row, Col, Input, Select, Button, Statistic, Progress, Dropdown, Tooltip } from "antd";
import { motion } from "framer-motion";
import ExportExel from "../../services/ExportExel";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { FaPalette, FaRuler } from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { GiSugarCane } from "react-icons/gi";

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

// Helper function to parse attributes for display
const parseAttributesForDisplay = (attributes) => {
  if (!attributes || attributes.length === 0) return null;

  return attributes.map(attr => {
    let displayValue = '';
    let icon = null;
    let isColor = false;

    if (attr.type === 'select') {
      if (Array.isArray(attr.value)) {
        displayValue = attr.value.map(v => v.value).join(', ');
      } else {
        displayValue = attr.value;
      }

      // Set icon based on attribute name
      if (attr.name === 'colors') {
        icon = <FaPalette className="w-3 h-3" />;
        isColor = true;
      } else if (attr.name === 'size') {
        icon = <FaRuler className="w-3 h-3" />;
      } else if (attr.name === 'type') {
        icon = <BiCategory className="w-3 h-3" />;
      }
    } else if (attr.type === 'text') {
      displayValue = attr.value;
      if (attr.name === 'sugar') {
        icon = <GiSugarCane className="w-3 h-3" />;
      }
    }

    return { name: attr.name, value: displayValue, icon, isColor };
  });
};

// Format color values for display
const formatColorDisplay = (colorValue) => {
  if (!colorValue) return [];

  // If it's already an array of strings, return it
  if (Array.isArray(colorValue)) {
    return colorValue;
  }

  // If it's a string, split by commas and trim
  if (typeof colorValue === 'string') {
    return colorValue.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }

  // If it's an array of objects with value property
  if (Array.isArray(colorValue) && colorValue[0]?.value) {
    return colorValue.map(c => c.value);
  }

  return [];
};

const RecordStock = () => {
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const [itemData, setItemData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table', 'grid', 'compact'
  const [gridColumns, setGridColumns] = useState(4); // 2, 3, 4, 6 columns
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: category } = useGetAllCategoriesQuery(token);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 12,
    },
  });

  // Calculate statistics
  const calculateStats = () => {
    const totalItems = itemData.length;
    const totalSales = itemData.reduce((sum, item) => sum + (Number(item.amount_sold) || 0), 0);
    const topSellingItem = itemData.reduce((max, item) =>
      (item.amount_sold || 0) > (max.amount_sold || 0) ? item : max, { amount_sold: 0 }
    );
    const categoriesCount = new Set(itemData.map(item => item.category_name)).size;

    return {
      totalItems,
      totalSales,
      topSellingItem,
      categoriesCount
    };
  };

  const stats = calculateStats();

  // Render attributes in table
  const renderAttributesDisplay = (item) => {
    if (!item.displayAttributes || item.displayAttributes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {item.displayAttributes.map((attr, idx) => {
          const uniqueKey = `${item.item_id}-${attr.name}-${idx}`;

          let colors = [];
          if (attr.isColor) {
            colors = formatColorDisplay(attr.value);
          }

          return (
            <div key={uniqueKey} className="flex items-center gap-2">
              {attr.icon}
              <span className="text-xs text-gray-500 capitalize">{attr.name}:</span>
              {attr.isColor ? (
                colors.length > 0 ? (
                  <div className="flex gap-1">
                    {colors.map((color, colorIdx) => (
                      <div
                        key={`${uniqueKey}-${colorIdx}`}
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-medium text-gray-700">No color</span>
                )
              ) : (
                <span className="text-xs font-medium text-gray-700">{attr.value}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      width: "80px",
      render: (text, record, index) => (
        <div className="text-center font-semibold text-gray-600">
          {index + 1}
        </div>
      ),
    },
    {
      title: "PRODUCT",
      dataIndex: "image",
      width: "120px",
      render: (img, record) => (
        <div className="flex items-center space-x-3">
          <img
            className="w-14 h-14 object-contain rounded-lg border-2 border-white shadow-sm bg-white p-1"
            src={img?.image || record.images?.[0]?.image}
            alt={record.item_name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(record.item_name)}&background=3b82f6&color=fff&size=128`;
            }}
          />
        </div>
      ),
    },
    {
      title: "PRODUCT INFO",
      dataIndex: "item_name",
      width: "200px",
      render: (name, record) => (
        <div>
          <div className="font-semibold text-gray-900 text-sm">{name}</div>
          <div className="text-xs text-gray-500 font-mono mt-1">{record.item_code}</div>
          <div className="flex items-center space-x-2 mt-2">
            <Tag color="blue" className="text-xs font-medium">
              {record.category_name}
            </Tag>
            <Tag color="gray" className="text-xs">
              {record.brand_name}
            </Tag>
          </div>
          {record.barcode && (
            <div className="flex items-center gap-1 mt-1">
              <LuBarcode className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{record.barcode}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "ATTRIBUTES",
      width: "200px",
      render: (_, record) => (
        <div className="max-w-xs">
          {renderAttributesDisplay(record)}
        </div>
      ),
    },
    {
      title: "SALES VOLUME",
      dataIndex: "amount_sold",
      width: "150px",
      align: 'center',
      sorter: (a, b) => (a.amount_sold || 0) - (b.amount_sold || 0),
      render: (sales) => (
        <div className="text-center">
          <div className="font-bold text-purple-600 text-xl flex items-center justify-center space-x-2">
            <LuTrendingUp className="text-base" />
            <span>{Number(sales || 0).toFixed(1)}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Units Sold</div>
          <Progress
            percent={Math.min(100, (Number(sales || 0) / 10) * 100)}
            size="small"
            strokeColor="#8b5cf6"
            className="mt-2"
          />
        </div>
      ),
    },
    {
      title: "SALES RANKING",
      width: "150px",
      align: 'center',
      render: (_, record, index) => {
        const rank = index + 1;
        let rankColor = "gray";
        let rankText = "#" + rank;

        if (rank === 1) {
          rankColor = "gold";
          rankText = "🥇 1st";
        } else if (rank === 2) {
          rankColor = "silver";
          rankText = "🥈 2nd";
        } else if (rank === 3) {
          rankColor = "bronze";
          rankText = "🥉 3rd";
        }

        return (
          <div className="text-center">
            <Tag color={rankColor} className="font-bold text-lg py-1 px-3">
              {rankText}
            </Tag>
            <div className="text-xs text-gray-500 mt-1">Rank</div>
          </div>
        );
      },
    },
  ];

  const params = toURLSearchParams(getRandomuserParams(tableParams));

  const fetchData = () => {
    setLoading(true);
    fetch(
      `http://127.0.0.1:8000/api/order_transection?`,
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
        const items = res.data?.map((item, index) => ({
          ...item,
          index: index + 1,
          displayAttributes: parseAttributesForDisplay(item.attributes),
          amount_sold: Number(item.amount_sold || 0),
          image: item.image?.image || item.images?.[0]?.image,
        })) || [];

        setData(items);
        setItemData(items);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res.data?.length || 0,
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
  }, [JSON.stringify(tableParams)]);

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

  const filterCategory = (value) => {
    setSelectedCategory(value);
    if (value === "all") {
      setItemData(data);
      return;
    }
    const items = data?.filter((i) => i.category_name.toLowerCase() === value.toLowerCase());
    setItemData(items);
  };

  const onSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value === '') {
      setItemData(data);
      return;
    }
    const items = data?.filter(
      (i) =>
        i.item_name?.toLowerCase().includes(value.toLowerCase()) ||
        i.item_code?.toLowerCase().includes(value.toLowerCase()) ||
        i.category_name?.toLowerCase().includes(value.toLowerCase()) ||
        i.barcode?.includes(value)
    );
    setItemData(items);
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

  const StockCard = ({ item, index }) => {
    const sales = item.amount_sold || 0;

    const getSalesStatus = () => {
      if (sales >= 5) return { color: '#52c41a', text: 'Best Seller', icon: '🔥' };
      if (sales >= 2) return { color: '#faad14', text: 'Popular', icon: '⭐' };
      return { color: '#1890ff', text: 'Selling', icon: '📈' };
    };

    const status = getSalesStatus();
    const rank = index + 1;
    let rankBadge = null;

    if (rank === 1) {
      rankBadge = <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">🥇</div>;
    } else if (rank === 2) {
      rankBadge = <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">🥈</div>;
    } else if (rank === 3) {
      rankBadge = <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-700 to-amber-800 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-lg">🥉</div>;
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {rankBadge}
        <Card
          className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50 hover:scale-[1.02] cursor-pointer"
          bodyStyle={{ padding: '16px' }}
        >
          <div className="flex flex-col h-full">
            {/* Header with Image and Status */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <img
                  src={item.image?.image || item.images?.[0]?.image}
                  alt={item.item_name}
                  className="w-14 h-14 object-contain rounded-xl border-2 border-white shadow-md bg-white p-1"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=3b82f6&color=fff&size=128`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                    {item.item_name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono truncate">{item.item_code}</p>
                </div>
              </div>
              <Tag color={status.color.replace('#', '')} className="font-semibold text-xs flex-shrink-0">
                <span className="mr-1">{status.icon}</span>
                {status.text}
              </Tag>
            </div>

            {/* Category and Brand */}
            <div className="flex items-center justify-between mb-3">
              <Tag color="blue" className="text-xs font-semibold">
                {item.category_name}
              </Tag>
              <span className="text-xs text-gray-600 font-medium truncate">{item.brand_name}</span>
            </div>

            {/* Attributes */}
            {item.displayAttributes && item.displayAttributes.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  {item.displayAttributes.map((attr, idx) => {
                    const uniqueKey = `${item.item_id}-${attr.name}-${idx}`;
                    let colors = [];
                    if (attr.isColor) {
                      colors = formatColorDisplay(attr.value);
                    }

                    return (
                      <div key={uniqueKey} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {attr.icon}
                          <span className="text-xs text-gray-600 capitalize">{attr.name}:</span>
                        </div>
                        {attr.isColor ? (
                          colors.length > 0 && (
                            <div className="flex gap-1">
                              {colors.slice(0, 3).map((color, colorIdx) => (
                                <div
                                  key={`${uniqueKey}-${colorIdx}`}
                                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                              {colors.length > 3 && (
                                <span className="text-xs text-gray-500">+{colors.length - 3}</span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                            {attr.value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sales Metrics */}
            <div className="space-y-3 mb-3">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600 font-medium">Units Sold:</span>
                  <div className="flex items-center space-x-2">
                    <LuTrendingUp className="text-purple-500" />
                    <span className="font-bold text-purple-600 text-lg">{sales.toFixed(1)}</span>
                  </div>
                </div>
                <Progress
                  percent={Math.min(100, (sales / 10) * 100)}
                  size="small"
                  strokeColor="#8b5cf6"
                  showInfo={false}
                />
              </div>

              {item.barcode && (
                <div className="flex items-center justify-between text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  <span>Barcode:</span>
                  <span className="font-mono">{item.barcode}</span>
                </div>
              )}
            </div>

            {/* Rank and Status */}
            <div className="mt-auto pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <div className="font-bold text-gray-700 text-sm">Rank #{rank}</div>
                  <div className="text-xs text-gray-500">Position</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-600">Total Images</div>
                  <div className="font-bold text-blue-600 text-sm">
                    {item.images?.length || 1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const CompactStockCard = ({ item, index }) => {
    const sales = item.amount_sold || 0;
    const rank = index + 1;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50 cursor-pointer mb-2"
          bodyStyle={{ padding: '12px' }}
        >
          <div className="flex items-center justify-between">
            {/* Left side - Product info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* Rank badge */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                rank === 2 ? 'bg-gray-100 text-gray-700' :
                  rank === 3 ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {rank}
              </div>

              <img
                src={item.image?.image || item.images?.[0]?.image}
                alt={item.item_name}
                className="w-10 h-10 object-contain rounded-lg border bg-white p-1"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">{item.item_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color="blue" size="small" className="text-xs">
                    {item.category_name}
                  </Tag>
                  <span className="text-xs text-gray-500 truncate">{item.item_code}</span>
                </div>
              </div>
            </div>

            {/* Right side - Sales data */}
            <div className="flex items-center space-x-4">
              {/* Attributes count */}
              <div className="text-center">
                <div className="text-xs text-gray-500">Attributes</div>
                <div className="font-bold text-blue-600 text-sm">
                  {item.attributes?.length || 0}
                </div>
              </div>

              {/* Sales */}
              <div className="text-center">
                <div className="text-xs text-gray-500">Sold</div>
                <div className="font-bold text-purple-600 text-sm flex items-center space-x-1">
                  <LuTrendingUp className="text-xs" />
                  <span>{sales.toFixed(1)}</span>
                </div>
              </div>

              {/* Images count */}
              <div className="text-center">
                <div className="text-xs text-gray-500">Images</div>
                <div className="font-bold text-green-600 text-sm">
                  {item.images?.length || 1}
                </div>
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

  const totalUnitsSold = itemData.reduce((sum, item) =>
    sum + (item.amount_sold || 0), 0
  ).toFixed(1);

  const topSellingCategory = itemData.reduce((acc, item) => {
    const category = item.category_name || 'Unknown';
    acc[category] = (acc[category] || 0) + (item.amount_sold || 0);
    return acc;
  }, {});

  const topCategory = Object.entries(topSellingCategory).sort((a, b) => b[1] - a[1])[0];

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
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <LuTrendingUp className="text-2xl text-white" />
                </div>
                Sales Analytics Dashboard
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Track product performance and sales metrics
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<LuRefreshCw />}
                onClick={fetchData}
                loading={loading}
                className="flex items-center space-x-2 h-12 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-0"
              >
                Refresh Data
              </Button>
              <ExportExel
                data={itemData.map(item => ({
                  'Product Name': item.item_name,
                  'Product Code': item.item_code,
                  'Barcode': item.barcode,
                  'Category': item.category_name,
                  'Brand': item.brand_name,
                  'Units Sold': item.amount_sold,
                  'Attributes Count': item.attributes?.length || 0,
                  'Images Count': item.images?.length || 1
                }))}
                title={"Sales_Analytics_Report"}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 h-12"
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {/* Total Products Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-semibold mb-2 uppercase tracking-wider">Total Products</p>
                  {loading ? (
                    <div className="h-8 bg-blue-100 rounded animate-pulse w-16"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalItems?.toLocaleString() || 0}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Items tracked in sales</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl">
                  <LuPackage className="text-2xl text-blue-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Total Units Sold Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-semibold mb-2 uppercase tracking-wider">Units Sold</p>
                  {loading ? (
                    <div className="h-8 bg-purple-100 rounded animate-pulse w-20"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {totalUnitsSold?.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Total sales volume</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl">
                  <LuTrendingUp className="text-2xl text-purple-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Top Category Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-semibold mb-2 uppercase tracking-wider">Top Category</p>
                  {loading ? (
                    <div className="h-8 bg-green-100 rounded animate-pulse w-24"></div>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900 truncate">
                        {topCategory?.[0] || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {topCategory?.[1]?.toFixed(1) || '0'} units sold
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Best performing category</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
                  <BiCategory className="text-2xl text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          {/* Categories Count Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-all duration-300">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-semibold mb-2 uppercase tracking-wider">Categories</p>
                  {loading ? (
                    <div className="h-8 bg-orange-100 rounded animate-pulse w-12"></div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.categoriesCount || 0}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Active categories</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl">
                  <LuListChecks className="text-2xl text-orange-600" />
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
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View Toggle and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 border">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "table"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md font-semibold"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                >
                  <LuTable className="text-lg" />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md font-semibold"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                >
                  <LuGrid2X2 className="text-lg" />
                  <span>Grid View</span>
                </button>
                <button
                  onClick={() => setViewMode("compact")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "compact"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md font-semibold"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                >
                  <LuList className="text-lg" />
                  <span>Compact View</span>
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
                  <Button className="flex items-center space-x-2 h-12 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-0">
                    <LuLayoutGrid />
                    <span>{gridColumns} Columns</span>
                  </Button>
                </Dropdown>
              )}

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search by name, code, category, or barcode..."
                  prefix={<LuSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={onSearch}
                  className="h-12 rounded-xl border-0 bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
                  allowClear
                  size="large"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select
                placeholder="Filter by Category"
                value={selectedCategory}
                onChange={filterCategory}
                className="w-full sm:w-56 h-12 rounded-xl"
                suffixIcon={<LuFilter className="text-gray-400" />}
                dropdownStyle={{ borderRadius: '12px' }}
              >
                <Option value="all">All Categories</Option>
                {category?.data?.map((item) => (
                  <Option key={item.category_id} value={item.category_name}>
                    {item.category_name}
                  </Option>
                ))}
              </Select>
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
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <Table
                columns={columns}
                rowKey={(record) => record.item_id}
                dataSource={itemData}
                pagination={{
                  ...tableParams.pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total} products`,
                  className: "px-6 py-4",
                  pageSizeOptions: ['12', '24', '48', '96']
                }}
                loading={loading}
                onChange={handleTableChange}
                scroll={{ x: 1200 }}
                summary={() => {
                  const totalSales = itemData.reduce((s, r) => s + (r.amount_sold || 0), 0);
                  const avgSales = itemData.length > 0 ? (totalSales / itemData.length).toFixed(1) : 0;
                  const totalAttributes = itemData.reduce((s, r) => s + (r.attributes?.length || 0), 0);
                  const avgAttributes = itemData.length > 0 ? (totalAttributes / itemData.length).toFixed(1) : 0;

                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row className="bg-gradient-to-r from-gray-50 to-purple-50 border-t">
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          <strong className="text-gray-700">Overall Summary</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">
                          <div className="flex flex-col items-center">
                            <Tag color="purple" className="font-semibold text-sm mb-1">
                              Total: {totalSales.toFixed(1)}
                            </Tag>
                            <span className="text-xs text-gray-500">Avg: {avgSales}</span>
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Avg Attributes</div>
                            <Tag color="blue" className="font-semibold text-sm">
                              {avgAttributes}
                            </Tag>
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
                {itemData.map((item, index) => (
                  <Col {...getGridCols()} key={item.item_id}>
                    <StockCard item={item} index={index} />
                  </Col>
                ))}
              </Row>

              {itemData.length === 0 && !loading && (
                <div className="text-center py-20">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No sales data found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Compact View
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="space-y-2">
                  {itemData.map((item, index) => (
                    <CompactStockCard key={item.item_id} item={item} index={index} />
                  ))}
                </div>

                {itemData.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-4xl mb-3">📊</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-1">No sales data found</h3>
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

export default RecordStock;