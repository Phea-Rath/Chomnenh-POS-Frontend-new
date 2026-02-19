import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';

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
                className={`w-${size / 4} h-${size / 4} rounded object-cover border border-gray-200`}
                onError={() => setError(true)}
            />
        );
    }
    return (
        <div className={`w-${size / 4} h-${size / 4} bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-lg`}>
            {alt?.charAt(0) || 'W'}
        </div>
    );
};

// Skeleton loader for list items
const SkeletonItem = () => (
    <div className="border-b border-gray-200 p-4 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
            <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const Waste = () => {
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const { data: dataWaste, refetch, isLoading } = useGetAllWasteQuery(token);

    useEffect(() => {
        setData(dataWaste?.data || []);
    }, [dataWaste]);

    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded bg-white">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Waste Items</h3>
                <p className="text-gray-500 text-sm">There are no waste items recorded at the moment.</p>
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
                data.map((item) => (
                    <div
                        key={item.item_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-4 mb-3 sm:mb-0">
                            <Avatar src={item.item_image} alt={item.item_name} size={40} />
                            <div>
                                <div className="font-medium text-gray-900">{item.item_name}</div>
                                <div className="text-xs text-gray-500">
                                    This item wasted {timeSince(item?.expire_date)}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-14 sm:ml-0">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {item.waste_quantity} wasted
                            </span>
                            <button
                                onClick={() => navigate('/dashboard/detail-waste/' + item.item_id)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 text-sm font-medium transition-colors"
                            >
                                More
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Waste;