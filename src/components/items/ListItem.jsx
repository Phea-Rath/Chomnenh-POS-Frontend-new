import React, { useEffect, useState } from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import {
  Button,
  Empty,
  Flex,
  Image,
  Skeleton,
  Space,
  Tag,
  Typography,
  Card,
  Tooltip,
  Rate,
  Badge,
  Avatar
} from "antd";
import { motion } from "framer-motion";
import {
  useDeleteItemMutation,
  useGetAllItemsQuery,
} from "../../../app/Features/itemsSlice";
import { useNavigate } from "react-router";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiAddLine,
  RiUploadCloudLine,
  RiBarcodeLine,
  RiPriceTag3Line,
  RiShoppingBag3Line
} from "react-icons/ri";
import { FaPalette, FaRuler } from "react-icons/fa";
import { toast } from "react-toastify";

const { Title, Text } = Typography;

const ListItem = () => {
  const navigator = useNavigate();
  const [viewMode, setViewMode] = useState(localStorage.getItem("itemViewMode") || "grid");
  const [alertBox, setAlertBox] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const { setLoading } = useOutletsContext();
  const token = localStorage.getItem("token");
  const { data, isLoading, isError, refetch } = useGetAllItemsQuery(token);
  const [deleteItem] = useDeleteItemMutation();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (data?.data) {
      setItems(data.data);
      setFilteredItems(data.data);
    }
  }, [data]);

  // Helper function to extract specific attributes
  const extractAttribute = (item, attributeName) => {
    if (!item.attributes || !Array.isArray(item.attributes)) return null;
    const attribute = item.attributes.find(attr => attr.name === attributeName);
    return attribute ? attribute.value.value : null;
  };

  // Extract colors from attributes
  const getItemColors = (item) => {
    return extractAttribute(item, "colors") || [];
  };

  // Extract sizes from attributes
  const getItemSizes = (item) => {
    return extractAttribute(item, "size") || [];
  };

  // Extract other attributes
  const getOtherAttributes = (item) => {
    if (!item.attributes || !Array.isArray(item.attributes)) return [];
    return item.attributes.filter(attr =>
      attr.name !== "colors" && attr.name !== "size"
    );
  };

  const handleDelete = (itemId) => {
    setDeleteItemId(itemId);
    setAlertBox(true);
  };

  const handleCancelDelete = () => {
    setAlertBox(false);
    setDeleteItemId(null);
  };

  const handleConfirmDelete = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await deleteItem({ id: deleteItemId, token });
      if (res.data.status === 200) {
        refetch();
        toast.success("Item deleted successfully");
        setLoading(false);
      }
    } catch (error) {
      toast.error(
        error?.message || error || "An error occurred while deleting the item"
      );
      setLoading(false);
    }
    setDeleteItemId(null);
  };

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value) {
      const filtered = items.filter((item) =>
        item.name?.toLowerCase().includes(value.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(value.toLowerCase()) ||
        item.brand_name?.toLowerCase().includes(value.toLowerCase()) ||
        item.code?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  };

  const handleUpdate = (id) => {
    navigator("update/" + id);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("itemViewMode", mode);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price === discountPrice) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 p-6 gap-6">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <Skeleton active paragraph={{ rows: 1 }} className="mb-4" />
              <Skeleton active paragraph={{ rows: 1 }} className="mb-4" />
              <Skeleton active paragraph={{ rows: 1 }} className="mb-4" />
              <Skeleton active paragraph={{ rows: 1 }} className="mb-4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <AlertBox
        isOpen={alertBox}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <div className="mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <Title level={2} className="!mb-2 text-gray-800">
              Items - ទំនិញ
            </Title>
            <Text type="secondary" className="text-lg">
              Manage your product inventory
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              <Tooltip title="Grid View">
                <button
                  onClick={() => handleViewModeChange("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "grid"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <IoIosGrid size={20} />
                </button>
              </Tooltip>
              <Tooltip title="List View">
                <button
                  onClick={() => handleViewModeChange("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${viewMode === "list"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <IoIosList size={20} />
                </button>
              </Tooltip>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="default"
                icon={<RiUploadCloudLine />}
                onClick={() => navigator("import")}
                className="h-auto py-2 border-gray-300"
              >
                Import
              </Button>
              <Button
                type="primary"
                icon={<RiAddLine />}
                onClick={() => navigator("create")}
                className="h-auto py-2 bg-green-600 border-green-600 hover:bg-green-700"
              >
                Add New
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative max-w-md">
            <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search items by name, category, brand, or code..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <Text strong className="text-gray-700">
            {filteredItems.length} items found
          </Text>
          {searchTerm && (
            <Button type="link" onClick={() => setSearchTerm("")} className="text-blue-600">
              Clear search
            </Button>
          )}
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => {
              const colors = getItemColors(item);
              const sizes = getItemSizes(item);
              const otherAttributes = getOtherAttributes(item);
              const retailDiscount = getDiscountPercentage(item.price, item.price_discount);
              const wholesaleDiscount = getDiscountPercentage(item.wholesale_price, item.wholesale_price_discount);
              const hasDiscount = retailDiscount > 0 || wholesaleDiscount > 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="h-full border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                    cover={
                      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center overflow-hidden">
                        <div className="relative w-full h-full">
                          <Image
                            alt={item.name}
                            src={item.image}
                            preview={{
                              mask: (
                                <div className="flex items-center justify-center gap-1">
                                  <RiEyeLine className="text-white text-base" />
                                  <span className="text-white text-sm">View</span>
                                </div>
                              ),
                            }}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center">
                                <RiPriceTag3Line className="text-gray-300 text-4xl" />
                              </div>
                            }
                          />

                          {/* Discount Badge */}
                          {hasDiscount && (
                            <div className="absolute top-3 right-3">
                              <Badge.Ribbon
                                text={`${retailDiscount}% OFF`}
                                color="red"
                                className={retailDiscount > 0 ? "" : "hidden"}
                              >
                                <div></div>
                              </Badge.Ribbon>
                            </div>
                          )}

                          {/* Stock Status */}
                          <div className="absolute top-3 left-3">
                            <Tag color={item.stock > 0 ? "green" : "red"} className="!m-0 font-medium shadow-sm">
                              {item.stock > 0 ? `In Stock: ${item.stock}` : "Out of Stock"}
                            </Tag>
                          </div>

                          {/* Item Code */}
                          <div className="absolute bottom-3 left-3">
                            <Tag color="blue" className="!m-0 font-medium shadow-sm">
                              <RiBarcodeLine className="inline mr-1" />
                              {item.code}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-3">
                      {/* Item Name */}
                      <div>
                        <Title level={4} className="!mb-2 !text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.name}
                        </Title>

                        {/* Category and Brand */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Tag color="blue" className="capitalize">
                            {item.category_name}
                          </Tag>
                          <Tag color="purple" className="capitalize">
                            {item.brand_name}
                          </Tag>
                          {item.scale_name && (
                            <Tag color="orange" className="capitalize">
                              {item.scale_name}
                            </Tag>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          <Rate
                            disabled
                            defaultValue={item.rating || 0}
                            className="text-sm text-yellow-500"
                            style={{ fontSize: '14px' }}
                          />
                          <Text type="secondary" className="text-xs">
                            ({item.reviews || 0} reviews)
                          </Text>
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <RiPriceTag3Line className="text-gray-500" />
                            <Text strong className="text-sm">Retail Price:</Text>
                          </div>
                          <div className="text-right">
                            {retailDiscount > 0 ? (
                              <div className="flex items-center gap-2">
                                <Text delete type="secondary" className="text-sm line-through">
                                  ${formatCurrency(item.price)}
                                </Text>
                                <Text strong className="text-green-600 text-lg">
                                  ${formatCurrency(item.price_discount)}
                                </Text>
                              </div>
                            ) : (
                              <Text strong className="text-gray-800 text-lg">
                                ${formatCurrency(item.price)}
                              </Text>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <RiShoppingBag3Line className="text-gray-500" />
                            <Text strong className="text-sm">Wholesale:</Text>
                          </div>
                          <div className="text-right">
                            {wholesaleDiscount > 0 ? (
                              <div className="flex items-center gap-2">
                                <Text delete type="secondary" className="text-sm line-through">
                                  ${formatCurrency(item.wholesale_price)}
                                </Text>
                                <Text strong className="text-blue-600">
                                  ${formatCurrency(item.wholesale_price_discount)}
                                </Text>
                              </div>
                            ) : (
                              <Text strong className="text-gray-800">
                                ${formatCurrency(item.wholesale_price)}
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="default"
                          icon={<RiEyeLine />}
                          onClick={() => navigator(`detail/${item.id}`)}
                          className="flex-1 hover:border-blue-500 hover:text-blue-500"
                          size="small"
                        >
                          View
                        </Button>
                        <Button
                          type="primary"
                          ghost
                          icon={<RiEditLine />}
                          onClick={() => handleUpdate(item.id)}
                          className="flex-1 hover:border-green-500 hover:text-green-500"
                          size="small"
                        >
                          Edit
                        </Button>
                        <Button
                          danger
                          icon={<RiDeleteBinLine />}
                          onClick={() => handleDelete(item.id)}
                          size="small"
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Colors</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sizes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const colors = getItemColors(item);
                    const sizes = getItemSizes(item);
                    const retailDiscount = getDiscountPercentage(item.price, item.price_discount);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Image
                                width={60}
                                height={60}
                                src={item.image}
                                alt={item.name}
                                className="rounded-lg object-cover border border-gray-200"
                                fallback={
                                  <div className="w-15 h-15 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <RiPriceTag3Line className="text-gray-400 text-xl" />
                                  </div>
                                }
                              />
                              {retailDiscount > 0 && (
                                <div className="absolute -top-2 -right-2">
                                  <Tag color="red" className="!m-0 text-xs font-bold">
                                    -{retailDiscount}%
                                  </Tag>
                                </div>
                              )}
                            </div>
                            <div>
                              <Text strong className="block text-gray-900 mb-1">
                                {item.name}
                              </Text>
                              <div className="flex items-center gap-2">
                                <Rate
                                  disabled
                                  defaultValue={item.rating || 0}
                                  className="text-xs"
                                  style={{ fontSize: '12px' }}
                                />
                                <Text type="secondary" className="text-xs">
                                  ({item.reviews || 0})
                                </Text>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Tag color="blue" className="font-mono">
                            {item.code}
                          </Tag>
                        </td>
                        <td className="px-6 py-4">
                          <Tag color="geekblue" className="capitalize">{item.category_name}</Tag>
                        </td>
                        <td className="px-6 py-4">
                          <Text className="capitalize">{item.brand_name}</Text>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {retailDiscount > 0 && (
                                <Text delete type="secondary" className="text-xs">
                                  ${formatCurrency(item.price)}
                                </Text>
                              )}
                              <Text strong className="text-green-600">
                                ${formatCurrency(item.price_discount)}
                              </Text>
                            </div>
                            <Text className="text-xs text-blue-600">
                              Wholesale: ${formatCurrency(item.wholesale_price_discount)}
                            </Text>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <Tag color={item.stock > 0 ? "green" : "red"} className="w-fit">
                              {item.stock}
                            </Tag>
                            <Text type="secondary" className="text-xs">
                              Sold: {item.sold || 0}
                            </Text>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {colors.slice(0, 3).map((color, idx) => (
                              <Tooltip key={idx} title={color}>
                                <div
                                  className="w-5 h-5 rounded-full border border-gray-300 cursor-pointer"
                                  style={{ backgroundColor: color }}
                                />
                              </Tooltip>
                            ))}
                            {colors.length > 3 && (
                              <Text type="secondary" className="text-xs self-center">
                                +{colors.length - 3}
                              </Text>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1 flex-wrap max-w-[120px]">
                            {sizes.slice(0, 2).map((size, idx) => (
                              <Tag key={idx} color="green" className="!m-0 !text-xs">
                                {size.toUpperCase()}
                              </Tag>
                            ))}
                            {sizes.length > 2 && (
                              <Text type="secondary" className="text-xs">
                                +{sizes.length - 2}
                              </Text>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Tooltip title="View Details">
                              <Button
                                type="text"
                                icon={<RiEyeLine />}
                                onClick={() => navigator(`detail/${item.id}`)}
                                size="small"
                                className="hover:text-blue-500"
                              />
                            </Tooltip>
                            <Tooltip title="Edit Item">
                              <Button
                                type="text"
                                icon={<RiEditLine />}
                                onClick={() => handleUpdate(item.id)}
                                size="small"
                                className="hover:text-green-500"
                              />
                            </Tooltip>
                            <Tooltip title="Delete Item">
                              <Button
                                type="text"
                                danger
                                icon={<RiDeleteBinLine />}
                                onClick={() => handleDelete(item.id)}
                                size="small"
                              />
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Empty
              className="w-full flex flex-col items-center justify-center"
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              description={
                <div>
                  <Title level={4} className="!mb-2">No items found</Title>
                  <Text type="secondary">
                    {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first item"}
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                size="large"
                icon={<RiAddLine />}
                onClick={() => navigator("create")}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                Add New Item
              </Button>
            </Empty>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ListItem;