import React, { useState, useEffect, useCallback } from 'react';
import {
    LuSave,
    LuArrowLeft,
    LuPackage,
    LuDollarSign,
    LuCalendar,
    LuPlus,
    LuTrash2,
    LuCalculator,
    LuScale,
    LuClipboardCheck,
    LuListChecks,
    LuRefreshCw,
    LuFileText
} from 'react-icons/lu';
import {
    Form,
    Input,
    Button,
    Card,
    DatePicker,
    Select,
    InputNumber,
    Table,
    Row,
    Col,
    Tag,
    Alert,
    Spin,
    Divider,
    Modal,
    notification,
    Space,
    Tooltip,
    Statistic,
    Avatar
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import dayjs from 'dayjs';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { useDebounce } from 'use-debounce';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';
import { FaBox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetAllProductionQuery } from '../../../app/Features/productSlice';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TextArea } = Input;

const ProductionForm = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [rawMaterialForm] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const token = localStorage.getItem('token');
    const [rawId, setRawId] = useState();
    const [cost_per_unit, setCost] = useState();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [currentProduction, setCurrentProduction] = useState(null);
    const [rawMaterialModalVisible, setRawMaterialModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedRawMaterialForModal, setSelectedRawMaterialForModal] = useState(null);
    const [seaarchItem, setSearchItem] = useState("");
    const [debounceItem] = useDebounce(seaarchItem, 5000);
    const [seaarchRaw, setSearchRaw] = useState("");
    const [debounceRaw] = useDebounce(seaarchRaw, 5000);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: itemData } = useGetAllItemsQuery({ limit: limit, page: currentPage, search: debounceItem, token });
    const { data: rawData } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: debounceRaw, token });
    const { refetch } = useGetAllProductionQuery({ limit: 10, page: 1, search: debounceRaw, token });
    const [costLoading, setCostLoading] = useState(false);


    // Fetch items and raw materials
    useEffect(() => {

        if (isEditMode) {
            fetchProductionData();
        }
    }, [id]);

    useEffect(() => {
        setCurrentPage(1);
        setLimit(10);
    }, [debounceItem]);

    useEffect(() => {
        setItems(itemData?.data);
        setRawMaterials(rawData?.data);
    }, [itemData, rawData]);



    const fetchProductionData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(
                `/production/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.status == 200) {
                throw new Error(t('failedToFetchData'));
            }

            const result = response.data;
            const production = result.data;

            setCurrentProduction(production);

            // Set form values
            form.setFieldsValue({
                production_date: dayjs(production.production_date),
                item_id: production.item_id,
                quantity: production.quantity,
                total_cost: production.total_cost ? parseFloat(production.total_cost) : undefined,
                notes: production.notes || '',
            });

            // Set selected raw materials
            if (production?.details && Array.isArray(production.details)) {
                setSelectedRawMaterials(production.details.map(rm => ({
                    ...rm,
                    cost_per_unit: parseFloat(rm.cost_per_unit) || 0,
                    quantity: parseFloat(rm.quantity) || 0,
                    total: parseFloat(rm.quantity) * (parseFloat(rm.cost_per_unit) || 0)
                })));
            }

            // Find selected item
            const item = items.find(i => i.item_id === production.item_id);
            setSelectedItem(item);
        } catch (error) {
            console.error('Error fetching production:', error);
            toast.error(t('failedToLoadProductionData'));
        } finally {
            setLoading(false);
        }
    };

    // Calculate total cost of raw materials
    const calculateTotalCost = useCallback(() => {
        return selectedRawMaterials.reduce((total, rm) => {
            return total + (parseFloat(rm.quantity || 0) * parseFloat(rm.cost_per_unit || 0));
        }, 0);
    }, [selectedRawMaterials]);

    // Update total cost in form when raw materials change
    useEffect(() => {
        const total = calculateTotalCost();
        form.setFieldsValue({ total_cost: total });
    }, [calculateTotalCost, form]);

    // Handle item selection
    const handleItemSelect = (value) => {
        const item = items.find(i => i.item_id === value);
        setSelectedItem(item);
    };

    // Handle scroll fetch for items
    const onScrollFetch = (e) => {
        const target = e.target;
        const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        if (nearBottom && itemData?.pagination?.total > items?.length) {
            setLimit(prev => prev + 10);
        }
    };

    // Add raw material
    const handleAddRawMaterial = (values) => {
        const rawMaterial = rawMaterials.find(rm => rm.id === values.raw_material_id);
        const selectedUnit = values.unit || rawMaterial?.primary_unit;
        const conversionValue = parseFloat(rawMaterial?.conversion_value) || 1;
        const quantityInPrimaryUnit = selectedUnit === rawMaterial?.secondary_unit
            ? parseFloat(values.quantity) / conversionValue
            : parseFloat(values.quantity);
        const exist = selectedRawMaterials.some(i => i.raw_material_id == values.raw_material_id);
        if (exist) {
            toast.error(t('duplicateItem'));
            return;
        }
        if (rawMaterial.in_stock <= 0) {
            toast.error(t('itemOutStock'));
            return;
        }
        if (rawMaterial.in_stock < quantityInPrimaryUnit) {
            toast.error(t('notEnoughItemInStock'));
            return;
        }

        const newMaterial = {
            key: Date.now(),
            raw_material_id: values.raw_material_id,
            material_name: rawMaterial?.material_name || 'Unknown Material',
            material_code: rawMaterial?.material_code || 'N/A',
            primary_unit: rawMaterial?.primary_unit || 'unit',
            secondary_unit: rawMaterial?.secondary_unit || '',
            selected_unit: selectedUnit,
            quantity: quantityInPrimaryUnit,
            cost_per_unit: parseFloat(values.cost_per_unit),
            total: quantityInPrimaryUnit * parseFloat(values.cost_per_unit)
        };

        setSelectedRawMaterials([...selectedRawMaterials, newMaterial]);
        setSelectedRawMaterialForModal(null);
        setRawMaterialModalVisible(false);
        notification.success({
            message: t('success'),
            description: t('rawMaterialAddedSuccess'),
        });
    };

    // Remove raw material
    const handleRemoveRawMaterial = (key) => {
        setSelectedRawMaterials(selectedRawMaterials.filter(rm => rm.key !== key));
    };

    // Update raw material
    const handleUpdateRawMaterial = (key, field, value) => {
        setSelectedRawMaterials(prev => prev.map(rm => {
            if (rm.key === key) {
                const updated = { ...rm, [field]: parseFloat(value) || 0 };
                updated.total = updated.quantity * updated.cost_per_unit;
                return updated;
            }
            return rm;
        }));
    };

    // Raw material table columns
    const rawMaterialColumns = [
        {
            title: t('material'),
            dataIndex: 'material_name',
            key: 'material_name',
            width: 200,
            render: (text, record) => (
                <div>
                    <div className="font-medium dark:text-gray-200">{text}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{record.material_code}</div>
                </div>
            ),
        },
        {
            title: t('quantity'),
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
            render: (value, record) => (
                <InputNumber
                    value={value}
                    min={0.01}
                    step={0.01}
                    precision={2}
                    onChange={(val) => handleUpdateRawMaterial(record.key, 'quantity', val)}
                    className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                    addonAfter={<span className="dark:text-gray-300">{record.primary_unit}</span>}
                />
            ),
        },
        {
            title: t('costPerUnit'),
            dataIndex: 'cost_per_unit',
            key: 'cost_per_unit',
            width: 120,
            render: (value, record) => (
                <InputNumber
                    value={value}
                    min={0.01}
                    step={0.01}
                    precision={2}
                    formatter={val => `$ ${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={val => val.replace(/\$\s?|(,*)/g, '')}
                    onChange={(val) => handleUpdateRawMaterial(record.key, 'cost_per_unit', val)}
                    className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                />
            ),
        },
        {
            title: t('total'),
            dataIndex: 'total',
            key: 'total',
            width: 120,
            align: 'right',
            render: (value) => (
                <div className="font-semibold text-green-600 dark:text-green-400">
                    ${value.toFixed(2)}
                </div>
            ),
        },
        {
            title: t('actions'),
            key: 'action',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveRawMaterial(record.key)}
                />
            ),
        },
    ];

    // Validate cost format
    const validateCost = (_, value) => {
        if (!value && value !== 0) {
            return Promise.reject(new Error(t('enterCost')));
        }
        return Promise.resolve();
    };

    // Validate quantity
    const validateQuantity = (_, value) => {
        if (!value && value !== 0) {
            return Promise.reject(new Error(t('enterQuantity')));
        }

        if (value <= 0) {
            return Promise.reject(new Error(t('quantityGreaterZero')));
        }

        if (!Number.isInteger(value)) {
            return Promise.reject(new Error(t('quantityWholeNumber')));
        }

        return Promise.resolve();
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        setSaving(true);
        setFormErrors({});

        // Validate raw materials
        if (selectedRawMaterials.length === 0) {
            setFormErrors(prev => ({
                ...prev,
                raw_materials: [t('atLeastOneRawMaterialRequired')]
            }));
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formattedRawMaterials = selectedRawMaterials.map(rm => ({
                raw_material_id: rm.raw_material_id,
                quantity: parseFloat(rm.quantity),
                cost_per_unit: parseFloat(rm.cost_per_unit)
            }));

            const payload = {
                ...values,
                total_cost: Number(parseFloat(values.total_cost).toFixed(2)),
                production_date: values.production_date.format('YYYY-MM-DD'),
                raw_materials: formattedRawMaterials
            };

            console.log(payload);

            let response;
            if (isEditMode) {
                response = await api.put(`/production/${id}`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                response = await api.post(`/production`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }


            if (response.status == 200) {
                toast.success(isEditMode
                    ? t('productionRecordUpdated')
                    : t('productionRecordCreated'),
                );
                refetch();
                navigate(-1);
            }
        } catch (error) {
            console.error('Error saving production:', error);
            toast.error(error.message || t('failedToSaveProduction'));
        } finally {
            setSaving(false);
        }
    };

    // Reset form
    const handleReset = () => {
        form.resetFields();
        setSelectedRawMaterials([]);
        setSelectedItem(null);
        setFormErrors({});
    };

    // Get available raw materials (not already selected)
    const getAvailableRawMaterials = () => {
        const selectedIds = selectedRawMaterials.map(rm => rm.raw_material_id);
        return rawMaterials?.filter(rm => !selectedIds.includes(rm.id));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                </div>
            </div>
        );
    }

    const handleRawMaterialChange = (materialId) => {
        setRawId(materialId);
        const material = rawMaterials?.find((rm) => rm.id === materialId);
        setSelectedRawMaterialForModal(material || null);

        // reset fields when material changes
        rawMaterialForm.setFieldsValue({
            quantity: undefined,
            cost_per_unit: undefined,
            unit: material?.primary_unit || undefined,
        });
    };


    async function fetchCost(rawId, value) {
        if (!value || !rawId) return;

        try {
            setCostLoading(true);
            const res = await api.get(
                `total-cost/${value}/${rawId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 200) {
                const cost = parseFloat(res.data?.data.totalCost) || 0;

                // ✅ SET VALUE ON MODAL FORM
                rawMaterialForm.setFieldsValue({
                    cost_per_unit: cost,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCostLoading(false);
        }

    }

    const handleQuantity = () => {
        const quantity = Number(rawMaterialForm.getFieldValue('quantity'));
        if (!quantity) return;

        const selectedUnit = rawMaterialForm.getFieldValue('unit');
        const selectedMaterial = rawMaterials?.find((rm) => rm.id === rawId);
        const conversionValue = parseFloat(selectedMaterial?.conversion_value) || 1;

        const quantityInPrimaryUnit = selectedUnit === selectedMaterial?.secondary_unit
            ? quantity / conversionValue
            : quantity;

        fetchCost(rawId, quantityInPrimaryUnit);
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="view-page"
        >
            <div className="min-h-screen bg-transparent p-4 md:p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <Button
                                type="text"
                                icon={<LuArrowLeft />}
                                onClick={() => navigate(-1)}
                                className="mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 p-0"
                            >
                                {t('backToProduction')}
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                                <div className={`p-3 ${isEditMode ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-xl transition-colors`}>
                                    <LuPackage className={`text-2xl ${isEditMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                </div>
                                {isEditMode ? t('editProductionRecord') : t('createNewProduction')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isEditMode
                                    ? t('updateProductionDetails')
                                    : t('recordNewProductionBatch')}
                            </p>
                        </div>

                        {isEditMode && currentProduction && (
                            <div className="flex items-center gap-3">
                                <Tag color="blue" className="text-sm py-1 px-3 dark:bg-blue-900/30 dark:border-blue-800">
                                    ID: {currentProduction.id}
                                </Tag>
                                <Tag color="green" className="text-sm py-1 px-3 dark:bg-green-900/30 dark:border-green-800">
                                    {dayjs(currentProduction.production_date).format('MMM D, YYYY')}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form Section */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-0 shadow-xl dark:!bg-gray-800 transition-colors">
                                {Object.keys(formErrors).length > 0 && (
                                    <Alert
                                        type="error"
                                        message={t('fixErrorsMessage')}
                                        description={
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(formErrors).map(([field, errors]) => (
                                                    <li key={field} className="text-sm">
                                                        <strong>{field.replace(/_/g, ' ')}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
                                                    </li>
                                                ))}
                                            </ul>
                                        }
                                        className="mb-6 rounded-xl"
                                        closable
                                    />
                                )}

                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleSubmit}
                                    className="space-y-6"
                                    size="large"
                                >
                                    {/* Basic Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                            <LuCalendar className="text-blue-500" />
                                            {t('productionInformation')}
                                        </h3>

                                        <Row gutter={16}>
                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('productionDate')}</span>}
                                                    name="production_date"
                                                    rules={[
                                                        { required: true, message: t('selectProductionDate') }
                                                    ]}
                                                    validateStatus={formErrors.production_date ? 'error' : ''}
                                                    help={formErrors.production_date?.[0]}
                                                >
                                                    <DatePicker
                                                        className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                        format="MMM D, YYYY"
                                                        suffixIcon={<LuCalendar className="text-gray-400" />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('itemToProduce')}</span>}
                                                    name="item_id"
                                                    rules={[
                                                        { required: true, message: t('selectItem') }
                                                    ]}
                                                    validateStatus={formErrors.item_id ? 'error' : ''}
                                                    help={formErrors.item_id?.[0]}
                                                >
                                                    <Select
                                                        placeholder={t('selectItem')}
                                                        suffixIcon={<LuPackage className="text-gray-400" />}
                                                        showSearch
                                                        onSearch={(value) => setSearchItem(value)}
                                                        onPopupScroll={onScrollFetch}
                                                        className="dark:!bg-gray-900 dark:text-white"
                                                        dropdownClassName="dark:bg-gray-800"
                                                        filterOption={(input, option) =>
                                                            option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                        }
                                                        onChange={handleItemSelect}
                                                        optionLabelProp="name"
                                                    >
                                                        {items?.map(item => (
                                                            <Option key={item.id} value={item.id} name={item.name}>
                                                                <div className="flex items-center gap-3 py-1">
                                                                    <Avatar
                                                                        size="small"
                                                                        src={item.image}
                                                                        icon={<FaBox />}
                                                                        className="border border-gray-200 dark:border-gray-700"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-900 dark:text-gray-200 truncate">
                                                                            {item.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                            {item.code} • {item.brand_name}
                                                                        </div>
                                                                    </div>
                                                                    <Tag color="blue" className="ml-auto dark:bg-blue-900/30 dark:border-blue-800">
                                                                        ${item.price}
                                                                    </Tag>
                                                                </div>
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('productionQuantity')}</span>}
                                                    name="quantity"
                                                    rules={[
                                                        { required: true, message: t('enterQuantity') },
                                                        { validator: validateQuantity }
                                                    ]}
                                                    validateStatus={formErrors.quantity ? 'error' : ''}
                                                    help={formErrors.quantity?.[0]}
                                                >
                                                    <InputNumber
                                                        placeholder={t('quantity')}
                                                        className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                        min={1}
                                                        precision={0}
                                                        addonAfter={<span className="dark:text-gray-300">{t('unitsCount')}</span>}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('totalProductionCost')}</span>}
                                                    name="total_cost"
                                                    rules={[
                                                        { required: true, message: t('enterCost') },
                                                        { validator: validateCost }
                                                    ]}
                                                    validateStatus={formErrors.total_cost ? 'error' : ''}
                                                    help={formErrors.total_cost?.[0]}
                                                >
                                                    <InputNumber
                                                        placeholder="0.00"
                                                        className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                        min={0.01}
                                                        step={0.01}
                                                        precision={2}
                                                        formatter={value => ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                                        prefix={<LuDollarSign className="text-gray-400" />}
                                                        readOnly
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>

                                    <Divider className="dark:border-gray-700" />

                                    {/* Raw Materials Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                <LuListChecks className="text-green-500" />
                                                {t('rawMaterialsConsumption')}
                                            </h3>

                                            <Button
                                                type="primary"
                                                icon={<LuPlus />}
                                                onClick={() => setRawMaterialModalVisible(true)}
                                                disabled={getAvailableRawMaterials()?.length === 0}
                                            >
                                                {t('addRawMaterial')}
                                            </Button>
                                        </div>

                                        {formErrors.raw_materials && (
                                            <Alert
                                                type="error"
                                                message={Array.isArray(formErrors.raw_materials) ? formErrors.raw_materials[0] : formErrors.raw_materials}
                                                className="mb-4 rounded-xl"
                                                showIcon
                                            />
                                        )}

                                        {selectedRawMaterials.length > 0 ? (
                                            <div className="space-y-4">
                                                <Table
                                                    columns={rawMaterialColumns}
                                                    dataSource={selectedRawMaterials}
                                                    pagination={false}
                                                    size="middle"
                                                    className="ant-table-striped dark:[&_.ant-table]:!bg-gray-800 dark:[&_.ant-table-thead_th]:!bg-gray-900/50 dark:[&_.ant-table-thead_th]:!text-gray-300 dark:[&_.ant-table-tbody_td]:!text-gray-300 dark:[&_.ant-table-tbody_tr:hover_td]:!bg-gray-700/50"
                                                    rowClassName="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                />

                                                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                                                        {t('totalRawMaterialCost')}:
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        ${calculateTotalCost().toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                                                <LuPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-600 dark:text-gray-400 mb-2">{t('noRawMaterialsAdded')}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                                                    {t('clickAddRawMaterialToStart')}
                                                </p>
                                                <Button
                                                    type="primary"
                                                    icon={<LuPlus />}
                                                    onClick={() => setRawMaterialModalVisible(true)}
                                                >
                                                    {t('addFirstMaterial')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Divider className="dark:border-gray-700" />

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                            <LuFileText className="text-purple-500" />
                                            {t('additionalInformation')}
                                        </h3>

                                        <Form.Item
                                            label={<span className="dark:text-gray-300">{t('notes')}</span>}
                                            name="notes"
                                            validateStatus={formErrors.notes ? 'error' : ''}
                                            help={formErrors.notes?.[0]}
                                        >
                                            <TextArea
                                                placeholder={t('enterNotesPlaceholder')}
                                                rows={4}
                                                showCount
                                                maxLength={1000}
                                                className="dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                            />
                                        </Form.Item>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                            <Button
                                                type="default"
                                                icon={<LuArrowLeft />}
                                                onClick={() => navigate(-1)}
                                                className="h-12 px-6 rounded-lg dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 transition-colors"
                                                size="large"
                                            >
                                                {t('cancel')}
                                            </Button>

                                            <Button
                                                type="default"
                                                icon={<LuRefreshCw />}
                                                onClick={handleReset}
                                                className="h-12 px-6 rounded-lg dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 transition-colors"
                                                size="large"
                                            >
                                                {t('reset')}
                                            </Button>

                                            <Button
                                                type="primary"
                                                icon={<LuSave />}
                                                htmlType="submit"
                                                loading={saving}
                                                className="h-12 px-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-lg shadow-blue-200 dark:shadow-none"
                                                size="large"
                                            >
                                                {saving ? t('saving') : isEditMode ? t('updateProduction') : t('createProduction')}
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Preview & Stats Section */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Production Summary */}
                            <Card className="border-0 shadow-xl dark:!bg-gray-800 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    {t('productionSummary')}
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Statistic
                                            title={<span className="dark:text-gray-400">{t('totalItems')}</span>}
                                            value={form.getFieldValue('quantity') || 0}
                                            suffix={<span className="dark:text-gray-400">{t('units')}</span>}
                                            className="text-center dark:[&_.ant-statistic-content]:text-white"
                                        />
                                        <Statistic
                                            title={<span className="dark:text-gray-400">{t('unitCost')}</span>}
                                            value={form.getFieldValue('quantity') && form.getFieldValue('total_cost')
                                                ? (parseFloat(form.getFieldValue('total_cost')) / parseInt(form.getFieldValue('quantity'))).toFixed(2)
                                                : 0}
                                            prefix={<span className="dark:text-gray-400">$</span>}
                                            className="text-center dark:[&_.ant-statistic-content]:text-white"
                                        />
                                    </div>

                                    <Divider className="my-2 dark:border-gray-700" />

                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('selectedItem')}:</div>
                                        {selectedItem ? (
                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg transition-colors">
                                                <div className="font-medium dark:text-gray-200">{selectedItem.item_name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedItem.item_code}</div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {selectedItem.category_name || t('noCategory')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm italic">
                                                {t('noItemSelected')}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('productionDate')}:</div>
                                        <div className="font-medium dark:text-gray-200">
                                            {form.getFieldValue('production_date')
                                                ? form.getFieldValue('production_date').format('MMMM D, YYYY')
                                                : t('notSet')}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Raw Materials Summary */}
                            <Card className="border-0 shadow-xl dark:!bg-gray-800 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    {t('summary')}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('materialsUsed')}:</span>
                                        <span className="font-medium dark:text-gray-200">{selectedRawMaterials.length}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('totalCost')}:</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            ${calculateTotalCost().toFixed(2)}
                                        </span>
                                    </div>

                                    {selectedRawMaterials.length > 0 && (
                                        <>
                                            <Divider className="my-2 dark:border-gray-700" />
                                            <div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('materialBreakdown')}:</div>
                                                <div className="space-y-2 max-h-60 overflow-y-auto dark:scrollbar-thin dark:scrollbar-thumb-gray-700">
                                                    {selectedRawMaterials.map((rm, index) => (
                                                        <div key={rm.key} className="flex justify-between items-center text-sm">
                                                            <div className="truncate max-w-[140px] dark:text-gray-300">
                                                                {index + 1}. {rm.material_name}
                                                            </div>
                                                            <div className="text-gray-700 dark:text-gray-400">
                                                                {rm.quantity} {rm.primary_unit} × ${rm.cost_per_unit.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Cost Analysis */}
                            <Card className="border-0 shadow-xl dark:!bg-gray-800 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    {t('costAnalysis')}
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('rawMaterialCost')}:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                            ${calculateTotalCost().toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">{t('totalProductionCost')}:</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            ${(form.getFieldValue('total_cost') || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    {form.getFieldValue('quantity') && form.getFieldValue('total_cost') && (
                                        <>
                                            <Divider className="my-2 dark:border-gray-700" />
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">{t('costPerUnit')}:</span>
                                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                                    ${(parseFloat(form.getFieldValue('total_cost')) / parseInt(form.getFieldValue('quantity'))).toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Validation Status */}
                            <Card className="border-0 shadow-xl dark:!bg-gray-800 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                    {t('validationStatus')}
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm dark:text-gray-300">{t('basicInformation')}</span>
                                        {form.getFieldValue('production_date') && form.getFieldValue('item_id') &&
                                            form.getFieldValue('quantity') && form.getFieldValue('total_cost') ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm dark:text-gray-300">{t('rawMaterials')}</span>
                                        {selectedRawMaterials.length > 0 ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm dark:text-gray-300">{t('costValidation')}</span>
                                        {form.getFieldValue('total_cost') && form.getFieldValue('total_cost') > 0 ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>

                                    <Divider className="my-2 dark:border-gray-700" />

                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                        {t('allChecksMustPass')}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Add Raw Material Modal */}
                <Modal
                    title={<span className="dark:text-gray-200">{t('addRawMaterial')}</span>}
                    open={rawMaterialModalVisible}
                    onCancel={() => {
                        rawMaterialForm.resetFields();
                        setSelectedRawMaterialForModal(null);
                        setRawMaterialModalVisible(false);
                    }}
                    footer={null}
                    width={500}
                    className="dark:[&_.ant-modal-content]:!bg-gray-800 dark:[&_.ant-modal-header]:!bg-gray-800 dark:[&_.ant-modal-title]:!text-gray-200"
                >
                    <Form
                        form={rawMaterialForm}
                        layout="vertical"
                        onFinish={handleAddRawMaterial}
                        size="large"
                    >
                        {/* RAW MATERIAL */}
                        <Form.Item
                            label={<span className="dark:text-gray-300">{t('rawMaterial')}</span>}
                            name="raw_material_id"
                            rules={[{ required: true, message: t('selectRawMaterial') }]}
                        >
                            <Select
                                placeholder={t('selectRawMaterial')}
                                showSearch
                                onSearch={(value) => setSearchRaw(value)}
                                onChange={handleRawMaterialChange}
                                className="dark:!bg-gray-900 dark:text-white"
                                dropdownClassName="dark:bg-gray-800"
                                filterOption={(input, option) =>
                                    option.name.toLowerCase().includes(input.toLowerCase())
                                }
                                optionLabelProp="name"
                            >
                                {getAvailableRawMaterials()?.map(material => (
                                    <Option
                                        key={material.id}
                                        value={material.id}
                                        name={material.material_name}
                                    >
                                        <div className="flex items-center gap-3 py-1">
                                            <Avatar
                                                size="small"
                                                src={material.material_image}
                                                icon={<FaBox />}
                                                className="border border-gray-200 dark:border-gray-700"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-gray-200 truncate">
                                                    {material.material_name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {material.material_code}
                                                </div>
                                            </div>
                                            <Tag color="blue" className="ml-auto dark:bg-blue-900/30 dark:border-blue-800">
                                                {Number(material.in_stock)?.toFixed(0)}
                                            </Tag>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Row gutter={16}>
                            {/* QUANTITY */}
                            <Col span={12}>
                                <Form.Item
                                    label={<span className="dark:text-gray-300">{t('quantity')}</span>}
                                    name="quantity"
                                    rules={[
                                        { required: true, message: t('enterQuantity') },
                                        { type: 'number', min: 0.01, message: t('quantityGreaterZero') }
                                    ]}
                                >
                                    <InputNumber
                                        className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                        min={0.01}
                                        step={0.01}
                                        precision={2}
                                        onBlur={handleQuantity}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Form.Item
                                    label={<span className="dark:text-gray-300">{t('unit')}</span>}
                                    name="unit"
                                    rules={[
                                        { required: true, message: t('selectUnit') },
                                    ]}
                                >
                                    <Select
                                        className="w-full dark:!bg-gray-900 dark:text-white"
                                        placeholder={t('selectUnit')}
                                        onSelect={handleQuantity}
                                        disabled={!selectedRawMaterialForModal}
                                    >
                                        {[selectedRawMaterialForModal?.primary_unit, selectedRawMaterialForModal?.secondary_unit]
                                            .filter(Boolean)
                                            .filter((value, index, array) => array.indexOf(value) === index)
                                            .map((unit) => (
                                                <Option key={unit} value={unit}>
                                                    {unit}
                                                </Option>
                                            ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* COST PER UNIT */}
                        <div className="mb-4">
                            <Form.Item
                                label={<span className="dark:text-gray-300">{t('costPerUnit')}</span>}
                                name="cost_per_unit"
                                rules={[
                                    { required: true, message: t('enterCostPerUnit') },
                                    { validator: validateCost },
                                ]}
                            >
                                <InputNumber
                                    className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                    min={0.01}
                                    step={0.01}
                                    precision={2}
                                    readOnly
                                    prefix={<LuDollarSign className="text-gray-400" />}
                                    disabled={costLoading}
                                    formatter={(value) =>
                                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                    }
                                    parser={(value) =>
                                        value.replace(/\$\s?|(,*)/g, '')
                                    }
                                />
                            </Form.Item>
                            {costLoading && <Spin size="small" className="ml-2" />}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                onClick={() => {
                                    rawMaterialForm.resetFields();
                                    setSelectedRawMaterialForModal(null);
                                    setRawMaterialModalVisible(false);
                                }}
                                className="dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 transition-colors"
                            >
                                {t('cancel')}
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {t('addMaterial')}
                            </Button>
                        </div>
                    </Form>
                </Modal>

            </div>
        </motion.div>
    );
};

export default ProductionForm;
