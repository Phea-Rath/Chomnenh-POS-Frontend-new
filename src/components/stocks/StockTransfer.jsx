import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllStockTypesQuery } from "@/features/stocks/stockTypesSlice";
import { useGetItemsByStockQuery } from "@/features/products/itemsSlice";
import { useGetAllWarehousesQuery } from "@/features/stocks/warehousesSlice";
import { useCreateStockMutation, useGetAllStockQuery, useGetStockByIdQuery, useUpdateStockMutation } from "@/features/stocks/stocksSlice";
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import { DatePicker, Select, Tag, Alert } from 'antd';
import api from '../../services/api';
import { useDebounce } from 'use-debounce';
import { useTranslation } from 'react-i18next';
import Button from '../../utils/Button';
import RichSearch from '../../utils/RichSearch';
import Input from '../../utils/Input';
import dayjs from 'dayjs';
import { useNotify } from '../../utils/NotificationProvider';
import { FaUser, FaSave, FaTimes, FaBox, FaExchangeAlt } from 'react-icons/fa';
import { MdLocalShipping } from "react-icons/md";
import ItemTable from "../../utils/ItemTable";
import { getToken } from '@/utils/tokenStore';

const StockTransfer = () => {
  const { t } = useTranslation();
  const notify = useNotify();
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
  const token = getToken();
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { refetch } = useGetAllStockQuery({ limit, page: 1, search: debouncedSearch, token });
  const stockRes = useGetAllStockTypesQuery(token);
  const itemsRes = useGetItemsByStockQuery({ token, limit: limit, page: 1, search: debouncedSearch });
  const warehouseRes = useGetAllWarehousesQuery(token);
  const [createStock] = useCreateStockMutation(token);
  const [errors, setErrors] = useState({});
  const [alertError, setAlertError] = useState('');
  const { data: users } = useGetAllUserQuery(token);

  // Initialize form state
  const { id } = useParams();
  const [isUpdate, setIsUpdate] = useState(false);

  const [form, setForm] = useState({
    stock_id: null,
    from_warehouse: '',
    warehouse_id: '',
    stock_type_id: '',
    stock_remark: '',
    order_id: null,
    received_by: null,
    approved_by: null,
    stock_date: dayjs().format('YYYY-MM-DD'),
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
        received_by: stock.received_by || null,
        approved_by: stock.approved_by || null,
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
        notify.error(t('failedToFetchWarehouseItems'));
      });

      const toWare = asArray(warehouseRes.data?.data).filter(
        item => item.warehouse_id !== 2 && item.warehouse_id !== 3 && item.warehouse_id !== 4 && item.warehouse_id !== stock.from_warehouse
      );
      settoWarehouseSelect(toWare || []);
    }
  }, [stockByIdRes.data, warehouseRes.data]);

  function onSelectItem(value) {
    const finding = fielditems.find(exp => exp.item_id == value);
    if (!finding) return;

    if (selectItems.some(exp => exp.item_id == value)) {
      setselectItems(prev =>
        prev.map(exp => {
          if (exp.item_id == value) {
            const newQty = Number(exp.quantity) + 1;
            if (Number(exp.stock.in_stock) < newQty) {
              notify.warning(`${t('only')} ${exp.stock.in_stock} ${t('itemsAvailableInStock')}`);
              return exp;
            }
            return { ...exp, quantity: newQty };
          }
          return exp;
        })
      );
      return;
    }

    setselectItems(prev => [...prev, { ...finding, quantity: 1, expire_date: '' }]);
    setfielditems(prev => prev.filter(exp => exp.item_id != value));
  }

  const handleChange = (index, field, value) => {
    setselectItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'quantity') {
        const newQty = Number(value);
        if (Number(item.stock.in_stock) < newQty) {
          notify.warning(`${t('only')} ${item.stock.in_stock} ${t('itemsAvailableInStock')}`);
          // item.quantity = item.stock.in_stock; // Optionally cap it
        }
      }

      updated[index] = {
        ...item,
        [field]: value,
      };

      return updated;
    });
  };

  function handleRemove(index) {
    const itemToRemove = selectItems[index];
    const filtering = selectItems.filter((_, i) => i !== index);
    setselectItems(filtering);
    setfielditems(prev => [...prev, itemToRemove]);
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);

    try {
      let response;
      const payload = {
        ...form,
        received_by: form.received_by ? Number(form.received_by) : null,
        approved_by: form.approved_by ? Number(form.approved_by) : null,
        items: selectItems.map(item => ({
          item_id: item.item_id,
          quantity: parseInt(item.quantity) || 1,
          expire_date: item.expire_date || null,
        }))
      };

      if (isUpdate) {
        response = await updateStock({ id, itemData: payload, token }).unwrap();
      } else {
        response = await createStock({ itemData: payload, token }).unwrap();
      }

      if (response?.status === 200 || response?.data?.status === 200 || response) {
        refetch();
        setLoading(false);
        notify.success(response?.data?.message || response?.message || (isUpdate ? t('transferUpdatedSuccessfully') : t('transferCreatedSuccessfully')));
        navigator(-1);
      }
    } catch (error) {
      setLoading(false);
      const errorMessage = error?.response?.data?.message || error?.message || (isUpdate ? t('errorUpdatingTransfer') : t('errorCreatingTransfer'));
      setErrors({ general: errorMessage });
      notify.error(errorMessage);
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
    e.preventDefault();
    if (form.from_warehouse == form.warehouse_id) {
      const error = t('warehouseCannotBeSame');
      setAlertError(error);
      notify.error(error);
      return;
    }
    if (selectItems.length === 0) {
      notify.error(t("pleaseAddAtLeastOneItem"));
      return;
    }
    setAlertBox(true);
  }

  const onSelectWarehouse = async (value) => {
    setForm(prev => { return { ...prev, from_warehouse: value } });
    const dataSelected = toWarehouse.filter(item => item.warehouse_id != value);
    settoWarehouseSelect(dataSelected);
    setselectItems([]);
    setfielditems([]);

    api.get(`stock_by_warehouse/${value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setfielditems(res.data.data || []);
    }).catch((err) => {
      const error = t('failedToFetchWarehouseItems');
      setAlertError(error);
      notify.error(error);
    });
  }

  return (
    <section className='view-page bg-transparent min-h-screen'>
      <AlertBox
        isOpen={alertBox}
        title={t('confirmStockTransfer')}
        message={t('proceedStockTransfer')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isUpdate ? t('updateTransfer') : t('createTransfer')}
        cancelText={t('cancel')}
      />

      <div className="mx-auto">
        {/* Header */}
        <div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 px-4 py-2">
            <div>
              <h1 className="text-md font-bold text-gray-900 dark:text-white">
                {isUpdate ? t('editStockTransfer') : t('stockTransfer')}
              </h1>
              <p className="text-gray-600 text-xs dark:text-gray-400">
                {isUpdate ? `${t('updateExistingTransfer')} #${stockByIdRes.data?.data?.stock_no || form.stock_id}` : t('transferItemsBetweenWarehouses')}
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 justify-between items-center">
              <Button
                type="button"
                disabled={loading || selectItems.length === 0}
                variant={'save'}
                onClick={handleSubmit}
                outline={false}
              >
                {isUpdate ? <FaSave /> : <FaExchangeAlt />}
                {isUpdate ? t('updateTransfer') : t('createTransfer')}
              </Button>
              <Link to={-1} className="flex-1">
                <Button
                  type="button"
                  variant={'cancel'}
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
          {alertError && (
            <Alert
              message={alertError}
              type="error"
              closable
              onClose={() => setAlertError('')}
              className="mb-4 mx-4 mt-2"
            />
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-transparent overflow-hidden">
            <div>
              <div className="grid grid-cols-1">
                <div className="border-y border-gray-200 dark:border-gray-500 px-4 py-10 ">
                  {/* Stock Details Card */}
                  <div className="space-y-4 flex flex-wrap gap-3">
                    <div className="grow min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                        {t('fromWarehouse')} <span className="text-red-500">*</span>
                      </label>
                      <RichSearch
                        data={warehousesSelect}
                        value={form.from_warehouse}
                        keyFields={{
                          id: 'warehouse_id',
                          title: 'warehouse_name'
                        }}
                        placeholder={t('selectSourceWarehouse')}
                        onSelected={onSelectWarehouse}
                      />
                    </div>

                    <div className="grow min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                        {t('stockType')} <span className="text-red-500">*</span>
                      </label>
                      <RichSearch
                        data={stocktype}
                        keyFields={{
                          id: 'stock_type_id',
                          title: 'stock_type_name'
                        }}
                        value={form.stock_type_id}
                        placeholder={t('selectStockType')}
                        onSelected={(value) => setForm(prev => ({ ...prev, stock_type_id: value }))}
                      />
                    </div>

                    <div className="grow min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 uppercase">
                        {t('toWarehouse')} <span className="text-red-500">*</span>
                      </label>
                      <RichSearch
                        data={toWarehouseSelect}
                        keyFields={{
                          id: 'warehouse_id',
                          title: 'warehouse_name'
                        }}
                        value={form.warehouse_id}
                        placeholder={t('selectDestinationWarehouse')}
                        onSelected={(value) => setForm(prev => ({ ...prev, warehouse_id: value }))}
                      />
                    </div>

                    <div className="grow min-w-[200px]">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('stockDate')}
                      </label>
                      <DatePicker
                        format="YYYY-MM-DD"
                        value={form.stock_date ? dayjs(form.stock_date) : dayjs()}
                        onChange={(date, dateString) => setForm(prev => ({ ...prev, stock_date: dateString }))}
                        className="date-picker w-full"
                        size="large"
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

                {/* Items Section */}
                <div>
                  <div className="p-4 pb-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> {t('searchItems')}
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

                  <div className="px-4 pb-2 mt-4">
                    <ItemTable
                      data={selectItems}
                      onDelete={handleRemove}
                      onCellChange={handleChange}
                      columns={[
                        { title: t('item'), key: 'item_name', type: 'item', subKey: 'barcode' },
                        { 
                          title: t('quantity'), 
                          key: 'quantity', 
                          type: 'number',
                          render: (item) => (
                            <div className="text-[10px] text-gray-400">
                                / {Number(item.stock?.in_stock || 0)} {t('inStock')}
                            </div>
                          )
                        },
                        { title: t('expireDate'), key: 'expire_date', type: 'date' },
                      ]}
                    />
                  </div>

                  <div className="flex justify-between gap-10 border-y border-gray-200 dark:border-gray-500">
                    <div className="p-4 grow">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    <div className="max-w-96 grow py-4 flex flex-col justify-end pr-4">
                      <div className="flex justify-between w-full max-w-[350px] text-slate-800 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-sm font-bold uppercase">{t('totalQuantity')}</span>
                        <span className="text-xl font-bold text-[#13b5ea]">
                          {selectItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                        </span>
                      </div>
                      <hr className="mb-1 text-gray-300 dark:text-gray-500"/>
                      <hr className="text-gray-300 dark:text-gray-500"/>
                    </div>
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

