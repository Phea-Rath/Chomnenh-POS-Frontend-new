import React, { useState, useEffect } from 'react';
import { 
    FaSave, 
    FaTimes, 
    FaTag, 
    FaBox, 
    FaTrash, 
    FaEdit, 
    FaBalanceScale,
    FaInfoCircle
} from 'react-icons/fa';
import { IoMdCloudUpload } from "react-icons/io";
import { useNavigate, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useOutletsContext } from '../../layouts/Management';
import api from '../../services/api';
import AlertBox from '../../services/AlertBox';
import Input from '../../utils/Input';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import { useGetAllRawMaterialQuery, useGetRawMaterialByIdQuery } from '../../../app/Features/RawMaterialSlice';

const RawMaterialForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const token = localStorage.getItem('token');
    const { setLoading, loading } = useOutletsContext();

    // State management
    const [material, setMaterial] = useState({
        material_name: '',
        material_code: '',
        primary_unit: '',
        secondary_unit: '',
        conversion_value: '',
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [errors, setErrors] = useState({});
    const [alertBox, setAlertBox] = useState(false);

    const { refetch } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: '', token });
    const { data: materialData, isLoading: materialLoading } = useGetRawMaterialByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

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
        if (isEditMode && materialData?.data) {
            const data = materialData.data;
            setMaterial({
                material_name: data.material_name || '',
                material_code: data.material_code || '',
                primary_unit: data.primary_unit || '',
                secondary_unit: data.secondary_unit || '',
                conversion_value: data.conversion_value ? parseFloat(data.conversion_value) : '',
            });

            if (data.material_image) {
                setImagePreview(data.material_image);
            }
        }
    }, [isEditMode, materialData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error(t('onlyImageFilesAllowed'));
                return;
            }
            if (file.size / 1024 / 1024 > 2) {
                toast.error(t('imageMustBeSmaller2MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
            setImageFile(file);
            setErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    const validateForm = () => {
        const newErrors = {};

        if (!material.material_name || material.material_name.trim() === '') {
            newErrors.material_name = t('enterMaterialName');
        } else if (material.material_name.length < 2) {
            newErrors.material_name = t('nameAtLeast2Chars');
        }

        if (!material.primary_unit) {
            newErrors.primary_unit = t('selectPrimaryUnit');
        }

        if (material.secondary_unit) {
            if (material.secondary_unit === material.primary_unit) {
                newErrors.secondary_unit = t('secondaryUnitDifferentFromPrimary');
            }
            if (!material.conversion_value || parseFloat(material.conversion_value) <= 0) {
                newErrors.conversion_value = t('enterConversionValue');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            setAlertBox(true);
        } else {
            toast.error(t('fixHighlightedFields'));
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        setAlertBox(false);

        try {
            const formData = new FormData();
            Object.keys(material).forEach((key) => {
                if (material[key] !== undefined && material[key] !== null && material[key] !== '') {
                    formData.append(key, material[key]);
                }
            });

            if (imageFile) {
                formData.append('material_image', imageFile);
            }

            const response = isEditMode
                ? await api.post(`/raw_material/${id}`, formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                })
                : await api.post('/raw_materials', formData, {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

            if (response.status === 200) {
                refetch();
                toast.success(isEditMode ? t('materialUpdatedSuccessfully') : t('materialCreatedSuccessfully'));
                navigate(-1);
            }
        } catch (error) {
            const apiErrors = error?.response?.data?.errors || {};
            if (Object.keys(apiErrors).length) {
                setErrors(apiErrors);
                toast.error(t('fixHighlightedFields'));
            } else {
                toast.error(error?.response?.data?.message || t('failedSaveMaterial'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (isEditMode && materialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loadingMaterialData')}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-transparent py-8">
            <div className="mx-auto px-2">
                <AlertBox
                    isOpen={alertBox}
                    title={t('confirm')}
                    message={isEditMode ? t('confirmUpdateMaterial', 'Are you sure you want to update this material?') : t('confirmCreateMaterial', 'Are you sure you want to create this material?')}
                    onConfirm={handleConfirm}
                    onCancel={() => setAlertBox(false)}
                    confirmText={isEditMode ? t('update') : t('create')}
                    cancelText={t('cancel')}
                />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {isEditMode ? t('editRawMaterial') : t('createNewRawMaterial')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isEditMode ? t('updateMaterialInfo') : t('fillDetailsAddMaterial')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Image Upload */}
                    <div className="lg:col-span-1">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    {t('materialImage')}
                                </h2>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                    >
                                        <FaTrash className="text-xs" />
                                        {t('remove')}
                                    </button>
                                )}
                            </div>

                            <label
                                htmlFor="material-image"
                                className={`block cursor-pointer transition-all duration-200 ${errors.image ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''}`}
                            >
                                <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                                    imagePreview
                                    ? 'border-blue-300 dark:border-blue-500/50 bg-blue-25 dark:bg-blue-900/20'
                                    : 'border-gray-400 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-25 dark:hover:bg-blue-900/20'
                                }`}>
                                    <div className="text-center py-4 w-full">
                                        {imagePreview ? (
                                            <div className="relative group mx-auto">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-64 mx-auto object-contain rounded-lg"
                                                />
                                                <div className="mt-4 text-sm text-blue-500 font-medium">
                                                    {t('clickToChange')}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                                                    {t('uploadImage')}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('dragAndDrop')}</p>
                                                <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                                    {t('browseFiles')}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                id="material-image"
                                hidden
                            />

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                                {t('imageSizeLimit')} (2MB max)
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <FaTag className="text-blue-500 text-xl" />
                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('basicInformation')}</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('materialName')} <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        onChange={(value) => setMaterial({ ...material, material_name: value })}
                                        value={material.material_name}
                                        placeholder="e.g., Water, Sugar, Flour"
                                    />
                                    {errors.material_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.material_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('materialCode')}
                                    </label>
                                    <Input
                                        onChange={(value) => setMaterial({ ...material, material_code: value })}
                                        value={material.material_code}
                                        placeholder="e.g., RM-SUGAR-001"
                                    />
                                    {errors.material_code && (
                                        <p className="text-red-500 text-xs mt-1">{errors.material_code}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Units & Conversion */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <FaBalanceScale className="text-purple-500 text-xl" />
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('unitsConversion')}</h2>
                                </div>
                                <div title={t('secondaryUnitTooltip')}>
                                    <FaInfoCircle className="text-gray-400 cursor-help" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('primaryUnit')} <span className="text-red-500">*</span>
                                    </label>
                                    <RichSearch
                                        data={unitOptions}
                                        value={material.primary_unit}
                                        placeholder={t('selectUnit')}
                                        onSelected={(value) => setMaterial({ ...material, primary_unit: value })}
                                        keyFields={{ id: 'value', title: 'label' }}
                                    />
                                    {errors.primary_unit && (
                                        <p className="text-red-500 text-xs mt-1">{errors.primary_unit}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('secondaryUnitOptional')}
                                    </label>
                                    <RichSearch
                                        data={unitOptions}
                                        value={material.secondary_unit}
                                        placeholder={t('selectUnit')}
                                        onSelected={(value) => setMaterial({ ...material, secondary_unit: value })}
                                        keyFields={{ id: 'value', title: 'label' }}
                                    />
                                    {errors.secondary_unit && (
                                        <p className="text-red-500 text-xs mt-1">{errors.secondary_unit}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {t('conversionValue')}
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.0001}
                                        onChange={(value) => setMaterial({ ...material, conversion_value: value })}
                                        value={material.conversion_value}
                                        placeholder="e.g., 1000"
                                        disabled={!material.secondary_unit}
                                    />
                                    {errors.conversion_value && (
                                        <p className="text-red-500 text-xs mt-1">{errors.conversion_value}</p>
                                    )}
                                </div>
                            </div>

                            {material.primary_unit && material.secondary_unit && material.conversion_value > 0 && (
                                <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800 flex items-center justify-center gap-4 text-purple-700 dark:text-purple-400 font-semibold transition-all animate-pulse">
                                    <span className="text-lg">1 {material.primary_unit}</span>
                                    <FaBalanceScale className="text-xl opacity-50" />
                                    <span className="text-lg">{material.conversion_value} {material.secondary_unit}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                type="button"
                                variant="danger"
                                outline
                                onClick={() => navigate(-1)}
                                disabled={loading}
                            >
                                <FaTimes />
                                {t('cancel')}
                            </Button>
                            
                            <Button
                                type="button"
                                onClick={() => {
                                    setMaterial({
                                        material_name: '',
                                        material_code: '',
                                        primary_unit: '',
                                        secondary_unit: '',
                                        conversion_value: '',
                                    });
                                    setImagePreview('');
                                    setImageFile(null);
                                    setErrors({});
                                }}
                                variant="primary"
                                outline
                                disabled={loading}
                            >
                                {t('reset')}
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {isEditMode ? <FaEdit className="text-lg" /> : <FaSave className="text-lg" />}
                                {loading ? (isEditMode ? t('updating') : t('saving')) : (isEditMode ? t('updateMaterial') : t('createMaterial'))}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RawMaterialForm;
