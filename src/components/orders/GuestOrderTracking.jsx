import React, { useEffect, useState } from 'react';
import {
    FaShoppingBag,
    FaTruck,
    FaCheckCircle,
    FaTimesCircle,
    FaEdit,
    FaTrash,
    FaEye,
    FaDollarSign,
    FaCalendarAlt,
    FaUser,
    FaPhone,
    FaMapMarkerAlt,
    FaCreditCard,
    FaBoxOpen
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';
import { MdCancel, MdOutlineDeliveryDining } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';
import { useGetAllOrderQuery, useGetOrderByUserQuery } from '../../../app/Features/ordersSlice';

const GuestOrderTracking = () => {
    const { data, refetch } = useGetOrderByUserQuery(localStorage.getItem('guestToken'), {
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const [orders, setOrders] = useState([]);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelAlert, setCancelAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setOrders(data?.data);
    }, [data]);

    // Get status badge styling
    const getStatusBadge = (order) => {
        if (order.is_cancelled) {
            return {
                text: "Cancelled",
                color: "bg-red-100 text-red-800 border-red-200",
                icon: <MdCancel className="w-4 h-4" />
            };
        }

        if (order.order_payment_status === 'paid') {
            return {
                text: "Paid",
                color: "bg-green-100 text-green-800 border-green-200",
                icon: <FaCheckCircle className="w-4 h-4" />
            };
        }

        if (order.order_payment_status === 'cod') {
            return {
                text: "COD",
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: <GiReceiveMoney className="w-4 h-4" />
            };
        }

        return {
            text: "Pending",
            color: "bg-blue-100 text-blue-800 border-blue-200",
            icon: <FaShoppingBag className="w-4 h-4" />
        };
    };

    // Get payment method styling
    const getPaymentMethodBadge = (method) => {
        const methods = {
            cash: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <FaDollarSign className="w-3 h-3" /> },
            card: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: <FaCreditCard className="w-3 h-3" /> },
            transfer: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: <FaCreditCard className="w-3 h-3" /> }
        };
        return methods[method] || methods.cash;
    };

    // Calculate order progress
    const calculateProgress = (order) => {
        if (order.status == 1) return 10;
        if (order.status == 2) return 0;
        if (order.status == 3) return 27;
        if (order.status == 4) return 50;
        if (order.status == 5) return 70;
        if (order.status == 6) return 100;
        return 0;
    };

    // Handle order cancellation
    const handleCancelOrder = (order) => {
        setSelectedOrder(order);
        setCancelAlert(true);
    };

    const confirmCancel = async () => {
        if (!selectedOrder) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('guestToken');

            const response = await api.put(`/order_cancel/${selectedOrder.order_id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 200) {
                toast.success('Order cancelled successfully');
                refetch();
                // // Update the local state
                setOrders(prev => prev.map(order =>
                    order.order_id === selectedOrder.order_id
                        ? { ...order, is_cancelled: 1, status: 0 }
                        : order
                ));
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to cancel order');
        } finally {
            setLoading(false);
            setCancelAlert(false);
            setSelectedOrder(null);
        }
    };

    // Handle edit order
    const handleEditOrder = (order) => {
        // Navigate to edit page or open modal
        toast.info(`Editing order ${order.order_no}`);
        // You can implement navigation or modal here
    };

    // Handle view order details
    const handleViewOrder = (order) => {
        // Navigate to order details page
        toast.info(`Viewing order ${order.order_no}`);
        // You can implement navigation here
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="p-4 md:p-6 bg-gray-200 min-h-screen">
            <AlertBox
                isOpen={cancelAlert}
                title="Cancel Order Confirmation"
                message={`Are you sure you want to cancel order ${selectedOrder?.order_no}? This action cannot be undone.`}
                onConfirm={confirmCancel}
                onCancel={() => {
                    setCancelAlert(false);
                    setSelectedOrder(null);
                }}
                confirmText="Cancel Order"
                cancelText="Keep Order"
                confirmColor="error"
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                            Order Tracking
                        </h1>
                        <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="text-sm font-medium text-gray-700">
                            {orders?.length} order{orders?.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Stats Cards  */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{orders?.length}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <FaShoppingBag className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">
                                    {orders?.filter(o => !o.is_cancelled && o.order_payment_status === 'cod').length}
                                </p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <GiReceiveMoney className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Paid</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {orders?.filter(o => !o.is_cancelled && o.order_payment_status === 'paid').length}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <FaCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Cancelled</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {orders?.filter(o => o.is_cancelled).length}
                                </p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <MdCancel className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders?.map((order) => {
                    const statusBadge = getStatusBadge(order);
                    const paymentBadge = getPaymentMethodBadge(order.order_payment_method);
                    const progress = calculateProgress(order);

                    return (
                        <div
                            key={order.order_id}
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${order.is_cancelled ? 'border-red-200' : 'border-gray-200'
                                }`}
                        >
                            {/* Order Header */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{order.order_no}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm text-gray-500">
                                                {formatDate(order.order_date)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusBadge.color}`}>
                                        {statusBadge.icon}
                                        {statusBadge.text}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                {!order.is_cancelled && (
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                            <span>Order Progress</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${order.order_payment_status === 'paid' ? 'bg-green-500' :
                                                    order.order_payment_status === 'cod' ? 'bg-yellow-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Pending</span>
                                            <span>Packaged</span>
                                            <span>Pickup</span>
                                            <span>Delivering</span>
                                            <span>Completed</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FaUser className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{order.customer_name}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <FaPhone className="w-3 h-3" />
                                            <span>{order.order_tel}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg mt-1">
                                        <FaMapMarkerAlt className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700">{order.order_address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaBoxOpen className="w-4 h-4 text-gray-500" />
                                    <h4 className="font-medium text-gray-700">Items ({order.items.length})</h4>
                                </div>

                                <div className="space-y-3">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={item.images?.[0]?.image || "https://via.placeholder.com/150"}
                                                    alt={item.item_name}
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">{item.item_name}</p>
                                                <p className="text-xs text-gray-500">{item.category_name} • {item.item_code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    ${item.price.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="p-5">
                                <div className="space-y-2 mb-5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">${order.order_subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-medium text-green-600">-${order.order_discount.toFixed(2)}</span>
                                    </div>
                                    {order.delivery_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Delivery</span>
                                            <span className="font-medium">${order.delivery_fee.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">${order.order_tax.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-base font-semibold">
                                        <span className="text-gray-800">Total</span>
                                        <span className="text-blue-600">${order.order_total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${paymentBadge.color.split(' ')[0]}`}>
                                            {paymentBadge.icon}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Payment</p>
                                            <p className="text-xs text-gray-500 capitalize">{order.order_payment_method}</p>
                                        </div>
                                    </div>

                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium ${paymentBadge.color}`}>
                                        <span className="capitalize">{order.order_payment_status}</span>
                                    </div>
                                </div>
                                {<div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        {true ? <div className='w-8 h-8 object-cover rounded-lg overflow-hidden'>
                                            <img src={order.deliver_image} alt="" />
                                        </div> : <div className={`p-2 rounded-lg bg-orange-300`}>
                                            <FaTruck />
                                        </div>}
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">{order.deliver_name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{'deliver'}</p>
                                        </div>
                                    </div>

                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium bg-orange-300 text-orange-900 border-orange-400`}>
                                        <span className="capitalize">${(order.delivery_fee || 0).toFixed(2)}</span>
                                    </div>
                                </div>}

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {/* <button
                                        onClick={() => handleViewOrder(order)}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                    >
                                        <FaEye className="w-4 h-4" />
                                        View
                                    </button> */}

                                    {!order?.is_cancelled && order?.status == 1 && (
                                        <>
                                            {/* <button
                                                onClick={() => handleEditOrder(order)}
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                                            >
                                                <FaEdit className="w-4 h-4" />
                                                Edit
                                            </button> */}

                                            <button
                                                onClick={() => handleCancelOrder(order)}
                                                disabled={loading}
                                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                <FaTimesCircle className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {orders?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 max-w-md text-center mb-6">
                        All orders will appear here once customers start placing orders.
                    </p>
                </div>
            )}
        </div>
    );
};

export default GuestOrderTracking;