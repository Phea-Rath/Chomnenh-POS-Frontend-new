import React, { useState, useEffect } from 'react';
import {
    LuSave,
    LuArrowLeft,
    LuUpload,
    LuPackage,
    LuScale,
    LuTag,
    LuImage,
    LuClipboardCheck,
    LuRefreshCw,
    LuInfo
} from 'react-icons/lu';
import {
    Form,
    Input,
    Button,
    Card,
    Upload,
    Select,
    InputNumber,
    Alert,
    Spin,
    Divider,
    Row,
    Col,
    Tag,
    notification,
    Statistic,
    Tooltip
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import { DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useGetAllRawMaterialQuery, useGetRawMaterialByIdQuery } from '../../../app/Features/RawMaterialSlice';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const RawMaterialForm = () => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const token = localStorage.getItem('token');

    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [currentMaterial, setCurrentMaterial] = useState(null);

    const { refetch } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: '', token });
    const { data, isLoading: materialLoading } = useGetRawMaterialByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

    const materialName = Form.useWatch('material_name', form);
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
        if (!isEditMode) return;

        const material = data?.data;
        if (!material) return;

        setCurrentMaterial(material);
        form.setFieldsValue({
            material_name: material.material_name || '',
            material_code: material.material_code || '',
            primary_unit: material.primary_unit || undefined,
            secondary_unit: material.secondary_unit || undefined,
            conversion_value: material.conversion_value ? parseFloat(material.conversion_value) : undefined
        });

        if (material.material_image) {
            setImageUrl(material.material_image);
            setImagePreview(material.material_image);
        }
    }, [data, form, isEditMode]);

    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            notification.error({
                message: t('invalidFile'),
                description: t('onlyImageFilesAllowed')
            });
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            notification.error({
                message: t('fileTooLarge'),
                description: t('imageMustBeSmaller2MB')
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
        if (value && value === form.getFieldValue('primary_unit')) {
            return Promise.reject(new Error(t('secondaryUnitDifferentFromPrimary')));
        }
        return Promise.resolve();
    };

    const validateConversion = async (_, value) => {
        const hasSecondary = form.getFieldValue('secondary_unit');
        if (hasSecondary && (value === undefined || value === null || value === '')) {
            return Promise.reject(new Error(t('enterConversionValue')));
        }
        if (value !== undefined && value !== null && value !== '' && Number(value) <= 0) {
            return Promise.reject(new Error(t('conversionValueGreaterZero')));
        }
        return Promise.resolve();
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
                toast.success(isEditMode ? t('materialUpdatedSuccessfully') : t('materialCreatedSuccessfully'));
                navigate(-1);
            }
        } catch (error) {
            const apiErrors = error?.response?.data?.errors || {};
            if (Object.keys(apiErrors).length) {
                setFormErrors(apiErrors);
                toast.error(t('fixHighlightedFields'));
            } else {
                toast.error(error?.response?.data?.message || t('failedSaveMaterial'));
            }
        } finally {
            setSaving(false);
        }
    };

    if (isEditMode && materialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingMaterialData')}...</p>
                </div>
            </div>
        );
    }

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
                                {t('backToMaterials')}
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                                <div className={`p-3 ${isEditMode ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'} rounded-xl transition-colors`}>
                                    <LuPackage className={`text-2xl ${isEditMode ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                                </div>
                                {isEditMode ? t('editRawMaterial') : t('createNewRawMaterial')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isEditMode
                                    ? t('updateMaterialInfo')
                                    : t('fillDetailsAddMaterial')}
                            </p>
                        </div>

                        {isEditMode && currentMaterial && (
                            <div className="flex items-center gap-3">
                                <Tag color="blue" className="text-sm py-1 px-3 dark:bg-blue-900/30 dark:border-blue-800">
                                    ID: {currentMaterial.id}
                                </Tag>
                                <Tag color={currentMaterial.is_deleted === 1 ? 'red' : 'green'} className="text-sm py-1 px-3 dark:bg-red-900/30 dark:border-red-800">
                                    {currentMaterial.is_deleted === 1 ? t('deleted') : t('active')}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                    scrollToFirstError
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Form Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-xl rounded-2xl dark:!bg-gray-800 transition-colors">
                                {Object.keys(formErrors).length > 0 && (
                                    <Alert
                                        type="error"
                                        message={t('fixErrorsMessage')}
                                        description={
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(formErrors).map(([field, errors]) => (
                                                    <li key={field} className="text-sm">
                                                        <strong>{field.replace(/_/g, ' ')}:</strong> {Array.isArray(errors) ? errors.join(', ') : String(errors)}
                                                    </li>
                                                ))}
                                            </ul>
                                        }
                                        className="mb-6 rounded-xl"
                                        closable
                                    />
                                )}

                                <section>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                                        <LuTag className="text-blue-500" />
                                        {t('basicInformation')}
                                    </h3>

                                    <Row gutter={24}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label={<span className="dark:text-gray-300">{t('materialName')}</span>}
                                                name="material_name"
                                                rules={[
                                                    { required: true, message: t('enterMaterialName') },
                                                    { min: 2, message: t('nameAtLeast2Chars') }
                                                ]}
                                            >
                                                <Input
                                                    placeholder="e.g., Water, Sugar, Flour"
                                                    prefix={<LuPackage className="text-gray-400" />}
                                                    className="dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label={<span className="dark:text-gray-300">{t('materialCode')}</span>}
                                                name="material_code"
                                                rules={[{ max: 80, message: t('codeExceed80Chars') }]}
                                            >
                                                <Input
                                                    placeholder="Optional code (e.g., RM-SUGAR-001)"
                                                    prefix={<LuTag className="text-gray-400" />}
                                                    className="dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </section>

                                <Divider className="my-8 dark:border-gray-700" />

                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                            <LuScale className="text-violet-500" />
                                            {t('unitsConversion')}
                                        </h3>
                                        <Tooltip title={t('secondaryUnitTooltip')}>
                                            <LuInfo className="text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>

                                    <div className="bg-gray-50/50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors">
                                        <Row gutter={24}>
                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('primaryUnit')}</span>}
                                                    name="primary_unit"
                                                    rules={[{ required: true, message: t('selectPrimaryUnit') }]}
                                                >
                                                    <Select
                                                        placeholder={t('selectUnit')}
                                                        suffixIcon={<LuScale className="text-gray-400" />}
                                                        showSearch
                                                        className="dark:!bg-gray-900"
                                                        dropdownClassName="dark:bg-gray-800"
                                                    >
                                                        {unitOptions.map((unit) => (
                                                            <Option key={unit.value} value={unit.value}>{unit.label}</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('secondaryUnitOptional')}</span>}
                                                    name="secondary_unit"
                                                    rules={[{ validator: validateSecondaryUnit }]}
                                                >
                                                    <Select
                                                        placeholder={t('selectUnit')}
                                                        suffixIcon={<LuScale className="text-gray-400" />}
                                                        showSearch
                                                        allowClear
                                                        className="dark:!bg-gray-900"
                                                    >
                                                        {unitOptions.map((unit) => (
                                                            <Option key={unit.value} value={unit.value}>{unit.label}</Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} md={8}>
                                                <Form.Item
                                                    label={<span className="dark:text-gray-300">{t('conversionValue')}</span>}
                                                    name="conversion_value"
                                                    rules={[{ validator: validateConversion }]}
                                                    disabled={!secondaryUnit}
                                                >
                                                    <InputNumber
                                                        placeholder="e.g., 1000"
                                                        className="w-full dark:!bg-gray-900 dark:!text-white dark:!border-gray-700"
                                                        min={0.0001}
                                                        step={0.0001}
                                                        precision={4}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {primaryUnit && secondaryUnit && conversionValue > 0 && (
                                            <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800 flex items-center justify-center gap-2 text-violet-700 dark:text-violet-400 font-medium transition-colors">
                                                <span>1 {primaryUnit}</span>
                                                <LuScale className="w-4 h-4 opacity-50" />
                                                <span>{conversionValue} {secondaryUnit}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </Card>

                            <Card className="border-0 shadow-xl rounded-2xl dark:!bg-gray-800 transition-colors">
                                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                    <Button
                                        type="default"
                                        icon={<LuArrowLeft />}
                                        onClick={() => navigate(-1)}
                                        className="h-12 px-6 rounded-xl dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 transition-colors"
                                    >
                                        {t('cancel')}
                                    </Button>

                                    <Button
                                        type="default"
                                        icon={<LuRefreshCw />}
                                        onClick={() => form.resetFields()}
                                        className="h-12 px-6 rounded-xl dark:!bg-gray-700 dark:!text-white dark:!border-gray-600 transition-colors"
                                    >
                                        {t('reset')}
                                    </Button>

                                    <Button
                                        type="primary"
                                        icon={<LuSave />}
                                        htmlType="submit"
                                        loading={saving}
                                        className="h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-lg shadow-blue-200 dark:shadow-none"
                                    >
                                        {saving ? t('saving') : isEditMode ? t('updateMaterial') : t('createMaterial')}
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Summary Card */}
                            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden dark:!bg-gray-800 transition-colors">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <LuPackage className="text-blue-500" />
                                        {t('summary')}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <Statistic
                                        title={<span className="dark:text-gray-400">{t('materialName')}</span>}
                                        value={materialName || t('notSet')}
                                        valueStyle={{ fontSize: '1.25rem', fontWeight: 600, color: 'inherit' }}
                                        className="dark:[&_.ant-statistic-content]:text-white"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Statistic
                                            title={<span className="dark:text-gray-400">{t('primaryUnit')}</span>}
                                            value={primaryUnit || 'N/A'}
                                            valueStyle={{ fontSize: '1rem', color: 'inherit' }}
                                            className="dark:[&_.ant-statistic-content]:text-white"
                                        />
                                        <Statistic
                                            title={<span className="dark:text-gray-400">{t('conversionValue')}</span>}
                                            value={conversionValue || 0}
                                            suffix={secondaryUnit || ''}
                                            valueStyle={{ fontSize: '1rem', color: 'inherit' }}
                                            className="dark:[&_.ant-statistic-content]:text-white"
                                        />
                                    </div>

                                    {imagePreview && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('imagePreview')}</p>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-40 object-contain rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 transition-colors"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Image Upload Card */}
                            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden dark:!bg-gray-800 transition-colors">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 transition-colors">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <LuImage className="text-pink-500" />
                                        {t('materialImage')}
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <Upload
                                        name="material_image"
                                        listType="picture-card"
                                        className="w-full [&_.ant-upload]:!w-full [&_.ant-upload]:!h-48 dark:[&_.ant-upload]:!bg-gray-900 dark:[&_.ant-upload]:!border-gray-700"
                                        showUploadList={false}
                                        beforeUpload={beforeUpload}
                                        accept="image/*"
                                    >
                                        {imagePreview ? (
                                            <div className="relative w-full h-full p-2">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                                <Button
                                                    type="primary"
                                                    danger
                                                    shape="circle"
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                    className="absolute top-2 right-2 shadow-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage();
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <LuUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('uploadImage')}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('imageSizeLimit')}</div>
                                            </div>
                                        )}
                                    </Upload>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Form>
            </div>
        </motion.div>
    );
};

export default RawMaterialForm;
