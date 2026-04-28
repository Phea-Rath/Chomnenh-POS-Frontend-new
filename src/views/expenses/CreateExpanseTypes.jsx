import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateExpanseTypeMutation, useGetAllExpanseTypesQuery } from '../../../app/Features/expenseTypesSlice';
import { toast } from 'react-toastify';
import {
  Card,
  Input,
  Button,
  Form,
  Typography,
  Tag,
  Space,
  Alert,
  Divider,
  Tooltip,
  Avatar
} from 'antd';
import {
  FaPlus,
  FaSave,
  FaTimes,
  FaTag,
  FaLayerGroup,
  FaInfoCircle,
  FaShieldAlt
} from 'react-icons/fa';
import { MdOutlineCategory, MdDescription } from 'react-icons/md';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateExpanseTypes = ({ onAdd }) => {
  const { t } = useTranslation();
  const token = localStorage.getItem('token');
  const { setLoading, darkMode } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [expense_types, setExpanseTypes] = useState({
    expense_type_name: "",
    description: "",
    created_by: "",
    status: "active"
  });

  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [createExpanseType, { isLoading }] = useCreateExpanseTypeMutation();
  const [form] = Form.useForm();

  async function handleConfirm() {
    try {
      setLoading(true);
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
        toast.success(t('expenseCategoryCreatedSuccess'));
        // Reset form
        form.resetFields();
        setExpanseTypes({ expense_type_name: "", description: "", created_by: "", status: "active" });
      } else {
        toast.error(response.data.message || t('failedToCreateExpenseCategory'));
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || t('failedToCreateExpenseCategory'));
      setLoading(false);
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

  function onExpanseTypeName(e) {
    setExpanseTypes(prev => ({
      ...prev,
      expense_type_name: e.target.value,
      created_by: localStorage.getItem('userId') || "0"
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
        title={t('confirmCreateExpenseCategory')}
        message={t('confirmCreateExpenseCategory')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={t('create')}
        cancelText={t('cancel')}
      />

      <div className={`max-w-4xl mx-auto p-5 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <FaLayerGroup className="text-2xl text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{t('createExpenseType')}</h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>{t('addCategoryToOrganize')}</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
        >
          <Card
            className={`shadow-lg border-0 ${darkMode ? "bg-gray-700 text-white" : "bg-white"}`}
            bodyStyle={{ padding: '24px' }}
          >
            <div className="space-y-6">
              {/* Category Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  <span className="text-red-500">*</span> {t('categoryName')}
                </label>
                <Input
                  size="large"
                  placeholder={t('enterCategoryNamePlaceholder')}
                  value={expense_types.expense_type_name}
                  onChange={onExpanseTypeName}
                  prefix={<FaTag className="text-gray-400" />}
                  className={`w-full ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : ""}`}
                />
                <div className={`flex items-center gap-2 mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <FaInfoCircle />
                  <span>{t('chooseDescriptiveName')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="primary"
              icon={<FaSave />}
              onClick={handleSubmit}
              size="large"
              loading={isLoading}
              className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 shadow-lg"
              disabled={!expense_types.expense_type_name.trim()}
            >
              {t('createCategory')}
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

          {/* Validation Alert */}
          {!expense_types.expense_type_name.trim() && (
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
  )
}

export default CreateExpanseTypes;
