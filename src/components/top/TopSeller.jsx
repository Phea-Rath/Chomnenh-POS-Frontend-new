import React, { useState } from 'react';
import { useGetTopSellerQuery } from "@/features/sales/ordersSlice";
import { useReportText } from '../Reports/reportText';
import { FiTrendingUp, FiDollarSign, FiPieChart, FiUser, FiAward } from 'react-icons/fi';
import { FaCrown, FaTrophy } from 'react-icons/fa';
import { Spin, Segmented } from 'antd';
import { motion } from 'framer-motion';
import { getToken } from '@/utils/tokenStore';

const TopSeller = () => {
  const { rt } = useReportText();
  const token = getToken();
  const [filter, setFilter] = useState('price');

  const { data: response, isLoading, isFetching } = useGetTopSellerQuery({
    token,
    filter
  });

  const sellers = response?.data || [];

  const formatUSD = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="space-y-5 p-4 md:p-6 transition-colors min-h-screen">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <FaTrophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {rt("Top 3 Best Sellers")}
                </h1>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                  Top Performers
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {rt("Recognition of top performing sales staff members")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{rt("Sort By")}:</span>
            <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60">
              <Segmented
                options={[
                  {
                    label: rt('By Revenue'),
                    value: 'price',
                    icon: <FiDollarSign className="inline mb-0.5 mr-1" />
                  },
                  {
                    label: rt('By Quantity'),
                    value: 'quantity',
                    icon: <FiPieChart className="inline mb-0.5 mr-1" />
                  }
                ]}
                value={filter}
                onChange={setFilter}
                className="segmented-dark !bg-transparent text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading || isFetching ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <Spin size="large" />
          <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{rt("Loading performance data...")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {sellers.map((seller, index) => {
            const isChampion = index === 0;
            const isRunnerUp = index === 1;

            return (
              <motion.div
                key={seller.created_by || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-xl dark:bg-slate-900 ${
                  isChampion
                    ? 'border-amber-400/80 bg-amber-50/10 dark:border-amber-500/60 dark:bg-amber-950/20 ring-4 ring-amber-400/10 md:-translate-y-2'
                    : isRunnerUp
                    ? 'border-slate-300 dark:border-slate-700'
                    : 'border-amber-700/30 dark:border-amber-800/40'
                }`}
              >
                {/* Ranking Badge */}
                <div className="absolute top-4 right-4">
                  {isChampion ? (
                    <FaCrown className="h-7 w-7 text-amber-400 animate-pulse" />
                  ) : (
                    <FiAward className={`h-6 w-6 ${isRunnerUp ? 'text-slate-400' : 'text-amber-700'}`} />
                  )}
                </div>

                <div className="flex flex-col items-center text-center w-full">
                  {/* User Avatar Frame */}
                  <div className="relative mb-4">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 shadow-md ${
                      isChampion
                        ? 'border-amber-400 bg-amber-100 text-amber-600 dark:border-amber-500 dark:bg-amber-950/60 dark:text-amber-400'
                        : isRunnerUp
                        ? 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-amber-700/40 bg-amber-100/50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-500'
                    }`}>
                      <FiUser className="h-10 w-10" />
                    </div>

                    <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase shadow-sm ${
                      isChampion
                        ? 'bg-amber-400 text-slate-950'
                        : isRunnerUp
                        ? 'bg-slate-300 text-slate-900 dark:bg-slate-700 dark:text-white'
                        : 'bg-amber-700 text-white'
                    }`}>
                      #{index + 1} {isChampion ? rt("Champion") : isRunnerUp ? rt("2nd Place") : rt("3rd Place")}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {seller.username}
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">
                    {isChampion ? rt("Gold Performer") : isRunnerUp ? rt("Silver Performer") : rt("Bronze Performer")}
                  </p>

                  {/* Performance Stats */}
                  <div className="w-full space-y-2.5">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">{rt("Total Revenue")}</span>
                        <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">{formatUSD(seller.order_total)}</span>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        <FiDollarSign size={18} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/40">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">{rt("Units Sold")}</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{seller.quantity}</span>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FiPieChart size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex w-full items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-bold text-slate-400 dark:border-slate-800">
                  <FiTrendingUp className="text-emerald-500" />
                  <span>{rt("Current Rank")}: <span className="text-slate-900 dark:text-white">#{index + 1}</span></span>
                </div>
              </motion.div>
            );
          })}

          {sellers.length === 0 && (
            <div className="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <FiAward className="h-9 w-9" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{rt("No Data Available")}</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                {rt("There is currently not enough sales data to generate the top performer rankings for the selected period.")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopSeller;
