import React, { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaEdit,
  FaExchangeAlt,
  FaCalendarAlt,
  FaUser,
  FaHashtag,
  FaCheckCircle,
  FaBalanceScale
} from 'react-icons/fa';
import { LuPackage } from 'react-icons/lu';
import { useNavigate, useParams, Link } from 'react-router';
import { useGetRawMaterialByIdQuery } from "@/features/stocks/RawMaterialSlice";
import { useTranslation } from 'react-i18next';
import { Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { getToken } from '@/utils/tokenStore';

const RawMaterialDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const token = getToken();
  const { data, isLoading, error } = useGetRawMaterialByIdQuery({ id, token });
  const [material, setMaterial] = useState({});

  useEffect(() => {
    if (data?.data) {
      setMaterial(data.data);
    }
  }, [data]);

  const formatQuantity = (amount) => Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Skeleton active avatar paragraph={{ rows: 6 }} />
        </div>
      </div>
    );
  }

  if (error || !material?.id) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
            <LuPackage className="h-9 w-9" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Raw Material Not Found</h3>
          <Link
            to="/raw_materials"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 transition-colors"
          >
            <FaArrowLeft /> Back to Raw Materials
          </Link>
        </div>
      </div>
    );
  }

  const secondaryStockValue = (parseFloat(material?.in_stock || 0) * parseFloat(material?.conversion_value || 1));

  return (
    <div className="space-y-6 p-4 md:p-6 transition-colors">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors mb-2"
            >
              <FaArrowLeft className="h-3 w-3" />
              <span>{t('backToInventory', 'Back to Raw Materials')}</span>
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Raw Material Profile Details
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(`/raw_materials/edit/${id}`)}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 transition-all dark:bg-cyan-700 dark:hover:bg-cyan-800"
            >
              <FaEdit className="h-3.5 w-3.5" />
              <span>{t('editMaterial', 'Edit Material')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Avatar & Quick Stock Summary Card */}
        <div className="space-y-4 lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative bg-slate-900 p-6 text-center text-white dark:bg-slate-950">
              <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border-4 border-white/20 shadow-xl bg-slate-800 flex items-center justify-center">
                {material?.material_image ? (
                  <img
                    src={material.material_image}
                    alt={material.material_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <LuPackage className="h-12 w-12 text-cyan-400" />
                )}
              </div>
              <h2 className="mt-4 text-lg font-extrabold tracking-tight text-white">
                {material?.material_name}
              </h2>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30 font-mono">
                {material?.material_code || 'N/A'}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 p-4 text-center dark:border-cyan-900/40 dark:bg-cyan-950/30">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  {t('currentStock', 'Current Stock')}
                </p>
                <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatQuantity(material?.in_stock)} <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{material?.primary_unit?.toUpperCase()}</span>
                </p>
                {material?.secondary_unit && (
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    ≈ {formatQuantity(secondaryStockValue)} {material?.secondary_unit?.toUpperCase()}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Material Cost</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(material?.material_cost)}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Status</span>
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  {material?.is_deleted === 1 ? t('deleted') : t('active')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Detailed Info Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Unit Conversion Display */}
          {material?.secondary_unit && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <FaBalanceScale className="h-3.5 w-3.5 text-cyan-500" />
                {t('unitConversion', 'Unit Conversion Ratio')}
              </h3>

              <div className="flex items-center justify-around rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">{t('primary', 'Primary Unit')}</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">1 {material?.primary_unit?.toUpperCase()}</p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <FaExchangeAlt className="h-4 w-4" />
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">{t('secondary', 'Secondary Unit')}</p>
                  <p className="mt-1 text-lg font-extrabold text-cyan-600 dark:text-cyan-400">
                    {material?.conversion_value} {material?.secondary_unit?.toUpperCase()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* General Information Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="h-3.5 w-1 rounded-full bg-cyan-500" />
              {t('generalInformation', 'General Information')}
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <FaHashtag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{t('materialID', 'Material ID')}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">#{material?.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FaUser className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{t('createdBy', 'Created By')}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{material?.create_by_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <FaCalendarAlt className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{t('registrationDate', 'Registration Date')}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{material?.created_at || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                  <FaCheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{t('lastUpdate', 'Last Update')}</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{material?.updated_at || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RawMaterialDetail;
