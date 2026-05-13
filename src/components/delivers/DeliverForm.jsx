import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FaSave, FaTimes, FaTruck } from "react-icons/fa";
import { toast } from "react-toastify";
import {
    useCreateDeliverMutation,
    useGetAllDeliverQuery,
    useGetDeliverByIdQuery,
    useUpdateDeliverMutation,
} from "../../../app/Features/deliversSlice";
import { IoMdCloudUpload } from "react-icons/io";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import { useOutletsContext } from "../../layouts/Management";

const DeliverForm = () => {
    const { t } = useTranslation();
    const { darkMode } = useOutletsContext();
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [viewImage, setViewImage] = useState();
    const isUpdate = id ?? 0;
    const [dataForm, setFormData] = useState({
        image: null,
        deliver_name: "",
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const { refetch } = useGetAllDeliverQuery(token);
    const { data, refetch: reShow } = useGetDeliverByIdQuery({ id, token });
    const navigate = useNavigate();

    useEffect(() => {
        if (isUpdate != 0 && data?.data) {
            reShow();
            setViewImage(data?.data?.image);
            setFormData({
                deliver_name: data.data.deliver_name,
                image: null // We don't want to re-upload the same image unless changed
            });
        } else {
            setFormData({
                image: null,
                deliver_name: "",
            });
            setViewImage(null);
        }
    }, [isUpdate, data]);

    // Validation functions matching PHP validation rules
    const validateField = (name, value) => {
        const newFieldErrors = { ...fieldErrors };

        switch (name) {
            case 'deliver_name':
                if (!value || value.trim() === '') {
                    newFieldErrors.deliver_name = t('deliverNameRequired');
                } else if (value.length > 255) {
                    newFieldErrors.deliver_name = t('deliverNameLimit');
                } else {
                    delete newFieldErrors.deliver_name;
                }
                break;

            case 'image':
                if (value) {
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    if (!validTypes.includes(value.type)) {
                        newFieldErrors.image = t('maxSize2MB');
                    } else if (value.size > 2 * 1024 * 1024) {
                        newFieldErrors.image = t('maxSize2MB');
                    } else {
                        delete newFieldErrors.image;
                    }
                } else {
                    delete newFieldErrors.image;
                }
                break;

            default:
                break;
        }

        setFieldErrors(newFieldErrors);
    };

    const validateForm = () => {
        const newErrors = {};
        const newFieldErrors = { ...fieldErrors };

        if (!dataForm.deliver_name || dataForm.deliver_name.trim() === '') {
            newErrors.deliver_name = t('deliverNameRequired');
            newFieldErrors.deliver_name = t('deliverNameRequired');
        } else if (dataForm.deliver_name.length > 255) {
            newErrors.deliver_name = t('deliverNameLimit');
            newFieldErrors.deliver_name = t('deliverNameLimit');
        }

        if (dataForm.image) {
            if (dataForm.image.size > 2 * 1024 * 1024) {
                newErrors.image = t('maxSize2MB');
                newFieldErrors.image = t('maxSize2MB');
            }
        }

        setFieldErrors(newFieldErrors);
        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error(t('pleaseFixErrors'));
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("deliver_name", dataForm.deliver_name.trim());
            if (dataForm.image) {
                formData.append("image", dataForm.image);
            }

            if (isUpdate != 0) {
                await api.post(`/delivers/${id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success(t('deliverUpdatedSuccess'));
            } else {
                await api.post("delivers", formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success(t('deliverCreatedSuccess'));
            }

            refetch();
            navigate('/home/delivers');
        } catch (err) {
            const errorMessage = err?.data?.message || err?.message || "Operation failed";
            setErrors({ general: errorMessage });
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const changeUpload = (e) => {
        const fileUpload = e.target.files[0];
        if (fileUpload) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(fileUpload.type)) {
                setFieldErrors(prev => ({ ...prev, image: t('maxSize2MB') }));
                return;
            }

            if (fileUpload.size > 2 * 1024 * 1024) {
                setFieldErrors(prev => ({ ...prev, image: t('maxSize2MB') }));
                return;
            }

            setViewImage(URL.createObjectURL(fileUpload));
            setFormData((p) => {
                return { ...p, image: fileUpload };
            });
            setFieldErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const removeImage = () => {
        setViewImage("");
        setFormData(p => ({ ...p, image: null }));
        setFieldErrors(prev => ({ ...prev, image: '' }));
    };

    // Helper function to get input classes with error styling
    const getInputClass = (fieldName) => {
        const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
        const darkClass = darkMode 
            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
            : "bg-white border-gray-300 text-gray-900";
        
        if (fieldErrors[fieldName]) {
            return `${baseClass} ${darkMode ? "border-red-500 bg-red-900/20" : "border-red-500 bg-red-50"} ${darkClass}`;
        }
        return `${baseClass} ${darkClass}`;
    };

    return (
        <div className={`min-h-screen bg-transparent py-8 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
            <div className="mx-auto px-2">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                            <FaTruck className="text-white text-xl" />
                        </div>
                        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {isUpdate != 0 ? t('editDeliver') : t('createDeliver')}
                        </h1>
                    </div>
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {isUpdate != 0
                            ? t('updateDeliver')
                            : t('addNewDeliver')
                        }
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}>
                    {/* Validation Summary */}
                    {(Object.keys(errors).length > 0 || Object.keys(fieldErrors).length > 0) && (
                        <div className={`mb-8 p-6 border rounded-xl ${darkMode ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
                            <div className="flex items-center mb-2">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <h3 className={`font-semibold text-lg ${darkMode ? "text-red-400" : "text-red-800"}`}>{t('pleaseFixErrors')}</h3>
                            </div>
                            <ul className={`list-disc list-inside text-sm space-y-1 ${darkMode ? "text-red-300" : "text-red-700"}`}>
                                {Object.values(errors).map((error, index) => (
                                    error && <li key={index} className="ml-4">{error}</li>
                                ))}
                                {Object.values(fieldErrors).map((error, index) => (
                                    error && <li key={`field-${index}`} className="ml-4">{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Image Upload */}
                        <div className="space-y-8">
                            {/* Image Upload Section */}
                            <div className={`${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-300"} rounded-xl p-6 border-2 border-dashed`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                                        {t('deliverImage')}
                                        <span className={`text-sm ml-2 font-normal ${darkMode ? "text-gray-400" : "text-gray-500"}`}>({t('optional')})</span>
                                    </h2>
                                    {viewImage && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                        >
                                            <FaTimes className="text-xs" />
                                            {t('remove')}
                                        </button>
                                    )}
                                </div>

                                <label
                                    htmlFor="up-image-item"
                                    className={`block cursor-pointer transition-all duration-200 ${fieldErrors.image ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                                        }`}
                                >
                                    <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${fieldErrors.image
                                        ? 'border-red-500 bg-red-25'
                                        : viewImage
                                            ? 'border-blue-300 bg-blue-25'
                                            : (darkMode ? 'border-gray-500 hover:border-blue-400 hover:bg-blue-900/20' : 'border-gray-400 hover:border-blue-400 hover:bg-blue-25')
                                        }`}>
                                        {viewImage ? (
                                            <div className="text-center">
                                                <img
                                                    className="h-48 w-48 object-cover rounded-lg shadow-md mx-auto"
                                                    src={viewImage}
                                                    alt="Deliver preview"
                                                />
                                                <p className={`text-sm mt-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('clickToChange')}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <IoMdCloudUpload className={`text-5xl mx-auto mb-4 ${darkMode ? "text-blue-500" : "text-blue-400"}`} />
                                                <h3 className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('uploadDeliverImage')}</h3>
                                                <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{t('dragAndDrop')}</p>
                                                <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                                    {t('browseFiles')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={changeUpload}
                                    id="up-image-item"
                                    hidden
                                    name="up-image-item"
                                />

                                {fieldErrors.image && (
                                    <div className="flex items-center gap-2 text-red-500 text-sm mt-3">
                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        {fieldErrors.image}
                                    </div>
                                )}

                                <p className={`text-xs mt-3 text-center ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                    {t('maxSize2MB')}
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Form Fields */}
                        <div className="space-y-6">
                            {/* Deliver Information */}
                            <div className={`${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} rounded-xl p-6 border`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <FaTruck className="text-blue-500 text-xl" />
                                    <h2 className={`text-lg font-semibold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{t('basicInformation')}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            {t('deliverName')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="deliver_name"
                                            value={dataForm?.deliver_name}
                                            onChange={handleInputChange}
                                            className={getInputClass('deliver_name')}
                                            required
                                            maxLength={255}
                                            placeholder={t('enterDeliverName')}
                                        />
                                        {fieldErrors.deliver_name && (
                                            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                {fieldErrors.deliver_name}
                                            </div>
                                        )}
                                        <div className={`text-xs mt-2 flex justify-between ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                            <span>{t('required')}</span>
                                            <span>{dataForm?.deliver_name?.length}/255</span>
                                        </div>
                                    </div>

                                    <div className={`mt-6 p-4 rounded-lg border ${darkMode ? "bg-yellow-900/20 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`${darkMode ? "text-yellow-500" : "text-yellow-600"} mt-0.5`}>
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? "text-yellow-400" : "text-gray-800"}`}>{t('tip')}</p>
                                                <p className={`text-xs mt-1 ${darkMode ? "text-yellow-300/80" : "text-gray-600"}`}>
                                                    {t('uniqueBrandWarning')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 mt-8 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                        <div className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{t('fieldsMarkedWith')} <span className="text-red-500">*</span> {t('required')}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    navigate(-1);
                                }}
                                className={`px-6 py-3 border flex gap-2 items-center rounded-lg transition-all duration-200 cursor-pointer font-medium ${
                                    darkMode 
                                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" 
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                <FaTimes />
                                {t('cancel')}
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 gap-3 flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <FaSave className="text-lg" />
                                {loading
                                    ? t('saving')
                                    : isUpdate != 0
                                        ? t('updateDeliver')
                                        : t('createDeliver')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliverForm;
