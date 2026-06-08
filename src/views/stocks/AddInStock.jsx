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
import { useGetAllStockQuery, useGetStockByIdQuery } from "../../../app/Features/stocksSlice";
import { useGetAllUserQuery } from "../../../app/Features/usersSlice";
import { Select, Tag, Avatar, DatePicker, Alert } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { FaTrash, FaEdit, FaSave, FaTimes, FaBox, FaPalette, FaRuler, FaUser } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import dayjs from 'dayjs'; // Import dayjs instead of moment
import { useDebounce } from "use-debounce";
import { useTranslation } from "react-i18next";
import Button from "../../utils/Button";
import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import { useNotify } from "../../utils/NotificationProvider";

const { Option } = Select;

const AddInStock = () => {
  const { t } = useTranslation();
  const notify = useNotify();
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
  const { refetch } = useGetAllStockQuery({ limit: 10, page: 1, search: '', token });
  const stockRes = useGetAllStockTypesQuery(token);
  const navigator = useNavigate();
  const [searchItem, setSearchItem] = useState('');
  const [debouncedSearch] = useDebounce(searchItem, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const itemsRes = useGetAllItemsQuery({ limit: limit, page: currentPage, search: debouncedSearch, token });
  const saleItemContext = useGetAllSaleQuery(token);
  const warehouseRes = useGetAllWarehousesQuery(token);
  const {data:users} = useGetAllUserQuery(token);
  // const [createStock] = useCreateStockMutation();
  // const [updateStock] = useUpdateStockMutation();
  const [attributes, setAttribute] = useState([]);
  const [errors, setErrors] = useState({});
  const { refetch: refetchItems } = useGetAllItemsQuery({ limit: 10, page: 1, search: '', token });
  const { refetch: refetchSales } = useGetAllSaleQuery({ limit: 10, page: 1, search: '', token });

  // Get stock data for edit mode
  const { data: stockData, refetch: refetchStock } = useGetStockByIdQuery(
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
    order_id: null,
    received_by: null,
    approved_by: null,
    stock_date: dayjs().format('YYYY-MM-DD'), // Today's date
  });

  useEffect(() => {
    setitems(itemsRes.data?.data || []);

    setAllItems(itemsRes?.data?.data || []);
    const newWare = warehouseRes.data?.data?.filter(
      (item) =>
        item.warehouse_id !== 2 &&
        item.warehouse_id !== 3 &&
        item.warehouse_id !== 4 &&
        item.warehouse_id !== 5
    );
    settoWarehouse(newWare || []);
  }, [stockRes.data, itemsRes.data, warehouseRes.data]);

  useEffect(() => {
    const selectedIds = new Set(selectItems.map((item) => item.id));
    setfielditems(items.filter((item) => !selectedIds.has(item.id)));
  }, [items, selectItems]);

  useEffect(() => {
    const total = itemsRes?.data?.pagination?.total || 0;
    if (fielditems.length < 5 && total > items.length) {
      setLimit(prev => prev + 10);
    }
  }, [fielditems.length, items.length, itemsRes?.data?.pagination?.total]);

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
        stock_date: data.stock_date || "",
        received_by: data.received_by || '',
        approved_by: data.approved_by||''
      });

      // Set selected items
      if (data.items && Array.isArray(data.items)) {
        // Map items to selectItems format
        const mappedSelectItems = data.items.map(item => ({
          id: item.item_id,
          code: item.item_code,
          name: item.item_name,
          image: item.images[0]?.image ?? '',
          price: item.item_price,
          brand_name: item.brand_name,
          category_name: item.category_name,
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
      expire_date: ''
    };
    setselectItems(prev => [...prev, newItem]);

    setItemLists(prev => [...prev, {
      item_id: value,
      item_cost: 0,
      quantity: 1,
      expire_date: '',
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
    console.log(itemLists);
    

    try {
      const payload = {
        ...form,
        received_by: form.received_by ? Number(form.received_by) : null,
        approved_by: form.approved_by ? Number(form.approved_by) : null,
        items: itemLists.map(item => ({
          item_id: item.item_id,
          quantity: parseInt(item.quantity) || 1,
          item_cost: item.item_cost || 1,
          expire_date: item.expire_date || new Date().toISOString().split('T')[0],
          attributes: item.attributes || []
        }))
      };

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
        if (isEditMode) refetchStock();
        saleItemContext.refetch();
        refetchItems();
        refetchSales();
        wasteRefetch();
        setLoading(false);
        notify.success(
          response.data.message || (isEditMode ? t('stockUpdatedSuccess') : t('stockCreatedSuccess'))
        );
        navigator(-1);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error?.response?.data?.message || error?.message || t('errorProcessingStock');
      setErrors({ general: errorMessage });
      notify.error(errorMessage);
    }
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (selectItems.length === 0) {
      notify.error(t("pleaseAddAtLeastOneItem"));
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
                key={vIdx}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: val.value }}
              />
            ) : (
              <div key={vIdx} className="border border-green-400 dark:border-green-600 px-1 m-[1px] rounded-md dark:text-green-400">{val.value}</div>
            )
          )}
      </div>);
  };

  const onScrollFetch = (e) => {
    const target = e.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    if (nearBottom && itemsRes?.data?.pagination?.total > items?.length) {
      setLimit(prev => prev + 10);
    }
  }

  return (
    <section className="view-page px-6 py-6 bg-transparent min-h-screen">
      <AlertBox
        isOpen={alertBox}
        title={t("confirmation")}
        message={isEditMode ? t("confirmUpdateStockMsg") : t("confirmCreateStockMsg")}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? t("update") : t("create")}
        cancelText={t("cancel")}
      />

      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <MdLocalShipping className="text-2xl text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isEditMode ? t('editStockRecord') : t('createStockIn')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditMode ? t('updateExistingTransfer') : t('addNewItemsToInventory')}
              </p>
            </div>
            {/* Action Buttons */}
                  <div className="flex gap-3 justify-between items-center">
                    <Button
                      type="button"
                      disabled={selectItems.length === 0}
                      variant={'primary'}
                      onClick={handleSubmit}
                      outline={false}
                    >
                      {isEditMode ? <FaSave /> : <MdLocalShipping />}
                      {isEditMode ? t('updateStock') : t('createStock')}
                    </Button>
                    <Link to={-1} className="flex-1">
                      <Button
                        type="button"
                        variant={'danger'}
                        outline={false}
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

        <form>
          <div className="bg-transparent overflow-hidden">
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                

                {/* Right Column - Selected Items */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden">
                    {/* Items Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('selectedItems')}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {selectItems.length} {t('itemCount')} {t('selected')} •
                            {t('totalQuantity')}: {selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)} •
                            {t('totalValue')}: ${selectItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    {selectItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">#</th>
                              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('item')}</th> */}
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('product')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('quantity')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('expireDate')}</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {selectItems.map((item, index) => {
                              const itemAttributes = getItemAttributes(item.id);
                              return (
                                <tr key={index} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{index + 1}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      {/* <Avatar
                                        size="large"
                                        src={item.image}
                                        icon={<FaBox />}
                                        className="border border-gray-200 dark:border-gray-700"
                                      /> */}
                                      <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{item.code}</div>
                                        {/* <div className="text-xs text-gray-400 mt-1">
                                          <Tag color="blue" size="small">{item.category_name}</Tag>
                                          <Tag color="green" size="small">${item.price}</Tag>
                                        </div> */}
                                      </div>
                                    </div>
                                  </td>
                                  {/* <td className="px-6 py-4">
                                    <div className="space-y-2">
                                      {itemAttributes.map((attr, attrIndex) => (
                                        <div key={attrIndex} className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-16">
                                            {attr.name}:
                                          </span>
                                          {renderAttributeSelect(attr)}
                                        </div>
                                      ))}
                                      {itemAttributes.length === 0 && (
                                        <span className="text-sm text-gray-400 dark:text-gray-500">{t('noAttributes')}</span>
                                      )}
                                    </div>
                                  </td> */}
                                  <td className="px-6 py-4 w-20">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      // onWheel={(e) => e.target.blur()}
                                      onChange={(value) => handleChange(index, 'quantity', false, value)}
                                      className="!w-20 text-center dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                      size="middle"
                                    />
                                  </td>
                                  <td className="px-6 py-4 w-35">
                                    <DatePicker
                                      format="YYYY-MM-DD"
                                      value={itemLists[index]?.expire_date ? dayjs(itemLists[index].expire_date) : null}
                                      onChange={(date, dateString) => handleChange(index, 'expire_date', false, dateString)}
                                      className="date-picker"
                                      size="large"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={() => handleRemove(index)}
                                      type="button"
                                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title={t('delete')}
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
                      <div className="text-center py-16 ">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FaBox className="text-3xl text-blue-500 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('noItemsSelected')}</h3>
                      </div>
                    )}
                  </div>

                  {/* Summary Footer */}
                  {selectItems.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
                        <div className="text-sm text-green-800 dark:text-green-400 mb-1">{t('totalItems')}</div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-300">{selectItems.length}</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4">
                        <div className="text-sm text-blue-800 dark:text-blue-400 mb-1">{t('totalQuantity')}</div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                          {selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4">
                        <div className="text-sm text-purple-800 dark:text-purple-400 mb-1">{t('totalValue')}</div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                          ${selectItems.reduce((sum, item) => sum + ((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Left Column - Form Controls */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Search Items */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> {t('searchItems')}
                    </label>
                    
                    <RichSearch
                      // value={searchItem}
                      placeholder={t('searchItemsByName')}
                      data={fielditems}
                      keyFields={{id: "id", title: "name", subtitle:"code", image:"image", price:"price", quantity:"quantity"}}
                      onSelected={onSelectItem}
                      onScrollReader={onScrollFetch}
                      onSearch={(value)=>setSearchItem(value)}
                    />
                  </div>

                  {/* Stock Details Card */}
                  <div className="">
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
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
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
                          required
                        >
                          <option value={2}>PO</option>
                        </select>
                      </div> */}

                      {/* <div className="grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('stockType')}
                        </label>
                        <select
                          value={form.stock_type_id}
                          onChange={(e) => setForm(prev => ({ ...prev, stock_type_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 dark:text-white text-sm"
                          required
                        >
                          <option value={2}>{t('stockIn')}</option>
                        </select>
                        <RichSearch 
                          value={form.stock_type_id}
                          data={stockTypes}
                          keyFields={{id: "stock_type_id", title: "stock_type_name", }}
                          onSelected={(e) => setForm(prev => ({ ...prev, stock_type_id: e.target.value }))}
                        />
                      </div> */}

                      <div className="grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('toWarehouse')} <span className="text-red-500">*</span>
                        </label>
                        <RichSearch 
                          value={form.warehouse_id}
                          data={toWarehouse} 
                          keyFields={{id: "warehouse_id", title: "warehouse_name", }}
                          onSelected={(value) => setForm(prev => ({ ...prev, warehouse_id: value }))}
                        />
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
                          className="textarea-input"
                          placeholder={t('remarksPlaceholder')}
                          rows="3"
                        />
                      </div>

                      <div className="grow min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                          <span className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {t("receivedBy")}
                          </span>
                        </label>
                        <RichSearch
                          data={users?.data}
                          value={form.received_by}
                          placeholder={t("selectUser")}
                          keyFields={{
                            id: "id",
                            title: "username",
                            image: "image",
                          }}
                          onSelected={(value) => setForm(prev => ({ ...prev, received_by: value }))}
                        />
                      </div>

                      <div className="grow min-w-[200px]">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                          <span className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {t("approvedBy")}
                          </span>
                        </label>
                        <RichSearch
                          data={users?.data}
                          value={form.approved_by}
                          placeholder={t("selectUser")}
                          keyFields={{
                            id: "id",
                            title: "username",
                            image: "image",
                          }}
                          onSelected={(value) => setForm(prev => ({ ...prev, approved_by: value }))}
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

export default AddInStock;
