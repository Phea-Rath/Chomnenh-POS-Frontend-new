import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router";
import {
    Card,
    Tag,
    Button,
    Descriptions,
    Image,
    Row,
    Col,
    Statistic,
    Table,
    Divider,
    Alert,
    Badge,
    Timeline,
    Typography,
    Space,
    Modal,
    QRCode,
    Tooltip,
    List,
    Avatar
} from "antd";
import {
    LuPackage,
    LuWarehouse,
    LuCalendar,
    LuDollarSign,
    LuTag,
    LuArrowLeftRight,
    LuPrinter,
    LuInfo,
    LuTrendingUp,
    LuTrendingDown,
    LuBox,
    LuUser,
    LuCode,
    LuBarcode,
    LuShield,
    LuClock,
    LuRefreshCw,
    LuArrowLeft,
    LuClipboardList,
    LuReceipt,
    LuTruck,
    LuFileSpreadsheet,
} from "react-icons/lu";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";
import dayjs from "dayjs";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const { Title, Text, Paragraph } = Typography;

const StockTransferDetail = () => {
    const { t } = useTranslation();
    const asArray = (value) => (Array.isArray(value) ? value : []);
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const printRef = useRef();

    // Fetch stock master data
    React.useEffect(() => {
        fetchStockMaster();
    }, [id]);

    const fetchStockMaster = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await api.get(`/stock_masters/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.status === 200) {
                setData(response.data.data);
            } else {
                throw new Error(response.data.message || t('failedToFetchData'));
            }
        } catch (err) {
            setError(err.message);
            toast.error(t('failedToLoadStockDetails'));
        } finally {
            setLoading(false);
        }
    };

    // Print handler for detailed report
    const handlePrintDetail = useReactToPrint({
        contentRef: printRef,
    });

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Get stock type color
    const getStockTypeColor = (type) => {
        const typeColors = {
            'stock in': 'green',
            'stock out': 'red',
            'stock sale': 'orange',
            'transfer': 'blue',
            'adjustment': 'purple',
            'return': 'yellow'
        };
        return typeColors[type?.toLowerCase()] || 'default';
    };

    // Get stock type icon
    const getStockTypeIcon = (type) => {
        const typeIcons = {
            'stock in': <LuTrendingUp className="text-green-500" />,
            'stock out': <LuTrendingDown className="text-red-500" />,
            'stock sale': <LuDollarSign className="text-orange-500" />,
            'transfer': <LuTruck className="text-blue-500" />,
            'adjustment': <LuShield className="text-purple-500" />,
            'return': <LuRefreshCw className="text-yellow-500" />
        };
        return typeIcons[type?.toLowerCase()] || <LuBox className="text-gray-500" />;
    };

    // Calculate total values
    const getTotalValues = () => {
        if (!data) return { quantity: 0, value: 0, cost: 0 };

        const totals = asArray(data?.items).reduce(
            (acc, item) => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.item_price) || 0;
                const cost = Number(item.item_cost) || 0;

                return {
                    quantity: acc.quantity + quantity,
                    value: acc.value + (quantity * price),
                    cost: acc.cost + (quantity * cost)
                };
            },
            { quantity: 0, value: 0, cost: 0 }
        );

        return totals;
    };

    const totals = getTotalValues();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <LuRefreshCw className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert
                    message={t('error')}
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button type="primary" onClick={fetchStockMaster}>
                            {t('retry')}
                        </Button>
                    }
                />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert
                    message={t('noData')}
                    description={t('stockRecordNotFound')}
                    type="warning"
                    showIcon
                />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-transparent p-4 md:p-6 view-page"
        >
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link to={-1}>
                            <Button icon={<LuArrowLeft />} type="text" className="hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                                {t('backToInventory')}
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LuReceipt className="text-blue-600" />
                                {t('stockTransferDetails')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('completeInformationForTransfer')} #{data.stock_no}
                            </p>
                        </div>
                    </div>

                    <Space>
                        <Tooltip title={t('refreshData')}>
                            <Button
                                icon={<LuRefreshCw />}
                                onClick={fetchStockMaster}
                                loading={loading}
                                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                            />
                        </Tooltip>
                        <Button
                            icon={<LuPrinter />}
                            type="primary"
                            onClick={() => {
                                setTimeout(handlePrintDetail, 300);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 shadow-md"
                        >
                            {t('printReport')}
                        </Button>
                    </Space>
                </div>

                {/* Stock Header Card */}
                <Card className="mb-6 border-0 shadow-lg dark:!bg-gray-800 transition-colors">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg">
                                    {getStockTypeIcon(data.stock_type_name)}
                                </div>
                                <div>
                                    <Text type="secondary" className="dark:text-gray-400">{t('transfer')}</Text>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            color={getStockTypeColor(data.stock_type_name)}
                                            text={
                                                <span className="font-semibold text-lg capitalize dark:text-gray-200">
                                                    {data.stock_type_name}
                                                </span>
                                            }
                                        />
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {data.stock_no}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} md={16}>
                            <Row gutter={[8, 8]}>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title={<span className="dark:text-gray-400">{t('totalItems')}</span>}
                                        value={asArray(data?.items).length}
                                        prefix={<LuPackage className="text-blue-500" />}
                                        valueStyle={{ color: '#3b82f6' }}
                                        className="dark:[&_.ant-statistic-content]:text-white"
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title={<span className="dark:text-gray-400">{t('totalQuantity')}</span>}
                                        value={totals.quantity}
                                        prefix={<LuBox className="text-green-500" />}
                                        valueStyle={{ color: '#10b981' }}
                                        className="dark:[&_.ant-statistic-content]:text-white"
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title={<span className="dark:text-gray-400">{t('totalValue')}</span>}
                                        value={formatCurrency(totals.value)}
                                        prefix={<LuDollarSign className="text-purple-500" />}
                                        valueStyle={{ color: '#8b5cf6' }}
                                        className="dark:[&_.ant-statistic-content]:text-white"
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title={<span className="dark:text-gray-400">{t('totalCost')}</span>}
                                        value={formatCurrency(totals.cost)}
                                        prefix={<LuTag className="text-orange-500" />}
                                        valueStyle={{ color: '#f59e0b' }}
                                        className="dark:[&_.ant-statistic-content]:text-white"
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Card>
            </div>

            <Row gutter={[16, 16]}>
                {/* Left Column - Transfer Details */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="flex items-center gap-2 dark:text-gray-200">
                                <LuInfo className="text-blue-600" />
                                <span>{t('transferInformation')}</span>
                            </div>
                        }
                        className="shadow-md mb-6 dark:!bg-gray-800 dark:!border-gray-700 transition-colors"
                    >
                        <Descriptions column={1} bordered size="small" className="dark:[&_.ant-descriptions-item-label]:!bg-gray-900/50 dark:[&_.ant-descriptions-item-label]:!text-gray-300 dark:[&_.ant-descriptions-item-content]:!text-gray-200 dark:border-gray-700">
                            <Descriptions.Item label={<div className="flex items-center gap-2"><LuReceipt /> {t('stockNumber')}</div>}>
                                <Text strong className="text-lg dark:text-white">{data.stock_no}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<div className="flex items-center gap-2"><LuCalendar /> {t('stockDate')}</div>}>
                                <Tag color="blue" className="dark:bg-blue-900/30 dark:border-blue-800">{dayjs(data.stock_date).format('MMMM DD, YYYY')}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<div className="flex items-center gap-2"><LuClock /> {t('created')}</div>}>
                                {dayjs(data.created_at).format('MMMM DD, YYYY HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label={<div className="flex items-center gap-2"><LuUser /> {t('createdBy')}</div>}>
                                <div className="flex items-center gap-2">
                                    <Avatar size="small" style={{ backgroundColor: '#3b82f6' }}>
                                        {data.created_by_name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Text strong className="dark:text-gray-200">{data.created_by_name}</Text>
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={<div className="flex items-center gap-2"><LuClipboardList /> {t('remark')}</div>}>
                                <Paragraph className="!mb-0 dark:text-gray-300">{data.stock_remark || t('noRemarks')}</Paragraph>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Warehouse Transfer */}
                    <Card
                        title={
                            <div className="flex items-center gap-2 dark:text-gray-200">
                                <LuWarehouse className="text-blue-600" />
                                <span>{t('warehouseTransfer')}</span>
                            </div>
                        }
                        className="shadow-md dark:!bg-gray-800 dark:!border-gray-700 transition-colors"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-lg transition-colors">
                                <div className="text-center flex-1">
                                    <LuWarehouse className="text-3xl text-red-500 mx-auto mb-2" />
                                    <Text strong className="block mb-1 dark:text-gray-300">{t('fromWarehouse')}</Text>
                                    <Title level={4} className="!text-red-600 dark:!text-red-400 !mb-0">
                                        {data.from_warehouse_name}
                                    </Title>
                                </div>

                                <div className="px-4">
                                    <LuArrowLeftRight className="text-2xl text-blue-500 animate-pulse" />
                                </div>

                                <div className="text-center flex-1">
                                    <LuWarehouse className="text-3xl text-green-500 mx-auto mb-2" />
                                    <Text strong className="block mb-1 dark:text-gray-300">{t('toWarehouse')}</Text>
                                    <Title level={4} className="!text-green-600 dark:!text-green-400 !mb-0">
                                        {data.to_warehouse_name}
                                    </Title>
                                </div>
                            </div>

                            <Divider className="dark:border-gray-700"><span className="dark:text-gray-500">{t('transferSummary')}</span></Divider>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded transition-colors">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {totals.quantity}
                                    </div>
                                    <div className="text-sm text-green-700 dark:text-green-500">{t('totalUnits')}</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded transition-colors">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {asArray(data?.items).length}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-500">{t('uniqueItems')}</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Items List */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="flex items-center gap-2 justify-between w-full dark:text-gray-200">
                                <div className="flex items-center gap-2">
                                    <LuPackage className="text-blue-600" />
                                    <span>{t('transferredItems')} ({asArray(data?.items).length})</span>
                                </div>
                                <Tag color="blue" className="dark:bg-blue-900/30 dark:border-blue-800 m-0">{totals.quantity} {t('totalUnits')}</Tag>
                            </div>
                        }
                        className="shadow-md dark:!bg-gray-800 dark:!border-gray-700 transition-colors"
                    >
                        <List
                            itemLayout="vertical"
                            dataSource={asArray(data?.items)}
                            className="dark:[&_.ant-list-item]:!border-gray-700"
                            renderItem={(item, index) => (
                                <List.Item
                                    key={item.detail_id}
                                    extra={
                                        <Image
                                            width={80}
                                            height={80}
                                            src={item.images?.[0]?.image}
                                            alt={item.item_name}
                                            className="rounded-lg object-cover border dark:border-gray-700"
                                            fallback={
                                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-700 dark:to-gray-800 border border-blue-200 dark:border-gray-600 flex items-center justify-center">
                                                    <LuPackage className="text-2xl text-blue-600 dark:text-blue-400" />
                                                </div>
                                            }
                                        />
                                    }
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size="large" className="dark:bg-gray-700 dark:text-gray-300">{index + 1}</Avatar>}
                                        title={
                                            <div className="flex items-center justify-between">
                                                <Text strong className="text-lg dark:text-white">
                                                    {item.item_name}
                                                </Text>
                                                <Tag color="green" className="text-sm dark:bg-green-900/30 dark:border-green-800">
                                                    {formatCurrency(item.item_price)} {t('each')}
                                                </Tag>
                                            </div>
                                        }
                                        description={
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <LuCode className="text-gray-400" />
                                                    <Text code className="dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700">{item.item_code}</Text>
                                                    <LuBarcode className="text-gray-400 ml-2" />
                                                    <Text type="secondary" className="dark:text-gray-500">{t('barcode')}: {item.barcode || 'N/A'}</Text>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <LuBox className="text-blue-400" />
                                                        <Text strong className="dark:text-gray-300">{t('quantity')}: {item.quantity}</Text>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <LuDollarSign className="text-green-400" />
                                                        <Text strong className="dark:text-gray-300">{t('total')}: {formatCurrency(item.quantity * item.item_price)}</Text>
                                                    </div>
                                                </div>

                                                {item.expire_date && (
                                                    <div className="flex items-center gap-2">
                                                        <LuCalendar className="text-orange-400" />
                                                        <Tag color={dayjs().isAfter(item.expire_date) ? 'red' : 'green'} className="dark:bg-opacity-20">
                                                            {t('expiry')}: {dayjs(item.expire_date).format('MMM DD, YYYY')}
                                                        </Tag>
                                                    </div>
                                                )}

                                                {asArray(item?.attributes).length > 0 && (
                                                    <div className="mt-2">
                                                        <Text type="secondary" className="dark:text-gray-500">{t('attributes')}:</Text>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {asArray(item?.attributes).map((attr) => (
                                                                <Tag key={attr.id} color="cyan" className="text-xs dark:bg-cyan-900/30 dark:border-cyan-800">
                                                                    {attr.name}: {Array.isArray(attr.value)
                                                                        ? attr.value.map(v => v.value).join(', ')
                                                                        : attr.value}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
            {/* Hidden Print Content */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    <div className="p-8 font-sans">
                        {/* Print Header */}
                        <div className="text-center mb-8 border-b pb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-left">
                                    <h2 className="text-lg font-bold">INVENTORY SYSTEM</h2>
                                    <p className="text-sm text-gray-600">{t('stockTransferReport')}</p>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-xl font-bold uppercase">{t('stockTransferReport')}</h1>
                                    <p className="text-sm text-gray-600">Document No: {data.stock_no}</p>
                                </div>
                            </div>

                            <div className="flex justify-between text-sm">
                                <div>
                                    <p><strong>Generated:</strong> {dayjs().format('MMMM DD, YYYY HH:mm')}</p>
                                </div>
                                <div>
                                    <p><strong>Page:</strong> 1 of 1</p>
                                </div>
                            </div>
                        </div>

                        {/* Transfer Information */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 uppercase">{t('transferInformation')}</h2>
                            <table className="w-full border-collapse mb-4">
                                <tbody>
                                    <tr>
                                        <td className="border p-2 font-semibold" width="30%">{t('stockNumber')}:</td>
                                        <td className="border p-2">{data.stock_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">{t('transferType')}:</td>
                                        <td className="border p-2 capitalize">{data.stock_type_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">{t('stockDate')}:</td>
                                        <td className="border p-2">{dayjs(data.stock_date).format('MMMM DD, YYYY')}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">{t('createdBy')}:</td>
                                        <td className="border p-2">{data.created_by_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">{t('createdDate')}:</td>
                                        <td className="border p-2">{dayjs(data.created_at).format('MMMM DD, YYYY HH:mm:ss')}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">{t('remark')}:</td>
                                        <td className="border p-2">{data.stock_remark || t('noRemarks')}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="border p-4 text-center">
                                    <h3 className="font-bold mb-2 text-red-600 uppercase">{t('fromWarehouse')}</h3>
                                    <p className="text-lg font-bold">{data.from_warehouse_name}</p>
                                </div>
                                <div className="border p-4 text-center">
                                    <h3 className="font-bold mb-2 text-green-600 uppercase">{t('toWarehouse')}</h3>
                                    <p className="text-lg font-bold">{data.to_warehouse_name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 uppercase">{t('transferredItems')}</h2>
                            <table className="w-full border-collapse mb-4">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">#</th>
                                        <th className="border p-2 text-left">{t('itemCode')}</th>
                                        <th className="border p-2 text-left">{t('productName')}</th>
                                        <th className="border p-2 text-left">{t('quantity')}</th>
                                        <th className="border p-2 text-left">{t('unitPrice')}</th>
                                        <th className="border p-2 text-left">{t('totalPrice')}</th>
                                        <th className="border p-2 text-left">{t('expiry')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asArray(data?.items).map((item, index) => (
                                        <tr key={item.detail_id}>
                                            <td className="border p-2">{index + 1}</td>
                                            <td className="border p-2 font-mono">{item.item_code}</td>
                                            <td className="border p-2">{item.item_name}</td>
                                            <td className="border p-2 text-center">{item.quantity}</td>
                                            <td className="border p-2 text-right">{formatCurrency(item.item_price)}</td>
                                            <td className="border p-2 text-right">{formatCurrency(item.quantity * item.item_price)}</td>
                                            <td className="border p-2">
                                                {item.expire_date ? dayjs(item.expire_date).format('MMM DD, YYYY') : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50">
                                        <td className="border p-2 font-bold text-right" colSpan="3">{t('total').toUpperCase()}</td>
                                        <td className="border p-2 font-bold text-center">{totals.quantity}</td>
                                        <td className="border p-2 font-bold text-right">-</td>
                                        <td className="border p-2 font-bold text-right">{formatCurrency(totals.value)}</td>
                                        <td className="border p-2">-</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2 uppercase">{t('summary')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border p-4">
                                    <h3 className="font-bold mb-2 uppercase">{t('itemsSummary')}</h3>
                                    <p><strong>{t('totalItems')}:</strong> {asArray(data?.items).length}</p>
                                    <p><strong>{t('totalQuantity')}:</strong> {totals.quantity} units</p>
                                    <p><strong>{t('totalValue')}:</strong> {formatCurrency(totals.value)}</p>
                                    <p><strong>{t('totalCost')}:</strong> {formatCurrency(totals.cost)}</p>
                                </div>
                                <div className="border p-4">
                                    <h3 className="font-bold mb-2 uppercase">{t('profitAnalysis')}</h3>
                                    <p><strong>{t('profitMargin')}:</strong> {((totals.value - totals.cost) / Math.max(1, totals.cost) * 100).toFixed(2)}%</p>
                                    <p><strong>{t('totalProfit')}:</strong> {formatCurrency(totals.value - totals.cost)}</p>
                                    <p><strong>{t('averagePricePerUnit')}:</strong> {formatCurrency(totals.value / Math.max(1, totals.quantity))}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
                            <p>*** {t('officialDocumentMessage')} ***</p>
                            <p>Generated by Inventory Management System | Document ID: {data.stock_no}-{dayjs().format('YYYYMMDDHHmm')}</p>
                            <p className="mt-4">
                                <strong>{t('authorizedSignatures')}:</strong>
                            </p>
                            <div className="flex justify-between mt-8">
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>{t('senderSignature')}</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>{t('receiverSignature')}</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>{t('approvedBy')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StockTransferDetail;
