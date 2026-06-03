import React, { useState } from 'react';
import { useGetTopSellerQuery } from '../../../app/Features/ordersSlice';
import { useReportText } from '../Reports/reportText';
import { useOutletsContext } from '../../layouts/Management';
import { FiTrendingUp, FiDollarSign, FiPieChart, FiFilter, FiUser, FiAward } from 'react-icons/fi';
import { Spin, Segmented } from 'antd';

const TopSeller = () => {
    const { rt } = useReportText();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem('token');
    
    const [filter, setFilter] = useState('price'); // 'price' or 'quantity'

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
        <div className="report-page min-h-screen bg-transparent p-2 md:p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{rt("Top 3 Best Sellers")}</h1>
                        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">{rt("Recognition of top performing staff members")}</p>
                    </div>

                    <div className=" p-2 flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 ml-2">{rt("Sort By")}:</span>
                        <Segmented
    options={[
        {
            label: rt('By Revenue'),
            value: 'price',
            icon: <FiDollarSign className="inline mb-1" />
        },
        {
            label: rt('By Quantity'),
            value: 'quantity',
            icon: <FiPieChart className="inline mb-1" />
        }
    ]}
    value={filter}
    onChange={setFilter}
    className="segmented-dark !bg-transparent"
/>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading || isFetching ? (
                    <div className="flex justify-center items-center py-20">
                        <Spin size="large" tip={rt("Loading performance data...")} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {sellers.map((seller, index) => (
                            <div 
                                key={seller.created_by} 
                                className={`relative bg-primary rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center transition-all duration-300 hover:shadow-md ${
                                    index === 0 ? 'border-t-4 border-t-yellow-400 scale-105 z-10' : 
                                    index === 1 ? 'border-t-4 border-t-slate-300' : 
                                    'border-t-4 border-t-orange-400'
                                }`}
                            >
                                {/* Ranking Badge */}
                                <div className="absolute top-4 right-4">
                                    <FiAward className={`text-3xl ${
                                        index === 0 ? 'text-yellow-400' : 
                                        index === 1 ? 'text-slate-300' : 
                                        'text-orange-400'
                                    }`} />
                                </div>

                                {/* User Avatar Placeholder */}
                                <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                                    <FiUser size={40} className="text-slate-400" />
                                    {index === 0 && (
                                        <div className="absolute -bottom-1 bg-yellow-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                            {rt("Champion")}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{seller.username}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-wider font-semibold">
                                    {index === 0 ? rt("Gold Performer") : index === 1 ? rt("Silver Performer") : rt("Bronze Performer")}
                                </p>

                                {/* Performance Stats */}
                                <div className="w-full space-y-3">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{rt("Total Revenue")}</span>
                                            <span className="text-base font-bold text-blue-600 dark:text-blue-400">{formatUSD(seller.order_total)}</span>
                                        </div>
                                        <FiDollarSign className="text-slate-300" size={20} />
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{rt("Units Sold")}</span>
                                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{seller.quantity}</span>
                                        </div>
                                        <FiPieChart className="text-slate-300" size={20} />
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800 w-full flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <FiTrendingUp className="text-emerald-500" />
                                    <span>{rt("Current Rank")}: <span className="font-bold text-slate-600 dark:text-slate-300">#{index + 1}</span></span>
                                </div>
                            </div>
                        ))}

                        {sellers.length === 0 && (
                            <div className="col-span-full bg-primary rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-16 text-center">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FiFilter size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{rt("No Data Available")}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                    {rt("There is currently not enough sales data to generate the top performer rankings for the selected period.")}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Styles to match IncomeStatement */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-segmented.ant-segmented {
                    background: transparent;
                    padding: 2px;
                }
                .custom-segmented .ant-segmented-item-selected {
                    background: ${darkMode ? '#1e293b' : '#ffffff'} !important;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                }
                .custom-segmented .ant-segmented-item-label {
                    font-size: 12px !important;
                    font-weight: 500 !important;
                    padding: 0 12px !important;
                }
            `}} />
        </div>
    );
};

export default TopSeller;
