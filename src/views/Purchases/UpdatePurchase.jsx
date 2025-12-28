import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  FaPlus,
  FaTrash,
  FaSearch,
  FaCalendarAlt,
  FaDollarSign,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import api from "../../services/api";
import { useGetAllSupplierQuery } from "../../../app/Features/suppliesSlice";
import { toast } from "react-toastify";
import { useGetAllPurchaseQuery } from "../../../app/Features/purchasesSlice";

const UpdatePurchase = () => {
  const { id } = useParams(); // Get purchase_id from URL
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    supplier_address: "",
    supplier_tel: "",
    supplier_email: "",
    purchase_date: new Date().toISOString().split("T")[0],
    sub_total: 0,
    tax_rate: 0,
    tax_amount: 0,
    shipping_fee: 0,
    total_amount: 0,
    total_paid: 0,
    balance: 0,
    status: 0,
    items: [],
    payments: [],
  });
  const [isNewSupplier, setIsNewSupplier] = useState(false);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const { data: itemData } = useGetAllItemsQuery(token);
  const { data: supplierData } = useGetAllSupplierQuery(token);
  const { refetch } = useGetAllPurchaseQuery(token);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch purchase data
  useEffect(() => {
    const fetchPurchase = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/purchase/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const purchase = response.data.data;
        setFormData({
          supplier_id: purchase.supplier_id || "",
          supplier_name: "", // Will be populated by supplier fetch
          supplier_address: "",
          supplier_tel: "",
          supplier_email: "",
          purchase_date:
            purchase.purchase_date || new Date().toISOString().split("T")[0],
          sub_total: parseFloat(purchase.sub_total) || 0,
          tax_rate: parseFloat(purchase.tax_rate) || 0,
          tax_amount: parseFloat(purchase.tax_amount) || 0,
          shipping_fee: parseFloat(purchase.shipping_fee) || 0,
          total_amount: parseFloat(purchase.total_amount) || 0,
          total_paid: parseFloat(purchase.total_paid) || 0,
          balance: parseFloat(purchase.balance) || 0,
          status: purchase.status || 0,
          items: purchase.details.map((detail) => ({
            item_id: detail.item_id,
            quantity: parseFloat(detail.quantity),
            unit_price: parseFloat(detail.unit_price),
            item_name: detail.item_name || "",
            item_code: detail.item_code || "",
            item_image: detail.item_image || "",
          })),
          payments: purchase.payments.map((payment) => ({
            amount: parseFloat(payment.amount),
            paid_at: payment.paid_at.split(" ")[0], // Extract date part
          })),
        });

        // Fetch supplier details
        if (purchase.supplier_id) {
          const supplierResponse = await api.get(
            `/suppliers/${purchase.supplier_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const supplier = supplierResponse.data.data;
          setFormData((prev) => ({
            ...prev,
            supplier_name: supplier?.supplier_name || "",
            supplier_address: supplier?.supplier_address || "",
            supplier_tel: supplier?.supplier_tel || "",
            supplier_email: supplier?.supplier_email || "",
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching purchase.");
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [id, token]);

  // Fetch suppliers and items
  useEffect(() => {
    setSuppliers(supplierData?.data || []);
    setItems(itemData?.data || []);
  }, [itemData, supplierData]);

  // Filter items based on search
  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  // Recalculate totals
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.shipping_fee]);

  const calculateTotals = () => {
    const subTotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount =
      subTotal * (formData.tax_rate / 100) || formData.tax_amount;
    const totalAmount = subTotal + taxAmount + formData.shipping_fee;
    const balance = totalAmount - formData.total_paid;

    setFormData((prev) => ({
      ...prev,
      sub_total: subTotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      balance: balance < 0 ? 0 : balance,
    }));
  };

  const addItemToPurchase = () => {
    if (!selectedItem || quantity <= 0 || unitPrice <= 0) {
      setError(
        "Please select an item and enter valid quantity and unit price."
      );
      return;
    }

    const newItem = {
      item_id: selectedItem.item_id,
      quantity,
      unit_price: unitPrice,
      item_name: selectedItem.item_name,
      item_code: selectedItem.item_code,
      item_image: selectedItem.item_image,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedItem(null);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm("");
    setShowItemModal(false);
    setError("");
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addPayment = () => {
    if (paymentAmount <= 0 || !paymentDate) {
      setError("Please enter valid payment amount and date.");
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
    setError("");
  };

  const removePayment = (index) => {
    const payment = formData.payments[index];
    setFormData((prev) => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
      total_paid: prev.total_paid - payment.amount,
      balance: prev.total_amount - (prev.total_paid - payment.amount),
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "purchase_date") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "supplier_id") {
      if (value === "new") {
        setIsNewSupplier(true);
        setFormData((prev) => ({
          ...prev,
          supplier_id: "",
          supplier_name: "",
          supplier_address: "",
          supplier_tel: "",
          supplier_email: "",
        }));
      } else {
        setIsNewSupplier(false);
        const selectedSupplier = suppliers.find(
          (supplier) => supplier.supplier_id === parseInt(value)
        );
        setFormData((prev) => ({
          ...prev,
          supplier_id: value,
          supplier_name: selectedSupplier?.supplier_name || "",
          supplier_address: selectedSupplier?.supplier_address || "",
          supplier_tel: selectedSupplier?.supplier_tel || "",
          supplier_email: selectedSupplier?.supplier_email || "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "tax_rate" || name === "shipping_fee"
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier_id && !isNewSupplier) {
      setError("Please select a supplier or add a new one.");
      return;
    }
    if (formData.items.length === 0) {
      setError("At least one item is required.");
      return;
    }
    if (isNewSupplier && !formData.supplier_name) {
      setError("Supplier name is required for a new supplier.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let supplierId = formData.supplier_id;
      if (isNewSupplier) {
        const supplierPayload = {
          supplier_name: formData.supplier_name,
          supplier_address: formData.supplier_address,
          supplier_tel: formData.supplier_tel,
          supplier_email: formData.supplier_email,
          created_by: 1,
        };
        const supplierResponse = await api.post("/suppliers", supplierPayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        supplierId = supplierResponse.data.data.supplier_id;
      }

      const payload = {
        supplier_id: supplierId,
        purchase_date: formData.purchase_date,
        sub_total: parseFloat(formData.sub_total),
        tax_rate: parseFloat(formData.tax_rate) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        total_amount: parseFloat(formData.total_amount),
        total_paid: parseFloat(formData.total_paid) || 0,
        balance: parseFloat(formData.balance) || 0,
        exchange_rate: 1,
        status: formData.status,
        items: formData.items.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
        payments: formData.payments.map((p) => ({
          amount: parseFloat(p.amount),
          paid_at: p.paid_at,
        })),
      };

      await api.put(`/purchase/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
      toast.success("Purchase updated successfully!");
      navigate("/dashbord/purchases");
    } catch (err) {
      setError(err.response?.data?.message || "Error updating purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Update Purchase #{formData.purchase_no}
        </h1>

        {loading && (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {!loading && (
          <form
            onSubmit={handleSubmit}
            className="bg-white text-xs shadow-lg rounded-lg p-6"
          >
            {/* Supplier and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  name="supplier_id"
                  value={isNewSupplier ? "new" : formData.supplier_id}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers?.map((supplier) => (
                    <option
                      key={supplier?.supplier_id}
                      value={supplier?.supplier_id}
                    >
                      {supplier?.supplier_name}
                    </option>
                  ))}
                  {/* <option value="new">Add New</option> */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                  readOnly={!isNewSupplier}
                  className={`w-full p-3 border border-gray-300 rounded-md ${
                    isNewSupplier
                      ? "focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Address
                </label>
                <input
                  type="text"
                  name="supplier_address"
                  value={formData.supplier_address}
                  onChange={handleInputChange}
                  readOnly={!isNewSupplier}
                  className={`w-full p-3 border border-gray-300 rounded-md ${
                    isNewSupplier
                      ? "focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Phone
                </label>
                <input
                  type="text"
                  name="supplier_tel"
                  value={formData.supplier_tel || ""}
                  onChange={handleInputChange}
                  readOnly={!isNewSupplier}
                  className={`w-full p-3 border border-gray-300 rounded-md ${
                    isNewSupplier
                      ? "focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Email
                </label>
                <input
                  type="email"
                  name="supplier_email"
                  value={formData.supplier_email || ""}
                  onChange={handleInputChange}
                  readOnly={!isNewSupplier}
                  className={`w-full p-3 border border-gray-300 rounded-md ${
                    isNewSupplier
                      ? "focus:ring-2 focus:ring-blue-500"
                      : "bg-gray-100"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="0">Pending</option>
                  <option value="1">Completed</option>
                  <option value="2">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="purchase_date"
                    value={formData.purchase_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                <button
                  type="button"
                  onClick={() => setShowItemModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
                >
                  <FaPlus /> <span>Add Item</span>
                </button>
              </div>
              {formData.items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items added yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.item_image && (
                                <img
                                  src={item.item_image}
                                  alt={item.item_name}
                                  className="h-10 w-10 rounded mr-2"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.item_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.item_code}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Total
                </label>
                <input
                  type="number"
                  value={formData.sub_total.toFixed(2)}
                  readOnly
                  className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Amount
                </label>
                <input
                  type="number"
                  value={formData.tax_amount.toFixed(2)}
                  readOnly
                  className="w-full p-3 bg-gray-100 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Fee
                </label>
                <input
                  type="number"
                  name="shipping_fee"
                  value={formData.shipping_fee}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <input
                  type="number"
                  value={Number(formData.total_amount).toFixed(2)}
                  readOnly
                  className="w-full p-3 bg-green-100 border border-green-300 rounded-md font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balance
                </label>
                <input
                  type="number"
                  value={formData.balance.toFixed(2)}
                  readOnly
                  className={`w-full p-3 border rounded-md font-semibold ${
                    formData.balance > 0
                      ? "bg-yellow-100 border-yellow-300"
                      : "bg-green-100 border-green-300"
                  }`}
                />
              </div>
            </div>

            {/* Payments Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Payments
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center space-x-2"
                >
                  <FaPlus /> <span>Add Payment</span>
                </button>
              </div>
              {formData.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No payments added yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.payments.map((payment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paid_at}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removePayment(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-md hover:bg-gray-100 transition-all duration-300 cursor-pointer"
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 gap-2 flex items-center space-x-2 disabled:opacity-50 transition-all duration-300 cursor-pointer"
              >
                <FaSave className="text-xl" />{" "}
                {loading ? "Saving..." : "Update Purchase"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Item</h3>
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mb-4 max-h-40 overflow-y-auto">
              {filteredItems.map((item) => (
                <div
                  key={item.item_id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 border rounded-md mb-2 cursor-pointer hover:bg-gray-50 ${
                    selectedItem?.item_id === item.item_id
                      ? "bg-blue-100 border-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    {item.item_image && (
                      <img
                        src={item.item_image}
                        alt={item.item_name}
                        className="h-8 w-8 rounded mr-3"
                      />
                    )}
                    <div>
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-500">
                        {item.item_code} - Cost: ${item.item_cost}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedItem && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="p-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    value={unitPrice}
                    onChange={(e) =>
                      setUnitPrice(parseFloat(e.target.value) || 0)
                    }
                    className="p-2 border border-gray-300 rounded-md"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowItemModal(false)}
                    className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addItemToPurchase}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <FaDollarSign className="inline ml-1" />
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid At
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addPayment}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatePurchase;
