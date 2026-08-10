import React, { useEffect, useState } from "react";
import {
  MdKeyboardArrowRight,
  MdKeyboardArrowLeft,
  MdClose,
  MdInventory,
  MdAttachMoney,
  MdQrCode,
  MdStar,
  MdShoppingCart,
  MdLocalOffer,
  MdTrendingUp,
} from "react-icons/md";
import { useNavigate, useParams } from "react-router";
import { useDeleteItemMutation, useGetItemByIdQuery } from "@/features/products/itemsSlice";
import { RiDeleteBin6Line, RiEditLine, RiArrowLeftSLine, RiPrinterLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { toast } from "react-toastify";
import { Tag, Divider, Badge, Card, Statistic, Tooltip } from "antd";
import { FaPalette, FaRuler, FaTag } from "react-icons/fa";
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import Barcode from 'react-barcode';
import { useTranslation } from "react-i18next";
import escapeHtml from "@/helpers/escapeHtml";
import { getToken } from '@/utils/tokenStore';

const ItemDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigator = useNavigate();
  const token = getToken();
  const [alertBox, setAlertBox] = useState(false);
  const { setLoading } = useOutletsContext();
  const { data, refetch, isLoading } = useGetItemByIdQuery({ id, token });
  const [deleteItem] = useDeleteItemMutation();
  const [currentItem, setCurrentItem] = useState({});
  const { refetch: saleRefetch } = useGetAllSaleQuery(token);

  useEffect(() => {
    if (data?.data) setCurrentItem(data.data);
  }, [data]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper logic
  const extractAttribute = (name) => {
    const attr = currentItem.attributes?.find((a) => a.name === name);
    if (!attr) return [];
    return Array.isArray(attr.value) ? attr.value.map(v => v.value) : [attr.value];
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  const barcodeValue = currentItem.barcode || currentItem.code || String(currentItem.id || "0000");

  

  const handlePrintBarcode = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Print Label - ${escapeHtml(currentItem.name)}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .price { font-size: 20px; font-weight: bold; margin-top: 8px; color: #16a34a; }
            .name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
            .code { font-size: 12px; color: #666; font-family: monospace; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="name">${escapeHtml(currentItem.name)}</div>
          <div class="code">SKU: ${escapeHtml(currentItem.code || 'N/A')}</div>
          <div>${document.getElementById('printable-barcode')?.innerHTML || ''}</div>
          <div class="price">${formatCurrency(currentItem.price_discount || currentItem.price)}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
  };

  if (isLoading) return <div className="items-page h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" /></div>;

  const colors = extractAttribute("colors");
  const sizes = extractAttribute("size");
  const otherSpecs = currentItem.attributes?.filter(a => !["colors", "size"].includes(a.name)) || [];

  const costPrice = parseFloat(currentItem.cost || currentItem.item_cost || 0);
  const retailPrice = parseFloat(currentItem.price_discount || currentItem.price || 0);
  const unitProfit = retailPrice - costPrice;
  const marginPercentage = retailPrice > 0 && costPrice > 0 ? ((unitProfit / retailPrice) * 100).toFixed(1) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="items-page min-h-screen bg-transparent p-4 lg:p-8"
    >
      <AlertBox
        isOpen={alertBox}
        title={t("Permanently Delete?")}
        message={`${t("Are you sure you want to delete")} "${currentItem.name}"?`}
        onConfirm={async () => {
          setAlertBox(false);
          setLoading(true);
          try {
            await deleteItem({ id: currentItem.id, token });
            toast.success(t("Item removed"));
            navigator(-1);
          } catch (e) { toast.error(t("Delete failed")); }
          setLoading(false);
        }}
        onCancel={() => setAlertBox(false)}
        confirmColor="error"
      />

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigator(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <RiArrowLeftSLine size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              {currentItem.name} <Tag color="cyan" className="rounded-full">{currentItem.code}</Tag>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("In")} {currentItem.category_name} • {t("By")} {currentItem.brand_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrintBarcode}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm font-medium"
          >
            <RiPrinterLine size={18} /> {t("Print Label") || "Print Label"}
          </button>
          <button onClick={() => setAlertBox(true)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-all">
            <RiDeleteBin6Line size={20} />
          </button>
          <button
            onClick={() => navigator(`/inventories/list/update/${currentItem.id}`)}
            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-sm hover:bg-cyan-700 shadow-md transition-all font-medium text-sm"
          >
            <RiEditLine /> {t("Edit Product")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">

        {/* --- LEFT: MEDIA GALLERY (Sticky) --- */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-4">
            <div className="relative group rounded-sm p-6 border-2 border-dashed border-gray-100 dark:border-slate-800 aspect-square flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900/50">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={currentItem.images?.[currentImageIndex]?.image || currentItem.image || import.meta.env.VITE_INITIAL_IMAGE}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="max-h-full max-w-full object-contain"
                />
              </AnimatePresence>

              {/* Image Controls */}
              {currentItem.images?.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={currentImageIndex === 0}
                    onClick={() => setCurrentImageIndex(prev => prev - 1)}
                    className="p-2 bg-white/90 dark:bg-cyan-900 rounded-full disabled:opacity-30"
                  >
                    <MdKeyboardArrowLeft size={24} />
                  </button>
                  <button
                    disabled={currentImageIndex === currentItem.images.length - 1}
                    onClick={() => setCurrentImageIndex(prev => prev + 1)}
                    className="p-2 bg-white/90 dark:bg-cyan-900 rounded-full disabled:opacity-30"
                  >  
                    <MdKeyboardArrowRight size={24} />
                  </button>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {currentItem.images?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative min-w-[80px] h-20 rounded-sm border-2 transition-all ${currentImageIndex === idx ? 'border-cyan-500 ring-4 ring-cyan-50' : 'border-transparent bg-white '}`}
                >
                  <img src={img.image} className="w-full h-full object-cover rounded-sm" />
                </button>
              ))}
            </div>

            {/* Barcode Preview Card */}
            <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800 rounded-sm flex flex-col items-center justify-center">
              <div id="printable-barcode">
                <Barcode height={45} value={barcodeValue} />
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT: PRODUCT INFO --- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Price Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900/50 p-6 rounded-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><MdAttachMoney className="text-gray-100 dark:text-slate-800 text-6xl" /></div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{t("Retail Price")}</p>
              <div className="mt-2 flex items-end gap-3">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{formatCurrency(currentItem.price_discount || currentItem.price)}</h2>
                {currentItem.price > currentItem.price_discount && (
                  <span className="text-gray-400 line-through mb-1">{formatCurrency(currentItem.price)}</span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge status="processing" text={t("Active Listing")} />
                {marginPercentage && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    Margin: {marginPercentage}%
                  </span>
                )}
              </div>
            </div>

            <div className="bg-cyan-600 p-6 rounded-sm shadow-cyan-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><MdTrendingUp className="text-cyan-500 text-6xl" /></div>
              <p className="text-sm font-medium text-cyan-100 uppercase tracking-wider">{t("Wholesale Rate")}</p>
              <div className="mt-2 flex items-end gap-3">
                <h2 className="text-3xl font-bold text-white">{formatCurrency(currentItem.wholesale_price_discount || currentItem.wholesale_price)}</h2>
                <Tag color="cyan" className="bg-white/20 border-none text-white ml-2">{t("Min. Bulk")}</Tag>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('In Stock'), val: currentItem.stock?.in_stock || 0, icon: <MdInventory />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
              { label: t('Units Sold'), val: currentItem.stock?.sold || 0, icon: <MdShoppingCart />, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
              { label: t('Rating'), val: currentItem.rating || 'N/A', icon: <MdStar />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
              { label: t('Discount'), val: `${currentItem.discount}%`, icon: <MdLocalOffer />, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-white dark:bg-slate-900/50 p-3 rounded-sm border border-slate-100 dark:border-slate-800">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-sm flex items-center justify-center mx-auto mb-2 text-xl`}>
                  {stat.icon}
                </div>
                <p className="text-xs text-gray-900 dark:text-white font-medium mb-1 uppercase">{stat.label}</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Inventory Status Bar */}
          <div className={`p-4 rounded-sm border flex items-center justify-between ${
            (currentItem.stock?.in_stock || 0) > 0 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${(currentItem.stock?.in_stock || 0) > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-bold text-sm">
                {(currentItem.stock?.in_stock || 0) > 0 
                  ? `${currentItem.stock.in_stock} ${t("Units available in warehouse") || "Units available in warehouse"}` 
                  : (t("Item Out of Stock") || "Item Out of Stock")}
              </span>
            </div>
            <button 
              onClick={() => navigator('/inventories/stock-list')} 
              className="text-xs font-bold underline uppercase tracking-tight hover:opacity-80 transition-opacity"
            >
              {t("View Stock Logs") || "View Stock Logs"}
            </button>
          </div>

          {/* Detailed Specifications */}
          <div className="bg-white dark:bg-slate-900/50 p-6 rounded-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <MdInventory className="text-cyan-500" /> {t("Technical Specifications")}
            </h3>

            <div className="space-y-8">
              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FaPalette /> {t("Available Finishes")}
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {colors.map((c, i) => (
                      <Tooltip title={c} key={i}>
                        <div className="group flex flex-col items-center gap-2">
                          <div
                            className="w-12 h-12 rounded-sm border-4 border-white shadow-md ring-1 ring-gray-100 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                          <span className="text-[10px] font-mono text-gray-400 uppercase">{c}</span>
                        </div>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FaRuler /> {t("Size Selection")}
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((s, i) => (
                      <span key={i} className="px-5 py-2.5 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-sm border border-gray-200 dark:border-slate-700 text-sm font-bold hover:border-cyan-400 transition-colors">
                        {s.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherSpecs.map((attr, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-sm bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-cyan-50 group-hover:text-cyan-500 transition-colors">
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{attr.name}</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ItemDetails;

