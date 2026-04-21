import React, { useEffect, useMemo, useRef, useState } from "react";
import { AiTwotoneDelete } from "react-icons/ai";
import { LuListChecks, LuLogOut } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { PiHandFistFill, PiShoppingCartBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllOrderQuery } from "../../../app/Features/ordersSlice";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdRemoveCircle } from "react-icons/io";
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { useGetExchangeRateByIdQuery } from "../../../app/Features/exchangeRatesSlice";
import { currencyFormat } from "../../services/serviceFunction";
import { FaPercent, FaPalette, FaRuler, FaMapMarkerAlt, FaHistory, FaUser, FaPhone, FaCheck, FaMoon, FaSun, FaLanguage } from "react-icons/fa";
import { GiScales, GiSugarCane } from "react-icons/gi";
import { BiCategory } from "react-icons/bi";
import api from "../../services/api";
import { useGetUserLoginQuery, useGetUserProfileQuery } from "../../../app/Features/usersSlice";
import { TbShoppingCartOff } from "react-icons/tb";
import { MdOutlineAddShoppingCart } from "react-icons/md";
import { IoExit, IoLogOutOutline } from "react-icons/io5";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { useDebounce } from "use-debounce";
import {
  BsQrCodeScan, BsBoxSeam, BsArrowUpRight, BsArrowDownLeft,
  BsTrash, BsBagPlusFill, BsLightningChargeFill
} from "react-icons/bs";
import { MdOutlineCategory, MdOutlineBrandingWatermark } from "react-icons/md";
import { useGetItemByIdQuery } from "../../../app/Features/itemsSlice";
import { QRCodeCanvas } from "qrcode.react";
import bakong from "../../assets/bakong.png";
import * as qrService from "../../services/qrPaymentService";
import handleDownload from "../../services/imageDowload";
import Echo from "../../echo";
import { useTranslation } from "react-i18next";

// const { Option } = Select;

const initialOrder = {
  order_subtotal: 0,
  order_subtotal_discount: 0,
  order_address: null,
  order_total: 0,
  order_customer_id: 1,
  status: 1,
  online: 1,
  sale_type: "sale",
  order_payment_status: "cod",
  order_payment_method: "cash",
  delivery_fee: 0,
  deliver_id: 1,
  order_discount: 0,
  order_tax: 0,
  balance: 0,
  payment: 0,
  items: [],
};

// Custom Badge component
const Badge = ({ count, children, color = 'blue', className = '' }) => {
  const colors = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    gray: 'bg-gray-500 text-white',
  };
  return (
    <div className="relative inline-block">
      {children}
      {count !== undefined && count > 0 && (
        <span className={`absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold rounded-full ${colors[color]} ${className}`}>
          {count}
        </span>
      )}
    </div>
  );
};

// Custom Button component
const Button = ({ children, onClick, variant = 'default', size = 'md', icon, disabled, className = '', type = 'button', darkMode = false }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-lg';
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-sm',
  };
  const variants = {
    default: darkMode
      ? '!border-slate-700 !bg-slate-800 !text-slate-100 hover:!bg-slate-700'
      : 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
    primary: 'border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'border border-red-600 bg-red-600 hover:bg-red-700 text-white',
    success: 'border border-green-600 bg-green-600 hover:bg-green-700 text-white',
    outline: darkMode
      ? '!border-slate-700 !bg-transparent !text-slate-200 hover:!bg-slate-800'
      : 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  );
};

// Custom Input component
const Input = ({ value, onChange, placeholder, type = 'text', icon, className = '', darkMode = false }) => (
  <div className="relative">
    {icon && <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>{icon}</div>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${icon ? 'pl-10' : ''} ${darkMode ? '!border-slate-700 !bg-slate-900 !text-slate-100 !placeholder-slate-500' : 'border-gray-300 bg-white text-gray-900'} ${className}`}
    />
  </div>
);

// Custom Textarea
const Textarea = ({ value, onChange, placeholder, rows = 3, className = '', darkMode = false }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? '!border-slate-700 !bg-slate-900 !text-slate-100 !placeholder-slate-500' : 'border border-gray-300 bg-white text-gray-900'} ${className}`}
  />
);

// Custom Select
const Select = ({ value, onChange, children, className = '', darkMode = false }) => (
  <select
    value={value}
    onChange={onChange}
    className={`rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${darkMode ? '!border-slate-700 !bg-slate-900 !text-slate-100' : 'border border-gray-300 bg-white text-gray-900'} ${className}`}
  >
    {children}
  </select>
);

