import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuArrowLeft, LuShoppingCart, LuSearch, LuX, LuRotateCcw, LuSave, LuPackage, LuFileText, LuPlus, LuMinus, LuTrash2, LuImage, LuList } from "react-icons/lu";
import { Link, useNavigate } from "react-router";
import AlertBox from "../../services/AlertBox";
import {
  Badge,
  Button as AntButton,
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
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useGetAllCategoriesQuery } from "@/features/products/categoriesSlice";
import { useGetAllBrandQuery } from "@/features/products/brandsSlice";
import {
  useGetAllOrderQuery,
  useGetPopularOrderQuery,
  useGetPersentOrderMonthlyQuery
} from "@/features/sales/ordersSlice";
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
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "@/features/customers/customersSlice";
import { useGetExchangeRateByIdQuery } from "@/features/system/exchangeRatesSlice";
import { currencyFormat } from "../../services/serviceFunction";
import { FaPercent, FaPalette, FaRuler } from "react-icons/fa";
import { GiSugarCane } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import api from "../../services/api";
import { MdOutlineAddShoppingCart, MdOutlineTableChart, MdOutlineGridView } from "react-icons/md";
import { TbShoppingCartOff } from "react-icons/tb";
import { useGetAllWasteQuery } from "@/features/system/notificationSlice";
import { useDebounce } from "use-debounce";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import RichSearch from "../../utils/RichSearch";
import { LuEye, LuBan, LuRotateCcw as LuRotate, LuCreditCard } from "react-icons/lu";
import { BiEdit } from "react-icons/bi";
import { IoIosImages } from "react-icons/io";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "../../services/paymentService";
import { BsQrCode } from "react-icons/bs";
import Button from "../../utils/Button";
import Input from "../../utils/Input";
import { IoImage } from "react-icons/io5";
import QrPaymentModal from "../../utils/QrPaymentModal";
import { getToken } from '@/utils/tokenStore';

