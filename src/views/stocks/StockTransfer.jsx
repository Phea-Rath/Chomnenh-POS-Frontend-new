import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllStockTypesQuery } from '../../../app/Features/stockTypesSlice';
import { useGetItemsByStockQuery } from '../../../app/Features/itemsSlice';
import { useGetAllWarehousesQuery } from '../../../app/Features/warehousesSlice';
import { useCreateStockMutation, useGetAllStockQuery, useGetStockByIdQuery, useUpdateStockMutation } from '../../../app/Features/stocksSlice';
import { DatePicker, Select, Tag } from 'antd';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useDebounce } from 'use-debounce';
import { useTranslation } from 'react-i18next';
import Button from '../../utils/Button';
import RichSearch from '../../utils/RichSearch';
import Input from '../../utils/Input';
import dayjs from 'dayjs';

const StockTransfer = () => {
  const { t } = useTranslation();
  const asArray = (value) => (Array.isArray(value) ? value : []);
  const navigator = useNavigate();
  const [stocktype, setstocktype] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [items, setitems] = useState([]);
  const [fielditems, setfielditems] = useState([]);
  const [selectItems, setselectItems] = useState([]);
  const [warehouses, setwarehouses] = useState([]);
  const [toWarehouse, settoWarehouse] = useState([]);
  const [warehousesSelect, setwarehousesSelect] = useState([]);
  const [toWarehouseSelect, settoWarehouseSelect] = useState([]);
  const { setLoading, setAlert, setMessage, loading, setAlertStatus } = useOutletsContext();
  const token = localStorage.getItem('token');
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { refetch } = useGetAllStockQuery({ limit, page: 1, search: debouncedSearch, token });
  const stockRes = useGetAllStockTypesQuery(token);
  const itemsRes = useGetItemsByStockQuery({ token, limit: limit, page: 1, search: debouncedSearch });
  const warehouseRes = useGetAllWarehousesQuery(token);
  const [createStock] = useCreateStockMutation(token);

  // Initialize form state
  const { id } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);

  const [form, setForm] = useState({
    stock_id: null,
    from_warehouse: '',
    warehouse_id: '',
    stock_type_id: '',
    stock_remark: '',
    order_id: null
  });

  /* Fetch stock when in update mode */
  const stockByIdRes = useGetStockByIdQuery({ id, token }, { skip: !id });
  const [updateStock] = useUpdateStockMutation(token);

  useEffect(() => {
    setitems(asArray(itemsRes.data?.data));
    const newStockType = asArray(stockRes.data?.data).filter(item => item.stock_type_id !== 5);
    setstocktype(newStockType || []);
    const allWarehouses = asArray(warehouseRes.data?.data);
    const newWare = allWarehouses.filter(
      item => item.warehouse_id !== 2 && item.warehouse_id !== 3 && item.warehouse_id !== 4
    );
    const toWare = allWarehouses.filter(
      item => item.warehouse_id !== 2 && item.warehouse_id !== 3 && item.warehouse_id !== 4 && item.warehouse_id !== 1
    );
    setwarehouses(newWare || []);
    setwarehousesSelect(newWare || []);
    settoWarehouse(newWare || []);
    settoWarehouseSelect(toWare || []);
  }, [stockRes.data, itemsRes.data, warehouseRes.data]);

  // Populate form and items when loading in update mode
  useEffect(() => {
    id && stockByIdRes.refetch();
    const stock = stockByIdRes.data?.data;
    if (stock) {
      setIsUpdate(true);
      setForm(prev => ({
        ...prev,
        stock_id: stock.stock_id,
        from_warehouse: stock.from_warehouse,
        warehouse_id: stock.warehouse_id,
        stock_type_id: stock.stock_type_id,
        stock_remark: stock.stock_remark,
        stock_date: stock.stock_date,
        order_id: stock.order_id
      }));

      const mappedItems = asArray(stock?.items).map(it => ({
        ...it,
        item_id: it.item_id,
        quantity: it.quantity,
        expire_date: it.expire_date,
        item_name: it.item_name,
        item_code: it.item_code,
        barcode: it.barcode,
        size_name: it.size_name || '',
        stock: { in_stock: Number(it.stock?.in_stock) + (Number(it.quantity) || 0) }
      }));

      setselectItems(mappedItems);

      api.get(`stock_by_warehouse/${stock.from_warehouse}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        const list = res.data.data || [];
        const filtered = list.filter(li => !mappedItems.find(mi => mi.item_id == li.item_id));
        setfielditems(filtered || []);
      }).catch((err) => {
        toast.error(t('failedToFetchWarehouseItems'));
      });

      const toWare = asArray(warehouseRes.data?.data).filter(
        item => item.warehouse_id !== 2 && item.warehouse_id !== 3 && item.warehouse_id !== 4 && item.warehouse_id !== stock.from_warehouse
      );
      settoWarehouseSelect(toWare || []);
    }
  }, [stockByIdRes.data, warehouseRes.data]);

  function onSelectItem(value) {
    const finding = fielditems.find(exp => exp.item_id == value);
    const filterItem = fielditems.filter(exp => exp.item_id != value);
    setfielditems(filterItem);
    const exsistItem = selectItems.find(exp => exp.item_id == value);
    if (exsistItem) {
      setselectItems(prev =>
        prev.map(exp =>
          exp.item_id == value
            ? { ...exp, quantity: Number(exsistItem.quantity) + 1 }
            : exp
        )
      );
    } else {
      setselectItems(prev => {
        return [...prev, { ...finding, quantity: 1, expire_date: null }];
      });
    }
  }

  const handleChange = (index, field, value) => {
    setselectItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      const quantity = parseFloat(updated[index].quantity) || 1;
      const unit_price = parseFloat(updated[index].unit_price) || 1;
      updated[index].sub_total = (quantity * unit_price).toFixed(2);

      return updated;
    });
  };

  function handleRemove(id) {
    const filtering = selectItems.filter(exp => exp.item_id != id);
    const finding = selectItems.find(exp => exp.item_id == id);
    setselectItems(filtering);
    setfielditems(prev => { return [...prev, finding] });
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);

    try {
      let response;
      const payload = { ...form, items: selectItems };
      if (isUpdate) {
        response = await updateStock({ id: form.stock_id || id, itemData: payload, token });
      } else {
        response = await api.post(`stock_masters`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data.status === 200) {
        refetch();
        setLoading(false);
        toast.success(response.data.message || (isUpdate ? t('transferUpdatedSuccessfully') : t('transferCreatedSuccessfully')));

        if (isUpdate) {
          navigator(-1);
        } else {
          setForm({
            item_id: '',
            quantity: 0,
            unit_price: 0,
            from_warehouse_id: '',
            to_warehouse_id: '',
            stock_type_id: '',
            note: ''
          });
          navigator(-1);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      toast.error(error?.message || error || (isUpdate ? t('errorUpdatingTransfer') : t('errorCreatingTransfer')));
    }
  }

  const onScrollFetch = (e) => {
        const target = e.target;
        const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        if (!itemsRes.isFetching && nearBottom && itemsRes?.data?.pagination?.total > itemsRes?.data?.data?.length) {
            setLimit(prev => prev + 10);
        }
    }

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit(e) {
    console.log(selectItems);
    
    
    e.preventDefault();
    if(form.from_warehouse == form.warehouse_id){
      toast.error(t('warehouseCannotBeSame'));
      return;
    }
    setAlertBox(true);
    setForm(prev => {
      return { ...prev, items: selectItems }
    });
  }

  const options = [];
  for (let i = 0; i < fielditems.length; i++) {
    options.push({
      value: fielditems[i].item_id,
      name: fielditems[i].item_name,
      label: (
        <div className='flex items-center gap-3 justify-between w-full'>
          <div className='flex items-center gap-3 flex-1'>
            <span className="font-medium dark:text-gray-200">{fielditems[i].item_name}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Tag bordered={false} color="blue" className="text-xs dark:bg-blue-900/30">
              {fielditems[i].size_name}
            </Tag>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {t('stock')}: {Number(fielditems[i].stock.in_stock)}
            </span>
          </div>
        </div>
      ),
    });
  }

  const onSelectWarehouse = async (value) => {
    setForm(prev => { return { ...prev, from_warehouse: value } });
    const dataSelected = toWarehouse.filter(item => item.warehouse_id != value);
    const itemSelected = items.filter(item => item.warehouse_id == value);
    settoWarehouseSelect(dataSelected);
    setfielditems(itemSelected || []);
    setselectItems([]);

    api.get(`stock_by_warehouse/${value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setfielditems(res.data.data || []);
    }).catch((err) => {
      toast.error(t('failedToFetchWarehouseItems'));
    });
  }

  return (
    <section className='view-page p-6 bg-transparent min-h-screen'>
      <AlertBox
        isOpen={alertBox}
        title={t('confirmStockTransfer')}
        message={t('proceedStockTransfer')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isUpdate ? t('updateTransfer') : t('createTransfer')}
        cancelText={t('cancel')}
      />

      <div className=" mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{isUpdate ? t('editStockTransfer') : t('stockTransfer')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{isUpdate ? `${t('updateExistingTransfer')} #${stockByIdRes.data?.data?.stock_no || form.stock_id}` : t('transferItemsBetweenWarehouses')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-transparent rounded-xl overflow-hidden">
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                

                {/* Right Column - Selected Items Table */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden transition-colors">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">{t('selectedItems')}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {selectItems.length} {t('itemsSelectedForTransfer')}
                          </p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                          {t('totalItems')}: {selectItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                        </div>
                      </div>
                    </div>

                    {selectItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                NO.
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('name')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('quantity')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('expire')}
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {selectItems.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <div className=" text-gray-900 dark:text-white">
                                        {item.item_name}
                                      </div>
                                      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 gap-2 mt-1 font-mono">
                                        {item.barcode}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {/* <input
                                      type="number"
                                      min="1"
                                      max={Number(item.stock.in_stock)}
                                      placeholder="0"
                                      onWheel={(e) => e.target.blur()}
                                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center dark:bg-gray-900 dark:text-white"
                                      name="quantity"
                                      onChange={(e) => {
                                        if (Number(item.stock.in_stock) < Number(e.target.value)) {
                                          toast.warning(`${t('only')} ${item.stock.in_stock} ${t('itemsAvailableInStock')}`);
                                          return;
                                        }
                                        handleChange(index, 'quantity', e.target.value)
                                      }}
                                      value={item.quantity ?? 1}
                                      required
                                    /> */}
                                    <Input
                                       type='number'
                                       min='1'
                                       max={Number(item.stock.in_stock)}
                                       placeholder="0"
                                       onWheel={(e) => e.target.blur()}
                                       name="quantity"
                                       onChange={(value) => {
                                         if (Number(item.stock.in_stock) < Number(value)) {
                                           toast.warning(`${t('only')} ${item.stock.in_stock} ${t('itemsAvailableInStock')}`);
                                           return;
                                         }
                                         handleChange(index, 'quantity', value)
                                       }}
                                       value={item.quantity ?? 1}
                                       required
                                    />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      / {Number(item.stock.in_stock)} {t('inStock')}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {/* <input
                                    type="date"
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-white transition-colors"
                                    name="expire_date"
                                    defaultValue={item.expire_date || ''}
                                    onChange={(e) => handleChange(index, 'expire_date', e.target.value)}
                                    value={item.expire_date}
                                    required
                                  /> */}
                                  <DatePicker
                                    name='expire_date'
                                    format="YYYY-MM-DD"
                                    className='date-picker'
                                    onChange={(date, dateString) => handleChange(index, 'expire_date', dateString)}
                                    value={item.expire_date ? dayjs(item.expire_date) : null}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleRemove(item.item_id)}
                                    type="button"
                                    className="text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title={t('removeItem')}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">{t('noItemsSelected')}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">{t('selectItemsFromDropdownToTransfer')}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Left Column - Form Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {t('selectItem')}
                      </span>
                    </label>
                    

                    <RichSearch 
                      data={fielditems}
                      keyFields={{
                        id: 'item_id',
                        title: 'item_name',
                        image: 'image',
                        quantity: 'stock'
                      }}
                      placeholder={t('searchItems')}
                      onSelected={onSelectItem}
                      onScrollReader={onScrollFetch}
                      onSearch={(value) => setSearchTerm(value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="form-group grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          {t('fromWarehouse')}
                        </span>
                      </label>
                      {/* <select
                        onChange={(e) => onSelectWarehouse(e.target.value)}
                        value={form.from_warehouse}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white transition-colors'
                        required
                      >
                        <option value="">{t('selectSourceWarehouse')}</option>
                        {warehousesSelect.map((item) => (
                          <option key={item.warehouse_id} value={item.warehouse_id}>
                            {item.warehouse_name}
                          </option>
                        ))}
                      </select> */}
                      <RichSearch
                        data={warehousesSelect}
                        value={form.from_warehouse || null}
                        keyFields={{
                          id: 'warehouse_id',
                          title: 'warehouse_name'
                        }}
                        value={form.from_warehouse}
                        placeholder={t('selectSourceWarehouse')}
                        onSelected={onSelectWarehouse}
                      />
                    </div>

                    <div className="form-group grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                          {t('stockType')}
                        </span>
                      </label>
                      {/* <select
                        name="stock_type_id"
                        value={form.stock_type_id}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white transition-colors'
                        onChange={(e) => {
                          setForm(prev => { return { ...prev, stock_type_id: e.target.value } });
                        }}
                        required
                      >
                        <option value="">{t('selectStockType')}</option>
                        {stocktype.map((item) => (
                          <option key={item.stock_type_id} value={item.stock_type_id}>
                            {item.stock_type_name}
                          </option>
                        ))}
                      </select> */}

                      <RichSearch
                        data={stocktype}
                        keyFields={{
                          id: 'stock_type_id',
                          title: 'stock_type_name'
                        }}
                        value={form.stock_type_id}
                        placeholder={t('selectStockType')}
                        onSelected={(value) => {
                          setForm(prev => { return { ...prev, stock_type_id: value } });
                        }}
                      />
                    </div>

                    <div className="form-group grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {t('toWarehouse')}
                        </span>
                      </label>
                      {/* <select
                        name="to_warehouse_id"
                        value={form.warehouse_id}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 dark:text-white transition-colors'
                        onChange={(e) => setForm(prev => { return { ...prev, warehouse_id: e.target.value } })}
                        required
                      >
                        <option value="">{t('selectDestinationWarehouse')}</option>
                        {toWarehouseSelect.map((item) => (
                          <option key={item.warehouse_id} value={item.warehouse_id}>
                            {item.warehouse_name}
                          </option>
                        ))}
                      </select> */}
                      <RichSearch
                        data={toWarehouseSelect}
                        keyFields={{
                          id: 'warehouse_id',
                          title: 'warehouse_name'
                        }}
                        value={form.warehouse_id || null}
                        placeholder={t('selectDestinationWarehouse')}
                        onSelected={(value) => setForm(prev => { return { ...prev, warehouse_id: value } })}
                      />
                    </div>

                    <div className="form-group grow">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          {t('description')}
                        </span>
                      </label>
                      <textarea
                        className="textarea-input"
                        placeholder={t('description')}
                        rows="3"
                        name="stock_remark"
                        value={form.stock_remark}
                        onChange={(e) => setForm(prev => { return { ...prev, stock_remark: e.target.value } })}
                      ></textarea>
                    </div>
                  </div>

                  <div className='flex gap-3 pt-4'>
                    <Button
                      type="submit"
                      disabled={loading || selectItems.length === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>{loading ? (isUpdate ? t('updating') : t('creating')) : (isUpdate ? t('updateTransfer') : t('createTransfer'))}</span>
                    </Button>
                    <Link to={-1} className="flex-1">
                      <Button
                        type="button"
                        variant='danger'
                        outline
                      >
                        {t('cancel')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}

export default StockTransfer
