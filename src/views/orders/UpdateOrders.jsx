import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import {
  useGetAllOrderQuery,
  useGetOrderByIdQuery,
} from "../../../app/Features/ordersSlice";
import {
  useGetAllStockQuery,
  useGetStockByOrderIdQuery,
} from "../../../app/Features/stocksSlice";
import api from "../../services/api";
import { message, Select, Tag, Card, Badge, Tooltip, Avatar } from "antd";
import { useGetAllItemInStockQuery } from "../../../app/Features/itemsSlice";
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { FaPercent, FaTag, FaPalette, FaRuler, FaWeight } from "react-icons/fa";
import { motion } from "framer-motion";
import { GiSugarCane } from "react-icons/gi";

const UpdateOrders = () => {
  const navigator = useNavigate();
  const [returnItem, setReturnItem] = useState([]);
  const [saleItem, setSaleItem] = useState([]);
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { setLoading } = useOutletsContext();
  const token = localStorage.getItem("token");

  // API hooks
  const orderContext = useGetAllOrderQuery(token);
  const allItemInStock = useGetAllSaleQuery(token);
  const stockData = useGetAllStockQuery(token);
  const {
    data: orderData,
    isLoading: orderLoading,
    refetch,
  } = useGetOrderByIdQuery({ id, token });
  const { data: salesData, isLoading: salesLoading } =
    useGetAllSaleQuery(token);
  const stockContext = useGetStockByOrderIdQuery({ id, token });
  const { data: customers } = useGetAllCustomerQuery(token);
  const [messageApi, contextHolder] = message.useMessage();

  // Form state
  const [form, setForm] = useState({
    order_customer_id: 0,
    order_discount: 0,
    order_tel: "",
    order_email: "",
    delivery_fee: 0,
    sale_type: "sale",
    order_payment_method: "cash",
    order_date: "",
    order_address: "",
    order_subtotal: 0,
    order_total: 0,
    balance: 0,
    payment: 0,
    order_tax: 0,
    items: [],
  });

  // Helper function to get item price based on sale type
  const getItemPrice = (item, saleType = "sale") => {
    if (saleType === "sale") {
      return item.price_discount || (item.price * (1 - (item.discount || 0) / 100));
    } else {
      return item.wholesale_price_discount || item.wholesale_price;
    }
  };

  // Helper function to parse attributes for display
  const parseAttributesForDisplay = (attributes) => {
    if (!attributes || attributes.length === 0) return null;

    return attributes.map(attr => {
      let displayValue = '';
      let icon = null;
      let isColor = false;

      if (attr.type === 'select') {
        if (Array.isArray(attr.value)) {
          displayValue = attr.value.map(v => v.value).join(', ');
        } else {
          displayValue = attr.value;
        }

        // Set icon based on attribute name
        if (attr.name === 'colors') {
          icon = <FaPalette className="w-3 h-3" />;
          isColor = true;
        } else if (attr.name === 'size') {
          icon = <FaRuler className="w-3 h-3" />;
        } else if (attr.name === 'weight') {
          icon = <FaWeight className="w-3 h-3" />;
        } else if (attr.name === 'type') {
          icon = <FaTag className="w-3 h-3" />;
        }
      } else if (attr.type === 'text') {
        displayValue = attr.value;
        if (attr.name === 'sugar') {
          icon = <GiSugarCane className="w-3 h-3" />;
        }
      }

      return { name: attr.name, value: displayValue, icon, isColor };
    });
  };

  // Format color values for display
  const formatColorDisplay = (colorValue) => {
    if (!colorValue) return [];

    // If it's already an array of strings, return it
    if (Array.isArray(colorValue)) {
      return colorValue;
    }

    // If it's a string, split by commas and trim
    if (typeof colorValue === 'string') {
      return colorValue.split(',').map(c => c.trim()).filter(c => c.length > 0);
    }

    // If it's an array of objects with value property
    if (Array.isArray(colorValue) && colorValue[0]?.value) {
      return colorValue.map(c => c.value);
    }

    return [];
  };

  // Initialize data when loaded
  useEffect(() => {
    setItems(allItemInStock?.data?.data || []);
    refetch();
    if (!orderLoading && orderData?.data) {
      const order = orderData.data;
      const customer = customers?.data?.find(
        (c) => c.customer_id == order.order_customer_id
      );

      setForm({
        order_customer_id: order.order_customer_id || 0,
        order_discount: order.order_discount || 0,
        order_tel: order.order_tel || "",
        order_email: customer?.customer_email || "",
        delivery_fee: order.delivery_fee || 0,
        sale_type: order.sale_type || "sale",
        order_payment_method: order.order_payment_method || "cash",
        order_address: order.order_address || "",
        order_subtotal: order.order_subtotal || 0,
        order_total: order.order_total || 0,
        order_tax: order.order_tax || 0,
        order_date: order.order_date || "",
        balance: order.balance || 0,
        payment: order.payment || 0,
        items: order.items || [],
      });

      // Process items with attributes
      const newItems = order?.items?.map((i) => {
        const stock = allItemInStock?.data?.data?.find(
          (item) => item.item_id == i.item_id
        )?.stock;
        return {
          ...i,
          item_id: i.item_id,
          in_stock: Number(stock || 0),
          displayAttributes: parseAttributesForDisplay(i.attributes),
          price_per_unit: i.item_price,
          item_name: i.item_name,
          item_code: i.item_code,
          item_image: i.images?.[0]?.image,
          discount: i.discount,
          item_wholesale_price: i.item_wholesale_price,
          item_cost: i.item_cost
        };
      });

      setSelectedItems(newItems || []);
    }
  }, [
    orderLoading,
    orderData,
    salesLoading,
    salesData,
    allItemInStock,
    customers,
  ]);

  // Helper function to get all available items with parsed attributes
  const getAvailableItems = () => {
    return items?.map(item => ({
      ...item,
      displayAttributes: parseAttributesForDisplay(item.attributes)
    })) || [];
  };

  // Handle item selection
  const handleSelectItem = (value) => {
    const item = getAvailableItems().find((i) => i.id === value);
    if (!item) return;

    // Check if item already exists in order
    const exist = selectedItems.find((i) => i.item_id === item.id);
    // console.log(item, selectedItems);

    if (exist) {
      // Update quantity if item exists
      setSelectedItems((prev) => {
        const update = prev.map((i) => {
          if (i.id === item.id) {
            const maxQuantity = i.in_stock + (orderData?.data?.items?.find((o) => o.item_id === item.id)?.quantity || 0);
            const newQuantity = Math.min(i.quantity + 1, maxQuantity);

            if (newQuantity > maxQuantity) {
              messageApi.warning(`Maximum available quantity is ${maxQuantity}`);
              return i;
            }

            return {
              ...i,
              quantity: newQuantity,
            };
          }
          return i;
        });

        updateTotals(update);
        return update;
      });
    } else {
      // Add new item
      const maxQuantity = Math.min(1, item.stock || 0);
      const newItem = {
        id: item.id,
        item_id: item.id,
        item_name: item.name,
        item_code: item.code,
        item_image: item.image,
        price_per_unit: getItemPrice(item, form.sale_type),
        quantity: 1,
        discount: item.discount,
        item_wholesale_price: item.wholesale_price,
        item_cost: item.cost,
        in_stock: item.in_stock || 0,
        displayAttributes: item.displayAttributes,
        // Store original attributes for API submission
        attributes: item.attributes
      };

      setSelectedItems((prev) => {
        const update = [...prev, newItem];
        updateTotals(update);
        return update;
      });
    }
  };

  // Helper function to update totals
  const updateTotals = (items) => {
    const orderSubtotal = items.reduce((init, curr) => {
      const price = form.sale_type === "sale"
        ? curr.price_per_unit || curr.item_price
        : curr.item_wholesale_price || curr.price_per_unit;
      return init + curr.quantity * parseFloat(price);
    }, 0);

    const discountAmount = orderSubtotal * (form.order_discount / 100);
    const taxAmount = orderSubtotal * (form.order_tax / 100);
    const orderTotal = orderSubtotal - discountAmount + (form.delivery_fee || 0) + taxAmount;
    const balance = orderTotal - (form.payment || 0);
    const dis = items?.map((i) => ((form.sale_type === "sale" ? i.price_per_unit : i.item_wholesale_price) * i.quantity) * (i.discount / 100));

    setForm((prev) => ({
      ...prev,
      order_discount: dis.reduce((a, b) => a + b, 0),
      order_subtotal: orderSubtotal,
      order_total: orderTotal,
      balance,
    }));
  };

  const handleItemChange = (index, field, value, itemId) => {
    const parsedValue = parseInt(value);
    const quantityValue = isNaN(parsedValue) ? 1 : Math.max(1, parsedValue);

    const updatedItems = [...selectedItems];
    const item = updatedItems[index];

    if (field === "quantity") {
      // Check stock availability
      const maxQuantity = item.stock.in_stock + (orderData?.data?.items[index]?.quantity || 0);
      if (quantityValue > maxQuantity) {
        messageApi.warning(`Maximum available quantity is ${maxQuantity}`);
        return;
      }

      updatedItems[index] = {
        ...item,
        quantity: quantityValue,
      };

      // Handle sale/return tracking
      const originalOrder = orderData?.data?.items;
      const checkOrder = originalOrder?.find((o) => o.item_id === itemId);

      if (checkOrder) {
        const diff = quantityValue - checkOrder.quantity;

        if (diff < 0) {
          // Return items
          const returnQty = Math.abs(diff);
          setReturnItem((prev) => {
            const exists = prev.find((p) => p.id === itemId);
            return exists
              ? prev.map((p) =>
                p.id === itemId ? { ...p, quantity: returnQty } : p
              )
              : [...prev, { ...item, quantity: returnQty }];
          });
          setSaleItem((prev) => prev.filter((i) => i.id !== itemId));
        } else if (diff > 0) {
          // Add more items
          setSaleItem((prev) => {
            const exists = prev.find((p) => p.id === itemId);
            return exists
              ? prev.map((p) =>
                p.id === itemId ? { ...p, quantity: diff } : p
              )
              : [...prev, { ...item, quantity: diff }];
          });
          setReturnItem((prev) => prev.filter((i) => i.id !== itemId));
        } else {
          // No change
          setSaleItem((prev) => prev.filter((i) => i.id !== itemId));
          setReturnItem((prev) => prev.filter((i) => i.id !== itemId));
        }
      }
    }

    // Update totals
    updateTotals(updatedItems);
    setSelectedItems(updatedItems);
  };

  const handleRemoveItem = (item) => {
    const delFilter = selectedItems?.filter((s) => s.id !== item.id);
    setSelectedItems(delFilter);

    const checkOrder = orderData?.data?.items?.find(
      (o) => o.item_id === item.id
    );
    if (checkOrder) {
      setReturnItem((prev) => [...prev, { ...item, quantity: checkOrder.quantity }]);
    }

    updateTotals(delFilter);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Recalculate totals when sale type changes
      if (name === "sale_type") {
        const updatedItems = selectedItems.map(item => ({
          ...item,
          price_per_unit: getItemPrice(item, value)
        }));
        setSelectedItems(updatedItems);
        updateTotals(updatedItems);
        return updated;
      }

      // Recalculate totals for financial fields
      if (["order_discount", "delivery_fee", "order_tax", "payment"].includes(name)) {
        const orderSubtotal = selectedItems.reduce((init, curr) => {
          const price = updated.sale_type === "sale"
            ? curr.price_per_unit || curr.item_price
            : curr.item_wholesale_price;
          return init + curr.quantity * parseFloat(price);
        }, 0);

        const discountAmount = orderSubtotal * (updated.order_discount / 100);
        const taxAmount = orderSubtotal * (updated.order_tax / 100);
        const orderTotal = orderSubtotal - discountAmount + (updated.delivery_fee || 0) + taxAmount;
        const balance = orderTotal - (updated.payment || 0);

        return {
          ...updated,
          order_subtotal: orderSubtotal,
          order_total: orderTotal,
          balance,
        };
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertBox(true);
  };

  const handleSelectFCustomer = (value) => {
    const cusFind = customers?.data?.find((c) => c.customer_id === value);
    setForm((prev) => ({
      ...prev,
      order_customer_id: value,
      order_tel: cusFind?.customer_tel || "",
      order_email: cusFind?.customer_email || "",
      order_address: cusFind?.customer_address || "",
    }));
  };

  const handleConfirmUpdate = async () => {
    const payload = {
      ...form,
      order_payment_status: form.balance != 0 ? "cod" : "paid",
      items: selectedItems.map((item) => {
        const baseItem = {
          item_id: item.id,
          item_name: item.item_name,
          quantity: item.quantity,
          discount: item.discount || 0,
          item_wholesale_price: parseFloat(item.item_wholesale_price || 0),
          item_cost: parseFloat(item.item_cost || 0),
          unit_price: parseFloat(item.price_per_unit || item.item_price),
          price: parseFloat(item.price_per_unit || item.item_price) * Number(item.quantity),
        };

        // Preserve existing attributes
        if (item.attributes) {
          return { ...baseItem, attributes: item.attributes };
        }

        return baseItem;
      }),
    };

    const toDay = new Date();

    try {
      setLoading(true);
      setAlertBox(false);

      // Update order
      const orderRes = await api.put(`/order_masters/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle stock changes for new sales
      if (saleItem.length > 0) {
        const saleStocks = {
          stock_type_id: 5,
          from_warehouse: 1,
          warehouse_id: 3,
          order_id: id,
          stock_remark: "Add products to order",
          items: saleItem.map((item) => ({
            item_id: item.id,
            quantity: item.quantity,
            item_cost: item.item_cost,
            item_price: item.price_per_unit || item.item_price,
            item_wholesale_price: item.item_wholesale_price,
            expire_date: toDay.toISOString().split("T")[0],
          })),
        };

        await api.post("/stock_masters", saleStocks, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Handle stock changes for returns
      if (returnItem.length > 0) {
        const returnStocks = {
          stock_type_id: 1,
          from_warehouse: 3,
          warehouse_id: 1,
          order_id: id,
          stock_remark: "Return products from order",
          items: returnItem.map((item) => ({
            item_id: item.id,
            quantity: item.quantity,
            item_cost: item.item_cost,
            item_price: item.price_per_unit || item.item_price,
            item_wholesale_price: item.item_wholesale_price,
            expire_date: toDay.toISOString().split("T")[0],
          })),
        };

        await api.post("/stock_masters", returnStocks, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (orderRes.data.status === 200) {
        orderContext.refetch();
        refetch();
        toast.success(orderRes.data.message || "Order updated successfully");
        navigator("/dashboard/order-list");
      }
    } catch (error) {
      toast.error(
        error?.message || error || "An error occurred while updating the order"
      );
    } finally {
      setLoading(false);
    }
  };



  // Render attribute display
  const renderAttributesDisplay = (item) => {
    if (!item.displayAttributes || item.displayAttributes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {item.displayAttributes.map((attr, idx) => {
          // Generate unique key using item.id and attribute index
          const uniqueKey = `${item.id}-${attr.name}-${idx}`;

          let colors = [];
          if (attr.isColor) {
            colors = formatColorDisplay(attr.value);
          }

          return (
            <div key={uniqueKey} className="flex items-center gap-2">
              {attr.icon}
              <span className="text-xs text-gray-500 capitalize">{attr.name}:</span>
              {attr.isColor ? (
                colors.length > 0 ? (
                  <div className="flex gap-1">
                    {colors.map((color, colorIdx) => (
                      <div
                        key={`${uniqueKey}-${colorIdx}`}
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-medium text-gray-700">No color</span>
                )
              ) : (
                <span className="text-xs font-medium text-gray-700">{attr.value}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  console.log(selectedItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="px-4 md:px-6 lg:px-8 py-6">
        {contextHolder}
        <AlertBox
          isOpen={alertBox}
          title="Confirm Update"
          message="Are you sure you want to update this order?"
          onConfirm={handleConfirmUpdate}
          onCancel={() => setAlertBox(false)}
          confirmText="Update"
          cancelText="Cancel"
        />

        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Update Order</h1>
              <p className="text-gray-600">Modify order #{orderData?.data?.order_no} details</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/order-list"
                className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Orders
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Item Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Item Selection Card */}
                <Card className="shadow-lg border-0">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Add Items to Order</h3>
                    <Select
                      onChange={handleSelectItem}
                      showSearch
                      style={{ width: "100%" }}
                      placeholder="Search and select items to add..."
                      optionLabelProp="name"
                      size="large"
                      optionFilterProp="name"
                      filterSort={(optionA, optionB) =>
                        (optionA?.name ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.name ?? "").toLowerCase())
                      }
                      options={getAvailableItems().map((item) => ({
                        value: item.id,
                        name: item.name,
                        label: (
                          <div className="flex items-center gap-3 p-2">
                            <div className="h-12 w-12 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain p-1"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=128`;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-800 truncate">{item.name}</span>
                                <span className="text-green-600 font-bold text-sm">
                                  ${Number(getItemPrice(item, form.sale_type) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{item.code}</span>
                                {item.discount > 0 && (
                                  <Badge
                                    count={`-${item.discount}%`}
                                    className="bg-gradient-to-r from-red-500 to-pink-600"
                                    style={{ fontSize: '10px', padding: '0 6px' }}
                                  />
                                )}
                                {item.in_stock > 0 ? (
                                  <span className="text-xs text-green-600">Stock: {item.in_stock}</span>
                                ) : (
                                  <span className="text-xs text-red-600">Out of stock</span>
                                )}
                              </div>
                              {/* Show attribute indicators */}
                              {item.displayAttributes && item.displayAttributes.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  <FaTag className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    Has attributes
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                </Card>

                {/* Items Table Card */}
                <Card className="shadow-lg border-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Items</h3>
                  <div className="overflow-x-auto">
                    {selectedItems?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No items added to order</p>
                        <p className="text-gray-400 text-sm mt-2">Select items from the dropdown above</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                            {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Attributes</th> */}
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Unit Price</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedItems?.map((item, index) => (
                            <tr key={`${item.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="h-14 w-14 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                                    <img
                                      src={item.item_image || item.image}
                                      alt={item.item_name}
                                      className="h-full w-full object-contain p-1"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=3b82f6&color=fff&size=128`;
                                      }}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <div className="font-medium text-gray-900">{item.item_name || item.name}</div>
                                    <div className="text-sm text-gray-500">{item.item_code || item.code}</div>
                                    {item.discount > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <FaPercent className="w-3 h-3 text-green-600" />
                                        <span className="text-xs text-green-600 font-medium">{item.discount}% discount</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {/* <td className="px-4 py-4">
                                {renderAttributesDisplay(item)}
                              </td> */}
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={item.stock.in_stock + (orderData?.data?.items[index]?.quantity || 0)}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value, item.id)}
                                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                  />
                                  <div className="ml-2 text-xs text-gray-500">
                                    Max: {item.stock.in_stock + (orderData?.data?.items[index]?.quantity || 0)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-gray-900 font-medium">
                                  ${form.sale_type === "sale"
                                    ? Number(item.price_per_unit || item.item_price || 0).toFixed(2)
                                    : Number(item.item_wholesale_price || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-gray-900 font-bold">
                                  {Number(
                                    form.sale_type === "sale"
                                      ? (Number(item.price_per_unit || item.item_price || 0) * Number(item.quantity || 0))
                                      : (Number(item.item_wholesale_price || 0) * Number(item.quantity || 0))
                                  ).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className="px-4 py-2 text-sm bg-gradient-to-r from-red-50 to-red-100 text-red-600 border border-red-200 rounded-lg hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all duration-200 font-medium"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column - Order & Payment Details */}
              <div className="space-y-6">
                {/* Order Summary Card */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Summary</h3>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="text-gray-600">Items Subtotal</span>
                        <span className="font-medium text-gray-800">${Number(form.order_subtotal || 0).toFixed(2)}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sale Type</span>
                          <span className={`font-medium ${form.sale_type === 'sale' ? 'text-green-600' : 'text-blue-600'}`}>
                            {form.sale_type === 'sale' ? 'Retail' : 'Wholesale'}
                          </span>
                        </div>

                        {form.sale_type === 'wholesale' && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Tax ({form.order_tax}%)</span>
                            <span className="font-medium text-gray-800">
                              ${Number((Number(form.order_subtotal || 0) * (Number(form.order_tax || 0) / 100))).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Delivery Fee</span>
                          <span className="font-medium text-gray-800">${Number(form.delivery_fee || 0).toFixed(2)}</span>
                        </div>

                        {form.order_discount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span>Discount</span>
                            <span className="font-bold">
                              -${parseFloat(form?.order_discount).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex justify-between items-center text-lg">
                          <span className="font-bold text-gray-800">Total Amount</span>
                          <span className="font-bold text-green-600">${Number(form.order_total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-600">Payment</span>
                          <span className="font-medium text-gray-800">${Number(form.payment || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-gray-600">Balance</span>
                          <span className={`font-bold ${form.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            ${Number(form.balance || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Payment Status: <span className={`font-medium ${form.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {form.balance > 0 ? 'Partial Payment' : 'Paid in Full'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Order Details Card */}
                <Card className="shadow-lg border-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Details</h3>
                  <div className="space-y-4">
                    {/* Sale Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleFormChange({ target: { name: 'sale_type', value: 'sale' } })}
                          className={`flex-1 py-3 rounded-lg border transition-all duration-200 ${form.sale_type === 'sale'
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                            : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                        >
                          Retail Sale
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormChange({ target: { name: 'sale_type', value: 'wholesale' } })}
                          className={`flex-1 py-3 rounded-lg border transition-all duration-200 ${form.sale_type === 'wholesale'
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                            : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                        >
                          Wholesale
                        </button>
                      </div>
                    </div>

                    {/* Customer Selection (for wholesale) */}
                    <div className={form.sale_type === "wholesale" ? "block" : "hidden"}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                      <Select
                        onChange={handleSelectFCustomer}
                        showSearch
                        value={form.order_customer_id}
                        style={{ width: "100%" }}
                        placeholder="Select customer..."
                        optionLabelProp="name"
                        optionFilterProp="name"
                        size="large"
                        options={customers?.data?.map((customer) => ({
                          value: customer.customer_id,
                          name: customer.customer_name,
                          label: (
                            <div className="flex items-center gap-3 py-1">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                                {customer.image ? (
                                  <img src={customer.image} alt={customer.customer_name} className="h-full w-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-blue-600 font-medium">
                                    {customer.customer_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 truncate">{customer.customer_name}</div>
                                <div className="text-xs text-gray-500 truncate">{customer.customer_tel}</div>
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className={form.sale_type === "sale" ? "block" : "hidden"}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="order_tel"
                        value={form.order_tel}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>

                    {/* Email (for wholesale) */}
                    {/* <div className={form.sale_type === "wholesale" ? "block" : "hidden"}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        name="order_email"
                        value={form.order_email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div> */}

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Address</label>
                      <textarea
                        name="order_address"
                        value={form.order_address}
                        onChange={handleFormChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter delivery address"
                      />
                    </div>

                    {/* Order Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order Date</label>
                      <input
                        type="date"
                        name="order_date"
                        value={form.order_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Payment Details Card */}
                <Card className="shadow-lg border-0">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Details</h3>
                  <div className="space-y-4">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select
                        name="order_payment_method"
                        value={form.order_payment_method}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    {/* Tax (for wholesale) */}
                    <div className={form.sale_type === "wholesale" ? "block" : "hidden"}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax Percentage</label>
                      <div className="relative">
                        <input
                          type="number"
                          name="order_tax"
                          min="0"
                          max="100"
                          step="0.1"
                          value={form.order_tax}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Fee */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          name="delivery_fee"
                          min="0"
                          step="0.01"
                          value={form.delivery_fee}
                          onChange={handleFormChange}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Payment Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          name="payment"
                          min="0"
                          step="0.01"
                          value={form.payment}
                          onChange={handleFormChange}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg"
                  >
                    Update Order
                  </button>
                  <Link
                    to="/dashboard/order-list"
                    className="block w-full px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 font-semibold text-center rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </motion.div>
  );
};

export default UpdateOrders;