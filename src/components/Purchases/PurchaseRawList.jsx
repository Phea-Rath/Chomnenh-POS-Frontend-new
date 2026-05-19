import React, { useEffect, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { IoIosSearch, IoIosList, IoIosGrid } from "react-icons/io";
import { Link } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { motion } from "framer-motion";
import {
    useCancelPurchaseMutation,
    useConfirmPurchaseMutation,
    useConfirmPurchaseRawMutation,
    useDeletePurchaseMutation,
    useDeletePurchaseRawMutation,
    useGetAllPurchaseQuery,
    useGetAllPurchaseRawQuery,
    useUncancelPurchaseMutation,
} from "../../../app/Features/purchasesSlice";
import { Atom } from "react-loading-indicators";
import { toast } from "react-toastify";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllStockQuery } from "../../../app/Features/stocksSlice";
import {
    FaCalendarAlt,
    FaDollarSign,
    FaBox,
    FaUser,
    FaReceipt,
    FaPlus,
    FaDownload,
    FaFilter,
    FaShoppingCart,
    FaMoneyBillWave,
    FaBalanceScale,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCheck,
} from "react-icons/fa";
import { LuRefreshCw } from "react-icons/lu";
import { FaXmark } from "react-icons/fa6";
import dayjs from "dayjs";
import api from "../../services/api";
import ExportExcel from "../../services/ExportExcel";
import { useGetAllRawMaterialQuery } from "../../../app/Features/RawMaterialSlice";
import { BiEdit, BiTrash } from "react-icons/bi";
import { useTranslation } from "react-i18next";
import { MdPayment } from "react-icons/md";

