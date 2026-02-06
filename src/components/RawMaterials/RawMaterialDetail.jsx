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

const RawMaterialDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { data } = useGetRawMaterialByIdQuery({ id, token });
    const [material, setMaterial] = useState({});

    useEffect(() => {
        setMaterial(data?.data);
    }, [data]);

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8">
            {/* Top Navigation & Actions */}
            <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="flex items-center border-none shadow-none bg-transparent hover:bg-slate-200"
                >
                    Back to Inventory
                </Button>
                <Button type="primary" icon={<EditOutlined />} size="large" className="rounded-lg">
                    Edit Material
                </Button>
            </div>

            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Image and Stock Status */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="rounded-2xl shadow-sm border-none overflow-hidden">
                            <div className="aspect-square bg-white flex items-center justify-center p-4">
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

                        <Card className="rounded-2xl shadow-sm border-none bg-indigo-600">
                            <Statistic
                                title={<span className="text-indigo-100 uppercase tracking-wider text-xs font-bold">Current Stock</span>}
                                value={material?.in_stock}
                                precision={2}
                                suffix={material?.primary_unit}
                                valueStyle={{ color: '#fff', fontSize: '32px', fontWeight: '800' }}
                            />
                            <div className="mt-2 text-indigo-200 text-sm">
                                Total value in {material?.primary_unit}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="rounded-2xl shadow-sm border-none min-h-full p-2">
                            <div className="mb-6">
                                <Tag color="cyan" className="mb-2 font-mono">{material?.material_code}</Tag>
                                <h1 className="text-4xl font-extrabold text-slate-800">{material?.material_name}</h1>
                            </div>

                            <Divider orientation="left" className="text-slate-400 font-normal text-xs uppercase tracking-widest">
                                Unit Conversion
                            </Divider>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-around mb-8">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Primary</p>
                                    <p className="text-2xl font-bold text-slate-700">1 {material?.primary_unit}</p>
                                </div>
                                <div className="bg-white p-3 rounded-full shadow-sm">
                                    <SwapOutlined className="text-indigo-500 text-xl" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Secondary</p>
                                    <p className="text-2xl font-bold text-indigo-600">{material?.conversion_value} {material?.secondary_unit}</p>
                                </div>
                            </div>

                            <Divider orientation="left" className="text-slate-400 font-normal text-xs uppercase tracking-widest">
                                General Information
                            </Divider>

                            <Descriptions column={1} bordered size="middle" className="bg-white rounded-xl overflow-hidden">
                                <Descriptions.Item label={<div className="flex items-center gap-2"><DatabaseOutlined /> Material ID</div>}>
                                    {material?.id}
                                </Descriptions.Item>
                                <Descriptions.Item label={<div className="flex items-center gap-2"><UserOutlined /> Created By</div>}>
                                    {material?.create_by_name}
                                </Descriptions.Item>
                                <Descriptions.Item label={<div className="flex items-center gap-2"><CalendarOutlined /> Registration Date</div>}>
                                    {material?.created_at}
                                </Descriptions.Item>
                                <Descriptions.Item label={<div className="flex items-center gap-2"><CalendarOutlined /> Last Update</div>}>
                                    {material?.updated_at}
                                </Descriptions.Item>
                            </Descriptions>

                            <div className="mt-10 grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Stock in Secondary Unit</p>
                                    <p className="text-xl font-bold text-slate-700">
                                        {(parseFloat(material?.in_stock) * parseFloat(material?.conversion_value)).toLocaleString()} {material?.secondary_unit}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status</p>
                                    <Tag color="green" className="m-0 px-4 py-0.5 rounded-full font-bold">Active</Tag>
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