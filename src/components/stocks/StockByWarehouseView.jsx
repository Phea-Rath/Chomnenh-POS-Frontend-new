import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router";
import { useGetStockFilterQuery } from "@/features/stocks/stocksSlice";
import { useGetItemByIdQuery } from "@/features/products/itemsSlice";
import { useGetAllWarehousesQuery } from "@/features/stocks/warehousesSlice";
import { useTranslation } from "react-i18next";
import RefreshButton from "../../utils/RefreshButton";
import Pagination from "../../utils/Pagination";
import RichSearch from "../../utils/RichSearch";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaClipboardList,
  FaShoppingCart,
  FaWarehouse,
  FaTag,
  FaRegClock,
  FaEye,
  FaExclamationTriangle,
  FaDollarSign,
} from "react-icons/fa";
import {
  LuSearch,
  LuX,
  LuPackage,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuRotateCcw,
  LuTrash2,
  LuShoppingBag,
  LuLayers,
  LuFileText,
} from "react-icons/lu";
import { BiMoney } from "react-icons/bi";
import { getToken } from '@/utils/tokenStore';

const getNormalizedTypeKey = (typeStr) => {
  if (!typeStr) return "other";
  const lower = String(typeStr).toLowerCase().replace(/_/g, " ");
  if (lower.includes("in")) return "in";
  if (lower.includes("out")) return "out";
  if (lower.includes("return")) return "return";
  if (lower.includes("waste") || lower.includes("wasted")) return "waste";
  if (lower.includes("sold") || lower.includes("sale")) return "sold";
  return "other";
};

const getTypeBadgeProps = (typeStr) => {
  const key = getNormalizedTypeKey(typeStr);
  switch (key) {
    case "in":
      return {
        label: "Stock In",
        colorClass:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        icon: <LuArrowDownLeft className="text-emerald-500 shrink-0" />,
      };
    case "out":
      return {
        label: "Stock Out",
        colorClass:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        icon: <LuArrowUpRight className="text-amber-500 shrink-0" />,
      };
    case "return":
      return {
        label: "Stock Return",
        colorClass:
          "bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800",
        icon: <LuRotateCcw className="text-teal-500 shrink-0" />,
      };
    case "waste":
      return {
        label: "Stock Waste",
        colorClass:
          "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        icon: <LuTrash2 className="text-rose-500 shrink-0" />,
      };
    case "sold":
      return {
        label: "Sold",
        colorClass:
          "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        icon: <LuShoppingBag className="text-purple-500 shrink-0" />,
      };
    default:
      return {
        label: typeStr || "Other",
        colorClass:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        icon: <LuLayers className="text-slate-500 shrink-0" />,
      };
  }
};

