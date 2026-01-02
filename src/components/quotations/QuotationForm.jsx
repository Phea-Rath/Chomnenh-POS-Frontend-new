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
import { DatePicker, Select, Tag, Avatar, Input } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaSave, FaTimes, FaBox, FaPalette, FaRuler } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import dayjs from 'dayjs'; // Import dayjs instead of moment

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
    const [warehouses, setwarehouses] = useState([]);
    const [toWarehouse, settoWarehouse] = useState([]);
    const [itemLists, setItemLists] = useState([]);
    const token = localStorage.getItem("token");
    const { setLoading } = useOutletsContext();
    const { refetch: wasteRefetch } = useGetAllWasteQuery(token);
    const { refetch } = useGetAllStockQuery(token);
    const stockRes = useGetAllStockTypesQuery(token);
    const navigator = useNavigate();
    const itemsRes = useGetAllItemsQuery(token);
    const allItemsRes = useGetAllItemsQuery(token);
    const saleItemContext = useGetAllSaleQuery(token);
    const warehouseRes = useGetAllWarehousesQuery(token);
    const [attributes, setAttribute] = useState([]);

    // Get stock data for edit mode
    const { data: stockData, refetch: refetchQuote } = useGetStockByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

    // Initialize form state
    const [form, setForm] = useState({
        from_warehouse: 2,
        warehouse_id: 1,
        stock_type_id: 2,
        stock_remark: "",
        order_id: null,
        stock_date: new Date().toISOString().split('T')[0], // Today's date
    });

    useEffect(() => {
        setfielditems(itemsRes.data?.data || []);
        setitems(itemsRes.data?.data || []);
        setAllItems(allItemsRes?.data?.data || []);
        const newWare = warehouseRes.data?.data?.filter(
            (item) =>
                item.warehouse_id !== 2 &&
                item.warehouse_id !== 3 &&
                item.warehouse_id !== 4
        );
        settoWarehouse(newWare || []);
    }, [stockRes.data, itemsRes.data, warehouseRes.data]);

    // Load existing stock data when in edit mode
    useEffect(() => {
        if (isEditMode && stockData?.data) {
            const data = stockData.data;

            // Set form data
            setForm({
                from_warehouse: data.from_warehouse || 2,
                warehouse_id: data.warehouse_id || 1,
                stock_type_id: data.stock_type_id || 2,
                stock_remark: data.stock_remark || "",
                order_id: data.order_id || null,
                stock_date: data.stock_date || new Date().toISOString().split('T')[0],
            });

            // Set selected items
            if (data.items && Array.isArray(data.items)) {
                // Map items to selectItems format
                const mappedSelectItems = data.items.map(item => ({
                    id: item.item_id,
                    code: item.item_code,
                    name: item.item_name,
                    image: item.images[0].image,
                    price: item.item_price,
                    brand_name: item.brand_name,
                    quantity: item.quantity,
                    item_cost: item.item_cost,
                    attributes: item.attributes || [],
                    expire_date: item.expire_date
                }));

                setselectItems(mappedSelectItems);

                // Map items to itemLists format
                const mappedItemLists = data.items.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity,
                    item_cost: item.item_cost,
                    expire_date: item.expire_date,
                    attributes: item.attributes || []
                }));

                setItemLists(mappedItemLists);
            }
        }
    }, [isEditMode, stockData]);

    function onSelectItem(value) {
        const finding = items.find((exp) => exp.id == value);
        if (!finding) return;
        if (selectItems.some((exp) => exp.id == value)) {
            setselectItems((prev) =>
                prev.map((item) =>
                    item.id == value
                        ? { ...item, quantity: (parseInt(item.quantity) || 0) + 1 }
                        : item
                )
            );
            setItemLists((prev) =>
                prev.map((item) =>
                    item.item_id == value
                        ? { ...item, quantity: (parseInt(item.quantity) || 0) + 1 }
                        : item
                )
            );
            return;

        }
        // Add new item
        const newItem = {
            ...finding,
            quantity: 1,
            expire_date: new Date().toISOString().split('T')[0]
        };
        setselectItems(prev => [...prev, newItem]);

        // Extract attributes from item data if available
        // const itemAttributes = finding.attributes || [];
        setItemLists(prev => [...prev, {
            item_id: value,
            item_cost: 0,
            quantity: 1,
            expire_date: new Date().toISOString().split('T')[0],
            attributes: []
        }]);
    }

    const handleChange = (index, field, attr, value) => {

        if (attr) {
            // Update attribute
            setItemLists(prev => {
                const updated = [...prev]; // clone outer array

                const item = { ...updated[index] }; // clone the item
                const attrs = [...item.attributes]; // clone the attributes array

                const existingAttrIndex = attrs.findIndex(a => a.name === field);

                if (existingAttrIndex !== -1) {
                    // update existing attribute
                    attrs[existingAttrIndex] = {
                        ...attrs[existingAttrIndex],
                        value: value
                    };
                } else {
                    // add new attribute
                    attrs.push({ name: field, value: value });
                }

                item.attributes = attrs;  // assign cloned updated array
                updated[index] = item;    // update cloned list

                return updated;           // return new list (immutable)
            });

        } else {

            // Update regular field
            setItemLists(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    [field]: value
                };
                return updated;
            });

            // Also update selectItems for display
            if (field === 'quantity') {
                setselectItems(prev => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        quantity: parseInt(value) || 0
                    };
                    return updated;
                });
            }
            if (field === 'item_cost') {
                setselectItems(prev => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        item_cost: value || 0
                    };
                    return updated;
                });
            }
        }
    };

    function handleRemove(i) {
        const filtering = selectItems.filter((exp, index) => index != i);
        const filteringList = itemLists.filter((exp, index) => index != i);
        setselectItems(filtering);
        setItemLists(filteringList);
    }

    async function handleConfirm() {
        setAlertBox(false);
        setLoading(true);

        try {
            const payload = {
                ...form,
                items: itemLists.map(item => ({
                    item_id: item.item_id,
                    quantity: parseInt(item.quantity) || 1,
                    item_cost: item.item_cost || 1,
                    expire_date: item.expire_date || new Date().toISOString().split('T')[0],
                    attributes: item.attributes || []
                }))
            };

            console.log(payload);


            let response;
            if (isEditMode) {
                response = await api.put(`/stock_masters/${id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            } else {
                response = await api.post(`/stock_masters`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            }

            if (response.data.status === 200) {
                refetch();
                if (isEditMode) refetchQuote();
                saleItemContext.refetch();
                wasteRefetch();
                setLoading(false);
                toast.success(
                    response.data.message || `Quote ${isEditMode ? 'updated' : 'created'} successfully`
                );
                navigator("/dashboard/stock-list");
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setLoading(false);
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                `An error occurred while ${isEditMode ? 'updating' : 'creating'} the stock`
            );
        }
    }

    function handleCancel() {
        setAlertBox(false);
    }

    function handleSubmit(e) {
        console.log(form, itemLists);

        e.preventDefault();
        if (selectItems.length === 0) {
            toast.error("Please add at least one item to the stock");
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
        console.log(attr);

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
            </div>);
    };

    return (
        <section className="px-6 py-6 bg-gray-50 min-h-screen">
            <AlertBox
                isOpen={alertBox}
                title="Confirmation"
                message={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this stock record?`}
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
                            {isEditMode ? 'Edit Quote Record' : 'Create Quote In'}
                        </h1>
                        <p className="text-gray-600">
                            {isEditMode ? 'Update existing stock transfer' : 'Add new items to inventory'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Quote No: {isEditMode ? stockData?.data?.stock_no : 'Auto-generated'}
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

                                    {/* Quote Details Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 space-y-4">
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                            <FaEdit className="text-blue-500" />
                                            Quote Details
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    From Warehouse
                                                </label>
                                                <select
                                                    onChange={(e) => setForm(prev => ({ ...prev, from_warehouse: e.target.value }))}
                                                    value={form.from_warehouse}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                    required
                                                >
                                                    <option value={2}>PO</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quote Type
                                                </label>
                                                <select
                                                    value={form.stock_type_id}
                                                    onChange={(e) => setForm(prev => ({ ...prev, stock_type_id: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                    required
                                                >
                                                    <option value={2}>Quote In</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    To Warehouse <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={form.warehouse_id}
                                                    onChange={(e) => setForm(prev => ({ ...prev, warehouse_id: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                    required
                                                >
                                                    <option value="" disabled>Select warehouse</option>
                                                    {toWarehouse?.map((item) => (
                                                        <option key={item.warehouse_id} value={item.warehouse_id}>
                                                            {item.warehouse_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Quote Date
                                                </label>
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    value={form.stock_date ? dayjs(form.stock_date) : dayjs()} // Use dayjs instead of moment
                                                    onChange={(date, dateString) => setForm(prev => ({ ...prev, stock_date: dateString }))}
                                                    className="w-full"
                                                    size="middle"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Remarks
                                                </label>
                                                <textarea
                                                    value={form.stock_remark}
                                                    onChange={(e) => setForm(prev => ({ ...prev, stock_remark: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                                                    placeholder="Enter any remarks or notes..."
                                                    rows="3"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={selectItems.length === 0}
                                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${selectItems.length === 0
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                                }`}
                                        >
                                            {isEditMode ? <FaSave /> : <MdLocalShipping />}
                                            {isEditMode ? 'Update Quote' : 'Create Quote'}
                                        </button>
                                        <Link to="/dashboard/stock-list" className="flex-1">
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
                                                        Total Quantity: {selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} •
                                                        Total Value: ${selectItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0).toFixed(2)}
                                                    </p>
                                                </div>
                                                <Tag color="blue" className="font-medium text-sm">
                                                    Edit Mode: {isEditMode ? 'Update' : 'Create'}
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
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Attributes</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cost</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expire Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {selectItems.map((item, index) => {
                                                            const itemAttributes = getItemAttributes(item.id);
                                                            return (
                                                                <tr key={index} className="hover:bg-blue-50/30 transition-colors">
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
                                                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                                                <div className="text-sm text-gray-500">{item.code}</div>
                                                                                <div className="text-xs text-gray-400 mt-1">
                                                                                    <Tag color="blue" size="small">{item.brand_name}</Tag>
                                                                                    <Tag color="green" size="small">${item.price}</Tag>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="space-y-2">
                                                                            {itemAttributes.map((attr, attrIndex) => (
                                                                                <div key={attrIndex} className="flex items-center gap-2">
                                                                                    <span className="text-xs font-medium text-gray-600 w-16">
                                                                                        {attr.name}:
                                                                                    </span>
                                                                                    {renderAttributeSelect(attr)}
                                                                                </div>
                                                                            ))}
                                                                            {itemAttributes.length === 0 && (
                                                                                <span className="text-sm text-gray-400">No attributes</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <Input
                                                                            type="number"
                                                                            step="any"
                                                                            value={item?.item_cost ?? ""}
                                                                            onChange={(e) =>
                                                                                handleChange(index, "item_cost", false, e.target.value)
                                                                            }
                                                                            className="w-24 text-center"
                                                                            size="middle"
                                                                        />

                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={item.quantity || 1}
                                                                            onChange={(e) => handleChange(index, 'quantity', false, e.target.value)}
                                                                            className="w-24 text-center"
                                                                            size="middle"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <DatePicker
                                                                            format="YYYY-MM-DD"
                                                                            value={itemLists[index]?.expire_date ? dayjs(itemLists[index].expire_date) : null} // Use dayjs instead of moment
                                                                            onChange={(date, dateString) => handleChange(index, 'expire_date', false, dateString)}
                                                                            className="w-full"
                                                                            size="middle"
                                                                        />
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
                                                    Search and select items from the left panel to add them to your stock record.
                                                </p>
                                                <div className="flex justify-center gap-3">
                                                    <Tag color="blue" className="text-sm">Step 1: Search items</Tag>
                                                    <Tag color="green" className="text-sm">Step 2: Configure attributes</Tag>
                                                    <Tag color="purple" className="text-sm">Step 3: Set quantities</Tag>
                                                </div>
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
                                                <div className="text-sm text-purple-800 mb-1">Total Value</div>
                                                <div className="text-2xl font-bold text-purple-900">
                                                    ${selectItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0).toFixed(2)}
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