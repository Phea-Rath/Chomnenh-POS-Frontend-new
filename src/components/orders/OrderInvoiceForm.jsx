import React, { useEffect, useMemo, useState } from "react";
import {
  FaBox,
  FaCalendarAlt,
  FaCloudUploadAlt,
  FaDollarSign,
  FaExclamationTriangle,
  FaFileInvoice,
  FaLayerGroup,
  FaPercent,
  FaSave,
  FaTag,
  FaTimes,
  FaTruck,
  FaUser,
  FaWarehouse,
  FaMoneyBillWave,
} from "react-icons/fa";
import { BsBank } from "react-icons/bs";
import { IoIdCard } from "react-icons/io5";
import { GiNotebook } from "react-icons/gi";
import api from "../../services/api";
import { useNavigate, useParams } from "react-router";
import { useNotify } from "../../utils/NotificationProvider";
import { Badge, Divider, DatePicker, Checkbox, Alert } from "antd";
import dayjs from "dayjs";
import { useDebounce } from "use-debounce";
import { useTranslation } from "react-i18next";
import ItemTable from "../../utils/ItemTable";
import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import * as XLSX from "xlsx";
import readFormFile from "../../services/readFormFile";
import ImportItemInList from "../../utils/ImportItemInList";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllDeliverQuery } from "../../../app/Features/deliversSlice";
import { useGetAllUserQuery } from "../../../app/Features/usersSlice";
import { useGetOrderByIdQuery, useGetOrderInvoiceQuery } from "../../../app/Features/ordersSlice";
import Modal from "../../utils/Modal";
import { LuSearch } from "react-icons/lu";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "../../services/paymentService";
import AlertBox from "../../services/AlertBox";

const DEFAULT_STATUS = 0;
const ITEM_FOR_OPTIONS = [
  { value: "sale", label: "Sale" },
  { value: "sample", label: "Sample" },
  { value: "free", label: "Free" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "ac", label: "ACLIDA" },
  { value: "bakong", label: "Bakong" },
  { value: "aba", label: "ABA" },
];

const ORDER_PAYMENT_STATUS_OPTIONS = [
  { value: "credit", label: "Credit" },
  { value: "cod", label: "COD" },
  { value: "paid", label: "Paid" },
];

const STATUS_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Approved" },
  { value: 5, label: "Delivering" },
  { value: 6, label: "Completed" },
  { value: 7, label: "Cancelled" },
];

const DEFAULT_FILTERS = {
  created_by: "",
  customer_id: "",
  item_for: "",
  start_date: "",
  end_date: "",
};

const PAYMENT_METHOD_SEARCH_OPTIONS = PAYMENT_METHOD_OPTIONS.map((option) => ({
  ...option,
  id: option.value,
  title: option.label,
}));

const VAT_OPTIONS = [
  { value: 0, label: "Tax exclusive" },
  { value: 10, label: "Tax inclusive" },
];

const ORDER_PAYMENT_STATUS_SEARCH_OPTIONS = ORDER_PAYMENT_STATUS_OPTIONS.map((option) => ({
  ...option,
  id: option.value,
  title: option.label,
}));

const today = new Date().toISOString().split("T")[0];

const createInitialFormData = () => ({
  status: DEFAULT_STATUS,
  order_customer_id: "",
  deliver_id: "",
  delivery_fee: 0,
  due_date: "",
  order_tax: 0,
  payment: 0,
  order_payment_status: "",
  order_payment_method: "",
  order_date: today,
  exchange_rate: 0,
  reference_no: "",
  sub_total: 0,
  sale_type: "wholesale",
  created_by: "",
  term: 0,
  order_tel: "",
  order_address: "",
  discount_total: 0,
  total_amount: 0,
  balance: 0,
  items: [],
  payments: [],
  online: 0,
  through: 0,
});

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};//e.g undefined or null = 0, 1.245678 = 1.25



