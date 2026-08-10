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
import { useGetAllItemsQuery } from "@/features/products/itemsSlice";
import api from "../../services/api";
import { useGetAllSupplierQuery } from "@/features/purchases/suppliesSlice";
import { useLocation, useNavigate, useParams } from "react-router";
import { useGetAllPurchaseQuery, useGetAllPurchaseRawQuery, useCreatePurchaseMutation, useUpdatePurchaseMutation } from "@/features/purchases/purchasesSlice";
import { Select, Card, Badge, Tag, Divider, Radio, DatePicker, Alert, Checkbox } from "antd";
const { Option } = Select;
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useDebounce } from "use-debounce";
import { useGetAllRawMaterialQuery } from "@/features/stocks/RawMaterialSlice";
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
import { useGetAllDeliverQuery } from "@/features/sales/deliversSlice";
import { GiNotebook } from "react-icons/gi";

import OldTemplateModal from "../../utils/OldTemplateModal";
import { getToken } from '@/utils/tokenStore';

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
    discount_total: 0,
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
      via: 'truck'
    },
    payment_status: 'cash',
  });
  const targetFields = ["code", "quantity", "cost", "discount"];

  const [createPurchase] = useCreatePurchaseMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();
  const navigator = useNavigate();
  const token = getToken();
  const { pathname } = useLocation();
  const [items, setItems] = useState([]);
  const [itemType, setValue4] = useState(pathname.includes('purchase-raw') ? 1 : 0);
  const MENU_ID = pathname.includes('purchase-raw') ? 39 : 28;
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
    via: 'truck'
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
          discount: parseFloat(detail.discount || 0),
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
        discount: parseFloat(detail.discount || 0),
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
              discount: parseFloat(detail.discount || 0),
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
            via: purchase?.shippings?.via || 'truck'
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
              discount: parseFloat(detail.discount || 0),
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
            //   via: purchase?.shippings?.via || 'truck'
            // },
            payment_status: purchase.payment_status || 'cash'
          });


          setShippingData({
            fee: parseFloat(purchase?.shippings?.fee) || 0,
            tracking_number: purchase?.shippings?.tracking_number || '',
            carrier: purchase?.shippings?.carrier || '',
            via: purchase?.shippings?.via || 'truck'
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
    if (shippingData?.via && !['truck', 'air', 'sea'].includes(shippingData.via)) {
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
        discount: 0,
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

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      ),
    }));
  };

  const handleCostChange = (index, newCost) => {
    if (newCost < 0) {
      setErrors({ items: t('invalidCost') });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, item_cost: newCost } : item
      ),
    }));
  };

  const handleDiscountChange = (index, newDiscount) => {
    if (newDiscount < 0 || newDiscount > 100) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, discount: newDiscount } : item
      ),
    }));
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

    const discountTotal = formData.items.reduce(
      (sum, item) => sum + (item.quantity * item.item_cost * (item.discount || 0)) / 100,
      0
    );

    const discountedSubtotal = subTotal - discountTotal;
    const taxAmount = discountedSubtotal * (formData.tax_rate / 100);
    const totalAmount = discountedSubtotal + taxAmount + parseFloat(formData.fee || 0);
    const balance = totalAmount - (formData.total_paid || 0);

    setFormData((prev) => ({
      ...prev,
      sub_total: subTotal,
      discount_total: discountTotal,
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
            const discount = Number(row.discount) || 0;

            return {
              item_id: row.id,
              quantity,
              item_cost: itemCost,
              discount: discount,
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
          setErrors(prev => ({ ...prev, items: t('noMatchingItemsFound') }));
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
                discount: importedItem.discount || mergedItems[existingIndex].discount,
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
        quote_no: formData.quote_no || '',
        status: formData.status === 'Completed' ? 1 : formData.status === 'Cancelled' ? 2 : 0,
        items: formData.items.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          attributes: item.attributes,
          item_cost: parseFloat(item.item_cost),
          discount: parseFloat(item.discount || 0),
        })),
        payments: [paymentData],
        shippings: [shippingData],
        payment_status: formData?.payment_status || 'cash'
      };

      console.log(payload);
      

      if (isEditMode) {
        if (itemType != 0) {
          const res = await api.put(`/purchase_raw/${purchaseId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.data.status == 200 || res.status == 200) {
            if (refetchRawTemplates) refetchRawTemplates();
            navigator(`/inventories/purchase-raw/receipt-raw/${purchaseId}`);
          }
        } else {
          const res = await updatePurchase({ id: purchaseId, itemData: payload, token }).unwrap();
          if (res?.status == 200 || res?.data?.status == 200 || res) {
            if (refetchTemplates) refetchTemplates();
            navigator(`/inventories/purchases/receipt/${purchaseId}`);
          }
        }

        notify.success(t('updatePurchaseSuccess'));
      } else {
        if (itemType != 0) {
          const res = await api.post("/purchase_raw", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.data.status == 201 || res.status == 201) {
            if (refetchRawTemplates) refetchRawTemplates();
            navigator(`/inventories/purchase-raw/receipt-raw/${res.data?.id || res.id}`);
          }
        } else {
          const res = await createPurchase({ itemData: payload, token }).unwrap();
          const targetId = res?.id || res?.data?.id;
          if (targetId || res) {
            if (refetchTemplates) refetchTemplates();
            navigator(`/inventories/purchases/receipt/${targetId || ''}`);
          }
        }

        notify.success(t('createPurchaseSuccess'));
      }
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
    <div className="view-page bg-transparent transition-colors">
      <AlertBox
        isOpen={showAlert}
        title={isEditMode ? t('confirmUpdate') : t('confirmCreatePurchase')}
        message={isEditMode ? t('confirmUpdatePurchaseMessage') : t('confirmCreatePurchaseMessage')}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowAlert(false)}
        confirmText={isEditMode ? t('update') : t('create')}
        cancelText={t('cancel')}
      />
      <div>
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
                {isEditMode ? t('editPurchaseOrder') : t('createNewPurchase')}
              </h1>
              <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
                {isEditMode ? t('updatePurchaseOrderDetails') : t('addNewPurchaseToSystem')}
              </p>
            </div>
            <div className=" mt-6 flex justify-center items-center gap-2">
              {!purchaseId && (
                <Button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={loading}
                  variant='primary'
                  outline={false}
                >
                  <FaCloudUploadAlt className="text-lg" />
                </Button>
              )}
              <Button
                type="button"
                actionType="is_modify"
                menuId={MENU_ID}
                onClick={handleSubmit}
                disabled={loading}
                variant='save'
                outline={false}
              >
                <FaSave />{loading ? t('processing') : isEditMode ? t('update') : t('create')}
              </Button>
              <Button
                type="button"
                variant='cancel'
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
          <div className="grid grid-cols-1">
            {/* Left Column - Form Sections */}
            <div>
              {/* Supplier & Date Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className=" flex justify-between">
                  

                  <div className="flex gap-2 justify-between p-4">
                    <div className="flex items-end gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
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
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {t('purchaseDate')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <DatePicker showTime value={formData.purchase_date ? dayjs(formData.purchase_date) : ''} className="date-picker" size="large" onChange={(date, dateString) => handleInputChange('purchase_date', dateString)} />
                        {fieldErrors.purchase_date && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.purchase_date}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end gap-5">
                      
                      <div className=" ">
                      
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 text-sm font-semibold dark:!text-gray-400 flex items-center gap-2">
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
                          className={`w-full ${fieldErrors.quote_no ? 'border-red-500' : ''} text-input`}
                        />
                      </div>
                    </div>


                  </div>
                  <div className="  p-4 ">
                    <div className="flex flex-wrap justify-between gap-5 mb-2">
                      <div className="flex gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            {t('shippingCarrier')} <FaBox />
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
                        
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          {t('shippingVia')}
                        </label>
                        <div className="flex gap-4">
                          <Radio.Group
                            name="viaGroup"
                            defaultValue={1}
                            value={shippingData?.via}
                            onChange={(e) => setShippingData((pre) => ({ ...pre, via: e.target.value }))}
                            options={[
                              { value: 'truck', label: t('truck') },
                              { value: 'air', label: t('air') },
                              { value: 'sea', label: t('sea') },
                            ]}
                          />

                        </div>
                      </div>



                      
                    </div>


                  </div>
                </div>
              </motion.div>

              {/* Items Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="border-t-0 px-4 border-x bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-transparent dark:from-transparent dark:to-transparent border-gray-200 dark:border-gray-500">
                  <div className="flex items-center justify-between  px-4 py-2 ">
                    <div className="flex items-center flex-col gap-2 mr-2">
                      
                      <Checkbox
                        className="dark:!text-white"
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setItemFilter('all')
                          } else {
                            setItemFilter('supplier')
                          }
                        }}
                      ><span className="text-xs">Only Supplier</span></Checkbox>
                    </div>

                    <div className="flex items-center grow gap-2">

                      <RichSearch
                        data={itemType == 1 ? rawMaterials : items}
                        placeholder={'--- ' + t('addItem') + ' ---'}
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
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          downloadTemplate(targetFields, itemType == 1 ? "Import Raw Materials" : "Import Items");
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-green-400 to-green-600 text-white hover:bg-green-600 transition-colors"
                      >
                        <pre className="flex items-center">
                          <FaFileExcel className="text-white" size={18} />
                          <span>{t('downloadTemplate')}</span>
                        </pre>
                      </Button>
                      <ImportItemInList
                        onSelected={handleImportItems}
                      />
                    </div>

                  </div>


                  <ItemTable
                    data={formData.items}
                    onDelete={removeItem}
                    onCellChange={(index, key, value) => {
                      if (key === 'quantity' && value <= 0) {
                        setErrors({ items: t('invalidQuantity') });
                        return;
                      }
                      if (key === 'item_cost' && value < 0) {
                        setErrors({ items: t('invalidCost') });
                        return;
                      }
                      setFormData(prev => ({
                        ...prev,
                        items: prev.items.map((item, i) => i === index ? { ...item, [key]: value } : item)
                      }));
                    }}
                    columns={[
                      { title: t('item'), key: 'name', type: 'item', subKey: 'code' },
                      { title: t('quantity'), key: 'quantity', type: 'number' },
                      { title: t('price'), key: 'item_cost', type: 'number' },
                      { title: t('discount'), key: 'discount', type: 'discount', priceLabel: 'item_cost' },
                      { 
                        title: t('total'), 
                        type: 'showonly', 
                        render: (item) => `$${((item.quantity * item.item_cost) * (1 - (item.discount || 0) / 100)).toFixed(2)}` 
                      }
                    ]}
                  />

                  {errors.items && (
                    <div className="text-red-500 text-sm mt-2 p-3 bg-red-50 dark:!bg-red-900/10 rounded-lg">
                      {errors.items}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>


            {/* Right Column - Summary */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className=" flex justify-between gap-10 p-4 mx-4 border bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                  <div className="max-w grow">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      {t('description')} <GiNotebook />
                    </label>
                    <textarea
                      value={formData.description || ''}
                      placeholder="--- Description for purchase... ---"
                      onChange={(e) => setFormData((pre) => ({ ...pre, description: e.target.value }))}
                      className="textarea-input"
                      rows={3}
                    />
                  </div>
                  <div className="max-w-96 grow">
                    <div className="flex justify-between w-full text-slate-500">
                        <span className="text-[13px] font-semibold uppercase">{t('subTotal')}</span>
                        <span className="text-[13px] ">${formData.sub_total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full  text-slate-500">
                        <span className="text-[13px] font-semibold uppercase">{t('discount')}</span>
                        <span className="text-[13px] ">${Number(formData.discount_total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full  text-slate-500">
                        <span className="text-[13px] font-semibold uppercase">{t('tax')}</span>
                        <span className="text-[13px] ">${Number(formData.tax_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full text-slate-500">
                        <span className="text-[13px] font-semibold uppercase">{t('totalPaid')}</span>
                        <span className="text-[13px] ">${formData.total_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full text-slate-500">
                        <span className="text-[13px] font-semibold uppercase">{t('balance')}</span>
                        <span className={`text-[13px] ${formData.balance > 0 ? 'text-orange-600 dark:!text-orange-400' : 'text-green-600 dark:!text-green-400'}`}>${formData.balance.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center">
                      <div className=" grow">
                        <Checkbox
                            checked={formData?.tax_rate == 10}
                            onChange={(e) => {
                                if(e.target.checked){
                                    setFormData(prev => ({ ...prev, tax_rate: 10 }))
                                }else{
                                    setFormData(prev => ({ ...prev, tax_rate: 0 }))
                                }
                            }}
                        >
                            <span className="text-[11px] font-bold uppercase text-slate-800 dark:text-slate-50">Tax Include</span>
                        </Checkbox>
                      
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                          <pre>{t('shippingFee')}</pre>
                        </label>
                        <Input
                          type="number"
                          value={shippingData.fee}
                          onChange={(value) => {
                            const val = parseFloat(value) || 0;
                            setShippingData((pre) => ({ ...pre, fee: val }));
                            setFormData(prev => ({ ...prev, fee: val }));
                          }}
                          className={`max-w-30 px-3 py-2 border ${fieldErrors.fee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          step="0.01"
                          min="0"
                        />
                        {fieldErrors.fee && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.fee}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between w-full max-w-[350px] text-slate-800 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-sm font-bold uppercase">{t('totalAmount')}</span>
                        <span className="text-xl font-bold text-[#13b5ea]">${formData.total_amount.toFixed(2)}</span>
                    </div>
                    
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
      {/* Template Modal */}
      <OldTemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={t("selectOldPurchaseTemplate")}
        searchTerm={templateSearch}
        onSearchChange={setTemplateSearch}
        filters={
          <div className="flex gap-5 w-full">
            <div className="lg:col-span-4 grow">
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
                className="date-picker"
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
                className="date-picker"
                placeholder={t("endDate")}
              />
            </div>
          </div>
        }
        selectedIds={selectedTemplateIds}
        onToggleSelect={toggleSelectTemplate}
        onSelectAll={toggleSelectAllTemplatesOnPage}
        onClearSelection={() => setSelectedTemplateIds([])}
        onImport={handleImportTemplates}
        data={templates}
        isLoading={templateLoading || templateRawLoading}
        columns={[
          { title: t("purchaseNo"), render: (template) => template.purchase_no || template.id },
          { title: t("supplier"), key: "supplier_name" },
          { title: t("date"), render: (template) => dayjs(template.purchase_date).format("YYYY-MM-DD") },
          { 
            title: t("total"), 
            render: (template) => `$${parseFloat(template.total_amount).toFixed(2)}`,
            dataClassName: "font-semibold text-gray-700 dark:text-gray-200"
          }
        ]}
        pagination={templatePagination}
        onPaginationChange={(page) => setTemplatePagination(p => ({ ...p, current: page }))}
        onUseTemplate={handleSelectOneTemplate}
        t={t}
      />
    </div>
  );
};

export default CreatePurchase;
