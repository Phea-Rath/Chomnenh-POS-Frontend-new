import React, { useEffect, useMemo, useState } from "react";
import { AiTwotoneDelete } from "react-icons/ai";
import { LuListChecks } from "react-icons/lu";
import { Link, useNavigate } from "react-router";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import {
  Badge,
  Button,
  Drawer,
  Empty,
  message,
  Skeleton,
  Card,
  Tag,
  Divider,
  Tooltip,
  Typography,
  Pagination,
} from "antd";
import { PiShoppingCartBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllOrderQuery } from "../../../app/Features/ordersSlice";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdRemoveCircle } from "react-icons/io";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { useGetExchangeRateByIdQuery } from "../../../app/Features/exchangeRatesSlice";
import { currencyFormat } from "../../services/serviceFunction";
import { FaPercent, FaPalette, FaRuler } from "react-icons/fa";
import { GiSugarCane } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import api from "../../services/api";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { TbShoppingCartOff } from "react-icons/tb";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { useDebounce } from "use-debounce";

// const { Option } = Select;

const initialOrder = {
  order_subtotal: 0,
  order_subtotal_discount: 0,
  order_address: null,
  order_total: 0,
  order_customer_id: 1,
  online: 0,
  status: 6,
  deliver_id: 1,
  sale_type: "sale",
  order_payment_status: "paid",
  order_payment_method: "cash",
  delivery_fee: 0,
  order_discount: 0,
  order_tax: 0,
  balance: 0,
  payment: 0,
  items: [],
};

