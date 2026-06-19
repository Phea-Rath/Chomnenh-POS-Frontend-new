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
import Button from "../../utils/Button";
import RefreshButton from "../../utils/RefreshButton";
import { motion } from "framer-motion";

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
        <div className="view-page bg-transparent transition-colors">
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

            <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100 flex items-center gap-3">
                            {t('deliversManagement')}
                        </h1>
                        <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
                            {t('manageDeliveryServices')}
                        </p>
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <Button onClick={handleCreate} variant='primary'>
                            <FaPlus /> {t('addNewDeliver')}
                        </Button>
                        <RefreshButton onRefresh={refetch} />
                    </div>
                </div>

                {/* Search and Controls */}
                <div className="bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
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
                                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-400 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm dark:text-gray-100 bg-transparent"
                            />
                        </div>

                        {/* Stats and View Toggle */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-sm p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-500">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-sm transition-colors ${viewMode === "grid"
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <FaThLarge className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-sm transition-colors ${viewMode === "list"
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <FaList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Container */}
                <div className="border-t-0 px-4 py-6 border-x bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-transparent dark:from-transparent dark:to-transparent border-gray-200 dark:border-gray-500 min-h-[400px]">
                    {isFetching ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <div className={`w-12 h-12 border-4 rounded-full animate-spin ${darkMode ? "border-blue-900 border-t-blue-500" : "border-blue-200 border-t-blue-600"}`}></div>
                            </div>
                            <p className="mt-4 font-medium dark:text-gray-400">{t('loadingDelivers')}</p>
                        </div>
                    ) : filteredDelivers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <FaTruck className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium mb-2 dark:text-gray-200">
                                {searchTerm ? t('noDeliversMatchSearch') : t('noDeliversFound')}
                            </h3>
                            <p className="max-w-md text-center dark:text-gray-400 text-sm">
                                {searchTerm ? t('tryAdjustingSearchDelivers') : t('getStartedDelivers')}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                        >
                            {filteredDelivers.map((deliver) => (
                                <motion.div
                                    key={deliver.deliver_id}
                                    whileHover={{ y: -5 }}
                                    className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="h-40 relative bg-gray-50 dark:bg-gray-900">
                                        {deliver.image ? (
                                            <img src={deliver.image} alt={deliver.deliver_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                                    {getInitials(deliver.deliver_name)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate mb-1">{deliver.deliver_name}</h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('createdDate')}: {formatDate(deliver.created_at)}</p>
                                        
                                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button onClick={() => handleEdit(deliver.deliver_id)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-sm transition-colors"><FaEdit /></button>
                                            <button onClick={() => handleDelete(deliver.deliver_id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"><FaTrash /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden"
                        >
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">{t('deliverName')}</th>
                                        <th className="px-6 py-3">{t('createdDate')}</th>
                                        <th className="px-6 py-3 text-center">{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                    {filteredDelivers.map((deliver) => (
                                        <tr key={deliver.deliver_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-sm overflow-hidden border border-gray-100 dark:border-gray-600 bg-gray-50">
                                                        {deliver.image ? (
                                                            <img src={deliver.image} alt={deliver.deliver_name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white font-bold text-xs">{getInitials(deliver.deliver_name)}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-100">{deliver.deliver_name}</p>
                                                        <p className="text-[10px] text-gray-500">ID: {deliver.deliver_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(deliver.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(deliver.deliver_id)} className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-sm transition-colors"><FaEdit /></button>
                                                    <button onClick={() => handleDelete(deliver.deliver_id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"><FaTrash /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliverList;