const initialOrder = {
  order_subtotal: 0,
  order_subtotal_discount: 0,
  order_address: null,
  order_total: 0,
  order_customer_id: 1,
  online: 0,
  transection_id: null,
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
  const token = getToken();
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));

  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id: proId,
    token,
  });

  const navigate = useNavigate();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const barcodeScanLoadingRef = useRef(false);
  const handleOrderRef = useRef(null);
  const [allItems, setAllItems] = useState([]);
  const [itemsSech, setItemsSech] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [Category, setCategory] = useState([]);
  const [Brand, setBrand] = useState([]);
  const [orders, setOrders] = useState(localOrderItems || initialOrder);
  const [search, setSearch] = useState('');
  const [debounce] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertBox, setAlertBox] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const orderCount = useMemo(() => orders?.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0, [orders.items]);

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
  const { refetch: refetchWaste } = useGetAllWasteQuery(token);

  const items = useMemo(() => saleItemContext?.data?.data || [], [saleItemContext?.data]);
  const totalItems = saleItemContext?.data?.pagination?.total || 0;

  const getItemPrice = (item, saleType = "sale") => {
    if (saleType === "sale") {
      if (item.selectionKey) return item.original_price;
      return item.price;
    } else {
      return item.wholesale_price;
    }
  };

  const parseAttributesForDisplay = useCallback((attributes) => {
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
  }, []);

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

  const normalizeSaleItem = useCallback((item) => ({
    ...item,
    quantity: 1,
    displayAttributes: parseAttributesForDisplay(item.attributes)
  }), [parseAttributesForDisplay]);

  const findSaleItemByBarcode = useCallback(async (barcode) => {
    const res = await api.get("/sale-items", {
      params: { limit: 10, page: 1, search: barcode, category_id: "", brand_id: "" },
      headers: { Authorization: `Bearer ${token}` },
    });
    const saleItems = res?.data?.data || [];
    const scannedBarcode = barcode.toString();
    return saleItems.find(item => item.barcode && item.barcode.toString() === scannedBarcode);
  }, [token]);

  useEffect(() => {
    if (categoryContext.data?.data) setCategory(categoryContext.data.data);
    if (brandContext.data?.data) setBrand(brandContext.data.data);
    if (items) {
      const newItems = items.map((item) => normalizeSaleItem(item));
      setAllItems(newItems);
      setItemsSech(newItems);
    }
  }, [items, categoryContext?.data, brandContext?.data, normalizeSaleItem]);

  useEffect(() => {
    let inputBuffer = "";
    let timeoutId;
    const handleKeyDown = async (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === "Enter" && inputBuffer.length > 0) {
        clearTimeout(timeoutId);
        const scannedBarcode = inputBuffer.trim();
        inputBuffer = "";
        if (barcodeScanLoadingRef.current) return;
        barcodeScanLoadingRef.current = true;
        try {
          const findItem = await findSaleItemByBarcode(scannedBarcode);
          if (!findItem) toast.error(t("itemNotFound") + ": " + scannedBarcode);
          else handleOrderRef.current?.(normalizeSaleItem(findItem), 1);
        } catch {
          toast.error(t("itemNotFound") + ": " + scannedBarcode);
        } finally {
          barcodeScanLoadingRef.current = false;
        }
      } else if (e.key.length === 1) {
        inputBuffer += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { inputBuffer = ""; }, 500);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); clearTimeout(timeoutId); };
  }, [findSaleItemByBarcode, normalizeSaleItem, t]);

  const calculateOrderTotals = (items, deliveryFee = 0, tax = 0, saleType = "sale") => {
    let subtotal = 0;
    let totalDiscount = 0;
    if (saleType == 'sale') tax = 0;
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

  function handleOrder(item, quantity) {
    const ordersItems = JSON.parse(localStorage.getItem("orderItems"))?.items || [];
    if (!item) {
      messageApi.open({ type: "error", content: t("itemNotFound") });
      return;
    }
    if (item.in_stock <= 0) {
      messageApi.open({ type: "error", content: t("outOfStock") });
      return;
    }

    const attributeKey = item.attributes ? JSON.stringify(item.attributes.map(attr => ({ name: attr.name, value: attr.value }))) : '';
    const selectionKey = `${item.id}-${attributeKey}`;
    const sameOrder = ordersItems?.find((orderItem) => orderItem.id == item.id);

    if (sameOrder) {
      if (sameOrder.quantity + Number(quantity) > item.in_stock) {
        messageApi.open({ type: "error", content: t("notEnoughStock") });
        return;
      }
      setOrders((prev) => {
        const updatedItems = prev.items.map((orderItem) => {
          if (orderItem.selectionKey === selectionKey) {
            const newQuantity = Number(orderItem.quantity) + Number(quantity);
            const unitPrice = getItemPrice(item, prev.sale_type);
            return { ...orderItem, quantity: newQuantity, price: parseFloat((unitPrice * newQuantity).toFixed(2)) };
          }
          return orderItem;
        });
        const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
        const results = {
          ...prev,
          items: updatedItems,
          order_discount: totals.totalDiscount,
          order_subtotal: totals.subtotal,
          order_subtotal_discount: totals.subtotal,
          order_total: totals.total,
          payment: Number((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
          balance: Number((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
        };
        messageApi.open({ type: "success", content: `${t("addedToCart")}: ${item?.name}` });
        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
    } else {
      const unitPrice = getItemPrice(item, orders.sale_type);
      setOrders((prev) => {
        const updatedItems = [...prev.items, {
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
          original_price: item.price,
          displayAttributes: item.displayAttributes,
          selectionKey: selectionKey,
          stock_in: item?.stock_in,
          in_stock: item?.in_stock,
          wholesale_price: item.wholesale_price,
          wholesale_price_discount: item.wholesale_price_discount,
          price_discount: item.price_discount,
        }];
        const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
        const results = {
          ...prev,
          items: updatedItems,
          order_discount: totals.totalDiscount,
          order_subtotal: totals.subtotal,
          order_subtotal_discount: totals.subtotal,
          order_total: totals.total,
          payment: parseFloat((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
          balance: parseFloat((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
        };
        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
    }
    messageApi.open({ type: "success", content: `${t("addedToCart")}: ${item?.name}` });
  }

  handleOrderRef.current = handleOrder;

  function handleQtyPlus(id, selectionKey) {
    const findItem = orders.items.find(item => item.id === id && item.selectionKey === selectionKey);
    if (!findItem) return;
    const cartQtyOfProduct = orders.items.filter(item => item.id === id).reduce((sum, item) => sum + item.quantity, 0);
    if (cartQtyOfProduct >= findItem.in_stock) { messageApi.open({ type: "error", content: t("notEnoughStock") }); return; }
    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity + 1;
          const unitPrice = getItemPrice(item, prev.sale_type);
          return { ...item, quantity: newQuantity, price: Number((unitPrice * newQuantity).toFixed(2)) };
        }
        return item;
      });
      const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
      const results = {
        ...prev,
        items: updatedItems,
        order_discount: totals.totalDiscount,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
        balance: Number((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
      };
      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  }

  function handleInputQuantity(id, selectionKey, qty) {
    const findItem = orders.items.find(item => item.id === id && item.selectionKey === selectionKey);
    if (!findItem) return;
    const otherItemsQty = orders.items.filter(item => item.id === id && item.selectionKey !== selectionKey).reduce((sum, item) => sum + item.quantity, 0);
    if (otherItemsQty + Number(qty) > findItem.in_stock) { messageApi.open({ type: "error", content: t("notEnoughStock") }); return; }
    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = Number(qty);
          const unitPrice = getItemPrice(item, prev.sale_type);
          return { ...item, quantity: newQuantity, price: Number((unitPrice * newQuantity).toFixed(2)) };
        }
        return item;
      });
      const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
      const results = {
        ...prev,
        items: updatedItems,
        order_discount: totals.totalDiscount,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
        balance: Number((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
      };
      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  }

  function handleQty(id, selectionKey) {
    const findItem = orders.items.find(item => item.id === id && item.selectionKey === selectionKey);
    if (!findItem || findItem.quantity <= 1) return;
    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.id === id && item.selectionKey === selectionKey) {
          const newQuantity = item.quantity - 1;
          const unitPrice = getItemPrice(item, prev.sale_type);
          return { ...item, quantity: newQuantity, price: Number((unitPrice * newQuantity).toFixed(2)) };
        }
        return item;
      });
      const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
      const results = {
        ...prev,
        items: updatedItems,
        order_discount: totals.totalDiscount,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
        balance: Number((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
      };
      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  }

  function handleDelete(id, selectionKey) {
    const findItem = orders.items.find((item, index) => item.id === id && index === selectionKey);
    if (!findItem) return;
    setOrders((prev) => {
      const updatedItems = prev.items.filter((item, index) => !(item.id === id && index === selectionKey));
      const totals = calculateOrderTotals(updatedItems, prev.delivery_fee || 0, prev.order_tax || 0, prev.sale_type);
      const results = {
        ...prev,
        items: updatedItems,
        order_discount: totals.totalDiscount,
        order_subtotal: totals.subtotal,
        order_subtotal_discount: totals.subtotal,
        order_total: totals.total,
        payment: Number((prev.order_payment_status === "paid" ? totals.total : 0).toFixed(2)),
        balance: Number((totals.total - (prev.order_payment_status === "paid" ? totals.total : 0)).toFixed(2)),
      };
      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
    messageApi.open({ type: "success", content: `Removed ${findItem.name} from cart` });
  }

  async function handleConfirm() {
    const toDay = new Date();
    const itemsWithAttributes = orders.items.map(item => {
      const attributeData = [];
      if (item.attribute_selections) {
        Object.values(item.attribute_selections).forEach(selection => {
          if (selection) { attributeData.push({ name_id: selection.attribute_id, value_id: selection.value_id }); }
        });
      }
      return {
        item_id: item.id,
        quantity: item.quantity,
        total_price: item.price / item.quantity,
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
      payment_method: 'cash',
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
      const orderRes = await api.post("/retail", payload, { headers: { Authorization: `Bearer ${token}` } });
      if (orderRes.data.status === 200) {
        toast.success(t("orderCreatedSuccessfully"));
        handleSuccessFinalize();
        const path = payload.sale_type === "sale" ? `/receipt/${orderRes.data.data.order_id}` : `/invoice/${orderRes.data.data.order_id}`;
        navigate(path);
      } else throw new Error(orderRes.data.message || t("failedToCreateOrder"));
    } catch (error) {
      setAlertBox(false); setLoading(false); toast.error(error.message || t("failedToCreateOrder"));
    }
  }

  const handleSuccessFinalize = () => {
    if (saleItemContext?.refetch) saleItemContext.refetch();
    if (orderContext?.refetch) orderContext.refetch();
    refetchWaste();
    setLoading(false);
    setOpen(false);
    localStorage.setItem("orderItems", JSON.stringify(initialOrder));
    setOrders(initialOrder);
  };

  useEffect(() => {
    const handleStorageChange = () => { const saved = localStorage.getItem("darkMode"); setDarkMode(saved ? JSON.parse(saved) : false); };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  async function handleSubmit() {
    if (orders.items.length === 0) { toast.error("Cart is empty"); return; }
    if (orders.sale_type === "wholesale" && !orders.order_customer_id) { toast.error("Please select a customer for wholesale orders"); return; }
    modal.confirm({
      title: t("orderProcessingOptions"), zIndex: 3000, icon: <PiShoppingCartBold className="text-[#13b5ea] text-2xl" />,
      content: (
        <div className="py-2">
          <p className={`${darkMode ? "text-slate-400" : "text-slate-600"} mb-4`}>{t("howToProceed")}</p>
          <div className="space-y-3">
            <div className={`p-3 rounded-[2px] border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
              <span className={`font-bold block ${darkMode ? "text-[#13b5ea]" : "text-slate-700"}`}>{t("Bank")}</span>
              <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{t("displayQrCode")}</span>
            </div>
            <div className={`p-3 rounded-[2px] border ${darkMode ? "bg-slate-700 border-slate-600" : "bg-slate-100 border-slate-200"}`}>
              <span className={`font-bold block ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{t("Cash")}</span>
              <span className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-500"}`}>{t("confirmOrderDirectly")}</span>
            </div>
          </div>
        </div>
      ),
      okText: t("Bank"), cancelText: t("Cash"), centered: true, width: 450,
      okButtonProps: { className: 'bg-[#13b5ea] hover:bg-[#0f92bd] rounded-[2px]' },
      onOk: () => setQrModalOpen(true),
      onCancel: () => setAlertBox(true),
    });
  }

  function onFilterCategory(e) { const value = e.target.value === "all" ? "" : e.target.value; setCategoryId(value); setCurrentPage(1); }
  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);

  const calculateTotalDiscount = () => {
    let totalDiscount = 0;
    orders.items.forEach(item => {
      if (item.discount > 0) {
        const originalPrice = orders.sale_type === "sale" ? (item.original_price) : item.wholesale_price;
        const discountAmount = (originalPrice * (item.discount / 100)) * item.quantity;
        totalDiscount += discountAmount;
      }
    });
    return Number(totalDiscount.toFixed(2));
  };


  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      navigate('/retail');
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => {
          alert(`Error: ${err.message}`);
        });
    } else {
      navigate('/orders');
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="view-page px-2 font-sans antialiased text-slate-900 dark:text-slate-100"
    >
      <section className="">
        {contextHolder}
        {modalContextHolder}
        <AlertBox
          isOpen={alertBox}
          title={t("confirmOrder")}
          message={t("confirmOrderMessage", "Are you sure you want to create this order?")}
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText={t("confirm")}
          cancelText={t("cancel")}
        />
        
        <QrPaymentModal
            open={qrModalOpen}
            onClose={() => setQrModalOpen(false)}
            orderData={orders}
            exchangeRate={exchangeRate?.data}
            token={token}
            onSuccess={handleSuccessFinalize}
        />

        {/* Header Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 py-4">
          <div className="flex justify-between gap-4 items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('pointOfSale')}</h1>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700">POS</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={toggleFullscreen} className="chomnenh-btn-fullscreen">
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
                <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
              </button>
              <Button
                type="button"
                variant="siliver"
                onClick={() => { setOrders(initialOrder); localStorage.setItem("orderItems", JSON.stringify(initialOrder)); }}
                className="rounded-[2px] border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LuRotateCcw /> {t('clearCart')}
              </Button>
              <Link to='/e-menu'>
                <Button type="button" variant="success" className="rounded-[2px] border-slate-300 text-slate-700 hover:bg-slate-50"><BsQrCode /> {t('eMenu')}</Button>
              </Link>
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate('/order-list')}
              >
                <LuList size={14} />
                {t('backToOrderList')}
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Sticky Cart Button */}
        <div className="fixed bottom-24 right-6 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={showDrawer}
            className="relative w-16 h-16 bg-[#13b5ea] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0f92bd] transition-all border-4 border-white dark:border-gray-800"
          >
            <LuShoppingCart className="text-2xl" />
            {orderCount > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full text-white text-[10px] font-black flex items-center justify-center animate-bounce">{orderCount}</span>}
          </motion.button>
        </div>

        {/* Search and Filter Bar */}
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] p-4 bg-white dark:bg-slate-900/50 shadow-sm">
            <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t('searchProducts')}</label>
                <div className="relative">
                  <input
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-1.5 pl-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-[2px] transition-all outline-none focus:border-[#13b5ea] focus:ring-0 text-[13px] h-[38px]"
                    placeholder={t("searchByCodeOrName")}
                  />
                  <div className="absolute left-3 top-2.5 text-slate-400"><LuSearch size={18} /></div>
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">{t('brand')}</label>
                <RichSearch
                  data={[{ brand_id: "all", brand_name: t("allBrands") }, ...Brand]}
                  keyFields={{ id: "brand_id", title: "brand_name" }}
                  value={brandId || "all"}
                  onSelected={(id) => { setBrandId(id === "all" ? "" : id); setCurrentPage(1); }}
                  placeholder={t("searchBrands")}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap pb-2">
            {[{ category_id: "all", category_name: t("allCategories") }, ...Category].map((cat) => (
              <button
                key={cat.category_id}
                value={cat.category_id}
                onClick={onFilterCategory}
                className={`px-4 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-wider transition-all border ${(categoryId == cat.category_id || (cat.category_id === "all" && categoryId === ""))
                    ? "bg-[#13b5ea] text-white border-[#13b5ea] shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
                  }`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-4">
          {itemsSech?.length === 0 ? (
            saleItemContext?.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {[...Array(14)].map((_, index) => (
                  <div key={index} className="border border-slate-100 dark:border-slate-800 rounded-[2px] p-4 animate-pulse bg-white dark:bg-slate-900/20">
                    <div className="h-32 rounded-[2px] mb-4 bg-slate-100 dark:bg-slate-800"></div>
                    <div className="h-4 rounded-[2px] w-3/4 mb-2 bg-slate-100 dark:bg-slate-800"></div>
                    <div className="h-3 rounded-[2px] w-1/2 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] p-12 text-center bg-white dark:bg-slate-900/50">
                <div className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700"><LuPackage className="w-full h-full" /></div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">{t("noProductsFound")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">{t("tryAdjustingSearch")}</p>
                <AntButton onClick={() => navigate("/inventories/stock-list/add")} className="h-10 px-6 rounded-[2px] font-bold uppercase text-xs tracking-widest">{t("addProductsToStock")}</AntButton>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-4">
              {itemsSech?.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="group border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden hover:border-[#13b5ea] dark:hover:border-[#13b5ea] transition-all duration-300 bg-white dark:bg-slate-900/50 flex flex-col shadow-sm"
                >
                  <div className="relative">
                    <div className="aspect-square bg-slate-50 dark:bg-slate-800/50 overflow-hidden flex items-center justify-center">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_INITIAL_IMAGE; }} /> : <LuImage className="text-4xl text-slate-300 dark:text-slate-700" />}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {item.in_stock !== undefined && <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase text-white shadow-sm ${item.in_stock <= 5 ? 'bg-red-500' : 'bg-slate-800/80'}`}>STK: {item.in_stock}</span>}
                      {item.discount > 0 && <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-black uppercase text-white bg-[#e31a22] shadow-sm">{item.discount === 100 ? 'FREE' : `-${item.discount}%`}</span>}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="mb-2">
                      <h3 className="font-bold text-[13px] text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-[#13b5ea] transition-colors">{item.name}</h3>
                      <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase">{item.code}</p>
                    </div>
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Retail</div>
                          <div className="text-sm font-bold text-green-600 leading-none">${getItemPrice(item, "sale").toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Wholesale</div>
                          <div className="text-xs font-bold text-cyan-500 leading-none">${getItemPrice(item, "wholesale").toFixed(2)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOrder(item, item.quantity)}
                        disabled={item.in_stock <= 0}
                        className={`w-full py-2 rounded-[2px] flex items-center justify-center gap-2 transition-all ${item.in_stock <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' : 'bg-slate-800 text-white hover:bg-[#13b5ea] dark:bg-slate-800 dark:hover:bg-[#13b5ea]'
                          }`}
                      >
                        {item.in_stock <= 0 ? <TbShoppingCartOff size={16} /> : <LuPlus size={16} />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.in_stock <= 0 ? t('outOfStock') : t('addToCart')}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Drawer */}
        <Drawer
          title={(
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[2px] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#13b5ea]">
                <LuShoppingCart size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t("orderSummary")}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{orderCount} {t('itemsInCart')}</p>
              </div>
            </div>
          )}
          placement="right"
          onClose={onClose}
          open={open}
          width={450}
          className="pos-drawer dark:!bg-gray-700"
          styles={{
            body: { padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: darkMode ? '#0f172a' : '#ffffff' },
            header: { borderBottom: '1px solid ' + (darkMode ? '#1e293b' : '#f1f5f9') }
          }}
          closeIcon={<LuX size={20} className="text-slate-400" />}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {orders?.items?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <LuPackage size={48} className="text-slate-300 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{t("yourCartIsEmpty")}</p>
              </div>
            ) : (
              orders?.items?.map((item, index) => (
                <div key={`${item.id}-${index}`} className="group relative border border-slate-100 dark:border-slate-800 rounded-[2px] p-3 bg-white dark:bg-slate-700/40 hover:border-[#13b5ea] dark:hover:border-[#13b5ea] transition-all shadow-sm">
                  <button onClick={() => handleDelete(item.id, index)} className="absolute -top-2 -right-2 w-6 h-6 bg-[#e31a22] text-white rounded-full text-xs hover:scale-110 transition-transform flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 z-10"><LuX size={14} /></button>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 flex items-center justify-center rounded-[2px] border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0 p-1">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-[1px]" onError={(e) => { e.target.onerror = null; e.target.src = import.meta.env.VITE_INITIAL_IMAGE; }} />}
                      {!item.image && <IoImage className="text-4xl dark:text-gray-400 text-gray-500" />}

                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate pr-4">{item.name}</h4>
                        <span className="text-[13px] font-bold text-slate-800 dark:text-white">${(item.price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-[2px] overflow-hidden h-7">
                          <button onClick={() => handleQty(item.id, item.selectionKey)} className="px-2 h-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-[#e31a22] transition-colors"><LuMinus size={12} /></button>
                          <input onChange={(e) => handleInputQuantity(item.id, item.selectionKey, e.target.value)} className="w-10 h-full text-center text-xs font-bold bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-700 dark:text-white focus:outline-none no-spinner" type="number" value={item.quantity || ""} />
                          <button onClick={() => handleQtyPlus(item.id, item.selectionKey)} className="px-2 h-full bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-green-600 transition-colors"><LuPlus size={12} /></button>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">${(item.price / item.quantity).toFixed(2)} / unit</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {orders?.items?.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/50 space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>{t("subtotal")}</span><span>${currencyFormat(orders?.order_subtotal)}</span></div>
                {calculateTotalDiscount() > 0 && <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-red-500"><span className="flex items-center gap-1"><FaPercent size={10} /> {t("totalDiscount")}</span><span>-${currencyFormat(calculateTotalDiscount())}</span></div>}
                <div className={`flex justify-between items-center ${orders?.sale_type === "sale" ? "hidden" : ""}`}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("tax")}</label>
                  <Input type="number" value={orders?.order_tax} onChange={(val) => {
                    const tax = Number(val) || 0;
                    const totals = calculateOrderTotals(orders.items, orders.delivery_fee || 0, tax, orders.sale_type);
                    const results = { ...orders, order_tax: tax, order_total: totals.total, payment: orders.order_payment_status === "paid" ? totals.total : 0, balance: orders.order_payment_status === "paid" ? 0 : totals.total };
                    localStorage.setItem("orderItems", JSON.stringify(results)); setOrders(results);
                  }} className="h-8 w-24 text-right text-xs" addonAfter="%" />
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-sm font-black uppercase text-slate-800 dark:text-white">{t("totalAmount")}</span>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#13b5ea] leading-none">${currencyFormat(orders?.order_total)}</div>
                    {exchangeRate?.data?.usd_to_khr && <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">≈ ៛ {currencyFormat(orders?.order_total * exchangeRate.data.usd_to_khr)}</div>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setOrders(initialOrder); localStorage.setItem("orderItems", JSON.stringify(initialOrder)); }} className="py-3 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[2px] text-[11px] font-bold uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><LuRotateCcw size={14} />{t("clear")}</button>
                <button onClick={handleSubmit} className="py-3 px-4 bg-[#13b5ea] hover:bg-[#0f92bd] text-white rounded-[2px] text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-[#13b5ea]/20 transition-all flex items-center justify-center gap-2"><LuSave size={14} />{t("checkout")}</button>
              </div>
            </div>
          )}
        </Drawer>

        {/* Pagination */}
        <div className="mt-12 sticky bottom-0 z-30 flex flex-col md:flex-row items-center justify-center gap-4 p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">{t("page")}:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 h-8 border border-slate-200 dark:border-slate-700 rounded-[2px] text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-[#13b5ea] outline-none">
              {[12, 24, 48, 96].map((size) => (<option key={size} value={size} className="dark:bg-gray-800">{size}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className="w-10 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold">⟪</button>
            <button onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1} className="w-10 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold">⟨</button>
            <div className="h-8 px-4 flex items-center bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{t("page")} {currentPage} / {Math.ceil(totalItems / pageSize)}</div>
            <button onClick={() => { setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / pageSize))); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === Math.ceil(totalItems / pageSize) || totalItems === 0} className="w-10 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold">⟩</button>
            <button onClick={() => { setCurrentPage(Math.ceil(totalItems / pageSize)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === Math.ceil(totalItems / pageSize) || totalItems === 0} className="w-10 h-8 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-[2px] disabled:opacity-30 text-slate-600 dark:text-slate-400 hover:bg-[#13b5ea] hover:text-white transition-all font-bold">⟫</button>
          </div>
        </div>
      </section>
      <style>{`
        .chomnenh-btn-fullscreen {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #102A43; /* Chomnenh Navy */
          color: #FFFFFF;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chomnenh-btn-fullscreen:hover {
          background-color: #D9A727; /* Chomnenh Gold ពេល Hover */
          color: #102A43;
        }
      `}</style>
    </motion.div>
  );
};


export default Sales;
