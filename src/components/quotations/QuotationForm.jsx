import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import api from "../../services/api";
import { useGetAllStockTypesQuery } from "../../../app/Features/stockTypesSlice";
import {
    useGetAllItemsQuery,
} from "../../../app/Features/itemsSlice";
import { useGetAllWarehousesQuery } from "../../../app/Features/warehousesSlice";
import {
    useGetAllStockQuery,
    useGetStockByIdQuery,
} from "../../../app/Features/stocksSlice";
import { DatePicker, Tag, Avatar, Divider, Alert } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { toast } from "react-toastify";
import {
    FaTrash,
    FaEdit,
    FaSave,
    FaTimes,
    FaBox,
    FaPalette,
    FaRuler,
    FaWarehouse,
    FaUser,
    FaCalendarAlt,
    FaLayerGroup,
    FaPercent,
    FaTruck,
    FaFileInvoice,
} from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import dayjs from 'dayjs';
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { currencyFormat, totalPirceQuanDiscount } from "../../services/serviceFunction";
import { useGetAllQuoteQuery, useGetQuoteByIdQuery } from "../../../app/Features/quoteSlice";
import { useDebounce } from "use-debounce";
import { useTranslation } from "react-i18next";
import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import ItemTable from "../../utils/ItemTable";

