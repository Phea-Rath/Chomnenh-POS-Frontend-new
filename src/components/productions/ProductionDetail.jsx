import React, { useEffect, useRef } from 'react';
import { Button, Table, Tag, Card, Descriptions, Divider } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import { useNavigate, useParams } from 'react-router';
import handleDownload from '../../services/imageDowload';
import { useGetProductionByIdQuery } from "@/features/products/productSlice";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const ProductionDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const componentRef = useRef();
    const token = getToken();
    const { id } = useParams();
    const { data } = useGetProductionByIdQuery({ id, token });
    const [production, setProduction] = useState({});

    useEffect(() => {
        setProduction(data?.data)
    }, [data]);

    // Table Columns
    const columns = [
        { title: t('materialCode'), dataIndex: 'material_code', key: 'material_code' },
        { title: t('materialName'), dataIndex: 'material_name', key: 'material_name' },
        { title: t('quantity'), dataIndex: 'quantity', key: 'quantity', align: 'right' },
        {
            title: t('costPerUnit'),
            dataIndex: 'cost_per_unit',
            key: 'cost_per_unit',
            align: 'right',
            render: (val) => `$${parseFloat(val).toFixed(2)}`
        },
        {
            title: t('subtotal'),
            dataIndex: 'total_cost',
            key: 'total_cost',
            align: 'right',
            render: (val) => <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400">${parseFloat(val).toFixed(2)}</span>
        },
    ];

    // PRINT ACTION
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
    });


    return (
        <div className="p-6 bg-transparent min-h-screen view-page">
            {/* Action Header */}
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate(-1)} 
                        className="dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-colors"
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white m-0">{t('productionDetails')}</h1>
                        <p className="text-gray-500 dark:text-gray-400 m-0">{production?.production_no}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        icon={<PrinterOutlined />} 
                        onClick={handlePrint}
                        className="dark:bg-gray-800 dark:text-white dark:border-gray-700 transition-colors"
                    >
                        {t('printReceipt')}
                    </Button>
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        onClick={() => handleDownload(componentRef, 'jpg', 'production', production?.production_no)}
                    >
                        {t('downloadPDF')}
                    </Button>
                </div>
            </div>

            {/* Printable Content Area */}
            <div ref={componentRef} className="max-w-5xl mx-auto">
                <Card className="shadow-sm border-none rounded-xl mb-6 overflow-hidden dark:!bg-gray-800 transition-colors">
                    <div className="bg-cyan-600 p-1 mb-6" /> {/* Brand accent line */}

                    <div className="flex flex-col md:flex-row justify-between mb-8 px-6">
                        <div>
                            <Tag color="cyan" className="mb-2 font-bold dark:bg-cyan-900/30 dark:border-cyan-800">{t('completedProduction')}</Tag>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                {production?.item_name}
                            </h2>
                            <p className="text-gray-400 dark:text-gray-500">SKU: {production?.item_code}</p>
                        </div>
                        <div className="text-left md:text-right mt-4 md:mt-0">
                            <p className="text-gray-400 dark:text-gray-500 mb-0 uppercase text-xs font-bold tracking-widest">{t('totalProductionCost')}</p>
                            <h1 className="text-4xl font-black text-cyan-600 dark:text-cyan-400">${production?.total_cost}</h1>
                        </div>
                    </div>

                    <Divider className="dark:border-gray-700" />

                    <div className="px-6">
                        <Descriptions 
                            bordered 
                            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} 
                            size="small"
                            className="dark:[&_.ant-descriptions-item-label]:!bg-gray-900/50 dark:[&_.ant-descriptions-item-label]:!text-gray-300 dark:[&_.ant-descriptions-item-content]:!text-gray-200 dark:border-gray-700"
                        >
                            <Descriptions.Item label={t('productionNo')} labelStyle={{ fontWeight: 'bold' }}>
                                {production?.production_no}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('date')} labelStyle={{ fontWeight: 'bold' }}>
                                {production?.production_date}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('producedQuantity')} labelStyle={{ fontWeight: 'bold' }}>
                                <span className="text-lg font-bold">{production?.quantity} {t('unitsCount')}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('handledBy')} labelStyle={{ fontWeight: 'bold' }}>
                                {production?.created_by_name}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>

                    <div className="mt-8 px-6 pb-6">
                        <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 font-bold">
                            <FileTextOutlined /> {t('rawMaterialsIngredients')}
                        </div>
                        <Table
                            columns={columns}
                            dataSource={production?.details}
                            pagination={false}
                            rowKey="id"
                            className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden dark:[&_.ant-table]:!bg-gray-800 dark:[&_.ant-table-thead_th]:!bg-gray-900/50 dark:[&_.ant-table-thead_th]:!text-gray-300 dark:[&_.ant-table-tbody_td]:!text-gray-300"
                            summary={(pageData) => {
                                let total = 0;
                                pageData.forEach(({ total_cost }) => {
                                    total += parseFloat(total_cost);
                                });
                                return (
                                    <Table.Summary.Row className="bg-gray-50 dark:bg-gray-900/50 font-bold">
                                        <Table.Summary.Cell index={0} colSpan={4} className="text-right dark:text-gray-300">{t('totalMaterialsCost')}:</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} className="text-right text-cyan-600 dark:text-cyan-400 text-lg">
                                            ${total.toFixed(2)}
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </div>

                    {/* Footer for Receipt */}
                    <div className="mt-12 hidden print:block border-t pt-8 pb-8 px-6">
                        <div className="flex justify-between px-10">
                            <div className="text-center">
                                <div className="w-32 border-b border-gray-400 mb-2 mx-auto"></div>
                                <p className="text-xs text-gray-500">{t('authorizedSignature')}</p>
                            </div>
                            <div className="text-center">
                                <div className="w-32 border-b border-gray-400 mb-2 mx-auto"></div>
                                <p className="text-xs text-gray-500">{t('productionManager')}</p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-300 mt-8 italic">
                            *** {t('systemGeneratedReceipt')} - {new Date().toLocaleString()} ***
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProductionDetail;
