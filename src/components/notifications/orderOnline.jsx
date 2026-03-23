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

const timeSince = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `${Math.max(diff, 1)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const statusMeta = (status) => {
    const map = {
        1: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: FaClock },
        5: { label: 'Delivering', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: FaTruck },
        6: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200', icon: FaCheckCircle },
    };

    return map[Number(status)] || map[1];
};

const paymentMeta = (paymentStatus) => {
    if ((paymentStatus || '').toLowerCase() === 'paid') {
        return 'bg-green-100 text-green-700';
    }

    return 'bg-orange-100 text-orange-700';
};

const SkeletonRow = () => (
    <div className="grid animate-pulse grid-cols-1 gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-[1fr_1.6fr_120px_120px_96px] md:items-center">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-8 rounded-xl bg-slate-100" />
        <div className="h-8 rounded-xl bg-slate-100" />
        <div className="ml-auto h-9 w-20 rounded-xl bg-slate-100" />
    </div>
);

const OrderOnline = () => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const { data: dataOrderOnline, refetch, isLoading, isFetching } = useGetAllOrderOnlineQuery(token);
    const [viewOrder] = useViewOrderMutation();

    useEffect(() => {
        setOrders(dataOrderOnline?.data || []);
    }, [dataOrderOnline]);

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
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                    <FaReceipt className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-800">No online orders</h3>
                <p className="mt-1 text-sm text-slate-500">There are no pending online orders right now.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">Online Orders</h2>
                        <p className="text-xs text-slate-500">
                            {orders.length} order{orders.length !== 1 ? 's' : ''} | {money(totalAmount)}
                        </p>
                    </div>

                    <button
                        onClick={refetch}
                        title="Refresh"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    >
                        <FaSync className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="hidden grid-cols-[1fr_1.6fr_120px_120px_96px] gap-3 bg-slate-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 md:grid">
                    <div>Tel</div>
                    <div>Address</div>
                    <div>Total</div>
                    <div>Status</div>
                    <div className="text-right">Action</div>
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
                                className="grid grid-cols-1 gap-3 border-t border-slate-100 px-4 py-4 transition hover:bg-slate-50/70 md:grid-cols-[1fr_1.6fr_120px_120px_96px] md:items-center"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <FaPhone className="h-3.5 w-3.5 text-slate-400" />
                                        <p className="truncate text-sm font-semibold text-slate-900">{order.order_tel || 'Unknown'}</p>
                                    </div>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {order.order_no} | {timeSince(order.created_at || order.order_date)}
                                    </p>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-start gap-2">
                                        <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                                        <p className="line-clamp-2 text-sm text-slate-700">{order.order_address || 'Unknown'}</p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        <span>{order.order_date || 'Unknown'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <FaMoneyBillWave className="h-3.5 w-3.5 text-slate-400" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{money(order.order_total)}</div>
                                        <div className="text-[11px] text-slate-500">Balance {money(order.balance)}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 md:flex-col md:items-start">
                                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        <span>{status.label}</span>
                                    </div>
                                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${paymentMeta(order.order_payment_status)}`}>
                                        {(order.order_payment_status || 'unknown').toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center justify-start gap-2 md:justify-end">
                                    <button
                                        onClick={() => navigate(`/home/order-tracking/view/${order.order_id}`)}
                                        title="Order tracking"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        <FaTruck className="h-4 w-4" />
                                    </button>
                                    {/* <button
                                        onClick={() => handleView(order.order_id)}
                                        title="View details"
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                                    >
                                        <FaEye className="h-4 w-4" />
                                    </button> */}
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
