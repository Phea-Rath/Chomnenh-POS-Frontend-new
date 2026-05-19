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
  FaFileExcel
} from "react-icons/fa";
import axios from "axios";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import api from "../../services/api";
import { useGetAllSupplierQuery } from "../../../app/Features/suppliesSlice";
import { toast } from "react-toastify";
import { useLocation, useNavigate, useParams } from "react-router";
import { useGetAllPurchaseQuery, useGetAllPurchaseRawQuery } from "../../../app/Features/purchasesSlice";
import { Select, Card, Badge, Tag, Divider, Radio, DatePicker } from "antd";
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
import { BiImport } from "react-icons/bi";
import readFormFile from "../../services/readFormFile";
import ImportItemInList from "../../utils/ImportItemInList";

const CreatePurchase = () => {
  const { t } = useTranslation();
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
    shipping_fee: 0,
    exchange_rate: 0,
    invoice_number: '',
    total_amount: 0,
    total_paid: 0,
    balance: 0,
    status: 'Pending',
    items: [],
    payments: [],
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [itemCost, setItemCost] = useState(0);
  const [attributes, setAttributes] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: itemData, isFetching: itemLoading } = useGetAllItemsQuery({ token, limit, page: currentPage, search: debouncedSearch }, { skip: itemType != 0 });
  const { data: rawData, isFetching: rawLoading } = useGetAllRawMaterialQuery({ token, limit, page: currentPage, search: debouncedSearch }, { skip: itemType != 1 });
  const { data: supplierData } = useGetAllSupplierQuery(token);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const { refetch } = useGetAllPurchaseQuery({ token, limit: 10, page: 1, search: "" });
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const { refetch: refetchRawMaterials } = useGetAllPurchaseRawQuery({ token, limit: 10, page: 1, search: "" });

  const onChangeItemType = ({ target: { value } }) => {
    setValue4(value);
  };

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
            tax_rate: parseFloat(purchase.tax_rate) || 0,
            tax_amount: parseFloat(purchase.tax_amount) || 0,
            shipping_fee: parseFloat(purchase.shipping_fee) || 0,
            total_amount: parseFloat(purchase.total_amount) || 0,
            total_paid: parseFloat(purchase.total_paid) || 0,
            balance: parseFloat(purchase.balance) || 0,
            exchange_rate: parseFloat(purchase.exchange_rate) || 0,
            invoice_number: purchase.invoice_number || '',
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
            payments: purchase.payments.map((p) => ({
              amount: parseFloat(p.amount),
              paid_at: p.paid_at.split(" ")[0],
            })),
          });

          setLoading(false);
        } catch (err) {
          toast.error(t('failedToLoadPurchaseData'));
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
            tax_rate: parseFloat(purchase.tax_rate) || 0,
            tax_amount: parseFloat(purchase.tax_amount) || 0,
            shipping_fee: parseFloat(purchase.shipping_fee) || 0,
            total_amount: parseFloat(purchase.total_amount) || 0,
            total_paid: parseFloat(purchase.total_paid) || 0,
            balance: parseFloat(purchase.balance) || 0,
            exchange_rate: parseFloat(purchase.exchange_rate) || 0,
            invoice_number: purchase.invoice_number || '',
            status: purchase.status === 1 ? 'Completed' : purchase.status === 2 ? 'Cancelled' : 'Pending',
            items: purchase.details.map((detail) => ({
              item_id: detail.id,
              quantity: parseFloat(detail.quantity),
              item_cost: parseFloat(detail.item_cost),
              attributes: detail.attributes || [],
              name: detail.material_name,
              code: detail.material_code,
              image: detail.material_image || null,
            })),
            payments: purchase.payments.map((p) => ({
              amount: parseFloat(p.amount),
              paid_at: p.paid_at.split(" ")[0],
            })),
          });

          setLoading(false);
        } catch (err) {
          toast.error(t('failedToLoadPurchaseData'));
          console.error(err);
        }
      };

      fetchPurchase();
    }
  }, [isEditMode, purchaseId, token, t]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax_rate, formData.shipping_fee]);

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
        } else if (new Date(value) > new Date()) {
          newFieldErrors.purchase_date = t('purchaseDateCannotBeInFuture');
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
      case 'shipping_fee':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          newFieldErrors.shipping_fee = t('shippingFeeNonNegative');
        } else {
          delete newFieldErrors.shipping_fee;
        }
        break;
      default:
        break;
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    const newFieldErrors = { ...fieldErrors };

    if (!formData.supplier_id) {
      newErrors.supplier = t('selectSupplier');
      newFieldErrors.supplier_id = t('required');
    }

    if (formData.items.length === 0) {
      newErrors.items = t('noItemsAdded');
    }

    formData.items.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors.items = `${t('item')} ${index + 1} ${t('invalidQuantity')}`;
      }
      if (item.item_cost <= 0) {
        newErrors.items = `${t('item')} ${index + 1} ${t('invalidUnitPrice')}`;
      }
    });

    if (formData.payments.length > 0) {
      const invalidPayment = formData.payments.find(payment =>
        payment.amount <= 0 || !payment.paid_at
      );
      if (invalidPayment) {
        newErrors.payments = t('invalidPaymentData');
      }

      if (Number(formData.total_paid) > Number(formData.total_amount)) {
        setFormData(prev => ({ ...prev, total_paid: prev.total_amount, balance: 0 }));
      }
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = t('required');
      newFieldErrors.purchase_date = t('required');
    } else if (new Date(formData.purchase_date) > new Date()) {
      newErrors.purchase_date = t('purchaseDateCannotBeInFuture');
      newFieldErrors.purchase_date = t('purchaseDateCannotBeInFuture');
    }

    if (formData.total_amount <= 0) {
      newErrors.financial = t('financialError');
    }

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const addItemToPurchase = (id) => {
    console.log(id);
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

    
    

    const newItem = {
      item_id: itemType == 0 ? item.id : item.id,
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

    setSelectedItem(null);
    setQuantity(1);
    setItemCost(0);
    setSearchTerm("");
    setShowItemModal(false);
    setErrors({});
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      payments: [],
      balance: formData.total_amount,
      total_paid: 0
    }));
  };

  const handleQtyChange = (index, newQty) => {
    console.log(newQty);
    
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
      payments: [...prev.payments, newPayment],
      total_paid: prev.total_paid + paymentAmount,
      balance: prev.total_amount - (prev.total_paid + paymentAmount),
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
    const totalAmount = subTotal + taxAmount + parseFloat(formData.shipping_fee || 0);
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
    } else if (name === "shipping_fee" || name === "tax_rate") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
        const res = await api.post(`/import-items-by-code/${itemType?'material':'items'}`, {data: importedRows,  }, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
        });
        if (res.status === 200) {
          const sourceItems = res.data.data;
          const importedItems = importedRows
            .map((row) => {
              // const rowName = String(row.name || "").trim().toLowerCase();
              const rowCode = String(row.code || "").trim().toLowerCase();
              const matchedItem = sourceItems.find((sourceItem) => {
                // const sourceName = String(itemType === 1 ? sourceItem.material_name : sourceItem.name || "").trim().toLowerCase();
                const sourceCode = String(itemType === 1 ? sourceItem.material_code : sourceItem.code || "").trim().toLowerCase();
  
                return (rowCode && sourceCode === rowCode);
              });
  
              if (!matchedItem) {
                return null;
              }
  
              const quantity = Math.max(1, Number(row.quantity ?? row.stock) || 1);
              const itemCost = Number(row.cost ?? row.price) || 0;
  
              return {
                item_id: matchedItem.id,
                quantity,
                item_cost: itemCost,
                total_amount: quantity * itemCost,
                attributes: [],
                name: itemType === 1 ? matchedItem.material_name : matchedItem.name,
                code: itemType === 1 ? matchedItem.material_code : matchedItem.code,
                image: itemType === 1 ? matchedItem.material_image : matchedItem.image,
              };
            })
            .filter(Boolean);
            if (importedItems.length === 0) {
              toast.error("No matching items found in the import file.");
              setErrors(prev => ({ ...prev, items: `Codes [${res.data.missing_codes}] are not found.` }));
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

          if(res.data.missing_codes){
            setErrors(prev => ({ ...prev, items: `Codes [${res.data.missing_codes}] are not found.` }));
            toast.warning(`Codes ${res.data.missing_codes} are not found.`);
          }

          // setErrors((prev) => ({ ...prev, items: null }));
          toast.success(`Imported ${importedItems.length} item(s).`);
        }
        


        
      } catch (error) {
        console.error(error);
        toast.error("Failed to import file. please check your file and try again.");
        setErrors(prev => ({ ...prev, file: "Failed to import file. please check your file and try again." }));
      } finally {
        event.target.value = "";
      }
    // };

    // input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentAmount < 0) {
      setErrors({ paymentModal: t('invalidPaymentAmount') });
      return;
    }

    if (!paymentDate) {
      setErrors({ paymentModal: t('selectPaymentDate') });
      return;
    }

    if (Number(paymentAmount.toFixed(0)) > Number(formData.balance.toFixed(0))) {
      setErrors({ paymentModal: t('paymentExceedBalance') });
      return;
    }
    if (!validateForm()) {
      toast.error(t('pleaseFixErrors'));
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

    setLoading(true);

    try {
      const payload = {
        ...formData,
        created_by: 1,
        purchase_date: formData.purchase_date,
        sub_total: parseFloat(formData.sub_total),
        tax_rate: parseFloat(formData.tax_rate) || 0,
        tax_amount: parseFloat(formData.tax_amount) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        total_amount: parseFloat(formData.total_amount),
        total_paid: parseFloat(formData.total_paid) || 0,
        purchase_type: itemType,
        balance: parseFloat(formData.balance) || 0,
        exchange_rate: parseFloat(formData.exchange_rate) || 0,
        invoice_number: formData.invoice_number || '',
        status: formData.status === 'Completed' ? 1 : formData.status === 'Cancelled' ? 2 : 0,
        items: formData.items.map((item) => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          attributes: item.attributes,
          item_cost: parseFloat(item.item_cost),
        })),
        payments: [
          {
            amount: paymentAmount,
            paid_at: paymentDate,
          }
        ]
      };

      if (isEditMode) {
        if (itemType != 0) {
          await api.put(`/purchase_raw/${purchaseId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetchRawMaterials();
        } else {
          await api.put(`/purchase/${purchaseId}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetch();
        }

        toast.success(t('updatePurchaseSuccess'));
      } else {
        if (itemType != 0) {
          await api.post("/purchase_raw", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          refetchRawMaterials();
        } else {
          await api.post("/purchase", payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          refetch();
        }

        toast.success(t('createPurchaseSuccess'));
      }
      navigator(-1);
    } catch (err) {
      const errorMessage = err.response?.data?.message || t('errorProcessingPurchase');
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onScrollFetch = (e) => {
    const target = e.target;
    
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    const total = itemType == 0 ? itemData?.pagination?.total : rawData?.pagination?.total;
    const currentLength = itemType == 0 ? items?.length : rawMaterials?.length;
    console.log(nearBottom, total, currentLength);
    if (nearBottom && total > currentLength) {
      if(itemType == 0 && !itemLoading){
        setLimit(prev => prev + 10);
      }
      if(itemType == 1 && !rawLoading){
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Badge
              count={isEditMode ? t('editMode') : t('new')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
              style={{
                backgroundColor: isEditMode ? '#3b82f6' : '#10b981',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '12px'
              }}
            />
          </div>

          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="border-red-200 bg-red-50 dark:!bg-red-900/10 dark:!border-red-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 dark:!bg-red-900/30 rounded-lg">
                    <FaExclamationTriangle className="text-red-600 dark:!text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-red-800 dark:!text-red-300 font-semibold mb-2">{t('pleaseFixErrors')}</h3>
                    <ul className="list-disc list-inside text-red-700 dark:!text-red-400 text-sm space-y-1">
                      {Object.values(errors).map((error, index) => (
                        error && <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
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
                  <div className="flex items-center gap-2 mb-4">
                    <FaWarehouse className="text-blue-500" />
                    <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('supplierInformation')}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <DatePicker className="date-picker" size="large" onChange={(date, dateString) => handleInputChange('purchase_date', dateString)} />
                      {fieldErrors.purchase_date && (
                        <div className="text-red-500 text-sm mt-1">{fieldErrors.purchase_date}</div>
                      )}
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
                <div className="">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-blue-500" />
                      <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('purchaseItems')}</h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <RichSearch
                        data={itemType==1? rawMaterials:items}
                        placeholder={t('addItem')}
                        keyFields={{
                          id: itemType==1?'id':'id',
                          title: itemType==1?'material_name':'name',
                          image: itemType==1?'material_image':'image',
                          subtitle: itemType==1?'material_code':'code',
                        }}
                        onSelected={(value) => addItemToPurchase(value)}
                        onSearch={(value)=>setSearchTerm(value)}
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
                            downloadTemplate(targetFields, itemType==1?"Import Raw Materials":"Import Items");
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
                    haedTitle={[{title: t('item'), key: 'item'}, {title: t('quantity'), key: 'quantity'}, {title: t('price'), key: 'price'}, {title: t('total'), key: 'total'}, {title: '', key: 'action'}]}
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="text-green-500" />
                      <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">{t('paymentInformation')}</h2>
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
                          setFormData(prev => {
                            return {
                              ...prev,
                              total_paid: value
                            }
                          })
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
              </motion.div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Summary div */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="">
                  <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100 mb-6 flex items-center gap-2">
                    <FaLayerGroup className="text-blue-500" />
                    {t('purchaseSummary')}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:!text-gray-400">{t('subtotal')}</span>
                      <span className="font-bold text-gray-800 dark:!text-gray-100">${formData.sub_total.toFixed(2)}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 w-full">
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaPercent className="text-gray-400" />
                            {t('tax')}
                          </span>
                          {/* <span className="font-bold text-gray-800 dark:!text-gray-100">${formData.tax_rate.toFixed(2)}</span> */}
                        </div>
                        <Input
                          type="number"
                          name="tax_rate"
                          value={formData.tax_rate}
                          onChange={(value) => handleInputChange('tax_rate', value)}
                          placeholder={t('taxRate')}
                          className={`w-full ${fieldErrors.tax_rate ? 'border-red-500' : ''} dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        {fieldErrors.tax_rate && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.tax_rate}</div>
                        )}
                      </div>
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaTruck className="text-gray-400" />
                            {t('shippingFee')}
                          </span>
                          {/* <span className="font-bold text-gray-800 dark:!text-gray-100">${formData.shipping_fee.toFixed(2)}</span> */}
                        </div>
                        <Input
                          type="number"
                          name="shipping_fee"
                          value={formData.shipping_fee}
                          onChange={(value) => handleInputChange('shipping_fee', value)}
                          placeholder={t('shippingFee')}
                          className={`w-full ${fieldErrors.shipping_fee ? 'border-red-500' : ''} dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}
                          min="0"
                          step="0.1"
                        />
                        {fieldErrors.shipping_fee && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.shipping_fee}</div>
                        )}
                      </div>
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaTruck className="text-gray-400" />
                            {t('exchangeRate')}(៛)
                          </span>
                          {/* <span className="font-bold text-gray-800 dark:!text-gray-100">៛{parseFloat(formData.exchange_rate).toFixed(2)}</span> */}
                        </div>
                        <Input
                          type="number"
                          name="exchange_rate"
                          value={formData.exchange_rate}
                          onChange={(value) => handleInputChange('exchange_rate', value)}
                          placeholder={t('exchangeRate')}
                          className={`w-full ${fieldErrors.exchange_rate ? 'border-red-500' : ''} dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}
                          min="0"
                          step="1"
                        />
                        {fieldErrors.exchange_rate && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.exchange_rate}</div>
                        )}
                      </div>
                      <div className=" grow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600 dark:!text-gray-400 flex items-center gap-2">
                            <FaFileInvoice className="text-gray-400" />
                            {t('invoiceId')}
                          </span>
                          {/* <span className="font-bold text-gray-800 dark:!text-gray-100">៛{parseFloat(formData.exchange_rate).toFixed(2)}</span> */}
                        </div>
                        <Input
                          type="text"
                          name="invoice_number"
                          value={formData.invoice_number}
                          onChange={(value) => handleInputChange('invoice_number', value)}
                          placeholder={t('invoiceId')}
                          className={`w-full ${fieldErrors.invoice_number ? 'border-red-500' : ''} dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600`}

                        />
                        {fieldErrors.invoice_number && (
                          <div className="text-red-500 text-sm mt-1">{fieldErrors.exchange_rate}</div>
                        )}
                      </div>
                    </div>

                    <Divider className="my-4 dark:!border-gray-700" />

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

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:!bg-blue-900/20 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t('items')}</div>
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">{formData.items.length}</div>
                      </div>
                      <div className="bg-green-50 dark:!bg-green-900/20 p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t('payment')}s</div>
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">{formData.payments.length}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className=" mt-6 flex justify-center items-center gap-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        variant='primary'
                        outline={false}
                      >
                        <FaSave />Save
                        {/* {loading ? t('processing') : isEditMode ? t('updatePurchase') : t('createPurchase')} */}
                      </Button>
                      <Button
                        type="button"
                        variant='danger'
                        outline={true}
                        onClick={() => window.history.back()}
                      >
                        <FaTimes />Back
                        {/* {t('cancel')} */}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </div>

      
    </div>
  );
};

export default CreatePurchase;


