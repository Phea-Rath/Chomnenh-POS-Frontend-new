import React, { useEffect, useState } from 'react';
import { Badge, Card, Tabs } from 'antd';
import Waste from './waste';
import OrderOnline from './orderOnline';
import { useGetAllOrderOnlineQuery, useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { useOutletsContext } from '../../layouts/Management';
import '../../../public/sounds/notification.mp3';
import echo from '../../echo';
import { Atom } from 'react-loading-indicators';

const Notification = () => {
    const token = localStorage.getItem('token');
    const [activeKey, setActiveKey] = useState('1');
    const { notification, setNotification } = useOutletsContext();
    const { data: dataWaste, isLoading, refetch } = useGetAllWasteQuery(token);
    const { data: dataOrderOnline, isLoading: isLoadingOnline, refetch: refetchOnline } = useGetAllOrderOnlineQuery(token);
    const [items, setItems] = useState([]);

    useEffect(() => {
        setNotification(dataWaste?.data?.length + dataOrderOnline?.data?.length);
        setItems([
            {
                label: (
                    <div className="flex items-center gap-2 px-2">
                        <span>Order Online</span>
                        <Badge
                            count={dataOrderOnline?.data?.length}
                            color="#1890ff"
                            className="min-w-[20px]"
                            style={{ fontSize: '10px', height: '16px', lineHeight: '16px' }}
                        />
                    </div>
                ),
                key: '1',
                children: <OrderOnline />,
            },
            {
                label: (
                    <div className="flex items-center gap-2 px-2">
                        <span>Waste Items</span>
                        <Badge
                            count={dataWaste?.data?.length}
                            color="#ff4d4f"
                            className="min-w-[20px]"
                            style={{ fontSize: '10px', height: '16px', lineHeight: '16px' }}
                        />
                    </div>
                ),
                key: '2',
                children: <Waste />,
            },
        ]);
    }, [dataWaste, dataOrderOnline, setNotification]);

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
        <div className="min-h-screen bg-gray-50">
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
                    <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
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
                    </Card>

                    <Card className="shadow-sm border-0 hover:shadow-md transition-shadow">
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
                    </Card>
                </div>

                {/* Tabs Section */}
                <Card className="shadow-sm border-0">
                    <Tabs
                        defaultActiveKey="1"
                        type="line"
                        size="large"
                        onChange={setActiveKey}
                        items={items}
                        className="notification-tabs"
                    />
                </Card>

                {/* Total Notification Badge */}
                <div className="fixed bottom-6 right-6">
                    <Badge
                        count={notification}
                        size="default"
                        style={{
                            backgroundColor: '#52c41a',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                            </svg>
                        </div>
                    </Badge>
                </div>
            </div>

            {/* Custom CSS for better tab styling */}
            <style jsx>{`
                .notification-tabs .ant-tabs-nav {
                    margin-bottom: 0;
                }
                .notification-tabs .ant-tabs-tab {
                    padding: 12px 20px;
                    margin: 0 4px;
                }
                .notification-tabs .ant-tabs-tab:hover {
                    color: #1890ff;
                }
                .notification-tabs .ant-tabs-tab-active {
                    background: #f0f8ff;
                    border-radius: 6px 6px 0 0;
                }
            `}</style>
        </div>
    );
};

export default Notification;