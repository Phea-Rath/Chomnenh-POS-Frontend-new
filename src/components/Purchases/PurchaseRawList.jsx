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
    FaPlus,
    FaFilter,
    FaShoppingCart,
    FaBalanceScale,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCheck,
    FaEye,
    FaEdit,
    FaTrash,
    FaFileAlt,
    FaCreditCard,
    FaBan,
    FaReceipt,
} from "react-icons/fa";
import { LuCalendar, LuRefreshCw } from "react-icons/lu";
import dayjs from "dayjs";
import api from "../../services/api";
import ExportExcel from "../../services/ExportExcel";
import { useGetAllRawMaterialQuery } from "../../../app/Features/RawMaterialSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import RichSearch from "../../utils/RichSearch";
import { DatePicker } from "antd";
import PaymentModel from "../../utils/PaymentModal";
import ActionButton from "../../utils/ActionButton";
import { FaXmark } from "react-icons/fa6";
import { MdPayment } from "react-icons/md";
import { BiEdit, BiTrash } from "react-icons/bi";
import Button from "../../utils/Button";
const MENU_ID = 39;
const PurchaseRawList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [balanceAmount, setBalanceAmount] = useState(0);
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

    const ActionButtons = ({ item }) => {
        const actions = [
            // View Details (Primary)
            {
                type: 'view',
                icon: <FaEye size={14} />,
                onClick: () => navigate(`detail-raw/${item.purchase_id}`),
                title: t('details'),
                label: t('details')
            },
            // Receipt (Primary)
            {
                type: 'execute',
                icon: <FaFileAlt size={14} />,
                onClick: () => navigate(`receipt-raw/${item.purchase_id}`),
                title: t('receipt'),
                label: t('receipt')
            },
            // Payment (Conditional Primary)
            ...(item.balance != 0 ? [{
                type: 'execute',
                icon: <FaCreditCard size={14} />,
                onClick: () => {
                    setShowPaymentModal(true);
                    setBalanceAmount({ pay: item.total_paid, balance: item.balance });
                    setId(item.purchase_id);
                },
                title: t('payment'),
                label: t('payment')
            }] : []),
            // Confirm/Receive (Overflow)
            ...(item.status === 0 ? [{
                type: 'modify',
                icon: <FaCheck size={14} />,
                onClick: () => handlePurchase(item.purchase_id, "confirm"),
                title: t('receive'),
                label: t('receive')
            }] : []),
            // Uncancel (Overflow)
            ...(item.status === 2 ? [{
                type: 'modify',
                icon: <FaCheck size={14} />,
                onClick: () => handlePurchase(item.purchase_id, "uncancel"),
                title: t('uncancelPurchase'),
                label: t('uncancelPurchase')
            }] : []),
            // Edit (Overflow)
            ...(item.status !== 1 ? [{
                type: 'modify',
                icon: <FaEdit size={14} />,
                onClick: () => navigate(`update/${item.purchase_id}`),
                title: t('edit'),
                label: t('edit')
            }] : []),
            // Cancel (Overflow)
            ...(item.status === 0 ? [{
                type: 'drop',
                icon: <FaBan size={14} />,
                onClick: () => handlePurchase(item.purchase_id, "cancel"),
                title: t('cancel'),
                label: t('cancel')
            }] : []),
            // Delete (Overflow)
            ...(item.status !== 1 ? [{
                type: 'drop',
                icon: <FaTrash size={14} />,
                onClick: () => { setAlertBox(true); setId(item.purchase_id) },
                title: t('delete'),
                label: t('delete')
            }] : []),
        ];

        return (
            <div className="flex justify-end">
                <ActionButton actions={actions}  menuId={MENU_ID}/>
            </div>
        );
    };

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
    const statusOptions = [
        { id: "all", title: t("allStatus") },
        { id: "0", title: t("pending") },
        { id: "1", title: t("completed") },
        { id: "2", title: t("cancelled") },
    ];

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
                return !purchaseDate.isBefore(start, "day") && !purchaseDate.isAfter(end, "day");
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

    const addPayment = async (value) => {
        try {
            setLoading(true);
            const res = await api.put(
                `purchase_payment/${id}`,
                {
                    transection_id: value.transection_id,
                    remark: value.remark,
                    payment_method: value.payment_method,
                    amount: value.amount,
                    paid_at: value.payment_date,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.data.status === 200) {
                refetch();
                toast.success(t('paymentAddedSuccess', 'Payment added successfully!'));
                setShowPaymentModal(false);
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
                            <Button variant="save" actionType="is_modify" menuId={MENU_ID} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                                <FaPlus />
                                {t('newPurchase')}
                            </Button>
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
                                    <span>{t('list')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <IoIosGrid className="text-lg" />
                                    <span>{t('grid')}</span>
                                </button>
                            </div>

                            <div className="grow max-w-md">
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
                            <div className="min-w-40">
                                <RichSearch
                                    data={statusOptions}
                                    keyFields={{ id: "id", title: "title" }}
                                    value={statusFilter}
                                    onSelected={setStatusFilter}
                                    placeholder={t("allStatus")}
                                />
                            </div>

                            <DatePicker
                                value={dateRange.start ? dayjs(dateRange.start) : null}
                                onChange={(_, dateString) =>
                                    setDateRange((prev) => ({ ...prev, start: dateString || null }))
                                }
                                format="YYYY-MM-DD"
                                className="date-picker"
                                placeholder={t("startDate")}
                            />

                            <DatePicker
                                value={dateRange.end ? dayjs(dateRange.end) : null}
                                onChange={(_, dateString) =>
                                    setDateRange((prev) => ({ ...prev, end: dateString || null }))
                                }
                                format="YYYY-MM-DD"
                                className="date-picker"
                                placeholder={t("endDate")}
                            />
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
                        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                                                <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400"><pre>{item.purchase_no}</pre></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 dark:text-gray-200">
                                                        <FaUser className="text-gray-400 w-4 h-4" />
                                                        <span>{item.supplier_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400"><pre className="flex items-center gap-2"><LuCalendar size={15} />{dayjs(item.purchase_date).format('MMM DD, YYYY')}</pre></td>
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
                                                    <ActionButtons item={item} />
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                                        className={`bg-white dark:bg-slate-800 border-2 ${borderColor} hover:shadow-md transition-all duration-300 overflow-hidden`}
                                    >
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4 border-b border-b-gray-300 dark:border-b-gray-600 pb-2">
                                                <div>
                                                    <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">{item.purchase_no}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400"><pre className="flex items-center gap-2"><LuCalendar size={15} />{dayjs(item.purchase_date).format('MMM DD, YYYY')}</pre></p>
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

                                            <div className="flex flex-wrap justify-start gap-2 border-t border-gray-300 dark:border-gray-700 pt-2">
                                                <ActionButtons item={item} />
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

            <PaymentModel isShow={showPaymentModal} onClose={() => setShowPaymentModal(false)} isLoading={loading} balance={parseFloat(balanceAmount?.balance).toFixed(2)} pay={parseFloat(balanceAmount?.pay).toFixed(2)} onPayment={addPayment} />
        </motion.div>
    );
};

export default PurchaseRawList;
