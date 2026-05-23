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
import { message, Select, Tag, Card, Badge, Tooltip, Avatar, DatePicker } from "antd";
import { useGetAllItemInStockQuery, useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { FaPercent, FaTag, FaPalette, FaRuler, FaWeight } from "react-icons/fa";
import { motion } from "framer-motion";
import { GiSugarCane } from "react-icons/gi";
import { useDebounce } from "use-debounce";
import { FaBox } from "react-icons/fa";

import { useTranslation } from "react-i18next";
import RichSearch from "../../utils/RichSearch";
import { MdDeleteSweep } from "react-icons/md";
import Input from "../../utils/Input";
import dayjs from "dayjs";
import Button from "../../utils/Button";
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "aba", label: "ABA" },
  { value: "ac", label: "Aclida" },
  { value: "bakong", label: "Bakong" },
];

const PAYMENT_STATUS = [
  { value: "paid", label: "Paid" },
  { value: "credit", label: "Credit" },
  { value: "cod", label: "COD" },
];  
const UpdateOrders = () => {
  const { t } = useTranslation();
  const navigator = useNavigate();
  const [returnItem, setReturnItem] = useState([]);
  const [saleItem, setSaleItem] = useState([]);
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { setLoading, darkMode } = useOutletsContext();
  const token = localStorage.getItem("token");
  const [searchItem, setSearchItem] = useState('');
  const [debouncedSearch] = useDebounce(searchItem, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // API hooks
  const orderContext = useGetAllOrderQuery(token);
  const allItemInStock = useGetAllSaleQuery({ limit: limit, page: currentPage, search: debouncedSearch, token });
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
    due_date: "",
    sale_type: "sale",
    order_payment_method: "cash",
    order_payment_status: "paid",
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
    console.log(allItemInStock?.data?.data);

    refetch();
    if (!orderLoading && orderData?.data) {
      const order = orderData.data;
      console.log('order:', order);

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
        order_payment_status: order.order_payment_status || "paid",
        order_address: order.order_address || "",
        order_subtotal: order.order_subtotal || 0,
        order_total: order.order_total || 0,
        due_date: order.due_date || "",
        order_tax: order.order_tax || 0,
        order_date: order.order_date || "",
        balance: order.balance || 0,
        payment: order.payment || 0,
        items: order.items || [],
      });

      // Process items with attributes
      const newItems = order?.items?.map((i) => {

        return {
          ...i,
          item_id: i.item_id,
          in_stock: i.in_stock,
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

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
    setLimit(10);
  }, [debouncedSearch]);


  // Handle scroll fetch for infinite pagination
  const onScrollFetch = (e) => {
    const target = e.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    if (nearBottom && allItemInStock?.data?.pagination?.total > items?.length) {
      setLimit(prev => prev + 10);
    }
  };


  // Handle item selection
  const handleSelectItem = (value) => {
    const item = items.find(i => i.id === value);
    console.log(item, selectedItems);

    if (!item) return;

    if (item?.in_stock <= 0) {
      toast.info(t('notEnoughStock'));
      return;
    }

    // Check if item already exists in order
    const exist = selectedItems.find((i) => i.item_id === item.id);

    if (exist) {
      // Update quantity if item exists
      setSelectedItems((prev) => {
        const update = prev.map((i) => {
          // console.log(exist);
          if (i.id === exist.id) {
            const maxQuantity = i.stock.in_stock + (orderData?.data?.items?.find((o) => o.item_id === item.id)?.quantity || 0);
            const newQuantity = Math.min(i.quantity + 1, maxQuantity);


            if (newQuantity > maxQuantity) {
              messageApi.warning(`${t('maxQuantityIs')} ${maxQuantity}`);
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
      console.log('selectItem:', item);

      const newItem = {
        id: item.id,
        item_id: item.id,
        item_name: item.name,
        item_code: item.code,
        item_image: item.image,
        price: getItemPrice(item, form.sale_type),
        quantity: 1,
        discount: item.discount,
        item_wholesale_price: item.wholesale_price,
        item_price: item.price,
        item_cost: item.cost,
        in_stock: item?.in_stock || 0,
        // Store original attributes for API submission
        attributes: item.attributes,
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
    console.log('updateTotal:', items);

    const orderSubtotal = items.reduce((init, curr) => {
      const price = form.sale_type === "sale"
        ? curr.price_per_unit || curr.item_price
        : curr.item_wholesale_price || curr.price_per_unit;
      return init + curr.quantity * parseFloat(price);
    }, 0);
    const discountAmount = (selectedItems.reduce((a, b) => (a + (orderSubtotal * (b.discount / 100))), 0) || 0).toFixed(2);
    console.log("discount:", discountAmount);


    const taxAmount = orderSubtotal * (form.order_tax / 100);
    const orderTotal = orderSubtotal - discountAmount + (form.delivery_fee || 0) + taxAmount;
    const balance = orderTotal - (form.payment || 0);

    setForm((prev) => ({
      ...prev,
      order_discount: discountAmount,
      order_subtotal: orderSubtotal - discountAmount,
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
      const maxQuantity = item.in_stock + (orderData?.data?.items[index]?.quantity || 0);
      if (quantityValue > maxQuantity) {
        messageApi.warning(`${t('maxQuantityIs')} ${maxQuantity}`);
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

    console.log(updatedItems);

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

        const discountAmount = (selectedItems.reduce((a, b) => (a + (orderSubtotal * (b.discount / 100))), 0) || 0).toFixed(2);

        const taxAmount = orderSubtotal * (updated.order_tax / 100);
        const orderTotal = orderSubtotal - discountAmount + (updated.delivery_fee || 0) + taxAmount;
        const balance = orderTotal - (updated.payment || 0);

        return {
          ...updated,
          order_discount: discountAmount,
          order_subtotal: orderSubtotal - parseFloat(discountAmount),
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
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: item.quantity,
          discount: item.discount || 0,
          item_wholesale_price: parseFloat(item.item_wholesale_price || 0),
          item_cost: parseFloat(item.item_cost || 0),
          unit_price: parseFloat(item.price_per_unit || item.item_price),
          price: parseFloat(item.price),
        };

        // Preserve existing attributes
        if (item.attributes) {
          return { ...baseItem, attributes: item.attributes };
        }

        return baseItem;
      }),
    };

    const toDay = new Date();
    console.log(payload);


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
        toast.success(orderRes.data.message || t("orderUpdatedSuccessfully"));
        navigator("/order-list");
      }
    } catch (error) {
      toast.error(
        error?.message || error || t("errorUpdatingOrder")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`view-page ${darkMode ? "dark text-white" : ""}`}
    >
      <section className="px-4 md:px-6 lg:px-8 py-6">
        {contextHolder}
        <AlertBox
          isOpen={alertBox}
          title={t("confirmUpdate")}
          message={t("confirmUpdateOrderMessage")}
          onConfirm={handleConfirmUpdate}
          onCancel={() => setAlertBox(false)}
          confirmText={t("update")}
          cancelText={t("cancel")}
        />

        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {t("editOrder")}
              </h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                {t("modifyOrderDetails", { orderNo: orderData?.data?.order_no })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/order-list"
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  darkMode 
                    ? "bg-gray-800 text-gray-200 hover:bg-gray-700" 
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {t("backToOrders")}
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Item Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Item Selection Card */}
                <div>
                  <div className="mb-4">
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      {t("addItemsToOrder")}
                    </h3>
                    

                    <RichSearch
                      onSelected={handleSelectItem}
                      placeholder={t("searchAndSelectItems")}
                      onSearch={(value) => setSearchItem(value)}
                      onScrollReader={onScrollFetch}
                      keyFields={{id: 'id', title: 'name', subtitle: 'code', image: 'image', price: 'price', quantity: 'in_stock'}}
                      data={items}
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {t("orderItems")}
                  </h3>
                  <div className="overflow-x-auto">
                    {selectedItems?.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={darkMode ? "text-gray-600 mb-4" : "text-gray-400 mb-4"}>
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                          </svg>
                        </div>
                        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                          {t("noItemsAddedToOrder")}
                        </p>
                        <p className={darkMode ? "text-gray-500 text-sm mt-2" : "text-gray-400 text-sm mt-2"}>
                          {t("selectItemsFromDropdown")}
                        </p>
                      </div>
                    ) : (
                      <table className={`min-w-full divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                        <thead className={darkMode ? "bg-primary" : "bg-gradient-to-r from-gray-50 to-blue-50"}>
                          <tr>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {t("product")}
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {t("quantity")}
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {t("unitPrice")}
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {t("total")}
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {t("actions")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}>
                          {selectedItems?.map((item, index) => (
                            <tr key={`${item.id}-${index}`} className={`transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  {/* <div className={`h-14 w-14 rounded-lg border overflow-hidden flex-shrink-0 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                    <img
                                      src={item.item_image || item.image}
                                      alt={item.item_name}
                                      className="h-full w-full object-contain p-1"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.item_name)}&background=3b82f6&color=fff&size=128`;
                                      }}
                                    />
                                  </div> */}
                                  <div className="ml-3">
                                    <div className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                                      {item.item_name || item.name}
                                    </div>
                                    <div className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                      {item.item_code || item.code}
                                    </div>
                                    {item.discount > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <FaPercent className="w-3 h-3 text-green-600" />
                                        <span className="text-xs text-green-600 font-medium">
                                          {item.discount}% {t("discount")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  {/* <input
                                    type="number"
                                    min={1}
                                    max={item?.in_stock + (orderData?.data?.items[index]?.quantity || 0)}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value, item.id)}
                                    className={`w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center ${
                                      darkMode 
                                        ? "bg-gray-700 border-gray-600 text-white" 
                                        : "bg-white border-gray-300"
                                    }`}
                                  /> */}
                                  <Input
                                    type="number"
                                    min={1}
                                    max={item?.in_stock + (orderData?.data?.items[index]?.quantity || 0)}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value, item.id)}
                                    className={`w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center ${
                                      darkMode 
                                        ? "bg-gray-700 border-gray-600 text-white" 
                                        : "bg-white border-gray-300"
                                    }`}
                                  />
                                  <div className="ml-2 text-xs text-gray-500">
                                    {t("max")}: {item?.in_stock + (orderData?.data?.items[index]?.quantity || 0)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
                                  {
                                    Number(item.price_per_unit || item.item_price || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                                  ${
                                    
                                       (Number(item.price_per_unit || item.item_price || 0) * Number(item.quantity || 0))
                                  }
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className={`px-4 py-2 cursor-pointer text-sm border rounded-lg transition-all duration-200 font-medium ${
                                    darkMode
                                      ? "bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40"
                                      : "bg-gradient-to-r from-red-50 to-red-100 text-red-600 border-red-200 hover:from-red-100 hover:to-red-200"
                                  }`}
                                >
                                  <MdDeleteSweep className="text-xl"/>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Order & Payment Details */}
              <div className="space-y-6">
                

                {/* Order Details */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {t("orderDetails")}
                  </h3>
                  <div className="grow">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("saleType")}
                      </label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          outline={form.sale_type !== 'sale'}
                          onClick={() => handleFormChange({ target: { name: 'sale_type', value: 'sale' } })}
                          
                        >
                          {t("retailSale")}
                        </Button>
                        <Button
                          type="button"
                          outline={form.sale_type !== 'wholesale'}
                          onClick={() => handleFormChange({ target: { name: 'sale_type', value: 'wholesale' } })}
                        >
                          {t("wholesale")}
                        </Button>
                      </div>
                    </div>
                  <div className="space-y-4 flex flex-wrap gap-4 mt-3">
                    {/* Sale Type Selection */}
                    

                    {/* Customer Selection (for wholesale) */}
                    <div className={form.sale_type === "wholesale" ? "block grow" : "hidden"}>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("customer")}
                      </label>
                      
                      <RichSearch
                        data={customers?.data}
                        value={form.order_customer_id}
                        onSelected={handleSelectFCustomer}
                        placeholder={t("selectCustomer")}
                        keyFields={{
                          id: 'customer_id',
                          title: 'customer_name',
                          subtitle: 'customer_tel',
                          image: 'image',
                        }}
                      />
                    </div>
                    <div className="grow" >
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("paymentStatus")}
                      </label>
                      <RichSearch
                        data={PAYMENT_STATUS}
                        keyFields={{
                          id: 'value',
                          title: 'label',
                        }}
                        onSelected={handleFormChange}
                        value={form.order_payment_status}
                      />
                    </div>

                    {/* Contact Information */}
                    <div className={form.sale_type === "sale" ? "block" : "hidden"}>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("customerTel")}
                      </label>
                     
                      <Input
                        type="tel"
                        name="order_tel"
                        value={form.order_tel}
                        onChange={handleFormChange}
                        placeholder={t("enterPhoneNumber")}
                      />
                    </div>

                    

                    {/* Order Date */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("orderDate")}
                      </label>
                      <DatePicker
                        type="date"
                        name="order_date"
                        value={form.order_date?dayjs(form.order_date):''}
                        onChange={handleFormChange}
                        className="date-picker"
                      />
                    </div>
                    {form.due_date&&<div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("dueDate")}
                      </label>
                      <DatePicker
                        type="date"
                        name="due_date"
                        value={form.due_date?dayjs(form.due_date):''}
                        onChange={handleFormChange}
                        className="date-picker"
                      />
                    </div>}
                    {/* Address */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("deliveryAddress")}
                      </label>
                      <textarea
                        name="order_address"
                        value={form.order_address}
                        onChange={handleFormChange}
                        rows={3}
                        className="textarea-input"
                        placeholder={t("enterDeliveryAddress")}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {t("paymentInfo")}
                  </h3>
                  <div className="space-y-4 flex flex-wrap gap-3">
                    {/* Payment Method */}
                    <div className="grow" >
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("paymentMethod")}
                      </label>
                      <RichSearch
                        data={PAYMENT_METHODS}
                        keyFields={{
                          id: 'value',
                          title: 'label',
                        }}
                        onSelected={handleFormChange}
                        value={form.order_payment_method}
                      />
                    </div>

                    {/* Tax (for wholesale) */}
                    <div className={form.sale_type === "wholesale" ? "block grow" : "hidden"}>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("taxPercentage")}(%)
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          name="order_tax"
                          min="0"
                          max="100"
                          step="0.1"
                          value={form.order_tax}
                          onChange={handleFormChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white" 
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Delivery Fee */}
                    <div className="grow">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("deliveryFee")}($)
                      </label>
                      <div className="relative">
                        
                        <Input
                          type="number"
                          name="delivery_fee"
                          min="0"
                          step="0.01"
                          value={form.delivery_fee}
                          onChange={handleFormChange}
                          className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white" 
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="grow">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                        {t("paymentAmountLabel")}($)
                      </label>
                      <div className="relative">
                        
                        <Input
                          type="number"
                          name="payment"
                          min="0"
                          step="0.01"
                          value={form.payment}
                          onChange={handleFormChange}
                          className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white" 
                              : "bg-white border-gray-300"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    {t("orderSummary")}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className={`flex justify-between items-center pb-2 border-b ${darkMode ? "border-gray-400" : "border-gray-200"}`}>
                        <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("itemsSubtotal")}</span>
                        <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          ${Number(form.order_subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("saleType")}</span>
                          <span className={`font-medium ${form.sale_type === 'sale' ? 'text-green-600' : 'text-blue-600'}`}>
                            {form.sale_type === 'sale' ? t("retail") : t("wholesale")}
                          </span>
                        </div>

                        {form.sale_type === 'wholesale' && (
                          <div className="flex justify-between items-center">
                            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                              {t("tax")} ({form.order_tax}%)
                            </span>
                            <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                              ${Number((Number(form.order_subtotal || 0) * (Number(form.order_tax || 0) / 100))).toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("deliveryFee")}</span>
                          <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            ${Number(form.delivery_fee || 0).toFixed(2)}
                          </span>
                        </div>

                        {form.order_discount > 0 && (
                          <div className="flex justify-between items-center text-green-600">
                            <span>{t("discount")}</span>
                            <span className="font-bold">
                              -${parseFloat(form?.order_discount).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`border-t pt-3 ${darkMode ? "border-gray-400" : "border-gray-200"}`}>
                        <div className="flex justify-between items-center text-lg">
                          <span className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{t("totalAmount")}</span>
                          <span className="font-bold text-green-600">${Number(form.order_total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("payment")}</span>
                          <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            ${Number(form.payment || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{t("balance")}</span>
                          <span className={`font-bold ${form.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            ${Number(form.balance || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className={`mt-2 text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                          {t("paymentStatus")}: <span className={`font-medium ${form.balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {form.balance > 0 ? t("partialPayment") : t("paidInFull")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    variant="success"
                  >
                    {t("update")}
                  </Button>
                  <Link
                    to="/order-list"
                  >
                    <Button
                      variant="danger"
                      outline
                    >
                      {t("cancel")}
                    </Button>
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
