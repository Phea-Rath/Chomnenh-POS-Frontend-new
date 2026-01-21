import React, { useEffect, useRef, useState } from "react";
import { IoIosSearch, IoIosList, IoIosGrid } from "react-icons/io";
import { Link } from "react-router";
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
import api from "../../services/api";
import { Tag, Card, Statistic, Input, Select, Button, DatePicker } from "antd";
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
  FaClock
} from "react-icons/fa";
import dayjs from 'dayjs';

import { LuRefreshCw } from "react-icons/lu";
const { RangePicker } = DatePicker;
const { Option } = Select;

const Purchases = () => {
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
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const { refetch: salesRefetch } = useGetAllSaleQuery(token);
  const { refetch: stockRefetch } = useGetAllStockQuery(token);
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } =
    useOutletsContext();
  const updateModalRef = useRef(null);
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

    // Search filter
    if (searchTerm) {
      result = result.filter((purchase) =>
        purchase.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((purchase) => purchase.status.toString() === statusFilter);
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      result = result.filter((purchase) => {
        const purchaseDate = new Date(purchase.purchase_date);
        return purchaseDate >= start && purchaseDate <= end;
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

  const stats = calculateStats();

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaShoppingCart className="text-2xl text-blue-600" />
                </div>
                Purchase Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Manage and track your purchase orders
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<LuRefreshCw />}
                onClick={refetch}
                loading={isLoading}
                className="flex items-center space-x-2"
              >
                Refresh
              </Button>
              <Button
                icon={<FaDownload />}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Export
              </Button>
              <Link to="/dashboard/add-purchase">
                <Button
                  icon={<FaPlus />}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  New Purchase
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-500 text-sm font-medium mb-2">Total Purchases</p>
                  <p className="text-3xl font-bold text-gray-500">
                    {stats.totalPurchases}
                  </p>
                </div>
                <div className="p-3 bg-blue-400 rounded-full">
                  <FaShoppingCart className="text-2xl text-blue-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-500 text-sm font-medium mb-2">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-500">
                    ${formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <div className="p-3 bg-green-400 rounded-full">
                  <FaDollarSign className="text-2xl text-green-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-500 text-sm font-medium mb-2">Total Balance</p>
                  <p className="text-3xl font-bold text-gray-500">
                    ${formatCurrency(stats.totalBalance)}
                  </p>
                </div>
                <div className="p-3 bg-purple-400 rounded-full">
                  <FaBalanceScale className="text-2xl text-purple-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-500 text-sm font-medium mb-2">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-500">
                    {stats.pendingPurchases}
                  </p>
                </div>
                <div className="p-3 bg-orange-400 rounded-full">
                  <FaClock className="text-2xl text-orange-200" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View Toggle and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 border">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "list"
                    ? "bg-white shadow-sm text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosList className="text-lg" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow-sm text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosGrid className="text-lg" />
                  <span>Grid</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search by purchase number or supplier..."
                  prefix={<IoIosSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={onSearch}
                  className="h-12 rounded-xl border-0 bg-gray-50 shadow-sm"
                  allowClear
                  size="large"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Select
                placeholder="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full sm:w-40 h-12 rounded-xl"
                allowClear
              >
                <Option value="all">All Status</Option>
                <Option value="0">Pending</Option>
                <Option value="1">Completed</Option>
                <Option value="2">Cancelled</Option>
              </Select>

              <RangePicker
                placeholder={['Start Date', 'End Date']}
                value={dateRange}
                onChange={setDateRange}
                className="h-12 rounded-xl"
                format="MMM DD, YYYY"
              />
            </div>
          </div>
        </motion.div>

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

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === "list" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purchase No</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPurchases.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-blue-600">{item.purchase_no}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            <span>{item.supplier_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.purchase_date}</td>
                        <td className="px-6 py-4 text-right font-semibold">
                          ${formatCurrency(item.total_amount)}
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${formatCurrency(item.balance)}
                        </td>
                        <td className="px-6 py-4">{getStatusTag(item.status)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.created_by_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {item.status == 0 && (
                              <Button
                                size="small"
                                type="primary"
                                onClick={() => handlePurchase(item.purchase_id, "confirm")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Receive
                              </Button>
                            )}
                            {item.status == 0 && item.balance != 0 && (
                              <Button
                                size="small"
                                onClick={() => {
                                  setShowPaymentModal(true);
                                  setPaymentAmount(item.balance);
                                  setId(item.purchase_id);
                                  setPaymentDate(new Date().toISOString().split("T")[0]);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Pay
                              </Button>
                            )}
                            <Link to={"receipt/" + item.purchase_id}>
                              <Button size="small" icon={<FaReceipt />}>
                                Receipt
                              </Button>
                            </Link>
                            <Link to={"update/" + item.purchase_id}>
                              <Button size="small" type="default">
                                Edit
                              </Button>
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
                  <Atom
                    color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]}
                    size="medium"
                    text="Loading data"
                    textColor="#327fcd"
                  />
                </div>
              )}

              {filteredPurchases.length === 0 && !isLoading && (
                <div className="text-center py-12 text-gray-500">
                  <FaBox className="mx-auto text-4xl mb-4 text-gray-300" />
                  <p className="text-lg">No purchases found</p>
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPurchases.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-sm transition-all duration-300 overflow-hidden ${getStatusColor(item.status)}`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-blue-600">
                          {item.purchase_no}
                        </h3>
                        <p className="text-sm text-gray-500">{item.purchase_date}</p>
                      </div>
                      {getStatusTag(item.status)}
                    </div>

                    {/* Supplier Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <FaUser className="text-gray-400" />
                      <span className="font-medium">{item.supplier_name}</span>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold">${formatCurrency(item.total_amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Paid:</span>
                        <span className="font-semibold text-green-600">
                          ${formatCurrency(item.total_paid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Balance:</span>
                        <span className={`font-semibold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${formatCurrency(item.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Created By */}
                    <div className="text-sm text-gray-500 mb-4">
                      Created by: {item.created_by_name}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {item.status == 0 && (
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => handlePurchase(item.purchase_id, "confirm")}
                          className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                          Receive
                        </Button>
                      )}
                      {item.status == 0 && item.balance != 0 && (
                        <Button
                          size="small"
                          onClick={() => {
                            setShowPaymentModal(true);
                            setPaymentAmount(item.balance);
                            setId(item.purchase_id);
                            setPaymentDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        >
                          Pay
                        </Button>
                      )}
                      <Link to={"receipt/" + item.purchase_id} className="flex-1">
                        <Button size="small" icon={<FaReceipt />} className="w-full">
                          Receipt
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === "grid" && isLoading && (
            <div className="h-40 flex justify-center items-center">
              <Atom
                color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]}
                size="medium"
                text="Loading data"
                textColor="#327fcd"
              />
            </div>
          )}

          {viewMode === "grid" && filteredPurchases.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <FaBox className="mx-auto text-4xl mb-4 text-gray-300" />
              <p className="text-lg">No purchases found</p>
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
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-500" />
              Add Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <FaDollarSign className="inline ml-1" />
                </label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full"
                  size="large"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <DatePicker
                  value={paymentDate ? dayjs(paymentDate) : null}
                  onChange={(date) => setPaymentDate(date ? date.format('YYYY-MM-DD') : '')}
                  className="w-full"
                  size="large"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={addPayment}
                  className="px-6 bg-green-600 hover:bg-green-700"
                  loading={loading}
                >
                  Add Payment
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Purchases;