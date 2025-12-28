import React, { useEffect, useRef, useState } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import {
  useGetAllItemsQuery,
  useUpdateItemMutation,
} from "../../../app/Features/itemsSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllBrandQuery } from "../../../app/Features/brandsSlice";
import { useGetAllScalesQuery } from "../../../app/Features/scalesSlice";
import { useGetAllSizesQuery } from "../../../app/Features/sizesSlice";
import { useGetAllColorQuery } from "../../../app/Features/colorsSlice";
import api from "../../services/api";
import { toast } from "react-toastify";
import { Popconfirm } from "antd";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useNavigate } from "react-router";
import { FaSave, FaTimes, FaPalette, FaTag, FaBox, FaRuler, FaWeight, FaLayerGroup, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const UpdateItems = () => {
  const [viewImage, setViewImage] = useState();
  const [alertBox, setAlertBox] = useState(false);
  const [items, setitems] = useState({ color_pick: "#000000" });
  const [itemData, setitemData] = useState();
  const navigator = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const token = localStorage.getItem("token");
  const { setLoading, loading } = useOutletsContext();
  const allItem = useGetAllItemsQuery(token);
  const [categories, setCategories] = useState([]);
  const [scales, setScales] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [brands, setBrands] = useState([]);
  const [updateItem, itemUp] = useUpdateItemMutation();
  const brandContext = useGetAllBrandQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const scaleContext = useGetAllScalesQuery(token);
  const sizeContext = useGetAllSizesQuery(token);
  const colorContext = useGetAllColorQuery(token);
  const saleContext = useGetAllSaleQuery(token);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [data, setData] = useState(
    JSON.parse(localStorage.getItem("itemEdit"))
  );

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setData(data);
    setitems(data || {});
  }, [data]);

  useEffect(() => {
    setitemData(data);
    setCategories(categoryContext?.data?.data);
    setBrands(brandContext?.data?.data);
    setScales(scaleContext?.data?.data);
    setSizes(sizeContext?.data?.data);
    setColors(colorContext?.data?.data);
  }, [
    items,
    categoryContext?.data,
    brandContext?.data,
    scaleContext?.data,
    sizeContext?.data,
    colorContext?.data,
  ]);

  let currentImage = null;
  let currentItemId = null;

  if (itemData) {
    currentImage = itemData?.item_image[currentImageIndex];
    currentItemId = currentImage?.item_id;
  }

  useEffect(() => {
    if (itemData) {
      setViewImage(itemData?.item_image?.[currentImageIndex]?.image);

      const currentCost =
        itemData?.item_cost?.find((c) => c.item_id === currentItemId)?.cost ||
        0;
      const currentWholsale =
        itemData?.wholesale_price?.find((c) => c.item_id === currentItemId)
          ?.price || 0;
      const currentDiscount =
        itemData?.discount?.find((c) => c.item_id === currentItemId)?.persent ||
        0;
      const currentPrice =
        itemData?.item_price?.find((p) => p.item_id === currentItemId)?.price ||
        0;
      const currentColor =
        itemData?.color_pick?.find((c) => c.item_id === currentItemId)?.color ||
        "";
      const currentSize =
        itemData?.size_name?.find((s) => s.item_id === currentItemId)?.id || "";

      setitems((p) => ({
        ...p,
        item_cost: currentCost,
        wholesale_price: currentWholsale,
        discount: currentDiscount,
        item_price: currentPrice,
        color_pick: currentColor,
        size_id: currentSize,
        color_id: 1.2,
      }));
    }
  }, [itemData, currentItemId, currentImageIndex, allItem]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!items.item_name || items.item_name.trim() === '') {
      newErrors.item_name = 'Item name is required';
    }

    if (!items.item_price || items.item_price === '') {
      newErrors.item_price = 'Item price is required';
    } else if (isNaN(items.item_price) || parseFloat(items.item_price) <= 0) {
      newErrors.item_price = 'Item price must be a valid positive number';
    }

    if (!items.category_id || items.category_id === '') {
      newErrors.category_id = 'Category is required';
    }

    if (!items.brand_id || items.brand_id === '') {
      newErrors.brand_id = 'Brand is required';
    }

    if (!items.scale_id || items.scale_id === '') {
      newErrors.scale_id = 'Scale is required';
    }

    if (!items.size_id || items.size_id === '') {
      newErrors.size_id = 'Size is required';
    }

    if (items.color_id === '') {
      newErrors.color_id = 'Color is required';
    }

    if (items.wholesale_price && (isNaN(items.wholesale_price) || parseFloat(items.wholesale_price) < 0)) {
      newErrors.wholesale_price = 'Wholesale price must be a valid non-negative number';
    }

    if (items.discount && (isNaN(items.discount) || parseFloat(items.discount) < 0 || parseFloat(items.discount) > 100)) {
      newErrors.discount = 'Discount must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextImage = () => {
    if (currentImageIndex < itemData?.item_image.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const filteredColors = colors?.filter((color) =>
    color.color_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted item when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  const handleSelect = (color) => {
    setitems((p) => {
      return {
        ...p,
        color_id: color.color_id,
        color_pick: color.color_pick || "#000000",
      };
    });
    setIsOpen(false);
  };

  async function handleConfirm(e) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      return;
    }

    setAlertBox(false);
    console.log(items);

    const formData = new FormData();
    formData.append("item_name", items.item_name);
    formData.append("item_cost", items.item_cost);
    formData.append("wholesale_price", items.wholesale_price);
    formData.append("item_price", items.item_price);
    formData.append("category_id", items.category_id);
    formData.append("brand_id", items.brand_id);
    formData.append("discount", Number(items.discount));
    formData.append("scale_id", items.scale_id);
    formData.append("color_id", items.color_id);
    formData.append("color_pick", items.color_pick);
    formData.append("size_id", items.size_id);
    formData.append("item_image", items.image);

    try {
      setLoading(true);
      setAlertBox(false);
      const res = await updateItem({
        id: currentItemId,
        itemData: formData,
        token,
      });

      if (res.data.status === 200) {
        refetch();
        saleContext.refetch();
        toast.success("Item updated successfully");
        setLoading(false);
        navigator(-1);
      } else {
        toast.error(res.data.message || "Failed to update item");
      }
    } catch (error) {
      toast.error(
        error?.message || error || "An error occurred while updating the item"
      );
      setLoading(false);
    }
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    setAlertBox(true);
    console.log(currentItemId, items);
  }

  function changeUpload(e) {
    const fileUpload = e.target.files[0];

    if (fileUpload) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(fileUpload.type)) {
        setErrors(prev => ({ ...prev, item_image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
        return;
      }

      if (fileUpload.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, item_image: 'Image size must be less than 2MB' }));
        return;
      }

      setViewImage(URL.createObjectURL(fileUpload));
      setitems((p) => {
        const updatedItemImages = [...p.item_image];
        updatedItemImages[currentImageIndex] = {
          ...updatedItemImages[currentImageIndex],
          image: URL.createObjectURL(fileUpload),
        };

        return {
          ...p,
          item_image: updatedItemImages,
          image: fileUpload,
        };
      });
      setErrors(prev => ({ ...prev, item_image: '' }));
    }
  }

  // Helper function to get input classes with error styling
  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white";
    return errors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  // Helper function to get select classes with error styling
  const getSelectClass = (fieldName) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white";
    return errors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AlertBox
          isOpen={alertBox}
          title="Confirmation"
          message="Are you sure you want to update this item?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Update"
          cancelText="Cancel"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Update Item
          </h1>
          <p className="text-gray-600">
            Modify product information and specifications
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8">
          {/* Validation Summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <h3 className="text-red-800 font-semibold text-lg">Please fix the following errors:</h3>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {Object.values(errors).map((error, index) => (
                  error && <li key={index} className="ml-4">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Product Images
                  </h2>
                  {viewImage && (
                    <button
                      type="button"
                      onClick={() => setViewImage(null)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <FaTimes className="text-xs" />
                      Remove
                    </button>
                  )}
                </div>

                {/* Main Image Display */}
                <div className="relative mb-4">
                  <label
                    htmlFor="up-image-item"
                    className={`block cursor-pointer transition-all duration-200 ${errors.item_image ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                      }`}
                    data-field="item_image"
                  >
                    <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${errors.item_image
                      ? 'border-red-500 bg-red-25'
                      : viewImage
                        ? 'border-blue-300 bg-blue-25'
                        : 'border-gray-400 hover:border-blue-400 hover:bg-blue-25'
                      }`}>
                      {viewImage ? (
                        <div className="text-center relative">
                          <img
                            className="h-48 w-48 object-cover rounded-lg shadow-md mx-auto"
                            src={viewImage}
                            alt="Item preview"
                          />
                          <p className="text-sm text-gray-600 mt-3">Click to change image</p>

                          {/* Image Navigation Arrows */}
                          {items?.item_image?.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between p-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePrevImage();
                                }}
                                className="w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                                disabled={currentImageIndex === 0}
                              >
                                <FaChevronLeft className="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleNextImage();
                                }}
                                className="w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                                disabled={currentImageIndex === items.item_image.length - 1}
                              >
                                <FaChevronRight className="text-sm" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-700 mb-2">Upload product image</h3>
                          <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                          <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                            Browse files
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={changeUpload}
                    id="up-image-item"
                    hidden
                    name="up-image-item"
                  />

                  {errors.item_image && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mt-3">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {errors.item_image}
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {items?.item_image?.length > 1 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">All Images</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {items.item_image.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-300 hover:border-gray-400"
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
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Max size 2MB • JPEG, PNG, GIF, WebP
                </p>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FaTag className="text-blue-500 text-xl" />
                      <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={items?.item_name || ''}
                          onChange={(e) => setitems((p) => ({ ...p, item_name: e.target.value }))}
                          type="text"
                          className={getInputClass('item_name')}
                          placeholder="Enter product name..."
                          data-field="item_name"
                        />
                        {errors.item_name && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.item_name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Retail Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={items?.item_price || ''}
                          onChange={(e) => setitems((p) => ({ ...p, item_price: e.target.value }))}
                          type="number"
                          step="0.01"
                          min="0"
                          className={getInputClass('item_price')}
                          placeholder="0.00"
                          data-field="item_price"
                        />
                        {errors.item_price && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.item_price}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wholesale Price
                        </label>
                        <input
                          value={items?.wholesale_price || ''}
                          onChange={(e) => setitems((p) => ({ ...p, wholesale_price: e.target.value }))}
                          type="number"
                          step="0.01"
                          min="0"
                          className={getInputClass('wholesale_price')}
                          placeholder="0.00"
                          data-field="wholesale_price"
                        />
                        {errors.wholesale_price && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.wholesale_price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Discount */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FaTag className="text-green-500 text-xl" />
                      <h2 className="text-lg font-semibold text-gray-800">Pricing & Discount</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount (%)
                        </label>
                        <input
                          value={items?.discount || ''}
                          onChange={(e) => setitems((p) => ({ ...p, discount: e.target.value }))}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className={getInputClass('discount')}
                          placeholder="0.00"
                          data-field="discount"
                        />
                        {errors.discount && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.discount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FaBox className="text-purple-500 text-xl" />
                      <h2 className="text-lg font-semibold text-gray-800">Specifications</h2>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={items?.category_id || ''}
                          onChange={(e) => setitems((p) => ({ ...p, category_id: e.target.value }))}
                          className={getSelectClass('category_id')}
                          data-field="category_id"
                        >
                          <option value="" disabled>Select category</option>
                          {categories?.map(({ category_name, category_id }, index) => (
                            <option key={index} value={category_id}>
                              {category_name}
                            </option>
                          ))}
                        </select>
                        {errors.category_id && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.category_id}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={items?.brand_id || ''}
                          onChange={(e) => setitems((p) => ({ ...p, brand_id: e.target.value }))}
                          className={getSelectClass('brand_id')}
                          data-field="brand_id"
                        >
                          <option value="" disabled>Select brand</option>
                          {brands?.map(({ brand_name, brand_id }, index) => (
                            <option key={index} value={brand_id}>
                              {brand_name}
                            </option>
                          ))}
                        </select>
                        {errors.brand_id && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.brand_id}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Scale <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={items?.scale_id || ''}
                          onChange={(e) => setitems((p) => ({ ...p, scale_id: e.target.value }))}
                          className={getSelectClass('scale_id')}
                          data-field="scale_id"
                        >
                          <option value="" disabled>Select scale</option>
                          {scales?.map(({ scale_name, scale_id }, index) => (
                            <option key={index} value={scale_id}>
                              {scale_name}
                            </option>
                          ))}
                        </select>
                        {errors.scale_id && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.scale_id}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Size <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={items?.size_id || ''}
                          onChange={(e) => setitems((p) => ({ ...p, size_id: e.target.value }))}
                          className={getSelectClass('size_id')}
                          data-field="size_id"
                        >
                          <option value="" disabled>Select size</option>
                          {sizes?.map(({ size_name, size_id }, index) => (
                            <option key={index} value={size_id}>
                              {size_name}
                            </option>
                          ))}
                        </select>
                        {errors.size_id && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.size_id}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full" ref={wrapperRef}>
                          <div className={`flex border rounded-lg shadow-sm bg-white ${errors.color_id ? 'border-red-500' : 'border-gray-300'}`}>
                            <input
                              type="color"
                              className="h-12 w-16 p-1 rounded-l cursor-pointer border-r border-gray-300"
                              value={items?.color_pick || "#000000"}
                              onChange={(e) => {
                                setitems((p) => {
                                  return {
                                    ...p,
                                    color_pick: e.target.value,
                                    color_id: 0,
                                  };
                                });
                              }}
                            />
                            <button
                              type="button"
                              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors flex items-center justify-between"
                              onClick={() => setIsOpen(!isOpen)}
                            >
                              <span>Select Color</span>
                              <FaPalette className="text-lg" />
                            </button>
                          </div>
                          {errors.color_id && (
                            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {errors.color_id}
                            </div>
                          )}

                          {isOpen && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {filteredColors?.length > 0 ? (
                                filteredColors?.map((color, index) => (
                                  <li
                                    key={color?.color_id}
                                    className={`px-4 py-3 cursor-pointer flex items-center ${index === highlightedIndex
                                      ? "bg-blue-100"
                                      : "hover:bg-gray-50"
                                      }`}
                                    onClick={() => handleSelect(color)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                  >
                                    <div
                                      className="w-6 h-6 rounded-full mr-3 border border-gray-300"
                                      style={{
                                        backgroundColor: color?.color_pick.toLowerCase(),
                                      }}
                                    />
                                    <div>
                                      <div className="font-medium text-gray-800">
                                        {color?.color_name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ID: {color?.color_id}
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li className="px-4 py-3 text-gray-500">
                                  No colors found
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium"
              onClick={() => navigator(-1)}
              disabled={loading}
            >
              <FaTimes />
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 gap-3 flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              <FaSave className="text-lg" />
              {loading ? 'Updating...' : 'Update Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateItems;