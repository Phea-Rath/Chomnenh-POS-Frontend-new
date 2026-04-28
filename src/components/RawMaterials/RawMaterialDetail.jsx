import React, { useEffect, useState } from 'react';
import { Button, Tag, Card, Descriptions, Divider, Statistic, Row, Col } from 'antd';
import {
    ArrowLeftOutlined,
    EditOutlined,
    DatabaseOutlined,
    SwapOutlined,
    UserOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import { useGetRawMaterialByIdQuery } from '../../../app/Features/RawMaterialSlice';
import { useTranslation } from 'react-i18next';

const RawMaterialDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { data } = useGetRawMaterialByIdQuery({ id, token });
    const [material, setMaterial] = useState({});

    useEffect(() => {
        setMaterial(data?.data);
    }, [data]);

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 view-page">
            {/* Top Navigation & Actions */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="flex items-center border-none shadow-none bg-transparent hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                    {t('backToInventory')}
                </Button>
                <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    size="large" 
                    className="rounded-lg"
                    onClick={() => navigate(`/raw_materials/edit/${id}`)}
                >
                    {t('editMaterial')}
                </Button>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Image and Stock Status */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-2xl shadow-sm border-none overflow-hidden dark:!bg-gray-800 transition-colors">
                            <div className="aspect-square bg-white dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
                                <img
                                    src={material?.material_image}
                                    alt={material?.material_name}
                                    className="w-full h-full object-contain rounded-xl"
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/400?text=No+Image";
                                    }}
                                />
                            </div>
                        </Card>

                        <Card className="rounded-2xl shadow-sm border-none bg-indigo-600 dark:bg-indigo-900/40 transition-colors">
                            <Statistic
                                title={<span className="text-indigo-100 dark:text-indigo-300 uppercase tracking-wider text-xs font-bold">{t('currentStock')}</span>}
                                value={material?.in_stock}
                                precision={2}
                                suffix={material?.primary_unit}
                                valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: '800' }}
                                className="dark:[&_.ant-statistic-content]:text-white"
                            />
                            <div className="mt-2 text-indigo-200 dark:text-indigo-300 text-sm">
                                {t('totalValueIn')} {material?.primary_unit}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl shadow-sm border-none min-h-full p-2 dark:!bg-gray-800 transition-colors">
                            <div className="mb-6 px-4">
                                <Tag color="cyan" className="mb-2 font-mono dark:bg-cyan-900/30 dark:border-cyan-800">{material?.material_code}</Tag>
                                <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white">{material?.material_name}</h1>
                            </div>

                            <Divider orientation="left" className="text-slate-400 dark:text-gray-500 font-normal text-xs uppercase tracking-widest">
                                {t('unitConversion')}
                            </Divider>

                            <div className="bg-slate-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700 flex items-center justify-around mb-8 transition-colors">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">{t('primary')}</p>
                                    <p className="text-2xl font-bold text-slate-700 dark:text-gray-200">1 {material?.primary_unit}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm transition-colors">
                                    <SwapOutlined className="text-indigo-500 text-xl" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 dark:text-gray-500 font-bold uppercase mb-1">{t('secondary')}</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{material?.conversion_value} {material?.secondary_unit}</p>
                                </div>
                            </div>

                            <Divider orientation="left" className="text-slate-400 dark:text-gray-500 font-normal text-xs uppercase tracking-widest">
                                {t('generalInformation')}
                            </Divider>

                            <div className="px-4">
                                <Descriptions column={1} bordered size="middle" className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-colors dark:border-gray-700">
                                    <Descriptions.Item label={<div className="flex items-center gap-2 dark:text-gray-300"><DatabaseOutlined /> {t('materialID')}</div>} className="dark:text-gray-300">
                                        <span className="dark:text-gray-100">{material?.id}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={<div className="flex items-center gap-2 dark:text-gray-300"><UserOutlined /> {t('createdBy')}</div>} className="dark:text-gray-300">
                                        <span className="dark:text-gray-100">{material?.create_by_name}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={<div className="flex items-center gap-2 dark:text-gray-300"><CalendarOutlined /> {t('registrationDate')}</div>} className="dark:text-gray-300">
                                        <span className="dark:text-gray-100">{material?.created_at}</span>
                                    </Descriptions.Item>
                                    <Descriptions.Item label={<div className="flex items-center gap-2 dark:text-gray-300"><CalendarOutlined /> {t('lastUpdate')}</div>} className="dark:text-gray-300">
                                        <span className="dark:text-gray-100">{material?.updated_at}</span>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>

                            <div className="mt-10 grid grid-cols-2 gap-4 px-4 pb-4">
                                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 transition-colors">
                                    <p className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase mb-1">{t('stockInSecondaryUnit')}</p>
                                    <p className="text-xl font-bold text-slate-700 dark:text-gray-200">
                                        {(parseFloat(material?.in_stock) * parseFloat(material?.conversion_value)).toLocaleString()} {material?.secondary_unit}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 transition-colors">
                                    <p className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase mb-1">{t('status')}</p>
                                    <Tag color="green" className="m-0 px-4 py-0.5 rounded-full font-bold dark:bg-green-900/30 dark:border-green-800">{t('active')}</Tag>
                                </div>
                            </div>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default RawMaterialDetail;
