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
import { FaPercent, FaPalette, FaRuler, FaMapMarkerAlt, FaHistory, FaUser, FaPhone, FaCheck } from "react-icons/fa";
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
const Button = ({ children, onClick, variant = 'default', size = 'md', icon, disabled, className = '', type = 'button' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants = {
    default: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-700',
    primary: 'border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'border border-red-600 bg-red-600 hover:bg-red-700 text-white',
    success: 'border border-green-600 bg-green-600 hover:bg-green-700 text-white',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700',
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
const Input = ({ value, onChange, placeholder, type = 'text', icon, className = '' }) => (
  <div className="relative">
    {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${icon ? 'pl-10' : ''} ${className}`}
    />
  </div>
);

// Custom Textarea
const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
  />
);

// Custom Select
const Select = ({ value, onChange, children, className = '' }) => (
  <select
    value={value}
    onChange={onChange}
    className={`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white ${className}`}
  >
    {children}
  </select>
);

// Custom Divider
const Divider = ({ className = '' }) => <hr className={`border-t border-gray-200 my-4 ${className}`} />;

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
const Pagination = ({ current, total, pageSize, onChange }) => {
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
        className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
      >
        Previous
      </button>
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`px-3 py-1 border rounded text-sm ${current === page ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current === totalPages}
        className="px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100 disabled:opacity-50 text-sm"
      >
        Next
      </button>
    </div>
  );
};

// Custom Modal
const Modal = ({ open, onClose, children, width = 500 }) => {
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
        className="bg-white rounded shadow-lg max-h-[90vh] overflow-auto relative"
        style={{ width: typeof width === "number" ? `${width}px` : width }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-5 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {children}
      </motion.div>
    </div>
  );
};

// Custom Drawer
const Drawer = ({ open, onClose, title, children, width = 400 }) => {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween' }}
        className="fixed top-0 right-0 z-50 h-full bg-white shadow-xl overflow-auto"
        style={{ width }}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </>
  );
};

const Sales = () => {
  const { id, token } = useParams();
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));
  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id,
    token,
  });


  const navigate = useNavigate();
  const { data: profile } = useGetUserProfileQuery({ id, token });
  const [payment, setPayment] = useState("paid");
  const [alertBox, setAlertBox] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(localStorage.getItem('guestToken') ? false : true);
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
  const [itemId, setItemId] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [product, setProduct] = useState({});
  const { data: item } = useGetItemByIdQuery({ id: itemId, token },
    { skip: !itemId })
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
    setProduct(item?.data);
    console.log(itemId);

  }, [itemId, item])

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
      through: userLogin?.data?.id,
      order_payment_status: "cod",
      payment: 0,
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
    setAlertBox(true);
  }

  function onSearch(e) {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
  }


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
      className="min-h-screen bg-gray-300 p-3"
    >
      <section className="px-2">
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
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-200 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <img src={profile?.data?.image} alt={profile?.data?.profile_name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{profile?.data?.profile_name}</h1>
              <p className="text-gray-600 text-sm">Select products and create orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                value={search}
                onChange={onSearch}
                className="text-black"
                placeholder="Search products by name or code..."
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
            <Button
              onClick={() => setShowSignInModal(true)}
              variant="danger"
              icon={<IoLogOutOutline />}
              className="h-10 w-10 p-0"
            />
            {user && (
              <Link to="order-tracking">
                <Badge count={0} color="green">
                  <Button variant="success" icon={<FaUser />} className="h-10 w-10 p-0" />
                </Badge>
              </Link>
            )}
            <div className=" fixed bottom-25 right-4 z-50">
              <Badge count={orderCount} color="red" offset={[-5, 5]} >
                <Button onClick={showDrawer} variant="primary" icon={<PiShoppingCartBold />} className="h-10 w-10 p-0 bg-green-500" />
              </Badge>
            </div>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => onFilterCategory('all')}
            className={`px-4 rounded-full text-xs font-medium border transition-colors ${selectedCategory === 'all'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
          >
            All Categories
          </button>
          {Category.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => onFilterCategory(cat.category_id)}
              className={`px-4 py-1 rounded-full text-xs font-medium border transition-colors ${selectedCategory === cat.category_id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
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
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded bg-white">
              <div className="text-gray-400 mb-4">
                <PiShoppingCartBold className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button onClick={() => navigate('/add-to-stock')} variant="primary">
                Add Products to Stock
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4">
              {itemsSech.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-3">
                    {/* Image */}
                    <div className="relative mb-3 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-28 object-contain cursor-pointer hover:scale-105 transition-transform"
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
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-gray-500 font-mono">{item.code}</p>
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
                          <div className="text-lg font-bold text-green-600">
                            ${getItemPrice(item, 'sale').toFixed(2)}
                          </div>
                          {item.discount > 0 && (
                            <div className="text-xs text-gray-400 line-through">
                              ${item.price.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleOrder(item, 1)}
                          disabled={getItemStock(item) <= 0}
                          variant={getItemStock(item) <= 0 ? 'default' : 'primary'}
                          size="sm"
                          icon={getItemStock(item) <= 0 ? <TbShoppingCartOff /> : <MdOutlineAddShoppingCart />}
                          className="!p-2"
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
          <div className="mt-8 flex text-black justify-center">
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
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
        } width={350}>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {orders?.items?.length === 0 ? (
              <div className="text-center py-12">
                <PiShoppingCartBold className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-gray-400 text-sm mt-2">Add products from the list</p>
              </div>
            ) : (
              orders?.items?.map((item, index) => (
                <div key={`${item.id}-${index}`} className="relative border border-gray-200 rounded p-3 bg-gray-50">
                  <button
                    onClick={() => handleDelete(item.id, index)}
                    className="absolute -top-0 -right-2 w-5 h-5 font-extrabold text-red-500 rounded-full text-xs hover:text-red-600 flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 border border-gray-300 rounded overflow-hidden bg-white flex-shrink-0">
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
                          <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-500">{item.barcode}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">
                            ${(item.price / item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQty(item.id, item.selectionKey)}
                            className="w-6 h-6 rounded bg-red-500 text-white hover:bg-red-600"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyPlus(item.id, item.selectionKey)}
                            className="w-6 h-6 rounded bg-green-500 text-white hover:bg-green-600"
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
            <div className="mt-6 space-y-4 text-black">
              <Divider />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-xs">Subtotal</span>
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
                      <label className="text-gray-600 text-xs">លេខទូរស័ព្ទអ្នកទទួល</label>
                      <Input
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
                      <label className="block text-gray-600 mb-1 text-xs">អាស័យដ្ឋានអតិថិជន</label>
                      <Textarea
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
                        className={validationErrors.order_address ? 'border-red-500' : ''}
                      />
                    </div>
                  </>
                )}

                {location.latitude && location.longitude && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Location Preview:</h3>
                    <div className="border border-gray-200 rounded p-2">
                      <iframe
                        src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&hl=es;z=14&output=embed`}
                        width="100%"
                        height="180"
                        className="rounded"
                        title="map"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Coordinates:</span> {location.latitude}, {location.longitude}
                      </p>
                    </div>
                  </div>
                )}

                <Divider />
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
                <Button disabled={loading} onClick={handleSubmit} variant="success" size="lg" className="w-full">
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
                  className="w-full"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </Drawer>

        {/* Sign In Modal */}
        <Modal open={showSignInModal} onClose={() => setShowSignInModal(false)} width={400}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUser className="text-green-500" /> Sign In Account
            </h3>
            <div className="space-y-4 text-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <Input
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="Enter your phone number"
                  icon={<FaPhone className="text-gray-400" />}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button onClick={() => setShowSignInModal(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={hanldeSignIn} variant="success" icon={<FaCheck />}>
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Product Detail Modal */}
        <Modal open={visible} onClose={onCloseModal} width={900}>
          <div className="flex flex-col md:flex-row h-full">
            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-slate-50 p-6 flex flex-col items-center relative border-r border-slate-200">
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
            <div className="w-full md:w-1/2 p-6 overflow-y-auto">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase mb-1">
                  <MdOutlineCategory /> {product?.category_name} • <MdOutlineBrandingWatermark /> {product?.brand_name}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{product?.name}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl font-bold text-blue-600">${product?.price}</span>
                  {product?.price < product?.wholesale_price && (
                    <span className="text-gray-400 line-through">${product?.wholesale_price}</span>
                  )}
                  <Tag color="green">In Stock: {product?.stock?.in_stock}</Tag>
                </div>
              </div>

              <Divider />

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 uppercase">Product Specifications</h4>
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
                  icon={<BsLightningChargeFill />}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </section>
    </motion.div>
  );
};

export default Sales;