// Custom Divider
const Divider = ({ className = '', darkMode = false }) => <hr className={`border-t my-4 ${darkMode ? '!border-slate-700' : 'border-gray-200'} ${className}`} />;

// Custom Tag/Chip
const Tag = ({ children, color = 'blue', className = '' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

// Custom Pagination
const Pagination = ({ current, total, pageSize, onChange, darkMode = false }) => {
  const totalPages = Math.ceil(total / pageSize);
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (current <= 3) return i + 1;
    if (current >= totalPages - 2) return totalPages - 4 + i;
    return current - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 ${darkMode ? '!border !border-slate-700 !bg-slate-900 !text-slate-200 hover:!bg-slate-800' : 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}
      >
        Previous
      </button>
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`rounded-lg px-3 py-1.5 text-sm ${current === page ? 'border border-blue-600 bg-blue-600 text-white' : darkMode ? '!border !border-slate-700 !bg-slate-900 !text-slate-200 hover:!bg-slate-800' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'}`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === totalPages}
        className={`rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 ${darkMode ? '!border !border-slate-700 !bg-slate-900 !text-slate-200 hover:!bg-slate-800' : 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700'}`}
      >
        Next
      </button>
    </div>
  );
};

// Custom Modal
const Modal = ({ open, onClose, children, width = 500, darkMode = false }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose} // close when clicking backdrop
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        className={`relative max-h-[90vh] overflow-auto rounded-3xl shadow-lg ${darkMode ? '!border !border-slate-700 !bg-slate-900 !text-slate-100' : 'bg-white'}`}
        style={{ width: typeof width === "number" ? `${width}px` : width }}
      >
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 z-5 ${darkMode ? '!text-slate-500 hover:!text-slate-200' : 'text-gray-400 hover:text-gray-600'}`}
        >
          ✕
        </button>

        {children}
      </motion.div>
    </div>
  );
};

// Custom Drawer
const Drawer = ({ open, onClose, title, children, width = 400, darkMode = false }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween' }}
        className={`fixed top-0 right-0 z-50 h-full overflow-auto shadow-xl ${darkMode ? '!border-l !border-slate-700 !bg-slate-900 !text-slate-100' : 'bg-white'}`}
        style={{ width }}
      >
        <div className={`sticky top-0 flex items-center justify-between border-b px-5 py-4 ${darkMode ? '!border-slate-700 !bg-slate-900' : 'border-gray-200 bg-white'}`}>
          <h2 className={`text-base font-semibold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{title}</h2>
          <button onClick={onClose} className={darkMode ? '!text-slate-500 hover:!text-slate-200' : 'text-gray-400 hover:text-gray-600'}>
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </>
  );
};

