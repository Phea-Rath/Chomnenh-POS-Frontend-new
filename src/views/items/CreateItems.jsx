import React, { useEffect, useState, useRef } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { useGetAllBrandQuery } from "../../../app/Features/brandsSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllScalesQuery } from "../../../app/Features/scalesSlice";
import {
  useCreateItemMutation,
  useUpdateItemMutation,
  useGetAllItemsQuery,
  useGetItemByIdQuery,
} from "../../../app/Features/itemsSlice";
import { Button, Divider, Input, Select, Space } from "antd";
import { FaSave, FaTimes, FaPalette, FaTag, FaBox, FaTrash, FaPlus, FaEdit } from "react-icons/fa";
import api from "../../services/api";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { IoPulseOutline } from "react-icons/io5";
import { useGetAllAttributeQuery } from "../../../app/Features/attributesSlice";

const ItemForm = () => {
  const { id } = useParams(); // Get item ID from URL if editing
  const isEditMode = Boolean(id);
  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const { setLoading, loading } = useOutletsContext();
  const { refetch } = useGetAllItemsQuery({ token, limit: 12, page: 1 });

  // State management
  const [viewImages, setViewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [existingImageId, setExistingImageId] = useState([]);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scales, setScales] = useState([]);
  const [brands, setBrands] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [errors, setErrors] = useState({});
  const [attributes, setAttributes] = useState([]);
  const [attributesAll, setAttributesAll] = useState([]);
  const [attributeName, setAttributeName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef(null);

  // Item state following the response format
  const [item, setItem] = useState({
    name: "",
    code: "",
    price: "",
    price_discount: "",
    wholesale_price: "",
    wholesale_price_discount: "",
    category_id: "",
    brand_id: "",
    scale_id: "",
    discount: 0,
  });

  // Queries and Mutations
  const { data: itemData, refetch: refetchItem } = useGetItemByIdQuery({ token, id }, { skip: !isEditMode });

  const [createItem] = useCreateItemMutation();
  const [updateItem] = useUpdateItemMutation();

  const brandContext = useGetAllBrandQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const scaleContext = useGetAllScalesQuery(token);
  const saleContext = useGetAllSaleQuery(token);
  const attributeContext = useGetAllAttributeQuery(token);

  // Helper function to extract colors from attributes
  const getColorsFromAttributes = () => {
    if (!attributes || !Array.isArray(attributes)) return [];
    const colorAttribute = attributes.find(attr => attr.name === "colors");
    if (colorAttribute && colorAttribute.value) {
      return Array.isArray(colorAttribute.value)
        ? colorAttribute.value
        : colorAttribute.value.split(',').map(c => c.trim());
    }
    return [];
  };

  // Helper function to update colors in attributes
  const updateColorsInAttributes = (newColors) => {
    const colorAttributeIndex = attributes.findIndex(attr => attr.name === "colors");

    if (colorAttributeIndex !== -1) {
      // Update existing colors attribute
      const updatedAttributes = [...attributes];
      updatedAttributes[colorAttributeIndex] = {
        ...updatedAttributes[colorAttributeIndex],
        value: newColors
      };
      setAttributes(updatedAttributes);
    } else {
      // Add new colors attribute
      setAttributes([
        ...attributes,
        {
          name: "colors",
          type: "select",
          value: newColors
        }
      ]);
    }
  };

  // Load existing item data when in edit mode
  useEffect(() => {
    if (isEditMode && itemData?.data) {
      const data = itemData.data;

      // Set basic item information
      setItem({
        name: data.name || "",
        code: data.code || "",
        price: data.price || "",
        price_discount: data.price_discount || "",
        wholesale_price: data.wholesale_price || "",
        wholesale_price_discount: data.wholesale_price_discount || "",
        category_id: data.category_id || "",
        brand_id: data.brand_id || "",
        scale_id: data.scale_id || "",
        discount: data.discount || 0,
      });

      // Set existing images
      if (data.images && data.images.length > 0) {
        setExistingImages(data.images);
      }

      // Set attributes from the attributes array
      if (data.attributes && Array.isArray(data.attributes)) {
        const formattedAttributes = data.attributes.map(attr => ({
          name: attr.name,
          type: attr.type,
          value: Array.isArray(attr.value) ? attr.value.map(i => i.value).join(',') : [attr.value]
        }));
        setAttributes(formattedAttributes);
      }
    }
  }, [isEditMode, itemData]);

  // Load dropdown data
  useEffect(() => {
    setBrands(brandContext.data?.data || []);
    setCategories(categoryContext.data?.data || []);
    setScales(scaleContext.data?.data || []);
    setAttributesAll(attributeContext.data?.data || []);
  }, [
    brandContext.data,
    categoryContext.data,
    scaleContext.data,
    attributeContext.data,
  ]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!item.name || item.name.trim() === '') {
      newErrors.name = 'Item name is required';
    }

    if (!item.price || item.price === '') {
      newErrors.price = 'Item price is required';
    } else if (isNaN(item.price) || parseFloat(item.price) <= 0) {
      newErrors.price = 'Item price must be a valid positive number';
    }

    if (!item.category_id || item.category_id === '') {
      newErrors.category_id = 'Category is required';
    }

    if (!item.brand_id || item.brand_id === '') {
      newErrors.brand_id = 'Brand is required';
    }

    // Check if colors attribute exists
    const colors = getColorsFromAttributes();
    if (colors.length === 0) {
      newErrors.colors = 'At least one color is required';
    }

    if (existingImages.length === 0 && viewImages.length === 0) {
      newErrors.images = 'At least one item image is required';
    }

    // Validate other attributes
    attributes.forEach((attr, index) => {
      if (attr.name !== "colors" && (!attr.name || attr.name.trim() === "")) {
        newErrors[`attribute_${index}_name`] = "Attribute name is required";
      }
      if (attr.name !== "colors" && (!attr.value || (Array.isArray(attr.value) && attr.value.length === 0))) {
        newErrors[`attribute_${index}_value`] = "Attribute value is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    setLoading(true);
    console.log(existingImageId);

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting");
      setLoading(false);
      return;
    }

    setAlertBox(false);
    const formData = new FormData();

    // Append basic fields
    formData.append("edit_id", id || "");
    formData.append("item_name", item.name);
    formData.append("item_price", item.price);
    formData.append("item_cost", 0);
    formData.append("price_discount", item.price_discount || item.price);
    formData.append("wholesale_price", item.wholesale_price || "");
    formData.append("wholesale_price_discount", item.wholesale_price_discount || item.wholesale_price || "");
    formData.append("category_id", item.category_id);
    formData.append("brand_id", item.brand_id);
    formData.append("scale_id", item.scale_id);
    formData.append("discount", item.discount || 0);

    attributes.forEach((i) => {
      if (i.name == "colors") {
        formData.append("colors[]", i.value || []);
      }
    })

    // Append attributes - ensure colors are properly formatted
    const formattedAttributes = attributes.map(attr => ({
      name: attr.name,
      type: attr.type,
      value: (Array.isArray(attr.value) ? attr.value.join(',') : attr.value)
    }));

    formData.append("attributes", JSON.stringify(formattedAttributes));

    // Append new images
    images.forEach((image, index) => {
      formData.append(`item_images[]`, image);
    });

    if (existingImageId.length > 0) {
      existingImageId.forEach((id, index) => {
        formData.append(`edit_image_id[]`, id);
      });
    } else {
      formData.append(`edit_image_id`, null);
    }

    // Append existing images for update
    if (isEditMode && existingImages.length > 0) {
      formData.append("existing_images", JSON.stringify(existingImages));
    }

    try {
      let response;
      if (isEditMode) {
        response = await api.post(`/items/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
      } else {
        response = await api.post("/items", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        });
      }

      if (response.data.status == 200) {
        refetch();
        if (isEditMode) refetchItem();
        saleContext.refetch();
        toast.success(response.data.message || `Item ${isEditMode ? 'updated' : 'created'} successfully`);
        setLoading(false);
        navigator("/dashboard/list");
        // }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error?.response?.data?.message || `An error occurred while ${isEditMode ? 'updating' : 'creating'} the item`
      );
      setLoading(false);
    }
  };

  function handleCancel() {
    setAlertBox(false);
  }

  function handleSubmit() {

    console.log(existingImageId);
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
  }

  function changeUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validFiles = [];
      const invalidFiles = [];
      const oversizedFiles = [];

      files.forEach(file => {
        if (!validTypes.includes(file.type)) {
          invalidFiles.push(file.name);
        } else if (file.size > 2 * 1024 * 1024) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          images: `Invalid file type: ${invalidFiles.join(', ')}. Please select valid image files`
        }));
      }

      if (oversizedFiles.length > 0) {
        setErrors(prev => ({
          ...prev,
          images: `Files too large: ${oversizedFiles.join(', ')}. Max size 2MB each`
        }));
      }

      if (validFiles.length > 0) {
        const newViewImages = validFiles.map(file => URL.createObjectURL(file));
        setViewImages(prev => [...prev, ...newViewImages]);
        setImages([...validFiles]);
        setErrors(prev => ({ ...prev, images: '' }));
      }
    }
  }

  function removeImage(index) {
    setViewImages(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index, id) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setExistingImageId(prev => [...prev, id]);
  }

  // Attribute functions
  const addAttribute = () => {
    setAttributes(prev => [...prev, { name: '', type: 'text', value: [] }]);
  };

  const updateAttribute = (index, field, value) => {
    setAttributes(prev => prev.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    ));
  };

  const removeAttribute = (index) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  const updateAttributeValue = (index, newValue) => {
    setAttributes(prev =>
      prev.map((attr, i) =>
        i === index ? { ...attr, value: newValue } : attr
      )
    );
  };

  const renderAttributeValueInput = (attribute, index) => {
    switch (attribute.type) {
      case 'boolean':
        return (
          <select
            value={attribute.value[0] || "false"}
            onChange={(e) => updateAttributeValue(index, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'select':
        return (
          <div className="space-y-2">
            <textarea
              value={Array.isArray(attribute.value) ? attribute.value.join(",") : attribute.value}
              onChange={(e) => updateAttributeValue(index, e.target.value)}
              placeholder="Enter values separated by commas (e.g., Red,Blue,Green)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
            />
            {/* <div className="flex flex-wrap gap-2">
              {Array.isArray(attribute.value) &&
                attribute.value.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {val}
                  </span>
                ))}
            </div> */}
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={Array.isArray(attribute.value) ? attribute.value[0] : attribute.value || ""}
            onChange={(e) => updateAttributeValue(index, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      default:
        return (
          <input
            type="text"
            value={Array.isArray(attribute.value) ? attribute.value[0] : attribute.value || ""}
            onChange={(e) => updateAttributeValue(index, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  // Helper function to get input classes with error styling
  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-4 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white";
    return errors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  // Helper function to get select classes with error styling
  const getSelectClass = (fieldName) => {
    const baseClass = "w-full px-4 py-2 border text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white";
    return errors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  const inputRef = useRef(null);
  const onAttributeName = event => {
    setAttributeName(event.target.value);
  };

  const addItem = e => {
    e.preventDefault();
    setAttributesAll([...attributesAll, { name: attributeName }]);
    setAttributeName("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Color handling functions
  const colors = getColorsFromAttributes();

  const addColor = (color) => {
    const newColors = [...colors, color];
    updateColorsInAttributes(newColors);
  };

  const removeColor = (index) => {
    const newColors = colors.filter((_, i) => i !== index);
    updateColorsInAttributes(newColors);
  };

  const handleColorPick = (color) => {
    addColor(color);
    setIsOpen(false);
  };

  const handleCustomColor = (e) => {
    addColor(e.target.value);
  };

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="mx-auto px-2">
        <AlertBox
          isOpen={alertBox}
          title="Confirmation"
          message={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this item?`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={isEditMode ? "Update" : "Create"}
          cancelText="Cancel"
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Item' : 'Create New Item'}
          </h1>
          <p className="text-gray-600">
            {isEditMode ? 'Update product information' : 'Add a new product to your inventory system'}
          </p>
        </div>

        <div className="bg-transparent rounded-2xl p-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Product Images <span className="text-red-500">*</span>
                  </h2>
                  {(viewImages.length > 0 || existingImages.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewImages([]);
                        setExistingImages([]);
                      }}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <FaTrash className="text-xs" />
                      Remove All
                    </button>
                  )}
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.image}
                            alt={`Existing item ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index, image.image_id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {viewImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">New Images</h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {viewImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`New item preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label
                  htmlFor="image-item"
                  className={`block cursor-pointer transition-all duration-200 ${errors.images ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                    }`}
                  data-field="images"
                >
                  <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${errors.images
                    ? 'border-red-500 bg-red-25'
                    : viewImages.length > 0 || existingImages.length > 0
                      ? 'border-blue-300 bg-blue-25'
                      : 'border-gray-400 hover:border-blue-400 hover:bg-blue-25'
                    }`}>
                    <div className="text-center py-4">
                      <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {(viewImages.length > 0 || existingImages.length > 0) ? 'Add more images' : 'Upload product images'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse multiple files</p>
                      <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                        Browse files
                      </div>
                    </div>
                  </div>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={changeUpload}
                  id="image-item"
                  hidden
                  name="image-item"
                  multiple
                />

                {errors.images && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {errors.images}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Max size 2MB each • JPEG, PNG, GIF, WebP
                  <span className="text-red-500 ml-1">* Required</span>
                </p>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
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
                          onChange={(e) => setItem({ ...item, name: e.target.value })}
                          value={item.name}
                          type="text"
                          className={getInputClass('name')}
                          placeholder="Enter product name..."
                          data-field="name"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.name}
                          </div>
                        )}
                      </div>

                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Item Code
                        </label>
                        <input
                          onChange={(e) => setItem({ ...item, code: e.target.value })}
                          value={item.code}
                          type="text"
                          className={getInputClass('code')}
                          placeholder="PRD-00001"
                          data-field="code"
                        />
                      </div> */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Retail Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          onChange={(e) => setItem({ ...item, price: e.target.value })}
                          value={item.price}
                          type="number"
                          step="0.01"
                          min="0"
                          className={getInputClass('price')}
                          placeholder="0.00"
                          data-field="price"
                        />
                        {errors.price && (
                          <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            {errors.price}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wholesale Price
                        </label>
                        <input
                          onChange={(e) => setItem({ ...item, wholesale_price: e.target.value })}
                          value={item.wholesale_price}
                          type="number"
                          step="0.01"
                          min="0"
                          className={getInputClass('wholesale_price')}
                          placeholder="0.00"
                          data-field="wholesale_price"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Discount */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
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
                          onChange={(e) => setItem({ ...item, discount: e.target.value })}
                          value={item.discount}
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className={getInputClass('discount')}
                          placeholder="0.00"
                          data-field="discount"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
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
                          onChange={(e) => setItem({ ...item, category_id: e.target.value })}
                          value={item.category_id}
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
                          onChange={(e) => setItem({ ...item, brand_id: e.target.value })}
                          value={item.brand_id}
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
                          onChange={(e) => setItem({ ...item, scale_id: e.target.value })}
                          value={item.scale_id}
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

                      {/* Color Selection - Integrated with Attributes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Colors <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full" ref={wrapperRef}>
                          <div className={`flex border rounded-lg shadow-sm bg-white ${errors.colors ? 'border-red-500' : 'border-gray-300'
                            }`}>
                            <input
                              type="color"
                              className="h-12 w-16 p-1 rounded-l cursor-pointer border-r border-gray-300"
                              onChange={handleCustomColor}
                              defaultValue="#000000"
                            />
                            <button
                              type="button"
                              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors flex items-center justify-between"
                              onClick={() => setIsOpen(!isOpen)}
                            >
                              <span>Pick Color</span>
                              <FaPalette className="text-lg" />
                            </button>
                          </div>
                          {errors.colors && (
                            <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              {errors.colors}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Colors Display */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {colors.map((color, index) => (
                            <div key={index} className="relative group">
                              <div
                                className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <button
                                type="button"
                                onClick={() => removeColor(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        {colors.length === 0 && (
                          <p className="text-sm text-gray-500 mt-2">No colors selected yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attributes Section (Excluding Colors) */}
              <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaBox className="text-orange-500 text-xl" />
                    <h2 className="text-lg font-semibold text-gray-800">Product Attributes</h2>
                    <span className="text-sm text-gray-500">(Excluding colors)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <FaPlus />
                    Add Attribute
                  </button>
                </div>

                <div className="space-y-4">
                  {attributes.filter(attr => attr.name !== "colors").map((attribute, index) => {
                    const actualIndex = attributes.findIndex(a => a === attribute);
                    return (
                      <div key={actualIndex} className="flex gap-3 items-start p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <Select
                            style={{ width: '100%' }}
                            placeholder="Select attribute name"
                            value={attribute.name}
                            onChange={(value) => updateAttribute(actualIndex, 'name', value)}
                            popupRender={menu => (
                              <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Space style={{ padding: '0 8px 4px' }}>
                                  <Input
                                    placeholder="Enter new attribute name"
                                    ref={inputRef}
                                    value={attributeName}
                                    onChange={onAttributeName}
                                    onKeyDown={e => e.stopPropagation()}
                                  />
                                  <Button type="text" icon={<IoPulseOutline />} onClick={addItem}>
                                    Add attribute
                                  </Button>
                                </Space>
                              </>
                            )}
                            options={attributesAll?.filter(attr => attr.name !== "colors").map(item => ({
                              label: item.name,
                              value: item.name
                            }))}
                          />
                          {errors[`attribute_${actualIndex}_name`] && (
                            <div className="text-red-500 text-sm mt-1">{errors[`attribute_${actualIndex}_name`]}</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                          <select
                            value={attribute.type}
                            onChange={(e) => updateAttribute(actualIndex, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="select">Select</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                          {renderAttributeValueInput(attribute, actualIndex)}
                          {errors[`attribute_${actualIndex}_value`] && (
                            <div className="text-red-500 text-sm mt-1">{errors[`attribute_${actualIndex}_value`]}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttribute(actualIndex)}
                          className="mt-6 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    );
                  })}

                  {attributes.filter(attr => attr.name !== "colors").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FaBox className="text-4xl mx-auto mb-3 opacity-50" />
                      <p>No additional attributes added yet. Click "Add Attribute" to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium"
              onClick={() => navigator("/dashboard/list")}
              disabled={loading}
            >
              <FaTimes />
              Cancel
            </button>
            <button
              type="button"
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 gap-3 flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
              onClick={handleSubmit}
              disabled={loading}
            >
              {isEditMode ? <FaEdit className="text-lg" /> : <FaSave className="text-lg" />}
              {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Item' : 'Create Item')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemForm;