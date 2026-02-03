import React, { useEffect, useRef, useState } from "react";
import { IoIosSearch, IoIosList, IoIosGrid, IoMdFunnel } from "react-icons/io";
import { Link } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { motion, AnimatePresence } from "framer-motion";
import {
  useCancelPurchaseMutation,
  useConfirmPurchaseMutation,
  useDeletePurchaseMutation,
  useGetAllPurchaseQuery,
  useUncancelPurchaseMutation,
} from "../../../app/Features/purchasesSlice";
import { Atom } from "react-loading-indicators";
import api from "../../services/api";
import { Tag, Card, Input, Select, Button, DatePicker, Tooltip, Empty } from "antd";
import { toast } from "react-toastify";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllStockQuery } from "../../../app/Features/stocksSlice";
import {
  FaDollarSign,
  FaUser,
  FaPlus,
  FaDownload,
  FaShoppingCart,
  FaBalanceScale,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEllipsisV,
  FaArrowRight
} from "react-icons/fa";
import dayjs from 'dayjs';
import { LuRefreshCw } from "react-icons/lu";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Purchases = () => {
  // ... (Keep existing logic/states/functions same)
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const { refetch: salesRefetch } = useGetAllSaleQuery(token);
  const { refetch: stockRefetch } = useGetAllStockQuery(token);
  const { setLoading, loading } = useOutletsContext();
  const { data, isLoading, refetch } = useGetAllPurchaseQuery(token);
  const [deletePurchase] = useDeletePurchaseMutation();
  const [cancelPurchase] = useCancelPurchaseMutation();
  const [uncancelPurchase] = useUncancelPurchaseMutation();
  const [confirmPurchase] = useConfirmPurchaseMutation();

  useEffect(() => {
    setPurchases(data?.data || []);
    setFilteredPurchases(data?.data || []);
  }, [data?.data]);

  useEffect(() => {
    applyFilters();
  }, [purchases, searchTerm, statusFilter, dateRange]);

  const applyFilters = () => {
    let result = [...purchases];
    if (searchTerm) {
      result = result.filter((p) =>
        p.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status.toString() === statusFilter);
    }
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      result = result.filter((p) => {
        const d = new Date(p.purchase_date);
        return d >= start && d <= end;
      });
    }
    setFilteredPurchases(result);
  };

  const stats = (() => {
    const totalAmount = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const totalBalance = filteredPurchases.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);
    return {
      total: filteredPurchases.length,
      amount: totalAmount,
      balance: totalBalance,
      pending: filteredPurchases.filter(i => i.status === 0).length
    };
  })();

  // const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getStatusConfig = (status) => {
    switch (status) {
      case 0: return { color: "orange", text: "Pending", icon: <FaClock />, bg: 'bg-orange-50' };
      case 1: return { color: "green", text: "Received", icon: <FaCheckCircle />, bg: 'bg-green-50' };
      case 2: return { color: "red", text: "Cancelled", icon: <FaTimesCircle />, bg: 'bg-red-50' };
      default: return { color: "default", text: "Unknown", icon: null, bg: 'bg-gray-50' };
    }
  };

  // ... (Include your existing handleConfirm, handlePurchase, etc functions)


  // Calculate statistics
  const calculateStats = () => {
    const totalPurchases = filteredPurchases.length;
    const totalAmount = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const totalPaid = filteredPurchases.reduce((sum, item) => sum + (Number(item.total_paid) || 0), 0);
    const totalBalance = filteredPurchases.reduce((sum, item) => sum + (Number(item.balance) || 0), 0);
    const pendingPurchases = filteredPurchases.filter(item => item.status === 0).length;
    const completedPurchases = filteredPurchases.filter(item => item.status === 1).length;

    return {
      totalPurchases,
      totalAmount,
      totalPaid,
      totalBalance,
      pendingPurchases,
      completedPurchases
    };
  };

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
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Failed to delete purchase!");
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
        toast.success("Cancel purchase successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Failed to cancel purchase!");
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
        toast.success("Uncancel purchase successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Failed to uncancel purchase!");
      setLoading(false);
    }
  }

  async function handlePurchaseConfirm() {
    try {
      setAlertBoxConfirm(false);
      setLoading(true);
      const res = await confirmPurchase({ id, token });
      if (res.data.status === 200) {
        salesRefetch();
        stockRefetch();
        refetch();
        toast.success("Confirm purchase successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Failed to confirm purchase!");
      setLoading(false);
    }
  }

  function onSearch(event) {
    setSearchTerm(event.target.value);
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.data.status === 200) {
        refetch();
        toast.success("Payment added successfully!");
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setPaymentDate("");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Failed to add payment!");
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 0:
        return <Tag color="orange" icon={<FaClock />}>កំពុងបញ្ជាទិញ</Tag>;
      case 1:
        return <Tag color="green" icon={<FaCheckCircle />}>ទទួលបានទំនិញ</Tag>;
      case 2:
        return <Tag color="red" icon={<FaTimesCircle />}>បោះបង់ការបញ្ជាទិញ</Tag>;
      default:
        return <Tag color="gray">មិនស្គាល់</Tag>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return 'bg-orange-50 border-orange-200';
      case 1: return 'bg-green-50 border-green-200';
      case 2: return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 lg:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 mt-1">Monitor and manage your procurement workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<LuRefreshCw />}
            onClick={refetch}
            className="border-none shadow-sm hover:text-blue-600 h-10 px-4"
          >
            Refresh
          </Button>
          <Link to="/dashboard/add-purchase">
            <Button
              type="primary"
              icon={<FaPlus />}
              className="h-10 px-6 bg-blue-600 shadow-md shadow-blue-100 border-none rounded-lg"
            >
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Orders', value: stats.total, icon: <FaShoppingCart />, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Amount', value: formatCurrency(stats.amount), icon: <FaDollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Outstanding Balance', value: formatCurrency(stats.balance), icon: <FaBalanceScale />, color: 'text-rose-600', bg: 'bg-rose-100' },
          { label: 'Pending Arrival', value: stats.pending, icon: <FaClock />, color: 'text-amber-600', bg: 'bg-amber-100' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} text-xl`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-400"}`}
            >
              <IoIosList size={20} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-400"}`}
            >
              <IoIosGrid size={20} />
            </button>
          </div>
          <Input
            placeholder="Search ID or supplier..."
            prefix={<IoIosSearch className="text-slate-400" />}
            className="h-10 rounded-xl bg-slate-50 border-none w-full md:w-64"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Select
            defaultValue="all"
            className="w-full sm:w-40 h-10 custom-select"
            onChange={setStatusFilter}
            prefix={<IoMdFunnel />}
          >
            <Option value="all">All Status</Option>
            <Option value="0">Pending</Option>
            <Option value="1">Completed</Option>
            <Option value="2">Cancelled</Option>
          </Select>
          <RangePicker
            className="h-10 rounded-xl border-slate-200 w-full sm:w-auto"
            onChange={setDateRange}
          />
          <Tooltip title="Export Data">
            <Button icon={<FaDownload />} className="h-10 w-10 flex items-center justify-center rounded-xl" />
          </Tooltip>
        </div>
      </div>

      {/* CONTENT AREA */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Atom color="#2563eb" size="medium" />
            <p className="mt-4 text-slate-500 font-medium">Fetching Records...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 border border-dashed border-slate-200 flex flex-col items-center">
            <Empty description="No Purchase Records Found" />
          </div>
        ) : viewMode === "list" ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Purchase ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Supplier</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPurchases.map((item) => {
                  const config = getStatusConfig(item.status);
                  return (
                    <tr key={item.purchase_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700">{item.purchase_no}</span>
                        <div className="text-[11px] text-slate-400 mt-0.5">{dayjs(item.purchase_date).format('DD MMM YYYY')}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-500 uppercase">
                            {item.supplier_name.charAt(0)}
                          </div>
                          {item.supplier_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{formatCurrency(item.total_amount)}</div>
                        <div className={`text-[11px] font-semibold ${item.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {item.balance > 0 ? `Unpaid: ${formatCurrency(item.balance)}` : 'Fully Paid'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Tag color={config.color} className="rounded-full px-3 border-none font-medium flex items-center gap-1 w-fit">
                          {config.icon} {config.text}
                        </Tag>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.status === 0 && (
                            <Tooltip title="Mark as Received">
                              <Button size="small" className="bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                onClick={() => handlePurchase(item.purchase_id, "confirm")} icon={<FaCheckCircle />} />
                            </Tooltip>
                          )}
                          <Link to={"receipt/" + item.purchase_id}>
                            <Button size="small" icon={<FaArrowRight />} className="border-slate-200 text-slate-500">Details</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPurchases.map((item) => (
              <motion.div
                layout key={item.purchase_id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-1 h-full ${getStatusConfig(item.status).color === 'orange' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">#{item.purchase_no}</span>
                    <h3 className="mt-2 font-bold text-slate-800 text-lg leading-tight">{item.supplier_name}</h3>
                  </div>
                  <Tag className="m-0 border-none rounded-full">{getStatusConfig(item.status).icon}</Tag>
                </div>

                <div className="space-y-3 border-y border-slate-50 py-4 my-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Date</span>
                    <span className="text-slate-700 font-medium">{item.purchase_date}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total</span>
                    <span className="text-slate-800 font-bold">{formatCurrency(item.total_amount)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={"receipt/" + item.purchase_id} className="flex-1">
                    <Button block className="rounded-lg font-medium">Receipt</Button>
                  </Link>
                  <Button type="primary" className="bg-slate-800 border-none flex-1 rounded-lg">Manage</Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* RETAIN YOUR MODALS (Payment, AlertBox) - Apply similar styling to the modal containers */}
      <AlertBox isOpen={alertBox} title="Delete Purchase" message="Delete this order permanently?" onConfirm={handleConfirm} onCancel={handleCancel} confirmText="Delete" cancelText="Cancel" />
      {/* ... other AlertBoxes */}
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

    </div>
  );
};

export default Purchases;