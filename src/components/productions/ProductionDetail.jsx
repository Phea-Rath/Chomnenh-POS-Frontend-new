import React, { useEffect, useRef } from 'react';
import { Button, Table, Tag, Card, Descriptions, Divider } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';
import { useNavigate, useParams } from 'react-router';
import handleDownload from '../../services/imageDowload';
import { useGetProductionByIdQuery } from '../../../app/Features/productSlice';
import { useState } from 'react';

const ProductionDetail = () => {
    const navigate = useNavigate();
    const componentRef = useRef();
    const token = localStorage.getItem('token');
    const { id } = useParams();
    const { data } = useGetProductionByIdQuery({ id, token });
    const [production, setProduction] = useState({});

    useEffect(() => {
        setProduction(data?.data)
    }, [data]);
    // Table Columns
    const columns = [
        { title: 'Material Code', dataIndex: 'material_code', key: 'material_code' },
        { title: 'Material Name', dataIndex: 'material_name', key: 'material_name' },
        { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', align: 'right' },
        {
            title: 'Cost/Unit',
            dataIndex: 'cost_per_unit',
            key: 'cost_per_unit',
            align: 'right',
            render: (val) => `$${parseFloat(val).toFixed(2)}`
        },
        {
            title: 'Subtotal',
            dataIndex: 'total_cost',
            key: 'total_cost',
            align: 'right',
            render: (val) => <span className="font-bold font-mono text-blue-600">${parseFloat(val).toFixed(2)}</span>
        },
    ];

    // PRINT ACTION
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        contentRef: componentRef,
    });

    // DOWNLOAD PDF ACTION


    return (
        <div className="p-6 bg-transparent min-h-screen">
            {/* Action Header */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 m-0">Production Details</h1>
                        <p className="text-gray-500 m-0">{production?.production_no}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print Receipt</Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(componentRef, 'jpg', 'production', production?.production_no)}>Download PDF</Button>
                </div>
            </div>

            {/* Printable Content Area */}
            <div ref={componentRef} className="max-w-5xl mx-auto">
                <Card className="shadow-sm border-none rounded-xl mb-6 overflow-hidden">
                    <div className="bg-blue-600 p-1 mb-6" /> {/* Brand accent line */}

                    <div className="flex flex-col md:flex-row justify-between mb-8">
                        <div>
                            <Tag color="blue" className="mb-2 font-bold">COMPLETED PRODUCTION</Tag>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                                {production?.item_name}
                            </h2>
                            <p className="text-gray-400">SKU: {production?.item_code}</p>
                        </div>
                        <div className="text-left md:text-right mt-4 md:mt-0">
                            <p className="text-gray-400 mb-0 uppercase text-xs font-bold tracking-widest">Total Production Cost</p>
                            <h1 className="text-4xl font-black text-blue-600">${production?.total_cost}</h1>
                        </div>
                    </div>

                    <Divider />

                    <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} size="small">
                        <Descriptions.Item label="Production No" labelStyle={{ fontWeight: 'bold' }}>
                            {production?.production_no}
                        </Descriptions.Item>
                        <Descriptions.Item label="Date" labelStyle={{ fontWeight: 'bold' }}>
                            {production?.production_date}
                        </Descriptions.Item>
                        <Descriptions.Item label="Produced Quantity" labelStyle={{ fontWeight: 'bold' }}>
                            <span className="text-lg font-bold">{production?.quantity} Units</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Handled By" labelStyle={{ fontWeight: 'bold' }}>
                            {production?.created_by_name}
                        </Descriptions.Item>
                    </Descriptions>

                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold">
                            <FileTextOutlined /> Raw Materials & Ingredients
                        </div>
                        <Table
                            columns={columns}
                            dataSource={production?.details}
                            pagination={false}
                            rowKey="id"
                            className="border border-gray-100 rounded-lg overflow-hidden"
                            summary={(pageData) => {
                                let total = 0;
                                pageData.forEach(({ total_cost }) => {
                                    total += parseFloat(total_cost);
                                });
                                return (
                                    <Table.Summary.Row className="bg-gray-50 font-bold">
                                        <Table.Summary.Cell index={0} colSpan={4} className="text-right">Total Materials Cost:</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} className="text-right text-blue-600 text-lg">
                                            ${total.toFixed(2)}
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </div>

                    {/* Footer for Receipt */}
                    <div className="mt-12 hidden print:block border-t pt-8">
                        <div className="flex justify-between px-10">
                            <div className="text-center">
                                <div className="w-32 border-b border-gray-400 mb-2 mx-auto"></div>
                                <p className="text-xs text-gray-500">Authorized Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="w-32 border-b border-gray-400 mb-2 mx-auto"></div>
                                <p className="text-xs text-gray-500">Production Manager</p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-300 mt-8 italic">
                            System Generated Receipt - {new Date().toLocaleString()}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProductionDetail;