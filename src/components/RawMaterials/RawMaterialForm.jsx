import React, { useState, useEffect } from 'react';
import {
    LuSave,
    LuArrowLeft,
    LuUpload,
    LuPackage,
    LuScale,
    LuTag,
    LuImage,
    LuCircleCheck,
    LuCircleX,
    LuRefreshCw
} from 'react-icons/lu';
import {
    Form,
    Input,
    Button,
    Card,
    Upload,
    Select,
    InputNumber,
    Switch,
    Alert,
    Spin,
    Divider,
    Row,
    Col,
    Tag,
    notification
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import { DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useGetAllRawMaterialQuery, useGetRawMaterialByIdQuery } from '../../../app/Features/RawMaterialSlice';

const { Option } = Select;

const RawMaterialForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const token = localStorage.getItem('token');

    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [hasSecondaryUnit, setHasSecondaryUnit] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [currentMaterial, setCurrentMaterial] = useState(null);

    const { refetch } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: '', token });
    const { data, isLoading: materialLoading } = useGetRawMaterialByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

    const primaryUnit = Form.useWatch('primary_unit', form);
    const secondaryUnit = Form.useWatch('secondary_unit', form);
    const conversionValue = Form.useWatch('conversion_value', form);

    const unitOptions = [
        { value: 'kg', label: 'Kilogram (kg)' },
        { value: 'g', label: 'Gram (g)' },
        { value: 'lb', label: 'Pound (lb)' },
        { value: 'oz', label: 'Ounce (oz)' },
        { value: 'l', label: 'Liter (l)' },
        { value: 'ml', label: 'Milliliter (ml)' },
        { value: 'gal', label: 'Gallon (gal)' },
        { value: 'piece', label: 'Piece' },
        { value: 'pack', label: 'Pack' },
        { value: 'box', label: 'Box' },
        { value: 'case', label: 'Case' },
        { value: 'meter', label: 'Meter (m)' },
        { value: 'cm', label: 'Centimeter (cm)' },
        { value: 'mm', label: 'Millimeter (mm)' },
        { value: 'in', label: 'Inch (in)' },
        { value: 'ft', label: 'Foot (ft)' }
    ];

    useEffect(() => {
        if (!isEditMode) {
            return;
        }

        const material = data?.data;
        if (!material) {
            return;
        }

        setCurrentMaterial(material);
        form.setFieldsValue({
            material_name: material.material_name || '',
            material_code: material.material_code || '',
            primary_unit: material.primary_unit || undefined,
            secondary_unit: material.secondary_unit || undefined,
            conversion_value: material.conversion_value ? parseFloat(material.conversion_value) : undefined
        });

        setHasSecondaryUnit(Boolean(material.secondary_unit));

        if (material.material_image) {
            setImageUrl(material.material_image);
            setImagePreview(material.material_image);
        }
    }, [data, form, isEditMode]);

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            notification.error({
                message: 'Invalid file',
                description: 'Only image files are allowed.'
            });
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            notification.error({
                message: 'File too large',
                description: 'Image must be smaller than 2MB.'
            });
            return Upload.LIST_IGNORE;
        }

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        setImageFile(file);

        return false;
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        setImagePreview('');
    };

    const validateSecondaryUnit = async (_, value) => {
        if (!hasSecondaryUnit) {
            return Promise.resolve();
        }
        if (!value) {
            return Promise.reject(new Error('Please select secondary unit'));
        }
        if (value === form.getFieldValue('primary_unit')) {
            return Promise.reject(new Error('Secondary unit must be different from primary unit'));
        }
        return Promise.resolve();
    };

    const validateConversion = async (_, value) => {
        if (!hasSecondaryUnit) {
            return Promise.resolve();
        }
        if (value === undefined || value === null || value === '') {
            return Promise.reject(new Error('Please enter conversion value'));
        }
        if (Number(value) <= 0) {
            return Promise.reject(new Error('Conversion value must be greater than 0'));
        }
        return Promise.resolve();
    };

    const handleSecondaryToggle = (checked) => {
        setHasSecondaryUnit(checked);
        if (!checked) {
            form.setFieldsValue({
                secondary_unit: undefined,
                conversion_value: undefined
            });
            form.setFields([
                { name: 'secondary_unit', errors: [] },
                { name: 'conversion_value', errors: [] }
            ]);
        }
    };

    const handleSubmit = async (values) => {
        setSaving(true);
        setFormErrors({});

        try {
            const formData = new FormData();

            Object.keys(values).forEach((key) => {
                if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
                    formData.append(key, values[key]);
                }
            });

            if (imageFile) {
                formData.append('material_image', imageFile);
            }

            const response = isEditMode
                ? await api.post(`/raw_material/${id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                : await api.post('/raw_materials', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });

            if (response.status === 200) {
                refetch();
                toast.success(isEditMode ? 'Material updated successfully!' : 'Material created successfully!');
                navigate('/dashboard/raw-materials');
            }
        } catch (error) {
            const apiErrors = error?.response?.data?.errors || {};
            if (Object.keys(apiErrors).length) {
                setFormErrors(apiErrors);
                form.setFields(
                    Object.entries(apiErrors).map(([name, messages]) => ({
                        name,
                        errors: Array.isArray(messages) ? messages : [String(messages)]
                    }))
                );
                toast.error('Please fix the highlighted fields.');
            } else {
                toast.error(error?.response?.data?.message || 'Failed to save material. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitFailed = ({ errorFields }) => {
        if (!errorFields?.length) {
            return;
        }
        toast.error('Please complete all required fields correctly.');
        const firstError = errorFields[0]?.name;
        if (firstError) {
            form.scrollToField(firstError, { behavior: 'smooth', block: 'center' });
        }
    };

    const handleReset = () => {
        form.resetFields();
        setImageFile(null);
        setImageUrl('');
        setImagePreview('');
        setHasSecondaryUnit(false);
        setFormErrors({});
    };

    if (isEditMode && materialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Loading material data...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-3 sm:p-4 lg:p-6">
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <Button
                                type="text"
                                icon={<LuArrowLeft />}
                                onClick={() => navigate('/dashboard/raw-materials')}
                                className="mb-3 pl-0 text-gray-600 hover:text-gray-800"
                            >
                                Back to Materials
                            </Button>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <div className={`p-2.5 ${isEditMode ? 'bg-amber-100' : 'bg-emerald-100'} rounded-xl`}>
                                    <LuPackage className={`text-xl sm:text-2xl ${isEditMode ? 'text-amber-700' : 'text-emerald-700'}`} />
                                </div>
                                {isEditMode ? 'Edit Raw Material' : 'Create New Raw Material'}
                            </h1>
                            <p className="text-gray-600 mt-2 text-sm sm:text-base">
                                {isEditMode
                                    ? 'Update the material information below.'
                                    : 'Fill in the details to add a new raw material to inventory.'}
                            </p>
                        </div>

                        {isEditMode && currentMaterial && (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Tag color="blue" className="text-xs sm:text-sm py-1 px-2.5 sm:px-3">
                                    ID: {currentMaterial.id}
                                </Tag>
                                <Tag color={currentMaterial.is_deleted === 1 ? 'red' : 'green'} className="text-xs sm:text-sm py-1 px-2.5 sm:px-3">
                                    {currentMaterial.is_deleted === 1 ? 'Deleted' : 'Active'}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    onFinishFailed={handleSubmitFailed}
                    size="large"
                    scrollToFirstError
                    onValuesChange={() => {
                        if (Object.keys(formErrors).length) {
                            setFormErrors({});
                        }
                    }}
                >
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                        <div className="xl:col-span-2">
                            <Card className="border-0 shadow-sm rounded-2xl">
                                {Object.keys(formErrors).length > 0 && (
                                    <Alert
                                        type="error"
                                        message="Please fix the following errors:"
                                        description={
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(formErrors).map(([field, errors]) => (
                                                    <li key={field} className="text-sm">
                                                        <strong>{field}:</strong> {Array.isArray(errors) ? errors.join(', ') : String(errors)}
                                                    </li>
                                                ))}
                                            </ul>
                                        }
                                        className="mb-6 rounded-xl"
                                        closable
                                    />
                                )}

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <LuTag className="text-sky-600" />
                                        Basic Information
                                    </h3>

                                    <Row gutter={[16, 4]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Material Name"
                                                name="material_name"
                                                rules={[
                                                    { required: true, message: 'Please enter material name' },
                                                    { min: 2, message: 'Name must be at least 2 characters' },
                                                    { max: 255, message: 'Name cannot exceed 255 characters' },
                                                    {
                                                        validator: async (_, value) => {
                                                            if (!value) return Promise.resolve();
                                                            if (!/^[a-zA-Z0-9\s\-_/().]+$/.test(value)) {
                                                                return Promise.reject(new Error('Name contains invalid characters'));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                    }
                                                ]}
                                            >
                                                <Input
                                                    placeholder="e.g., Water, Sugar, Flour"
                                                    prefix={<LuPackage className="text-gray-400" />}
                                                    allowClear
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Material Code"
                                                name="material_code"
                                                rules={[
                                                    { max: 80, message: 'Code cannot exceed 80 characters' },
                                                    {
                                                        validator: async (_, value) => {
                                                            if (!value) return Promise.resolve();
                                                            if (!/^[A-Za-z0-9_-]+$/.test(value)) {
                                                                return Promise.reject(new Error('Code allows letters, numbers, _ and - only'));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                    }
                                                ]}
                                            >
                                                <Input placeholder="Optional code (e.g., RM-SUGAR-001)" allowClear />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </section>

                                <Divider className="my-3 sm:my-5" />

                                <section className="border border-gray-200 p-3 sm:p-4 rounded-xl bg-gray-50/40">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <LuScale className="text-violet-600" />
                                        Units and Conversion
                                    </h3>

                                    <Row gutter={[16, 4]}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Primary Unit"
                                                name="primary_unit"
                                                rules={[{ required: true, message: 'Please select primary unit' }]}
                                            >
                                                <Select
                                                    placeholder="Select primary unit"
                                                    suffixIcon={<LuScale className="text-gray-400" />}
                                                    showSearch
                                                    optionFilterProp="children"
                                                >
                                                    {unitOptions.map((unit) => (
                                                        <Option key={unit.value} value={unit.value}>
                                                            {unit.label}
                                                        </Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-white">
                                            <label className="text-gray-700 font-medium text-sm sm:text-base">
                                                Add Secondary Unit Conversion
                                            </label>
                                            <Switch
                                                checked={hasSecondaryUnit}
                                                onChange={handleSecondaryToggle}
                                                checkedChildren={<LuCircleCheck className="w-3 h-3" />}
                                                unCheckedChildren={<LuCircleX className="w-3 h-3" />}
                                            />
                                        </div>
                                    </div>

                                    {hasSecondaryUnit && (
                                        <Row gutter={[16, 8]}>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label="Secondary Unit"
                                                    name="secondary_unit"
                                                    dependencies={['primary_unit']}
                                                    rules={[{ validator: validateSecondaryUnit }]}
                                                >
                                                    <Select
                                                        placeholder="Select secondary unit"
                                                        suffixIcon={<LuScale className="text-gray-400" />}
                                                        showSearch
                                                        optionFilterProp="children"
                                                    >
                                                        {unitOptions.map((unit) => (
                                                            <Option key={unit.value} value={unit.value}>
                                                                {unit.label}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label="Conversion Value"
                                                    name="conversion_value"
                                                    dependencies={['secondary_unit']}
                                                    rules={[{ validator: validateConversion }]}
                                                >
                                                    <InputNumber
                                                        placeholder="e.g., 1000"
                                                        className="w-full"
                                                        min={0.0001}
                                                        step={0.0001}
                                                        precision={4}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={8}>
                                                <div className="h-full md:pt-8">
                                                    <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                                                        <div className="font-medium mb-1">Conversion Preview:</div>
                                                        {primaryUnit && secondaryUnit && conversionValue ? (
                                                            <div className="text-green-600">
                                                                1 {primaryUnit} = {conversionValue} {secondaryUnit}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-500">Enter values to see conversion</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}
                                </section>
                            </Card>
                        </div>

                        <div className="xl:col-span-1">
                            <Card className="border-0 shadow-sm rounded-2xl xl:sticky xl:top-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <LuImage className="text-pink-600" />
                                    Material Image
                                </h3>

                                <Form.Item>
                                    <div className="space-y-4">
                                        <Upload
                                            name="material_image"
                                            listType="picture-card"
                                            className="w-full [&_.ant-upload]:!w-full [&_.ant-upload]:!h-56"
                                            showUploadList={false}
                                            beforeUpload={beforeUpload}
                                            accept="image/*"
                                        >
                                            {imagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Material preview"
                                                        className="w-full h-full object-contain rounded-lg bg-gray-50"
                                                    />
                                                    <Button
                                                        type="text"
                                                        icon={<DeleteOutlined />}
                                                        className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveImage();
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-center px-4">
                                                    <LuUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                    <div className="text-sm font-medium text-gray-700">Upload image</div>
                                                    <div className="text-xs text-gray-500 mt-1">Max 2MB, JPG/PNG/WebP</div>
                                                </div>
                                            )}
                                        </Upload>

                                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                            <p className="font-medium mb-1">Image Guidelines</p>
                                            <p>Use square images for best preview. Upload is optional.</p>
                                        </div>

                                        {imageUrl && (
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-700">Current image URL</p>
                                                <p className="text-xs text-blue-600 truncate mt-1">{imageUrl}</p>
                                            </div>
                                        )}
                                    </div>
                                </Form.Item>
                            </Card>
                        </div>
                    </div>

                    <div className="pt-4 sm:pt-6">
                        <Card className="border-0 shadow-sm rounded-2xl">
                            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                <Button
                                    type="default"
                                    icon={<LuArrowLeft />}
                                    onClick={() => navigate('/dashboard/raw-materials')}
                                    className="h-11 sm:h-12 px-6 rounded-lg w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="default"
                                    icon={<LuRefreshCw />}
                                    onClick={handleReset}
                                    className="h-11 sm:h-12 px-6 rounded-lg w-full sm:w-auto"
                                >
                                    Reset Form
                                </Button>

                                <Button
                                    type="primary"
                                    icon={<LuSave />}
                                    htmlType="submit"
                                    loading={saving}
                                    className="h-11 sm:h-12 px-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none w-full sm:w-auto"
                                >
                                    {saving ? 'Saving...' : isEditMode ? 'Update Material' : 'Create Material'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </Form>
            </div>
        </motion.div>
    );
};

export default RawMaterialForm;
