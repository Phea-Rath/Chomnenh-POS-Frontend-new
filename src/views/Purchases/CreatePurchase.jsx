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
  FaLayerGroup,
  FaIdBadge,
  FaIdCard,
  FaFileInvoice,
  FaFileExcel,
  FaStickyNote,
  FaMoneyBillWave,
  FaShip,
  FaCloudUploadAlt,
  FaUser
} from "react-icons/fa";
import axios from "axios";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import api from "../../services/api";
import { useGetAllSupplierQuery } from "../../../app/Features/suppliesSlice";
import { useLocation, useNavigate, useParams } from "react-router";
import { useGetAllPurchaseQuery, useGetAllPurchaseRawQuery } from "../../../app/Features/purchasesSlice";
import { Select, Card, Badge, Tag, Divider, Radio, DatePicker, Alert, Checkbox } from "antd";
const { Option } = Select;
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useDebounce } from "use-debounce";
import { useGetAllRawMaterialQuery } from "../../../app/Features/RawMaterialSlice";
import { useTranslation } from "react-i18next";
import ItemTable from "../../utils/ItemTable";
import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import * as XLSX from 'xlsx';
import { BiImport, BiNote } from "react-icons/bi";
import readFormFile from "../../services/readFormFile";
import ImportItemInList from "../../utils/ImportItemInList";
import { useNotify } from "../../utils/NotificationProvider";
import { IoIdCard } from "react-icons/io5";
import { BsBank } from "react-icons/bs";
import MiniVisaPaymentCard from "../../utils/MiniVisaCard";
import PaymentModel from "../../utils/PaymentModal";
import MiniShippingCard from "../../utils/MiniShippingCard";
import ShippingModal from "../../utils/ShippingModal";
import AlertBox from "../../services/AlertBox";
import { PAYMENT_METHODS, PAYMENT_STATUS, SHIPPING_METHODS, TAX_OPTIONS } from "../../services/paymentService";
import { MdPayment } from "react-icons/md";
import { useGetAllDeliverQuery } from "../../../app/Features/deliversSlice";
import { GiNotebook } from "react-icons/gi";
import Modal from "../../utils/Modal";
import { LuSearch } from "react-icons/lu";

