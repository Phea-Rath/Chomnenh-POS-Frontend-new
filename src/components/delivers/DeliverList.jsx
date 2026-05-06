import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    FaPlus,
    FaSearch,
    FaThLarge,
    FaList,
    FaEdit,
    FaTrash,
    FaTruck
} from "react-icons/fa";
import { toast } from "react-toastify";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import {
    useGetAllDeliverQuery,
    useDeleteDeliverMutation
} from "../../../app/Features/deliversSlice";
import { useTranslation } from "react-i18next";

const DeliverList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [searchTerm, setSearchTerm] = useState("");
    const [delivers, setDelivers] = useState([]);
    const [filteredDelivers, setFilteredDelivers] = useState([]);
    const [alertBox, setAlertBox] = useState(false);
    const [selectedDeliverId, setSelectedDeliverId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { setLoading, darkMode } = useOutletsContext();
    const { data: response, refetch, isLoading: isFetching } = useGetAllDeliverQuery(token);
    const [deleteDeliver] = useDeleteDeliverMutation();

    // Load delivers data
    useEffect(() => {
        if (response?.data) {
            setDelivers(response.data);
            setFilteredDelivers(response.data);
        }
    }, [response]);

    // Filter delivers based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredDelivers(delivers);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = delivers.filter(deliver =>
            deliver.deliver_name.toLowerCase().includes(searchLower)
        );
        setFilteredDelivers(filtered);
    }, [searchTerm, delivers]);

    // Handle delete confirmation
    const handleDelete = (deliverId) => {
        setSelectedDeliverId(deliverId);
        setAlertBox(true);
    };

    // Cancel delete
    const handleCancel = () => {
        setAlertBox(false);
        setSelectedDeliverId(null);
    };

    // Confirm delete
    const handleConfirm = async () => {
        if (!selectedDeliverId) return;

        try {
            setLoading(true);
            setIsLoading(true);

            const response = await deleteDeliver({
                id: selectedDeliverId,
                token
            }).unwrap();

            if (response.status === 200) {
                toast.success(t('deliverDeletedSuccess'));
                refetch();
            }
        } catch (error) {
            toast.error(
                error?.data?.message ||
                error?.message ||
                "Failed to delete deliver"
            );
        } finally {
            setLoading(false);
            setIsLoading(false);
            setAlertBox(false);
            setSelectedDeliverId(null);
        }
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handle edit
    const handleEdit = (deliverId) => {
        navigate(`edit/${deliverId}`);
    };

    // Handle create new deliver
    const handleCreate = () => {
        navigate("create");
    };

    // Get initials for avatar
    const getInitials = (name) => {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    // Format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className={`min-h-screen bg-transparent p-4 md:p-6 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
            <AlertBox
                isOpen={alertBox}
                title={t('deleteDeliverTitle')}
                message={t('deleteDeliverMessage')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                confirmColor="error"
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                                <FaTruck className="text-white text-lg" />
                            </div>
                            {t('deliversManagement')}
                        </h1>
                        <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mt-2`}>
                            {t('manageDeliveryServices')}
                        </p>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                    >
                        <FaPlus className="w-5 h-5" />
                        {t('addNewDeliver')}
                    </button>
                </div>

                {/* Search and Controls */}
                <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-4`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <FaSearch className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearch}
                                placeholder={t('searchDeliversPlaceholder')}
                                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${darkMode
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        : "bg-gray-50 border-gray-300 text-gray-900"
                                    }`}
                            />
                        </div>

                        {/* Stats and View Toggle */}
                        <div className="flex items-center gap-4">
                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-4">
                                <div className={`px-4 py-2 rounded-lg border ${darkMode ? "bg-blue-900/30 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
                                    <div className="flex items-center gap-2">
                                        <FaTruck className={`w-4 h-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                                        <span className={`text-sm font-medium ${darkMode ? "text-blue-100" : "text-gray-700"}`}>
                                            {filteredDelivers.length} {t('records')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className={`flex items-center rounded-lg p-1 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === "grid"
                                        ? (darkMode ? "bg-gray-600 text-blue-400 shadow-sm" : "bg-white shadow-sm text-blue-600")
                                        : (darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900")
                                        }`}
                                >
                                    <FaThLarge className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === "list"
                                        ? (darkMode ? "bg-gray-600 text-blue-400 shadow-sm" : "bg-white shadow-sm text-blue-600")
                                        : (darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900")
                                        }`}
                                >
                                    <FaList className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isFetching ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${darkMode ? "border-blue-900 border-t-blue-500" : "border-blue-200 border-t-blue-600"}`}></div>
                    </div>
                    <p className={`mt-4 font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('loadingDelivers')}</p>
                </div>
            ) : filteredDelivers.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-16 rounded-xl shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <FaTruck className={`w-10 h-10 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {searchTerm ? t('noDeliversMatchSearch') : t('noDeliversFound')}
                    </h3>
                    <p className={`max-w-md text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {searchTerm
                            ? t('tryAdjustingSearchDelivers')
                            : t('getStartedDelivers')
                        }
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <FaPlus className="w-5 h-5" />
                            {t('addYourFirstDeliver')}
                        </button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {filteredDelivers.map((deliver) => (
                        <div
                            key={deliver.deliver_id}
                            className={`rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                                }`}
                        >
                            {/* Image Section */}
                            <div className={`h-48 relative overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-50 to-indigo-50"}`}>
                                {deliver.image ? (
                                    <img
                                        src={deliver.image}
                                        alt={deliver.deliver_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-2xl font-bold">
                                                {getInitials(deliver.deliver_name)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                                        {t('activeStatus')}
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className={`text-lg font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>
                                        {deliver.deliver_name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {t('createdDate')} {formatDate(deliver.created_at)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className={`flex items-center justify-between pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                                    <div className="flex gap-2 w-full justify-end">
                                        <button
                                            onClick={() => handleEdit(deliver.deliver_id)}
                                            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${darkMode
                                                    ? "text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                                    : "text-green-600 hover:text-green-800 hover:bg-green-50"
                                                }`}
                                        >
                                            <FaEdit className="w-4 h-4" />
                                            {t('edit')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deliver.deliver_id)}
                                            disabled={isLoading}
                                            className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${darkMode
                                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                    : "text-red-600 hover:text-red-800 hover:bg-red-50"
                                                }`}
                                        >
                                            <FaTrash className="w-4 h-4" />
                                            {t('delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // List View
                <div className={`rounded-xl shadow-sm border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                                <tr>
                                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        {t('deliverName')}
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        {t('createdDate')}
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        {t('status')}
                                    </th>
                                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        {t('actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                                {filteredDelivers.map((deliver) => (
                                    <tr key={deliver.deliver_id} className={`transition-colors ${darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {deliver.image ? (
                                                        <img
                                                            className={`h-12 w-12 rounded-lg object-cover border ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                                                            src={deliver.image}
                                                            alt={deliver.deliver_name}
                                                        />
                                                    ) : (
                                                        <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                            <span className="text-white font-bold">
                                                                {getInitials(deliver.deliver_name)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                                                        {deliver.deliver_name}
                                                    </div>
                                                    <div className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                                        ID: {deliver.deliver_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                            {formatDate(deliver.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                                                }`}>
                                                {t('activeStatus')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(deliver.deliver_id)}
                                                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${darkMode
                                                            ? "text-green-400 hover:text-green-300 hover:bg-green-900/30"
                                                            : "text-green-600 hover:text-green-800 hover:bg-green-50"
                                                        }`}
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                    {t('edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(deliver.deliver_id)}
                                                    disabled={isLoading}
                                                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${darkMode
                                                            ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                                            : "text-red-600 hover:text-red-800 hover:bg-red-50"
                                                        }`}
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                    {t('delete')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            {filteredDelivers.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {t('showing')} <span className="font-medium">1</span> {t('to')}{" "}
                        <span className="font-medium">{filteredDelivers.length}</span> {t('of')}{" "}
                        <span className="font-medium">{delivers.length}</span> {t('records')}
                        {searchTerm && (
                            <span className="ml-2 text-blue-500">
                                ({t('filtered')})
                            </span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${darkMode
                                    ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {t('refresh')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliverList;
