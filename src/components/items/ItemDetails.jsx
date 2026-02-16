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
import { useDeleteItemMutation, useGetItemByIdQuery } from "../../../app/Features/itemsSlice";
import { RiDeleteBin6Line, RiEditLine, RiArrowLeftSLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { toast } from "react-toastify";
import { Tag, Divider, Badge, Card, Statistic, Tooltip } from "antd";
import { FaPalette, FaRuler, FaTag } from "react-icons/fa";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import Barcode from 'react-barcode';

const ItemDetails = () => {
  const { id } = useParams();
  const navigator = useNavigate();
  const token = localStorage.getItem("token");
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

  if (isLoading) return <div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const colors = extractAttribute("colors");
  const sizes = extractAttribute("size");
  const otherSpecs = currentItem.attributes?.filter(a => !["colors", "size"].includes(a.name)) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-transparent p-4 lg:p-8"
    >
      <AlertBox
        isOpen={alertBox}
        title="Permanently Delete?"
        message={`Are you sure you want to delete "${currentItem.name}"?`}
        onConfirm={async () => {
          setAlertBox(false);
          setLoading(true);
          try {
            await deleteItem({ id: currentItem.id, token });
            toast.success("Item removed");
            navigator("/dashboard/list");
          } catch (e) { toast.error("Delete failed"); }
          setLoading(false);
        }}
        onCancel={() => setAlertBox(false)}
        confirmColor="error"
      />

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigator("/dashboard/list")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RiArrowLeftSLine size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {currentItem.name} <Tag color="blue" className="rounded-full">{currentItem.code}</Tag>
            </h1>
            <p className="text-sm text-gray-500">In {currentItem.category_name} • By {currentItem.brand_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAlertBox(true)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <RiDeleteBin6Line size={20} />
          </button>
          <button
            onClick={() => navigator(`/dashboard/list/update/${currentItem.id}`)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-all font-medium"
          >
            <RiEditLine /> Edit Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT: MEDIA GALLERY (Sticky) --- */}
        <div className="lg:col-span-5">
          <div className="sticky top-8 space-y-4">
            <div className="relative group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 aspect-square flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={currentItem.images?.[currentImageIndex]?.image || currentItem.image}
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
                    className="p-2 bg-white/90 shadow-lg rounded-full disabled:opacity-30"
                  >
                    <MdKeyboardArrowLeft size={24} />
                  </button>
                  <button
                    disabled={currentImageIndex === currentItem.images.length - 1}
                    onClick={() => setCurrentImageIndex(prev => prev + 1)}
                    className="p-2 bg-white/90 shadow-lg rounded-full disabled:opacity-30"
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
                  className={`relative min-w-[80px] h-20 rounded-2xl border-2 transition-all ${currentImageIndex === idx ? 'border-blue-500 ring-4 ring-blue-50' : 'border-transparent bg-white shadow-sm'}`}
                >
                  <img src={img.image} className="w-full h-full object-cover rounded-xl" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- RIGHT: PRODUCT INFO --- */}
        <div className="lg:col-span-7 space-y-6">

          {/* Price Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><MdAttachMoney className="text-gray-100 text-6xl" /></div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Retail Price</p>
              <div className="mt-2 flex items-end gap-3">
                <h2 className="text-3xl font-bold text-gray-800">{formatCurrency(currentItem.price_discount)}</h2>
                {currentItem.price > currentItem.price_discount && (
                  <span className="text-gray-400 line-through mb-1">{formatCurrency(currentItem.price)}</span>
                )}
              </div>
              <Badge status="processing" text="Active Listing" className="mt-4" />
            </div>


            <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4"><MdTrendingUp className="text-blue-500 text-6xl" /></div>
              <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Wholesale Rate</p>
              <div className="mt-2 flex items-end gap-3">
                <h2 className="text-3xl font-bold text-white">{formatCurrency(currentItem.wholesale_price_discount)}</h2>
                <Tag color="blue" className="bg-white/20 border-none text-white ml-2">Min. Bulk</Tag>
              </div>
            </div>
            <Barcode value={currentItem.barcode} />
          </div>

          {/* Quick Stats Grid */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'In Stock', val: currentItem.stock?.in_stock || 0, icon: <MdInventory />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Units Sold', val: currentItem.stock?.sold || 0, icon: <MdShoppingCart />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Rating', val: currentItem.rating || 'N/A', icon: <MdStar />, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Discount', val: `${currentItem.discount}%`, icon: <MdLocalOffer />, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2 text-xl`}>
                  {stat.icon}
                </div>
                <p className="text-xs text-gray-400 font-medium mb-1 uppercase">{stat.label}</p>
                <p className="text-lg font-bold text-gray-700">{stat.val}</p>
              </div>
            ))}
          </div>

          {/* Detailed Specifications */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MdInventory className="text-blue-500" /> Technical Specifications
            </h3>

            <div className="space-y-8">
              {/* Colors */}
              {colors.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FaPalette /> Available Finishes
                  </label>
                  <div className="flex gap-4 flex-wrap">
                    {colors.map((c, i) => (
                      <Tooltip title={c} key={i}>
                        <div className="group flex flex-col items-center gap-2">
                          <div
                            className="w-12 h-12 rounded-2xl border-4 border-white shadow-md ring-1 ring-gray-100 transition-transform group-hover:scale-110"
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
                    <FaRuler /> Size Selection
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {sizes.map((s, i) => (
                      <span key={i} className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 text-sm font-bold hover:border-blue-400 transition-colors">
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
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <FaTag size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{attr.name}</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Status Bar */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${currentItem.stock?.in_stock > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-pulse ${currentItem.stock?.in_stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-bold text-sm">
                {currentItem.stock?.in_stock > 0 ? `${currentItem.stock.in_stock} Units available in warehouse` : 'Item Out of Stock'}
              </span>
            </div>
            <button className="text-xs font-bold underline uppercase tracking-tight">View Stock Logs</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ItemDetails;