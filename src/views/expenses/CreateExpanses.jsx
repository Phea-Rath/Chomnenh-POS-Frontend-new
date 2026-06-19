import React, { useEffect, useState } from "react";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useNavigate, useParams } from "react-router";
import {
  useGetAllExpansesQuery,
  useGetExpanseByIdQuery,
} from "../../../app/Features/expensesSlice";
import { useGetAllExpanseTypesQuery } from "../../../app/Features/expenseTypesSlice";
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
  FaImage,
  FaStickyNote
} from "react-icons/fa";
import { MdAddCircle, MdRemoveCircle, MdPayment } from "react-icons/md";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import { Modal, DatePicker, Checkbox } from "antd";
import CreateExpanseTypes from "./CreateExpanseTypes";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import ItemTable from "../../utils/ItemTable";
import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import { GiNotebook } from "react-icons/gi";

const CreateExpanses = () => {
  const { t } = useTranslation();
  const { id: expenseId } = useParams();
  const [expense_type, setexpense_type] = useState([]);
  const isEditMode = !!expenseId;
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

  // Fetch expense types
  const expenseTypeQuery = useGetAllExpanseTypesQuery(token);
  const expenseType = expenseTypeQuery.data?.data || [];

  // Fetch expense data if in edit mode
  const { data: existingExpanseData, isLoading: isExpenseLoading } = useGetExpanseByIdQuery(
    { id: expenseId, token },
    { skip: !isEditMode }
  );
  const existingExpanse = existingExpanseData?.data;

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

  useEffect(() => {
    if (isExpenseLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [isExpenseLoading, setLoading]);

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

  const addItemToExpense = (id) => {
    const finding = expenseType.find(
      (exp) => exp.expense_type_id == id
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
  };

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
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    try {
      setLoading(true);
      setSubmitting(true);
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
      setSubmitting(false);
      navigator(-1);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        error ||
        "An error occurred"
      );
      setLoading(false);
      setSubmitting(false);
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
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  return (
    <div className="view-page bg-transparent transition-colors">
      <AlertBox
        isOpen={alertBox}
        title={isEditMode ? t('confirmUpdate') : t('confirmation')}
        message={isEditMode ? t('confirmUpdateExpenseCategory') : t('confirmCreateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={isEditMode ? t('updateExpense') : t('createExpense')}
        cancelText={t('cancel')}
      />

      <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
            {isEditMode ? t('editExpense') : t('createNewExpense')}
          </h1>
          <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
            {isEditMode ? t('updateExpenseDetails') : t('addExpenseDetails')}
          </p>
        </div>
        <div className="mt-6 flex justify-center items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isExpenseLoading || submitting}
            variant='primary'
            outline={false}
          >
            <FaSave />{submitting ? t('processing') : isEditMode ? t('update') : t('create')}
          </Button>
          <Button
            type="button"
            variant='cancel'
            onClick={() => navigator(-1)}
          >
            <FaTimes />{t('back')}
          </Button>
        </div>
      </div>

      <form>
        <div className="grid grid-cols-1">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex gap-2 justify-between bg-gray-100 dark:bg-transparent dark:border-gray-500 p-4 py-15 border border-gray-200">
                <div className="flex items-end gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                      <span className="flex items-center text-sm font-semibold gap-2">
                        <FaTruck className="text-gray-400" />
                        {t('supplier')} <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={expense.expense_supplier}
                      onChange={(value) => setexpense(prev => ({ ...prev, expense_supplier: value }))}
                      placeholder={t('enterSupplierName')}
                      className="text-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                      <span className="flex items-center text-sm font-semibold gap-2">
                        <FaUser className="text-gray-400" />
                        {t('paidBy')} <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={expense.expense_by}
                      onChange={(value) => setexpense(prev => ({ ...prev, expense_by: value }))}
                      placeholder={t('name')}
                      className="text-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                      <span className="flex items-center text-sm font-semibold gap-2">
                        <FaUser className="text-gray-400" />
                        {t('purchasedBy')}
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={expense.purchased_by}
                      onChange={(value) => setexpense(prev => ({ ...prev, purchased_by: value }))}
                      placeholder={t('name')}
                      className="text-input"
                    />
                  </div>
                </div>

                <div className="flex items-end gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                      <span className="flex items-center text-sm font-semibold gap-2">
                        <FaCalendarAlt className="text-gray-400" />
                        {t('date')}
                      </span>
                    </label>
                    <DatePicker value={expense.expense_date ? dayjs(expense.expense_date) : null} className="date-picker" size="large" onChange={(date, dateString) => setexpense(prev => ({ ...prev, expense_date: dateString || expDate }))} />
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="border-t-0 px-4 border-x bg-gradient-to-b from-gray-50 to-gray-100 dark:bg-transparent dark:from-transparent dark:to-transparent border-gray-200 dark:border-gray-500">
                <div className="flex items-center justify-between px-4 py-2 ">
                  <div className="flex items-center grow gap-2">
                    <RichSearch
                      data={expenseType}
                      placeholder={'--- ' + t('pickExpenseType') + ' ---'}
                      keyFields={{
                        id: 'expense_type_id',
                        title: 'expense_type_name',
                      }}
                      onSelected={(id) => addItemToExpense(id)}
                    />
                    <Button
                      type="button"
                      onClick={() => setShowAddTypeModal(true)}
                      variant='success'
                      className="flex items-center gap-2"
                    >
                      <FaPlus />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <label className={`flex items-center gap-2 text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <FaImage className="text-gray-400" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {previewUrls.map((url, idx) => (
                        <div key={idx} className="relative w-10 h-10 rounded border border-gray-300 group">
                          <img src={url} alt="Receipt" className="w-full h-full object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaTimes size={8} />
                          </button>
                        </div>
                      ))}
                      <label className={`w-10 h-10 rounded border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
                        darkMode ? "border-gray-600 bg-gray-700 text-gray-400" : "border-gray-300 bg-gray-50 text-gray-500"
                      }`}>
                        <FaCloudUploadAlt size={16} />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                </div>

                <ItemTable
                  data={expense_type}
                  onDelete={handleRemove}
                  onCellChange={handleChange}
                  columns={[
                    { title: t('type'), key: 'expense_type_name', type: 'item' },
                    { title: t('description'), key: 'description', type: 'string' },
                    { title: t('quantity'), key: 'quantity', type: 'number' },
                    { title: t('price'), key: 'unit_price', type: 'number' },
                    { 
                      title: t('total'), 
                      type: 'showonly', 
                      render: (item) => `$${(parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0)).toFixed(2)}` 
                    }
                  ]}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between gap-10 p-4 mx-4 border bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w grow">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    {t('description')} <GiNotebook />
                  </label>
                  <textarea
                    value={expense.expense_other}
                    placeholder="--- Description for expense... ---"
                    onChange={(e) => setexpense(prev => ({ ...prev, expense_other: e.target.value }))}
                    className="textarea-input"
                    rows={3}
                  />
                </div>
                <div className="max-w-96 grow">
                  <div className="flex justify-between w-full max-w-[350px] text-slate-500">
                      <span className="text-[13px] font-semibold uppercase">{t('totalAmount')}</span>
                      <span className="text-[13px] ">${calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between w-full max-w-[350px] text-slate-800 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                      <span className="text-sm font-bold uppercase">{t('netAmount')}</span>
                      <span className="text-xl font-bold text-[#13b5ea]">${calculateTotal().toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-4 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors uppercase"
                  >
                    {t('resetForm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </form>

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
    </div>
  );
};

export default CreateExpanses;
