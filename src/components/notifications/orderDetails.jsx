import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaShoppingBag, FaUser, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBill, FaTag, FaDollarSign, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { IoCashSharp } from 'react-icons/io5';
import { useReceiveOrderMutation } from '../../../app/Features/ordersSlice';
import { Button, message, Popconfirm } from 'antd';
import { toast } from 'react-toastify';
import { Atom } from 'react-loading-indicators';
import { IoMdSkipBackward } from 'react-icons/io';
import { TfiBackLeft } from 'react-icons/tfi';

const OrderDetails = () => {
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const navigator = useNavigate();
    const [orderData, setOrderData] = useState([]);
    const { data, refetch, isLoading } = useGetAllOrderOnlineQuery(token);
    const [receiveOrder, { isLoading: isReceiveLoading }] = useReceiveOrderMutation();
    // Sample data (you would typically get this from props or API)
    useEffect(() => {
        setOrderData(data?.data?.find(order => order.order_id === parseInt(id)) || []);
    }, [data]);

    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    if (isLoading || orderData.length === 0) {
        return <div className='h-full flex justify-center items-center'>
            <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text="Loading data" textColor="#327fcd" />
        </div>
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
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const confirm = async () => {
        const res = await receiveOrder({ id, token });
        try {
            if (res?.data.status === 200) {
                refetch();
                toast.success('Order received successfully!');
                navigator('/dashboard/notification');
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to receive order.');
        }

    };
    const cancel = () => {
        // console.log(e);
        message.error('Click on No');
    };

    return (
        <div className="min-h-screen relative bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
            <Link to={"/dashboard/notification"}><Button type='primary' danger className='flex items-center gap-2 mb-1'> <TfiBackLeft /> Back</Button></Link>
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 text-white">
                    <h1 className="text-2xl font-bold flex items-center">
                        <FaShoppingBag className="mr-2" />
                        Order Details: {orderData?.order_no}
                    </h1>
                    <p className="text-indigo-100 mt-1">
                        Placed on {formatDate(orderData?.order_date)}
                    </p>
                </div>

                <div className="p-6">
                    {/* Order Status */}
                    {/* <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center">
                            <FaCheckCircle className="text-green-500 text-xl mr-2" />
                            <span className="font-semibold text-green-700">
                                {orderData?.status === 1 ? 'Order Completed' : 'Order Processing'}
                            </span>
                        </div>
                    </div> */}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column - Customer Info */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FaUser className="mr-2 text-indigo-500" />
                                Customer Information
                            </h2>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="flex items-center mb-3">
                                    <FaUser className="text-gray-500 mr-2" />
                                    <span className="font-medium">{orderData?.profile_name}</span>
                                </div>

                                <div className="flex items-center mb-3">
                                    <FaPhone className="text-gray-500 mr-2" />
                                    <span>{orderData?.order_tel}</span>
                                </div>

                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="text-gray-500 mr-2 mt-1" />
                                    <span>{orderData?.order_address}</span>
                                </div>
                            </div>

                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FaCalendarAlt className="mr-2 text-indigo-500" />
                                Order Timeline
                            </h2>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="font-medium">Order Placed:</span>
                                    <span className="ml-2">{formatDate(orderData?.created_at)}</span>
                                </div>
                                <div>
                                    <span className="font-medium">Last Updated:</span>
                                    <span className="ml-2">{formatDate(orderData?.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Summary */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FaDollarSign className="mr-2 text-indigo-500" />
                                Order Summary
                            </h2>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="flex justify-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>${orderData?.order_subtotal.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between mb-2">
                                    <span>Discount:</span>
                                    <span className="text-red-500">-${orderData?.order_discount.toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between mb-2">
                                    <span>Delivery Fee:</span>
                                    <span>${orderData?.delivery_fee.toFixed(2)}</span>
                                </div>

                                <hr className="my-3" />

                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>${orderData?.order_total.toFixed(2)}</span>
                                </div>
                            </div>

                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FaTag className="mr-2 text-indigo-500" />
                                Payment Information
                            </h2>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-2">
                                    <span className="font-medium">Payment Status:</span>
                                    <span className="ml-2 text-yellow-600">Processing</span>
                                </div>
                                <div>
                                    <span className="font-medium">Payment Method:</span>
                                    <span className="ml-2">Bank</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Item Display with Navigation */}
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Items in Order</h2>

                        <div className="bg-white border rounded-lg p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row items-center md:items-start">
                                {/* Image with Navigation */}
                                <div className="relative mb-4 md:mb-0 md:mr-6">
                                    <img
                                        src={currentItem.item_image}
                                        alt={currentItem.item_name}
                                        className="w-64 h-64 object-contain rounded-lg border"
                                    />

                                    {orderData?.items.length > 1 && (
                                        <>
                                            <button
                                                onClick={prevItem}
                                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                                            >
                                                <FaChevronLeft className="text-gray-700" />
                                            </button>
                                            <button
                                                onClick={nextItem}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                                            >
                                                <FaChevronRight className="text-gray-700" />
                                            </button>
                                        </>
                                    )}

                                    <div className="text-center mt-2 text-sm text-gray-500">
                                        {currentItemIndex + 1} of {orderData?.items.length}
                                    </div>
                                </div>

                                {/* Item Details */}
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{currentItem.item_name}</h3>
                                    <p className="text-gray-600 mb-2">Code: {currentItem.item_code}</p>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Category</p>
                                            <p className="font-medium">{currentItem.category_name}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Size</p>
                                            <p className="font-medium">{currentItem.size_name}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Color</p>
                                            <div className="flex items-center">
                                                <div
                                                    className="w-5 h-5 rounded-full mr-2 border border-gray-300"
                                                    style={{ backgroundColor: currentItem.color_pick }}
                                                ></div>
                                                <span className="font-medium">Color #{currentItem.color_id}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Quantity</p>
                                            <p className="font-medium">{currentItem.quantity}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Unit Price</p>
                                            <p className="font-medium">${currentItem.item_price.toFixed(2)}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">Total</p>
                                            <p className="font-medium">${currentItem.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* All Items List */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">All Items in This Order</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orderData?.items.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className={index === currentItemIndex ? 'bg-blue-50' : ''}
                                            onClick={() => setCurrentItemIndex(index)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-full object-contain" src={item.item_image} alt={item.item_name} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                                                        <div className="text-sm text-gray-500">{item.item_code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.item_price.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className=' fixed z-1 bottom-20 rounded-sm cursor-pointer flex justify-center items-center active:scale-90 hover:scale-105 transition-all duration-200 bg-amber-200 right-20 w-12 h-12' >
                <Popconfirm
                    title="Receive Orders"
                    description="Are you sure to receive orders?"
                    onConfirm={confirm}
                    onCancel={cancel}
                    okText="Yes"
                    cancelText="No"
                    className='border w-full h-full flex justify-center items-center p-1'
                >
                    <IoCashSharp className=' text-green-500' />
                </Popconfirm>
            </div>
        </div>
    );
};

export default OrderDetails;