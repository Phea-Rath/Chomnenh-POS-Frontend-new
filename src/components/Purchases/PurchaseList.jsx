import React, { useEffect, useState, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { IoIosSearch, IoIosList, IoIosGrid } from "react-icons/io";
import { Link, useNavigate } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { motion } from "framer-motion";
import {
  useCancelPurchaseMutation,
  useConfirmPurchaseMutation,
  useDeletePurchaseMutation,
  useGetAllPurchaseQuery,
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
  FaDownload,
  FaFilter,
  FaShoppingCart,
  FaMoneyBillWave,
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
} from "react-icons/fa";
import { LuCalendar, LuRefreshCw } from "react-icons/lu";
import dayjs from "dayjs";
import api from "../../services/api";
import ExportExcel from "../../services/ExportExcel";
import { useTranslation } from "react-i18next";
import RichSearch from "../../utils/RichSearch";
import { DatePicker } from "antd";
import RefreshButton from "../../utils/RefreshButton";
import Input from "../../utils/Input";
import { PAYMENT_METHODS } from "../../services/paymentService";
import PaymentModel from "../../utils/PaymentModal";
import ActionButton from "../../utils/ActionButton";
import Button from "../../utils/Button";
const MENU_ID = 28;
const Purchases = () => {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transectionId, setTransectionId] = useState('');
  const [remark, setRemark] = useState('');
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

  const { data, isLoading, refetch } = useGetAllPurchaseQuery(queryParams);
  const [deletePurchase] = useDeletePurchaseMutation();
  const [cancelPurchase] = useCancelPurchaseMutation();
  const [uncancelPurchase] = useUncancelPurchaseMutation();
  const [confirmPurchase] = useConfirmPurchaseMutation();
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
    applyFilters();
  }, [purchases, statusFilter, dateRange]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

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
      const res = await deletePurchase({ id, token });
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
      const res = await api.put(`/purchase_confirm/${id}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        salesRefetch();
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
          payment_method:value.payment_method,
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

  const navigate = useNavigate();

  const ActionButtons = ({ item }) => {
    const actions = [
      // View Details (Primary)
      {
        type: 'view',
        icon: <FaEye size={14} />,
        onClick: () => navigate(`detail/${item.purchase_id}`),
        title: t('details'),
        label: t('details')
      },
      // Receipt (Primary)
      {
        type: 'execute',
        icon: <FaFileAlt size={14} />,
        onClick: () => navigate(`receipt/${item.purchase_id}`),
        title: t('receipt'),
        label: t('receipt')
      },
      // Payment (Conditional Primary)
      ...(item.balance != 0 ? [{
        type: 'execute',
        icon: <FaCreditCard size={14} />,
        onClick: () => {
          setShowPaymentModal(true);
          setPaymentAmount(item.balance);
          setBalanceAmount({ pay: item.total_paid, balance: item.balance });
          setId(item.purchase_id);
          setPaymentDate(new Date().toISOString().split("T")[0]);
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
        <ActionButton actions={actions} menuId = {MENU_ID} />
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="view-page bg-transparent transition-colors"
    >
      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <FaShoppingCart className="text-[#13b5ea]" />
              {t('purchaseManagement')}
            </h1>
            <p className="text-gray-500 text-xs dark:text-gray-400 mt-2">
              {t('manageTrackPurchases')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              onClick={refetch}
              disabled={isLoading}
            >
              <LuRefreshCw className={isLoading ? 'animate-spin' : ''} />
            </Button>
            
            <ExportExcel data={filteredPurchases} title="Purchase" />

            <Button
              menuId={MENU_ID}
              actionType="is_modify"
              variant="save"
              onClick={() => navigate("add")}
            >
              <FaPlus />
              {t('newPurchase')}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 justify-between bg-gray-100 dark:bg-transparent p-4 border-x border-gray-200 dark:border-gray-500">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-1">
              <div className="flex border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 rounded-[2px]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={` p-2 transition-all ${viewMode === 'list' ? 'bg-[#13b5ea]/10 text-[#13b5ea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                  title={t('tableView')}
                >
                  <IoIosList size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={` p-2 transition-all ${viewMode === 'grid' ? 'bg-[#13b5ea]/10 text-[#13b5ea]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
                  title={t('gridView')}
                >
                  <IoIosGrid size={20} />
                </button>
              </div>

              <div className="grow max-w-md">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <IoIosSearch className="text-gray-400" />
                  {t('searchPurchase')}
                </label>
                <Input
                  type="text"
                  placeholder={t('searchPurchasePlaceholder')}
                  value={searchTerm}
                  onChange={(val) => setSearchTerm(val)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="min-w-48">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                   <FaFilter className="text-gray-400" />
                   {t('status')}
                </label>
                <RichSearch
                  data={statusOptions}
                  keyFields={{ id: "id", title: "title" }}
                  value={statusFilter}
                  onSelected={setStatusFilter}
                  placeholder={t("allStatus")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                   <LuCalendar className="text-gray-400" />
                   {t('dateRange')}
                </label>
                <div className="flex items-center gap-2">
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
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="p-4 md:p-6 border border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard title={t('totalPurchases')} value={stats.totalPurchases} icon={<FaShoppingCart className="text-2xl" />} color="blue" />
            <StatCard title={t('totalAmount')} value={`$${formatCurrency(stats.totalAmount)}`} icon={<FaDollarSign className="text-2xl" />} color="green" />
            <StatCard title={t('totalBalance')} value={`$${formatCurrency(stats.totalBalance)}`} icon={<FaBalanceScale className="text-2xl" />} color="purple" />
            <StatCard title={t('pendingOrders')} value={stats.pendingPurchases} icon={<FaClock className="text-2xl" />} color="orange" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {viewMode === "list" && (
              <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 overflow-hidden rounded-[2px]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('purchaseNo')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('supplier')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('date')}</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('totalAmount')}</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('totalBalance')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('status')}</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200 border-r border-gray-200 dark:border-gray-400">{t('createdBy')}</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-200">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPurchases.map((item) => (
                        <tr key={item.purchase_id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"><pre>{item.purchase_no}</pre></td>
                          <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-2 dark:text-gray-200">
                              <FaUser className="text-gray-400 w-4 h-4" />
                              <span className="font-bold">{item.supplier_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"><pre className="flex items-center gap-2"><LuCalendar size={15} />{dayjs(item.purchase_date).format('MMM DD, YYYY')}</pre></td>
                          <td className="px-6 py-4 text-right font-bold dark:text-gray-200 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">${formatCurrency(item.total_amount)}</td>
                          <td
                            className={`px-6 py-4 text-right font-bold border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 ${item.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                              }`}
                          >
                            ${formatCurrency(item.balance)}
                          </td>
                          <td className="px-6 py-4 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <Badge status={item.status} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">{item.created_by_name}</td>
                          <td className="px-6 py-4 bg-white dark:bg-gray-800">
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
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      className={`bg-white dark:bg-slate-800 border-2 ${borderColor} hover:shadow-md transition-all duration-300 overflow-hidden rounded-[2px]`}
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4 border-b border-b-gray-300 dark:border-b-gray-600 pb-2">
                          <div>
                            <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">{item.purchase_no}</h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <pre className="flex items-center gap-2"><LuCalendar size={15} />{dayjs(item.purchase_date).format('MMM DD, YYYY')}</pre>
                            </div>
                          </div>
                          <Badge status={item.status} />
                        </div>

                        <div className="flex items-center gap-2 mb-3 dark:text-gray-200">
                          <FaUser className="text-gray-400 w-4 h-4" />
                          <span className="font-bold">{item.supplier_name}</span>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('totalAmount')}:</span>
                            <span className="font-bold">${formatCurrency(item.total_amount)}</span>
                          </div>
                          <div className="flex justify-between dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('totalPaid')}:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">${formatCurrency(item.total_paid)}</span>
                          </div>
                          <div className="flex justify-between dark:text-gray-300">
                            <span className="text-gray-600 dark:text-gray-400 font-semibold">{t('totalBalance')}:</span>
                            <span className={`font-bold ${item.balance > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                              ${formatCurrency(item.balance)}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">{t('createdBy')}: {item.created_by_name}</div>

                        <div className="border-t border-gray-300 dark:border-gray-700 pt-3">
                          <ActionButtons item={item} />
                        </div>
                        </div>
                    </motion.div>
                    );
                  })
                }
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

            {!isLoading && filteredPurchases.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
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
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-bold px-3 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded">
                    {currentPage} / {totalPages}
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
      </div>

      <PaymentModel isShow={showPaymentModal} onClose={()=>setShowPaymentModal(false)} isLoading={loading} balance={parseFloat(balanceAmount?.balance).toFixed(2)} pay={parseFloat(balanceAmount?.pay).toFixed(2)} onPayment={addPayment}/>

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
    </motion.div>
  );
};

export default Purchases;
