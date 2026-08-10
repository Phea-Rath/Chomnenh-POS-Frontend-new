import React from 'react';
import { Link, useParams } from 'react-router';
import { FaArrowLeft, FaEdit, FaMapMarkerAlt, FaPhone, FaEnvelope, FaInfoCircle, FaTruck } from 'react-icons/fa';
import { FaMapLocationDot } from "react-icons/fa6";
import { useGetSupplierByIdQuery } from "@/features/purchases/suppliesSlice";
import { Skeleton, Empty } from 'antd';
import { motion } from 'framer-motion';
import { getToken } from '@/utils/tokenStore';

const SupplierDetail = () => {
  const { id } = useParams();
  const token = getToken();
  const { data: supplier, isLoading, error } = useGetSupplierByIdQuery({ id, token });

  const formatAddress = (supplier) => {
    if (!supplier) return 'N/A';
    const parts = [
      supplier?.villages,
      supplier?.communes,
      supplier?.districts,
      supplier?.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : supplier?.supplier_address || 'N/A';
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

  if (error || !supplier?.data) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
          <Empty description={<span className="text-slate-500 dark:text-slate-400">Supplier not found</span>} />
          <Link
            to="/suppliers"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 transition-colors"
          >
            <FaArrowLeft /> Back to Suppliers
          </Link>
        </div>
      </div>
    );
  }

  const supplierData = supplier.data;

  return (
    <div className="space-y-6 p-4 md:p-6 transition-colors">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/suppliers"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors mb-2"
            >
              <FaArrowLeft className="h-3 w-3" />
              <span>Back to Suppliers</span>
            </Link>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Supplier Profile Details
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              to={`/suppliers/edit/${supplierData.supplier_id}`}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              <FaEdit className="h-3.5 w-3.5" />
              <span>Edit Supplier</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Avatar & Quick Actions Card */}
        <div className="space-y-4 lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative bg-slate-900 p-6 text-center text-white dark:bg-slate-950">
              <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-2xl border-4 border-white/20 shadow-xl">
                {supplierData.image ? (
                  <img
                    src={supplierData.image}
                    alt={supplierData.supplier_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 font-extrabold text-4xl text-white">
                    {supplierData.supplier_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-lg font-extrabold tracking-tight text-white">
                {supplierData.supplier_name}
              </h2>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/30">
                ID: #{supplierData.supplier_id}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Supplier ID</span>
                <span className="font-bold text-slate-900 dark:text-white">#{supplierData.supplier_id}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/50">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Date Created</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {supplierData.created_at ? new Date(supplierData.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(supplierData))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50/80 py-2.5 text-xs font-bold text-cyan-700 hover:bg-cyan-100 dark:border-cyan-900/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-900/50 transition-all"
            >
              <FaMapLocationDot className="h-4 w-4" />
              <span>Open Google Maps</span>
            </a>
            <Link
              to={`/suppliers/edit/${supplierData.supplier_id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              <FaEdit className="h-4 w-4" />
              <span>Edit Supplier Info</span>
            </Link>
          </motion.div>
        </div>

        {/* Right Column - Detailed Info Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="h-3.5 w-1 rounded-full bg-cyan-500" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <FaPhone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Phone Number</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{supplierData.supplier_tel || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-800/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <FaEnvelope className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">Email Address</p>
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white mt-0.5">{supplierData.supplier_email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Description Section if exists */}
          {supplierData.description && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
            >
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <FaInfoCircle className="h-3.5 w-3.5 text-cyan-500" />
                Description
              </h3>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800/80 dark:bg-slate-800/40">
                <p className="text-xs leading-relaxed italic text-slate-700 dark:text-slate-300">
                  "{supplierData.description}"
                </p>
              </div>
            </motion.div>
          )}

          {/* Location Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="h-3.5 w-1 rounded-full bg-amber-500" />
              Location Details
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Province</p>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{supplierData.provinces || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase text-slate-400">District</p>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{supplierData.districts || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Commune</p>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{supplierData.communes || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Village</p>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">{supplierData.villages || 'N/A'}</p>
              </div>
            </div>
          </motion.div>

          {/* Full Address Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <div className="h-3.5 w-1 rounded-full bg-rose-500" />
              Full Address
            </h3>
            <div className="flex items-start gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/30 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <FaMapMarkerAlt className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                  {supplierData.supplier_address || 'N/A'}
                </p>
                {formatAddress(supplierData) !== 'N/A' && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatAddress(supplierData)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