const PurchaseRawList = () => {
    const { t } = useTranslation();
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [paymentDate, setPaymentDate] = useState("");
    const token = localStorage.getItem("token");
    const [id, setId] = useState(0);
    const [alertBox, setAlertBox] = useState(false);
    const [alertBoxCancel, setAlertBoxCancel] = useState(false);
    const [alertBoxUncancel, setAlertBoxUncancel] = useState(false);
    const [alertBoxConfirm, setAlertBoxConfirm] = useState(false);
    const [viewMode, setViewMode] = useState("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { refetch: salesRefetch } = useGetAllSaleQuery(token);
    const { refetch: stockRefetch } = useGetAllStockQuery(token);
    const { setLoading, loading } = useOutletsContext();
    const queryParams = useMemo(() => ({
        token,
        limit: itemsPerPage,
        page: currentPage,
        search: debouncedSearch,
    }), [token, itemsPerPage, currentPage, debouncedSearch]);

    const { refetch: refetchRawMaterials } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: "", token });
    const { data, isLoading, refetch } = useGetAllPurchaseRawQuery(queryParams);
    const [deletePurchaseRaw] = useDeletePurchaseRawMutation();
    const [cancelPurchase] = useCancelPurchaseMutation();
    const [uncancelPurchase] = useUncancelPurchaseMutation();
    const [confirmPurchase] = useConfirmPurchaseRawMutation();

    useEffect(() => {
        const items = data?.data || [];
        setPurchases(items);
        setFilteredPurchases(items);
    }, [data?.data]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        applyFilters();
    }, [purchases, statusFilter, dateRange]);

    const applyFilters = () => {
        let result = [...purchases];

        if (statusFilter !== "all") {
            result = result.filter((purchase) => purchase.status.toString() === statusFilter);
        }

        if (dateRange.start && dateRange.end) {
            const start = dayjs(dateRange.start);
            const end = dayjs(dateRange.end);
            result = result.filter((purchase) => {
                const purchaseDate = dayjs(purchase.purchase_date);
                return purchaseDate.isAfter(start) && purchaseDate.isBefore(end.add(1, 'day'));
            });
        }

        setFilteredPurchases(result);
    };

    const calculateStats = () => {
        const totalPurchases = filteredPurchases.length;
        const totalAmount = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
        const totalPaid = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_paid) || 0), 0);
        const totalBalance = filteredPurchases.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);
        const pendingPurchases = filteredPurchases.filter((item) => item.status === 0).length;
        const completedPurchases = filteredPurchases.filter((item) => item.status === 1).length;

        return {
            totalPurchases,
            totalAmount,
            totalPaid,
            totalBalance,
            pendingPurchases,
            completedPurchases,
        };
    };
    const stats = calculateStats();

    const totalPages = data?.pagination?.last_page || 1;
    const totalItems = data?.pagination?.total || 0;
    const perPage = data?.pagination?.per_page || itemsPerPage;
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endIndex = Math.min(currentPage * perPage, totalItems);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    function handlePurchase(purchase_id, btn) {
        switch (btn) {
            case "delete":
                setAlertBox(true);
                break;
            case "cancel":
                setAlertBoxCancel(true);
                break;
            case "uncancel":
                setAlertBoxUncancel(true);
                break;
            case "confirm":
                setAlertBoxConfirm(true);
                break;
            default:
                break;
        }
        setId(purchase_id);
    }

    function handleCancel() {
        setAlertBox(false);
        setAlertBoxConfirm(false);
        setAlertBoxCancel(false);
        setAlertBoxUncancel(false);
    }

    async function handleConfirm() {
        try {
            setAlertBox(false);
            setLoading(true);
            const res = await deletePurchaseRaw({ id, token });
            if (res.data.status === 200) {
                refetch();
                toast.success(t('orderDeletedSuccessfully'));
            }
        } catch (error) {
            toast.error(error.message || t('orderDeleteFailed'));
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchaseCancel() {
        try {
            setAlertBoxCancel(false);
            setLoading(true);
            const res = await cancelPurchase({ id, token });
            if (res.data.status === 200) {
                refetch();
                toast.success(t('orderCanceledSuccessfully'));
            }
        } catch (error) {
            toast.error(error.message || t('orderCancelFailed'));
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchaseUncancel() {
        try {
            setAlertBoxUncancel(false);
            setLoading(true);
            const res = await uncancelPurchase({ id, token });
            if (res.data.status === 200) {
                refetch();
                toast.success(t('orderUncanceledSuccessfully'));
            }
        } catch (error) {
            toast.error(error.message || t('orderUncancelFailed'));
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchaseConfirm() {
        try {
            setAlertBoxConfirm(false);
            setLoading(true);
            const res = await api.put(`/purchase_confirm_raw/${id}`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                refetchRawMaterials();
                stockRefetch();
                refetch();
                toast.success(t('confirmPurchaseSuccess', 'Confirmed purchase successfully!'));
            }
        } catch (error) {
            toast.error(error.message || t('confirmPurchaseFailed', 'Failed to confirm purchase!'));
        } finally {
            setLoading(false);
        }
    }

    const addPayment = async () => {
        try {
            setLoading(true);
            const res = await api.put(
                `purchase_payment/${id}`,
                {
                    amount: paymentAmount,
                    paid_at: paymentDate,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.data.status === 200) {
                refetch();
                toast.success(t('paymentAddedSuccess', 'Payment added successfully!'));
                setShowPaymentModal(false);
                setPaymentAmount(0);
                setPaymentDate("");
            }
        } catch (error) {
            toast.error(error.message || t('paymentAddedFailed', 'Failed to add payment!'));
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US").format(amount);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 0:
                return { label: t('pending'), color: "orange", icon: FaClock };
            case 1:
                return { label: t('completed'), color: "green", icon: FaCheckCircle };
            case 2:
                return { label: t('cancelled'), color: "red", icon: FaTimesCircle };
            default:
                return { label: t('unknown'), color: "gray", icon: FaBox };
        }
    };

    const Badge = ({ status }) => {
        const { label, color, icon: Icon } = getStatusInfo(status);
        const colorClasses = {
            orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
                <Icon className="w-3 h-3" />
                {label}
            </span>
        );
    };

    const StatCard = ({ title, value, icon, color = "blue" }) => {
        const bgColor = `bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`;
        const textColor = `text-${color}-600 dark:text-${color}-400`;
        return (
            <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${bgColor}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                    <div className={`p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm ${textColor}`}>{icon}</div>
                </div>
            </div>
        );
    };

    const DateRangePicker = ({ value, onChange }) => {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={value.start ? dayjs(value.start).format("YYYY-MM-DD") : ""}
                    onChange={(e) => onChange({ ...value, start: e.target.value ? dayjs(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500">-</span>
                <input
                    type="date"
                    value={value.end ? dayjs(value.end).format("YYYY-MM-DD") : ""}
                    onChange={(e) => onChange({ ...value, end: e.target.value ? dayjs(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                />
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-transparent p-4 md:p-6"
        >
            <div className="mx-auto">
                <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3"
                        >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <FaShoppingCart className="text-2xl text-blue-600 dark:text-blue-400" />
                            </div>
                            {t('purchaseRawManagement')}
                        </motion.h1>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{t('manageTrackPurchases')}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={refetch}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <LuRefreshCw className={isLoading ? "animate-spin" : ""} />
                            {t('refresh')}
                        </button>
                        <ExportExcel data={filteredPurchases} title="Purchase" />
                        <Link to="add">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                                <FaPlus />
                                {t('newPurchase')}
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <StatCard title={t('totalPurchases')} value={stats.totalPurchases} icon={<FaShoppingCart className="text-2xl" />} color="blue" />
                    <StatCard title={t('totalAmount')} value={`$${formatCurrency(stats.totalAmount)}`} icon={<FaDollarSign className="text-2xl" />} color="green" />
                    <StatCard title={t('totalBalance')} value={`$${formatCurrency(stats.totalBalance)}`} icon={<FaBalanceScale className="text-2xl" />} color="purple" />
                    <StatCard title={t('pendingOrders')} value={stats.pendingPurchases} icon={<FaClock className="text-2xl" />} color="orange" />
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border text-sm border-gray-200 dark:border-gray-700 p-4 mb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <IoIosList className="text-lg" />
                                    <span>{t('listView')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <IoIosGrid className="text-lg" />
                                    <span>{t('gridView')}</span>
                                </button>
                            </div>

                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                    <input
                                        type="text"
                                        placeholder={t('searchPurchasePlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="all">{t('allStatus')}</option>
                                <option value="0">{t('pending')}</option>
                                <option value="1">{t('completed')}</option>
                                <option value="2">{t('cancelled')}</option>
                            </select>

                            <DateRangePicker value={dateRange} onChange={setDateRange} />
                        </div>
                    </div>
                </div>

                <AlertBox
                    isOpen={alertBox}
                    title={t('deletePurchase')}
                    message={t('confirmDeletePurchase')}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmText={t('delete')}
                    cancelText={t('cancel')}
                />
                <AlertBox
                    isOpen={alertBoxCancel}
                    title={t('cancelPurchase')}
                    message={t('confirmCancelPurchase')}
                    onConfirm={handlePurchaseCancel}
                    onCancel={handleCancel}
                    confirmText={t('cancel')}
                    cancelText={t('keep')}
                />
                <AlertBox
                    isOpen={alertBoxConfirm}
                    title={t('confirmPurchase')}
                    message={t('confirmConfirmPurchase')}
                    onConfirm={handlePurchaseConfirm}
                    onCancel={handleCancel}
                    confirmText={t('confirm')}
                    cancelText={t('cancel')}
                />
                <AlertBox
                    isOpen={alertBoxUncancel}
                    title={t('uncancelPurchase')}
                    message={t('confirmUncancelPurchase')}
                    onConfirm={handlePurchaseUncancel}
                    onCancel={handleCancel}
                    confirmText={t('confirm')}
                    cancelText={t('cancel')}
                />

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {viewMode === "list" && (
                        <div className="bg-white dark:bg-slate-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">{t('purchaseNo')}</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">{t('supplier')}</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">{t('date')}</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{t('totalAmount')}</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{t('totalBalance')}</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">{t('status')}</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">{t('createdBy')}</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredPurchases.map((item) => (
                                            <tr key={item.purchase_id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{item.purchase_no}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 dark:text-gray-200">
                                                        <FaUser className="text-gray-400 w-4 h-4" />
                                                        <span>{item.supplier_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.purchase_date}</td>
                                                <td className="px-6 py-4 text-right font-semibold dark:text-gray-200">${formatCurrency(item.total_amount)}</td>
                                                <td
                                                    className={`px-6 py-4 text-right font-semibold ${item.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                                        }`}
                                                >
                                                    ${formatCurrency(item.balance)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge status={item.status} />
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.created_by_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {item.status === 0 && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePurchase(item.purchase_id, "confirm")}
                                                                    className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                                    title={t('receive')}
                                                                >
                                                                    <FaCheckCircle />
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePurchase(item.purchase_id, "cancel")}
                                                                    className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                                    title={t('cancel')}
                                                                >
                                                                    <FaXmark />
                                                                </button>
                                                            </>
                                                        )}
                                                        {item.status === 2 && (
                                                            <button
                                                                onClick={() => handlePurchase(item.purchase_id, "uncancel")}
                                                                className="p-2 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                                                title={t('uncancelPurchase')}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                        )}
                                                        {item.balance != 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setShowPaymentModal(true);
                                                                    setPaymentAmount(item.balance);
                                                                    setBalanceAmount({ "pay": item.total_paid, "balance": item.balance });
                                                                    setId(item.purchase_id);
                                                                    setPaymentDate(new Date().toISOString().split("T")[0]);
                                                                }}
                                                                className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                            >
                                                                <MdPayment />
                                                            </button>
                                                        )}
                                                        <Link to={`receipt-raw/${item.purchase_id}`}>
                                                            <button className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                                                <FaReceipt />
                                                            </button>
                                                        </Link>
                                                        {item.status != 1 && <Link to={`update/${item.purchase_id}`}>
                                                            <button className="px-3 py-2 bg-gray-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors">
                                                                <BiEdit />
                                                            </button>
                                                        </Link>}

                                                        {item.status != 1 && <button onClick={() => { setAlertBox(true); setId(item.purchase_id) }} className="px-3 py-2 bg-gray-100 text-red-700 dark:bg-gray-700 dark:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors">
                                                            <BiTrash />
                                                        </button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isLoading && (
                                <div className="h-40 flex justify-center items-center">
                                    <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text={t('loadingOrders')} textColor="#327fcd" />
                                </div>
                            )}

                            {filteredPurchases.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <FaBox className="mx-auto text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-lg">No purchases found</p>
                                </div>
                            )}

                            {!isLoading && filteredPurchases.length > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('showingPageOf', { page: startIndex + '-' + endIndex, total: totalItems })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 transition-colors"
                                        >
                                            {t('previousPage')}
                                        </button>
                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {t('page')} {currentPage} {t('of')} {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 transition-colors"
                                        >
                                            {t('nextPage')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {filteredPurchases.map((item) => {
                                const statusInfo = getStatusInfo(item.status);
                                const borderColor = {
                                    orange: "border-orange-200 dark:border-orange-900/30",
                                    green: "border-green-200 dark:border-green-900/30",
                                    red: "border-red-200 dark:border-red-900/30",
                                    gray: "border-gray-200 dark:border-gray-700",
                                }[statusInfo.color];
                                return (
                                    <motion.div
                                        key={item.purchase_id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`bg-white dark:bg-slate-800 rounded-lg border-2 ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4 border-b border-b-gray-400 dark:border-b-gray-600 pb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">{item.purchase_no}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.purchase_date}</p>
                                                </div>
                                                <Badge status={item.status} />
                                            </div>

                                            <div className="flex items-center gap-2 mb-3 dark:text-gray-200">
                                                <FaUser className="text-gray-400 w-4 h-4" />
                                                <span className="font-medium">{item.supplier_name}</span>
                                            </div>

                                            <div className="space-y-2 text-sm mb-4">
                                                <div className="flex justify-between dark:text-gray-300">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('totalAmount')}:</span>
                                                    <span className="font-semibold">${formatCurrency(item.total_amount)}</span>
                                                </div>
                                                <div className="flex justify-between dark:text-gray-300">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('totalPaid')}:</span>
                                                    <span className="font-semibold text-green-600 dark:text-green-400">${formatCurrency(item.total_paid)}</span>
                                                </div>
                                                <div className="flex justify-between dark:text-gray-300">
                                                    <span className="text-gray-600 dark:text-gray-400">{t('totalBalance')}:</span>
                                                    <span className={`font-semibold ${item.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                                        ${formatCurrency(item.balance)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('createdBy')}: {item.created_by_name}</div>

                                            <div className="flex flex-wrap justify-start gap-2 border-t dark:border-gray-700 pt-2">
                                                {item.status === 0 && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePurchase(item.purchase_id, "confirm")}
                                                            className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                            title={t('receive')}
                                                        >
                                                            <FaCheckCircle />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePurchase(item.purchase_id, "cancel")}
                                                            className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                            title={t('cancel')}
                                                        >
                                                            <FaXmark />
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 2 && (
                                                    <button
                                                        onClick={() => handlePurchase(item.purchase_id, "uncancel")}
                                                        className="p-2 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                                                        title={t('uncancelPurchase')}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}
                                                {item.balance != 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setShowPaymentModal(true);
                                                            setPaymentAmount(item.balance);
                                                            setBalanceAmount({ "pay": item.total_paid, "balance": item.balance });
                                                            setId(item.purchase_id);
                                                            setPaymentDate(new Date().toISOString().split("T")[0]);
                                                        }}
                                                        className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        <MdPayment />
                                                    </button>
                                                )}
                                                <Link to={`receipt-raw/${item.purchase_id}`}>
                                                    <button className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                                                        <FaReceipt />
                                                    </button>
                                                </Link>
                                                {item.status != 1 && <Link to={`update/${item.purchase_id}`}>
                                                    <button className="px-3 py-2 bg-gray-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors">
                                                        <BiEdit />
                                                    </button>
                                                </Link>}
                                                {item.status != 1 && <button onClick={() => { setAlertBox(true); setId(item.purchase_id) }} className="px-3 py-2 bg-gray-100 text-red-700 dark:bg-gray-700 dark:text-red-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors">
                                                    <BiTrash />
                                                </button>}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {viewMode === "grid" && isLoading && (
                        <div className="h-40 flex justify-center items-center">
                            <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text={t('loadingOrders')} textColor="#327fcd" />
                        </div>
                    )}
                    {viewMode === "grid" && filteredPurchases.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <FaBox className="mx-auto text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg">No purchases found</p>
                        </div>
                    )}

                    {viewMode === "grid" && !isLoading && filteredPurchases.length > 0 && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('showingPageOf', { page: startIndex + '-' + endIndex, total: totalItems })}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 transition-colors"
                                >
                                    {t('previousPage')}
                                </button>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('page')} {currentPage} {t('of')} {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-gray-300 transition-colors"
                                >
                                    {t('nextPage')}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl"
                    >
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
                            <FaMoneyBillWave className="text-green-500" />
                            {t('addPayment')}
                        </h3>
                        <div className="flex justify-between mb-4 dark:text-gray-300">
                            <h1>{t('balance')}: <span className="text-red-500">{parseFloat(balanceAmount?.balance).toFixed(2)}</span></h1>
                            <h1>{t('paidAmount')}: <span className="text-green-500">{parseFloat(balanceAmount?.pay).toFixed(2)}</span></h1>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                                    {t('amount')} <FaDollarSign />
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentDate')}</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={addPayment}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? t('processing') : t('addPayment')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default PurchaseRawList;
