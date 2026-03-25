import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { FaExclamationTriangle, FaBoxes, FaClock, FaChevronRight } from 'react-icons/fa';
import { Progress, Empty } from 'antd';

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

    const totalTaken = data.reduce((sum, item) => sum + parseInt(item.taken_quantity || 0), 0);
    const totalExpired = data.reduce((sum, item) => sum + parseInt(item.expired_quantity || 0), 0);

    console.log(data);


    // Empty state
    if (!isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded bg-white">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Waste Items</h3>
                <p className="text-gray-500 text-sm">All stock quantities are sufficient.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Total Items</p>
                            <p className="text-2xl font-bold">{data.length}</p>
                        </div>
                        <FaBoxes className="text-3xl text-red-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Total Taken Quantity</p>
                            <p className="text-2xl font-bold">{totalTaken.toLocaleString()}</p>
                        </div>
                        <FaExclamationTriangle className="text-3xl text-orange-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Total Expired Quantity</p>
                            <p className="text-2xl font-bold">{totalExpired.toLocaleString()}</p>
                        </div>
                        <FaClock className="text-3xl text-yellow-200" />
                    </div>
                </div>
            </div>

            {/* Waste List */}
            <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Items with Insufficient Stock</h3>
                    <p className="text-sm text-gray-500">Items where current stock is below needed quantity</p>
                </div>

                {isLoading ? (
                    <>
                        <SkeletonItem />
                        <SkeletonItem />
                        <SkeletonItem />
                    </>
                ) : (
                    data.map((item) => (
                        <div
                            key={item.item_id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/detail-waste/${item.item_id}`)}
                        >
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                                    <span className="text-lg font-bold text-red-600">
                                        {item.item_name?.charAt(0).toUpperCase() || 'W'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate">{item.item_name}</div>
                                    <div className="text-sm text-gray-500">{item.category_name}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 ml-16 sm:ml-0">
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            {parseInt(item.taken_quantity).toLocaleString()} taken
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            {parseInt(item.expired_quantity).toLocaleString()} expired
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Progress
                                        type="circle"
                                        percent={Math.round((parseInt(item.expired_quantity) / parseInt(item.taken_quantity)) * 100)}
                                        size={40}
                                        strokeColor={parseInt(item.expired_quantity) === parseInt(item.taken_quantity) ? '#ef4444' : '#f59e0b'}
                                        trailColor="#e5e7eb"
                                        format={(percent) => (
                                            <span className="text-xs font-medium">{percent}%</span>
                                        )}
                                    />
                                </div>
                                <FaChevronRight className="text-gray-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Waste;