const Sales = () => {
  const { t, i18n } = useTranslation();
  const { id, token } = useParams();
  const profileId = localStorage.getItem('profileId');
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));
  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id: id,
    token,
  });


  const navigate = useNavigate();
  const { data: profile } = useGetUserProfileQuery({ id, token });
  const [payment, setPayment] = useState("paid");
  const [alertBox, setAlertBox] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(profileId == id ? false : true);
  const [allItems, setAllItems] = useState([]);
  const { data: userLogin } = useGetUserLoginQuery(token)
  const [itemsSech, setItemsSech] = useState([]);
  const [Category, setCategory] = useState([]);
  const [orders, setOrders] = useState(localOrderItems || initialOrder);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [tel, setTel] = useState('');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('guest')) || null);
  const [validationErrors, setValidationErrors] = useState({});
  const { data: customers } = useGetAllCustomerQuery(token);
  const [search, setSearch] = useState('');
  const [debounce] = useDebounce(search, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visible, setVisible] = useState(false);
  const [itemDetail, setItemDetail] = useState({});
  const [qrPaymentModal, setQrPaymentModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const qrRef = useRef(null);
  const [qrValue, setQrValue] = useState("");
  const [, setQrMd5] = useState("");
  const [qrCountdown, setQrCountdown] = useState(0);
  const [qrStatus, setQrStatus] = useState("idle");
  const qrCountdownRef = useRef(null);
  const qrVerifyRef = useRef(null);
  const qrStatusRef = useRef("idle");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [product, setProduct] = useState(null);
  const { data: item } = useGetItemByIdQuery({ id: id, token },
    { skip: !id })
  const saleItemContext = useGetAllSaleQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debounce
  },
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });
  const categoryContext = useGetAllCategoriesQuery(token);
  const orderContext = useGetAllOrderQuery(token);
  const { refetch: refetchWaste } = useGetAllWasteQuery(token);

  const items = useMemo(() => saleItemContext?.data?.data || [], [saleItemContext?.data]);
  const totalItems = saleItemContext?.data?.pagination?.total || 0;

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    document.body.dataset.muteRealtimeOrderAlerts = "true";
    document.body.dataset.muteRealtimeOrderAudio = "true";
    return () => {
      delete document.body.dataset.muteRealtimeOrderAlerts;
      delete document.body.dataset.muteRealtimeOrderAudio;
    };
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "kh" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  useEffect(() => {
    setProduct(item?.data);
    console.log(id);

  }, [id, item])

  useEffect(() => {
    // Load data from localStorage
    const savedOrders = localStorage.getItem('orderItems');
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      setOrders(parsed);
      const itemCount = parsed.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
      setOrderCount(itemCount);
    }
  }, []);

  useEffect(() => {
    const itemCount = orders?.items?.reduce((sum, curr) => sum + (curr.quantity || 0), 0) || 0;
    setOrderCount(itemCount);
  }, [orders?.items]);

  useEffect(() => {
    return () => {
      if (qrCountdownRef.current) {
        clearInterval(qrCountdownRef.current);
      }
      if (qrVerifyRef.current) {
        clearInterval(qrVerifyRef.current);
      }
    };
  }, []);

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
    }
  }, [items, categoryContext?.data]);

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

  const getItemStock = (item) => {
    return Number(item?.in_stock ?? item?.stock?.in_stock ?? 0);
  };

  const onFilterCategory = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
  };

  const getLocation = () => {
    event.preventDefault();
    if (!navigator.geolocation) {
      setErrors({ general: "Geolocation is not supported by your browser" });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newAddress = `${position.coords.latitude}, ${position.coords.longitude}`;
        setOrders((prev) => ({
          ...prev,
          order_address: newAddress,
        }));
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setErrors({ general: err.message });
        setLoading(false);
      }
    );
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
    const keyword = (search || "").trim().toLowerCase();

    const filtered = allItems.filter((item) => {
      const passCategory =
        selectedCategory === "all" || String(item.category_id) === String(selectedCategory);

      if (!passCategory) return false;
      if (!keyword) return true;

      return (
        item.name?.toLowerCase().includes(keyword) ||
        item.code?.toLowerCase().includes(keyword)
      );
    });

    setItemsSech(filtered);
  }, [allItems, selectedCategory, search]);

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

  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);
  const onCloseModal = () => setVisible(false);
  // Handle order
  function handleOrder(item, quantity) {
    if (!user) {
      setShowSignInModal(true);
      return;
    }

    if (!item) {
      toast.error("Item not found");
      return;
    }

    const availableStock = getItemStock(item);
    if (availableStock <= 0) {
      toast.error("Out of stock");
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
      (orderItem) => orderItem.selectionKey === selectionKey
    );

    if (sameOrder) {
      if (sameOrder.quantity + Number(quantity) > availableStock) {
        toast.error("Not enough stock available");
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
            in_stock: availableStock,
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
  }

  function handleQtyPlus(id, selectionKey) {
    const findItem = orders.items.find(item =>
      item.id === id && item.selectionKey === selectionKey
    );
    console.log(findItem);


    if (!findItem) return;

    const availableStock = getItemStock(findItem);
    if (findItem.quantity >= availableStock) {
      toast.error("Not enough stock available");
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
      status: 1,
      online: 1,
      deliver_id: 1,
      delivery_fee: orders.deliver_fee ?? 0,
      through: userLogin?.data?.id,
      order_payment_status: "cod",
      order_payment_method: "bank",
      payment: 0,
      sale_type: 'sale',
      order_customer_id: 1,
      order_discount: calculateTotalDiscount() || 0,
      order_address: orders.order_address || "unknown",
      items: itemsWithAttributes
    };

    console.log(payload);


    try {
      setLoading(true);
      setAlertBox(false);

      const orderRes = await api.post("/order_masters", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('guestToken')}` },
      });

      if (orderRes.data.status === 200) {
        orderContext.refetch();
        refetchWaste();
        toast.success(orderRes.data.message || "Order created successfully");

        // Refresh data
        if (saleItemContext?.refetch) saleItemContext.refetch();
        // if (orderId?.refetch) orderId.refetch();

        setAlertBox(false);
        setLoading(false);
        setOrderCount(0);
        setOpen(false);
        localStorage.setItem("orderItems", JSON.stringify(initialOrder));
        setOrders(initialOrder);

        // Navigate to receipt/invoice
        // const path = payload.sale_type === "sale"
        //   ? `/order-list/receipt/${orderRes.data.data.order_id}`
        //   : `/order-list/invoice/${orderRes.data.data.order_id}`;
        navigate('order-tracking');
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
    // Validate order_tel and order_address for retail sales
    const errors = {};

    if (orders?.sale_type === "sale") {
      if (!orders?.order_tel || orders?.order_tel.trim().length === 0) {
        errors.order_tel = "Phone number is required";
      }
      if (!orders?.order_address || orders?.order_address.trim().length === 0) {
        errors.order_address = "Address is required";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setValidationErrors({});
    // Show QR payment modal instead of alert box
    console.log('good');

    await showQrPayment();
  }

  function onSearch(e) {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
  }


  // Calculate total discount for display
  const calculateTotalDiscount = () => {
    let totalDiscount = 0;

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

  const hanldeSignIn = async (e) => {
    e.preventDefault();
    if (!tel || tel.length < 9) {
      toast.error('Invalid phone number, at least 9 digits.')
      return;
    }
    setLoading(true);

    try {
      const response = await api.post(`/guest/${tel}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const {
        token: userToken,
        user,
      } = response.data;

      localStorage.setItem("guestToken", userToken);
      localStorage.setItem("guest", JSON.stringify(user));
      if (user?.id) {
        localStorage.setItem("guestId", user.id);
      }
      if (id) {
        localStorage.setItem("profileId", id);
      }
      if (Echo?.connector?.options?.auth?.headers) {
        Echo.connector.options.auth.headers.Authorization = `Bearer ${userToken}`;
      }
      window.dispatchEvent(new Event("auth-changed"));
      if (!loading) {
        toast.success("SingIn successful");
        setShowSignInModal(false);
        setUser(user);
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "An error occurred during login"
      );
    } finally {
      setLoading(false);
    }
  };

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
    setQrPaymentModal(false);
  };

  const startQrCountdown = () => {
    setQrCountdown(300);
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
        const isPaid = await qrService.verifyQrPayment(token, md5Hash);

        if (isPaid) {
          clearQrTimers();
          setQrStatusSafe("paid");
          toast.success("Payment received. Creating order...");
          closeQrModal();
          handleConfirm();
        }
      } catch {
        // Ignore transient polling errors.
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

  const showQrPayment = async () => {
    const rawAmount = orders.order_total || 0;
    const rate = exchangeRate?.data?.usd_to_khr || null;
    const amount = rate ? Math.round(rawAmount * rate) : rawAmount;
    const currency = rate ? "KHR" : "USD";
    console.log(rawAmount, rate, amount);


    if (!amount || amount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }

    setQrLoading(true);

    try {
      const qrResponse = await qrService.fetchQrCode(token, amount, currency);
      const qrString = qrResponse?.qr || qrResponse?.qr_string || "";
      const md5Hash = qrResponse?.md5 || "";

      if (!qrString || !md5Hash) {
        throw new Error("QR code not available");
      }

      setQrValue(qrString);
      setQrPaymentModal(true);
      startQrFlow(md5Hash);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Failed to generate QR code");
      closeQrModal();
    } finally {
      setQrLoading(false);
    }
  };

  // Helper component for stock numbers
  const StockStat = ({ label, value, icon }) => (
    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl flex flex-col items-center">
      <div className="mb-1">{icon}</div>
      <span className="text-lg font-bold text-slate-800">{value}</span>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-2 transition-colors ${darkMode ? "bg-slate-950 [&_.ant-modal-content]:!bg-slate-900 [&_.ant-modal-content]:!text-slate-100 [&_.ant-modal-header]:!bg-slate-900 [&_.ant-modal-header]:!border-slate-700 [&_.ant-modal-title]:!text-slate-100 [&_.ant-drawer-content]:!bg-slate-900 [&_.ant-drawer-header]:!bg-slate-900 [&_.ant-drawer-header]:!border-slate-700 [&_.ant-drawer-title]:!text-slate-100 [&_.ant-drawer-body]:!bg-slate-900 [&_.ant-input]:!bg-slate-900 [&_.ant-input]:!text-slate-100 [&_.ant-input]:!border-slate-700 [&_.ant-select-selector]:!bg-slate-900 [&_.ant-select-selector]:!text-slate-100 [&_.ant-select-selector]:!border-slate-700" : "bg-slate-100"}`}
    >
      <section className="mx-auto max-w-[1500px] px-1">
        <AlertBox
          isOpen={alertBox}
          title="Confirm Order"
          message="Are you sure you want to create this order?"
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText="Confirm"
          cancelText="Cancel"
        />

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${darkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="h-10 w-10 rounded-full overflow-hidden ring-1 ring-black/5">
              <img src={profile?.data?.image} alt={profile?.data?.profile_name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{profile?.data?.profile_name}</h1>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>{t("selectProducts")}</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${darkMode
                ? "border-slate-700 bg-slate-800 text-yellow-400 hover:bg-slate-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              title={darkMode ? t("lightMode") : t("darkMode")}
            >
              {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </button>
            <button
              onClick={toggleLanguage}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors ${darkMode
                ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              title={i18n.language === "en" ? t("switchToKhmer") : t("switchToEnglish")}
            >
              <FaLanguage className="text-base" />
              <span>{i18n.language === "en" ? "KH" : "EN"}</span>
            </button>
            <Button
              onClick={() => setShowSignInModal(true)}
              variant="danger"
              icon={<IoLogOutOutline />}
              darkMode={darkMode}
              className="h-9 w-9 p-0"
            />
            {user && (
              <Link to="order-tracking">
                <Badge count={0} color="green">
                  <Button variant="success" icon={<FaUser />} darkMode={darkMode} className="h-9 w-9 p-0" />
                </Badge>
              </Link>
            )}
            <div className="fixed bottom-6 right-4 z-50">
              <Badge count={orderCount} color="red" offset={[-5, 5]} >
                <Button onClick={showDrawer} variant="primary" icon={<PiShoppingCartBold />} darkMode={darkMode} className="h-9 w-9 p-0 bg-green-500" />
              </Badge>
            </div>
            <div className="relative flex-1">
              <Input
                value={search}
                onChange={onSearch}
                darkMode={darkMode}
                className={`${darkMode ? '!text-slate-100' : 'text-black'} min-w-[220px]`}
                placeholder="Search products by name or code..."
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="mb-4 flex gap-2 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => onFilterCategory('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${selectedCategory === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : darkMode ? '!bg-slate-900 !text-slate-200 !border-slate-700 hover:!bg-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
          >
            All Categories
          </button>
          {Category.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => onFilterCategory(cat.category_id)}
              className={`rounded-full px-3 text-xs font-medium border transition-colors ${selectedCategory === cat.category_id
                ? 'bg-blue-600 text-white border-blue-600'
                : darkMode ? '!bg-slate-900 !text-slate-200 !border-slate-700 hover:!bg-slate-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div>
          {itemsSech?.length === 0 ? (
            // Loading or empty state
            <div className={`rounded-2xl border-2 border-dashed py-14 text-center ${darkMode ? '!border-slate-700 !bg-slate-900' : 'border-gray-300 bg-white'}`}>
              <div className={`mb-4 ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>
                <PiShoppingCartBold className="w-16 h-16 mx-auto" />
              </div>
              <h3 className={`mb-2 text-lg font-semibold ${darkMode ? '!text-slate-100' : 'text-gray-700'}`}>No products found</h3>
              <p className={`mx-auto mb-5 max-w-md text-sm ${darkMode ? '!text-slate-400' : 'text-gray-500'}`}>
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={() => navigate('/add-to-stock')} variant="primary" darkMode={darkMode}>
                Add Products to Stock
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-3">
              {itemsSech.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className={`rounded-2xl border transition-all ${darkMode ? '!border-slate-700 !bg-slate-900 hover:!border-slate-600' : 'border-gray-200 bg-white hover:shadow-md'}`}
                >
                  <div className="p-2.5">
                    {/* Image */}
                    <div className={`relative mb-2 overflow-hidden rounded-xl ${darkMode ? '!bg-slate-800' : 'bg-gray-100'}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-full cursor-pointer object-contain transition-transform hover:scale-105"
                        onClick={() => { setVisible(true); setItemId(item.id); }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=128`;
                        }}
                      />
                      {item.discount > 0 && (
                        <div className="absolute top-1 left-1">
                          <Tag color="red">-{item.discount}%</Tag>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`line-clamp-1 text-sm font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{item.name}</h3>
                          <p className={`font-mono text-[11px] ${darkMode ? '!text-slate-500' : 'text-gray-500'}`}>{item.code}</p>
                        </div>
                        {/* <div className="text-right">
                          <div className="text-xs text-gray-600">Wholesale</div>
                          <div className="text-sm font-medium text-blue-600">
                            ${getItemPrice(item, 'wholesale').toFixed(2)}
                          </div>
                        </div> */}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold text-green-600">
                            ${getItemPrice(item, 'sale').toFixed(2)}
                          </div>
                          {item.discount > 0 && (
                            <div className={`text-[11px] line-through ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>
                              ${item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleOrder(item, 1)}
                          disabled={getItemStock(item) <= 0}
                          variant={getItemStock(item) <= 0 ? 'default' : 'primary'}
                          size="sm"
                          darkMode={darkMode}
                          icon={getItemStock(item) <= 0 ? <TbShoppingCartOff /> : <MdOutlineAddShoppingCart />}
                          className="!h-8 !w-8 !p-0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {itemsSech?.length > 0 && (
          <div className={`mt-6 flex justify-center ${darkMode ? '!text-slate-200' : 'text-black'}`}>
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              darkMode={darkMode}
              onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}

        {/* Cart Drawer */}
        <Drawer open={open} onClose={onClose} title={
          <div className="flex items-center gap-2">
            <PiShoppingCartBold className="text-blue-500" />
            <span>Order Summary</span>
            {orderCount > 0 && <Badge count={orderCount} color="blue" className="ml-2" />}
          </div>
        } width={350} darkMode={darkMode}>
          <div className="overflow-hidden relat">
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {orders?.items?.length === 0 ? (
                <div className="text-center py-12">
                  <PiShoppingCartBold className={`mx-auto mb-4 text-4xl ${darkMode ? '!text-slate-500' : 'text-gray-400'}`} />
                  <p className={darkMode ? '!text-slate-300' : 'text-gray-500'}>Your cart is empty</p>
                  <p className={`mt-2 text-sm ${darkMode ? '!text-slate-500' : 'text-gray-400'}`}>Add products from the list</p>
                </div>
              ) : (
                orders?.items?.map((item, index) => (
                  <div key={`${item.id}-${index}`} className={`relative z-0 rounded-2xl border p-2 ${darkMode ? '!border-slate-700 !bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                      onClick={() => handleDelete(item.id, index)}
                      className="absolute -top-2 cursor-pointer -right-0 w-5 h-5 font-extrabold text-red-500 rounded-full text-xs hover:text-red-600 flex items-center justify-center"
                    >
                      ✕
                    </button>
                    <div className="flex gap-3">
                      <div className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border ${darkMode ? '!border-slate-700 !bg-slate-900' : 'border-gray-300 bg-white'}`}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=3b82f6&color=fff&size=64`;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h4 className={`text-sm font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{item.name}</h4>
                            <p className={`text-[11px] ${darkMode ? '!text-slate-500' : 'text-gray-500'}`}>{item.barcode}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">
                              ${(item.price / item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQty(item.id, item.selectionKey)}
                              className="text-red-500 cursor-pointer"
                            >
                              -
                            </button>
                            {/* <span className={`w-6 text-center font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{item.quantity}</span> */}
                            <input type="number" value={item.quantity} name="" id="" className="w-10 focus:outline-0 text-center no-spinner" />
                            <button
                              onClick={() => handleQtyPlus(item.id, item.selectionKey)}
                              className="text-green-500 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="font-bold text-blue-600">${item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {orders?.items?.length > 0 && (
              <div className={`mt-5 space-y-4 ${darkMode ? '!text-slate-100' : 'text-black'}`}>
                <Divider darkMode={darkMode} />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-xs ${darkMode ? '!text-slate-400' : 'text-gray-600'}`}>Subtotal</span>
                    <span className="font-bold">${currencyFormat(orders?.order_subtotal)}</span>
                  </div>
                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <FaPercent className="text-xs" /> Total Discount
                      </span>
                      <span className="font-bold">-${currencyFormat(calculateTotalDiscount())}</span>
                    </div>
                  )}
                  {(
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <label className="text-gray-600 dark:text-gray-200 text-xs">លេខទូរស័ព្ទអ្នកទទួល</label>
                        <Input
                          darkMode={darkMode}
                          value={orders?.order_tel || ''}
                          onChange={(e) => {
                            setOrders(prev => {
                              const newOrders = { ...prev, order_tel: e.target.value };
                              localStorage.setItem('orderItems', JSON.stringify(newOrders));
                              return newOrders;
                            });
                            if (validationErrors.order_tel) {
                              setValidationErrors(prev => ({ ...prev, order_tel: null }));
                            }
                          }}
                          placeholder="0123456789"
                          className={validationErrors.order_tel ? 'border-red-500' : ''}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600 dark:text-gray-200 mb-1 text-xs">អាស័យដ្ឋានអតិថិជន</label>
                        <Textarea
                          darkMode={darkMode}
                          value={orders?.order_address || ''}
                          onChange={(e) => {
                            setOrders(prev => {
                              const newOrders = { ...prev, order_address: e.target.value };
                              localStorage.setItem('orderItems', JSON.stringify(newOrders));
                              const coords = e.target.value.split(',');
                              if (coords.length >= 2) {
                                setLocation({ latitude: coords[0].trim(), longitude: coords[1].trim() });
                              }
                              return newOrders;
                            });
                            if (validationErrors.order_address) {
                              setValidationErrors(prev => ({ ...prev, order_address: null }));
                            }
                          }}
                          placeholder="address"
                          rows={3}
                          className={validationErrors.order_address ? 'border-red-500' : 'border-gray-300'}
                        />
                      </div>
                    </>
                  )}
                  {location.latitude && location.longitude && (
                    <div className="mt-4">
                      <h3 className={`mb-2 text-md font-semibold ${darkMode ? '!text-slate-200' : 'text-gray-700'}`}>Location Preview:</h3>
                      <div className={`rounded-xl border p-2 ${darkMode ? '!border-slate-700' : 'border-gray-200'}`}>
                        <iframe
                          src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&hl=es;z=14&output=embed`}
                          width="100%"
                          height="180"
                          className="rounded"
                          title="map"
                        />
                        <p className={`mt-1 text-xs ${darkMode ? '!text-slate-400' : 'text-gray-600'}`}>
                          <span className="font-medium">Coordinates:</span> {location.latitude}, {location.longitude}
                        </p>
                      </div>
                    </div>
                  )}
                  <Divider darkMode={darkMode} />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount</span>
                    <div className="text-right">
                      <div className="text-green-600 text-xl">${currencyFormat(orders?.order_total)}</div>
                      {exchangeRate?.data?.usd_to_khr && (
                        <div className="text-xs text-gray-500">
                          ≈ ៛{currencyFormat(parseFloat(orders?.order_total) * Number(exchangeRate.data.usd_to_khr))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button disabled={loading} onClick={handleSubmit} variant="success" size="lg" darkMode={darkMode} className="w-full">
                    {loading ? 'Ordering. . .' : 'PreOrder'}
                  </Button>
                  <Button
                    onClick={() => {
                      setOrders({ items: [] });
                      localStorage.setItem('orderItems', JSON.stringify({ items: [] }));
                      setOrderCount(0);
                      toast.success('Cart cleared');
                    }}
                    variant="outline"
                    size="lg"
                    darkMode={darkMode}
                    className="w-full"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Drawer>

        {/* Sign In Modal */}
        <Modal open={showSignInModal} onClose={() => setShowSignInModal(false)} width={400} darkMode={darkMode}>
          <div className="p-5">
            <h3 className={`mb-4 flex items-center gap-2 text-lg font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>
              <FaUser className="text-green-500" /> Sign In Account
            </h3>
            <div className={`space-y-4 ${darkMode ? '!text-slate-300' : 'text-gray-700'}`}>
              <div>
                <label className={`mb-1 block text-sm font-medium ${darkMode ? '!text-slate-300' : 'text-gray-700'}`}>Phone Number</label>
                <Input
                  darkMode={darkMode}
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="Enter your phone number"
                  icon={<FaPhone className="text-gray-400" />}
                />
              </div>
              <div className={`flex justify-end gap-3 pt-4 border-t ${darkMode ? '!border-slate-700' : ''}`}>
                <Button onClick={() => setShowSignInModal(false)} variant="outline" darkMode={darkMode}>
                  Cancel
                </Button>
                <Button onClick={hanldeSignIn} variant="success" icon={<FaCheck />} darkMode={darkMode}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Product Detail Modal */}
        <Modal open={visible} onClose={onCloseModal} width={900} darkMode={darkMode}>
          <div className="flex h-full flex-col md:flex-row">
            {/* Left: Image */}
            <div className={`relative flex w-full flex-col items-center p-5 md:w-1/2 ${darkMode ? '!bg-slate-800 !border-slate-700' : 'bg-slate-50 border-r border-slate-200'}`}>
              <div className="absolute top-4 left-4">
                <Tag color="blue">{product?.code}</Tag>
              </div>
              <img
                src={product?.image}
                alt={product?.name}
                className="w-full max-h-80 object-contain mix-blend-multiply"
              />
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {product?.images?.map((img, idx) => (
                  <img key={idx} src={img.image} className="w-16 h-16 border-2 border-white rounded object-cover cursor-pointer hover:border-blue-400" />
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="w-full overflow-y-auto p-5 md:w-1/2">
              <div className="mb-4">
                <div className={`mb-1 flex items-center gap-2 text-xs uppercase ${darkMode ? '!text-slate-500' : 'text-gray-500'}`}>
                  <MdOutlineCategory /> {product?.category_name} • <MdOutlineBrandingWatermark /> {product?.brand_name}
                </div>
                <h2 className={`text-2xl font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>{product?.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl font-bold text-blue-600">${product?.price}</span>
                  {product?.price < product?.wholesale_price && (
                    <span className="text-gray-400 line-through">${product?.wholesale_price}</span>
                  )}
                  <Tag color="green">In Stock: {product?.stock?.in_stock}</Tag>
                </div>
              </div>

              <Divider darkMode={darkMode} />

              <div className="space-y-4">
                <h4 className={`text-sm font-bold uppercase ${darkMode ? '!text-slate-200' : 'text-gray-700'}`}>Product Specifications</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <BsQrCodeScan className="text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-400">Barcode</p>
                      <p className="text-sm font-medium">{product?.barcode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                    <GiScales className="text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-400">Scale</p>
                      <p className="text-sm font-medium">{product?.scale_name}</p>
                    </div>
                  </div>
                </div>

                {product?.attributes?.map((attr) => (
                  <div key={attr.id}>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">{attr.name}</p>
                    <div className="flex gap-2">
                      {Array.isArray(attr.value) ? (
                        attr.value.map((v) => (
                          <div
                            key={v.id}
                            className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110"
                            style={{ backgroundColor: v.value }}
                            title={v.value}
                          />
                        ))
                      ) : (
                        <Tag color="gray">{attr.value}</Tag>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => { handleOrder(product, 1); onCloseModal(); }}
                  variant="primary"
                  size="lg"
                  darkMode={darkMode}
                  icon={<BsLightningChargeFill />}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* QR Payment Modal */}
        <Modal open={qrPaymentModal} onClose={closeQrModal} width={400} darkMode={darkMode}>
          <div className="p-5">
            <div className="text-center mb-6">
              <h3 className={`mb-2 text-xl font-bold ${darkMode ? '!text-slate-100' : 'text-gray-800'}`}>QR Payment</h3>
              <p className={darkMode ? '!text-slate-400' : 'text-gray-600'}>Scan the QR code to complete your payment</p>
            </div>

            {qrValue && (
              <div className="text-center">
                <div ref={qrRef} className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg mb-4">
                  <QRCodeCanvas
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: bakong,
                      x: undefined,
                      y: undefined,
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Amount to Pay</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${orders.order_total?.toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDownload(qrRef, 'png', 'QR_Payment', `QR_${orders.order_total}`)}
                    variant="outline"
                    size="md"
                    darkMode={darkMode}
                    className="w-full"
                    disabled={qrLoading}
                  >
                    Download QR
                  </Button>
                </div>

                <div className="mt-4">
                  {qrStatus === "waiting" && (
                    <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                      Waiting for payment... ({Math.floor(qrCountdown / 60)}:{(qrCountdown % 60).toString().padStart(2, '0')})
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirm}
                      variant="outline"
                      size="md"
                      darkMode={darkMode}
                      className="w-full"
                      disabled={qrLoading}
                    >
                      Skip to COD
                    </Button>
                  </div>
                  {qrStatus === "paid" && (
                    <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                      Payment verified. Creating order...
                    </div>
                  )}
                  {qrStatus === "expired" && (
                    <div className="space-y-3">
                      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        QR payment expired. Generate a new QR code to continue.
                      </div>
                      <Button
                        onClick={showQrPayment}
                        variant="primary"
                        size="lg"
                        darkMode={darkMode}
                        className="w-full"
                        disabled={qrLoading}
                      >
                        Generate New QR
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!qrValue && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating QR Code...</p>
              </div>
            )}
          </div>
        </Modal>
      </section>
    </motion.div>
  );
};

export default Sales;
