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
import ExportExel from "../../services/ExportExel"; // Assume this is custom and doesn't use AntD

const PurchaseRawList = () => {
    const [purchases, setPurchases] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
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
    const [dateRange, setDateRange] = useState({ start: null, end: null }); // { start: dayjs, end: dayjs }
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // will be sent to API as limit
    const { refetch: salesRefetch } = useGetAllSaleQuery(token);
    const { refetch: stockRefetch } = useGetAllStockQuery(token);
    const { setLoading, loading } = useOutletsContext();
    const queryParams = useMemo(() => ({
        token,
        limit: itemsPerPage,
        page: currentPage,
        search: debouncedSearch,
    }), [token, itemsPerPage, currentPage, debouncedSearch]);

    const { data, isLoading, refetch } = useGetAllPurchaseRawQuery(queryParams);
    const [deletePurchase] = useDeletePurchaseRawMutation();
    const [cancelPurchase] = useCancelPurchaseMutation();
    const [uncancelPurchase] = useUncancelPurchaseMutation();
    const [confirmPurchase] = useConfirmPurchaseRawMutation();

    useEffect(() => {
        const items = data?.data || [];
        setPurchases(items);
        setFilteredPurchases(items);
    }, [data?.data]);

    // reset to first page whenever debounced search value changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        // apply only status/date filters, search is handled by backend
        applyFilters();
    }, [purchases, statusFilter, dateRange]);

    const applyFilters = () => {
        let result = [...purchases];

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((purchase) => purchase.status.toString() === statusFilter);
        }

        // Date range filter
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

    // Calculate statistics
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

    // pagination info from backend
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

    // Handlers for purchase actions
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
            const res = await deletePurchase({ id, token });
            if (res.data.status === 200) {
                refetch();
                toast.success("Deleted purchase successfully!");
            }
        } catch (error) {
            toast.error(error.message || "Failed to delete purchase!");
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
                toast.success("Cancelled purchase successfully!");
            }
        } catch (error) {
            toast.error(error.message || "Failed to cancel purchase!");
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
                toast.success("Uncancelled purchase successfully!");
            }
        } catch (error) {
            toast.error(error.message || "Failed to uncancel purchase!");
        } finally {
            setLoading(false);
        }
    }

    async function handlePurchaseConfirm() {
        try {
            setAlertBoxConfirm(false);
            setLoading(true);
            // const res = await confirmPurchase({ id, token });
            const res = await api.put(`/purchase_confirm_raw/${id}`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                salesRefetch();
                stockRefetch();
                refetch();
                toast.success("Confirmed purchase successfully!");
            }
        } catch (error) {
            toast.error(error.message || "Failed to confirm purchase!");
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
                toast.success("Payment added successfully!");
                setShowPaymentModal(false);
                setPaymentAmount(0);
                setPaymentDate("");
            }
        } catch (error) {
            toast.error(error.message || "Failed to add payment!");
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US").format(amount);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 0:
                return { label: "Pending", color: "orange", icon: FaClock };
            case 1:
                return { label: "Completed", color: "green", icon: FaCheckCircle };
            case 2:
                return { label: "Cancelled", color: "red", icon: FaTimesCircle };
            default:
                return { label: "Unknown", color: "gray", icon: FaBox };
        }
    };

    // Custom Badge component
    const Badge = ({ status }) => {
        const { label, color, icon: Icon } = getStatusInfo(status);
        const colorClasses = {
            orange: "bg-orange-100 text-orange-800",
            green: "bg-green-100 text-green-800",
            red: "bg-red-100 text-red-800",
            gray: "bg-gray-100 text-gray-800",
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
                <Icon className="w-3 h-3" />
                {label}
            </span>
        );
    };

    // Statistic Card
    const StatCard = ({ title, value, icon, color = "blue" }) => {
        const bgColor = `bg-gradient-to-br from-${color}-50 to-${color}-100`;
        const textColor = `text-${color}-600`;
        return (
            <div className={`border border-gray-200 rounded-lg p-4 ${bgColor}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-sm font-medium">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <div className={`p-3 bg-white rounded-full ${textColor}`}>{icon}</div>
                </div>
            </div>
        );
    };

    // Date range inputs
    const DateRangePicker = ({ value, onChange }) => {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="date"
                    value={value.start ? dayjs(value.start).format("YYYY-MM-DD") : ""}
                    onChange={(e) => onChange({ ...value, start: e.target.value ? dayjs(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                />
                <span>-</span>
                <input
                    type="date"
                    value={value.end ? dayjs(value.end).format("YYYY-MM-DD") : ""}
                    onChange={(e) => onChange({ ...value, end: e.target.value ? dayjs(e.target.value) : null })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
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
                {/* Header */}
                <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"
                        >
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FaShoppingCart className="text-2xl text-blue-600" />
                            </div>
                            Purchase Management
                        </motion.h1>
                        <p className="text-gray-600 text-sm">Manage and track your purchase orders</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={refetch}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                        >
                            <LuRefreshCw className={isLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <ExportExel data={filteredPurchases} title="Purchase" />
                        <Link to="/dashboard/purchase-raws">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                <FaPlus />
                                New Purchase
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <StatCard title="Total Purchases" value={stats.totalPurchases} icon={<FaShoppingCart className="text-2xl" />} color="blue" />
                    <StatCard title="Total Amount" value={`$${formatCurrency(stats.totalAmount)}`} icon={<FaDollarSign className="text-2xl" />} color="green" />
                    <StatCard title="Total Balance" value={`$${formatCurrency(stats.totalBalance)}`} icon={<FaBalanceScale className="text-2xl" />} color="purple" />
                    <StatCard title="Pending Orders" value={stats.pendingPurchases} icon={<FaClock className="text-2xl" />} color="orange" />
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-sm border text-sm border-gray-200 p-4 mb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left: view toggle + search */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-300">
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${viewMode === "list" ? "bg-white shadow-sm text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    <IoIosList className="text-lg" />
                                    <span>List</span>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-4 py-2 rounded-md transition-all duration-300 flex items-center gap-2 ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600 font-semibold" : "text-gray-600 hover:text-gray-800"
                                        }`}
                                >
                                    <IoIosGrid className="text-lg" />
                                    <span>Grid</span>
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                                    <input
                                        type="text"
                                        placeholder="Search by purchase number or supplier..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right: filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="0">Pending</option>
                                <option value="1">Completed</option>
                                <option value="2">Cancelled</option>
                            </select>

                            <DateRangePicker value={dateRange} onChange={setDateRange} />
                        </div>
                    </div>
                </div>

                {/* Alert Boxes */}
                <AlertBox
                    isOpen={alertBox}
                    title="Delete Purchase"
                    message="Are you sure you want to DELETE this purchase?"
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmText="Delete"
                    cancelText="Cancel"
                />
                <AlertBox
                    isOpen={alertBoxCancel}
                    title="Cancel Purchase"
                    message="Are you sure you want to CANCEL this purchase?"
                    onConfirm={handlePurchaseCancel}
                    onCancel={handleCancel}
                    confirmText="Cancel"
                    cancelText="Keep"
                />
                <AlertBox
                    isOpen={alertBoxConfirm}
                    title="Confirm Purchase"
                    message="Are you sure you want to CONFIRM this purchase?"
                    onConfirm={handlePurchaseConfirm}
                    onCancel={handleCancel}
                    confirmText="Confirm"
                    cancelText="Cancel"
                />
                <AlertBox
                    isOpen={alertBoxUncancel}
                    title="Uncancel Purchase"
                    message="Are you sure you want to UNCANCEL this purchase?"
                    onConfirm={handlePurchaseUncancel}
                    onCancel={handleCancel}
                    confirmText="Uncancel"
                    cancelText="Cancel"
                />

                {/* Content */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {/* List View */}
                    {viewMode === "list" && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-gray-100 border-b border-gray-300">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Purchase No</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Supplier</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700">Total Amount</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700">Balance</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-3 text-left font-semibold text-gray-700">Created By</th>
                                            <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredPurchases.map((item) => (
                                            <tr key={item.purchase_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-blue-600">{item.purchase_no}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FaUser className="text-gray-400 w-4 h-4" />
                                                        <span>{item.supplier_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{item.purchase_date}</td>
                                                <td className="px-6 py-4 text-right font-semibold">${formatCurrency(item.total_amount)}</td>
                                                <td
                                                    className={`px-6 py-4 text-right font-semibold ${item.balance > 0 ? "text-red-600" : "text-green-600"
                                                        }`}
                                                >
                                                    ${formatCurrency(item.balance)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge status={item.status} />
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{item.created_by_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {item.status === 0 && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePurchase(item.purchase_id, "confirm")}
                                                                    className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                                    title="Receive"
                                                                >
                                                                    <FaCheckCircle />
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePurchase(item.purchase_id, "cancel")}
                                                                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                                    title="Cancel"
                                                                >
                                                                    <FaXmark />
                                                                </button>
                                                            </>
                                                        )}
                                                        {item.status === 2 && (
                                                            <button
                                                                onClick={() => handlePurchase(item.purchase_id, "uncancel")}
                                                                className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                                                                title="Uncancel"
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                        )}
                                                        {item.status === 0 && item.balance != 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setShowPaymentModal(true);
                                                                    setPaymentAmount(item.balance);
                                                                    setId(item.purchase_id);
                                                                    setPaymentDate(new Date().toISOString().split("T")[0]);
                                                                }}
                                                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                            >
                                                                Pay
                                                            </button>
                                                        )}
                                                        <Link to={`receipt-raw/${item.purchase_id}`}>
                                                            <button className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200">
                                                                <FaReceipt />
                                                            </button>
                                                        </Link>
                                                        <Link to={`/dashboard/purchase-raws/update/${item.purchase_id}`}>
                                                            <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                                                                Edit
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isLoading && (
                                <div className="h-40 flex justify-center items-center">
                                    <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text="Loading data" textColor="#327fcd" />
                                </div>
                            )}

                            {filteredPurchases.length === 0 && !isLoading && (
                                <div className="text-center py-12 text-gray-500">
                                    <FaBox className="mx-auto text-4xl mb-4 text-gray-300" />
                                    <p className="text-lg">No purchases found</p>
                                </div>
                            )}

                            {!isLoading && filteredPurchases.length > 0 && (
                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                                    <p className="text-sm text-gray-600">
                                        Showing {startIndex}-{endIndex} of {totalItems}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grid View */}
                    {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {filteredPurchases.map((item) => {
                                const statusInfo = getStatusInfo(item.status);
                                const borderColor = {
                                    orange: "border-orange-200",
                                    green: "border-green-200",
                                    red: "border-red-200",
                                    gray: "border-gray-200",
                                }[statusInfo.color];
                                return (
                                    <motion.div
                                        key={item.purchase_id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`bg-white rounded-lg border-2 ${borderColor} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                                    >
                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4 border-b border-b-gray-400 pb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-blue-600">{item.purchase_no}</h3>
                                                    <p className="text-sm text-gray-500">{item.purchase_date}</p>
                                                </div>
                                                <Badge status={item.status} />
                                            </div>

                                            {/* Supplier */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaUser className="text-gray-400 w-4 h-4" />
                                                <span className="font-medium">{item.supplier_name}</span>
                                            </div>

                                            {/* Financials */}
                                            <div className="space-y-2 text-sm mb-4">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Amount:</span>
                                                    <span className="font-semibold">${formatCurrency(item.total_amount)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Paid:</span>
                                                    <span className="font-semibold text-green-600">${formatCurrency(item.total_paid)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Balance:</span>
                                                    <span className={`font-semibold ${item.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                                        ${formatCurrency(item.balance)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Created By */}
                                            <div className="text-sm text-gray-500 mb-4">Created by: {item.created_by_name}</div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap justify-start gap-2 border-t pt-2">
                                                {item.status === 0 && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePurchase(item.purchase_id, "confirm")}
                                                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                                            title="Receive"
                                                        >
                                                            <FaCheckCircle />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePurchase(item.purchase_id, "cancel")}
                                                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                            title="Cancel"
                                                        >
                                                            <FaXmark />
                                                        </button>
                                                    </>
                                                )}
                                                {item.status === 2 && (
                                                    <button
                                                        onClick={() => handlePurchase(item.purchase_id, "uncancel")}
                                                        className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                                                        title="Uncancel"
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                )}
                                                {item.status === 0 && item.balance != 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setShowPaymentModal(true);
                                                            setPaymentAmount(item.balance);
                                                            setId(item.purchase_id);
                                                            setPaymentDate(new Date().toISOString().split("T")[0]);
                                                        }}
                                                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                                <Link to={`receipt-raw/${item.purchase_id}`}>
                                                    <button className="p-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200">
                                                        <FaReceipt />
                                                    </button>
                                                </Link>
                                                <Link to={`update/${item.purchase_id}`}>
                                                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">
                                                        Edit
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Grid Loading / Empty */}
                    {viewMode === "grid" && isLoading && (
                        <div className="h-40 flex justify-center items-center">
                            <Atom color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} size="medium" text="Loading data" textColor="#327fcd" />
                        </div>
                    )}
                    {viewMode === "grid" && filteredPurchases.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-gray-500">
                            <FaBox className="mx-auto text-4xl mb-4 text-gray-300" />
                            <p className="text-lg">No purchases found</p>
                        </div>
                    )}

                    {viewMode === "grid" && !isLoading && filteredPurchases.length > 0 && (
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                            <p className="text-sm text-gray-600">
                                Showing {startIndex}-{endIndex} of {totalItems}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-200 shadow-xl"
                    >
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FaMoneyBillWave className="text-green-500" />
                            Add Payment
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    Amount <FaDollarSign />
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addPayment}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : "Add Payment"}
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