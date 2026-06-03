import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Modal,
  DatePicker,
} from "antd";
import { PiShoppingCartBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllBrandQuery } from "../../../app/Features/brandsSlice";
import { 
  useGetAllOrderQuery,
  useGetPopularOrderQuery,
  useGetPersentOrderMonthlyQuery 
} from "../../../app/Features/ordersSlice";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
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
import { MdOutlineAddShoppingCart, MdOutlineTableChart, MdOutlineGridView } from "react-icons/md";
import { TbShoppingCartOff } from "react-icons/tb";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { useDebounce } from "use-debounce";
import { QRCodeCanvas } from "qrcode.react";
import bakong from "../../assets/bakong.png"
import handleDownload from "../../services/imageDowload";
import * as qrService from "../../services/qrPaymentService";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import RichSearch from "../../utils/RichSearch";
import { LuEye, LuFileText, LuTrash2, LuBan, LuRotateCcw, LuCreditCard } from "react-icons/lu";
import { BiEdit } from "react-icons/bi";
import { IoIosImages } from "react-icons/io";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "../../services/paymentService";

// const { Option } = Select;

const initialOrder = {
  order_subtotal: 0,
  order_subtotal_discount: 0,
  order_address: null,
  order_total: 0,
  order_customer_id: 1,
  online: 0,
  transection_id:null,
  term: 0,
  due_date: null,
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
  const { t } = useTranslation();
  const proId = localStorage.getItem("profileId");
  const token = localStorage.getItem("token");
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));

  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id: proId,
    token,
  });

  const navigate = useNavigate();
  const qrPaymentRef = useRef();
  const [payment, setPayment] = useState("paid");
  const [alertBox, setAlertBox] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [qrMd5, setQrMd5] = useState("");
  const [qrCountdown, setQrCountdown] = useState(0);
  const [qrStatus, setQrStatus] = useState("idle");
  const qrCountdownRef = useRef(null);
  const qrVerifyRef = useRef(null);
  const qrStatusRef = useRef("idle");
  const [allItems, setAllItems] = useState([]);
  const [itemsSech, setItemsSech] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [Category, setCategory] = useState([]);
  const [Brand, setBrand] = useState([]);
  const [viewMode, setViewMode] = useState("products"); // 'products' or 'orders'
  const [orders, setOrders] = useState(localOrderItems || initialOrder);
  const [search, setSearch] = useState('');
  const [debounce] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const {
    setLoading,
    open,
    setOpen,
    darkMode,
    orderCount,
    setOrderCount,
  } = useOutletsContext();

  const { data: customers } = useGetAllCustomerQuery(token);
  const saleItemContext = useGetAllSaleQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debounce,
    category_id: categoryId,
    brand_id: brandId
  });
  const categoryContext = useGetAllCategoriesQuery(token);
  const brandContext = useGetAllBrandQuery(token);
  const orderContext = useGetAllOrderQuery({  
    token, 
    limit: pageSize, 
    page: currentPage, 
    search: debounce,
    category_id: categoryId,
    brand_id: brandId
  });
  const { data: popularOrders } = useGetPopularOrderQuery(token);
  const { data: percentMonthly } = useGetPersentOrderMonthlyQuery(token);
  const { refetch: refetchWaste } = useGetAllWasteQuery(token);

  const items = useMemo(() => saleItemContext?.data?.data || [], [saleItemContext?.data]);
  const orderList = useMemo(() => orderContext?.data?.data || [], [orderContext?.data]);
  const totalItems = viewMode === "products" 
    ? (saleItemContext?.data?.pagination?.total || 0)
    : (orderContext?.data?.pagination?.total || 0);

  // localStorage.setItem("orderItems", JSON.stringify(initialOrder));

  // Helper function to calculate price based on sale type and discount
  const getItemPrice = (item, saleType = "sale") => {
    if (saleType === "sale") {
      // In cart item, original_price is the retail unit price.
      // In catalog item, price is the retail unit price.
      // Cart items have selectionKey, catalog items don't.
      if (item.selectionKey) return item.original_price;
      return item.price;
    } else {
      // Both catalog and cart items store wholesale_price as unit price.
      return item.wholesale_price;
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
    if (brandContext.data?.data) {
      setBrand(brandContext.data.data);
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
          (i) => i.barcode && i.barcode.toString() == scannedBarcode
        );

        if (!findItem) {
          toast.error(t("itemNotFound") + ": " + scannedBarcode);
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
    console.log(item, orders);
    const ordersItems = JSON.parse(localStorage.getItem("orderItems"))?.items || [];

    if (!item) {
      messageApi.open({
        type: "error",
        content: t("itemNotFound"),
      });
      return;
    }

    if (item.in_stock <= 0) {
      messageApi.open({
        type: "error",
        content: t("outOfStock"),
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

    const sameOrder = ordersItems?.find(
      (orderItem) => orderItem.id == item.id
    );

    if (sameOrder) {
      if (sameOrder.quantity + Number(quantity) > item.in_stock) {
        messageApi.open({
          type: "error",
          content: t("notEnoughStock"),
        });
        return;
      }
      // Item already exists, increment qty
      setOrders((prev) => {
        const updatedItems = prev.items.map((orderItem) => {
          if (orderItem.selectionKey === selectionKey) {
            const newQuantity = Number(orderItem.quantity) + Number(quantity);
            const unitPrice = getItemPrice(item, prev.sale_type);
            return {
              ...orderItem,
              quantity: newQuantity,
              price: parseFloat((unitPrice * newQuantity).toFixed(2)),
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

        const results = {
          ...prev,
          items: updatedItems,
          order_discount: totals.totalDiscount,
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
          content: `${t("addedToCart")}: ${item?.name}`,
        });
        localStorage.setItem("orderItems", JSON.stringify(results));
        const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
        setOrderCount(newCount);
        return results;
      });
    } else {
      const unitPrice = getItemPrice(item, orders.sale_type);

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
            price: Number((unitPrice * Number(quantity)).toFixed(2)),
            quantity: quantity,
            discount: item.discount,
            original_price: item.price, // Always store retail price here
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

        const results = {
          ...prev,
          items: updatedItems,
          order_discount: totals.totalDiscount,
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
        const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
        setOrderCount(newCount);
        return results;
      });
    }
    messageApi.open({
      type: "success",
      content: `${t("addedToCart")}: ${item?.name}`,
    });
  }

  // Function to increase quantity
  function handleQtyPlus(id, selectionKey) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );

    if (!findItem) return;

    // Check total quantity of this product ID in cart against available stock
    const cartQtyOfProduct = orders.items
      .filter(item => item.id === id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (cartQtyOfProduct >= findItem.in_stock) {
      messageApi.open({
        type: "error",
        content: t("notEnoughStock"),
      });
      return;
    }

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity + 1;
          const unitPrice = getItemPrice(item, prev.sale_type);
          return {
            ...item,
            quantity: newQuantity,
            price: Number((unitPrice * newQuantity).toFixed(2)),
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
        order_discount: totals.totalDiscount,
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
      const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
      setOrderCount(newCount);
      return results;
    });
  }

  // Function to handle input quantity
  function handleInputQuantity(id, selectionKey, qty) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );

    if (!findItem) return;

    const otherItemsQty = orders.items
      .filter(item => item.id === id && item.selectionKey !== selectionKey)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (otherItemsQty + Number(qty) > findItem.in_stock) {
      messageApi.open({
        type: "error",
        content: t("notEnoughStock"),
      });
      return;
    }

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = Number(qty);
          const unitPrice = getItemPrice(item, prev.sale_type);
          return {
            ...item,
            quantity: newQuantity,
            price: Number((unitPrice * newQuantity).toFixed(2)),
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
        order_discount: totals.totalDiscount,
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
      const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
      setOrderCount(newCount);
      return results;
    });
  }

  // Function to decrease quantity
  function handleQty(id, selectionKey) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );

    if (!findItem || findItem.quantity <= 1) return;

    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity - 1;
          const unitPrice = getItemPrice(item, prev.sale_type);

          return {
            ...item,
            quantity: newQuantity,
            price: Number((unitPrice * newQuantity).toFixed(2)),
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
        order_discount: totals.totalDiscount,
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
      const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
      setOrderCount(newCount);
      return results;
    });
  }

  // Function to delete item
  function handleDelete(id, selectionKey) {

    const findItem = orders.items.find((item, index) =>
      item.id === id && index === selectionKey
    );

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
        order_discount: totals.totalDiscount,
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
      const newCount = results.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
      setOrderCount(newCount);
      return results;
    });

    messageApi.open({
      type: "success",
      content: `Removed ${findItem.name} from cart`,
    });
  }



  async function handleConfirm() {
    const toDay = new Date();


    // Prepare items with attribute selections
    const itemsWithAttributes = orders.items.map(item => {
  

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
        total_price: item.price / item.quantity, // Price per unit
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
      order_date: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      items: itemsWithAttributes
    };



    try {
      setLoading(true);
      setAlertBox(false);

      const orderRes = await api.post("/order_masters", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (orderRes.data.status === 200) {
        toast.success(t("orderCreatedSuccessfully"));

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
          ? `/receipt/${orderRes.data.data.order_id}`
          : `/invoice/${orderRes.data.data.order_id}`;
        navigate(path);
      } else {
        throw new Error(orderRes.data.message || t("failedToCreateOrder"));
      }
    } catch (error) {
      setAlertBox(false);
      setLoading(false);
      toast.error(
        error.message || t("failedToCreateOrder")
      );
    }
  }

  const clearQrTimers = () => {
    if (qrCountdownRef.current) {
      clearInterval(qrCountdownRef.current);
      qrCountdownRef.current = null;
    }
    if (qrVerifyRef.current) {
      clearInterval(qrVerifyRef.current);
      qrVerifyRef.current = null;
    }
  };

  const setQrStatusSafe = (status) => {
    qrStatusRef.current = status;
    setQrStatus(status);
  };

  const closeQrModal = () => {
    clearQrTimers();
    setQrStatusSafe("idle");
    setQrCountdown(0);
    setQrMd5("");
    setQrValue("");
    setQrModalOpen(false);
  };

  const startQrCountdown = () => {
    setQrCountdown(300); // 5 minutes (300 seconds)
    qrCountdownRef.current = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearQrTimers();
          setQrStatusSafe("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startQrVerify = (md5Hash) => {
    qrVerifyRef.current = setInterval(async () => {
      if (qrStatusRef.current !== "waiting") return;
      try {
        const res = await api.get(`/verify-payment/${md5Hash}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const isPaid =
          res?.data?.status === "PAID" ||
          res?.data?.responseCode === 0 ||
          res?.data?.raw?.responseCode === 0 ||
          res?.data?.raw?.status?.code === 0;

        if (isPaid) {
          clearQrTimers();
          setQrStatusSafe("paid");
          Modal.success({
            title: t("orderPaymentSuccess"),
            content: t("orderPaymentReceivedContent"),
            onOk: () => {
              closeQrModal();
              handleConfirm();
            },
          });
        }
      } catch (error) {
        // Ignore transient errors during polling
      }
    }, 3000);
  };

  const startQrFlow = (md5Hash) => {
    clearQrTimers();
    setQrMd5(md5Hash);
    setQrStatusSafe("waiting");
    startQrCountdown();
    startQrVerify(md5Hash);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("darkMode");
      setDarkMode(saved ? JSON.parse(saved) : false);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    return () => {
      clearQrTimers();
    };
  }, []);

  const handleShowQr = async () => {
    try {
      setQrLoading(true);
      // Logic: if status is paid, use total. If not paid (cod/credit), use the 'payment' field (current amount paid).
      const rawAmount = orders.order_payment_status === "paid" ? orders.order_total : orders.payment;

      const rate = exchangeRate?.data?.usd_to_khr || null;
      const amount = rate ? Math.round(rawAmount * rate) : rawAmount;
      const currency = rate ? "KHR" : "USD";

      // if (!amount || amount <= 0) {
      //   toast.warning("Payment amount must be greater than 0 for QR payment");
      //   return;
      // }

      const res = await api.get("/get-qrcode", {
        params: { amount, currency },
        headers: { Authorization: `Bearer ${token}` },
      });
      const qrString = res?.data?.qr || "";
      const md5Hash = res?.data?.md5 || "";

      if (!qrString || !md5Hash) {
        throw new Error("QR code not available");
      }
      setQrValue(qrString);
      setQrModalOpen(true);
      startQrFlow(md5Hash);
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to get QR code"
      );
    } finally {
      setQrLoading(false);
    }
  };

  async function handleSubmit() {
    if (orders.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if(orders.sale_type === "wholesale" && !orders.order_customer_id){
      toast.error("Please select a customer for wholesale orders");
      return;
    }

    modal.confirm({
      title: t("orderProcessingOptions"),
      zIndex: 3000,
      icon: <PiShoppingCartBold className="text-indigo-600 text-2xl" />,
      content: (
        <div className="py-2">
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>{t("howToProceed")}</p>
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-indigo-950/30 border-indigo-900" : "bg-indigo-50 border-indigo-100"}`}>
              <span className={`font-bold block ${darkMode ? "text-indigo-400" : "text-indigo-700"}`}>{t("qrPayment")}</span>
              <span className={`text-xs ${darkMode ? "text-indigo-500" : "text-indigo-500"}`}>{t("displayQrCode")}</span>
            </div>
            <div className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-100"}`}>
              <span className={`font-bold block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t("directReport")}</span>
              <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>{t("confirmOrderDirectly")}</span>
            </div>
          </div>
        </div>
      ),
      okText: t("qrPayment"),
      cancelText: t("directReport"),
      centered: true,
      width: 450,
      okButtonProps: { className: 'bg-indigo-600 hover:bg-indigo-700' },
      onOk: () => {
        handleShowQr();
      },
      onCancel: (e) => {
        // If they didn't just close the modal via 'X' or ESC, show the confirmation for direct report
        // if (e.triggerCancel) return;
        // e.cancel();
        setAlertBox(true);
      },
    });
  }

  const downloadQR = () => {
    handleDownload(qrPaymentRef, "png", `order-qr-${Date.now()}`);
  };

  const sendQrToTelegram = async () => {
    try {
      setQrLoading(true);
      const rawAmount = orders.order_payment_status === "paid" ? orders.order_total : orders.payment;
      const rate = exchangeRate?.data?.usd_to_khr || null;
      const amount = rate ? Math.round(rawAmount * rate) : rawAmount;
      const currency = rate ? "KHR" : "USD";

      // Capture QR Image from canvas inside the ref
      const canvas = qrPaymentRef.current?.querySelector("canvas");
      const qrImage = canvas ? canvas.toDataURL("image/png") : null;

      if (!qrImage) {
        throw new Error("Could not capture QR image");
      }

      await api.post("/send-qr-to-telegram", {
        qr_string: qrValue,
        amount,
        currency,
        qr_image: qrImage
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("QR Photo sent to Telegram");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send QR to Telegram");
    } finally {
      setQrLoading(false);
    }
  };

  function onFilterCategory(e) {
    const value = e.target.value === "all" ? "" : e.target.value;
    setCategoryId(value);
    setCurrentPage(1);
  }

  function onFilterBrand(e) {
    const value = e.target.value === "all" ? "" : e.target.value;
    setBrandId(value);
    setCurrentPage(1);
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
        due_date: newSaleType === "sale" ? null : prev.due_date,
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
        {modalContextHolder}
        <AlertBox
          isOpen={alertBox}
          title="Confirm Order"
          message="Are you sure you want to create this order?"
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText="Confirm"
          cancelText="Cancel"
        />
        <Modal
          open={qrModalOpen}
          onCancel={closeQrModal}
          centered
          zIndex={3000}
          width={400}
          footer={[
            <div className={`flex flex-col gap-2 w-full p-4 border-t border-gray-100 bg-primary dark:border-gray-700`} key="footer-group">
              <div className="flex gap-2 w-full">
                <Button key="download" className={`flex-1 h-10 font-bold border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950`} onClick={downloadQR}>
                  {t("download")}
                </Button>
                <Button key="telegram" className={`flex-1 h-10 font-bold border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-500 dark:hover:bg-blue-950`} onClick={sendQrToTelegram} loading={qrLoading}>
                  {t("telegram")}
                </Button>
              </div>
              <Button key="cancel" className={`w-full h-10 text-gray-600 font-bold hover:bg-gray-200 border-none bg-transparent dark:text-gray-300 dark:hover:bg-gray-600`} onClick={closeQrModal}>
                {t("close")}
              </Button>
              <Button
                key="confirm"
                type="primary"
                className="w-full h-12 font-black text-lg shadow-lg"
                disabled={qrStatus !== "paid"}
                onClick={() => {
                  closeQrModal();
                  handleConfirm();
                }}
              >
                {t("confirmPayment")}
              </Button>
            </div>,
          ]}
          styles={{
            content: { padding: 0, overflow: 'hidden', borderRadius: '24px', backgroundColor: darkMode ? '#1f2937' : '#ffffff' },
            header: { display: 'none' }
          }}
        >
          <div className="bg-gradient-to-b from-[#e31a22] to-[#9e1217] text-white p-6 pb-10 text-center relative">
            <div className="absolute top-4 left-4 font-black text-2xl opacity-20 tracking-tighter italic">KHQR</div>
            <div className="mb-4">
              <div className="inline-block bg-white p-2 rounded-xl shadow-lg mb-4">
                <img src={bakong} alt="Bakong" className="h-8 object-contain" />
              </div>
              <h2 className="text-xl font-black tracking-wide uppercase">{t("scanToPay")}</h2>
              <div className="text-3xl font-black mt-2">
                {orders.order_payment_status === "paid" ? orders.order_total : orders.payment}
                <span className="text-lg ml-1 font-medium">{exchangeRate?.data?.usd_to_khr ? "USD" : "$"}</span>
              </div>
              {exchangeRate?.data?.usd_to_khr && (
                <div className="text-sm opacity-80 font-bold mt-1">
                  ≈ ៛ {currencyFormat((orders.order_payment_status === "paid" ? orders.order_total : orders.payment) * exchangeRate.data.usd_to_khr)}
                </div>
              )}
            </div>
          </div>

          <div className="px-8 -mt-8 relative z-10">
            <div className={`p-4 rounded-3xl shadow-2xl border-4 flex flex-col items-center border-white bg-primary dark:border-gray-700`}>
              {qrLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : qrValue ? (
                <div ref={qrPaymentRef} className="relative p-2 bg-white rounded-xl">
                  <QRCodeCanvas value={qrValue} size={240} level="H" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg shadow-md border border-gray-100">
                    <img src={bakong} className="w-8 h-8 object-contain" alt="logo" />
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-red-500 font-bold italic">QR code not available</div>
              )}

              <div className="mt-4 flex flex-col items-center gap-2">
                {qrStatus === "waiting" && (
                  <div className={`flex items-center gap-2 font-bold animate-pulse text-gray-500 dark:text-gray-400`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {t("waitingForPayment")} ({Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')})
                  </div>
                )}
                {qrStatus === "paid" && (
                  <div className="text-green-600 font-black text-xl flex items-center gap-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    {t("paymentReceived")}
                  </div>
                )}
                {qrStatus === "expired" && (
                  <div className="text-red-600 font-black flex items-center gap-2">
                    {t("expiredPleaseRegenerate")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            <p className={`text-[10px] font-bold uppercase tracking-widest leading-tight text-gray-400 dark:text-gray-500`}>
              {t("supportedBy")}<br />
              {t("createdFor")}
            </p>
          </div>
        </Modal>

        {/* Header Section */}
        <div className="mb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("pointOfSale")}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t("selectProducts")}</p>
            </div>

            
          </div>

          {/* Floating Sticky Cart Button */}
          <div className="fixed bottom-24 right-6 z-50">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={showDrawer}
              className="relative w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all border-4 border-white dark:border-gray-800"
            >
              <PiShoppingCartBold className="text-2xl" />
              {orderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                  {orderCount}
                </span>
              )}
            </motion.button>
          </div>

          

          {/* Search and Filter Bar */}
          <div className="border rounded p-2 mb-6 border-gray-200 bg-primary dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm  border-gray-300 text-gray-900 bg-transparent dark:border-0 focus:outline-0 dark:text-white dark:placeholder-gray-500"
                    placeholder={t("searchProducts")}
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>


              {/* Brand Filter with RichSearch */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{t("brand")}:</span>
                <RichSearch
                  data={[{ brand_id: "all", brand_name: t("allBrands") }, ...Brand]}
                  keyFields={{ id: "brand_id", title: "brand_name" }}
                  value={brandId || "all"}
                  onSelected={(id) => {
                    setBrandId(id === "all" ? "" : id);
                    setCurrentPage(1);
                  }}
                  placeholder={t("searchBrands")}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {[{ category_id: "all", category_name: t("allCategories") }, ...Category].map((cat) => (
              <button
                key={cat.category_id}
                value={cat.category_id}
                onClick={onFilterCategory}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  (categoryId == cat.category_id || (cat.category_id === "all" && categoryId === ""))
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid or Order List */}
        <div>
          {
            itemsSech?.length === 0 ? (
              saleItemContext?.isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="border rounded p-4 animate-pulse border-gray-200 bg-primary dark:border-gray-700">
                      <div className="h-48 rounded mb-4 bg-transparent"></div>
                      <div className="h-4 rounded w-3/4 mb-2 bg-transparent"></div>
                      <div className="h-3 rounded w-1/2 mb-4 bg-transparent"></div>
                      <div className="flex justify-between">
                        <div className="h-6 rounded w-1/4 bg-transparent"></div>
                        <div className="h-8 rounded w-1/3 bg-transparent"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded p-8 text-center border-gray-200 bg-primary dark:border-gray-700">
                  <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600">
                    <PiShoppingCartBold className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noProductsFound")}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("tryAdjustingSearch")}</p>
                  <button
                    onClick={() => navigate("/inventories/stock-list/add")}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    {t("addProductsToStock")}
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 gap-2">
                {itemsSech?.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="border rounded hover:shadow-sm transition-all duration-300 h-full border-gray-200 bg-primary dark:border-gray-700"
                  >
                    <div>
                      {/* Product Image */}
                      <div>
                        {item.image?<img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-35 object-fit transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = initialImage;
                          }}
                        />:
                        <div className="w-full h-35 object-fit transition-transform duration-300 flex justify-center items-center">
                          <IoIosImages className="text-6xl text-gray-400"/>
                        </div>
                        }
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
                        {item.discount != 100 && item.discount > 0 && (
                          <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-red-500 to-pink-600">
                            -{item.discount}%
                          </span>
                        )}
                        {item.discount == 100 && (
                          <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-red-500 to-pink-600">
                            free
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-2">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1 mb-1 text-gray-800 dark:text-white">{item.name}</h3>
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400">{item.code}</p>
                        </div>
                         <div className="text-right">
                              <div className="text-[8px] text-gray-600 dark:text-gray-400">{t("wholesale").toUpperCase()}</div>
                              <div className="text-xs font-medium text-blue-600 dark:text-blue-300">
                                ${getItemPrice(item, "wholesale").toFixed(2)}
                              </div>
                            </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-500">
                          <div className="leading-4">
                              <div className="text-md font-semibold text-green-600">
                                ${getItemPrice(item, "sale").toFixed(2)}
                              </div>
                             
                              {item.discount > 0 && (
                                <div className="text-xs text-gray-400 line-through">
                                  ${item.price.toFixed(2)}
                                </div>
                                
                              )}
                          </div>
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
            <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md border-l shadow-xl transform transition-transform border-gray-200 bg-primary dark:!bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                  <PiShoppingCartBold className="text-blue-500" />
                  {t("orderSummary")}
                  {orderCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                      {orderCount}
                    </span>
                  )}
                </h2>
                <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {orders?.items?.length === 0 ? (
                    <div className="text-center py-12">
                      <PiShoppingCartBold className="text-gray-400 dark:text-gray-600 text-4xl mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t("yourCartIsEmpty")}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{t("addProductsFromList")}</p>
                    </div>
                  ) : (
                    orders?.items?.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="relative border rounded p-3 border-gray-200 bg-transparent dark:border-gray-700"
                      >
                        <button
                          onClick={() => handleDelete(item.id, index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
                        >
                          ×
                        </button>
                        <div className="flex gap-3">
                          {/* Item Image */}
                          <div className="flex-shrink-0 w-16 h-16 border rounded p-1 border-gray-300 bg-primary dark:border-gray-600">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = import.meta.env.VITE_INITIAL_IMAGE;
                              }}
                            />
                          </div>

                          {/* Item Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-sm line-clamp-1 text-gray-800 dark:text-gray-200">{item.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{item.barcode}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-600">
                                  ${(item.price / item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQty(item.id, item.selectionKey)}
                                  className="w-5 h-5 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <input onChange={(e) => handleInputQuantity(item.id, item.selectionKey, e.target.value)} className="no-spinner text-center w-10 focus:outline-none" type="number" name="quantity" id="" value={item.quantity || ""} />
                                {/* <span className="w-8 text-center font-medium text-gray-800 dark:text-gray-200">
                                  {item.quantity}
                                </span> */}
                                <button
                                  onClick={() => handleQtyPlus(item.id, item.selectionKey)}
                                  className="w-5 h-5 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center"
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
                    <hr className="border-gray-200 dark:border-gray-700" />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{t("subtotal")}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">${currencyFormat(orders?.order_subtotal)}</span>
                      </div>

                      {calculateTotalDiscount() > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <FaPercent className="text-xs" /> {t("totalDiscount")}
                          </span>
                          <span className="font-medium">-${currencyFormat(calculateTotalDiscount())}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{t("deliveryFee")}</span>
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
                            className="w-20 px-2 py-1 border rounded text-right text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("saleType")}</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSaleType({ target: { value: 'sale' } })}
                            className={`flex-1 py-1.5 text-sm border rounded transition-colors ${orders?.sale_type === 'sale'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : ' text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent dark:text-gray-300 dark:border-gray-400 dark:hover:bg-slate-600'
                              }`}
                          >
                            {t("retail")}
                          </button>
                          <button
                            onClick={() => handleSaleType({ target: { value: 'wholesale' } })}
                            className={`flex-1 py-1.5 text-sm border rounded transition-colors ${orders?.sale_type === 'wholesale'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : ' text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent dark:text-gray-300 dark:border-gray-400 dark:hover:bg-slate-600'
                              }`}
                          >
                            {t("wholesale")}
                          </button>
                        </div>
                      </div>

                      <div className={`flex justify-between items-center ${orders?.sale_type === "sale" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("tax")}</label>
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
                          className="w-20 px-2 py-1 border rounded text-right text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("paymentMethod")}</label>
                        <select
                          value={orders?.order_payment_method || "cash"}
                          onChange={(e) => {
                            const results = { ...orders, order_payment_method: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="px-2 py-1 border rounded text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} className="dark:bg-gray-700" value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("payment")}</label>
                        <select
                          value={orders?.order_payment_status || "paid"}
                          onChange={(e) => {
                            const value = e.target.value;
                            const results = {
                              ...orders,
                              order_payment_status: value,
                              due_date: value === "paid" ? null : orders.due_date,
                              balance: value === "paid" ? 0 : orders.order_total,
                              payment: value === "paid" ? orders.order_total : 0,
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                            setPayment(value);
                          }}
                          className="px-2 py-1 border rounded text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white"
                        >
                          {PAYMENT_STATUS.map((status) => (
                            <option key={status.value} className="dark:bg-gray-700" value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`flex justify-between items-center ${orders?.sale_type === "sale" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("customer")}</label>
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
                          className="px-2 py-1 border rounded text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white"
                        >
                          <option className="dark:bg-gray-700" value={0}>{t("customer")}...</option>
                          {customers?.data?.map((customer) => (
                            <option className="dark:bg-gray-700" key={customer.customer_id} value={customer.customer_id}>
                              {customer.customer_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`flex justify-between items-center ${payment !== "credit" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("pay")}</label>
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
                          className="w-24 px-2 py-1 border rounded text-right text-sm border-gray-300 text-gray-900 !bg-transparent dark:border-gray-400 dark:text-white"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className={`flex justify-between items-center ${payment === "paid" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("term")}</label>
                        <input
                          type="number"
                          value={orders?.term || ""}
                          onChange={(e) => {
                            const term = Number(e.target.value) || 0;
                            const results = {
                              ...orders,
                              term: term,
                            };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-24 px-2 py-1 border rounded text-right text-sm border-gray-300 text-gray-900 !bg-transparent dark:border-gray-400 dark:text-white"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className={`flex justify-between items-center ${payment === "paid" ? "hidden" : ""}`}>
                        <label className="text-sm text-gray-600 dark:text-gray-300">{t("dueDate")}</label>
                        <DatePicker
                          readOnly
                          value={orders.term ? dayjs(orders.order_date).add(orders.term, 'days') : null}
                          className="w-35 px-2 py-1 border rounded text-right text-sm border-gray-300 text-gray-900 !bg-transparent dark:border-gray-400 dark:text-white"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className={`flex justify-between items-center text-orange-600 ${payment === "paid" ? "hidden" : ""}`}>
                        <span className="text-sm">{t("remainingBalance")}</span>
                        <span className="font-medium">${currencyFormat(orders?.balance || 0)}</span>
                      </div>

                      <div className={`${orders?.sale_type !== "sale" ? "hidden" : ""}`}>
                        <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">{t("customerTel")}</label>
                        <input
                          type="tel"
                          value={orders?.order_tel || ""}
                          onChange={(e) => {
                            const results = { ...orders, order_tel: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-full px-2 py-1 border rounded text-sm border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white dark:placeholder-gray-400"
                          placeholder="eg. 0123456789"
                        />
                      </div>

                      <div className={`${orders?.sale_type !== "sale" ? "hidden" : ""}`}>
                        <label className="block text-sm mb-1 text-gray-600 dark:text-gray-300">{t("customerAddress")}</label>
                        <textarea
                          value={orders?.order_address || ""}
                          onChange={(e) => {
                            const results = { ...orders, order_address: e.target.value };
                            localStorage.setItem("orderItems", JSON.stringify(results));
                            setOrders(results);
                          }}
                          className="w-full px-2 py-1 border rounded text-sm  border-gray-300 text-gray-900 bg-transparent dark:border-gray-400 dark:text-white dark:placeholder-gray-400"
                          placeholder={t("address") + "..."}
                          rows="3"
                        />
                        <p className="text-xs mt-1 text-gray-400 dark:text-gray-400">{t("optional")}</p>
                      </div>

                      <hr className="border-gray-200 dark:border-gray-300" />

                      <div className="space-y-1 text-gray-800 dark:text-white">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>{t("totalAmount")}</span>
                          <div className="text-right">
                            <div className="text-green-600">${currencyFormat(orders?.order_total)}</div>
                            {exchangeRate?.data?.usd_to_khr && (
                              <div className="text-xs text-gray-500 dark:text-gray-300">
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
                        {t("processOrder")}
                      </button>
                      <button
                        onClick={() => {
                          setOrders(initialOrder);
                          localStorage.setItem("orderItems", JSON.stringify(initialOrder));
                          setOrderCount(0);
                        }}
                        className="w-full py-2 border rounded text-sm transition-colors border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 dark:border-gray-400 bg-transparent dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-500"
                      >
                        {t("clearCart")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="mt-12 sticky bottom-0 z-30 flex flex-col md:flex-row items-center justify-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-700 dark:text-white">{t("page")}:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded text-xs bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size} className="dark:bg-gray-800">
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className={`flex items-center gap-2 border rounded p-1 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <button
              onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded disabled:opacity-50 transition-colors ${darkMode ? "border-gray-700 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
            >
              ⟪
            </button>
            <button
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded disabled:opacity-50 transition-colors ${darkMode ? "border-gray-700 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
            >
              ⟨
            </button>
            <span className={`px-4 py-1 text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {t("page")} {currentPage} {t("of")} {Math.ceil(totalItems / pageSize)}
            </span>
            <button
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / pageSize))); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === Math.ceil(totalItems / pageSize) || totalItems === 0}
              className={`px-3 py-1 border rounded disabled:opacity-50 transition-colors ${darkMode ? "border-gray-700 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
            >
              ⟩
            </button>
            <button
              onClick={() => { setCurrentPage(Math.ceil(totalItems / pageSize)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === Math.ceil(totalItems / pageSize) || totalItems === 0}
              className={`px-3 py-1 border rounded disabled:opacity-50 transition-colors ${darkMode ? "border-gray-700 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
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
