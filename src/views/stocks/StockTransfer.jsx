import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllStockTypesQuery } from '../../../app/Features/stockTypesSlice';
import { useGetItemsByStockQuery } from '../../../app/Features/itemsSlice';
import { useGetAllWarehousesQuery } from '../../../app/Features/warehousesSlice';
import { useCreateStockMutation, useGetAllStockQuery, useGetStockByIdQuery, useUpdateStockMutation } from '../../../app/Features/stocksSlice';
import { Select, Tag } from 'antd';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useDebounce } from 'use-debounce';

const StockTransfer = () => {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { refetch } = useGetAllStockQuery(token);
  const stockRes = useGetAllStockTypesQuery(token);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const itemsRes = useGetItemsByStockQuery({ token, limit, page: currentPage, search: debouncedSearch });
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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!form.from_warehouse) {
      setfielditems(asArray(itemsRes.data?.data));
    }
  }, [itemsRes.data, form.from_warehouse]);

  // Populate form and items when loading in update mode
  useEffect(() => {
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

      // Map items into selectItems format
      const mappedItems = asArray(stock?.items).map(it => ({
        ...it,
        item_id: it.item_id,
        quantity: it.quantity,
        expire_date: it.expire_date,
        item_name: it.item_name,
        item_code: it.item_code,
        barcode: it.barcode,
        size_name: it.size_name || '',
        stock: { in_stock: Number(it.stock?.in_stock) + (Number(it.quantity) || 0) } // Adjust stock to include current quantity for editing
      }));

      setselectItems(mappedItems);

      // Fetch available items for the selected from_warehouse and exclude already selected ones
      api.get(`stock_by_warehouse/${stock.from_warehouse}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        const list = res.data.data || [];
        const filtered = list.filter(li => !mappedItems.find(mi => mi.item_id == li.item_id));
        setfielditems(filtered || []);
      }).catch((err) => {
        toast.error('Failed to fetch items for selected warehouse');
      });

      // Adjust warehouse selects to reflect current from/to
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
        return [...prev, { ...finding, quantity: 1 }];
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

      // Recalculate sub_total if quantity or unit_price is updated
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
        // Update existing stock master
        response = await updateStock({ id: form.stock_id || id, itemData: payload, token });
        // response = await api.put(`stock_masters/${form.stock_id || id}`, payload, {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // });
      } else {
        // Create new stock master
        response = await createStock({ itemData: payload, token });
      }

      if (response.data.status === 200) {
        refetch();
        setLoading(false);
        toast.success(response.data.message || (isUpdate ? 'Stock transfer updated successfully' : 'Stock transfer created successfully'));

        if (isUpdate) {
          // Navigate to detail view after update
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
      toast.error(error?.message || error || `An error occurred while ${isUpdate ? 'updating' : 'creating'} the stock transfer`);
    }
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAlertBox(true);
    setForm(prev => {
      return { ...prev, items: selectItems }
    });
  }

  const onScrollFetch = (e) => {
    const target = e.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    if (nearBottom && itemsRes?.data?.pagination?.total > items?.length) {
      setLimit(prev => prev + 10);
    }
  }

  const options = [];
  for (let i = 0; i < fielditems.length; i++) {
    options.push({
      value: fielditems[i].item_id,
      name: fielditems[i].item_name,
      label: (
        <div className='flex items-center gap-3 justify-between w-full'>
          <div className='flex items-center gap-3 flex-1'>
            <span className="font-medium text-gray-800">{fielditems[i].item_name}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Tag bordered={false} color="blue" className="text-xs">
              {fielditems[i].size_name}
            </Tag>
            <span className="text-xs text-gray-500 font-mono">
              Stock: {Number(fielditems[i].stock.in_stock)}
            </span>
          </div>
        </div>
      ),
    });
  }

  const onSelectWarehouse = async (e) => {
    setForm(prev => { return { ...prev, from_warehouse: e.target.value } });
    const dataSelected = toWarehouse.filter(item => item.warehouse_id != e.target.value);
    const itemSelected = items.filter(item => item.warehouse_id == e.target.value);
    settoWarehouseSelect(dataSelected);
    setfielditems(itemSelected || []);
    setselectItems([]);

    api.get(`stock_by_warehouse/${e.target.value}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((res) => {
      setfielditems(res.data.data || []);
      console.log(res?.data);
    }).catch((err) => {
      toast.error(err?.message || 'Failed to fetch items for the selected warehouse');
    });


  }

  console.log('selectItems', selectItems);


  return (
    <section className='p-6 bg-transparent min-h-screen'>
      <AlertBox
        isOpen={alertBox}
        title="Confirm Stock Transfer"
        message="Are you sure you want to proceed with this stock transfer?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Create Transfer"
        cancelText="Cancel"
      />

      <div className=" mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{isUpdate ? 'Edit Stock Transfer' : 'Stock Transfer'}</h1>
              <p className="text-gray-600">{isUpdate ? `Update stock transfer #${stockByIdRes.data?.data?.stock_no || form.stock_id}` : 'Transfer items between warehouses'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-transparent rounded-xl overflow-hidden">

            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Select Items
                      </span>
                    </label>
                    <Select
                      size='large'
                      style={{ width: '100%' }}
                      placeholder="Search and select items..."
                      onChange={onSelectItem}
                      onPopupScroll={onScrollFetch}
                      onSearch={(value) => setSearchTerm(value)}
                      options={options}
                      showSearch
                      filterOption={(input, option) =>
                        option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0

                      }
                    // optionLabelProp="name"
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 shadow-sm rounded-lg border border-gray-200">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          FROM WAREHOUSE
                        </span>
                      </label>
                      <select
                        onChange={onSelectWarehouse}
                        value={form.from_warehouse}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                        required
                      >
                        <option value="">Select source warehouse</option>
                        {warehousesSelect.map((item) => (
                          <option key={item.warehouse_id} value={item.warehouse_id}>
                            {item.warehouse_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                          STOCK TYPE
                        </span>
                      </label>
                      <select
                        name="stock_type_id"
                        value={form.stock_type_id}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                        onChange={(e) => {
                          setForm(prev => { return { ...prev, stock_type_id: e.target.value } });
                          const dataSelected = warehouses.filter(item => item.warehouse_id != e.target.value);
                          setwarehousesSelect(dataSelected);
                        }}
                        required
                      >
                        <option value="">Select stock type</option>
                        {stocktype.map((item) => (
                          <option key={item.stock_type_id} value={item.stock_type_id}>
                            {item.stock_type_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          TO WAREHOUSE
                        </span>
                      </label>
                      <select
                        name="to_warehouse_id"
                        value={form.warehouse_id}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
                        onChange={(e) => setForm(prev => { return { ...prev, warehouse_id: e.target.value } })}
                        required
                      >
                        <option value="">Select destination warehouse</option>
                        {toWarehouseSelect.map((item) => (
                          <option key={item.warehouse_id} value={item.warehouse_id}>
                            {item.warehouse_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          DESCRIPTION
                        </span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter description or remarks..."
                        rows="3"
                        name="stock_remark"
                        value={form.stock_remark}
                        onChange={(e) => setForm(prev => { return { ...prev, stock_remark: e.target.value } })}
                      ></textarea>
                    </div>
                  </div>

                  <div className='flex gap-3 pt-4'>
                    <button
                      type="submit"
                      disabled={loading || selectItems.length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span>{loading ? (isUpdate ? 'Updating...' : 'Creating...') : (isUpdate ? 'Update Transfer' : 'Create Transfer')}</span>
                    </button>
                    <Link to={-1} className="flex-1">
                      <button
                        type="button"
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2.5 px-4 rounded-md font-medium transition-colors duration-200 shadow-sm"
                      >
                        Cancel
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Right Column - Selected Items Table */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-700">Selected Items</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {selectItems.length} item(s) selected for transfer
                          </p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Total Items: {selectItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                        </div>
                      </div>
                    </div>

                    {selectItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NO.
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                NAME
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                QUANTITY
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                EXPIRE
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ACTION
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectItems.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">

                                    <div>
                                      <div className=" text-gray-900">
                                        {item.item_name}
                                      </div>
                                      <div className="flex items-center text-sm font-medium text-gray-500 gap-2 mt-1">
                                        {item.barcode}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      max={Number(item.stock.in_stock)}
                                      placeholder="0"
                                      onWheel={(e) => e.target.blur()}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                      name="quantity"
                                      onChange={(e) => {
                                        if (Number(item.in_stock) < e.target.value) {
                                          toast.warning(`Only ${item.stock.in_stock} items available in stock!`);
                                          return;
                                        }
                                        handleChange(index, 'quantity', e.target.value)
                                      }}
                                      value={item.quantity ?? 1}
                                      required
                                    />
                                    <span className="text-xs text-gray-500">
                                      / {Number(item.stock.in_stock)} in stock
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="date"
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    name="expire_date"
                                    defaultValue={item.expire_date || ''}
                                    onChange={(e) => handleChange(index, 'expire_date', e.target.value)}
                                    value={item.expire_date}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => handleRemove(item.item_id)}
                                    type="button"
                                    className="text-red-600 hover:text-red-800 transition-colors p-2 rounded hover:bg-red-50"
                                    title="Remove item"
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
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <p className="text-gray-500 text-lg mb-2">No items selected</p>
                        <p className="text-gray-400 text-sm">Select items from the dropdown to create a transfer</p>
                      </div>
                    )}
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
