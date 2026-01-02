import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaDollarSign,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaBox,
  FaTruck,
  FaPercent,
  FaWarehouse,
  FaTag,
  FaReceipt,
  FaEdit,
  FaLayerGroup
} from "react-icons/fa";
import axios from "axios";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import api from "../../services/api";
import { useGetAllSupplierQuery } from "../../../app/Features/suppliesSlice";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { useGetAllPurchaseQuery } from "../../../app/Features/purchasesSlice";
import { DatePicker, Input, Select, Card, Badge, Tag, Divider } from "antd";
const { Option } = Select;
import dayjs from "dayjs";
import { motion } from "framer-motion";

const CreatePurchase = () => {
  const { id: purchaseId } = useParams();
  const isEditMode = !!purchaseId;

  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    sub_total: 0,
    tax_rate: 0,
    tax_amount: 0,
    shipping_fee: 0,
    total_amount: 0,
    total_paid: 0,
    balance: 0,
    status: 'Pending',
    items: [],
    payments: [],
  });

  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [attributes, setAttributes] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const { data: itemData } = useGetAllItemsQuery(token);
  const { data: supplierData } = useGetAllSupplierQuery(token);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const { refetch } = useGetAllPurchaseQuery(token);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setSuppliers(supplierData?.data || []);
    setItems(itemData?.data || []);
  }, [itemData, supplierData]);

  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  useEffect(() => {
    if (isEditMode && purchaseId && token) {
      const fetchPurchase = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/purchase/${purchaseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const purchase = response.data.data;

          setFormData({
            supplier_id: purchase.supplier_id || "",
            purchase_date: purchase.purchase_date,
            sub_total: parseFloat(purchase.sub_total) || 0,
            tax_rate: parseFloat(purchase.tax_rate) || 0,
            tax_amount: parseFloat(purchase.tax_amount) || 0,
            shipping_fee: parseFloat(purchase.shipping_fee) || 0,
            total_amount: parseFloat(purchase.total_amount) || 0,
            total_paid: parseFloat(purchase.total_paid) || 0,
            balance: parseFloat(purchase.balance) || 0,
            status: purchase.status === 1 ? 'Completed' : purchase.status === 2 ? 'Cancelled' : 'Pending',
            items: purchase.details.map((detail) => ({
              item_id: detail.item_id,
              quantity: parseFloat(detail.quantity),
              item_cost: parseFloat(detail.item_cost),
              attributes: detail.attributes || [],
              name: detail.item_name,
              code: detail.item_code,
              image: detail.images?.[0]?.image || null,
            })),
            payments: purchase.payments.map((p) => ({
              amount: parseFloat(p.amount),
              paid_at: p.paid_at.split(" ")[0],
            })),
          });

          setLoading(false);
        } catch (err) {
          toast.error("Failed to load purchase data.");
          console.error(err);
        }
      };

      fetchPurchase();
    }
  }, [isEditMode, purchaseId, token]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.shipping_fee]);

  const validateField = (name, value) => {
    const newFieldErrors = { ...fieldErrors };

    switch (name) {
      case 'supplier_id':
        if (!value) {
          newFieldErrors.supplier_id = 'Supplier is required';
        } else {
          delete newFieldErrors.supplier_id;
        }
        break;
      case 'purchase_date':
        if (!value) {
          newFieldErrors.purchase_date = 'Purchase date is required';
        } else if (new Date(value) > new Date()) {
          newFieldErrors.purchase_date = 'Purchase date cannot be in the future';
        } else {
          delete newFieldErrors.purchase_date;
        }
        break;
      case 'tax_rate':
        if (value && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 100)) {
          newFieldErrors.tax_rate = 'Tax rate must be between 0 and 100';
        } else {
          delete newFieldErrors.tax_rate;
        }
        break;
      case 'shipping_fee':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newFieldErrors.shipping_fee = 'Shipping fee must be a non-negative number';
        } else {
          delete newFieldErrors.shipping_fee;
        }
        break;
      default:
        break;
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    const newFieldErrors = { ...fieldErrors };

    if (!formData.supplier_id) {
      newErrors.supplier = "Please select a supplier.";
      newFieldErrors.supplier_id = 'Supplier is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required.";
    }

    formData.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors.items = `Item ${index + 1} has invalid quantity`;
      }
      if (item.item_cost <= 0) {
        newErrors.items = `Item ${index + 1} has invalid unit price`;
      }
    });

    if (formData.payments.length > 0) {
      const invalidPayment = formData.payments.find(payment =>
        payment.amount <= 0 || !payment.paid_at
      );
      if (invalidPayment) {
        newErrors.payments = "All payments must have valid amount and date.";
      }

      if (formData.total_paid > formData.total_amount) {
        newErrors.payments = "Total paid cannot exceed total amount.";
      }
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required.";
      newFieldErrors.purchase_date = 'Purchase date is required';
    } else if (new Date(formData.purchase_date) > new Date()) {
      newErrors.purchase_date = "Purchase date cannot be in the future.";
      newFieldErrors.purchase_date = 'Purchase date cannot be in the future';
    }

    if (formData.total_amount <= 0) {
      newErrors.financial = "Total amount must be greater than 0.";
    }

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const addItemToPurchase = () => {
    if (!selectedItem) {
      setErrors({ itemModal: "Please select an item." });
      return;
    }

    if (quantity <= 0) {
      setErrors({ itemModal: "Please enter a valid quantity (greater than 0)." });
      return;
    }

    if (itemCost <= 0) {
      setErrors({ itemModal: "Please enter a valid unit price (greater than 0)." });
      return;
    }

    const newItem = {
      item_id: selectedItem.id,
      quantity,
      item_cost: itemCost,
      attributes,
      name: selectedItem.name,
      code: selectedItem.code,
      image: selectedItem.image,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedItem(null);
    setQuantity(1);
    setItemCost(0);
    setSearchTerm("");
    setShowItemModal(false);
    setErrors({});
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      payments: [],
      balance: formData.total_amount,
      total_paid: 0
    }));
  };

  const addPayment = () => {
    if (paymentAmount <= 0) {
      setErrors({ paymentModal: "Please enter a valid payment amount (greater than 0)." });
      return;
    }

    if (!paymentDate) {
      setErrors({ paymentModal: "Please select a payment date." });
      return;
    }

    if (paymentAmount > formData.balance) {
      setErrors({ paymentModal: "Payment amount cannot exceed the remaining balance." });
      return;
    }

    const newPayment = {
      amount: paymentAmount,
      paid_at: paymentDate,
    };

    setFormData((prev) => ({
      ...prev,
      payments: [...prev.payments, newPayment],
      total_paid: prev.total_paid + paymentAmount,
      balance: prev.total_amount - (prev.total_paid + paymentAmount),
    }));

    setPaymentAmount(0);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setShowPaymentModal(false);
    setErrors({});
  };

  const removePayment = (index) => {
    const payment = formData.payments[index];
    if (formData.total_amount < formData.total_paid) {
      setFormData((prev) => ({
        ...prev,
        payments: [],
        total_paid: 0,
        balance: prev.total_amount,
      }));
    }
    else setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
      total_paid: prev.total_paid - payment.amount,
      balance: prev.total_amount - (prev.total_paid - payment.amount),
    }));
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.item_cost,
      0
    );

    const taxAmount = subTotal * (formData.tax_rate / 100);
    const totalAmount = subTotal + taxAmount + parseFloat(formData.shipping_fee || 0);
    const balance = totalAmount - (formData.total_paid || 0);

    setFormData((prev) => ({
      ...prev,
      sub_total: subTotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      balance: balance < 0 ? 0 : balance,
    }));
  };

  const handleInputChange = (name, value) => {
    validateField(name, value);

    if (name === "purchase_date") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "supplier_id") {
      setFormData((prev) => ({
        ...prev,
        supplier_id: value,
      }));
    } else if (name === "shipping_fee" || name === "tax_rate") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting.");
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        created_by: 1,
        purchase_date: formData.purchase_date,
        sub_total: parseFloat(formData.sub_total),
        tax_rate: parseFloat(formData.tax_rate) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        total_amount: parseFloat(formData.total_amount),
        total_paid: parseFloat(formData.total_paid) || 0,
        balance: parseFloat(formData.balance) || 0,
        exchange_rate: 1,
        status: formData.status === 'Completed' ? 1 : formData.status === 'Cancelled' ? 2 : 0,
        items: formData.items.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          attributes: item.attributes,
          item_cost: parseFloat(item.item_cost),
        })),
        payments: formData.payments.map((p) => ({
          amount: parseFloat(p.amount),
          paid_at: p.paid_at,
        })),
      };

      if (isEditMode) {
        await api.put(`/purchase/${purchaseId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Purchase updated successfully!");
      } else {
        await api.post("/purchase", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Purchase created successfully!");
      }

      refetch();
      navigator("/dashboard/purchases");
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Error ${isEditMode ? 'updating' : 'creating'} purchase.`;
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {isEditMode ? "Edit Purchase Order" : "Create New Purchase"}
              </h1>
              <p className="text-gray-600 mt-2">
                {isEditMode ? "Update purchase order details" : "Add new purchase order to the system"}
              </p>
            </div>
            <Badge
              count={isEditMode ? "EDIT MODE" : "NEW"}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
              style={{
                backgroundColor: isEditMode ? '#3b82f6' : '#10b981',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-red-200 bg-red-50 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FaExclamationTriangle className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
                    <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                      {Object.values(errors).map((error, index) => (
                        error && <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form Sections */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier & Date Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg border-0">
                  <div className="flex items-center gap-2 mb-4">
                    <FaWarehouse className="text-blue-500" />
                    <h2 className="text-lg font-bold text-gray-800">Supplier Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <FaTag className="text-gray-400" />
                          Supplier <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <Select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={(value) => handleInputChange('supplier_id', value)}
                        className={`w-full ${fieldErrors.supplier_id ? 'border-red-500' : ''}`}
                        placeholder="Select Supplier"
                        size="large"
                      >
                        {suppliers?.map((supplier) => (
                          <Option key={supplier?.supplier_id} value={supplier?.supplier_id}>
                            <div className="flex items-center gap-3">
                              <img
                                src={supplier?.image}
                                alt={supplier?.supplier_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium">{supplier?.supplier_name}</div>
                                <div className="text-xs text-gray-500">{supplier?.supplier_tel}</div>
                              </div>
                            </div>
                          </Option>
                        ))}
                      </Select>
                      {fieldErrors.supplier_id && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.supplier_id}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          Purchase Date <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <DatePicker
                        name="purchase_date"
                        value={formData.purchase_date ? dayjs(formData.purchase_date) : null}
                        onChange={(date, dateString) => handleInputChange('purchase_date', dateString)}
                        className={`w-full ${fieldErrors.purchase_date ? 'border-red-500' : ''}`}
                        size="large"
                        format="YYYY-MM-DD"
                      />
                      {fieldErrors.purchase_date && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.purchase_date}</div>
                      )}
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <FaReceipt className="text-gray-400" />
                        Status
                      </span>
                    </label>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={(value) => handleInputChange('status', value)}
                      className="w-full"
                      size="large"
                    >
                      <Option value="Pending">
                        <Tag color="orange">Pending</Tag>
                      </Option>
                      <Option value="Completed">
                        <Tag color="green">Completed</Tag>
                      </Option>
                      <Option value="Cancelled">
                        <Tag color="red">Cancelled</Tag>
                      </Option>
                    </Select>
                  </div>
                </Card>
              </motion.div>

              {/* Items Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="shadow-lg border-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-blue-500" />
                      <h2 className="text-lg font-bold text-gray-800">Purchase Items</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowItemModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      <FaPlus /> Add Item
                    </button>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FaBox className="text-gray-400 text-4xl mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No items added yet</p>
                      <button
                        type="button"
                        onClick={() => setShowItemModal(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Add Your First Item
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 rounded-lg border border-gray-300 overflow-hidden bg-white">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-contain p-1"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-blue-100">
                                    <FaBox className="text-blue-500" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                                  <Tag color="blue" className="text-xs">
                                    {item.code}
                                  </Tag>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>Quantity: <span className="font-bold text-gray-800">{item.quantity}</span></span>
                                  <span>Unit Cost: <span className="font-bold text-gray-800">${item.item_cost.toFixed(2)}</span></span>
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    ${(item.quantity * item.item_cost).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.items && (
                    <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                      {errors.items}
                    </div>
                  )}
                </Card>
              </motion.div>

              {/* Payments Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="shadow-lg border-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="text-green-500" />
                      <h2 className="text-lg font-bold text-gray-800">Payment Information</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                      disabled={formData.balance <= 0}
                    >
                      <FaPlus /> Add Payment
                    </button>
                  </div>

                  {formData.payments.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <FaDollarSign className="text-gray-400 text-3xl mx-auto mb-3" />
                      <p className="text-gray-500">No payments recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.payments.map((payment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div>
                            <div className="font-bold text-gray-800">${payment.amount.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Paid on {payment.paid_at}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePayment(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.payments && (
                    <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                      {errors.payments}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Summary Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg border-0 sticky top-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaLayerGroup className="text-blue-500" />
                    Purchase Summary
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-bold text-gray-800">${formData.sub_total.toFixed(2)}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 flex items-center gap-2">
                          <FaPercent className="text-gray-400" />
                          Tax ({formData.tax_rate}%)
                        </span>
                        <span className="font-bold text-gray-800">${formData.tax_amount.toFixed(2)}</span>
                      </div>
                      <Input
                        type="number"
                        name="tax_rate"
                        value={formData.tax_rate}
                        onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                        placeholder="Tax Rate %"
                        className={`w-full ${fieldErrors.tax_rate ? 'border-red-500' : ''}`}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      {fieldErrors.tax_rate && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.tax_rate}</div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 flex items-center gap-2">
                          <FaTruck className="text-gray-400" />
                          Shipping Fee
                        </span>
                        <span className="font-bold text-gray-800">${formData.shipping_fee.toFixed(2)}</span>
                      </div>
                      <Input
                        type="number"
                        name="shipping_fee"
                        value={formData.shipping_fee}
                        onChange={(e) => handleInputChange('shipping_fee', e.target.value)}
                        placeholder="Shipping Fee"
                        className={`w-full ${fieldErrors.shipping_fee ? 'border-red-500' : ''}`}
                        min="0"
                        step="0.01"
                      />
                      {fieldErrors.shipping_fee && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.shipping_fee}</div>
                      )}
                    </div>

                    <Divider className="my-4" />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-blue-600">${Number(formData.total_amount).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Paid</span>
                      <span className="font-bold text-green-600">${formData.total_paid.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Balance</span>
                      <span className={`font-bold ${formData.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        ${formData.balance.toFixed(2)}
                      </span>
                    </div>

                    <Divider className="my-4" />

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Items</div>
                        <div className="text-xl font-bold text-gray-800">{formData.items.length}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Payments</div>
                        <div className="text-xl font-bold text-gray-800">{formData.payments.length}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaSave />
                        {loading ? "Processing..." : isEditMode ? "Update Purchase" : "Create Purchase"}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FaTimes />
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </form>
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaBox className="text-blue-500" />
                  Add Item to Purchase
                </h3>
                <button
                  onClick={() => {
                    setShowItemModal(false);
                    setErrors({});
                    setSelectedItem(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>
            </div>

            {errors.itemModal && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <FaExclamationTriangle />
                  <span>{errors.itemModal}</span>
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setAttributes([]);
                        setSelectedItem(item);
                        setItemCost(item.price || 0);
                        setErrors({});
                      }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedItem?.id === item.id
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 rounded-lg border border-gray-300 overflow-hidden bg-white flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <FaBox className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600 mb-1">{item.code}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-green-600">
                              ${item.price}
                            </span>
                            {item.discount > 0 && (
                              <Tag color="green" className="text-xs">
                                {item.discount}% off
                              </Tag>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6"
                >
                  <Divider>Item Details</Divider>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        size="large"
                        min="1"
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Cost ($)
                      </label>
                      <Input
                        type="number"
                        value={itemCost}
                        onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                        size="large"
                        min="0"
                        step="0.01"
                        placeholder="Enter cost"
                      />
                    </div>
                  </div>

                  {/* Attributes Preview */}
                  {selectedItem?.attributes?.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Attributes
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.attributes.map((attr, index) => (
                          attr.type === 'select' && (
                            <div key={index} className="mb-3">
                              <div className="text-sm font-medium text-gray-600 mb-2">{attr.name}</div>
                              <div className="flex flex-wrap gap-2">
                                {attr.value?.map((val, vIdx) => (
                                  <div
                                    key={vIdx}
                                    className={` border rounded-lg text-sm ${attr.name === 'colors'
                                      ? 'w-8 h-8 rounded-full border px-3 py-2'
                                      : 'bg-gray-100 text-gray-700 px-1'
                                      }`}
                                    style={attr.name === 'colors' ? { backgroundColor: val.value } : {}}
                                    title={val.value}
                                  >{attr.name !== 'colors' && val.value}</div>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedItem(null);
                        setQuantity(1);
                        setItemCost(0);
                      }}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Change Item
                    </button>
                    <button
                      onClick={addItemToPurchase}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      <FaPlus />
                      Add to Purchase
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FaDollarSign className="text-green-500" />
                Add Payment
              </h3>
            </div>

            {errors.paymentModal && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <FaExclamationTriangle />
                  <span>{errors.paymentModal}</span>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount ($)
                </label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  size="large"
                  min="0"
                  max={formData.balance}
                  step="0.01"
                  placeholder="Enter amount"
                  prefix={<FaDollarSign className="text-gray-400" />}
                />
                <div className="text-sm text-gray-500 mt-2">
                  Remaining balance: <span className="font-bold">${formData.balance.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <DatePicker
                  value={paymentDate ? dayjs(paymentDate) : null}
                  onChange={(date, dateString) => setPaymentDate(dateString)}
                  className="w-full"
                  size="large"
                  format="YYYY-MM-DD"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setErrors({});
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPayment}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                >
                  <FaPlus />
                  Add Payment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreatePurchase;