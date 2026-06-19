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
import ItemTable from "../../utils/ItemTable";

const { Option } = Select;
const MENU_ID = 22;
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
  const { data: users } = useGetAllUserQuery(token);
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
    reference_no: null,
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
        approved_by: data.approved_by || '',
        reference_no: data.reference_no || ''
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

      if (response.data.status == 200) {
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
        navigator(`/stock-invoice/${response.data.id??id}`);
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
    <section className="view-page bg-transparent min-h-screen">
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
        <div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-600 px-4 py-2">
            <div>
              <h1 className="text-md font-bold text-gray-900 dark:text-white">
                {isEditMode ? t('editStockRecord') : t('createStockIn')}
              </h1>
              <p className="text-gray-600 text-xs dark:text-gray-400">
                {isEditMode ? t('updateExistingTransfer') : t('addNewItemsToInventory')}
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 justify-between items-center">
              <Button
                type="button"
                actionType="is_modify"
                menuId={MENU_ID}
                disabled={selectItems.length === 0}
                variant={'save'}
                onClick={handleSubmit}
                outline={false}
              >
                {isEditMode ? <FaSave /> : <MdLocalShipping />}
                {isEditMode ? t('updateStock') : t('createStock')}
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
        </div>

        <form>
          <div className="bg-transparent overflow-hidden">
            <div>
              <div className="grid grid-cols-1">
                <div className="border-y border-gray-200 dark:border-gray-500 px-4 py-10 ">
                  {/* Stock Details Card */}
                  <div>
                    <div className="space-y-4 flex flex-wrap gap-3">
                      <div className="grow">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('toWarehouse')} <span className="text-red-500">*</span>
                        </label>
                        <RichSearch
                          value={form.warehouse_id}
                          data={toWarehouse}
                          keyFields={{ id: "warehouse_id", title: "warehouse_name", }}
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

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:!text-gray-300">
                          <span className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {t("referenceNo")}
                          </span>
                        </label>
                        <Input
                          type="text"
                          value={form?.reference_no||""}
                          placeholder="e,g. PO213245-03224"
                          name='reference_no'
                          onChange={(value) => setForm(prev => ({ ...prev, reference_no: value }))}
                        />
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right Column - Selected Items */}
                <div>
                  {/* Search Items */}
                  <div className="p-4 pb-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="text-red-500">*</span> {t('searchItems')}
                    </label>

                    <RichSearch
                      // value={searchItem}
                      placeholder={t('searchItemsByName')}
                      data={fielditems}
                      keyFields={{ id: "id", title: "name", subtitle: "code", image: "image", price: "price", quantity: "quantity" }}
                      onSelected={onSelectItem}
                      onScrollReader={onScrollFetch}
                      onSearch={(value) => setSearchItem(value)}
                    />
                  </div>
                  <div className=" px-4 pb-2">
                    <ItemTable
                      data={selectItems}
                      onDelete={handleRemove}
                      onCellChange={(index, key, value) => handleChange(index, key, false, value)}
                      columns={[
                        { title: t('item'), key: 'name', type: 'item', subKey: 'code' },
                        { title: t('quantity'), key: 'quantity', type: 'number' },
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
                    <div className="max-w-96 grow py-4 flex flex-col justify-end">
                      <div className="flex justify-between w-full max-w-[350px] text-slate-800 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <span className="text-sm font-bold uppercase">{t('totalQuantity')}</span>
                        <span className="text-xl font-bold text-[#13b5ea]">{selectItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)}</span>
                      </div>
                      <hr className="mb-1 text-gray-300 dark:text-gray-500" />
                      <hr className="text-gray-300 dark:text-gray-500" />
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
