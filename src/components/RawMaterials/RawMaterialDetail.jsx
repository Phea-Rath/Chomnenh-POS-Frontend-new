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
    console.log(data);


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
                    <div className="lg:col-span-1 gap-2 space-y-6">
                        <Card className="rounded-2xl !mb-3 !shadow-xs !border-0 overflow-hidden bg-primary transition-colors">
                            <div className="aspect-square bg-transparent flex items-center justify-center p-4 transition-colors">
                                <img
                                    src={material?.material_image}
                                    alt={material?.material_name}
                                    className="w-full h-full object-contain rounded-xl"
                                    onError={(e) => {
                                        e.target.src = "data:image/png;base64,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";
                                    }}
                                />
                            </div>
                        </Card>

                        <Card className="rounded-2xl shadow-sm !border-none !bg-indigo-600 dark:!bg-indigo-900/40 transition-colors">
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
                        <Card className="rounded-2xl shadow-sm !border-none min-h-full p-2 bg-primary transition-colors">
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
                                <div className="!bg-white p-3 rounded-full shadow-sm transition-colors">
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
