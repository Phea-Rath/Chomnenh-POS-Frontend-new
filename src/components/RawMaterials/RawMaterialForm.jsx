import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'framer-motion';
import { 
    LuArrowLeft, 
    LuSave, 
    LuX, 
    LuRefreshCw, 
    LuImage, 
    LuTag, 
    LuScale, 
    LuInfo, 
    LuTrash2, 
    LuPlus,
    LuFileText
} from 'react-icons/lu';
import { IoMdCloudUpload } from "react-icons/io";
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
    const [saving, setSaving] = useState(false);

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
        setSaving(true);
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
            setSaving(false);
            setLoading(false);
        }
    };

    const handleReset = () => {
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
    };

    if (isEditMode && materialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-[#13b5ea]" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="view-page px-4 md:px-6 font-sans antialiased text-slate-900 dark:text-slate-100"
        >
            <AlertBox
                isOpen={alertBox}
                title={t('confirm')}
                message={isEditMode ? t('confirmUpdateMaterial') : t('confirmCreateMaterial')}
                onConfirm={handleConfirm}
                onCancel={() => setAlertBox(false)}
                confirmText={isEditMode ? t('update') : t('create')}
                cancelText={t('cancel')}
            />

            <div>
                {/* Header Section */}
                <div className="border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#13b5ea] hover:underline"
                            >
                                <LuArrowLeft size={14} />
                                {t('backToMaterials')}
                            </button>

                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {isEditMode ? t('editRawMaterial') : t('createNewRawMaterial')}
                                </h1>
                                {isEditMode && id && (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700">
                                        #{id}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {t('reset')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[2px] text-[13px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={saving}
                                className="px-6 py-2 bg-[#13b5ea] hover:bg-[#0f92bd] text-white rounded-[2px] text-[13px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                {saving ? <LuRefreshCw className="animate-spin" /> : <LuSave />}
                                {saving ? t('saving') : isEditMode ? t('updateMaterial') : t('saveMaterial')}
                            </button>
                        </div>
                    </div>
                </div>

                <form className="p-4 md:p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column - Image Upload */}
                        <div className="lg:col-span-4">
                            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                                <LuImage size={14} />
                                {t('materialImage')}
                            </h2>

                            <div className="space-y-4">
                                <label
                                    htmlFor="material-image"
                                    className={`group relative block cursor-pointer overflow-hidden rounded-[2px] border-2 border-dashed transition-all duration-200 ${
                                        errors.image 
                                        ? 'border-red-400 bg-red-50 dark:bg-red-900/10' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-[#13b5ea] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
                                        {imagePreview ? (
                                            <div className="relative h-full w-full">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="max-h-[350px] w-full object-contain rounded-[2px]"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <LuRefreshCw /> {t('changeImage')}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#13b5ea]/10 group-hover:text-[#13b5ea] transition-all">
                                                    <IoMdCloudUpload size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{t('clickToUpload')}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('imageFormatsLimit')}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    id="material-image"
                                    hidden
                                />

                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[2px] transition-all"
                                    >
                                        <LuTrash2 size={14} />
                                        {t('removeImage')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Form Fields */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Basic Information */}
                            <section>
                                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                                    <LuTag size={14} />
                                    {t('basicInformation')}
                                </h2>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                            {t('materialName')} <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            onChange={(value) => setMaterial({ ...material, material_name: value })}
                                            value={material.material_name}
                                            placeholder={t('materialNamePlaceholder')}
                                            status={errors.material_name ? 'error' : ''}
                                        />
                                        {errors.material_name && (
                                            <p className="text-red-500 text-[11px] font-medium">{errors.material_name}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                            {t('materialCode')}
                                        </label>
                                        <Input
                                            onChange={(value) => setMaterial({ ...material, material_code: value })}
                                            value={material.material_code}
                                            placeholder={t('materialCodePlaceholder')}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Units & Conversion */}
                            <section>
                                <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <LuScale size={14} />
                                        {t('unitsAndConversion')}
                                    </h2>
                                    <div title={t('unitsConversionTooltip')} className="cursor-help text-slate-400 hover:text-[#13b5ea] transition-colors">
                                        <LuInfo size={16} />
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                            {t('primaryUnit')} <span className="text-red-500">*</span>
                                        </label>
                                        <RichSearch
                                            data={unitOptions}
                                            value={material.primary_unit}
                                            placeholder={t('selectPrimaryUnit')}
                                            onSelected={(value) => setMaterial({ ...material, primary_unit: value })}
                                            keyFields={{ id: 'value', title: 'label' }}
                                        />
                                        {errors.primary_unit && (
                                            <p className="text-red-500 text-[11px] font-medium">{errors.primary_unit}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                            {t('secondaryUnit')}
                                        </label>
                                        <RichSearch
                                            data={unitOptions}
                                            value={material.secondary_unit}
                                            placeholder={t('selectSecondaryUnit')}
                                            onSelected={(value) => setMaterial({ ...material, secondary_unit: value })}
                                            keyFields={{ id: 'value', title: 'label' }}
                                        />
                                        {errors.secondary_unit && (
                                            <p className="text-red-500 text-[11px] font-medium">{errors.secondary_unit}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                            {t('conversionValue')}
                                        </label>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.0001}
                                            onChange={(value) => setMaterial({ ...material, conversion_value: value })}
                                            value={material.conversion_value}
                                            placeholder="0.0000"
                                            disabled={!material.secondary_unit}
                                            status={errors.conversion_value ? 'error' : ''}
                                        />
                                        {errors.conversion_value && (
                                            <p className="text-red-500 text-[11px] font-medium">{errors.conversion_value}</p>
                                        )}
                                    </div>
                                </div>

                                {material.primary_unit && material.secondary_unit && Number(material.conversion_value) > 0 && (
                                    <div className="mt-8 rounded-[2px] border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-4">
                                        <div className="flex items-center justify-center gap-4 text-sm font-bold text-[#13b5ea]">
                                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-[2px] border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                                1 {unitOptions.find(u => u.value === material.primary_unit)?.label}
                                            </span>
                                            <LuScale size={20} className="text-blue-200 dark:text-blue-800" />
                                            <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-[2px] border border-blue-100 dark:border-blue-900/30 shadow-sm">
                                                {material.conversion_value} {unitOptions.find(u => u.value === material.secondary_unit)?.label}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default RawMaterialForm;

