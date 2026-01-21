import React, { useEffect, useState } from "react";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useNavigate, useParams } from "react-router";
import { useExpContext } from "../../components/expanses/Expanses";
import {
  useCreateExpanseMutation,
  useGetAllExpansesQuery,
  useGetExpanseByIdQuery,
  useUpdateExpanseMutation
} from "../../../app/Features/expansesSlice";
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

const CreateExpanses = () => {

  const [expanse_type, setexpanse_type] = useState([]);
  const { expanseType, onAdd, edit: existingExpanse } = useExpContext();
  const isEditMode = !!existingExpanse?.expanse_id;
  const [expType, setexpType] = useState([]);
  const today = new Date();
  const navigator = useNavigate();
  const expDate = today.toISOString().split("T")[0];
  const {
    setLoading,
    loading,
    setAlert,
    setMessage,
    setAlertStatus,
    reload,
    setReload,
  } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem("token");
  const [expanse, setexpanse] = useState({
    expanse_supplier: "",
    expanse_by: "",
    expanse_date: expDate,
    expanse_other: "",
    amount: 0,
    items: [],
  });

  // Get existing expanse data for edit mode
  // const { data: existingExpanse, isLoading: isLoadingExpanse } = useGetExpanseByIdQuery(
  //   { id, token },
  //   { skip: !isEditMode }
  // );
  console.log(existingExpanse);


  const { refetch } = useGetAllExpansesQuery(token);
  const [createExpanse, expanseCreated] = useCreateExpanseMutation();
  const [updateExpanse, expanseUpdated] = useUpdateExpanseMutation();

  useEffect(() => {
    setexpType(expanseType);
  }, [expanseType]);

  useEffect(() => {
    if (isEditMode && existingExpanse) {
      const expenseData = existingExpanse;

      // Set main expense data
      setexpanse({
        expanse_supplier: expenseData.expanse_supplier || "",
        expanse_by: expenseData.expanse_by || "",
        expanse_date: expenseData.expanse_date || expDate,
        expanse_other: expenseData.expanse_other || "",
        amount: expenseData.amount || 0,
        items: expenseData.items || [],
      });

      // Set expense items
      if (expenseData.items && Array.isArray(expenseData.items)) {
        setexpanse_type(expenseData.items);
      }
    }
  }, [existingExpanse, isEditMode]);

  function onSelectExptype(e) {
    if (e.target.value === "Pick a expanse type") return;

    const selectedTypeId = e.target.value;
    const finding = expanseType.find(
      (exp) => exp.expanse_type_id == selectedTypeId
    );

    if (!finding) return;



    const newItem = {
      ...finding,
      quantity: 1,
      unit_price: 0,
      description: "",
      sub_total: 0
    };

    setexpanse_type((prev) => {
      return [...prev, newItem];
    });

    e.target.value = "Pick a expanse type";
  }

  function handleRemove(index) {
    const removedItem = expanse_type[index];
    setexpanse_type((prev) => prev.filter((_, idx) => idx !== index));
  }

  function handleSubmit() {
    if (expanse_type.length === 0) {
      toast.error("Please add at least one expense item");
      return;
    }

    if (!expanse.expanse_supplier.trim()) {
      toast.error("Please enter supplier name");
      return;
    }

    if (!expanse.expanse_by.trim()) {
      toast.error("Please enter who paid for this expense");
      return;
    }

    const amount = expanse_type.reduce(
      (init, exp) => Number(exp.sub_total || 0) + init,
      0
    );

    setexpanse(prev => ({ ...prev, amount: amount, items: expanse_type }));
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);

      let response;
      if (isEditMode) {
        response = await updateExpanse({
          id: existingExpanse?.expanse_id,
          itemData: expanse,
          token
        });
      } else {
        response = await createExpanse({ itemData: expanse, token });
      }

      if (response.data.status === 200) {
        refetch();
        toast.success(isEditMode ? "Expense updated successfully" : "Expense created successfully");
        setLoading(false);
        onAdd();
        navigator("/dashboard/expanse");
      }
    } catch (error) {
      toast.error(
        error?.message ||
        error ||
        `An error occurred while ${isEditMode ? 'updating' : 'creating'} the expense`
      );
      setLoading(false);
      setAlertBox(false);
    }
  }

  const handleChange = (index, field, value) => {
    setexpanse_type((prev) => {
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
    return expanse_type.reduce((sum, item) => sum + (parseFloat(item.sub_total) || 0), 0);
  };

  const handleIncreaseQuantity = (index) => {

    setexpanse_type(prev =>
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
  console.log(expanse_type);


  const handleDecreaseQuantity = (index) => {
    setexpanse_type(prev =>
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
    setexpanse({
      expanse_supplier: "",
      expanse_by: "",
      expanse_date: expDate,
      expanse_other: "",
      amount: 0,
      items: [],
    });
    setexpanse_type([]);
    setexpType(expanseType || []);
  };

  // if (isEditMode) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //         <p className="mt-4 text-gray-600">Loading expense data...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <section className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <AlertBox
        isOpen={alertBox}
        title={`Confirm Expense ${isEditMode ? 'Update' : 'Creation'}`}
        message={`Are you sure you want to ${isEditMode ? 'update' : 'create'} this expense record?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? "Update Expense" : "Create Expense"}
        cancelText="Cancel"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div className={`p-2 ${isEditMode ? 'bg-yellow-100' : 'bg-blue-100'} rounded-lg`}>
                  <FaDollarSign className={`w-6 h-6 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                {isEditMode ? "Edit Expense" : "Create New Expense"}
              </h1>
              <p className="text-gray-600 mt-2 ml-1">
                {isEditMode
                  ? "Update expense details and items"
                  : "Add expense details and items to record a new transaction"
                }
              </p>
            </div>

            {isEditMode && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <FaEdit className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Edit Mode</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Expense Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${isEditMode ? 'bg-yellow-50' : 'bg-blue-50'} rounded-lg`}>
                  <FaFileAlt className={`w-5 h-5 ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Expense Details</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaTruck className="w-4 h-4 text-gray-500" />
                    Supplier *
                  </label>
                  <input
                    type="text"
                    value={expanse.expanse_supplier}
                    onChange={(e) => {
                      setexpanse((prev) => ({
                        ...prev,
                        expanse_supplier: e.target.value
                      }));
                    }}
                    placeholder="Enter supplier name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="w-4 h-4 text-gray-500" />
                    Paid By *
                  </label>
                  <input
                    type="text"
                    value={expanse.expanse_by}
                    onChange={(e) => {
                      setexpanse((prev) => ({
                        ...prev,
                        expanse_by: e.target.value
                      }));
                    }}
                    placeholder="Enter payer name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="w-4 h-4 text-gray-500" />
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={expanse.expanse_date}
                    onChange={(e) => {
                      setexpanse((prev) => ({
                        ...prev,
                        expanse_date: e.target.value || expDate
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FaList className="w-4 h-4 text-gray-500" />
                    Notes & Description
                  </label>
                  <textarea
                    value={expanse.expanse_other}
                    onChange={(e) => {
                      setexpanse((prev) => ({
                        ...prev,
                        expanse_other: e.target.value
                      }));
                    }}
                    placeholder="Enter additional notes or description..."
                    rows="4"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Summary Card */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700 font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {expanse_type.length} item{expanse_type.length !== 1 ? 's' : ''} added
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 border border-gray-300"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Expense Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <FaList className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Expense Items</h2>
                </div>

                <div className="relative w-full sm:w-auto min-w-[250px]">
                  <select
                    defaultValue={"Pick a expanse type"}
                    onChange={onSelectExptype}
                    className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white appearance-none"
                    disabled={expType.length === 0}
                  >
                    <option disabled value="Pick a expanse type">
                      {expType.length === 0 ? "All types added" : "+ Add Expense Type"}
                    </option>
                    {expType?.map(({ expanse_type_id, expanse_type_name }) => (
                      <option key={expanse_type_id} value={expanse_type_id}>
                        {expanse_type_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <MdAddCircle className={`w-5 h-5 ${expType.length === 0 ? 'text-gray-400' : 'text-green-500'}`} />
                  </div>
                  {expType.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      All available expense types have been added.
                    </p>
                  )}
                </div>
              </div>

              {expanse_type.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <div className="text-gray-400 mb-4">
                    <FaList className="w-16 h-16 mx-auto opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Items Added Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Start by selecting an expense type from the dropdown above to add items to your expense record.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Subtotal
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expanse_type.map((exp, index) => (
                          <tr key={`${exp.expanse_type_id}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded">
                                  <FaList className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {exp.expanse_type_name}
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
                                placeholder="Item description..."
                                className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleDecreaseQuantity(index)}
                                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={(parseInt(exp.quantity) || 1) <= 1}
                                >
                                  <MdRemoveCircle className="w-4 h-4 text-gray-600" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={exp.quantity || 1}
                                  onChange={(e) =>
                                    handleChange(index, "quantity", e.target.value)
                                  }
                                  className="w-20 px-3 py-2 text-center text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                />
                                <button
                                  onClick={() => handleIncreaseQuantity(index)}
                                  className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                                >
                                  <MdAddCircle className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={exp.unit_price || ""}
                                  onChange={(e) =>
                                    handleChange(index, "unit_price", e.target.value)
                                  }
                                  placeholder="0.00"
                                  className="w-28 pl-7 pr-3 py-2 text-sm rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-semibold text-gray-900 flex items-center gap-1">
                                <FaDollarSign className="w-3 h-3 text-green-600" />
                                {parseFloat(exp.sub_total || 0).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleRemove(index)}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:text-white hover:bg-red-500 transition-all duration-200 border border-red-200 hover:border-red-500"
                              >
                                <FaTrash className="w-3 h-3" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Summary */}
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 w-full max-w-md">
                      <div className="space-y-2">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200">
                          <span>Total Amount:</span>
                          <span className="text-green-600">
                            ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Fields marked with * are required</span>
                </div>
              </div>

              <div className="flex gap-3">
                <form method="dialog">
                  <button
                    onClick={() => navigator("/dashboard/expanse")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    <FaTimes className="w-4 h-4" />
                    Cancel
                  </button>
                </form>
                <button
                  onClick={handleSubmit}
                  disabled={expanse_type.length === 0 || !expanse.expanse_supplier || !expanse.expanse_by}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${expanse_type.length === 0 || !expanse.expanse_supplier || !expanse.expanse_by
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isEditMode
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-sm hover:shadow-sm transform hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-sm transform hover:-translate-y-0.5'
                    }`}
                >
                  {isEditMode ? <FaEdit className="w-5 h-5" /> : <FaSave className="w-5 h-5" />}
                  {isEditMode ? "Update Expense" : "Create Expense"}
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