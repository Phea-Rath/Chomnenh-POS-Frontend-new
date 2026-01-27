import React, { useState, useEffect } from 'react';
import {
    FaTruck,
    FaBoxOpen,
    FaShippingFast,
    FaCheckCircle,
    FaClock,
    FaMoneyBillWave,
    FaMapMarkerAlt,
    FaUser,
    FaPhone,
    FaCalendarAlt,
    FaReceipt,
    FaExclamationCircle,
    FaSync,
    FaEdit,
    FaSave,
    FaTimes,
    FaCheck,
    FaTag,
    FaLocationArrow,
    FaPercentage,
    FaShoppingCart,
    FaList
} from 'react-icons/fa';
import { TbPackage } from 'react-icons/tb';
import api from '../../services/api';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { toast } from 'react-toastify';
import { useGetAllDeliverQuery } from '../../../app/Features/deliversSlice';

const OrderTracking = () => {
    const [orders, setOrders] = useState([]);
    const [editingOrder, setEditingOrder] = useState(null);
    const [editingField, setEditingField] = useState({});
    const [tempValues, setTempValues] = useState({});
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showField, setShowField] = useState({});

    const token = localStorage.getItem('token');
    const { data: delivers } = useGetAllDeliverQuery(token);
    const { data: dataOrderOnline, refetch, isLoading } = useGetAllOrderOnlineQuery(token);

    const statusOptions = [
        { id: 1, value: 'pending', label: 'Pending', icon: FaClock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { id: 3, value: 'packaged', label: 'Packaged', icon: TbPackage, color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { id: 4, value: 'pickup', label: 'Ready for Pickup', icon: FaBoxOpen, color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { id: 5, value: 'delivering', label: 'Delivering', icon: FaShippingFast, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { id: 6, value: 'completed', label: 'Completed', icon: FaCheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
        { id: 7, value: 'cancelled', label: 'cancelled', icon: FaExclamationCircle, color: 'bg-red-100 text-red-800 border-red-200' },
    ];

    const deliveryServices = [
        { value: 'inhouse', label: 'In-house Delivery' },
        { value: 'grab', label: 'Grab' },
        { value: 'delivery_plus', label: 'Delivery Plus' },
        { value: 'nham24', label: 'Nham24' },
        { value: 'foodpanda', label: 'Foodpanda' },
        { value: 'wing', label: 'Wing' },
        { value: 'other', label: 'Other Service' }
    ];

    useEffect(() => {
        setOrders(dataOrderOnline?.data || []);
    }, [dataOrderOnline]);

    const getStatusIcon = (statusId) => {
        const statusObj = statusOptions.find((s) => s.id == statusId);
        return statusObj ? React.createElement(statusObj.icon, { className: "w-4 h-4" }) : null;
    };

    const handleEditClick = (orderId, field, value) => {
        setEditingField({ orderId, field });
        setShowField(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: true
            }
        }));

        setTempValues(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value
            }
        }));
    };

    const handleCancelEdit = () => {
        setEditingField({});
        setShowField({});
    };

    const handleSaveField = async (orderId, field, status = 0) => {
        const value = tempValues[orderId]?.[field];
        console.log(status);

        const order = orders.find(o => o.order_id === orderId);
        if (!order || value === undefined) return;

        try {
            setEditingOrder(orderId);

            const updateData = { [field]: value };
            let response;
            if (field === 'status') {
                updateData.status_id = value;
                response = await api.put(`status_order/${orderId}/${status}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            }
            if (field === 'delivery_fee') {
                response = await api.put(`edit_delivery_fee/${orderId}/${updateData.delivery_fee}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            }
            if (field === 'deliver_id') {
                response = await api.put(`edit_delivery_service/${orderId}/${updateData.deliver_id}`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            }

            if (response?.status === 200) {
                setOrders(prev => prev.map(order =>
                    order.order_id === orderId
                        ? { ...order, [field]: field === 'status' ? parseInt(value) : value }
                        : order
                ));
                refetch();

                toast.success('Order updated successfully');
                setEditingField({});
                setShowField(prev => ({
                    ...prev,
                    [orderId]: {
                        ...prev[orderId],
                        [field]: false
                    }
                }));
            } else {
                toast.error('Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Error updating order');
        } finally {
            setEditingOrder(null);
        }
    };

    const handleInputChange = async (orderId, field, value) => {
        console.log(value);

        setTempValues(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],
                [field]: value
            }
        }));
    };

    const calculateTotalWithFee = (order) => {
        const deliveryFee = parseFloat(order.delivery_fee) || 0;
        const orderTotal = parseFloat(order.order_total) || 0;
        return (orderTotal + deliveryFee).toFixed(2);
    };

    const isEditing = (orderId, field) => {
        return editingField.orderId === orderId && editingField.field === field;
    };

    const isFieldVisible = (orderId, field) => {
        return showField[orderId]?.[field] || isEditing(orderId, field);
    };

    const handleViewItems = (order) => {
        setSelectedOrder(order);
        setShowItemsModal(true);
    };

    const handleCloseItemsModal = () => {
        setShowItemsModal(false);
        setSelectedOrder(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className=" mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <FaTruck className="w-8 h-8 text-blue-600" />
                                Order Tracking
                            </h1>
                            <p className="text-gray-600 mt-2">Track and manage online orders in real-time</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={refetch}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <FaSync className="w-4 h-4" />
                                Refresh
                            </button>
                            <div className="bg-white px-4 py-2 rounded-lg border border-gray-300">
                                <span className="text-xs text-gray-700">
                                    {orders?.length || 0} order{orders?.length !== 1 ? 's' : ''} found
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        {statusOptions?.map((status, index) => {
                            const Icon = status.icon;
                            const count = orders?.filter(order => order.status === status.id).length || 0;
                            return (
                                <div key={index} className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${status.color.split(' ')[0]} ${status.color.split(' ')[1].replace('text-', 'text-opacity-20')}`}>
                                            <Icon className={`w-5 h-5 ${status.color.split(' ')[1]}`} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-gray-800">{count}</div>
                                            <div className="text-xs text-gray-500">{status.label}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Orders Grid */}
                {orders?.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FaTruck className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            There are currently no online orders to track. Orders will appear here when customers place orders online.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders?.map((order) => (
                            <div
                                key={order.order_id}
                                className={`bg-white rounded-2xl border ${order.is_cancelled ? 'border-red-400' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                            >
                                {/* Order Header */}
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            {/* Order Number with Edit */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-md font-bold text-gray-800">{order.order_no}</h3>
                                            </div>

                                            {/* Order Date */}
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs text-gray-600">
                                                    {new Date(order.order_date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status with Edit */}
                                        <div className="flex items-center gap-2">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusOptions.find(s => s.id === order.status)?.color}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="text-xs font-medium capitalize">
                                                    {statusOptions.find(s => s.id === order.status)?.label}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(order.order_id, 'status', order.status)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Edit Status"
                                            >
                                                <FaEdit className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Status Editor - Only shown when editing status */}
                                    {isEditing(order.order_id, 'status') && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="text-xs font-medium text-gray-700">Update Status:</label>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="ml-auto p-1 text-red-600 hover:text-red-800"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {statusOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={async () => {
                                                            await handleInputChange(order.order_id, 'status', option.id);
                                                            await handleSaveField(order.order_id, 'status', option.id);
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${option.color} hover:opacity-90 transition-opacity`}
                                                        disabled={editingOrder === order.order_id}
                                                    >
                                                        {React.createElement(option.icon, { className: "w-4 h-4" })}
                                                        <span className="text-xs">{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Customer Info */}
                                    <div className="space-y-3">
                                        {/* Phone Number - Hidden by default */}
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 bg-blue-50 rounded-lg">
                                                    <FaPhone className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Phone Number</div>

                                                    <div className="font-medium text-gray-800 flex items-center gap-2">

                                                        <span className="text-xs text-gray-800">{order.order_tel}</span>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                        {/* Address - Hidden by default */}
                                        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="p-2 bg-green-50 rounded-lg">
                                                    <FaMapMarkerAlt className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Delivery Address</div>

                                                    <div className="font-medium text-gray-800 flex items-center gap-2">
                                                        <span className="text-xs text-gray-900">{order.order_address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* View Items Button */}
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleViewItems(order)}
                                            className="w-full flex items-center justify-center text-sm gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                        >
                                            <FaShoppingCart className="w-4 h-4" />
                                            View Order Items ({order.items?.length || 0})
                                        </button>
                                    </div>
                                </div>

                                {/* Tracking Controls */}
                                <div className="p-6">
                                    <h4 className="font-semibold text-gray-700 mb-4">Update Tracking</h4>

                                    <div className="space-y-4">
                                        {/* Delivery Fee - Hidden by default */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                                    <FaMoneyBillWave className="w-4 h-4" />
                                                    Delivery Fee ($)
                                                </label>
                                                <button
                                                    onClick={() => handleEditClick(order.order_id, 'delivery_fee', order.delivery_fee)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Show and Edit Delivery Fee"
                                                >
                                                    <FaEdit className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {isFieldVisible(order.order_id, 'delivery_fee') ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={tempValues[order.order_id]?.delivery_fee || order.delivery_fee || 0}
                                                            onChange={(e) => handleInputChange(order.order_id, 'delivery_fee', e.target.value)}
                                                            className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleSaveField(order.order_id, 'delivery_fee')}
                                                        className="p-2.5 text-green-600 hover:text-green-800 bg-green-50 rounded-lg"
                                                        disabled={editingOrder === order.order_id}
                                                    >
                                                        <FaCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2.5 text-red-600 hover:text-red-800 bg-red-50 rounded-lg"
                                                    >
                                                        <FaTimes className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-700 py-2 rounded-lg">
                                                    ${(order?.delivery_fee ?? 0).toFixed(2)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Delivery Service - Hidden by default */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
                                                    <FaTruck className="w-4 h-4" />
                                                    Delivery Service
                                                </label>
                                                <button
                                                    onClick={() => handleEditClick(order.order_id, 'deliver_id', order.deliver_id)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Show and Edit Delivery Service"
                                                >
                                                    <FaEdit className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {isFieldVisible(order.order_id, 'deliver_id') ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={tempValues[order.order_id]?.deliver_id || order.deliver_id || ''}
                                                        onChange={(e) => handleInputChange(order.order_id, 'deliver_id', e.target.value)}
                                                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                                                    >
                                                        <option value="" disabled>Delivery service</option>
                                                        {delivers?.data?.map((service) => (
                                                            <option key={service.deliver_id} value={service.deliver_id}>
                                                                {service.deliver_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleSaveField(order.order_id, 'deliver_id')}
                                                        className="p-2.5 text-green-600 hover:text-green-800 bg-green-50 rounded-lg"
                                                        disabled={editingOrder === order.order_id}
                                                    >
                                                        <FaCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2.5 text-red-600 hover:text-red-800 bg-red-50 rounded-lg"
                                                    >
                                                        <FaTimes className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-700 py-2 rounded-lg">
                                                    {order.deliver_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Summary */}
                                    <div className="mt-6 pt-6 border-t text-sm border-gray-200">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-gray-700">
                                                <span>Subtotal:</span>
                                                <span className="font-medium">${parseFloat(order.order_total || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-700">
                                                <span>Delivery Fee:</span>
                                                <span className="font-medium">${parseFloat(order.delivery_fee || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-700">
                                                <span>Discount:</span>
                                                <span className="font-medium text-green-600">
                                                    -${parseFloat(order.order_discount || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-md font-bold text-gray-800 pt-2 border-t border-gray-200">
                                                <span>Total Amount:</span>
                                                <span className="text-blue-600">
                                                    ${calculateTotalWithFee(order)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Items Modal */}
                {showItemsModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                            <FaList className="w-5 h-5 text-blue-600" />
                                            Order Items - {selectedOrder.order_no}
                                        </h2>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {selectedOrder.items?.length || 0} item(s) in this order
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCloseItemsModal}
                                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                                    >
                                        <FaTimes className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="space-y-4">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={item.item_image || item.images?.[0]?.image}
                                                    alt={item.item_name}
                                                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{item.item_name}</h4>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Code: {item.item_code} | Category: {item.category_name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-md font-bold text-blue-600">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 line-through">
                                                            ${(item.item_price * item.quantity).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
                                                    <div className="bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-gray-500">Quantity</div>
                                                        <div className="font-medium">{item.quantity}</div>
                                                    </div>
                                                    <div className="bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-gray-500">Unit Price</div>
                                                        <div className="font-medium">${item.price}</div>
                                                    </div>
                                                    <div className="bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-gray-500">Discount</div>
                                                        <div className="font-medium text-green-600">{item.discount}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary in Modal */}
                                <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-3">Order Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-gray-700">
                                            <span>Items Total:</span>
                                            <span className="font-medium">${parseFloat(selectedOrder.order_subtotal || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700">
                                            <span>Delivery Fee:</span>
                                            <span className="font-medium">${parseFloat(selectedOrder.delivery_fee || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700">
                                            <span>Discount:</span>
                                            <span className="font-medium text-green-600">
                                                -${parseFloat(selectedOrder.order_discount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-md font-bold text-gray-800 pt-2 border-t border-gray-200">
                                            <span>Total Amount:</span>
                                            <span className="text-blue-600">
                                                ${calculateTotalWithFee(selectedOrder)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 bg-gray-50">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleCloseItemsModal}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleViewItems(selectedOrder);
                                        }}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Print Receipt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderTracking;