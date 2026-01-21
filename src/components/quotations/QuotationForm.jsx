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
import { DatePicker, Select, Tag, Avatar, Input, InputNumber, Divider } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaSave, FaTimes, FaBox, FaPalette, FaRuler } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import dayjs from 'dayjs'; // Import dayjs instead of moment
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { scale } from "framer-motion";
import { currencyFormat, totalPirceQuanDiscount } from "../../services/serviceFunction";
import { useGetAllQuoteQuery, useGetQuoteByIdQuery } from "../../../app/Features/quoteSlice";

const { Option } = Select;

const QuotationForm = () => {
    const { id } = useParams(); // Get stock ID from URL if editing
    const isEditMode = Boolean(id);
    const [stocktype, setstocktype] = useState([]);
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
    const itemsRes = useGetAllSaleQuery(token);
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

        setfielditems(itemsRes.data?.data || []);
        setitems(itemsRes.data?.data || []);
        setAllItems(itemsRes.data?.data || []);
    }, [stockRes.data, itemsRes.data, warehouseRes.data]);

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
                navigator("/dashboard/quotations");
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

    // Calculate totals for display
    useEffect(() => {
        if (selectItems.length > 0) {
            calculateForm(selectItems, form);
        }
    }, [selectItems.length]);

    return (
        <section className="px-6 py-6 bg-gray-50 min-h-screen">
            <AlertBox
                isOpen={alertBox}
                title="Confirmation"
                message={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this quote?`}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={isEditMode ? "Update" : "Create"}
                cancelText="Cancel"
            />

            <div className=" mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {isEditMode ? 'Edit Quote' : 'Create New Quote'}
                        </h1>
                        <p className="text-gray-600">
                            {isEditMode ? `Editing Quote ID: ${id}` : 'Create a new quotation for customer'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            {isEditMode ? `Quote #: ${stockData?.data?.quote_number || id}` : 'New Quote'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
                            <div className="flex items-center gap-3">
                                <MdLocalShipping className="text-2xl text-blue-600" />
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {isEditMode ? 'Edit Quote Information' : 'Quote Information'}
                                </h2>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left Column - Form Controls */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Search Items */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            <span className="text-red-500">*</span> Search Items
                                        </label>
                                        <Select
                                            onSelect={onSelectItem}
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="Search items by name..."
                                            size="large"
                                            filterOption={(input, option) =>
                                                option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            optionLabelProp="name"
                                        >
                                            {fielditems?.map((item) => (
                                                <Option key={item.id} value={item.id} name={item.name}>
                                                    <div className="flex items-center gap-3 py-1">
                                                        <Avatar
                                                            size="small"
                                                            src={item.image}
                                                            icon={<FaBox />}
                                                            className="border border-gray-200"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">
                                                                {item.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {item.code} • {item.brand_name}
                                                            </div>
                                                        </div>
                                                        <Tag color="blue" className="ml-auto">
                                                            ${item.price}
                                                        </Tag>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Search Customers */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            <span className="text-red-500">*</span> Search Customers
                                        </label>
                                        <Select
                                            value={form.customer_id || undefined}
                                            onSelect={onSelectCustmer}
                                            showSearch
                                            style={{ width: '100%' }}
                                            placeholder="Search Customer by name..."
                                            size="large"
                                            filterOption={(input, option) =>
                                                option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            optionLabelProp="name"
                                        >
                                            {customers?.data?.map((c) => (
                                                <Option key={c.customer_id} value={c.customer_id} name={c.customer_name}>
                                                    <div className="flex items-center gap-3 py-1">
                                                        <Avatar
                                                            size="small"
                                                            src={c.image}
                                                            icon={<FaBox />}
                                                            className="border border-gray-200"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">
                                                                {c.customer_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Quote Details Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 space-y-4">
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                            <FaEdit className="text-blue-500" />
                                            Quote Details
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quote Date
                                                </label>
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    value={form.date ? dayjs(form.date) : null}
                                                    onChange={(date, dateString) => {
                                                        setForm(prev => {
                                                            const term = prev.credit_term || 0;
                                                            return {
                                                                ...prev,
                                                                date: dateString,
                                                                date_term: date
                                                                    ? dayjs(date).add(term, "day").format("YYYY-MM-DD")
                                                                    : null
                                                            };
                                                        });
                                                    }}
                                                    className="w-full"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Term (Days)
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={form.credit_term || ""}
                                                    onChange={(e) => {
                                                        const term = Number(e.target.value || 0);
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

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Expire Date
                                                </label>
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    value={form.date_term ? dayjs(form.date_term) : null}
                                                    disabled
                                                    className="w-full"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Delivery Fee
                                                    </label>
                                                    <InputNumber
                                                        type="number"
                                                        name='delivery_fee'
                                                        value={form.delivery_fee}
                                                        onChange={(value) => {
                                                            setForm(prev => ({ ...prev, delivery_fee: value }));
                                                            calculateForm(selectItems, { ...form, delivery_fee: value });
                                                        }}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Tax %
                                                    </label>
                                                    <InputNumber
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        name='tax'
                                                        value={form.tax}
                                                        onChange={(value) => {
                                                            setForm(prev => ({ ...prev, tax: value }));
                                                            calculateForm(selectItems, { ...form, tax: value });
                                                        }}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>

                                            {isEditMode && <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Status
                                                </label>
                                                <Select
                                                    value={form.status}
                                                    onChange={(value) => setForm(prev => ({ ...prev, status: value }))}
                                                    className="w-full"
                                                >
                                                    <Option value="draft">Draft</Option>
                                                    <Option value="submitted">Submitted</Option>
                                                    <Option value="approved">Approved</Option>
                                                    <Option value="rejected">Rejected</Option>
                                                    <Option value="converted">Converted to Order</Option>
                                                </Select>
                                            </div>}

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes
                                                </label>
                                                <Input.TextArea
                                                    value={form.notes}
                                                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                                    rows={3}
                                                    placeholder="Additional notes or comments..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-gray-200 space-y-4">
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                            <FaEdit className="text-purple-500" />
                                            Summary
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Sub Total:</span>
                                                <span className="font-semibold">${Number(form.order_total || 0)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Delivery Fee:</span>
                                                <span className="font-semibold">${Number(form.delivery_fee || 0)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Discount:</span>
                                                <span className="font-semibold text-green-600">-${Number(form.total_discount || 0)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Tax ({form.tax}%):</span>
                                                <span className="font-semibold text-orange-600">${Number(form.tax_amount || 0)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                            <Divider className="my-2" />
                                            <div className="flex justify-between text-lg font-bold">
                                                <span className="text-gray-800">Grand Total:</span>
                                                <span className="text-blue-600">${Number(form.grand_total || 0)?.toFixed(2) || '0.00'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={selectItems.length === 0 || !form.customer_id}
                                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${selectItems.length === 0 || !form.customer_id
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                                }`}
                                        >
                                            {isEditMode ? <FaSave /> : <MdLocalShipping />}
                                            {isEditMode ? 'Update Quote' : 'Create Quote'}
                                        </button>
                                        <Link to="/dashboard/quotations" className="flex-1">
                                            <button
                                                type="button"
                                                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                                            >
                                                <FaTimes />
                                                Cancel
                                            </button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Right Column - Selected Items */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        {/* Items Header */}
                                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Selected Items</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {selectItems.length} item(s) selected •
                                                        Total Quantity: {selectItems?.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} •
                                                        SubTotal: ${Number(form.order_total || 0)?.toFixed(2) || '0.00'}
                                                    </p>
                                                </div>
                                                <Tag color={isEditMode ? "orange" : "blue"} className="font-medium text-sm">
                                                    {isEditMode ? 'Editing Mode' : 'Creating Mode'}
                                                </Tag>
                                            </div>
                                        </div>

                                        {/* Items Table */}
                                        {selectItems.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Item</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Discount %</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {selectItems.map((item, index) => {
                                                            return (
                                                                <tr key={index} className="hover:bg-blue-50/30 transition-colors text-sm">
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-medium text-gray-900">{index + 1}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar
                                                                                size="large"
                                                                                src={item.image}
                                                                                icon={<FaBox />}
                                                                                className="border border-gray-200"
                                                                            />
                                                                            <div>
                                                                                <div className="font-medium text-gray-900">{item.name || item.item_name}</div>
                                                                                <div className="text-sm text-gray-500">{item.code || item.item_code}</div>
                                                                                {item.brand_name && (
                                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                                        <Tag color="blue" size="small">{item.brand_name}</Tag>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <InputNumber
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={item.price}
                                                                            onChange={(value) => handleChange(index, "price", value)}
                                                                            className="w-24"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <InputNumber
                                                                            type="number"
                                                                            min="1"
                                                                            max={item?.in_stock}
                                                                            value={item.quantity}
                                                                            onChange={(value) => handleChange(index, 'quantity', value)}
                                                                            className="w-24"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <InputNumber
                                                                            type="number"
                                                                            // step="0.01"
                                                                            min="0"
                                                                            max="100"
                                                                            value={item.discount}
                                                                            onChange={(value) => handleChange(index, "discount", value)}
                                                                            className="w-24"
                                                                        // formatter={value => `${value}%`}
                                                                        // parser={value => value.replace('%', '')}
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 font-semibold">
                                                                        ${item.total || '0.00'}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <button
                                                                            onClick={() => handleRemove(index)}
                                                                            type="button"
                                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title="Remove item"
                                                                        >
                                                                            <FaTrash />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FaBox className="text-3xl text-blue-500" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Items Selected</h3>
                                                <p className="text-gray-500 max-w-md mx-auto mb-6">
                                                    Search and select items from the left panel to add them to your quote.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Footer */}
                                    {selectItems.length > 0 && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                                <div className="text-sm text-green-800 mb-1">Total Items</div>
                                                <div className="text-2xl font-bold text-green-900">{selectItems.length}</div>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                <div className="text-sm text-blue-800 mb-1">Total Quantity</div>
                                                <div className="text-2xl font-bold text-blue-900">
                                                    {selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                                <div className="text-sm text-purple-800 mb-1">Grand Total</div>
                                                <div className="text-2xl font-bold text-purple-900">
                                                    ${Number(form.grand_total || 0)?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default QuotationForm;