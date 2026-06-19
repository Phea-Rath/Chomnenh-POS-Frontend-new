import React, { useEffect, useState, useMemo } from "react";
import { IoIosSearch, IoIosGrid, IoIosList, IoIosImages } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { useDebounce } from "use-debounce";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { useNavigate } from "react-router";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiAddLine,
  RiRefreshLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import RichSearch from "../../utils/RichSearch";
import Pagination from "../../utils/Pagination";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllBrandQuery } from "../../../app/Features/brandsSlice";
import { motion } from "framer-motion";
import Button from "../../utils/Button";
import Input from "../../utils/Input";
import { FaTag, FaLayerGroup, FaBox } from "react-icons/fa";
import RefreshButton from "../../utils/RefreshButton";
import { LuPackage } from "react-icons/lu";
import { definePermission } from "../../services/serviceFunction";
const MENU_ID = 6;
const Tag = ({ children, color = "gray", className = "" }) => {
  const colors = {
    success: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    error: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    blue: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    gray: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border text-[10px] font-bold uppercase tracking-wider ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

const LoadingSpinner = ({ tip = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#13b5ea] rounded-full animate-spin mb-3"></div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{tip}</p>
  </div>
);

const EmptyState = ({ description, buttonText, onButtonClick, t }) => (
  <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2px] bg-white dark:bg-slate-900/50">
    <LuPackage className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
    <p className="text-slate-500 text-sm font-medium">{description}</p>
    {buttonText && (
      <Button onClick={onButtonClick} variant="primary" className="mt-6">
        <RiAddLine /> {buttonText}
      </Button>
    )}
  </div>
);

// Grid Card component
const GridCard = ({ item, onEdit, onDelete, onView, formatCurrency, t }) => {
  const inStock = item?.stock?.in_stock || 0;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden hover:border-[#13b5ea] dark:hover:border-[#13b5ea] transition-all duration-300 bg-white dark:bg-slate-900/50 flex flex-col shadow-sm"
    >
      <div onClick={onView} className="relative aspect-square bg-slate-50 dark:bg-slate-800/50 overflow-hidden flex items-center justify-center cursor-pointer">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <IoIosImages className="text-4xl text-slate-300 dark:text-slate-700" />
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          <Tag color={inStock > 0 ? "success" : "error"}>
            {inStock > 0 ? `STK: ${inStock}` : t("Sold Out")}
          </Tag>
        </div>

        {item.discount > 0 && (
          <div className="absolute top-2 right-0">
            <span className="px-2 py-1 rounded-l-[2px] text-[10px] font-black uppercase text-white bg-[#e31a22] shadow-sm">
              {item.discount === 100 ? 'FREE' : `-${item.discount}% OFF`}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="mb-2">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-0.5">{item.category_name}</p>
          <h3 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-[#13b5ea] transition-colors">{item.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-sm text-green-600">{formatCurrency(item.price_discount || item.price)}</span>
            {item.price_discount && (
              <span className="text-[10px] text-slate-400 line-through">{formatCurrency(item.price)}</span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 flex justify-between border-t border-slate-100 dark:border-slate-800 items-center">
          <div className="flex gap-1.5 w-full">
            <button 
              onClick={onView} 
              disabled={!definePermission(MENU_ID).is_view}
              title={t("View")}
              className="flex-1 py-1.5 flex justify-center bg-slate-50 text-slate-600 rounded-[2px] hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
            >
              <RiEyeLine size={14} />
            </button>
            <button 
              onClick={onEdit} 
              disabled={!definePermission(MENU_ID).is_modify}
              title={t("Edit")}
              className="flex-1 py-1.5 flex justify-center bg-blue-50 text-blue-600 rounded-[2px] hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
            >
              <RiEditLine size={14} />
            </button>
            <button 
              onClick={onDelete} 
              disabled={!definePermission(MENU_ID).is_drop}
              title={t("Delete")}
              className="flex-1 py-1.5 flex justify-center bg-red-50 text-red-600 rounded-[2px] hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
            >
              <RiDeleteBinLine size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// List View Table
const ListView = ({ items, navigator, onDelete, formatCurrency, t }) => (
  <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden bg-white dark:bg-slate-900/50">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left font-bold">{t("Product")}</th>
            <th className="px-4 py-3 text-left font-bold">{t("Code")}</th>
            <th className="px-4 py-3 text-left font-bold">{t("Stock")}</th>
            <th className="px-4 py-3 text-left font-bold">{t("Price")}</th>
            <th className="px-4 py-3 text-left font-bold">{t("WholePrice")}</th>
            <th className="px-4 py-3 text-right font-bold">{t("Actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const inStock = item?.stock?.in_stock || 0;
            return (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[2px] border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0 p-1 flex items-center justify-center">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-[1px]"
                        />
                      ) : (
                        <IoIosImages className="text-xl text-slate-300 dark:text-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[13px] text-slate-800 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.category_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">#{item.code}</span>
                </td>
                <td className="px-4 py-3">
                  <Tag color={inStock > 0 ? "success" : "error"}>
                    {inStock} {t("Units")}
                  </Tag>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-[13px] text-green-600">{formatCurrency(item.price_discount || item.price)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold text-[13px] text-blue-500">{formatCurrency(item.wholesale_price_discount || item.wholesale_price)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
              disabled={!definePermission(MENU_ID).is_view}
                      onClick={() => navigator(`detail/${item.id}`)}
                      className="p-1.5 text-slate-400 hover:text-[#13b5ea] hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-all"
                    >
                      <RiEyeLine size={16} />
                    </button>
                    <button
              disabled={!definePermission(MENU_ID).is_modify}
                      onClick={() => navigator(`update/${item.id}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                    >
                      <RiEditLine size={16} />
                    </button>
                    <button
              disabled={!definePermission(MENU_ID).is_drop}
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const ListItem = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(localStorage.getItem("itemViewMode") || "grid");
  const [alertBox, setAlertBox] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const { setLoading, darkMode } = useOutletsContext();
  const token = localStorage.getItem("token");
  const categoryContext = useGetAllCategoriesQuery(token);
  const categories = useMemo(() => categoryContext.data?.data || [], [categoryContext.data]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedBrand, setSelectedBrand] = useState("");
  const brandContext = useGetAllBrandQuery(token);
  const brands = useMemo(() => brandContext.data?.data || [], [brandContext.data]);

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const { data, isLoading, isFetching, refetch } = useGetAllItemsQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debouncedSearch,
    category_id: selectedCategory,
    brand_id: selectedBrand,
  });

  const items = useMemo(() => data?.data || [], [data]);
  const totalItems = data?.pagination?.total || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDelete = (itemId) => {
    setDeleteItemId(itemId);
    setAlertBox(true);
  };

  const handleConfirmDelete = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await api.delete(`items/${deleteItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        toast.success(t("Item deleted successfully"));
        refetch();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || error || t("Error deleting item"));
    } finally {
      setLoading(false);
      setDeleteItemId(null);
    }
  };

  useEffect(() => {
    if (selectedCategory || selectedBrand) {
      refetch();
    }
  }, [selectedCategory, selectedBrand]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  return (
    <div className="view-page px-4 md:px-6 font-sans antialiased text-slate-900 dark:text-slate-100">
      <AlertBox
        isOpen={alertBox}
        title={t("Delete Item")}
        message={t("This action is permanent. Are you sure?")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAlertBox(false)}
        confirmText={t("Delete")}
        cancelText={t("Cancel")}
      />

      {/* Header Section */}
      <div className="border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {t("Items")}
              </h1>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700 font-bold">
                {totalItems} {t("TOTAL")}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-2 dark:text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              {t("Manage and track your products inventory")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton
              onRefresh={refetch}
            />
            <Button
              disabled={!definePermission(MENU_ID).is_modify}
              onClick={() => navigate("create")}
              variant="save"
            >
              <RiAddLine size={18} />
              {t("Add New")}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="space-y-6 mb-8">
        <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] p-4 bg-white dark:bg-slate-900/50 shadow-sm">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-6 w-full">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t("Search products...")}</label>
              <div className="relative">
                <input
                  placeholder={t("Search by name, code or category...")}
                  className="w-full px-3 py-1.5 pl-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[2px] transition-all outline-none focus:border-[#13b5ea] focus:ring-0 text-[13px] h-[38px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <IoIosSearch className="absolute left-3 top-2.5 text-slate-400" size={20} />
              </div>
            </div>

            <div className="lg:col-span-3 w-full">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t("View Options")}</label>
              <div className="flex items-center gap-2 p-1 border border-slate-200 dark:border-slate-700 rounded-[2px] bg-slate-50 dark:bg-slate-800 h-[38px]">
                <button
                  onClick={() => { setViewMode("grid"); localStorage.setItem("itemViewMode", "grid"); }}
                  className={`flex-1 h-full flex items-center justify-center rounded-[1px] transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 text-[#13b5ea] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <IoIosGrid size={18} />
                </button>
                <button
                  onClick={() => { setViewMode("list"); localStorage.setItem("itemViewMode", "list"); }}
                  className={`flex-1 h-full flex items-center justify-center rounded-[1px] transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 text-[#13b5ea] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <IoIosList size={18} />
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 w-full">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t("Page Size")}</label>
              <RichSearch
                value={pageSize}
                onSelected={value => { setPageSize(Number(value)); setCurrentPage(1); }}
                data={[
                  { label: "12 products / page", value: 12 },
                  { label: "24 products / page", value: 24 },
                  { label: "48 products / page", value: 48 }
                ]}
                keyFields={{ id: "value", title: 'label' }}
                placeholder={t("Page Size")}
              />
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <FaLayerGroup className="text-slate-400" />
              {t("Filter by Category")}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 !scroll-none">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  selectedCategory === ""
                    ? "bg-[#13b5ea] text-white border-[#13b5ea] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                }`}
              >
                {t("All")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.category_id}
                  onClick={() => setSelectedCategory(cat.category_id)}
                  className={`px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                    selectedCategory === cat.category_id
                      ? "bg-[#13b5ea] text-white border-[#13b5ea] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                  }`}
                >
                  {cat.category_name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <FaTag className="text-slate-400" />
              {t("Filter by Brand")}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 !scroll-none">
              <button
                onClick={() => setSelectedBrand("")}
                className={`px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all border ${
                  selectedBrand === ""
                    ? "bg-[#13b5ea] text-white border-[#13b5ea] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                }`}
              >
                {t("All")}
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.brand_id}
                  onClick={() => setSelectedBrand(brand.brand_id)}
                  className={`px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                    selectedBrand === brand.brand_id
                      ? "bg-[#13b5ea] text-white border-[#13b5ea] shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                  }`}
                >
                  {brand.brand_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading || isFetching ? (
          <LoadingSpinner tip={t("Syncing items from catalog...")} />
        ) : items.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 gap-4">
              {items.map((item) => (
                <GridCard
                  key={item.id}
                  item={item}
                  onEdit={() => navigate(`update/${item.id}`)}
                  onDelete={() => handleDelete(item.id)}
                  onView={() => navigate(`detail/${item.id}`)}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <ListView
              items={items}
              navigator={navigate}
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
              t={t}
            />
          )
        ) : (
          <EmptyState
            description={t("No items found matching your filters")}
            buttonText={t("Create Your First Product")}
            onButtonClick={() => navigate("create")}
            t={t}
          />
        )}

        {/* Pagination Section */}
        {items.length > 0 && (
          <div className="mt-16 fixed bottom-0 translate-x-1/2 right-1/2 flex justify-center border-t border-slate-100 dark:border-slate-800 pt-8">
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              t={t}
              onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ListItem;