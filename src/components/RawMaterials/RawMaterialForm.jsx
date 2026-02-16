import React, { useState, useEffect } from 'react';
import {
    LuSave,
    LuArrowLeft,
    LuUpload,
    LuPackage,
    LuDollarSign,
    LuScale,
    LuFileText,
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
    Image as AntImage,
    notification
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { useGetAllRawMaterialQuery, useGetRawMaterialByIdQuery } from '../../../app/Features/RawMaterialSlice';

const { TextArea } = Input;
const { Option } = Select;

const RawMaterialForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const token = localStorage.getItem('token');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [hasSecondaryUnit, setHasSecondaryUnit] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const { refetch } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: '', token });
    const { data } = useGetRawMaterialByIdQuery({ id, token });

    // Common units for selection
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
        { value: 'ft', label: 'Foot (ft)' },
    ];

    // Fetch material data for edit mode
    useEffect(() => {
        if (isEditMode) {
            const material = data?.data;
            setCurrentMaterial(material);

            // Set form values
            form.setFieldsValue({
                material_name: material?.material_name,
                material_code: material?.material_code || '',
                primary_unit: material?.primary_unit,
                secondary_unit: material?.secondary_unit || '',
                conversion_value: material?.conversion_value ? parseFloat(material?.conversion_value) : undefined,
            });

            // Handle secondary unit toggle
            if (material?.secondary_unit) {
                setHasSecondaryUnit(true);
            }

            // Set image preview if exists
            if (material?.material_image) {
                setImageUrl(material?.material_image);
                setImagePreview(material?.material_image);
            }
        }
    }, [data]);

    // Handle image upload
    const handleImageUpload = (info) => {
        if (info.file.status === 'uploading') {
            return;
        }

        if (info.file.status === 'done') {
            // Get uploaded image URL from response
            const url = info.file.response?.data?.url || URL.createObjectURL(info.file.originFileObj);
            setImageFile(info.file.originFileObj);
            setImageUrl(url);
            setImagePreview(url);
        }
    };

    // Handle file before upload
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            notification.error({
                message: 'Error',
                description: 'You can only upload image files!',
            });
            return Upload.LIST_IGNORE;
        }

        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            notification.error({
                message: 'Error',
                description: 'Image must be smaller than 2MB!',
            });
            return Upload.LIST_IGNORE;
        }

        // Preview image
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        setImageFile(file);
        return false; // Prevent auto upload
    };

    // Remove image
    const handleRemoveImage = () => {
        setImageFile(null);
        setImageUrl('');
        setImagePreview('');
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        setSaving(true);
        setFormErrors({});

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            // Append form data
            Object.keys(values).forEach(key => {
                if (values[key] !== undefined && values[key] !== null) {
                    formData.append(key, values[key]);
                }
            });

            // Append image if exists
            if (imageFile) {
                formData.append('material_image', imageFile);
            }

            // Remove secondary unit fields if not using secondary unit
            if (!hasSecondaryUnit) {
                formData.delete('secondary_unit');
                formData.delete('conversion_value');
                // formData.delete('attrs');
                // Append attributes - ensure colors are properly formatted
                const formattedAttributes = [{
                    name: values.primary_unit,
                    type: 'number',
                    value: 1
                }];

                formData.append("attributes", JSON.stringify(formattedAttributes));

            } else {

                const formattedAttributes = [
                    {
                        name: values.primary_unit,
                        type: 'number',
                        value: 1
                    },
                    {
                        name: values.secondary_unit,
                        type: 'number',
                        value: values.conversion_value
                    }
                ];
                formData.append("attributes", JSON.stringify(formattedAttributes));
            }




            let response;
            if (isEditMode) {
                formData.append("edit_id", JSON.stringify(id));
                response = await api.post(`/raw_material/${id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            } else {
                response = await api.post(`/raw_materials`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
            }

            console.log(response);

            if (response.status == 200) {
                refetch();
                toast.success(isEditMode
                    ? 'Material updated successfully!'
                    : 'Material created successfully!',
                );
                navigate('/dashboard/raw-materials');
            }

        } catch (error) {
            console.error('Error saving material:', error);
            toast.error('Failed to save material. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Validate cost format
    const validateCost = (_, value) => {
        if (!value) {
            return Promise.reject(new Error('Please enter the material cost'));
        }

        // Validate format: up to 8 digits before decimal, up to 2 after
        const regex = /^\d{1,8}(\.\d{1,2})?$/;
        if (!regex.test(value.toString())) {
            return Promise.reject(
                new Error('Invalid cost format. Maximum 8 digits before decimal and 2 after.')
            );
        }

        return Promise.resolve();
    };

    // Validate conversion value
    const validateConversion = (_, value) => {
        if (hasSecondaryUnit && !value) {
            return Promise.reject(new Error('Please enter conversion value'));
        }
        if (value && value <= 0) {
            return Promise.reject(new Error('Conversion value must be greater than 0'));
        }
        return Promise.resolve();
    };

    // Reset form
    const handleReset = () => {
        form.resetFields();
        setImageFile(null);
        setImageUrl('');
        setImagePreview('');
        setHasSecondaryUnit(false);
        setFormErrors({});
    };

    if (loading) {
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
                                onClick={() => navigate('/dashboard/raw-materials')}
                                className="mb-4 text-gray-600 hover:text-gray-800"
                            >
                                Back to Materials
                            </Button>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                <div className={`p-3 ${isEditMode ? 'bg-yellow-100' : 'bg-green-100'} rounded-xl`}>
                                    <LuPackage className={`text-2xl ${isEditMode ? 'text-yellow-600' : 'text-green-600'}`} />
                                </div>
                                {isEditMode ? 'Edit Raw Material' : 'Create New Raw Material'}
                            </h1>
                            <p className="text-gray-600">
                                {isEditMode
                                    ? 'Update the material information below'
                                    : 'Fill in the details to add a new raw material to your inventory'}
                            </p>
                        </div>

                        {isEditMode && currentMaterial && (
                            <div className="flex items-center gap-3">
                                <Tag color="blue" className="text-sm py-1 px-3">
                                    ID: {currentMaterial.id}
                                </Tag>
                                <Tag color={currentMaterial.is_deleted === 1 ? 'red' : 'green'} className="text-sm py-1 px-3">
                                    {currentMaterial.is_deleted === 1 ? 'Deleted' : 'Active'}
                                </Tag>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Form Section */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-0 shadow-sm">
                                {Object.keys(formErrors).length > 0 && (
                                    <Alert
                                        type="error"
                                        message="Please fix the following errors:"
                                        description={
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(formErrors).map(([field, errors]) => (
                                                    <li key={field} className="text-sm">
                                                        <strong>{field}:</strong> {errors.join(', ')}
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
                                    size="large"
                                >
                                    {/* Basic Information Section */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LuTag className="text-blue-500" />
                                            Basic Information
                                        </h3>

                                        <Row gutter={16}>
                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label="Material Name"
                                                    name="material_name"
                                                    rules={[
                                                        { required: true, message: 'Please enter material name' },
                                                        { max: 255, message: 'Name cannot exceed 255 characters' }
                                                    ]}
                                                    validateStatus={formErrors.material_name ? 'error' : ''}
                                                    help={formErrors.material_name?.[0]}
                                                >
                                                    <Input
                                                        placeholder="e.g., Water, Sugar, Flour"
                                                        prefix={<LuPackage className="text-gray-400" />}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>


                                    </div>


                                    {/* Units & Conversion Section */}
                                    <div className='border p-3 rounded-2xl border-gray-400'>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LuScale className="text-purple-500" />
                                            Units & Conversion
                                        </h3>

                                        <Row gutter={16}>
                                            <Col span={24} md={12}>
                                                <Form.Item
                                                    label="Primary Unit"
                                                    name="primary_unit"
                                                    rules={[
                                                        { required: true, message: 'Please select primary unit' },
                                                        { max: 100, message: 'Unit cannot exceed 100 characters' }
                                                    ]}
                                                    validateStatus={formErrors.primary_unit ? 'error' : ''}
                                                    help={formErrors.primary_unit?.[0]}
                                                >
                                                    <Select
                                                        placeholder="Select primary unit"
                                                        suffixIcon={<LuScale className="text-gray-400" />}
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                        }
                                                    >
                                                        {unitOptions.map(unit => (
                                                            <Option key={unit.value} value={unit.value}>
                                                                {unit.label}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-gray-700 font-medium">
                                                    Add Secondary Unit Conversion
                                                </label>
                                                <Switch
                                                    checked={hasSecondaryUnit}
                                                    onChange={setHasSecondaryUnit}
                                                    checkedChildren={<LuCircleCheck className="w-3 h-3" />}
                                                    unCheckedChildren={<LuCircleX className="w-3 h-3" />}
                                                />
                                            </div>

                                            {hasSecondaryUnit && (
                                                <Row gutter={16}>
                                                    <Col span={24} md={8}>
                                                        <Form.Item
                                                            label="Secondary Unit"
                                                            name="secondary_unit"
                                                            rules={[
                                                                { max: 100, message: 'Unit cannot exceed 100 characters' }
                                                            ]}
                                                            validateStatus={formErrors.secondary_unit ? 'error' : ''}
                                                            help={formErrors.secondary_unit?.[0]}
                                                        >
                                                            <Select
                                                                placeholder="Select secondary unit"
                                                                suffixIcon={<LuScale className="text-gray-400" />}
                                                                showSearch
                                                                filterOption={(input, option) =>
                                                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                                }
                                                            >
                                                                {unitOptions.map(unit => (
                                                                    <Option key={unit.value} value={unit.value}>
                                                                        {unit.label}
                                                                    </Option>
                                                                ))}
                                                            </Select>
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={24} md={8}>
                                                        <Form.Item
                                                            label="Conversion Value"
                                                            name="conversion_value"
                                                            rules={[
                                                                { validator: validateConversion }
                                                            ]}
                                                            validateStatus={formErrors.conversion_value ? 'error' : ''}
                                                            help={formErrors.conversion_value?.[0]}
                                                        >
                                                            <InputNumber
                                                                placeholder="e.g., 1000"
                                                                className="w-full"
                                                                min={0.0001}
                                                                step={0.0001}
                                                                precision={4}
                                                                addonAfter={
                                                                    <span className="text-gray-500 text-xs">
                                                                        1 {form.getFieldValue('primary_unit') || 'unit'} =
                                                                    </span>
                                                                }
                                                            />
                                                        </Form.Item>
                                                    </Col>

                                                    <Col span={24} md={8}>
                                                        <div className="pt-8">
                                                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                                <div className="font-medium mb-1">Conversion Preview:</div>
                                                                {form.getFieldValue('primary_unit') && form.getFieldValue('secondary_unit') && form.getFieldValue('conversion_value') ? (
                                                                    <div className="text-green-600">
                                                                        1 {form.getFieldValue('primary_unit')} ={' '}
                                                                        {form.getFieldValue('conversion_value')} {form.getFieldValue('secondary_unit')}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-gray-500">
                                                                        Enter values to see conversion
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            )}
                                        </div>
                                    </div>

                                    <Divider />

                                    {/* Image Upload Section */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <LuImage className="text-pink-500" />
                                            Material Image
                                        </h3>

                                        <Form.Item
                                            validateStatus={formErrors.material_image ? 'error' : ''}
                                            help={formErrors.material_image?.[0]}
                                        >
                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-1">
                                                    <Upload
                                                        name="material_image"
                                                        listType="picture-card"
                                                        className="avatar-uploader"
                                                        showUploadList={false}
                                                        beforeUpload={beforeUpload}
                                                        onChange={handleImageUpload}
                                                        accept="image/*"
                                                    >
                                                        {imagePreview ? (
                                                            <div className="relative w-full h-full">
                                                                <img
                                                                    src={imagePreview}
                                                                    alt="Material preview"
                                                                    className="w-25 h-25 object-contain rounded-lg"
                                                                    preview={false}
                                                                />
                                                                <Button
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRemoveImage();
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-4">
                                                                <LuUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                                {/* <div className="text-gray-600">Upload Image</div> */}
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Max 2MB • JPG, PNG
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Upload>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-600 space-y-2">
                                                        <p className="font-medium">Image Guidelines:</p>
                                                        <ul className="space-y-1 list-disc list-inside">
                                                            <li>Maximum file size: 2MB</li>
                                                            <li>Supported formats: JPG, PNG</li>
                                                            <li>Recommended size: 500x500px</li>
                                                            <li>Clear, well-lit product photos work best</li>
                                                        </ul>
                                                        {imageUrl && (
                                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                                <p className="text-sm text-blue-700">
                                                                    Current image URL:
                                                                </p>
                                                                <p className="text-xs text-blue-600 truncate mt-1">
                                                                    {imageUrl}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Form.Item>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="pt-6 border-t border-gray-200">
                                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                            <Button
                                                type="default"
                                                icon={<LuArrowLeft />}
                                                onClick={() => navigate('/dashboard/raw-materials')}
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
                                                {saving ? 'Saving...' : isEditMode ? 'Update Material' : 'Create Material'}
                                            </Button>
                                        </div>
                                    </div>
                                </Form>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default RawMaterialForm;