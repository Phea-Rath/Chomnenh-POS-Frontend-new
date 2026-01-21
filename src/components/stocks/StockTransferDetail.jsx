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

const { Title, Text, Paragraph } = Typography;

const StockTransferDetail = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [printModalVisible, setPrintModalVisible] = useState(false);
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
                throw new Error(response.data.message || "Failed to fetch data");
            }
        } catch (err) {
            setError(err.message);
            toast.error("Failed to load stock details");
        } finally {
            setLoading(false);
        }
    };

    // Print handler for detailed report
    const handlePrintDetail = useReactToPrint({
        contentRef: printRef,
        // documentTitle: `Stock_Transfer_${data?.stock_no}_${dayjs().format('YYYYMMDD')}`,
        // onAfterPrint: () => toast.success("Stock transfer report printed successfully"),
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
        if (!data || !data.items) return { quantity: 0, value: 0, cost: 0 };

        const totals = data.items.reduce(
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
                    <p className="text-gray-600">Loading stock details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button type="primary" onClick={fetchStockMaster}>
                            Retry
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
                    message="No Data"
                    description="Stock record not found"
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
            className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6"
        >
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard/stocks">
                            <Button icon={<LuArrowLeft />} type="text" className="hover:bg-gray-100">
                                Back to Stocks
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <LuReceipt className="text-blue-600" />
                                Stock Transfer Details
                            </h1>
                            <p className="text-gray-600">
                                Complete information for stock transfer #{data.stock_no}
                            </p>
                        </div>
                    </div>

                    <Space>
                        <Tooltip title="Refresh Data">
                            <Button
                                icon={<LuRefreshCw />}
                                onClick={fetchStockMaster}
                                loading={loading}
                            />
                        </Tooltip>
                        <Button
                            icon={<LuPrinter />}
                            type="primary"
                            onClick={() => setPrintModalVisible(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 border-0"
                        >
                            Print Report
                        </Button>
                    </Space>
                </div>

                {/* Stock Header Card */}
                <Card className="mb-6 border-0 shadow-lg">
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                                    {getStockTypeIcon(data.stock_type_name)}
                                </div>
                                <div>
                                    <Text type="secondary">Stock Transfer</Text>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            color={getStockTypeColor(data.stock_type_name)}
                                            text={
                                                <span className="font-semibold text-lg capitalize">
                                                    {data.stock_type_name}
                                                </span>
                                            }
                                        />
                                        <span className="text-2xl font-bold text-gray-900">
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
                                        title="Total Items"
                                        value={data.items?.length || 0}
                                        prefix={<LuPackage className="text-blue-500" />}
                                        valueStyle={{ color: '#3b82f6' }}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Quantity"
                                        value={totals.quantity}
                                        prefix={<LuBox className="text-green-500" />}
                                        valueStyle={{ color: '#10b981' }}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Value"
                                        value={formatCurrency(totals.value)}
                                        prefix={<LuDollarSign className="text-purple-500" />}
                                        valueStyle={{ color: '#8b5cf6' }}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Cost"
                                        value={formatCurrency(totals.cost)}
                                        prefix={<LuTag className="text-orange-500" />}
                                        valueStyle={{ color: '#f59e0b' }}
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
                            <div className="flex items-center gap-2">
                                <LuInfo className="text-blue-600" />
                                <span>Transfer Information</span>
                            </div>
                        }
                        className="shadow-md mb-6"
                    >
                        <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label={<><LuReceipt /> Stock Number</>}>
                                <Text strong className="text-lg">{data.stock_no}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label={<><LuCalendar /> Stock Date</>}>
                                <Tag color="blue">{dayjs(data.stock_date).format('MMMM DD, YYYY')}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={<><LuClock /> Created At</>}>
                                {dayjs(data.created_at).format('MMMM DD, YYYY HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label={<><LuUser /> Created By</>}>
                                <div className="flex items-center gap-2">
                                    <Avatar size="small" style={{ backgroundColor: '#3b82f6' }}>
                                        {data.created_by_name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Text strong>{data.created_by_name}</Text>
                                </div>
                            </Descriptions.Item>
                            <Descriptions.Item label={<><LuClipboardList /> Remark</>}>
                                <Paragraph className="!mb-0">{data.stock_remark || 'No remarks'}</Paragraph>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    {/* Warehouse Transfer */}
                    <Card
                        title={
                            <div className="flex items-center gap-2">
                                <LuWarehouse className="text-blue-600" />
                                <span>Warehouse Transfer</span>
                            </div>
                        }
                        className="shadow-md"
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="text-center flex-1">
                                    <LuWarehouse className="text-3xl text-red-500 mx-auto mb-2" />
                                    <Text strong className="block mb-1">From Warehouse</Text>
                                    <Title level={4} className="text-red-600">
                                        {data.from_warehouse_name}
                                    </Title>
                                    <Text type="secondary">ID: {data.from_warehouse}</Text>
                                </div>

                                <div className="px-4">
                                    <LuArrowLeftRight className="text-2xl text-blue-500 animate-pulse" />
                                </div>

                                <div className="text-center flex-1">
                                    <LuWarehouse className="text-3xl text-green-500 mx-auto mb-2" />
                                    <Text strong className="block mb-1">To Warehouse</Text>
                                    <Title level={4} className="text-green-600">
                                        {data.to_warehouse_name}
                                    </Title>
                                    <Text type="secondary">ID: {data.warehouse_id}</Text>
                                </div>
                            </div>

                            <Divider>Transfer Summary</Divider>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded">
                                    <div className="text-2xl font-bold text-green-600">
                                        {totals.quantity}
                                    </div>
                                    <div className="text-sm text-green-700">Total Units</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {data.items?.length || 0}
                                    </div>
                                    <div className="text-sm text-blue-700">Unique Items</div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Right Column - Items List */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <div className="flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <LuPackage className="text-blue-600" />
                                    <span>Transferred Items ({data.items?.length || 0})</span>
                                </div>
                                <Tag color="blue">{totals.quantity} total units</Tag>
                            </div>
                        }
                        className="shadow-md"
                    >
                        <List
                            itemLayout="vertical"
                            dataSource={data.items || []}
                            renderItem={(item, index) => (
                                <List.Item
                                    key={item.detail_id}
                                    extra={
                                        <Image
                                            width={80}
                                            height={80}
                                            src={item.images?.[0]?.image}
                                            alt={item.item_name}
                                            className="rounded-lg object-cover border"
                                            fallback={
                                                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center">
                                                    <LuPackage className="text-2xl text-blue-600" />
                                                </div>
                                            }
                                        />
                                    }
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size="large">{index + 1}</Avatar>}
                                        title={
                                            <div className="flex items-center justify-between">
                                                <Text strong className="text-lg">
                                                    {item.item_name}
                                                </Text>
                                                <Tag color="green" className="text-sm">
                                                    {formatCurrency(item.item_price)} each
                                                </Tag>
                                            </div>
                                        }
                                        description={
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <LuCode className="text-gray-400" />
                                                    <Text code>{item.item_code}</Text>
                                                    <LuBarcode className="text-gray-400 ml-2" />
                                                    <Text type="secondary">Barcode: {item.barcode || 'N/A'}</Text>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <LuBox className="text-blue-400" />
                                                        <Text strong>Quantity: {item.quantity}</Text>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <LuDollarSign className="text-green-400" />
                                                        <Text strong>Total: {formatCurrency(item.quantity * item.item_price)}</Text>
                                                    </div>
                                                </div>

                                                {item.expire_date && (
                                                    <div className="flex items-center gap-2">
                                                        <LuCalendar className="text-orange-400" />
                                                        <Tag color={dayjs().isAfter(item.expire_date) ? 'red' : 'green'}>
                                                            Expires: {dayjs(item.expire_date).format('MMM DD, YYYY')}
                                                        </Tag>
                                                    </div>
                                                )}

                                                {item.attributes && item.attributes.length > 0 && (
                                                    <div className="mt-2">
                                                        <Text type="secondary">Attributes:</Text>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.attributes.map((attr, idx) => (
                                                                <Tag key={attr.id} color="cyan" className="text-xs">
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

            {/* Print Modal */}
            <Modal
                title="Print Options"
                open={printModalVisible}
                onCancel={() => setPrintModalVisible(false)}
                footer={null}
                width={400}
            >
                <Space direction="vertical" className="w-full">
                    <Button
                        icon={<LuPrinter />}
                        block
                        size="large"
                        type="primary"
                        onClick={() => {
                            setPrintModalVisible(false);
                            setTimeout(handlePrintDetail, 300);
                        }}
                        className="h-12"
                    >
                        Print Transfer Report
                    </Button>
                    <Button
                        icon={<LuFileSpreadsheet />}
                        block
                        size="large"
                        onClick={() => {
                            // Additional print options could be added here
                            toast.info('Additional print options coming soon!');
                            setPrintModalVisible(false);
                        }}
                        className="h-12"
                    >
                        Print Receipt (Compact)
                    </Button>
                </Space>
            </Modal>

            {/* Hidden Print Content */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    <div className="p-8 font-sans">
                        {/* Print Header */}
                        <div className="text-center mb-8 border-b pb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-left">
                                    <h2 className="text-lg font-bold">INVENTORY SYSTEM</h2>
                                    <p className="text-sm text-gray-600">Stock Transfer Report</p>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-xl font-bold">STOCK TRANSFER REPORT</h1>
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
                            <h2 className="text-lg font-bold mb-4 border-b pb-2">TRANSFER INFORMATION</h2>
                            <table className="w-full border-collapse mb-4">
                                <tbody>
                                    <tr>
                                        <td className="border p-2 font-semibold" width="30%">Stock Number:</td>
                                        <td className="border p-2">{data.stock_no}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">Transfer Type:</td>
                                        <td className="border p-2 capitalize">{data.stock_type_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">Transfer Date:</td>
                                        <td className="border p-2">{dayjs(data.stock_date).format('MMMM DD, YYYY')}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">Created By:</td>
                                        <td className="border p-2">{data.created_by_name}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">Created Date:</td>
                                        <td className="border p-2">{dayjs(data.created_at).format('MMMM DD, YYYY HH:mm:ss')}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-semibold">Remark:</td>
                                        <td className="border p-2">{data.stock_remark || 'No remarks'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="border p-4 text-center">
                                    <h3 className="font-bold mb-2 text-red-600">FROM WAREHOUSE</h3>
                                    <p className="text-lg font-bold">{data.from_warehouse_name}</p>
                                    <p className="text-sm text-gray-600">ID: {data.from_warehouse}</p>
                                </div>
                                <div className="border p-4 text-center">
                                    <h3 className="font-bold mb-2 text-green-600">TO WAREHOUSE</h3>
                                    <p className="text-lg font-bold">{data.to_warehouse_name}</p>
                                    <p className="text-sm text-gray-600">ID: {data.warehouse_id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2">TRANSFERRED ITEMS</h2>
                            <table className="w-full border-collapse mb-4">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-left">#</th>
                                        <th className="border p-2 text-left">Item Code</th>
                                        <th className="border p-2 text-left">Item Name</th>
                                        <th className="border p-2 text-left">Quantity</th>
                                        <th className="border p-2 text-left">Unit Price</th>
                                        <th className="border p-2 text-left">Total Price</th>
                                        <th className="border p-2 text-left">Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items?.map((item, index) => (
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
                                        <td className="border p-2 font-bold text-right" colSpan="3">TOTAL</td>
                                        <td className="border p-2 font-bold text-center">{totals.quantity}</td>
                                        <td className="border p-2 font-bold text-right">-</td>
                                        <td className="border p-2 font-bold text-right">{formatCurrency(totals.value)}</td>
                                        <td className="border p-2">-</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Item Attributes */}
                        {data.items?.some(item => item.attributes && item.attributes.length > 0) && (
                            <div className="mb-8">
                                <h2 className="text-lg font-bold mb-4 border-b pb-2">ITEM ATTRIBUTES</h2>
                                {data.items.map((item, itemIndex) => (
                                    item.attributes && item.attributes.length > 0 && (
                                        <div key={item.detail_id} className="mb-4">
                                            <h3 className="font-semibold mb-2">
                                                {item.item_name} ({item.item_code})
                                            </h3>
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border p-2 text-left">Attribute</th>
                                                        <th className="border p-2 text-left">Values</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {item.attributes.map((attr, attrIndex) => (
                                                        <tr key={attr.id}>
                                                            <td className="border p-2 font-semibold">{attr.name}</td>
                                                            <td className="border p-2">
                                                                {Array.isArray(attr.value)
                                                                    ? attr.value.map(v => v.value).join(', ')
                                                                    : attr.value}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {/* Summary Section */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold mb-4 border-b pb-2">SUMMARY</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border p-4">
                                    <h3 className="font-bold mb-2">ITEMS SUMMARY</h3>
                                    <p><strong>Total Items:</strong> {data.items?.length || 0}</p>
                                    <p><strong>Total Quantity:</strong> {totals.quantity} units</p>
                                    <p><strong>Total Value:</strong> {formatCurrency(totals.value)}</p>
                                    <p><strong>Total Cost:</strong> {formatCurrency(totals.cost)}</p>
                                </div>
                                <div className="border p-4">
                                    <h3 className="font-bold mb-2">PROFIT ANALYSIS</h3>
                                    <p><strong>Profit Margin:</strong> {((totals.value - totals.cost) / Math.max(1, totals.cost) * 100).toFixed(2)}%</p>
                                    <p><strong>Total Profit:</strong> {formatCurrency(totals.value - totals.cost)}</p>
                                    <p><strong>Average Price per Unit:</strong> {formatCurrency(totals.value / Math.max(1, totals.quantity))}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
                            <p>*** This is an official stock transfer document ***</p>
                            <p>Generated by Inventory Management System | Document ID: {data.stock_no}-{dayjs().format('YYYYMMDDHHmm')}</p>
                            <p className="mt-4">
                                <strong>Authorized Signatures:</strong>
                            </p>
                            <div className="flex justify-between mt-8">
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>Sender's Signature</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>Receiver's Signature</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-black w-48 pt-2">
                                        <p>Approved By</p>
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