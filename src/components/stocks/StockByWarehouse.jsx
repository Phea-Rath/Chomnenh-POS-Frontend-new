import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IoIosGrid, IoIosList } from 'react-icons/io';
import {
  FaBoxOpen,
  FaClipboardList,
  FaFileExport,
  FaListUl,
  FaShoppingCart,
  FaWarehouse,
  FaExchangeAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import { useGetAllWarehousesQuery } from "@/features/stocks/warehousesSlice";
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router';
import RefreshButton from '../../utils/RefreshButton';
import { LuList, LuPlus, LuSearch } from 'react-icons/lu';

import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import { getToken } from '@/utils/tokenStore';

const LIST_MENU_ID = 22;

const STOCK_FIELDS = [
  { key: 'in_stock', label: 'In Stock', kh: 'ក្នុងស្តុក', className: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200/80 dark:border-cyan-800/60' },
  { key: 'stock_in', label: 'Stock In', kh: 'ស្តុកចូល', className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60' },
  { key: 'stock_out', label: 'Stock Out', kh: 'ស្តុកចេញ', className: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60' },
  { key: 'stock_return', label: 'Stock Return', kh: 'ស្តុកប្តូរវិញ', className: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/80 dark:border-sky-800/60' },
  { key: 'stock_wasted', label: 'Stock Wasted', kh: 'ស្តុកខូច', className: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60' },
  { key: 'sold', label: 'Sold', kh: 'លក់ចេញ', className: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60' },
];

const StockByWarehouse = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const warehouse_id = id ?? 1;
  const isKhmer = i18n.language === 'kh';
  const token = getToken();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem('stockByWarehouseViewMode') || 'grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const { data: warehouseResponse } = useGetAllWarehousesQuery(token);
  const warehouses = warehouseResponse?.data || [];

  useEffect(() => {
    if (!selectedWarehouse && warehouses.length > 0) {
      setSelectedWarehouse(String(warehouse_id));
    }
  }, [warehouses, selectedWarehouse, warehouse_id]);

  const fetchStocksByWarehouse = async (warehouseId) => {
    if (!warehouseId) {
      setStocks([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/stock_by_warehouse/${warehouseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      setStocks(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (error) {
      setStocks([]);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to fetch stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocksByWarehouse(selectedWarehouse);
  }, [selectedWarehouse]);

  const filteredStocks = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return stocks;

    return stocks.filter((item) =>
      item.item_name?.toLowerCase().includes(keyword) ||
      item.item_code?.toLowerCase().includes(keyword) ||
      item.barcode?.toLowerCase().includes(keyword) ||
      item.category_name?.toLowerCase().includes(keyword) ||
      item.brand_name?.toLowerCase().includes(keyword)
    );
  }, [stocks, searchTerm]);

  const selectedWarehouseName = useMemo(() => {
    return warehouses.find((warehouse) => String(warehouse.warehouse_id) === String(selectedWarehouse))?.warehouse_name || t('warehouse');
  }, [warehouses, selectedWarehouse, t]);

  const getImageSrc = (item) => {
    if (typeof item?.image === 'string' && item.image.trim()) return item.image;
    if (typeof item?.images === 'string' && item.images.trim()) return item.images;
    return '';
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getNetAvailable = (item) => Number(item?.stock?.in_stock || 0);

  const totals = useMemo(() => {
    return filteredStocks.reduce((acc, item) => {
      STOCK_FIELDS.forEach(({ key }) => {
        acc[key] += Number(item?.stock?.[key] || 0);
      });
      return acc;
    }, { in_stock: 0, stock_return: 0, stock_in: 0, stock_out: 0, stock_wasted: 0, sold: 0 });
  }, [filteredStocks]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('stockByWarehouseViewMode', mode);
  };

  const exportToExcel = () => {
    if (filteredStocks.length === 0) {
      toast.warning(t('noDataToExport', 'No data to export'));
      return;
    }

    try {
      setExportLoading(true);

      const dataToExport = filteredStocks.map((item, index) => ({
        'No.': index + 1,
        'Item ID': item.item_id,
        'Item Code': item.item_code || 'N/A',
        Barcode: item.barcode || 'N/A',
        'Item Name': item.item_name || 'N/A',
        Category: item.category_name || 'N/A',
        Brand: item.brand_name || 'N/A',
        'Item Price': Number(item.item_price || 0),
        'Item Cost': Number(item.item_cost || 0),
        'Wholesale Price': Number(item.wholesale_price || 0),
        'In Stock': Number(item?.stock?.in_stock || 0),
        'Stock In': Number(item?.stock?.stock_in || 0),
        'Stock Out': Number(item?.stock?.stock_out || 0),
        'Stock Return': Number(item?.stock?.stock_return || 0),
        'Stock Wasted': Number(item?.stock?.stock_wasted || 0),
        Sold: Number(item?.stock?.sold || 0),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock By Warehouse');
      XLSX.writeFile(workbook, `Stock_By_Warehouse_${selectedWarehouseName.replace(/\s+/g, '_')}.xlsx`);
      toast.success(`${t('exported')} ${filteredStocks.length} ${t('items')}`);
    } catch (error) {
      toast.error(t('exportFailed', 'Export failed'));
    } finally {
      setExportLoading(false);
    }
  };

  const ProductImage = ({ src, alt, className = 'h-12 w-12 rounded-xl' }) => {
    const [hasError, setHasError] = useState(false);

    if (!src || hasError) {
      return (
        <div className={`flex items-center justify-center border border-cyan-200/80 bg-cyan-600 dark:bg-cyan-700 text-sm font-extrabold text-white shadow-xs ${className}`}>
          {alt?.charAt(0)?.toUpperCase() || 'P'}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={`border border-slate-200/80 dark:border-slate-700/80 object-cover ${className}`}
        onError={() => setHasError(true)}
      />
    );
  };

  const StatCard = ({ title, value, icon, badgeBg, textColor }) => (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`mt-1 text-xl font-extrabold tracking-tight ${textColor}`}>{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${badgeBg} shadow-xs`}>
        {icon}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
        <FaWarehouse className="h-9 w-9" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('noStockFound', 'No Stock Found')}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
        {selectedWarehouse
          ? t('noStockMatch', 'No items match the selected warehouse or current search.')
          : t('selectWarehousePrompt', 'Select a warehouse to view available stock.')}
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('fetchingItemBalances', 'Fetching item balances for the selected warehouse...')}</p>
    </div>
  );

  const GridItem = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/inventories/product-in-warehouse/view?type=all&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`)}
      className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
    >
      <div>
        <div className="relative h-40 w-full overflow-hidden bg-slate-900">
          <ProductImage
            src={getImageSrc(item)}
            alt={item.item_name}
            className="h-full w-full rounded-none border-0 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-950/40" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <span className="inline-flex rounded-lg bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-extrabold text-white border border-white/20 uppercase">
              {item.category_name || t('stockItem')}
            </span>
            <span className="inline-flex rounded-lg bg-white/20 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white">
              {item.brand_name || 'N/A'}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{item.item_name}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400 truncate">
              {item.item_code || 'N/A'} {item.barcode ? `| ${item.barcode}` : ''}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/40">
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventories/product-in-warehouse/view?type=in&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                }}
                className="rounded-lg bg-emerald-50/80 p-2 dark:bg-emerald-950/30 hover:opacity-90 transition-opacity"
              >
                <p className="font-bold text-slate-500 dark:text-slate-400">{t('stockIn')}</p>
                <p className="mt-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">+ {Number(item?.stock?.stock_in)}</p>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventories/product-in-warehouse/view?type=return&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                }}
                className="rounded-lg bg-sky-50/80 p-2 dark:bg-sky-950/30 hover:opacity-90 transition-opacity"
              >
                <p className="font-bold text-slate-500 dark:text-slate-400">{t('stockReturn')}</p>
                <p className="mt-0.5 text-xs font-extrabold text-sky-600 dark:text-sky-400">+ {Number(item?.stock?.stock_return)}</p>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventories/product-in-warehouse/view?type=out&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                }}
                className="rounded-lg bg-orange-50/80 p-2 dark:bg-orange-950/30 hover:opacity-90 transition-opacity"
              >
                <p className="font-bold text-slate-500 dark:text-slate-400">{t('stockOut')}</p>
                <p className="mt-0.5 text-xs font-extrabold text-orange-600 dark:text-orange-400">- {Number(item?.stock?.stock_out)}</p>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventories/product-in-warehouse/view?type=waste&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                }}
                className="rounded-lg bg-rose-50/80 p-2 dark:bg-rose-950/30 hover:opacity-90 transition-opacity"
              >
                <p className="font-bold text-slate-500 dark:text-slate-400">{t('stockWasted')}</p>
                <p className="mt-0.5 text-xs font-extrabold text-rose-600 dark:text-rose-400">- {Number(item?.stock?.stock_wasted)}</p>
              </div>

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/inventories/product-in-warehouse/view?type=sold&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                }}
                className="col-span-2 rounded-lg bg-purple-50/80 p-2 dark:bg-purple-950/30 hover:opacity-90 transition-opacity"
              >
                <p className="font-bold text-slate-500 dark:text-slate-400">{t('sold')}</p>
                <p className="mt-0.5 text-xs font-extrabold text-purple-600 dark:text-purple-400">- {Number(item?.stock?.sold)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-1 font-extrabold">
              <span className="text-slate-400">{t('available')}:</span>
              <span className="text-cyan-600 dark:text-cyan-400">{getNetAvailable(item)}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              {t('costValue')}: <span className="font-bold text-slate-900 dark:text-white">${formatNumber(Number(item.item_cost || 0) * getNetAvailable(item))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/inventories/product-in-warehouse/view?type=all&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50/80 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-900/50 transition-colors"
        >
          <FaListUl className="h-3 w-3" />
          <span>{t('viewStockDetails', 'View Stock History')}</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-5 p-4 md:p-6 transition-colors ${isKhmer ? 'font-khmer' : ''}`}>
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 dark:bg-cyan-700 text-white shadow-md shadow-cyan-600/20">
              <FaWarehouse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t('stockBy')} <span className="text-cyan-500">{t('warehouse')}</span>
                </h1>
                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-400">
                  {filteredStocks.length} {t('items') || 'Items'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('stockByWarehouseDesc', 'Select a warehouse to view item stock balances and all stock movement totals.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => handleViewModeChange('table')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === 'table'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title={t('tableView')}
              >
                <IoIosList size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                title={t('gridView')}
              >
                <IoIosGrid size={18} />
              </button>
            </div>

            <RefreshButton
              onClick={() => fetchStocksByWarehouse(selectedWarehouse)}
              disabled={loading}
            />

            <Button
              variant="primary"
              onClick={exportToExcel}
              disabled={exportLoading || filteredStocks.length === 0}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 transition-all"
            >
              <FaFileExport className="h-3.5 w-3.5" />
              <span>{exportLoading ? t('exporting') : t('exportExcel')}</span>
            </Button>

            <Button
              variant="siliver"
              actionType='is_view'
              menuId={LIST_MENU_ID}
              onClick={() => navigate("/inventories/stock-list")}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <LuList className="h-3.5 w-3.5" />
              <span>{t('stockList')}</span>
            </Button>

            <Button
              variant="save"
              actionType='is_modify'
              menuId={LIST_MENU_ID}
              onClick={() => navigate("/inventories/stock-list/add")}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <LuPlus className="h-3.5 w-3.5" />
              <span>{t('stockIn')}</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 md:flex-row">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="w-full sm:w-64">
              <RichSearch
                data={warehouses}
                value={selectedWarehouse}
                placeholder={t('selectWarehouse')}
                keyFields={{
                  id: "warehouse_id",
                  title: "warehouse_name",
                }}
                onSelected={(val) => setSelectedWarehouse(val)}
              />
            </div>

            <div className="relative w-full sm:w-80">
              <LuSearch className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchStockPlaceholder', "Search by product, code, category...")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
              />
            </div>
          </div>

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              {t('clearSearch', 'Clear Search')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('selectedWarehouse', 'Selected Warehouse')}
          value={selectedWarehouseName}
          icon={<FaWarehouse className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
          badgeBg="bg-cyan-500/10"
          textColor="text-slate-900 dark:text-white"
        />
        <StatCard
          title={t('itemsFound', 'Items Found')}
          value={filteredStocks.length}
          icon={<FaClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          badgeBg="bg-emerald-500/10"
          textColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title={t('totalCurrentStock', 'Total Current Stock')}
          value={totals.in_stock}
          icon={<FaBoxOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          badgeBg="bg-orange-500/10"
          textColor="text-orange-600 dark:text-orange-400"
        />
        <StatCard
          title={t('totalSold', 'Total Sold')}
          value={totals.sold}
          icon={<FaShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          badgeBg="bg-purple-500/10"
          textColor="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Movement Breakdown Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STOCK_FIELDS.map((field, idx) => (
          idx !== 0 && idx !== 5 && (
            <div
              key={field.key}
              onClick={() => {
                let type;
                switch ((field.label).toLowerCase()) {
                  case 'stock in': type = 'in'; break;
                  case 'stock out': type = 'out'; break;
                  case 'stock return': type = 'return'; break;
                  case 'sold': type = 'sold'; break;
                  case 'stock waste': type = 'waste'; break;
                  default: type = null; break;
                }
                if (totals[field.key] > 0 && type != null) {
                  navigate(`/inventories/product-in-warehouse/view?type=${type}&warehouse_id=${selectedWarehouse}`);
                }
              }}
              className={`flex flex-col justify-between rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${field.className}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                {isKhmer ? field.kh : field.label}
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">
                {totals[field.key]}
              </p>
            </div>
          )
        ))}
      </div>

      {/* Main Stock Display Area */}
      <div>
        {loading ? (
          <LoadingState />
        ) : filteredStocks.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredStocks.map((item) => (
              <GridItem key={item.item_id} item={item} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-5 py-3.5">{t('product')}</th>
                    <th className="px-4 py-3.5">{t('code')}</th>
                    <th className="px-4 py-3.5">{t('category')}</th>
                    <th className="px-4 py-3.5">{t('brand')}</th>
                    <th className="px-4 py-3.5 text-right">{t('price')}</th>
                    <th className="px-4 py-3.5 text-right">{t('cost')}</th>
                    <th className="px-4 py-3.5 text-right">{t('wholesale')}</th>
                    {STOCK_FIELDS.map((field) => (
                      <th key={field.key} className="px-4 py-3.5 text-right">
                        {isKhmer ? field.kh : field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {filteredStocks.map((item) => (
                    <tr
                      key={item.item_id}
                      onClick={() => navigate(`/inventories/product-in-warehouse/view?type=all&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`)}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductImage src={getImageSrc(item)} alt={item.item_name} />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{item.item_name}</p>
                            <p className="text-[10px] text-slate-400">{item.barcode || 'No barcode'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {item.item_code || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {item.category_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                        {item.brand_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        ${Number(item.item_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        ${Number(item.item_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                        ${Number(item.wholesale_price || 0).toFixed(2)}
                      </td>
                      {STOCK_FIELDS.map((field) => {
                        let fieldType = 'all';
                        switch (field.key) {
                          case 'stock_in': fieldType = 'in'; break;
                          case 'stock_out': fieldType = 'out'; break;
                          case 'stock_return': fieldType = 'return'; break;
                          case 'stock_wasted': fieldType = 'waste'; break;
                          case 'sold': fieldType = 'sold'; break;
                          default: fieldType = 'all'; break;
                        }
                        return (
                          <td
                            key={field.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventories/product-in-warehouse/view?type=${fieldType}&item_id=${item.item_id}&warehouse_id=${selectedWarehouse}`);
                            }}
                            className="px-4 py-3.5 text-right font-bold hover:opacity-80"
                          >
                            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${field.className}`}>
                              {Number(item?.stock?.[field.key] || 0)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StockByWarehouse;
