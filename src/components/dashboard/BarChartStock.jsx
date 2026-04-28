import React, { useContext, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { stockChartContext } from './Analysis';
import { useTranslation } from 'react-i18next';

const CustomTooltip = ({ active, payload, label }) => {
    const { t } = useTranslation();
    const isVisible = active && payload && payload.length;
    
    const getTranslationKey = (name) => {
        return name.split(' ').map((word, index) => 
            index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    };

    return (
        <div className="custom-tooltip bg-white dark:bg-gray-800 p-3 shadow-lg border border-gray-100 dark:border-gray-700 rounded-lg" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
            {isVisible && (
                <>
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">{t("stockMovementAnalysis")} - {label}</p>
                    {payload.map((item, index) => (
                        <div key={index} className="flex justify-between items-center gap-4 text-sm mb-1">
                            <span style={{ color: item.fill || item.color }}>{t(getTranslationKey(item.name))} :</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};

const BarChartStock = () => {
    const { apiData } = useContext(stockChartContext);
    const [data, setData] = useState([]);
    const { t } = useTranslation();

    const getTranslationKey = (name) => {
        return name.split(' ').map((word, index) => 
            index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    };

    useEffect(() => {
        if (apiData) {
            setData(apiData?.data?.month || []);
        }
    }, [apiData])

    return (
        <ResponsiveContainer width="100%" height="100%" className='text-xs'>
            <BarChart
                width={'100%'}
                height={'100%'}
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <defs>
                    <linearGradient id="gradient-pv" x1="100%" y1="0%" x2="100%" y2="100%">
                        <stop offset="5%" stopColor="#f884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f8f4f8" stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-700" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', opacity: 0.4 }} />
                <Legend 
                    formatter={(value) => <span className="text-gray-700 dark:text-gray-300 capitalize">{t(getTranslationKey(value))}</span>}
                />
                <Bar name="Stock Return" dataKey="return" barSize={12} radius={[4, 4, 0, 0]} fill="#3B82F6" />
                <Bar name="Stock In" dataKey="in" barSize={12} radius={[4, 4, 0, 0]} fill="#10B981" />
                <Bar name="Stock Out" dataKey="out" barSize={12} radius={[4, 4, 0, 0]} fill="#EF4444" />
                <Bar name="Stock Sale" dataKey="sale" barSize={12} radius={[4, 4, 0, 0]} fill="#8B5CF6" />
                <Bar name="Stock Waste" dataKey="waste" barSize={12} radius={[4, 4, 0, 0]} fill="#F59E0B" />
            </BarChart>
        </ResponsiveContainer >

    );
};

export default BarChartStock;
