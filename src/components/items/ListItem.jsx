import React, { useEffect, useState, useMemo } from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { useDebounce } from "use-debounce"; // Ensure this is installed: npm i use-debounce
import {
  Button,
  Empty,
  Image,
  Tag,
  Typography,
  Card,
  Tooltip,
  Badge,
  Pagination,
  Select,
  Spin,
  Row,
  Col,
  Input,
  Space
} from "antd";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { useNavigate } from "react-router";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiAddLine,
  RiUploadCloudLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

const ListItem = () => {
  const navigator = useNavigate();
  const [viewMode, setViewMode] = useState(localStorage.getItem("itemViewMode") || "grid");
  const [alertBox, setAlertBox] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const { setLoading } = useOutletsContext();
  const token = localStorage.getItem("token");

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // 1. Debounce Search: Wait 500ms after user stops typing before calling API
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  // 2. Pass 'search' to RTK Query (Ensure your itemsSlice query accepts 'search')
  const { data, isLoading, isFetching, refetch } = useGetAllItemsQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debouncedSearch
  });

  const items = useMemo(() => data?.data || [], [data]);
  const totalItems = data?.pagination?.total || 0;

  // Sync pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDelete = (itemId) => {
    setDeleteItemId(itemId);
    setAlertBox(true);
  };

  const handleConfirmDelete = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await api.delete(`items/${deleteItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        toast.success("Item deleted successfully");
        refetch();
      }
    } catch (error) {
      toast.error(error?.message || "Error deleting item");
    } finally {
      setLoading(false);
      setDeleteItemId(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  return (
    <div className="min-h-screen bg-transparent pb-5">
      <AlertBox
        isOpen={alertBox}
        title="Delete Item"
        message="This action is permanent. Are you sure?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setAlertBox(false)}
        confirmColor="error"
      />

      <div className=" border-b border-gray-200 px-2">
        <div className=" mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="!m-0 !text-gray-900 !font-bold">Items</Title>
            <Text type="secondary" className="text-sm">
              <Badge status="processing" color="#10b981" /> {totalItems} total items found
            </Text>
          </div>
          <Space size="middle" className="w-full md:w-auto">
            <Button
              icon={<RiUploadCloudLine />}
              onClick={() => navigator("import")}
              className="flex-1 md:flex-none h-10 rounded-lg"
            >
              Import
            </Button>
            <Button
              type="primary"
              icon={<RiAddLine />}
              onClick={() => navigator("create")}
              className="flex-1 md:flex-none h-10 rounded-lg bg-blue-600 shadow-md shadow-blue-100"
            >
              Add New
            </Button>
          </Space>
        </div>
      </div>

      <div className="mx-auto px-2">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative group">
            <input
              placeholder="Search database by name, code or category..."
              className="h-12 rounded-xl pl-10 border-gray-200 bg-white w-full shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <IoIosSearch className="text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" size={20} />
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm self-end lg:self-auto">
            <button
              onClick={() => { setViewMode("grid"); localStorage.setItem("itemViewMode", "grid"); }}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <IoIosGrid size={22} />
            </button>
            <button
              onClick={() => { setViewMode("list"); localStorage.setItem("itemViewMode", "list"); }}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <IoIosList size={22} />
            </button>
            <div className="w-[1px] h-6 bg-gray-200 mx-1" />
            <Select
              defaultValue={pageSize}
              onChange={(val) => { setPageSize(val); setCurrentPage(1); }}
              className="w-32 border-none"
              variant="borderless"
            >
              <Option value={12}>12 / page</Option>
              <Option value={24}>24 / page</Option>
              <Option value={48}>48 / page</Option>
            </Select>
          </div>
        </div>

        {/* 3. Wrap with Spin properly to show 'tip' */}
        <Spin spinning={isLoading || isFetching} tip="Syncing with database..." size="large">
          <div className="min-h-[400px]">
            {items.length > 0 ? (
              viewMode === "grid" ? (
                <div className=" grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                  {items.map((item) => (
                    <GridCard
                      item={item}
                      onEdit={() => navigator(`update/${item.id}`)}
                      onDelete={() => handleDelete(item.id)}
                      onView={() => navigator(`detail/${item.id}`)}
                      formatCurrency={formatCurrency}
                      getDiscount={getDiscountPercentage}
                    />
                  ))}
                </div>
              ) : (
                <ListView
                  items={items}
                  navigator={navigator}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                />
              )
            ) : (
              !isLoading && <Empty className="mt-20" description="No results found matching your search" />
            )}
          </div>
        </Spin>

        <div className="mt-12 flex justify-center">
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            showSizeChanger={false}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

// Fixed GridCard: Handling item.stock as an object
const GridCard = ({ item, onEdit, onDelete, onView, formatCurrency, getDiscount }) => {
  const discount = getDiscount(item.price, item.price_discount);
  const inStock = item?.stock?.in_stock || 0; // Fix: accessing object property

  return (
    <Card
      hoverable
      className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group"
      cover={
        <div onClick={onView} className="relative h-52 bg-gray-50 flex items-center justify-center">
          <Image
            src={item.image}
            alt={item.name}
            preview={false}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
            fallback="https://via.placeholder.com/300?text=No+Image"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Tag color={inStock > 0 ? "success" : "error"} className="m-0 rounded-full px-3 py-0.5 border-none shadow-sm">
              {inStock > 0 ? `Stock: ${inStock}` : "Sold Out"}
            </Tag>
          </div>
          {discount > 0 && (
            <div className="absolute top-3 right-0">
              <Tag color="#ef4444" className="m-0 rounded-l-md border-none font-bold">-{discount}%</Tag>
            </div>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <Text type="secondary" className="text-[10px] uppercase font-bold block">
            {item.category_name}
          </Text>
          <Title level={5} className="!m-0 line-clamp-1">{item.name}</Title>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 flex justify-between items-center">
          <Text strong className="text-lg">{formatCurrency(item.price_discount || item.price)}</Text>
          <Space>
            <Button size="small" icon={<RiEyeLine />} onClick={onView} />
            <Button size="small" icon={<RiEditLine />} onClick={onEdit} />
            <Button size="small" danger icon={<RiDeleteBinLine />} onClick={onDelete} />
          </Space>
        </div>
      </div>
    </Card>
  );
};

const ListView = ({ items, navigator, onDelete, formatCurrency }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <table className="w-full text-left">
      <thead className="bg-gray-50/50 border-b">
        <tr>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Code</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Stock</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
            <td className="px-6 py-4 flex items-center gap-3">
              <img src={item.image} className="w-10 h-10 object-cover rounded border" alt="" />
              <div>
                <Text strong className="block">{item.name}</Text>
                <Text className="text-xs text-gray-400">{item.category_name}</Text>
              </div>
            </td>
            <td className="px-6 py-4"><Tag>#{item.code}</Tag></td>
            <td className="px-6 py-4">
              <Tag color={(item?.stock?.in_stock || 0) > 0 ? "green" : "red"}>
                {item?.stock?.in_stock || 0} In Stock
              </Tag>
            </td>
            <td className="px-6 py-4"><Text strong>{formatCurrency(item.price_discount || item.price)}</Text></td>
            <td className="px-6 py-4 text-right">
              <Space>
                <Button type="text" size="small" icon={<RiEyeLine className="text-gray-400" />} onClick={() => navigator(`detail/${item.id}`)} />
                <Button type="text" icon={<RiEditLine className="text-blue-500" />} onClick={() => navigator(`update/${item.id}`)} />
                <Button type="text" danger icon={<RiDeleteBinLine />} onClick={() => onDelete(item.id)} />
              </Space>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ListItem;