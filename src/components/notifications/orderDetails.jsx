import React, { useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaShoppingBag,
    FaUser,
    FaPhone,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMoneyBill,
    FaTag,
    FaDollarSign,
    FaCheckCircle,
    FaBox,
    FaCreditCard,
    FaTruck,
    FaReceipt,
    FaChevronLeft,
    FaChevronRight,
    FaList
} from 'react-icons/fa';
import {
    IoCashSharp,
    IoCheckmarkCircle,
    IoEllipsisHorizontal
} from 'react-icons/io5';
import { Link, useNavigate, useParams } from 'react-router';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { useReceiveOrderMutation } from '../../../app/Features/ordersSlice';
import { Button, message, Popconfirm, Badge, Progress, Card, Statistic } from 'antd';
import { toast } from 'react-toastify';
import { Atom } from 'react-loading-indicators';

const OrderDetails = () => {
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const navigator = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const { data, refetch, isLoading } = useGetAllOrderOnlineQuery(token);
    const [receiveOrder, { isLoading: isReceiveLoading }] = useReceiveOrderMutation();
    const [activeTab, setActiveTab] = useState('overview');
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    useEffect(() => {
        if (data?.data) {
            const foundOrder = data.data.find(order => order.order_id === parseInt(id));
            setOrderData(foundOrder);
        }
    }, [data, id]);

    if (isLoading || !orderData) {
        return (
            <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50'>
                <div className="text-center">
                    <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-blue-50 rounded-full"></div>
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Order Details</h2>
                    <p className="text-gray-500">Fetching order information...</p>
                </div>
            </div>
        );
    }

    const currentItem = orderData?.items[currentItemIndex];

    const nextItem = () => {
        setCurrentItemIndex((prevIndex) =>
            prevIndex === orderData?.items.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevItem = () => {
        setCurrentItemIndex((prevIndex) =>
            prevIndex === 0 ? orderData?.items.length - 1 : prevIndex - 1
        );
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            1: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed', icon: <IoCheckmarkCircle /> },
            0: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Processing', icon: <IoEllipsisHorizontal /> },
            2: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Shipped', icon: <FaTruck /> },
            3: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Delivered', icon: <FaBox /> }
        };

        const config = statusConfig[status] || statusConfig[0];
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const confirm = async () => {
        const res = await receiveOrder({ id, token });
        try {
            if (res?.data.status === 200) {
                refetch();
                toast.success('🎉 Order received successfully!');
                navigator('/dashboard/notification');
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to receive order.');
        }
    };

    const cancel = () => {
        message.error('Action cancelled');
    };

    const tabs = [
        { key: 'overview', label: 'Overview', icon: <FaReceipt /> },
        { key: 'items', label: 'Items', icon: <FaList /> },
        { key: 'customer', label: 'Customer', icon: <FaUser /> },
        { key: 'payment', label: 'Payment', icon: <FaCreditCard /> }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <Link to="/dashboard/notification">
                                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                    <FaArrowLeft className="w-4 h-4" />
                                    <span className="font-medium">Back</span>
                                </button>
                            </Link>
                            <div className="hidden md:block">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                        <FaShoppingBag className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                                        <p className="text-gray-600">#{orderData.order_no}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {getStatusBadge(orderData?.status)}
                            <div className="hidden md:block text-right">
                                <p className="text-sm text-gray-500">Order Date</p>
                                <p className="font-medium">{formatDate(orderData?.order_date)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Total Amount"
                            value={orderData?.order_total}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#3f51b5' }}
                        />
                        <p className="text-sm text-gray-500 mt-2">Final order total</p>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Items"
                            value={orderData?.items?.length || 0}
                            valueStyle={{ color: '#10b981' }}
                        />
                        <p className="text-sm text-gray-500 mt-2">Products ordered</p>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Discount"
                            value={orderData?.order_discount}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#ef4444' }}
                        />
                        <p className="text-sm text-gray-500 mt-2">Total savings</p>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <Statistic
                            title="Delivery"
                            value={orderData?.delivery_fee}
                            precision={2}
                            prefix="$"
                            valueStyle={{ color: '#f59e0b' }}
                        />
                        <p className="text-sm text-gray-500 mt-2">Shipping cost</p>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex space-x-1 border-b border-gray-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === tab.key
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Order Timeline */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <FaCalendarAlt className="text-blue-500" />
                                        Order Timeline
                                    </h2>
                                    <div className="space-y-4">
                                        {[
                                            { date: orderData?.created_at, title: 'Order Placed', status: 'completed' },
                                            { date: orderData?.updated_at, title: 'Last Updated', status: 'completed' },
                                            { date: new Date().toISOString(), title: 'Processing', status: 'current' },
                                            { title: 'Delivery', status: 'pending' }
                                        ].map((item, index) => (
                                            <div key={index} className="flex items-start">
                                                <div className="flex flex-col items-center mr-4">
                                                    <div className={`w-3 h-3 rounded-full ${item.status === 'completed' ? 'bg-green-500' :
                                                        item.status === 'current' ? 'bg-blue-500' :
                                                            'bg-gray-300'
                                                        }`}></div>
                                                    {index < 3 && <div className="w-0.5 h-10 bg-gray-300 mt-2"></div>}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                                                    {item.date && (
                                                        <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <FaUser className="text-blue-500" />
                                        Customer Information
                                    </h2>
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <FaUser className="w-5 h-5 text-gray-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Customer Name</p>
                                                    <p className="font-semibold text-gray-900">{orderData?.profile_name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                    <FaPhone className="w-5 h-5 text-gray-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Phone Number</p>
                                                    <p className="font-semibold text-gray-900">{orderData?.order_tel}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm mt-1">
                                                    <FaMapMarkerAlt className="w-5 h-5 text-gray-700" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600">Delivery Address</p>
                                                    <p className="font-semibold text-gray-900">{orderData?.order_address}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'items' && (
                        <div className="p-6">
                            {/* Featured Item Display */}
                            <div className="mb-8">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                                    <div className="flex flex-col lg:flex-row items-center gap-8">
                                        <div className="relative">
                                            <img
                                                src={currentItem?.item_image || 'https://via.placeholder.com/300'}
                                                alt={currentItem?.item_name}
                                                className="w-64 h-64 object-contain rounded-xl border-4 border-white shadow-lg"
                                            />
                                            {orderData?.items.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={prevItem}
                                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
                                                    >
                                                        <FaChevronLeft className="w-5 h-5 text-gray-700" />
                                                    </button>
                                                    <button
                                                        onClick={nextItem}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
                                                    >
                                                        <FaChevronRight className="w-5 h-5 text-gray-700" />
                                                    </button>
                                                </>
                                            )}
                                            <div className="text-center mt-4">
                                                <span className="text-sm text-gray-500">
                                                    {currentItemIndex + 1} of {orderData?.items.length}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="mb-4">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                    {currentItem?.item_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span>Code: {currentItem?.item_code}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{currentItem?.category_name}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                {[
                                                    // { label: 'Color', value: currentItem?.color_pick, isColor: true },
                                                    // { label: 'Size', value: currentItem?.size_name },
                                                    { label: 'Quantity', value: currentItem?.quantity },
                                                    { label: 'Unit Price', value: `$${currentItem?.item_price?.toFixed(2)}` },
                                                    { label: 'Total', value: `$${currentItem?.price?.toFixed(2)}`, highlight: true }
                                                ].map((item, index) => (
                                                    <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                                        <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                                                        {item.isColor ? (
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-6 h-6 rounded-full border border-gray-300"
                                                                    style={{ backgroundColor: item.value }}
                                                                ></div>
                                                                <span className={`font-semibold ${item.highlight ? 'text-blue-600' : 'text-gray-900'}`}>
                                                                    {item.value}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className={`text-lg font-semibold ${item.highlight ? 'text-blue-600' : 'text-gray-900'}`}>
                                                                {item.value}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* All Items Table */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">All Order Items</h3>
                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orderData?.items.map((item, index) => (
                                                <tr
                                                    key={item.id}
                                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${index === currentItemIndex ? 'bg-blue-50' : ''
                                                        }`}
                                                    onClick={() => setCurrentItemIndex(index)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <img
                                                                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                                src={item.item_image}
                                                                alt={item.item_name}
                                                            />
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.item_name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {item.item_code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            {/* <div className="flex items-center gap-2">
                                                                <div
                                                                    className="w-4 h-4 rounded-full border border-gray-300"
                                                                    style={{ backgroundColor: item.color_pick }}
                                                                ></div>
                                                                <span className="text-sm text-gray-600">{item.size_name}</span>
                                                            </div> */}
                                                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            ${item.item_price.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-gray-900">
                                                            ${item.price.toFixed(2)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'customer' && (
                        <div className="p-6">
                            <div className="max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-8">Customer Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { icon: <FaUser />, label: 'Full Name', value: orderData?.profile_name },
                                        { icon: <FaPhone />, label: 'Phone Number', value: orderData?.order_tel },
                                        { icon: <FaMapMarkerAlt />, label: 'Address', value: orderData?.order_address },
                                        { icon: <FaCalendarAlt />, label: 'Member Since', value: formatDate(orderData?.created_at) },
                                    ].map((item, index) => (
                                        <div key={index} className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-white rounded-lg">
                                                    {item.icon}
                                                </div>
                                                <span className="text-sm text-gray-500">{item.label}</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'payment' && (
                        <div className="p-6">
                            <div className="max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 mb-8">Payment Information</h2>
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        {[
                                            { label: 'Subtotal', value: `$${orderData?.order_subtotal.toFixed(2)}` },
                                            { label: 'Discount', value: `-$${orderData?.order_discount.toFixed(2)}`, color: 'text-red-600' },
                                            { label: 'Delivery Fee', value: `$${orderData?.delivery_fee.toFixed(2)}` },
                                            { label: 'Total Amount', value: `$${orderData?.order_total.toFixed(2)}`, bold: true }
                                        ].map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-3 border-b border-green-200">
                                                <span className="text-gray-600">{item.label}</span>
                                                <span className={`font-medium ${item.color || 'text-gray-900'} ${item.bold ? 'text-lg' : ''}`}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between bg-white rounded-lg p-4">
                                            <div className="flex items-center gap-3">
                                                <FaCreditCard className="w-6 h-6 text-gray-700" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Payment Method</p>
                                                    <p className="text-sm text-gray-500">Bank Transfer</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                Processing
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-8 right-8 z-20">
                <Popconfirm
                    title="Confirm Order Receipt"
                    description="Are you sure you want to mark this order as received?"
                    onConfirm={confirm}
                    onCancel={cancel}
                    okText="Yes, Receive"
                    cancelText="Cancel"
                    okButtonProps={{ loading: isReceiveLoading }}
                >
                    <button className="group flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-full shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300">
                        <IoCashSharp className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span className="font-semibold">Receive Order</span>
                    </button>
                </Popconfirm>
            </div>
        </div>
    );
};

export default OrderDetails;