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
    FaEdit,
    FaEye,
    FaExclamationCircle,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaPhone,
    FaSearch,
    FaShippingFast,
    FaSync,
    FaTimes,
    FaTruck,
    FaUser,
} from 'react-icons/fa';
import { TbPackage } from 'react-icons/tb';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useGetAllDeliverQuery } from '../../../app/Features/deliversSlice';
import { useGetAllDeliveryTrackingQuery } from '../../../app/Features/ordersSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { useTranslation } from 'react-i18next';
import RefreshButton from '../../utils/RefreshButton';

const statusOptions = [
    { id: 1, label: 'Pending', icon: FaClock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 3, label: 'Packaged', icon: TbPackage, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 4, label: 'Ready for Pickup', icon: FaBoxOpen, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 5, label: 'Delivering', icon: FaShippingFast, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 6, label: 'Completed', icon: FaCheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 7, label: 'Cancelled', icon: FaExclamationCircle, color: 'bg-red-100 text-red-800 border-red-200' },
];

const PAGE_SIZE = 10;

const OrderTracking = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [orders, setOrders] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);
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

    const getStatusIcon = (statusId) => {
        const statusObj = statusOptions.find((status) => status.id === Number(statusId));
        return statusObj ? React.createElement(statusObj.icon, { className: 'w-4 h-4' }) : null;
    };

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

        try {
            setEditingOrder(orderId);

            let response;
            if (field === 'status') {
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
            console.error('Error updating order:', error);
            toast.error(error?.response?.data?.message || t('errorUpdatingOrder'));
        } finally {
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
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingOrders')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="component-page min-h-screen bg-transparent">
            <div className="mx-auto space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FaTruck className="h-4 w-4" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-slate-900">{t('orderTracking')}</h1>
                                <p className="text-xs text-slate-500">{totalOrders} order{totalOrders !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <RefreshButton onRefresh={refetch} />
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
                        <div>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(event) => handleFilterChange('search', event.target.value)}
                                    placeholder={t('searchOrderTracking')}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div>
                            <select
                                value={filters.deliver_id}
                                onChange={(event) => handleFilterChange('deliver_id', event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                            >
                                <option value="">{t('allDelivery')}</option>
                                {delivers?.data?.map((service) => (
                                    <option key={service.deliver_id} value={service.deliver_id}>
                                        {service.deliver_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.user_id}
                                onChange={(event) => handleFilterChange('user_id', event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white"
                            >
                                <option value="">{t('allUsers')}</option>
                                {usersData?.data?.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-end">
                            <button
                                onClick={() => setFilters({ search: '', deliver_id: '', user_id: '', page: 1, limit: PAGE_SIZE })}
                                title={t('clearFilters')}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                            >
                                <FaXmark className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                    {orderStats.map((status) => {
                        const Icon = status.icon;
                        return (
                            <div key={status.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className={`rounded-lg p-1.5 ${status.color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold leading-none text-slate-800">{status.count}</div>
                                        <div className="text-xs text-slate-500">{status.label}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {orders.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
                            <FaTruck className="h-11 w-11 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800">{t('noDeliveryOrdersFound')}</h3>
                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            {t('tryChangingFilters')}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {orders.map((order) => {
                                const statusMeta = getStatusMeta(order.status);

                                return (
                                    <div
                                        key={order.order_id}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="border-b border-slate-100 p-4">
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900">{order.order_no}</h3>
                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                        <FaCalendarAlt className="h-3 w-3" />
                                                        {new Date(order.order_date).toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusMeta.color}`}>
                                                        {getStatusIcon(order.status)}
                                                        <span>{statusMeta.label}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleEditClick(order.order_id, 'status', order.status)}
                                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                                        title={t('editStatus')}
                                                    >
                                                        <FaEdit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewItems(order)}
                                                        title={t('viewDetails')}
                                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                                    >
                                                        <FaEye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {isEditing(order.order_id, 'status') && (
                                                <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t('updateStatus')}</span>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="rounded-md p-1 text-red-600 transition hover:bg-red-100"
                                                        >
                                                            <FaTimes className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5">
                                                        {statusOptions.map((option) => (
                                                            <button
                                                                key={option.id}
                                                                onClick={async () => {
                                                                    localStorage.setItem('guestId', order.created_by);
                                                                    handleInputChange(order.order_id, 'status', option.id);
                                                                    await handleSaveField(order.order_id, 'status', option.id, option.id);
                                                                }}
                                                                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-left text-[11px] ${option.color}`}
                                                                disabled={editingOrder === order.order_id}
                                                            >
                                                                {React.createElement(option.icon, { className: 'h-4 w-4' })}
                                                                <span>{option.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                                                    <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
                                                        <FaPhone className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] text-slate-500">Phone</div>
                                                        <div className="text-xs font-medium text-slate-800">{order.order_tel}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5">
                                                    <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
                                                        <FaMapMarkerAlt className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-[11px] text-slate-500">Address</div>
                                                        <div className="truncate text-xs font-medium text-slate-800">{order.order_address}</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="rounded-xl bg-slate-50 p-2.5">
                                                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                            <FaTruck className="h-3 w-3" />
                                                            Delivery
                                                        </div>
                                                        <div className="truncate text-xs font-medium text-slate-800">{order.deliver_name || 'Unknown'}</div>
                                                    </div>
                                                    <div className="rounded-xl bg-slate-50 p-2.5">
                                                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                                                            <FaUser className="h-3 w-3" />
                                                            User ID
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-800">{order.created_by}</div>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>

                                        <div className="p-4">
                                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Tracking</h4>

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                                                            <FaMoneyBillWave className="h-3.5 w-3.5" />
                                                            Delivery Fee ($)
                                                        </label>
                                                        <button
                                                            onClick={() => handleEditClick(order.order_id, 'delivery_fee', order.delivery_fee)}
                                                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                                            title="Edit delivery fee"
                                                        >
                                                            <FaEdit className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    {isFieldVisible(order.order_id, 'delivery_fee') ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={tempValues[order.order_id]?.delivery_fee ?? order.delivery_fee ?? 0}
                                                                    onChange={(event) => {
                                                                        localStorage.setItem('guestId', order.created_by);
                                                                        handleInputChange(order.order_id, 'delivery_fee', event.target.value);
                                                                    }}
                                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 pl-8 text-sm outline-none transition focus:border-blue-500"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleSaveField(order.order_id, 'delivery_fee')}
                                                                className="rounded-xl bg-green-50 p-2.5 text-green-700 transition hover:bg-green-100"
                                                                disabled={editingOrder === order.order_id}
                                                            >
                                                                <FaCheck className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="rounded-xl bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100"
                                                            >
                                                                <FaTimes className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                                            ${Number(order.delivery_fee || 0).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                                                            <FaTruck className="h-3.5 w-3.5" />
                                                            {t('deliveryService')}
                                                        </label>
                                                        <button
                                                            onClick={() => {
                                                                localStorage.setItem('guestId', order.created_by);
                                                                handleEditClick(order.order_id, 'deliver_id', order.deliver_id);
                                                            }}
                                                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                                            title={t('editDeliveryService')}
                                                        >
                                                            <FaEdit className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    {isFieldVisible(order.order_id, 'deliver_id') ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={tempValues[order.order_id]?.deliver_id ?? order.deliver_id ?? ''}
                                                                onChange={(event) => handleInputChange(order.order_id, 'deliver_id', event.target.value)}
                                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                                                            >
                                                                <option value="">{t('deliveryService')}</option>
                                                                {delivers?.data?.map((service) => (
                                                                    <option key={service.deliver_id} value={service.deliver_id}>
                                                                        {service.deliver_name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleSaveField(order.order_id, 'deliver_id')}
                                                                className="rounded-xl bg-green-50 p-2.5 text-green-700 transition hover:bg-green-100"
                                                                disabled={editingOrder === order.order_id}
                                                            >
                                                                <FaCheck className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="rounded-xl bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100"
                                                            >
                                                                <FaTimes className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                                            {order.deliver_name || t('unknown')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-4 border-t border-slate-100 pt-4 text-xs">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Subtotal</span>
                                                        <span className="font-medium">${Number(order.order_subtotal || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Delivery Fee</span>
                                                        <span className="font-medium">${Number(order.delivery_fee || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Discount</span>
                                                        <span className="font-medium text-green-600">-${Number(order.order_discount || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900">
                                                        <span>{t('totalAmount')}</span>
                                                        <span className="text-blue-700">${getTotalAmount(order)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                            <div className="text-xs text-slate-600">
                                {t('showingPageOf', { page: pagination.current_page || 1, total: totalPages })}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                                    disabled={(pagination.current_page || 1) <= 1}
                                    title={t('previousPage')}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaChevronLeft className="h-3.5 w-3.5" />
                                </button>

                                {Array.from({ length: totalPages }, (_, index) => index + 1)
                                    .slice(Math.max(0, (pagination.current_page || 1) - 3), Math.max(0, (pagination.current_page || 1) + 2))
                                    .map((pageNumber) => (
                                        <button
                                            key={pageNumber}
                                            onClick={() => handleFilterChange('page', pageNumber)}
                                            className={`h-9 min-w-9 rounded-xl px-3 text-xs font-semibold transition ${pageNumber === (pagination.current_page || 1)
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    ))}

                                <button
                                    onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                                    disabled={(pagination.current_page || 1) >= totalPages}
                                    title={t('nextPage')}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <FaChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {showItemsModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl">
                            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                                            <FaEye className="h-5 w-5 text-blue-600" />
                                            {t('orderItems')} - {selectedOrder.order_no}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {t('itemsInThisOrder', { count: selectedOrder.items?.length || 0 })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCloseItemsModal}
                                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <FaTimes className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item) => (
                                        <div key={item.id} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
                                            {item.item_image || item.images?.[0]?.image ? (
                                                <img
                                                    src={item.item_image || item.images?.[0]?.image}
                                                    alt={item.item_name}
                                                    className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                                                    {t('noImage')}
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{item.item_name}</h4>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {t('code')}: {item.item_code} | {t('category')}: {item.category_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-blue-700">
                                                            ${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Unit ${Number(item.item_price || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="text-slate-500">{t('quantity')}</div>
                                                        <div className="mt-1 font-medium text-slate-800">{item.quantity}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="text-slate-500">{t('price')}</div>
                                                        <div className="mt-1 font-medium text-slate-800">${Number(item.price || 0).toFixed(2)}</div>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="text-slate-500">Discount</div>
                                                        <div className="mt-1 font-medium text-green-600">{Number(item.discount || 0)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                                    <h4 className="mb-3 font-semibold text-slate-800">{t('orderSummary')}</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between text-slate-600">
                                            <span>{t('itemsTotal')}</span>
                                            <span className="font-medium">${Number(selectedOrder.order_subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Delivery Fee</span>
                                            <span className="font-medium">${Number(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Discount</span>
                                            <span className="font-medium text-green-600">-${Number(selectedOrder.order_discount || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                                            <span>{t('totalAmount')}</span>
                                            <span className="text-blue-700">${getTotalAmount(selectedOrder)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-200 bg-slate-50 p-6">
                                <button
                                    onClick={handleCloseItemsModal}
                                    className="rounded-2xl border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
                                >
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;
