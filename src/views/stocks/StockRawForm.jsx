import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import api from "../../services/api";
import { useGetAllStockTypesQuery } from "../../../app/Features/stockTypesSlice";
import { useGetAllRawMaterialQuery } from "../../../app/Features/RawMaterialSlice";
import { useGetAllWarehousesQuery } from "../../../app/Features/warehousesSlice";
import {
    useCreateStockRawMutation,
    useGetAllStockRawQuery,
    useUpdateStockRawMutation,
    useGetStockRawByIdQuery,
} from "../../../app/Features/stocksSlice";
import { DatePicker, Select, Tag, Avatar, Input } from "antd";
import { useDebounce } from "use-debounce";
import dayjs from 'dayjs';
import { toast } from "react-toastify";
import { FaTrash, FaEdit, FaSave, FaTimes, FaBox, FaFlask } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";

const { Option } = Select;

const StockRawForm = () => {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [alertBox, setAlertBox] = useState(false);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [fieldMaterials, setFieldMaterials] = useState([]);
    const [selectMaterials, setSelectMaterials] = useState([]);
    const [allRawMaterials, setAllRawMaterials] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [toWarehouse, setToWarehouse] = useState([]);
    const [materialLists, setMaterialLists] = useState([]);
    const token = localStorage.getItem("token");
    const { setLoading } = useOutletsContext();
    const { refetch: refetchStockRaw } = useGetAllStockRawQuery({ limit: 10, page: 1, search: '', token });
    const stockTypeRes = useGetAllStockTypesQuery(token);
    const navigator = useNavigate();
    const [searchMaterial, setSearchMaterial] = useState('');
    const [debouncedSearch] = useDebounce(searchMaterial, 500);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const rawMaterialRes = useGetAllRawMaterialQuery({ limit: limit, page: currentPage, search: debouncedSearch, token });
    const warehouseRes = useGetAllWarehousesQuery(token);
    const [createStockRaw] = useCreateStockRawMutation();
    const [updateStockRaw] = useUpdateStockRawMutation();

    const { refetch: refetchRawMaterials } = useGetAllRawMaterialQuery({ limit: 10, page: 1, search: '', token });

    // Get stock raw data for edit mode
    const { data: stockRawData, refetch: refetchStockRawById } = useGetStockRawByIdQuery(
        { id, token },
        { skip: !isEditMode }
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    // Initialize form state
    const [form, setForm] = useState({
        from_warehouse: 2,
        warehouse_id: 1,
        stock_type_id: 2,
        stock_remark: "",
        stock_date: dayjs().format('YYYY-MM-DD'),
    });

    useEffect(() => {
        setRawMaterials(rawMaterialRes.data?.data || []);

        setAllRawMaterials(rawMaterialRes?.data?.data || []);
        const newWare = warehouseRes.data?.data?.filter(
            (item) =>
                item.warehouse_id !== 2 &&
                item.warehouse_id !== 3 &&
                item.warehouse_id !== 4
        );
        setToWarehouse(newWare || []);
    }, [stockTypeRes.data, rawMaterialRes.data, warehouseRes.data]);

    useEffect(() => {
        const selectedIds = new Set(selectMaterials.map((item) => item.id));

        setFieldMaterials(rawMaterials.filter((item) => !selectedIds.has(item.id)));
    }, [rawMaterials, selectMaterials]);

    useEffect(() => {
        const total = rawMaterialRes?.data?.pagination?.total || 0;
        if (fieldMaterials.length < 5 && total > rawMaterials.length) {
            setLimit(prev => prev + 10);
        }
    }, [fieldMaterials.length, rawMaterials.length, rawMaterialRes?.data?.pagination?.total]);

    // Load existing stock raw data when in edit mode
    useEffect(() => {
        if (isEditMode && stockRawData?.data) {
            const data = stockRawData.data;

            setForm({
                from_warehouse: data.from_warehouse || 2,
                warehouse_id: data.warehouse_id || 1,
                stock_type_id: data.stock_type_id || 2,
                stock_remark: data.stock_remark || "",
                stock_date: data.stock_date || "",
            });

            if (data.items && Array.isArray(data.items)) {
                const mappedSelectMaterials = data.items.map(item => ({
                    id: item.raw_material_id,
                    code: item.material_code,
                    material_name: item.material_material_name,
                    image: item.material_image || null,
                    price: 0,
                    quantity: parseFloat(item.quantity) || 0,
                    item_cost: parseFloat(item.item_cost) || 0,
                    expire_date: item.expire_date || ''
                }));

                setSelectMaterials(mappedSelectMaterials);

                const mappedMaterialLists = data.items.map(item => ({
                    raw_material_id: item.raw_material_id,
                    quantity: parseFloat(item.quantity) || 0,
                    item_cost: parseFloat(item.item_cost) || 0,
                    expire_date: item.expire_date || ''
                }));

                setMaterialLists(mappedMaterialLists);
            }
        }
    }, [isEditMode, stockRawData]);

    function onSelectMaterial(value) {
        const finding = rawMaterials.find((exp) => exp.id == value);
        if (!finding) return;
        if (selectMaterials.some((exp) => exp.id == value)) {
            setSelectMaterials((prev) =>
                prev.map((item) =>
                    item.id == value
                        ? { ...item, quantity: (parseFloat(item.quantity) || 0) + 1 }
                        : item
                )
            );
            setMaterialLists((prev) =>
                prev.map((item) =>
                    item.raw_material_id == value
                        ? { ...item, quantity: (parseFloat(item.quantity) || 0) + 1 }
                        : item
                )
            );
            return;
        }
        const newMaterial = {
            ...finding,
            quantity: 1,
            item_cost: 0,
            expire_date: ''
        };
        setSelectMaterials(prev => [...prev, newMaterial]);
        setMaterialLists(prev => [...prev, {
            raw_material_id: value,
            item_cost: 0,
            quantity: 1,
            expire_date: ''
        }]);
    }

    const handleChange = (index, field, value) => {
        setMaterialLists(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return updated;
        });

        if (field === 'quantity') {
            setSelectMaterials(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    quantity: parseFloat(value) || 0
                };
                return updated;
            });
        }
        if (field === 'item_cost') {
            setSelectMaterials(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    item_cost: parseFloat(value) || 0
                };
                return updated;
            });
        }
    };

    function handleRemove(i) {
        const filtering = selectMaterials.filter((exp, index) => index != i);
        const filteringList = materialLists.filter((exp, index) => index != i);
        setSelectMaterials(filtering);
        setMaterialLists(filteringList);
    }

    async function handleConfirm() {
        setAlertBox(false);
        setLoading(true);

        try {
            const payload = {
                ...form,
                items: materialLists.map(item => ({
                    raw_material_id: item.raw_material_id,
                    quantity: parseFloat(item.quantity) || 1,
                    item_cost: parseFloat(item.item_cost) || 0,
                    expire_date: item.expire_date || new Date().toISOString().split('T')[0],
                }))
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/stock_masters_raw/${id}`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            } else {
                response = await api.post(`/stock_masters_raw`, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                });
            }

            if (response.data.status === 200) {
                refetchStockRaw();
                if (isEditMode) refetchStockRawById();
                refetchRawMaterials();
                setLoading(false);
                toast.success(
                    response.data.message || `Stock Raw ${isEditMode ? 'updated' : 'created'} successfully`
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
                `An error occurred while ${isEditMode ? 'updating' : 'creating'} the stock raw`
            );
        }
    }

    function handleCancel() {
        setAlertBox(false);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (selectMaterials.length === 0) {
            toast.error("Please add at least one raw material to the stock");
            return;
        }
        setAlertBox(true);
    }

    const onScrollFetch = (e) => {
        const target = e.target;
        const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        if (nearBottom && rawMaterialRes?.data?.pagination?.total > rawMaterials?.length) {
            setLimit(prev => prev + 10);
        }
    }

    return (
        <section className="view-page px-6 py-6 bg-transparent min-h-screen">
            <AlertBox
                isOpen={alertBox}
                title="Confirmation"
                message={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this stock raw record?`}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={isEditMode ? "Update" : "Create"}
                cancelText="Cancel"
            />

            <div className=" mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <MdLocalShipping className="text-2xl text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {isEditMode ? 'Edit Raw Material Stock' : 'Create Raw Material Stock In'}
                        </h1>
                        <p className="text-gray-600">
                            {isEditMode ? 'Update existing raw material stock transfer' : 'Add new raw materials to inventory'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-transparent overflow-hidden">
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                {/* Left Column - Form Controls */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Search Raw Materials */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            <span className="text-red-500">*</span> Search Raw Materials
                                        </label>
                                        <Select
                                            onSelect={onSelectMaterial}
                                            onPopupScroll={onScrollFetch}
                                            showSearch
                                            onSearch={(value) => setSearchMaterial(value)}
                                            style={{ width: '100%' }}
                                            placeholder="Search raw materials by name..."
                                            size="large"
                                            filterOption={(input, option) =>
                                                option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            optionLabelProp="name"
                                        >
                                            {fieldMaterials?.map((item) => (
                                                <Option key={item.id} value={item.id} name={item.material_name}>
                                                    <div className="flex items-center gap-3 py-1">
                                                        <Avatar
                                                            size="small"
                                                            src={item.image}
                                                            icon={<FaFlask />}
                                                            className="border border-gray-200"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">
                                                                {item.material_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {item.material_code}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Stock Details Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border shadow-sm border-gray-200 space-y-4">
                                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                            <FaEdit className="text-blue-500" />
                                            Stock Details
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
                                                    Stock Type
                                                </label>
                                                <select
                                                    value={form.stock_type_id}
                                                    onChange={(e) => setForm(prev => ({ ...prev, stock_type_id: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                                                    required
                                                >
                                                    <option value="">Select stock type</option>
                                                    {stockTypeRes?.data?.data?.map(s => <option value={s.stock_type_id}>{s.stock_type_name}</option>)}
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
                                                    Stock Date
                                                </label>
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    value={form.stock_date ? dayjs(form.stock_date) : dayjs()}
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
                                            disabled={selectMaterials.length === 0}
                                            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${selectMaterials.length === 0
                                                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl'
                                                }`}
                                        >
                                            {isEditMode ? <FaSave /> : <MdLocalShipping />}
                                            {isEditMode ? 'Update Stock' : 'Create Stock'}
                                        </button>
                                        <Link to={-1} className="flex-1">
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

                                {/* Right Column - Selected Materials */}
                                <div className="lg:col-span-3">
                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        {/* Items Header */}
                                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800">Selected Raw Materials</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {selectMaterials.length} item(s) selected •
                                                        Total Quantity: {selectMaterials.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} •
                                                        Total Cost: ${selectMaterials.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.item_cost) || 0)), 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Table */}
                                        {selectMaterials.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">#</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Raw Material</th>
                                                            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Cost</th> */}
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Expire Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {selectMaterials.map((item, index) => {
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
                                                                                icon={<FaFlask />}
                                                                                className="border border-gray-200"
                                                                            />
                                                                            <div>
                                                                                <div className="font-medium text-gray-900">{item.material_name}</div>
                                                                                <div className="text-xs text-gray-500">{item.code}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    {/* <td className="px-6 py-4">
                                                                        <Input
                                                                            type="number"
                                                                            step="any"
                                                                            min="0"
                                                                            value={item.item_cost ?? ""}
                                                                            onWheel={(e) => e.target.blur()}
                                                                            onChange={(e) =>
                                                                                handleChange(index, "item_cost", e.target.value)
                                                                            }
                                                                            className="w-24 text-center"
                                                                            size="middle"
                                                                        />
                                                                    </td> */}
                                                                    <td className="px-6 py-4">
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            value={item.quantity}
                                                                            onWheel={(e) => e.target.blur()}
                                                                            onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                                                                            className="w-24 text-center"
                                                                            size="middle"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <DatePicker
                                                                            format="YYYY-MM-DD"
                                                                            value={materialLists[index]?.expire_date ? dayjs(materialLists[index].expire_date) : null}
                                                                            onChange={(date, dateString) => handleChange(index, 'expire_date', dateString)}
                                                                            className="w-full"
                                                                            size="middle"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <button
                                                                            onClick={() => handleRemove(index)}
                                                                            type="button"
                                                                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title="Remove material"
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
                                                    <FaFlask className="text-3xl text-blue-500" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Raw Materials Selected</h3>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Footer */}
                                    {selectMaterials.length > 0 && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                                                <div className="text-sm text-green-800 mb-1">Total Items</div>
                                                <div className="text-2xl font-bold text-green-900">{selectMaterials.length}</div>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                <div className="text-sm text-blue-800 mb-1">Total Quantity</div>
                                                <div className="text-2xl font-bold text-blue-900">
                                                    {selectMaterials.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)}
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                                <div className="text-sm text-purple-800 mb-1">Total Cost</div>
                                                <div className="text-2xl font-bold text-purple-900">
                                                    ${selectMaterials.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.item_cost) || 0)), 0).toFixed(2)}
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

export default StockRawForm;
