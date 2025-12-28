import React, { useEffect, useState } from 'react';
import { FiEdit2, FiSave, FiX, FiUser, FiPhone, FiCalendar, FiClock, FiKey, FiUpload } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useGetUserProfileQuery } from '../../../app/Features/usersSlice';
import { useParams } from 'react-router';
import { useUpdateImageMutation, useUpdateNameMutation, useUpdateNumberPhoneMutation } from '../../../app/Features/userProfileSlice';
import { useOutletsContext } from '../../layouts/Management';
import { toast } from 'react-toastify';
import { Card, Badge, Progress, Tooltip } from 'antd';

const UserProfile = () => {
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const { setLoading } = useOutletsContext();

    const [viewImage, setViewImage] = useState("");
    const [image, setImage] = useState("");
    const [profileName, setProfileName] = useState("");
    const [numberPhone, setNumberPhone] = useState("");

    const { data: profileData, refetch } = useGetUserProfileQuery({ id, token });
    const [updateImage] = useUpdateImageMutation();
    const [updateNumberPhone] = useUpdateNumberPhoneMutation();
    const [updateName] = useUpdateNameMutation();

    const [data, setData] = useState(null);
    const [editing, setEditing] = useState({
        profile_name: false,
        telephone: false,
        image: false
    });

    const [tempData, setTempData] = useState({
        profile_name: '',
        telephone: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profileData?.data) {
            setData(profileData.data);
            setViewImage(profileData.data.image);
            setTempData({
                profile_name: profileData.data.profile_name || '',
                telephone: profileData.data.telephone || ''
            });
        }
    }, [profileData]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const calculateSubscriptionProgress = () => {
        if (!data?.start_date || !data?.end_date) return 0;
        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        const today = new Date();
        const totalDuration = end - start;
        const elapsed = today - start;
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    };

    const handleEdit = (field) => {
        setEditing({ ...editing, [field]: true });
    };

    const handleCancel = (field) => {
        setEditing({ ...editing, [field]: false });
        setTempData({
            ...tempData,
            [field]: data?.[field] || ''
        });
        if (field === 'image') {
            setViewImage(data?.image || '');
        }
    };

    const handleSave = async (field) => {
        setIsSaving(true);
        setLoading(true);

        try {
            let response;

            if (field === 'image') {
                const formData = new FormData();
                formData.append('image', image);
                response = await updateImage({ id, itemData: formData, path: "/profile/image", token });
            } else if (field === 'profile_name') {
                response = await updateName({
                    id,
                    itemData: { profile_name: tempData.profile_name },
                    path: "/profile/name",
                    token
                });
            } else if (field === 'telephone') {
                response = await updateNumberPhone({
                    id,
                    itemData: { number_phone: tempData.telephone },
                    path: "/profile/number_phone",
                    token
                });
            }

            if (response?.data?.status === 200) {
                await refetch();
                setEditing({ ...editing, [field]: false });
                toast.success(response.data.message || `${field.replace('_', ' ')} updated successfully`);
                if (field === 'image') {
                    setImage('');
                }
            }
        } catch (error) {
            toast.error(error.message || error || `An error occurred while updating ${field}`);
        } finally {
            setIsSaving(false);
            setLoading(false);
        }
    };

    const handleChange = (e, field) => {
        const value = e.target.value;
        setTempData(prev => ({ ...prev, [field]: value }));
        if (field === 'profile_name') setProfileName(value);
        if (field === 'telephone') setNumberPhone(value);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (file.size > 3 * 1024 * 1024) {
            toast.error("Image size exceeds 3MB limit");
            return;
        }

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error("Please upload a valid image (JPEG, PNG, GIF)");
            return;
        }

        setImage(file);
        const urlImage = URL.createObjectURL(file);
        setViewImage(urlImage);
        setEditing(prev => ({ ...prev, image: true }));
    };

    const getSubscriptionStatus = () => {
        const daysRemaining = calculateDaysRemaining(data?.end_date);
        if (daysRemaining <= 0) {
            return { text: 'Expired', color: 'bg-red-100 text-red-800' };
        } else if (daysRemaining <= 7) {
            return { text: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
        } else {
            return { text: 'Active', color: 'bg-green-100 text-green-800' };
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
                    <p className="text-gray-600 mt-2">Manage your personal information and account details</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="h-full"
                        >
                            <Card className="shadow-xl border-0 h-full">
                                <div className="flex flex-col items-center p-6">
                                    {/* Profile Image */}
                                    <div className="relative group mb-6">
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                                            {viewImage ? (
                                                <img
                                                    src={viewImage}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-4xl font-bold text-blue-600">
                                                        {data?.profile_name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Image Button */}
                                        <Tooltip title="Change profile picture">
                                            <label
                                                htmlFor="profile-image-upload"
                                                className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors border border-blue-200"
                                            >
                                                <FiEdit2 size={18} />
                                            </label>
                                        </Tooltip>

                                        <input
                                            type="file"
                                            id="profile-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>

                                    {/* Save/Cancel buttons for image */}
                                    {editing.image && (
                                        <div className="flex gap-2 mb-6">
                                            <button
                                                onClick={() => handleSave('image')}
                                                disabled={isSaving}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <FiSave size={16} />
                                                Save Image
                                            </button>
                                            <button
                                                onClick={() => handleCancel('image')}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                            >
                                                <FiX size={16} />
                                                Cancel
                                            </button>
                                        </div>
                                    )}

                                    {/* Profile Name */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                                            {data?.profile_name}
                                        </h2>
                                        <div className="flex items-center justify-center gap-2">
                                            <FiUser className="text-gray-400" />
                                            <span className="text-sm text-gray-600">Profile ID: {data?.id}</span>
                                        </div>
                                    </div>

                                    {/* Member Since */}
                                    <div className="w-full bg-blue-50 rounded-lg p-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <FiCalendar className="text-blue-500" />
                                            <div>
                                                <p className="text-sm text-gray-600">Member Since</p>
                                                <p className="font-medium text-gray-800">{formatDate(data?.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subscription Status */}
                                    <div className="w-full">
                                        <Badge
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getSubscriptionStatus().color}`}
                                            count={getSubscriptionStatus().text}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Information Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <Card className="shadow-xl border-0">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                                        <FiUser className="text-blue-500" />
                                        Personal Information
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Profile Name Field */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-gray-700">
                                                    Full Name
                                                </label>
                                                {!editing.profile_name && (
                                                    <button
                                                        onClick={() => handleEdit('profile_name')}
                                                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {editing.profile_name ? (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        value={tempData.profile_name}
                                                        onChange={(e) => handleChange(e, 'profile_name')}
                                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Enter your full name"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSave('profile_name')}
                                                            disabled={isSaving}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            <FiSave size={16} />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel('profile_name')}
                                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                                        >
                                                            <FiX size={16} />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold text-gray-800 px-1 py-2">
                                                    {data?.profile_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone Number Field */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <FiPhone className="text-gray-400" />
                                                    Phone Number
                                                </label>
                                                {!editing.telephone && (
                                                    <button
                                                        onClick={() => handleEdit('telephone')}
                                                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            {editing.telephone ? (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="tel"
                                                        value={tempData.telephone}
                                                        onChange={(e) => handleChange(e, 'telephone')}
                                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="Enter phone number"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSave('telephone')}
                                                            disabled={isSaving}
                                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            <FiSave size={16} />
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel('telephone')}
                                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                                        >
                                                            <FiX size={16} />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-lg font-semibold text-gray-800 px-1 py-2">
                                                    {data?.telephone || 'Not provided'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Subscription Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="shadow-xl border-0">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                                        <FiCalendar className="text-blue-500" />
                                        Subscription Details
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Subscription Progress */}
                                        <div>
                                            <div className="flex justify-between text-sm text-gray-600 mb-3">
                                                <span>Subscription Timeline</span>
                                                <span>{calculateSubscriptionProgress().toFixed(1)}% complete</span>
                                            </div>
                                            <Progress
                                                percent={calculateSubscriptionProgress()}
                                                strokeColor={{
                                                    '0%': '#3b82f6',
                                                    '100%': '#8b5cf6',
                                                }}
                                                strokeWidth={6}
                                                showInfo={false}
                                            />
                                        </div>

                                        {/* Subscription Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                                                <p className="text-sm text-gray-600 mb-1">Start Date</p>
                                                <p className="text-lg font-bold text-gray-800">{formatDate(data?.start_date)}</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                                                <p className="text-sm text-gray-600 mb-1">End Date</p>
                                                <p className="text-lg font-bold text-gray-800">{formatDate(data?.end_date)}</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4">
                                                <p className="text-sm text-gray-600 mb-1">Term Duration</p>
                                                <p className="text-lg font-bold text-gray-800">{data?.term || 0} months</p>
                                            </div>

                                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                                                <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
                                                <p className="text-lg font-bold text-gray-800">{calculateDaysRemaining(data?.end_date)} days</p>
                                            </div>
                                        </div>

                                        {/* Subscription Warning */}
                                        {calculateDaysRemaining(data?.end_date) <= 30 && calculateDaysRemaining(data?.end_date) > 0 && (
                                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <FiCalendar className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-orange-800">Subscription Expiring Soon</p>
                                                        <p className="text-sm text-orange-700">
                                                            Renew your subscription within {calculateDaysRemaining(data?.end_date)} days to continue service.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Account Information Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="shadow-xl border-0">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                                        <FiKey className="text-blue-500" />
                                        Account Information
                                    </h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <FiKey className="text-gray-400" />
                                                <span className="text-gray-600">Profile ID</span>
                                            </div>
                                            <span className="font-mono text-gray-800">{data?.id}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="text-gray-400" />
                                                <span className="text-gray-600">Created At</span>
                                            </div>
                                            <span className="text-gray-800">{formatDate(data?.created_at)}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-3">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-gray-400" />
                                                <span className="text-gray-600">Last Updated</span>
                                            </div>
                                            <span className="text-gray-800">{formatDate(data?.updated_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;