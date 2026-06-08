import React, { useEffect, useState } from "react";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useNavigate } from "react-router";
import { useExpContext } from "../../components/expenses/Expanses";
import {
  useGetAllExpansesQuery,
} from "../../../app/Features/expensesSlice";
import { toast } from "react-toastify";
import {
  FaTrash,
  FaPlus,
  FaSave,
  FaTimes,
  FaCalendarAlt,
  FaUser,
  FaTruck,
  FaFileAlt,
  FaList,
  FaDollarSign,
  FaEdit,
  FaCloudUploadAlt,
  FaImage
} from "react-icons/fa";
import { MdAddCircle, MdRemoveCircle } from "react-icons/md";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import { Modal } from "antd";
import CreateExpanseTypes from "./CreateExpanseTypes";

const CreateExpanses = () => {
  const { t } = useTranslation();
  const [expense_type, setexpense_type] = useState([]);
  const { expenseType, onAdd, edit: existingExpanse } = useExpContext();
  const isEditMode = !!existingExpanse?.expense_id;
  const [expType, setexpType] = useState([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const today = new Date();
  const navigator = useNavigate();
  const expDate = today.toISOString().split("T")[0];
  const {
    setLoading,
    darkMode
  } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem("token");
  const [expense, setexpense] = useState({
    expense_supplier: "",
    expense_by: "",
    purchased_by: "",
    expense_date: expDate,
    expense_other: "",
    amount: 0,
    items: [],
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const { refetch } = useGetAllExpansesQuery(token);

  useEffect(() => {
    setexpType(expenseType);
  }, [expenseType]);

  useEffect(() => {
    if (isEditMode && existingExpanse) {
      const expenseData = existingExpanse;

      // Set main expense data
      setexpense({
        expense_supplier: expenseData.expense_supplier || "",
        expense_by: expenseData.expense_by || "",
        purchased_by: expenseData.purchased_by || "",
        expense_date: expenseData.expense_date || expDate,
        expense_other: expenseData.expense_other || "",
        amount: expenseData.amount || 0,
        items: expenseData.items || [],
      });

      // Set expense items
      if (expenseData.items && Array.isArray(expenseData.items)) {
        setexpense_type(expenseData.items);
      }

      // Set existing images previews
      if (expenseData.images && Array.isArray(expenseData.images)) {
        setPreviewUrls(expenseData.images.map(img => img.image));
      }
    }
  }, [existingExpanse, isEditMode, expDate]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    const preview = previewUrls[index];
    const isNewFile = preview.startsWith('blob:');

    if (isNewFile) {
        const blobUrlsBefore = previewUrls.slice(0, index).filter(url => url.startsWith('blob:')).length;
        setSelectedFiles(prev => prev.filter((_, i) => i !== blobUrlsBefore));
    }

    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  function onSelectExptype(e) {
    if (e.target.value === "Pick a expense type") return;

    const selectedTypeId = e.target.value;
    const finding = expenseType.find(
      (exp) => exp.expense_type_id == selectedTypeId
    );

    if (!finding) return;

    const newItem = {
      ...finding,
      quantity: 1,
      unit_price: 0,
      description: "",
      sub_total: 0
    };

    setexpense_type((prev) => {
      return [...prev, newItem];
    });

    e.target.value = "Pick a expense type";
  }

  function handleRemove(index) {
    setexpense_type((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleSubmit() {
    if (expense_type.length === 0) {
      toast.error(t('atLeastOneItemRequired'));
      return;
    }

    if (!expense.expense_supplier.trim()) {
      toast.error(t('enterSupplierNameError'));
      return;
    }

    if (!expense.expense_by.trim()) {
      toast.error(t('enterWhoPaidError'));
      return;
    }

    const amount = expense_type.reduce(
      (init, exp) => Number(exp.sub_total || 0) + init,
      0
    );

    setexpense(prev => ({ ...prev, amount: amount, items: expense_type }));
    handleConfirm();
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);

      const formData = new FormData();
      formData.append('expense_supplier', expense.expense_supplier);
      formData.append('expense_by', expense.expense_by);
      formData.append('purchased_by', expense.purchased_by);
      formData.append('expense_date', expense.expense_date);
      formData.append('expense_other', expense.expense_other);
      formData.append('amount', expense.amount);
      formData.append('items', JSON.stringify(expense_type));

      selectedFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      if (isEditMode) {
        if (existingExpanse.images) {
            existingExpanse.images.forEach(img => {
                if (previewUrls.includes(img.image)) {
                    formData.append('image_ids[]', img.image_id);
                }
            });
        }
        
        formData.append('_method', 'PUT');
        await api.post(`/expense_masters/${existingExpanse?.expense_id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post("/expense_masters", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      refetch();
      toast.success(isEditMode ? t('expenseUpdatedSuccess') : t('expenseCreatedSuccess'));
      setLoading(false);
      onAdd();
      navigator(-1);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        error ||
        "An error occurred"
      );
      setLoading(false);
      setAlertBox(false);
    }
  }

  const handleChange = (index, field, value) => {
    setexpense_type((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      const quantity = parseFloat(updated[index].quantity) || 0;
      const unit_price = parseFloat(updated[index].unit_price) || 0;
      updated[index].sub_total = (quantity * unit_price).toFixed(2);

      return updated;
    });
  };

  const calculateTotal = () => {
    return expense_type.reduce((sum, item) => sum + (parseFloat(item.sub_total) || 0), 0);
  };

  const handleIncreaseQuantity = (index) => {
    setexpense_type(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const qty = (parseInt(item.quantity) || 0) + 1;
        const price = parseFloat(item.unit_price) || 0;

        return {
          ...item,
          quantity: qty,
          sub_total: (qty * price).toFixed(2)
        };
      })
    );
  };

  const handleDecreaseQuantity = (index) => {
    setexpense_type(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const qty = (parseInt(item.quantity) || 0) - 1;
        const price = parseFloat(item.unit_price) || 0;

        return {
          ...item,
          quantity: qty,
          sub_total: (qty * price).toFixed(2)
        };
      })
    );
  };

  const handleReset = () => {
    setexpense({
      expense_supplier: "",
      expense_by: "",
      purchased_by: "",
      expense_date: expDate,
      expense_other: "",
      amount: 0,
      items: [],
    });
    setexpense_type([]);
    setexpType(expenseType || []);
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return (
    <section className={`view-page p-2 md:p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <AlertBox
        isOpen={alertBox}
        title={isEditMode ? t('confirmUpdate') : t('confirmation')}
        message={isEditMode ? t('confirmUpdateExpenseCategory') : t('confirmCreateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? t('updateExpense') : t('createExpense')}
        cancelText={t('cancel')}
      />

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <div className={`p-1.5 ${isEditMode ? 'bg-yellow-100' : 'bg-blue-100'} rounded-lg`}>
                  <FaDollarSign className={`w-4 h-4 md:w-5 md:h-5 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                {isEditMode ? t('editExpense') : t('createNewExpense')}
              </h1>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} text-xs md:text-sm mt-1 ml-1`}>
                {isEditMode ? t('updateExpenseDetails') : t('addExpenseDetails')}
              </p>
            </div>

            {isEditMode && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${darkMode ? "bg-yellow-900/20 border-yellow-800 text-yellow-500" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                <FaEdit className="w-3 h-3" />
                <span>{t('editMode')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left Panel - Expense Details */}
          <div className="w-full lg:w-[350px] shrink-0">
            <div className={`rounded-2xl shadow-sm p-4 md:p-5 border lg:sticky lg:top-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-4 md:mb-5">
                <div className={`p-1.5 ${isEditMode ? (darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50') : (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')} rounded-lg`}>
                  <FaFileAlt className={`w-4 h-4 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{t('expenseDetails')}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaTruck className="w-3.5 h-3.5 text-gray-500" />
                    {t('supplier')} *
                  </label>
                  <input
                    type="text"
                    value={expense.expense_supplier}
                    onChange={(e) => setexpense(prev => ({ ...prev, expense_supplier: e.target.value }))}
                    placeholder={t('enterSupplierName')}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:ring-2 transition-all ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <FaUser className="w-3.5 h-3.5 text-gray-500" />
                      {t('paidBy')} *
                    </label>
                    <input
                      type="text"
                      value={expense.expense_by}
                      onChange={(e) => setexpense(prev => ({ ...prev, expense_by: e.target.value }))}
                      placeholder={t('name')}
                      className={`w-full px-3 py-2 text-sm rounded-xl border focus:ring-2 transition-all ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <FaUser className="w-3.5 h-3.5 text-gray-500" />
                      {t('purchasedBy')}
                    </label>
                    <input
                      type="text"
                      value={expense.purchased_by}
                      onChange={(e) => setexpense(prev => ({ ...prev, purchased_by: e.target.value }))}
                      placeholder={t('name')}
                      className={`w-full px-3 py-2 text-sm rounded-xl border focus:ring-2 transition-all ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaCalendarAlt className="w-3.5 h-3.5 text-gray-500" />
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={expense.expense_date}
                    onChange={(e) => setexpense(prev => ({ ...prev, expense_date: e.target.value || expDate }))}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:ring-2 transition-all ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaList className="w-3.5 h-3.5 text-gray-500" />
                    {t('notes')}
                  </label>
                  <textarea
                    value={expense.expense_other}
                    onChange={(e) => setexpense(prev => ({ ...prev, expense_other: e.target.value }))}
                    placeholder={t('enterNotesPlaceholder')}
                    rows="2"
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:ring-2 transition-all resize-none ${
                      darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                    }`}
                  ></textarea>
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaImage className="w-3.5 h-3.5 text-gray-500" />
                    {t('receipts')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-300 group">
                        <img src={url} alt="Receipt" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTimes size={8} />
                        </button>
                      </div>
                    ))}
                    <label className={`w-14 h-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      darkMode 
                      ? "border-gray-600 bg-gray-700 text-gray-400" 
                      : "border-gray-300 bg-gray-50 text-gray-500"
                    }`}>
                      <FaCloudUploadAlt size={16} />
                      <span className="text-[8px] mt-1 font-bold">ADD</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <div className={`rounded-xl p-3 ${darkMode ? "bg-gray-900" : "bg-blue-50/50"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('totalAmount')}:</span>
                    <span className={`text-lg font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                      ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {expense_type.length} {t('itemCount')}
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className={`w-full mt-3 px-3 py-2 text-xs font-medium border rounded-xl transition-all ${
                    darkMode 
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" 
                    : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t('resetForm')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Expense Items */}
          <div className="flex-1 min-w-0">
            <div className={`rounded-2xl shadow-sm p-4 md:p-5 border h-full ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${darkMode ? "bg-green-900/30" : "bg-green-50"}`}>
                    <FaList className={`w-4 h-4 ${darkMode ? "text-green-500" : "text-green-600"}`} />
                  </div>
                  <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{t('expenseItems')}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:min-w-[200px]">
                    <select
                      defaultValue={"Pick a expense type"}
                      onChange={onSelectExptype}
                      className={`w-full pl-9 pr-8 py-2 text-sm rounded-xl border focus:ring-2 appearance-none transition-all ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                      }`}
                      disabled={expType.length === 0}
                    >
                      <option disabled value="Pick a expense type">
                        {expType.length === 0 ? t('allTypesAdded') : t('pickExpenseType')}
                      </option>
                      {expType?.map(({ expense_type_id, expense_type_name }) => (
                        <option key={expense_type_id} value={expense_type_id}>
                          {expense_type_name}
                        </option>
                      ))}
                    </select>
                    <MdAddCircle className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${expType.length === 0 ? 'text-gray-400' : (darkMode ? 'text-green-400' : 'text-green-500')}`} />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(true)}
                    className={`p-2 rounded-xl border transition-all ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-green-400" 
                      : "bg-white border-gray-300 text-green-600 shadow-sm"
                    }`}
                  >
                    <FaPlus size={14} />
                  </button>
                </div>
              </div>

              {expense_type.length === 0 ? (
                <div className={`text-center py-10 border-2 border-dashed rounded-2xl ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <FaList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <h3 className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('noItemsAddedYet')}</h3>
                  <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{t('startBySelectingType')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`overflow-x-auto rounded-xl border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={darkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                        <tr>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('type')}</th>
                          <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('description')}</th>
                          <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('qty')}</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('price')}</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('total')}</th>
                          <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100"}`}>
                        {expense_type.map((exp, index) => (
                          <tr key={`${exp.expense_type_id}-${index}`} className={darkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50/50"}>
                            <td className="px-4 py-3 text-xs font-medium text-gray-400">{index + 1}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-gray-700 dark:text-gray-200">{exp.expense_type_name}</td>
                            <td className="px-4 py-3 min-w-[150px]">
                              <input
                                type="text"
                                onChange={(e) => handleChange(index, "description", e.target.value)}
                                value={exp.description || ""}
                                placeholder={t('description')}
                                className={`w-full px-2 py-1 text-xs rounded border transition-all ${
                                  darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleDecreaseQuantity(index)}
                                  className={`p-0.5 rounded-lg border transition-all disabled:opacity-30 ${
                                    darkMode ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-500"
                                  }`}
                                  disabled={(parseInt(exp.quantity) || 1) <= 1}
                                >
                                  <MdRemoveCircle size={14} />
                                </button>
                                <span className="text-xs font-bold w-4 text-center">{exp.quantity || 1}</span>
                                <button
                                  onClick={() => handleIncreaseQuantity(index)}
                                  className={`p-0.5 rounded-lg border transition-all ${
                                    darkMode ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-500"
                                  }`}
                                >
                                  <MdAddCircle size={14} />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="relative inline-block">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                <input
                                  type="number"
                                  onWheel={(e) => e.target.blur()}
                                  value={exp.unit_price || ""}
                                  onChange={(e) => handleChange(index, "unit_price", e.target.value)}
                                  placeholder="0.00"
                                  className={`w-20 pl-4 pr-1.5 py-1 text-right text-xs rounded border transition-all ${
                                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-white">
                              ${parseFloat(exp.sub_total || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleRemove(index)} className="text-red-400 hover:text-red-500 transition-colors">
                                <FaTrash size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <div className={`rounded-xl p-4 w-full max-w-[250px] ${darkMode ? "bg-gray-900/50" : "bg-emerald-50/50 border border-emerald-100"}`}>
                      <div className="flex justify-between items-center text-xs font-bold text-gray-800 dark:text-white">
                        <span>{t('totalAmount')}:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border shadow-sm ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className={`text-[10px] md:text-xs flex items-center gap-1.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>{t('fieldsMarkedWith')} * {t('required')}</span>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigator(-1)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                darkMode 
                ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" 
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaTimes className="w-3.5 h-3.5" />
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={expense_type.length === 0 || !expense.expense_supplier || !expense.expense_by}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                expense_type.length === 0 || !expense.expense_supplier || !expense.expense_by
                ? (darkMode ? 'bg-gray-700 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                : isEditMode
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:shadow-yellow-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-600/20'
              }`}
            >
              {isEditMode ? <FaEdit size={16} /> : <FaSave size={16} />}
              {isEditMode ? t('updateExpense') : t('createExpense')}
            </button>
          </div>
        </div>
      </div>

      <Modal
        title={t('createNewExpenseType', 'Create New Expense Type')}
        open={showAddTypeModal}
        onCancel={() => setShowAddTypeModal(false)}
        footer={null}
        width={800}
        centered
        destroyOnClose
        className={darkMode ? "dark-modal" : ""}
      >
        <CreateExpanseTypes onAdd={() => setShowAddTypeModal(false)} />
      </Modal>
    </section>
  );
};

export default CreateExpanses;
