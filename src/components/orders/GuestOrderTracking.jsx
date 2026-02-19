import React, { useEffect, useState } from 'react';
import {
    FaShoppingBag,
    FaCheckCircle,
    FaTimesCircle,
    FaDollarSign,
    FaCalendarAlt,
    FaUser,
    FaPhone,
    FaMapMarkerAlt,
    FaCreditCard,
    FaBoxOpen,
    FaTruck,
    FaArrowLeft
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';
import { MdCancel, MdDeliveryDining, MdIncompleteCircle, MdPadding, MdWheelchairPickup } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';
import { useGetOrderByUserQuery } from '../../../app/Features/ordersSlice';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { useNavigate, useParams } from 'react-router';
import Echo from '../../echo';
import { Button, Modal, Table, Tag, Divider } from 'antd';
import { GrRefresh } from 'react-icons/gr';
import { IoArrowUndoCircle, IoArrowUndoCircleOutline } from 'react-icons/io5';

const GuestOrderTracking = () => {
    const navigate = useNavigate();
    const { token } = useParams();
    const profileId = localStorage.getItem('profileId');
    const guest = JSON.parse(localStorage.getItem('guest'));
    const { data, refetch } = useGetOrderByUserQuery({ id: guest.id, token });
    const { refetch: refetchWaste } = useGetAllWasteQuery(localStorage.getItem('token'));

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelAlert, setCancelAlert] = useState(false);
    const [loading, setLoading] = useState(false);

    // State for Item Details Modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingOrder, setViewingOrder] = useState(null);

    useEffect(() => {
        setOrders(data?.data);
    }, [data]);

    useEffect(() => {
        if (profileId) {
            Echo.private(`check-online.user.${profileId}`).listen("OnlineEvent", () => {
                refetch();
            });
        }
    }, [profileId, refetch]);

    const handleOpenDetails = (order) => {
        setViewingOrder(order);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setViewingOrder(null);
    };

    // Columns for the Items Table inside Modal
    const itemColumns = [
        {
            title: 'Item',
            dataIndex: 'item_name',
            key: 'item_name',
            render: (text, record) => (
                <div className="flex items-center gap-3">
                    <img
                        src={record.images?.[0]?.image || "https://via.placeholder.com/50"}
                        alt={text}
                        className="w-10 h-10 rounded shadow-sm object-cover"
                    />
                    <div>
                        <div className="font-bold text-gray-800">{text}</div>
                        <div className="text-xs text-gray-400">{record.item_code}</div>
                    </div>
                </div>
            )
        },
        {
            title: 'Qty',
            dataIndex: 'quantity',
            key: 'quantity',
            align: 'center',
            render: (qty) => <Tag color="blue">x{qty}</Tag>
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (price) => <span className="font-semibold">${price.toFixed(2)}</span>
        },
        {
            title: 'Total',
            key: 'total',
            align: 'right',
            render: (_, record) => (
                <span className="font-bold text-blue-600">
                    ${(record.price * record.quantity).toFixed(2)}
                </span>
            )
        }
    ];

    // Helper functions (Status, Progress, etc.) remain the same...
    const getStatusBadge = (order) => {
        if (order.is_cancelled) return { text: "Cancelled", color: "bg-red-100 text-red-800 border-red-200", icon: <MdCancel /> };
        if (order.status == 1) return { text: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <MdPadding /> };
        if (order.status == 3) return { text: "Package", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: <MdWheelchairPickup /> };
        if (order.status == 4) return { text: "Pickup", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <MdWheelchairPickup /> };
        if (order.status == 5) return { text: "Delivery", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <MdDeliveryDining /> };
        if (order.status == 6) return { text: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: <MdIncompleteCircle /> };
        // if (order.order_payment_status === 'paid') return { text: "Paid", color: "bg-green-100 text-green-800 border-green-200", icon: <FaCheckCircle /> };
        return { text: "Pending", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <FaShoppingBag /> };
    };

    const calculateProgress = (order) => {
        const steps = { 1: 10, 3: 27, 4: 50, 5: 70, 6: 100 };
        return steps[order.status] || 0;
    };

    const handleCancelOrder = (order) => {
        setSelectedOrder(order);
        setCancelAlert(true);
    };

    const confirmCancel = async () => {
        try {
            setLoading(true);
            const gToken = localStorage.getItem('guestToken');
            await api.put(`/order_cancel/${selectedOrder.order_id}`, {}, {
                headers: { Authorization: `Bearer ${gToken}` }
            });
            toast.success('Order cancelled');
            refetch();
        } catch (error) {
            toast.error('Failed to cancel');
        } finally {
            setLoading(false);
            setCancelAlert(false);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gray-200 min-h-screen">
            <AlertBox
                isOpen={cancelAlert}
                title="Cancel Order"
                message={`Cancel order ${selectedOrder?.order_no}?`}
                onConfirm={confirmCancel}
                onCancel={() => setCancelAlert(false)}
                confirmColor="error"
            />

            {/* ITEM DETAILS MODAL */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        <FaBoxOpen className="text-blue-500" />
                        <span>{viewingOrder?.order_no}</span>
                    </div>
                }
                open={isDetailsModalOpen}
                onCancel={handleCloseDetails}
                footer={[
                    <Button key="close" onClick={handleCloseDetails} type="primary">
                        Close
                    </Button>
                ]}
                width={700}
                centered
            >
                {viewingOrder && (
                    <div className="py-2">
                        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Customer</p>
                                <p className="font-medium">{viewingOrder.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Order Date</p>
                                <p className="font-medium">{new Date(viewingOrder.order_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <Table
                            dataSource={viewingOrder.items}
                            columns={itemColumns}
                            pagination={false}
                            rowKey={(record) => record.item_code}
                            size="small"
                            className="mb-4"
                        />

                        <Divider />

                        <div className="flex flex-col items-end gap-1">
                            <div className="w-full max-w-[250px] space-y-2">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal:</span>
                                    <span>${viewingOrder.order_subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Discount:</span>
                                    <span>-${viewingOrder.order_discount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600">${viewingOrder.order_total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <IoArrowUndoCircleOutline className='!text-md text-red-500' onClick={() => navigate(-1)} />
                    <FaShoppingBag className="text-blue-600" /> Tracking
                </h1>
                <Button icon={<GrRefresh />} onClick={refetch}>Refresh</Button>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders?.map((order) => {
                    const statusBadge = getStatusBadge(order);
                    const progress = calculateProgress(order);

                    return (
                        <div key={order.order_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-800">{order.order_no}</h3>
                                    <div className={`px-2 py-1 rounded-md text-xs font-bold border ${statusBadge.color}`}>
                                        {statusBadge.text}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1"><FaCalendarAlt /> {order.order_date}</div>
                                </div>

                                {!order.is_cancelled && (
                                    <div className="mb-4">
                                        <div className="bg-gray-100 h-1.5 w-full rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='mb-2'>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FaUser className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800 text-xs">{order.customer_name}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <FaPhone className="w-3 h-3 text-blue-700" />
                                            <span>{order.order_tel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg mt-1">
                                        <FaMapMarkerAlt className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-700">{order.order_address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-5">

                                <div className="flex items-center gap-2">

                                    {order.deliver_image ? <div className='w-8 h-8 object-cover rounded-lg overflow-hidden'>

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

                            </div>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600 ml-3">${order?.order_total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleOpenDetails(order)}
                                    className="w-full bg-blue-100 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
                                >
                                    View Item Details
                                </button>

                                {!order.is_cancelled && order.status === 1 && (
                                    <button
                                        onClick={() => handleCancelOrder(order)}
                                        className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition"
                                    >
                                        Cancel Order
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GuestOrderTracking;