const CreatePurchase = () => {
  const { t } = useTranslation();
  const notify = useNotify();
  const options = [
    { label: t('products'), value: 0, className: 'label-1' },
    { label: t('rawMaterials'), value: 1, className: 'label-2' },
  ];
  const { id: purchaseId } = useParams();
  const isEditMode = !!purchaseId;

  const [formData, setFormData] = useState({
    supplier_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    sub_total: 0,
    tax_rate: 0,
    tax_amount: 0,
    fee: 0,
    exchange_rate: 0,
    quote_no: '',
    due_term: 0,
    total_amount: 0,
    total_paid: 0,
    balance: 0,
    status: 'Pending',
    items: [],
    payments: [],
    description: '',
    shipping_details: {
      fee: 0,
      carrier: '',
      tracking_number: '',
      vai: 'truck'
    },
    payment_status: 'cash',
  });
  const targetFields = ["code", "quantity", "cost"];

  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const { pathname } = useLocation();
  const [items, setItems] = useState([]);
  const [itemType, setValue4] = useState(pathname.includes('purchase-raw') ? 1 : 0);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [filteredRaw, setFilteredRaw] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_method: '',
    amount: 0,
    transection_id: '',
    paid_at: dayjs(new Date()).format('YYYY-MM-DD'),
    remark: ''
  });
  const [shippingData, setShippingData] = useState({
    fee: 0,
    carrier: '',
    tracking_number: '',
    vai: 'truck'
  });
  const [rawMaterials, setRawMaterials] = useState([]);
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [itemFilter, setItemFilter] = useState('all');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [debouncedTemplateSearch] = useDebounce(templateSearch, 500);
  const [templatePagination, setTemplatePagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [templateFilters, setTemplateFilters] = useState({ supplier_id: "", start_date: "", end_date: "" });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);

  const { data: itemData, isFetching: itemLoading } = useGetAllItemsQuery({ token, limit, page: currentPage, search: debouncedSearch, filter: itemFilter, supplier_id: formData.supplier_id }, { skip: itemType != 0 });
  const { data: rawData, isFetching: rawLoading } = useGetAllRawMaterialQuery({ token, limit, page: currentPage, search: debouncedSearch, filter: itemFilter, supplier_id: formData.supplier_id }, { skip: itemType != 1 });
  const { data: supplierData } = useGetAllSupplierQuery(token);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const { refetch: refetchPurchases } = useGetAllPurchaseQuery({ token, limit: 10, page: 1, search: "" }, { skip: !token });
  const { refetch: refetchRawPurchases } = useGetAllPurchaseRawQuery({ token, limit: 10, page: 1, search: "" }, { skip: !token });

  const { data: purchaseTemplates, isFetching: templateLoading, refetch: refetchTemplates } = useGetAllPurchaseQuery({
    token,
    limit: templatePagination.pageSize,
    page: templatePagination.current,
    search: debouncedTemplateSearch,
    ...templateFilters
  }, { skip: itemType != 0 });
  const { data: purchaseRawTemplates, isFetching: templateRawLoading, refetch: refetchRawTemplates } = useGetAllPurchaseRawQuery({
    token,
    limit: templatePagination.pageSize,
    page: templatePagination.current,
    search: debouncedTemplateSearch,
    ...templateFilters
  }, { skip: itemType != 1 });

  const templates = itemType === 0 ? purchaseTemplates?.data || [] : purchaseRawTemplates?.data || [];
  const totalTemplates = itemType === 0 ? purchaseTemplates?.pagination?.total || 0 : purchaseRawTemplates?.pagination?.total || 0;

  useEffect(() => {
    setTemplatePagination(prev => ({ ...prev, total: totalTemplates }));
  }, [totalTemplates]);

  const toggleSelectTemplate = (id) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllTemplatesOnPage = () => {
    const pageIds = templates.map((t) => t.purchase_id || t.id);
    const allSelected = pageIds.every((id) => selectedTemplateIds.includes(id));

    if (allSelected) {
      setSelectedTemplateIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTemplateIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleImportTemplates = async () => {
    if (selectedTemplateIds.length === 0) return;
    setLoading(true);
    try {
      const allItems = [];
      let lastPurchaseData = null;

      for (const id of selectedTemplateIds) {
        const endpoint = itemType === 0 ? `/purchase/${id}` : `/purchase_raw/${id}`;
        const response = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const purchase = response.data.data;
        lastPurchaseData = purchase;

        const items = purchase.details.map((detail) => ({
          item_id: itemType === 0 ? detail.item_id : detail.id,
          quantity: parseFloat(detail.quantity),
          item_cost: parseFloat(detail.item_cost),
          attributes: detail.attributes || [],
          name: itemType === 0 ? detail.item_name : detail.material_name,
          code: itemType === 0 ? detail.item_code : detail.material_code,
          image: itemType === 0 ? (detail.images?.[0]?.image || detail.image) : detail.material_image,
        }));
        allItems.push(...items);
      }

      setFormData((prev) => {
        const nextItems = [...prev.items];

        allItems.forEach((newItem) => {
          const existingIndex = nextItems.findIndex(
            (item) => item.item_id === newItem.item_id
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
          supplier_id: prev.supplier_id || lastPurchaseData?.supplier_id || "",
          items: nextItems,
        };
      });

      setSelectedTemplateIds([]);
      setShowTemplateModal(false);
      notify.success(t('templatesImported') || "Templates imported successfully");
    } catch (error) {
      console.error("Error importing templates:", error);
      notify.error(t('errorImportingTemplates') || "Failed to import templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOneTemplate = async (selected) => {
    setLoading(true);
    try {
      const id = selected.purchase_id || selected.id;
      const endpoint = itemType === 0 ? `/purchase/${id}` : `/purchase_raw/${id}`;
      const response = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const purchase = response.data.data;

      const normalizedItems = purchase.details.map((detail) => ({
        item_id: itemType === 0 ? detail.item_id : detail.raw_material_id,
        quantity: parseFloat(detail.quantity),
        item_cost: parseFloat(detail.item_cost),
        attributes: detail.attributes || [],
        name: itemType === 0 ? detail.item_name : detail.material_name,
        code: itemType === 0 ? detail.item_code : detail.material_code,
        image: itemType === 0 ? (detail.images?.[0]?.image || detail.image) : detail.material_image,
      }));

      setFormData((prev) => ({
        ...prev,
        supplier_id: purchase.supplier_id || "",
        items: normalizedItems,
        tax_rate: parseFloat(purchase.tax_rate) || 0,
        description: purchase.description || "",
        due_term: parseFloat(purchase.due_term) || 0,
      }));

      setShowTemplateModal(false);
      notify.success(t('templateApplied') || "Template applied successfully");
    } catch (error) {
      console.error("Error fetching template:", error);
      notify.error(t('errorFetchingTemplate') || "Failed to fetch template details");
    } finally {
      setLoading(false);
    }
  };

  const [errors, setErrors] = useState({});
  const { data: delivers } = useGetAllDeliverQuery(token);

  const onChangeItemType = ({ target: { value } }) => {
    setValue4(value);
  };

  useEffect(() => {
    if (!formData.supplier_id && itemFilter === 'supplier') {
      setItemFilter('all');
    }
  }, [formData.supplier_id]);

  useEffect(() => {
    setSuppliers(supplierData?.data || []);
    setItems(itemData?.data || []);
    setRawMaterials(rawData?.data || []);
  }, [itemData, supplierData, rawData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, itemType]);

  useEffect(() => {
    const filtered = items.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    setFilteredItems(filtered);
    const filteredRaw = rawMaterials.filter(
      (item) =>
        item.material_name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        item.material_code?.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    setFilteredRaw(filteredRaw);
  }, [searchTerm, items, rawMaterials]);

  useEffect(() => {
    if (isEditMode && purchaseId && token && !pathname.includes('purchase-raw')) {
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
            description: purchase.description || '',
            due_term: parseFloat(purchase.due_term) || 0,
            tax_rate: parseFloat(purchase.tax_rate) || 0,
            tax_amount: parseFloat(purchase.tax_amount) || 0,
            fee: parseFloat(purchase?.shippings?.fee) || 0,
            total_amount: parseFloat(purchase.total_amount) || 0,
            total_paid: parseFloat(purchase.total_paid) || 0,
            balance: parseFloat(purchase.balance) || 0,
            exchange_rate: parseFloat(purchase.exchange_rate) || 0,
            quote_no: purchase.quote_no || '',
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
            payment_status: purchase?.payment_status || 'cash'
          });

          setShippingData({
            fee: parseFloat(purchase?.shippings?.fee) || 0,
            tracking_number: purchase?.shippings?.tracking_number || '',
            carrier: purchase?.shippings?.carrier || '',
            vai: purchase?.shippings?.vai || 'truck'
          });

          setPaymentData(purchase.payments[purchase.payments?.length - 1] || {});

          setLoading(false);
        } catch (err) {
          notify.error(t('failedToLoadPurchaseData'));
          console.error(err);
        }
      };

      fetchPurchase();
    } else if (pathname.includes('purchase-raw') && isEditMode && purchaseId && token) {
      const fetchPurchase = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/purchase_raw/${purchaseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const purchase = response.data.data;

          setFormData({
            supplier_id: purchase.supplier_id || "",
            purchase_date: purchase.purchase_date,
            sub_total: parseFloat(purchase.sub_total) || 0,
            description: purchase.description || '',
            due_term: parseFloat(purchase.due_term) || 0,
            tax_rate: parseFloat(purchase.tax_rate) || 0,
            tax_amount: parseFloat(purchase.tax_amount) || 0,
            fee: parseFloat(purchase?.shippings?.fee) || 0,
            total_amount: parseFloat(purchase.total_amount) || 0,
            total_paid: parseFloat(purchase.total_paid) || 0,
            balance: parseFloat(purchase.balance) || 0,
            exchange_rate: parseFloat(purchase.exchange_rate) || 0,
            quote_no: purchase.quote_no || '',
            status: purchase.status === 1 ? 'Completed' : purchase.status === 2 ? 'Cancelled' : 'Pending',
            items: purchase?.details.map((detail) => ({
              item_id: detail.raw_material_id,
              quantity: parseFloat(detail.quantity),
              item_cost: parseFloat(detail.item_cost),
              attributes: detail.attributes || [],
              name: detail.material_name,
              code: detail.material_code,
              image: detail.material_image || null,
            })),
            // payments: purchase.payments,
            // shipping_details: {
            //   fee: parseFloat(purchase?.shippings?.fee) || 0,
            //   tracking_number: purchase?.shippings?.tracking_number || '',
            //   carrier: purchase?.shippings?.carrier || '',
            //   shipping_date: purchase?.shippings?.date || null,
            //   due_term: purchase?.shippings?.term || null,
            //   remark: purchase?.shippings?.remark || '',
            //   vai: purchase?.shippings?.vai || 'truck'
            // },
            payment_status: purchase.payment_status || 'cash'
          });


          setShippingData({
            fee: parseFloat(purchase?.shippings?.fee) || 0,
            tracking_number: purchase?.shippings?.tracking_number || '',
            carrier: purchase?.shippings?.carrier || '',
            vai: purchase?.shippings?.vai || 'truck'
          });

          setPaymentData(purchase.payments[purchase.payments?.length - 1] || {});
          setLoading(false);
        } catch (err) {
          notify.error(t('failedToLoadPurchaseData'));
          console.error(err);
        }
      };

      fetchPurchase();
    }
  }, [isEditMode, purchaseId, token, t]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.fee, formData.total_paid]);

  const validateField = (name, value) => {
    const newFieldErrors = { ...fieldErrors };

    switch (name) {
      case 'supplier_id':
        if (!value) {
          newFieldErrors.supplier_id = t('required');
        } else {
          delete newFieldErrors.supplier_id;
        }
        break;
      case 'purchase_date':
        if (!value) {
          newFieldErrors.purchase_date = t('required');
        } else {
          delete newFieldErrors.purchase_date;
        }
        break;
      case 'tax_rate':
        if (value && (isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 100)) {
          newFieldErrors.tax_rate = t('taxRateLimit');
        } else {
          delete newFieldErrors.tax_rate;
        }
        break;
      case 'fee':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newFieldErrors.fee = t('shippingFeeNonNegative');
        } else {
          delete newFieldErrors.fee;
        }
        break;
      case 'quote_no':
        if (value && value.length > 50) {
          newFieldErrors.quote_no = t('max50Characters');
        } else {
          delete newFieldErrors.quote_no;
        }
        break;
      case 'due_term':
        if (value && (isNaN(value) || !Number.isInteger(parseFloat(value)) || parseFloat(value) < 0)) {
          newFieldErrors.due_term = t('invalidDueTerm');
        } else {
          delete newFieldErrors.due_term;
        }
        break;
      default:
        break;
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    const newFieldErrors = {};

    // Supplier
    if (!formData.supplier_id) {
      newErrors.supplier = t('selectSupplier');
      newFieldErrors.supplier_id = t('required');
    }

    // Purchase Date
    if (!formData.purchase_date) {
      newErrors.purchase_date = t('required');
      newFieldErrors.purchase_date = t('required');
    } else if (new Date(formData.purchase_date) > new Date()) {
      newErrors.purchase_date = t('purchaseDateCannotBeInFuture');
      newFieldErrors.purchase_date = t('purchaseDateCannotBeInFuture');
    }

    // Items
    if (formData.items.length === 0) {
      newErrors.items = t('noItemsAdded');
    } else {
      formData.items.forEach((item, index) => {
        if (!item.item_id) {
          newErrors.items = `${t('item')} ${index + 1}: ${t('required')}`;
        }
        if (item.quantity <= 0) {
          newErrors.items = `${t('item')} ${index + 1}: ${t('invalidQuantity')}`;
        }
        if (item.item_cost < 0) {
          newErrors.items = `${t('item')} ${index + 1}: ${t('invalidUnitPrice')}`;
        } else {
          const costStr = String(item.item_cost);
          if (!/^\d{1,8}(\.\d{1,2})?$/.test(costStr)) {
            newErrors.items = `${t('item')} ${index + 1}: ${t('invalidCostFormat')}`;
          }
        }
      });
    }

    // Financials
    if (formData.total_amount <= 0 && formData.items.length > 0) {
      newErrors.financial = t('financialError');
    }

    // Payments
    if (paymentData?.amount > 0) {
      if (paymentData.amount < 0) {
        newErrors.payments = t('invalidPaymentAmount');
      }
      if (!paymentData.paid_at) {
        newErrors.payments = t('selectPaymentDate');
      }
    }

    // Shipping
    if (shippingData?.fee < 0) {
      newFieldErrors.fee = t('shippingFeeNonNegative');
      newErrors.shipping = t('shippingFeeNonNegative');
    }
    if (shippingData?.vai && !['truck', 'air', 'sea'].includes(shippingData.vai)) {
      newErrors.shipping = t('invalidShippingMethod');
    }

    // Quote No
    if (formData.quote_no && formData.quote_no.length > 50) {
      newFieldErrors.quote_no = t('max50Characters');
      newErrors.quote_no = t('max50Characters');
    }

    // Due Term
    if (formData.due_term && (isNaN(formData.due_term) || !Number.isInteger(parseFloat(formData.due_term)) || formData.due_term < 0)) {
      newFieldErrors.due_term = t('invalidDueTerm');
      newErrors.due_term = t('invalidDueTerm');
    }

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const addItemToPurchase = (id) => {

    let item = null;
    if (itemType == 0) {
      item = items.find((item) => item.id == id);
    } else {
      item = rawMaterials.find((item) => item.id == id);
    }
    if (!item) {
      setErrors({ itemModal: t('selectItem') });
      return;
    }

    const existItem = formData?.items?.some((i) => i.item_id == id);
    if (existItem) {
      setFormData((prev) => {
        const items = prev.items.map((i) =>
          i.item_id === id
            ? {
              ...i,
              quantity: i.quantity + 1,
            }
            : i
        );

        return {
          ...prev,
          items,
        };
      });
    } else {
      const newItem = {
        item_id: id,
        quantity: 1,
        item_cost: 0,
        attributes,
        name: itemType == 0 ? item.name : item.material_name,
        code: itemType == 0 ? item.code : item.material_code,
        image: itemType == 0 ? item.image : item.material_image,
      };

      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
    }



    setSelectedItem(null);
    setQuantity(1);
    setItemCost(0);
    setSearchTerm("");
    setShowItemModal(false);
    setErrors({});
  };

  const removeItem = (index) => {
    event.preventDefault();
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      payments: [],
      balance: formData.total_amount,
      total_paid: 0
    }));
  };

  const handleQtyChange = (index, newQty) => {
    if (newQty <= 0) {
      setErrors({ items: t('invalidQuantity') });
      return;
    }

    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index].quantity = newQty;
      updatedItems[index].total_amount = newQty * updatedItems[index].item_cost;
      const total = updatedItems.reduce((sum, item) => sum + item.total_amount, 0);
      return {
        ...prev,
        items: updatedItems,
        total_amount: total,
        balance: total - prev.total_paid,
      };
    });
  };

  const handleCostChange = (index, newCost) => {
    if (newCost <= 0) {
      setErrors({ items: t('invalidCost') });
      return;
    }

    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index].item_cost = newCost;
      updatedItems[index].total_amount = newCost * updatedItems[index].quantity;
      const total = updatedItems.reduce((sum, item) => sum + item.total_amount, 0);
      return {
        ...prev,
        items: updatedItems,
        total_amount: total,
        balance: total - prev.total_paid,
      };
    });
  };

  const onAddPayment = async (value) => {
    setPaymentAmount(value)
    setFormData((prev) => ({
      ...prev,
      total_paid: prev.total_paid + value,
      balance: prev.total_amount - (prev.total_paid + value),
    }));
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
    const totalAmount = subTotal + taxAmount + parseFloat(formData.fee || 0);
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
    } else if (name === "fee") {
      const val = parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: val,
        shipping_details: { ...prev.shipping_details, fee: val }
      }));
    } else if (name === "tax_rate") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "payment_status") {
      const dueTerm = value == 'paid' ? 0 : formData.due_term;
      setFormData((prev) => ({ ...prev, [name]: value, due_term: dueTerm }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const downloadTemplate = (targetFields, title) => {
    const normalizedFields = Array.isArray(targetFields?.[0])
      ? targetFields[0]
      : targetFields;

    const headerRow = Array.isArray(normalizedFields) ? normalizedFields : [];
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}_Template.xlsx`);
  };

  const handleImportItems = async (event) => {
    event.preventDefault();
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedRows = await readFormFile(file, targetFields);
      const res = await api.post(`/import-items-by-code/${itemType ? 'material' : 'items'}`, { data: importedRows, }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });
      if (res.status === 200) {
        const sourceItems = res.data.data;
        const importedItems = sourceItems
          .map((row) => {
            // const rowCode = String(row.code || "").trim().toLowerCase();
            // const matchedItem = sourceItems.find((sourceItem) => {
            //   const sourceCode = String(itemType === 1 ? sourceItem.material_code : sourceItem.code || "").trim().toLowerCase();
            //   return (rowCode && sourceCode === rowCode);
            // });

            const quantity = Number(row.quantity);
            // console.log(Number(row.quantity));

            const itemCost = Number(row.cost ?? row.price) || 0;

            return {
              item_id: row.id,
              quantity,
              item_cost: itemCost,
              total_amount: quantity * itemCost,
              attributes: [],
              name: itemType === 1 ? row.material_name : row.name,
              code: itemType === 1 ? row.material_code : row.code,
              image: itemType === 1 ? row.material_image : row.image,
            };
          })
          .filter(Boolean);

        if (importedItems.length === 0) {
          notify.error(t('noMatchingItemsFound'));
          setErrors(prev => ({ ...prev, items: t('codesNotFound', { codes: res.data.missing_codes }) }));
          return;
        }

        setFormData((prev) => {
          const mergedItems = [...prev.items];

          importedItems.forEach((importedItem) => {
            const existingIndex = mergedItems.findIndex(
              (item) => Number(item.item_id) === Number(importedItem.item_id)
            );

            if (existingIndex >= 0) {
              mergedItems[existingIndex] = {
                ...mergedItems[existingIndex],
                quantity: Number(mergedItems[existingIndex].quantity || 0) + importedItem.quantity,
                item_cost: importedItem.item_cost || mergedItems[existingIndex].item_cost,
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
          setErrors(prev => ({ ...prev, items: t('codesNotFound', { codes: res.data.missing_codes }) }));
          notify.warning(t('codesNotFound', { codes: res.data.missing_codes }));
        }

        notify.success(t('importedSuccess', { count: importedItems.length }));
      }
    } catch (error) {
      console.error(error);
      notify.error(t('failedToImportFile'));
      setErrors(prev => ({ ...prev, file: t('failedToImportFile') }));
    } finally {
      event.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentData?.amount < 0) {
      setErrors({ paymentModal: t('invalidPaymentAmount') });
      return;
    }

    if (paymentData?.amount > 0 && !paymentData?.paid_at) {
      setErrors({ paymentModal: t('selectPaymentDate') });
      return;
    }

    // console.log(paymentData?.amount, formData?.balance);
    
    // if (Number(Number(paymentData?.amount)?.toFixed(0)) > Number(formData?.balance.toFixed(0))) {
    //   setErrors({ paymentModal: t('paymentExceedBalance') });
    //   return;
    // }
    if (!validateForm()) {
      notify.error(t('pleaseFixErrors'));
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

    setShowAlert(true);
  };

  const handleConfirmSubmit = async () => {
    setShowAlert(false);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        created_by: 1,
        purchase_date: formData.purchase_date,
        sub_total: parseFloat(formData.sub_total),
        due_term: parseFloat(formData.due_term),
        description: formData.description,
        tax_rate: parseFloat(formData.tax_rate) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        fee: parseFloat(formData.fee) || 0,
        total_amount: parseFloat(formData.total_amount),
        total_paid: parseFloat(formData.total_paid) || 0,
        purchase_type: itemType,
        balance: parseFloat(formData.balance) || 0,
        // exchange_rate: parseFloat(formData.exchange_rate) || 0,
        quote_no: formData.quote_no || '',
        status: formData.status === 'Completed' ? 1 : formData.status === 'Cancelled' ? 2 : 0,
        items: formData.items.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          attributes: item.attributes,
          item_cost: parseFloat(item.item_cost),
        })),
        payments: [paymentData],
        shippings: [shippingData],
        payment_status: formData?.payment_status || 'cash'
      };


      if (isEditMode) {
        if (itemType != 0) {
          await api.put(`/purchase_raw/${purchaseId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetchRawTemplates();
        } else {
          await api.put(`/purchase/${purchaseId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetchTemplates();
        }

        notify.success(t('updatePurchaseSuccess'));
      } else {
        if (itemType != 0) {
          await api.post("/purchase_raw", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          refetchRawTemplates();
        } else {
          await api.post("/purchase", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetchTemplates();
        }

        notify.success(t('createPurchaseSuccess'));
      }
      navigator(-1);
    } catch (err) {
      console.log(err);
      
      const errorMessage = err?.response?.data?.message || t('errorProcessingPurchase');
      setErrors({ general: errorMessage });
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onScrollFetch = (e) => {
    const target = e.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    const total = itemType == 0 ? itemData?.pagination?.total : rawData?.pagination?.total;
    const currentLength = itemType == 0 ? items?.length : rawMaterials?.length;
    if (nearBottom && total > currentLength) {
      if (itemType == 0 && !itemLoading) {
        setLimit(prev => prev + 10);
      }
      if (itemType == 1 && !rawLoading) {
        setLimit(prev => prev + 10);
      }
    }
  };

  const convertSupplier = (supplier) => {
    if (!supplier) return [];

    return supplier.map((item) => ({
      id: item.supplier_id,
      title: item.supplier_name,
      subtitle: item.phone_number,
      image: item.image,
    }));
  };

  return (
    <div className="view-page bg-transparent py-8 transition-colors">
      <AlertBox
        isOpen={showAlert}
        title={isEditMode ? t('confirmUpdate') : t('confirmCreatePurchase')}
        message={isEditMode ? t('confirmUpdatePurchaseMessage') : t('confirmCreatePurchaseMessage')}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowAlert(false)}
        confirmText={isEditMode ? t('update') : t('create')}
        cancelText={t('cancel')}
      />
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:!text-gray-100">
                {isEditMode ? t('editPurchaseOrder') : t('createNewPurchase')}
              </h1>
              <p className="text-gray-600 dark:!text-gray-400 mt-2">
                {isEditMode ? t('updatePurchaseOrderDetails') : t('addNewPurchaseToSystem')}
              </p>
            </div>
            <div className=" mt-6 flex justify-center items-center gap-2">
              {!purchaseId && (
                <Button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={loading}
                  variant='success'
                  outline={false}
                >
                  <FaCloudUploadAlt className="text-lg" />
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                variant='primary'
                outline={false}
              >
                <FaSave />{loading ? t('processing') : isEditMode ? t('update') : t('create')}
              </Button>
              <Button
                type="button"
                variant='danger'
                outline={true}
                onClick={() => navigator(-1)}
              >
                <FaTimes />{t('back')}
              </Button>
            </div>
          </div>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert
                message={t('pleaseFixErrors')}
                description={
                  <ul className="list-disc list-inside">
                    {Object.values(errors).map((error, index) => (
                      error && <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
              />
            </motion.div>
          )}
        </div>

        <form>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form Sections */}
            <div className="lg:col-span-2 space-y-6">
              {/* Supplier & Date Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="">
                  {/* <div className="flex items-center gap-2 mb-4">
                    <FaWarehouse className="text-blue-500" />
                    <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('supplierInformation')}</h2>
                  </div> */}

                  <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <FaTag className="text-gray-400" />
                          {t('supplier')} <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <RichSearch
                        data={suppliers}
                        value={formData.supplier_id}
                        placeholder={t('selectSupplier')}
                        keyFields={{
                          id: 'supplier_id',
                          title: 'supplier_name',
                          image: 'image',
                          subtitle: 'supplier_tel',
                        }}
                        onScrollReader={onScrollFetch}
                        onSelected={(value) => handleInputChange('supplier_id', value)}
                      />

                      {fieldErrors.supplier_id && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.supplier_id}</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                        <span className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {t('purchaseDate')} <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <DatePicker showTime value={formData.purchase_date ? dayjs(formData.purchase_date) : ''} className="date-picker" size="large" onChange={(date, dateString) => handleInputChange('purchase_date', dateString)} />
                      {fieldErrors.purchase_date && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.purchase_date}</div>
                      )}
                    </div>
                    <div className=" grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                          <FaPercent className="text-gray-400" />
                          {t('tax')}
                        </span>
                      </div>
                      <Radio.Group
                        className="dark:[&_.ant-radio-wrapper]:text-white"
                        name="radiogroup"
                        value={formData?.tax_rate}
                        options={TAX_OPTIONS}
                        onChange={(e) => handleInputChange('tax_rate', e.target.value)}
                      />
                      {fieldErrors.tax_rate && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.tax_rate}</div>
                      )}
                    </div>
                    <div className=" grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                          <FaMoneyBillWave className="text-gray-400" />
                          {t('paymentStatus')}
                        </span>
                      </div>
                      <RichSearch
                        data={PAYMENT_STATUS}
                        keyFields={{
                          id: 'value',
                          title: 'label',
                        }}
                        placeholder={t('paymentStatus')}
                        onSelected={(value) => handleInputChange('payment_status', value)}
                        value={formData.payment_status}
                      />
                      {fieldErrors.payment_status && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.payment_status}</div>
                      )}
                    </div>
                    <div className=" grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                          <FaFileInvoice className="text-gray-400" />
                          {t('quoteNo')}
                        </span>
                      </div>
                      <Input
                        type="text"
                        name="quote_no"
                        value={formData.quote_no}
                        onChange={(value) => handleInputChange('quote_no', value)}
                        placeholder={t('quoteNo')}
                        className={`w-full ${fieldErrors.quote_no ? 'border-red-500' : ''} dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}
                      />
                    </div>

                    {formData?.payment_status != "paid" && <div className="grid grid-cols-2">
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {t('dueTerm')} ({t('days')})
                          </span>
                        </div>
                        <Input
                          type="number"
                          name="due_term"
                          value={formData.due_term}
                          onChange={(value) => handleInputChange('due_term', value)}
                          placeholder={t('shipTerm')}
                          className={`w-full dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}
                          min="0"
                        />
                      </div>
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {t('dueDate')}
                          </span>
                        </div>
                        <DatePicker value={formData.purchase_date ? dayjs(formData.purchase_date).add(formData.due_term || 0, 'day') : ''} className="date-picker" size="large" />
                      </div>
                    </div>}
                  </div>
                </div>
              </motion.div>

              {/* Items Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center flex-col gap-2 mr-2">
                      <div className="flex items-center gap-2">
                        <FaBox className="text-blue-500" />
                        <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('purchaseItems')}</h2>
                      </div>
                      <Checkbox
                        className="dark:!text-white"
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setItemFilter('all')
                          } else {
                            setItemFilter('supplier')
                          }
                        }}
                      >Only Supplier</Checkbox>
                    </div>

                    <div className="flex items-center grow gap-2">

                      <RichSearch
                        data={itemType == 1 ? rawMaterials : items}
                        placeholder={t('addItem')}
                        keyFields={{
                          id: 'id',
                          title: itemType == 1 ? 'material_name' : 'name',
                          image: itemType == 1 ? 'material_image' : 'image',
                          subtitle: itemType == 1 ? 'material_code' : 'code',
                        }}
                        onSelected={(value) => addItemToPurchase(value)}
                        onSearch={(value) => setSearchTerm(value)}
                        onScrollReader={onScrollFetch}
                      />
                      <ImportItemInList
                        onSelected={handleImportItems}
                      />
                    </div>

                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:!bg-blue-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:!border-gray-700">
                      <FaBox className="text-gray-400 dark:!text-gray-400 text-4xl mx-auto mb-4" />
                      <p className="text-gray-500 dark:!text-gray-400 mb-4">{t('noItemsAdded')}</p>
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            downloadTemplate(targetFields, itemType == 1 ? "Import Raw Materials" : "Import Items");
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <FaFileExcel className="text-white" size={18} />
                          <span>{t('downloadTemplate')}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ItemTable
                      priceLabel='item_cost'
                      t={t}
                      data={formData.items}
                      onDelete={removeItem}
                      onQtyChange={handleQtyChange}
                      onCostChange={handleCostChange}
                      haedTitle={[{ title: t('item'), key: 'item' }, { title: t('quantity'), key: 'quantity' }, { title: t('price'), key: 'price' }, { title: t('total'), key: 'total' }, { title: '', key: 'action' }]}
                    />
                  )}
                  {errors.items && (
                    <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 dark:!bg-red-900/10 rounded-lg">
                      {errors.items}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Payments Section */}
              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="text-green-500" />
                      <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('payment')}</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-6 flex gap-3 flex-wrap">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                        {t('paymentAmount')}
                      </label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(value) => {
                          setPaymentAmount(parseFloat(value) || 0);
                          setFormData(prev => ({
                            ...prev,
                            total_paid: parseFloat(value) || 0
                          }))
                        }}
                        size="large"
                        min="0"
                        max={formData.balance}
                        step="1"
                        placeholder={t('enterAmount')}
                        prefix={<FaDollarSign className="text-gray-400" />}
                        className="dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600"
                      />
                      <div className="text-sm text-gray-500 dark:!text-gray-400 mt-2">
                        {t('remainingBalance')}: <span className="font-bold dark:!text-gray-200">${formData.balance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                        {t('paymentDate')}
                      </label>
                      <DatePicker
                        value={paymentDate ? dayjs(paymentDate) : null}
                        onChange={(date, dateString) => setPaymentDate(dateString)}
                        className="date-picker"
                        size="large"
                        format="YYYY-MM-DD"
                      />
                    </div>
                  </div>   
                  {errors.payments && (
                    <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 dark:!bg-red-900/10 rounded-lg">
                      {errors.payments}
                    </div>
                  )}
                </div>
              </motion.div> */}
              {/* <div className="flex gap-4 items-end">
                <MiniVisaPaymentCard onClick={()=>setShowPaymentModal(true)} payment={formData?.payments[formData?.payments?.length - 1]}/>
                <MiniShippingCard onClick={() => setShowShippingModal(true)} shipping={formData.shipping_details} />
              </div> */}

            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="">

                  <div>

                    <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                      <FaTruck className="text-blue-500" />
                      {t('shippingDetails')}
                    </h3>
                    <div>

                      <div className="flex flex-wrap gap-3 mb-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingMethod')} <FaBox />
                          </label>
                          <RichSearch
                            data={delivers?.data}
                            placeholder='e.g, DHL, FedEx'
                            keyFields={{
                              id: 'deliver_name',
                              title: 'deliver_name'
                            }}
                            value={shippingData.carrier}
                            onSelected={(value) => setShippingData((pre) => ({ ...pre, carrier: value }))}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingVia')}
                          </label>
                          <div className="flex gap-4">
                            <Radio.Group
                              name="vaiGroup"
                              defaultValue={1}
                              value={shippingData?.vai}
                              onChange={(e) => setShippingData((pre) => ({ ...pre, vai: e.target.value }))}
                              options={[
                                { value: 'truck', label: t('truck') },
                                { value: 'air', label: t('air') },
                                { value: 'sea', label: t('sea') },
                              ]}
                            />
                            {/* {['truck', 'air', 'sea'].map((v) => (
                              <label key={v} className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                <input
                                  type="radio"
                                  name="vai"
                                  value={v}
                                  checked={shippingData.vai == v}
                                  onChange={(e) => setShippingData((pre) => ({ ...pre, vai: e.target.value }))}
                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="capitalize">{t(v)}</span>
                              </label>
                            ))} */}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('trackingNumber')} <IoIdCard />
                          </label>
                          <Input
                            type="text"
                            value={shippingData.tracking_number}
                            placeholder="e.g, TRK123456789"
                            onChange={(value) => setShippingData((pre) => ({ ...pre, tracking_number: value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingFee')} <FaDollarSign />
                          </label>
                          <Input
                            type="number"
                            value={shippingData.fee}
                            onChange={(value) => {
                              const val = parseFloat(value) || 0;
                              setShippingData((pre) => ({ ...pre, fee: val }));
                              setFormData(prev => ({ ...prev, fee: val }));
                            }}
                            className={`w-full px-3 py-2 border ${fieldErrors.fee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100`}
                            step="0.01"
                            min="0"
                          />
                          {fieldErrors.fee && (
                            <div className="text-red-500 text-sm mt-1">{fieldErrors.fee}</div>
                          )}
                        </div>
                      </div>
                      <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                        <FaMoneyBillWave className="text-green-500" />
                        {t('addPayment')}
                      </h3>
                      {errors.payments && (
                        <div className="text-red-500 text-sm mb-4 p-3 bg-red-50 dark:!bg-red-900/10 rounded-lg">
                          {errors.payments}
                        </div>
                      )}
                      <div className=" flex flex-wrap gap-3">
                        <div>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('transectionId')} <IoIdCard />
                          </label>
                          <Input
                            type="text"
                            value={paymentData.transection_id}
                            placeholder="e.g, 12345678910"
                            onChange={(value) => setPaymentData((pre) => ({ ...pre, transection_id: value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('amount')} <FaDollarSign />
                          </label>
                          <Input
                            type="number"
                            value={paymentData.amount}
                            onChange={(value) => {
                              const val = parseFloat(value) || 0;
                              const totalVal = parseFloat(value + (formData.total_paid - paymentData.amount)) || 0;
                              setPaymentData((pre) => ({ ...pre, amount: val }));
                              setFormData(prev => ({ ...prev, total_paid: totalVal }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentDate')}</label>

                          <DatePicker
                            showTime
                            value={paymentData.paid_at ? dayjs(paymentData.paid_at) : ''}
                            onChange={(date, dateString) => setPaymentData((pre) => ({ ...pre, paid_at: dateString }))}
                            className="date-picker"
                          />
                        </div>
                        <div className="grow">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('remark')} <GiNotebook />
                          </label>
                          <textarea
                            type='textarea'
                            value={paymentData.remark || ''}
                            placeholder="Remark for payment. . ."
                            onChange={(e) => setPaymentData((pre) => ({ ...pre, remark: e.target.value }))}
                            className="textarea-input"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          {t('description')} <GiNotebook />
                        </label>
                        <textarea
                          value={formData.description || ''}
                          placeholder="Description for purchase..."
                          onChange={(e) => setFormData((pre) => ({ ...pre, description: e.target.value }))}
                          className="textarea-input w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                          rows={3}
                        />
                      </div>
                    </div>

                    <Divider className=" dark:!border-gray-700" />
                    <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100 flex items-center gap-2">
                      <FaLayerGroup className="text-blue-500" />
                      {t('purchaseSummary')}
                    </h2>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:!text-gray-400">{t('subtotal')}</span>
                      <span className="font-bold text-gray-800 dark:!text-gray-100">${formData.sub_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-700 dark:!text-gray-200">{t('totalAmount')}</span>
                      <span className="text-blue-600 dark:!text-blue-400">${Number(formData.total_amount).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:!text-gray-400">{t('totalPaid')}</span>
                      <span className="font-bold text-green-600 dark:!text-green-400">${formData.total_paid.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:!text-gray-400">{t('remainingBalance')}</span>
                      <span className={`font-bold ${formData.balance > 0 ? 'text-orange-600 dark:!text-orange-400' : 'text-green-600 dark:!text-green-400'}`}>
                        ${formData.balance.toFixed(2)}
                      </span>
                    </div>

                    <Divider className="my-4 dark:!border-gray-700" />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:!bg-blue-900/20 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t('items')}</div>
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">{formData.items.length}</div>
                      </div>
                      {/* <div className="bg-green-50 dark:!bg-green-900/20 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t('payment')}s</div>
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">{formData.payments.length}</div>
                      </div> */}
                    </div>


                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        width={1000}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:!text-gray-100">
              {t("selectOldPurchaseTemplate")}
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
                    placeholder={t("searchPurchases")}
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full border border-gray-300 bg-white py-1.5 pl-10 pr-4 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-md"
                  />
                </div>
              </div>
              <div className="lg:col-span-4">
                <RichSearch
                  data={[{ supplier_id: "", supplier_name: t("allSuppliers") }, ...suppliers]}
                  keyFields={{ id: "supplier_id", title: "supplier_name", image: 'image' }}
                  value={templateFilters?.supplier_id}
                  onSelected={(id) =>
                    setTemplateFilters((prev) => ({ ...prev, supplier_id: id }))
                  }
                  placeholder={t("allSuppliers")}
                />
              </div>
              <div className="lg:col-span-2">
                <DatePicker
                  value={templateFilters?.start_date ? dayjs(templateFilters.start_date) : null}
                  onChange={(_, dateString) =>
                    setTemplateFilters((prev) => ({ ...prev, start_date: dateString || "" }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t("startDate")}
                />
              </div>
              <div className="lg:col-span-2">
                <DatePicker
                  value={templateFilters?.end_date ? dayjs(templateFilters.end_date) : null}
                  onChange={(_, dateString) =>
                    setTemplateFilters((prev) => ({ ...prev, end_date: dateString || "" }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t("endDate")}
                />
              </div>
            </div>
          </div>

          {/* Selected Templates Summary */}
          {selectedTemplateIds.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {selectedTemplateIds.length}
                </span>
                <span>{t("templatesSelected")}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedTemplateIds([])}
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

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 w-12">
                    <Checkbox
                      type="checkbox"
                      onChange={toggleSelectAllTemplatesOnPage}
                      checked={templates.length > 0 && templates.every(t => selectedTemplateIds.includes(t.purchase_id || t.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("purchaseNo")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("supplier")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("date")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t("total")}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-right">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {templateLoading || templateRawLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>{t("loading")}...</span>
                      </div>
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center italic text-gray-400">
                      {t("noTemplatesFound")}
                    </td>
                  </tr>
                ) : (
                  templates.map((template) => {
                    const id = template.purchase_id || template.id;
                    const isSelected = selectedTemplateIds.includes(id);
                    return (
                      <tr
                        key={id}
                        className={`transition-colors group cursor-pointer ${isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        onClick={() => toggleSelectTemplate(id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTemplate(id)}
                            className="rounded !bg-transparent border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {template.purchase_no || template.id}
                        </td>
                        <td className="px-4 py-3">{template.supplier_name}</td>
                        <td className="px-4 py-3">{dayjs(template.purchase_date).format("YYYY-MM-DD")}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-200">
                          ${parseFloat(template.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleSelectOneTemplate(template)}
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
                {t("totalRecords")}: <span className="text-gray-900 dark:text-white">{templatePagination.total}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  disabled={templatePagination.current === 1 || templateLoading || templateRawLoading}
                  onClick={() => setTemplatePagination(p => ({ ...p, current: p.current - 1 }))}
                  variant="primary"
                  outline={true}
                >
                  {t("previous")}
                </Button>
                <div className="px-3 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-200">
                  {templatePagination.current} / {Math.ceil(templatePagination.total / templatePagination.pageSize) || 1}
                </div>
                <Button
                  disabled={templatePagination.current * templatePagination.pageSize >= templatePagination.total || templateLoading || templateRawLoading}
                  onClick={() => setTemplatePagination(p => ({ ...p, current: p.current + 1 }))}
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

export default CreatePurchase;
