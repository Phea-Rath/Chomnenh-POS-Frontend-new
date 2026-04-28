import React, { useEffect, useState } from "react";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useNavigate, useParams } from "react-router";
import { useExpContext } from "../../components/expenses/Expanses";
import {
  useCreateExpanseMutation,
  useGetAllExpansesQuery,
  useGetExpanseByIdQuery,
  useUpdateExpanseMutation
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
  FaCheck
} from "react-icons/fa";
import { MdAddCircle, MdRemoveCircle } from "react-icons/md";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

const CreateExpanses = () => {
  const { t } = useTranslation();
  const [expense_type, setexpense_type] = useState([]);
  const { expenseType, onAdd, edit: existingExpanse } = useExpContext();
  const isEditMode = !!existingExpanse?.expense_id;
  const [expType, setexpType] = useState([]);
  const today = new Date();
  const navigator = useNavigate();
  const expDate = today.toISOString().split("T")[0];
  const {
    setLoading,
    loading,
    darkMode
  } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem("token");
  const [expense, setexpense] = useState({
    expense_supplier: "",
    expense_by: "",
    expense_date: expDate,
    expense_other: "",
    amount: 0,
    items: [],
  });

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
        expense_date: expenseData.expense_date || expDate,
        expense_other: expenseData.expense_other || "",
        amount: expenseData.amount || 0,
        items: expenseData.items || [],
      });

      // Set expense items
      if (expenseData.items && Array.isArray(expenseData.items)) {
        setexpense_type(expenseData.items);
      }
    }
  }, [existingExpanse, isEditMode, expDate]);

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

      const payload = {
        expense_supplier: expense.expense_supplier,
        expense_by: expense.expense_by,
        expense_date: expense.expense_date,
        expense_other: expense.expense_other,
        amount: expense.amount,
        items: expense_type,
      };
      let response;
      if (isEditMode) {
        response = await api.put(`/expense_masters/${existingExpanse?.expense_id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        response = await api.post("/expense_masters", payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.data.status === 200) {
        refetch();
        toast.success(isEditMode ? t('expenseUpdatedSuccess') : t('expenseCreatedSuccess'));
        setLoading(false);
        onAdd();
        navigator(-1);
      }
    } catch (error) {
      toast.error(
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

  // Reset form
  const handleReset = () => {
    setexpense({
      expense_supplier: "",
      expense_by: "",
      expense_date: expDate,
      expense_other: "",
      amount: 0,
      items: [],
    });
    setexpense_type([]);
    setexpType(expenseType || []);
  };

  return (
    <section className={`view-page p-4 md:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <AlertBox
        isOpen={alertBox}
        title={isEditMode ? t('confirmUpdate') : t('confirmation')}
        message={isEditMode ? t('confirmUpdateExpenseCategory') : t('confirmCreateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? t('updateExpense') : t('createExpense')}
        cancelText={t('cancel')}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <div className={`p-2 ${isEditMode ? 'bg-yellow-100' : 'bg-blue-100'} rounded-lg`}>
                  <FaDollarSign className={`w-6 h-6 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                {isEditMode ? t('editExpense') : t('createNewExpense')}
              </h1>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mt-2 ml-1`}>
                {isEditMode
                  ? t('updateExpenseDetails')
                  : t('addExpenseDetails')
                }
              </p>
            </div>

            {isEditMode && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${darkMode ? "bg-yellow-900/20 border-yellow-800 text-yellow-500" : "bg-yellow-50 border-yellow-200 text-yellow-700"}`}>
                <FaEdit className="w-4 h-4" />
                <span className="text-sm font-medium">{t('editMode')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Expense Details */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl shadow-md p-6 border sticky top-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${isEditMode ? (darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50') : (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')} rounded-lg`}>
                  <FaFileAlt className={`w-5 h-5 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{t('expenseDetails')}</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaTruck className="w-4 h-4 text-gray-500" />
                    {t('supplier')} *
                  </label>
                  <input
                    type="text"
                    value={expense.expense_supplier}
                    onChange={(e) => {
                      setexpense((prev) => ({
                        ...prev,
                        expense_supplier: e.target.value
                      }));
                    }}
                    placeholder={t('enterSupplierName')}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 transition-all duration-200 ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                      : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaUser className="w-4 h-4 text-gray-500" />
                    {t('paidBy')} *
                  </label>
                  <input
                    type="text"
                    value={expense.expense_by}
                    onChange={(e) => {
                      setexpense((prev) => ({
                        ...prev,
                        expense_by: e.target.value
                      }));
                    }}
                    placeholder={t('enterWhoPaid')}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 transition-all duration-200 ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                      : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                    {t('date')}
                  </label>
                  <input
                    type="date"
                    value={expense.expense_date}
                    onChange={(e) => {
                      setexpense((prev) => ({
                        ...prev,
                        expense_date: e.target.value || expDate
                      }));
                    }}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 transition-all duration-200 ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                      : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaList className="w-4 h-4 text-gray-500" />
                    {t('notesAndDescription')}
                  </label>
                  <textarea
                    value={expense.expense_other}
                    onChange={(e) => {
                      setexpense((prev) => ({
                        ...prev,
                        expense_other: e.target.value
                      }));
                    }}
                    placeholder={t('enterNotesPlaceholder')}
                    rows="4"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 transition-all duration-200 resize-none ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                      : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                  ></textarea>
                </div>
              </div>

              {/* Summary Card */}
              <div className={`mt-8 pt-6 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className={`rounded-lg p-4 ${darkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-50 to-indigo-50"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{t('totalAmount')}:</span>
                    <span className={`text-2xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                      ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={darkMode ? "text-gray-500" : "text-gray-500"}>
                    {expense_type.length} {t('itemCount')}
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className={`w-full mt-4 px-4 py-2.5 text-sm font-medium border rounded-lg transition-all duration-200 ${
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
          <div className="lg:col-span-2">
            <div className={`rounded-xl shadow-md p-6 border mb-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? "bg-green-900/30" : "bg-green-50"}`}>
                    <FaList className={`w-5 h-5 ${darkMode ? "text-green-500" : "text-green-600"}`} />
                  </div>
                  <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{t('expenseItems')}</h2>
                </div>

                <div className="relative w-full sm:w-auto min-w-[250px]">
                  <select
                    defaultValue={"Pick a expense type"}
                    onChange={onSelectExptype}
                    className={`w-full px-4 py-3 pl-10 rounded-lg border focus:ring-2 appearance-none ${
                      darkMode 
                      ? "bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-900/30" 
                      : "bg-white border-gray-300 focus:border-green-500 focus:ring-green-100"
                    }`}
                    disabled={expType.length === 0}
                  >
                    <option disabled value="Pick a expense type">
                      {expType.length === 0 ? t('allTypesAdded') : `+ ${t('pickExpenseType')}`}
                    </option>
                    {expType?.map(({ expense_type_id, expense_type_name }) => (
                      <option key={expense_type_id} value={expense_type_id}>
                        {expense_type_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <MdAddCircle className={`w-5 h-5 ${expType.length === 0 ? 'text-gray-400' : (darkMode ? 'text-green-400' : 'text-green-500')}`} />
                  </div>
                </div>
              </div>

              {expense_type.length === 0 ? (
                <div className={`text-center py-12 border-2 border-dashed rounded-xl ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-300 bg-gray-50"}`}>
                  <div className="text-gray-400 mb-4">
                    <FaList className="w-16 h-16 mx-auto opacity-40" />
                  </div>
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{t('noItemsAddedYet')}</h3>
                  <p className={`max-w-md mx-auto ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    {t('startBySelectingType')}
                  </p>
                </div>
              ) : (
                <>
                  <div className={`overflow-x-auto rounded-lg border mb-4 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                        <tr>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            #
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('type')}
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('description')}
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('quantity')}
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('unitPrice')}
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('subtotal')}
                          </th>
                          <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {t('actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}>
                        {expense_type.map((exp, index) => (
                          <tr key={`${exp.expense_type_id}-${index}`} className={`transition-colors ${darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-700"}`}>
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded ${darkMode ? "bg-blue-900/30" : "bg-blue-50"}`}>
                                  <FaList className={`w-4 h-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                                </div>
                                <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                                  {exp.expense_type_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                onChange={(e) =>
                                  handleChange(index, "description", e.target.value)
                                }
                                value={exp.description || ""}
                                placeholder={t('itemDescriptionPlaceholder')}
                                className={`w-full px-3 py-2 text-sm rounded border focus:ring-1 transition-all ${
                                  darkMode 
                                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                                  : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                }`}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDecreaseQuantity(index)}
                                  className={`p-1 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    darkMode 
                                    ? "bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600" 
                                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                                  }`}
                                  disabled={(parseInt(exp.quantity) || 1) <= 1}
                                >
                                  <MdRemoveCircle className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={exp.quantity || 1}
                                  onWheel={(e) => e.target.blur()}
                                  onChange={(e) =>
                                    handleChange(index, "quantity", e.target.value)
                                  }
                                  className={`w-20 px-3 py-2 text-center text-sm rounded border focus:ring-1 transition-all ${
                                    darkMode 
                                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                                    : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                  }`}
                                />
                                <button
                                  onClick={() => handleIncreaseQuantity(index)}
                                  className={`p-1 rounded-lg border transition-colors ${
                                    darkMode 
                                    ? "bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600" 
                                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  <MdAddCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  $
                                </span>
                                <input
                                  type="number"
                                  onWheel={(e) => e.target.blur()}
                                  min="0"
                                  step="0.01"
                                  value={exp.unit_price || ""}
                                  onChange={(e) =>
                                    handleChange(index, "unit_price", e.target.value)
                                  }
                                  placeholder="0.00"
                                  className={`w-28 pl-7 pr-3 py-2 text-sm rounded border focus:ring-1 transition-all ${
                                    darkMode 
                                    ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-900/30" 
                                    : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`font-semibold flex items-center gap-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                                <FaDollarSign className={`w-3 h-3 ${darkMode ? "text-green-400" : "text-green-600"}`} />
                                {parseFloat(exp.sub_total || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemove(index)}
                                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border ${
                                  darkMode 
                                  ? "text-red-400 border-red-900/30 hover:bg-red-500 hover:text-white" 
                                  : "text-red-600 border-red-200 hover:bg-red-500 hover:text-white"
                                }`}
                              >
                                <FaTrash className="w-3 h-3" />
                                {t('remove')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Summary */}
                  <div className="flex justify-end">
                    <div className={`rounded-lg p-5 w-full max-w-md ${darkMode ? "bg-gray-900" : "bg-gradient-to-r from-green-50 to-emerald-50"}`}>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={darkMode ? "text-gray-400" : "text-gray-700"}>{t('subtotal')}:</span>
                          <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className={`flex justify-between text-lg font-bold pt-2 border-t ${darkMode ? "text-white border-gray-800" : "text-gray-800 border-gray-200"}`}>
                          <span>{t('totalAmount')}:</span>
                          <span className={darkMode ? "text-green-400" : "text-green-600"}>
                            ${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 rounded-xl shadow-md p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className={darkMode ? "text-gray-500" : "text-gray-500"}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{t('fieldsMarkedWith')} * {t('required')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigator(-1)}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border transition-all duration-200 font-medium ${
                    darkMode 
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600" 
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FaTimes className="w-4 h-4" />
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={expense_type.length === 0 || !expense.expense_supplier || !expense.expense_by}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${expense_type.length === 0 || !expense.expense_supplier || !expense.expense_by
                    ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                    : isEditMode
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-sm transform hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm transform hover:-translate-y-0.5'
                    }`}
                >
                  {isEditMode ? <FaEdit className="w-5 h-5" /> : <FaSave className="w-5 h-5" />}
                  {isEditMode ? t('updateExpense') : t('createExpense')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreateExpanses;
