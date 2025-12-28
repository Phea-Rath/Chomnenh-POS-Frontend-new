import React, { useState, useRef, useEffect } from "react";
import {
  FiUpload,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
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
import { Alert, message } from "antd";
import {
  useGetAllItemInStockQuery,
  useGetAllItemsQuery,
} from "../../../app/Features/itemsSlice";
import { useGetAllStockQuery } from "../../../app/Features/stocksSlice";

const ImportItems = () => {
  const [items, setItems] = useState([]);
  const token = localStorage.getItem("token");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditAllMode, setIsEditAllMode] = useState(false);
  const [allItemsEditData, setAllItemsEditData] = useState([]);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const stockContext = useGetAllStockQuery(token);
  const brandContext = useGetAllBrandQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const scaleContext = useGetAllScalesQuery(token);
  const sizeContext = useGetAllSizesQuery(token);
  const colorContext = useGetAllColorQuery(token);
  const [categories, setCategories] = useState([]);
  const saleContext = useGetAllSaleQuery(token);
  const { refetch } = useGetAllItemsQuery(token);
  const [openColorDropdownId, setOpenColorDropdownId] = useState(null);
  const [scales, setScales] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [brands, setBrands] = useState([]);
  const wrapperRef = useRef(null);
  const imageInputRefs = useRef({});
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState({ error: false, message: "" });

  useEffect(() => {
    setBrands(brandContext.data?.data);
    setCategories(categoryContext.data?.data);
    setScales(scaleContext.data?.data);
    setSizes(sizeContext.data?.data);
    setColors(colorContext.data?.data);
  }, [
    brandContext.data,
    categoryContext.data,
    scaleContext.data,
    sizeContext.data,
    colorContext.data,
  ]);

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

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Handle Excel file import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    console.log(file);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Map Excel data to our item format
      const formattedData = data.map((row, index) => {
        // Normalize expire_date to YYYY-MM-DD
        let expireDate = row.expire_date || "";
        if (expireDate) {
          if (typeof expireDate === "number") {
            const jsDate = new Date(
              Math.round((expireDate - 25569) * 86400 * 1000)
            );
            expireDate = jsDate.toISOString().slice(0, 10);
          } else if (typeof expireDate === "string") {
            const jsDate = new Date(expireDate);
            if (!isNaN(jsDate)) {
              expireDate = jsDate.toISOString().slice(0, 10);
            }
          }
        }

        // Calculate term in months between expireDate and today
        let term = "";
        if (expireDate) {
          const today = new Date();
          const expDate = new Date(expireDate);
          if (!isNaN(expDate)) {
            const years = expDate.getFullYear() - today.getFullYear();
            const months = expDate.getMonth() - today.getMonth();
            const totalMonths = years * 12 + months;
            term = totalMonths >= 0 ? totalMonths : 0;
          }
        }

        return {
          id: index,
          item_image: row.item_image || "",
          item_name: row.item_name || "",
          wholesale_price: row.wholesale_price || 0,
          item_price: row.item_price || 0,
          color_pick: row.color_pick || "#000000",
          size_name: row.size_name || "",
          scale_name: row.scale_name || "",
          brand_name: row.brand_name || "",
          category_name: row.category_name || "",
          // expire_date: expireDate,
          // term: term.toString(),
          // quantity: row.quantity || 1 // <-- Added quantity field
        };
      });

      const improveData = formattedData?.map((item) => {
        const scaleId = scales?.find(
          (i) => i.scale_name.toLowerCase() === item.scale_name.toLowerCase()
        )?.scale_id;
        const categoryId = categories?.find(
          (i) =>
            i.category_name.toLowerCase() === item.category_name.toLowerCase()
        )?.category_id;
        const brandId = brands?.find(
          (i) => i.brand_name.toLowerCase() === item.brand_name.toLowerCase()
        )?.brand_id;
        const sizeId = sizes?.find(
          (i) => i.size_name.toLowerCase() === item.size_name.toLowerCase()
        )?.size_id;
        const colorId = colors?.find(
          (i) => i.color_pick.toLowerCase() === item.color_pick.toLowerCase()
        )?.color_id;

        if (!scaleId || !categoryId || !brandId || !sizeId) {
          toast.error(
            `${scaleId ? "" : `${item.scale_name} scale,`} ${categoryId ? "" : `${item.category_name} category,`
            } ${brandId ? "" : `${item.brand_name} brand,`} ${sizeId ? "" : `${item.size_name} size,`
            } have not in system.`
          );
          setError({
            error: true,
            message: `${scaleId ? "" : `${item.scale_name} scale,`} ${categoryId ? "" : `${item.category_name} category,`
              } ${brandId ? "" : `${item.brand_name} brand,`} ${sizeId ? "" : `${item.size_name} size,`
              } have not in system.`,
          });
        }

        return {
          ...item,
          scale_id: scaleId,
          category_id: categoryId,
          brand_id: brandId,
          size_id: sizeId,
          color_id: colorId,
          size_name: sizeId ? item.size_name : item.size_name.toUpperCase(),
          scale_name: scaleId ? item.scale_name : item.scale_name.toUpperCase(),
          category_name: categoryId
            ? item.category_name
            : item.category_name.toUpperCase(),
          brand_name: brandId ? item.brand_name : item.brand_name.toUpperCase(),
        };
      });

      setItems(improveData);
      console.log(improveData);
    };
    reader.readAsBinaryString(file);
  };

  // Handle image file upload
  const handleImageUpload = (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a temporary URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);

    if (isEditAllMode) {
      const updatedItems = allItemsEditData.map((item) =>
        item.id === itemId
          ? { ...item, item_image: file, item_url: imageUrl }
          : item
      );
      console.log(updatedItems);

      setAllItemsEditData(updatedItems);
    } else {
      setEditForm({
        ...editForm,
        item_image: file,
        item_url: imageUrl,
      });
    }
  };

  // Start editing an item
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
    console.log(item);
  };

  // Save edited item
  const handleSave = () => {
    setItems(
      items.map((item) =>
        item.id === editingId ? { ...editForm, id: item.id } : item
      )
    );
    setEditingId(null);
    setEditForm({});
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Handle input changes in edit form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Handle input changes in edit all mode
  const handleAllItemsInputChange = (id, field, value) => {
    const foundColor = colors?.find(
      (c) => c.color_pick.toLowerCase() === value.toLowerCase()
    );
    const colorId = foundColor ? foundColor.color_id : null;
    const updatedItems = allItemsEditData.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    if (colorId) {
      updatedItems.map((item) =>
        item.id === id ? { ...item, color_id: colorId } : item
      );
    }
    setAllItemsEditData(updatedItems);
    setItems(updatedItems);
    console.log(updatedItems);
  };

  // Handle select changes in edit form
  const handleSelectChange = (field, currentValue) => {
    const { name, value } = event.target;
    setEditForm({
      ...editForm,
      [field]: value,
      [name]: currentValue,
    });
  };

  // Handle select changes in edit all mode
  const handleAllItemsSelectChange = (
    id,
    field,
    value,
    nameField,
    nameValue
  ) => {
    const updatedItems = allItemsEditData.map((item) =>
      item.id === id
        ? { ...item, [field]: value, [nameField]: nameValue }
        : item
    );
    setAllItemsEditData(updatedItems);
  };

  // Handle color selection from dropdown
  const handleSelect = (color, itemId = null) => {
    if (isEditAllMode && itemId !== null) {
      const updatedItems = allItemsEditData.map((item) =>
        item.id === itemId
          ? { ...item, color_pick: color.color_pick, color_id: color.color_id }
          : item
      );
      setAllItemsEditData(updatedItems);
    } else {
      setEditForm({
        ...editForm,
        color_pick: color.color_pick,
        color_id: color.color_id,
      });
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  // Add a new empty item
  const handleAddNew = () => {
    const newId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 0;
    const newItem = {
      id: newId,
      item_image: "",
      item_code: "",
      item_name: "",
      wholesale_price: 0,
      item_price: 0,
      color_pick: "#000000",
      scale_name: "",
      brand_name: "",
      size_name: "",
      category_name: "",
      expire_date: "",
      term: "",
      quantity: 1, // <-- Added quantity field
    };
    setItems([...items, newItem]);

    if (isEditAllMode) {
      setAllItemsEditData([...allItemsEditData, newItem]);
    } else {
      setEditingId(newId);
      setEditForm(newItem);
    }
  };

  // Delete an item
  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));

    if (isEditAllMode) {
      setAllItemsEditData(allItemsEditData.filter((item) => item.id !== id));
    } else if (editingId === id) {
      setEditingId(null);
      setEditForm({});
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
  };

  // Import all items
  const handleImportAll = async () => {
    const itemsToImport = isEditAllMode ? allItemsEditData : items;

    if (!itemsToImport.length) {
      toast.error("No items to import!");
      return;
    }

    const formData = new FormData();
    itemsToImport.forEach((item, idx) => {
      Object.entries(item).forEach(([key, value]) => {
        formData.append(`items[${idx}][${key}]`, value);
      });
    });

    try {
      const response = await api.post("import_items", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 201) {
        stockContext.refetch();
        refetch();
        saleContext.refetch();
        toast.success("Items imported successfully!");
        setItems([]);
        setIsEditAllMode(false);
        setAllItemsEditData([]);
      }
    } catch (error) {
      toast.error("Import failed! " + error.message);
    }
  };

  return (
    <div className="mx-auto p-2 md:p-3">
      <h1 className="text-2xl font-bold mb-6">Import Items from Excel</h1>

      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
          onClick={() => fileInputRef.current.click()}
        >
          <FiUpload className="mx-auto text-3xl text-gray-400 mb-3" />
          <p className="text-gray-600">
            Click to upload Excel file or drag and drop
          </p>
          <p className="text-yellow-500">
            Note: Data should start from cell A1 in Excel table
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports .xlsx, .xls, .csv files
          </p>
          <input
            type="file"
            ref={fileInputRef}
            value={""}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
        </div>
      </div>

      {error.error ? (
        <Alert
          message="Error"
          description={error?.message}
          type="error"
          showIcon
        />
      ) : (
        ""
      )}

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-between text-xs items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Imported Items</h2>
          <div className="flex gap-2">
            {isEditAllMode ? (
              <>
                <button
                  onClick={handleSaveAll}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FiSave className="mr-2" /> Save All
                </button>
                <button
                  onClick={handleCancelEditAll}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FiX className="mr-2" /> Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditAll}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FiEdit className="mr-2" /> Edit All
                </button>
                <button
                  onClick={handleAddNew}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FiPlus className="mr-2" /> Add New Item
                </button>
                <button
                  onClick={handleImportAll}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <RiImportLine className="mr-2 text-xl" /> Import
                </button>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No items imported yet. Upload an Excel file to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wholesale price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th> */}
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expire Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y !text-xs divide-gray-200">
                {(isEditAllMode ? allItemsEditData : items).map(
                  (item, index) => (
                    <tr
                      key={index}
                      className={`${item.category_name ==
                          item.category_name.toUpperCase() ||
                          item.brand_name == item.brand_name.toUpperCase() ||
                          item.scale_name == item.scale_name.toUpperCase() ||
                          item.size_name == item.size_name.toUpperCase()
                          ? "bg-red-600 text-white"
                          : ""
                        }`}
                    >
                      {/* Image */}
                      <td className="p-1 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={
                                isEditAllMode
                                  ? item.item_url ||
                                  "https://cdn3.iconfinder.com/data/icons/it-and-ui-mixed-filled-outlines/48/default_image-1024.png"
                                  : editForm?.item_url ||
                                  "https://cdn3.iconfinder.com/data/icons/it-and-ui-mixed-filled-outlines/48/default_image-1024.png"
                              }
                              alt="Preview"
                              className="h-10 w-10 object-cover rounded mb-2"
                              onError={(e) => {
                                e.target.src =
                                  "https://cdn3.iconfinder.com/data/icons/it-and-ui-mixed-filled-outlines/48/default_image-1024.png";
                              }}
                            />
                            <input
                              type="file"
                              ref={(el) =>
                                (imageInputRefs.current[item.id] = el)
                              }
                              onChange={(e) => handleImageUpload(e, item.id)}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              onClick={() =>
                                imageInputRefs.current[item.id]?.click()
                              }
                              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                            >
                              Upload Image
                            </button>
                          </div>
                        ) : (
                          <img
                            src={
                              item?.item_url ||
                              "https://cdn3.iconfinder.com/data/icons/it-and-ui-mixed-filled-outlines/48/default_image-1024.png"
                            }
                            alt={item?.item_name}
                            className="h-10 w-10 object-cover rounded"
                            onError={(e) => {
                              e.target.src =
                                "https://cdn3.iconfinder.com/data/icons/it-and-ui-mixed-filled-outlines/48/default_image-1024.png";
                            }}
                          />
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-1 whitespace-nowrap !text-sm">
                        {isEditAllMode || editingId === item?.id ? (
                          <input
                            type="text"
                            name="item_name"
                            value={
                              isEditAllMode
                                ? item.item_name
                                : editForm?.item_name || ""
                            }
                            onChange={(e) =>
                              isEditAllMode
                                ? handleAllItemsInputChange(
                                  item.id,
                                  "item_name",
                                  e.target.value
                                )
                                : handleInputChange(e)
                            }
                            className="w-full p-2 border rounded-md"
                          />
                        ) : (
                          <span>{item?.item_name}</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="px-1 w-10 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <input
                            type="number"
                            name="wholesale_price"
                            value={
                              isEditAllMode
                                ? item.wholesale_price
                                : editForm?.wholesale_price || 0
                            }
                            onChange={(e) =>
                              isEditAllMode
                                ? handleAllItemsInputChange(
                                  item.id,
                                  "wholesale_price",
                                  e.target.value
                                )
                                : handleInputChange(e)
                            }
                            className="w-full p-2 border rounded-md"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span>
                            ${parseFloat(item?.wholesale_price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="px-1 w-10 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <input
                            type="number"
                            name="item_price"
                            value={
                              isEditAllMode
                                ? item.item_price
                                : editForm?.item_price || 0
                            }
                            onChange={(e) =>
                              isEditAllMode
                                ? handleAllItemsInputChange(
                                  item.id,
                                  "item_price",
                                  e.target.value
                                )
                                : handleInputChange(e)
                            }
                            className="w-full p-2 border rounded-md"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span>
                            ${parseFloat(item?.item_price).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Color */}
                      <td className="px-1 w-40 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <div className="max-w-md mx-auto w-full">
                            <div className="relative w-full" ref={wrapperRef}>
                              <div className="flex border border-gray-300 rounded-lg shadow-sm bg-white">
                                <input
                                  type="color"
                                  className="h-12 w-full p-1 rounded cursor-pointer border border-gray-300"
                                  placeholder="Pick a color..."
                                  value={(() => {
                                    const colorValue = isEditAllMode
                                      ? item.color_pick
                                      : editForm.color_pick;
                                    // Ensure it's a valid hex color string
                                    if (
                                      typeof colorValue === "string" &&
                                      /^#([0-9A-F]{3}){1,2}$/i.test(
                                        colorValue.trim()
                                      )
                                    ) {
                                      return colorValue.trim();
                                    }
                                    return "#000000";
                                  })()}
                                  onChange={(e) => {
                                    const pickedColor = e.target.value;

                                    if (isEditAllMode) {
                                      handleAllItemsInputChange(
                                        item.id,
                                        "color_pick",
                                        pickedColor
                                      );
                                      // handleAllItemsInputChange(item.id, 'color_id', colorId);
                                    } else {
                                      setEditForm({
                                        ...editForm,
                                        color_pick: pickedColor,
                                        color_id: colorId,
                                      });
                                    }
                                  }}
                                />
                                <button
                                  className="px-1 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                                  onClick={() =>
                                    setOpenColorDropdownId(
                                      openColorDropdownId === item.id
                                        ? null
                                        : item.id
                                    )
                                  }
                                >
                                  ▼
                                </button>
                              </div>

                              {openColorDropdownId === item.id && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                  <li className="p-2">
                                    <input
                                      type="text"
                                      placeholder="Search colors..."
                                      className="w-full p-2 border rounded-md"
                                      value={searchTerm}
                                      onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                      }
                                      autoFocus
                                    />
                                  </li>
                                  {filteredColors?.length > 0 ? (
                                    filteredColors?.map((color, index) => (
                                      <li
                                        key={color.color_id}
                                        className={`px-4 py-3 cursor-pointer flex items-center ${index === highlightedIndex
                                            ? "bg-blue-100"
                                            : "hover:bg-gray-50"
                                          }`}
                                        onClick={() => {
                                          handleSelect(
                                            color,
                                            isEditAllMode ? item.id : null
                                          );
                                          setOpenColorDropdownId(null);
                                        }}
                                        onMouseEnter={() =>
                                          setHighlightedIndex(index)
                                        }
                                      >
                                        <div
                                          className="w-6 h-6 rounded-full mr-3 border border-gray-300"
                                          style={{
                                            backgroundColor:
                                              color.color_pick.toLowerCase(),
                                          }}
                                        />
                                        <div>
                                          <div className="font-medium text-gray-800">
                                            {color.color_name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            ID: {color.color_id}
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
                        ) : (
                          <div className="flex items-center">
                            <div
                              className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                              style={{ backgroundColor: item?.color_pick }}
                            ></div>
                            <span>{item?.color_pick}</span>
                          </div>
                        )}
                      </td>

                      {/* Size */}
                      <td className="px-1 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <select
                            name="size_name"
                            value={
                              isEditAllMode
                                ? item.size_id
                                : editForm.size_id || ""
                            }
                            onChange={(e) => {
                              const name = sizes.find(
                                (i) => i.size_id == e.target.value
                              )?.size_name;
                              if (isEditAllMode) {
                                handleAllItemsSelectChange(
                                  item.id,
                                  "size_id",
                                  e.target.value,
                                  "size_name",
                                  name
                                );
                              } else {
                                handleSelectChange("size_id", name);
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Size</option>
                            {sizes.map((size) => (
                              <option key={size.size_id} value={size.size_id}>
                                {size.size_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`${item.size_name == item.size_name.toUpperCase()
                                ? "border bg-white text-red-600 px-2 font-bold"
                                : ""
                              }`}
                          >
                            {item?.size_name}
                          </span>
                        )}
                      </td>

                      {/* Scale */}
                      <td className="px-1 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <select
                            name="scale_name"
                            value={
                              isEditAllMode
                                ? item.scale_id
                                : editForm.scale_id || ""
                            }
                            onChange={(e) => {
                              const name = scales.find(
                                (i) => i.scale_id == e.target.value
                              )?.scale_name;
                              if (isEditAllMode) {
                                handleAllItemsSelectChange(
                                  item.id,
                                  "scale_id",
                                  e.target.value,
                                  "scale_name",
                                  name
                                );
                              } else {
                                handleSelectChange("scale_id", name);
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Scale</option>
                            {scales.map((scale) => (
                              <option
                                key={scale.scale_id}
                                value={scale.scale_id}
                              >
                                {scale.scale_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`${item.scale_name == item.scale_name.toUpperCase()
                                ? "border bg-white text-red-600 px-2 font-bold"
                                : ""
                              }`}
                          >
                            {item?.scale_name}
                          </span>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="px-1 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <select
                            name="brand_name"
                            value={
                              isEditAllMode
                                ? item.brand_id
                                : editForm.brand_id || ""
                            }
                            onChange={(e) => {
                              const name = brands.find(
                                (i) => i.brand_id == e.target.value
                              )?.brand_name;
                              if (isEditAllMode) {
                                handleAllItemsSelectChange(
                                  item.id,
                                  "brand_id",
                                  e.target.value,
                                  "brand_name",
                                  name
                                );
                              } else {
                                handleSelectChange("brand_id", name);
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Brand</option>
                            {brands.map((brand) => (
                              <option
                                key={brand.brand_id}
                                value={brand.brand_id}
                              >
                                {brand.brand_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`${item.brand_name == item.brand_name.toUpperCase()
                                ? "border bg-white text-red-600 px-2 font-bold"
                                : ""
                              }`}
                          >
                            {item?.brand_name}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-1 whitespace-nowrap">
                        {isEditAllMode || editingId === item?.id ? (
                          <select
                            name="category_name"
                            value={
                              isEditAllMode
                                ? item.category_id
                                : editForm.category_id || ""
                            }
                            onChange={(e) => {
                              const name = categories.find(
                                (i) => i.category_id == e.target.value
                              )?.category_name;
                              if (isEditAllMode) {
                                handleAllItemsSelectChange(
                                  item.id,
                                  "category_id",
                                  e.target.value,
                                  "category_name",
                                  name
                                );
                              } else {
                                handleSelectChange("category_id", name);
                              }
                            }}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                              <option
                                key={category.category_id}
                                value={category.category_id}
                              >
                                {category.category_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`${item.category_name ==
                                item.category_name.toUpperCase()
                                ? "border bg-white text-red-600 px-2 font-bold"
                                : ""
                              }`}
                          >
                            {item?.category_name}
                          </span>
                        )}
                      </td>
                      {/* Quantity */}
                      {/* <td className="px-1 whitespace-nowrap">
                                            {isEditAllMode || editingId === item?.id ? (
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={isEditAllMode ? item.quantity : editForm?.quantity || 1}
                                                    onChange={(e) => isEditAllMode
                                                        ? handleAllItemsInputChange(item.id, 'quantity', e.target.value)
                                                        : handleInputChange(e)
                                                    }
                                                    className="w-full p-2 border rounded-md"
                                                    min="1"
                                                />
                                            ) : (
                                                <span>{item?.quantity}</span>
                                            )}
                                        </td> */}

                      {/* Expire Date */}
                      {/* <td className="px-1 whitespace-nowrap">
                                            {isEditAllMode || editingId === item?.id ? (
                                                <input
                                                    type="date"
                                                    name="expire_date"
                                                    value={isEditAllMode ? item.expire_date : editForm?.expire_date || ''}
                                                    onChange={(e) => isEditAllMode
                                                        ? handleAllItemsInputChange(item.id, 'expire_date', e.target.value)
                                                        : handleInputChange(e)
                                                    }
                                                    className="w-full p-2 border rounded-md"
                                                />
                                            ) : (
                                                <span>{item?.expire_date}</span>
                                            )}
                                        </td> */}

                      {/* Term */}
                      {/* <td className="px-1 whitespace-nowrap">
                                            {isEditAllMode || editingId === item?.id ? (
                                                <input
                                                    type="text"
                                                    name="term"
                                                    value={isEditAllMode ? item.term : editForm?.term || ''}
                                                    onChange={(e) => isEditAllMode
                                                        ? handleAllItemsInputChange(item.id, 'term', e.target.value)
                                                        : handleInputChange(e)
                                                    }
                                                    className="w-full p-2 border rounded-md"
                                                />
                                            ) : (
                                                <span>{item?.term}</span>
                                            )}
                                        </td> */}

                      {/* Actions */}
                      <td className="px-1 whitespace-nowrap text-sm font-medium">
                        {isEditAllMode ? (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full bg-red-100"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        ) : editingId === item?.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSave}
                              className="text-green-600 hover:text-green-900 p-1 rounded-full bg-green-100"
                              title="Save"
                            >
                              <FiSave size={18} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full bg-red-100"
                              title="Cancel"
                            >
                              <FiX size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full bg-blue-100"
                              title="Edit"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full bg-red-100"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportItems;
