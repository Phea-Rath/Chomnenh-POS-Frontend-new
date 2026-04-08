import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaEye,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaPhone,
    FaReceipt,
    FaSync,
    FaTruck,
} from 'react-icons/fa';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { useViewOrderMutation } from '../../../app/Features/ordersSlice';
import { useTranslation } from 'react-i18next';

const OrderOnline = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const { data: dataOrderOnline, refetch, isLoading, isFetching } = useGetAllOrderOnlineQuery(token);
    const [viewOrder] = useViewOrderMutation();

    useEffect(() => {
        setOrders(dataOrderOnline?.data || []);
    }, [dataOrderOnline]);

    const timeSince = (date) => {
        const diff = Math.floor((new Date() - new Date(date)) / 1000);
        if (diff < 60) return t('secondsAgo', { count: Math.max(diff, 1) });
        if (diff < 3600) return t('minutesAgo', { count: Math.floor(diff / 60) });
        if (diff < 86400) return t('hoursAgo', { count: Math.floor(diff / 3600) });
        return t('daysAgo', { count: Math.floor(diff / 86400) });
    };

    const money = (value) => `$${Number(value || 0).toFixed(2)}`;

    const statusMeta = (status) => {
        const map = {
            1: { label: t('pending'), color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/50', icon: FaClock },
            5: { label: t('delivering'), color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50', icon: FaTruck },
            6: { label: t('completed'), color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50', icon: FaCheckCircle },
        };

        return map[Number(status)] || map[1];
    };

    const paymentMeta = (paymentStatus) => {
        if ((paymentStatus || '').toLowerCase() === 'paid') {
            return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        }

        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    };

    const SkeletonRow = () => (
        <div className="grid animate-pulse grid-cols-1 gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-4 md:grid-cols-[1fr_1.6fr_120px_120px_96px] md:items-center">
            <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="ml-auto h-9 w-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
    );

    const totalAmount = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.order_total || 0), 0),
        [orders]
    );

    const handleView = async (orderId) => {
        try {
            await viewOrder({ id: orderId, token });
        } catch (error) {
            // navigate anyway
        }

        navigate(`/detail-notification/${orderId}`);
    };

    if (!isLoading && orders.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-12 text-center transition-colors">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400">
                    <FaReceipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">{t('noOnlineOrders')}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('noPendingOrdersDesc')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-4 shadow-sm transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{t('onlineOrders')}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {orders.length} {t('order')}{orders.length !== 1 ? 's' : ''} | {money(totalAmount)}
                        </p>
                    </div>

                    <button
                        onClick={refetch}
                        title={t('refresh')}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                        <FaSync className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 shadow-sm transition-colors">
                <div className="hidden grid-cols-[1fr_1.6fr_120px_120px_96px] gap-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:grid">
                    <div>{t('tel')}</div>
                    <div>{t('address')}</div>
                    <div>{t('total')}</div>
                    <div>{t('status')}</div>
                    <div className="text-right">{t('actions')}</div>
                </div>

                {isLoading ? (
                    <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                    </>
                ) : (
                    orders.map((order) => {
                        const status = statusMeta(order.status);
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={order.order_id}
                                className="grid grid-cols-1 gap-3 border-t border-slate-100 dark:border-slate-800 px-4 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-700/30 md:grid-cols-[1fr_1.6fr_120px_120px_96px] md:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{order.order_tel || t('unknown')}</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {order.order_no} | {timeSince(order.created_at || order.order_date)}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                                        <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{order.order_address || t('unknown')}</p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        <span>{order.order_date || t('unknown')}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <FaMoneyBillWave className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{money(order.order_total)}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('remainingBalance')} {money(order.balance)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:flex-col md:items-start">
                                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        <span>{status.label}</span>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${paymentMeta(order.order_payment_status)}`}>
                                        {t((order.order_payment_status || 'unknown').toLowerCase())}
                                    </span>
                                </div>

                                <div className="flex items-center justify-start gap-2 md:justify-end">
                                    <button
                                        onClick={() => navigate(`/home/order-tracking/view/${order.order_id}`)}
                                        title={t('orderTracking')}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        <FaTruck className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default OrderOnline;
