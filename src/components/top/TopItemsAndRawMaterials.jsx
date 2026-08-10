import React, { useState, useRef } from 'react';
import { useGetTopItemsQuery } from "@/features/products/itemsSlice";
import { useGetTopRawMaterialsQuery } from "@/features/stocks/RawMaterialSlice";
import { useReportText } from '../Reports/reportText';
import { DatePicker, Spin, Segmented, Select, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { 
  FiPrinter, 
  FiDownload, 
  FiFilter, 
  FiAlertTriangle, 
  FiDollarSign, 
  FiPieChart, 
  FiPackage, 
  FiBox
} from 'react-icons/fi';
import { FaCrown, FaTrophy } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { LiaTrophySolid } from 'react-icons/lia';
import { getToken } from '@/utils/tokenStore';
import { motion } from 'framer-motion';

const TopItemsAndRawMaterials = () => {
  const { rt } = useReportText();
  const token = getToken();

  // State for filters
  const [viewType, setViewType] = useState('items'); // 'items' or 'materials'
  const [filterBy, setFilterBy] = useState('price'); // 'price' or 'quantity'
  const [limit, setLimit] = useState(5);
  const [dates, setDates] = useState({
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD')
  });

  // Operation states
  const [itemOperation, setItemOperation] = useState('sale');
  const [materialOperation, setMaterialOperation] = useState('purchase');

  // Queries
  const { 
    data: itemsResponse, 
    isLoading: itemsLoading, 
    isFetching: itemsFetching,
    refetch: refetchItems 
  } = useGetTopItemsQuery({
    token,
    operation: itemOperation,
    filter: filterBy,
    limit,
    start_date: dates.start_date,
    end_date: dates.end_date
  }, { skip: viewType !== 'items' });

  const { 
    data: materialsResponse, 
    isLoading: materialsLoading, 
    isFetching: materialsFetching,
    refetch: refetchMaterials 
  } = useGetTopRawMaterialsQuery({
    token,
    operation: materialOperation,
    filter: filterBy,
    limit,
    start_date: dates.start_date,
    end_date: dates.end_date
  }, { skip: viewType !== 'materials' });

  const reportData = viewType === 'items' ? itemsResponse?.data : materialsResponse?.data;
  const isLoading = viewType === 'items' ? itemsLoading : materialsLoading;
  const isFetching = viewType === 'items' ? itemsFetching : materialsFetching;
  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    contentRef: reportRef,
  });

  const exportToExcel = () => {
    if (!reportData || reportData.length === 0) return;
    
    const title = viewType === 'items' ? rt('Top Finished Items') : rt('Top Raw Materials');
    const opName = viewType === 'items' ? itemOperation : materialOperation;
    
    const data = [
      [title],
      [rt('Operation'), opName.toUpperCase()],
      [rt('Date Range'), `${dates.start_date} - ${dates.end_date}`],
      [rt('Ranked By'), filterBy === 'price' ? rt('Value') : rt('Quantity')],
      [],
      [rt('Rank'), rt('Name'), rt('Quantity'), rt('Total Value ($)')],
      ...reportData.map((item, index) => [
        index + 1,
        item.item_name || item.material_name,
        item.quantity,
        item.price
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Performers");
    XLSX.writeFile(wb, `Top_${viewType}_${dates.start_date}_to_${dates.end_date}.xlsx`);
  };

  const formatUSD = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const getOperationLabel = (op) => {
    const labels = {
      sale: rt('Sales / Best Sellers'),
      purchase: rt('Purchases'),
      stock: rt('Stock In'),
      production: rt('Production')
    };
    return labels[op] || op;
  };

  return (
    <div className="space-y-5 p-4 md:p-6 transition-colors min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; font-family: 'Siemreap', 'Poppins', sans-serif; }
          .print-container { font-size: 12px !important; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20 dark:bg-cyan-700">
              <FaTrophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {rt("Top Performers Analytics")}
                </h1>
                <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:border-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-400">
                  {viewType === 'items' ? rt('Finished Items') : rt('Raw Materials')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {rt("Analyze top items and materials by value or volume")}
              </p>
            </div>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60 no-print">
            <Segmented
              options={[
                { label: rt('Finished Items'), value: 'items', icon: <FiPackage className="inline mb-0.5 mr-1" /> },
                { label: rt('Raw Materials'), value: 'materials', icon: <FiBox className="inline mb-0.5 mr-1" /> }
              ]}
              value={viewType}
              onChange={setViewType}
              className="segmented-dark !bg-transparent text-xs"
            />
          </div>
        </div>

        {/* Filters Controls Section */}
        <div className="mt-4 grid grid-cols-1 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 no-print">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{rt("Operation Type")}</label>
            <Select
              className="w-full"
              value={viewType === 'items' ? itemOperation : materialOperation}
              onChange={(val) => viewType === 'items' ? setItemOperation(val) : setMaterialOperation(val)}
              options={viewType === 'items' ? [
                { label: rt('Sales'), value: 'sale' },
                { label: rt('Purchases'), value: 'purchase' },
                { label: rt('Stock In'), value: 'stock' },
                { label: rt('Production'), value: 'production' }
              ] : [
                { label: rt('Purchases'), value: 'purchase' },
                { label: rt('Stock In'), value: 'stock' },
                { label: rt('Production Consumption'), value: 'production' }
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{rt("Start Date")}</label>
            <DatePicker
              className="w-full date-picker"
              value={dayjs(dates.start_date)}
              onChange={(date) => setDates(prev => ({ ...prev, start_date: date ? date.format('YYYY-MM-DD') : '' }))}
              allowClear={false}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{rt("End Date")}</label>
            <DatePicker
              className="w-full date-picker"
              value={dayjs(dates.end_date)}
              onChange={(date) => setDates(prev => ({ ...prev, end_date: date ? date.format('YYYY-MM-DD') : '' }))}
              allowClear={false}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{rt("Sort Criteria")}</label>
            <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-800/60">
              <Segmented
                options={[
                  { label: rt('Value'), value: 'price', icon: <FiDollarSign className="inline mb-0.5 mr-1" /> },
                  { label: rt('Qty'), value: 'quantity', icon: <FiPieChart className="inline mb-0.5 mr-1" /> }
                ]}
                value={filterBy}
                onChange={setFilterBy}
                className="segmented-dark !bg-transparent text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{rt("Limit")}</label>
            <InputNumber 
              min={1} 
              max={50} 
              value={limit} 
              onChange={setLimit} 
              className="w-full h-9 flex items-center rounded-xl"
            />
          </div>

          <div className="flex items-end gap-1.5">
            <button
              onClick={exportToExcel}
              title="Export to Excel"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
            >
              <FiDownload size={14} />
            </button>
            <button
              onClick={handlePrint}
              title="Print Report"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <FiPrinter size={14} />
            </button>
            <button
              onClick={() => viewType === 'items' ? refetchItems() : refetchMaterials()}
              disabled={isFetching}
              title="Refresh Filter"
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-cyan-600 text-xs font-bold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              <FiFilter size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Printable Content Container */}
      <div className="print-container" ref={reportRef}>
        {/* Top 3 Visual Podium Cards */}
        {reportData && reportData.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-6">
            {reportData.slice(0, 3).map((item, index) => {
              const isChampion = index === 0;
              const isRunnerUp = index === 1;

              return (
                <motion.div
                  key={item.item_id || item.material_id || index}
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
                  <div className="absolute top-4 right-4">
                    {isChampion ? (
                      <FaCrown className="h-7 w-7 text-amber-400 animate-pulse" />
                    ) : (
                      <LiaTrophySolid className={`h-7 w-7 ${isRunnerUp ? 'text-slate-300' : 'text-amber-700'}`} />
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center w-full">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4 border-4 border-white dark:border-slate-900 shadow-md">
                      {viewType === 'items' ? <FiPackage size={32} className="text-cyan-600 dark:text-cyan-400" /> : <FiBox size={32} className="text-emerald-600 dark:text-emerald-400" />}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 px-2">
                      {item.item_name || item.material_name}
                    </h3>
                    <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Rank #{index + 1}
                    </span>

                    <div className="mt-4 w-full space-y-2 text-xs">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                        <span className="font-semibold text-slate-400">{rt("Total Value")}</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{formatUSD(item.price)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                        <span className="font-semibold text-slate-400">{rt("Quantity")}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detailed Performance Table */}
        {reportData && reportData.length > 0 && !isLoading && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                {rt("Performance Breakdown")} - {getOperationLabel(viewType === 'items' ? itemOperation : materialOperation)}
              </h2>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {rt("Showing top")} {reportData.length} {rt("results")}
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-400">
                    <th className="px-6 py-3.5 w-16">{rt("Rank")}</th>
                    <th className="px-6 py-3.5">{rt("Name")}</th>
                    <th className="px-6 py-3.5 text-right">{rt("Quantity")}</th>
                    <th className="px-6 py-3.5 text-right">{rt("Total Value")}</th>
                    <th className="px-6 py-3.5 text-right">{rt("Contribution")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {reportData.map((item, index) => {
                    const totalOfAll = reportData.reduce((acc, curr) => acc + Number(filterBy === 'price' ? curr.price : curr.quantity), 0);
                    const currentVal = Number(filterBy === 'price' ? item.price : item.quantity);
                    const percentage = totalOfAll > 0 ? ((currentVal / totalOfAll) * 100).toFixed(1) : 0;

                    return (
                      <tr key={item.item_id || item.material_id || index} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-3.5">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${
                            index < 3 ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                          {item.item_name || item.material_name}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatUSD(item.price)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="h-2 w-20 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                              <div 
                                className="h-full bg-cyan-600 dark:bg-cyan-500 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 min-w-[36px]">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!reportData || reportData.length === 0) && !isLoading && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
            <FiAlertTriangle className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{rt("No Data Found")}</h3>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
              {rt("Adjust your filters or date range to see the top performing items or materials for this operation.")}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <Spin size="large" />
            <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{rt("Calculating performance analytics...")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopItemsAndRawMaterials;
