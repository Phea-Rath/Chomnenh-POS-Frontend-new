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

const { Option } = Select;
const { TextArea } = Input;

const ProductionForm = () => {
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
    const { data: itemData } = useGetAllItemsQuery({ limit: 10, page: 1, search: debounceItem, token });
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
        console.log(itemData);

        setItems(itemData?.data);
        setRawMaterials(rawData?.data?.data);
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
                throw new Error('Failed to fetch production data');
            }

            const result = response.data;
            console.log(result);

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
            toast.error('Failed to load production data. Please try again.');
            // navigate('/dashboard/production');
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
            toast.error('Duplicate item');
            return;
        }
        if (rawMaterial.in_stock <= 0) {
            toast.error('Item out stock');
            return;
        }
        if (rawMaterial.in_stock < quantityInPrimaryUnit) {
            toast.error('Not enough item in stock');
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
            message: 'Success',
            description: 'Raw material added successfully',
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
            title: 'Material',
            dataIndex: 'material_name',
            key: 'material_name',
            width: 200,
            render: (text, record) => (
                <div>
                    <div className="font-medium">{text}</div>
                    <div className="text-xs text-gray-500">{record.material_code}</div>
                </div>
            ),
        },
        {
            title: 'Quantity',
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
                    className="w-full"
                    addonAfter={record.primary_unit}
                />
            ),
        },
        {
            title: 'Cost/Unit',
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
                    className="w-full"
                />
            ),
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            width: 120,
            align: 'right',
            render: (value) => (
                <div className="font-semibold text-green-600">
                    ${value.toFixed(2)}
                </div>
            ),
        },
        {
            title: 'Action',
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
            return Promise.reject(new Error('Please enter the cost'));
        }

        // const regex = /^\d{1,8}(\.\d{1,2})?$/;
        // if (!regex.test(value.toString())) {
        //     return Promise.reject(
        //         new Error('Invalid cost format. Maximum 8 digits before decimal and 2 after.')
        //     );
        // }

        return Promise.resolve();
    };

    // Validate quantity
    const validateQuantity = (_, value) => {
        if (!value && value !== 0) {
            return Promise.reject(new Error('Please enter quantity'));
        }

        if (value <= 0) {
            return Promise.reject(new Error('Quantity must be greater than 0'));
        }

        if (!Number.isInteger(value)) {
            return Promise.reject(new Error('Quantity must be a whole number'));
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
                raw_materials: ['At least one raw material is required']
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
                    ? 'Production record updated successfully!'
                    : 'Production record created successfully!',
                );
                refetch();
                navigate('/dashboard/production');
            }
        } catch (error) {
            console.error('Error saving production:', error);
            toast.error(error.message || 'Failed to save production record. Please try again.');
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
                    <p className="mt-4 text-gray-600">Loading production data...</p>
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
        >
            <div className="min-h-screen bg-transparent p-4 md:p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <Button
                                type="text"
                                icon={<LuArrowLeft />}
                                onClick={() => navigate('/dashboard/production')}
                                className="mb-4 text-gray-600 hover:text-gray-800"
                            >
                                Back to Production
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <div className={`p-3 ${isEditMode ? 'bg-yellow-100' : 'bg-blue-100'} rounded-xl`}>
                                    <LuPackage className={`text-2xl ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                                </div>
                                {isEditMode ? 'Edit Production Record' : 'Create New Production'}
                            </h1>
                            <p className="text-gray-600">
                                {isEditMode
                                    ? 'Update the production details below'
                                    : 'Record a new production batch with raw material consumption'}
                            </p>
                        </div>

                        {isEditMode && currentProduction && (
                            <div className="flex items-center gap-3">
                                <Tag color="blue" className="text-sm py-1 px-3">
                                    ID: {currentProduction.id}
                                </Tag>
                                <Tag color="green" className="text-sm py-1 px-3">
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
                            <Card className="border-0 shadow-xl">
                                {Object.keys(formErrors).length > 0 && (
                                    <Alert
                                        type="error"
                                        message="Please fix the following errors:"
                                        description={
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(formErrors).map(([field, errors]) => (
                                                    <li key={field} className="text-sm">
                                                        <strong>{field.replace(/_/g, ' ')}:</strong> {Array.isArray(errors) ? errors.join(', ') : errors}
                                                    </li>
                                                ))}
                                            </ul>
                                        }
                                        className="mb-6"
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
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LuCalendar className="text-blue-500" />
                                            Production Information
                                        </h3>

                                        <Row gutter={16}>
                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label="Production Date"
                                                    name="production_date"
                                                    rules={[
                                                        { required: true, message: 'Please select production date' }
                                                    ]}
                                                    validateStatus={formErrors.production_date ? 'error' : ''}
                                                    help={formErrors.production_date?.[0]}
                                                >
                                                    <DatePicker
                                                        className="w-full"
                                                        format="MMM D, YYYY"
                                                        suffixIcon={<LuCalendar className="text-gray-400" />}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label="Item to Produce"
                                                    name="item_id"
                                                    rules={[
                                                        { required: true, message: 'Please select an item' }
                                                    ]}
                                                    validateStatus={formErrors.item_id ? 'error' : ''}
                                                    help={formErrors.item_id?.[0]}
                                                >
                                                    <Select
                                                        placeholder="Select item"
                                                        suffixIcon={<LuPackage className="text-gray-400" />}
                                                        showSearch
                                                        onSearch={(value) => setSearchItem(value)}
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
                                                                        className="border border-gray-200"
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-900 truncate">
                                                                            {item.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 truncate">
                                                                            {item.code} • {item.brand_name}
                                                                        </div>
                                                                    </div>
                                                                    <Tag color="blue" className="ml-auto">
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
                                                    label="Production Quantity"
                                                    name="quantity"
                                                    rules={[
                                                        { required: true, message: 'Please enter quantity' },
                                                        { validator: validateQuantity }
                                                    ]}
                                                    validateStatus={formErrors.quantity ? 'error' : ''}
                                                    help={formErrors.quantity?.[0]}
                                                >
                                                    <InputNumber
                                                        placeholder="Number of units"
                                                        className="w-full"
                                                        min={1}
                                                        precision={0}
                                                        addonAfter="units"
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label="Total Production Cost"
                                                    name="total_cost"
                                                    rules={[
                                                        { required: true, message: 'Please enter total cost' },
                                                        { validator: validateCost }
                                                    ]}
                                                    validateStatus={formErrors.total_cost ? 'error' : ''}
                                                    help={formErrors.total_cost?.[0]}
                                                >
                                                    <InputNumber
                                                        placeholder="0.00"
                                                        className="w-full"
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

                                    <Divider />

                                    {/* Raw Materials Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                <LuListChecks className="text-green-500" />
                                                Raw Materials Consumption
                                            </h3>

                                            <Button
                                                type="primary"
                                                icon={<LuPlus />}
                                                onClick={() => setRawMaterialModalVisible(true)}
                                                disabled={getAvailableRawMaterials()?.length === 0}
                                            >
                                                Add Raw Material
                                            </Button>
                                        </div>

                                        {formErrors.raw_materials && (
                                            <Alert
                                                type="error"
                                                message={Array.isArray(formErrors.raw_materials) ? formErrors.raw_materials[0] : formErrors.raw_materials}
                                                className="mb-4"
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
                                                    className="ant-table-striped"
                                                    rowClassName="hover:bg-gray-50"
                                                />

                                                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                                                    <div className="text-lg font-semibold text-gray-800">
                                                        Total Raw Material Cost:
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        ${calculateTotalCost().toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <LuPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                <p className="text-gray-600 mb-2">No raw materials added yet</p>
                                                <p className="text-sm text-gray-500 mb-4">
                                                    Click "Add Raw Material" to start adding materials used in production
                                                </p>
                                                <Button
                                                    type="primary"
                                                    icon={<LuPlus />}
                                                    onClick={() => setRawMaterialModalVisible(true)}
                                                >
                                                    Add First Material
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Divider />

                                    {/* Additional Information */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LuFileText className="text-purple-500" />
                                            Additional Information
                                        </h3>

                                        <Form.Item
                                            label="Notes"
                                            name="notes"
                                            validateStatus={formErrors.notes ? 'error' : ''}
                                            help={formErrors.notes?.[0]}
                                        >
                                            <TextArea
                                                placeholder="Enter any additional notes about this production batch..."
                                                rows={4}
                                                showCount
                                                maxLength={1000}
                                            />
                                        </Form.Item>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="pt-6 border-t border-gray-200">
                                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                            <Button
                                                type="default"
                                                icon={<LuArrowLeft />}
                                                onClick={() => navigate('/dashboard/production')}
                                                className="h-12 px-6 rounded-lg"
                                                size="large"
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                type="default"
                                                icon={<LuRefreshCw />}
                                                onClick={handleReset}
                                                className="h-12 px-6 rounded-lg"
                                                size="large"
                                            >
                                                Reset Form
                                            </Button>

                                            <Button
                                                type="primary"
                                                icon={<LuSave />}
                                                htmlType="submit"
                                                loading={saving}
                                                className="h-12 px-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none"
                                                size="large"
                                            >
                                                {saving ? 'Saving...' : isEditMode ? 'Update Production' : 'Create Production'}
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
                            <Card className="border-0 shadow-xl">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Production Summary
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Statistic
                                            title="Total Items"
                                            value={form.getFieldValue('quantity') || 0}
                                            suffix="units"
                                            className="text-center"
                                        />
                                        <Statistic
                                            title="Unit Cost"
                                            value={form.getFieldValue('quantity') && form.getFieldValue('total_cost')
                                                ? (parseFloat(form.getFieldValue('total_cost')) / parseInt(form.getFieldValue('quantity'))).toFixed(2)
                                                : 0}
                                            prefix="$"
                                            className="text-center"
                                        />
                                    </div>

                                    <Divider className="my-2" />

                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">Selected Item:</div>
                                        {selectedItem ? (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="font-medium">{selectedItem.item_name}</div>
                                                <div className="text-sm text-gray-500">{selectedItem.item_code}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {selectedItem.category_name || 'No category'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm italic">
                                                No item selected
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">Production Date:</div>
                                        <div className="font-medium">
                                            {form.getFieldValue('production_date')
                                                ? form.getFieldValue('production_date').format('MMMM D, YYYY')
                                                : 'Not set'}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Raw Materials Summary */}
                            <Card className="border-0 shadow-xl">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Raw Materials Summary
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Materials Used:</span>
                                        <span className="font-medium">{selectedRawMaterials.length}</span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Cost:</span>
                                        <span className="font-bold text-green-600">
                                            ${calculateTotalCost().toFixed(2)}
                                        </span>
                                    </div>

                                    {selectedRawMaterials.length > 0 && (
                                        <>
                                            <Divider className="my-2" />
                                            <div>
                                                <div className="text-sm text-gray-600 mb-2">Material Breakdown:</div>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {selectedRawMaterials.map((rm, index) => (
                                                        <div key={rm.key} className="flex justify-between items-center text-sm">
                                                            <div className="truncate max-w-[140px]">
                                                                {index + 1}. {rm.material_name}
                                                            </div>
                                                            <div className="text-gray-700">
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
                            <Card className="border-0 shadow-xl">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Cost Analysis
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Raw Material Cost:</span>
                                        <span className="font-medium text-green-600">
                                            ${calculateTotalCost().toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Production Cost:</span>
                                        <span className="font-bold text-blue-600">
                                            ${(form.getFieldValue('total_cost') || 0).toFixed(2)}
                                        </span>
                                    </div>

                                    {form.getFieldValue('quantity') && form.getFieldValue('total_cost') && (
                                        <>
                                            <Divider className="my-2" />
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Cost per Unit:</span>
                                                <span className="font-semibold text-purple-600">
                                                    ${(parseFloat(form.getFieldValue('total_cost')) / parseInt(form.getFieldValue('quantity'))).toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Validation Status */}
                            <Card className="border-0 shadow-xl">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Validation Status
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Basic Information</span>
                                        {form.getFieldValue('production_date') && form.getFieldValue('item_id') &&
                                            form.getFieldValue('quantity') && form.getFieldValue('total_cost') ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Raw Materials</span>
                                        {selectedRawMaterials.length > 0 ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Cost Validation</span>
                                        {form.getFieldValue('total_cost') && form.getFieldValue('total_cost') > 0 ? (
                                            <LuClipboardCheck className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <LuClipboardCheck className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>

                                    <Divider className="my-2" />

                                    <div className="text-xs text-gray-500">
                                        All checks must pass before saving the production record
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Add Raw Material Modal */}
                <Modal
                    title="Add Raw Material"
                    open={rawMaterialModalVisible}
                    onCancel={() => {
                        rawMaterialForm.resetFields();
                        setSelectedRawMaterialForModal(null);
                        setRawMaterialModalVisible(false);
                    }}
                    footer={null}
                    width={500}
                >
                    <Form
                        form={rawMaterialForm}        // ✅ VERY IMPORTANT
                        layout="vertical"
                        onFinish={handleAddRawMaterial}
                        size="large"
                    >
                        {/* RAW MATERIAL */}
                        <Form.Item
                            label="Raw Material"
                            name="raw_material_id"
                            rules={[{ required: true, message: 'Please select a raw material' }]}
                        >
                            <Select
                                placeholder="Select raw material"
                                showSearch
                                onSearch={(value) => setSearchRaw(value)}
                                onChange={handleRawMaterialChange}
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
                                                className="border border-gray-200"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {material.material_name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {material.material_code}
                                                </div>
                                            </div>
                                            <Tag color="blue" className="ml-auto">
                                                {material.in_stock}
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
                                    label="Quantity"
                                    name="quantity"
                                    rules={[
                                        { required: true, message: 'Please enter quantity' },
                                        { type: 'number', min: 1, message: 'Quantity must be greater than 0' }
                                    ]}
                                >
                                    <InputNumber
                                        className="w-full"
                                        min={1}
                                        step={1}
                                        precision={0}
                                        // onChange={}   // ✅ API call here
                                        onBlur={handleQuantity}
                                    />
                                </Form.Item>
                            </Col>

                            <Col span={12}>
                                <Row>

                                    <Form.Item
                                        label="Unit"
                                        name="unit"
                                        rules={[
                                            { required: true, message: 'Please select unit' },
                                        ]}
                                    >
                                        <Select
                                            className="w-full"
                                            placeholder="Select unit"
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
                                </Row>
                            </Col>
                            {/* COST PER UNIT */}
                            <Col span={12}>
                                <Row>

                                    <Form.Item
                                        label="Cost per Unit"
                                        name="cost_per_unit"
                                        rules={[
                                            { required: true, message: 'Please enter cost per unit' },
                                            { validator: validateCost },
                                        ]}
                                    >
                                        <InputNumber
                                            className="w-full"
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
                                    <Spin spinning={costLoading} />
                                </Row>
                            </Col>
                        </Row>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                onClick={() => {
                                    rawMaterialForm.resetFields();
                                    setSelectedRawMaterialForModal(null);
                                    setRawMaterialModalVisible(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Add Material
                            </Button>
                        </div>
                    </Form>
                </Modal>

            </div>
        </motion.div>
    );
};

export default ProductionForm;
