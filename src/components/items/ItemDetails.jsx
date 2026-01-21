import { useEffect, useState } from "react";
import {
  MdKeyboardArrowRight,
  MdKeyboardArrowLeft,
  MdClose,
  MdInventory,
  MdCategory,
  MdScale,
  MdColorLens,
  MdStraighten,
  MdAttachMoney,
  MdQrCode,
  MdStar,
  MdShoppingCart,
  MdInventory2,
  MdLocalOffer,
  MdBarChart
} from "react-icons/md";
import { useNavigate, useParams } from "react-router";
import {
  useDeleteItemMutation,
  useGetAllItemsQuery,
  useGetItemByIdQuery,
} from "../../../app/Features/itemsSlice";
import { RiDeleteBin6Line, RiEditLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { toast } from "react-toastify";
import { Rate, Tag, Divider, Badge, Card, Statistic } from "antd";
import { FaPalette, FaRuler, FaTag, FaBox, FaWeightHanging } from "react-icons/fa";
import { GiFruitBowl } from "react-icons/gi";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";

const ItemDetails = () => {
  const { id } = useParams();
  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const [alertBox, setAlertBox] = useState(false);
  const { setLoading } = useOutletsContext();
  const { data, refetch, isLoading } = useGetItemByIdQuery({ id, token });
  // const findItem = data?.data?.find((item) => item.id == id);

  const [deleteItem] = useDeleteItemMutation();
  const [currentItem, setCurrentItem] = useState({});
  const { refetch: saleRefetch } = useGetAllSaleQuery(token);

  useEffect(() => {
    setCurrentItem(data?.data);
    setCurrentItem(data?.data);
  }, [data]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  // Helper functions to extract data from attributes
  const extractAttribute = (attributeName) => {
    if (!currentItem.attributes || !Array.isArray(currentItem.attributes)) return null;
    const attribute = currentItem.attributes.find(attr => attr.name === attributeName);
    return attribute ? Array.isArray(attribute.value) ? attribute.value.map(i => i.value) : [attribute.value] : null;
  };

  const getItemColors = () => {
    return extractAttribute("colors") || [];
  };

  const getItemSizes = () => {
    return extractAttribute("size") || [];
  };

  const getOtherAttributes = () => {
    if (!currentItem.attributes || !Array.isArray(currentItem.attributes)) return [];
    return currentItem.attributes.filter(attr =>
      attr.name !== "colors" && attr.name !== "size"
    );
  };

  const handleNextImage = () => {
    if (currentImageIndex < (currentItem?.images?.length - 1 || 0)) {
      setCurrentImageIndex(currentImageIndex + 1);
      setImageLoading(true);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setImageLoading(true);
    }
  };

  function handleDelete() {
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await deleteItem({ id: currentItem.id, token });
      if (res.data.status === 200) {
        refetch();
        saleRefetch();
        toast.success("Item deleted successfully");
        setLoading(false);
        navigator("/dashboard/list");
      }
    } catch (error) {
      toast.error(
        error?.message || error || "An error occurred while deleting the item"
      );
      setLoading(false);
    }
  }

  const handleEdit = () => {
    navigator(`/dashboard/list/update/${currentItem.id}`);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MdInventory className="mx-auto text-6xl text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Item Not Found</h2>
          <p className="text-gray-500 mb-4">The item you're looking for doesn't exist.</p>
          <button
            onClick={() => navigator("/dashboard/list")}
            className="btn btn-primary"
          >
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  const colors = getItemColors();
  const sizes = getItemSizes();
  const otherAttributes = getOtherAttributes();
  const retailDiscount = getDiscountPercentage(currentItem.price, currentItem.price_discount);
  const wholesaleDiscount = getDiscountPercentage(currentItem.wholesale_price, currentItem.wholesale_price_discount);
  const hasDiscount = retailDiscount > 0 || wholesaleDiscount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <AlertBox
        isOpen={alertBox}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Item Details</h1>
            <p className="text-gray-600 mt-2">View complete product information and specifications</p>
          </div>
          <button
            onClick={() => navigator("/dashboard/list")}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdClose className="text-xl" />
            <span className="font-medium">Close</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Column - Image Gallery */}
            <div className="lg:w-1/2 p-8">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden aspect-square border border-gray-200">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentItem?.images?.[currentImageIndex]}
                    src={currentItem?.images?.[currentImageIndex]?.image || currentItem?.image || ''}
                    alt={currentItem?.name}
                    className="w-full h-full object-contain p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imageLoading ? 0 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onLoad={() => setImageLoading(false)}
                  />
                </AnimatePresence>

                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {/* Discount Ribbon */}
                {hasDiscount && (
                  <div className="absolute top-0 right-0">
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
                <div className="absolute top-4 left-4">
                  <Tag color={currentItem.stock > 0 ? "green" : "red"} className="!m-0 font-medium shadow-sm">
                    {currentItem.stock > 0 ? `In Stock: ${currentItem.stock}` : "Out of Stock"}
                  </Tag>
                </div>

                {/* Item Code */}
                <div className="absolute bottom-4 left-4">
                  <Tag color="blue" className="!m-0 font-medium shadow-sm">
                    <MdQrCode className="inline mr-2" />
                    {currentItem.code}
                  </Tag>
                </div>

                {/* Navigation Arrows */}
                {(currentItem?.images?.length || 0) > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                      className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 ${currentImageIndex === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:scale-110"
                        }`}
                    >
                      <MdKeyboardArrowLeft className="text-2xl text-gray-800" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      disabled={currentImageIndex === ((currentItem.images?.length || 0) - 1)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200 ${currentImageIndex === (currentItem.images?.length || 0) - 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:scale-110"
                        }`}
                    >
                      <MdKeyboardArrowRight className="text-2xl text-gray-800" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {(currentItem?.images?.length || 0) > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {currentItem.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {(currentItem?.images?.length || 0) > 1 && (
                <div className="flex gap-3 mt-6 justify-center">
                  {currentItem.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setImageLoading(true);
                      }}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${currentImageIndex === index
                        ? "border-blue-500 shadow-lg scale-105"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <img
                        src={img.image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="lg:w-1/2 p-8 border-l border-gray-200">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  {/* Brand and Categories */}
                  <div className="flex items-center gap-2 mb-3">
                    <Tag color="purple" className="!m-0 font-medium capitalize">
                      {currentItem.brand_name}
                    </Tag>
                    <Tag color="blue" className="!m-0 font-medium capitalize">
                      {currentItem.category_name}
                    </Tag>
                    {currentItem.scale_name && (
                      <Tag color="orange" className="!m-0 font-medium capitalize">
                        <MdScale className="inline mr-1" />
                        {currentItem.scale_name}
                      </Tag>
                    )}
                  </div>

                  {/* Item Name */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    {currentItem.name}
                  </h1>

                  {/* Rating and Reviews */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Rate
                        disabled
                        defaultValue={currentItem.rating || 0}
                        className="text-lg"
                        style={{ fontSize: '18px' }}
                      />
                      <span className="text-sm text-gray-600">
                        ({currentItem.reviews || 0} reviews)
                      </span>
                    </div>
                    <Divider type="vertical" className="h-6" />
                    <div className="flex items-center gap-1 text-gray-600">
                      <MdShoppingCart className="text-lg" />
                      <span className="text-sm font-medium">{currentItem?.stock?.sold || 0} sold</span>
                    </div>
                    <Divider type="vertical" className="h-6" />
                    <div className="flex items-center gap-1 text-gray-600">
                      <MdInventory className="text-lg" />
                      <span className="text-sm font-medium">ID: {currentItem.id}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Pricing Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MdAttachMoney className="text-xl text-green-600" />
                    Pricing Information
                  </h3>

                  {/* Retail Price Card */}
                  <Card className="border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Retail Price</div>
                        {retailDiscount > 0 && (
                          <Badge count={`-${retailDiscount}%`} color="red" className="ml-2" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {retailDiscount > 0 && (
                            <div className="text-lg text-gray-400 line-through">
                              ${formatCurrency(currentItem.price)}
                            </div>
                          )}
                          <div className="text-2xl font-bold text-gray-900">
                            ${formatCurrency(currentItem.price_discount)}
                          </div>
                        </div>
                        {retailDiscount > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            Save ${formatCurrency(currentItem.price - currentItem.price_discount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Wholesale Price Card */}
                  <Card className="border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Wholesale Price</div>
                        {wholesaleDiscount > 0 && (
                          <Badge count={`-${wholesaleDiscount}%`} color="orange" className="ml-2" />
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {wholesaleDiscount > 0 && (
                            <div className="text-lg text-gray-400 line-through">
                              ${formatCurrency(currentItem.wholesale_price)}
                            </div>
                          )}
                          <div className="text-xl font-bold text-blue-700">
                            ${formatCurrency(currentItem.wholesale_price_discount)}
                          </div>
                        </div>
                        {wholesaleDiscount > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            Save ${formatCurrency(currentItem.wholesale_price - currentItem.wholesale_price_discount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Overall Discount */}
                  <div className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MdLocalOffer className="text-2xl text-orange-600" />
                      <div>
                        <div className="text-sm text-gray-600">Overall Discount</div>
                        <div className="text-lg font-bold text-orange-700">
                          {currentItem.discount || 0}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Item Code</div>
                      <div className="text-lg font-mono font-bold text-gray-900">
                        {currentItem.code}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Attributes Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <GiFruitBowl className="text-xl text-purple-600" />
                    Product Specifications
                  </h3>

                  {/* Colors */}
                  {colors.length > 0 && (
                    <Card className="border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <FaPalette className="text-2xl text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-2">Available Colors</h4>
                          <div className="flex gap-3 flex-wrap">
                            {colors.map((color, idx) => (
                              <div key={idx} className="flex flex-col items-center gap-1">
                                <div
                                  className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-md hover:scale-110 transition-transform duration-200 cursor-pointer"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                                <span className="text-xs text-gray-500 font-mono max-w-[60px] truncate">
                                  {color}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Sizes */}
                  {sizes.length > 0 && (
                    <Card className="border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <FaRuler className="text-2xl text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-2">Available Sizes</h4>
                          <div className="flex gap-2 flex-wrap">
                            {sizes.map((size, idx) => (
                              <Tag
                                key={idx}
                                color="blue"
                                className="!m-0 !text-sm py-1.5 px-3 font-medium hover:scale-105 transition-transform"
                              >
                                {size.toUpperCase()}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Other Attributes */}
                  {otherAttributes.length > 0 && (
                    <Card className="border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-50 rounded-lg">
                          <FaTag className="text-2xl text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-3">Additional Specifications</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherAttributes.map((attr, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                  {attr.name}
                                </div>
                                <div className="text-lg font-semibold text-gray-800 mt-1">
                                  {Array.isArray(attr.value) ? attr.value.join(', ') : attr.value}
                                  {attr.type === 'number' && (
                                    <span className="text-sm text-gray-500 ml-1">units</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <Divider />

                {/* Sales Performance */}
                <Card className="border border-gray-200 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-4 mb-4">
                    <MdBarChart className="text-2xl text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Statistic
                      title="Units Sold"
                      value={currentItem?.stock?.sold || 0}
                      valueStyle={{ color: '#3f51b5' }}
                      prefix={<MdShoppingCart className="text-lg" />}
                    />
                    <Statistic
                      title="Current Stock"
                      value={currentItem?.stock?.in_stock || 0}
                      valueStyle={{ color: currentItem?.stock?.in_stock > 0 ? '#4caf50' : '#f44336' }}
                      prefix={<MdInventory className="text-lg" />}
                    />
                    <Statistic
                      title="Rating"
                      value={currentItem.rating || 0}
                      precision={1}
                      valueStyle={{ color: '#ff9800' }}
                      prefix={<MdStar className="text-lg" />}
                      suffix={`/5 (${currentItem.reviews || 0} reviews)`}
                    />
                    <Statistic
                      title="Discount Applied"
                      value={currentItem.discount || 0}
                      suffix="%"
                      valueStyle={{ color: '#ff5722' }}
                      prefix={<MdLocalOffer className="text-lg" />}
                    />
                  </div>
                </Card>

                {/* Stock Status Alert */}
                <div className={`flex items-center justify-between p-4 rounded-lg border ${currentItem?.stock?.in_stock > 0
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${currentItem?.stock?.in_stock > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
                    <div>
                      <div className={`font-medium ${currentItem?.stock?.in_stock > 0 ? "text-green-800" : "text-red-800"}`}>
                        {currentItem?.stock?.in_stock > 0 ? "✓ In Stock" : "✗ Out of Stock"}
                      </div>
                      <div className={`text-sm ${currentItem?.stock?.in_stock > 0 ? "text-green-600" : "text-red-600"}`}>
                        {currentItem?.stock?.in_stock > 0
                          ? `${currentItem?.stock?.in_stock} units available for immediate dispatch`
                          : "This item is currently unavailable for purchase"
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleEdit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <RiEditLine className="text-lg" />
                    Edit Item
                  </button>
                  <button
                    onClick={() => navigator("/dashboard/list")}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <MdClose className="text-lg" />
                    Back to List
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-6 bg-gradient-to-r from-red-500 to-red-600 text-white border border-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    title="Delete Item"
                  >
                    <RiDeleteBin6Line className="text-lg" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ItemDetails;