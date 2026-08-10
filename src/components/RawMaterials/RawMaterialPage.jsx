import React, { useState, useEffect } from 'react';
import {
  LuSearch,
  LuPlus,
  LuDownload,
  LuEye,
  LuTrash2,
  LuList,
  LuPackage,
  LuScale,
  LuGrid3X3,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuX
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Link, useNavigate } from 'react-router';
import ExportExcel from '../../services/ExportExcel';
import { BiEdit } from 'react-icons/bi';
import api from '../../services/api';
import { useGetAllRawMaterialQuery } from "@/features/stocks/RawMaterialSlice";
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Button from '../../utils/Button';
import RefreshButton from '../../utils/RefreshButton';
import { getToken } from '@/utils/tokenStore';

dayjs.extend(relativeTime);
const MENU_ID = 16;
const LIST_MENU_ID = 48;

const RawMaterials = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = getToken();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50, 100]
  });
  const [viewMode, setViewMode] = useState('card');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDeleted] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: null, order: null });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { data: raw, refetch, isLoading: queryLoading } = useGetAllRawMaterialQuery({
    limit: pagination.pageSize,
    page: pagination.current,
    search: debouncedSearch,
    token
  });

  useEffect(() => {
    const data = raw?.data || [];
    setPagination(prev => ({
      ...prev,
      current: raw?.pagination?.current_page || prev.current,
      pageSize: raw?.pagination?.per_page || prev.pageSize,
      total: raw?.pagination?.total || 0
    }));
    setMaterials(data);
    setFilteredMaterials(data);
  }, [raw]);

  useEffect(() => {
    let filtered = [...materials];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.material_name?.toLowerCase().includes(term) ||
        m.material_code?.toLowerCase().includes(term) ||
        m.material_description?.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (sortConfig.field && sortConfig.order) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.field];
        let bVal = b[sortConfig.field];
        if (sortConfig.field === 'material_cost') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        } else if (sortConfig.field === 'created_at') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredMaterials(filtered);
  }, [materials, searchTerm, selectedCategory, showDeleted, sortConfig]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
  };

  const handlePageSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, pageSize: size, current: 1 }));
  };

  const handleSort = (field) => {
    let order = 'asc';
    if (sortConfig.field === field && sortConfig.order === 'asc') {
      order = 'desc';
    } else if (sortConfig.field === field && sortConfig.order === 'desc') {
      order = null;
    }
    setSortConfig({ field: order ? field : null, order });
  };

  const handleDelete = async (id) => {
    setDeleteConfirmId(null);
    try {
      setLoading(true);
      const response = await api.delete(`/raw_materials/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        toast.success(t('materialDeletedSuccessfully'));
        refetch();
      }
    } catch (error) {
      toast.error(t('failedToDeleteMaterial'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };
  const formatDate = (date) => dayjs(date).format('MMM D, YYYY');
  const formatQuantity = (amount) => Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const getImageSrc = (material) => {
    if (typeof material?.material_image === 'string' && material.material_image.trim()) return material.material_image;
    if (typeof material?.image === 'string' && material.image.trim()) return material.image;
    return '';
  };
  const getStockData = (material) => material?.stock || {};
  const getStockValue = (material, field) => getStockData(material)?.[field] ?? 0;

  const stockSummaryFields = [
    { key: 'stock_in', label: t('stockIn'), tone: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'stock_return', label: t('returned'), tone: 'text-sky-600 dark:text-sky-400' },
    { key: 'stock_out', label: t('stockOut'), tone: 'text-orange-500 dark:text-orange-400' },
    { key: 'used', label: t('used'), tone: 'text-amber-500 dark:text-amber-400' },
  ];

  const stockFields = [
    { key: 'in_stock', label: t('inStock') },
    { key: 'stock_in', label: t('stockIn') },
    { key: 'stock_out', label: t('stockOut') },
    { key: 'stock_return', label: t('returned') },
    { key: 'used', label: t('used') },
  ];

  const exportData = filteredMaterials.map(m => ({
    [t('id')]: m.id,
    [t('productName')]: m.material_name,
    [t('itemCode')]: m.material_code,
    [t('description')]: m.material_description,
    [t('primaryUnit')]: m.primary_unit,
    [t('secondaryUnitOptional')]: m.secondary_unit || 'N/A',
    [t('conversionValue')]: m.conversion_value || 'N/A',
    [t('cost')]: formatCurrency(m.material_cost),
    [t('status')]: m.is_deleted === 0 ? t('active') : t('deleted'),
    [t('created')]: formatDate(m.created_at)
  }));

  const Avatar = ({ src, alt, className = '' }) => {
    const [error, setError] = useState(false);
    if (src && !error) {
      return <img src={src} alt={alt} className={className || 'h-10 w-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700'} onError={() => setError(true)} />;
    }
    return (
      <div className={`${className || 'h-10 w-10 rounded-xl'} flex items-center justify-center bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/60 dark:border-cyan-800/40`}>
        <LuPackage className="text-xl" />
      </div>
    );
  };

  const Badge = ({ isDeleted }) => {
    if (isDeleted === 1) {
      return <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">{t('deleted')}</span>;
    }
    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">{t('active')}</span>;
  };

  const DeleteConfirmModal = () => {
    if (!deleteConfirmId) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{t('deleteMaterial')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('confirmDeleteMaterial')}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 transition-colors"
            >
              {t('delete')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PaginationControls = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const start = (pagination.current - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.current * pagination.pageSize, pagination.total);

    return (
      <div className="sticky bottom-4 z-20 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('rowsPerPage')}:</span>
          <select
            value={pagination.pageSize}
            onChange={handlePageSizeChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {pagination.pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={pagination.current === 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <LuChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current === 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <LuChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-2">
            {t('page')} {pagination.current} {t('of')} {totalPages || 1}
          </span>
          <button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current === totalPages || totalPages === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <LuChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={pagination.current === totalPages || totalPages === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <LuChevronsRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing {start} to {end} of {pagination.total} entries
        </div>
      </div>
    );
  };

  const TableView = () => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const paginatedData = filteredMaterials;

    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <th className="px-5 py-3.5 w-14">#</th>
                  <th className="px-5 py-3.5 cursor-pointer" onClick={() => handleSort('material_name')}>
                    {t('material')} {sortConfig.field === 'material_name' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5">{t('units')}</th>
                  <th className="px-5 py-3.5">{t('stock')}</th>
                  <th className="px-5 py-3.5 text-right cursor-pointer" onClick={() => handleSort('material_cost')}>
                    {t('cost')} {sortConfig.field === 'material_cost' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5">{t('status')}</th>
                  <th className="px-5 py-3.5 cursor-pointer" onClick={() => handleSort('created_at')}>
                    {t('created')} {sortConfig.field === 'created_at' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {paginatedData.map((item, idx) => {
                  const index = start + idx + 1;
                  return (
                    <tr key={item.id} className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${item.is_deleted === 1 ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}`}>
                      <td className="px-5 py-3.5 font-bold text-slate-400">{index}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={item.material_image} alt={item.material_name} className="h-10 w-10 rounded-xl object-cover" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{item.material_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.material_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <LuScale className="text-slate-400 h-3.5 w-3.5" />
                          <span>{item.primary_unit?.toUpperCase()}</span>
                          {item.secondary_unit && (
                            <span className="text-[11px] text-slate-400 ml-1">
                              (1 {item.primary_unit?.toUpperCase()} = {item.conversion_value} {item.secondary_unit?.toUpperCase()})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1 text-xs">
                          {stockFields.map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between gap-3">
                              <span className="text-slate-400 text-[11px]">{label}:</span>
                              <span className={key === 'in_stock' ? 'font-bold text-cyan-600 dark:text-cyan-400' : 'font-semibold text-slate-700 dark:text-slate-300'}>
                                {formatQuantity(getStockValue(item, key))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                        {formatCurrency(item.material_cost)}
                      </td>
                      <td className="px-5 py-3.5"><Badge isDeleted={item.is_deleted} /></td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{formatDate(item.created_at)}</p>
                        <p className="text-[10px] text-slate-400">{dayjs(item.created_at).fromNow()}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`view/${item.id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-900/60 transition-colors"
                            title={t('view')}
                          >
                            <LuEye size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`edit/${item.id}`)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition-colors"
                            title={t('edit')}
                          >
                            <BiEdit size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                            title={t('delete')}
                          >
                            <LuTrash2 size={14} />
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
        <PaginationControls />
      </div>
    );
  };

  const CardView = () => {
    const paginatedData = filteredMaterials;

    return (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {paginatedData.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <Avatar
                    src={getImageSrc(item)}
                    alt={item.material_name}
                    className="h-full w-full rounded-none border-0 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge isDeleted={item.is_deleted} />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{item.material_name}</h3>
                    <p className="mt-0.5 text-[11px] font-mono font-medium text-slate-400 truncate">{item.material_code}</p>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {t('unit')}: <span className="font-bold text-slate-900 dark:text-white">{item.primary_unit?.toUpperCase()}</span>
                      {item.secondary_unit && (
                        <span className="text-slate-400 text-[11px]"> | 1 {item.primary_unit?.toUpperCase()} = {item.conversion_value} {item.secondary_unit?.toUpperCase()}</span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      {stockSummaryFields.slice(0, 4).map(({ key, label, tone }) => (
                        <div key={key} className="rounded-lg bg-white p-2 shadow-xs dark:bg-slate-800">
                          <p className="font-bold text-slate-400">{label}</p>
                          <p className={`mt-0.5 text-xs font-extrabold ${tone}`}>
                            {key === 'stock_in' || key === 'stock_return' ? '+' : '-'} {formatQuantity(getStockValue(item, key))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/70 p-3 text-center dark:border-cyan-900/40 dark:bg-cyan-950/30">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">{t('availableStock')}</p>
                    <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                      {formatQuantity(getStockValue(item, 'in_stock'))} {item.primary_unit?.toUpperCase()}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {t('cost')}: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.material_cost * getStockValue(item, 'in_stock'))}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => navigate(`view/${item.id}`)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50/80 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-900/50 transition-colors"
                    title={t('view')}
                  >
                    <LuEye size={13} />
                    <span>{t('view')}</span>
                  </button>
                  <button
                    onClick={() => navigate(`edit/${item.id}`)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50/80 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors"
                    title={t('edit')}
                  >
                    <BiEdit size={13} />
                    <span>{t('edit')}</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50/80 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
                    title={t('delete')}
                  >
                    <LuTrash2 size={13} />
                    <span>{t('delete')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <PaginationControls />
      </>
    );
  };

  return (
    <div className="space-y-5 p-4 md:p-6 transition-colors">
      <DeleteConfirmModal />

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20 dark:bg-cyan-700">
              <LuPackage className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t('rawMaterials')}
                </h1>
                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-400">
                  {filteredMaterials.length} {t('materials') || 'Items'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t('manageTrackRawMaterials', 'Manage and track your inventory raw materials and supplies')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onRefresh={refetch} />

            <ExportExcel
              data={exportData}
              title="Raw_Materials_Report"
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/20 transition-all"
            >
              <LuDownload className="h-3.5 w-3.5" />
              <span>{t('export')}</span>
            </ExportExcel>

            <Button
              variant='siliver'
              onClick={() => navigate('/inventories/stock-raws')}
              actionType='is_view'
              menuId={LIST_MENU_ID}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <LuList className="h-3.5 w-3.5" />
              <span>{t('stockList')}</span>
            </Button>

            <Button
              variant='save'
              onClick={() => navigate('/inventories/stock-raws/add')}
              actionType='is_modify'
              menuId={LIST_MENU_ID}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
            >
              <LuPlus className="h-3.5 w-3.5" />
              <span>{t('stockIn')}</span>
            </Button>

            <Link to="create">
              <Button
                variant='save'
                actionType='is_modify'
                menuId={MENU_ID}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/20 transition-all"
              >
                <LuPlus className="h-3.5 w-3.5" />
                <span>{t('new')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4 flex flex-col items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 md:flex-row">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
            <div className="relative w-full sm:w-80">
              <LuSearch className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('searchRawMaterialsLong', "Search by name, code or description...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-medium text-slate-900 outline-none transition-all focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white"
              >
                <option value="all">{t('allCategories')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60">
            <button
              onClick={() => setViewMode('table')}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LuList size={14} />
              <span>{t('table')}</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all ${
                viewMode === 'card'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/20 dark:bg-cyan-500'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LuGrid3X3 size={14} />
              <span>{t('card')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {loading || queryLoading ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('loading')}...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
              <LuPackage className="h-9 w-9" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('noMaterialsFound')}</h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {searchTerm || selectedCategory !== 'all' || showDeleted
                ? t('noMaterialsMatchFilters')
                : t('startAddingFirstMaterial')}
            </p>
            {!searchTerm && selectedCategory === 'all' && !showDeleted && (
              <Link to="create" className="mt-4">
                <button className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 transition-all">
                  <LuPlus /> {t('addYourFirstMaterial')}
                </button>
              </Link>
            )}
          </div>
        ) : (
          viewMode === 'table' ? <TableView /> : <CardView />
        )}
      </div>
    </div>
  );
};

export default RawMaterials;
