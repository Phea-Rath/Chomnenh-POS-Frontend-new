import React, { useEffect, useMemo, useState } from "react";
import {
  FaBox,
  FaCalendarAlt,
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
} from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { Badge, Divider, DatePicker } from "antd";
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
import { useGetOrderByIdQuery } from "../../../app/Features/ordersSlice";

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

const PAYMENT_METHOD_SEARCH_OPTIONS = PAYMENT_METHOD_OPTIONS.map((option) => ({
  ...option,
  id: option.value,
  title: option.label,
}));

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
  order_tax: 0,
  payment: 0,
  order_payment_status: "paid",
  order_payment_method: "cash",
  order_date: today,
  exchange_rate: 0,
  reference_no: "",
  sub_total: 0,
  sale_type: "wholesale",
  created_by: "",
  // order_tel: "",
  // order_address: "",
  discount_total: 0,
  total_amount: 0,
  balance: 0,
  items: [],
});

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const OrderInvoiceForm = () => {
  const { t } = useTranslation();
  const { id: orderId } = useParams();
  const isEditMode = Boolean(orderId);
  const token = localStorage.getItem("token");

  const navigator = useNavigate();

  const [formData, setFormData] = useState(() => createInitialFormData());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [limit, setLimit] = useState(10);
  const [currentPage] = useState(1);
  const {data:users} = useGetAllUserQuery(token)
  const { data: orderByIdData, isFetching: orderByIdLoading } = useGetOrderByIdQuery(
    { id: orderId, token },
    { skip: !isEditMode || !orderId || !token }
  );

  const { data: customerData } = useGetAllCustomerQuery(token);
  const { data: deliverData } = useGetAllDeliverQuery(token);
  const { data: itemInStock, isFetching: itemInStockLoading } = useGetAllSaleQuery({
    token,
    limit,
    page: currentPage,
    search: debouncedSearch,
  });

  const createUser = users?.data?.filter((user) => user.role_id !== 1 && user.role_id !== 2) || [];
  const customers = customerData?.data || [];
  const delivers = deliverData?.data || [];
  const items = useMemo(() => itemInStock?.data ?? [], [itemInStock?.data]);
  const targetFields = ["code", "quantity", "cost"];

  const itemLookup = useMemo(() => {
    return new Map(items.map((item) => [Number(item.id), item]));
  }, [items]);

  const getDefaultItemPrice = (item) => {
    return toNumber(item.wholesale_price);
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
      order_payment_status: balance <= 0 && totalAmount > 0 ? "paid" : formData.order_payment_status,
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
    const normalizedItems = (order.items || order.details || []).map((detail) => ({
      item_id: Number(detail.item_id),
      item_name: detail.item_name || detail.name || "",
      name: detail.item_name || detail.name || "",
      code: detail.item_code || detail.code || "",
      image: detail.images?.[0]?.image || detail.image || null,
      item_for: detail.item_for || "sale",
      item_price: toNumber(detail.item_price ?? detail.unit_price),
      quantity: toNumber(detail.quantity),
      discount: toNumber(detail.discount),
    }));

    setFormData(
      calculateTotals({
        status: Number(order.status ?? DEFAULT_STATUS),
        order_customer_id: order.order_customer_id || order.customer_id || "",
        deliver_id: order.deliver_id || "",
        delivery_fee: toNumber(order.delivery_fee),
        order_tax: toNumber(order.order_tax ?? order.tax_amount),
        payment: toNumber(order.payment),
        order_payment_status: order.order_payment_status || "paid",
        order_payment_method: order.order_payment_method || "cash",
        order_date: order.order_date || today,
        exchange_rate: toNumber(order.exchange_rate),
        reference_no: order.reference_no || order.order_no || "",
        sub_total: toNumber(order.order_subtotal ?? order.sub_total),
        discount_total: toNumber(order.order_discount),
        created_by: order.created_by || "",
        // order_tel: order.order_tel || "",
        // order_address: order.order_address || "",
        sale_type: order.sale_type || "wholesale",
        total_amount: toNumber(order.order_total ?? order.total_amount),
        balance: toNumber(order.balance),
        items: normalizedItems,
      })
    );
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
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: Number(nextItems[existingIndex].quantity) + 1,
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
    updateFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleQtyChange = (index, quantity) => {
    if (quantity <= 0) {
      setErrors((prev) => ({ ...prev, items: t("invalidQuantity") }));
      return;
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
    updateFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, item_for: itemFor } : item
      ),
    }));
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
        "/import-items-by-code/items",
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

          if (!matchedItem) {
            return null;
          }

          return {
            item_id: Number(matchedItem.id),
            item_name: matchedItem.name || "",
            name: matchedItem.name || "",
            code: matchedItem.code || "",
            image: matchedItem.image || null,
            item_for: "sale",
            quantity: Math.max(1, Number(row.quantity) || 1),
            item_price: getDefaultItemPrice(matchedItem),
            discount: 0,
          };
        })
        .filter(Boolean);

      if (importedItems.length === 0) {
        toast.error("No matching items found in the import file.");
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
        setErrors((prev) => ({
          ...prev,
          items: `Codes [${res.data.missing_codes}] are not found.`,
        }));
        toast.warning(`Codes ${res.data.missing_codes} are not found.`);
      }

      toast.success(`Imported ${importedItems.length} item(s).`);
    } catch {
      toast.error("Failed to import file. please check your file and try again.");
      setErrors((prev) => ({
        ...prev,
        file: "Failed to import file. please check your file and try again.",
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
      toast.error(t("pleaseFixErrors"));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        status: Number(formData.status),
        order_customer_id: formData.order_customer_id ? Number(formData.order_customer_id) : null,
        order_tel: null,
        order_address: null,
        deliver_id: formData.deliver_id ? Number(formData.deliver_id) : null,
        delivery_fee: toNumber(formData.delivery_fee),
        order_tax: toNumber(formData.order_tax),
        payment: toNumber(formData.payment),
        created_by: formData.created_by || null,
        sale_type: formData.sale_type || null,
        reference_no: formData.reference_no || null,
        order_payment_status: formData.order_payment_status,
        order_payment_method: formData.order_payment_method,
        order_date: formData.order_date,
        items: formData.items.map((item) => ({
          item_id: Number(item.item_id),
          item_name: item.item_name,
          item_for: item.item_for || null,
          item_price: toNumber(item.item_price),
          unit_price: toNumber(item.item_price),
          quantity: Number(item.quantity),
          discount: toNumber(item.discount),
        })),
      };

      if (isEditMode) {
        await api.put(`/order_masters/${orderId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(t("updateOrderSuccess"));
      } else {
        await api.post("/order_masters", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(t("createOrderSuccess"));
      }

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

      toast.error(errorMessage);
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
    handleInputChange("order_payment_status", value || "");
  };

  const handlePaymentMethodSelect = (value) => {
    handleInputChange("order_payment_method", value || "");
  };

  return (
    <div className="view-page bg-transparent py-8 transition-colors">
      <div className=" px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:!text-gray-100">
                {isEditMode ? t("editOrderOrder") : t("createNewOrder")}
              </h1>
              <p className="mt-2 text-gray-600 dark:!text-gray-400">
                {isEditMode ? t("updateOrderOrderDetails") : t("addNewOrderToSystem")}
              </p>
            </div>
            <Badge
              count={isEditMode ? t("editMode") : t("new")}
              className="bg-gradient-to-r from-blue-500 to-indigo-600"
              style={{
                backgroundColor: isEditMode ? "#3b82f6" : "#10b981",
                color: "white",
                padding: "6px 16px",
                borderRadius: "20px",
                fontWeight: "600",
                fontSize: "12px",
              }}
            />
          </div>

          {Object.keys(errors).length > 0 && (
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
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <FaWarehouse className="text-blue-500" />
                    <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">
                      {t("customerInformation")}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
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
                        size="large"
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
                        data={ORDER_PAYMENT_STATUS_SEARCH_OPTIONS}
                        value={formData.order_payment_status}
                        placeholder={t("status")}
                        keyFields={{
                          id: "id",
                          title: "title",
                        }}
                        onSelected={handlePaymentStatusSelect}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        {t("paymentMethod")}
                      </label>
                      <RichSearch
                        data={PAYMENT_METHOD_SEARCH_OPTIONS}
                        value={formData.order_payment_method}
                        placeholder={t("paymentMethod")}
                        keyFields={{
                          id: "id",
                          title: "title",
                        }}
                        onSelected={handlePaymentMethodSelect}
                      />
                    </div>

                  </div>
                </div>
              </div>

              <div>
                <div>
                  <div className="mb-6 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <FaBox className="text-blue-500" />
                      <h2 className="text-lg font-bold text-gray-800 dark:!text-gray-100">
                        {t("OrderItems")}
                      </h2>
                    </div>

                    <div className="flex flex-1 items-center gap-2">
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
                          className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
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

            <div className="space-y-6">
              <div>
                <div>
                  <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-800 dark:!text-gray-100">
                    <FaLayerGroup className="text-blue-500" />
                    {t("OrderSummary")}
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

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-gray-600 dark:!text-gray-400">
                            <FaPercent className="text-gray-400" />
                            {t("tax")}
                          </span>
                        </div>
                        <Input
                          type="number"
                          name="order_tax"
                          value={formData.order_tax}
                          onChange={(value) => handleInputChange("order_tax", value)}
                          placeholder={t("tax")}
                          className="w-full dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600"
                          min="0"
                          step="0.01"
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
                            <FaDollarSign className="text-gray-400" />
                            {t("paymentAmount")} <span className="text-red-500">*</span>
                          </span>
                        </div>
                        <Input
                          type="number"
                          name="payment"
                          value={formData.payment}
                          onChange={(value) => handleInputChange("payment", value)}
                          placeholder={t("enterAmount")}
                          className={`w-full dark:!bg-gray-700 dark:!text-gray-200 dark:!border-gray-600 ${
                            fieldErrors.payment ? "border-red-500" : ""
                          }`}
                          min="0"
                          step="0.01"
                        />
                        {fieldErrors.payment && (
                          <div className="mt-1 text-sm text-red-500">{fieldErrors.payment}</div>
                        )}
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
                      <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                        <span className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          {t("createdBy")}
                        </span>
                      </label>
                      <RichSearch
                        data={createUser}
                        value={formData.created_by}
                        placeholder={t("selectcreatedBy")}
                        keyFields={{
                          id: "id",
                          title: "username",
                          image: "image",
                        }}
                        onSelected={handleUserSelect}
                      />
                    </div>
                    </div>

                    <Divider className="my-4 dark:!border-gray-700" />

                    <div className="flex justify-between text-lg font-bold">
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
                        className={`font-bold ${
                          formData.balance > 0
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
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">
                          {formData.items.length}
                        </div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center dark:!bg-green-900/20">
                        <div className="text-sm text-gray-600 dark:!text-gray-400">{t("status")}</div>
                        <div className="text-xl font-bold text-gray-800 dark:!text-gray-100">
                          {STATUS_OPTIONS.find((option) => option.value === Number(formData.status))?.label || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2">
                      <Button type="submit" disabled={loading || orderByIdLoading} variant="primary" outline={false}>
                        <FaSave />
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        outline={true}
                        onClick={() => window.history.back()}
                      >
                        <FaTimes />
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderInvoiceForm;
