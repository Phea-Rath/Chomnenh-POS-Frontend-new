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
import { DatePicker, Select, Tag, Avatar, Alert } from "antd";
import { useDebounce } from "use-debounce";
import dayjs from 'dayjs';
import { useTranslation } from "react-i18next";
import { FaTrash, FaEdit, FaSave, FaTimes, FaBox, FaFlask } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import Button from "../../utils/Button";
import RichSearch from "../../utils/RichSearch";
// import DatePicker from "../../utils/DatePicker";
import Input from "../../utils/Input";
import { useNotify } from "../../utils/NotificationProvider";

const { Option } = Select;

const StockRawForm = () => {
    const { t } = useTranslation();
    const notify = useNotify();
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
    const [errors, setErrors] = useState({});

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
        warehouse_id: 5,
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
                item.warehouse_id !== 4 &&
                item.warehouse_id !== 1
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
                notify.success(
                    response.data.message || (isEditMode ? t('stockRawUpdatedSuccess') : t('stockRawCreatedSuccess'))
                );
                navigator(-1);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setLoading(false);
            const errorMessage = error?.response?.data?.message || error?.message || t('errorProcessingStockRaw');
            setErrors({ general: errorMessage });
            notify.error(errorMessage);
        }
    }

    function handleCancel() {
        setAlertBox(false);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (selectMaterials.length === 0) {
            notify.error(t('pleaseAddAtLeastOneRaw'));
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
        <section className="view-page px-6 py-6 bg-transparent">
            <AlertBox
                isOpen={alertBox}
                title={t('confirmation')}
                message={isEditMode ? t('confirmUpdateRawStock') : t('confirmCreateRawStock')}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={isEditMode ? t('update') : t('create')}
                cancelText={t('cancel')}
            />

            <div className=" mx-auto overflow-visible">
                {/* Header */}
                <div className="mb-8 overflow-visible">
                    <div className="flex justify-between items-center mb-4 overflow-visible">
                        <div>
                            <MdLocalShipping className="text-2xl text-blue-600 dark:text-blue-400" />
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {isEditMode ? t('editRawMaterialStock') : t('createRawMaterialStockIn')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isEditMode ? t('updateExistingRawTransfer') : t('addNewItemsToInventory')}
                            </p>
                        </div>
                        {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={selectMaterials.length === 0}
                                            
                                        >
                                            {isEditMode ? <FaSave /> : <MdLocalShipping />}
                                            {isEditMode ? t('updateStock') : t('createStock')}
                                        </Button>
                                        <Link to={-1} className="flex-1">
                                            <Button
                                                type="button"
                                                variant="danger"
                                                outline
                                            >
                                                <FaTimes />
                                                {t('cancel')}
                                            </Button>
                                        </Link>
                                    </div>
                    </div>

                    {/* Validation Summary */}
                    {Object.keys(errors).length > 0 && (
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
                            className="mb-6"
                        />
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-transparent overflow-visible">
                        <div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Right Column - Selected Materials */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm overflow-visible">
                                        {/* Items Header */}
                                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('selectedRawMaterials')}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {selectMaterials.length} {t('itemsCount')} {t('selected')} •
                                                        {t('totalQuantity')}: {selectMaterials.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)} •
                                                        {t('totalCost') || "Total Cost"}: ${selectMaterials.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.item_cost) || 0)), 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Table */}
                                        {selectMaterials.length > 0 ? (
                                            <div className="overflow-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">#</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('rawMaterials')}</th>
                                                            {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Cost</th> */}
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('quantity')}</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('expireDate')}</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {selectMaterials.map((item, index) => {
                                                            return (
                                                                <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{index + 1}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar
                                                                                size="large"
                                                                                src={item.image}
                                                                                icon={<FaFlask />}
                                                                                className="border border-gray-200 dark:border-gray-700"
                                                                            />
                                                                            <div>
                                                                                <div className="font-medium text-gray-900 dark:text-white">{item.material_name}</div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.code}</div>
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
                                                                            className="w-24 text-center dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
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
                                                                            className="w-24 text-center dark:!bg-gray-700 dark:!border-gray-600 dark:!text-white"
                                                                            size="middle"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        
                                                                        <DatePicker
                                                                            format="YYYY-MM-DD"
                                                                            value={materialLists[index]?.expire_date ? dayjs(materialLists[index].expire_date) : null}
                                                                            onChange={(date, dateString) => handleChange(index, 'expire_date', dateString)}
                                                                            className="date-picker" 
                                                                            size="large"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <button
                                                                            onClick={() => handleRemove(index)}
                                                                            type="button"
                                                                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                            title={t('remove')}
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
                                                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <FaFlask className="text-3xl text-blue-500 dark:text-blue-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('noRawMaterialsSelected')}</h3>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Footer */}
                                    {selectMaterials.length > 0 && (
                                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
                                                <div className="text-sm text-green-800 dark:text-green-400 mb-1">{t('totalItems')}</div>
                                                <div className="text-2xl font-bold text-green-900 dark:text-green-300">{selectMaterials.length}</div>
                                            </div>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                                                <div className="text-sm text-blue-800 dark:text-blue-400 mb-1">{t('totalQuantity')}</div>
                                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                                                    {selectMaterials.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)}
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4">
                                                <div className="text-sm text-purple-800 dark:text-purple-400 mb-1">{t('totalCost') || "Total Cost"}</div>
                                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                                                    ${selectMaterials.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.item_cost) || 0)), 0).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Left Column - Form Controls */}
                                <div className="lg:col-span-1 space-y-6">
                                    {/* Search Raw Materials */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <span className="text-red-500">*</span> {t('searchRawMaterials')}
                                        </label>
                                        <RichSearch 
                                            data={fieldMaterials} 
                                            keyFields={{
                                                id: 'id', 
                                                title: 'material_name', 
                                                subtitle: 'material_code', 
                                                image: 'material_image', 
                                                price: 'material_cost', 
                                                // quantity: 'stock'
                                            }} 
                                            onScrollReader={onScrollFetch} 
                                            onSelected={onSelectMaterial} 
                                            onSearch={setSearchMaterial} 
                                            placeholder={t('searchRawMaterialsPlaceholder')}
                                        />
                                    </div>      

                                    {/* Stock Details Card */}
                                    <div className="">
                                        <h3 className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                                            <FaEdit className="text-blue-500 dark:text-blue-400" />
                                            {t('stockDetails')}
                                        </h3>

                                        <div className="space-y-4 flex flex-wrap gap-3 items-center">
                                            {/* <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('fromWarehouse')}
                                                </label>
                                                <select
                                                    onChange={(e) => setForm(prev => ({ ...prev, from_warehouse: e.target.value }))}
                                                    value={form.from_warehouse}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 dark:text-white text-sm"
                                                    required
                                                >
                                                    <option value="">Select From Warehouse</option>
                                                    <option value={2}>PO</option>
                                                </select>
                                            </div> */}

                                            {/* <div className="grow">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('stockType')}
                                                </label>
                                                <RichSearch 
                                                    placeholder={t('selectStockType')}
                                                    data={stockTypeRes?.data?.data} keyFields={{id: 'stock_type_id', title: 'stock_type_name'}} 
                                                    onSelected={(id)=>setForm(prev => ({ ...prev, stock_type_id: id }))}/>
                                            </div> */}

                                            <div className="grow">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('toWarehouse')} <span className="text-red-500">*</span>
                                                </label>
                                                <RichSearch 
                                                    placeholder={t('selectWarehouse')}
                                                    value={form.warehouse_id}
                                                    data={toWarehouse} keyFields={{id: 'warehouse_id', title: 'warehouse_name'}} 
                                                    onSelected={(id)=>setForm(prev => ({ ...prev, warehouse_id: id }))}/>
                                            </div>

                                            <div className="grow">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('stockDate')}
                                                </label>
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    value={form.stock_date ? dayjs(form.stock_date) : dayjs()}
                                                    onChange={(date, dateString) => setForm(prev => ({ ...prev, stock_date: dateString }))}
                                                    className="date-picker"
                                                    size="large"
                                                />
                                            </div>

                                            <div className="grow">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('remark')}
                                                </label>
                                                <textarea
                                                    value={form.stock_remark}
                                                    onChange={(e) => setForm(prev => ({ ...prev, stock_remark: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm dark:text-white"
                                                    placeholder={t('remarksPlaceholder')}
                                                    rows="3"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    
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
