import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, Form } from 'antd';
import {
    ArrowUpOutlined,
    ArrowDownOutlined,
    FilterOutlined,
    ReloadOutlined,
    DollarOutlined,
    StockOutlined
} from '@ant-design/icons';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useGetRawMaterialReportMutation } from '../../../app/Features/reportsSlice';
import { toast } from 'react-toastify';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';
import { useGetAllUserQuery } from '../../../app/Features/usersSlice';
import { useReportText } from './reportText';

const { RangePicker } = DatePicker;
const EMPTY_REPORT_DATA = {
    quantity: '0',
    avg_item_cost: '0',
    subtotal_cost: '0',
    stock_return: '0',
    cost_return: '0',
    stock_in: '0',
    cost_in: '0',
    stock_out: '0',
    cost_out: '0',
    stock_waste: '0',
    cost_waste: '0',
    stock_used: '0',
    cost_used: '0',
};

const RawMaterialReport = () => {
    const { rt } = useReportText();
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [getRawMaterialReport] = useGetRawMaterialReportMutation();
    const { data: raws } = useGetAllRawMaterialQuery({ limit: 10000, page: 1, search: '', token });
    const { data: users } = useGetAllUserQuery(token);
    const [handles, setHandles] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const today = new Date();
    const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultFilters = {
        item_id: '',
        stock_type_id: '',
        created_by: '',
        start_date: formatDateForInput(firstDayOfCurrentMonth),
        end_date: formatDateForInput(today),
    };
    const [formData, setFormData] = useState(defaultFilters);
    const [reportData, setReportData] = useState(EMPTY_REPORT_DATA);

    useEffect(() => {
        fetchReport(defaultFilters);
    }, []);

    useEffect(() => {
        if (raws?.data?.data?.length > 0) {
            setRawMaterials(raws?.data?.data);
        }

        if (users?.data?.length > 0) {
            setHandles(users?.data);
        }
    }, [raws, users]);


    async function fetchReport(payload = formData) {
        try {
            setLoading(true);
            const res = await getRawMaterialReport({ itemData: payload, token });
            if (res?.data?.status === 200) {
                setReportData(res.data.data || EMPTY_REPORT_DATA);
            } else {
                toast.error('Failed to generate raw material report');
            }
        } catch (error) {
            toast.error(error?.message || 'An error occurred while generating the report');
        } finally {
            setLoading(false);
        }
    }

    const toNumber = (value) => {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    // Recharts Data Transformation
    const barData = [
        { name: 'In', quantity: toNumber(reportData.stock_in), cost: toNumber(reportData.cost_in) },
        { name: 'Out', quantity: toNumber(reportData.stock_out), cost: toNumber(reportData.cost_out) },
        { name: 'Used', quantity: toNumber(reportData.stock_used), cost: toNumber(reportData.cost_used) },
        { name: 'Waste', quantity: toNumber(reportData.stock_waste), cost: toNumber(reportData.cost_waste) },
        { name: 'Return', quantity: toNumber(reportData.stock_return), cost: toNumber(reportData.cost_return) },
    ];

    const pieData = [
        { name: 'In Cost', value: toNumber(reportData.cost_in) },
        { name: 'Used Cost', value: toNumber(reportData.cost_used) },
        { name: 'Waste Cost', value: toNumber(reportData.cost_waste) },
        { name: 'Return Cost', value: toNumber(reportData.cost_return) },
        { name: 'Out Cost', value: toNumber(reportData.cost_out) },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const onFinish = (values) => {
        const startDate = values?.date_range?.[0]?.format?.('YYYY-MM-DD') || defaultFilters.start_date;
        const endDate = values?.date_range?.[1]?.format?.('YYYY-MM-DD') || defaultFilters.end_date;
        const payload = {
            item_id: values?.item_id || '',
            stock_type_id: values?.stock_type_id || '',
            created_by: values?.created_by || '',
            start_date: startDate,
            end_date: endDate,
        };
        setFormData(payload);
        fetchReport(payload);
    };

    const handleReset = () => {
        form.resetFields();
        setFormData(defaultFilters);
        fetchReport(defaultFilters);
    };

    return (
        <div className="report-page p-6 bg-transparent min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <StockOutlined className="text-blue-600" /> {rt("Raw Material Stock Report")}
                </h1>

                {/* Filter Section */}
                <Card className="!mb-6 shadow-sm border-none rounded-xl">
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Row gutter={[16, 16]} align="center">
                            <Col xs={24} md={6}>
                                <Form.Item name="date_range" label="Date Range">
                                    <RangePicker className="w-full" />
                                </Form.Item>
                            </Col>
                            <Col xs={12} md={4}>
                                <Form.Item name="item_id" label="Material">
                                    <Select placeholder="All Materials" allowClear>
                                        {rawMaterials?.map(raw => <Select.Option value={raw?.id}>{raw?.material_name}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            {/* <Col xs={12} md={4}>
                                <Form.Item name="stock_type_id" label="Stock Type">
                                    <Select placeholder="All Types" allowClear>
                                        <Select.Option value={1}>Stock In</Select.Option>
                                        <Select.Option value={2}>Production</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Col> */}
                            <Col xs={12} md={4}>
                                <Form.Item name="created_by" label="Handled By">
                                    <Select placeholder="All Users" allowClear>
                                        {handles?.map(u => <Select.Option value={u?.id}>{u?.username}</Select.Option>)}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={12} md={4} className="!flex !gap-2 !items-center">
                                <Button type="primary" icon={<FilterOutlined />} htmlType="submit" className="flex-1" loading={loading}>
                                    {rt("Get Report")}
                                </Button>
                                <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={loading}>
                                    {rt("Reset")}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card>

                {/* Top Statistics Cards */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Total Purchase Cost"
                                value={reportData.cost_in}
                                prefix={<StockOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                                suffix='$'
                            />
                            <p className='px-5'>{Number(reportData?.cost_in_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Total Used Cost"
                                value={reportData.cost_used}
                                prefix={<DollarOutlined />}
                                precision={2}
                                suffix='$'
                            />
                            <p className='px-5'>{Number(reportData?.cost_used_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Total Return Cost"
                                value={reportData.cost_return}
                                valueStyle={{ color: '#096dd9' }}
                                prefix={<ArrowUpOutlined />}
                                suffix='$'
                            />
                            <p className='px-5'>{Number(reportData?.cost_return_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Total Waste Cost"
                                value={reportData.cost_waste}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<ArrowDownOutlined />}
                                suffix='$'
                            />
                            <p className='px-5'>{Number(reportData?.cost_waste_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Total Out Cost"
                                value={reportData.cost_out}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<ArrowDownOutlined />}
                                suffix='$'
                            />
                            <p className='px-5'>{Number(reportData?.cost_out_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card borderless className="shadow-sm">
                            <Statistic
                                title="Calculate Cost"
                                value={reportData.calculate_cost}
                                valueStyle={{
                                    color: reportData.calculate_cost < 0 ? '#cf1322' : '#52c41a'
                                }}
                                prefix={reportData.calculate_cost < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                                suffix="$"
                            />
                            <p className='px-5'>{Number(reportData?.calculate_cost_kh || 0).toFixed(2)}៛</p>
                        </Card>
                    </Col>
                </Row>

                {/* Charts Section */}
                <Row gutter={[16, 16]}>
                    {/* Bar Chart - Quantity and Cost Flow */}
                    <Col xs={24} lg={16}>
                        <Card title="Stock Flow Analysis (Qty vs Cost)" className="shadow-sm border-none rounded-xl h-full">
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="quantity" name="Quantity Units" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="cost" name="Cost Amount ($)" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>

                    {/* Pie Chart - Cost Distribution */}
                    <Col xs={24} lg={8}>
                        <Card title="Cost Contribution" className="shadow-sm border-none rounded-xl h-full">
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default RawMaterialReport;
