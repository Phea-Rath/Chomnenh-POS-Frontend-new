import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from 'framer-motion';
import {
  LuArrowLeft,
  LuSave,
  LuX,
  LuRefreshCw,
  LuImage,
  LuTag,
  LuPackage,
  LuTrash2,
  LuPlus,
  LuPalette,
  LuSettings2,
  LuInfo,
  LuFileText,
  LuBox
} from 'react-icons/lu';
import { IoMdCloudUpload } from "react-icons/io";
import { IoPulseOutline } from "react-icons/io5";
import { Divider, Select, Space, Alert } from "antd";
import { useTranslation } from "react-i18next";

import api from "../../services/api";
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
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllAttributeQuery } from "../../../app/Features/attributesSlice";
import Input from "../../utils/Input";
import RichSearch from "../../utils/RichSearch";
import Button from "../../utils/Button";
import { useNotify } from "../../utils/NotificationProvider";
import { definePermission } from "../../services/serviceFunction";
const MENU_ID = 6;
const ItemForm = () => {
  const { t } = useTranslation();
  const notify = useNotify();
  const { id } = useParams(); // Get item ID from URL if editing
  const isEditMode = Boolean(id);
  const navigator = useNavigate();
  const token = localStorage.getItem("token");
  const { setLoading, loading } = useOutletsContext();
  const { refetch } = useGetAllItemsQuery({ token, limit: 10, page: 1, search: "" });

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
  const [submissionError, setSubmissionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

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
  const { data: itemData, isLoading: itemLoading, refetch: refetchItem } = useGetItemByIdQuery({ token, id }, { skip: !isEditMode });

  const [createItem] = useCreateItemMutation();
  const [updateItem] = useUpdateItemMutation();

  const brandContext = useGetAllBrandQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const scaleContext = useGetAllScalesQuery(token);
  const saleContext = useGetAllSaleQuery({ token, limit: 10, page: 1, search: "" });
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
    const colorAttributeIndex = attributes.findIndex(attr => attr.name.toLowerCase() === "colors" || attr.name.toLowerCase() === "color");

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
      newErrors.name = t('itemNameRequired');
    }

    if (!item.price || item.price === '') {
      newErrors.price = t('itemPriceRequired');
    } else if (isNaN(item.price) || parseFloat(item.price) <= 0) {
      newErrors.price = t('itemPriceValid');
    }

    if (!item.category_id || item.category_id === '') {
      newErrors.category_id = t('categoryRequired');
    }

    if (!item.brand_id || item.brand_id === '') {
      newErrors.brand_id = t('brandRequired');
    }

    // Validate other attributes
    attributes.forEach((attr, index) => {
      if (attr.name !== "colors" && (!attr.name || attr.name.trim() === "")) {
        newErrors[`attribute_${index}_name`] = t('attributeNameRequired');
      }
      if (attr.name !== "colors" && (!attr.value || (Array.isArray(attr.value) && attr.value.length === 0))) {
        newErrors[`attribute_${index}_value`] = t('attributeValueRequired');
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    setSaving(true);
    setLoading(true);
    setSubmissionError(null);
    setAlertBox(false);

    const formData = new FormData();

    // Append basic fields
    formData.append("edit_id", id || "");
    formData.append("item_code", item.code);
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
      value: (Array.isArray(attr.value) ? attr.value.join(',') : attr.value)
    }));

    formData.append("attributes", JSON.stringify(formattedAttributes));

    // Append new images
    images.forEach((image) => {
      formData.append(`item_images[]`, image);
    });

    if (existingImageId.length > 0) {
      existingImageId.forEach((id) => {
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
        notify.success(t(isEditMode ? 'itemUpdated' : 'itemCreated'));
        navigator(-1);
      }
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || t('operationFailed');
      setSubmissionError(errMsg);
      notify.error(errMsg);
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAlertBox(false);
  };

  const handleSubmit = () => {
    setSubmissionError(null);
    if (!validateForm()) {
      notify.error(t('fixHighlightedFields'));
      return;
    }
    setAlertBox(true);
  };

  const handleReset = () => {
    setItem({
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
    setViewImages([]);
    setExistingImages([]);
    setImages([]);
    setAttributes([]);
    setErrors({});
  };

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
        notify.error(`${t('invalidFileType')}: ${invalidFiles.join(', ')}`);
      }

      if (oversizedFiles.length > 0) {
        notify.error(`${t('fileTooLarge')}: ${oversizedFiles.join(', ')}`);
      }

      if (validFiles.length > 0) {
        const newViewImages = validFiles.map(file => URL.createObjectURL(file));
        setViewImages(prev => [...prev, ...newViewImages]);
        setImages(prev => [...prev, ...validFiles]);
        setErrors(prev => ({ ...prev, images: '' }));
      }
    }
  }

  function removeImage(index) {
    setViewImages(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
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
            className="text-input"
          >
            <option value="true">{t('booleanTrue')}</option>
            <option value="false">{t('booleanFalse')}</option>
          </select>
        );
      case 'select':
        return (
          <textarea
            value={Array.isArray(attribute.value) ? attribute.value.join(",") : attribute.value}
            onChange={(e) => updateAttributeValue(index, e.target.value)}
            placeholder={t('attributeValuesSeparator')}
            className="textarea-input"
            rows="3"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            onWheel={(e) => e.target.blur()}
            value={Array.isArray(attribute.value) ? attribute.value[0] : attribute.value || ""}
            onChange={(value) => updateAttributeValue(index, value)}
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder="e,g. size, model, more feature, ..."
            value={Array.isArray(attribute.value) ? attribute.value[0] : attribute.value || ""}
            onChange={(value) => updateAttributeValue(index, value)}
          />
        );
    }
  };

  const onAttributeName = value => {
    setAttributeName(value);
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

  const handleCustomColor = (e) => {
    addColor(e.target.value);
  };

  if (isEditMode && itemLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-[#13b5ea]" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="view-page font-sans antialiased text-slate-900 dark:text-slate-100"
    >
      <AlertBox
        isOpen={alertBox}
        title={t('confirm')}
        message={isEditMode ? t('confirmUpdateItem') : t('confirmCreateItem')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? t('update') : t('create')}
        cancelText={t('cancel')}
      />

      <div>
        {/* Header Section */}
        <div className="border-b border-slate-200 dark:border-slate-600">
          <div className="p-4 flex gap-4 items-center justify-between bg-gray-50 dark:bg-gray-600">
            <div>
              <button
                type="button"
                onClick={() => navigator(-1)}
                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#13b5ea] hover:underline"
              >
                <LuArrowLeft size={14} />
                {t('backToItems')}
              </button>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isEditMode ? t('editItem') : t('createNewItem')}
                </h1>
                {isEditMode && id && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700">
                    #{id}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
              >
                {t('reset')}
              </button>
              <button
                type="button"
                onClick={() => navigator(-1)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[2px] text-[13px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!definePermission(MENU_ID).is_modify}
                disabled={saving}
                className="px-6 py-2 bg-[#13b5ea] hover:bg-[#0f92bd] text-white rounded-[2px] text-[13px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? <LuRefreshCw className="animate-spin" /> : <LuSave />}
                {saving ? t('saving') : isEditMode ? t('updateItem') : t('saveItem')}
              </button>
            </div>
          </div>
        </div>

        {submissionError && (
          <div className="mt-4 px-4 md:px-6">
            <Alert
              message={t('error')}
              description={submissionError}
              type="error"
              showIcon
              closable
              onClose={() => setSubmissionError(null)}
            />
          </div>
        )}

        <form className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3">
            {/* Left Column - Image Upload */}
            <div className="lg:col-span-4 dark:bg-gray-800/50 bg-gray-50">
              <div className="space-x-4 p-4 flex">
                <label
                  htmlFor="image-item"
                  className={`group min-w-40 max-h-44 relative block cursor-pointer overflow-hidden rounded-[2px] border-2 border-dashed transition-all duration-200 ${
                    errors.images 
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/10' 
                    : 'border-slate-400 dark:border-slate-700 hover:border-[#13b5ea] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-[#13b5ea]/10 group-hover:text-[#13b5ea] transition-all">
                        <IoMdCloudUpload size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {existingImages.length > 0 || viewImages.length > 0 ? t('addMoreImages') : t('clickToUpload')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('imageFormatsLimit')}</p>
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
                  multiple
                />
                {(existingImages.length > 0 || viewImages.length > 0) && (
                  <div className="flex flex-wrap grow gap-3 border mb-4">
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className="group relative aspect-square bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden">
                        <img
                          src={image.image}
                          alt="Existing"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index, image.image_id)}
                          className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <LuTrash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {viewImages.map((image, index) => (
                      <div key={`new-${index}`} className="group relative aspect-square bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden h-20 w-20">
                        <img
                          src={image}
                          alt="New"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <LuTrash2 size={12} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-[9px] font-bold uppercase text-center py-0.5">
                          {t('new')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </div>

            {/* Right Column - Form Fields */}
            <div className="col-span-8">
              {/* Basic Information */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <LuTag size={14} />
                  {t('basicInformation')}
                </h2>

                <div className="md:grid-cols-2 flex flex-col gap-4">
                  <div className="flex gap-4  px-4 border-t border-gray-200 dark:border-gray-500 py-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {t('itemName')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        onChange={(value) => setItem({ ...item, name: value })}
                        value={item.name}
                        placeholder={t('enterProductName')}
                        status={errors.name ? 'error' : ''}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-[11px] font-medium">{errors.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {t('itemCode')}
                      </label>
                      <Input
                        onChange={(value) => setItem({ ...item, code: value })}
                        value={item.code}
                        placeholder="PRD-00001"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      {t('category')} <span className="text-red-500">*</span>
                    </label>
                    <RichSearch
                      data={categories}
                      value={item.category_id}
                      onSelected={(value) => setItem({ ...item, category_id: value })}
                      keyFields={{ id: 'category_id', title: 'category_name' }}
                      placeholder={t('selectCategory')}
                    />
                    {errors.category_id && (
                      <p className="text-red-500 text-[11px] font-medium">{errors.category_id}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      {t('brand')} <span className="text-red-500">*</span>
                    </label>
                    <RichSearch
                      data={brands}
                      value={item.brand_id}
                      placeholder={t('selectBrand')}
                      onSelected={(value) => setItem({ ...item, brand_id: value })}
                      keyFields={{ id: 'brand_id', title: 'brand_name' }}
                    />
                    {errors.brand_id && (
                      <p className="text-red-500 text-[11px] font-medium">{errors.brand_id}</p>
                    )}
                  </div>

                  </div>

                  <div className="flex gap-4 px-4 border-t border-gray-200 dark:border-gray-500  py-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {t('retailPrice')} <span className="text-red-500">*</span>
                      </label>
                      <Input
                        onChange={(value) => setItem({ ...item, price: value })}
                        value={item.price}
                        type="number"
                        placeholder="0.00"
                        status={errors.price ? 'error' : ''}
                        addonBefore="$"
                      />
                      {errors.price && (
                        <p className="text-red-500 text-[11px] font-medium">{errors.price}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {t('wholesalePrice')}
                      </label>
                      <Input
                        onChange={(value) => setItem({ ...item, wholesale_price: value })}
                        value={item.wholesale_price}
                        type="number"
                        placeholder="0.00"
                        addonBefore="$"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                        {t('discountPercentage')}
                      </label>
                      <Input
                        onChange={(value) => setItem({ ...item, discount: value })}
                        value={item.discount}
                        type="number"
                        placeholder="0"
                        addonAfter="%"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Specifications */}
              <section>
                <h2 className="text-xs px-2 font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                  <LuPackage size={14} />
                  {t('specifications')}
                </h2>

                <div className="grid gap-6 md:grid-cols-2 px-4 border-t border-gray-200 dark:border-gray-500  py-4">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                      {t('scale')} <span className="text-red-500">*</span>
                    </label>
                    <RichSearch
                      data={scales}
                      value={item.scale_id}
                      placeholder={t('selectScale')}
                      onSelected={(value) => setItem({ ...item, scale_id: value })}
                      keyFields={{ id: 'scale_id', title: 'scale_name' }}
                    />
                    {errors.scale_id && (
                      <p className="text-red-500 text-[11px] font-medium">{errors.scale_id}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <LuPalette size={14} />
                      {t('colors')}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative group overflow-hidden rounded-[2px] border border-slate-200 dark:border-slate-800 w-[100px] h-[38px]">
                        <input
                          type="color"
                          className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer"
                          onChange={handleCustomColor}
                          defaultValue="#000000"
                        />
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[38px] px-2 border border-slate-200 dark:border-slate-800 rounded-[2px] bg-slate-50 dark:bg-slate-900/50">
                        {colors.map((color, index) => (
                          <div key={index} className="group relative">
                            <div
                              className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <button
                              type="button"
                              onClick={() => removeColor(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[8px]"
                            >
                              <LuX size={8} />
                            </button>
                          </div>
                        ))}
                        {colors.length === 0 && (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t('noColors')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Attributes Section */}
              <section className="bg-gray-50 dark:bg-gray-800/50 ">
                <div className="mb-4 bg-white dark:bg-gray-600 border p-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-500  pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <LuSettings2 size={14} />
                    {t('productAttributes')}
                  </h2>
                  <button
                    type="button"
                    onClick={addAttribute}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#13b5ea] hover:text-[#0f92bd] transition-colors"
                  >
                    <LuPlus size={14} />
                    {t('addAttribute')}
                  </button>
                </div>

                <div className="p-4">
                  {attributes.filter(attr => attr.name !== "colors").map((attribute, index) => {
                    const actualIndex = attributes.findIndex(a => a === attribute);
                    return (
                      <div key={actualIndex} className="group relative grid gap-4 md:grid-cols-12 items-end bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-[2px] border border-slate-100 dark:border-slate-800/50">
                        <div className="md:col-span-5 flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold uppercase text-slate-400">{t('attributeName')}</label>
                          <Select
                            className="w-full custom-antd-select"
                            placeholder={t('selectAttribute')}
                            size="large"
                            value={attribute.name}
                            onChange={(value) => updateAttribute(actualIndex, 'name', value)}
                            dropdownRender={menu => (
                              <div>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <div className="p-2 flex gap-2">
                                  <input
                                    placeholder={t('newName')}
                                    className="flex-1 h-8 px-2 text-xs border border-slate-200 dark:border-slate-700 bg-transparent outline-none rounded-[2px]"
                                    ref={inputRef}
                                    value={attributeName}
                                    onChange={(e) => setAttributeName(e.target.value)}
                                  />
                                  <button
                                    onClick={addItem}
                                    className="px-3 h-8 bg-[#13b5ea] text-white text-xs font-bold uppercase rounded-[2px]"
                                  >
                                    {t('add')}
                                  </button>
                                </div>
                              </div>
                            )}
                            options={attributesAll?.filter(attr => attr.name !== "colors").map(item => ({
                              label: item.name,
                              value: item.name
                            }))}
                          />
                          {errors[`attribute_${actualIndex}_name`] && (
                            <p className="text-red-500 text-[10px] font-medium">{errors[`attribute_${actualIndex}_name`]}</p>
                          )}
                        </div>
                        
                        <div className="md:col-span-6 flex flex-col gap-1.5">
                          <label className="text-[11px] font-bold uppercase text-slate-400">{t('attributeValue')}</label>
                          {renderAttributeValueInput(attribute, actualIndex)}
                          {errors[`attribute_${actualIndex}_value`] && (
                            <p className="text-red-500 text-[10px] font-medium">{errors[`attribute_${actualIndex}_value`]}</p>
                          )}
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeAttribute(actualIndex)}
                            className="h-[38px] w-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <LuTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {attributes.filter(attr => attr.name !== "colors").length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50/30 dark:bg-slate-700/20 border border-dashed border-slate-200 dark:border-slate-600 rounded-[2px]">
                      <LuBox size={32} className="mb-2 opacity-20" />
                      <p className="text-xs uppercase tracking-widest font-bold">{t('noAdditionalAttributes')}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ItemForm;
