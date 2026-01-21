import React, { useState, useRef, useEffect } from "react";
import {
  FiUpload,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiDownload,
  FiMinus,
} from "react-icons/fi";
import * as XLSX from "xlsx";
import { useGetAllBrandQuery } from "../../../app/Features/brandsSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import { useGetAllScalesQuery } from "../../../app/Features/scalesSlice";
import { useGetAllSizesQuery } from "../../../app/Features/sizesSlice";
import { useGetAllColorQuery } from "../../../app/Features/colorsSlice";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { RiImportLine } from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";
import { Alert } from "antd";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { useGetAllStockQuery } from "../../../app/Features/stocksSlice";

const ImportItems = () => {
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("token");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    item_name: "",
    item_price: 0,
    item_cost: 0,
    price_discount: 0,
    wholesale_price: 0,
    wholesale_price_discount: 0,
    discount: 0,
    category_id: "",
    brand_id: "",
    scale_id: "",
    colors: [],
    attributes: [],
    item_images: [],
    existing_images: [],
    item_urls: [],
    category_name: "",
    brand_name: "",
    scale_name: ""
  });
  const [isEditAllMode, setIsEditAllMode] = useState(false);
  const [allItemsEditData, setAllItemsEditData] = useState([]);
  const fileInputRef = useRef(null);
  const stockContext = useGetAllStockQuery(token);
  const brandContext = useGetAllBrandQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const scaleContext = useGetAllScalesQuery(token);
  const sizeContext = useGetAllSizesQuery(token);
  const colorContext = useGetAllColorQuery(token);
  const [categories, setCategories] = useState([]);
  const saleContext = useGetAllSaleQuery(token);
  const { refetch } = useGetAllItemsQuery(token);
  const [scales, setScales] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [brands, setBrands] = useState([]);
  const imageInputRefs = useRef({});
  const [error, setError] = useState({ error: false, message: "" });

  useEffect(() => {
    setBrands(brandContext.data?.data || []);
    setCategories(categoryContext.data?.data || []);
    setScales(scaleContext.data?.data || []);
    setSizes(sizeContext.data?.data || []);
    setColors(colorContext.data?.data || []);
  }, [
    brandContext.data,
    categoryContext.data,
    scaleContext.data,
    sizeContext.data,
    colorContext.data,
  ]);

  // Handle Excel file import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const formattedData = data.map((row, index) => {
        // Parse colors from comma-separated string to array
        const colorsArray = row.colors
          ? row.colors.split(',').map(color => color.trim()).filter(color => color)
          : [];

        // Parse attributes from JSON string or create from separate columns
        let attributes = [];
        try {
          if (row.attributes && typeof row.attributes === 'string') {
            attributes = JSON.parse(row.attributes);
          } else if (row.attribute_name && row.attribute_type && row.attribute_value) {
            attributes = [{
              name: row.attribute_name,
              type: row.attribute_type,
              value: row.attribute_value
            }];
          }
        } catch (e) {
          console.error("Error parsing attributes:", e);
          attributes = [];
        }

        return {
          id: index,
          item_name: row.item_name || "",
          item_price: parseFloat(row.item_price) || 0,
          item_cost: parseFloat(row.item_cost) || 0,
          price_discount: parseFloat(row.price_discount) || 0,
          wholesale_price: parseFloat(row.wholesale_price) || 0,
          wholesale_price_discount: parseFloat(row.wholesale_price_discount) || 0,
          discount: parseFloat(row.discount) || 0,
          category_name: row.category_name || "",
          brand_name: row.brand_name || "",
          scale_name: row.scale_name || "",
          colors: colorsArray,
          attributes: attributes,
          category_id: "",
          brand_id: "",
          scale_id: "",
          item_images: [],
          existing_images: [],
          item_urls: []
        };
      });

      const improveData = formattedData?.map((item) => {
        const scaleObj = scales?.find(
          (i) => i.scale_name?.toLowerCase() === item.scale_name?.toLowerCase()
        );
        const categoryObj = categories?.find(
          (i) => i.category_name?.toLowerCase() === item.category_name?.toLowerCase()
        );
        const brandObj = brands?.find(
          (i) => i.brand_name?.toLowerCase() === item.brand_name?.toLowerCase()
        );

        const scaleId = scaleObj?.scale_id;
        const categoryId = categoryObj?.category_id;
        const brandId = brandObj?.brand_id;

        // Collect errors
        const errors = [];
        if (!scaleId) errors.push(`${item.scale_name} scale`);
        if (!categoryId) errors.push(`${item.category_name} category`);
        if (!brandId) errors.push(`${item.brand_name} brand`);

        if (errors.length > 0) {
          toast.error(`${errors.join(', ')} not found in system.`);
          setError({
            error: true,
            message: `${errors.join(', ')} not found in system.`,
          });
        }

        return {
          ...item,
          scale_id: scaleId || "",
          category_id: categoryId || "",
          brand_id: brandId || "",
          scale_name: item.scale_name || "",
          category_name: item.category_name || "",
          brand_name: item.brand_name || "",
        };
      });

      setItems(improveData);
      setError({ error: false, message: "" });
    };
    reader.readAsBinaryString(file);
  };

  // Handle image file upload
  const handleImageUpload = (e, itemId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const imageUrls = files.map(file => URL.createObjectURL(file));

    if (isEditAllMode) {
      const updatedItems = allItemsEditData.map((item) =>
        item.id === itemId
          ? {
            ...item,
            item_images: [...(item.item_images || []), ...files],
            item_urls: [...(item.item_urls || []), ...imageUrls]
          }
          : item
      );
      setAllItemsEditData(updatedItems);
    } else {
      setEditForm(prev => ({
        ...prev,
        item_images: [...(prev.item_images || []), ...files],
        item_urls: [...(prev.item_urls || []), ...imageUrls]
      }));
    }
  };


  // Start editing an item
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      ...item,
      item_urls: item.item_images?.map(img => typeof img === 'string' ? img : URL.createObjectURL(img)) || []
    });
  };

  // Save edited item
  const handleSave = () => {
    setItems(
      items.map((item) =>
        item.id === editingId ? { ...editForm, id: item.id } : item
      )
    );
    setEditingId(null);
    setEditForm({
      item_name: "",
      item_price: 0,
      item_cost: 0,
      price_discount: 0,
      wholesale_price: 0,
      wholesale_price_discount: 0,
      discount: 0,
      category_id: "",
      brand_id: "",
      scale_id: "",
      colors: [],
      attributes: [],
      item_images: [],
      existing_images: [],
      item_urls: [],
      category_name: "",
      brand_name: "",
      scale_name: ""
    });
    toast.success("Item saved successfully!");
    console.log(items);

  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({
      item_name: "",
      item_price: 0,
      item_cost: 0,
      price_discount: 0,
      wholesale_price: 0,
      wholesale_price_discount: 0,
      discount: 0,
      category_id: "",
      brand_id: "",
      scale_id: "",
      colors: [],
      attributes: [],
      item_images: [],
      existing_images: [],
      item_urls: [],
      category_name: "",
      brand_name: "",
      scale_name: ""
    });
  };

  // Handle input changes for all items in edit all mode
  const handleAllItemsInputChange = (itemId, field, value) => {
    const updatedItems = allItemsEditData.map(item => {
      if (item.id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setAllItemsEditData(updatedItems);
  };

  // Handle select changes for all items in edit all mode
  const handleAllItemsSelectChange = (itemId, field, value) => {
    const updatedItems = allItemsEditData.map(item => {
      if (item.id === itemId) {
        // Find the display name for the selected ID
        let displayName = "";
        if (field === "category_id") {
          const category = categories.find(cat => cat.category_id == value);
          displayName = category?.category_name || "";
        } else if (field === "brand_id") {
          const brand = brands.find(b => b.brand_id == value);
          displayName = brand?.brand_name || "";
        } else if (field === "scale_id") {
          const scale = scales.find(s => s.scale_id == value);
          displayName = scale?.scale_name || "";
        }

        return {
          ...item,
          [field]: value,
          [`${field.replace('_id', '_name')}`]: displayName
        };
      }
      return item;
    });
    setAllItemsEditData(updatedItems);
  };

  // Handle attribute changes for edit form
  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...(editForm.attributes || [])];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    setEditForm({ ...editForm, attributes: newAttributes });
  };

  // Handle attribute changes for all items
  const handleAllItemsAttributeChange = (itemId, attrIndex, field, value) => {
    const updatedItems = allItemsEditData.map(item => {
      if (item.id === itemId) {
        const newAttributes = [...(item.attributes || [])];
        newAttributes[attrIndex] = { ...newAttributes[attrIndex], [field]: value };
        return { ...item, attributes: newAttributes };
      }
      return item;
    });
    setAllItemsEditData(updatedItems);
  };

  // Add new attribute for edit form
  const handleAddAttribute = () => {
    setEditForm({
      ...editForm,
      attributes: [...(editForm.attributes || []), { name: "", type: "text", value: "" }]
    });
  };

  // Add new attribute for all items
  const handleAddAttributeForItem = (itemId) => {
    const updatedItems = allItemsEditData.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          attributes: [...(item.attributes || []), { name: "", type: "text", value: "" }]
        };
      }
      return item;
    });
    setAllItemsEditData(updatedItems);
  };

  // Remove attribute for edit form
  const handleRemoveAttribute = (index) => {
    const newAttributes = (editForm.attributes || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, attributes: newAttributes });
  };

  // Remove attribute for all items
  const handleRemoveAttributeForItem = (itemId, index) => {
    const updatedItems = allItemsEditData.map(item => {
      if (item.id === itemId) {
        const newAttributes = (item.attributes || []).filter((_, i) => i !== index);
        return { ...item, attributes: newAttributes };
      }
      return item;
    });
    setAllItemsEditData(updatedItems);
  };

  // Add a new empty item
  const handleAddNew = () => {
    const newId = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 0;
    const newItem = {
      id: newId,
      item_name: "",
      item_price: 0,
      item_cost: 0,
      price_discount: 0,
      wholesale_price: 0,
      wholesale_price_discount: 0,
      discount: 0,
      category_id: "",
      brand_id: "",
      scale_id: "",
      colors: [],
      attributes: [],
      item_images: [],
      existing_images: [],
      item_urls: [],
      category_name: "",
      brand_name: "",
      scale_name: ""
    };

    if (isEditAllMode) {
      setAllItemsEditData(prev => [...prev, newItem]);
    } else {
      setItems(prev => [...prev, newItem]);
      setEditingId(newId);
      setEditForm(newItem);
    }
  };

  // Delete an item
  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (isEditAllMode) {
      setAllItemsEditData(prev => prev.filter(item => item.id !== id));
    } else if (editingId === id) {
      handleCancel();
    }
  };

  // Enable edit all mode
  const handleEditAll = () => {
    setIsEditAllMode(true);
    setAllItemsEditData([...items]);
  };

  // Save all changes in edit all mode
  const handleSaveAll = () => {
    setItems(allItemsEditData);
    setIsEditAllMode(false);
    setAllItemsEditData([]);
    toast.success("All changes saved successfully!");
  };

  // Cancel edit all mode
  const handleCancelEditAll = () => {
    setIsEditAllMode(false);
    setAllItemsEditData([]);
    toast.info("Edit all mode cancelled");
  };

  // Download Excel template
  const downloadTemplate = () => {
    const templateData = [
      {
        "item_name": "Coca Cola",
        "item_price": 3.00,
        "item_cost": 2.00,
        "price_discount": 2.50,
        "wholesale_price": 2.00,
        "wholesale_price_discount": 1.80,
        "discount": 0.00,
        "category_name": "Beverages",
        "brand_name": "Coca-Cola",
        "scale_name": "Piece",
        "colors": "red,blue",
        "attributes": JSON.stringify([
          { "name": "size", "type": "text", "value": "XL" },
          { "name": "material", "type": "select", "value": "cotton,polyester" }
        ])
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Auto-size columns
    const colWidths = Object.keys(templateData[0]).map(key =>
      Math.max(key.length, Math.max(...templateData.map(row => String(row[key] || "").length)))
    );
    worksheet['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

    XLSX.writeFile(workbook, "Item_Import_Template.xlsx");
    toast.success("Template downloaded successfully!");
  };

  // Import all items
  const handleImportAll = async () => {
    const itemsToImport = isEditAllMode ? allItemsEditData : items;

    if (!itemsToImport || itemsToImport.length === 0) {
      toast.error("No items to import!");
      return;
    }

    // Validate items
    const invalidItems = itemsToImport.filter(item =>
      !item.item_name ||
      !item.category_id ||
      !item.brand_id ||
      !item.scale_id ||
      item.item_price <= 0
    );

    if (invalidItems.length > 0) {
      toast.error(`Please fill in all required fields for ${invalidItems.length} item(s)`);
      return;
    }

    try {
      const formData = new FormData();

      itemsToImport.forEach((item, idx) => {
        const itemData = {
          item_name: item.item_name,
          item_price: parseFloat(item.item_price) || 0,
          item_cost: parseFloat(item.item_cost) || 0,
          price_discount: parseFloat(item.price_discount) || 0,
          wholesale_price: parseFloat(item.wholesale_price) || 0,
          wholesale_price_discount: parseFloat(item.wholesale_price_discount) || 0,
          discount: parseFloat(item.discount) || 0,
          category_id: item.category_id,
          brand_id: item.brand_id,
          scale_id: item.scale_id,
          attributes: JSON.stringify(item.attributes || [])
        };
        console.log(itemData);


        formData.append(`items[${idx}]`, JSON.stringify(itemData));

        // Add images
        if (item.item_images && item.item_images.length > 0) {
          item.item_images.forEach((image, imgIdx) => {
            if (image instanceof File) {
              formData.append(`items[${idx}][images][${imgIdx}]`, image);
            }
          });
        }
      });

      const response = await api.post("import_items", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 201) {
        if (stockContext?.refetch) stockContext.refetch();
        if (refetch) refetch();
        if (saleContext?.refetch) saleContext.refetch();
        toast.success("Items imported successfully!");
        setItems([]);
        setIsEditAllMode(false);
        setAllItemsEditData([]);
        setError({ error: false, message: "" });
      } else {
        throw new Error(response.data.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed! " + (error.response?.data?.message || error.message));
    }
  };

  // Remove image
  const handleRemoveImage = (itemId, imageIndex) => {
    if (isEditAllMode) {
      const updatedItems = allItemsEditData.map(item => {
        if (item.id === itemId) {
          const newImages = [...(item.item_images || [])];
          const newUrls = [...(item.item_urls || [])];
          newImages.splice(imageIndex, 1);
          newUrls.splice(imageIndex, 1);
          return { ...item, item_images: newImages, item_urls: newUrls };
        }
        return item;
      });
      setAllItemsEditData(updatedItems);
    } else {
      const newImages = [...(editForm.item_images || [])];
      const newUrls = [...(editForm.item_urls || [])];
      newImages.splice(imageIndex, 1);
      newUrls.splice(imageIndex, 1);
      setEditForm({ ...editForm, item_images: newImages, item_urls: newUrls });
    }
  };

  // Render attribute input fields for individual edit mode
  const renderAttributesInput = (item) => {
    const attributes = isEditAllMode ? item.attributes || [] : editForm.attributes || [];

    return (
      <div className="space-y-3 text-xs">
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Attribute Name"
              value={attr.name}
              onChange={(e) => isEditAllMode
                ? handleAllItemsAttributeChange(item.id, index, "name", e.target.value)
                : handleAttributeChange(index, "name", e.target.value)
              }
              className="flex-1 p-1 border w-20 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={attr.type}
              onChange={(e) => isEditAllMode
                ? handleAllItemsAttributeChange(item.id, index, "type", e.target.value)
                : handleAttributeChange(index, "type", e.target.value)
              }
              className="w-20 p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Date</option>
            </select>
            <input
              type="text"
              placeholder="Value"
              value={attr.value}
              onChange={(e) => isEditAllMode
                ? handleAllItemsAttributeChange(item.id, index, "value", e.target.value)
                : handleAttributeChange(index, "value", e.target.value)
              }
              className="flex-1 p-1 border w-25 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => isEditAllMode
                ? handleRemoveAttributeForItem(item.id, index)
                : handleRemoveAttribute(index)
              }
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Remove attribute"
            >
              <FiMinus className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => isEditAllMode
            ? handleAddAttributeForItem(item.id)
            : handleAddAttribute()
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Add Attribute
        </button>
      </div>
    );
  };

  // Render attributes display for non-edit mode
  const renderAttributesDisplay = (attributes) => {
    if (!attributes || attributes.length === 0) {
      return <span className="text-gray-500 text-sm">No attributes</span>;
    }

    return (
      <div className="space-y-1">
        {attributes.slice(0, 2).map((attr, index) => (
          <div key={index} className="text-xs text-gray-700">
            <span className="font-medium">{attr.name}: </span>
            <span>{attr.value}</span>
          </div>
        ))}
        {attributes.length > 2 && (
          <span className="text-xs text-blue-600">+{attributes.length - 2} more</span>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto p-2 bg-transparent min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Import Items</h1>
      <p className="text-gray-600 mb-8">Import items from Excel file or use the template</p>

      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-blue-50"
            onClick={() => fileInputRef.current.click()}
          >
            <FiUpload className="mx-auto text-4xl text-blue-500 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Upload Excel File</p>
            <p className="text-sm text-gray-500">.xlsx, .xls, .csv files supported</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
          </div>

          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50 hover:bg-green-50"
            onClick={downloadTemplate}
          >
            <FiDownload className="mx-auto text-4xl text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Download Template</p>
            <p className="text-sm text-gray-500">Get sample Excel format</p>
          </div>
        </div>
      </div>

      {error.error && (
        <Alert
          message="Error"
          description={error.message}
          type="error"
          showIcon
          className="mb-6"
          closable
          onClose={() => setError({ error: false, message: "" })}
        />
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
            Imported Items ({items.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {isEditAllMode ? (
              <>
                <button
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FiSave className="w-4 h-4" /> Save All
                </button>
                <button
                  onClick={handleCancelEditAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FiX className="w-4 h-4" /> Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={items.length === 0}
                >
                  <FiEdit className="w-4 h-4" /> Edit All
                </button>
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FiPlus className="w-4 h-4" /> Add Item
                </button>
                <button
                  onClick={handleImportAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={items.length === 0}
                >
                  <RiImportLine className="w-5 h-5" /> Import All
                </button>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FiUpload className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Items Imported</h3>
              <p className="text-gray-500 mb-6">
                Upload an Excel file or download the template to get started.
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FiDownload /> Download Template
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Wholesale Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Scale
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Attributes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Images
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y text-xs divide-gray-200">
                {(isEditAllMode ? allItemsEditData : items).map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Item Name */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <input
                          type="text"
                          value={isEditAllMode ? item.item_name : editForm.item_name}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsInputChange(item.id, "item_name", e.target.value)
                            : setEditForm({ ...editForm, item_name: e.target.value })
                          }
                          className="w-full p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter item name"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{item.item_name}</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isEditAllMode ? item.item_price : editForm.item_price}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsInputChange(item.id, "item_price", parseFloat(e.target.value) || 0)
                            : setEditForm({ ...editForm, item_price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-32 p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-medium">${parseFloat(item.item_price).toFixed(2)}</span>
                      )}
                    </td>

                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isEditAllMode ? item.wholesale_price : editForm.wholesale_price}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsInputChange(item.id, "wholesale_price", parseFloat(e.target.value) || 0)
                            : setEditForm({ ...editForm, wholesale_price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-32 p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <span className="font-medium">${parseFloat(item.wholesale_price).toFixed(2)}</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <select
                          value={isEditAllMode ? item.category_id : editForm.category_id}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsSelectChange(item.id, "category_id", e.target.value)
                            : setEditForm({ ...editForm, category_id: e.target.value })
                          }
                          className="w-full p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.category_id} value={cat.category_id}>
                              {cat.category_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{item.category_name || "N/A"}</span>
                      )}
                    </td>

                    {/* Brand */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <select
                          value={isEditAllMode ? item.brand_id : editForm.brand_id}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsSelectChange(item.id, "brand_id", e.target.value)
                            : setEditForm({ ...editForm, brand_id: e.target.value })
                          }
                          className="w-full p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Brand</option>
                          {brands.map(brand => (
                            <option key={brand.brand_id} value={brand.brand_id}>
                              {brand.brand_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{item.brand_name || "N/A"}</span>
                      )}
                    </td>

                    {/* Scale */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <select
                          value={isEditAllMode ? item.scale_id : editForm.scale_id}
                          onChange={(e) => isEditAllMode
                            ? handleAllItemsSelectChange(item.id, "scale_id", e.target.value)
                            : setEditForm({ ...editForm, scale_id: e.target.value })
                          }
                          className="w-full p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Scale</option>
                          {scales.map(scale => (
                            <option key={scale.scale_id} value={scale.scale_id}>
                              {scale.scale_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{item.scale_name || "N/A"}</span>
                      )}
                    </td>

                    {/* Attributes */}
                    <td className="p-1">
                      {isEditAllMode || editingId === item.id ? (
                        <div>
                          {renderAttributesInput(item)}
                        </div>
                      ) : (
                        <div>
                          {renderAttributesDisplay(item.attributes)}
                        </div>
                      )}
                    </td>

                    {/* Images */}
                    <td className="p-1">
                      <div className="flex items-center gap-2">
                        {(isEditAllMode ? item.item_urls || [] : editingId === item.id ? editForm.item_urls || [] : []).map((url, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              className="h-12 w-12 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/48";
                              }}
                            />
                            <button
                              onClick={() => handleRemoveImage(item.id, idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              style={{ fontSize: '10px' }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {(isEditAllMode || editingId === item.id) && (
                          <button
                            onClick={() => imageInputRefs.current[item.id]?.click()}
                            className="h-12 w-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center"
                          >
                            <FiPlus className="w-5 h-5 text-gray-400" />
                          </button>
                        )}
                        {!isEditAllMode && editingId !== item.id && items[index]?.item_urls?.map((url, idx) => <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="h-12 w-12 object-cover rounded-lg border border-gray-300"
                        />
                        )}

                        <input
                          type="file"
                          ref={el => imageInputRefs.current[item.id] = el}
                          onChange={(e) => handleImageUpload(e, item.id)}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-1">
                      <div className="flex items-center gap-2">
                        {isEditAllMode ? (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        ) : editingId === item.id ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Save"
                            >
                              <FiSave className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Cancel"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <FiEdit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportItems;