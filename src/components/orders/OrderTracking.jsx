import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FaXmark } from "react-icons/fa6";
import {
    FaBoxOpen,
    FaCalendarAlt,
    FaCheck,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaEye,
    FaExclamationCircle,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaPhone,
    FaSearch,
    FaShippingFast,
    FaTimes,
    FaTruck,
    FaUser,
    FaEdit,
    FaFilter,
    FaBoxes,
} from 'react-icons/fa';
import { TbPackage, TbTruckDelivery } from 'react-icons/tb';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useGetAllDeliverQuery } from "@/features/sales/deliversSlice";
import { useGetAllDeliveryTrackingQuery } from "@/features/sales/ordersSlice";
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import { useGetAllWasteQuery } from "@/features/system/notificationSlice";
import { useTranslation } from 'react-i18next';
import RefreshButton from '../../utils/RefreshButton';
import EnumSelect from '../../utils/EnumSelect';
import RichSearch from '../../utils/RichSearch';
import { getToken } from '@/utils/tokenStore';
import { motion, AnimatePresence } from 'framer-motion';

const statusOptions = [
    { id: 1, label: 'Pending', icon: FaClock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', badge: 'bg-amber-500' },
    { id: 2, label: 'Approved', icon: FaClock, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', badge: 'bg-cyan-500' },
    { id: 3, label: 'Packaged', icon: TbPackage, color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', badge: 'bg-sky-500' },
    { id: 4, label: 'Ready for Pickup', icon: FaBoxOpen, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', badge: 'bg-purple-500' },
    { id: 5, label: 'Delivering', icon: FaShippingFast, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', badge: 'bg-indigo-500' },
    { id: 6, label: 'Completed', icon: FaCheckCircle, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', badge: 'bg-emerald-500' },
    { id: 7, label: 'Cancelled', icon: FaExclamationCircle, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', badge: 'bg-rose-500' },
];

const trackingStatusSelectOptions = statusOptions.map((status) => ({
    value: status.id,
    label: status.label,
    icon: status.icon,
    color: status.color,
}));

const PAGE_SIZE = 10;

const OrderTracking = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = getToken();
    const [orders, setOrders] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);
    const [statusUpdatingOrderId, setStatusUpdatingOrderId] = useState(null);
    const [editingField, setEditingField] = useState({});
    const [tempValues, setTempValues] = useState({});
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showField, setShowField] = useState({});
    const [filters, setFilters] = useState({
        search: '',
        deliver_id: '',
        user_id: '',
        page: 1,
        limit: PAGE_SIZE,
    });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { refetch: refetchWaste } = useGetAllWasteQuery(token);
    const saleItemContext = useGetAllSaleQuery({ token, limit: 10, page: 1, search: '' });
    const { data: delivers } = useGetAllDeliverQuery(token);
    const { data: usersData } = useGetAllUserQuery(token);
    const {
        data: deliveryTrackingData,
        refetch,
        isLoading,
        isFetching,
    } = useGetAllDeliveryTrackingQuery({
        token,
        limit: filters.limit,
        page: filters.page,
        search: debouncedSearch,
        deliver_id: filters.deliver_id,
        user_id: filters.user_id,
    });

    const deliverFilterOptions = useMemo(
        () =>
            (delivers?.data || []).map((service) => ({
                deliver_id: service.deliver_id,
                deliver_name: service.deliver_name,
            })),
        [delivers?.data]
    );

    const userFilterOptions = useMemo(
        () =>
            (usersData?.data || []).map((user) => ({
                id: user.id,
                username: user.username,
                image: user.image,
            })),
        [usersData?.data]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        setOrders(deliveryTrackingData?.data || []);
    }, [deliveryTrackingData]);

    useEffect(() => {
        setFilters((prev) => ({ ...prev, page: 1 }));
    }, [debouncedSearch, filters.deliver_id, filters.user_id]);

    const pagination = deliveryTrackingData?.pagination || {};
    const totalOrders = pagination.total || orders.length || 0;
    const totalPages = pagination.last_page || 1;

    const getStatusMeta = (statusId) => {
        return statusOptions.find((status) => status.id === Number(statusId)) || statusOptions[0];
    };

    const orderStats = useMemo(() => (
        statusOptions.map((status) => ({
            ...status,
            count: orders.filter((order) => Number(order.status) === status.id).length,
        }))
    ), [orders]);

    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
            page: field === 'page' ? value : 1,
        }));
    };

    const handleEditClick = (orderId, field, value) => {
        setEditingField({ orderId, field });
        setShowField((prev) => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: true,
            },
        }));
        setTempValues((prev) => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value,
            },
        }));
    };

    const handleCancelEdit = () => {
        setEditingField({});
        setShowField({});
    };

    const handleInputChange = (orderId, field, value) => {
        setTempValues((prev) => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value,
            },
        }));
    };

    const handleSaveField = async (orderId, field, status = 0, overrideValue = null) => {
        const value = overrideValue ?? tempValues[orderId]?.[field];
        const order = orders.find((item) => item.order_id === orderId);

        if (!order || value === undefined) {
            return;
        }

        const previousStatus = order.status;

        try {
            setEditingOrder(orderId);

            let response;
            if (field === 'status') {
                setStatusUpdatingOrderId(orderId);
                setOrders((prev) =>
                    prev.map((item) =>
                        item.order_id === orderId
                            ? { ...item, status: Number(status) }
                            : item
                    )
                );
                response = await api.put(`status_order/${orderId}/${status}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (field === 'delivery_fee') {
                response = await api.put(`edit_delivery_fee/${orderId}/${value}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (field === 'deliver_id') {
                response = await api.put(`edit_delivery_service/${orderId}/${value}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (response?.status === 200) {
                await refetch();
                refetchWaste();
                saleItemContext.refetch();
                toast.success(response?.data?.message || t('orderUpdatedSuccessfully'));
                setEditingField({});
                setShowField((prev) => ({
                    ...prev,
                    [orderId]: {
                        ...prev[orderId],
                        [field]: false,
                    },
                }));
            } else {
                toast.error(t('failedToUpdateOrder'));
            }
        } catch (error) {
            if (field === 'status') {
                setOrders((prev) =>
                    prev.map((item) =>
                        item.order_id === orderId
                            ? { ...item, status: previousStatus }
                            : item
                    )
                );
            }
            console.error('Error updating order:', error);
            toast.error(error?.response?.data?.message || t('errorUpdatingOrder'));
        } finally {
            if (field === 'status') {
                setStatusUpdatingOrderId(null);
            }
            setEditingOrder(null);
        }
    };

    const isEditing = (orderId, field) => editingField.orderId === orderId && editingField.field === field;
    const isFieldVisible = (orderId, field) => showField[orderId]?.[field] || isEditing(orderId, field);

    const handleViewItems = (order) => {
        setSelectedOrder(order);
        setShowItemsModal(true);
    };

    const handleCloseItemsModal = () => {
        setShowItemsModal(false);
        setSelectedOrder(null);
    };

    const getTotalAmount = (order) => Number(order?.order_total || 0).toFixed(2);

    if (isLoading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
                        <div className="h-10 w-10 animate-spin rounded-full border-3 border-cyan-500 border-t-transparent" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('loadingOrders')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-4 md:p-6 transition-colors">
            {/* Header & Controls Bar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 md:p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                            <TbTruckDelivery className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {t('orderTracking')}
                                </h1>
                                <span className="inline-flex items-center rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                                    {totalOrders} {t('orders') || 'Orders'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {t('manageDeliveryServices') || 'Track and manage delivery assignments in real-time'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <RefreshButton onRefresh={refetch} />
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(event) => handleFilterChange('search', event.target.value)}
                            placeholder={t('searchOrderTracking')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:bg-slate-800"
                        />
                    </div>

                    <div>
                        <RichSearch
                            data={deliverFilterOptions}
                            keyFields={{ id: 'deliver_id', title: 'deliver_name' }}
                            value={filters.deliver_id}
                            onSelected={(id) => handleFilterChange('deliver_id', id || '')}
                            placeholder={t('allDelivery')}
                        />
                    </div>

                    <div>
                        <RichSearch
                            data={userFilterOptions}
                            keyFields={{ id: 'id', title: 'username', image: 'image' }}
                            value={filters.user_id}
                            onSelected={(id) => handleFilterChange('user_id', id || '')}
                            placeholder={t('allUsers')}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilters({ search: '', deliver_id: '', user_id: '', page: 1, limit: PAGE_SIZE })}
                            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            <FaXmark className="h-3.5 w-3.5" />
                            <span>{t('clearFilters') || 'Clear Filters'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Status KPI Overview */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                {orderStats.map((status) => {
                    const Icon = status.icon;
                    return (
                        <div
                            key={status.id}
                            className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center justify-between">
                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${status.color}`}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className={`h-2 w-2 rounded-full ${status.badge}`} />
                            </div>
                            <div className="mt-3">
                                <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {status.count}
                                </div>
                                <div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    {status.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Orders Cards Grid */}
            {orders.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                        <FaTruck className="h-9 w-9" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('noDeliveryOrdersFound')}</h3>
                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {t('tryChangingFilters')}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {orders.map((order) => {
                            const statusMeta = getStatusMeta(order.status);

                            return (
                                <motion.div
                                    key={order.order_id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                                >
                                    {/* Card Top Header */}
                                    <div className="border-b border-slate-100 bg-slate-900 p-4 text-white dark:border-slate-800 dark:bg-slate-950/90">
                                        <div className="mb-3 flex items-start justify-between gap-2">
                                            <div
                                                onClick={() => handleViewItems(order)}
                                                className="group/no flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-extrabold text-sm tracking-tight text-white group-hover/no:text-cyan-400 transition-colors">
                                                        #{order.order_no}
                                                    </span>
                                                    <span className="inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                                        <FaBoxes className="mr-1 h-2.5 w-2.5 text-cyan-400" />
                                                        {order.items?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                                    <FaCalendarAlt className="h-3 w-3 text-slate-400" />
                                                    <span>
                                                        {new Date(order.order_date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <EnumSelect
                                                    value={Number(order.status)}
                                                    selectOptions={trackingStatusSelectOptions}
                                                    loading={statusUpdatingOrderId === order.order_id}
                                                    disabled={statusUpdatingOrderId === order.order_id}
                                                    onChange={async (value) => {
                                                        if (Number(value) === Number(order.status)) return;
                                                        localStorage.setItem('guestId', order.created_by);
                                                        await handleSaveField(order.order_id, 'status', value, value);
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Contact & Destination Info */}
                                        <div className="space-y-2 rounded-xl bg-white/5 p-2.5 backdrop-blur-xs">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                                                    <FaPhone className="h-3 w-3" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phone</div>
                                                    <div className="truncate text-xs font-semibold text-white">{order.order_tel || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                                                    <FaMapMarkerAlt className="h-3 w-3" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Address</div>
                                                    <div className="truncate text-xs font-medium text-slate-200">{order.order_address || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="rounded-lg bg-white/5 p-2">
                                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                                        <FaTruck className="h-2.5 w-2.5 text-cyan-400" />
                                                        <span>Service</span>
                                                    </div>
                                                    <div className="truncate text-xs font-semibold text-white mt-0.5">{order.deliver_name || 'Unknown'}</div>
                                                </div>
                                                <div className="rounded-lg bg-white/5 p-2">
                                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                                                        <FaUser className="h-2.5 w-2.5 text-indigo-400" />
                                                        <span>User ID</span>
                                                    </div>
                                                    <div className="truncate text-xs font-semibold text-white mt-0.5">#{order.created_by}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable Delivery Details */}
                                    <div className="flex-1 p-4 space-y-3.5">
                                        {/* Delivery Fee Section */}
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <FaMoneyBillWave className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span>Delivery Fee</span>
                                                </label>
                                                <button
                                                    onClick={() => handleEditClick(order.order_id, 'delivery_fee', order.delivery_fee)}
                                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-slate-800 dark:hover:text-cyan-400 transition-colors"
                                                    title="Edit delivery fee"
                                                >
                                                    <FaEdit className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {isFieldVisible(order.order_id, 'delivery_fee') ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={tempValues[order.order_id]?.delivery_fee ?? order.delivery_fee ?? 0}
                                                            onChange={(event) => {
                                                                localStorage.setItem('guestId', order.created_by);
                                                                handleInputChange(order.order_id, 'delivery_fee', event.target.value);
                                                            }}
                                                            className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-7 pr-3 text-xs font-bold text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveField(order.order_id, 'delivery_fee')}
                                                        disabled={editingOrder === order.order_id}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 transition-colors"
                                                    >
                                                        <FaCheck className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-400 transition-colors"
                                                    >
                                                        <FaTimes className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
                                                    ${Number(order.delivery_fee || 0).toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delivery Service Section */}
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    <FaTruck className="h-3.5 w-3.5 text-cyan-500" />
                                                    <span>{t('deliveryService')}</span>
                                                </label>
                                                <button
                                                    onClick={() => {
                                                        localStorage.setItem('guestId', order.created_by);
                                                        handleEditClick(order.order_id, 'deliver_id', order.deliver_id);
                                                    }}
                                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600 dark:hover:bg-slate-800 dark:hover:text-cyan-400 transition-colors"
                                                    title={t('editDeliveryService')}
                                                >
                                                    <FaEdit className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {isFieldVisible(order.order_id, 'deliver_id') ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <RichSearch
                                                            data={deliverFilterOptions}
                                                            keyFields={{ id: 'deliver_id', title: 'deliver_name' }}
                                                            value={tempValues[order.order_id]?.deliver_id ?? order.deliver_id ?? ''}
                                                            onSelected={(id) => handleInputChange(order.order_id, 'deliver_id', id || '')}
                                                            placeholder={t('deliveryService')}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveField(order.order_id, 'deliver_id')}
                                                        disabled={editingOrder === order.order_id}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 transition-colors shrink-0"
                                                    >
                                                        <FaCheck className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-400 transition-colors shrink-0"
                                                    >
                                                        <FaTimes className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
                                                    {order.deliver_name || t('unknown')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial Summary */}
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 dark:border-slate-800/60 dark:bg-slate-800/30">
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span>Subtotal</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">${Number(order.order_subtotal || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span>Delivery Fee</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">${Number(order.delivery_fee || 0).toFixed(2)}</span>
                                            </div>
                                            {Number(order.order_discount || 0) > 0 && (
                                                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                                                    <span>Discount</span>
                                                    <span className="font-semibold">-${Number(order.order_discount || 0).toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t border-slate-200/80 dark:border-slate-700/60 pt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                                                <span>{t('totalAmount')}</span>
                                                <span className="text-cyan-600 dark:text-cyan-400">${getTotalAmount(order)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/20">
                                        <button
                                            onClick={() => handleViewItems(order)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 py-2.5 text-xs font-bold text-cyan-600 hover:bg-cyan-500 hover:text-white dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-500 dark:hover:text-white transition-all duration-200"
                                        >
                                            <FaEye className="h-3.5 w-3.5" />
                                            <span>{t('viewDetails') || 'View Order Items'}</span>
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t('showingPageOf', { page: pagination.current_page || 1, total: totalPages })}
                        </div>

                        <div className="flex items-center gap-1.5 self-center sm:self-auto">
                            <button
                                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                                disabled={(pagination.current_page || 1) <= 1}
                                title={t('previousPage')}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <FaChevronLeft className="h-3.5 w-3.5" />
                            </button>

                            {Array.from({ length: totalPages }, (_, index) => index + 1)
                                .slice(Math.max(0, (pagination.current_page || 1) - 3), Math.max(0, (pagination.current_page || 1) + 2))
                                .map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => handleFilterChange('page', pageNumber)}
                                        className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-extrabold transition ${pageNumber === (pagination.current_page || 1)
                                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 dark:bg-cyan-500'
                                            : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                            <button
                                onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                                disabled={(pagination.current_page || 1) >= totalPages}
                                title={t('nextPage')}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <FaChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Items Modal */}
            <AnimatePresence>
                {showItemsModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-5 text-white dark:border-slate-800">
                                <div>
                                    <h2 className="flex items-center text-white gap-2.5 text-lg font-extrabold tracking-tight">
                                        <FaEye className="h-5 w-5 text-cyan-400" />
                                        {t('orderItems')} - #{selectedOrder.order_no}
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {t('itemsInThisOrder', { count: selectedOrder.items?.length || 0 })}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseItemsModal}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    <FaTimes className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-800/40"
                                        >
                                            {item.item_image || item.images?.[0]?.image ? (
                                                <img
                                                    src={item.item_image || item.images?.[0]?.image}
                                                    alt={item.item_name}
                                                    className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                                                    {t('noImage')}
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.item_name}</h4>
                                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                            {t('code')}: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.item_code}</span> | {t('category')}: {item.category_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">
                                                            ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400">
                                                            Unit ${Number(item.item_price || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                    <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-center dark:border-slate-700/60 dark:bg-slate-800">
                                                        <div className="text-[10px] font-semibold text-slate-400">{t('quantity')}</div>
                                                        <div className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{item.quantity}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-center dark:border-slate-700/60 dark:bg-slate-800">
                                                        <div className="text-[10px] font-semibold text-slate-400">{t('price')}</div>
                                                        <div className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">${Number(item.price || 0).toFixed(2)}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200/60 bg-white p-2 text-center dark:border-slate-700/60 dark:bg-slate-800">
                                                        <div className="text-[10px] font-semibold text-slate-400">Discount</div>
                                                        <div className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400">{Number(item.discount || 0)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">{t('orderSummary')}</h4>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                        <span>{t('itemsTotal')}</span>
                                        <span className="font-semibold">${Number(selectedOrder.order_subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                        <span>Delivery Fee</span>
                                        <span className="font-semibold">${Number(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                        <span>Discount</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">-${Number(selectedOrder.order_discount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-slate-200/80 dark:border-slate-700/60 pt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                                        <span>{t('totalAmount')}</span>
                                        <span className="text-cyan-600 dark:text-cyan-400">${getTotalAmount(selectedOrder)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                                <button
                                    onClick={handleCloseItemsModal}
                                    className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderTracking;