const OrderInvoiceForm = () => {
  const { t } = useTranslation();
  const notify = useNotify();
  const { id: orderId } = useParams();
  const isEditMode = Boolean(orderId);
  const token = localStorage.getItem("token");

  const navigator = useNavigate();

  const [formData, setFormData] = useState(() => createInitialFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [alertError, setAlertError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [limit, setLimit] = useState(10);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [currentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    amount: 0,
    transection_id: '',
    paid_at: today,
    remark: ''
  });

  const toggleSelectInvoice = (id) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = invoices.map((inv) => inv.order_id || inv.id);
    const allSelected = pageIds.every((id) => selectedInvoiceIds.includes(id));

    if (allSelected) {
      setSelectedInvoiceIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedInvoiceIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleImportTemplates = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setLoading(true);
    try {
      const allItems = [];
      let lastOrderData = null;

      for (const orderId of selectedInvoiceIds) {
        const response = await api.get(`/order_masters/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const order = response.data.data;
        lastOrderData = order;

        const items = (order.items || order.details || []).map((detail) => {
          const currentItem = itemLookup.get(Number(detail.item_id));
          return {
            item_id: Number(detail.item_id),
            item_name: detail.item_name || detail.name || "",
            name: detail.item_name || detail.name || "",
            code: detail.item_code || detail.code || "",
            image: detail.images?.[0]?.image || detail.image || null,
            item_for: detail.item_for || "sale",
            item_price: toNumber(detail.item_price ?? detail.unit_price),
            quantity: toNumber(detail.quantity),
            discount: toNumber(detail.discount),
            in_stock: currentItem ? toNumber(currentItem.in_stock) : toNumber(detail.in_stock || 0),
          };
        });
        allItems.push(...items);
      }

      updateFormData((prev) => {
        const nextItems = [...prev.items];

        allItems.forEach((newItem) => {
          const existingIndex = nextItems.findIndex(
            (item) => item.item_id === newItem.item_id && item.item_for === newItem.item_for
          );
          if (existingIndex >= 0) {
            nextItems[existingIndex] = {
              ...nextItems[existingIndex],
              quantity: nextItems[existingIndex].quantity + newItem.quantity,
            };
          } else {
            nextItems.push(newItem);
          }
        });

        return {
          ...prev,
          order_customer_id: prev.order_customer_id || lastOrderData?.customer_id || "",
          items: nextItems,
        };
      });

      setSelectedInvoiceIds([]);
      setShowModal(false);
      notify.success(t("templatesImported") || "Items imported successfully");
    } catch (error) {
      console.error("Error importing templates:", error);
      const err = t("errorImportingTemplates") || "Failed to import templates";
      setAlertError(err);
      notify.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { data: users } = useGetAllUserQuery(token)
  const { data: orderByIdData, isFetching: orderByIdLoading, refetch } = useGetOrderByIdQuery(
    { id: orderId, token },
    { skip: !isEditMode || !orderId || !token }
  );

  const {
    refetch: refetchInvoice,
  } = useGetOrderInvoiceQuery(
    {
      token,
      limit: 10,
      page: 1,
      search: '',
    },
    { skip: !token }
  );

  const { data: customerData } = useGetAllCustomerQuery(token);
  const { data: deliverData } = useGetAllDeliverQuery(token);
  const { data: itemInStock, isFetching: itemInStockLoading } = useGetAllSaleQuery({
    token,
    limit,
    page: currentPage,
    search: debouncedSearch,
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    pageSizeOptions: [10, 20, 50, 100],
  });

  const { data: usersData } = useGetAllUserQuery(token, { skip: !token });
  const { data: customersData } = useGetAllCustomerQuery(token, { skip: !token });
  const {
    data: invoiceData,
    isLoading: queryLoading,
    refetch: refetchInvoices,
  } = useGetOrderInvoiceQuery(
    {
      token,
      limit: pagination.pageSize,
      page: pagination.current,
      search: debouncedSearch,
      ...filters,
    },
    { skip: !token }
  );

  const createUser = users?.data?.filter((user) => user.role_id !== 1 && user.role_id !== 2) || [];
  const customers = customerData?.data || [];
  const delivers = deliverData?.data || [];
  const items = useMemo(() => itemInStock?.data ?? [], [itemInStock?.data]);
  const targetFields = ["code", 'for', "quantity", "price", "discount"];

  const itemLookup = useMemo(() => {
    return new Map(items.map((item) => [Number(item.id), item]));
  }, [items]);

  const getDefaultItemPrice = (item) => {
    return toNumber(item.price);
  };

  const invoices = invoiceData?.data || [];
  const userFilterOptions = [{ id: "", username: "All Users" }, ...createUser];
  const customerFilterOptions = [{ customer_id: "", customer_name: "All Customers" }, ...customers];

  useEffect(() => {
    if (invoiceData?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: invoiceData.pagination.total,
      }));
    }
  }, [invoiceData]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [debouncedSearch, filters.created_by, filters.customer_id, filters.item_for, filters.start_date, filters.end_date]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };


  const buildOrderItem = (item, overrides = {}) => ({
    item_id: Number(item.id),
    item_name: item.name || overrides.item_name || "",
    name: item.name || overrides.name || "",
    code: item.code || overrides.code || "",
    image: item.image || overrides.image || null,
    item_for: overrides.item_for || "sale",
    item_price: overrides.item_price ?? getDefaultItemPrice(item),
    quantity: overrides.quantity ?? 1,
    discount: overrides.discount ?? 0,
    in_stock: toNumber(item.in_stock || overrides.in_stock || 0),
  });

  const calculateTotals = (nextFormData) => {
    const subTotal = nextFormData.items.reduce((sum, item) => {
      return sum + toNumber(item.quantity) * toNumber(item.item_price);
    }, 0);

    const discountTotal = nextFormData.items.reduce((sum, item) => {
      const lineSubtotal = toNumber(item.quantity) * toNumber(item.item_price);
      return sum + (lineSubtotal * toNumber(item.discount)) / 100;
    }, 0);

    const orderTax = toNumber(nextFormData.order_tax);
    const deliveryFee = toNumber(nextFormData.delivery_fee);
    const payment = toNumber(nextFormData.payment);
    const totalAmount = subTotal - discountTotal + orderTax + deliveryFee;
    const balance = Math.max(totalAmount - payment, 0);

    return {
      ...nextFormData,
      sub_total: subTotal,
      discount_total: discountTotal,
      total_amount: totalAmount,
      balance,
    };
  };

  const updateFormData = (updater) => {
    setFormData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return calculateTotals(next);
    });
  };


  useEffect(() => {
    if (!isEditMode || !orderByIdData?.data) {
      return;
    }

    const order = orderByIdData.data;
    // if(order.order_id != Number(orderId)){
    refetch();
    // }

    const normalizedItems = (order.items || order.details || []).map((detail) => {
      const currentItem = itemLookup.get(Number(detail.item_id));
      return {
        item_id: Number(detail.item_id),
        item_name: detail.item_name || detail.name || "",
        name: detail.item_name || detail.name || "",
        code: detail.item_code || detail.code || "",
        image: detail.images?.[0]?.image || detail.image || null,
        item_for: detail.item_for || "sale",
        item_price: toNumber(detail.item_price ?? detail.unit_price),
        quantity: toNumber(detail.quantity),
        discount: toNumber(detail.discount),
        in_stock: currentItem ? toNumber(currentItem.in_stock) : toNumber(detail.in_stock || 0),
      };
    });

    setFormData(
      calculateTotals({
        status: Number(order.status ?? DEFAULT_STATUS),
        order_customer_id: order.order_customer_id || order.customer_id || "",
        deliver_id: order.deliver_id || "",
        delivery_fee: toNumber(order.delivery_fee),
        order_tax: toNumber(order.order_tax || 0),
        payment: toNumber(order.payment),
        order_payment_status: order.order_payment_status,
        due_date: order.due_date || "",
        order_payment_method: order.order_payment_method || "cash",
        order_date: order.order_date || today,
        exchange_rate: toNumber(order.exchange_rate),
        reference_no: order.reference_no || order.order_no || "",
        sub_total: toNumber(order.order_subtotal ?? order.sub_total),
        discount_total: toNumber(order.order_discount),
        term: order.term || 0,
        created_by: order.created_by || "",
        order_tel: order.order_tel || "",
        order_address: order.order_address || "",
        sale_type: order.sale_type || "wholesale",
        total_amount: toNumber(order.order_total ?? order.total_amount),
        balance: toNumber(order.balance),
        items: normalizedItems,
        payments: order.payments || [],
        online: order.online || 0,
        through: order.through || 0,
      })
    );

    if (order.payments && order.payments.length > 0) {
      const lastPayment = order.payments[order.payments.length - 1];
      setPaymentData({
        payment_method: lastPayment.payment_method || 'cash',
        amount: toNumber(lastPayment.amount),
        transection_id: lastPayment.transection_id || '',
        paid_at: lastPayment.paid_at || lastPayment.payment_date || today,
        remark: lastPayment.remark || ''
      });
    }
  }, [isEditMode, orderByIdData]);


  const validateField = (name, value) => {
    const nextFieldErrors = { ...fieldErrors };

    switch (name) {
      case "payment":
        if (value === "" || toNumber(value) < 0) {
          nextFieldErrors.payment = t("required");
        } else {
          delete nextFieldErrors.payment;
        }
        break;
      default:
        delete nextFieldErrors[name];
        break;
    }

    setFieldErrors(nextFieldErrors);
  };

  const validateForm = () => {
    const nextErrors = {};
    const nextFieldErrors = {};

    if (formData.status === "" || formData.status === null || formData.status === undefined) {
      nextErrors.status = t("required");
      nextFieldErrors.status = t("required");
    }

    if (toNumber(formData.payment) < 0) {
      nextErrors.payment = t("invalidPaymentAmount");
      nextFieldErrors.payment = t("invalidPaymentAmount");
    }

    if (formData.items.length === 0) {
      nextErrors.items = t("noItemsAdded");
    }

    formData.items.forEach((item, index) => {
      if (!item.item_id) {
        nextErrors.items = `${t("item")} ${index + 1}: item_id ${t("required")}`;
      }
      if (!String(item.item_name || "").trim()) {
        nextErrors.items = `${t("item")} ${index + 1}: item_name ${t("required")}`;
      }
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        nextErrors.items = `${t("item")} ${index + 1} ${t("invalidQuantity")}`;
      }
      if (toNumber(item.item_price) < 0) {
        nextErrors.items = `${t("item")} ${index + 1} ${t("invalidUnitPrice")}`;
      }
      if (toNumber(item.discount) < 0) {
        nextErrors.items = `${t("item")} ${index + 1}: discount ${t("required")}`;
      }
    });

    if (toNumber(formData.payment) > toNumber(formData.total_amount)) {
      nextErrors.payment = t("paymentExceedBalance");
      nextFieldErrors.payment = t("paymentExceedBalance");
    }

    setErrors(nextErrors);
    setFieldErrors(nextFieldErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (name, value) => {
    validateField(name, value);

    if (name === "order_customer_id" || name === "deliver_id") {
      updateFormData({ [name]: value ? Number(value) : "" });
      return;
    }

    if (["delivery_fee", "order_tax", "payment", "exchange_rate"].includes(name)) {
      updateFormData({ [name]: value === "" ? 0 : toNumber(value) });
      return;
    }

    updateFormData({ [name]: value });
  };

  const addItemToOrder = (id) => {
    const item = itemLookup.get(Number(id));

    if (!item) {
      setErrors({ itemModal: t("selectItem") });
      return;
    }

    updateFormData((prev) => {
      const existingIndex = prev.items.findIndex(
        (entry) => Number(entry.item_id) === Number(id) && entry.item_for === "sale"
      );

      if (existingIndex >= 0) {
        const nextItems = [...prev.items];
        const newQty = Number(nextItems[existingIndex].quantity) + 1;

        if (newQty > nextItems[existingIndex].in_stock) {
          notify.warning(`${t("insufficientStock") || "Insufficient stock"}: ${nextItems[existingIndex].in_stock}`);
          return prev;
        }

        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: newQty,
        };
        return { ...prev, items: nextItems };
      }

      return {
        ...prev,
        items: [...prev.items, buildOrderItem(item)],
      };
    });

    // setErrors((prev) => ({ ...prev, itemModal: "", items: "" }));
    setSearchTerm("");
  };

  const removeItem = (index) => {
    event.preventDefault();
    updateFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleQtyChange = (index, quantity) => {
    const item = formData.items[index];
    if (quantity <= 0) {
      setErrors((prev) => ({ ...prev, items: t("invalidQuantity") }));
      return;
    }

    if (quantity > item.in_stock) {
      notify.warning(`${t("insufficientStock") || "Insufficient stock"}: ${item.in_stock}`);
      quantity = item.in_stock;
    }

    updateFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity } : item
      ),
    }));
  };

  const handleCostChange = (index, itemPrice) => {
    if (itemPrice < 0) {
      setErrors((prev) => ({ ...prev, items: t("invalidCost") }));
      return;
    }

    updateFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, item_price: itemPrice } : item
      ),
    }));
  };

  const handleDiscountChange = (index, discount) => {
    if (discount < 0) {
      setErrors((prev) => ({ ...prev, items: t("pleaseFixErrors") }));
      return;
    }

    updateFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, discount } : item
      ),
    }));
  };

  const handleItemForChange = (index, itemFor) => {
    if (itemFor === "sample" || itemFor === "free") {
      updateFormData((prev) => ({
        ...prev,
        items: prev.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, item_for: itemFor, discount: 0, item_price: 0 } : item
        ),
      }));
    } else {
      updateFormData((prev) => ({
        ...prev,
        items: prev.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, item_for: itemFor } : item
        ),
      }));
    }
  };

  const downloadTemplate = (fields, title) => {
    const worksheet = XLSX.utils.aoa_to_sheet([fields]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, "_")}_Template.xlsx`);
  };

  const handleImportItems = async (event) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedRows = await readFormFile(file, targetFields);
      const res = await api.post(
        "/import-items-by-code",
        { data: importedRows },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sourceItems = res.data.data || [];
      const sourceLookup = new Map(sourceItems.map((item) => [String(item.code || "").toLowerCase(), item]));

      const importedItems = importedRows
        .map((row) => {
          const rowCode = String(row.code || "").trim().toLowerCase();
          const matchedItem = sourceLookup.get(rowCode);
          console.log(matchedItem);


          if (!matchedItem) {
            return null;
          }

          return {
            item_id: Number(matchedItem.id),
            item_name: matchedItem.name || "",
            name: matchedItem.name || "",
            code: matchedItem.code || "",
            image: matchedItem.image || null,
            item_for: row.for || "sale",
            quantity: matchedItem.quantity,
            item_price: getDefaultItemPrice(matchedItem),
            discount: row.discount ?? 0,
            in_stock: toNumber(matchedItem.in_stock),
          };
        })
        .filter(Boolean);

      if (importedItems.length === 0) {
        const err = "No matching items found in the import file.";
        setAlertError(err);
        notify.error(err);
        return;
      }

      updateFormData((prev) => {
        const mergedItems = [...prev.items];

        importedItems.forEach((importedItem) => {
          const existingIndex = mergedItems.findIndex(
            (item) => Number(item.item_id) === Number(importedItem.item_id)
          );

          if (existingIndex >= 0) {
            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              quantity: Number(mergedItems[existingIndex].quantity) + Number(importedItem.quantity),
              item_price: importedItem.item_price,
            };
            return;
          }

          mergedItems.push(importedItem);
        });

        return {
          ...prev,
          items: mergedItems,
        };
      });

      if (res.data.missing_codes) {
        const warning = `Codes ${res.data.missing_codes} are not found.`;
        setErrors((prev) => ({
          ...prev,
          items: `Codes [${res.data.missing_codes}] are not found.`,
        }));
        notify.warning(warning);
      }

      // notify.success(`Imported ${importedItems.length} item(s).`);
    } catch {
      const err = "Failed to import file. please check your file and try again.";
      setAlertError(err);
      notify.error(err);
      setErrors((prev) => ({
        ...prev,
        file: err,
      }));
    } finally {
      event.target.value = "";
    }
  };

  const onScrollFetch = (event) => {
    const target = event.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    const total = itemInStock?.pagination?.total || 0;

    if (nearBottom && total > items.length && !itemInStockLoading) {
      setLimit((prev) => prev + 10);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      const err = t("pleaseFixErrors");
      setAlertError(err);
      notify.error(err);
      return;
    }

    setShowAlert(true);
  };

  const handleConfirmSubmit = async () => {
    setShowAlert(false);
    setLoading(true);

    try {
      const payload = {
        online: formData.online ? Number(formData.online) : 0,
        through: formData.through ? Number(formData.through) : 0,
        status: Number(formData.status),
        order_customer_id: formData.order_customer_id ? Number(formData.order_customer_id) : null,
        order_tel: formData.order_tel || null,
        order_address: formData.order_address || null,
        deliver_id: formData.deliver_id ? Number(formData.deliver_id) : null,
        delivery_fee: toNumber(formData.delivery_fee),
        order_tax: toNumber(formData.order_tax),
        payment: toNumber(formData.payment),
        term: formData.term || 0,
        created_by: formData.created_by ? Number(formData.created_by) : null,
        sale_type: formData.sale_type || null,
        reference_no: formData.reference_no || null,
        order_payment_status: formData.order_payment_status || paymentStatus,
        order_payment_method: formData.order_payment_method,
        order_date: formData.order_date,
        items: formData.items.map((item) => ({
          item_id: Number(item.item_id),
          item_price: toNumber(item.item_price),
          quantity: Number(item.quantity),
          item_for: item.item_for || null,
          discount: toNumber(item.discount),
        })),
        payments: [paymentData],
      };

      if (isEditMode) {
        await api.put(`/order_masters/${orderId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        notify.success(t("updateOrderSuccess"));
      } else {
        await api.post("/order_masters", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        notify.success(t("createOrderSuccess"));
      }

      refetchInvoice();
      navigator(-1);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      const errorMessage = err.response?.data?.message || t("errorProcessingOrder");

      if (serverErrors) {
        const flattenedErrors = Object.fromEntries(
          Object.entries(serverErrors).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
        );
        setErrors(flattenedErrors);
      } else {
        setErrors({ general: errorMessage });
      }

      setAlertError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (value) => {
    updateFormData((prev) => ({
      ...prev,
      order_customer_id: value ? Number(value) : "",
    }));
  };

  const handleUserSelect = (value) => {
    updateFormData((prev) => ({
      ...prev,
      created_by: value ? Number(value) : "",
    }));
  };

  const handlePaymentStatusSelect = (value) => {
    setPaymentStatus(value);
    handleInputChange("order_payment_status", value || "");
    if(value == 'paid'){
      setPaymentData(prev=>({
        ...prev,
        amount: formData?.total_amount
      }))
    }

  };

  const handlePaymentMethodSelect = (value) => {
    handleInputChange("order_payment_method", value || "");
  };

  const handleSelectTemplate = async (selectedOrder) => {
    setLoading(true);
    try {
      const orderId = selectedOrder.order_id || selectedOrder.id;
      const response = await api.get(`/order_masters/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const order = response.data.data;

      const normalizedItems = (order.items || order.details || []).map((detail) => {
        const currentItem = itemLookup.get(Number(detail.item_id));
        return {
          item_id: Number(detail.item_id),
          item_name: detail.item_name || detail.name || "",
          name: detail.item_name || detail.name || "",
          code: detail.item_code || detail.code || "",
          image: detail.images?.[0]?.image || detail.image || null,
          item_for: detail.item_for || "sale",
          item_price: toNumber(detail.item_price ?? detail.unit_price),
          quantity: toNumber(detail.quantity),
          discount: toNumber(detail.discount),
          in_stock: currentItem ? toNumber(currentItem.in_stock) : toNumber(detail.in_stock || 0),
        };
      });

      setFormData(
        calculateTotals({
          status: DEFAULT_STATUS,
          order_customer_id: order.order_customer_id || order.customer_id || "",
          deliver_id: order.deliver_id || "",
          delivery_fee: toNumber(order.delivery_fee),
          order_tax: toNumber(order.order_tax || 0),
          payment: 0,
          order_payment_status: "credit",
          due_date: "",
          order_payment_method: "cash",
          order_date: today,
          exchange_rate: toNumber(order.exchange_rate),
          reference_no: "",
          sub_total: 0,
          sale_type: order.sale_type || "wholesale",
          created_by: order.created_by || "",
          term: order.term || 0,
          discount_total: 0,
          total_amount: 0,
          balance: 0,
          items: normalizedItems,
          payments: [],
        })
      );
      setPaymentData({
        payment_method: 'cash',
        amount: 0,
        transection_id: '',
        paid_at: today,
        remark: ''
      });
      setShowModal(false);
    } catch (error) {
      console.error("Error fetching order template:", error);
      const err = t("errorFetchingTemplate") || "Failed to fetch template details";
      setAlertError(err);
      notify.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-transparent py-2 transition-colors">
      <AlertBox
        isOpen={showAlert}
        title={isEditMode ? t('confirmUpdate') : t('confirmCreateInvoice')}
        message={isEditMode ? t('confirmUpdateInvoiceMessage') : t('confirmCreateInvoiceMessage')}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowAlert(false)}
        confirmText={isEditMode ? t('update') : t('create')}
        cancelText={t('cancel')}
      />
      <div className="px-2">
        {alertError && (
          <Alert
            message={alertError}
            type="error"
            closable
            onClose={() => setAlertError("")}
            className="mb-6"
          />
        )}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:!text-gray-100">
                {isEditMode ? t("editSaleInvoice") : t("createSaleInvoice")}
              </h1>
              <p className="mt-2 text-gray-600 dark:!text-gray-400">
                {isEditMode ? t("updateSaleInvoiceDetails") : t("addNewSaleInvoiceToSystem")}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              {!orderId && <Button type="button" onClick={() => setShowModal(true)} disabled={loading || orderByIdLoading} variant="success" outline={false}>
                <FaCloudUploadAlt className="text-lg" />

              </Button>}
              <Button type="button" onClick={handleSubmit} disabled={loading || orderByIdLoading} variant="primary" outline={false}>
                <FaSave />
                {isEditMode ? t("update") : t("create")}
              </Button>
              <Button
                type="button"
                variant="danger"
                outline={true}
                onClick={() => window.history.back()}
              >
                <FaTimes />
                {t("back")}
              </Button>
            </div>
          </div>

          {/* {Object.keys(errors).length > 0 && (
            <div className="mb-6">
              <div className="border-red-200 bg-red-50 shadow-sm dark:!border-red-800 dark:!bg-red-900/10">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-red-100 p-2 dark:!bg-red-900/30">
                    <FaExclamationTriangle className="text-red-600 dark:!text-red-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-red-800 dark:!text-red-300">
                      {t("pleaseFixErrors")}
                    </h3>
                    <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:!text-red-400">
                      {Object.values(errors).map((error, index) =>
                        error ? <li key={index}>{error}</li> : null
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )} */}
        </div>

        <form>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="!text-sm">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <FaWarehouse className="text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                      {t("customerInformation")}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="grow">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        <span className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          {t("customer")}
                        </span>
                      </label>
                      <RichSearch
                        data={customers}
                        value={formData.order_customer_id}
                        placeholder={t("selectcustomer")}
                        keyFields={{
                          id: "customer_id",
                          title: "customer_name",
                          image: "image",
                          subtitle: "customer_tel",
                        }}
                        onSelected={handleCustomerSelect}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        <span className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {t("OrderDate")}
                        </span>
                      </label>
                      <DatePicker
                        className="date-picker w-full"
                        size="middle"
                        value={formData.order_date ? dayjs(formData.order_date) : null}
                        onChange={(_, dateString) => handleInputChange("order_date", dateString)}
                      />
                    </div>

                    {/* <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        {t("delivery")}
                      </label>
                      <select
                        name="deliver_id"
                        value={formData.deliver_id}
                        onChange={(event) => handleInputChange("deliver_id", event.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">{t("deliveryService")}</option>
                        {delivers.map((deliver) => (
                          <option key={deliver.deliver_id} value={deliver.deliver_id}>
                            {deliver.deliver_name}
                          </option>
                        ))}
                      </select>
                    </div> */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        {t("status")} <span className="text-red-500">*</span>
                      </label>
                      <RichSearch
                        data={PAYMENT_STATUS}
                        value={formData.order_payment_status}
                        placeholder={t("status")}
                        keyFields={{
                          id: "value",
                          title: "label",
                        }}
                        onSelected={handlePaymentStatusSelect}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        {t("paymentMethod")}
                      </label>
                      <RichSearch
                        data={PAYMENT_METHODS}
                        value={formData.order_payment_method}
                        placeholder={t("paymentMethod")}
                        keyFields={{
                          id: "value",
                          title: "label",
                        }}
                        onSelected={handlePaymentMethodSelect}
                      />
                    </div>
                    {formData.order_payment_status != 'paid' && <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        <span className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {t("term")}
                        </span>
                      </label>
                      <Input
                        type="number"
                        value={formData.term}
                        onChange={(value) => handleInputChange("term", value)}
                      />
                    </div>}
                    {formData.order_payment_status != 'paid' && <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        <span className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {t("dueDate")}
                        </span>
                      </label>
                      <DatePicker
                        readOnly
                        className="date-picker w-full"
                        size="middle"
                        value={formData.term ? dayjs(formData.order_date).add(formData.term, 'day') : null}
                        onChange={(_, dateString) => handleInputChange("due_date", dateString)}
                      />
                    </div>}
                  </div>
                </div>
              </div>

              <div>
                <div>
                  <div className="mb-6 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-blue-500" />
                      <h2 className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                        {t("orderItems")}
                      </h2>
                    </div>

                    <div className="flex flex-1 text-sm items-center gap-2">
                      <RichSearch
                        data={items}
                        placeholder={t("addItem")}
                        keyFields={{
                          id: "id",
                          title: "name",
                          image: "image",
                          subtitle: "code",
                          price: "wholesale_price",
                          quantity: "in_stock",
                        }}
                        onSelected={addItemToOrder}
                        onSearch={setSearchTerm}
                        onScrollReader={onScrollFetch}
                      />
                      <ImportItemInList onSelected={handleImportItems} />
                    </div>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:!border-gray-700 dark:!bg-blue-900/50">
                      <FaBox className="mx-auto mb-4 text-4xl text-gray-400 dark:!text-gray-400" />
                      <p className="mb-4 text-gray-500 dark:!text-gray-400">{t("noItemsAdded")}</p>
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            downloadTemplate(targetFields, "Import Items");
                          }}
                          variant="success"
                        >
                          <FaFileInvoice className="text-white" size={18} />
                          <span>{t("downloadTemplate")}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ItemTable
                      showSelectField={true}
                      selectLable="item_for"
                      selectOptions={ITEM_FOR_OPTIONS}
                      showDiscountField={true}
                      discountLabel="discount"
                      priceLabel="item_price"
                      t={t}
                      data={formData.items}
                      onDelete={removeItem}
                      onQtyChange={handleQtyChange}
                      onCostChange={handleCostChange}
                      onDiscountChange={handleDiscountChange}
                      onSelectChange={handleItemForChange}
                      haedTitle={[
                        { title: t("item"), key: "item" },
                        { title: "Item For", key: "item_for" },
                        { title: t("quantity"), key: "quantity" },
                        { title: t("price"), key: "price" },
                        { title: t("discount"), key: "discount" },
                        { title: t("total"), key: "total" },
                        { title: "", key: "action" },
                      ]}
                    />
                  )}
                  {errors.items && (
                    <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:!bg-red-900/10">
                      {errors.items}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <div>
                <div>
                  <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-800 dark:!text-gray-100">
                    <FaLayerGroup className="text-blue-500" />
                    {t("summary")}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:!text-gray-400">{t("subtotal")}</span>
                      <span className="font-bold text-gray-800 dark:!text-gray-100">
                        ${Number(formData.sub_total).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:!text-gray-400">{t("discount")}</span>
                      <span className="font-bold text-gray-800 dark:!text-gray-100">
                        ${Number(formData.discount_total).toFixed(2)}
                      </span>
                    </div>

                    <div className="grid text-sm grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600 dark:!text-gray-400">
                            <FaPercent className="text-gray-400" />
                            {t("tax")}
                          </span>
                        </div>
                        <RichSearch
                          data={VAT_OPTIONS}
                          value={formData.order_tax}
                          placeholder={t("tax")}
                          keyFields={{
                            id: "value",
                            title: "label",
                          }}
                          onSelected={(value) => handleInputChange("order_tax", value ? Number(value) : 0)}
                        />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600 dark:!text-gray-400">
                            <FaTruck className="text-gray-400" />
                            {t("deliveryFee")}
                          </span>
                        </div>
                        <Input
                          type="number"
                          name="delivery_fee"
                          value={formData.delivery_fee}
                          onChange={(value) => handleInputChange("delivery_fee", value)}
                          placeholder={t("deliveryFee")}
                          className="w-full dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600 dark:!text-gray-400">
                            <FaFileInvoice className="text-gray-400" />
                            {t("invoiceId")}
                          </span>
                        </div>
                        <Input
                          type="text"
                          name="reference_no"
                          value={formData.reference_no}
                          onChange={(value) => handleInputChange("reference_no", value)}
                          placeholder={t("invoiceId")}
                          className="w-full dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                          <span className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {t("createdBy")}
                          </span>
                        </label>
                        <RichSearch
                          data={createUser}
                          value={formData.created_by}
                          placeholder={t("selectCreatedBy")}
                          keyFields={{
                            id: "id",
                            title: "username",
                            image: "image",
                          }}
                          onSelected={handleUserSelect}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                        <FaMoneyBillWave className="text-green-500" />
                        {t('addPayment')}
                      </h3>
                      <div className=" flex flex-wrap gap-3">
                        <div className="grow">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('paymentMethod')} <BsBank />
                          </label>
                          <RichSearch
                            data={PAYMENT_METHODS}
                            placeholder='e.g, cash or bank '
                            keyFields={{
                              id: 'value',
                              title: 'label'
                            }}
                            value={paymentData.payment_method}
                            onSelected={(value) => setPaymentData((pre) => ({ ...pre, payment_method: value }))}
                          />
                        </div>
                        <div className="grow">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('transectionId')} <IoIdCard />
                          </label>
                          <Input
                            type="text"
                            value={paymentData.transection_id}
                            placeholder="e.g, 12345678910"
                            onChange={(value) => setPaymentData((pre) => ({ ...pre, transection_id: value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="grow">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('amount')} <FaDollarSign />
                          </label>
                          <Input
                            type="number"
                            value={paymentData.amount}
                            onChange={(value) => {
                              const val = parseFloat(value) || 0;
                              setPaymentData((pre) => ({ ...pre, amount: val }));
                              updateFormData({ payment: val });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div className="grow">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentDate')}</label>
                          <DatePicker
                            showTime
                            value={paymentData.paid_at ? dayjs(paymentData.paid_at) : null}
                            onChange={(_, dateString) => setPaymentData((pre) => ({ ...pre, paid_at: dateString }))}
                            className="date-picker w-full"
                          />
                        </div>
                        <div className="grow w-full">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('remark')} <GiNotebook />
                          </label>
                          <textarea
                            value={paymentData.remark || ''}
                            placeholder="Remark for payment. . ."
                            onChange={(e) => setPaymentData((pre) => ({ ...pre, remark: e.target.value }))}
                            className="textarea-input w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            rows={2}
                          />
                        </div>
                      </div>
                      {fieldErrors.payment && (
                        <div className="mt-1 text-sm text-red-500">{fieldErrors.payment}</div>
                      )}
                    </div>
                    <Divider className="my-4 dark:!border-gray-700" />

                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-gray-700 dark:!text-gray-200">{t("totalAmount")}</span>
                      <span className="text-blue-600 dark:!text-blue-400">
                        ${Number(formData.total_amount).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:!text-gray-400">{t("totalPaid")}</span>
                      <span className="font-bold text-green-600 dark:!text-green-400">
                        ${Number(formData.payment).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:!text-gray-400">{t("remainingBalance")}</span>
                      <span
                        className={`font-bold ${formData.balance > 0
                            ? "text-orange-600 dark:!text-orange-400"
                            : "text-green-600 dark:!text-green-400"
                          }`}
                      >
                        ${Number(formData.balance).toFixed(2)}
                      </span>
                    </div>

                    <Divider className="my-4 dark:!border-gray-700" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-blue-50 p-3 text-center dark:!bg-blue-900/20">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t("items")}</div>
                        <div className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                          {formData.items.length}
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center dark:!bg-green-900/20">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t("status")}</div>
                        <div className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                          {STATUS_OPTIONS.find((option) => option.value === Number(formData.status))?.label || "-"}
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        width={1000}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:!text-gray-100">
              {t("selectOldInvoiceTemplate")}
            </h3>
          </div>

          {/* Filters Area */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b dark:border-gray-700">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("searchInvoices")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 bg-white py-1.5 pl-10 pr-4 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-md"
                  />
                </div>
              </div>
              <div className="lg:col-span-2">
                <RichSearch
                  data={userFilterOptions}
                  keyFields={{ id: "id", title: "username", image: 'image' }}
                  value={filters.created_by}
                  onSelected={(id) =>
                    setFilters((prev) => ({ ...prev, created_by: id }))
                  }
                  placeholder={t("allUsers")}
                />
              </div>
              <div className="lg:col-span-2">
                <RichSearch
                  data={customerFilterOptions}
                  keyFields={{ id: "customer_id", title: "customer_name", image: 'customer_image' }}
                  value={filters.customer_id}
                  onSelected={(id) =>
                    setFilters((prev) => ({ ...prev, customer_id: id }))
                  }
                  placeholder={t("allCustomers")}
                />
              </div>
              <div className="lg:col-span-2">
                <DatePicker
                  value={filters.start_date ? dayjs(filters.start_date) : null}
                  onChange={(_, dateString) =>
                    setFilters((prev) => ({ ...prev, start_date: dateString || "" }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t("startDate")}
                />
              </div>
              <div className="lg:col-span-2">
                <DatePicker
                  value={filters.end_date ? dayjs(filters.end_date) : null}
                  onChange={(_, dateString) =>
                    setFilters((prev) => ({ ...prev, end_date: dateString || "" }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t("endDate")}
                />
              </div>
            </div>
          </div>

          {/* Selected Invoices Summary */}
          {selectedInvoiceIds.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {selectedInvoiceIds.length}
                </span>
                <span>{t("invoicesSelected")}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedInvoiceIds([])}
                  variant="danger"
                  outline={true}
                >
                  {t("clearAll")}
                </Button>
                <Button
                  onClick={handleImportTemplates}
                  variant="primary"
                >
                  <FaCloudUploadAlt />
                  {t("importItems")}
                </Button>
              </div>
            </div>
          )}

          {/* Table Area with Fixed Header and Scrollable Body */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 w-12">
                    <Checkbox
                      type="checkbox"
                      onChange={toggleSelectAllOnPage}
                      checked={invoices.length > 0 && invoices.every(inv => selectedInvoiceIds.includes(inv.order_id || inv.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("invoiceNo")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("customer")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("date")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("total")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-right">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {queryLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>{t("loading")}...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center italic text-gray-400">
                      {t("noInvoicesFound")}
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const isSelected = selectedInvoiceIds.includes(invoice.order_id || invoice.id);
                    return (
                      <tr
                        key={invoice.order_id || invoice.id}
                        className={`transition-colors group cursor-pointer ${isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        onClick={() => toggleSelectInvoice(invoice.order_id || invoice.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectInvoice(invoice.order_id || invoice.id)}
                            className="rounded !bg-transparent border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {invoice.order_no || invoice.reference_no}
                        </td>
                        <td className="px-4 py-3">{invoice.customer_name}</td>
                        <td className="px-4 py-3">{dayjs(invoice.order_date).format("YYYY-MM-DD")}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                          ${toNumber(invoice.order_total || invoice.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleSelectTemplate(invoice)}
                            variant="primary"
                            outline={true}
                            size="small"
                          >
                            {t("useAsBase")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer / Pagination */}
          <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium">
              <div className="text-gray-600 dark:text-gray-400">
                {t("totalRecords")}: <span className="text-gray-900 dark:text-white">{pagination.total}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  disabled={pagination.current === 1 || queryLoading}
                  onClick={() => setPagination(p => ({ ...p, current: p.current - 1 }))}
                  variant="primary"
                  outline={true}
                >
                  {t("previous")}
                </Button>
                <div className="px-3 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-200">
                  {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize) || 1}
                </div>
                <Button
                  disabled={pagination.current * pagination.pageSize >= pagination.total || queryLoading}
                  onClick={() => setPagination(p => ({ ...p, current: p.current + 1 }))}
                  variant="primary"
                  outline={true}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderInvoiceForm;
