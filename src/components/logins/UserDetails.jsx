import { useEffect, useState } from 'react';
import { FiEdit, FiCamera, FiCheck, FiX, FiUser, FiPhone, FiShield, FiClock, FiActivity, FiMail, FiCalendar, FiGlobe } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetAllUserQuery, useGetUserByIdQuery, useGetUserByProIdQuery, useGetUserLoginQuery } from '../../../app/Features/usersSlice';
import { useNavigate, useParams } from 'react-router';
import { useUpdateImageMutation, useUpdateNameMutation, useUpdateNumberPhoneMutation } from '../../../app/Features/userProfileSlice';
import { useOutletsContext } from '../../layouts/Management';
import { toast } from 'react-toastify';
import { Avatar, Badge, Card, Divider, Skeleton } from 'antd';
import { FaUserCircle } from 'react-icons/fa';
import { IoArrowBack, IoChevronForward } from 'react-icons/io5';
import api from '../../services/api';
import { FaCircleArrowLeft } from 'react-icons/fa6';

const UserProfilePage = () => {
    const { id } = useParams();
    const token = localStorage.getItem('token');
    const proId = localStorage.getItem('profileId');
    const uId = localStorage.getItem('userId');
    const navigator = useNavigate();
    const [image, setImage] = useState("");
    const [user, setUser] = useState(null);
    const [disabled, setDisabled] = useState(false);
    const { setLoading } = useOutletsContext();
    const { data, refetch, isLoading } = useGetUserByIdQuery({ id, token });
    const userLogin = useGetUserLoginQuery(token);
    const [updateImage] = useUpdateImageMutation();
    const [updateNumberPhone] = useUpdateNumberPhoneMutation();
    const [updateName] = useUpdateNameMutation();
    const { refetch: userRefetch } = useGetAllUserQuery(token);
    const { data: filteredUsers } = useGetUserByProIdQuery({ id: data?.data?.profile_id, token });

    const [editing, setEditing] = useState({
        username: false,
        phone_number: false,
        image: false
    });

    const [tempValues, setTempValues] = useState({
        username: '',
        phone_number: ''
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (data?.data) {
            setDisabled(data?.data?.status);
            setUser(data.data);
            setTempValues({
                username: data.data.username || '',
                phone_number: data.data.phone_number || ''
            });
        }
    }, [data]);

    const handleEdit = (field) => {
        setEditing({ ...editing, [field]: true });
    };

    const handleCancel = (field) => {
        setEditing({ ...editing, [field]: false });
        setTempValues(prev => ({
            ...prev,
            [field]: user?.[field] || ''
        }));
    };

    const handleSave = async (field) => {
        setIsSaving(true);
        try {
            let response;

            if (field === 'username') {
                response = await updateName({
                    id,
                    itemData: { user_name: tempValues.username },
                    path: "/user/name",
                    token
                });
            } else if (field === 'phone_number') {
                response = await updateNumberPhone({
                    id,
                    itemData: { phone_number: tempValues.phone_number },
                    path: "/user/number_phone",
                    token
                });
            }

            if (response?.data?.status === 200) {
                await refetch();
                await userRefetch();
                await userLogin.refetch();
                setEditing({ ...editing, [field]: false });
                toast.success(response.data.message || `${field.replace('_', ' ')} updated successfully`);
            }
        } catch (error) {
            toast.error(error.message || error || `An error occurred while updating the ${field}`);
        } finally {
            setIsSaving(false);
            setLoading(false);
        }
    };

    const handleChange = (e, field) => {
        setTempValues(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (3MB max)
        if (file.size > 3 * 1024 * 1024) {
            toast.error("Image size exceeds 3MB limit");
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error("Please upload a valid image (JPEG, PNG, GIF)");
            return;
        }

        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result);
            setEditing({ ...editing, image: true });
        };
        reader.readAsDataURL(file);
    };

    const saveImage = async () => {
        if (!image) {
            toast.error("Please select an image first");
            return;
        }

        setIsSaving(true);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const response = await updateImage({
                id,
                itemData: formData,
                path: "/user/image",
                token
            });

            if (response?.data?.status === 200) {
                await refetch();
                await userRefetch();
                await userLogin.refetch();
                setEditing({ ...editing, image: false });
                setSelectedImage(null);
                toast.success(response.data.message || 'Profile image updated successfully');
            }
        } catch (error) {
            toast.error(error.message || error || 'An error occurred while updating the profile image');
        } finally {
            setIsSaving(false);
            setLoading(false);
        }
    };

    const statusChange = async () => {
        try {
            setLoading(true);

            const isCompany = data?.data?.id === 1;
            const id = isCompany ? data?.data?.profile_id : data?.data?.id;

            const url = disabled
                ? (isCompany ? `disabled_company/${id}` : `disabled_user/${id}`)
                : (isCompany ? `enabled_company/${id}` : `enabled_user/${id}`);

            const response = await api.put(
                url,
                {}, // no body
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response?.data?.status === 200) {
                await refetch();
                await userRefetch();
                setDisabled(!disabled); // toggle AFTER success
                toast.success(response.data.message);
            }

        } catch (error) {
            toast.error(error?.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };



    // Loading skeleton
    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Sidebar Skeleton */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg">
                            <div className="flex flex-col items-center p-6">
                                <Skeleton.Avatar active size={160} />
                                <Skeleton.Input active className="mt-4 w-3/4" />
                                <Skeleton.Input active className="mt-2 w-1/2" />
                                <div className="w-full mt-6 space-y-3">
                                    <Skeleton.Button active block />
                                    <Skeleton.Button active block />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg">
                            <div className="space-y-6">
                                <Skeleton.Input active size="large" block />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <Skeleton.Input active size="small" />
                                            <Skeleton.Input active />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className='flex items-center justify-between'>
                    <div className="mb-8 flex items-center gap-5">
                        <FaCircleArrowLeft onClick={() => navigator(-1)} className='text-xl cursor-pointer text-gray-700' />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">User Profile</h1>
                            <p className="text-gray-600 mt-2">Manage user details and permissions</p>
                        </div>
                    </div>
                    {uId != id && <div className="flex items-center space-x-4 bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-sm font-medium text-gray-700">
                            {!disabled ? 'Disable' : 'Enable'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                onChange={statusChange}
                                checked={disabled}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card className="shadow-lg border-0 overflow-hidden mb-3">
                                {/* Profile Image Section */}
                                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                                    <div className="flex flex-col items-center">
                                        <div className="relative group">
                                            <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                                                {selectedImage || user?.image ? (
                                                    <img
                                                        src={selectedImage || user?.image}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-5xl text-blue-600 font-bold">
                                                            {user?.username?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Edit Image Button */}
                                            {!editing.image ? (
                                                <label
                                                    htmlFor="profile-image"
                                                    className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                                                >
                                                    <FiCamera className="h-5 w-5" />
                                                    <input
                                                        type="file"
                                                        id="profile-image"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                            ) : (
                                                <AnimatePresence>
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute bottom-0 right-0 flex gap-2"
                                                    >
                                                        <button
                                                            onClick={saveImage}
                                                            disabled={isSaving}
                                                            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                                        >
                                                            <FiCheck className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditing({ ...editing, image: false });
                                                                setSelectedImage(null);
                                                            }}
                                                            className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-colors"
                                                        >
                                                            <FiX className="h-5 w-5" />
                                                        </button>
                                                    </motion.div>
                                                </AnimatePresence>
                                            )}
                                        </div>

                                        <h2 className="text-xl font-bold text-gray-800 mt-4">
                                            {user?.username}
                                        </h2>
                                        <Badge
                                            count={user?.role?.toUpperCase()}
                                            className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-600"
                                            style={{
                                                backgroundColor: '#3b82f6',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Profile Stats */}
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Status</span>
                                            <Badge
                                                status={user?.status ? "success" : "error"}
                                                text={user?.status ? "Active" : "Inactive"}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Member Since</span>
                                            <span className="font-medium">
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Last Updated</span>
                                            <span className="font-medium">
                                                {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            {filteredUsers?.data?.length > 0 && <Card className="shadow-lg border-0 overflow-hidden">
                                {/* Profile Stats */}
                                <div className="px-6">
                                    {filteredUsers?.data?.map((employee, index) => employee?.id != id && (
                                        <div
                                            key={employee.id}
                                            className={`flex items-center p-4 transition-all duration-200 border-b border-gray-100 last:border-b-0 hover:bg-gray-50`}
                                        >
                                            {employee?.image ? (
                                                <img
                                                    src={employee.image}
                                                    alt=""
                                                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                                                    <FaUserCircle className="w-6 h-6 text-blue-600" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 ml-4">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                    {employee.username}
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate">{employee.role}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${employee.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        <Badge
                                                            status={user?.status ? "success" : "error"}
                                                            text={user?.status ? "Active" : "Inactive"}
                                                        />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>}
                        </motion.div>
                    </div>

                    {/* Right Column - User Details */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="shadow-lg border-0">
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">
                                        User Information
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Username Field */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="text-gray-400" />
                                                    <label className="text-sm font-medium text-gray-700">Username</label>
                                                </div>
                                                {!editing.username && (
                                                    <button
                                                        onClick={() => handleEdit('username')}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <FiEdit className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {editing.username ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={tempValues.username}
                                                            onChange={(e) => handleChange(e, 'username')}
                                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Enter username"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSave('username')}
                                                                disabled={isSaving}
                                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                <FiCheck className="h-4 w-4" />
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel('username')}
                                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                                            >
                                                                <FiX className="h-4 w-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-lg font-semibold text-gray-800"
                                                    >
                                                        {user?.username}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Phone Number Field */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <FiPhone className="text-gray-400" />
                                                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                                </div>
                                                {!editing.phone_number && (
                                                    <button
                                                        onClick={() => handleEdit('phone_number')}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                                                    >
                                                        <FiEdit className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {editing.phone_number ? (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <input
                                                            type="tel"
                                                            value={tempValues.phone_number}
                                                            onChange={(e) => handleChange(e, 'phone_number')}
                                                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Enter phone number"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSave('phone_number')}
                                                                disabled={isSaving}
                                                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                                            >
                                                                <FiCheck className="h-4 w-4" />
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel('phone_number')}
                                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                                            >
                                                                <FiX className="h-4 w-4" />
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="text-lg font-semibold text-gray-800"
                                                    >
                                                        {user?.phone_number || 'Not provided'}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Role and Status Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <FiShield className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Role</p>
                                                        <p className="text-lg font-bold text-gray-800 capitalize">{user?.role}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FiActivity className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Account Status</p>
                                                        <p className={`text-lg font-bold ${user?.status ? 'text-green-700' : 'text-red-700'}`}>
                                                            {user?.status ? 'Active' : 'Inactive'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timestamps */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FiCalendar className="text-gray-400" />
                                                    <label className="text-sm font-medium text-gray-700">Created At</label>
                                                </div>
                                                <p className="text-gray-800">
                                                    {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FiClock className="text-gray-400" />
                                                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                                                </div>
                                                <p className="text-gray-800">
                                                    {user?.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
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

export default UserProfilePage;