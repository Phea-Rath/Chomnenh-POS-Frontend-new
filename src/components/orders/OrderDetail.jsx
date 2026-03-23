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
} from 'react-icons/fa';
import { TbPackage } from 'react-icons/tb';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useGetAllDeliverQuery } from '../../../app/Features/deliversSlice';
import { useGetOrderByIdQuery } from '../../../app/Features/ordersSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';

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
                toast.success('Order updated successfully');
                setEditingField({});
                setShowField((prev) => ({ ...prev, [field]: false }));
            } else {
                toast.error('Failed to update order');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error updating order');
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
                    <p className="mt-4 text-sm text-slate-600">Loading order...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-5xl p-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <p className="text-sm text-red-600">Order not found.</p>
                </div>
            </div>
        );
    }

    const StatusIcon = statusMeta.icon;

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-6">
            <div className="mx-auto max-w-6xl space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                                title="Back"
                            >
                                <FaArrowLeft className="h-4 w-4" />
                            </button>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-lg font-semibold text-slate-900">{order.order_no}</h1>
                                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusMeta.color}`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        <span>{statusMeta.label}</span>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Order ID: {order.order_id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start">
                            <Link
                                to={`/order-list/receipt/${order.order_id}`}
                                title="Receipt"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
                            >
                                <FaReceipt className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{money(order.order_total)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">Payment</div>
                        <div className="mt-1 text-lg font-bold text-emerald-600">{money(order.payment)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">Balance</div>
                        <div className="mt-1 text-lg font-bold text-orange-600">{money(order.balance)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-500">Items</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">
                            {order.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">Order Items</h2>
                                <span className="text-xs text-slate-500">{order.items?.length || 0} product(s)</span>
                            </div>

                            <div className="space-y-3">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-200 p-3">
                                        {item.item_image || item.images?.[0]?.image ? (
                                            <img
                                                src={item.item_image || item.images?.[0]?.image}
                                                alt={item.item_name}
                                                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                                                No Image
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-sm font-semibold text-slate-900">{item.item_name}</h3>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        {item.item_code} {item.category_name ? `| ${item.category_name}` : ''}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold text-blue-700">{money(Number(item.price || 0) * Number(item.quantity || 0))}</div>
                                                    <div className="text-[11px] text-slate-500">{money(item.item_price)} each</div>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                                <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                                                    Qty: <span className="font-semibold">{item.quantity}</span>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                                                    Stock: <span className="font-semibold">{item.stock?.in_stock ?? item.in_stock ?? 0}</span>
                                                </div>
                                                <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">
                                                    Discount: <span className="font-semibold">{Number(item.discount || 0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Customer</h2>
                            <div className="space-y-3 text-sm text-slate-700">
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <FaUser className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{order.customer_name || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <FaPhone className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{order.order_tel || 'Unknown'}</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                                    <span>{order.order_address || 'Unknown'}</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                    <FaCalendarAlt className="h-3.5 w-3.5 text-slate-400" />
                                    <span>{order.order_date}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">Quick Update</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-slate-700">Status</label>
                                        <button
                                            onClick={() => handleEditClick('status', order.status)}
                                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                            title="Edit status"
                                        >
                                            <FaEdit className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {isEditing('status') ? (
                                        <div className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                {statusOptions.map((option) => {
                                                    const Icon = option.icon;
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            onClick={() => handleSaveField('status', option.id, option.id)}
                                                            disabled={editingOrder === order.order_id}
                                                            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition hover:opacity-90 ${option.color}`}
                                                        >
                                                            <Icon className="h-3.5 w-3.5" />
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                                            >
                                                <FaTimes className="h-3.5 w-3.5" />
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium ${statusMeta.color}`}>
                                            <StatusIcon className="h-3.5 w-3.5" />
                                            {statusMeta.label}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                                            <FaMoneyBillWave className="h-3.5 w-3.5" />
                                            Delivery Fee
                                        </label>
                                        <button
                                            onClick={() => handleEditClick('delivery_fee', order.delivery_fee)}
                                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                            title="Edit delivery fee"
                                        >
                                            <FaEdit className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {isFieldVisible('delivery_fee') ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={tempValues.delivery_fee ?? order.delivery_fee ?? 0}
                                                onChange={(event) => handleInputChange('delivery_fee', event.target.value)}
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                                            />
                                            <button
                                                onClick={() => handleSaveField('delivery_fee')}
                                                className="rounded-xl bg-green-50 p-2.5 text-green-700 transition hover:bg-green-100"
                                                disabled={editingOrder === order.order_id}
                                                title="Save"
                                            >
                                                <FaCheck className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="rounded-xl bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100"
                                                title="Cancel"
                                            >
                                                <FaTimes className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{money(order.delivery_fee)}</div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                                            <FaTruck className="h-3.5 w-3.5" />
                                            Delivery Service
                                        </label>
                                        <button
                                            onClick={() => handleEditClick('deliver_id', order.deliver_id)}
                                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                                            title="Edit delivery service"
                                        >
                                            <FaEdit className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {isFieldVisible('deliver_id') ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={tempValues.deliver_id ?? order.deliver_id ?? ''}
                                                onChange={(event) => handleInputChange('deliver_id', event.target.value)}
                                                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                                            >
                                                <option value="">Delivery service</option>
                                                {delivers?.data?.map((service) => (
                                                    <option key={service.deliver_id} value={service.deliver_id}>
                                                        {service.deliver_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => handleSaveField('deliver_id')}
                                                className="rounded-xl bg-green-50 p-2.5 text-green-700 transition hover:bg-green-100"
                                                disabled={editingOrder === order.order_id}
                                                title="Save"
                                            >
                                                <FaCheck className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="rounded-xl bg-red-50 p-2.5 text-red-700 transition hover:bg-red-100"
                                                title="Cancel"
                                            >
                                                <FaTimes className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                            {order.deliver_name || `Service #${order.deliver_id || 'N/A'}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h2 className="mb-4 text-sm font-semibold text-slate-900">Payment Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{money(order.order_subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Discount</span>
                                    <span className="font-medium text-green-600">-{money(order.order_discount)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Delivery Fee</span>
                                    <span className="font-medium">{money(order.delivery_fee)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax</span>
                                    <span className="font-medium">{money(order.order_tax)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Method</span>
                                    <span className="font-medium capitalize">{order.order_payment_method || 'cash'}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Status</span>
                                    <span className="font-medium capitalize">{order.order_payment_status || 'unknown'}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                                    <span>Total</span>
                                    <span className="text-blue-700">{money(order.order_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetail;
