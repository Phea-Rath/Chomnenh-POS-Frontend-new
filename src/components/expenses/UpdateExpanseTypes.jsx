import React, { useEffect, useState } from 'react';
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllExpanseTypesQuery, useUpdateExpanseTypeMutation } from "@/features/expenses/expenseTypesSlice";
import { toast } from 'react-toastify';
import {
  Card,
  Input,
  Button,
  Form,
  Alert,
} from 'antd';
import {
  FaSave,
  FaTimes,
  FaTag,
  FaLayerGroup,
  FaInfoCircle,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { getToken } from '@/utils/tokenStore';

const UpdateExpanseType = ({ onAdd, data }) => {
  const { t } = useTranslation();
  const token = getToken();
  const { setLoading, darkMode } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [expenseTypes, setExpanseTypes] = useState({
    expense_type_name: '',
    description: '',
    created_by: '',
    status: 'active',
  });

  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const nextState = {
      expense_type_name: data?.name || data?.expense_type_name || '',
      description: data?.description || '',
      created_by: data?.created_by || localStorage.getItem('userId') || '0',
      status: data?.status || 'active',
    };

    setExpanseTypes(nextState);
    form.setFieldsValue({
      expense_type_name: nextState.expense_type_name,
    });
  }, [data, form]);

  const [updateExpanseType] = useUpdateExpanseTypeMutation();

  async function handleConfirm() {
    try {
      setLoading(true);
      setIsLoading(true);
      setAlertBox(false);

      await updateExpanseType({ id: data?.id, itemData: expenseTypes, token }).unwrap();
      onAdd();
      toast.success(t('expenseCategoryUpdatedSuccess'));
    } catch (error) {
      toast.error(error?.data?.message || error?.message || t('failedToUpdateExpenseCategory'));
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (!expenseTypes.expense_type_name.trim()) {
      toast.error(t('pleaseEnterCategoryName'));
      return;
    }
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onExpanseTypeName(e) {
    setExpanseTypes((prev) => ({
      ...prev,
      expense_type_name: e.target.value,
      created_by: localStorage.getItem('userId') || prev.created_by || '0',
    }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`view-page ${darkMode ? "dark" : ""}`}
    >
      <AlertBox
        isOpen={alertBox}
        title={t('confirmUpdateExpenseCategory')}
        message={t('confirmUpdateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('update')}
        cancelText={t('cancel')}
      />

      <div className={`max-w-4xl mx-auto p-5 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <FaLayerGroup className="text-2xl text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t('updateExpenseType')}</h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('editCategoryNameToKeepOrganized')}</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
        >
          <Card className={`shadow-lg border-0 ${darkMode ? "bg-gray-700 text-white" : "bg-white"}`} bodyStyle={{ padding: '24px' }}>
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  <span className="text-red-500">*</span> {t('categoryName')}
                </label>
                <Input
                  size="large"
                  placeholder={t('enterCategoryNamePlaceholder')}
                  value={expenseTypes.expense_type_name}
                  onChange={onExpanseTypeName}
                  prefix={<FaTag className="text-gray-400" />}
                  className={`w-full ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : ""}`}
                  required
                />
                <div className={`flex items-center gap-2 mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <FaInfoCircle />
                  <span>{t('chooseDescriptiveName')}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="primary"
              icon={<FaSave />}
              onClick={handleSubmit}
              size="large"
              loading={isLoading}
              className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 shadow-lg"
              disabled={!expenseTypes.expense_type_name.trim()}
            >
              {t('updateCategory')}
            </Button>

            <Button
              type="default"
              icon={<FaTimes />}
              onClick={onAdd}
              size="large"
              className={`h-12 flex-1 ${darkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "border-gray-300 hover:border-gray-400"}`}
            >
              {t('cancel')}
            </Button>
          </div>

          {!expenseTypes.expense_type_name.trim() && (
            <Alert
              message={t('requiredField')}
              description={t('pleaseEnterCategoryNameToContinue')}
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Form>
      </div>
    </motion.div>
  );
};

export default UpdateExpanseType;