const QuotationForm = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams(); // Get stock ID from URL if editing
    const isEditMode = Boolean(id);
    const [stocktype, setstocktype] = useState([]);

    const toggleLanguage = () => {
        const newLang = i18n.language === "en" ? "kh" : "en";
        i18n.changeLanguage(newLang);
        localStorage.setItem("language", newLang);
        localStorage.setItem("i18nextLng", newLang);
    };

    useEffect(() => {
        const savedLang = localStorage.getItem("language");
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }
    }, [i18n]);

    const [search, setSearch] = useState("");
    const [debounce] = useDebounce(search, 500);
    const [alertBox, setAlertBox] = useState(false);
    const [items, setitems] = useState([]);
    const [fielditems, setfielditems] = useState([]);
    const [selectItems, setselectItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [itemLists, setItemLists] = useState([]);
    const token = localStorage.getItem("token");
    const { setLoading } = useOutletsContext();
    const { refetch } = useGetAllQuoteQuery(token);
    const stockRes = useGetAllStockTypesQuery(token);
    const navigator = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const itemsRes = useGetAllSaleQuery({ token, limit, page: currentPage, search: debounce });
    const { data: customers } = useGetAllCustomerQuery(token);
    const warehouseRes = useGetAllWarehousesQuery(token);

    // Get stock data for edit mode
    const { data: stockData, refetch: refetchQuote } = useGetQuoteByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

    // Initialize form state
    const [form, setForm] = useState({
        customer_id: 0,
        date: new Date().toISOString().split('T')[0],
        credit_term: 0,
        date_term: "",
        order_total: 0,
        delivery_fee: 0,
        total_discount: 0,
        tax: 0,
        tax_amount: 0,
        grand_total: 0,
        status: "draft",
        notes: "",
        items: [],
    });

    useEffect(() => {

        setitems(itemsRes.data?.data || []);
        setAllItems(itemsRes.data?.data || []);
    }, [stockRes.data, itemsRes.data, warehouseRes.data]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debounce]);

    useEffect(() => {
        const selectedIds = new Set(selectItems.map((item) => item.id));
        setfielditems(items.filter((item) => !selectedIds.has(item.id)));
    }, [items, selectItems]);

    // Load existing stock data when in edit mode
    useEffect(() => {
        if (isEditMode && stockData?.data) {
            const data = stockData.data;


            // Set form data from API response
            setForm({
                customer_id: data.customer_id || 0,
                date: data.date || new Date().toISOString().split('T')[0],
                credit_term: data.credit_term || 0,
                date_term: data.date_term || "",
                order_total: data.order_total || 0,
                delivery_fee: data.delivery_fee || 0,
                total_discount: data.total_discount || 0,
                tax: data.tax || 0,
                tax_amount: data.tax_amount || 0,
                grand_total: data.grand_total || 0,
                status: data.status || "draft",
                notes: data.notes || "",
                items: data.items || [],
            });

            // Set selected items from API response
            if (data.details && Array.isArray(data.details)) {
                console.log(items);

                const mappedSelectItems = data.details.map(item => ({
                    id: item.item_id,
                    item_id: item.item_id, // Add item_id for consistency
                    code: item.item_code || item.code,
                    name: item.item_name || item.name,
                    image: item.images?.[0]?.image || item.image,
                    price: item.item_price || item.price || 0,
                    brand_name: item.brand_name || "",
                    quantity: item.quantity || 1,
                    in_stock: '',
                    discount: Number(item.discount) || 0,
                    scale: item.scale_name || "",
                    total: calculateItemTotal(item),
                    barcode: item.barcode || "",
                    attributes: item.attributes || []
                }));

                setselectItems(mappedSelectItems);
                console.log("Loaded selectItems in edit mode:", mappedSelectItems);
            }
        }
    }, [isEditMode, stockData]);

    // Calculate item total for edit mode
    const calculateItemTotal = (item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.item_price || item.price) || 0;
        const discount = parseFloat(item.discount) || 0;

        const subtotal = quantity * price;
        const discountAmount = subtotal * (discount / 100);
        return (subtotal - discountAmount).toFixed(2);
    };

    function onSelectItem(value) {
        const item = items.find((exp) => exp.id == value);
        if (!item) return;

        // Check if item already exists
        const existingItemIndex = selectItems.findIndex((exp) => exp.id == value);

        if (existingItemIndex !== -1) {
            // Update existing item quantity
            setselectItems(prev => {
                const updated = [...prev];
                updated[existingItemIndex] = {
                    ...updated[existingItemIndex],
                    quantity: (parseInt(updated[existingItemIndex].quantity) || 0) + 1,
                    total: calculateItemTotal({
                        ...updated[existingItemIndex],
                        quantity: (parseInt(updated[existingItemIndex].quantity) || 0) + 1
                    })
                };
                calculateForm(updated, form);
                return updated;
            });
            return;
        }

        // Add new item
        const newItem = {
            id: item.id,
            item_id: item.id,
            code: item.code,
            name: item.name,
            image: item.image,
            price: item.price || 0,
            brand_name: item.brand_name || "",
            quantity: 1,
            in_stock: item.in_stock,
            discount: 0,
            scale: item.scale_name || "",
            total: calculateItemTotal({
                quantity: 1,
                price: item.price || 0,
                discount: 0
            }),
            barcode: item.barcode || "",
            attributes: item.attributes || []
        };

        setselectItems(prev => {
            const updated = [...prev, newItem];
            calculateForm(updated, form);
            return updated;
        });
    }

    const onSelectCustmer = (value) => {
        setForm(prev => ({ ...prev, customer_id: value }));
    }

    const calculateForm = (data, form) => {
        setForm(prev => {
            // Calculate order total
            const order_total = totalPirceQuanDiscount(data, 'price', 'quantity');

            // Calculate total discount (sum of individual item discounts)
            const total_discount = data.reduce((sum, item) => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseFloat(item.quantity) || 0;
                const discount = parseFloat(item.discount) || 0;
                const itemSubtotal = price * quantity;
                const itemDiscount = itemSubtotal * (discount / 100);
                return sum + itemDiscount;
            }, 0);

            // Calculate tax amount
            const tax_rate = parseFloat(prev.tax) || 0;
            const tax_amount = order_total * (tax_rate / 100);

            // Calculate grand total (order_total + delivery_fee + tax_amount)
            const grand_total = order_total + (parseFloat(form.delivery_fee) || 0) + tax_amount;

            return {
                ...prev,
                order_total,
                grand_total,
                total_discount: parseFloat(total_discount.toFixed(2)),
                tax_amount: parseFloat(tax_amount.toFixed(2))
            };
        });
    }

    // Handle field changes in items
    const handleChange = (index, field, value) => {
        setselectItems(prev => {
            const updated = [...prev];

            // Update the field
            updated[index] = {
                ...updated[index],
                [field]: value
            };

            // Recalculate total for this item
            const quantity = parseFloat(updated[index].quantity) || 0;
            const price = parseFloat(updated[index].price) || 0;
            const discount = parseFloat(updated[index].discount) || 0;

            const subtotal = quantity * price;
            const discountAmount = subtotal * (discount / 100);
            updated[index].total = (subtotal - discountAmount).toFixed(2);

            // Recalculate form totals
            calculateForm(updated, form);

            return updated;
        });
    };

    function handleRemove(i) {
        const filtering = selectItems.filter((exp, index) => index != i);
        setselectItems(filtering);
        calculateForm(filtering, form);
    }

    async function handleConfirm() {
        setAlertBox(false);
        setLoading(true);

        try {
            // Prepare items array for API
            const itemsPayload = selectItems.map(item => ({
                item_id: item.id,
                item_name: item.name,
                quantity: item.quantity,
                discount: item.discount,
                price: item.price
                // Add other fields if needed by your API
            }));

            const payload = {
                ...form,
                items: itemsPayload
            };

            console.log("Submitting payload:", payload);

            let response;
            if (isEditMode) {
                response = await api.put(`/quotations/${id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            } else {
                response = await api.post(`/quotations`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            }

            if (response.data.status === 200) {
                refetch();
                if (isEditMode) refetchQuote();
                setLoading(false);
                toast.success(
                    response.data.message || `Quote ${isEditMode ? 'updated' : 'created'} successfully`
                );
                navigator(-1);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setLoading(false);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                `An error occurred while ${isEditMode ? 'updating' : 'creating'} the quote`
            );
        }
    }

    function handleCancel() {
        setAlertBox(false);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (selectItems.length === 0) {
            toast.error("Please add at least one item to the quote");
            return;
        }
        if (!form.customer_id) {
            toast.error("Please select a customer");
            return;
        }
        setAlertBox(true);
    }

    const getItemAttributes = (itemId) => {
        const item = items.find(i => i.id == itemId);
        if (item && item.attributes) {
            return item.attributes.filter(attr => attr.type === 'select');
        }
        return [];
    };

    const renderAttributeSelect = (attr) => {
        return (
            <div className="flex flex-wrap text-[10px]">
                {
                    attr.type == 'select' && attr?.value?.map((val, vIdx) =>
                        attr.name === 'colors' ? (
                            <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: val.value }}
                            />
                        ) : (
                            <div className="border border-green-400 px-1 m-[1px] rounded-md">{val.value}</div>
                        )
                    )}
            </div>
        );
    };

    const onScrollFetch = (e) => {
        const target = e.target;
        const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        if (nearBottom && itemsRes?.data?.pagination?.total > items?.length) {
            setLimit(prev => prev + 10);
        }
    }

    // Calculate totals for display
    useEffect(() => {
        if (selectItems.length > 0) {
            calculateForm(selectItems, form);
        }
    }, [selectItems.length]);

    return (
        <div className="bg-transparent py-2 transition-colors min-h-screen">
            <div className="px-2">
                <AlertBox
                    isOpen={alertBox}
                    title={t('confirmation')}
                    message={t('confirmCreateQuoteMsg', { action: isEditMode ? t('update') : t('create') })}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmText={isEditMode ? t('update') : t('create')}
                    cancelText={t('cancel')}
                />

                <div className="mb-8">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:!text-gray-100">
                                {isEditMode ? t('editQuote') : t('createQuote')}
                            </h1>
                            <p className="mt-2 text-gray-600 dark:!text-gray-400">
                                {isEditMode ? t('editingQuoteId', { id }) : t('createQuotationForCustomer')}
                            </p>
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button type="button" onClick={handleSubmit} disabled={setLoading === true} variant="primary" outline={false}>
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
                                        <div className="grow min-w-[200px]">
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                                                <span className="flex items-center gap-2">
                                                    <FaUser className="text-gray-400" />
                                                    {t("customer")}
                                                </span>
                                            </label>
                                            <RichSearch
                                                data={customers?.data || []}
                                                value={form.customer_id}
                                                placeholder={t("selectcustomer")}
                                                keyFields={{
                                                    id: "customer_id",
                                                    title: "customer_name",
                                                    image: "image",
                                                    subtitle: "customer_tel",
                                                }}
                                                onSelected={onSelectCustmer}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                                                <span className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {t("quoteDate")}
                                                </span>
                                            </label>
                                            <DatePicker
                                                className="date-picker w-full"
                                                size="middle"
                                                value={form.date ? dayjs(form.date) : null}
                                                onChange={(_, dateString) => {
                                                    setForm(prev => {
                                                        const term = prev.credit_term || 0;
                                                        return {
                                                            ...prev,
                                                            date: dateString,
                                                            date_term: dateString
                                                                ? dayjs(dateString).add(term, "day").format("YYYY-MM-DD")
                                                                : null
                                                        };
                                                    });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                                                <span className="flex items-center gap-2">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {t("termDays")}
                                                </span>
                                            </label>
                                            <Input
                                                type="number"
                                                value={form.credit_term}
                                                onChange={(value) => {
                                                    const term = Number(value || 0);
                                                    setForm(prev => ({
                                                        ...prev,
                                                        credit_term: term,
                                                        date_term: prev.date
                                                            ? dayjs(prev.date).add(term, "day").format("YYYY-MM-DD")
                                                            : null
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {isEditMode && <div>
                                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                                                {t("status")}
                                            </label>
                                            <RichSearch
                                                data={[
                                                    { id: "draft", title: t('draft') },
                                                    { id: "submitted", title: t('submitted') },
                                                    { id: "approved", title: t('approved') },
                                                    { id: "rejected", title: t('rejected') },
                                                    { id: "converted", title: t('converted') },
                                                ]}
                                                value={form.status}
                                                onSelected={(value) => setForm(prev => ({ ...prev, status: value }))}
                                                keyFields={{ id: "id", title: "title" }}
                                            />
                                        </div>}
                                    </div>
                                </div>
                            </div>

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
                                                price: "price",
                                                quantity: "in_stock",
                                            }}
                                            onSelected={onSelectItem}
                                            onSearch={setSearch}
                                            onScrollReader={onScrollFetch}
                                        />
                                    </div>
                                </div>

                                {selectItems.length === 0 ? (
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center dark:!border-gray-700 dark:!bg-blue-900/50">
                                        <FaBox className="mx-auto mb-4 text-4xl text-gray-400 dark:!text-gray-400" />
                                        <p className="mb-4 text-gray-500 dark:!text-gray-400">{t("noItemsAdded")}</p>
                                    </div>
                                ) : (
                                    <ItemTable
                                        priceLabel="price"
                                        t={t}
                                        data={selectItems}
                                        onDelete={handleRemove}
                                        onQtyChange={(index, value) => handleChange(index, 'quantity', value)}
                                        onCostChange={(index, value) => handleChange(index, 'price', value)}
                                        onDiscountChange={(index, value) => handleChange(index, 'discount', value)}
                                        haedTitle={[
                                            { title: t("item"), key: "item" },
                                            { title: t("quantity"), key: "quantity" },
                                            { title: t("price"), key: "price" },
                                            { title: t("discount"), key: "discount" },
                                            { title: t("total"), key: "total" },
                                            { title: "", key: "action" },
                                        ]}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 text-sm">
                            <div>
                                <h2 className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-800 dark:!text-gray-100">
                                    <FaLayerGroup className="text-blue-500" />
                                    {t("summary")}
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:!text-gray-400">{t("subtotal")}</span>
                                        <span className="font-bold text-gray-800 dark:!text-gray-100">
                                            ${Number(form.order_total).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:!text-gray-400">{t("discount")}</span>
                                        <span className="font-bold text-gray-800 dark:!text-gray-100">
                                            ${Number(form.total_discount).toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="grid text-sm grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="flex items-center gap-2 text-gray-600 dark:!text-gray-400">
                                                    <FaPercent className="text-gray-400" />
                                                    {t("tax")} (%)
                                                </span>
                                            </div>
                                            <Input
                                                type="number"
                                                value={form.tax}
                                                onChange={(value) => {
                                                    const tax = Number(value || 0);
                                                    setForm(prev => ({ ...prev, tax }));
                                                    calculateForm(selectItems, { ...form, tax });
                                                }}
                                                placeholder={t("tax")}
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
                                                value={form.delivery_fee}
                                                onChange={(value) => {
                                                    const fee = Number(value || 0);
                                                    setForm(prev => ({ ...prev, delivery_fee: fee }));
                                                    calculateForm(selectItems, { ...form, delivery_fee: fee });
                                                }}
                                                placeholder={t("deliveryFee")}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                                            {t("note")}
                                        </label>
                                        <textarea
                                            value={form.notes}
                                            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            placeholder={t('notePlaceholder') || "Additional notes..."}
                                        />
                                    </div>

                                    <Divider className="my-4 dark:!border-gray-700" />

                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-700 dark:!text-gray-200">{t("grandTotal")}</span>
                                        <span className="text-blue-600 dark:!text-blue-400">
                                            ${Number(form.grand_total).toFixed(2)}
                                        </span>
                                    </div>

                                    <Divider className="my-4 dark:!border-gray-700" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-blue-50 p-3 text-center dark:!bg-blue-900/20">
                                            <div className="text-sm text-gray-600 dark:!text-gray-400">{t("items")}</div>
                                            <div className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                                                {selectItems.length}
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-green-50 p-3 text-center dark:!bg-green-900/20">
                                            <div className="text-sm text-gray-600 dark:!text-gray-400">{t("quantity")}</div>
                                            <div className="text-sm font-bold text-gray-800 dark:!text-gray-100">
                                                {selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
                                            </div>
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

export default QuotationForm;
