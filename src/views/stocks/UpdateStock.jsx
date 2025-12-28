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
  useCreateStockMutation,
  useGetAllStockQuery,
  useGetStockByIdQuery,
  useUpdateStockMutation,
} from "../../../app/Features/stocksSlice";
import { DatePicker, Select } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllWasteQuery } from "../../../app/Features/notificationSlice";
import { toast } from "react-toastify";
import dayjs from "dayjs";

let index = 0;
const UpdateStock = () => {
  const { id } = useParams();
  const [stocktype, setstocktype] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [items, setitems] = useState([]);
  const [fielditems, setfielditems] = useState([]);
  const [selectItems, setselectItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [formData, setFormData] = useState([]);
  const [warehouses, setwarehouses] = useState([]);
  const [toWarehouse, settoWarehouse] = useState([]);
  const token = localStorage.getItem("token");
  const { setLoading, setAlert, setMessage, setAlertStatus } =
    useOutletsContext();
  const {
    data: dataWaste,
    refetch: wasteRefetch,
    isLoading,
    isError,
  } = useGetAllWasteQuery(token);
  const { refetch } = useGetAllStockQuery(token);
  const { data: stockById } = useGetStockByIdQuery({ id, token });
  const stockRes = useGetAllStockTypesQuery(token);
  const navigator = useNavigate();
  const itemsRes = useGetAllItemsQuery(token);
  const allItemsRes = useGetAllItemsQuery(token);
  const saleItemContext = useGetAllSaleQuery(token);
  const warehouseRes = useGetAllWarehousesQuery(token);
  const [updateStock] = useUpdateStockMutation(token);

  // Initialize form state
  const [form, setForm] = useState({
    from_warehouse: 2,
    warehouse_id: 1,
    stock_type_id: 2,
    stock_remark: "",
    order_id: null,
  });

  useEffect(() => {
    setfielditems(itemsRes.data?.data || []);
    setitems(itemsRes.data?.data || []);
    setAllItems(allItemsRes?.data?.data);
    setstocktype(stockRes?.data?.data);
    setwarehouses(warehouseRes.data?.data);
    setselectItems(stockById?.data?.items || []);
    settoWarehouse(warehouseRes.data?.data);

    if (stockById?.data) {
      setForm(stockById.data);
    }
  }, [stockRes.data, itemsRes.data, warehouseRes.data, stockById]);

  function onSelectItem(value) {
    index += 1;
    const finding = items.find((exp) => exp.item_id == value);
    const existItem = selectItems.find((item) => item.item_id === value);

    if (existItem) {
      setselectItems((prev) => {
        const updated = prev.map((i) => {
          if (i.item_id === value) {
            return {
              ...i,
              quantity: Number(i.quantity) + 1,
            };
          }
          return i;
        });
        return updated;
      });
    } else {
      setselectItems((prev) => {
        return [...prev, { ...finding, quantity: 1 }];
      });
    }
  }

  const handleChange = (id, field, value) => {
    if (field == "quantity") {
      setFormData((prev) => {
        return prev.map((p) => {
          if (p.item_id === id) {
            return {
              ...p,
              quantity: Number(value),
            };
          }
          return p;
        });
      });
    }
    if (field == "expire_date") {
      setFormData((prev) => {
        return prev.map((p) => {
          if (p.item_id === id) {
            return {
              ...p,
              expire_date: value,
            };
          }
          return p;
        });
      });
    }
    setselectItems((prev) => {
      return prev.map((p) => {
        if (p.item_id === id) {
          return {
            ...p,
            [field]: value,
          };
        }
        return p;
      });
    });
  };

  function handleRemove(id) {
    const filtering = selectItems.filter((exp) => exp.item_id != id);
    setselectItems(filtering);
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);

    const payload = {
      ...form,
      items: form.items.map((item) => {
        const { wholesale_price, ...rest } = item;
        return {
          ...rest,
          item_wholesale_price: wholesale_price,
        };
      }),
    };

    try {
      const response = await api.put(`/stock_masters/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 200) {
        refetch();
        wasteRefetch();
        setLoading(false);
        toast.success(response.data.message || "Stock updated successfully");
        navigator("/dashboard/stock-list");
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      toast.error(
        error?.message || error || "An error occurred while updating the stock"
      );
    }
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAlertBox(true);
    setForm((prev) => {
      return { ...prev, items: selectItems };
    });
  }

  return (
    <section className="px-6 py-6 bg-gray-50 min-h-screen">
      <AlertBox
        isOpen={alertBox}
        title="Update Stock"
        message="Are you sure you want to update this stock transfer?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Update"
        cancelText="Cancel"
      />

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Update Stock Transfer</h1>
              <p className="text-gray-600">Stock ID: {id}</p>
            </div>
            <div className="w-20 h-1 bg-blue-600 rounded"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-semibold text-gray-700">Stock Information</h2>
              <p className="text-sm text-gray-600 mt-1">Update stock transfer details and items</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form Controls */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        ស្វែងរកទំនិញ
                      </span>
                    </label>
                    <Select
                      onChange={onSelectItem}
                      showSearch
                      style={{ width: '100%' }}
                      placeholder="Search items to add..."
                      optionLabelProp="name"
                      size="large"
                      optionFilterProp="name"
                      filterSort={(optionA, optionB) =>
                        (optionA?.name ?? "")
                          .toLowerCase()
                          .localeCompare((optionB?.name ?? "").toLowerCase())
                      }
                      options={[
                        ...fielditems?.map((item) => ({
                          value: item?.item_id,
                          name: item?.item_name,
                          label: (
                            <div className="flex items-center gap-3 p-1">
                              <img
                                className="w-8 h-8 rounded object-cover border"
                                src={item?.item_image}
                                alt={item?.item_name}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/32';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {item?.item_name}
                                </h3>
                                <p className="text-xs text-gray-500">{item?.brand_name}</p>
                              </div>
                              <span className="text-sm font-semibold text-green-600">
                                ${item?.item_price}
                              </span>
                            </div>
                          ),
                        })),
                      ]}
                    />
                  </div>

                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          ពីស្តុក
                        </span>
                      </label>
                      <select
                        value={form?.from_warehouse || ''}
                        onChange={(e) => {
                          setForm((prev) => {
                            return { ...prev, from_warehouse: e.target.value };
                          });
                          const newToWare = warehouseRes?.data?.data?.filter(
                            (w) => w.warehouse_id != e.target.value
                          );
                          settoWarehouse(newToWare);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Select source warehouse</option>
                        {warehouses?.map((item) => (
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
                          ប្រភេទស្តុក
                        </span>
                      </label>
                      <select
                        name="stock_type_id"
                        value={form?.stock_type_id || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        onChange={(e) =>
                          setForm((prev) => {
                            return { ...prev, stock_type_id: e.target.value };
                          })
                        }
                        required
                      >
                        <option value="">Select stock type</option>
                        {stocktype?.map((item) => (
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
                          ទៅស្តុក
                        </span>
                      </label>
                      <select
                        name="to_warehouse_id"
                        value={form?.warehouse_id || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        onChange={(e) => {
                          setForm((prev) => {
                            return { ...prev, warehouse_id: e.target.value };
                          });
                        }}
                        required
                      >
                        <option value="">Select destination warehouse</option>
                        {toWarehouse?.map((item) => (
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
                          ផ្សេងៗ
                        </span>
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter description or remarks..."
                        rows="3"
                        name="stock_remark"
                        value={form?.stock_remark || ''}
                        onChange={(e) =>
                          setForm((prev) => {
                            return { ...prev, stock_remark: e.target.value };
                          })
                        }
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm"
                      disabled={selectItems.length === 0}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Stock</span>
                    </button>
                    <Link to="/dashboard/stock-list" className="flex-1">
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
                          Total: {selectItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
                        </div>
                      </div>
                    </div>

                    {selectItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ល.រ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                កូដ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ឈ្មោះ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ពណ៌
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ទំហំ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                បរិមាណ
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ផុតកំណត់
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                សកម្មភាព
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectItems?.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                                  {item?.item_code}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <img
                                      className="w-8 h-8 rounded object-cover border"
                                      src={item?.item_image}
                                      alt={item?.item_name}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/32';
                                      }}
                                    />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {item?.item_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item?.brand_name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                                      style={{ background: item?.color_pick || '#ccc' }}
                                      title={item?.color_name}
                                    />
                                    <span className="text-xs text-gray-600 hidden sm:block">
                                      {item?.color_name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                  {item?.size_name}
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                                    name="quantity"
                                    onChange={(e) =>
                                      handleChange(
                                        item.item_id,
                                        "quantity",
                                        e.target.value
                                      )
                                    }
                                    value={item.quantity ?? 1}
                                    required
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <DatePicker
                                    size="small"
                                    format="YYYY-MM-DD"
                                    className="w-full text-sm"
                                    defaultValue={
                                      item?.expire_date ? dayjs(item.expire_date) : null
                                    }
                                    onChange={(date, dateString) =>
                                      handleChange(
                                        item.item_id,
                                        "expire_date",
                                        dateString
                                      )
                                    }
                                    placeholder="Expiry date"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-gray-500 text-lg mb-2">No items selected</p>
                        <p className="text-gray-400 text-sm">Search and select items to update your stock transfer</p>
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
  );
};

export default UpdateStock;