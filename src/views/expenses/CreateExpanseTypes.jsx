import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateExpanseTypeMutation, useGetAllExpanseTypesQuery } from '../../../app/Features/expenseTypesSlice';
import { toast } from 'react-toastify';
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaTag,
  FaLayerGroup,
  FaInfoCircle,
  FaStickyNote
} from 'react-icons/fa';
import { MdOutlineCategory, MdDescription } from 'react-icons/md';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import { GiNotebook } from "react-icons/gi";

const CreateExpanseTypes = ({ onAdd }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');
  const { setLoading, darkMode } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expense_types, setExpanseTypes] = useState({
    expense_type_name: "",
    description: "",
    created_by: "",
    status: "active"
  });

  const { refetch } = useGetAllExpanseTypesQuery(token);

  async function handleConfirm() {
    try {
      setLoading(true);
      setSubmitting(true);
      setAlertBox(false);

      const response = await api.post("/expense_types", expense_types, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 200) {
        refetch();
        onAdd();
        setLoading(false);
        setSubmitting(false);
        toast.success(t('expenseCategoryCreatedSuccess'));
        setExpanseTypes({ expense_type_name: "", description: "", created_by: "", status: "active" });
      } else {
        toast.error(response.data.message || t('failedToCreateExpenseCategory'));
        setSubmitting(false);
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || t('failedToCreateExpenseCategory'));
      setLoading(false);
      setSubmitting(false);
      setAlertBox(false);
    }
  }

  function handleSubmit() {
    if (!expense_types.expense_type_name.trim()) {
      toast.error(t('pleaseEnterCategoryName'));
      return;
    }
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onInputChange(field, value) {
    setExpanseTypes(prev => ({
      ...prev,
      [field]: value,
      created_by: localStorage.getItem('userId') || "0"
    }));
  }

  return (
    <div className="dark:bg-gray-700 transition-colors">
      <AlertBox
        isOpen={alertBox}
        title={t('confirmCreateExpenseCategory')}
        message={t('confirmCreateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('create')}
        cancelText={t('cancel')}
      />

      <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
            {t('createExpenseType')}
          </h1>
          <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
            {t('addCategoryToOrganize')}
          </p>
        </div>
        <div className="mt-6 flex justify-center items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            variant='primary'
            outline={false}
          >
            <FaSave />{submitting ? t('processing') : t('create')}
          </Button>
          <Button
            type="button"
            variant='cancel'
            onClick={onAdd}
          >
            <FaTimes />{t('cancel')}
          </Button>
        </div>
      </div>

      <form>
        <div className="grid grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-100 dark:bg-transparent dark:border-gray-500 p-4 border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                    <span className="flex items-center text-sm font-semibold gap-2">
                      <FaTag className="text-gray-400" />
                      {t('categoryName')} <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <Input
                    type="text"
                    value={expense_types.expense_type_name}
                    onChange={(value) => onInputChange('expense_type_name', value)}
                    placeholder={t('enterCategoryNamePlaceholder')}
                    className="text-input"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  )
}

export default CreateExpanseTypes;