const Sales = () => {
  const proId = localStorage.getItem("profileId");
  const token = localStorage.getItem("token");
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));
  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id: proId,
    token,
  });

  const navigate = useNavigate();
  const [payment, setPayment] = useState("paid");
  const [alertBox, setAlertBox] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [itemsSech, setItemsSech] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [Category, setCategory] = useState([]);
  const [orders, setOrders] = useState(localOrderItems || initialOrder);
  const [search, setSearch] = useState('');
  const [debounce] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const {
    setLoading,
    open,
    setOpen,
    orderCount,
    setOrderCount,
  } = useOutletsContext();

  const { data: customers } = useGetAllCustomerQuery(token);
  const saleItemContext = useGetAllSaleQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debounce
  });
  const categoryContext = useGetAllCategoriesQuery(token);
  const orderContext = useGetAllOrderQuery(token);
  const { refetch: refetchWaste } = useGetAllWasteQuery(token);

  const items = useMemo(() => saleItemContext?.data?.data || [], [saleItemContext?.data]);
  const totalItems = saleItemContext?.data?.pagination?.total || 0;

  localStorage.setItem("orderItems", JSON.stringify(initialOrder));

  // Helper function to calculate price based on sale type and discount
  const getItemPrice = (item, saleType = "sale") => {
    if (saleType === "sale") {
      return item.price_discount || (item.price * (1 - (item.discount || 0) / 100));
    } else {
      return item.wholesale_price_discount || (item.wholesale_price * (1 - (item.discount || 0) / 100));
    }
  };
  // Parse attributes for display
  const parseAttributesForDisplay = (attributes) => {
    if (!attributes || attributes.length === 0) return null;

    return attributes.map(attr => {
      let displayValue = '';
      let iconType = null;
      let isColor = false;

      if (attr.type === 'select') {
        if (Array.isArray(attr.value)) {
          displayValue = attr.value.map(v => v.value).join(', ');
        } else {
          displayValue = attr.value;
        }

        // Set icon type based on attribute name
        if (attr.name === 'colors') {
          iconType = 'palette';
          isColor = true;
        } else if (attr.name === 'size') {
          iconType = 'ruler';
        } else if (attr.name === 'type') {
          iconType = 'category';
        }
      } else if (attr.type === 'text') {
        displayValue = attr.value;
        if (attr.name === 'sugar') {
          iconType = 'sugarcane';
        }
      }

      return { name: attr.name, value: displayValue, iconType, isColor };
    });
  };

  // Helper function to render the appropriate icon
  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'palette':
        return <FaPalette className="w-3 h-3" />;
      case 'ruler':
        return <FaRuler className="w-3 h-3" />;
      case 'category':
        return <BiCategory className="w-3 h-3" />;
      case 'sugarcane':
        return <GiSugarCane className="w-3 h-3" />;
      default:
        return null;
    }
  };

  // Format color values for display - FIXED: Properly handle string and array values
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

  useEffect(() => {
    if (categoryContext.data?.data) {
      setCategory(categoryContext.data.data);
    }

    if (items) {
      const newItems = items.map((item) => ({
        ...item,
        quantity: 1,
        displayAttributes: parseAttributesForDisplay(item.attributes)
      }));

      setAllItems(newItems);
      setItemsSech(newItems);
    }
  }, [items, categoryContext?.data]);

  // Barcode scanner effect
  useEffect(() => {
    let inputBuffer = "";
    let timeoutId;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === "Enter" && inputBuffer.length > 0) {
        clearTimeout(timeoutId);
        const scannedBarcode = inputBuffer.trim();

        const findItem = allItems?.find(
          (i) => i.barcode && i.barcode.toString() === scannedBarcode
        );

        if (!findItem) {
          toast.error("Item not found for barcode: " + scannedBarcode);
        } else {
          handleOrder(findItem, 1);
        }

        inputBuffer = "";
      } else if (e.key.length === 1) {
        inputBuffer += e.key;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          inputBuffer = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [allItems]);

  // Function to calculate order totals
  const calculateOrderTotals = (items, deliveryFee = 0, tax = 0, saleType = "sale") => {
    let subtotal = 0;
    let totalDiscount = 0;
    if (saleType == 'sale') {
      tax = 0;
    }

    items.forEach(item => {
      const itemPrice = getItemPrice(item, saleType);
      const originalPrice = saleType === "sale" ? item.original_price : item.wholesale_price;
      const itemDiscount = item.discount || 0;

      subtotal += itemPrice * item.quantity;

      if (itemDiscount > 0) {
        const discountAmount = (originalPrice * (itemDiscount / 100)) * item.quantity;
        totalDiscount += discountAmount;
      }
    });

    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal + deliveryFee + taxAmount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number((total).toFixed(2))
    };
  };

  // Handle order
  function handleOrder(item, quantity) {
    console.log(item);

    if (!item) {
      messageApi.open({
        type: "error",
        content: "Item not found",
      });
      return;
    }

    if (item.in_stock <= 0) {
      messageApi.open({
        type: "error",
        content: "Out of stock",
      });
      return;
    }



    // Generate unique key for item based on ID and all attributes
    const attributeKey = item.attributes
      ? JSON.stringify(item.attributes.map(attr => ({
        name: attr.name,
        value: attr.value
      })))
      : '';

    const selectionKey = `${item.id}-${attributeKey}`;

    const sameOrder = orders?.items?.find(
      (orderItem) => orderItem.id === item.id
    );

    if (sameOrder) {
      if (sameOrder.quantity + Number(quantity) > item.in_stock) {
        messageApi.open({
          type: "error",
          content: "Not enough stock available",
        });
        return;
      }
      // Item already exists, increment qty
      setOrders((prev) => {
        const updatedItems = prev.items.map((orderItem) => {
          if (orderItem.selectionKey === selectionKey) {
            const newQuantity = Number(orderItem.quantity) + Number(quantity);
            const price = getItemPrice(item, prev.sale_type);
            return {
              ...orderItem,
              quantity: newQuantity,
              price: parseFloat(price * newQuantity),
            };
          }
          return orderItem;
        });

        const totals = calculateOrderTotals(
          updatedItems,
          prev.delivery_fee || 0,
          prev.order_tax || 0,
          prev.sale_type
        );

        const order_discount = updatedItems.reduce((acc, curr) => {
          const originalPrice = prev.sale_type === "sale"
            ? curr.original_price
            : curr.wholesale_price;
          return acc + (originalPrice * curr.quantity * (curr.discount / 100));
        }, 0);

        const results = {
          ...prev,
          items: updatedItems,
          order_discount: parseFloat(order_discount.toFixed(2)),
          order_subtotal: totals.subtotal,
          order_subtotal_discount: totals.subtotal,
          order_total: totals.total,
          payment: Number(
            (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
          ),
          balance: Number(
            (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
          ),
        };
        messageApi.open({
          type: "success",
          content: `Added ${item?.name} to cart`,
        });
        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
    } else {
      const price = getItemPrice(item, orders.sale_type);

      setOrders((prev) => {
        const updatedItems = [
          ...prev.items,
          {
            id: item.id,
            code: item.code,
            barcode: item.barcode,
            name: item.name,
            cost: item.cost,
            image: item.image,
            images: item.images,
            price: Number(price * Number(quantity)),
            quantity: quantity,
            discount: item.discount,
            original_price: orders.sale_type === "sale" ? item.price : item.wholesale_price,
            displayAttributes: item.displayAttributes,
            selectionKey: selectionKey,
            stock_in: item?.stock_in,
            in_stock: item?.in_stock,
            wholesale_price: item.wholesale_price,
            wholesale_price_discount: item.wholesale_price_discount,
            price_discount: item.price_discount,
          },
        ];

        const totals = calculateOrderTotals(
          updatedItems,
          prev.delivery_fee || 0,
          prev.order_tax || 0,
          prev.sale_type
        );
        const order_discount = updatedItems.reduce((acc, curr) => {
          const originalPrice = prev.sale_type === "sale"
            ? curr.original_price
            : curr.wholesale_price;
          return acc + (originalPrice * curr.quantity * (curr.discount / 100));
        }, 0);

        const results = {
          ...prev,
          items: updatedItems,
          order_discount: parseFloat(order_discount.toFixed(2)),
          order_subtotal: totals.subtotal,
          order_subtotal_discount: totals.subtotal,
          order_total: totals.total,
          payment: parseFloat(
            (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
          ),
          balance: parseFloat(
            (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
          ),
        };

        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
    }
    messageApi.open({
      type: "success",
      content: `Added ${item?.name} to cart`,
    });
    // Update order count
    const storedOrder = JSON.parse(localStorage.getItem("orderItems") || "{}");
    const newCount = storedOrder.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
    setOrderCount(newCount);
  }

  function handleQtyPlus(id, selectionKey) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );
    console.log(findItem);


    if (!findItem) return;

    if (findItem.quantity >= findItem.in_stock) {
      messageApi.open({
        type: "error",
        content: "Not enough stock available",
      });
      return;
    }

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity + 1;
          const price = getItemPrice(item, prev.sale_type);
          return {
            ...item,
            quantity: newQuantity,
            price: Number(price * newQuantity),
          };
        }
        return item;
      });

      const totals = calculateOrderTotals(
        updatedItems,
        prev.delivery_fee || 0,
        prev.order_tax || 0,
        prev.sale_type
      );

      const results = {
        ...prev,
        items: updatedItems,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number(
          (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
        ),
        balance: Number(
          (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });

    const storedOrder = JSON.parse(localStorage.getItem("orderItems") || "{}");
    const newCount = storedOrder.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
    setOrderCount(newCount);
  }

  function handleQty(id, selectionKey) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );

    if (!findItem || findItem.quantity <= 1) return;

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity - 1;
          const price = getItemPrice(item, prev.sale_type);
          console.log(getItemPrice(item, prev.sale_type));

          return {
            ...item,
            quantity: newQuantity,
            price: Number(price * newQuantity),
          };
        }
        return item;
      });

      const totals = calculateOrderTotals(
        updatedItems,
        prev.delivery_fee || 0,
        prev.order_tax || 0,
        prev.sale_type
      );

      const results = {
        ...prev,
        items: updatedItems,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number(
          (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
        ),
        balance: Number(
          (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });

    const storedOrder = JSON.parse(localStorage.getItem("orderItems") || "{}");
    const newCount = storedOrder.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
    setOrderCount(newCount);
  }

  function handleDelete(id, selectionKey) {

    const findItem = orders.items.find((item, index) =>
      item.id === id && index === selectionKey
    );
    console.log(orders.items);

    if (!findItem) return;

    setOrders((prev) => {
      const updatedItems = prev.items.filter((item, index) =>
        !(item.id === id && index === selectionKey)
      );

      const totals = calculateOrderTotals(
        updatedItems,
        prev.delivery_fee || 0,
        prev.order_tax || 0,
        prev.sale_type
      );

      const results = {
        ...prev,
        items: updatedItems,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number(
          (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
        ),
        balance: Number(
          (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });

    const storedOrder = JSON.parse(localStorage.getItem("orderItems") || "{}");
    const newCount = storedOrder.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
    setOrderCount(newCount);

    messageApi.open({
      type: "success",
      content: `Removed ${findItem.name} from cart`,
    });
  }

  async function handleConfirm() {
    const toDay = new Date();

    // Prepare items with attribute selections
    const itemsWithAttributes = orders.items.map(item => {
      console.log(item);

      const attributeData = [];
      if (item.attribute_selections) {
        Object.values(item.attribute_selections).forEach(selection => {
          if (selection) {
            attributeData.push({
              name_id: selection.attribute_id,
              value_id: selection.value_id
            });
          }
        });
      }

      return {
        item_id: item.id,
        quantity: item.quantity,
        price: item.price / item.quantity, // Price per unit
        discount: item.discount || 0,
        item_name: item.name,
        item_cost: item.cost || 0,
        item_price: (orders.sale_type === 'sale' ? item.original_price : item.wholesale_price) || 0,
        expire_date: toDay.toISOString().split("T")[0],
        attributes: attributeData
      };
    });

    const payload = {
      ...orders,
      order_tel: orders.order_tel || "0",
      online: 0,
      status: 6,
      order_discount: calculateTotalDiscount() || 0,
      order_address: orders.order_address || "unknown",
      items: itemsWithAttributes
    };

    console.log(payload);


    try {
      setLoading(true);
      setAlertBox(false);

      const orderRes = await api.post("/order_masters", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (orderRes.data.status === 200) {
        toast.success(orderRes.data.message || "Order created successfully");

        // Refresh data
        if (saleItemContext?.refetch) saleItemContext.refetch();
        if (orderContext?.refetch) orderContext.refetch();
        // if (orderId?.refetch) orderId.refetch();
        refetchWaste();

        setAlertBox(false);
        setLoading(false);
        setOrderCount(0);
        setOpen(false);
        localStorage.setItem("orderItems", JSON.stringify(initialOrder));
        setOrders(initialOrder);

        // Navigate to receipt/invoice
        const path = payload.sale_type === "sale"
          ? `/dashboard/order-list/receipt/${orderRes.data.data.order_id}`
          : `/dashboard/order-list/invoice/${orderRes.data.data.order_id}`;
        navigate(path);
      } else {
        throw new Error(orderRes.data.message || "Failed to create order");
      }
    } catch (error) {
      setAlertBox(false);
      setLoading(false);
      toast.error(
        error.response?.data?.message || error.message || "An error occurred while creating the order"
      );
    }
  }

  async function handleSubmit() {
    setAlertBox(true);
  }

  function onFilterCategory(e) {
    const value = e.target.value;

    if (value === "all") {
      setItemsSech(allItems);
    } else if (value) {
      const filterItem = allItems?.filter(
        (item) => item.category_id == value
      );
      setItemsSech(filterItem);
    } else {
      setItemsSech(allItems);
    }
  }

  function onSearch(e) {
    const value = e.target.value;
    if (value) {
      const filterItem = allItems?.filter((item) =>
        item.name?.toLowerCase().includes(value.toLowerCase()) ||
        item.code?.toLowerCase().includes(value.toLowerCase())
      );
      setItemsSech(filterItem || []);
    } else {
      setItemsSech(allItems);
    }
  }

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const handleSaleType = (e) => {
    const newSaleType = e.target.value;

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        const price = getItemPrice(item, newSaleType);
        return {
          ...item,
          price: Number(price * item.quantity),
        };
      });

      const totals = calculateOrderTotals(
        updatedItems,
        prev.delivery_fee || 0,
        prev.order_tax || 0,
        newSaleType
      );

      const results = {
        ...prev,
        items: updatedItems,
        sale_type: newSaleType,
        order_customer_id: newSaleType === "sale" ? 1 : 0,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        deliver_id: 1,
        payment: Number(
          (prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)
        ),
        balance: Number(
          (totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)
        ),
      };
      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  };

  // Calculate total discount for display
  const calculateTotalDiscount = () => {
    let totalDiscount = 0;
    console.log(orders.items);

    orders.items.forEach(item => {
      if (item.discount > 0) {
        const originalPrice = orders.sale_type === "sale"
          ? (item.original_price)
          : item.wholesale_price;
        const discountAmount = (originalPrice * (item.discount / 100)) * item.quantity;
        totalDiscount += discountAmount;
      }
    });
    return Number(totalDiscount.toFixed(2));
  };

  // Helper function to render attributes display
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
              {renderIcon(attr.iconType)}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent"
    >
      <section className="p-3">
        {contextHolder}
        <AlertBox
          isOpen={alertBox}
          title="Confirm Order"
          message="Are you sure you want to create this order?"
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText="Confirm"
          cancelText="Cancel"
        />

        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Point of Sale</h1>
              <p className="text-gray-600">Select products and create orders</p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/dashboard/order-list">
                <button className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium">
                  <LuListChecks />
                  View Orders
                </button>
              </Link>

              <div className="relative">
                <button
                  onClick={showDrawer}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:border-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  <PiShoppingCartBold />
                  View Cart
                </button>
                {orderCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full text-white text-xs font-medium flex items-center justify-center">
                    {orderCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="border border-gray-200 rounded bg-white p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    placeholder="Search products by name or code..."
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <select
                onChange={onFilterCategory}
                defaultValue="all"
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="all">All Categories</option>
                {Category.map((item) => (
                  <option key={item.category_id} value={item.category_id}>
                    {item.category_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          {itemsSech?.length === 0 ? (
            saleItemContext?.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="border border-gray-200 rounded p-4 animate-pulse bg-white">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-gray-200 rounded bg-white p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <PiShoppingCartBold className="w-full h-full" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => navigate("/dashboard/add-to-stock")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Add Products to Stock
                </button>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
              {itemsSech?.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="border border-gray-200 rounded bg-white hover:shadow-sm transition-all duration-300 h-full"
                >
                  <div className="p-4">
                    {/* Product Image */}
                    <div className="relative mb-4 overflow-hidden rounded bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-48 object-contain p-4 hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=256`;
                        }}
                      />
                      {/* Stock Badge */}
                      {item.in_stock !== undefined && (
                        <span
                          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${item.in_stock <= 5 ? 'bg-red-500' : 'bg-green-500'
                            }`}
                        >
                          {item.in_stock}
                        </span>
                      )}
                      {/* Discount Badge */}
                      {item.discount > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-red-500 to-pink-600">
                          -{item.discount}%
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm line-clamp-1 mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500 font-mono">{item.code}</p>
                      </div>

                      {/* Price Information */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              ${getItemPrice(item, "sale").toFixed(2)}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                ${item.price.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-600">Wholesale</div>
                            <div className="text-sm font-medium text-blue-600">
                              ${getItemPrice(item, "wholesale").toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleOrder(item, item.quantity)}
                          disabled={item.in_stock <= 0}
                          className={`p-2 rounded ${item.in_stock <= 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {item.in_stock <= 0 ? <TbShoppingCartOff /> : <MdOutlineAddShoppingCart />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary Drawer */}
        {open && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-xl transform transition-transform">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PiShoppingCartBold className="text-blue-500" />
                  Order Summary
                  {orderCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                      {orderCount}
                    </span>
                  )}
                </h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {orders?.items?.length === 0 ? (
                    <div className="text-center py-12">
                      <PiShoppingCartBold className="text-gray-400 text-4xl mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                      <p className="text-gray-400 text-sm mt-2">Add products from the list</p>
                    </div>
                  ) : (
                    orders?.items?.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="relative border border-gray-200 rounded p-3 bg-gray-50"
                      >
                        <button
                          onClick={() => handleDelete(item.id, index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                        >
                          ×
                        </button>
                        <div className="flex gap-3">
                          {/* Item Image */}
                          <div className="flex-shrink-0 w-16 h-16 border border-gray-300 rounded bg-white p-1">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=128`;
                              }}
                            />
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-xs text-gray-500">{item.barcode}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-600">
                                  ${(item.price / item.quantity).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">each</div>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQty(item.id, item.selectionKey)}
                                  className="w-7 h-7 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-medium text-gray-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQtyPlus(item.id, item.selectionKey)}
                                  className="w-7 h-7 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <div className="font-bold text-blue-600">
                                ${item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {orders?.items?.length > 0 && (
                  <div className="space-y-4">
                    <hr className="border-gray-200" />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-800">${currencyFormat(orders?.order_subtotal)}</span>
                      </div>

                      {calculateTotalDiscount() > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <FaPercent className="text-xs" /> Total Discount
                          </span>
                          <span className="font-medium">-${currencyFormat(calculateTotalDiscount())}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Delivery Fee</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={orders?.delivery_fee || ""}
                            onChange={(e) => {
                              const deliveryFee = Number(e.target.value) || 0;
                              const totals = calculateOrderTotals(
                                orders.items,
                                deliveryFee,
                                orders.order_tax || 0,
                                orders.sale_type
                              );
                              const results = {
                                ...orders,
                                delivery_fee: deliveryFee,
                                order_total: totals.total,
                                payment: orders.order_payment_status === "paid" ? totals.total : 0,
                                balance: orders.order_payment_status === "paid" ? 0 : totals.total,
                              };
                              localStorage.setItem("orderItems", JSON.stringify(results));
                              setOrders(results);
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Sale Type</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSaleType({ target: { value: 'sale' } })}
                            className={`flex-1 py-1.5 text-sm border rounded ${orders?.sale_type === 'sale'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            Retail
                          </button>
                          <button
                            onClick={() => handleSaleType({ target: { value: 'wholesale' } })}
                            className={`flex-1 py-1.5 text-sm border rounded ${orders?.sale_type === 'wholesale'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            Wholesale
                          </button>
                        </div>
                      </div>

                      <div className={`flex justify-between items-center ${orders?.sale_type === "sale" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600">Tax (%)</label>
                        <input
                          type="number"
                          value={orders?.order_tax || ""}
                          onChange={(e) => {
                            const tax = Number(e.target.value) || 0;
                            const totals = calculateOrderTotals(
                              orders.items,
                              orders.delivery_fee || 0,
                              tax,
                              orders.sale_type
                            );
                            const results = {
                              ...orders,
                              order_tax: tax,
                              order_total: totals.total,
                              payment: orders.order_payment_status === "paid" ? totals.total : 0,
                              balance: orders.order_payment_status === "paid" ? 0 : totals.total,
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">Payment Method</label>
                        <select
                          value={orders?.order_payment_method || "cash"}
                          onChange={(e) => {
                            const results = { ...orders, order_payment_method: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank">Bank</option>
                        </select>
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">Payment</label>
                        <select
                          value={orders?.order_payment_status || "paid"}
                          onChange={(e) => {
                            const value = e.target.value;
                            const results = {
                              ...orders,
                              order_payment_status: value,
                              balance: value === "paid" ? 0 : orders.order_total,
                              payment: value === "paid" ? orders.order_total : 0,
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                            setPayment(value);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                        >
                          <option value="paid">Paid</option>
                          <option value="cod">In debt</option>
                        </select>
                      </div>

                      <div className={`flex justify-between items-center ${orders?.sale_type === "sale" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600">Customer</label>
                        <select
                          value={orders?.order_customer_id || 0}
                          onChange={(e) => {
                            const customerId = Number(e.target.value);
                            const customerFind = customers?.data?.find((c) => c.customer_id === customerId);
                            const results = {
                              ...orders,
                              order_customer_id: customerId,
                              order_tel: customerFind?.customer_tel || "",
                              order_address: customerFind?.customer_address || "",
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                        >
                          <option value={0}>Customer...</option>
                          {customers?.data?.map((customer) => (
                            <option key={customer.customer_id} value={customer.customer_id}>
                              {customer.customer_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`flex justify-between items-center ${payment === "paid" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600">Pay</label>
                        <input
                          type="number"
                          value={orders?.payment || ""}
                          onChange={(e) => {
                            const paymentAmount = Number(e.target.value) || 0;
                            const results = {
                              ...orders,
                              payment: paymentAmount,
                              balance: orders.order_total - paymentAmount,
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className={`flex justify-between items-center text-orange-600 ${payment === "paid" ? "hidden" : ""}`}>
                        <span className="text-sm">Remaining Balance</span>
                        <span className="font-medium">${currencyFormat(orders?.balance || 0)}</span>
                      </div>

                      <div className={`${orders?.sale_type !== "sale" ? "hidden" : ""}`}>
                        <label className="block text-sm text-gray-600 mb-1">Customer Tel</label>
                        <input
                          type="tel"
                          value={orders?.order_tel || ""}
                          onChange={(e) => {
                            const results = { ...orders, order_tel: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="000-0000-000"
                        />
                      </div>

                      <div className={`${orders?.sale_type !== "sale" ? "hidden" : ""}`}>
                        <label className="block text-sm text-gray-600 mb-1">Customer Address</label>
                        <textarea
                          value={orders?.order_address || ""}
                          onChange={(e) => {
                            const results = { ...orders, order_address: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="address"
                          rows="3"
                        />
                        <p className="text-xs text-gray-400 mt-1">Optional</p>
                      </div>

                      <hr className="border-gray-200" />

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total Amount</span>
                          <div className="text-right">
                            <div className="text-green-600">${currencyFormat(orders?.order_total)}</div>
                            {exchangeRate?.data?.usd_to_khr && (
                              <div className="text-xs text-gray-500">
                                ≈ ៛{currencyFormat(orders?.order_total * exchangeRate.data.usd_to_khr)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4">
                      <button
                        onClick={handleSubmit}
                        className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 text-lg font-bold"
                      >
                        Process Order
                      </button>
                      <button
                        onClick={() => {
                          setOrders(initialOrder);
                          localStorage.setItem("orderItems", JSON.stringify(initialOrder));
                          setOrderCount(0);
                          toast.success("Cart cleared successfully");
                        }}
                        className="w-full py-2 border border-gray-300 bg-white text-gray-700 rounded hover:border-red-300 hover:text-red-600 text-sm"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded p-2">
            <button
              onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              ⟪
            </button>
            <button
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              ⟨
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {Math.ceil(totalItems / pageSize)}
            </span>
            <button
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / pageSize))); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === Math.ceil(totalItems / pageSize)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              ⟩
            </button>
            <button
              onClick={() => { setCurrentPage(Math.ceil(totalItems / pageSize)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === Math.ceil(totalItems / pageSize)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              ⟫
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Sales;