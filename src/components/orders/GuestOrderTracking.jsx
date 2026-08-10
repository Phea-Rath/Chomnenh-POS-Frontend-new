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
    FaArrowLeft,
    FaPlus,
    FaShapes
} from 'react-icons/fa';
import { GiReceiveMoney } from 'react-icons/gi';
import { MdCancel, MdDeliveryDining, MdIncompleteCircle, MdOutlineDownload, MdPadding, MdWheelchairPickup } from 'react-icons/md';
import { toast } from 'react-toastify';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';
import { useGetOrderByUserQuery } from "@/features/sales/ordersSlice";
import { useGetAllWasteQuery } from "@/features/system/notificationSlice";
import { useNavigate, useParams } from 'react-router';
import Echo from '@/websockets/echo';
import { GrRefresh } from 'react-icons/gr';
import { IoArrowUndoCircle, IoArrowUndoCircleOutline } from 'react-icons/io5';
import handleDownload from '../../services/imageDowload';
import { FaCartShopping } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { FaMoon, FaSun } from 'react-icons/fa';
import { getToken, getGuestToken } from '@/utils/tokenStore';

const PlainButton = ({
    children,
    onClick,
    icon,
    variant = 'default',
    className = '',
    type = 'button',
    disabled = false,
}) => {
    const variants = {
        default: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
        primary: 'border border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700',
        dark: 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${variants[variant]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        >
            {icon}
            {children}
        </button>
    );
};

const PlainModal = ({ open, onClose, onCancel, title, children, footer, width = 700 }) => {
    if (!open) return null;
    const handleClose = onClose || onCancel;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={handleClose}>
            <div
                className="relative max-h-[90vh] overflow-auto rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl"
                style={{ width: typeof width === 'number' ? `${width}px` : width }}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-100"
                >
                    x
                </button>
                <div className="border-b border-slate-700 px-5 py-4">{title}</div>
                <div className="px-5 py-4">{children}</div>
                {footer?.length ? (
                    <div className="flex justify-end gap-2 border-t border-slate-700 px-5 py-4">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const PlainTag = ({ children, className = '' }) => (
    <span className={`inline-flex items-center rounded-full bg-cyan-950/50 px-2 py-1 text-xs font-semibold text-cyan-300 ${className}`}>
        {children}
    </span>
);

const PlainDivider = () => <hr className="my-4 border-t border-slate-700" />;

const GuestOrderTracking = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useParams();
    const profileId = localStorage.getItem('profileId');
    const guest = JSON.parse(localStorage.getItem('guest'));
    const { data, refetch } = useGetOrderByUserQuery({ id: guest.id, token });
    const { refetch: refetchWaste } = useGetAllWasteQuery(getToken());

    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [cancelAlert, setCancelAlert] = useState(false);
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem("darkMode");
        return saved ? JSON.parse(saved) : false;
    });

    // State for Item Details Modal
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [viewingOrder, setViewingOrder] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const receiptRef = React.useRef();
    useEffect(() => {
        setOrders(data?.data);
    }, [data]);

    useEffect(() => {
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    useEffect(() => {
        document.body.dataset.muteRealtimeOrderAlerts = "true";
        document.body.dataset.muteRealtimeOrderAudio = "true";
        return () => {
            delete document.body.dataset.muteRealtimeOrderAlerts;
            delete document.body.dataset.muteRealtimeOrderAudio;
        };
    }, []);

    useEffect(() => {
        if (profileId) {
            Echo.private(`check-online.user.${profileId}`).listen("OnlineEvent", () => {
                refetch();
            });
        }
    }, [profileId, refetch]);

    const handleOpenDetails = (order) => {
        setViewingOrder(order);
        setIsReceiptModalOpen(false);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setIsReceiptModalOpen(false);
        setViewingOrder(null);
    };

    const handleOpenReceipt = () => {
        setIsReceiptModalOpen(true);
    };

    const handleCloseReceipt = () => {
        setIsReceiptModalOpen(false);
    };

    const formatReceiptDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Helper functions (Status, Progress, etc.) remain the same...
    const getStatusBadge = (order) => {
        if (order.is_cancelled) return { text: "Cancelled", color: "bg-red-100 text-red-800 border-red-200", icon: <MdCancel /> };
        if (order.status == 1) return { text: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <MdPadding /> };
        if (order.status == 3) return { text: "Package", color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: <MdWheelchairPickup /> };
        if (order.status == 4) return { text: "Pickup", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <MdWheelchairPickup /> };
        if (order.status == 5) return { text: "Delivery", color: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: <MdDeliveryDining /> };
        if (order.status == 6) return { text: "Completed", color: "bg-green-100 text-green-800 border-green-200", icon: <MdIncompleteCircle /> };
        // if (order.order_payment_status === 'paid') return { text: "Paid", color: "bg-green-100 text-green-800 border-green-200", icon: <FaCheckCircle /> };
        return { text: "Pending", color: "bg-cyan-100 text-cyan-800 border-cyan-200", icon: <FaShoppingBag /> };
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
            const gToken = getGuestToken();
            await api.put(`/order_cancel/${selectedOrder.order_id}`, {}, {
                headers: { Authorization: `Bearer ${gToken}` }
            });
            toast.success(t('orderCancelled'));
            refetch();
        } catch (error) {
            toast.error(t('failedToCancelOrder'));
        } finally {
            setLoading(false);
            setCancelAlert(false);
        }
    };

    return (
        <div className={`component-page min-h-screen p-3 md:p-4 ${darkMode
            ? "bg-slate-950 text-slate-100"
            : "bg-slate-100 text-slate-900"
            }`}>
            <AlertBox
                isOpen={cancelAlert}
                title={t("cancelOrderTitle")}
                message={`Cancel order ${selectedOrder?.order_no}?`}
                onConfirm={confirmCancel}
                onCancel={() => setCancelAlert(false)}
                confirmColor="error"
            />

            {/* ITEM DETAILS MODAL */}
            <PlainModal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        <FaBoxOpen className="text-cyan-500" />
                        <span>{viewingOrder?.order_no}</span>
                    </div>
                }
                open={isDetailsModalOpen}
                onCancel={handleCloseDetails}
                footer={[
                    <PlainButton key="receipt" onClick={handleOpenReceipt} variant={darkMode ? 'dark' : 'default'}>
                        {t('showReceipt')}
                    </PlainButton>,
                    <PlainButton key="close" onClick={handleCloseDetails} variant="primary">
                        {t('close')}
                    </PlainButton>
                ]}
                width={700}
                centered
            >
                {viewingOrder && (
                    <div className="py-2">
                        <div className={`mb-4 grid grid-cols-2 gap-4 rounded-xl border p-3 ${darkMode ? '!border-slate-700 !bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
                            <div>
                                <p className={`text-xs font-bold uppercase ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>Customer</p>
                                <p className="font-medium">{viewingOrder.customer_name}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>Order Date</p>
                                <p className="font-medium">{new Date(viewingOrder.order_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-700">
                            <div className="grid grid-cols-[1.6fr_0.6fr_0.8fr_0.8fr] bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
                                <div>Item</div>
                                <div className="text-center">Qty</div>
                                <div className="text-right">Price</div>
                                <div className="text-right">Total</div>
                            </div>
                            {viewingOrder.items?.map((record, index) => (
                                <div
                                    key={`${record.item_code}-${index}`}
                                    className="grid grid-cols-[1.6fr_0.6fr_0.8fr_0.8fr] items-center border-t border-slate-800 px-4 py-3 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={record.images?.[0]?.image || "https://via.placeholder.com/50"}
                                            alt={record.item_name}
                                            className="h-10 w-10 rounded-lg border border-slate-700 object-cover"
                                        />
                                        <div>
                                            <div className="font-bold text-slate-100">{record.item_name}</div>
                                            <div className="text-xs text-slate-500">{record.item_code}</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <PlainTag>x{record.quantity}</PlainTag>
                                    </div>
                                    <div className="text-right font-semibold text-slate-200">
                                        ${parseFloat(record.price).toFixed(2)}
                                    </div>
                                    <div className="text-right font-bold text-cyan-400">
                                        ${(record.price * record.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PlainDivider />

                        <div className="flex flex-col items-end gap-1">
                            <div className="w-full max-w-[250px] space-y-2">
                                <div className={`flex justify-between ${darkMode ? '!text-slate-400' : 'text-gray-500'}`}>
                                    <span>{t('subtotal')}:</span>
                                    <span>${viewingOrder.order_subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>{t('discount')}:</span>
                                    <span>-${viewingOrder.order_discount.toFixed(2)}</span>
                                </div>
                                <div className={`flex justify-between border-t pt-2 text-lg font-bold ${darkMode ? '!border-slate-700 !text-slate-100' : 'text-gray-800'}`}>
                                    <span>{t('totalAmount')}:</span>
                                    <span className="text-cyan-600">${viewingOrder.order_total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PlainModal>

            <PlainModal
                title={
                    <div className="flex items-center gap-2 text-lg">
                        <FaDollarSign className="text-cyan-500" />
                        <span>{t('orderReceipt')}</span>
                        <PlainButton
                            icon={<MdOutlineDownload className="text-lg text-green-500" />}
                            key="download"
                            onClick={() => handleDownload(receiptRef, 'jpg', 'receipt-preorder', viewingOrder.order_no)}
                            variant={darkMode ? 'dark' : 'default'}
                            className="!px-2.5"
                        />
                    </div>
                }
                open={isReceiptModalOpen}
                onCancel={handleCloseReceipt}
                footer={[
                    <PlainButton key="close" onClick={handleCloseReceipt} variant="primary">
                        {t('close')}
                    </PlainButton>

                ]}
                width={420}
                centered
            >
                {viewingOrder && (
                    <div ref={receiptRef} className={`mx-auto max-w-md rounded-2xl px-5 py-1 text-xs shadow-sm ${darkMode ? '!bg-slate-900 !text-slate-100' : 'bg-white'} `}>
                        <div className={`mb-6 border-b pb-4 text-center ${darkMode ? '!border-slate-700' : ''}`}>
                            <h1 className="text-2xl font-bold">E-Store</h1>
                            <p className={darkMode ? '!text-slate-300' : 'text-black'}>{t('orderReceipt').toUpperCase()}</p>
                            <p className={darkMode ? '!text-slate-300' : 'text-black'}>{t('thankYouPurchase')}</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">Order Number:</span>
                                <span>{viewingOrder.order_no}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">{t('orderDate')}:</span>
                                <span>{formatReceiptDate(viewingOrder.order_date)}</span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">{t('paymentMethod')}:</span>
                                <span className="capitalize">{viewingOrder.order_payment_method || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold">{t('paymentStatus')}:</span>
                                <span className="capitalize">{viewingOrder.order_payment_status || "N/A"}</span>
                            </div>
                        </div>

                        <div className={`mb-6 border-t pt-4 ${darkMode ? '!border-slate-700' : ''}`}>
                            <h2 className="font-bold mb-2">{t('customerInformation').toUpperCase()}</h2>
                            <div className="mb-1">
                                <span className="font-semibold">Name:</span> {viewingOrder.customer_name}
                            </div>
                            <div className="mb-1">
                                <span className="font-semibold">Phone:</span> {viewingOrder.order_tel}
                            </div>
                            <div>
                                <span className="font-semibold">{t('address')}:</span> {viewingOrder.order_address}
                            </div>
                        </div>

                        <div className={`mb-6 border-t pt-4 ${darkMode ? '!border-slate-700' : ''}`}>
                            <h2 className="font-bold mb-3">{t('orderItems').toUpperCase()}</h2>
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${darkMode ? '!border-slate-700' : ''}`}>
                                        <th className="text-left pb-2">{t('item')}</th>
                                        <th className="text-right pb-2">{t('quantity')}</th>
                                        <th className="text-right pb-2">{t('price')}</th>
                                        <th className="text-right pb-2">{t('total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingOrder.items?.map((item, index) => (
                                        <tr key={`${item.item_code}-${index}`} className={`border-b ${darkMode ? '!border-slate-700' : ''}`}>
                                            <td className="py-2">
                                                <div>{item.item_name}</div>
                                                <div className={darkMode ? '!text-slate-500' : 'text-black'}>
                                                    {item.size_name && `Size: ${item.size_name}`}
                                                </div>
                                            </td>
                                            <td className="text-center py-2">{item.quantity}</td>
                                            <td className="text-right py-2">${parseFloat(item.price).toFixed(2)}</td>
                                            <td className="text-right py-2">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={`border-t pt-4 ${darkMode ? '!border-slate-700' : ''}`}>
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">{t('subtotal')}:</span>
                                <span>${parseFloat(viewingOrder.order_subtotal).toFixed(2)}</span>
                            </div>
                            {viewingOrder.order_discount > 0 && (
                                <div className="flex justify-between mb-2">
                                    <span className="font-semibold">{t('discount')} ($):</span>
                                    <span className="text-red-600">-${parseFloat(viewingOrder.order_discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between mb-2">
                                <span className="font-semibold">{t('deliveryFee')}:</span>
                                <span>${parseFloat(viewingOrder.delivery_fee || 0).toFixed(2)}</span>
                            </div>
                            <div className={`mt-2 flex justify-between border-t pt-2 text-lg font-bold ${darkMode ? '!border-slate-700' : ''}`}>
                                <span>TOTAL:</span>
                                <span>${parseFloat(viewingOrder.order_total).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={`mt-8 border-t pt-4 text-center text-sm ${darkMode ? '!border-slate-700 !text-slate-300' : 'text-black'}`}>
                            <p>{t('forQuestions')}</p>
                            <p className="mt-1">{t('thankYouBusiness')}</p>
                            <p className="mt-2 text-xs">{t('receiptId')}: {viewingOrder.order_no}</p>
                        </div>
                    </div>
                )}
            </PlainModal>

            {/* Header */}
            <div className={`mb-4 flex items-center justify-between rounded-2xl border px-4 py-3 ${darkMode ? '!border-slate-700 !bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <h1 className={`flex items-center gap-2 text-xl font-bold ${darkMode ? '!text-slate-100' : 'text-gray-900'}`}>
                    <IoArrowUndoCircleOutline className='!text-base text-red-500 cursor-pointer' onClick={() => navigate(-1)} />
                    <FaShoppingBag className="text-cyan-600" /> {t('tracking')}
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDarkMode((prev) => !prev)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${darkMode
                            ? "border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        {darkMode ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
                    </button>
                    <PlainButton
                        icon={<GrRefresh />}
                        onClick={refetch}
                        variant={darkMode ? 'dark' : 'default'}
                    >
                        {t('refresh')}
                    </PlainButton>
                </div>
            </div>

            {/* Orders Grid */}
            {orders?.length <= 0 || !orders && <div className="mb-6 flex h-full flex-col justify-center gap-4 md:items-center">

                <div className="rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 p-2">
                    <FaCartShopping className="text-white text-2xl" />
                </div>
                <h1 className={`flex items-center gap-3 text-2xl font-bold md:text-3xl ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>
                    {t('orderTrackingManagement')}
                </h1>
                <p className={`mt-2 ${darkMode ? '!text-slate-400' : 'text-gray-600'}`}>
                    {t('manageAllOrdersInOnePlace')}
                </p>


                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-5 py-2.5 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-cyan-700 hover:to-cyan-800"
                >
                    <FaPlus className="w-5 h-5" />
                    {t('orderNow')}
                </button>
            </div>}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {orders?.map((order) => {
                    const statusBadge = getStatusBadge(order);
                    const progress = calculateProgress(order);

                    return (
                        <div key={order.order_id} className={`flex flex-col justify-between rounded-2xl border p-3.5 ${darkMode ? '!border-slate-700 !bg-slate-900' : 'border-gray-200 bg-white shadow-sm'}`}>
                            <div>
                                <div className="mb-3 flex items-start justify-between">
                                    <h3 className={`font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{order.order_no}</h3>
                                    <div className={`rounded-lg px-2 py-1 text-[11px] font-bold border ${statusBadge.color}`}>
                                        {statusBadge.text}
                                    </div>
                                </div>

                                <div className={`mb-3 text-sm ${darkMode ? '!text-slate-400' : 'text-gray-500'}`}>
                                    <div className="flex items-center gap-1"><FaCalendarAlt /> {order.order_date}</div>
                                </div>

                                {!order.is_cancelled && (
                                    <div className="mb-3">
                                        <div className={`h-1.5 w-full overflow-hidden rounded-full ${darkMode ? '!bg-slate-800' : 'bg-gray-100'}`}>
                                            <div className="bg-cyan-500 h-full transition-all" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='mb-2'>
                                <div className="mb-2 flex items-center gap-2">
                                    <div className={`rounded-lg p-2 ${darkMode ? '!bg-slate-800' : 'bg-gray-100'}`}>
                                        <FaUser className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-medium ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{order.customer_name}</p>
                                        <div className={`mt-1 flex items-center gap-2 text-sm ${darkMode ? '!text-slate-400' : 'text-gray-500'}`}>
                                            <FaPhone className="w-3 h-3 text-cyan-700" />
                                            <span>{order.order_tel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`mt-1 rounded-lg p-2 ${darkMode ? '!bg-slate-800' : 'bg-gray-100'}`}>
                                        <FaMapMarkerAlt className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? '!text-slate-300' : 'text-gray-700'}`}>{order.order_address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 flex items-center justify-between">

                                <div className="flex items-center gap-2">

                                    {order.deliver_image ? <div className='h-8 w-8 overflow-hidden rounded-lg object-cover'>

                                        <img src={order.deliver_image} alt="" />

                                    </div> : <div className={`rounded-lg p-2 bg-orange-300`}>

                                        <FaTruck />

                                    </div>}

                                    <div>

                                        <p className={`text-sm font-medium ${darkMode ? '!text-slate-200' : 'text-gray-700'}`}>{order.deliver_name}</p>

                                        <p className={`text-xs capitalize ${darkMode ? '!text-slate-500' : 'text-gray-500'}`}>{'deliver'}</p>

                                    </div>

                                </div>



                                <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium bg-orange-300 text-orange-900 border-orange-400`}>

                                    <span className="capitalize">${(order.delivery_fee || 0).toFixed(2)}</span>

                                </div>

                            </div>
                            <div className="mb-3 flex items-center justify-between">
                                <div className={`flex justify-between border-t pt-2 text-lg font-bold ${darkMode ? '!border-slate-700 !text-slate-100' : 'text-gray-800'}`}>
                                    <span>{t('totalAmount')}:</span>
                                    <span className="text-cyan-600 ml-3">${order?.order_total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => handleOpenDetails(order)}
                                    className={`w-full rounded-xl py-2 text-sm font-medium transition ${darkMode ? '!bg-cyan-950/40 !text-cyan-300 hover:!bg-cyan-950/60' : 'bg-cyan-100 text-cyan-600 hover:bg-cyan-100'}`}
                                >
                                    {t('viewItemDetails')}
                                </button>

                                {/* {!order.is_cancelled && order.status === 1 && (
                                    <button
                                        onClick={() => handleCancelOrder(order)}
                                        className="w-full bg-red-50 text-red-600 py-2 rounded-lg font-medium hover:bg-red-100 transition"
                                    >
                                        Cancel Order
                                    </button>
                                )} */}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GuestOrderTracking;
