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
import { useViewText } from '../viewText';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateExpanseTypes = ({ onAdd }) => {
  const { vt } = useViewText();
  const token = localStorage.getItem('token');
  const { setLoading } = useOutletsContext();
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
      // const response = await createExpanseType({ itemData: expense_types, token });

      const response = await api.post("/expense_types", expense_types, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 200) {
        refetch();
        onAdd();
        setLoading(false);
        toast.success(vt('Expense category created successfully!'));
        // Reset form
        form.resetFields();
        setExpanseTypes({ expense_type_name: "", description: "", created_by: "", status: "active" });
      } else {
        toast.error(response.data.message || vt('Failed to create expense category'));
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || vt('An error occurred while creating the expense category'));
      setLoading(false);
      setAlertBox(false);
    }
  }

  function handleSubmit() {
    if (!expense_types.expense_type_name.trim()) {
      toast.error(vt('Please enter a category name'));
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

  function onDescriptionChange(e) {
    setExpanseTypes(prev => ({ ...prev, description: e.target.value }));
  }

  function onStatusChange(value) {
    setExpanseTypes(prev => ({ ...prev, status: value }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="view-page"
    >
      <AlertBox
        isOpen={alertBox}
        title={vt('Create New Expense Category')}
        message={vt('Are you sure you want to create this expense category?')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={vt('Create')}
        cancelText={vt('Cancel')}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <FaLayerGroup className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vt('Create Expense Type')}</h1>
              <p className="text-gray-600">{vt('Add a new category to organize your expenses')}</p>
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
            className="shadow-lg border-0"
          >
            <div className="space-y-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> {vt('Category Name')}
                </label>
                <Input
                  size="large"
                  placeholder={vt('Enter category name (e.g., Office Supplies, Travel, Marketing)')}
                  value={expense_types.expense_type_name}
                  onChange={onExpanseTypeName}
                  prefix={<FaTag className="text-gray-400" />}
                  className="w-full"
                  required
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <FaInfoCircle />
                  <span>{vt('Choose a descriptive name for easy identification')}</span>
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
              {vt('Create Category')}
            </Button>

            <Button
              type="default"
              icon={<FaTimes />}
              onClick={onAdd}
              size="large"
              className="h-12 flex-1 border-gray-300 hover:border-gray-400"
            >
              {vt('Cancel')}
            </Button>
          </div>

          {/* Validation Alert */}
          {!expense_types.expense_type_name.trim() && (
            <Alert
              message={vt('Required Field')}
              description={vt('Please enter a category name to continue')}
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
