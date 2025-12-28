import React, { useEffect, useState } from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { Link, useNavigate } from "react-router";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { motion } from "framer-motion";
import {
  useCancelOrderMutation,
  useDeleteOrderMutation,
  useGetAllOrderQuery,
  useUncancelOrderMutation,
} from "../../../app/Features/ordersSlice";
import { Tag, Card, Badge, Tooltip, Empty, Button, Statistic } from "antd";
import {
  FaReceipt,
  FaEdit,
  FaBan,
  FaUndo,
  FaTrash,
  FaTruck,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaCreditCard,
  FaShoppingBag
} from "react-icons/fa";
import { toast } from "react-toastify";
import { totalSum } from "../../services/serviceFunction";

const { Countdown } = Statistic;

const OrderList = () => {
  const navigator = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [data, setData] = useState([]);
  const [id, setId] = useState(0);
  const [alertBox, setAlertBox] = useState(false);
  const [alertBoxCancel, setAlertBoxCancel] = useState(false);
  const [alertBoxUncancel, setAlertBoxUncancel] = useState(false);
  const [viewMode, setViewMode] = useState(localStorage.getItem("orderViewMode") || "list");
  const {
    setLoading,
    loading,
  } = useOutletsContext();
  const token = localStorage.getItem("token");
  const {
    data: orderData,
    isLoading,
    isError,
    refetch,
  } = useGetAllOrderQuery(token);
  const [deleteOrder] = useDeleteOrderMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [uncancelOrder] = useUncancelOrderMutation();

  useEffect(() => {
    setOrderItems(orderData?.data || []);
    setData(orderData?.data || []);
  }, [orderData]);

  function handleOrderCancel(order_id) {
    setAlertBoxCancel(true);
    setId(order_id);
  }

  function handleOrderUncancel(order_id) {
    setAlertBoxUncancel(true);
    setId(order_id);
  }

  function handleDelete(order_id) {
    setAlertBox(true);
    setId(order_id);
  }

  function handleCancel() {
    setAlertBox(false);
    setAlertBoxCancel(false);
    setAlertBoxUncancel(false);
  }

  async function handleConfirm() {
    try {
      setAlertBox(false);
      setLoading(true);
      const res = await deleteOrder({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || "Order deleted successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Order item delete fail!");
      setLoading(false);
    }
  }

  async function handleCancelOrder() {
    try {
      setAlertBoxCancel(false);
      setLoading(true);
      const res = await cancelOrder({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || "Order canceled successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Order item cancel fail!");
      setLoading(false);
    }
  }

  async function handleUncancelOrder() {
    try {
      setAlertBoxUncancel(false);
      setLoading(true);
      const res = await uncancelOrder({ id, token });
      if (res.data.status === 200) {
        refetch();
        toast.success(res.data.message || "Order uncanceled successfully!");
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.message || error || "Order item uncancel fail!");
      setLoading(false);
    }
  }

  function onSearch(event) {
    const value = event.target.value;
    if (value) {
      const filterItem = data.filter((item) =>
        item.order_no.toLowerCase().includes(value.toLowerCase()) ||
        item.customer_name?.toLowerCase().includes(value.toLowerCase()) ||
        item.order_tel?.includes(value)
      );
      setOrderItems(filterItem);
    } else {
      setOrderItems(data);
    }
  }

  const getStatusColor = (status, isCancelled) => {
    if (isCancelled) return "red";
    if (status === 2) return "blue";
    return "green";
  };

  const getStatusText = (status, isCancelled) => {
    if (isCancelled) return "Cancelled";
    if (status === 2) return "Online";
    return "Direct";
  };

  const getPaymentStatusColor = (status) => {
    return status === "paid" ? "green" : "orange";
  };

  const getSaleTypeColor = (type) => {
    return type === "sale" ? "blue" : "purple";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("orderViewMode", mode);
  };

  const getItemsSummary = (items) => {
    const totalItems = items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalValue = items?.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) || 0;
    return { totalItems, totalValue };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      {/* Alert Boxes */}
      <AlertBox
        isOpen={alertBox}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
      <AlertBox
        isOpen={alertBoxCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        onConfirm={handleCancelOrder}
        onCancel={handleCancel}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        confirmColor="warning"
      />
      <AlertBox
        isOpen={alertBoxUncancel}
        title="Uncancel Order"
        message="Are you sure you want to uncancel this order?"
        onConfirm={handleUncancelOrder}
        onCancel={handleCancel}
        confirmText="Uncancel Order"
        cancelText="Keep Cancelled"
        confirmColor="info"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order List</h1>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <Tooltip title="Grid View">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <IoIosGrid size={20} />
                </button>
              </Tooltip>
              <Tooltip title="List View">
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <IoIosList size={20} />
                </button>
              </Tooltip>
            </div>

            <Link to="/dashboard/orders">
              <button className="btn btn-success bg-green-600 border-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200">
                Add New Order
              </button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative max-w-md">
            <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search orders by order number, customer name, or phone..."
              onChange={onSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-700 font-medium">
            {orderItems.length} orders found
          </span>
        </div>

        {orderItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${formatCurrency(totalSum(orderItems, "order_total"))}
                </div>
                <div className="text-sm text-gray-600">Total Sales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  ${formatCurrency(totalSum(orderItems, "payment"))}
                </div>
                <div className="text-sm text-gray-600">Total Paid</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ${formatCurrency(totalSum(orderItems, "balance"))}
                </div>
                <div className="text-sm text-gray-600">Total Balance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {orderItems.length}
                </div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orderItems.map((order, index) => {
              const itemsSummary = getItemsSummary(order.items);
              return (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className={`h-full border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${order.is_cancelled ? "border-red-200 bg-red-50" : "border-gray-200"
                      }`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge
                          count={getStatusText(order.status, order.is_cancelled)}
                          color={getStatusColor(order.status, order.is_cancelled)}
                          className="mb-2"
                        />
                        <h3 className="font-bold text-lg text-gray-800">{order.order_no}</h3>
                        <p className="text-sm text-gray-500">{order.order_date}</p>
                      </div>
                      <Tag color={getSaleTypeColor(order.sale_type)}>
                        {order.sale_type.toUpperCase()}
                      </Tag>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        <span className="font-medium">{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        <span>{order.order_tel}</span>
                      </div>
                      {order.order_address && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">{order.order_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Items Summary */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1">
                          <FaShoppingBag className="text-gray-400" />
                          <span>{itemsSummary.totalItems} items</span>
                        </div>
                        <span className="font-semibold">${formatCurrency(itemsSummary.totalValue)}</span>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(order.order_subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span className="text-red-600">-${formatCurrency(order.order_discount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery:</span>
                        <span>${formatCurrency(order.delivery_fee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">${formatCurrency(order.order_total)}</span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex justify-between items-center mb-4">
                      <Tag color={getPaymentStatusColor(order.order_payment_status)}>
                        {order.order_payment_status.toUpperCase()}
                      </Tag>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Paid: ${formatCurrency(order.payment)}</div>
                        <div className="text-sm text-gray-600">Balance: ${formatCurrency(order.balance)}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Tooltip title="View Details">
                        <button
                          onClick={() => {
                            order.sale_type === "sale"
                              ? navigator("receipt/" + order.order_id)
                              : navigator("invoice/" + order.order_id);
                          }}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-1"
                        >
                          <FaReceipt />
                          Details
                        </button>
                      </Tooltip>

                      {!order.is_cancelled && order.status !== 2 && (
                        <Tooltip title="Edit Order">
                          <button
                            onClick={() => navigator("edit/" + order.order_id)}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <FaEdit />
                          </button>
                        </Tooltip>
                      )}

                      {!order.is_cancelled ? (
                        <Tooltip title="Cancel Order">
                          <button
                            onClick={() => handleOrderCancel(order.order_id)}
                            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <FaBan />
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Uncancel Order">
                          <button
                            onClick={() => handleOrderUncancel(order.order_id)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <FaUndo />
                          </button>
                        </Tooltip>
                      )}

                      <Tooltip title="Delete Order">
                        <button
                          onClick={() => handleDelete(order.order_id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </Tooltip>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}


        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Payment</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orderItems.map((order) => {
                    const itemsSummary = getItemsSummary(order.items);
                    return (
                      <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{order.order_no}</div>
                            <Tag color={getSaleTypeColor(order.sale_type)} className="!m-0 mt-1">
                              {order.sale_type}
                            </Tag>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.order_tel}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.order_date}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">{itemsSummary.totalItems} items</div>
                            <div className="text-gray-500">${formatCurrency(itemsSummary.totalValue)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-green-600">
                            ${formatCurrency(order.order_total)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <Tag color={getPaymentStatusColor(order.order_payment_status)}>
                              {order.order_payment_status}
                            </Tag>
                            <div className="text-xs text-gray-500 mt-1">
                              Paid: ${formatCurrency(order.payment)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            status={order.is_cancelled ? "error" : order.status === 2 ? "processing" : "success"}
                            text={getStatusText(order.status, order.is_cancelled)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Tooltip title="View Details">
                              <button
                                onClick={() => {
                                  order.sale_type === "sale"
                                    ? navigator("receipt/" + order.order_id)
                                    : navigator("invoice/" + order.order_id);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <FaReceipt />
                              </button>
                            </Tooltip>

                            {!order.is_cancelled && order.status !== 2 && (
                              <Tooltip title="Edit Order">
                                <button
                                  onClick={() => navigator("edit/" + order.order_id)}
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                  <FaEdit />
                                </button>
                              </Tooltip>
                            )}

                            {!order.is_cancelled ? (
                              <Tooltip title="Cancel Order">
                                <button
                                  onClick={() => handleOrderCancel(order.order_id)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                  <FaBan />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Uncancel Order">
                                <button
                                  onClick={() => handleOrderUncancel(order.order_id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <FaUndo />
                                </button>
                              </Tooltip>
                            )}

                            <Tooltip title="Delete Order">
                              <button
                                onClick={() => handleDelete(order.order_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {orderItems.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Empty
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              description={
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500">
                    {data.length === 0 ? "Get started by creating your first order" : "No orders match your search criteria"}
                  </p>
                </div>
              }
            >
              <Link to="/dashboard/orders">
                <Button type="primary" size="large" icon={<FaShoppingBag />}>
                  Create First Order
                </Button>
              </Link>
            </Empty>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderList;