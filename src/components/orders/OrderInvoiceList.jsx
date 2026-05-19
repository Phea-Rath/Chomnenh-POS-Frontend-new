import React, { useEffect, useMemo, useState } from "react";
import {
  LuBan,
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuClipboardList,
  LuCreditCard,
  LuDollarSign,
  LuEye,
  LuFileText,
  LuList,
  LuPackage,
  LuPlus,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuShoppingBag,
  LuTrash2,
  LuUser,
} from "react-icons/lu";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { useDebounce } from "use-debounce";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import AlertBox from "../../services/AlertBox";
import api from "../../services/api";
import { totalSum } from "../../services/serviceFunction";
import { useOutletsContext } from "../../layouts/Management";
import {
  useCancelOrderMutation,
  useDeleteOrderMutation,
  useGetOrderInvoiceQuery,
  useUncancelOrderMutation,
} from "../../../app/Features/ordersSlice";
import { useGetAllUserQuery } from "../../../app/Features/usersSlice";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";

dayjs.extend(relativeTime);

const DEFAULT_FILTERS = {
  created_by: "",
  customer_id: "",
  item_for: "",
  start_date: "",
  end_date: "",
};

const itemForOptions = [
  { value: "", label: "All Types" },
  { value: "sale", label: "Sale" },
  { value: "sample", label: "Sample" },
  { value: "free", label: "Free" },
];

