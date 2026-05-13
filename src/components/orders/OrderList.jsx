import React, { useEffect, useState, useMemo } from "react";
import {
  LuSearch,
  LuPlus,
  LuRefreshCw,
  LuDownload,
  LuEye,
  LuTrash2,
  LuList,
  LuDollarSign,
  LuShoppingBag,
  LuCalendar,
  LuUser,
  LuPhone,
  LuMapPin,
  LuClipboardList,
  LuChartBar,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuBan,
  LuRotateCcw,
  LuFileText,
  LuCreditCard,
  LuPackage
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router';
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import {
  useCancelOrderMutation,
  useDeleteOrderMutation,
  useGetAllOrderQuery,
  useUncancelOrderMutation,
} from "../../../app/Features/ordersSlice";
import { Tooltip } from "antd";
import { toast } from "react-toastify";
import { totalSum } from "../../services/serviceFunction";
import { useTranslation } from "react-i18next";
import { MdPayment } from "react-icons/md";
import api from "../../services/api";
import { useDebounce } from 'use-debounce';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const OrderList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { setLoading, loading: contextLoading } = useOutletsContext();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [viewMode, setViewMode] = useState(localStorage.getItem("orderViewMode") || "grid");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50, 100]
  });

  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [alertBoxCancel, setAlertBoxCancel] = useState(false);
  const [alertBoxUncancel, setAlertBoxUncancel] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [balanceAmount, setBalanceAmount] = useState({ pay: 0, balance: 0 });

  const {
    data: orderData,
    isLoading: queryLoading,
    refetch,
  } = useGetAllOrderQuery({
    token,
    limit: pagination.pageSize,
    page: pagination.current,
    search: debouncedSearch
  });

  const [deleteOrder] = useDeleteOrderMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [uncancelOrder] = useUncancelOrderMutation();

  useEffect(() => {
    if (orderData?.pagination) {
      setPagination(prev => ({
        ...prev,
        total: orderData.pagination.total
      }));
    }
  }, [orderData]);

  // Handlers
  const handleOrderCancel = (order_id) => {
    setAlertBoxCancel(true);
    setId(order_id);
  };

  const handleOrderUncancel = (order_id) => {
    setAlertBoxUncancel(true);
    setId(order_id);
  };

  const handleDelete = (order_id) => {
    setAlertBox(true);
    setId(order_id);
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
      if (res.data.status === 200) {
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
      if (res.data.status === 200) {
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
      if (res.data.status === 200) {
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (date) => dayjs(date).format('MMM D, YYYY');

  // Stats
  const stats = useMemo(() => {
    const orders = orderData?.data || [];
    const totalSales = totalSum(orders, "order_total");
    const totalPaid = totalSum(orders, "payment");
    const totalBalance = totalSum(orders, "balance");
    return {
      totalSales,
      totalPaid,
      totalBalance,
      orderCount: pagination.total
    };
  }, [orderData, pagination.total]);

  // Helpers
  const getStatusBadge = (order) => {
    if (order.is_cancelled) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('cancelled')}</span>;
    }
    if (order.online === 1) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('online')}</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('direct')}</span>;
  };

  const getPaymentStatusBadge = (status) => {
    const colors = status === 'paid' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase font-bold ${colors}`}>{status}</span>;
  };

  // Components
  const StatCard = ({ title, value, icon, color = 'blue' }) => (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-white to-${color}-50 dark:from-gray-800 dark:to-${color}-900/10 transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 bg-gradient-to-r from-${color}-100 to-${color}-200 dark:from-${color}-900/30 dark:to-${color}-800/20 rounded-full text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const Pagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const start = (pagination.current - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.current * pagination.pageSize, pagination.total);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('rowsPerPage')}:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), current: 1 }))}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {pagination.pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPagination(p => ({...p, current: 1}))} disabled={pagination.current === 1} className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><LuChevronsLeft /></button>
          <button onClick={() => setPagination(p => ({...p, current: Math.max(1, p.current - 1)}))} disabled={pagination.current === 1} className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><LuChevronLeft /></button>
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('page')} {pagination.current} {t('of')} {totalPages || 1}</span>
          <button onClick={() => setPagination(p => ({...p, current: Math.min(totalPages, p.current + 1)}))} disabled={pagination.current === totalPages || totalPages === 0} className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><LuChevronRight /></button>
          <button onClick={() => setPagination(p => ({...p, current: totalPages}))} disabled={pagination.current === totalPages || totalPages === 0} className="p-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><LuChevronsRight /></button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('showing')} {start} {t('to')} {end} {t('of')} {pagination.total} {t('orders')}</div>
      </div>
    );
  };

  const TableView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <tr>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('orderNo')}</th>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('customer')}</th>
              <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('date')}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('items')}</th>
              <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('total')}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('payment')}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200 border-r dark:border-gray-600">{t('status')}</th>
              <th className="p-3 text-center font-semibold text-gray-700 dark:text-gray-200">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {(orderData?.data || []).map((order) => (
              <tr key={order.order_id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${order.is_cancelled ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                <td className="p-3">
                   <div className="font-mono font-semibold text-blue-600 dark:text-blue-400">{order.order_no}</div>
                   <div className="text-[10px] uppercase font-bold text-gray-400">{order.sale_type}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-gray-900 dark:text-white">{order.customer_name}</div>
                  <div className="text-xs text-gray-500">{order.order_tel}</div>
                </td>
                <td className="p-3">
                  <div className="text-gray-900 dark:text-gray-200">{formatDate(order.order_date)}</div>
                  <div className="text-[10px] text-gray-400">{dayjs(order.order_date).fromNow()}</div>
                </td>
                <td className="p-3 text-center">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    {order.items?.length || 0}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(order.order_total)}
                </td>
                <td className="p-3 text-center">
                  {getPaymentStatusBadge(order.order_payment_status)}
                </td>
                <td className="p-3 text-center">
                  {getStatusBadge(order)}
                </td>
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => order.sale_type === "sale" ? navigate("receipt/" + order.order_id) : navigate("invoice/" + order.order_id)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors"
                      title={t('view')}
                    ><LuEye size={14} /></button>
                    
                    {!order.is_cancelled && (
                      <button
                        onClick={() => navigate("edit/" + order.order_id)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
                        title={t('edit')}
                      ><LuFileText size={14} /></button>
                    )}

                    {!order.is_cancelled && order.balance > 0 && (
                      <button
                        onClick={() => {
                          setPaymentAmount(order.balance);
                          setBalanceAmount({ pay: order.payment, balance: order.balance });
                          setId(order.order_id);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 transition-colors"
                        title={t('pay')}
                      ><LuCreditCard size={14} /></button>
                    )}

                    {!order.is_cancelled ? (
                      <button
                        onClick={() => handleOrderCancel(order.order_id)}
                        className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-200 transition-colors"
                        title={t('cancel')}
                      ><LuBan size={14} /></button>
                    ) : (
                      <button
                        onClick={() => handleOrderUncancel(order.order_id)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors"
                        title={t('uncancel')}
                      ><LuRotateCcw size={14} /></button>
                    )}

                    <button
                      onClick={() => handleDelete(order.order_id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition-colors"
                      title={t('delete')}
                    ><LuTrash2 size={14} /></button>
                  </div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {(orderData?.data || []).map((order) => (
        <div
          
          className={`border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${order.is_cancelled ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{order.order_no}</span>
              {getStatusBadge(order)}
            </div>

            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center text-blue-600 font-bold">
                 {order.customer_name?.charAt(0)}
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{order.customer_name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <LuPhone size={10} /> {order.order_tel}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{order.items?.length || 0}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{t('items')}</div>
                </div>
                <div className="text-center border-l border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-bold text-green-600">{formatCurrency(order.order_total)}</div>
                  <div className="text-[10px] text-gray-500 uppercase">{t('total')}</div>
                </div>
            </div>

            <div className="space-y-1.5 mb-4 text-xs text-gray-600 dark:text-gray-400">
               <div className="flex justify-between">
                  <span>{t('paidAmount')}</span>
                  <span className="text-blue-600 font-medium">{formatCurrency(order.payment)}</span>
               </div>
               <div className="flex justify-between">
                  <span>{t('balance')}</span>
                  <span className="text-orange-600 font-medium">{formatCurrency(order.balance)}</span>
               </div>
               <div className="flex justify-between pt-1 border-t dark:border-gray-700">
                  <span>{t('paymentStatus')}</span>
                  {getPaymentStatusBadge(order.order_payment_status)}
               </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
               <div className="text-[10px] text-gray-400 flex items-center gap-1">
                 <LuCalendar size={10} /> {formatDate(order.order_date)}
               </div>
               <div className="flex gap-1">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => order.sale_type === "sale" ? navigate("receipt/" + order.order_id) : navigate("invoice/" + order.order_id)}
                      className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors"
                      title={t('view')}
                    ><LuEye size={14} /></button>
                    
                    {!order.is_cancelled && (
                      <button
                        onClick={() => navigate("edit/" + order.order_id)}
                        className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 transition-colors"
                        title={t('edit')}
                      ><LuFileText size={14} /></button>
                    )}

                    {!order.is_cancelled && order.balance > 0 && (
                      <button
                        onClick={() => {
                          setPaymentAmount(order.balance);
                          setBalanceAmount({ pay: order.payment, balance: order.balance });
                          setId(order.order_id);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-200 transition-colors"
                        title={t('pay')}
                      ><LuCreditCard size={14} /></button>
                    )}

                    {!order.is_cancelled ? (
                      <button
                        onClick={() => handleOrderCancel(order.order_id)}
                        className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-200 transition-colors"
                        title={t('cancel')}
                      ><LuBan size={14} /></button>
                    ) : (
                      <button
                        onClick={() => handleOrderUncancel(order.order_id)}
                        className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors"
                        title={t('uncancel')}
                      ><LuRotateCcw size={14} /></button>
                    )}

                    <button
                      onClick={() => handleDelete(order.order_id)}
                      className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition-colors"
                      title={t('delete')}
                    ><LuTrash2 size={14} /></button>
                  </div>
               </div>
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
      className="min-h-screen bg-transparent p-4 md:p-6 view-page"
    >
      <AlertBox isOpen={alertBox} title={t("deleteOrderTitle")} message={t("deleteOrderMessage")} onConfirm={handleConfirmDelete} onCancel={handleCancel} confirmText={t("delete")} cancelText={t("cancel")} confirmColor="error" />
      <AlertBox isOpen={alertBoxCancel} title={t("cancelOrderTitle")} message={t("cancelOrderMessage")} onConfirm={handleConfirmCancelOrder} onCancel={handleCancel} confirmText={t("cancelOrderAction")} cancelText={t("keepOrder")} confirmColor="warning" />
      <AlertBox isOpen={alertBoxUncancel} title={t("uncancelOrderTitle")} message={t("uncancelOrderMessage")} onConfirm={handleConfirmUncancelOrder} onCancel={handleCancel} confirmText={t("uncancelOrder")} cancelText={t("keepCancelled")} confirmColor="info" />

      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-sm">
                <LuShoppingBag className="text-xl text-white" />
              </div>
              {t('orderList')}
            </motion.h1>
            <p className="text-gray-600 dark:text-gray-400 text-md">{t('manageTrackOrders')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => refetch()} disabled={queryLoading || contextLoading} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-2 transition-colors shadow-sm">
              <LuRefreshCw className={queryLoading ? 'animate-spin' : ''} />
              {t('refresh')}
            </button>
            <Link to="/orders">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors shadow-md">
                <LuPlus /> {t('addNewOrder')}
              </button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard title={t('totalSales')} value={formatCurrency(stats.totalSales)} icon={<LuDollarSign className="text-2xl" />} color="green" />
          <StatCard title={t('totalPaid')} value={formatCurrency(stats.totalPaid)} icon={<LuCreditCard className="text-2xl" />} color="blue" />
          <StatCard title={t('totalBalance')} value={formatCurrency(stats.totalBalance)} icon={<LuClipboardList className="text-2xl" />} color="orange" />
          <StatCard title={t('totalOrders')} value={stats.orderCount.toLocaleString()} icon={<LuPackage className="text-2xl" />} color="purple" />
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border text-sm border-gray-200 dark:border-gray-700 p-4 mb-6 transition-colors">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8">
              <div className="relative">
                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchOrdersPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 transition-colors">
                <button
                  onClick={() => { setViewMode('list'); localStorage.setItem("orderViewMode", "list"); }}
                  className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  <LuList /> <span>{t('table')}</span>
                </button>
                <button
                  onClick={() => { setViewMode('grid'); localStorage.setItem("orderViewMode", "grid"); }}
                  className={`flex-1 px-3 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  <LuPackage /> <span>{t('grid')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {queryLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('loadingOrders')}...</p>
          </div>
        ) : (orderData?.data || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800/50">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <LuShoppingBag className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">{t('noOrdersFound')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">{t('getStartedByCreatingFirstOrder')}</p>
            <Link to="/orders">
              <button className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 transition-colors">
                <LuPlus /> {t('createFirstOrder')}
              </button>
            </Link>
          </div>
        ) : (
          viewMode === 'list' ? <TableView /> : (
            <>
              <GridView />
              <div className="mt-6">
                <Pagination />
              </div>
            </>
          )
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <LuCreditCard className="text-green-500" /> {t('addPayment')}
            </h3>
            <div className="flex justify-between py-2 border-b dark:border-gray-700 mb-4">
              <div className="text-xs text-gray-500 uppercase">{t('balance')}: <span className="text-red-500 font-bold ml-1">{formatCurrency(balanceAmount.balance)}</span></div>
              <div className="text-xs text-gray-500 uppercase">{t('paid')}: <span className="text-green-500 font-bold ml-1">{formatCurrency(balanceAmount.pay)}</span></div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">{t('amount')} <LuDollarSign size={14} /></label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" step="0.01" min="0" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('cancel')}</button>
                <button onClick={handlePaymentOrder} disabled={contextLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {contextLoading ? t('processing') : t('addPayment')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OrderList;
