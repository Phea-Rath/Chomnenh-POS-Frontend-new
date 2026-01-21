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

const DeliverForm = () => {
    const token = localStorage.getItem("token");
    const { id } = useParams();
    const [viewImage, setViewImage] = useState();
    const isUpdate = id ?? 0;
    const initialData = JSON.parse(localStorage.getItem("deliverEdit")) || null;
    const [dataForm, setFormData] = useState({
        image: null,
        deliver_name: "",
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const { refetch } = useGetAllDeliverQuery(token);
    const { data, refetch: reShow } = useGetDeliverByIdQuery({ id, token });
    const [createDeliver] = useCreateDeliverMutation();
    const [updateDeliver] = useUpdateDeliverMutation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isUpdate == 1 && data?.data) {
            reShow();
            setViewImage(data?.data?.image);
            setFormData(data?.data);
        } else {
            setFormData({
                image: null,
                deliver_name: "",
            });
        }
    }, [isUpdate, data]);

    // Validation functions matching PHP validation rules
    const validateField = (name, value) => {
        const newFieldErrors = { ...fieldErrors };

        switch (name) {
            case 'deliver_name':
                if (!value || value.trim() === '') {
                    newFieldErrors.deliver_name = 'Deliver name is required';
                } else if (value.length > 255) {
                    newFieldErrors.deliver_name = 'Deliver name must not exceed 255 characters';
                } else {
                    delete newFieldErrors.deliver_name;
                }
                break;

            case 'image':
                // Image is optional according to PHP validation
                if (value) {
                    // Validate image type if provided
                    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    if (!validTypes.includes(value.type)) {
                        newFieldErrors.image = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
                    } else if (value.size > 2 * 1024 * 1024) {
                        newFieldErrors.image = 'Image size must be less than 2MB';
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

        // Required field validation matching PHP rules
        if (!dataForm.deliver_name || dataForm.deliver_name.trim() === '') {
            newErrors.deliver_name = "Deliver name is required.";
            newFieldErrors.deliver_name = 'Deliver name is required';
        } else if (dataForm.deliver_name.length > 255) {
            newErrors.deliver_name = "Deliver name must not exceed 255 characters.";
            newFieldErrors.deliver_name = 'Deliver name must not exceed 255 characters';
        }

        // Image validation (optional but must be valid if provided)
        if (dataForm.image) {
            // const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            // if (!validTypes.includes(dataForm.image.type)) {
            //     newErrors.image = "Please select a valid image file (JPEG, PNG, GIF, WebP).";
            //     newFieldErrors.image = 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
            // } else 
            if (dataForm.image.size > 2 * 1024 * 1024) {
                newErrors.image = "Image size must be less than 2MB.";
                newFieldErrors.image = 'Image size must be less than 2MB';
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
            toast.error("Please fix all validation errors before submitting.");
            const firstErrorField = Object.keys(fieldErrors)[0];
            if (firstErrorField) {
                const element = document.querySelector(`[name="${firstErrorField}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.focus();
                }
            }
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("deliver_name", dataForm.deliver_name.trim());
            if (dataForm.image) {
                formData.append("image", dataForm.image);
            }

            if (isUpdate) {
                await api.post(`/delivers/${id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success("Deliver updated successfully!");
            } else {
                await api.post("delivers", formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                toast.success("Deliver created successfully!");
            }

            refetch();
            setFormData({
                image: null,
                deliver_name: "",
            });
            localStorage.setItem("isUpdate", 0);
            navigate('/dashboard/delivers');
            localStorage.setItem("deliverEdit", null);
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
                setErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
                setFieldErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
                return;
            }

            if (fileUpload.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
                setFieldErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
                return;
            }

            setViewImage(URL.createObjectURL(fileUpload));
            setFormData((p) => {
                return { ...p, image: fileUpload };
            });
            setErrors(prev => ({ ...prev, image: '' }));
            setFieldErrors(prev => ({ ...prev, image: '' }));
        }
    };

    const removeImage = () => {
        setViewImage("");
        setFormData(p => ({ ...p, image: null }));
        setErrors(prev => ({ ...prev, image: '' }));
        setFieldErrors(prev => ({ ...prev, image: '' }));
    };

    // Helper function to get input classes with error styling
    const getInputClass = (fieldName) => {
        const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
        return fieldErrors[fieldName]
            ? `${baseClass} border-red-500 bg-red-50`
            : `${baseClass} border-gray-300 hover:border-gray-400`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
            <div className="mx-auto px-2">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                            <FaTruck className="text-white text-xl" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isUpdate ? "Edit Deliver" : "Create New Deliver"}
                        </h1>
                    </div>
                    <p className="text-gray-600">
                        {isUpdate
                            ? "Update deliver information"
                            : "Add a new deliver to your system"
                        }
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white shadow-xl rounded-2xl p-4"
                >
                    {/* Validation Summary */}
                    {(Object.keys(errors).length > 0 || Object.keys(fieldErrors).length > 0) && (
                        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex items-center mb-2">
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <h3 className="text-red-800 font-semibold text-lg">Please fix the following errors:</h3>
                            </div>
                            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
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
                            <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        Deliver Image
                                        <span className="text-gray-500 text-sm ml-2 font-normal">(Optional)</span>
                                    </h2>
                                    {viewImage && (
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                                        >
                                            <FaTimes className="text-xs" />
                                            Remove
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
                                            : 'border-gray-400 hover:border-blue-400 hover:bg-blue-25'
                                        }`}>
                                        {viewImage ? (
                                            <div className="text-center">
                                                <img
                                                    className="h-48 w-48 object-cover rounded-lg shadow-md mx-auto"
                                                    src={viewImage}
                                                    alt="Deliver preview"
                                                />
                                                <p className="text-sm text-gray-600 mt-3">Click to change image</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-700 mb-2">Upload deliver image</h3>
                                                <p className="text-sm text-gray-500 mb-4">Click to browse or drag and drop</p>
                                                <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                                    Browse files
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

                                <p className="text-xs text-gray-500 mt-3 text-center">
                                    Max size 2MB • JPEG, PNG, GIF, WebP • Optional
                                </p>
                            </div>


                        </div>

                        {/* Right Column - Form Fields */}
                        <div className="space-y-6">
                            {/* Deliver Information */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <FaTruck className="text-blue-500 text-xl" />
                                    <h2 className="text-lg font-semibold text-gray-800">Deliver Information</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Deliver Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="deliver_name"
                                            value={dataForm?.deliver_name}
                                            onChange={handleInputChange}
                                            className={getInputClass('deliver_name')}
                                            required
                                            maxLength={255}
                                            placeholder="Enter deliver name"
                                        />
                                        {fieldErrors.deliver_name && (
                                            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                {fieldErrors.deliver_name}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                            <span>Required field</span>
                                            <span>{dataForm?.deliver_name?.length}/255 characters</span>
                                        </div>
                                    </div>

                                    {/* Additional fields can be added here if needed in the future */}
                                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <div className="text-yellow-600 mt-0.5">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">Note</p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    This form only requires the deliver name. Additional fields can be added as per business requirements.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 mt-8 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Fields marked with <span className="text-red-500">*</span> are required</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.setItem("isUpdate", 0);
                                    navigate(-1);
                                }}
                                className="px-6 py-3 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium"
                            >
                                <FaTimes />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 gap-3 flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <FaSave className="text-lg" />
                                {loading
                                    ? "Saving..."
                                    : isUpdate
                                        ? "Update Deliver"
                                        : "Create Deliver"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeliverForm;