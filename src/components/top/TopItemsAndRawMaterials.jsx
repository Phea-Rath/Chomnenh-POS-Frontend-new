import React, { useState, useRef } from 'react';
import { useGetTopItemsQuery } from '../../../app/Features/itemsSlice';
import { useGetTopRawMaterialsQuery } from '../../../app/Features/RawMaterialSlice';
import { useReportText } from '../Reports/reportText';
import { useOutletsContext } from '../../layouts/Management';
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
    FiBox, 
    FiTrendingUp,
    FiAward
} from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { LiaTrophySolid } from 'react-icons/lia';

const TopItemsAndRawMaterials = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');

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
        <div className="report-page min-h-screen bg-transparent p-2 md:p-4">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; font-family: 'Siemreap', 'Poppins', sans-serif; }
                    .print-container { font-size: 12px !important; }
                    .no-print { display: none !important; }
                }
            `}} />

            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {rt("Top Performers Analytics")}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
                            {rt("Analyze top items and materials by value or volume")}
                        </p>
                    </div>

                    <div className="flex bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-1">
                        <Segmented
                            options={[
                                { label: rt('Finished Items'), value: 'items', icon: <FiPackage className="inline mb-1" /> },
                                { label: rt('Raw Materials'), value: 'materials', icon: <FiBox className="inline mb-1" /> }
                            ]}
                            value={viewType}
                            onChange={setViewType}
                            className="segmented-dark"
                        />
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 text-xs mb-6 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("Operation Type")}</label>
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

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("Start Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={dayjs(dates.start_date)}
                                onChange={(date) => setDates(prev => ({ ...prev, start_date: date ? date.format('YYYY-MM-DD') : '' }))}
                                allowClear={false}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("End Date")}</label>
                            <DatePicker
                                className="w-full date-picker"
                                value={dayjs(dates.end_date)}
                                onChange={(date) => setDates(prev => ({ ...prev, end_date: date ? date.format('YYYY-MM-DD') : '' }))}
                                allowClear={false}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("Sort Criteria")}</label>
                            <Segmented
                                options={[
                                    { label: rt('Value'), value: 'price', icon: <FiDollarSign className="inline mb-1" /> },
                                    { label: rt('Qty'), value: 'quantity', icon: <FiPieChart className="inline mb-1" /> }
                                ]}
                                value={filterBy}
                                onChange={setFilterBy}
                                className="segmented-dark"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-medium text-slate-600 dark:text-slate-300">{rt("Limit")}</label>
                            <InputNumber 
                                min={1} 
                                max={50} 
                                value={limit} 
                                onChange={setLimit} 
                                className="w-full h-10 flex items-center"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={exportToExcel}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 h-10 transition-colors"
                            >
                                <FiDownload size={14} />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-md hover:bg-slate-700 h-10 transition-colors"
                            >
                                <FiPrinter size={14} />
                            </button>
                            <button
                                onClick={() => viewType === 'items' ? refetchItems() : refetchMaterials()}
                                disabled={isFetching}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 h-10 transition-colors"
                            >
                                <FiFilter size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="print-container" ref={reportRef}>
                    {/* Visual Ranking Grid */}
                    {reportData && reportData.length > 0 && !isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {reportData.slice(0, 3).map((item, index) => (
                                <div 
                                    key={item.item_id || item.material_id} 
                                    className={`relative bg-primary rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center transition-all duration-300 hover:shadow-md ${
                                        index === 0 ? 'border-t-4 border-t-yellow-400 scale-105 z-10' : 
                                        index === 1 ? 'border-t-4 border-t-slate-300' : 
                                        'border-t-4 border-t-orange-400'
                                    }`}
                                >
                                    <div className="absolute top-4 right-4">
                                        <LiaTrophySolid className={`text-3xl ${
                                            index === 0 ? 'text-yellow-400' : 
                                            index === 1 ? 'text-slate-300' : 
                                            'text-orange-400'
                                        }`} />
                                    </div>

                                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm overflow-hidden">
                                        {viewType === 'items' ? <FiPackage size={32} className="text-blue-500" /> : <FiBox size={32} className="text-emerald-500" />}
                                    </div>

                                    <h3 className="text-center font-bold text-slate-900 dark:text-white mb-1 line-clamp-1 px-2">
                                        {item.item_name || item.material_name}
                                    </h3>
                                    
                                    <div className="mt-4 w-full space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{rt("Total Value")}</span>
                                            <span className="font-bold text-blue-600">{formatUSD(item.price)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">{rt("Quantity")}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Detailed List */}
                    {reportData && reportData.length > 0 && !isLoading && (
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                                    {rt("Performance Breakdown")} - {getOperationLabel(viewType === 'items' ? itemOperation : materialOperation)}
                                </h2>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {rt("Showing top")} {reportData.length} {rt("results")}
                                </span>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-16">{rt("Rank")}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{rt("Name")}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{rt("Quantity")}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{rt("Total Value")}</th>
                                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">{rt("Contribution")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {reportData.map((item, index) => {
                                            const totalOfAll = reportData.reduce((acc, curr) => acc + Number(filterBy === 'price' ? curr.price : curr.quantity), 0);
                                            const currentVal = Number(filterBy === 'price' ? item.price : item.quantity);
                                            const percentage = totalOfAll > 0 ? ((currentVal / totalOfAll) * 100).toFixed(1) : 0;

                                            return (
                                                <tr key={item.item_id || item.material_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                                                            index < 3 ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                        }`}>
                                                            {index + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {item.item_name || item.material_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.quantity}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{formatUSD(item.price)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-blue-500 rounded-full" 
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-blue-600 min-w-[35px]">{percentage}%</span>
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
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-16 text-center">
                            <FiAlertTriangle size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{rt("No Data Found")}</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                {rt("Adjust your filters or date range to see the top performing items or materials for this operation.")}
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-16 text-center">
                            <Spin size="large" />
                            <p className="mt-4 text-slate-500 dark:text-slate-400">{rt("Calculating performance analytics...")}</p>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-segmented-main.ant-segmented { background: transparent; padding: 2px; }
                .custom-segmented-main .ant-segmented-item-selected {
                    background: ${darkMode ? '#1e293b' : '#ffffff'} !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                }
                .custom-segmented-filter.ant-segmented { background: #f8fafc; border: 1px solid #e2e8f0; height: 40px; }
                .dark .custom-segmented-filter.ant-segmented { background: #0f172a; border-color: #1e293b; }
                .custom-segmented-filter .ant-segmented-item { line-height: 38px; }
            `}} />
        </div>
    );
};

export default TopItemsAndRawMaterials;
