import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FaSave, FaTimes, FaTruck, FaEdit } from "react-icons/fa";
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
import { motion } from "framer-motion";
import { useNotify } from "../../utils/NotificationProvider";
import AlertBox from "../../services/AlertBox";
import Button from "../../utils/Button";

const DeliverForm = () => {
    const { t } = useTranslation();
    const notify = useNotify();
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

    const [alertBox, setAlertBox] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            notify.error(t('error'), t('pleaseFixErrors'));
            return;
        }
        setAlertBox(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        setAlertBox(false);

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
                notify.success(t('success'), t('deliverUpdatedSuccess'));
            } else {
                await api.post("delivers", formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                notify.success(t('success'), t('deliverCreatedSuccess'));
            }

            refetch();
            navigate('/home/delivers');
        } catch (err) {
            const errorMessage = err?.data?.message || err?.message || t('operationFailed');
            setErrors({ general: errorMessage });
            notify.error(t('error'), errorMessage);
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
        const baseClass = "w-full px-4 py-3 border rounded-sm outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500";
        const darkClass = darkMode 
            ? "bg-transparent border-gray-400 text-white placeholder-gray-400" 
            : "bg-transparent border-gray-200 text-gray-900";
        
        if (fieldErrors[fieldName]) {
            return `${baseClass} ${darkMode ? "border-red-500 bg-red-900/10" : "border-red-500 bg-red-50"} ${darkClass}`;
        }
        return `${baseClass} ${darkClass}`;
    };

    return (
        <div className="view-page bg-transparent transition-colors">
            <AlertBox
                isOpen={alertBox}
                title={t('confirm', "Confirmation")}
                message={isUpdate != 0 ? t('confirmUpdateDeliver', 'Update this deliver?') : t('confirmCreateDeliver', 'Create this deliver?')}
                onConfirm={handleConfirm}
                onCancel={() => setAlertBox(false)}
                confirmText={isUpdate != 0 ? t('update') : t('create')}
                cancelText={t('cancel')}
            />
            
            <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
                            {isUpdate != 0 ? t('editDeliver') : t('createNewDeliver')}
                        </h1>
                        <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
                            {isUpdate != 0 ? t('updateDeliverInfo') : t('addNewDeliverSystem')}
                        </p>
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            variant='primary'
                        >
                            {isUpdate != 0 ? <FaEdit /> : <FaSave />}
                            {loading ? t('saving') : isUpdate != 0 ? t('update') : t('create')}
                        </Button>
                        <Button
                            variant='cancel'
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            <FaTimes />{t('back')}
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                                    <FaTruck className="text-blue-500" />
                                    {t('basicInformation')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Image Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                                {t('deliverImage')} <span className="text-xs font-normal opacity-60">({t('optional')})</span>
                                            </label>
                                            {viewImage && (
                                                <button type="button" onClick={removeImage} className="text-red-500 hover:text-red-600 transition-colors text-sm flex items-center gap-1">
                                                    <FaTimes className="text-xs" /> {t('remove')}
                                                </button>
                                            )}
                                        </div>
                                        
                                        <label htmlFor="image-upload" className="block cursor-pointer">
                                            <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-sm transition-all duration-200 ${
                                                viewImage ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50/30' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                            }`}>
                                                {viewImage ? (
                                                    <img src={viewImage} alt="Preview" className="max-h-48 rounded-sm object-contain mx-auto" />
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <IoMdCloudUpload className="text-4xl text-blue-400 mx-auto mb-2" />
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('clickToUpload')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                        <input type="file" id="image-upload" hidden accept="image/*" onChange={changeUpload} />
                                        {fieldErrors.image && <p className="text-red-500 text-xs mt-1">{fieldErrors.image}</p>}
                                    </div>

                                    {/* Name Section */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                                <div className="text-red-500 text-xs mt-2">{fieldErrors.deliver_name}</div>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-sm border ${darkMode ? "bg-yellow-900/10 border-yellow-800" : "bg-yellow-50 border-yellow-200"}`}>
                                            <p className={`text-xs ${darkMode ? "text-yellow-300/80" : "text-gray-600"}`}>
                                                {t('uniqueBrandWarning')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliverForm;
