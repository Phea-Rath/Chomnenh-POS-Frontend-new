import React, { useState } from 'react';
import { useGetStockByIdQuery } from '../../../app/Features/stocksSlice';
import { Link, useNavigate, useParams } from 'react-router';
import {
  FaWarehouse,
  FaUser,
  FaBox,
  FaTags,
  FaDollarSign,
  FaPalette,
  FaExchangeAlt,
  FaMinus,
  FaEye,
  FaArrowLeft,
  FaPrint,
  FaEdit,
  FaLayerGroup,
  FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Tag, Tooltip, Divider } from 'antd';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useGetCurrentProfileQuery } from '../../../app/Features/usersSlice';

const StockDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigator = useNavigate();
  const token = localStorage.getItem('token');
  const { data, isLoading } = useGetStockByIdQuery({ id, token });
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedColorIndex, setSelectedColorIndex] = useState({});
  const { data: profile } = useGetCurrentProfileQuery(token);

  const stock = data?.data || {};
  console.log(profile);


  // Format dates
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) { return dateString; }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) { return dateString; }
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

  // Calculate totals
  const calculateTotals = () => {
    if (!stock.items?.length) return { totalItems: 0, totalQuantity: 0, totalCost: 0, totalValue: 0 };

    return stock?.items?.reduce((acc, item) => {
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-transparent min-h-screen">
      {/* Action Bar - Non-Print */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 no-print">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          {t('backToStocks')}
        </button>

        <div className="flex gap-2">
          <Tooltip title={t('print')}>
            <Link target='_blank' to={`/stock-invoice/${id}`}>
              <button
                className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
              >
                <FaPrint className="w-4 h-4" />
              </button>
            </Link>
          </Tooltip>
          <button
            onClick={() => navigator(`/home/stock-list/update/${id}`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md flex items-center gap-2"
          >
            <FaEdit className="w-3.5 h-3.5" />
            {t('editStock')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="print-container space-y-6">
        {/* Print Only Header */}
        <div className="hidden print:block mb-8">
          <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">STOCK {stock.stock_type_name === 'stock in' ? 'INVOICE' : 'TRANSFER'}</h1>
              <p className="text-sm font-bold text-gray-600">No: {stock.stock_no}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">{profile?.data[0]?.profile_name}</h2>
              <p className="text-xs text-gray-500 max-w-[200px]">{profile?.data[0]?.address || "Phnom Penh, Cambodia."} Contact: {profile?.data[0]?.telephone} Website: www.chomnenhapp.com</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Document Info</p>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-bold">Date:</span> {formatDate(stock.stock_date)}</p>
                <p className="text-xs"><span className="font-bold">Type:</span> {stock.stock_type_name?.toUpperCase()}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Origin/Destination</p>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-bold">From:</span> {stock.from_warehouse_name}</p>
                <p className="text-xs"><span className="font-bold">To:</span> {stock.to_warehouse_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Issuer</p>
              <div className="space-y-1">
                <p className="text-xs"><span className="font-bold">User:</span> {stock.created_by_name}</p>
                <p className="text-xs"><span className="font-bold">Printed:</span> {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Header (Screen Only) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('stock')} #{stock.stock_no}
                </h1>
                <Badge
                  count={stock.stock_type_name?.toUpperCase()}
                  style={{
                    backgroundColor: stock.stock_type_name === 'stock in' ? '#10b981' : '#3b82f6',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stock.stock_type_name === 'stock in' ? t('receivedItemsOn') : t('transferredItemsOn')} {formatDate(stock.stock_date)}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 md:gap-12">
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{t('totalItems')}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totals.totalItems}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{t('totalQuantity')}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{totals.totalQuantity}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{t('totalValue')}</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${totals.totalValue.toFixed(2)}</p>
              </div>
              <div className="text-center md:text-left">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{t('createdBy')}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{stock.created_by_name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Information Panels */}
          <div className="lg:col-span-1 space-y-6">
            <Card
              size="small"
              title={<span className="text-sm font-bold dark:text-white flex items-center gap-2"><FaInfoCircle className="text-blue-500" /> {t('stockInformation')}</span>}
              className="shadow-sm border-gray-100 dark:!border-gray-700 dark:!bg-gray-800 !rounded-xl overflow-hidden"
              headStyle={{ borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'transparent' }}
            >
              <div className="space-y-3 p-1">
                {[
                  { label: t('stockNumber'), value: stock.stock_no },
                  { label: t('stockType'), value: <Tag color={stock.stock_type_name === 'stock in' ? 'green' : 'blue'} className="m-0 !text-[10px] uppercase font-bold">{stock.stock_type_name}</Tag> },
                  { label: t('stockDate'), value: formatDate(stock.stock_date) },
                  { label: t('createdDate'), value: formatDateTime(stock.created_at) },
                  { label: t('status'), value: <Badge status="success" text={<span className="text-xs dark:text-gray-300">Active</span>} /> }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              size="small"
              title={<span className="text-sm font-bold flex dark:text-white items-center gap-2"><FaExchangeAlt className="text-purple-500" /> {t('transferInformation')}</span>}
              className="shadow-sm border-gray-100 dark:!border-gray-700 dark:!bg-gray-800 !rounded-xl"
              headStyle={{ borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'transparent' }}
            >
              <div className="space-y-4 p-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <FaWarehouse className="text-blue-600 w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t('fromWarehouse')}</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{stock.from_warehouse_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <FaWarehouse className="text-green-600 w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{t('toWarehouse')}</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{stock.to_warehouse_name}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              size="small"
              title={<span className="text-sm dark:text-white font-bold">{t('remarks')}</span>}
              className="shadow-sm border-gray-100 dark:!border-gray-700 dark:!bg-gray-800 !rounded-xl"
            >
              <p className="text-xs  text-gray-600 dark:text-gray-400 italic">
                {stock.stock_remark || t('noRemarks')}
              </p>
            </Card>
          </div>

          {/* Items Table Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FaBox className="text-blue-500 w-3.5 h-3.5" />
                  {t('stockItems')} ({stock.items?.length || 0})
                </h2>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {stock?.items.length && stock?.items?.map((item, index) => {
                  const isExpanded = expandedItems[item.detail_id];
                  const colors = getColorAttribute(item.attributes);
                  const currentImage = item.images?.[0]?.image;

                  return (
                    <div key={item.detail_id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-14 w-14 rounded-lg border border-gray-100 dark:border-gray-600 overflow-hidden bg-white flex-shrink-0">
                          {currentImage ? (
                            <img src={currentImage} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                              <FaBox className="text-gray-300 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.item_name}</h3>
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded font-mono uppercase">
                              {item.item_code}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FaLayerGroup className="w-2.5 h-2.5" /> {item.category_name}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-semibold">
                              <FaDollarSign className="w-2.5 h-2.5 text-blue-500" /> {t('cost')}: ${parseFloat(item.item_cost || 0).toFixed(2)}
                            </span>
                          </div>

                          {colors.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {colors.map((color, idx) => (
                                <div
                                  key={idx}
                                  className={`w-3 h-3 rounded-full border border-gray-200`}
                                  style={{ backgroundColor: typeof color === 'object' ? color.value : color }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                            <span className="text-[10px] text-gray-500 ml-1 uppercase">pcs</span>
                          </div>
                          <button
                            onClick={() => toggleItemExpansion(item.detail_id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-print"
                          >
                            {isExpanded ? <FaMinus className="w-3 h-3" /> : <FaEye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t('priceInformation')}</p>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-500">{t('retailPrice')}</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">${parseFloat(item.item_price || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-gray-500">{t('wholesalePrice')}</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-200">${parseFloat(item.wholesale_price || 0).toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">{t('attributes')}</p>
                                {item.attributes?.filter(a => a.name !== 'colors').map((attr, i) => (
                                  <div key={i} className="flex justify-between text-[11px]">
                                    <span className="text-gray-500 capitalize">{attr.name}</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{attr.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {(!stock.items || stock.items.length === 0) && (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    {t('noItemsAdded')}
                  </div>
                )}
              </div>

              {/* Total Footer Strip */}
              <div className="bg-gray-900 dark:bg-black p-4 text-white flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{t('stockSummary')}</span>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-[9px] uppercase opacity-50 mb-0.5">{t('avgCost')}</p>
                    <p className="text-xs font-bold">${(totals.totalCost / totals.totalQuantity || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase opacity-50 mb-0.5">{t('totalStockValue')}</p>
                    <p className="text-sm font-bold text-blue-400">${totals.totalValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Only Signature Section */}
        <div className="hidden print:grid grid-cols-3 gap-12 mt-20 text-center">
          <div>
            <div className="border-t border-gray-400 pt-2 mx-4">
              <p className="text-xs font-bold uppercase">Issued By</p>
              <p className="text-[10px] text-gray-500 mt-1">(Name & Signature)</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mx-4">
              <p className="text-xs font-bold uppercase">Verified By</p>
              <p className="text-[10px] text-gray-500 mt-1">(Name & Signature)</p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 mx-4">
              <p className="text-xs font-bold uppercase">Received By</p>
              <p className="text-[10px] text-gray-500 mt-1">(Name & Signature)</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx scoped>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          .bg-transparent {
            background-color: white !important;
          }
          /* Standard Business Document Look */
          .bg-white, .dark\\:bg-gray-800, .bg-gray-50, .bg-gray-900 {
            background-color: white !important;
            color: black !important;
            border-color: #eee !important;
            box-shadow: none !important;
          }
          .text-white, .text-gray-300, .text-gray-400, .text-gray-500 {
            color: black !important;
            opacity: 1 !important;
          }
          .text-blue-400, .text-blue-600, .text-blue-500 {
            color: #1a56db !important;
          }
          h1, h2, h3, .font-bold {
            color: black !important;
          }
          .rounded-xl, .rounded-lg {
            border-radius: 4px !important;
            border: 1px solid #ddd !important;
          }
          .ant-card {
            border: 1px solid #ddd !important;
            margin-bottom: 10px !important;
          }
          .ant-tag {
            border: 1px solid #ccc !important;
            color: black !important;
            background: #f9f9f9 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StockDetail;