const StockByWarehouseView = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { type: urlType, item_id: urlItemId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getToken();
  const isKhmer = i18n.language === "kh";

  const queryType = searchParams.get("type") || urlType || "all";
  const queryItemId = searchParams.get("item_id") || urlItemId || "";
  const queryWarehouseId = searchParams.get("warehouse_id") || "1";

  const [warehouseId, setWarehouseId] = useState(queryWarehouseId);
  const [activeType, setActiveType] = useState(queryType);
  const [itemId, setItemId] = useState(queryItemId);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Keep state in sync with URL search parameters or URL path params
  useEffect(() => {
    const st = searchParams.get("type") || urlType || "all";
    const si = searchParams.get("item_id") || urlItemId || "";
    const sw = searchParams.get("warehouse_id") || "1";

    setActiveType(st);
    setItemId(si);
    setWarehouseId(sw);
  }, [searchParams, urlType, urlItemId]);

  // Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, warehouseId, itemId, searchTerm]);

  // Fetch Warehouses
  const { data: warehouseResponse } = useGetAllWarehousesQuery(token);
  const warehouses = warehouseResponse?.data || [];

  // API Queries
  const {
    data: itemResponse,
    isLoading: itemLoading,
  } = useGetItemByIdQuery(
    { id: itemId, token },
    { skip: !itemId }
  );

  const {
    data: stockFilterResponse,
    isFetching,
    isError,
    refetch,
  } = useGetStockFilterQuery({
    type: activeType,
    item_id: itemId ?? "",
    warehouse_id: warehouseId,
    token,
  });

  const itemDetails = itemResponse?.data;
  const rawStockList = useMemo(
    () => stockFilterResponse?.data ?? [],
    [stockFilterResponse]
  );

  // Client-side search filtering
  const filteredStockList = useMemo(() => {
    if (!searchTerm.trim()) return rawStockList;
    const query = searchTerm.trim().toLowerCase();
    return rawStockList.filter((item) => {
      const noMatch = item?.no?.toString().toLowerCase().includes(query);
      const fromMatch = item?.from?.toString().toLowerCase().includes(query);
      const toMatch = item?.to?.toString().toLowerCase().includes(query);
      const typeMatch = item?.type?.toString().toLowerCase().includes(query);
      const nameMatch = item?.item_name?.toString().toLowerCase().includes(query);
      return noMatch || fromMatch || toMatch || typeMatch || nameMatch;
    });
  }, [rawStockList, searchTerm]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const totalCount = rawStockList.length;
    const totalQty = rawStockList.reduce(
      (sum, item) => sum + (parseFloat(item?.quantity) || 0),
      0
    );
    const totalPrice = rawStockList.reduce(
      (sum, item) => sum + (parseFloat(item?.total_price) || 0),
      0
    );

    const counts = {
      in: 0,
      out: 0,
      return: 0,
      waste: 0,
      sold: 0,
    };
    const qtyByTypes = {
      in: 0,
      out: 0,
      return: 0,
      waste: 0,
      sold: 0,
    };

    rawStockList.forEach((item) => {
      const key = getNormalizedTypeKey(item?.type);
      if (counts[key] !== undefined) {
        counts[key] += 1;
        qtyByTypes[key] += parseFloat(item?.quantity) || 0;
      }
    });

    return {
      totalCount,
      totalQty,
      totalPrice,
      counts,
      qtyByTypes,
    };
  }, [rawStockList]);

  // Paginated List
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStockList.slice(startIndex, startIndex + pageSize);
  }, [filteredStockList, currentPage, pageSize]);

  const handleWarehouseSelect = (newWhId) => {
    setWarehouseId(newWhId);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newWhId) {
        newParams.set("warehouse_id", newWhId);
      } else {
        newParams.delete("warehouse_id");
      }
      return newParams;
    });
  };

  const handleTabClick = (newType) => {
    setActiveType(newType);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newType && newType !== "all") {
        newParams.set("type", newType);
      } else {
        newParams.delete("type");
      }
      return newParams;
    });
  };

  const filterTabs = [
    { id: "all", label: t("all") || "All", icon: <FaClipboardList /> },
    { id: "in", label: t("stockIn") || "Stock In", icon: <LuArrowDownLeft /> },
    { id: "out", label: t("stockOut") || "Stock Out", icon: <LuArrowUpRight /> },
    { id: "return", label: t("stockReturn") || "Stock Return", icon: <LuRotateCcw /> },
    { id: "waste", label: t("stockWaste") || "Stock Waste", icon: <LuTrash2 /> },
    { id: "sold", label: t("sold") || "Sold", icon: <LuShoppingBag /> },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-100 min-h-screen">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/inventories/product-in-warehouse')}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            title={t("back") || "Back"}
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FaWarehouse className="text-cyan-500" />
              {isKhmer ? "ប្រវត្តិប្រតិបត្តិការស្តុក" : "Stock Movement History"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isKhmer
                ? "ពិនិត្យមើលរាល់ប្រតិបត្តិការផ្លាស់ប្តូរស្តុក ផ្ទេរ និងការលក់"
                : "Detailed history of stock movements, transfers, returns, waste, and sales"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto w-full md:w-auto">
          {/* WAREHOUSE SELECTOR */}
          <div className="w-48">
            <RichSearch
              data={warehouses}
              value={warehouseId}
              placeholder={t("selectWarehouse") || "Select Warehouse"}
              keyFields={{
                id: "warehouse_id",
                title: "warehouse_name",
              }}
              onSelected={(val) => handleWarehouseSelect(val)}
            />
          </div>

          {/* SEARCH INPUT */}
          <div className="relative flex-1 md:w-56">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search") + "..." || "Search reference, warehouse..."}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 dark:text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <LuX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <RefreshButton onRefresh={refetch} />
        </div>
      </div>

      {/* ITEM PROFILE CARD (Displayed when filtering by single item) */}
      {itemId && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
          {itemLoading ? (
            <div className="animate-pulse flex gap-4 items-center">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
              </div>
            </div>
          ) : itemDetails ? (
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={itemDetails?.image}
                    onError={(e) => {
                      e.target.src =
                        import.meta.env.VITE_INITIAL_IMAGE ||
                        "https://via.placeholder.com/150";
                    }}
                    alt={itemDetails?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {itemDetails?.name || itemDetails?.item_name}
                    </h2>
                    {itemDetails?.stock?.in_stock > 0 ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {t("available") || "In Stock"}: {itemDetails?.stock?.in_stock}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
                        {t("unavailable") || "Out of Stock"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                      {itemDetails?.code || itemDetails?.item_code || "N/A"}
                    </span>
                    {itemDetails?.barcode && (
                      <span>• Barcode: {itemDetails.barcode}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* ITEM METADATA PILLS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    {t("price") || "Price"}
                  </span>
                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                    ${parseFloat(itemDetails?.price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    {t("scale") || "Scale"}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {itemDetails?.scale_name || itemDetails?.scale || "-"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    {t("brand") || "Brand"}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {itemDetails?.brand_name || "-"}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-[90px]">
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    {t("category") || "Category"}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {itemDetails?.category_name || "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* TOTAL VALUE */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("totalPrice") || "Total Value"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <BiMoney className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              ${stats.totalPrice.toFixed(2)}
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Sum of filtered entries
            </p>
          </div>
        </div>

        {/* TOTAL QUANTITY */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("totalQuantity") || "Total Qty"}
            </span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
              <LuPackage className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.totalQty.toLocaleString()}
            </h3>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
              {stats.totalCount} movement records
            </p>
          </div>
        </div>

        {/* STOCK IN STAT */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("stockIn") || "Stock In"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <LuArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.counts.in} <span className="text-xs font-normal text-slate-400">records</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Qty: {stats.qtyByTypes.in.toLocaleString()}
            </p>
          </div>
        </div>

        {/* STOCK OUT STAT */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("stockOut") || "Stock Out"}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <LuArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.counts.out} <span className="text-xs font-normal text-slate-400">records</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Qty: {stats.qtyByTypes.out.toLocaleString()}
            </p>
          </div>
        </div>

        {/* WASTE STAT */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("stockWaste") || "Stock Waste"}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <LuTrash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.counts.waste} <span className="text-xs font-normal text-slate-400">records</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Qty: {stats.qtyByTypes.waste.toLocaleString()}
            </p>
          </div>
        </div>

        {/* SOLD STAT */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("sold") || "Sold Orders"}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <LuShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {stats.counts.sold} <span className="text-xs font-normal text-slate-400">records</span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Qty: {stats.qtyByTypes.sold.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER TABS & TABLE CONTAINER */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* TABS HEADER */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = activeType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-xs shadow-cyan-500/20"
                    : "bg-white dark:bg-gray-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TABLE CONTENT */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">{t("no") || "Ref / Invoice No"}</th>
                <th className="py-3.5 px-4">{t("type") || "Type"}</th>
                {rawStockList.some((i) => i.item_name) && (
                  <th className="py-3.5 px-4">{t("item") || "Item"}</th>
                )}
                <th className="py-3.5 px-4">{t("from") || "From (Source)"}</th>
                <th className="py-3.5 px-4">{t("to") || "To (Destination)"}</th>
                <th className="py-3.5 px-4 text-center">{t("quantity") || "Quantity"}</th>
                <th className="py-3.5 px-4 text-right">{t("totalPrice") || "Total Amount"}</th>
                <th className="py-3.5 px-4">{t("date") || "Date & Time"}</th>
                <th className="py-3.5 px-4 text-center">{t("action") || "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isFetching ? (
                // SKELETON LOADING ROWS
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-3 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    </td>
                    {rawStockList.some((i) => i.item_name) && (
                      <td className="py-4 px-4">
                        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                    )}
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                // ERROR ROW
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-rose-500 font-medium"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FaExclamationTriangle className="w-8 h-8 opacity-80" />
                      <p>{t("errorFetchingData") || "Failed to load stock filter data."}</p>
                      <button
                        onClick={refetch}
                        className="mt-2 text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg font-semibold hover:bg-rose-200 transition-colors"
                      >
                        {t("retry") || "Retry"}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                // EMPTY STATE ROW
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <LuPackage className="w-10 h-10 stroke-1 opacity-50" />
                      <p className="text-sm font-medium">
                        {t("noDataFound") || "No transaction records found"}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Try adjusting your filters or search keywords to find stock movement history.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // DATA ROWS
                paginatedList.map((item, index) => {
                  const rowIndex = (currentPage - 1) * pageSize + index + 1;
                  const badgeProps = getTypeBadgeProps(item?.type);
                  const formattedPrice = parseFloat(item?.total_price || 0).toFixed(2);
                  const isSold = getNormalizedTypeKey(item?.type) === "sold";

                  return (
                    <tr
                      key={item?.id ? `${item.id}-${index}` : index}
                      className="hover:bg-cyan-50/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {rowIndex}
                      </td>

                      {/* REF / INVOICE NO */}
                      <td className="py-3 px-4 font-semibold font-mono text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <LuFileText className="text-slate-400 shrink-0" />
                          <span>{item?.no || item?.id || "N/A"}</span>
                        </div>
                      </td>

                      {/* TYPE BADGE */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${badgeProps.colorClass}`}
                        >
                          {badgeProps.icon}
                          {badgeProps.label}
                        </span>
                      </td>

                      {/* ITEM NAME (If present) */}
                      {rawStockList.some((i) => i.item_name) && (
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                          {item?.item_name || "-"}
                        </td>
                      )}

                      {/* FROM */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item?.from || "-"}
                      </td>

                      {/* TO */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item?.to || "-"}
                      </td>

                      {/* QUANTITY */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {item?.quantity ? item.quantity.toLocaleString() : 0}
                      </td>

                      {/* TOTAL AMOUNT */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-emerald-400">
                        ${formattedPrice}
                      </td>

                      {/* DATE */}
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1">
                          <FaRegClock className="text-slate-400 shrink-0" />
                          <span>{item?.date || "N/A"}</span>
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="py-3 px-4 text-center">
                        {item?.id ? (
                          <Link
                            to={
                              isSold
                                ? `/home/order-tracking/view/${item.id}`
                                : `/inventories/stock-list/detail/${item.id}`
                            }
                            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors"
                            title={t("view") || "View Details"}
                          >
                            <FaEye className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {filteredStockList.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <Pagination
              current={currentPage}
              total={filteredStockList.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StockByWarehouseView;