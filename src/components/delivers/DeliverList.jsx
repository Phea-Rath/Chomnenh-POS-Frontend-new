import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    FaPlus,
    FaSearch,
    FaThLarge,
    FaList,
    FaEdit,
    FaTrash,
    FaEye,
    FaTruck
} from "react-icons/fa";
import { toast } from "react-toastify";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import {
    useGetAllDeliverQuery,
    useDeleteDeliverMutation
} from "../../../app/Features/deliversSlice";
import api from "../../services/api";

const DeliverList = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [searchTerm, setSearchTerm] = useState("");
    const [delivers, setDelivers] = useState([]);
    const [filteredDelivers, setFilteredDelivers] = useState([]);
    const [alertBox, setAlertBox] = useState(false);
    const [selectedDeliverId, setSelectedDeliverId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { setLoading } = useOutletsContext();
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
                toast.success(response.message || "Deliver deleted successfully");
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
        navigate(`/dashboard/deliver/edit/${deliverId}`);
    };

    // Handle view details
    const handleViewDetails = (deliverId) => {
        navigate(`/dashboard/deliver/${deliverId}`);
    };

    // Handle create new deliver
    const handleCreate = () => {
        navigate("/dashboard/deliver/create");
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
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <AlertBox
                isOpen={alertBox}
                title="Delete Deliver"
                message="Are you sure you want to delete this deliver? This action cannot be undone."
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText="Delete"
                cancelText="Cancel"
                confirmColor="error"
            />

            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                                <FaTruck className="text-white text-lg" />
                            </div>
                            Delivers Management
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Manage all your delivery services in one place
                        </p>
                    </div>

                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 font-medium"
                    >
                        <FaPlus className="w-5 h-5" />
                        Add New Deliver
                    </button>
                </div>

                {/* Search and Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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
                                placeholder="Search delivers by name..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Stats and View Toggle */}
                        <div className="flex items-center gap-4">
                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-4">
                                <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2">
                                        <FaTruck className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {filteredDelivers.length} deliver{filteredDelivers.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === "grid"
                                        ? "bg-white shadow-sm text-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <FaThLarge className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-lg transition-colors ${viewMode === "list"
                                        ? "bg-white shadow-sm text-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
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
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading delivers...</p>
                </div>
            ) : filteredDelivers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaTruck className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {searchTerm ? "No matching delivers found" : "No delivers yet"}
                    </h3>
                    <p className="text-gray-500 max-w-md text-center mb-6">
                        {searchTerm
                            ? "Try adjusting your search terms to find what you're looking for."
                            : "Get started by adding your first delivery service."
                        }
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                        >
                            <FaPlus className="w-5 h-5" />
                            Add Your First Deliver
                        </button>
                    )}
                </div>
            ) : viewMode === "grid" ? (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDelivers.map((deliver) => (
                        <div
                            key={deliver.deliver_id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                        >
                            {/* Image Section */}
                            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 relative overflow-hidden">
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
                                        Active
                                    </span>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                        {deliver.deliver_name}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Created {formatDate(deliver.created_at)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(deliver.deliver_id)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deliver.deliver_id)}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // List View
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Deliver
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th className="px6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDelivers.map((deliver) => (
                                    <tr key={deliver.deliver_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {deliver.image ? (
                                                        <img
                                                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
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
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {deliver.deliver_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {deliver.deliver_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatDate(deliver.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">

                                                <button
                                                    onClick={() => handleEdit(deliver.deliver_id)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                                >
                                                    <FaEdit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(deliver.deliver_id)}
                                                    disabled={isLoading}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                    Delete
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
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-medium">1</span> to{" "}
                        <span className="font-medium">{filteredDelivers.length}</span> of{" "}
                        <span className="font-medium">{delivers.length}</span> delivers
                        {searchTerm && (
                            <span className="ml-2 text-blue-600">
                                (filtered from {delivers.length} total)
                            </span>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Refresh List
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliverList;