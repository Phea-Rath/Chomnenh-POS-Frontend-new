import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { useViewOrderMutation } from '../../../app/Features/ordersSlice';

// Helper function for time ago
const timeSince = (date) => {
    const diff = (new Date() - new Date(date)) / 1000;
    if (diff < 60) return `${Math.floor(diff)} second ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minute ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
    return `${Math.floor(diff / 86400)} day ago`;
};

// Custom Avatar component with fallback
const Avatar = ({ src, alt, size = 40 }) => {
    const [error, setError] = useState(false);
    if (src && !error) {
        return (
            <img
                src={src}
                alt={alt}
                className={`w-${size / 4} h-${size / 4} rounded-full object-cover border border-gray-200`}
                onError={() => setError(true)}
            />
        );
    }
    return (
        <div className={`w-${size / 4} h-${size / 4} bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg`}>
            {alt?.charAt(0) || 'U'}
        </div>
    );
};

// Skeleton loader for list items
const SkeletonItem = () => (
    <div className="border-b border-gray-200 p-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const OrderOnline = () => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const { data: dataOrderOnline, refetch, isLoading } = useGetAllOrderOnlineQuery(token);
    const [viewOrder] = useViewOrderMutation();

    useEffect(() => {
        // Add loading flag to each item (though not used, kept for potential future use)
        const enriched = dataOrderOnline?.data?.map(item => ({
            ...item,
            items: item.items.map(i => ({ ...i, loading: false }))
        })) || [];
        setData(enriched);
    }, [dataOrderOnline]);

    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded bg-white">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Online Orders</h3>
                <p className="text-gray-500 text-sm">There are no pending online orders at the moment.</p>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded bg-white divide-y divide-gray-200">
            {isLoading ? (
                // Show skeleton items while loading
                <>
                    <SkeletonItem />
                    <SkeletonItem />
                    <SkeletonItem />
                </>
            ) : (
                data.map((item) => {
                    const totalQuantity = item.items?.reduce((sum, i) => sum + Number(i.quantity || 0), 0) || 0;
                    const isViewed = item?.status === 1; // Assuming status 1 means viewed? Original had bg-gray-300 for status 1
                    return (
                        <div
                            key={item.order_id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors ${isViewed ? 'bg-gray-100' : ''}`}
                        >
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <Avatar src={item.items[0]?.item_image} alt={item.order_tel} size={40} />
                                <div>
                                    <div className="font-medium text-gray-900">{item.order_tel}</div>
                                    <div className="text-xs text-gray-500">
                                        Ordered {timeSince(item.order_date)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-14 sm:ml-0">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {totalQuantity} quantity
                                </span>
                                <button
                                    onClick={() => navigate('/dashboard/order-tracking')}
                                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm font-medium transition-colors"
                                >
                                    Order Tracking
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default OrderOnline;