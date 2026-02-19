import React, { useEffect, useState } from 'react';
import { Atom } from 'react-loading-indicators';
import Waste from './waste';
import OrderOnline from './orderOnline';
import { useGetAllOrderOnlineQuery, useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { useOutletsContext } from '../../layouts/Management';
import '../../../public/sounds/notification.mp3';
import echo from '../../echo';
import { useNavigate } from 'react-router';

const Notification = () => {
    const token = localStorage.getItem('token');
    const navigator = useNavigate();
    const [activeKey, setActiveKey] = useState('1');
    const { notification, setNotification } = useOutletsContext();
    const { data: dataWaste, isLoading, refetch } = useGetAllWasteQuery(token);
    const { data: dataOrderOnline, isLoading: isLoadingOnline, refetch: refetchOnline } = useGetAllOrderOnlineQuery(token);

    // Update notification count when data changes
    useEffect(() => {
        const total = (dataOrderOnline?.data?.length || 0) + (dataWaste?.data?.length || 0);
        setNotification(total);
    }, [dataWaste, dataOrderOnline, setNotification]);

    // Tabs configuration
    const tabs = [
        { key: '1', label: 'Order Online', count: dataOrderOnline?.data?.length || 0, color: 'blue' },
        { key: '2', label: 'Waste Items', count: dataWaste?.data?.length || 0, color: 'red' },
    ];

    if (isLoading || isLoadingOnline) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="text-center">
                    <Atom
                        color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]}
                        size="medium"
                        text="Loading notifications..."
                        textColor="#327fcd"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Notifications
                    </h1>
                    <p className="text-gray-600">
                        Manage your orders and inventory notifications
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border border-gray-300 rounded p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Online Orders</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {dataOrderOnline?.data?.length || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-300 rounded p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">Waste Items</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {dataWaste?.data?.length || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border border-gray-300 rounded bg-white">
                    <div className="flex border-b border-gray-300">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveKey(tab.key)}
                                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors relative ${activeKey === tab.key
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${tab.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="p-4">
                        {activeKey === '1' ? <OrderOnline /> : <Waste />}
                    </div>
                </div>

                {/* Floating Notification Badge */}
                <div onClick={() => navigator('/dashboard/order-tracking')} className="fixed bottom-6 right-6">
                    <div className="relative">
                        <div className="w-12 h-12 bg-white border border-gray-300 rounded-full shadow-sm flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                            </svg>
                        </div>
                        {notification > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full text-xs text-white font-medium flex items-center justify-center">
                                {notification}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notification;