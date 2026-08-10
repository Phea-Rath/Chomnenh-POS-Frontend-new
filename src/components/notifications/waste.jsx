import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllWasteQuery } from "@/features/system/notificationSlice";
import { FaExclamationTriangle, FaBoxes, FaClock, FaChevronRight } from 'react-icons/fa';
import { Progress } from 'antd';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { getToken } from '@/utils/tokenStore';

// Skeleton loader for list items
const SkeletonItem = () => (
    <div className="border-b border-gray-200 dark:border-gray-700 p-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

const Waste = () => {
    const { t } = useTranslation();
    const token = getToken();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const { data: dataWaste, isLoading } = useGetAllWasteQuery(token);

    useEffect(() => {
        setData(dataWaste?.data || []);
    }, [dataWaste]);

    const totalTaken = data.reduce((sum, item) => sum + parseInt(item.taken_quantity || 0), 0);
    const totalExpired = data.reduce((sum, item) => sum + parseInt(item.expired_quantity || 0), 0);

    const getTimeRemaining = (expireDate) => {
        if (!expireDate) return null;
        const now = moment().startOf('day');
        const end = moment(expireDate).startOf('day');
        const diffDays = end.diff(now, 'days');

        if (diffDays <= 0) {
            const absDiff = Math.abs(diffDays);
            if (absDiff === 0) return { label: t('broken'), color: 'text-red-600', subLabel: t('expired') };
            
            if (absDiff < 7) return { label: t('broken'), color: 'text-red-600', subLabel: `${absDiff} ${absDiff === 1 ? t('day') : t('days')} ${t('ago')}` };
            if (absDiff < 30) {
                const weeks = Math.floor(absDiff / 7);
                return { label: t('broken'), color: 'text-red-600', subLabel: `${weeks} ${weeks === 1 ? t('week') : t('weeks')} ${t('ago')}` };
            }
            const months = Math.floor(absDiff / 30);
            return { label: t('broken'), color: 'text-red-600', subLabel: `${months} ${months === 1 ? t('month') : t('months')} ${t('ago')}` };
        }

        const isNearlyBroken = diffDays <= 30;
        const color = isNearlyBroken ? 'text-orange-500' : 'text-green-500';
        const label = isNearlyBroken ? t('nearlyBroken') : t('active');

        if (diffDays < 7) return { label, color, subLabel: `${t('in')} ${diffDays} ${diffDays === 1 ? t('day') : t('days')}` };
        if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return { label, color, subLabel: `${t('in')} ${weeks} ${weeks === 1 ? t('week') : t('weeks')}` };
        }
        const months = Math.floor(diffDays / 30);
        return { label, color, subLabel: `${t('in')} ${months} ${months === 1 ? t('month') : t('months')}` };
    };

    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 transition-colors">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('noWasteItems')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('allStockSufficient')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">{t('totalItems')}</p>
                            <p className="text-2xl font-bold">{data.length}</p>
                        </div>
                        <FaBoxes className="text-3xl text-red-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">{t('totalTakenQuantity')}</p>
                            <p className="text-2xl font-bold">{totalTaken.toLocaleString()}</p>
                        </div>
                        <FaExclamationTriangle className="text-3xl text-orange-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">{t('totalExpiredQuantity')}</p>
                            <p className="text-2xl font-bold">{totalExpired.toLocaleString()}</p>
                        </div>
                        <FaClock className="text-3xl text-yellow-200" />
                    </div>
                </div>
            </div>

            {/* Waste List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden transition-colors">
                <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('wasteItem')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('stockBelowNeeded')}</p>
                </div>

                {isLoading ? (
                    <>
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </>
                ) : (
                    data.map((item, index) => {
                        const expiry = getTimeRemaining(item.expire_date);
                        return (
                            <div
                                key={`${item.item_id}-${index}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/detail-waste/${item.item_id}`)}
                            >
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg flex items-center justify-center">
                                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                            {item.item_name?.charAt(0).toUpperCase() || 'W'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.item_name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.category_name}</div>
                                        {expiry && (
                                            <div className={`text-xs font-medium mt-1 ${expiry.color}`}>
                                                {expiry.label} • {expiry.subLabel}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-16 sm:ml-0">
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                                {parseInt(item.taken_quantity).toLocaleString()} {t('inStock')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm mt-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                                {parseInt(item.expired_quantity).toLocaleString()} {t('expired')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Progress
                                            type="circle"
                                            percent={Math.round((parseInt(item.expired_quantity) / parseInt(item.taken_quantity)) * 100)}
                                            size={40}
                                            strokeColor={parseInt(item.expired_quantity) === parseInt(item.taken_quantity) ? '#ef4444' : '#f59e0b'}
                                            trailColor="currentColor"
                                            className="text-gray-200 dark:text-gray-700"
                                            format={(percent) => (
                                                <span className="text-[10px] font-medium dark:text-gray-300">{percent}%</span>
                                            )}
                                        />
                                    </div>
                                    <FaChevronRight className="text-gray-400 dark:text-gray-600" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Waste;
