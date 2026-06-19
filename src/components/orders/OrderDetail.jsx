import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheck,
    FaCheckCircle,
    FaClock,
    FaEdit,
    FaExclamationCircle,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaPhone,
    FaReceipt,
    FaShippingFast,
    FaTimes,
    FaTruck,
    FaUser,
    FaHistory,
    FaInfoCircle,
} from 'react-icons/fa';
import { TbPackage } from 'react-icons/tb';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useGetAllDeliverQuery } from '../../../app/Features/deliversSlice';
import { useGetOrderByIdQuery } from '../../../app/Features/ordersSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import Button from '../../utils/Button';
import Input from '../../utils/Input';
import RichSearch from '../../utils/RichSearch';

const statusOptions = [
    { id: 1, label: 'Pending', icon: FaClock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 3, label: 'Packaged', icon: TbPackage, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 4, label: 'Ready for Pickup', icon: FaTruck, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 5, label: 'Delivering', icon: FaShippingFast, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { id: 6, label: 'Completed', icon: FaCheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 7, label: 'Cancelled', icon: FaExclamationCircle, color: 'bg-red-100 text-red-800 border-red-200' },
];

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const OrderDetail = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [editingField, setEditingField] = useState({});
    const [tempValues, setTempValues] = useState({});
    const [showField, setShowField] = useState({});
    const [editingOrder, setEditingOrder] = useState(null);

    const { data, isLoading, refetch } = useGetOrderByIdQuery({ id, token }, { skip: !id || !token });
    const { data: delivers } = useGetAllDeliverQuery(token, { skip: !token });
    const { refetch: refetchWaste } = useGetAllWasteQuery(token, { skip: !token });
    const saleItemContext = useGetAllSaleQuery({ token, limit: 10, page: 1, search: '' }, { skip: !token });

    const order = data?.data;

    const statusMeta = useMemo(() => {
        return statusOptions.find((status) => status.id === Number(order?.status)) || statusOptions[0];
    }, [order?.status]); 

    const handleEditClick = (field, value) => {
        setEditingField({ field });
        setShowField((prev) => ({ ...prev, [field]: true }));
        setTempValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleCancelEdit = () => {
        setEditingField({});
        setShowField({});
    };

    const handleInputChange = (field, value) => {
        setTempValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveField = async (field, status = 0, overrideValue = null) => {
        if (!order?.order_id) {
            return;
        }

        const value = overrideValue ?? tempValues[field];
        if (value === undefined) {
            return;
        }

        try {
            setEditingOrder(order.order_id);

            let response;
            if (field === 'status') {
                response = await api.put(`status_order/${order.order_id}/${status}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (field === 'delivery_fee') {
                response = await api.put(`edit_delivery_fee/${order.order_id}/${value}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (field === 'deliver_id') {
                response = await api.put(`edit_delivery_service/${order.order_id}/${value}`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            if (response?.status === 200) {
                await refetch();
                refetchWaste();
                saleItemContext.refetch();
                toast.success(t('orderUpdatedSuccessfully') || 'Order updated successfully');
                setEditingField({});
                setShowField((prev) => ({ ...prev, [field]: false }));
            } else {
                toast.error(t('failedToUpdateOrder') || 'Failed to update order');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || t('errorUpdatingOrder') || 'Error updating order');
        } finally {
            setEditingOrder(null);
        }
    };

    const isEditing = (field) => editingField.field === field;
    const isFieldVisible = (field) => showField[field] || isEditing(field);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                    <p className="mt-4 text-sm text-slate-600">{t('loadingOrder') || 'Loading order...'}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-5xl p-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-sm text-red-600">{t('orderNotFound') || 'Order not found.'}</p>
                </div>
            </div>
        );
    }

    const StatusIcon = statusMeta.icon;

    return (
        <div className="view-page bg-transparent p-4 md:p-6 transition-colors">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-7xl space-y-6"
            >
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600 rounded-t-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="cancel"
                            onClick={() => navigate(-1)}
                            className="!p-2.5"
                        >
                            <FaArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">{order.order_no}</h1>
                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusMeta.color}`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    <span>{statusMeta.label.toUpperCase()}</span>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t('orderID') || 'Order ID'}: {order.order_id} | {t('date')}: {dayjs(order.order_date).format('YYYY-MM-DD HH:mm')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link to={`/order-list/receipt/${order.order_id}`}>
                            <Button variant="primary">
                                <FaReceipt className="mr-2 h-4 w-4" />
                                {t('receipt') || 'Receipt'}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('totalAmount') || 'Total Amount'}</div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{money(order.order_total)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('payment') || 'Payment'}</div>
                        <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{money(order.payment)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('balance') || 'Balance'}</div>
                        <div className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">{money(order.balance)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 p-5 shadow-sm">
                        <div className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wider">{t('items') || 'Items'}</div>
                        <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    {/* Left Column: Items */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-5 py-4 border-b border-slate-200 dark:border-gray-600 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                    <TbPackage className="text-blue-500" />
                                    {t('orderItems') || 'Order Items'}
                                </h2>
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-[11px] font-bold">
                                    {order.items?.length || 0} {t('products') || 'Products'}
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-gray-600">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="p-5 flex gap-4 hover:bg-slate-50 dark:hover:bg-gray-600/30 transition-colors">
                                        <div className="relative">
                                            {item.item_image || item.image ? (
                                                <img
                                                    src={item.item_image || item.image}
                                                    alt={item.item_name}
                                                    className="h-20 w-20 rounded-xl border border-slate-200 dark:border-gray-500 object-cover shadow-sm"
                                                />
                                            ) : (
                                                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-gray-500 bg-slate-50 dark:bg-gray-800 text-[10px] text-slate-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.item_name}</h3>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                                                        <span className="font-mono bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{item.item_code}</span>
                                                        {item.category_name && (
                                                            <>
                                                                <span className="text-slate-300">|</span>
                                                                <span>{item.category_name}</span>
                                                            </>
                                                        )}
                                                        {item.scale_name && (
                                                            <>
                                                                <span className="text-slate-300">|</span>
                                                                <span>{item.scale_name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                                        {money(Number(item.price || 0) * Number(item.quantity || 0))}
                                                    </div>
                                                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                                                        {money(item.item_price)} × {item.quantity}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Attributes */}
                                            {item.attributes && item.attributes.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {item.attributes.map((attr, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
                                                            <span className="font-bold">{attr.name}:</span> {attr.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-4 grid grid-cols-3 gap-3">
                                                <div className="rounded-xl border border-slate-100 dark:border-gray-600 bg-slate-50/50 dark:bg-gray-800/30 px-3 py-2">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{t('quantity') || 'Qty'}</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-gray-200">{item.quantity}</div>
                                                </div>
                                                <div className="rounded-xl border border-slate-100 dark:border-gray-600 bg-slate-50/50 dark:bg-gray-800/30 px-3 py-2">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{t('stock') || 'Stock'}</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-gray-200">{item.stock?.in_stock ?? item.in_stock ?? 0}</div>
                                                </div>
                                                <div className="rounded-xl border border-slate-100 dark:border-gray-600 bg-slate-50/50 dark:bg-gray-800/30 px-3 py-2">
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{t('discount') || 'Disc'}</div>
                                                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{Number(item.discount || 0)}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status History */}
                        {order.status_details && order.status_details.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm">
                                <div className="bg-slate-50 dark:bg-gray-800/50 px-5 py-4 border-b border-slate-200 dark:border-gray-600">
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                        <FaHistory className="text-orange-500" />
                                        {t('statusHistory') || 'Status History'}
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="space-y-4">
                                        {order.status_details.map((detail, idx) => (
                                            <div key={idx} className="flex gap-4 relative">
                                                {idx !== order.status_details.length - 1 && (
                                                    <div className="absolute left-2 top-6 bottom-[-16px] w-0.5 bg-slate-100 dark:bg-gray-600" />
                                                )}
                                                <div className={`mt-1 h-4 w-4 rounded-full border-2 border-white dark:border-gray-700 z-10 flex-shrink-0 ${
                                                    detail.status === 'completed' ? 'bg-green-500' :
                                                    detail.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{detail.status}</span>
                                                        <span className="text-[11px] text-slate-400">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
                                                        <FaUser className="h-3 w-3" />
                                                        {detail.created_by_name || 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Customer & Update */}
                    <div className="space-y-6">
                        {/* Customer Information */}
                        <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-5 py-4 border-b border-slate-200 dark:border-gray-600">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                    <FaUser className="text-indigo-500" />
                                    {t('customer') || 'Customer'}
                                </h2>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600">
                                    <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-gray-600">
                                        <FaUser className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('name') || 'Name'}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{order.customer_name || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600">
                                    <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-gray-600">
                                        <FaPhone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('phone') || 'Phone'}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white">{order.order_tel || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-slate-50 dark:bg-gray-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600">
                                    <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-gray-600 flex-shrink-0">
                                        <FaMapMarkerAlt className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('address') || 'Address'}</div>
                                        <div className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{order.order_address || 'No address provided'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Update */}
                        <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-5 py-4 border-b border-slate-200 dark:border-gray-600">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                    <FaEdit className="text-blue-500" />
                                    {t('quickUpdate') || 'Quick Update'}
                                </h2>
                            </div>
                            <div className="p-5 space-y-6">
                                {/* Status Update */}
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">{t('status') || 'Status'}</label>
                                        {!isEditing('status') && (
                                            <button
                                                onClick={() => handleEditClick('status', order.status)}
                                                className="text-blue-500 hover:text-blue-700 transition"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {isEditing('status') ? (
                                        <div className="space-y-3 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                {statusOptions.map((option) => {
                                                    const Icon = option.icon;
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleSaveField('status', option.id, option.id)}
                                                            disabled={editingOrder === order.order_id}
                                                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition hover:opacity-80 active:scale-95 ${option.color} ${Number(order.status) === option.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                                                        >
                                                            <Icon className="h-3 w-3" />
                                                            {option.label.toUpperCase()}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="cancel"
                                                onClick={handleCancelEdit}
                                                className="w-full text-[10px] font-bold uppercase"
                                            >
                                                <FaTimes className="mr-2 h-3 w-3" />
                                                {t('cancel') || 'Cancel'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-[11px] font-bold shadow-sm ${statusMeta.color}`}>
                                            <StatusIcon className="h-4 w-4" />
                                            {statusMeta.label.toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Delivery Fee Update */}
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                                            <FaMoneyBillWave className="h-3.5 w-3.5 text-green-500" />
                                            {t('deliveryFee') || 'Delivery Fee'}
                                        </label>
                                        {!isFieldVisible('delivery_fee') && (
                                            <button
                                                onClick={() => handleEditClick('delivery_fee', order.delivery_fee)}
                                                className="text-blue-500 hover:text-blue-700 transition"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {isFieldVisible('delivery_fee') ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={tempValues.delivery_fee ?? order.delivery_fee ?? 0}
                                                onChange={(value) => handleInputChange('delivery_fee', value)}
                                                className="flex-1"
                                                step="0.01"
                                                min="0"
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleSaveField('delivery_fee')}
                                                    className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition"
                                                    disabled={editingOrder === order.order_id}
                                                >
                                                    <FaCheck className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="h-10 w-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                                                >
                                                    <FaTimes className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-gray-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600 text-sm font-bold text-slate-700 dark:text-gray-200">
                                            {money(order.delivery_fee)}
                                        </div>
                                    )}
                                </div>

                                {/* Delivery Service Update */}
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                                            <FaTruck className="h-3.5 w-3.5 text-blue-500" />
                                            {t('deliveryService') || 'Delivery Service'}
                                        </label>
                                        {!isFieldVisible('deliver_id') && (
                                            <button
                                                onClick={() => handleEditClick('deliver_id', order.deliver_id)}
                                                className="text-blue-500 hover:text-blue-700 transition"
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {isFieldVisible('deliver_id') ? (
                                        <div className="flex items-center gap-2">
                                            <RichSearch
                                                data={delivers?.data || []}
                                                value={tempValues.deliver_id ?? order.deliver_id ?? ''}
                                                placeholder={t('selectService') || 'Select Service'}
                                                keyFields={{
                                                    id: 'deliver_id',
                                                    title: 'deliver_name',
                                                }}
                                                onSelected={(value) => handleInputChange('deliver_id', value)}
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleSaveField('deliver_id')}
                                                    className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition"
                                                    disabled={editingOrder === order.order_id}
                                                >
                                                    <FaCheck className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="h-10 w-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                                                >
                                                    <FaTimes className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 dark:bg-gray-800/50 p-3 rounded-xl border border-slate-100 dark:border-gray-600 text-sm font-bold text-slate-700 dark:text-gray-200">
                                            {order.deliver_name || `Service #${order.deliver_id || 'N/A'}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 dark:bg-gray-800/50 px-5 py-4 border-b border-slate-200 dark:border-gray-600">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                    <FaMoneyBillWave className="text-emerald-500" />
                                    {t('paymentSummary') || 'Payment Summary'}
                                </h2>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('subtotal') || 'Subtotal'}</span>
                                    <span className="text-slate-800 dark:text-white">{money(order.order_subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('discount') || 'Discount'}</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">-{money(order.order_discount)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('deliveryFee') || 'Delivery Fee'}</span>
                                    <span className="text-slate-800 dark:text-white">{money(order.delivery_fee)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('tax') || 'Tax'}</span>
                                    <span className="text-slate-800 dark:text-white">{money(order.order_tax)}</span>
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-gray-600 my-2" />
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('method') || 'Method'}</span>
                                    <span className="bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold text-[10px] uppercase text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700">
                                        {order.order_payment_method || 'cash'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-slate-500 dark:text-gray-400 uppercase tracking-tight">{t('paymentStatus') || 'Payment Status'}</span>
                                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                                        order.order_payment_status === 'paid' 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' 
                                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800'
                                    }`}>
                                        {order.order_payment_status || 'unknown'}
                                    </span>
                                </div>
                                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-gray-600 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t('total') || 'Total'}</span>
                                    <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{money(order.order_total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info / Note */}
                        {(order.description || order.reference_no) && (
                            <div className="rounded-2xl border border-slate-200 dark:border-gray-500 bg-white dark:bg-gray-700 shadow-sm p-5 space-y-4">
                                {order.reference_no && (
                                    <div>
                                        <h2 className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            {t('referenceNo') || 'Reference No'}
                                        </h2>
                                        <p className="text-sm font-mono text-slate-700 dark:text-gray-200">{order.reference_no}</p>
                                    </div>
                                )}
                                {order.description && (
                                    <div>
                                        <h2 className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FaInfoCircle className="text-blue-400" />
                                            {t('note') || 'Note'}
                                        </h2>
                                        <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed italic">
                                            "{order.description}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderDetail;