const OrderInvoiceList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { setLoading, loading: contextLoading } = useOutletsContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState(localStorage.getItem("orderInvoiceViewMode") || "list");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50, 100],
  });

  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [alertBoxCancel, setAlertBoxCancel] = useState(false);
  const [alertBoxUncancel, setAlertBoxUncancel] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState({ pay: 0, balance: 0 });

  const { data: usersData } = useGetAllUserQuery(token, { skip: !token });
  const { data: customersData } = useGetAllCustomerQuery(token, { skip: !token });
  const {
    data: invoiceData,
    isLoading: queryLoading,
    refetch,
  } = useGetOrderInvoiceQuery(
    {
      token,
      limit: pagination.pageSize,
      page: pagination.current,
      search: debouncedSearch,
      ...filters,
    },
    { skip: !token }
  );

  const [deleteOrder] = useDeleteOrderMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [uncancelOrder] = useUncancelOrderMutation();

  const invoices = invoiceData?.data || [];
  const users = usersData?.data || [];
  const customers = customersData?.data || [];

  useEffect(() => {
    if (invoiceData?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: invoiceData.pagination.total,
      }));
    }
  }, [invoiceData]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [debouncedSearch, filters.created_by, filters.customer_id, filters.item_for, filters.start_date, filters.end_date]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleDelete = (orderId) => {
    setId(orderId);
    setAlertBox(true);
  };

  const handleOrderCancel = (orderId) => {
    setId(orderId);
    setAlertBoxCancel(true);
  };

  const handleOrderUncancel = (orderId) => {
    setId(orderId);
    setAlertBoxUncancel(true);
  };

  const handleCancel = () => {
    setAlertBox(false);
    setAlertBoxCancel(false);
    setAlertBoxUncancel(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setAlertBox(false);
      setLoading(true);
      const res = await deleteOrder({ id, token });
      if (res?.data?.status === 200) {
        refetch();
        toast.success(res.data.message || t("orderDeletedSuccessfully"));
      }
    } catch (error) {
      toast.error(error.message || t("orderDeleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    try {
      setAlertBoxCancel(false);
      setLoading(true);
      const res = await cancelOrder({ id, token });
      if (res?.data?.status === 200) {
        refetch();
        toast.success(res.data.message || t("orderCanceledSuccessfully"));
      }
    } catch (error) {
      toast.error(error.message || t("orderCancelFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUncancelOrder = async () => {
    try {
      setAlertBoxUncancel(false);
      setLoading(true);
      const res = await uncancelOrder({ id, token });
      if (res?.data?.status === 200) {
        refetch();
        toast.success(res.data.message || t("orderUncanceledSuccessfully"));
      }
    } catch (error) {
      toast.error(error.message || t("orderUncancelFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentOrder = async () => {
    try {
      setLoading(true);
      const res = await api.put(`/order_payment/${id}/${paymentAmount}`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || t("orderPaymentedSuccessfully"));
        setShowPaymentModal(false);
      } else {
        toast.error(res.data.message || t("orderPaymentFailed"));
      }
    } catch (error) {
      toast.error(t("orderPaymentFailed"));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (date) => (date ? dayjs(date).format("MMM D, YYYY") : "-");

  const stats = useMemo(() => {
    return {
      totalSales: totalSum(invoices, "order_total"),
      totalPaid: totalSum(invoices, "payment"),
      totalBalance: totalSum(invoices, "balance"),
      orderCount: pagination.total,
    };
  }, [invoices, pagination.total]);

  const getStatusBadge = (order) => {
    if (order.is_cancelled) {
      return <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">{t("cancelled")}</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Invoice</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const colors = status === "paid"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";

    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase ${colors}`}>{status || "unpaid"}</span>;
  };

  const StatCard = ({ title, value, icon, color = "blue" }) => (
    <div className={`rounded-lg border border-gray-200 bg-gradient-to-br from-white to-${color}-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-${color}-900/10`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-full bg-gradient-to-r from-${color}-100 to-${color}-200 p-3 text-${color}-600 dark:from-${color}-900/30 dark:to-${color}-800/20 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const Pagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const start = pagination.total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.current * pagination.pageSize, pagination.total);

    return (
      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t("rowsPerPage")}:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => setPagination((prev) => ({ ...prev, pageSize: Number(e.target.value), current: 1 }))}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {pagination.pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPagination((prev) => ({ ...prev, current: 1 }))} disabled={pagination.current === 1} className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><LuChevronsLeft /></button>
          <button onClick={() => setPagination((prev) => ({ ...prev, current: Math.max(1, prev.current - 1) }))} disabled={pagination.current === 1} className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><LuChevronLeft /></button>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t("page")} {pagination.current} {t("of")} {totalPages || 1}</span>
          <button onClick={() => setPagination((prev) => ({ ...prev, current: Math.min(totalPages || 1, prev.current + 1) }))} disabled={pagination.current === totalPages || totalPages === 0} className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><LuChevronRight /></button>
          <button onClick={() => setPagination((prev) => ({ ...prev, current: totalPages || 1 }))} disabled={pagination.current === totalPages || totalPages === 0} className="rounded-md border border-gray-300 p-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"><LuChevronsRight /></button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">{t("showing")} {start} {t("to")} {end} {t("of")} {pagination.total} invoices</div>
      </div>
    );
  };

  const ActionButtons = ({ order }) => (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => navigate(`/order-list/invoice/${order.order_id}`)}
        className="rounded bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
        title={t("view")}
      >
        <LuEye size={14} />
      </button>

      {!order.is_cancelled && (
        <button
          onClick={() => navigate(`/home/order-invoice/update/${order.order_id}`)}
          className="rounded bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
          title={t("edit")}
        >
          <LuFileText size={14} />
        </button>
      )}

      {!order.is_cancelled && Number(order.balance) > 0 && (
        <button
          onClick={() => {
            setPaymentAmount(Number(order.balance) || 0);
            setBalanceAmount({ pay: Number(order.payment) || 0, balance: Number(order.balance) || 0 });
            setId(order.order_id);
            setShowPaymentModal(true);
          }}
          className="rounded bg-purple-100 p-2 text-purple-600 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
          title={t("pay")}
        >
          <LuCreditCard size={14} />
        </button>
      )}

      {!order.is_cancelled ? (
        <button
          onClick={() => handleOrderCancel(order.order_id)}
          className="rounded bg-orange-100 p-2 text-orange-600 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
          title={t("cancel")}
        >
          <LuBan size={14} />
        </button>
      ) : (
        <button
          onClick={() => handleOrderUncancel(order.order_id)}
          className="rounded bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
          title={t("uncancel")}
        >
          <LuRotateCcw size={14} />
        </button>
      )}

      <button
        onClick={() => handleDelete(order.order_id)}
        className="rounded bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
        title={t("delete")}
      >
        <LuTrash2 size={14} />
      </button>
    </div>
  );

  const TableView = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="border-b border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Invoice</th>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Customer</th>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Date</th>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200">Reference</th>
              <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200">{t("total")}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t("payment")}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t("status")}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((order) => (
              <tr key={order.order_id} className={`border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${order.is_cancelled ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                <td className="p-3">
                  <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">{order.order_no}</div>
                  <div className="text-[10px] uppercase text-gray-400">{order.sale_type || "invoice"}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-900 dark:text-white">{order.customer_name || "-"}</div>
                  <div className="text-xs text-gray-500">{order.customer_email || order.order_tel || "-"}</div>
                </td>
                <td className="p-3">
                  <div className="text-gray-900 dark:text-gray-200">{formatDate(order.order_date)}</div>
                  <div className="text-[10px] text-gray-400">{order.order_date ? dayjs(order.order_date).fromNow() : "-"}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{order.reference_no || "-"}</div>
                </td>
                <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(order.order_total)}</td>
                <td className="p-3 text-center">{getPaymentStatusBadge(order.order_payment_status)}</td>
                <td className="p-3 text-center">{getStatusBadge(order)}</td>
                <td className="p-3">
                  <ActionButtons order={order} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {invoices.map((order) => (
        <div key={order.order_id} className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${order.is_cancelled ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
          <div className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">{order.order_no}</div>
                <div className="text-[10px] uppercase text-gray-400">{order.reference_no || "No reference"}</div>
              </div>
              {getStatusBadge(order)}
            </div>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100 font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                {order.customer_name?.charAt(0) || "C"}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-gray-900 dark:text-white">{order.customer_name || "-"}</h3>
                <div className="truncate text-xs text-gray-500">{order.customer_email || order.order_tel || "-"}</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded bg-gray-50 p-2 dark:bg-gray-900/50">
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">{formatCurrency(order.order_total)}</div>
                <div className="text-[10px] uppercase text-gray-500">{t("total")}</div>
              </div>
              <div className="border-l border-gray-200 text-center dark:border-gray-700">
                <div className="text-sm font-bold text-orange-600">{formatCurrency(order.balance)}</div>
                <div className="text-[10px] uppercase text-gray-500">{t("balance")}</div>
              </div>
            </div>

            <div className="mb-4 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>{t("paidAmount")}</span>
                <span className="font-medium text-blue-600">{formatCurrency(order.payment)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="font-medium">{order.deliver_name || "-"}</span>
              </div>
              <div className="flex justify-between border-t pt-1 dark:border-gray-700">
                <span>{t("paymentStatus")}</span>
                {getPaymentStatusBadge(order.order_payment_status)}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <LuCalendar size={10} /> {formatDate(order.order_date)}
              </div>
              <ActionButtons order={order} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="view-page min-h-screen bg-transparent p-4 md:p-6"
    >
      <AlertBox isOpen={alertBox} title={t("deleteOrderTitle")} message={t("deleteOrderMessage")} onConfirm={handleConfirmDelete} onCancel={handleCancel} confirmText={t("delete")} cancelText={t("cancel")} confirmColor="error" />
      <AlertBox isOpen={alertBoxCancel} title={t("cancelOrderTitle")} message={t("cancelOrderMessage")} onConfirm={handleConfirmCancelOrder} onCancel={handleCancel} confirmText={t("cancelOrderAction")} cancelText={t("keepOrder")} confirmColor="warning" />
      <AlertBox isOpen={alertBoxUncancel} title={t("uncancelOrderTitle")} message={t("uncancelOrderMessage")} onConfirm={handleConfirmUncancelOrder} onCancel={handleCancel} confirmText={t("uncancelOrder")} cancelText={t("keepCancelled")} confirmColor="info" />

      <div className="mx-auto">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-2 flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
              <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-3 shadow-sm">
                <LuClipboardList className="text-xl text-white" />
              </div>
              Invoice List
            </motion.h1>
            <p className="text-md text-gray-600 dark:text-gray-400">Manage invoice records, balances, and follow-up actions.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => refetch()} disabled={queryLoading || contextLoading} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <LuRefreshCw className={queryLoading ? "animate-spin" : ""} />
              {t("refresh")}
            </button>
            <Link to="/home/order-invoice/create">
              <button className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-green-700">
                <LuPlus /> Create Invoice
              </button>
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Invoices" value={stats.orderCount.toLocaleString()} icon={<LuPackage className="text-2xl" />} color="teal" />
          <StatCard title={t("totalSales")} value={formatCurrency(stats.totalSales)} icon={<LuDollarSign className="text-2xl" />} color="green" />
          <StatCard title={t("totalPaid")} value={formatCurrency(stats.totalPaid)} icon={<LuCreditCard className="text-2xl" />} color="blue" />
          <StatCard title={t("totalBalance")} value={formatCurrency(stats.totalBalance)} icon={<LuShoppingBag className="text-2xl" />} color="orange" />
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <select
                name="created_by"
                value={filters.created_by}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                name="customer_id"
                value={filters.customer_id}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.customer_id} value={customer.customer_id}>{customer.customer_name}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                name="item_for"
                value={filters.item_for}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                {itemForOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-1">
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">
                  <LuUser size={12} /> Filter by user, customer, item purpose, and date range
                </span>
                <button
                  onClick={handleResetFilters}
                  className="rounded-full border border-gray-300 px-3 py-1 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-100 p-1 transition-colors dark:border-gray-600 dark:bg-gray-700">
                <button
                  onClick={() => {
                    setViewMode("list");
                    localStorage.setItem("orderInvoiceViewMode", "list");
                  }}
                  className={`flex-1 rounded-md px-3 py-2 transition-all ${viewMode === "list" ? "bg-white font-semibold text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400" : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <LuList /> {t("table")}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setViewMode("grid");
                    localStorage.setItem("orderInvoiceViewMode", "grid");
                  }}
                  className={`flex-1 rounded-md px-3 py-2 transition-all ${viewMode === "grid" ? "bg-white font-semibold text-blue-600 shadow-sm dark:bg-gray-600 dark:text-blue-400" : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <LuPackage /> {t("grid")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {queryLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white/80 py-16 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <LuClipboardList className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-white">No invoices found</h3>
            <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">Try adjusting the filters or create a new invoice to get started.</p>
            <Link to="/home/order-invoice/create">
              <button className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700">
                <LuPlus /> Create Invoice
              </button>
            </Link>
          </div>
        ) : viewMode === "list" ? (
          <TableView />
        ) : (
          <>
            <GridView />
            <div className="mt-6">
              <Pagination />
            </div>
          </>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold dark:text-white">
              <LuCreditCard className="text-green-500" /> {t("addPayment")}
            </h3>
            <div className="mb-4 flex justify-between border-b py-2 dark:border-gray-700">
              <div className="text-xs uppercase text-gray-500">{t("balance")}: <span className="ml-1 font-bold text-red-500">{formatCurrency(balanceAmount.balance)}</span></div>
              <div className="text-xs uppercase text-gray-500">{t("paid")}: <span className="ml-1 font-bold text-green-500">{formatCurrency(balanceAmount.pay)}</span></div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("amount")}</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">{t("cancel")}</button>
                <button onClick={handlePaymentOrder} disabled={contextLoading} className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50">
                  {contextLoading ? t("processing") : t("addPayment")}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OrderInvoiceList;
